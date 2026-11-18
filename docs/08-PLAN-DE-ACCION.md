# 08 · Plan de acción

**Hoy es martes 17 de noviembre de 2026. La presentación es el sábado 21 a las 07:00.**
Quedan tres días completos de trabajo y la madrugada del sábado.

## La idea que ordena todo el plan

> **El miércoles por la noche tiene que existir el camino completo funcionando, aunque sea malo.**

Imagen → preprocesamiento → modelo entrenado → ONNX → navegador → número en pantalla.
Aunque el modelo acierte el 60 %. Aunque la interfaz sea fea.

Si el camino completo existe el miércoles, el jueves y el viernes se dedican a **mejorar**, que
es trabajo acotado y medible. Si no existe, el viernes se dedica a **integrar**, que es trabajo
de duración desconocida, y ahí es donde los proyectos se pierden. El riesgo de este proyecto está
en la integración, no en la exactitud.

## Roles

Somos cuatro. Un rol = un responsable, no un ejecutor exclusivo.

| Rol | Responsable | Dueño de |
|---|---|---|
| **R1 · Coordinación y modelo** | **José Julián** | `ml/`: entrenamiento, calibración, export. Decide cuándo se congela el modelo |
| **R2 · Inferencia, despliegue y QA** | **Jean Marco** | `preprocess.ts`, `inferencia.ts`, test de paridad, Vercel y Neon. Checklist y simulacros. **Segundo coordinador** |
| **R3 · Dataset** | **Jorge Luis** | `synth.py`, campaña de fotos, manifiesto, splits, revisión del etiquetado, análisis de errores |
| **R4 · Interfaz y presentación** | **Imri Gabriel** | `web/`: interfaz, cámara, lienzo, dashboard. Diapositivas y material visual |

Jean Marco cubre a José Julián como coordinador: si uno no está, el otro decide y el proyecto
no se detiene.

**Todos**, sin excepción: hacer sus fotos (`INSTRUCCIONES-FOTOS.md`), conseguir una mano extra y
conocer el proyecto completo. El docente elige quién responde cada pregunta.

---

## Martes 17 · noche — Cimientos (1 a 2 horas)

| # | Tarea | Quién |
|---|---|---|
| 0.1 | Clonar el repo, leer `README.md` y `CLAUDE.md` | Todos |
| 0.2 | Mandar el usuario de GitHub a José Julián para que los agregue como colaboradores | Todos |
| 0.3 | Instalar entornos: Python + `requirements.txt`, Node + `npm install` | Todos |
| 0.4 | Crear el proyecto en Vercel y en Neon, correr el esquema SQL | Jean Marco |
| 0.5 | **Empezar la campaña de fotos esta misma noche** | Todos |

> 0.5 es lo más urgente aunque parezca lo menos técnico: es lo único que depende de que cuatro
> personas hagan algo con su tiempo. El código se puede acelerar; conseguir fotos de ocho manos
> distintas, no. **Protocolo completo en `INSTRUCCIONES-FOTOS.md`: unos 30 minutos cada uno,
> fecha límite jueves 19 a mediodía.**

---

## Miércoles 18 — Camino completo de punta a punta

**Meta del día: ver el primer número predicho en el navegador.**

| # | Tarea | Quién | Entregable |
|---|---|---|---|
| 1.1 | `labels.py` completo + tests | José Julián | `pytest` en verde |
| 1.2 | `synth.py` v1: barras, puntos, fondos, ruido, rotación | Jorge Luis | 800 imágenes por clase |
| 1.3 | Negativos sintéticos: cero maya, ≥ 20, `casi_valido` | Jorge Luis | ≥ 6 000 negativos |
| 1.4 | `preprocess.py` v1 (los 7 pasos) + fixtures de referencia | José Julián | 200 tensores en `ml/tests/fixtures/` |
| 1.5 | `dataset.py`: splits por grupo, manifiesto, `--verificar` | Jorge Luis | `manifest.csv` sin advertencias |
| 1.6 | `model.py` + `train.py`, primera corrida en Colab | José Julián | `runs/001/` con checkpoint |
| 1.7 | `export_onnx.py` + verificación | José Julián | `web/public/models/maya_cnn.onnx` |
| 1.8 | Scaffold de Next.js, carga del `.onnx`, drag and drop, resultado | Imri | app corriendo en local |
| 1.9 | `preprocess.ts` portado + `npm run test:parity` | Jean Marco | paridad < 1e-4 |
| 1.10 | Primer despliegue en Vercel | Jean Marco | URL pública funcionando |
| 1.11 | Recolección de fotos reales en marcha | Todos | ≥ 150 imágenes |

**Punto de control, miércoles 22:00:** ¿se carga una imagen en la URL de Vercel y sale un número?
Si la respuesta es no, el jueves empieza por ahí y todo lo demás espera.

---

## Jueves 19 — Que funcione bien

**Meta del día: ≥ 90 % en fotos reales y la interfaz completa.**

| # | Tarea | Quién |
|---|---|---|
| 2.1 | Terminar la campaña de fotos: ≥ 400 reales, 5 manos | Todos |
| 2.2 | Etiquetado revisado por dos personas distintas (hojas de contacto) | Jorge Luis + Imri |
| 2.3 | `synth.py` v2: perspectiva, iluminación, ondulación de trazo, más fondos | Jorge Luis |
| 2.4 | Entrenamiento etapa A (sintético) + etapa B (afinado con reales) | José Julián |
| 2.5 | Entrenar también MobileNetV3-Small y comparar | José Julián |
| 2.6 | `calibrate.py`: temperatura + búsqueda de umbrales con la utilidad de la rúbrica | José Julián |
| 2.7 | `evaluate.py`: todas las métricas y figuras de `07-QA` | José Julián + Jorge Luis |
| 2.8 | Cámara en vivo, lienzo de dibujo, pegar con Ctrl+V | Imri |
| 2.9 | Panel "cómo lo vio la red", historial, modo presentación | Imri |
| 2.10 | Route Handlers + Neon funcionando (sin bloquear la UI) | Jean Marco |
| 2.11 | `/dashboard` y `/acerca` | Imri + Jean Marco |
| 2.12 | **Simulacro 1** con una persona ajena al equipo | Jean Marco |
| 2.13 | Esqueleto de la presentación con las figuras reales | Imri |

**Punto de control, jueves 22:00:** métricas de `07-QA` medidas y escritas en `ESTADO.md`.
Simulacro 1 corrido. Si el simulacro da menos de 11/15, el viernes es solo modelo y dataset.

---

## Viernes 20 — Endurecer, ensayar, congelar

**Meta del día: cero sorpresas posibles el sábado.**

| # | Tarea | Quién |
|---|---|---|
| 3.1 | Análisis de errores: agrupar por causa, elegir un caso, corregirlo y **volver a medir** | José Julián + Jorge Luis |
| 3.2 | Reentrenar con las correcciones. **Última corrida permitida: 18:00** | José Julián |
| 3.3 | Export final, despliegue final, verificar la URL de producción | José Julián + Jean Marco |
| 3.4 | Checklist manual completo de `07-QA` | Jean Marco + todos |
| 3.5 | **Simulacro 2** con otra persona ajena. Meta ≥ 13/15 | Jean Marco |
| 3.6 | Probar sin internet: apagar el wifi y hacer 5 predicciones | Jean Marco |
| 3.7 | Probar en la laptop y el navegador exactos del sábado | Imri + Jean Marco |
| 3.8 | Respaldo local (`npm run build && npm start`) en dos laptops | Jean Marco |
| 3.9 | Presentación terminada | Imri |
| 3.10 | **Ensayo completo cronometrado**, máximo 20 minutos | Todos |
| 3.11 | Ronda de preguntas cruzadas con `09-PREGUNTAS-DOCENTE.md`: cada quien responde preguntas de las áreas que **no** trabajó | Todos |
| 3.12 | **Congelar el código.** Tag `v1.0-presentacion` en git | José Julián |

**Punto de control, viernes 22:00:** código congelado, simulacro ≥ 13/15, todos respondieron
preguntas de áreas ajenas. **No se programa nada después de esta hora.** Un cambio de última
hora sin probar es el riesgo más grande que existe a estas alturas.

---

## Sábado 21 — Presentación

| Hora | Qué |
|---|---|
| 05:45 | Salir. Llegar tarde resta 5 puntos individuales |
| 06:30 | En la Biblioteca. Montar, probar proyector, abrir la app, hacer una predicción de prueba |
| 06:50 | Abrir respaldos: local corriendo, segunda laptop encendida, presentación en USB |
| 07:00 | Inicio |
| | Exposición (ver `10-PRESENTACION.md`), demo, pruebas del docente, preguntas |

**Durante las pruebas del docente: no se toca el código, no se reentrena, no se ajusta nada.**

---

## Ruta crítica

```
fotos reales ──────────────┐
                           ├──► entrenamiento ──► calibración ──► ONNX ──► paridad ──► demo
synth.py ──► dataset ──────┘                                                  ▲
                                                                              │
preprocess.py ──► preprocess.ts ──────────────────────────────────────────────┘
```

Lo que de verdad puede hundir el proyecto, en orden:

1. **No tener suficientes fotos reales a tiempo.** Depende de personas, no de código. Por eso
   arranca esta noche.
2. **Que `preprocess.py` y `preprocess.ts` diverjan.** Métricas perfectas, demo fallida. Por eso
   hay test de paridad desde el miércoles, no desde el viernes.
3. **Dejar la integración para el final.** Por eso el camino completo es la meta del miércoles.

## Qué NO vamos a hacer

Decisiones de alcance tomadas a propósito, para no perder el tiempo:

- Detección de múltiples números en una imagen (el enunciado lo declara fuera de alcance).
- Reconocimiento de números mayas ≥ 20 (se rechazan).
- Autenticación de usuarios en la app.
- App móvil nativa (la web responsiva basta).
- Búsqueda exhaustiva de hiperparámetros. El dataset rinde mucho más por hora invertida.
- Perseguir décimas de exactitud en validación. Ese criterio vale 10 %; las preguntas valen 30 %.
