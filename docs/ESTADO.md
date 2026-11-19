# ESTADO del proyecto

> **Este es el archivo más importante del repositorio.** Se lee al empezar cada sesión de trabajo
> y se actualiza al terminarla. Si está desactualizado, la siguiente sesión empieza a ciegas.

**Última actualización:** 2026-11-19 (hora de Guatemala)
**Actualizado por:** sesión de datos externos (Claude + José Julián)

---

## Dónde vamos

**Fase: 0 · Cimientos — COMPLETADA**

Está listo el andamiaje: repositorio, documentación completa, estructura de carpetas, contratos
de código y plan de trabajo. **Todavía no existe una sola línea de código funcional ni una sola
imagen en el dataset.**

| Fase | Estado |
|---|---|
| 0 · Cimientos: repo, docs, contratos | ✅ Completada |
| 1 · Camino completo de punta a punta (meta: miércoles 18) | ✅ **Completada.** Imagen → preprocesamiento → ONNX → número en pantalla, verificado en un navegador real |
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
- [x] **Aplicación web completa y funcionando** (`web/`): Next.js 16 + React 19, sin Tailwind
      ni shadcn (ADR-010). Cuatro entradas (archivo, arrastrar, Ctrl+V, cámara, lienzo),
      resultado grande, barras de confianza, panel "cómo lo vio la red" con el tensor de
      64×64, historial de sesión, modo presentación con la tecla P y página `/acerca`
- [x] **`web/lib/preprocess.ts`: port del preprocesamiento, con paridad EXACTA**
      (diferencia 0,0 en los 200 fixtures, no solo por debajo de la tolerancia de 1e-4)
- [x] `npm run test:parity` y `npm run test:inference`, ambos en verde. El de paridad se
      verificó con un control negativo: al romper un percentil a propósito, falla en 120 casos
- [x] Binarios de onnxruntime servidos desde el propio sitio, no desde un CDN (ADR-011):
      la app funciona sin internet desde la segunda carga
- [x] Verificado en Chrome de verdad: carga una imagen y predice; un dibujo a mano de
      2 puntos sobre 1 barra se reconoce como 7; sin errores de consola; 10 ms de
      inferencia media, 21 ms la peor

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
4. **Despliegue en Vercel** (Jean Marco): root directory `web`, y conectar el repo.
5. **Neon** (Jean Marco): correr `scripts/esquema.sql` y poner `DATABASE_URL`. El endpoint
   `/api/predicciones` ya está escrito y responde 204 sin base de datos, así que se puede
   activar cuando sea.
6. **Dashboard `/dashboard`** (Jean Marco): lee de Neon, es lo único de la interfaz que falta.
7. **Sustituir el modelo piloto** por el de la corrida real y volver a correr los dos tests.

## Bloqueos y riesgos abiertos

| Riesgo | Estado | Responsable |
|---|---|---|
| Fotos reales insuficientes para el jueves | 🔴 53 de ~336, y es jueves. Solo José entregó; le faltan las 12 variaciones, la hoja en blanco y la mano extra. **Sin fotos de Imri no hay conjunto de prueba**: `--verificar` falla hoy con "split vacío: test" | Todos |
| Volumen de entrenamiento | 🟢 Resuelto en parte: 4 701 imágenes externas auditadas e importadas (ADR-013). No sustituyen a las fotos reales, que son lo que se evalúa | José Julián |
| Carpeta de Drive | 🟡 `ProyectoMaya/raw/externo/mayavision.zip` subido y el enlace ya está en `data/README.md`. Falta subir el árbol `raw/real/` y compartir con el equipo | José Julián |
| Equipo sin invitar al repo | 🟢 Invitados: gabrielcontreras02, jeanma0x, Jzamora09 (pendientes de aceptar) | José Julián |
| Proyecto de Vercel sin crear | 🟡 Pendiente | Jean Marco |
| Proyecto de Neon sin crear | 🟡 Pendiente | Jean Marco |
| Divergencia entre `preprocess.py` y `preprocess.ts` | 🟢 Mitigado por diseño (V1 trivial + test de paridad) | Jean Marco |
| El modelo piloto cuenta mal los puntos | 🔴 Tras arreglar los dos defectos de preprocesamiento sigue en 2 de 7 dibujos correctos. Es capacidad del modelo: 120 img/clase y 12 épocas contra 800 y 60 de la corrida real. **No se toca más hasta entrenar de verdad** | José Julián |
| El modelo piloto no rechaza ruido ni hojas en blanco | 🔴 Confirmado en el navegador: una imagen de ruido puro se reconoce como "1" con 34% de confianza. Con `tau`=0,05 ninguna de las cuatro capas dispara. **Hay que volver a evaluarlo con el modelo real**: el piloto vio 1 400 negativos, el real verá 10 000 | José Julián |
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

### 2026-11-19 · Dataset externo auditado e importado

Llegó `MayaVision_Dataset_Corregido.zip`: 5 280 PNG sintéticos de terceros. Antes de sumarlos
se auditaron, y la auditoría valió la pena.

**Lo que se revisó y qué salió.** El manifiesto que traía es internamente impecable: 0 archivos
faltantes, 0 filas donde `barras`/`puntos` no cuadren con la clase, las 19 combinaciones
presentes. Pero eso solo prueba que el CSV es coherente consigo mismo, así que se midieron las
imágenes:

- Las 19 clases válidas están bien etiquetadas. Contando componentes conexas, 4 426 de 4 560
  cuadran exactas; las 134 restantes son puntos que se tocan, no errores — verificado a ojo en
  `evidencia/dataset-externo/puntos-que-se-tocan.jpg`.
- `twenty_plus` (120 img) dibuja **un punto sobre dos barras**: un 11 válido. Lo único que lo
  separa es un hueco vertical de 0,319 del alto, idéntico en las 120, contra 0,21 de media en
  nuestros 11, 12 y 16. Lo cruza cualquiera escribiendo a mano. **Descartadas.**
- `arabic` (120 img) ocupa el 6–7% del encuadre; a 64×64 es un borrón de cuatro píxeles,
  indistinguible de un 1. **Descartadas.**
- Los negativos venían duplicados byte a byte: de 120 `too_many_dots` solo 9 son distintos;
  `zero`, 9; `empty`, 3. Y 188 formas aparecían en más de uno de **sus propios** splits.

**Qué se hizo.** Importadas 4 701 imágenes (4 560 válidas + 141 no válidas) a
`data/raw/externo/mayavision/`, con fuente `externo`. Se descartaron 240 y se deduplicaron 339.
Razonamiento completo en ADR-013.

**La regla nueva: el dato externo entrena, nunca puntúa.** Va entero a entrenamiento.
`verificar()` falla si una fila `externo` aparece en validación o prueba, y hay prueba
automática que lo comprueba. Sus near-duplicados cruzados habrían inflado cualquier métrica
calculada sobre él, y validar contra dato ajeno mide parecido con su generador, no acierto
sobre letra humana.

**Un defecto encontrado de paso.** `construir_splits()` repartía las fotos reales con `hash()`
de Python, que cambia de valor en cada proceso: el reparto train/val era distinto en cada
corrida. No causaba fuga —cada grupo seguía yendo entero a un split— pero hacía que dos
entrenamientos no fueran comparables. Cambiado a sha1 estable; verificado con cuatro
`PYTHONHASHSEED` distintos dando el mismo reparto, y con prueba automática que lo fija.

**Estado del pipeline tras el cambio:** 4 754 filas, 4 747 en entrenamiento, 7 en validación,
**0 en prueba**. Ese cero es el cuello de botella real del proyecto y no lo arregla ningún
dataset externo: hacen falta las fotos de Imri.

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

### 2026-11-18 · Dos defectos del preprocesamiento, encontrados dibujando
Más pruebas a mano destaparon dos defectos reales, los dos introducidos ese mismo día.
Ninguno lo habría encontrado una métrica: hicieron falta el panel de depuración y mirar
el tensor.

**1. La guarda de rango plano borraba los dibujos con poca tinta.** Al dibujar dos puntos,
el tensor que llegaba a la red era **completamente negro**. La guarda que se añadió para
rechazar hojas en blanco usa los percentiles 1 y 99; cuando la tinta cubre menos del 1% de
los píxeles —dos puntos en un lienzo grande, o un número pequeño en una hoja fotografiada
de lejos— los percentiles no la ven, el rango sale cero y la imagen se anula entera.
Corregido: si los percentiles no detectan nada, se reintenta con el rango completo antes
de dar la imagen por vacía. **Esto también afectaba a fotos**, no solo al lienzo.

**2. El recorte del lienzo agrandaba los números de solo puntos.** El recorte ajustado a la
caja de la tinta dejaba el glifo ocupando ~70% del encuadre. Para los números con barras da
igual, porque ahí el ancho de la tinta coincide con la unidad de referencia; pero un "2" son
dos puntos que en el entrenamiento ocupan ~19% del marco, porque la escala se deriva del
largo natural de barra aunque no haya barras. Por eso **el 2 fallaba las tres veces que se
probó, mientras el 11 acertaba con 85%**.

Corregido con un criterio, no a ojo: el lado del recorte es 18 veces el grosor del trazo.
Sale de dos restricciones medidas sobre el propio generador (una barra mide ~11 grosores y
debe ocupar ~49%; un punto dibujado mide un grosor y debe ocupar ~7%), y 18 es el punto
medio. La diferencia restante se cierra del otro lado: el generador ahora sortea el radio
del punto en `T*[0.40, 1.25]` en vez de `T*[0.55, 1.15]`, porque quien dibuja con el dedo da
un toque de un grosor de diámetro, o sea R ≈ T/2, que antes quedaba fuera del rango.

La paridad Python/TypeScript sigue exacta (0,0) tras ambos cambios.

### 2026-11-18 · Pruebas a mano: tres arreglos reales
José probó la aplicación dibujando números y falló en cuatro de cuatro. El diagnóstico dio tres
causas distintas, y dos se pudieron arreglar hoy:

1. **El modelo piloto está crudo** y cuenta mal los puntos. Dos predicciones salieron con 9% de
   confianza, que con 20 clases es prácticamente azar (5%). Esto solo lo arregla la corrida real:
   800 imágenes por clase y 60 épocas contra las 120 y 12 del piloto. **Sigue abierto.**
2. **Hueco de distribución:** el lienzo produce trazos nítidos sobre blanco puro, sin grano,
   desenfoque ni compresión. Todas las imágenes sintéticas tenían alguna degradación, así que ese
   tipo de entrada no existía en el entrenamiento. Ahora el 15% de las muestras imita el lienzo
   digital: blanco puro, trazo nítido, sin degradar. **Se nota a partir de la próxima corrida.**
3. **R3 producía falsos rechazos.** Un 13 dibujado a mano: la cabeza de clase acertó con 37,8%,
   pero la de puntos contó 2 en vez de 3 y R3 rechazó la predicción correcta. Se corrigió
   (ADR-012): R3 ahora solo dispara si las cabezas auxiliares están seguras de su desacuerdo.
   Sobre el conjunto de prueba, R3 pasó de rechazar 6 casos a 1, y las aceptadas de 27 a 32.
   El mismo dibujo del 13 ahora devuelve 13.

También se mejoró la interfaz: el lienzo **recorta automáticamente** alrededor del trazo antes de
reconocer, porque el número ocupaba como un tercio de un lienzo apaisado y al rellenar a cuadrado
quedaba por debajo del rango de ocupación del entrenamiento. Más lienzo grande, aviso visible
cuando la confianza es baja, panel de depuración abierto por defecto y botón de limpiar historial.

### 2026-11-18 · Aplicación web completa y paridad exacta del preprocesamiento
Se construyó toda la interfaz y el motor de inferencia del navegador. **El camino completo
funciona**: se carga una imagen, se preprocesa en TypeScript, corre el `.onnx` con ONNX Runtime
y aparece el número en pantalla. Verificado en un Chrome real, no solo compilando.

Lo más importante del día: **la paridad del preprocesamiento es exacta**, diferencia 0,0 en los
200 fixtures, no simplemente por debajo de la tolerancia. Python y TypeScript producen el mismo
tensor bit a bit. Para asegurarse de que el test mide algo, se corrió un control negativo:
cambiando el percentil bajo de 1,0 a 1,5 el test falla en 120 de 200 casos. La clave fue no
usar `canvas.drawImage` ni `cv2.INTER_AREA` para reescalar, sino una matriz de pesos
fraccionarios idéntica en los dos lenguajes.

Prueba de la interfaz en Chrome: se dibujó a mano en el lienzo 2 puntos sobre 1 barra y el
modelo respondió **7**, con las cabezas diciendo 1 barra y 2 puntos. Sin errores de consola.
Inferencia de 10 ms de media y 21 ms la peor, muy por debajo del presupuesto de 150 ms.

Tres defectos encontrados y corregidos al mirar la aplicación corriendo:

1. **Las barras de confianza no se rellenaban.** El `<span>` interno era `inline` y el ancho no
   se le aplica. No lo detecta ningún test automático: hay que mirar la pantalla.
2. **`public/ort/` pesaba 105 MB.** Se copiaban todos los binarios de onnxruntime. Midiendo las
   peticiones reales del navegador resultó que solo usa dos, 29,6 MB (ADR-011).
3. Los imports internos de `lib/` necesitaban extensión `.ts` explícita para que Node pudiera
   correr los tests sobre los mismos archivos que usa el navegador.

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
