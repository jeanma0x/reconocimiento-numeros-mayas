"""El preprocesamiento es el punto de fallo más caro: si Python y TypeScript
divergen, el modelo falla en vivo con métricas perfectas."""

import numpy as np
import pytest

from maya import preprocess as P


def _foto(alto=200, ancho=140, fondo=235, tinta=25):
    img = np.full((alto, ancho, 3), fondo, np.uint8)
    img[alto//3:alto//2, ancho//4:3*ancho//4] = tinta
    return img


def test_forma_y_rango():
    t = P.preparar(_foto())
    assert t.shape == (1, P.LADO, P.LADO) and t.dtype == np.float32
    assert 0.0 <= t.min() and t.max() <= 1.0


def test_la_tinta_queda_clara_sobre_fondo_oscuro():
    """Venga de papel claro o de pizarrón oscuro, la red recibe lo mismo."""
    sobre_papel = P.preparar(_foto(fondo=240, tinta=20))
    sobre_pizarron = P.preparar(_foto(fondo=30, tinta=245))
    assert sobre_papel.mean() < 0.5 and sobre_pizarron.mean() < 0.5
    assert np.abs(sobre_papel - sobre_pizarron).max() < 0.25


def test_filas_de_la_matriz_de_pesos_suman_uno():
    for n_in in (7, 64, 200, 1884):
        W = P.matriz_pesos(n_in, P.LADO)
        assert W.shape == (P.LADO, n_in)
        assert np.allclose(W.sum(axis=1), 1.0)
        assert (W >= 0).all()


def test_escalar_conserva_la_media():
    """El promedio por bloques no debe inventar ni perder intensidad."""
    rng = np.random.default_rng(0)
    img = rng.random((180, 180))
    assert abs(P.escalar_por_bloques(img).mean() - img.mean()) < 1e-9


def test_rellenar_preserva_la_proporcion():
    g = np.zeros((200, 100))
    c = P.rellenar_a_cuadrado(g, 0.0)
    assert c.shape == (200, 200)


@pytest.mark.parametrize("forma", [(1, 1, 3), (3, 400, 3), (400, 3, 3), (64, 64, 4)])
def test_casos_limite_no_revientan(forma):
    img = np.full(forma, 200, np.uint8)
    t = P.preparar(img)
    assert t.shape == (1, P.LADO, P.LADO) and np.isfinite(t).all()


def test_imagen_plana_no_produce_nan():
    """Una hoja en blanco tiene p1 == p99: la división por cero sería un NaN silencioso."""
    t = P.preparar(np.full((100, 100, 3), 180, np.uint8))
    assert np.isfinite(t).all()


def test_una_hoja_en_blanco_con_poco_grano_queda_en_negro():
    """Sin la guarda de rango, estirar el contraste amplifica el grano del papel
    hasta convertirlo en una textura que la red lee como trazos. En el piloto el
    rechazo de imágenes vacías fue del 0% por esta causa. La guarda es parcial:
    solo atrapa las hojas de poco grano (ver el docstring de estirar_contraste)."""
    rng = np.random.default_rng(0)
    papel = np.clip(228 + rng.normal(0, 2, (240, 180, 1)), 0, 255).astype(np.uint8)
    t = P.preparar(np.repeat(papel, 3, axis=2))
    assert t.max() < 0.05, "una hoja casi plana no puede producir trazos"


def test_un_trazo_tenue_si_sobrevive_a_la_guarda():
    """La guarda no debe tragarse un lápiz claro: solo lo verdaderamente plano."""
    img = np.full((240, 180, 3), 232, np.uint8)
    img[100:130, 40:140] = 150          # trazo gris claro, contraste real
    assert P.preparar(img).max() > 0.8
