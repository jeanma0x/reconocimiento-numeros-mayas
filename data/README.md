# data · Dataset

Las imágenes **no se versionan en git**. Lo que sí se versiona es `manifest.csv`: la lista de
archivos con su hash, clase, split, fuente y autor. Con él cualquiera verifica que tiene
exactamente el mismo dataset.

## Estructura

```
data/
├── manifest.csv              ← se versiona
├── raw/
│   ├── synthetic/
│   │   ├── maya_01/ … maya_19/
│   │   └── no_valido/{cero_maya,mayor_19,casi_valido,multiples,...}/
│   └── real/
│       └── <autor>/maya_01/ … maya_19/  y  <autor>/no_valido/<subclase>/
└── processed/                ← tensores .npy, generados, nunca versionados
```

Nombre de archivo: `<fuente>_<clase>_<autor-o-seed>_<correlativo>.png`
Por ejemplo `real_maya_13_jose_007.png`, `synth_maya_13_s42_01184.png`.

## Cómo se comparte entre el equipo

Carpeta compartida (Drive o OneDrive) con la misma estructura de `raw/`. Cada quien sube sus
fotos a `raw/real/<su-nombre>/` y luego:

```bash
cd ml
python -m maya.dataset --raiz ../data --indexar-reales      # reconstruye manifest.csv
python -m maya.dataset --raiz ../data --construir-splits --autor-prueba imri
python -m maya.dataset --raiz ../data --verificar           # obligatorio antes de entrenar
```

`--indexar-reales` recorre `raw/real/` y arma el manifiesto desde cero: la clase sale de la
**carpeta**, no del nombre del archivo. Es idempotente, así que se corre cada vez que alguien
agrega fotos. Avisa si hay duplicados, archivos fuera de la estructura o clases sin ninguna foto.

**URL de la carpeta compartida:** _(pegar aquí)_

## Tu tarea de captura

👉 **Las instrucciones completas están en [`../docs/INSTRUCCIONES-FOTOS.md`](../docs/INSTRUCCIONES-FOTOS.md).**

En resumen: los 19 números dos veces (marcador y lapicero), 12 repeticiones con luz o fondo
distinto, 15 negativos, y una persona extra que escriba los 19. Unas 30 minutos.
**Fecha límite: jueves 19 a mediodía.**

Las carpetas de cada quien ya están creadas en `raw/real/<nombre>/`: una por número
(`maya_01` … `maya_19`) y cinco de negativos. Meter cada foto en la carpeta que le toca es todo
el etiquetado que hay que hacer.
