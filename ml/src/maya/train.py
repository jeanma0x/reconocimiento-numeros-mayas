"""Ciclo de entrenamiento. Ver docs/04-MODELO.md.

Contrato
--------
    python -m maya.train --config configs/default.yaml [--etapa A|B]

Pérdida:  L = CE(clase) + 0.3*CE(barras)*m + 0.3*CE(puntos)*m
          m = 0 para muestras `no_valido` (no tienen barras ni puntos definidos)
          label smoothing 0.05 en la cabeza de clase

Dos etapas:
  A  sintético completo
  B  afinado con lr=3e-5 sobre fotos reales (repetidas x10) mezcladas con parte del
     sintético, para evitar el olvido catastrófico

Early stopping sobre la PÉRDIDA DE VALIDACIÓN, paciencia 8. Se guarda el mejor checkpoint,
nunca el último. El conjunto de prueba no se toca en ninguna etapa.

Cada corrida escribe en ml/runs/<id>/: config.yaml, mejor.pt, historial.json, metricas.json.
Ningún número de la presentación puede salir de otro lugar.
"""

from __future__ import annotations


def entrenar(config: dict, etapa: str = "A") -> str:
    """Entrena y devuelve el id de la corrida."""
    raise NotImplementedError
