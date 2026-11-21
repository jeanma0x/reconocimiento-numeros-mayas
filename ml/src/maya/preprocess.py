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

import json
from pathlib import Path

import numpy as np

LADO = 64
MARGEN_MARCO = 0.10      # fracción del borde usada para estimar el fondo
MARGEN_RECORTE = 0.04   # fracción de cada borde que se descarta (ADR-015)
CENTRO = 0.50            # fracción central usada para estimar el contenido
PCT_BAJO, PCT_ALTO = 1.0, 99.0
RANGO_MINIMO = 20.0      # niveles de gris (sobre 255) por debajo de los cuales no se estira
EPS = 1e-6


# --- Paso 1b ------------------------------------------------------------------

def recortar_borde(gris: np.ndarray) -> np.ndarray:
    """Descarta el 4 % de cada borde. Las fotos de una hoja con varios números traen
    trocitos de los vecinos pegados al borde, y la red los lee como «varios números» y
    rechaza: medido con las fotos de Imri, sin este paso 8/19 aciertan y con él 17/19
    (José 38/38 en ambos casos). Imágenes pequeñas se dejan intactas. ADR-015."""
    alto, ancho = gris.shape
    my, mx = int(alto * MARGEN_RECORTE), int(ancho * MARGEN_RECORTE)
    if alto - 2 * my < 16 or ancho - 2 * mx < 16:
        return gris
    return gris[my:alto - my, mx:ancho - mx]


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
    """True si el fondo es más claro que la tinta (tinta oscura sobre papel).

    La tinta es siempre la minoría de los píxeles, así que el fondo es la mediana.
    La tinta es oscura si se aleja más de la mediana hacia abajo (mínimo) que hacia
    arriba (máximo). No depende del brillo absoluto ni de dónde esté el glifo.

    Sustituye a la regla anterior (media del marco > media del centro), que fallaba
    cuando el marco tenía sombra, mesa o un borde oscuro: el papel quedaba "claro
    sobre claro" y la red recibía el negativo. Medido el 2026-11-20: 3 de 40 fotos
    reales y 52 de 891 sintéticas (5,8%) tenían la polaridad mal, incluido el
    propio dataset de entrenamiento. Ver ADR-014.
    """
    mediana = float(np.percentile(gris, 50.0))
    return (mediana - float(gris.min())) > (float(gris.max()) - mediana)


# --- Paso 4 -------------------------------------------------------------------

def estirar_contraste(gris: np.ndarray) -> np.ndarray:
    """Lleva el rango [p1, p99] a [0,1]. Percentiles, no mínimo y máximo: un solo
    píxel quemado no debe decidir la escala de toda la imagen.

    Si el rango es menor a RANGO_MINIMO la imagen se considera plana y se devuelve
    en negro. En una hoja en blanco el único "contenido" es el grano del papel, y
    estirarlo lo convierte en una textura de rango completo que la red lee como
    trazos: en el piloto, el rechazo de imágenes vacías fue del 0% por esta causa.

    OJO con el caso contrario: cuando la tinta cubre menos del 1% de los píxeles
    —dos puntos dibujados en un lienzo grande, o un número pequeño en una hoja
    fotografiada de lejos— los percentiles no la ven y el rango sale cero. Declarar
    eso "plano" borraría el dibujo entero. Por eso, si los percentiles no detectan
    nada, se reintenta con el rango completo antes de dar la imagen por vacía.

    La guarda sigue siendo una mitigación parcial: una hoja en blanco con sombra
    supera el umbral igual. El arreglo de fondo es que la red vea suficientes
    ejemplos `vacio` en el entrenamiento.
    """
    lo = float(np.percentile(gris, PCT_BAJO))
    hi = float(np.percentile(gris, PCT_ALTO))
    if hi - lo < RANGO_MINIMO:
        lo, hi = float(gris.min()), float(gris.max())   # tinta escasa: rango completo
    if hi - lo < RANGO_MINIMO:
        return np.zeros_like(gris)                      # ahora sí, imagen plana
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

    g = recortar_borde(a_gris(imagen_rgb))             # 1b + 2
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
    """Escribe los pares de referencia que `web` usa para verificar su port.

    Por cada caso escribe tres archivos:
      NNN.png   la imagen, para poder mirarla
      NNN.bin   los mismos píxeles en crudo: uint32 ancho, uint32 alto, RGBA
      NNN.f32   el tensor 64x64 esperado, float32

    El .bin existe para que el test de paridad en Node no dependa de un decodificador
    de PNG: lo que hay que comparar es el preprocesamiento, no cómo cada lenguaje
    descomprime una imagen. Decodificar es trabajo del navegador y ahí ya confiamos
    en `createImageBitmap`.

    Se mezclan imágenes sintéticas con casos límite (plana, muy apaisada, muy alta,
    1x1, polaridad invertida, ruido puro) porque son los que rompen un port descuidado.
    """
    import struct

    from PIL import Image

    from . import synth

    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(semilla)

    casos = [("synth", 1 + (i % 19), i) for i in range(max(0, n - 6))]
    casos += [("plana", 0, 0), ("apaisada", 7, 1), ("alta", 13, 2),
              ("minima", 0, 3), ("invertida", 19, 4), ("ruido", 0, 5)]

    for idx, (tipo, valor, k) in enumerate(casos):
        if tipo == "synth":
            img = synth.imagen_de_numero(valor, np.random.default_rng(10_000 + k), lienzo=(192, 192))
        elif tipo == "plana":
            img = np.full((120, 160, 3), 200, dtype=np.uint8)
        elif tipo == "apaisada":
            img = synth.imagen_de_numero(valor, np.random.default_rng(1), lienzo=(90, 300))
        elif tipo == "alta":
            img = synth.imagen_de_numero(valor, np.random.default_rng(2), lienzo=(320, 80))
        elif tipo == "minima":
            img = np.array([[[128, 128, 128]]], dtype=np.uint8)
        elif tipo == "invertida":
            img = 255 - synth.imagen_de_numero(valor, np.random.default_rng(3), lienzo=(192, 192))
        else:
            img = rng.integers(0, 256, (100, 100, 3), dtype=np.uint8)

        alto, ancho = img.shape[:2]
        Image.fromarray(img).save(destino / f"{idx:03d}.png")
        rgba = np.concatenate([img, np.full((alto, ancho, 1), 255, np.uint8)], axis=2)
        with open(destino / f"{idx:03d}.bin", "wb") as f:
            f.write(struct.pack("<II", ancho, alto))
            f.write(rgba.tobytes())
        preparar(img).astype(np.float32).tofile(destino / f"{idx:03d}.f32")

    (destino / "indice.json").write_text(
        json.dumps({"n": len(casos), "lado": LADO,
                    "casos": [{"i": i, "tipo": c[0]} for i, c in enumerate(casos)]},
                   indent=2), encoding="utf-8")
    return len(casos)


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
