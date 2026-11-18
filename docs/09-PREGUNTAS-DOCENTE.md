# 09 · Banco de preguntas del docente

**Vale 30% de la nota: más que el dataset, el modelo, el análisis de errores y la exposición
juntos (20%).** Y el docente **elige quién responde cada pregunta**, así que no sirve que cada
quien domine solo su parte.

**Cómo usar este documento:** el viernes, ronda de preguntas cruzadas. Cada integrante responde
preguntas de las áreas que **no** trabajó. Si alguien no puede responder, esa es la pregunta que
hay que estudiar, no la que ya domina.

Las respuestas de abajo son el esqueleto. Hay que decirlas con palabras propias, y los números
hay que sustituirlos por los **reales** de nuestras corridas antes del viernes.

---

## A · Conceptos de CNN

**1. ¿Qué es una convolución y por qué sirve para imágenes?**
Un kernel (una matriz pequeña de pesos) se desliza por la imagen. En cada posición se multiplican
elemento a elemento el kernel y la región debajo, y se suman: ese número es un píxel del mapa de
características. Sirve porque tiene tres propiedades que las imágenes necesitan: mira **regiones
locales** (un borde es un fenómeno local), **reutiliza los mismos pesos** en toda la imagen
(un borde es un borde esté donde esté) y **respeta la posición** de las cosas.

**2. ¿Por qué una CNN y no una red densa (MLP)?**
Una MLP aplana la imagen y trata cada píxel como independiente: no sabe que dos píxeles vecinos
tienen que ver entre sí. Consecuencias: si el número se desplaza unos píxeles, para la MLP es un
patrón completamente distinto y falla. Además, el costo de parámetros explota. Para nuestro caso:
una sola capa densa sobre 64×64 ya requeriría más de 16 millones de pesos solo en la primera capa,
mientras que nuestra primera convolución usa 320.

**3. Fórmula del tamaño de salida de una convolución.**
`O = ⌊(N − K + 2P)/S⌋ + 1`, donde N es el tamaño de entrada, K el del kernel, P el padding y S el
stride. En nuestra red usamos K=3, P=1, S=1, que da `O = N`: la convolución **no cambia el tamaño**
y quien lo reduce es el max pooling, a la mitad cada vez: 64 → 32 → 16 → 8 → 4.

**4. ¿Cuántos parámetros tiene una capa convolucional?**
`(K · K · C_entrada + 1) · C_salida`. El +1 es el bias de cada kernel. Nuestra primera capa:
`(3·3·1 + 1)·32 = 320`. La segunda: `(3·3·32 + 1)·32 = 9 248`.

**5. ¿Qué hace ReLU y por qué?**
`ReLU(z) = max(0, z)`. Deja pasar lo positivo y pone en cero lo negativo, que se interpreta como
"aquí no está el patrón". Sirve para introducir **no linealidad**: sin una función no lineal entre
capas, apilar capas lineales equivale a una sola capa lineal y la red no podría aprender nada
complejo. Frente a sigmoide o tanh, además, no satura y evita que el gradiente se desvanezca.

**6. ¿Qué hace el max pooling? ¿Cuántos parámetros tiene?**
De cada bloque de 2×2 se queda con el máximo. Reduce el tamaño a la mitad, baja el costo de
cómputo, amplía el campo receptivo de las capas siguientes y da algo de tolerancia a pequeños
desplazamientos. **Tiene cero parámetros**: es una operación fija, no se aprende.

**7. ¿Qué aprende la red en las primeras capas y en las últimas?**
Las primeras aprenden cosas simples y genéricas: bordes en distintas orientaciones, cambios de
intensidad. Las siguientes **combinan** esas respuestas en estructuras mayores. En nuestro caso,
las capas tempranas responden a bordes horizontales —las barras— y a formas redondeadas —los
puntos—, y las profundas a la configuración de cuántos hay y cómo están distribuidos.

**8. ¿Qué es el batch normalization y por qué lo usan?**
Normaliza las activaciones de cada capa dentro del lote. Estabiliza y acelera el entrenamiento,
permite tasas de aprendizaje más altas y actúa como regularizador leve. En una red de 7 capas
convolucionales como la nuestra, sin BN el entrenamiento es notablemente más lento e inestable.

**9. ¿Qué es el dropout?**
Durante el entrenamiento apaga neuronas al azar con cierta probabilidad (0.3 en nuestras capas
densas). Impide que la red dependa de neuronas específicas y la obliga a aprender representaciones
redundantes. En inferencia se desactiva: por eso hay que llamar `model.eval()` antes de predecir,
que también cambia el comportamiento de BN. Olvidarlo es un error clásico.

---

## B · Entrenamiento y evaluación

**10. ¿Por qué tres conjuntos y no dos?**
**Entrenamiento** ajusta los pesos. **Validación** se usa para tomar decisiones: cuándo parar,
qué modelo guardar, qué temperatura y qué umbrales. **Prueba** se toca una sola vez, al final,
para reportar. Si usáramos prueba para decidir algo, el número final dejaría de ser honesto:
habríamos ajustado el modelo a ese conjunto y ya no mediría generalización.

**11. ¿Qué es el sobreajuste y cómo lo detectaron?**
La red memoriza el entrenamiento en lugar de aprender a generalizar. Se detecta en las curvas:
la pérdida de entrenamiento sigue bajando mientras la de validación se estanca o sube. Ahí
interviene el early stopping. _(Mostrar la gráfica de curvas.)_

**12. ¿Qué es el early stopping y con qué paciencia?**
Se detiene el entrenamiento cuando la pérdida de **validación** no mejora durante N épocas
seguidas, y se recupera el mejor checkpoint, no el último. Nuestra paciencia es 8.

**13. ¿Qué es el data augmentation y qué transformaciones NO usaron?**
Generar variaciones artificiales de las imágenes de entrenamiento: rotaciones leves,
desplazamientos, cambios de escala, brillo, desenfoque. **No usamos volteo horizontal ni
vertical**, porque la transformación tiene que respetar el problema: voltear verticalmente pone
los puntos debajo de las barras, que es precisamente una de nuestras categorías de **rechazo**.
Enseñarle a la red que eso es lo mismo sería contraproducente.

**14. ¿Cómo garantizan que no hubo fuga de datos entre conjuntos?**
Cuatro mecanismos. **Uno:** agrupación por semilla, todas las variantes de una misma semilla del
generador van completas al mismo split. **Dos:** agrupación por toma, varias fotos de la misma
hoja no se separan. **Tres:** el conjunto de prueba son las fotos de un integrante **excluido
por completo** del entrenamiento. **Cuatro:** deduplicado por `sha256`, y el proceso falla si
encuentra un hash repetido entre conjuntos.

**15. ¿Por qué su número de prueba es creíble?**
Porque no evaluamos contra nuestras propias fotos. El conjunto de prueba es la letra de una
persona cuya mano el modelo nunca vio, lo cual es lo más parecido posible a lo que pasa hoy con
usted. Es una evaluación más dura que un split aleatorio.

**16. ¿Qué es una matriz de confusión y qué les dijo la suya?**
Una tabla donde la fila es la clase real y la columna la predicha; la diagonal son los aciertos.
La nuestra muestra que los errores no están repartidos al azar: se concentran entre números que
difieren en **un punto** —por ejemplo 13 y 14— y entre los que difieren en **una barra**. Eso nos
dijo que el problema es la resolución del conteo, no la identidad de la clase, y por eso reforzamos
el dataset con trazos gruesos y puntos pegados. _(Mostrar la matriz.)_

**17. ¿Qué es el transfer learning y lo usaron?**
Aprovechar una red ya entrenada en un problema grande —ImageNet— y adaptarla al nuestro. Las
capas tempranas ya saben detectar bordes y texturas; se congelan y se reentrena la parte final.
Sirve sobre todo cuando hay pocos datos. **Sí lo probamos:** entrenamos MobileNetV3-Small en
paralelo a nuestra CNN propia y comparamos. _(Dar los números reales y decir cuál se eligió y
por qué: exactitud, tamaño del archivo y latencia en el navegador.)_

**18. ¿Qué es el domain shift y cómo les afectó?**
Cuando los datos de producción no se parecen a los de entrenamiento. Nos afectó directo: nuestras
imágenes sintéticas son limpias y las fotos reales tienen sombras, papel con textura, trazo
irregular y perspectiva. Lo medimos: la exactitud en sintético es de _(X)_ % y en fotos reales de
_(Y)_ %. Esa brecha es el domain shift, y lo atacamos de dos maneras: aumento agresivo que imita
las condiciones reales, y una segunda etapa de entrenamiento afinando con fotos reales.

---

## C · Decisiones de este proyecto

**19. ¿Por qué 20 clases y no 19?**
Las 19 válidas más una clase `no_valido`. Es la primera de nuestras cuatro capas de rechazo: le
enseñamos a la red, con ejemplos, qué cosas **no** son un número maya, en lugar de esperar que
lo deduzca de no reconocer nada.

**20. ¿Cómo rechazan una imagen no válida?**
Cuatro capas, y basta que una dispare: **R1** la red predice directamente la clase `no_valido`;
**R2** la confianza calibrada está por debajo del umbral; **R3** inconsistencia interna, la clase
predicha no coincide con `5 × barras + puntos` según las cabezas auxiliares; **R4** el margen
entre la primera y la segunda opción es demasiado pequeño.

**21. ¿Por qué el modelo tiene tres salidas?**
Porque la estructura del problema es `valor = 5 × barras + puntos`. Una cabeza predice la clase
entre las 20, otra cuántas barras y otra cuántos puntos. Tiene tres beneficios: es aprendizaje
multitarea, que regulariza; da la verificación de consistencia de R3 gratis; y hace el modelo
explicable, porque podemos mostrar *por qué* decidió lo que decidió. _(Mostrarlo en la app.)_

**22. Pero eso de `5 × barras + puntos`, ¿no es una regla programada a mano?**
No. El clasificador es siempre la red: la clase final sale de la cabeza de clase, que es una
salida neuronal. Las cabezas de barras y puntos también son salidas de la red, aprendidas de los
datos. La aritmética solo se usa para **verificar la coherencia entre dos salidas neuronales** y,
si no concuerdan, rechazar. Si quitáramos esa verificación, el sistema seguiría funcionando: solo
rechazaría un poco peor. El reconocimiento nunca depende de una regla.

**23. ¿Cómo eligieron el umbral de rechazo?**
No a ojo, y no con F1. Lo elegimos maximizando sobre validación una utilidad que replica los pesos
de la rúbrica: `U = 0.8 · P(acertar | válida) + 0.2 · P(rechazar | no válida)`, porque reconocer
bien vale 40% y rechazar bien vale 10%. Eso da un umbral deliberadamente **bajo**: ante la duda,
el sistema prefiere arriesgar un número antes que negarse. _(Mostrar la curva de U contra τ.)_

**24. ¿Qué es calibrar y por qué lo hicieron?**
Las probabilidades que da un softmax sin calibrar son exageradamente confiadas: una red puede
decir 99% y equivocarse a menudo. Si el umbral se pone sobre un número así, no significa nada.
Aplicamos **temperature scaling**: ajustamos un único escalar T minimizando la pérdida sobre
validación, y la confianza pasa a ser `softmax(logits / T)`. Ahora cuando dice 90%, acierta cerca
del 90% de las veces.

**25. ¿Por qué 64×64 de entrada?**
Hay que distinguir 2 barras de 3 y 3 puntos de 4. A 28×28, como MNIST, tres barras apiladas con
sus separaciones ocupan muy pocos píxeles y esa distinción se vuelve frágil. 64×64 da margen sin
encarecer la inferencia, que sigue por debajo de los 150 ms en el navegador.

**26. ¿Cómo construyeron el dataset?**
Tres fuentes. **Sintética**, un generador propio que dibuja números mayas variando grosor, largo,
ondulación del trazo, color, fondo, iluminación, perspectiva y degradación: ahí está el volumen.
**Real**, fotos de los cinco integrantes escribiendo a mano los 19 números en dos estilos, con
distintas luces, distancias y papeles. **Negativos**, el cero maya, números ≥ 20, dígitos
arábigos, romanos, objetos, rostros, paisajes y garabatos.

**27. ¿Qué es la categoría `casi_valido` y por qué importa?**
Negativos que se parecen muchísimo a un número válido: cinco o seis puntos, cuatro barras, puntos
debajo de las barras, elementos dispersos. Son los más valiosos del dataset. Sin ellos la red
aprende "hay puntos y barras, entonces es un número maya" y aceptaría un 4-barras sin dudar. Con
ellos aprende la **estructura**, no solo los ingredientes.

**28. ¿Por qué el preprocesamiento es idéntico en Python y en el navegador?**
Porque si no lo fuera, el modelo recibiría en producción algo distinto de lo que vio al entrenar
y fallaría aunque sus métricas fueran excelentes. Es la regla de oro: el preprocesamiento de
entrenamiento y el de producción deben ser el mismo. Nosotros lo garantizamos con un **test
automatizado de paridad**: 200 imágenes pasan por ambas implementaciones y la diferencia máxima
debe ser menor a 1e-4. Si falla, el despliegue se bloquea.

**29. ¿Por qué el modelo corre en el navegador y no en un servidor?**
Por tres razones. Funciona **sin internet**, que era un riesgo real para esta demo. No tiene
latencia de red ni cold starts. Y no cuesta nada. El único costo es portar el preprocesamiento a
TypeScript, y ese lo pagamos una vez y lo blindamos con el test de paridad.

**30. ¿Qué es ONNX?**
Un formato estándar para representar modelos entrenados, independiente del framework. Entrenamos
en PyTorch y exportamos a ONNX; ONNX Runtime Web lo ejecuta en el navegador. Verificamos que la
exportación sea fiel corriendo 200 muestras por PyTorch y por ONNX Runtime y comprobando que la
diferencia máxima sea menor a 1e-5 y que las etiquetas coincidan al 100%.

---

## D · Preguntas incómodas (las más probables)

**31. ¿Qué pasa si le doy una imagen con dos números mayas?**
La rechaza. El enunciado declara fuera de alcance las imágenes con varias representaciones
simultáneas, así que las tratamos explícitamente como una categoría de rechazo y entrenamos la red
con ejemplos de ese caso.

**32. ¿Y si le doy un 20 o un 25?**
Los rechaza. A partir de 20 el sistema maya es posicional: son varios bloques separados
verticalmente, no un glifo del rango 1–19. Están en la categoría `mayor_19` del dataset.

**33. ¿Cuál es la principal limitación de su modelo?**
_(Responder con el dato real.)_ La fuente principal de error es _(X)_. Lo sabemos porque
analizamos todos los casos mal clasificados y los agrupamos por causa. El caso que corregimos
fue _(Y)_: la causa era _(Z)_, aplicamos _(corrección)_ y la exactitud en ese grupo pasó de _(A)_
a _(B)_. _(Esta respuesta hay que tenerla medida; es también el criterio 2 de la rúbrica.)_

**34. Si tuvieran dos semanas más, ¿qué harían?**
Tres cosas, en ese orden. Más fotos reales de más manos, que es lo que más mueve la aguja. Un
conjunto de prueba más grande, porque con pocas imágenes el intervalo de confianza de nuestro
número es amplio. Y un detector previo que localice el glifo dentro de la imagen, para manejar
fotos donde el número ocupa una fracción pequeña de la escena.

**35. ¿Por qué no usaron un modelo más grande, que daría mejor exactitud?**
Lo medimos. _(Dar los números de la comparación.)_ La diferencia en exactitud fue de _(X)_ puntos
a cambio de pasar de _(A)_ MB a _(B)_ MB de descarga y de _(C)_ a _(D)_ ms de inferencia. Para una
aplicación que debe cargar rápido y funcionar sin internet, esa diferencia no compensaba. Es una
decisión tomada con datos, no por preferencia.

**36. ¿Usaron IA generativa para hacer esto?**
Sí, el enunciado la recomienda explícitamente como apoyo al desarrollo. La usamos para acelerar
la escritura de código, la documentación y parte de los recursos. Lo que **no** hicimos, porque
está prohibido y además sería hacer trampa con nosotros mismos, es delegar el reconocimiento a un
modelo de lenguaje o a una API externa: la clasificación la hace nuestra CNN, entrenada por
nosotros con nuestro dataset, y podemos mostrar el código, las corridas y los pesos.

---

## Las tres que hay que saber de memoria

Si el tiempo alcanza para repasar poco, que sea esto:

1. **Por qué CNN y no MLP** (pregunta 2) — es la pregunta base del curso.
2. **Cómo rechazan y por qué ese umbral** (preguntas 20 y 23) — es lo propio de este proyecto.
3. **Por qué su evaluación es honesta** (preguntas 10, 14 y 15) — es lo que separa un proyecto
   serio de uno que reporta un número bonito.
