# 11 · Plan final: del viernes 20 por la noche al sábado 07:00

Escrito el **viernes 20 de noviembre, tarde**. Reemplaza al calendario de `08-PLAN-DE-ACCION.md`,
que ya está atrasado respecto a la realidad. No inventa números: lo medido está en `ESTADO.md`.

## 1. Qué vale cada cosa (rúbrica del PDF, sobre 100 → 30 puntos)

| Criterio | Peso | Quién lo decide | Qué lo respalda |
|---|---:|---|---|
| 1 · Dataset, modelo y evaluación | 10 | rúbrica gradual | `03-DATASET`, `04-MODELO`, métricas de `ml/runs/` |
| 2 · Análisis de errores | 5 | rúbrica gradual | **ya hay un caso real y medido**: ADR-014 (polaridad + trazo fino) |
| 3 · Exposición y material | 5 | rúbrica gradual | diapositivas + `/acerca` + `/dashboard` |
| 4.1–4.4 · Cuatro números del docente | 40 | **binario por imagen** | el modelo, sin tocar nada en vivo |
| 5.1–5.2 · Dos rechazos del docente | 10 | **binario por imagen** | el rechazo del modelo |
| 6 · Tres preguntas | 30 | el docente elige quién responde | **los cuatro** saben todo (`09-PREGUNTAS-DOCENTE.md`) |

Lectura: **50 % depende del modelo en vivo, 30 % de que cualquiera de ustedes responda, 20 % de
lo que se muestra.** Las preguntas valen más que todo el reconocimiento de números. Esta noche
se dedica a las dos primeras filas del modelo, y mañana a las preguntas.

Penalizaciones que no se negocian: interfaz fea o inservible **−5**; llegar tarde **−5 individual**;
no asistir **0**.

## 2. Dónde estamos de verdad (viernes)

| Pieza | Estado |
|---|---|
| Pipeline de ML, 104 tests | ✅ |
| App web (archivo, arrastrar, pegar, cámara, lienzo, historial, `P`, `/acerca`) | ✅ |
| `/dashboard` | ✅ escrito hoy; se activa al poner `DATABASE_URL` |
| Paridad Python↔TypeScript | ✅ tras el cambio de hoy |
| **Modelo en `web/public/models/`** | 🔴 **es el piloto, 29 % sobre fotos reales, y entrenado con el preprocesamiento viejo: no usarlo** |
| Fotos reales | 🟡 Imri (40) en este repo; José (53) y el dataset externo (4 701) están solo en Drive |
| Vercel / Neon | ⬜ pendientes (Jean) |
| Simulacro con persona ajena | ⬜ |
| Diapositivas | ⬜ |

El hallazgo de hoy cambia el plan: el modelo piloto no fallaba por estar «crudo» sino por un
bug de polaridad en el preprocesamiento (ADR-014). Reentrenar con el arreglo es lo que más sube
la nota esta noche.

## 3. Cronograma

Horas aproximadas; lo que importa es el orden y las **compuertas** (⛔).

### Esta tarde-noche (viernes)

| # | Tarea | Quién | Hecho cuando |
|---|---|---|---|
| 1 | Entrenamiento A con el preprocesamiento corregido (corre en la Mac, ~70 min) | Claude/Jean | `ml/runs/<id>-A/` |
| 2 | Bajar de Drive `raw/externo/mayavision/` y las fotos de José a `data/raw/` (ver §4) | Jean | `--comprobar-archivos` en verde |
| 3 | Etapa B + calibración + evaluación sobre GC (la mano que el modelo no vio) | Claude/Jean | métricas en `ESTADO.md` |
| 4 | Exportar ONNX a `web/public/models/`, `npm run test:parity` y `test:inference` | Jean | ambos en verde |
| 5 | Probar la app **a mano** con las 40 fotos de Imri y con papel propio | Jean | tabla acierto/fallo |
| 6 | Vercel (root `web`) y Neon (`scripts/esquema.sql`, `DATABASE_URL`) | Jean | URL pública responde |
| ⛔ A | **¿≥ 85 % sobre GC y rechazo ≥ 85 % sobre negativos reales?** Sí → seguir. No → ver §5 | José + Jean | decidir antes de las 22:00 |
| 7 | **Simulacro 1** con persona ajena: 10 números + 5 inválidos, sin tocar nada | Jean | puntaje X/15 anotado |
| 8 | Reentrenar **final** con todas las manos (incluida GC) si el ⛔ A pasó | José | modelo final exportado |
| ⛔ B | **CONGELAR a las 23:00.** `git tag v1.0-presentacion`. Después de esto no se toca código ni modelo | José | tag creado |

### Viernes 23:00 → sábado 05:00

| # | Tarea | Quién |
|---|---|---|
| 9 | **Simulacro 2** con otra persona ajena (sin tocar código; si falla, se anota y se cuenta como límite) | Jean |
| 10 | Apagar el wifi y hacer 5 predicciones con la URL de producción **y** con `npm run build && npm start` | Jean |
| 11 | Diapositivas con las figuras reales de `ml/runs/` (ver `10-PRESENTACION.md`) | Imri |
| 12 | Cada quien responde en voz alta las preguntas de áreas que **no** trabajó (`09-PREGUNTAS-DOCENTE.md`) | Todos |
| 13 | Dormir. Una persona cansada pierde 5 puntos llegando tarde | Todos |

### Sábado

| Hora | Qué |
|---|---|
| 05:45 | Salir |
| 06:30 | En la Biblioteca: proyector, abrir app, una predicción de prueba |
| 06:50 | Respaldos abiertos (local, segunda laptop, diapositivas en USB) |
| 07:00 | Presentar: ≤ 20 min de exposición, demo, pruebas del docente. **Sin tocar nada** (I8) |

## 4. Traer los datos que faltan (Jean, ~10 min)

La Mac de Jean solo tiene las fotos de Imri y lo sintético, que se regenera. Faltan las fotos de
José y el dataset externo, que están en Drive
(https://drive.google.com/drive/folders/1MQEUrVd-QbR_O75I8-tzea5K0Xa_tl4X; pedir acceso a José).
Con ellos el modelo ve ~4 700 imágenes más y manos reales distintas.

```bash
# 1) Poner en data/raw/: real/jose/..., real/jorge/... (si ya están) y externo/mayavision/
cd ml
export PYTHONPATH=src
../.venv/bin/python -m maya.dataset --raiz ../data --indexar-reales --indexar-externos
../.venv/bin/python -m maya.dataset --raiz ../data --construir-splits --autor-prueba imri
../.venv/bin/python -m maya.dataset --raiz ../data --comprobar-archivos
../.venv/bin/python -m maya.synth --config configs/default.yaml     # ~90 s
../.venv/bin/python -m maya.dataset --raiz ../data --cache
../.venv/bin/python -m maya.train --config configs/default.yaml --etapa A
# etapa B desde el run de A:  --etapa B --desde runs/<id-A>
```

⚠ `--indexar-reales` **reconstruye** `data/manifest.csv` desde lo que haya en disco: si falta la
carpeta de José, su fila desaparece del manifiesto. Por eso hoy se entrenó con una raíz aparte
(`ml/data_local/`, ignorada por git) y el manifiesto versionado no se tocó.

## 5. Si el ⛔ A no pasa (plan B, en este orden)

Siempre con evidencia, nunca a ojo:

1. `python -m maya.evaluar_fotos` sobre GC, y mirar **por qué** falla cada error (tensor de
   64×64 en el panel «cómo lo vio la red»). Hoy así se encontró la polaridad.
2. Si falla contar **puntos**: más épocas o más datos de puntos antes que cambiar de modelo.
3. Si falla el **rechazo**: bajar `tau` solo si la utilidad de la rúbrica lo respalda
   (80 % reconocer / 20 % rechazar); un falso rechazo cuesta cuatro veces más que un falso acierto.
4. Si nada alcanza antes de las 22:00: presentar el mejor modelo medido y **explicar el límite**.
   El criterio 2 (análisis de errores, 5 %) premia justo eso; mentir en la demo no.

## 6. Lo que NO hay que hacer esta noche

- Cambiar el preprocesamiento otra vez sin correr `test:parity` (I4).
- Meter fotos del simulacro al entrenamiento: dejarían de medir algo.
- Reportar cualquier métrica que no esté en `ml/runs/` (regla del repo).
- Tocar código o reentrenar después de las 23:00 ni durante la prueba del docente.

## 7. Material de la exposición que ya existe

- Hallazgo ADR-014 como **el caso de error** pedido por el enunciado, con medición antes y después:
  `docs/evidencia/analisis-datasets-imri.md`, `evidencia/imri/tensores-piloto-polaridad.png`.
- `/acerca` (arquitectura, tabla de números, métricas del modelo en producción).
- `/dashboard` (predicciones registradas, tasa de rechazo, latencia).
- Modo presentación con la tecla `P`.
