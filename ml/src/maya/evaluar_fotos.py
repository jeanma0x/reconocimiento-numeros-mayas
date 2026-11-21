"""Evalúa un .onnx sobre carpetas de fotos reales, con la misma política que la app.

    python -m maya.evaluar_fotos --carpeta ../data/raw/real/imri \
        --modelo ../web/public/models/maya_cnn.<run>.onnx \
        --umbrales ../web/public/models/thresholds.json --salida runs/<id>/fotos_imri

La clase verdadera sale de la carpeta (maya_NN / no_valido), igual que en el indexado.
No necesita torch: solo numpy, Pillow y onnxruntime. Sirve para el simulacro y para
medir con una mano que el modelo no vio. NO modifica manifiestos ni entrena nada.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np

from . import labels as L
from .calibrate import decidir
from .preprocess import preparar_archivo

EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def _verdadera(ruta: Path, base: Path) -> tuple[str, str]:
    partes = ruta.relative_to(base).parts[:-1]
    for i, p in enumerate(partes):
        if p == "no_valido":
            return L.ETIQUETA_NO_VALIDO, (partes[i + 1] if len(partes) > i + 1 else "otros")
        if p.startswith("maya_"):
            return p, ""
    return "?", ""


def evaluar(carpetas: list[Path], modelo: Path, umbrales: dict, salida: Path | None = None):
    import onnxruntime as ort

    ses = ort.InferenceSession(str(modelo), providers=["CPUExecutionProvider"])
    filas = []
    for base in carpetas:
        for ruta in sorted(base.rglob("*")):
            if not ruta.is_file() or ruta.suffix.lower() not in EXT:
                continue
            verd, sub = _verdadera(ruta, base)
            x = preparar_archivo(ruta)[None]
            lg, lb, lp = ses.run(["logits", "barras", "puntos"], {"input": x})
            d = decidir(lg[0], lb[0], lp[0], umbrales)
            top = np.argsort(-np.asarray(d["probabilidades"]))[:3]
            esperado_valido = verd != L.ETIQUETA_NO_VALIDO
            if esperado_valido:
                ok = (not d["rechazada"]) and L.etiqueta_de_indice(L.indice_de_valor(d["valor"])) == verd
            else:
                ok = d["rechazada"]
            filas.append({
                "archivo": str(ruta.relative_to(base.parent)), "verdadera": verd, "subclase": sub,
                "prediccion": "RECHAZADA" if d["rechazada"] else str(d["valor"]),
                "motivo": d["motivo"] or "", "confianza": round(d["confianza"], 3),
                "barras": d["barras"], "puntos": d["puntos"],
                "top3": " | ".join(f"{L.etiqueta_de_indice(int(i))}:{d['probabilidades'][int(i)]:.2f}" for i in top),
                "correcto": int(ok)})

    validas = [f for f in filas if f["verdadera"] != L.ETIQUETA_NO_VALIDO]
    nov = [f for f in filas if f["verdadera"] == L.ETIQUETA_NO_VALIDO]
    res = {
        "n": len(filas), "n_validas": len(validas), "n_no_validas": len(nov),
        "exactitud_validas": float(np.mean([f["correcto"] for f in validas])) if validas else None,
        "rechazo_correcto_no_validas": float(np.mean([f["correcto"] for f in nov])) if nov else None,
        "falso_rechazo": float(np.mean([f["prediccion"] == "RECHAZADA" for f in validas])) if validas else None,
        "exactitud_total": float(np.mean([f["correcto"] for f in filas])) if filas else None,
    }
    if salida:
        salida.parent.mkdir(parents=True, exist_ok=True)
        with open(salida.with_suffix(".csv"), "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(filas[0])); w.writeheader(); w.writerows(filas)
        salida.with_suffix(".json").write_text(json.dumps(res, indent=2), encoding="utf-8")
    return filas, res


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--carpeta", action="append", required=True, type=Path)
    ap.add_argument("--modelo", required=True, type=Path)
    ap.add_argument("--umbrales", required=True, type=Path)
    ap.add_argument("--salida", type=Path)
    a = ap.parse_args()
    um = json.loads(a.umbrales.read_text(encoding="utf-8"))
    filas, res = evaluar(a.carpeta, a.modelo, um, a.salida)
    for f in filas:
        print(f"{'✓' if f['correcto'] else '✗'} {f['verdadera']:9s} -> {f['prediccion']:9s} "
              f"conf {f['confianza']:.2f} b{f['barras']} p{f['puntos']} {f['motivo']:16s} {f['archivo']}")
    print(json.dumps(res, indent=2))
