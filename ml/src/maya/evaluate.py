"""Evaluación, métricas y análisis de errores. Ver docs/07-QA-Y-EVALUACION.md.

Contrato
--------
    python -m maya.evaluate --run runs/<id>

Produce en runs/<id>/:
  metricas.json      todas las métricas de la tabla de docs/07
  confusion.png      matriz de confusión 20x20
  curvas.png         pérdida y exactitud, entrenamiento y validación
  por_clase.png      exactitud de las 19 clases
  kernels.png        filtros de la primera capa
  feature_maps.png   mapas de características sobre un ejemplo real
  errores/           TODAS las imágenes mal clasificadas, con real, predicha y top-3

Desgloses obligatorios: por número de barras, por número de puntos, por subcategoría de
rechazo, por fuente (sintético vs real) y por autor de las fotos.

La métrica que manda es la exactitud sobre fotos reales de la mano excluida del
entrenamiento: es lo más parecido a lo que pasa el sábado.
"""

from __future__ import annotations


def evaluar(run: str, split: str = "test") -> dict:
    raise NotImplementedError


def guardar_errores(run: str) -> int:
    """Escribe runs/<id>/errores/ y devuelve cuántos hubo. Insumo del criterio 2 (5%)."""
    raise NotImplementedError
