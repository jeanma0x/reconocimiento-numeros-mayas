"""El generador tiene que producir las 19 formas correctas y los negativos."""

import numpy as np
import pytest

from maya import labels as L
from maya import synth


@pytest.mark.parametrize("valor", list(range(1, 20)))
def test_cada_numero_produce_una_imagen_con_tinta(valor):
    img = synth.imagen_de_numero(valor, np.random.default_rng(valor), lienzo=(128, 128))
    assert img.shape == (128, 128, 3) and img.dtype == np.uint8
    assert img.std() > 5, "la imagen no puede ser un fondo plano"


@pytest.mark.parametrize("valor", list(range(1, 20)))
def test_el_glifo_tiene_tinta_y_referencia(valor):
    b, p = L.barras_y_puntos(valor)
    mask, ref = synth.glifo(b, p, np.random.default_rng(valor))
    assert mask.max() == 255 and ref > 0


@pytest.mark.parametrize("puntos", [0, 2, 4])
def test_mas_barras_da_un_glifo_mas_alto(puntos):
    """Con la MISMA semilla, el grosor y la separación son iguales y lo único que
    cambia es cuántas barras se dibujan. Comparar con semillas distintas no probaría
    nada: el radio del punto y el grosor de barra se sortean por separado."""
    una, _ = synth.glifo(1, puntos, np.random.default_rng(7))
    tres, _ = synth.glifo(3, puntos, np.random.default_rng(7))
    assert tres.shape[0] > una.shape[0]


@pytest.mark.parametrize("subclase", synth.SUBCLASES_SINTETICAS)
def test_cada_subclase_negativa_se_genera(subclase):
    img = synth.imagen_negativa(subclase, np.random.default_rng(5), lienzo=(128, 128))
    assert img.shape == (128, 128, 3)


def test_la_misma_semilla_da_la_misma_imagen():
    """Sin esto, la agrupación por semilla de los splits no significaría nada."""
    a = synth.imagen_de_numero(13, np.random.default_rng(99), lienzo=(96, 96))
    b = synth.imagen_de_numero(13, np.random.default_rng(99), lienzo=(96, 96))
    assert np.array_equal(a, b)


def test_los_pesos_de_las_subclases_suman_uno():
    assert abs(sum(synth.PESOS_SUBCLASES) - 1.0) < 1e-9
    assert len(synth.PESOS_SUBCLASES) == len(synth.SUBCLASES_SINTETICAS)
