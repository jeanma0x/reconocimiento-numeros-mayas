"""Arquitectura de la red. Ver docs/04-MODELO.md para la justificación.

Contrato
--------
    entrada : float32[N,1,64,64] en [0,1]
    salidas : logits float32[N,20]   19 números + no_valido
              barras float32[N,4]    0..3
              puntos float32[N,5]    0..4

Las tres cabezas no son decoración: `valor = 5*barras + puntos` es la estructura real
del problema, así que la red aprende el mismo hecho por tres caminos. Eso regulariza,
da gratis la verificación de consistencia del rechazo (R3) y hace el modelo
explicable en la demo. El clasificador sigue siendo la cabeza `clase`: la aritmética
solo verifica, nunca clasifica (invariante I2).
"""

from __future__ import annotations

import torch
import torch.nn as nn

from . import labels as L


def _bloque(c_in, c_out, n_convs=2):
    capas = []
    for i in range(n_convs):
        capas += [nn.Conv2d(c_in if i == 0 else c_out, c_out, 3, padding=1, bias=False),
                  nn.BatchNorm2d(c_out), nn.ReLU(inplace=True)]
    capas.append(nn.MaxPool2d(2, 2))
    return nn.Sequential(*capas)


class CNNMaya(nn.Module):
    """CNN propia con tronco compartido y tres cabezas. ~0.5 M parámetros."""

    def __init__(self, num_clases=L.NUM_CLASES, num_barras=L.NUM_BARRAS,
                 num_puntos=L.NUM_PUNTOS, dropout=0.3):
        super().__init__()
        self.tronco = nn.Sequential(
            _bloque(1, 32),            # 64 -> 32
            _bloque(32, 64),           # 32 -> 16
            _bloque(64, 96),           # 16 -> 8
            _bloque(96, 128, 1),       #  8 -> 4
            # Rejilla 3x3, no global: la posición ES la semántica. Los puntos van
            # arriba y las barras abajo; un global average pooling borraría eso.
            nn.AdaptiveAvgPool2d((3, 3)),
            nn.Flatten(),
        )
        self.cuello = nn.Sequential(
            nn.Dropout(dropout), nn.Linear(128 * 9, 192), nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )
        self.cabeza_clase = nn.Linear(192, num_clases)
        self.cabeza_barras = nn.Linear(192, num_barras)
        self.cabeza_puntos = nn.Linear(192, num_puntos)

    def forward(self, x):
        z = self.cuello(self.tronco(x))
        return self.cabeza_clase(z), self.cabeza_barras(z), self.cabeza_puntos(z)


class PerdidaMaya(nn.Module):
    """L = CE(clase) + w_b*CE(barras)*m + w_p*CE(puntos)*m

    m = 0 para las muestras `no_valido`: no tienen barras ni puntos definidos, así
    que sus cabezas auxiliares no deben aportar gradiente.
    """

    def __init__(self, peso_barras=0.3, peso_puntos=0.3, label_smoothing=0.05):
        super().__init__()
        self.ce = nn.CrossEntropyLoss(label_smoothing=label_smoothing)
        self.ce_aux = nn.CrossEntropyLoss(reduction="none")
        self.wb, self.wp = peso_barras, peso_puntos

    def forward(self, salidas, y, yb, yp):
        logits, barras, puntos = salidas
        perdida = self.ce(logits, y)
        m = (yb >= 0).float()
        if m.sum() > 0:
            yb_s, yp_s = yb.clamp(min=0), yp.clamp(min=0)
            perdida = perdida + self.wb * (self.ce_aux(barras, yb_s) * m).sum() / m.sum()
            perdida = perdida + self.wp * (self.ce_aux(puntos, yp_s) * m).sum() / m.sum()
        return perdida


def construir(nombre="cnn_maya", **kw) -> nn.Module:
    if nombre == "cnn_maya":
        return CNNMaya(**kw)
    if nombre == "mobilenet_v3_small":
        return _transferencia(**kw)
    raise ValueError(f"arquitectura desconocida: {nombre}")


def _transferencia(dropout=0.3, **_):
    """MobileNetV3-Small de ImageNet, con la entrada de 1 canal replicada a 3.
    Se usa para comparar contra la CNN propia (docs/04-MODELO.md)."""
    from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small

    base = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.DEFAULT)
    n = base.classifier[0].in_features
    base.classifier = nn.Identity()

    class Transferencia(nn.Module):
        def __init__(self):
            super().__init__()
            self.base = base
            self.cuello = nn.Sequential(nn.Dropout(dropout), nn.Linear(n, 192), nn.ReLU(inplace=True))
            self.cabeza_clase = nn.Linear(192, L.NUM_CLASES)
            self.cabeza_barras = nn.Linear(192, L.NUM_BARRAS)
            self.cabeza_puntos = nn.Linear(192, L.NUM_PUNTOS)

        def forward(self, x):
            z = self.cuello(self.base(x.repeat(1, 3, 1, 1)))
            return self.cabeza_clase(z), self.cabeza_barras(z), self.cabeza_puntos(z)

    return Transferencia()


def contar_parametros(modelo) -> int:
    return sum(p.numel() for p in modelo.parameters() if p.requires_grad)


if __name__ == "__main__":
    m = CNNMaya()
    x = torch.randn(2, 1, 64, 64)
    c, b, p = m(x)
    print("entrada ", tuple(x.shape))
    print("clase   ", tuple(c.shape))
    print("barras  ", tuple(b.shape))
    print("puntos  ", tuple(p.shape))
    n = contar_parametros(m)
    print(f"parámetros: {n:,}  ({n*4/1e6:.2f} MB en fp32)")
