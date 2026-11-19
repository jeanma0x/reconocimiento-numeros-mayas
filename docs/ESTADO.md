# ESTADO del proyecto

> **Este es el archivo más importante del repositorio.** Se lee al empezar cada sesión de trabajo
> y se actualiza al terminarla. Si está desactualizado, la siguiente sesión empieza a ciegas.

**Última actualización:** 2026-11-18, 18:30 (hora de Guatemala)
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
- [x] Repositorio **público**: https://github.com/josejulianamadogarcia10-lab/reconocimiento-numeros-mayas
- [x] Roles asignados a los cuatro integrantes (ver `README.md` y `08-PLAN-DE-ACCION.md`)
- [x] `docs/EMPIEZA-AQUI.md`: onboarding del equipo y configuración de su agente
- [x] `docs/INSTRUCCIONES-FOTOS.md`: protocolo completo de captura
- [x] Estructura de carpetas de captura creada en `data/raw/real/` para los cuatro

## Siguiente paso concreto

**Lo primero, y no es código:**

1. **Campaña de fotos.** Los cuatro, siguiendo `INSTRUCCIONES-FOTOS.md`. Unos 30 minutos cada
   uno, **fecha límite jueves 19 a mediodía**. Incluye conseguir una mano extra por persona.
   Es lo único que depende del tiempo de cuatro personas y por eso es lo que más riesgo tiene
   de llegar tarde.
2. **Carpeta compartida de Drive**, con la estructura de `data/raw/real/`, y pegar el enlace en
   `data/README.md`.
3. **Usuarios de GitHub** de Jorge, Imri y Jean Marco, para agregarlos como colaboradores
   (el repo es público, pero para pushear hace falta invitación).

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
| Fotos reales insuficientes para el jueves | 🟡 42 de ~336. Solo José entregó, y le faltan variedad y 13 negativos | Todos |
| Carpeta de Drive sin crear | 🔴 Abierto | José Julián |
| Equipo sin invitar al repo (faltan sus usuarios de GitHub) | 🟡 Pendiente | José Julián |
| Proyecto de Vercel sin crear | 🟡 Pendiente | Jean Marco |
| Proyecto de Neon sin crear | 🟡 Pendiente | Jean Marco |
| Divergencia entre `preprocess.py` y `preprocess.ts` | 🟢 Mitigado por diseño (V1 trivial + test de paridad) | Jean Marco |

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

### 2026-11-18 · Primeras fotos reales
José entregó 42 fotos: los 19 números en dos rondas (lapicero y marcador), más el cero maya y el
20 posicional en ambos estilos. Revisadas una por una contra hojas de contacto: **las 19 formas
están correctas** en las dos tandas y el orden de captura fue idéntico (celda 1 = cero, 2–20 =
números 1–19, celda 21 = el 20). Organizadas en `data/raw/real/jose/` y registradas en
`data/manifest.csv` con su sha256: 42 archivos, 0 duplicados.

Pendiente de esta entrega: falta variedad (todo está sobre el mismo papel rayado, con luz y
distancia parecidas) y faltan 13 de los 15 negativos. Las hojas de contacto quedaron en
`data/raw/real/jose/_hojas_contacto/` para la revisión cruzada que pide `03-DATASET.md`.

### 2026-11-17 · Cimientos
Se revisó el PDF del proyecto y el notebook de referencia del instructor
(`CNN_como_ve_una_maquina.ipynb`, PyTorch). Se creó el repositorio con la documentación completa
y las decisiones técnicas principales ya tomadas y justificadas. Hallazgo relevante del notebook:
su pipeline de preprocesamiento conserva únicamente el contorno más grande, lo cual **no sirve**
para números mayas, que son varias manchas separadas; hay que adaptarlo (ver `04-MODELO.md`).
Repositorio creado y publicado bajo la cuenta `josejulianamadogarcia10-lab`. Equipo definido:
cuatro integrantes, José Julián como coordinador y Jean Marco como segundo coordinador. Roles
repartidos y escritos en `README.md` y `08-PLAN-DE-ACCION.md`. Como somos cuatro y no cinco, el
protocolo de captura ahora pide una **mano extra por persona** (alguien externo que escriba los
19 números): así el dataset pasa de 4 a 8 letras distintas, y el conjunto de prueba se arma con
las fotos de Imri y su mano extra, que nadie que entrena el modelo habrá visto.
Siguiente sesión: fotos, carpeta de Drive e invitaciones al repo.
