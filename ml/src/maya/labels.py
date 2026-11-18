"""Taxonomía de clases del proyecto. FUENTE DE VERDAD.

Todo el proyecto lee las etiquetas de aquí: el entrenamiento, la evaluación, el export a
ONNX y, por medio de `labels.json`, también el frontend en TypeScript.

Nadie escribe una lista de etiquetas a mano en otro archivo (invariante I3 de CLAUDE.md).
Un desajuste en el orden hace que el modelo prediga 7 y la interfaz muestre 12: es el bug
más caro y más silencioso que puede tener este proyecto.

Sistema de numeración maya, 1 a 19:
    punto = 1, barra = 5, valor = 5 * barras + puntos
    barras en {0,1,2,3}, puntos en {0,1,2,3,4}, excluyendo (0, 0)
    -> exactamente 19 combinaciones válidas
"""

from __future__ import annotations

import json
from pathlib import Path

# --- Rangos del dominio -------------------------------------------------------

VALOR_MIN = 1
VALOR_MAX = 19
BARRAS_MAX = 3          # 4 barras serían 20: fuera de rango
PUNTOS_MAX = 4          # 5 puntos serían una barra
NUM_BARRAS = BARRAS_MAX + 1     # cabeza auxiliar de barras: 4 salidas
NUM_PUNTOS = PUNTOS_MAX + 1     # cabeza auxiliar de puntos: 5 salidas

ETIQUETA_NO_VALIDO = "no_valido"
INDICE_NO_VALIDO = VALOR_MAX            # 19
NUM_CLASES = VALOR_MAX + 1              # 20 = 19 válidas + no_valido

#: Orden canónico de las clases. El índice i corresponde a ETIQUETAS[i].
ETIQUETAS: list[str] = [f"maya_{v:02d}" for v in range(VALOR_MIN, VALOR_MAX + 1)]
ETIQUETAS.append(ETIQUETA_NO_VALIDO)

#: Subcarpetas de `no_valido`. Todas colapsan al índice 19 al entrenar, pero se
#: guardan separadas para poder medir el rechazo por tipo (ver docs/03-DATASET.md).
SUBCLASES_NO_VALIDO: list[str] = [
    "cero_maya",        # el glifo de concha
    "mayor_19",         # 20, 25, 33... en notación posicional vertical
    "casi_valido",      # 5+ puntos, 4+ barras, puntos abajo, elementos dispersos
    "multiples",        # dos o más números mayas en la misma imagen
    "digitos_arabigos",
    "romanos",
    "otros_sistemas",
    "texto",
    "objetos",
    "personas",
    "paisajes",
    "dibujos",
    "vacio",            # papel en blanco, imagen negra, ruido
]

#: Subcategorías que el docente usará con mayor probabilidad.
SUBCLASES_PRIORITARIAS = ("cero_maya", "mayor_19", "casi_valido", "multiples")


# --- Conversiones -------------------------------------------------------------

def barras_y_puntos(valor: int) -> tuple[int, int]:
    """Descompone un valor 1..19 en (barras, puntos)."""
    if not VALOR_MIN <= valor <= VALOR_MAX:
        raise ValueError(f"valor fuera de rango 1..19: {valor}")
    return divmod(valor, 5)


def valor_de(barras: int, puntos: int) -> int:
    """Compone (barras, puntos) en su valor. Inversa de `barras_y_puntos`."""
    if not 0 <= barras <= BARRAS_MAX:
        raise ValueError(f"barras fuera de rango 0..3: {barras}")
    if not 0 <= puntos <= PUNTOS_MAX:
        raise ValueError(f"puntos fuera de rango 0..4: {puntos}")
    if barras == 0 and puntos == 0:
        raise ValueError("(0 barras, 0 puntos) no es un número maya del 1 al 19")
    return 5 * barras + puntos


def indice_de_valor(valor: int) -> int:
    """Índice de clase de un número maya válido."""
    if not VALOR_MIN <= valor <= VALOR_MAX:
        raise ValueError(f"valor fuera de rango 1..19: {valor}")
    return valor - 1


def valor_de_indice(indice: int) -> int | None:
    """Valor del número, o None si el índice es la clase de rechazo."""
    if indice == INDICE_NO_VALIDO:
        return None
    if not 0 <= indice < VALOR_MAX:
        raise ValueError(f"índice de clase fuera de rango: {indice}")
    return indice + 1


def etiqueta_de_indice(indice: int) -> str:
    return ETIQUETAS[indice]


def indice_de_etiqueta(etiqueta: str) -> int:
    try:
        return ETIQUETAS.index(etiqueta)
    except ValueError as exc:
        raise ValueError(f"etiqueta desconocida: {etiqueta!r}") from exc


def es_valida(indice: int) -> bool:
    return indice != INDICE_NO_VALIDO


def es_consistente(indice: int, barras: int, puntos: int) -> bool:
    """Verificación de consistencia R3 de la política de rechazo.

    Compara la cabeza de clase contra las cabezas auxiliares. Las tres son salidas de la
    red; la aritmética solo verifica que concuerden, nunca clasifica (invariante I2).
    """
    valor = valor_de_indice(indice)
    if valor is None:
        return True  # para `no_valido` no hay barras ni puntos definidos
    return valor == 5 * barras + puntos


# --- Export para el frontend --------------------------------------------------

def como_dict() -> dict:
    """Estructura que se serializa a `labels.json` y consume TypeScript."""
    return {
        "version": 1,
        "num_clases": NUM_CLASES,
        "indice_no_valido": INDICE_NO_VALIDO,
        "num_barras": NUM_BARRAS,
        "num_puntos": NUM_PUNTOS,
        "etiquetas": ETIQUETAS,
        "valores": [valor_de_indice(i) for i in range(NUM_CLASES)],
        "composicion": {
            str(v): {"barras": b, "puntos": p}
            for v in range(VALOR_MIN, VALOR_MAX + 1)
            for b, p in [barras_y_puntos(v)]
        },
        "subclases_no_valido": SUBCLASES_NO_VALIDO,
    }


def escribir_json(destino: str | Path) -> Path:
    destino = Path(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(como_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return destino


if __name__ == "__main__":
    import sys

    salida = sys.argv[1] if len(sys.argv) > 1 else "../web/public/models/labels.json"
    ruta = escribir_json(salida)
    print(f"labels.json escrito en {ruta}")
    for i, etq in enumerate(ETIQUETAS):
        v = valor_de_indice(i)
        extra = "" if v is None else f"  ({barras_y_puntos(v)[0]} barras, {barras_y_puntos(v)[1]} puntos)"
        print(f"  {i:2d}  {etq}{extra}")
