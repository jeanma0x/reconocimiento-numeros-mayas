"""Exportación a ONNX con verificación. Ver docs/04-MODELO.md.

Contrato
--------
    python -m maya.export_onnx --run runs/<id>

1. model.eval(), exportar con opset 17 y eje de lote dinámico
2. Nombres fijos: entrada `input`; salidas `logits`, `barras`, `puntos`
3. VERIFICACIÓN OBLIGATORIA: 200 muestras por PyTorch y por onnxruntime.
   max|diff| < 1e-5 y 100% de coincidencia en la etiqueta. Si no, NO se exporta.
4. Escribir en web/public/models/:
     maya_cnn.<run_id>.onnx   (nombre versionado: el caché del CDN es inmutable)
     labels.json              (generado por maya.labels)
     thresholds.json          (de maya.calibrate)
     metadata.json            (run_id, fecha, métricas, hash del dataset, tamaño, latencia)

El .onnx es el único binario que SÍ se versiona en git: es el artefacto que define qué se
presenta el sábado.
"""

from __future__ import annotations

OPSET = 17
TOLERANCIA = 1e-5
N_VERIFICACION = 200


def exportar(run: str, destino: str = "../web/public/models") -> dict:
    raise NotImplementedError


def verificar(ruta_onnx: str, modelo_torch, muestras) -> dict:
    """Devuelve {'max_diff': float, 'coincidencia_etiquetas': float}. Falla si no cumple."""
    raise NotImplementedError
