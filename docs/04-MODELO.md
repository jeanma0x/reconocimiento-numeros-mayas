# 04 · Modelo: preprocesamiento, red, rechazo y export

## Regla de oro

> **El preprocesamiento de entrenamiento y el de producción deben ser el mismo.**

Es la causa número uno de modelos que miden 99 % y fallan en la demo. Por eso el
preprocesamiento se diseña para ser **portable sin ambigüedad** a TypeScript, y hay un test
automatizado que lo verifica. Ver invariante I4 en `CLAUDE.md`.

## Preprocesamiento

### Versión 1 — determinista y trivial de portar (se implementa primero)

Entrada: una imagen cualquiera. Salida: `float32[1,1,64,64]` en `[0,1]`, tinta clara sobre
fondo oscuro.

1. **Corregir orientación EXIF.** Las fotos de celular vienen rotadas. Si esto se omite, el
   modelo recibe números acostados. Error clásico y caro.
2. **Escala de grises** con la fórmula exacta `0.299·R + 0.587·G + 0.114·B`, sin redondeos
   intermedios. Ambos lenguajes deben usar esta línea, literal.
3. **Detectar polaridad.** Media de los píxeles del marco (10 % del borde) contra la media del
   centro. Si el fondo es más claro que el contenido —papel—, se invierte. Así tanto una foto de
   tinta negra sobre papel como un trazo blanco sobre pizarrón verde llegan igual a la red.
4. **Estirar contraste** con los percentiles 1 y 99 (no mínimo y máximo, que son sensibles a un
   solo píxel quemado).
5. **Rellenar a cuadrado** con el valor de fondo, centrando. Preserva la proporción: un 19 es más
   alto que ancho y esa proporción es información.
6. **Escalar a 64×64** con promedio por bloques (*box filter*), implementado a mano en los dos
   lenguajes. No se usa `cv2.INTER_AREA` ni `canvas.drawImage`, porque no dan bit a bit lo mismo.
7. **Normalizar** a `[0,1]`.

### Versión 2 — normalización de tinta (solo si las métricas la justifican)

Se inserta entre los pasos 4 y 5. Aísla el glifo del fondo:

1. Desenfoque de caja 3×3.
2. **Umbral adaptativo** gaussiano, ventana 71, constante 7, con imagen integral (el mismo
   algoritmo es trivial de replicar en TS).
3. **Componentes conexas** por *union-find*. Se descartan los de área menor al 0,5 % del total
   (ruido, textura del papel).
4. **Filtro de cercanía.** Se toma el componente mayor, y se conservan los que estén a menos de
   1,5 veces su diagonal. Esto elimina manchas lejanas pero **conserva todos los puntos y barras**
   del glifo.
5. Recorte al rectángulo que envuelve lo que quedó, más 12 % de margen.

> **Por qué no copiamos tal cual el pipeline del notebook del curso:** ese se queda con el
> contorno **más grande** porque un dígito arábigo es una sola mancha conexa. Un número maya son
> entre 1 y 7 manchas separadas. Quedarse con la mayor convertiría cualquier número en una sola
> barra. Es, probablemente, el error más fácil de cometer en este proyecto, y es buen material
> para la presentación.

### Test de paridad (obligatorio)

`ml/tests/test_paridad_preproceso.py` genera 200 imágenes de referencia variadas, guarda sus
tensores en `ml/tests/fixtures/`, y `web` corre `npm run test:parity` contra los mismos
archivos. **Criterio: diferencia absoluta máxima < 1e-4 y predicción idéntica en los 200 casos.**
Si falla, no se despliega.

## Arquitectura de la red

CNN propia, con tres cabezas sobre un tronco compartido.

```
Entrada 1×64×64
├─ Bloque 1:  Conv3×3(1→32)  BN ReLU  ·  Conv3×3(32→32)  BN ReLU  ·  MaxPool2  → 32×32×32
├─ Bloque 2:  Conv3×3(32→64) BN ReLU  ·  Conv3×3(64→64)  BN ReLU  ·  MaxPool2  → 64×16×16
├─ Bloque 3:  Conv3×3(64→96) BN ReLU  ·  Conv3×3(96→96)  BN ReLU  ·  MaxPool2  → 96×8×8
├─ Bloque 4:  Conv3×3(96→128) BN ReLU ·  MaxPool2                              → 128×4×4
├─ AdaptiveAvgPool(3×3) → Flatten                                              → 1152
├─ Dropout(0.3) · Linear(1152→192) · ReLU · Dropout(0.3)
└─ Tres cabezas:
     clase   → Linear(192→20)   19 números + no_valido
     barras  → Linear(192→4)    0,1,2,3
     puntos  → Linear(192→5)    0,1,2,3,4
```

≈ 0,54 M parámetros, ≈ 2,1 MB en fp32. Si hiciera falta, cuantizar a int8 lo baja a ~0,6 MB.

**Por qué 64×64 y no 28×28.** Hay que distinguir 2 barras de 3 barras y 3 puntos de 4. A 28×28,
tres barras apiladas con sus separaciones ocupan pocos píxeles y la distinción se vuelve frágil.
64×64 da margen sin encarecer la inferencia.

**Por qué `AdaptiveAvgPool(3×3)` y no global.** Un *global average pooling* borra dónde estaba
cada cosa, y aquí la posición es la semántica: los puntos van **arriba**, las barras **abajo**.
Conservar una rejilla 3×3 mantiene esa noción de arriba/medio/abajo.

**Por qué tres cabezas.** Porque `valor = 5·barras + puntos` es la estructura real del problema.
La red aprende el mismo hecho por tres caminos distintos, lo que:
- actúa como regularizador (aprendizaje multitarea),
- da una **verificación de consistencia** gratis para el rechazo,
- y hace el modelo explicable: en la demo se puede mostrar *"detectó 2 barras y 3 puntos → 13"*.

> Ojo con la invariante I2: las cabezas auxiliares son salidas de la **red**, no reglas
> programadas. La regla `5·b + p` solo se usa para **verificar** la coherencia de la predicción,
> nunca como clasificador. El clasificador es siempre la cabeza `clase`.

### Pérdida

```
L = CE(clase) + 0.3 · CE(barras)·m + 0.3 · CE(puntos)·m
```

donde `m = 0` para las muestras `no_valido` (no tienen barras ni puntos definidos) y `1` para las
válidas. Label smoothing 0.05 en la cabeza de clase.

Las clases están razonablemente balanceadas por construcción; si el conteo real se desbalancea,
se usan pesos inversos a la frecuencia. Queda registrado en la corrida.

### Modelo alternativo para comparar

**MobileNetV3-Small** preentrenada en ImageNet (entrada de 1 canal replicada a 3), congelando el
tronco las primeras épocas y luego afinando todo con un learning rate bajo. Se entrena en paralelo
y se compara contra la CNN propia en: exactitud en prueba, exactitud en las fotos reales
exclusivamente, tamaño del `.onnx` y latencia en el navegador.

La comparación medida es exactamente lo que pide el criterio 1 de la rúbrica. Elegimos por
resultado, no por preferencia, y lo registramos en `DECISIONES.md`.

## Entrenamiento

| | |
|---|---|
| Optimizador | AdamW, `lr = 3e-4`, `weight_decay = 1e-4` |
| Programación | Cosine annealing con 3 épocas de calentamiento |
| Lote | 128 |
| Épocas | hasta 60, con early stopping sobre la **pérdida de validación**, paciencia 8 |
| Semilla | 42, fijada en Python, NumPy y PyTorch |
| Checkpoint | se guarda el mejor por validación, nunca el último |

**Dos etapas:**

1. **Etapa A — sintético.** Entrenar sobre el dataset sintético completo. Da un modelo que ya
   entiende la estructura de puntos y barras.
2. **Etapa B — afinado con fotos reales.** Continuar con `lr = 3e-5` sobre una mezcla de las
   fotos reales (repetidas ×10 para que pesen) y una porción del sintético. La porción sintética
   evita el olvido catastrófico: sin ella, el modelo se sobreajusta a 400 fotos y empeora.

El conjunto de prueba **no se toca** en ninguna de las dos etapas. Se usa una vez, al final.

## Estrategia de rechazo

Cuatro capas, en orden. Si cualquiera dispara, se rechaza.

| # | Mecanismo | Qué atrapa |
|---|---|---|
| R1 | `argmax(clase) == no_valido` | Lo que se parece a los negativos vistos en entrenamiento |
| R2 | Confianza calibrada `< τ` | Imágenes raras, fuera de distribución, ambiguas |
| R3 | Inconsistencia: `valor(clase) ≠ 5·barras + puntos` | Predicciones internamente contradictorias, típicas de entradas basura |
| R4 | Margen `p₁ − p₂ < m` | Casos donde la red duda entre dos números |

### Calibración

Los softmax de una red sin calibrar son exageradamente confiados: un umbral sobre ellos no
significa nada. Se aplica **temperature scaling**: se ajusta un solo escalar `T` minimizando la
NLL **sobre validación** (nunca sobre prueba), y la confianza pasa a ser `softmax(logits / T)`.
`T` se guarda en `thresholds.json` y el navegador la aplica.

### Elección de los umbrales — y por qué se inclinan a aceptar

La rúbrica no es simétrica:

- 4 reconocimientos × 10 % = **40 %** por aceptar bien.
- 2 rechazos × 5 % = **10 %** por rechazar bien.

Un falso rechazo (decir "no válido" a un número que sí era) cuesta el cuádruple que un falso
positivo. Por eso `τ` y `m` no se eligen por F1 ni por exactitud balanceada, sino maximizando
sobre validación:

```
U = 0.8 · P(acierta | imagen válida)  +  0.2 · P(rechaza | imagen no válida)
```

que son exactamente los pesos de la rúbrica. En la práctica esto da un `τ` bajo: **ante la duda,
el sistema arriesga un número en lugar de negarse.** Registrado como ADR-006.

Se reporta en la presentación la curva de `U` contra `τ` — muestra que el umbral no se eligió a
ojo, lo cual es material directo para las preguntas.

## Export a ONNX

```bash
python -m maya.export_onnx --run runs/<id>
```

1. `model.eval()`, exportar con `opset 17`, eje de lote dinámico.
2. Nombres fijos: entrada `input`; salidas `logits`, `barras`, `puntos`.
3. **Verificación obligatoria:** correr 200 muestras por PyTorch y por `onnxruntime`;
   `max |diff| < 1e-5` y 100 % de coincidencia en la etiqueta predicha. Si no, no se exporta.
4. Escribir en `web/public/models/`: `maya_cnn.onnx`, `labels.json`, `thresholds.json`,
   `metadata.json` (id de corrida, fecha, métricas, hash del dataset).
5. Registrar el tamaño del archivo y la latencia medida en el navegador.

El `.onnx` **sí se versiona en git** (es el único binario que se versiona), porque es el artefacto
que define qué se presenta.

## Análisis de errores — criterio 2 de la rúbrica (5 %)

No es un párrafo al final: es un entregable con su propio proceso.

1. `maya.evaluate` guarda **todas** las imágenes mal clasificadas en `runs/<id>/errores/`,
   con la etiqueta real, la predicha y las tres probabilidades más altas.
2. Se revisan a mano y se agrupan por causa: ¿trazo muy grueso? ¿puntos pegados que se leyeron
   como barra? ¿foto muy inclinada? ¿fondo con líneas que se confunden con barras?
3. Se escoge **al menos un caso**, se explica la causa, se implementa una corrección concreta
   (más aumento de ese tipo, más ejemplos reales de ese caso, ajuste del preprocesamiento) y se
   **vuelve a medir** para demostrar que mejoró.
4. Todo queda documentado en `docs/ESTADO.md` y pasa a la presentación con el antes y el después.

Un caso de error bien analizado y corregido, con números, vale más que décimas de exactitud.
