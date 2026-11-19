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
├── manifest.csv              # fotos reales. SÍ se versiona: ruta, sha256, clase, split, fuente, autor
├── manifest_synth.csv        # sintético (se regenera con la semilla)
├── manifest_externo.csv      # datasets de terceros
├── raw/
│   ├── synthetic/
│   │   ├── maya_01/ … maya_19/
│   │   └── no_valido/{cero_maya,mayor_19,casi_valido,...}/
│   ├── real/
│   │   ├── <autor>/maya_01/ … maya_19/
│   │   └── <autor>/no_valido/...
│   └── externo/
│       └── <dataset>/maya_01/ … maya_19/, no_valido/...
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

**El protocolo completo, con el formato exacto y la estructura de carpetas, está en
[`INSTRUCCIONES-FOTOS.md`](INSTRUCCIONES-FOTOS.md).** Resumen:

1. Los 19 números **dos veces**: una ronda con marcador grueso, otra con lapicero o lápiz.
2. 12 repeticiones con luz y fondo distintos.
3. 15 negativos de su propia mano, repartidos en cinco subcategorías.
4. **Una mano extra:** cada integrante consigue a una persona más —familiar, pareja, amigo— que
   escriba los 19 números una vez.

Son unas 65 fotos propias más 19 de la persona extra, ≈ 30 minutos. Somos cuatro, así que el
paso 4 no es opcional: sin él el modelo ve 4 letras distintas, con él ve 8. Es la mejora más
grande por minuto invertido de todo el proyecto.

**Meta: ≈ 336 imágenes reales de 8 manos distintas. Fecha límite: jueves 19 a mediodía.**

**Importante:** cada quien escribe con su letra natural. No hay que "escribir bonito" — la
variabilidad es exactamente lo que necesitamos.

### 3. Recursos de internet e IA generativa

Permitido por el enunciado. Útil sobre todo para los negativos genéricos (objetos, personas,
paisajes) y para glifos del cero maya en estilos distintos. Toda imagen externa se anota en
`manifest_externo.csv` con su origen.

**Lo que hay hoy: `mayavision`** — 4 701 imágenes sintéticas de terceros (4 560 válidas,
141 no válidas), en `data/raw/externo/mayavision/`. Importadas tras auditarlas; se descartaron
240 imágenes y se deduplicaron 339. El porqué de cada descarte está en ADR-013, y la muestra
por clase que se revisó a ojo, en `docs/evidencia/dataset-externo/`.

**Regla para todo dato externo: entrena, nunca puntúa.** `construir_splits()` le asigna `train`
siempre, y `verificar()` falla si una fila `externo` aparece en validación o prueba. Validar
contra dato ajeno mediría cuánto nos parecemos a su generador, no cuánto acertamos sobre letra
humana, que es lo que se evalúa.

## Splits y prevención de fuga

El enunciado prohíbe que una imagen **o una variante derivada de ella** aparezca en dos
conjuntos distintos. Nuestro esquema:

| Conjunto | Composición | Para qué |
|---|---|---|
| **Entrenamiento** | Sintético (semillas 0–N) + fotos de José Julián, Jorge Luis y Jean Marco + las manos extra que consigan ellos tres + **todo el dato externo** | Ajustar pesos |
| **Validación** | Sintético con semillas **disjuntas** + fotos de esos mismos tres, separadas por toma | Early stopping, elección de modelo, temperatura y umbrales |
| **Prueba** | **Fotos de Imri y de su mano extra, que el modelo nunca vio** + un lote de sintético con semillas nuevas | Reportar el número final. Se toca **una sola vez** |

> Se aparta a Imri porque es quien no entrena el modelo: así nadie que ajusta hiperparámetros ha
> visto nunca esa letra, ni siquiera de reojo. Son dos manos desconocidas en prueba — la suya y
> la de su persona extra.

**Reglas que lo garantizan:**

1. **Agrupación por semilla.** Todas las variantes que salen de una misma semilla del generador
   forman un grupo y van completas al mismo split. Nunca se parte un grupo.
2. **Agrupación por toma.** Si de una misma hoja se tomaron tres fotos, las tres van al mismo split.
3. **Leave-one-person-out.** El conjunto de prueba son letras que el modelo no vio nunca. Es lo más parecido a lo que pasará con el docente, y es un argumento fuerte para la
   presentación: *"nuestro 94 % de prueba es contra una mano desconocida, no contra nuestras
   propias fotos"*.
4. **Deduplicado por hash.** `sha256` de cada archivo en `manifest.csv`; el split falla si detecta
   un hash repetido entre conjuntos.
5. **El aumento de datos se aplica solo en entrenamiento**, nunca al generar los archivos del
   dataset. Validación y prueba se evalúan sin aumentar.
6. **El dato externo no puntúa** (ADR-013). Va entero a entrenamiento: sus near-duplicados
   internos inflarían cualquier métrica calculada sobre él.
7. **El reparto es reproducible.** La asignación de cada toma usa un sha1 estable, no `hash()`
   de Python, que cambia de valor en cada proceso. Dos corridas con la misma semilla dan el
   mismo reparto; si no, comparar dos entrenamientos no significaría nada.

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
- [ ] ≥ 300 imágenes reales, de al menos 7 manos distintas
- [ ] Todas las subcategorías de prioridad alta con ≥ 150 ejemplos
- [ ] Prueba = fotos de Imri y de su mano extra, excluidas del entrenamiento
- [ ] `maya.dataset --verificar` pasa sin advertencias
- [ ] Una hoja de contacto (grilla de muestras) por clase, revisada a ojo por dos personas
      distintas. Una etiqueta mal puesta envenena el entrenamiento en silencio
