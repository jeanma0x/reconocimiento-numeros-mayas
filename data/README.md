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
cd ml && python -m maya.dataset --sincronizar --verificar
```

**URL de la carpeta compartida:** _(pegar aquí)_

## Tu tarea de captura

Cada integrante, unos 20 minutos:

1. Escribe los **19 números dos veces**: una con marcador grueso, otra con lapicero o lápiz.
2. Fotografía cada uno variando distancia, ángulo, luz (de día y artificial) y fondo
   (hoja blanca y cuaderno).
3. Agrega **10 negativos** de tu propia mano: un cero maya, un 20, un 25, un 6-puntos, un
   4-barras, puntos debajo de barras, dos números en la misma hoja, un dibujo cualquiera, un
   número arábigo y una hoja en blanco.

**Escribe con tu letra natural.** No hay que escribir bonito: la variabilidad es exactamente lo
que necesita el modelo.

Detalle completo en `../docs/03-DATASET.md`.
