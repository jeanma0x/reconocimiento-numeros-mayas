"""Datasets, splits y manifiesto.

Contrato
--------
    python -m maya.dataset --verificar      # check obligatorio antes de entrenar

Reglas anti-fuga que este módulo debe garantizar (docs/03-DATASET.md):
  1. Agrupación por semilla: todas las variantes de una semilla van al mismo split
  2. Agrupación por toma: varias fotos de la misma hoja van al mismo split
  3. Leave-one-person-out: prueba = fotos de un integrante excluido del entrenamiento
  4. Deduplicado por sha256: falla si un hash aparece en dos splits
  5. El aumento de datos solo se aplica en entrenamiento, al vuelo

`data/manifest.csv` es la fuente de verdad y SÍ se versiona:
    ruta,sha256,clase,subclase,split,fuente,autor,seed,ancho,alto,creado_en
"""

from __future__ import annotations


class DatasetMaya:
    """Dataset de PyTorch que lee del manifiesto y aplica `preprocess.preparar`."""

    def __init__(self, manifiesto: str, split: str, aumentar: bool = False):
        raise NotImplementedError


def construir_splits(manifiesto: str, autor_prueba: str, semilla: int = 42) -> None:
    """Asigna la columna `split` respetando las cinco reglas de arriba."""
    raise NotImplementedError


def verificar(manifiesto: str) -> list[str]:
    """Devuelve la lista de problemas encontrados. Lista vacía = todo bien.

    Comprueba: que cada archivo exista, que su hash coincida, que ningún grupo esté partido
    entre splits, que no haya hashes repetidos y que todas las clases tengan ejemplos.
    """
    raise NotImplementedError
