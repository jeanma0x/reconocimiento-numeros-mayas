"""Prueba de estrés sobre fotos reales: aplica perturbaciones que simulan lo que puede
traer el docente (luz, cámara, encuadre) y mide el acierto con la política de la app.

    python -m maya.estres --carpeta ../data/raw/real/imri --modelo A.onnx --umbrales A.json

Sirve para comparar dos modelos cuando las fotos limpias ya no los distinguen.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np

from . import labels as L
from .calibrate import decidir
from .evaluar_fotos import EXT, _verdadera
from .preprocess import cargar_imagen, preparar


def variantes(img: np.ndarray, rng) -> dict:
    h, w = img.shape[:2]
    out = {"original": img}
    for ang in (-9, 9):
        M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
        out[f"rot{ang:+d}"] = cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    out["oscura"] = np.clip(img * 0.55, 0, 255).astype(np.uint8)
    out["sobreexp"] = np.clip(img * 1.25 + 25, 0, 255).astype(np.uint8)
    out["desenfoque"] = cv2.GaussianBlur(img, (0, 0), max(h, w) / 220)
    chica = cv2.resize(img, (max(32, w // 4), max(32, h // 4)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode(".jpg", chica, [cv2.IMWRITE_JPEG_QUALITY, 35])
    out["baja_res_jpeg"] = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    d = int(0.15 * min(h, w))
    out["borde_extra"] = cv2.copyMakeBorder(img, d, d, d, d, cv2.BORDER_CONSTANT, value=(235, 235, 235))
    out["recorte_6"] = img[int(h * .06):h - int(h * .06), int(w * .06):w - int(w * .06)]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = src + rng.uniform(-0.05, 0.05, src.shape).astype(np.float32) * np.float32([w, h])
    out["perspectiva"] = cv2.warpPerspective(img, cv2.getPerspectiveTransform(src, dst), (w, h),
                                             borderMode=cv2.BORDER_REPLICATE)
    out["ruido"] = np.clip(img + rng.normal(0, 14, img.shape), 0, 255).astype(np.uint8)
    return out


def correr(carpetas, modelo, umbrales):
    import onnxruntime as ort
    ses = ort.InferenceSession(str(modelo), providers=["CPUExecutionProvider"])
    rng = np.random.default_rng(0)
    por_tipo, fallos = {}, []
    for base in carpetas:
        for ruta in sorted(base.rglob("*")):
            if not ruta.is_file() or ruta.suffix.lower() not in EXT:
                continue
            verd, _ = _verdadera(ruta, base)
            img = cargar_imagen(ruta)
            for nombre, v in variantes(img, rng).items():
                lg, lb, lp = ses.run(["logits", "barras", "puntos"],
                                     {"input": preparar(v)[None]})
                d = decidir(lg[0], lb[0], lp[0], umbrales)
                if verd == L.ETIQUETA_NO_VALIDO:
                    ok = d["rechazada"]
                else:
                    ok = (not d["rechazada"]) and d["valor"] == int(verd.split("_")[1])
                por_tipo.setdefault(nombre, []).append(ok)
                if not ok:
                    fallos.append((nombre, verd, "RECH" if d["rechazada"] else d["valor"]))
    tot = [x for v in por_tipo.values() for x in v]
    return {k: (sum(v), len(v)) for k, v in por_tipo.items()}, (sum(tot), len(tot)), fallos


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--carpeta", action="append", required=True, type=Path)
    ap.add_argument("--modelo", required=True, type=Path)
    ap.add_argument("--umbrales", required=True, type=Path)
    a = ap.parse_args()
    t, tot, f = correr(a.carpeta, a.modelo, json.loads(a.umbrales.read_text(encoding="utf-8")))
    for k, (ok, n) in t.items():
        print(f"  {k:14s} {ok}/{n}")
    print(f"  TOTAL {tot[0]}/{tot[1]} = {tot[0] / tot[1]:.1%}")
