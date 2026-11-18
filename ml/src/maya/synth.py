"""Generador de dataset sintético. Es el grueso del volumen de datos.

Contrato
--------
    python -m maya.synth --config configs/default.yaml

Dibuja números mayas por programa, variando lo que lista docs/03-DATASET.md: grosor y largo
de barra, radio de punto, separación, ondulación del trazo, extremos, rotación, perspectiva,
color de tinta, fondo, iluminación, degradación y encuadre.

El MISMO generador produce los negativos `casi_valido`, `mayor_19` y `cero_maya` reutilizando
las mismas primitivas. Eso es deliberado: garantiza que la red distinga positivo de negativo
por la ESTRUCTURA y no por el estilo de dibujo.

Cada imagen se escribe con su semilla en el nombre. Todas las variantes de una misma semilla
forman un grupo y van completas al mismo split (regla anti-fuga, docs/03-DATASET.md).

Meta: >= 800 por clase válida, >= 10 000 negativos.
"""

from __future__ import annotations


def dibujar_numero(valor: int, rng, lienzo_px: int = 256):
    """Dibuja un número maya 1..19. Devuelve la imagen RGB uint8."""
    raise NotImplementedError


def dibujar_negativo(subclase: str, rng, lienzo_px: int = 256):
    """Dibuja un negativo de la subclase indicada (ver labels.SUBCLASES_NO_VALIDO)."""
    raise NotImplementedError


def generar(config: dict) -> None:
    """Genera el dataset completo en data/raw/synthetic/ y actualiza el manifiesto."""
    raise NotImplementedError
