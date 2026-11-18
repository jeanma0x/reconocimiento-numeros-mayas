"""Preprocesamiento. REFERENCIA del port a TypeScript (web/lib/preprocess.ts).

Contrato
--------
    preparar(imagen_rgb: np.ndarray[H,W,3] uint8) -> np.ndarray[1,64,64] float32 en [0,1]

Cualquier cambio aquí obliga a cambiar `web/lib/preprocess.ts` y a volver a correr
`ml/tests/test_paridad_preproceso.py`. Ver invariante I4 en CLAUDE.md.

Pasos de la versión 1 (docs/04-MODELO.md):
  1. Corregir orientación EXIF (lo hace quien decodifica; aquí llega ya corregida)
  2. Gris con 0.299*R + 0.587*G + 0.114*B, sin redondeos intermedios
  3. Detectar polaridad: si el marco es más claro que el centro, invertir
  4. Estirar contraste con los percentiles 1 y 99
  5. Rellenar a cuadrado con el valor de fondo, centrado
  6. Escalar a 64x64 promediando bloques (box filter implementado a mano, NO cv2.INTER_AREA)
  7. Normalizar a [0,1]

La versión 2 (umbral adaptativo + componentes conexas) se inserta entre 4 y 5 y solo se
activa si las métricas la justifican.

OJO: no copiar el pipeline del notebook del curso tal cual. Ese conserva únicamente el
contorno más grande, porque un dígito arábigo es una sola mancha conexa. Un número maya son
entre 1 y 7 manchas separadas: quedarse con la mayor lo convertiría en una sola barra.
"""

from __future__ import annotations

import numpy as np

LADO = 64
MARGEN_MARCO = 0.10     # fracción del borde que se usa para estimar el fondo
PERCENTIL_BAJO = 1.0
PERCENTIL_ALTO = 99.0


def a_gris(imagen_rgb: np.ndarray) -> np.ndarray:
    """Paso 2. float32, sin redondeos intermedios. Misma línea exacta en TypeScript."""
    raise NotImplementedError


def necesita_inversion(gris: np.ndarray) -> bool:
    """Paso 3. True si el fondo es más claro que el contenido (tinta sobre papel)."""
    raise NotImplementedError


def estirar_contraste(gris: np.ndarray) -> np.ndarray:
    """Paso 4. Percentiles 1 y 99, no mínimo y máximo."""
    raise NotImplementedError


def rellenar_a_cuadrado(gris: np.ndarray, valor_fondo: float) -> np.ndarray:
    """Paso 5. Preserva la proporción: un 19 es más alto que ancho y eso es información."""
    raise NotImplementedError


def escalar_por_bloques(gris: np.ndarray, lado: int = LADO) -> np.ndarray:
    """Paso 6. Promedio por bloques, implementado a mano para que TS dé lo mismo."""
    raise NotImplementedError


def preparar(imagen_rgb: np.ndarray) -> np.ndarray:
    """Pipeline completo. Devuelve float32[1, 64, 64] en [0,1]."""
    raise NotImplementedError


def generar_fixtures(destino: str, n: int = 200, seed: int = 42) -> None:
    """Genera las imágenes y tensores de referencia del test de paridad.

    Escribe en `destino`: `NNN.png` (entrada) y `NNN.npy` (tensor esperado), más un
    `indice.json`. `web/npm run test:parity` lee exactamente estos archivos.
    """
    raise NotImplementedError
