# 03 · Dataset

## El sistema de numeración maya, en lo que nos importa

Dos símbolos: el **punto** vale 1 y la **barra** vale 5. Las barras se apilan horizontalmente,
una sobre otra, y los puntos van en fila **encima** de las barras.

Por lo tanto, todo número del 1 al 19 es exactamente un par (barras, puntos):

> **valor = 5 × barras + puntos**, con `barras ∈ {0,1,2,3}` y `puntos ∈ {0,1,2,3,4}`

| Valor | Barras | Puntos | | Valor | Barras | Puntos | | Valor | Barras | Puntos |
|---:|---:|---:|---|---:|---:|---:|---|---:|---:|---:|
| 1 | 0 | 1 | | 8 | 1 | 3 | | 15 | 3 | 0 |
| 2 | 0 | 2 | | 9 | 1 | 4 | | 16 | 3 | 1 |
| 3 | 0 | 3 | | 10 | 2 | 0 | | 17 | 3 | 2 |
| 4 | 0 | 4 | | 11 | 2 | 1 | | 18 | 3 | 3 |
| 5 | 1 | 0 | | 12 | 2 | 2 | | 19 | 3 | 4 |
| 6 | 1 | 1 | | 13 | 2 | 3 | | | | |
| 7 | 1 | 2 | | 14 | 2 | 4 | | | | |

Las 20 combinaciones posibles menos (0 barras, 0 puntos) dan exactamente **19 clases válidas**.
Esa estructura no es un detalle curioso: es la razón de que el modelo tenga cabezas auxiliares
de barras y puntos (ver `04-MODELO.md`).

**Lo que se rechaza:**
- El **cero maya**, que es un glifo de concha y no se construye con puntos ni barras.
- **20 o más**, que usa notación posicional vertical: varios bloques separados, uno por nivel.
- Combinaciones imposibles: 5 o más puntos (serían una barra), 4 o más barras (sería ≥ 20),
  puntos debajo de las barras, elementos dispersos sin estructura.

## Taxonomía de clases

**20 etiquetas** para el modelo: 19 válidas + 1 de rechazo.

```
maya_01 … maya_19     →  índices 0..18   (válidas)
no_valido             →  índice 19       (rechazo)
```

El orden canónico vive **solo** en `ml/src/maya/labels.py` y se exporta a `labels.json` junto
con el modelo. Ver invariante I3 en `CLAUDE.md`.

### Subcategorías de `no_valido`

Se guardan en subcarpetas para poder medir el rechazo por tipo, pero todas colapsan a la misma
etiqueta al entrenar.

| Subcarpeta | Qué contiene | Prioridad |
|---|---|---|
| `cero_maya` | El glifo de concha, en varios estilos | **Alta** — mencionado explícitamente en el enunciado |
| `mayor_19` | 20, 25, 33, 40, 100… en notación posicional vertical | **Alta** — mencionado explícitamente |
| `casi_valido` | 5+ puntos, 4+ barras, puntos abajo, barras verticales, elementos dispersos | **Alta** — enseña dónde está la frontera |
| `multiples` | Dos o más números mayas válidos en la misma imagen | **Alta** — el enunciado los declara fuera de alcance |
| `digitos_arabigos` | 0–9 y números de varias cifras, impresos y a mano | Media |
| `romanos` | I, II, III, IV, V, X, XIV… | Media |
| `otros_sistemas` | Binario, chino, árabe oriental, romano decorativo | Media |
| `texto` | Letras y palabras sueltas | Media |
| `objetos` | Fotos de objetos cotidianos | Media |
| `personas` | Rostros y personas | Media |
| `paisajes` | Exteriores, edificios, naturaleza | Media |
| `dibujos` | Garabatos, figuras, dibujos infantiles | Media |
| `vacio` | Papel en blanco, pizarrón vacío, imagen negra, ruido puro | Media |

> Las categorías de prioridad alta son las que el docente probablemente use. `casi_valido` es la
> más valiosa del dataset: sin ella, la red aprende "puntos y barras = número maya" y acepta un
> 4-barras o un 6-puntos sin dudar.

## Estructura de carpetas

```
data/
├── manifest.csv              # SÍ se versiona: ruta, sha256, clase, split, fuente, autor
├── raw/
│   ├── synthetic/
│   │   ├── maya_01/ … maya_19/
│   │   └── no_valido/{cero_maya,mayor_19,casi_valido,...}/
│   └── real/
│       ├── <autor>/maya_01/ … maya_19/
│       └── <autor>/no_valido/...
└── processed/                # tensores 64×64 en .npy, generados, nunca versionados
```

Nombre de archivo: `<fuente>_<clase>_<autor-o-seed>_<correlativo>.png`
Ejemplo: `real_maya_13_jose_007.png`, `synth_maya_13_s42_01184.png`

## Fuentes de datos

### 1. Generación sintética (el grueso del volumen)

`ml/src/maya/synth.py` dibuja números mayas por programa. Es lo que nos permite tener decenas de
miles de ejemplos en horas en lugar de semanas.

**Qué varía en cada imagen** (todo muestreado al azar, con semilla registrada):

| Dimensión | Rango |
|---|---|
| Grosor de barra | 3–14 % del alto del glifo |
| Largo de barra | variación ±20 %, y entre barras de la misma imagen |
| Radio de punto | 4–12 % del ancho |
| Separación barras / puntos | variable, a veces casi tocándose |
| Ondulación del trazo | desplazamiento con ruido de Perlin en los bordes, para simular mano alzada |
| Extremos | rectos, redondeados, con "entrada y salida" de marcador |
| Rotación | ±15° |
| Perspectiva | warp de hasta 12 % (foto tomada en ángulo) |
| Color de tinta | negro, azul, rojo, verde, grafito, con variación de saturación |
| Fondo | papel blanco, papel cuadriculado, papel rayado, cartulina, pizarrón blanco, pizarrón verde, madera, textura de servilleta |
| Iluminación | gradiente lateral, sombra de la mano, reflejo/brillo especular, viñeteado |
| Degradación | desenfoque gaussiano, ruido, artefactos JPEG, baja resolución |
| Encuadre | el glifo ocupa entre 25 % y 90 % de la imagen, descentrado |

El mismo generador produce los negativos `casi_valido`, `mayor_19` y `cero_maya` reutilizando
las mismas primitivas: eso garantiza que la red no distinga positivo de negativo por el estilo
de dibujo, sino por la **estructura**. Es un punto importante y hay que decirlo en la presentación.

**Meta:** ≥ 800 imágenes por clase válida (≈ 15 200) + ≈ 10 000 negativos.

### 2. Captura real (lo que decide la nota)

El modelo se juega el sábado contra un marcador en una hoja. El dataset sintético solo acerca;
las fotos reales son las que cierran la brecha.

**Protocolo de captura — cada integrante:**

1. Escribe los 19 números **dos veces**: una con marcador grueso, otra con lapicero o lápiz.
2. Fotografía cada uno con su celular, variando: distancia, ángulo, luz de día y luz artificial,
   fondo de hoja blanca y de cuaderno.
3. Añade 10 negativos de su propia mano: un cero maya, un 20, un 25, un 6-puntos, un 4-barras,
   puntos debajo de barras, dos números en la misma hoja, un dibujo cualquiera, un número
   arábigo, una hoja en blanco.

Son unas 48 fotos por persona, ≈ 20 minutos de trabajo. **Meta: ≥ 400 imágenes reales.**

**Importante:** cada quien escribe con su letra natural. No hay que "escribir bonito" — la
variabilidad es exactamente lo que necesitamos.

### 3. Recursos de internet e IA generativa

Permitido por el enunciado. Útil sobre todo para los negativos genéricos (objetos, personas,
paisajes) y para glifos del cero maya en estilos distintos. Toda imagen externa se anota en
`manifest.csv` con su origen.

## Splits y prevención de fuga

El enunciado prohíbe que una imagen **o una variante derivada de ella** aparezca en dos
conjuntos distintos. Nuestro esquema:

| Conjunto | Composición | Para qué |
|---|---|---|
| **Entrenamiento** | Sintético (semillas 0–N) + fotos reales de 4 integrantes | Ajustar pesos |
| **Validación** | Sintético con semillas **disjuntas** + fotos reales de esos mismos 4 integrantes, separadas por toma | Early stopping, elección de modelo, temperatura y umbrales |
| **Prueba** | **Fotos del 5.º integrante, que el modelo nunca vio** + un lote de sintético con semillas nuevas | Reportar el número final. Se toca **una sola vez** |

**Reglas que lo garantizan:**

1. **Agrupación por semilla.** Todas las variantes que salen de una misma semilla del generador
   forman un grupo y van completas al mismo split. Nunca se parte un grupo.
2. **Agrupación por toma.** Si de una misma hoja se tomaron tres fotos, las tres van al mismo split.
3. **Leave-one-person-out.** El conjunto de prueba es la letra de alguien que el modelo no vio
   nunca. Es lo más parecido a lo que pasará con el docente, y es un argumento fuerte para la
   presentación: *"nuestro 94 % de prueba es contra una mano desconocida, no contra nuestras
   propias fotos"*.
4. **Deduplicado por hash.** `sha256` de cada archivo en `manifest.csv`; el split falla si detecta
   un hash repetido entre conjuntos.
5. **El aumento de datos se aplica solo en entrenamiento**, nunca al generar los archivos del
   dataset. Validación y prueba se evalúan sin aumentar.

## Aumento de datos (en entrenamiento, al vuelo)

Sobre lo que ya varía el generador, se aplica por lote:

- `RandomAffine(degrees=12, translate=(0.12, 0.12), scale=(0.85, 1.15), shear=8)`
- Variación de brillo y contraste
- Desenfoque gaussiano leve, aleatorio
- `RandomErasing` suave, para simular oclusión parcial

**Prohibido:** voltear horizontal o verticalmente. Un volteo vertical pone los puntos debajo de
las barras, que es justamente un caso `no_valido`. Enseñarle a la red que eso es lo mismo sería
contraproducente. (Mismo razonamiento que el notebook del curso con los dígitos volteados.)

## Manifiesto

`data/manifest.csv` se versiona en git y es la única fuente de verdad sobre qué hay en el dataset:

```csv
ruta,sha256,clase,subclase,split,fuente,autor,seed,ancho,alto,creado_en
raw/real/jose/maya_13/real_maya_13_jose_007.png,9f2a...,maya_13,,train,real,jose,,3024,4032,2026-11-18
raw/synthetic/maya_13/synth_maya_13_s42_01184.png,1c77...,maya_13,,train,synth,,42,256,256,2026-11-18
```

`python -m maya.dataset --verificar` revisa que cada archivo del manifiesto exista, que el hash
coincida y que ningún grupo esté partido entre splits. **Es un check obligatorio antes de entrenar.**

## Criterios de aceptación del dataset

- [ ] ≥ 800 sintéticas por clase válida, ≥ 10 000 negativos
- [ ] ≥ 400 imágenes reales, de 5 manos distintas
- [ ] Todas las subcategorías de prioridad alta con ≥ 150 ejemplos
- [ ] Prueba = fotos de un integrante excluido del entrenamiento
- [ ] `maya.dataset --verificar` pasa sin advertencias
- [ ] Una hoja de contacto (grilla de muestras) por clase, revisada a ojo por dos personas
      distintas. Una etiqueta mal puesta envenena el entrenamiento en silencio
