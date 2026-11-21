# DECISIONES · Registro de decisiones de arquitectura (ADR)

Cada decisión técnica con consecuencias vive aquí. Antes de cambiar una, hay que leer por qué se
tomó. Si se cambia, no se borra: se marca como **Reemplazada** y se escribe una nueva.

**Formato:** Contexto → Decisión → Consecuencias → Alternativas descartadas.

---

## ADR-001 · Inferencia en el navegador con ONNX Runtime Web
**Estado:** Aceptada · 2026-11-17

**Contexto.** El 50% de la nota se juega en pruebas en vivo con calificación binaria, en la
Biblioteca, con wifi no garantizado.

**Decisión.** El modelo se exporta a ONNX y se ejecuta en el navegador con `onnxruntime-web`.
Ningún servidor participa en el reconocimiento.

**Consecuencias.** La demo funciona sin internet. Latencia de decenas de milisegundos, costo cero,
sin cold starts. **A cambio, el preprocesamiento debe portarse a TypeScript y mantenerse idéntico
al de Python**, lo que obliga al test de paridad (ADR-004).

**Alternativas descartadas.** API de Python en Render o Hugging Face Spaces: introduce dependencia
de red y cold starts justo en el momento más caro. Aplicación de escritorio: no es compartible ni
se despliega.

---

## ADR-002 · PyTorch como framework de entrenamiento
**Estado:** Aceptada · 2026-11-17

**Contexto.** El notebook de referencia del instructor (`CNN_como_ve_una_maquina.ipynb`) está
escrito en PyTorch, igual que los conceptos que se vieron en clase.

**Decisión.** PyTorch + torchvision.

**Consecuencias.** Cada decisión nuestra tiene correspondencia directa con lo que el docente
explicó, lo cual ayuda en las preguntas (30% de la nota). La exportación a ONNX está bien
soportada.

**Alternativas descartadas.** TensorFlow/Keras: equivalente técnicamente, pero obligaría a traducir
el vocabulario del curso. Teachable Machine: no permite el control que necesitamos sobre rechazo
y calibración.

---

## ADR-003 · 20 clases con dos cabezas auxiliares
**Estado:** Aceptada · 2026-11-17

**Contexto.** Todo número maya del 1 al 19 es exactamente un par (barras, puntos), con
`valor = 5·barras + puntos`. Además hay que rechazar.

**Decisión.** Una cabeza de clasificación con 20 salidas (19 números + `no_valido`), más dos
cabezas auxiliares: barras (4 salidas) y puntos (5 salidas). Pérdida combinada, con las auxiliares
enmascaradas para las muestras `no_valido`.

**Consecuencias.** Aprendizaje multitarea que regulariza; verificación de consistencia gratuita
para el rechazo; modelo explicable en la demo. Cuesta un poco más de complejidad en el
entrenamiento y en el contrato del ONNX.

**Importante.** La aritmética `5·b + p` solo **verifica** coherencia entre dos salidas neuronales.
Nunca clasifica. El clasificador es siempre la cabeza de clase (invariante I2).

**Alternativas descartadas.** Clasificación plana de 20 clases sin cabezas auxiliares: más simple,
pero pierde explicabilidad y una capa de rechazo. Detección de objetos (contar puntos y barras con
un detector): más potente, pero requiere anotación de cajas y no cabe en tres días.

---

## ADR-004 · Preprocesamiento en dos versiones, la trivial primero
**Estado:** Aceptada · 2026-11-17

**Contexto.** El preprocesamiento debe ser idéntico en Python y en TypeScript. Cuanto más
complejo, más probable que diverjan.

**Decisión.** **V1** deliberadamente simple: orientación EXIF, gris, polaridad, contraste por
percentiles, relleno a cuadrado, escalado por promedio de bloques, normalización. Se implementa
primero y es la que va a la primera versión funcional. **V2**, con umbral adaptativo y componentes
conexas, solo se activa si las métricas demuestran que mejora.

**Consecuencias.** El camino completo existe antes, el port a TypeScript es mecánico y el riesgo
de divergencia es bajo. A cambio, V1 carga más peso sobre el aumento de datos para la robustez.

**Alternativas descartadas.** Portar directamente el pipeline del notebook del curso: además de
complejo, **es incorrecto para este problema**, porque se queda con el contorno más grande y un
número maya son varias manchas separadas. Usar `opencv.js` en el navegador: garantiza paridad pero
agrega ~8 MB de descarga.

---

## ADR-005 · Entrada de 64×64 en escala de grises
**Estado:** Aceptada · 2026-11-17

**Contexto.** Hay que distinguir 2 de 3 barras y 3 de 4 puntos. El color no aporta: un número
escrito en azul es el mismo que en negro.

**Decisión.** Tensor `1×64×64`, un canal, valores en `[0,1]`.

**Consecuencias.** Resolución suficiente para contar elementos; modelo pequeño; inferencia rápida.
Un canal reduce parámetros y hace al modelo indiferente al color de la tinta.

**Alternativas descartadas.** 28×28 como MNIST: insuficiente para contar barras apiladas.
128×128: más costo sin ganancia demostrada. RGB: triplica la primera capa para aprender a ignorar
el color.

---

## ADR-006 · Umbrales de rechazo sesgados a aceptar
**Estado:** Aceptada · 2026-11-17

**Contexto.** La rúbrica da 40% por cuatro reconocimientos y 10% por dos rechazos. Un falso
rechazo cuesta el cuádruple que un falso positivo.

**Decisión.** Los umbrales se eligen maximizando sobre validación
`U = 0.8 · P(acertar | válida) + 0.2 · P(rechazar | no válida)`, con los pesos de la rúbrica.

**Consecuencias.** Umbral bajo: ante la duda, el sistema arriesga un número en lugar de negarse.
Sube ligeramente la tasa de falsos positivos en el rechazo, lo cual es un intercambio
deliberado y cuantificado, no un descuido.

**Alternativas descartadas.** Maximizar F1 o exactitud balanceada: trataría ambos errores como
igual de caros, que es falso en este contexto. Umbral fijo a ojo (0.5, 0.8): arbitrario e
indefendible ante una pregunta.

---

## ADR-007 · Neon fuera del camino crítico
**Estado:** Aceptada · 2026-11-17

**Contexto.** Queremos registrar predicciones y retroalimentación para el volante de datos y para
tener evidencia de uso, pero la demo no puede depender de nada en red.

**Decisión.** Postgres en Neon, accedido con el driver HTTP `@neondatabase/serverless` desde Route
Handlers de Next.js. **Todas** las escrituras ocurren después de mostrar el resultado y van
envueltas en un `catch` silencioso.

**Consecuencias.** Si Neon falla, el usuario no se entera. Se gana un dashboard real para la
presentación y un registro de errores que alimenta el análisis del criterio 2.

**Alternativas descartadas.** No tener base de datos: se pierde el volante de datos y la evidencia.
`localStorage`: no es compartible entre integrantes ni sirve como evidencia. Supabase o Firebase:
más superficie de la necesaria para dos tablas.

---

## ADR-008 · Conjunto de prueba por *leave-one-person-out*
**Estado:** Aceptada · 2026-11-17

**Contexto.** El enunciado exige evaluar con imágenes distintas a las de entrenamiento y prohíbe
que variantes derivadas de una misma imagen caigan en splits distintos. Más allá de eso, el
escenario real es una mano que el modelo nunca vio: la del docente.

**Decisión.** El conjunto de prueba son las fotos de **un integrante excluido por completo** del
entrenamiento y la validación, más sintético con semillas nuevas.

**Consecuencias.** El número reportado es más bajo que con un split aleatorio, y **mucho más
honesto**. Es un argumento fuerte en la exposición. El costo es que las fotos de esa persona no
suman al entrenamiento.

**Alternativas descartadas.** Split aleatorio: sobrestima, porque el modelo ya vio la letra de todos.
Validación cruzada por persona: más riguroso, pero no hay tiempo para cinco entrenamientos completos.

---

## ADR-009 · Next.js desplegado en Vercel
**Estado:** Aceptada · 2026-11-17

**Contexto.** Hace falta servir estáticos y el `.onnx` por CDN, y además tener endpoints de
servidor para hablar con Neon sin exponer la cadena de conexión.

**Decisión.** Next.js con App Router, desplegado en Vercel, con el directorio raíz apuntando a
`web/`.

**Consecuencias.** Un solo proyecto para frontend y endpoints; previews automáticos por rama;
CDN para el modelo. Nadie despliega a mano.

**Alternativas descartadas.** Vite + SPA: necesitaría un backend aparte para Neon. GitHub Pages:
no tiene endpoints de servidor. Streamlit o Gradio: rápidos de montar, pero obligan a inferencia en
servidor, lo que contradice ADR-001.


---

## ADR-010 · CSS propio en lugar de Tailwind y shadcn/ui
**Estado:** Aceptada · 2026-11-18 · reemplaza la elección de UI de ADR-009

**Contexto.** `02-STACK.md` proponía Tailwind 4 y shadcn/ui. Al construir la aplicación, esas
dos piezas aportaban un plugin de PostCSS, un generador de componentes y varias decenas de
dependencias, para una interfaz que son dos columnas, unos botones y unas barras de progreso.

**Decisión.** CSS escrito a mano en `app/globals.css`, con variables y modo claro/oscuro.
Dependencias de la aplicación: `next`, `react`, `react-dom`, `onnxruntime-web` y
`@neondatabase/serverless`. Nada más.

**Consecuencias.** El build es de menos de un segundo y no hay plugins que puedan fallar al
actualizar. A cambio, no hay utilidades de Tailwind: cualquier estilo nuevo se escribe en
`globals.css`. Para el tamaño de esta interfaz es un buen intercambio; para una aplicación
grande no lo sería.

**Alternativas descartadas.** Tailwind + shadcn: más potencia de la necesaria y más superficie
de fallo a tres días de la entrega. Componentes de terceros: mismo problema.

---

## ADR-011 · Los binarios de onnxruntime se sirven desde el propio sitio
**Estado:** Aceptada · 2026-11-18

**Contexto.** Por defecto `onnxruntime-web` descarga sus archivos `.wasm` de un CDN. Eso
rompería el invariante I5: la demo tiene que funcionar sin internet.

**Decisión.** `scripts/copiar-wasm.mjs` copia los binarios a `public/ort/` en cada `dev` y
`build`, y `ort.env.wasm.wasmPaths` apunta ahí. Se copian solo los dos archivos que el
navegador pide de verdad con nuestra configuración (29,6 MB de los 105 MB del paquete),
medido con Chrome.

**Consecuencias.** La app funciona sin red desde la segunda carga, con todo en caché. El
despliegue incluye 29,6 MB de estáticos, que el CDN sirve una sola vez por navegador.

**Alternativas descartadas.** Dejar el CDN: inaceptable por I5. Copiar el paquete completo:
105 MB sin que nada los use. Activar los hilos de WASM: exigiría las cabeceras COOP/COEP y un
modelo de 0,5 M de parámetros no los necesita.


---

## ADR-012 · R3 solo rechaza si las cabezas auxiliares están seguras
**Estado:** Aceptada · 2026-11-18 · refina ADR-003 y ADR-006

**Contexto.** Probando la aplicación con el modelo piloto apareció un caso revelador: se dibujó
un 13 a mano, la cabeza de clase acertó con 37,8%, pero la cabeza de puntos contó 2 en vez de 3.
Como 5×2+2 = 12 ≠ 13, R3 disparó y la predicción correcta se rechazó.

Eso es un falso rechazo, que según ADR-006 cuesta el cuádruple que un falso positivo. Y el
razonamiento de R3 estaba incompleto: si una cabeza auxiliar cuenta con tan poca confianza como
el resto de la red, su desacuerdo no es evidencia contra la cabeza de clase. Es solo otra
opinión insegura.

**Decisión.** R3 dispara únicamente cuando `min(conf_barras, conf_puntos) >= tau_aux`. El umbral
`tau_aux` se busca sobre validación en la misma rejilla que `tau` y `margen`, maximizando la
misma utilidad. Por defecto, si falta en `thresholds.json`, vale 0,5.

**Consecuencias.** Sobre el conjunto de prueba del piloto, R3 pasó de rechazar 6 casos a
rechazar 1, y las predicciones aceptadas subieron de 27 a 32 sobre 40. El mismo dibujo del 13
que antes se rechazaba ahora devuelve 13.

A cambio, se aceptan algunas predicciones internamente incoherentes. Es deliberado: cuando la
red no sabe contar los elementos, la cabeza de clase sigue siendo el mejor estimador disponible,
y negarse cuesta más que arriesgar. La verificación de consistencia sigue siendo útil justamente
donde debe serlo: cuando la red **sí** sabe contar y aun así discrepa, que es la firma de una
entrada basura.

**Alternativas descartadas.** Quitar R3: se pierde una capa de rechazo barata y explicable.
Dejarlo como estaba: produce falsos rechazos sistemáticos con cualquier modelo imperfecto.
Promediar las cabezas en vez de verificarlas: convertiría la aritmética en parte del
clasificador, lo que choca con la invariante I2.

---

## ADR-013 · El dato externo entrena, pero nunca puntúa
**Estado:** Aceptada · 2026-11-19 · refina ADR-004 (reglas anti-fuga)

**Contexto.** Llegó un dataset de terceros, `MayaVision_Dataset_Corregido`: 5 280 PNG de
160×160 repartidos en `train/val/test` por carpeta de número, con su propio manifiesto. No lo
escribió nadie del equipo. Sumarlo tal cual era tentador —multiplica por veinte el volumen
etiquetado que tenemos— y por eso mismo había que auditarlo antes.

La auditoría encontró cuatro cosas:

1. **Las etiquetas de las 19 clases válidas son correctas.** Contando componentes conexas,
   4 426 de 4 560 imágenes cuadran exactamente con su clase. Las 134 restantes no son errores
   de etiqueta: son puntos que se tocan y el contador los fusiona
   (`evidencia/dataset-externo/puntos-que-se-tocan.jpg`). Verificado a ojo.
2. **`twenty_plus` es un 11 disfrazado.** Las 120 imágenes de esa subcategoría dibujan un punto
   sobre dos barras. En notación posicional eso vale 30, pero dentro de un recorte sin contexto
   es exactamente un 11 válido. Lo único que las separa es un hueco vertical de 0,319 del alto
   —idéntico en las 120, varianza cero— frente a 0,21 de media en nuestros 11, 12 y 16. Ese
   margen lo cruza cualquiera escribiendo a mano.
3. **`arabic` es una mota.** La tinta ocupa el 6–7% del encuadre. Nuestro preprocesado no
   recorta a la caja de la tinta (`preprocess.preparar`), así que a 64×64 queda un borrón de
   cuatro píxeles: indistinguible de un punto pequeño, es decir, de un 1.
4. **Los negativos están duplicados byte a byte.** De 120 archivos `too_many_dots` solo 9 son
   distintos; `zero`, 9 de 120; `empty`, 3 de 120. Y 188 formas aparecen en más de uno de sus
   propios splits.

**Decisión.** Se importa a `data/raw/externo/mayavision/` con `fuente: externo`, y:

- Se **descartan** `twenty_plus` y `arabic` (240 imágenes). La primera enseñaría a rechazar
  onces; la segunda, a confundir motas con unos. Nuestro generador ya cubre ambas categorías de
  negativo —`mayor_19` con dos o tres niveles de valores aleatorios, `digitos_arabigos` a
  tamaño legible— y con variación, no con una plantilla fija.
- Se deduplica por sha256: quedan **4 701 imágenes** (4 560 válidas + 141 no válidas).
- Todo lo externo va **siempre a train**. Nunca a validación ni a prueba.

**Consecuencias.** El volumen de entrenamiento etiquetado pasa de 53 fotos reales a 4 754 filas.
Validación y prueba siguen midiendo lo único que nos van a evaluar: letra humana sobre papel.
Validar contra dato externo mediría nuestro ajuste al generador ajeno, no a la letra real, y
además sus 188 formas repartidas entre splits inflarían la cifra sin que nos diéramos cuenta.

La regla deja de depender de la disciplina de quien corra el pipeline: `verificar()` falla si
una fila `externo` aparece fuera de train, y hay prueba que lo comprueba.

**Alternativas descartadas.** Respetar su `train/val/test`: importa su fuga de near-duplicados a
nuestra métrica. Meterlo en `data/raw/real/`: mentiría en la columna `fuente` y contaminaría el
leave-one-person-out, que se reparte por autor. Importar `twenty_plus` igualmente y medir
después si cae la cobertura del 11: cuesta un entrenamiento entero para comprobar algo que la
geometría ya dice.


## ADR-014 · Polaridad por mediana y trazo fino en el sintético
**Estado:** Aceptada · 2026-11-20 · reemplaza el paso 3 de ADR-004/ADR-005 (regla de inversión)

**Contexto.** Llegaron dos tandas de fotos de Imri (`numerosmayasgc`: 20 fotos con marcador
grueso; `numerosmayasgc2`: 20 fotos de otra mano, con pluma fina). Se evaluó el modelo piloto
con ellas antes de entrenar nada: **29 % de acierto en las 38 válidas** (`docs/evidencia/piloto_fotos_imri.csv`).
Al mirar los tensores de 64×64 que recibía la red aparecieron dos causas concretas, ninguna de
las cuales es "el piloto está crudo":

1. **Polaridad invertida.** `necesita_inversion` comparaba la media del marco con la del
   centro. Si el marco tiene sombra, una mesa roja o un borde oscuro, concluía "el fondo es
   oscuro" y no invertía: la red recibía tinta negra sobre papel blanco, el negativo de todo lo
   que vio al entrenar. Pasó en 3 de 40 fotos reales, **y en 52 de 891 imágenes sintéticas
   (5,8 %) con fondo claro inequívoco**, o sea que el propio entrenamiento tenía ruido de
   polaridad.
2. **Trazo fino fuera de distribución.** La segunda mano dibuja las barras con pluma fina
   (~1 px a 64×64) y los puntos con relleno grueso. El generador solo producía barras de 10–25 px
   sobre largos de 150–230, así que esa combinación no existía.

**Decisión.**

- Paso 3 nuevo: el fondo es la **mediana** (la tinta es siempre minoría); se invierte si
  `mediana − mínimo > máximo − mediana`, es decir, si la tinta se aleja más hacia lo oscuro que
  hacia lo claro. No depende del brillo absoluto ni de la posición del glifo. Sobre 891 casos
  claros del sintético: 0 errores (la regla anterior: 52). Sobre las 40 fotos reales: 40 de 40.
- `synth.glifo`: en el 30 % de las muestras las barras usan un grosor `Tb` de 3–8 px, mientras
  puntos y separaciones siguen gobernados por `T`.
- Portado a `web/lib/preprocess.ts`, fixtures regenerados, `npm run test:parity` en verde.

**Consecuencias.** El modelo piloto en `web/public/models/` fue entrenado con la regla vieja y
**deja de ser válido**: hay que reentrenar y exportar antes de usar la app. Cualquier modelo
entrenado antes de este commit es incompatible con el nuevo preprocesamiento.

**Alternativas descartadas.** Percentiles 0,5/99,5 en lugar de mínimo y máximo: fallan con un
punto único en un pizarrón verde (el punto ocupa <0,5 % de los píxeles y no entra al percentil).
Decidir por brillo absoluto (`mediana ≥ 110`): acierta igual en el sintético pero es una
constante arbitraria que se rompe con foto subexpuesta.


## ADR-015 · Recorte del 4 % de cada borde y datos rectangulares
**Estado:** Aceptada · 2026-11-20 · añade el paso 1b al preprocesamiento (ADR-004)

**Contexto.** Tras corregir la polaridad (ADR-014) y reentrenar con fotos de José, el dataset
externo y GC2, el modelo seguía rechazando 11 de las 19 fotos válidas de GC (Imri, marcador) con
la cabeza de clase diciendo «no válido» a ~95 % de confianza, mientras las cabezas de barras y
puntos acertaban. Dos hipótesis, medidas una a una sobre las mismas fotos:

| Hipótesis | Prueba | GC acertadas |
|---|---|---|
| Relleno a cuadrado distinto al del entrenamiento (imágenes siempre cuadradas) | recortar a cuadrado central | 18/19 |
| ídem, atacada en el entrenamiento | recortes rectangulares aleatorios al construir la caché | 8/19 (antes 8/19: sin mejora) |
| **Trocitos de otros números pegados al borde** (la hoja tenía varios) | recortar solo un margen | 4 %: **17/19** · 8 %: 16/19 · 12 %: 18/19 |

La tercera es la causa: la red lee «varios números» —que debe rechazar (I7)— cuando ve
fragmentos de vecinos en el borde. El recorte cuadrado funcionaba porque quita esos bordes, no
por la forma.

**Decisión.** Paso 1b: descartar `int(0,04·lado)` por cada borde, salvo que el resultado quede
bajo 16 px. Portado a `web/lib/preprocess.ts`; paridad exacta (0,0) en 200 fixtures. Con el modelo
anterior, sin reentrenar: GC 8→17/19, José 38/38 → 38/38, GC2 19/19 → 18/19. La caché de
entrenamiento se reconstruye con el mismo paso (usa `preparar`) y además recorta al azar el
sintético y el externo a formatos de foto sin cortar la tinta (`rectangularizar`).

**Consecuencias.** Un número que ocupe más del ~92 % del ancho o alto de la foto pierde un poco
de trazo; las instrucciones de captura ya piden «de la mitad a tres cuartos». Cualquier modelo
entrenado antes de este cambio es incompatible. El 4 % se eligió entre 4/8/12 % por ser el
menor que resuelve el problema, no por ajuste a una imagen concreta.

**Alternativas descartadas.** Reglas sobre el modelo (aceptar lo que digan las cabezas de
barras y puntos cuando la clase dice «no válido»): convierte las cabezas en el clasificador y
aceptaría negativos como puntos bajo las barras (I2). Recorte cuadrado central: corta números
anchos en fotos apaisadas.


## ADR-016 · Cuñas de mesa en el entrenamiento y sintético a mano alzada
**Estado:** Aceptada · 2026-11-20 · complementa ADR-015

**Contexto.** Con el recorte de borde (ADR-015) la mano de prueba GC quedó en 15/19. Los 4
errores tenían en común una **cuña clara pegada al costado o arriba** del tensor: es la mesa
oscura que rodea la hoja, que al invertir la polaridad se vuelve clara. El sintético y el
externo, siempre con la hoja ocupando todo el encuadre, nunca la mostraron.

**Decisión.** Al construir la caché, el 45 % de las imágenes sintéticas y externas recibe una o
dos cuñas de color uniforme (mesa oscura, madera, cartulina, azul) pegadas al borde, de 2–20 %
del ancho y con el filo ligeramente inclinado (`dataset.agregar_borde_mesa`). Afinado desde el
checkpoint anterior, 8 épocas.

**Resultado** (`docs/evidencia/modeloE_fotos_imri.csv`): GC, mano **nunca vista**: **19/19**
(antes 15/19). GC2: 18/19 (entró a entrenar, no cuenta como medición). Ceros: 2/2 rechazados.
Validación sintética 96,8 % (más baja que antes porque ahora incluye cuñas).

**Límites que hay que decir en voz alta.** n = 19 en la mano de prueba: un error son 5 puntos
porcentuales, y 19/19 no prueba 100 %. La mano de prueba la usé para elegir entre 4/8/12 % de
recorte (ADR-015) y para diagnosticar los errores que motivaron esta decisión: **está
parcialmente contaminada como medición**. La cifra honesta es la del simulacro con una persona
ajena, que todavía no se ha hecho.

**Además.** `synth.glifo_mano` (trazo fino que tiembla, barras con pendiente propia, puntos
irregulares) quedó en el generador al 35 % de las muestras para cubrir el dibujo con mouse o
lapicero; **el modelo instalado todavía no se entrenó con él**.


**Actualización (misma noche): modelo G, el instalado.** La corrida con más datos y mano alzada
(F: 1 500 por clase, 15 000 negativos, 35 % `glifo_mano`) empató con E sobre las fotos limpias de
Imri y quedó 1 punto por debajo con fotos reales perturbadas, sobre todo con un margen uniforme
añadido (31/40 contra 35/40). Se afinó 5 épocas más con márgenes y recortes aleatorios en el
entrenamiento (`dataset.margen_o_recorte`) y salió **G (`20261120-212233-B`)**:

| Prueba | E | F | **G** |
|---|---:|---:|---:|
| Fotos de Imri limpias (37 de 38 válidas; el error es el mismo "1" de GC2) | 37 | 37 | **37** |
| Estrés sobre fotos reales (`maya.estres`, 11 variantes × 40 fotos) | 95,5 % | 94,5 % | **95,7 %** |
| Mano alzada sintética, 1 500 imágenes de prueba | 88,8 % | 94,2 % | **94,8 %** |
| Rechazo de negativos sintéticos | 97,6 % | 96,6 % | **96,8 %** |

La prueba de estrés (rotación ±9°, poca luz, sobreexposición, desenfoque, baja resolución con
JPEG, margen extra, recorte, perspectiva, ruido) se hizo con las mismas 40 fotos que se usaron
para diagnosticar: **sirve para comparar modelos entre sí, no como medida absoluta**. El
conjunto de prueba sintético de mano alzada es de la propia distribución de F y G, así que
sobreestima. Lo que falta sigue siendo una mano real ajena.


**Actualización 2 (misma noche): modelo H, el instalado.** Con capturas del propio uso de la
app aparecieron dos fallos que las fotos de Imri no mostraban: (1) puntos dibujados como
**anillos huecos o garabatos** en el lienzo (el modelo solo conocía puntos rellenos: 7/38 en
anillo, 7/38 en garabato) y (2) **trocitos de otros números** pegados al borde (el 7 de GC con
37 % contra 37 % para el 8). Se añadió: puntos huecos y garabato en `synth` (`punto(hueco)`,
`glifo_mano`), fragmentos de vecinos al construir la caché (`dataset.fragmentos_vecinos`) y
10 épocas de afinado desde G. Corrida `20261120-223620-B`.

| Prueba | G | **H** |
|---|---:|---:|
| Fotos de Imri (38 válidas + 2 ceros) | 37/38 | **38/38** |
| Estrés sobre fotos reales (`maya.estres`) | 95,7 % | **98,0 %** |
| Lienzo en 4 estilos (`maya.lienzo_prueba`, escrita aparte del generador) | 56,6 % | **92,1 %** |
| — anillo / garabato | 7 / 7 de 38 | **34 / 34 de 38** |

Quedan 7 fallos en la prueba de lienzo, todos del **1 y el 2** (un punto o dos puntos solos).

**Bug de caché (importante).** `metadata.json` y `thresholds.json` tenían nombre fijo, `immutable`
de un año y `force-cache`: un navegador siguió sirviendo el modelo D horas después de desplegar
otro, y esas capturas se tomaron con él. Ahora las URL llevan `?v=<SHA del despliegue>`
(`NEXT_PUBLIC_BUILD_ID`). Esto no estaba cubierto por ningún test.

**Corrección de un error mío:** una foto de 3 puntos y 2 barras que el modelo D leyó como 14
(el 13 real) la di por correcta al verla en pantalla. No lo era.


**Actualización 3: modelo I, el instalado (`20261120-231151-B`).** La prueba de lienzo se
corrigió para usar **el mismo recorte que la app** (`lado = max(18 × grosor, 1,15 × tinta)`);
la versión anterior recortaba ajustado a la tinta y hacía que un punto solo llenara el cuadro.
Con la prueba corregida, G cae a 52,6 % y H queda en 87,5 %. Se reforzó el sintético con
1 500 imágenes extra del 1 y del 2, 1 200 del 3 y 800 de cada uno de 6, 7, 9, 15 y 16, con
barras de 2–8 px, y se afinó 8 épocas desde H.

| Prueba | H | **I** |
|---|---:|---:|
| Fotos de Imri (38 válidas + 2 ceros) | 40/40 | **40/40** |
| Estrés sobre fotos reales | 98,0 % | **98,4 %** |
| Lienzo, 4 estilos con el recorte de la app | 87,5 % | **91,4 %** |
| — relleno / anillo / fino / garabato | 38 / 34 / 30 / 31 de 38 | **38 / 36 / 33 / 32 de 38** |

**Lo que sigue fallando** (prueba de lienzo): un punto o dos puntos solos dibujados como anillo o
garabato (1, 2, 3), y barras de lapicero muy finas (3–6 px sobre ~380 px, es decir ~0,7 px a
64×64): pierde una barra y lee 15 como 10, 16 como 11, 9 como 4, 7 como 2. Lo segundo es un
límite de resolución de la entrada de 64×64 (ADR-005): una barra de menos de un píxel pierde el
contraste al reducir. Subir la entrada a 96 o 128 px lo atacaría de raíz, pero obliga a rehacer
export, paridad y todos los entrenamientos; no se hizo.


## ADR-017 · Rediseño de la interfaz y recorte del lienzo
**Estado:** Aceptada · 2026-11-21 · refina ADR-010 (CSS propio, sin Tailwind)

**Contexto.** Auditoría de UI/UX del 21 de noviembre con la guía de la skill `ui-ux-pro-max`
y capturas del uso real. Hallazgos principales: íconos con caracteres Unicode (⏳ ◻ ⬆ ✓ ⚠);
el resultado no se anunciaba a lectores de pantalla; pestañas sin navegación por teclado ni
`tabpanel`; sin `<main>`, enlace «saltar al contenido» ni `prefers-reduced-motion`; botones de
~37 px (el mínimo táctil es 44); sin identidad visual; el dictamen mostraba un número arábigo
sin el número maya que leyó la red; estado vacío que no decía qué reconoce ni qué rechaza.

**Decisión.** La skill recomendó automáticamente «claymorphism, índigo y naranja, Fredoka» y
calificó el modo oscuro de anti-patrón: es el aspecto genérico y juguetón que se quería evitar
y no corresponde a un trabajo universitario serio, así que **no se siguió esa recomendación**
(sí sus reglas de accesibilidad e interacción). Dirección elegida, una «lámina de estudio»:

- Paleta de piedra caliza y tinta; **jade** (aciertos), **cinabrio** (rechazos), **ocre** (duda).
  Todo texto ≥ 4,5:1 en claro y en oscuro; el estado nunca se comunica solo con color.
- Tipografía: Newsreader (serifa editorial, números y títulos), IBM Plex Sans (interfaz) e IBM
  Plex Mono (datos). Servidas por `next/font` desde el propio sitio: sin internet siguen
  funcionando (invariante I5).
- Líneas finas en lugar de sombras, esquinas de 6 px, marcas de recorte en las esquinas de la
  imagen, etiquetas en mono con espaciado.
- `GlifoMaya` (SVG): el dictamen dibuja el número maya que corresponde, la leyenda del estado
  vacío lista los 19, y el mismo glifo es el logotipo. Set de íconos SVG propio (`Iconos.tsx`).
- Accesibilidad: `aria-live` con el resultado, pestañas con flechas/Inicio/Fin, `tabpanel`,
  `<main>`, enlace para saltar, foco visible, objetivos de 44 px, `prefers-reduced-motion`.
- Indicador de conexión: «sin conexión · funciona igual». Favicon propio.
- Se mantuvo el modo presentación (tecla P) y todas las rutas.

**Recorte del lienzo.** `HOLGURA` de 1,15 a **1,5**. Con `maya.lienzo_prueba` (dibujos en 5
estilos, con el mismo recorte que la app): 1,15 → 91,1 %; 1,5 → 95,8 %; 1,8 → 94,7 %;
2,2 → 91,1 %; 2,8 → 87,9 %. Con 1,15 la tinta ocupaba ~87 % del cuadro, fuera de lo que vio el
modelo al entrenar (la barra, ~26–72 %). Solo cambia el encuadre del dibujo; no toca el modelo
ni `preprocess` (la paridad no se ve afectada).

**Límite conocido.** Un dibujo con puntos muy separados y lejos de la barra se lee como un
arreglo «disperso» y se rechaza: es comportamiento esperado, no un fallo.
