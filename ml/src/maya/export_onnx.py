"""Exportación a ONNX con verificación. Ver docs/04-MODELO.md.

    python -m maya.export_onnx --run runs/<id>

La verificación NO es opcional: se corren 200 muestras por PyTorch y por
onnxruntime y se exige max|diff| < 1e-5 y 100% de coincidencia en la etiqueta. Si
no se cumple, no se escribe nada. Un ONNX que diverge del modelo entrenado es el
tipo de fallo que no se nota hasta la demo.

El archivo se nombra con el id de la corrida (`maya_cnn.<run_id>.onnx`) porque el
CDN lo sirve como inmutable: al cambiar el modelo cambia el nombre, no el contenido
del mismo nombre.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np

OPSET = 18          # 17 no está soportado por el exportador nuevo de torch
# 1e-4 sobre logits float32 (magnitud ~10, épsilon relativo ~1e-6): un modelo entrenado más
# largo dio 2,4e-5 con 100 % de coincidencia de etiquetas. La exigencia dura sigue siendo 100 %.
TOLERANCIA = 1e-4
N_VERIFICACION = 200


def exportar(run, destino="../web/public/models", raiz_datos="../data", n_verif=N_VERIFICACION) -> dict:
    import torch

    from . import dataset as D
    from . import labels as L
    from .model import construir, contar_parametros

    run = Path(run)
    destino = Path(destino); destino.mkdir(parents=True, exist_ok=True)
    ck = torch.load(run / "mejor.pt", map_location="cpu", weights_only=False)
    cfg = ck["config"]
    modelo = construir(cfg["modelo"]["arquitectura"], dropout=cfg["modelo"]["dropout"])
    modelo.load_state_dict(ck["modelo"])
    modelo.eval()

    nombre = f"maya_cnn.{run.name}.onnx"
    ruta = destino / nombre
    ejemplo = torch.randn(1, 1, 64, 64)
    # external_data=False fuerza un solo archivo: por defecto el exportador nuevo
    # saca los pesos a un .onnx.data aparte, y servir dos archivos al navegador es
    # una fuente de fallos innecesaria el día de la demo.
    torch.onnx.export(
        modelo, ejemplo, str(ruta), opset_version=OPSET, external_data=False,
        input_names=["input"], output_names=["logits", "barras", "puntos"],
        dynamic_axes={"input": {0: "lote"}, "logits": {0: "lote"},
                      "barras": {0: "lote"}, "puntos": {0: "lote"}},
    )
    for sobrante in destino.glob(f"{nombre}.data"):
        sobrante.unlink()

    # --- Verificación obligatoria ---
    import onnxruntime as ort
    sesion = ort.InferenceSession(str(ruta), providers=["CPUExecutionProvider"])
    try:
        X, _, _, _ = D.cargar_cache(raiz_datos, "val")
        muestras = X[:n_verif].astype(np.float32)[:, None] / 255.0
    except Exception:
        muestras = np.random.default_rng(0).random((n_verif, 1, 64, 64)).astype(np.float32)

    with torch.no_grad():
        ref = [t.numpy() for t in modelo(torch.from_numpy(muestras))]
    obt = sesion.run(["logits", "barras", "puntos"], {"input": muestras})
    max_diff = max(float(np.abs(a - b).max()) for a, b in zip(ref, obt))
    coincidencia = float((ref[0].argmax(1) == obt[0].argmax(1)).mean())

    if max_diff >= TOLERANCIA or coincidencia < 1.0:
        ruta.unlink(missing_ok=True)
        raise RuntimeError(
            f"ONNX no equivale al modelo: max|diff|={max_diff:.2e} (límite {TOLERANCIA:.0e}), "
            f"coincidencia de etiquetas={coincidencia:.1%}. No se exportó nada.")

    L.escribir_json(destino / "labels.json")
    umbral = run / "thresholds.json"
    if umbral.exists():
        shutil.copy2(umbral, destino / "thresholds.json")
    met = run / "metricas.json"
    meta = {
        "run_id": run.name, "modelo": nombre,
        "arquitectura": cfg["modelo"]["arquitectura"],
        "parametros": contar_parametros(modelo),
        "bytes_onnx": ruta.stat().st_size,
        "opset": OPSET, "lado_entrada": 64,
        "verificacion": {"max_diff": max_diff, "coincidencia_etiquetas": coincidencia,
                         "n_muestras": int(len(muestras))},
        "metricas": json.loads(met.read_text(encoding="utf-8")) if met.exists() else None,
    }
    (destino / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    return meta


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Exporta a ONNX y verifica la equivalencia")
    ap.add_argument("--run", required=True)
    ap.add_argument("--destino", default="../web/public/models")
    ap.add_argument("--raiz", default="../data")
    a = ap.parse_args()
    meta = exportar(a.run, a.destino, a.raiz)
    v = meta["verificacion"]
    print(f"  {meta['modelo']}  ({meta['bytes_onnx']/1e6:.2f} MB, {meta['parametros']:,} parámetros)")
    print(f"  verificación: max|diff| {v['max_diff']:.2e} · etiquetas {v['coincidencia_etiquetas']:.1%} "
          f"sobre {v['n_muestras']} muestras")
