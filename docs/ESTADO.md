# ESTADO del proyecto

> **Este es el archivo más importante del repositorio.** Se lee al empezar cada sesión de trabajo
> y se actualiza al terminarla. Si está desactualizado, la siguiente sesión empieza a ciegas.

**Última actualización:** 2026-11-18, 20:25 (hora de Guatemala)
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
| 1 · Camino completo de punta a punta (meta: miércoles 18) | 🟡 Pipeline de ML completo y probado; falta la app web |
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
- [x] **Pipeline de ML completo e implementado**, no solo esbozado:
      `preprocess.py` (7 pasos deterministas, portables a TS), `synth.py` (generador
      con 8 fondos, iluminación, perspectiva y degradación, más 8 subclases de
      negativos), `dataset.py` (splits agrupados, manifiesto, verificación anti-fuga),
      `model.py` (CNN de 3 cabezas, 541 629 parámetros), `train.py` (dos etapas,
      early stopping), `calibrate.py` (temperatura + umbrales con la utilidad de la
      rúbrica), `evaluate.py` (métricas, desgloses y figuras), `export_onnx.py`
- [x] **99 tests automatizados en verde** (`cd ml && pytest`)
- [x] **Corrida piloto de punta a punta verificada**: 3 680 imágenes sintéticas →
      entrenamiento → calibración → evaluación → ONNX de 2,21 MB en un solo archivo,
      verificado contra PyTorch (max|diff| 3,3e-06, 100% de coincidencia en 200 muestras)
- [x] `web/public/models/` con un modelo cargable: el frontend ya puede arrancar
- [x] `ml/notebooks/entrenar_en_colab.ipynb` para la corrida real con GPU

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

**Lo siguiente en código, por orden de dependencia:**

3. **Corrida real en Colab con GPU** (`ml/notebooks/entrenar_en_colab.ipynb`): dataset
   completo (800 por clase + 10 000 negativos), etapa A, etapa B con las fotos reales,
   calibración y export. Es lo único que falta del lado del modelo.
4. **Scaffold de Next.js** y carga del `.onnx` que ya está en `web/public/models/`.
   No hace falta esperar al modelo bueno: el piloto carga y predice.
5. **`web/lib/preprocess.ts`**: port de los 7 pasos de `preprocess.py`. Generar antes
   los fixtures con `python -m maya.preprocess --fixtures tests/fixtures`.
6. **Test de paridad** `npm run test:parity` y despliegue en Vercel.

## Bloqueos y riesgos abiertos

| Riesgo | Estado | Responsable |
|---|---|---|
| Fotos reales insuficientes para el jueves | 🟡 53 de ~336. Solo José entregó; le faltan las 12 variaciones, la hoja en blanco y la mano extra | Todos |
| Carpeta de Drive sin crear | 🟢 Creada y cargada con `raw/`; falta pegar el enlace en `data/README.md` | José Julián |
| Equipo sin invitar al repo | 🟢 Invitados: gabrielcontreras02, jeanma0x, Jzamora09 (pendientes de aceptar) | José Julián |
| Proyecto de Vercel sin crear | 🟡 Pendiente | Jean Marco |
| Proyecto de Neon sin crear | 🟡 Pendiente | Jean Marco |
| Divergencia entre `preprocess.py` y `preprocess.ts` | 🟢 Mitigado por diseño (V1 trivial + test de paridad) | Jean Marco |
| El modelo no rechaza hojas en blanco (0% en el piloto) | 🟡 Mitigado a medias: guarda de rango plano en el preprocesamiento + peso de `vacio` subido de 4% a 10%. **Verificar en la corrida real** | José Julián |
| Contar puntos es más difícil que contar barras (piloto: 2–3 puntos ~50%, 0 puntos 97%) | 🟡 Esperable con 120 imágenes por clase; revisar tras la corrida completa | José Julián |

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

### 2026-11-18 · Pipeline de ML completo y probado de punta a punta
Se implementaron los ocho módulos de `ml/src/maya/` y se corrió el camino completo con un
dataset piloto reducido (3 680 imágenes, 12 épocas en CPU) para verificar que todo encaja,
no solo que compila. Resultados del piloto, que **no son los del proyecto** sino la prueba
de que la tubería funciona: exactitud global 72,1%, en válidas 66,1%, rechazo correcto 82,0%,
falso rechazo 8,7%. El ONNX salió de 2,21 MB y pasó la verificación contra PyTorch.

Tres hallazgos del piloto que cambiaron el código:

1. **El escalado por caja envolvente era incorrecto.** Normalizar el glifo a una fracción
   del lienzo convertía un "1" —que es un solo punto— en un círculo que llenaba la imagen,
   y un "13" en algo diminuto. Ahora la escala se deriva del largo natural de barra, que es
   la unidad con la que una persona escribe. 
2. **Los fondos salían con los canales invertidos**: la madera se veía azul y la cartulina
   celeste, porque el pipeline mezclaba orden BGR y RGB. Todo quedó en RGB.
3. **El rechazo de imágenes vacías era del 0%.** La causa está en el preprocesamiento: al
   estirar el contraste de una hoja en blanco, el grano del papel se amplifica hasta parecer
   trazos. Se añadió una guarda de rango plano y se subió el peso de `vacio` en la mezcla de
   negativos. Queda como riesgo abierto hasta verificarlo en la corrida real.

Nota de entorno: `download.pytorch.org` está bloqueado por el proxy; torch se instala desde
PyPI. El export a ONNX necesita `onnxscript` (ya está en `requirements.txt`) y hay que pasarle
`external_data=False`, porque el exportador nuevo de torch saca los pesos a un archivo aparte
y servir dos archivos al navegador es una fuente de fallos innecesaria.

### 2026-11-18 · Negativos de José e indexado automático
Se añadió `maya.dataset --indexar-reales`, que recorre `data/raw/real/` y reconstruye el
manifiesto: la clase sale de la carpeta, el autor del primer nivel y una carpeta `extra_<nombre>`
cuenta como persona aparte. Es idempotente, así que se corre cada vez que alguien agrega fotos.

José entregó 11 negativos más, identificados uno por uno contra su hoja de contacto y colocados
en sus subcarpetas: el 25 y el 33 en `mayor_19`; 5 puntos, 6 puntos, 4 barras, 5 barras, puntos
abajo y dispersos en `casi_valido`; dos números lado a lado en `multiples`; el 42 y un garabato
en `otros`. **Total de José: 53 fotos (38 válidas + 15 negativos).** Le falta la hoja en blanco,
las 12 variaciones de luz y fondo, y su mano extra.

La verificación anti-fuga falla a propósito con "split vacío: test", porque el conjunto de prueba
son las fotos de Imri y todavía no hay ninguna. Es el comportamiento correcto: el sistema se
niega a entrenar sin un conjunto de prueba honesto.

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
