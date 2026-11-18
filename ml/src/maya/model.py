"""Arquitectura de la red. Ver docs/04-MODELO.md para la justificación de cada decisión.

Contrato del modelo
-------------------
    entrada : float32[N, 1, 64, 64] en [0,1]
    salidas : logits float32[N, 20]   19 números + no_valido
              barras float32[N, 4]    0..3
              puntos float32[N, 5]    0..4

Tronco compartido:
    Bloque 1  Conv3x3(1->32)  BN ReLU · Conv3x3(32->32) BN ReLU · MaxPool2   -> 32x32x32
    Bloque 2  Conv3x3(32->64) BN ReLU · Conv3x3(64->64) BN ReLU · MaxPool2   -> 64x16x16
    Bloque 3  Conv3x3(64->96) BN ReLU · Conv3x3(96->96) BN ReLU · MaxPool2   -> 96x8x8
    Bloque 4  Conv3x3(96->128) BN ReLU · MaxPool2                            -> 128x4x4
    AdaptiveAvgPool(3x3) -> Flatten -> 1152
    Dropout(0.3) · Linear(1152->192) · ReLU · Dropout(0.3)
    (todas las convoluciones con padding=1, así el tamaño lo reduce solo el pooling)

Tres cabezas lineales sobre las 192 características.
~0.54 M parámetros, ~2.1 MB en fp32.
"""

from __future__ import annotations

import torch.nn as nn


class CNNMaya(nn.Module):
    """CNN propia con tres cabezas. Modelo principal del proyecto."""

    def __init__(self, num_clases: int = 20, num_barras: int = 4, num_puntos: int = 5):
        super().__init__()
        raise NotImplementedError

    def forward(self, x):
        raise NotImplementedError


def construir_transferencia(nombre: str = "mobilenet_v3_small", **kwargs) -> nn.Module:
    """Modelo alternativo con transfer learning, para comparar (docs/04-MODELO.md).

    Entrada de 1 canal replicada a 3. Tronco congelado las primeras épocas y luego
    afinado con learning rate bajo. Mismas tres cabezas.
    """
    raise NotImplementedError


def contar_parametros(modelo: nn.Module) -> int:
    return sum(p.numel() for p in modelo.parameters() if p.requires_grad)
