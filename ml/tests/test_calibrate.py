"""La política de rechazo debe ser determinista y respetar el orden R1..R4."""

import numpy as np

from maya import calibrate as C
from maya import labels as L


def _logits(indice, fuerza=8.0):
    z = np.full(L.NUM_CLASES, -1.0)
    z[indice] = fuerza
    return z


def _aux(valor):
    b, p = L.barras_y_puntos(valor)
    lb, lp = np.full(L.NUM_BARRAS, -1.0), np.full(L.NUM_PUNTOS, -1.0)
    lb[b] = 5.0; lp[p] = 5.0
    return lb, lp


UMBRALES = {"temperatura": 1.0, "tau": 0.5, "margen": 0.0}


def test_acepta_una_prediccion_clara_y_consistente():
    lb, lp = _aux(13)
    d = C.decidir(_logits(L.indice_de_valor(13)), lb, lp, UMBRALES)
    assert d["valor"] == 13 and not d["rechazada"]
    assert (d["barras"], d["puntos"]) == (2, 3)


def test_R1_clase_no_valida():
    d = C.decidir(_logits(L.INDICE_NO_VALIDO), *_aux(13), UMBRALES)
    assert d["rechazada"] and d["motivo"] == "clase_no_valida"


def test_R2_baja_confianza():
    z = np.zeros(L.NUM_CLASES)           # todas iguales: confianza = 1/20
    d = C.decidir(z, *_aux(13), UMBRALES)
    assert d["rechazada"] and d["motivo"] in ("baja_confianza", "margen")


def test_R3_inconsistencia_entre_cabezas():
    """La clase dice 13 pero las cabezas dicen 2 barras y 1 punto = 11."""
    lb, lp = _aux(11)
    d = C.decidir(_logits(L.indice_de_valor(13)), lb, lp, UMBRALES)
    assert d["rechazada"] and d["motivo"] == "inconsistencia"


def test_R4_margen_insuficiente():
    z = np.full(L.NUM_CLASES, -5.0)
    z[L.indice_de_valor(13)] = 3.0
    z[L.indice_de_valor(14)] = 2.98
    d = C.decidir(z, *_aux(13), {"temperatura": 1.0, "tau": 0.05, "margen": 0.4})
    assert d["rechazada"] and d["motivo"] == "margen"


def test_softmax_suma_uno():
    rng = np.random.default_rng(0)
    p = C.softmax(rng.normal(0, 3, (10, L.NUM_CLASES)), T=2.0)
    assert np.allclose(p.sum(axis=1), 1.0)


def test_la_temperatura_calibra_hacia_abajo_una_red_sobreconfiada():
    rng = np.random.default_rng(1)
    n = 500
    y = rng.integers(0, L.NUM_CLASES, n)
    z = rng.normal(0, 1, (n, L.NUM_CLASES)) * 6
    z[np.arange(n), y] += 2.0                     # acierta a menudo, pero exagerado
    T = C.ajustar_temperatura(z, y)
    assert T > 1.0, "una red sobreconfiada debe calibrarse con T > 1"


def test_decidir_es_determinista():
    lb, lp = _aux(7)
    z = _logits(L.indice_de_valor(7))
    a = C.decidir(z, lb, lp, UMBRALES)
    b = C.decidir(z, lb, lp, UMBRALES)
    assert a["valor"] == b["valor"] and a["confianza"] == b["confianza"]
