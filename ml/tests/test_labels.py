"""La taxonomía es la base de todo. Si estos tests fallan, nada más importa."""

import pytest

from maya import labels as L


def test_hay_veinte_clases():
    assert L.NUM_CLASES == 20
    assert len(L.ETIQUETAS) == 20
    assert L.ETIQUETAS[-1] == L.ETIQUETA_NO_VALIDO
    assert L.ETIQUETAS[L.INDICE_NO_VALIDO] == L.ETIQUETA_NO_VALIDO


def test_las_etiquetas_no_se_repiten():
    assert len(set(L.ETIQUETAS)) == len(L.ETIQUETAS)


@pytest.mark.parametrize(
    "valor,barras,puntos",
    [
        (1, 0, 1), (4, 0, 4), (5, 1, 0), (6, 1, 1), (9, 1, 4),
        (10, 2, 0), (13, 2, 3), (14, 2, 4), (15, 3, 0), (19, 3, 4),
    ],
)
def test_composicion_conocida(valor, barras, puntos):
    assert L.barras_y_puntos(valor) == (barras, puntos)
    assert L.valor_de(barras, puntos) == valor


def test_ida_y_vuelta_para_los_19():
    for valor in range(1, 20):
        b, p = L.barras_y_puntos(valor)
        assert 0 <= b <= 3 and 0 <= p <= 4
        assert L.valor_de(b, p) == valor
        assert L.valor_de_indice(L.indice_de_valor(valor)) == valor


def test_las_combinaciones_validas_son_exactamente_19():
    combinaciones = {
        (b, p) for b in range(4) for p in range(5) if not (b == 0 and p == 0)
    }
    assert len(combinaciones) == 19
    assert {L.barras_y_puntos(v) for v in range(1, 20)} == combinaciones


def test_cero_no_es_un_numero_maya_del_1_al_19():
    with pytest.raises(ValueError):
        L.valor_de(0, 0)
    with pytest.raises(ValueError):
        L.barras_y_puntos(0)


@pytest.mark.parametrize("barras,puntos", [(4, 0), (0, 5), (3, 5), (-1, 2)])
def test_combinaciones_fuera_de_rango(barras, puntos):
    with pytest.raises(ValueError):
        L.valor_de(barras, puntos)


def test_no_valido_no_tiene_valor():
    assert L.valor_de_indice(L.INDICE_NO_VALIDO) is None
    assert not L.es_valida(L.INDICE_NO_VALIDO)
    assert L.es_valida(0)


def test_consistencia():
    i13 = L.indice_de_valor(13)
    assert L.es_consistente(i13, 2, 3)        # 5*2+3 = 13
    assert not L.es_consistente(i13, 2, 1)    # 5*2+1 = 11
    assert L.es_consistente(L.INDICE_NO_VALIDO, 0, 0)


def test_el_json_coincide_con_el_modulo():
    d = L.como_dict()
    assert d["etiquetas"] == L.ETIQUETAS
    assert d["num_clases"] == L.NUM_CLASES
    assert d["indice_no_valido"] == L.INDICE_NO_VALIDO
    assert len(d["composicion"]) == 19
    for valor_str, comp in d["composicion"].items():
        assert L.valor_de(comp["barras"], comp["puntos"]) == int(valor_str)
