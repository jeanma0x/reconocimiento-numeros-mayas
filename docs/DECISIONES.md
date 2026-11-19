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
