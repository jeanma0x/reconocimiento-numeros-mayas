# ml · Entrenamiento

Python + PyTorch. Todo el conocimiento del porqué está en `../docs/04-MODELO.md`.

## Instalación

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Flujo completo

```bash
python -m maya.labels                               # genera labels.json
python -m maya.synth    --config configs/default.yaml
python -m maya.dataset  --verificar                 # obligatorio antes de entrenar
python -m maya.train    --config configs/default.yaml --etapa A
python -m maya.train    --config configs/default.yaml --etapa B --desde runs/<id>
python -m maya.evaluate --run runs/<id>
python -m maya.calibrate --run runs/<id>
python -m maya.export_onnx --run runs/<id>
pytest
```

## Entrenar en Colab

El notebook de `notebooks/` clona el repo, instala dependencias y llama a los mismos módulos.
**Nada de código vive solo en Colab**: el notebook únicamente orquesta.

## Corridas

Cada entrenamiento escribe en `runs/<id>/`: `config.yaml`, `mejor.pt`, `historial.json`,
`metricas.json`, figuras y la carpeta `errores/`.

`runs/` no se versiona (es pesado), pero **ningún número de la presentación puede salir de otro
lugar que no sea un `metricas.json` real**.
