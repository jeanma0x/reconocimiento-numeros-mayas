# Análisis de los dos datasets de Imri (20 de noviembre)

Dos carpetas de fotos llegaron el viernes 20: `numerosmayasgc` y `numerosmayasgc2`.
Este documento dice qué traen, cómo se etiquetaron, qué le hicieron al modelo piloto y qué
descubrieron. Los números salen de `piloto_fotos_imri.csv`, generado con
`python -m maya.evaluar_fotos` (reproducible).

## Qué traen

| | `numerosmayasgc` (GC) | `numerosmayasgc2` (GC2) |
|---|---|---|
| Fotos | 20 | 20 |
| Contenido | 1–19 + un cero maya | 1–19 + un cero maya |
| Instrumento | marcador grueso | **pluma fina**: barras casi de 1 px, puntos rellenos a garabato |
| Fondo | hoja blanca con sombras, una con mesa roja al borde | papel gris uniforme |
| Tamaño | 1280–1600 px | 450–800 px (recomprimidas por WhatsApp) |
| Orden de captura | desordenado (1, 0, 3, 4, 2, 6…) | secuencial (0, 1, 2 … 19) |
| Negativos | solo el cero | solo el cero |

Las dos son completas: **cubren las 19 clases válidas**, una foto por clase y por mano.
Total: 38 válidas + 2 ceros. No traen ningún otro negativo (20, 25, 5 puntos, 4 barras,
dígitos arábigos, hoja en blanco…), así que **no sirven para medir el rechazo más allá del cero**.

Se asumió que GC es la mano de Imri y GC2 su mano extra (así lo prevé `INSTRUCCIONES-FOTOS.md`:
«el conjunto de prueba se arma con las fotos de Imri y su mano extra»). Quedaron en
`data/raw/real/imri/` y `data/raw/real/imri/extra_gc2/`. **Si GC2 es otra persona o la misma,
confirmarlo con Imri**: cambia cómo se cuentan las manos distintas, no el etiquetado.

## Etiquetado y verificación

Cada foto se etiquetó mirándola (hojas de contacto en `docs/evidencia/imri/hoja-*.jpg`), no por
el nombre del archivo. Se contó a ojo puntos y barras de las 40 y se comprobó contra
`valor = 5·barras + puntos`. Las 38 válidas son consistentes y cada número aparece exactamente
una vez por mano. El orden de GC no es secuencial (el 5 está en la posición 13, el 13 en la 16),
que es justo el tipo de cosa que rompe un etiquetado por posición: el mapa se verificó uno por uno.
Nada se copió con otro nombre que el de la clase: `real_maya_NN_imri_001.jpeg`.

Duplicados: ninguno (sha256 distintos entre las 40 y contra el manifiesto de José).

## Qué le hicieron al modelo piloto

Evaluado tal cual está en `web/public/models/` (política de rechazo R1–R4 idéntica a la app):

| Mano | Válidas bien | Falso rechazo | Cero rechazado |
|---|---:|---:|---:|
| GC (marcador) | 10 / 19 | 8 / 19 rechazadas como inválidas | sí |
| GC2 (pluma fina) | 1 / 19 | 3 / 19 | sí |
| **Total** | **11 / 38 = 29 %** | 11 / 38 = 29 % | 2 / 2 |

Como la rúbrica es binaria por imagen, esto equivale a perder casi todo el 40 % de las pruebas
en vivo. Se esperaba que el piloto fallara; lo útil fue **por qué** falla:

### Hallazgo 1 · La polaridad se decidía mal (bug de preprocesamiento)

`docs/evidencia/imri/tensores-piloto-polaridad.png` muestra lo que ve la red. Tres fotos de GC
(el 3, el 7 y el 10) llegaban como **papel claro con tinta oscura**, el negativo del resto.
La regla comparaba la media del marco con la del centro y una sombra o la mesa roja al borde la
engañaba. Es el mismo defecto en el generador: **5,8 % de las imágenes sintéticas claras
también tenían la polaridad mal** (52 de 891). Arreglado y razonado en ADR-014.

### Hallazgo 2 · El trazo fino no existía en el entrenamiento

GC2 es la mano más difícil: barras de 1 px a 64×64 y puntos gordos. El generador solo hacía
barras de 10–25 px. Con pluma fina el piloto casi no ve las barras (la cabeza de puntos
predice «4 puntos» o «1 punto» casi siempre). Arreglado en `synth.glifo` (30 % de las muestras con barras de 3–8 px).

### Hallazgo 3 · Lo que no es bug

El resto es capacidad: 12 épocas y 120 imágenes por clase. La corrida completa son 800 por clase.

## Qué se hizo con esto

- Las 40 fotos están organizadas, sin renombrar contenido, en `data/raw/real/imri/`.
- GC es el **conjunto de prueba** (autor `imri`); GC2 entra a entrenamiento/validación como mano
  extra. Con solo dos manos reales, es la única partición sin fuga y con una mano nunca vista.
- Resultados del modelo reentrenado sobre GC: ver `docs/ESTADO.md` (bitácora del 2026-11-20).

## Limitaciones de estas 40 fotos

- Una foto por clase y por mano: un error en una clase pesa 5 puntos porcentuales.
- Solo 2 manos. Los resultados sobre GC son una estimación gruesa, no un intervalo estrecho.
- Ni un negativo aparte del cero: el rechazo hay que medirlo con las fotos de José, las de Jorge
  y el simulacro.
