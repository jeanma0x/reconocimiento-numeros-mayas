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

Ajustar a la cantidad real de integrantes. Un rol = un responsable, no un ejecutor exclusivo.

| Rol | Responsable | Dueño de |
|---|---|---|
| **R1 · Coordinación y modelo** | José Julián | `ml/`, entrenamiento, calibración, export. Decide cuándo se congela el modelo |
| **R2 · Dataset** | _(asignar)_ | `synth.py`, campaña de fotos, manifiesto, verificación de splits |
| **R3 · Frontend** | _(asignar)_ | `web/`, interfaz, cámara, lienzo |
| **R4 · Inferencia y paridad** | _(asignar)_ | `preprocess.ts`, `inferencia.ts`, test de paridad, despliegue en Vercel y Neon |
| **R5 · QA y presentación** | _(asignar)_ | Checklist, simulacros, diapositivas, banco de preguntas |

**Todos**, sin excepción: aportar fotos al dataset y conocer el proyecto completo. El docente
elige quién responde cada pregunta.

---

## Martes 17 · noche — Cimientos (1 a 2 horas)

| # | Tarea | Quién |
|---|---|---|
| 0.1 | Clonar el repo, leer `README.md` y `CLAUDE.md` | Todos |
| 0.2 | Asignar los roles de la tabla de arriba y anotarlos en `README.md` | R1 |
| 0.3 | Instalar entornos: Python + `requirements.txt`, Node + `npm install` | Todos |
| 0.4 | Crear el proyecto en Vercel y en Neon, correr el esquema SQL | R4 |
| 0.5 | **Empezar la campaña de fotos esta misma noche** | Todos |

> 0.5 es lo más urgente aunque parezca lo menos técnico: es lo único que depende de que cinco
> personas hagan algo con su tiempo. El código se puede acelerar; conseguir 400 fotos de cinco
> manos distintas, no. **Cada quien: 19 números × 2 estilos + 10 negativos. Unos 20 minutos.**

---

## Miércoles 18 — Camino completo de punta a punta

**Meta del día: ver el primer número predicho en el navegador.**

| # | Tarea | Quién | Entregable |
|---|---|---|---|
| 1.1 | `labels.py` completo + tests | R1 | `pytest` en verde |
| 1.2 | `synth.py` v1: barras, puntos, fondos, ruido, rotación | R2 | 800 imágenes por clase |
| 1.3 | Negativos sintéticos: cero maya, ≥ 20, `casi_valido` | R2 | ≥ 6 000 negativos |
| 1.4 | `preprocess.py` v1 (los 7 pasos) + fixtures de referencia | R1 | 200 tensores en `ml/tests/fixtures/` |
| 1.5 | `dataset.py`: splits por grupo, manifiesto, `--verificar` | R2 | `manifest.csv` sin advertencias |
| 1.6 | `model.py` + `train.py`, primera corrida en Colab | R1 | `runs/001/` con checkpoint |
| 1.7 | `export_onnx.py` + verificación | R1 | `web/public/models/maya_cnn.onnx` |
| 1.8 | Scaffold de Next.js, carga del `.onnx`, drag and drop, resultado | R3 | app corriendo en local |
| 1.9 | `preprocess.ts` portado + `npm run test:parity` | R4 | paridad < 1e-4 |
| 1.10 | Primer despliegue en Vercel | R4 | URL pública funcionando |
| 1.11 | Recolección de fotos reales en marcha | Todos | ≥ 250 imágenes |

**Punto de control, miércoles 22:00:** ¿se carga una imagen en la URL de Vercel y sale un número?
Si la respuesta es no, el jueves empieza por ahí y todo lo demás espera.

---

## Jueves 19 — Que funcione bien

**Meta del día: ≥ 90 % en fotos reales y la interfaz completa.**

| # | Tarea | Quién |
|---|---|---|
| 2.1 | Terminar la campaña de fotos: ≥ 400 reales, 5 manos | Todos |
| 2.2 | Etiquetado revisado por dos personas distintas (hojas de contacto) | R2 + R5 |
| 2.3 | `synth.py` v2: perspectiva, iluminación, ondulación de trazo, más fondos | R2 |
| 2.4 | Entrenamiento etapa A (sintético) + etapa B (afinado con reales) | R1 |
| 2.5 | Entrenar también MobileNetV3-Small y comparar | R1 |
| 2.6 | `calibrate.py`: temperatura + búsqueda de umbrales con la utilidad de la rúbrica | R1 |
| 2.7 | `evaluate.py`: todas las métricas y figuras de `07-QA` | R1 + R5 |
| 2.8 | Cámara en vivo, lienzo de dibujo, pegar con Ctrl+V | R3 |
| 2.9 | Panel "cómo lo vio la red", historial, modo presentación | R3 |
| 2.10 | Route Handlers + Neon funcionando (sin bloquear la UI) | R4 |
| 2.11 | `/dashboard` y `/acerca` | R3 + R4 |
| 2.12 | **Simulacro 1** con una persona ajena al equipo | R5 |
| 2.13 | Esqueleto de la presentación con las figuras reales | R5 |

**Punto de control, jueves 22:00:** métricas de `07-QA` medidas y escritas en `ESTADO.md`.
Simulacro 1 corrido. Si el simulacro da menos de 11/15, el viernes es solo modelo y dataset.

---

## Viernes 20 — Endurecer, ensayar, congelar

**Meta del día: cero sorpresas posibles el sábado.**

| # | Tarea | Quién |
|---|---|---|
| 3.1 | Análisis de errores: agrupar por causa, elegir un caso, corregirlo y **volver a medir** | R1 + R5 |
| 3.2 | Reentrenar con las correcciones. **Última corrida permitida: 18:00** | R1 |
| 3.3 | Export final, despliegue final, verificar la URL de producción | R1 + R4 |
| 3.4 | Checklist manual completo de `07-QA` | R5 + todos |
| 3.5 | **Simulacro 2** con otra persona ajena. Meta ≥ 13/15 | R5 |
| 3.6 | Probar sin internet: apagar el wifi y hacer 5 predicciones | R4 |
| 3.7 | Probar en la laptop y el navegador exactos del sábado | R3 + R4 |
| 3.8 | Respaldo local (`npm run build && npm start`) en dos laptops | R4 |
| 3.9 | Presentación terminada | R5 |
| 3.10 | **Ensayo completo cronometrado**, máximo 20 minutos | Todos |
| 3.11 | Ronda de preguntas cruzadas con `09-PREGUNTAS-DOCENTE.md`: cada quien responde preguntas de las áreas que **no** trabajó | Todos |
| 3.12 | **Congelar el código.** Tag `v1.0-presentacion` en git | R1 |

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
