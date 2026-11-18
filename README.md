# Reconocimiento de números mayas con CNN

Proyecto 02 · Inteligencia Artificial · Universidad del Valle de Guatemala, Campus Sur · 2026, II

Software que reconoce números mayas del **1 al 19** a partir de una imagen usando una red
neuronal convolucional, y que **rechaza** cualquier imagen que no sea un número maya válido
en ese rango (el cero, números ≥ 20, otros sistemas de numeración, objetos, personas, paisajes).

**Presentación: sábado 21 de noviembre de 2026, 07:00, Biblioteca.**

---

## Cómo está organizado esto

| Carpeta | Qué hay adentro |
|---|---|
| `docs/` | **Toda la documentación del proyecto.** Es la fuente de verdad. Empieza por `docs/ESTADO.md`. |
| `ml/` | Entrenamiento: generación del dataset sintético, preprocesamiento, modelo, evaluación y export a ONNX. Python + PyTorch. |
| `web/` | Aplicación Next.js que corre el modelo en el navegador con ONNX Runtime Web. Se despliega en Vercel. |
| `data/` | Dataset local. **No se versiona** (ver `data/README.md` para cómo sincronizarlo). |
| `scripts/` | Utilidades sueltas. |

## Arranque rápido

```bash
git clone https://github.com/josejulianamadogarcia10-lab/reconocimiento-numeros-mayas.git
cd reconocimiento-numeros-mayas

# 1) Lee en qué va el proyecto
cat docs/ESTADO.md

# 2) Entorno de Python (entrenamiento)
cd ml && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3) Entorno web (interfaz)
cd ../web && npm install && npm run dev
```

## Documentación

| Doc | Para qué |
|---|---|
| [`docs/EMPIEZA-AQUI.md`](docs/EMPIEZA-AQUI.md) | **Si es tu primera vez: empezá aquí.** Incluye cómo configurar tu agente. |
| [`docs/INSTRUCCIONES-FOTOS.md`](docs/INSTRUCCIONES-FOTOS.md) | **Tarea de todos.** Cómo escribir, fotografiar y entregar las imágenes. |
| [`docs/00-CONTEXTO.md`](docs/00-CONTEXTO.md) | Enunciado, restricciones y rúbrica. Lo que nos van a calificar. |
| [`docs/01-ARQUITECTURA.md`](docs/01-ARQUITECTURA.md) | Arquitectura del sistema completo. |
| [`docs/02-STACK.md`](docs/02-STACK.md) | Lenguajes y librerías, con la justificación de cada uno. |
| [`docs/03-DATASET.md`](docs/03-DATASET.md) | Taxonomía de clases, generación sintética, splits y anti-fuga. |
| [`docs/04-MODELO.md`](docs/04-MODELO.md) | Arquitectura de la CNN, estrategia de rechazo, calibración y export. |
| [`docs/05-FRONTEND.md`](docs/05-FRONTEND.md) | Especificación de la interfaz. |
| [`docs/06-DESPLIEGUE.md`](docs/06-DESPLIEGUE.md) | Vercel + Neon. |
| [`docs/07-QA-Y-EVALUACION.md`](docs/07-QA-Y-EVALUACION.md) | Métricas, criterios de aceptación y checklist de QA. |
| [`docs/08-PLAN-DE-ACCION.md`](docs/08-PLAN-DE-ACCION.md) | Plan día por día hasta el 21 de noviembre. |
| [`docs/09-PREGUNTAS-DOCENTE.md`](docs/09-PREGUNTAS-DOCENTE.md) | Banco de preguntas y respuestas. **Vale 30% de la nota.** |
| [`docs/10-PRESENTACION.md`](docs/10-PRESENTACION.md) | Guion y estructura de la exposición. |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Registro de decisiones técnicas (ADR). |
| [`docs/ESTADO.md`](docs/ESTADO.md) | **En qué vamos y qué sigue.** Se actualiza en cada sesión de trabajo. |

## Equipo

| Integrante | Responsabilidad | Es dueño de | GitHub |
|---|---|---|---|
| **José Julián Amado García** | Coordinador general · Modelo | `ml/`: entrenamiento, calibración, export a ONNX. Decide cuándo se congela el modelo | _(pendiente)_ |
| **Jean Marco Portillo Ordoñez** | Segundo coordinador · Inferencia, despliegue y QA | `web/lib/`: `preprocess.ts`, test de paridad, Vercel y Neon. Checklist de QA y simulacros | _(pendiente)_ |
| **Jorge Luis de la Rosa Zamora** | Dataset | `synth.py`, campaña de fotos, manifiesto, splits y revisión del etiquetado. Análisis de errores | _(pendiente)_ |
| **Imri Gabriel Contreras Bautista** | Interfaz y presentación | `web/`: interfaz, cámara, lienzo, dashboard. Diapositivas y material visual | _(pendiente)_ |

Jean Marco cubre a José Julián como coordinador: si uno no está, el otro decide.

> **Todos deben conocer todo el trabajo, no solo su parte.** El docente elige quién responde
> cada pregunta, y eso vale 30% de la nota. Ver [`docs/09-PREGUNTAS-DOCENTE.md`](docs/09-PREGUNTAS-DOCENTE.md).

## ¿Primera vez acá?

👉 Empezá por **[`docs/EMPIEZA-AQUI.md`](docs/EMPIEZA-AQUI.md)** — qué es esto, qué leer y en
qué orden, y cómo configurar tu agente para que trabaje con el contexto correcto.

👉 Y hacé tus fotos: **[`docs/INSTRUCCIONES-FOTOS.md`](docs/INSTRUCCIONES-FOTOS.md)**, unos 30
minutos, fecha límite **jueves 19 a mediodía**.
