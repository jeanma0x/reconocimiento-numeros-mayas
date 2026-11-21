"""Generador de dataset sintético. Es el grueso del volumen de datos.

    python -m maya.synth --config configs/default.yaml

Dibuja números mayas por programa variando grosor y largo de barra, radio de punto,
separación, ondulación del trazo, rotación, perspectiva, color de tinta, fondo,
iluminación, degradación y encuadre (docs/03-DATASET.md).

El MISMO generador produce los negativos `casi_valido`, `mayor_19` y `cero_maya`
reutilizando las mismas primitivas de trazo. Eso es deliberado: garantiza que la red
distinga positivo de negativo por la ESTRUCTURA y no por el estilo de dibujo. Si los
negativos se dibujaran de otra forma, la red aprendería a detectar el estilo.

Cada imagen lleva su semilla en el nombre: todas las variantes de una misma semilla
forman un grupo y van completas al mismo split (regla anti-fuga).
"""

from __future__ import annotations

import csv
import hashlib
from pathlib import Path

import cv2
import numpy as np

from . import labels as L

LIENZO = 256
TINTAS = {
    "negro":   (28, 26, 24),   "azul":  (28, 42, 120), "rojo": (140, 32, 30),
    "verde":   (24, 86, 52),   "grafito": (70, 70, 74),
}


# ----------------------------------------------------------------------------
# Primitivas de trazo: barras y puntos dibujados "a mano"
# ----------------------------------------------------------------------------

def _polilinea_ondulada(x0, x1, y, rng, amplitud):
    """Puntos de una línea casi recta, con ondulación suave: simula el pulso."""
    n = rng.integers(4, 8)
    xs = np.linspace(x0, x1, n)
    ys = y + rng.normal(0, amplitud, n)
    ys[0] = y + rng.normal(0, amplitud * 0.4)
    ys[-1] = y + rng.normal(0, amplitud * 0.4)
    return np.stack([xs, ys], axis=1).astype(np.int32)


def barra(mask, x0, x1, y, grosor, rng):
    pts = _polilinea_ondulada(x0, x1, y, rng, max(1.0, grosor * 0.14))
    cv2.polylines(mask, [pts], False, 255, int(max(1, grosor)), cv2.LINE_AA)
    # A veces el marcador deja el trazo más grueso en un extremo
    if rng.random() < 0.35:
        k = int(max(1, grosor * 0.3))
        cv2.circle(mask, tuple(pts[rng.integers(0, len(pts))]), k, 255, -1, cv2.LINE_AA)


def punto(mask, cx, cy, r, rng, hueco=False):
    ejes = (int(max(1, r * rng.uniform(0.85, 1.15))), int(max(1, r * rng.uniform(0.85, 1.15))))
    # Un punto «dibujado» con lapicero o mouse suele ser un círculo hueco: sin esto, el
    # modelo solo conocía puntos rellenos y rechazaba el 7/8 de los lienzos con anillos.
    grosor = -1 if not hueco else int(max(2, r * rng.uniform(0.3, 0.6)))
    cv2.ellipse(mask, (int(cx), int(cy)), ejes, float(rng.uniform(0, 180)), 0, 360, 255, grosor, cv2.LINE_AA)


def _recortar(mask):
    ys, xs = np.nonzero(mask)
    if len(ys) == 0:
        return mask
    return mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


# ----------------------------------------------------------------------------
# Glifos
# ----------------------------------------------------------------------------

def glifo(barras: int, puntos: int, rng) -> np.ndarray:
    """Máscara recortada de un número maya: puntos arriba, barras abajo."""
    T = rng.integers(10, 26)                       # grosor de barra
    Lb = rng.integers(150, 230)                    # largo de barra
    # Trazo fino: una barra con lapicero o pluma fina mide 3–8 px frente a barras de 150+,
    # mientras los puntos siguen siendo gordos (medido en el dataset de Imri, 2026-11-20:
    # barras de ~1 px a 64x64 que la red nunca había visto). Tb es el grosor solo de las
    # barras; T sigue gobernando puntos y separaciones, que son independientes del
    # instrumento con que se trazó la barra. ADR-014.
    Tb = int(rng.integers(2, 9)) if rng.random() < 0.35 else int(T)
    # El rango de radio de punto es ancho a propósito. Una persona que dibuja con el
    # dedo o el mouse da un toque cuyo diámetro es el grosor del trazo, o sea R ≈ T/2;
    # el extremo alto cubre a quien pinta puntos gordos. Si el rango fuera estrecho, la
    # red usaría el tamaño absoluto del punto como pista y fallaría con medio mundo.
    R = int(T * rng.uniform(0.40, 1.25))           # radio de punto
    R = max(5, R)
    hueco = rng.random() < 0.20                    # puntos como anillos
    G = int(T * rng.uniform(0.7, 1.8))             # separación entre barras
    D = int(T * rng.uniform(0.9, 2.2))             # separación puntos-barras

    # La separación entre puntos se deriva de su propio radio, no del largo de la barra:
    # si se derivara del largo, dos puntos quedarían lejísimos y cuatro se encimarían.
    if puntos > 1:
        sep = R * rng.uniform(2.3, 3.3)
        sep = min(sep, Lb * 0.92 / (puntos - 1))
        sep = max(sep, R * 2.15)                   # nunca encimados
        ancho_puntos = int(sep * (puntos - 1))
    else:
        ancho_puntos = 0
    alto = (2 * R if puntos else 0) + (D if puntos and barras else 0) + \
           (barras * Tb + (barras - 1) * G if barras else 0)
    ancho = max(Lb, ancho_puntos + 2 * R)
    pad = int(T * 1.5)
    m = np.zeros((alto + 2 * pad, ancho + 2 * pad), np.uint8)
    cx = m.shape[1] // 2
    y = pad

    if puntos:
        if puntos == 1:
            xs = [cx]
        else:
            xs = np.linspace(cx - ancho_puntos / 2, cx + ancho_puntos / 2, puntos)
        for x in xs:
            punto(m, x + rng.normal(0, R * 0.12), y + R + rng.normal(0, R * 0.12), R, rng, hueco)
        y += 2 * R + (D if barras else 0)

    for i in range(barras):
        largo_i = int(Lb * rng.uniform(0.88, 1.0))
        x0 = cx - largo_i // 2 + int(rng.normal(0, T * 0.2))
        barra(m, x0, x0 + largo_i, y + Tb // 2 + i * (Tb + G), Tb, rng)

    # Se devuelve Lb como unidad de referencia: el tamaño con que se pega el glifo
    # en el lienzo se deriva de ella, no de su caja envolvente. Así un "1" es un
    # punto pequeño en la hoja y un "19" una pila alta, como los escribe una persona.
    return _recortar(m), float(Lb)


def glifo_mano(barras: int, puntos: int, rng):
    """Número dibujado a mano alzada con mouse, dedo o lapicero fino: trazos finos que
    tiemblan, cada barra con su propia pendiente y largo, puntos como manchas irregulares
    y poca regularidad entre ellos. Es lo que produce el lienzo de la aplicación, y lo que
    escribe el docente en una hoja con la mano (ADR-016). Devuelve (máscara, largo ref)."""
    Lb = int(rng.integers(150, 260))
    T = int(rng.integers(3, 20))
    base = max(T, 6)
    R = int(max(4, T * rng.uniform(0.7, 2.2)))
    G = int(base * rng.uniform(1.5, 4.5))
    D = int(base * rng.uniform(1.2, 3.0))
    pad = int(base * 3 + Lb * 0.12)
    alto = (2 * R if puntos else 0) + (D if puntos and barras else 0) + \
           (barras * T + (barras - 1) * G if barras else 0)
    m = np.zeros((alto + 2 * pad, Lb + 2 * pad), np.uint8)
    cx = m.shape[1] // 2
    y = pad
    if puntos:
        sep = R * rng.uniform(2.4, 3.8)
        sep = max(R * 2.2, min(sep, Lb * 0.95 / max(1, puntos - 1)))
        xs = [cx] if puntos == 1 else np.linspace(cx - sep * (puntos - 1) / 2,
                                                  cx + sep * (puntos - 1) / 2, puntos)
        modo = rng.random()                                  # 22 % anillo, 12 % garabato
        for x in xs:
            ang = np.linspace(0, 2 * np.pi, 24, endpoint=False)
            rad = R * (1 + rng.normal(0, 0.05, 24)) * rng.uniform(0.85, 1.15)
            px = x + rng.normal(0, R * 0.2) + rad * np.cos(ang)
            py = y + R + rng.normal(0, R * 0.2) + rad * np.sin(ang)
            pts = np.stack([px, py], 1).astype(np.int32)
            if modo < 0.22:
                cv2.polylines(m, [pts], True, 255, int(max(2, R * rng.uniform(0.25, 0.55))), cv2.LINE_AA)
            elif modo < 0.34:
                esp = np.linspace(0, 1, 30)
                rr = R * (0.2 + 0.85 * esp) * (1 + rng.normal(0, 0.06, 30))
                th = 2 * np.pi * 2.2 * esp + rng.uniform(0, 6)
                sp = np.stack([px.mean() + rr * np.cos(th), py.mean() + rr * np.sin(th)], 1).astype(np.int32)
                cv2.polylines(m, [sp], False, 255, int(max(2, T // 2 + 1)), cv2.LINE_AA)
                cv2.polylines(m, [pts], True, 255, int(max(2, T // 2 + 1)), cv2.LINE_AA)
            else:
                cv2.fillPoly(m, [pts], 255, cv2.LINE_AA)
        y += 2 * R + (D if barras else 0)
    for i in range(barras):
        largo = int(Lb * rng.uniform(0.7, 1.0))
        x0 = cx - largo // 2 + int(rng.normal(0, base * 0.5))
        yb = y + T // 2 + i * (T + G)
        n = int(rng.integers(6, 14))
        xs = np.linspace(x0, x0 + largo, n)
        pend = rng.normal(0, 0.05)
        ys = yb + pend * (xs - x0) + np.cumsum(rng.normal(0, T * 0.22, n))
        grosor = int(max(1, T * rng.uniform(0.8, 1.3)))
        pts = np.stack([xs, ys], 1).astype(np.int32)
        cv2.polylines(m, [pts], False, 255, grosor, cv2.LINE_AA)
        for e in (pts[0], pts[-1]):
            cv2.circle(m, tuple(int(v) for v in e), max(1, grosor // 2), 255, -1, cv2.LINE_AA)
    return _recortar(m), float(Lb)


def glifo_concha(rng) -> np.ndarray:
    """El cero maya: un óvalo acostado con trazos internos, estilo concha."""
    w, h = rng.integers(200, 260), rng.integers(90, 130)
    t = int(rng.integers(7, 14))
    pad = 24
    m = np.zeros((h + 2 * pad, w + 2 * pad), np.uint8)
    cx, cy = m.shape[1] // 2, m.shape[0] // 2
    sup = np.array([[pad, cy], [cx, cy - h // 2], [w + pad, cy]], np.int32)
    inf = np.array([[pad, cy], [cx, cy + h // 2], [w + pad, cy]], np.int32)
    for arco in (sup, inf):
        cv2.polylines(m, [cv2.approxPolyDP(arco, 1, False)], False, 255, t, cv2.LINE_AA)
    cv2.ellipse(m, (cx, cy), (w // 2, h // 2), 0, 0, 360, 255, t, cv2.LINE_AA)
    for k in range(int(rng.integers(3, 6))):           # trazos internos
        x = int(cx - w * 0.3 + k * w * 0.6 / 4)
        cv2.line(m, (x, cy - int(h * 0.28)), (x + int(rng.normal(0, 4)), cy + int(h * 0.28)),
                 255, max(2, t // 2), cv2.LINE_AA)
    return _recortar(m), float(w)


def _apilar(partes, rng, separacion=None):
    """Apila (mascara, ref) con separación clara: así se escribe la notación posicional."""
    masks = [p[0] for p in partes]
    ref = float(np.mean([p[1] for p in partes]))
    sep = separacion if separacion is not None else int(rng.integers(45, 90))
    ancho = max(m.shape[1] for m in masks)
    alto = sum(m.shape[0] for m in masks) + sep * (len(masks) - 1)
    out = np.zeros((alto, ancho), np.uint8)
    y = 0
    for m in masks:
        x = (ancho - m.shape[1]) // 2
        out[y:y + m.shape[0], x:x + m.shape[1]] = np.maximum(out[y:y + m.shape[0], x:x + m.shape[1]], m)
        y += m.shape[0] + sep
    return out, ref


def glifo_negativo(subclase: str, rng) -> np.ndarray:
    """Negativos dibujados con las mismas primitivas que los positivos."""
    if subclase == "cero_maya":
        return glifo_concha(rng)

    if subclase == "mayor_19":
        # Notación posicional: dos o tres niveles claramente separados
        niveles = []
        for _ in range(int(rng.integers(2, 4))):
            if rng.random() < 0.25:
                niveles.append(glifo_concha(rng))
            else:
                v = int(rng.integers(1, 20))
                niveles.append(glifo(v // 5, v % 5, rng))
        return _apilar(niveles, rng)

    if subclase == "casi_valido":
        cual = rng.integers(0, 6)
        if cual == 0:                                   # 5 o 6 puntos
            return glifo(0, int(rng.integers(5, 7)), rng)
        if cual == 1:                                   # 4 o 5 barras
            return glifo(int(rng.integers(4, 6)), 0, rng)
        if cual == 2:                                   # puntos debajo de las barras
            b = int(rng.integers(1, 4)); p = int(rng.integers(1, 5))
            return _apilar([glifo(b, 0, rng), glifo(0, p, rng)], rng, separacion=int(rng.integers(8, 25)))
        if cual == 3:                                   # barras verticales
            g, ref = glifo(int(rng.integers(1, 4)), int(rng.integers(0, 5)), rng)
            return cv2.rotate(g, cv2.ROTATE_90_CLOCKWISE), ref
        if cual == 4:                                   # elementos dispersos
            m = np.zeros((300, 300), np.uint8)
            for _ in range(int(rng.integers(3, 8))):
                if rng.random() < 0.5:
                    punto(m, rng.integers(30, 270), rng.integers(30, 270), int(rng.integers(8, 18)), rng)
                else:
                    x = int(rng.integers(20, 160)); y = int(rng.integers(20, 280))
                    barra(m, x, x + int(rng.integers(60, 130)), y, int(rng.integers(8, 20)), rng)
            return _recortar(m), 190.0
        b = int(rng.integers(1, 4))                     # demasiados puntos sobre barras
        return glifo(b, int(rng.integers(5, 7)), rng)

    if subclase == "multiples":
        a = int(rng.integers(1, 20)); b = int(rng.integers(1, 20))
        p1, p2 = glifo(a // 5, a % 5, rng), glifo(b // 5, b % 5, rng)
        if rng.random() < 0.5:
            return _apilar([p1, p2], rng, separacion=int(rng.integers(60, 120)))
        g1, g2 = p1[0], p2[0]
        h = max(g1.shape[0], g2.shape[0]); sep = int(rng.integers(50, 110))
        out = np.zeros((h, g1.shape[1] + sep + g2.shape[1]), np.uint8)
        out[:g1.shape[0], :g1.shape[1]] = g1
        out[:g2.shape[0], g1.shape[1] + sep:] = g2
        return out, (p1[1] + p2[1]) / 2

    if subclase == "digitos_arabigos":
        m = np.zeros((300, 300), np.uint8)
        texto = str(int(rng.integers(0, 100)))
        cv2.putText(m, texto, (40, 220), int(rng.integers(0, 8)), rng.uniform(4, 7), 255,
                    int(rng.integers(6, 16)), cv2.LINE_AA)
        return _recortar(m), 230.0

    if subclase == "romanos":
        m = np.zeros((300, 400), np.uint8)
        rom = ["I", "II", "III", "IV", "V", "VI", "IX", "X", "XII", "XIV", "XIX", "XX"]
        cv2.putText(m, rom[int(rng.integers(0, len(rom)))], (30, 220), int(rng.integers(0, 8)),
                    rng.uniform(3, 6), 255, int(rng.integers(6, 14)), cv2.LINE_AA)
        return _recortar(m), 230.0

    if subclase == "dibujos":
        m = np.zeros((300, 300), np.uint8)
        t = int(rng.integers(5, 12))
        for _ in range(int(rng.integers(2, 6))):
            k = rng.integers(0, 3)
            p = lambda: (int(rng.integers(20, 280)), int(rng.integers(20, 280)))
            if k == 0:
                cv2.line(m, p(), p(), 255, t, cv2.LINE_AA)
            elif k == 1:
                cv2.circle(m, p(), int(rng.integers(20, 70)), 255, t, cv2.LINE_AA)
            else:
                pts = np.array([p() for _ in range(int(rng.integers(3, 6)))], np.int32)
                cv2.polylines(m, [pts], bool(rng.random() < 0.5), 255, t, cv2.LINE_AA)
        return _recortar(m), 210.0

    # "vacio" y cualquier otro: sin tinta
    return np.zeros((10, 10), np.uint8), 190.0


# ----------------------------------------------------------------------------
# Fondos, composición y degradación
# ----------------------------------------------------------------------------

def fondo(tipo, alto, ancho, rng) -> np.ndarray:
    if tipo == "pizarron_verde":
        base = np.array([38, 70, 52], np.float64)
    elif tipo == "pizarron_blanco":
        base = np.array([243, 244, 242], np.float64)
    elif tipo == "cartulina":
        base = np.array([222, 205, 178], np.float64)
    elif tipo == "madera":
        base = np.array([168, 126, 84], np.float64)
    elif tipo == "servilleta":
        base = np.array([246, 243, 236], np.float64)
    else:
        base = np.array([248, 247, 243], np.float64)

    img = np.tile(base, (alto, ancho, 1))
    img += rng.normal(0, 4.5, (alto, ancho, 1))                     # grano del papel

    if tipo == "madera":                                             # veta
        v = np.sin(np.linspace(0, rng.uniform(8, 20), alto))[:, None, None] * rng.uniform(5, 14)
        img += v
    if tipo == "rayado":
        paso = int(rng.integers(26, 46)); off = int(rng.integers(0, paso))
        for y in range(off, alto, paso):
            cv2.line(img, (0, y), (ancho, y), (168, 176, 200), max(1, int(rng.integers(1, 3))), cv2.LINE_AA)
    if tipo == "cuadriculado":
        paso = int(rng.integers(22, 40))
        for y in range(0, alto, paso):
            cv2.line(img, (0, y), (ancho, y), (178, 190, 205), 1, cv2.LINE_AA)
        for x in range(0, ancho, paso):
            cv2.line(img, (x, 0), (x, alto), (178, 190, 205), 1, cv2.LINE_AA)
    if tipo == "servilleta":
        paso = int(rng.integers(8, 16))
        for y in range(0, alto, paso):
            cv2.line(img, (0, y), (ancho, y), (236, 232, 224), 1)
    return img


def iluminar(img, rng):
    alto, ancho = img.shape[:2]
    yy, xx = np.mgrid[0:alto, 0:ancho].astype(np.float64)
    g = np.ones((alto, ancho))
    if rng.random() < 0.8:                                           # gradiente lateral
        ang = rng.uniform(0, 2 * np.pi)
        d = (np.cos(ang) * xx / ancho + np.sin(ang) * yy / alto)
        g *= 1 + rng.uniform(-0.35, 0.35) * (d - d.mean())
    if rng.random() < 0.35:                                          # sombra de la mano
        cx, cy = rng.uniform(0, ancho), rng.uniform(0, alto)
        r = rng.uniform(0.3, 0.9) * max(alto, ancho)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
        g *= 1 - rng.uniform(0.15, 0.45) * np.clip(1 - d, 0, 1)
    if rng.random() < 0.25:                                          # brillo especular
        cx, cy = rng.uniform(0, ancho), rng.uniform(0, alto)
        r = rng.uniform(0.1, 0.3) * max(alto, ancho)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
        g *= 1 + rng.uniform(0.1, 0.4) * np.clip(1 - d, 0, 1)
    return img * g[:, :, None]


def degradar(img, rng, limpia=False):
    """Rotación, perspectiva, desenfoque, ruido y artefactos de compresión.

    Con `limpia=True` solo se aplica una rotación suave y nada más. Existe porque
    el lienzo de dibujo de la aplicación produce trazos perfectamente nítidos sobre
    blanco puro, sin grano ni compresión: si el entrenamiento solo tuviera imágenes
    degradadas, ese tipo de entrada no estaría en la distribución y la red fallaría
    justo en la vía más cómoda para que el docente dibuje en vivo.
    """
    alto, ancho = img.shape[:2]
    if limpia:
        if rng.random() < 0.5:
            ang = rng.uniform(-10, 10)
            M = cv2.getRotationMatrix2D((ancho / 2, alto / 2), ang, 1.0)
            img = cv2.warpAffine(img, M, (ancho, alto), flags=cv2.INTER_LINEAR,
                                 borderValue=(255, 255, 255))
        return np.clip(img, 0, 255).astype(np.uint8)
    if rng.random() < 0.85:                                          # rotación + perspectiva
        ang = rng.uniform(-15, 15)
        M = cv2.getRotationMatrix2D((ancho / 2, alto / 2), ang, rng.uniform(0.92, 1.06))
        img = cv2.warpAffine(img, M, (ancho, alto), flags=cv2.INTER_LINEAR,
                             borderMode=cv2.BORDER_REPLICATE)
    if rng.random() < 0.55:
        d = 0.12 * min(alto, ancho)
        src = np.float32([[0, 0], [ancho, 0], [ancho, alto], [0, alto]])
        dst = src + rng.uniform(-d, d, src.shape).astype(np.float32)
        img = cv2.warpPerspective(img, cv2.getPerspectiveTransform(src, dst), (ancho, alto),
                                  flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    if rng.random() < 0.5:
        k = int(rng.choice([3, 5, 7]))
        img = cv2.GaussianBlur(img, (k, k), 0)
    img = img + rng.normal(0, rng.uniform(1.5, 7.0), img.shape)
    img = np.clip(img, 0, 255).astype(np.uint8)
    if rng.random() < 0.6:                                           # artefactos JPEG
        q = int(rng.integers(28, 82))
        ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), q])
        if ok:
            img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if rng.random() < 0.3:                                           # baja resolución
        f = rng.uniform(0.35, 0.7)
        chico = cv2.resize(img, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
        img = cv2.resize(chico, (ancho, alto), interpolation=cv2.INTER_LINEAR)
    return img


def componer(glifo_y_ref, rng, lienzo=None, tipos_fondo=None) -> np.ndarray:
    """Pega el glifo sobre un fondo y degrada la imagen. Todo en orden RGB."""
    mask_glifo, ref = glifo_y_ref
    alto, ancho = lienzo or (LIENZO, LIENZO)
    tipos = tipos_fondo or ["papel_blanco", "rayado", "cuadriculado", "cartulina",
                            "pizarron_blanco", "pizarron_verde", "madera", "servilleta"]
    # Una parte de las muestras imita el lienzo digital: blanco puro, trazo nítido,
    # sin grano ni degradación. Es lo que produce la pestaña "Dibujar" de la app.
    limpia = rng.random() < 0.15
    tipo = "lienzo_digital" if limpia else str(rng.choice(tipos))
    bg = (np.full((alto, ancho, 3), 255.0) if limpia
          else fondo(tipo, alto, ancho, rng))

    if mask_glifo.size > 1 and mask_glifo.max() > 0:
        gh, gw = mask_glifo.shape
        # La escala se deriva de la unidad de referencia (el largo natural de barra),
        # no de la caja envolvente: si se normalizara la caja, un "1" —que es un solo
        # punto— llenaría la imagen y un "19" quedaría diminuto.
        objetivo = ancho * rng.uniform(0.26, 0.72)
        f = objetivo / max(1.0, ref)
        f = min(f, 0.86 * alto / gh, 0.86 * ancho / gw)              # que siempre quepa
        nh, nw = max(2, int(gh * f)), max(2, int(gw * f))
        g = cv2.resize(mask_glifo, (nw, nh), interpolation=cv2.INTER_AREA)
        lienzo_mask = np.zeros((alto, ancho), np.uint8)
        # Posición descentrada pero con sesgo al centro: la rotación y la perspectiva
        # que vienen después pueden sacar del encuadre un glifo pegado al borde.
        y0 = int((rng.integers(0, alto - nh + 1) + (alto - nh) / 2) / 2)
        x0 = int((rng.integers(0, ancho - nw + 1) + (ancho - nw) / 2) / 2)
        lienzo_mask[y0:y0 + nh, x0:x0 + nw] = g

        # La tinta tiene que contrastar con el fondo, si no la foto es ilegible
        lum_fondo = float(bg.mean())
        if lum_fondo < 120:
            tinta = np.clip(np.array([246, 246, 244], np.float64) + rng.normal(0, 8, 3), 0, 255)
        else:
            tinta = np.array(TINTAS[str(rng.choice(list(TINTAS)))], np.float64)
            tinta = np.clip(tinta + rng.normal(0, 12, 3), 0, 255)
        opacidad = 1.0 if limpia else rng.uniform(0.86, 1.0)
        a = (lienzo_mask.astype(np.float64) / 255.0)[:, :, None] * opacidad
        bg = bg * (1 - a) + tinta * a

    if limpia:
        return degradar(bg, rng, limpia=True)
    return degradar(iluminar(bg, rng), rng)


# ----------------------------------------------------------------------------
# API
# ----------------------------------------------------------------------------

def imagen_de_numero(valor: int, rng, lienzo=None) -> np.ndarray:
    """Imagen RGB uint8 de un número maya 1..19."""
    b, p = L.barras_y_puntos(valor)
    g = glifo_mano(b, p, rng) if rng.random() < 0.35 else glifo(b, p, rng)
    return componer(g, rng, lienzo=lienzo)


def imagen_negativa(subclase: str, rng, lienzo=None) -> np.ndarray:
    return componer(glifo_negativo(subclase, rng), rng, lienzo=lienzo)


SUBCLASES_SINTETICAS = ["cero_maya", "mayor_19", "casi_valido", "multiples",
                        "digitos_arabigos", "romanos", "dibujos", "vacio"]
# Pesos: las de la frontera valen más que las genéricas (docs/03-DATASET.md)
PESOS_SUBCLASES = [0.15, 0.17, 0.28, 0.11, 0.07, 0.05, 0.07, 0.10]


def generar(raiz_datos="../data", por_clase=800, negativos=10000, semilla=42, lienzo=LIENZO,
            progreso=True, refuerzo=None, refuerzo_neg=None) -> int:
    from PIL import Image
    raiz = Path(raiz_datos) / "raw" / "synthetic"
    filas, n = [], 0

    def guardar(img, carpeta, nombre, clase, subclase, seed):
        d = raiz / carpeta
        d.mkdir(parents=True, exist_ok=True)
        ruta = d / nombre
        Image.fromarray(img).save(ruta, quality=92)
        h = hashlib.sha256(ruta.read_bytes()).hexdigest()
        filas.append({"ruta": ruta.as_posix().split("/data/")[-1] if "/data/" in ruta.as_posix()
                      else str(Path("raw/synthetic") / carpeta / nombre),
                      "sha256": h, "clase": clase, "subclase": subclase, "split": "",
                      "fuente": "synth", "autor": "", "estilo": "", "seed": seed,
                      "ancho": img.shape[1], "alto": img.shape[0], "creado_en": "2026-11-18"})

    for valor in range(1, 20):
        clase = f"maya_{valor:02d}"
        for i in range(por_clase):
            seed = semilla * 1_000_000 + valor * 10_000 + i
            img = imagen_de_numero(valor, np.random.default_rng(seed), lienzo=(lienzo, lienzo))
            guardar(img, clase, f"synth_{clase}_s{seed}.jpg", clase, "", seed)
            n += 1
        if progreso:
            print(f"  {clase}: {por_clase}", flush=True)

    # Refuerzo de las clases que más fallan en las pruebas con dibujos (1, 2, 3: pocos puntos
    # solos; 6, 7, 9, 15, 16: barras finas con puntos). ADR-016.
    for valor, extra in (refuerzo or {}).items():
        clase = f"maya_{int(valor):02d}"
        for i in range(int(extra)):
            seed = semilla * 1_000_000 + 500_000 + int(valor) * 10_000 + i
            img = imagen_de_numero(int(valor), np.random.default_rng(seed), lienzo=(lienzo, lienzo))
            guardar(img, clase, f"synth_{clase}_r{seed}.jpg", clase, "", seed)
            n += 1

    # Refuerzo de negativos que SE PARECEN a un número válido. Medido con dibujos de lienzo: 4 barras
    # más k puntos se leían siempre como 15+k (el modelo trataba 4 barras como 3) y solo se
    # rechazaba el 69,8 % de los casi-números. ADR-016.
    for sub, extra in (refuerzo_neg or {}).items():
        rng_r = np.random.default_rng(semilla + 4242 + len(sub))
        for i in range(int(extra)):
            seed = semilla * 1_000_000 + 800_000 + len(sub) * 100_000 + i
            r = np.random.default_rng(seed)
            if sub == "cuatro_barras":
                b, p = (4 if r.random() < 0.8 else 5), int(r.integers(0, 5))
            else:                                    # "muchos_puntos": 5 o más puntos
                b, p = int(r.integers(0, 4)), int(r.integers(5, 8))
            g = glifo_mano(b, p, r) if r.random() < 0.35 else glifo(b, p, r)
            img = componer(g, r, lienzo=(lienzo, lienzo))
            guardar(img, "no_valido/casi_valido", f"synth_{sub}_s{seed}.jpg", "no_valido", "casi_valido", seed)
            n += 1

    rng_sub = np.random.default_rng(semilla + 777)
    for i in range(negativos):
        sub = str(rng_sub.choice(SUBCLASES_SINTETICAS, p=PESOS_SUBCLASES))
        seed = semilla * 1_000_000 + 900_000 + i
        img = imagen_negativa(sub, np.random.default_rng(seed), lienzo=(lienzo, lienzo))
        guardar(img, f"no_valido/{sub}", f"synth_{sub}_s{seed}.jpg", "no_valido", sub, seed)
        n += 1
        if progreso and (i + 1) % 2000 == 0:
            print(f"  negativos: {i + 1}/{negativos}", flush=True)

    manif = Path(raiz_datos) / "manifest_synth.csv"
    campos = ["ruta","sha256","clase","subclase","split","fuente","autor","estilo","seed","ancho","alto","creado_en"]
    with open(manif, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos); w.writeheader(); w.writerows(filas)
    return n


if __name__ == "__main__":
    import argparse, yaml
    ap = argparse.ArgumentParser(description="Genera el dataset sintético")
    ap.add_argument("--config", default="configs/default.yaml")
    ap.add_argument("--por-clase", type=int)
    ap.add_argument("--negativos", type=int)
    a = ap.parse_args()
    cfg = yaml.safe_load(open(a.config, encoding="utf-8"))
    n = generar(raiz_datos=cfg["datos"]["raiz"],
                por_clase=a.por_clase or cfg["sintetico"]["por_clase_valida"],
                negativos=a.negativos or cfg["sintetico"]["negativos_total"],
                semilla=cfg["semilla"], lienzo=cfg["sintetico"]["lienzo_px"],
                refuerzo=cfg["sintetico"].get("refuerzo"),
                refuerzo_neg=cfg["sintetico"].get("refuerzo_neg"))
    print(f"{n} imágenes generadas")
