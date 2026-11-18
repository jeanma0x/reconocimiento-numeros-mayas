# ESTADO del proyecto

> **Este es el archivo más importante del repositorio.** Se lee al empezar cada sesión de trabajo
> y se actualiza al terminarla. Si está desactualizado, la siguiente sesión empieza a ciegas.

**Última actualización:** 2026-11-17, 22:30 (hora de Guatemala)
**Actualizado por:** sesión de cimientos (Claude + José Julián)

---

## Dónde vamos

**Fase: 0 · Cimientos — COMPLETADA**

Está listo el andamiaje: repositorio, documentación completa, estructura de carpetas, contratos
de código y plan de trabajo. **Todavía no existe una sola línea de código funcional ni una sola
imagen en el dataset.**

| Fase | Estado |
|---|---|
| 0 · Cimientos: repo, docs, contratos | ✅ Completada |
| 1 · Camino completo de punta a punta (meta: miércoles 18) | ⬜ No iniciada |
| 2 · Modelo bueno + interfaz completa (meta: jueves 19) | ⬜ No iniciada |
| 3 · QA, simulacros, ensayo, congelar (meta: viernes 20) | ⬜ No iniciada |
| 4 · Presentación (sábado 21, 07:00) | ⬜ |

## Lo que ya está hecho

- [x] Estructura del repositorio con `docs/`, `ml/`, `web/`, `data/`, `scripts/`
- [x] `CLAUDE.md` con el protocolo de sesión y las 8 invariantes del proyecto
- [x] Documentación completa: contexto y rúbrica, arquitectura, stack, dataset, modelo, frontend,
      despliegue, QA, plan de acción, banco de preguntas y guion de presentación
- [x] `labels.py` como fuente de verdad de las 20 clases
- [x] Contratos de los módulos de `ml/src/maya/` definidos en los stubs
- [x] `requirements.txt` y `configs/default.yaml`
- [x] Decisiones técnicas registradas en `DECISIONES.md` (ADR-001 a ADR-009)
- [x] Repositorio creado: https://github.com/josejulianamadogarcia10-lab/reconocimiento-numeros-mayas (privado)

## Siguiente paso concreto

**Lo primero, esta misma noche, y no es código:**

1. **Asignar los roles** de `08-PLAN-DE-ACCION.md` y anotarlos en `README.md`.
2. **Arrancar la campaña de fotos.** Cada integrante: los 19 números a mano en dos estilos
   (marcador y lapicero) más 10 negativos. Unos 20 minutos por persona. Es lo único que depende
   del tiempo de cinco personas y por eso es lo que más riesgo tiene de llegar tarde.

**Después, el miércoles, por orden de dependencia:**

3. `ml/src/maya/labels.py` → tests en verde (es la base de todo lo demás).
4. `ml/src/maya/synth.py` → generador sintético v1.
5. `ml/src/maya/preprocess.py` v1 → fixtures de referencia para el test de paridad.
6. `ml/src/maya/dataset.py` → splits agrupados y manifiesto.
7. `ml/src/maya/model.py` + `train.py` → primera corrida en Colab.
8. `export_onnx.py` → el primer `.onnx` en `web/public/models/`.
9. Scaffold de Next.js + `preprocess.ts` + primera predicción en el navegador.

## Bloqueos y riesgos abiertos

| Riesgo | Estado | Responsable |
|---|---|---|
| Fotos reales insuficientes para el jueves | 🔴 Abierto, 0 de 400 | Todos |
| Roles sin asignar | 🔴 Abierto | R1 |
| Equipo sin invitar al repositorio (Settings → Collaborators) | 🟡 Pendiente | R1 |
| Proyecto de Vercel sin crear | 🟡 Pendiente | R4 |
| Proyecto de Neon sin crear | 🟡 Pendiente | R4 |
| Divergencia entre `preprocess.py` y `preprocess.ts` | 🟢 Mitigado por diseño (V1 trivial + test de paridad) | R4 |

## Métricas actuales

Ninguna todavía. **Ningún número puede escribirse aquí ni en la presentación si no viene de una
corrida real guardada en `ml/runs/`.**

| Métrica | Meta | Actual |
|---|---|---|
| Exactitud global en prueba | ≥ 93 % | — |
| Exactitud en fotos reales, mano desconocida | ≥ 90 % | — |
| Falso rechazo sobre válidas | ≤ 5 % | — |
| Rechazo correcto sobre no válidas | ≥ 90 % | — |
| Tamaño del `.onnx` | < 5 MB | — |
| Latencia en el navegador | < 150 ms | — |
| Simulacro con persona ajena | ≥ 13/15 | — |

## Bitácora

### 2026-11-17 · Cimientos
Se revisó el PDF del proyecto y el notebook de referencia del instructor
(`CNN_como_ve_una_maquina.ipynb`, PyTorch). Se creó el repositorio con la documentación completa
y las decisiones técnicas principales ya tomadas y justificadas. Hallazgo relevante del notebook:
su pipeline de preprocesamiento conserva únicamente el contorno más grande, lo cual **no sirve**
para números mayas, que son varias manchas separadas; hay que adaptarlo (ver `04-MODELO.md`).
Repositorio privado creado en GitHub bajo la cuenta `josejulianamadogarcia10-lab`.
Siguiente sesión: invitar al equipo, asignar roles y arrancar la campaña de fotos.
