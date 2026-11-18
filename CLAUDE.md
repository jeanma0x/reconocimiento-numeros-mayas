# CLAUDE.md — Instrucciones para trabajo agéntico

Este archivo es lo primero que lee cualquier agente (Claude) que trabaje en este repositorio.
Los humanos del equipo también deberían leerlo una vez.

---

## 1. Protocolo de sesión (obligatorio)

**Al empezar cualquier sesión de trabajo:**

1. Lee `docs/ESTADO.md`. Dice exactamente en qué va el proyecto y cuál es el siguiente paso.
2. Lee el doc específico de la tarea que vas a hacer (ver índice en `README.md`).
3. Si la tarea toca una decisión técnica ya tomada, revisa `docs/DECISIONES.md` antes de cambiarla.

**Al terminar cualquier sesión de trabajo:**

1. Actualiza `docs/ESTADO.md`: qué se completó, qué se rompió, cuál es el siguiente paso concreto.
2. Si tomaste una decisión técnica nueva, agrégala a `docs/DECISIONES.md` con el formato ADR que ya está ahí.
3. Haz commit. Mensajes en español, formato `tipo(ámbito): descripción` (ver `CONTRIBUTING.md`).

> `docs/ESTADO.md` es el archivo más importante del repo. Si está desactualizado, la siguiente
> sesión empieza a ciegas y se repite trabajo. Actualizarlo no es opcional.

---

## 2. Invariantes — nunca romper esto

Estas reglas vienen del enunciado del curso. Romper una invalida el proyecto completo.

| # | Invariante | Por qué |
|---|---|---|
| I1 | **La clasificación la hace nuestra red neuronal entrenada por nosotros.** Prohibido delegar el reconocimiento a un LLM, a una API externa de visión o a un servicio que clasifique directamente. | Restricción explícita del enunciado. |
| I2 | **Prohibido resolver el reconocimiento solo con reglas programadas a mano** (contar contornos, medir áreas, heurísticas geométricas como clasificador final). Las reglas solo pueden usarse como *verificación de consistencia* sobre la salida de la red, nunca como el clasificador. | Restricción explícita del enunciado. |
| I3 | **El orden de las clases se define únicamente en `ml/src/maya/labels.py`.** Python, TypeScript y el `.onnx` leen de ahí. Nadie escribe un arreglo de etiquetas a mano en otro archivo. | Un desajuste de orden hace que el modelo prediga 7 y la UI muestre 12. Es el bug más caro y más silencioso posible. |
| I4 | **El preprocesamiento de entrenamiento y el del navegador deben producir el mismo tensor.** Cualquier cambio en uno obliga a cambiar el otro y a volver a correr el test de paridad (`ml/tests/test_paridad_preproceso.py`). | "El preprocesamiento de entrenamiento y de producción debe ser el mismo." Si divergen, el modelo falla en vivo aunque las métricas sean excelentes. |
| I5 | **La demo debe funcionar sin internet.** Inferencia 100% en el navegador. Ninguna función de la demo puede depender de la base de datos, de la red ni de un servidor. | El wifi de la Biblioteca es un riesgo real y la calificación de las pruebas en vivo es binaria. |
| I6 | **Ninguna imagen ni variante derivada de ella puede estar en dos splits distintos.** | Restricción del enunciado y requisito de una evaluación honesta. |
| I7 | **Una imagen válida contiene una sola representación de un número del 1 al 19.** Imágenes con varios números simultáneos están fuera de alcance: se rechazan. | Restricción del enunciado. |
| I8 | **Durante las pruebas del docente no se toca el código, no se reentrena, no se ajusta nada.** | Restricción del enunciado. El `main` del sábado por la mañana es el que se presenta. |

---

## 3. Dónde vive cada cosa

```
docs/          Documentación. Fuente de verdad. Se actualiza junto con el código.
ml/src/maya/   Código de entrenamiento (Python / PyTorch).
  labels.py        Taxonomía de clases. FUENTE DE VERDAD de las etiquetas.
  preprocess.py    Pipeline de preprocesamiento (referencia para el port a TypeScript).
  synth.py         Generador de dataset sintético.
  dataset.py       Datasets y splits de PyTorch.
  model.py         Definición de la CNN.
  train.py         Ciclo de entrenamiento.
  evaluate.py      Métricas, matriz de confusión, análisis de errores.
  calibrate.py     Temperature scaling y búsqueda de umbrales de rechazo.
  export_onnx.py   Exportación a ONNX + verificación de equivalencia.
ml/configs/    Hiperparámetros en YAML. No hardcodear valores en el código.
ml/tests/      Tests. Incluye el test de paridad de preprocesamiento.
web/           App Next.js. Corre el .onnx con ONNX Runtime Web.
  public/models/   Aquí vive el modelo que se sirve al navegador.
  lib/preprocess.ts  Port TypeScript de ml/src/maya/preprocess.py
data/          Dataset local. NO se versiona.
```

---

## 4. Cómo trabajar en este repo

- **Documento primero, código después.** Si vas a implementar algo que el doc no describe,
  primero actualiza el doc; así el resto del equipo y la siguiente sesión entienden el porqué.
- **Incremental y verificable.** Prefiere un camino completo que funcione de punta a punta
  (aunque sea mediocre) antes que una pieza perfecta y aislada. El riesgo del proyecto está en
  la integración, no en la exactitud del modelo.
- **No inventes números.** Toda métrica que aparezca en un doc o en la presentación tiene que
  venir de una corrida real guardada en `ml/runs/`. Si no corriste el experimento, no reportes
  el resultado.
- **Cambios acotados.** Un commit = un cambio con sentido. Nada de commits gigantes que tocan
  dataset, modelo y UI a la vez.
- **Cuando algo esté ambiguo, pregunta al equipo** en lugar de elegir por tu cuenta. Las
  decisiones que ya se tomaron están en `docs/DECISIONES.md` justamente para no re-litigarlas.

## 5. Comandos frecuentes

```bash
# Entrenamiento (desde ml/)
python -m maya.synth --config configs/default.yaml      # generar dataset sintético
python -m maya.train --config configs/default.yaml      # entrenar
python -m maya.evaluate --run runs/<id>                 # métricas + matriz de confusión
python -m maya.calibrate --run runs/<id>                # temperatura + umbrales
python -m maya.export_onnx --run runs/<id>              # exportar a web/public/models/
pytest                                                   # tests, incluye paridad

# Web (desde web/)
npm run dev        # desarrollo
npm run build      # build de producción (lo mismo que corre Vercel)
npm run test:parity  # compara preproceso TS contra los tensores de referencia de Python
```

## 6. Criterio de "terminado"

Una tarea no está terminada hasta que:

- [ ] El código corre sin errores desde cero (clonar → instalar → ejecutar).
- [ ] Hay un test o una evidencia reproducible de que funciona.
- [ ] `docs/ESTADO.md` está actualizado.
- [ ] Está commiteada y pusheada.
