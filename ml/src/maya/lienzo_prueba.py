"""Prueba de dibujos de lienzo en varios estilos, escrita APARTE del generador de
entrenamiento (otro código, otras formas) para no medir la propia distribución.

    python -m maya.lienzo_prueba --modelo A.onnx --umbrales A.json

Estilos: relleno, anillo (puntos como círculos huecos), fino (lapicero) y garabato
(puntos huecos irregulares). 19 números × 4 estilos × 2 semillas.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import cv2
import numpy as np

from . import labels as L
from .calibrate import decidir
from .preprocess import preparar


def dibujar(valor: int, estilo: str, rng) -> np.ndarray:
    b, p = L.barras_y_puntos(valor)
    c = np.full((560, 720, 3), 255, np.uint8)
    T = {"relleno": 14, "anillo": 12, "fino": 4, "garabato": 8, "toque": 16}[estilo] + int(rng.integers(-1, 3))
    # "toque": quien dibuja con el dedo o el mouse a grosor por defecto: el punto es un toque
    # de un grosor de diámetro, así que es diminuto frente a la barra.
    R = {"relleno": 30, "anillo": 30, "fino": 22, "garabato": 30, "toque": T // 2 + 1}[estilo] + (0 if estilo == "toque" else int(rng.integers(-5, 6)))
    cx, y = 360 + int(rng.integers(-40, 40)), 150 + int(rng.integers(-30, 30))
    sep = int(R * rng.uniform(2.6, 3.4))
    for i in range(p):
        x = int(cx + (i - (p - 1) / 2) * sep + rng.normal(0, 4))
        yy = int(y + rng.normal(0, 5))
        if estilo in ("relleno", "fino", "toque"):
            cv2.circle(c, (x, yy), R, (0, 0, 0), -1, cv2.LINE_AA)
        elif estilo == "anillo":
            cv2.ellipse(c, (x, yy), (R, int(R * rng.uniform(0.85, 1.1))), rng.uniform(0, 90), 0, 360,
                        (0, 0, 0), T, cv2.LINE_AA)
        else:
            ang = np.linspace(0, 2 * np.pi, 14)
            rad = R * (1 + rng.normal(0, 0.12, 14))
            pts = np.stack([x + rad * np.cos(ang), yy + rad * np.sin(ang)], 1).astype(np.int32)
            cv2.polylines(c, [pts], True, (0, 0, 0), T, cv2.LINE_AA)
    y0 = y + (2 * R + 40 if p else 0)
    for k in range(b):
        yb = y0 + k * (T + int(rng.integers(26, 44)))
        xs = np.linspace(cx - 190, cx + 190, 8) + rng.normal(0, 3, 8)
        ys = yb + np.cumsum(rng.normal(0, 1.6, 8)) + rng.normal(0, 3)
        cv2.polylines(c, [np.stack([xs, ys], 1).astype(np.int32)], False, (0, 0, 0), T, cv2.LINE_AA)
    # Mismo recorte que web/components/LienzoDibujo.tsx: lado = max(18 × grosor, 1,15 × tinta).
    # El grosor del control de la app es el del trazo. Una versión anterior recortaba
    # ajustado a la tinta y hacía que un punto solo llenara el cuadro: medía otra cosa.
    ys_, xs_ = np.nonzero(c.min(axis=2) < 200)
    holgura = float(os.environ.get("HOLGURA", "1.5"))
    lado = int(round(max(18 * T, max(ys_.max() - ys_.min() + 1, xs_.max() - xs_.min() + 1) * holgura)))
    my, mx = (ys_.min() + ys_.max()) // 2, (xs_.min() + xs_.max()) // 2
    out = np.full((lado, lado, 3), 255, np.uint8)
    sy, sx = my - lado // 2, mx - lado // 2
    ya, xa = max(0, sy), max(0, sx)
    yb, xb = min(c.shape[0], sy + lado), min(c.shape[1], sx + lado)
    out[ya - sy:yb - sy, xa - sx:xb - sx] = c[ya:yb, xa:xb]
    return out


def correr(modelo: Path, umbrales: dict):
    import onnxruntime as ort
    ses = ort.InferenceSession(str(modelo), providers=["CPUExecutionProvider"])
    res, fallos = {}, []
    for estilo in ("relleno", "anillo", "fino", "garabato", "toque"):
        for v in range(1, 20):
            for s in range(2):
                img = dibujar(v, estilo, np.random.default_rng(1000 * v + s))
                lg, lb, lp = ses.run(["logits", "barras", "puntos"], {"input": preparar(img)[None]})
                d = decidir(lg[0], lb[0], lp[0], umbrales)
                ok = (not d["rechazada"]) and d["valor"] == v
                res.setdefault(estilo, []).append(ok)
                if not ok:
                    fallos.append((estilo, v, "RECH" if d["rechazada"] else d["valor"]))
    return res, fallos


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--modelo", required=True, type=Path)
    ap.add_argument("--umbrales", required=True, type=Path)
    a = ap.parse_args()
    res, fallos = correr(a.modelo, json.loads(a.umbrales.read_text(encoding="utf-8")))
    for k, v in res.items():
        print(f"  {k:9s} {sum(v)}/{len(v)}")
    tot = [x for v in res.values() for x in v]
    print(f"  TOTAL     {sum(tot)}/{len(tot)} = {sum(tot) / len(tot):.1%}")
    print("  fallos:", sorted(set(fallos), key=str)[:40])
