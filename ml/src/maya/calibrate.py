"""Calibración y umbrales de rechazo. Ver docs/04-MODELO.md y ADR-006.

Contrato
--------
    python -m maya.calibrate --run runs/<id>   ->  runs/<id>/thresholds.json

1. Temperature scaling: ajustar un único escalar T minimizando la NLL SOBRE VALIDACIÓN
   (nunca sobre prueba). La confianza pasa a ser softmax(logits / T).

2. Búsqueda en rejilla de los umbrales tau (confianza) y m (margen) maximizando

       U = 0.8 * P(acertar | válida)  +  0.2 * P(rechazar | no válida)

   que son los pesos de la rúbrica: 40% por reconocer, 10% por rechazar. El resultado es un
   umbral bajo a propósito: ante la duda, el sistema arriesga un número en lugar de negarse.

3. Guardar también los datos de la curva U contra tau: va en la presentación como evidencia
   de que el umbral no se eligió a ojo.
"""

from __future__ import annotations

PESO_ACIERTO_VALIDA = 0.8
PESO_RECHAZO_NO_VALIDA = 0.2


def ajustar_temperatura(logits_val, etiquetas_val) -> float:
    raise NotImplementedError


def buscar_umbrales(logits_val, etiquetas_val, temperatura: float) -> dict:
    """Devuelve {'temperatura': T, 'tau': ..., 'margen': ..., 'curva_u': [...]}"""
    raise NotImplementedError


def decidir(logits, barras, puntos, umbrales: dict) -> dict:
    """Política de rechazo completa, R1 a R4 en orden. Misma lógica que inferencia.ts.

    R1  argmax(clase) == no_valido
    R2  confianza calibrada < tau
    R3  inconsistencia: valor(clase) != 5*barras + puntos
    R4  margen p1 - p2 < m

    Devuelve {'valor': int|None, 'rechazada': bool, 'motivo': str|None,
              'confianza': float, 'barras': int, 'puntos': int}
    """
    raise NotImplementedError
