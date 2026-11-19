"""Preprocesamiento v1. REFERENCIA del port a TypeScript (web/lib/preprocess.ts).

Contrato
--------
    preparar(imagen_rgb: uint8[H,W,3]) -> float32[1,64,64] en [0,1]

Todo aquí está escrito para poder replicarse en TypeScript sin ambigüedad: solo
aritmética elemental sobre arreglos, sin funciones de OpenCV ni del canvas, cuyos
resultados difieren entre implementaciones. Si cambia algo de este archivo hay que
cambiar `web/lib/preprocess.ts` y volver a correr `tests/test_paridad_preproceso.py`
(invariante I4 de CLAUDE.md).

Pasos:
  1. Orientación EXIF        -> la aplica quien decodifica (`cargar_imagen`)
  2. Escala de grises        -> 0.299 R + 0.587 G + 0.114 B, en float, sin redondear
  3. Polaridad               -> si el marco es más claro que el centro, invertir
  4. Contraste               -> estirar entre los percentiles 1 y 99
  5. Cuadrado                -> rellenar con el valor del fondo, centrado
  6. Escalar a 64x64         -> promedio por bloques con pesos fraccionarios exactos
  7. Normalizar              -> ya queda en [0,1]

Nota sobre el paso 6: no se usa cv2.INTER_AREA ni canvas.drawImage porque ninguno
garantiza el mismo resultado en ambos lenguajes. En su lugar se construyen dos
matrices de pesos (filas y columnas) y el reescalado es `Wy @ img @ Wx.T`. Cada
fila de esas matrices suma 1 y sus pesos son la fracción exacta de solapamiento
entre el píxel de entrada y el de salida: eso es idéntico en cualquier lenguaje.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

LADO = 64
MARGEN_MARCO = 0.10      # fracción del borde usada para estimar el fondo
CENTRO = 0.50            # fracción central usada para estimar el contenido
PCT_BAJO, PCT_ALTO = 1.0, 99.0
RANGO_MINIMO = 20.0      # niveles de gris (sobre 255) por debajo de los cuales no se estira
EPS = 1e-6


# --- Paso 2 -------------------------------------------------------------------

def a_gris(imagen_rgb: np.ndarray) -> np.ndarray:
    """uint8[H,W,3] -> float64[H,W] en [0,255]. Luma BT.601, sin redondeos."""
    x = imagen_rgb.astype(np.float64)
    return 0.299 * x[:, :, 0] + 0.587 * x[:, :, 1] + 0.114 * x[:, :, 2]


# --- Paso 3 -------------------------------------------------------------------

def _mascara_marco(alto: int, ancho: int) -> np.ndarray:
    m = np.zeros((alto, ancho), dtype=bool)
    my, mx = max(1, int(alto * MARGEN_MARCO)), max(1, int(ancho * MARGEN_MARCO))
    m[:my, :] = m[-my:, :] = True
    m[:, :mx] = m[:, -mx:] = True
    return m


def _mascara_centro(alto: int, ancho: int) -> np.ndarray:
    m = np.zeros((alto, ancho), dtype=bool)
    y0, y1 = int(alto * (1 - CENTRO) / 2), int(alto * (1 + CENTRO) / 2)
    x0, x1 = int(ancho * (1 - CENTRO) / 2), int(ancho * (1 + CENTRO) / 2)
    m[y0:y1, x0:x1] = True
    return m


def necesita_inversion(gris: np.ndarray) -> bool:
    """True si el fondo es más claro que el contenido (tinta oscura sobre papel).

    Compara la media del marco con la del centro. Así una foto de tinta negra sobre
    papel blanco y un trazo blanco sobre pizarrón verde llegan iguales a la red.
    """
    alto, ancho = gris.shape
    marco, centro = _mascara_marco(alto, ancho), _mascara_centro(alto, ancho)
    if not marco.any() or not centro.any():      # imágenes diminutas: nada que comparar
        return False
    return float(gris[marco].mean()) > float(gris[centro].mean())


# --- Paso 4 -------------------------------------------------------------------

def estirar_contraste(gris: np.ndarray) -> np.ndarray:
    """Lleva el rango [p1, p99] a [0,1]. Percentiles, no mínimo y máximo: un solo
    píxel quemado no debe decidir la escala de toda la imagen.

    Si el rango es menor a RANGO_MINIMO la imagen se considera plana y se devuelve
    en negro. En una hoja en blanco el único "contenido" es el grano del papel, y
    estirarlo lo convierte en una textura de rango completo que la red lee como
    trazos: en el piloto, el rechazo de imágenes vacías fue del 0% por esta causa.

    La guarda es una mitigación parcial, no la solución: solo atrapa hojas con poco
    grano. Una hoja en blanco con sombra o con grano fuerte supera el umbral igual.
    El arreglo de fondo es que la red vea suficientes ejemplos `vacio` en el
    entrenamiento (su peso en la mezcla de negativos subió de 4% a 10%).
    """
    lo = float(np.percentile(gris, PCT_BAJO))
    hi = float(np.percentile(gris, PCT_ALTO))
    if hi - lo < RANGO_MINIMO:
        return np.zeros_like(gris)
    return np.clip((gris - lo) / (hi - lo), 0.0, 1.0)


# --- Paso 5 -------------------------------------------------------------------

def rellenar_a_cuadrado(gris: np.ndarray, valor_fondo: float) -> np.ndarray:
    """Centra la imagen en un lienzo cuadrado. Preserva la proporción: un 19 es más
    alto que ancho y esa proporción es información que la red usa."""
    alto, ancho = gris.shape
    lado = max(alto, ancho)
    lienzo = np.full((lado, lado), valor_fondo, dtype=np.float64)
    y0, x0 = (lado - alto) // 2, (lado - ancho) // 2
    lienzo[y0:y0 + alto, x0:x0 + ancho] = gris
    return lienzo


# --- Paso 6 -------------------------------------------------------------------

def matriz_pesos(n_entrada: int, n_salida: int) -> np.ndarray:
    """Matriz [n_salida, n_entrada] de promedio por bloques con pesos fraccionarios.

    La fila j reparte el píxel de salida j sobre los de entrada que cubre su intervalo
    [j*n_in/n_out, (j+1)*n_in/n_out), con el peso igual a la fracción solapada. Cada
    fila suma 1. Este es el algoritmo que debe replicar `preprocess.ts`.
    """
    W = np.zeros((n_salida, n_entrada), dtype=np.float64)
    escala = n_entrada / n_salida
    for j in range(n_salida):
        ini, fin = j * escala, (j + 1) * escala
        i0, i1 = int(np.floor(ini)), min(int(np.ceil(fin)), n_entrada)
        for i in range(i0, i1):
            W[j, i] = max(0.0, min(fin, i + 1.0) - max(ini, float(i)))
        s = W[j].sum()
        if s > EPS:
            W[j] /= s
    return W


def escalar_por_bloques(gris: np.ndarray, lado: int = LADO) -> np.ndarray:
    alto, ancho = gris.shape
    return matriz_pesos(alto, lado) @ gris @ matriz_pesos(ancho, lado).T


# --- Pipeline -----------------------------------------------------------------

def preparar(imagen_rgb: np.ndarray) -> np.ndarray:
    """uint8[H,W,3] -> float32[1,64,64] en [0,1], tinta clara sobre fondo oscuro."""
    if imagen_rgb.ndim == 2:
        imagen_rgb = np.stack([imagen_rgb] * 3, axis=-1)
    if imagen_rgb.shape[2] == 4:                      # PNG con transparencia
        alfa = imagen_rgb[:, :, 3:4].astype(np.float64) / 255.0
        imagen_rgb = (imagen_rgb[:, :, :3] * alfa + 255 * (1 - alfa)).astype(np.uint8)

    g = a_gris(imagen_rgb)                             # 2
    if necesita_inversion(g):                          # 3
        g = 255.0 - g
    g = estirar_contraste(g)                           # 4
    fondo = float(np.median(g[_mascara_marco(*g.shape)]))
    g = rellenar_a_cuadrado(g, fondo)                  # 5
    g = escalar_por_bloques(g, LADO)                   # 6
    g = np.clip(g, 0.0, 1.0)                           # 7
    return g.astype(np.float32)[None, :, :]


def cargar_imagen(ruta: str | Path) -> np.ndarray:
    """Decodifica aplicando la orientación EXIF. Las fotos de celular vienen rotadas;
    omitir esto hace que la red reciba números acostados."""
    from PIL import Image, ImageOps
    with Image.open(ruta) as im:
        im = ImageOps.exif_transpose(im)
        return np.array(im.convert("RGB"), dtype=np.uint8)


def preparar_archivo(ruta: str | Path) -> np.ndarray:
    return preparar(cargar_imagen(ruta))


# --- Fixtures para el test de paridad ----------------------------------------

def generar_fixtures(destino: str | Path, n: int = 200, semilla: int = 42) -> int:
    """Escribe pares (imagen PNG, tensor .npy) que `web` usa para verificar su port.

    Mezcla imágenes sintéticas con variación fuerte y casos límite (imagen plana,
    muy apaisada, muy alta, 1x1, polaridad invertida) porque son los que rompen un
    port descuidado.
    """
    from PIL import Image
    from . import synth

    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(semilla)
    escritas = 0

    casos = []
    for i in range(n - 6):
        valor = 1 + (i % 19)
        casos.append(("synth", valor, i))
    casos += [("plana", 0, 0), ("apaisada", 7, 1), ("alta", 13, 2),
              ("minima", 0, 3), ("invertida", 19, 4), ("ruido", 0, 5)]

    for idx, (tipo, valor, k) in enumerate(casos):
        if tipo == "synth":
            img = synth.imagen_de_numero(valor, np.random.default_rng(10_000 + k))
        elif tipo == "plana":
            img = np.full((120, 160, 3), 200, dtype=np.uint8)
        elif tipo == "apaisada":
            img = synth.imagen_de_numero(valor, np.random.default_rng(1), lienzo=(90, 300))
        elif tipo == "alta":
            img = synth.imagen_de_numero(valor, np.random.default_rng(2), lienzo=(320, 80))
        elif tipo == "minima":
            img = np.array([[[128, 128, 128]]], dtype=np.uint8)
        elif tipo == "invertida":
            img = 255 - synth.imagen_de_numero(valor, np.random.default_rng(3))
        else:
            img = rng.integers(0, 256, (100, 100, 3), dtype=np.uint8)

        Image.fromarray(img).save(destino / f"{idx:03d}.png")
        np.save(destino / f"{idx:03d}.npy", preparar(img))
        escritas += 1
    return escritas


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Preprocesamiento y fixtures de paridad")
    ap.add_argument("--fixtures", metavar="DIR", help="generar fixtures en DIR")
    ap.add_argument("-n", type=int, default=200)
    args = ap.parse_args()
    if args.fixtures:
        print(f"{generar_fixtures(args.fixtures, args.n)} fixtures en {args.fixtures}")
    else:
        ap.print_help()
