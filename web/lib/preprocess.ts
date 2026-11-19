/**
 * Preprocesamiento — port exacto de `ml/src/maya/preprocess.py`.
 *
 * CUALQUIER cambio aquí obliga a cambiar el archivo de Python y a volver a correr
 * `npm run test:parity` (invariante I4 de CLAUDE.md). Si los dos lados divergen, el
 * modelo recibe en producción algo distinto de lo que vio al entrenar y falla en la
 * demo aunque sus métricas sean excelentes.
 *
 * Los siete pasos, en orden:
 *   1. Orientación EXIF   -> la aplica quien decodifica (createImageBitmap)
 *   2. Escala de grises   -> 0.299 R + 0.587 G + 0.114 B, en float, sin redondear
 *   3. Polaridad          -> si el marco es más claro que el centro, invertir
 *   4. Contraste          -> estirar entre los percentiles 1 y 99
 *   5. Cuadrado           -> rellenar con el valor del fondo, centrado
 *   6. Escalar a 64x64    -> promedio por bloques con pesos fraccionarios exactos
 *   7. Normalizar         -> ya queda en [0,1]
 *
 * Nada de `canvas.drawImage` para reescalar ni filtros del navegador: ninguno
 * garantiza el mismo resultado que NumPy. Todo es aritmética explícita.
 */

export const LADO = 64;
export const MARGEN_MARCO = 0.1; // fracción del borde usada para estimar el fondo
export const CENTRO = 0.5; // fracción central usada para estimar el contenido
export const PCT_BAJO = 1.0;
export const PCT_ALTO = 99.0;
export const RANGO_MINIMO = 20.0; // niveles de gris (sobre 255) por debajo de los cuales no se estira

/** Equivalente a `int(x)` de Python para valores no negativos. */
function ent(x: number): number {
  return Math.floor(x);
}

/**
 * Equivalente a `np.percentile(a, q)` con interpolación lineal, que es el valor
 * por defecto de NumPy. Reimplementarlo mal es la forma más fácil de romper la
 * paridad sin que ningún test obvio lo note.
 */
export function percentil(ordenado: Float64Array, q: number): number {
  const n = ordenado.length;
  if (n === 0) return 0;
  if (n === 1) return ordenado[0];
  const pos = ((n - 1) * q) / 100;
  const abajo = Math.floor(pos);
  const arriba = Math.ceil(pos);
  if (abajo === arriba) return ordenado[abajo];
  return ordenado[abajo] + (ordenado[arriba] - ordenado[abajo]) * (pos - abajo);
}

/** Equivalente a `np.median`: promedio de los dos centrales cuando n es par. */
export function mediana(valores: Float64Array): number {
  const n = valores.length;
  if (n === 0) return 0;
  const copia = Float64Array.from(valores).sort();
  const medio = n >> 1;
  return n % 2 === 1 ? copia[medio] : (copia[medio - 1] + copia[medio]) / 2;
}

/** Paso 2. RGBA uint8 -> gris float64 en [0,255], compuesto sobre blanco. */
export function aGris(rgba: Uint8ClampedArray | Uint8Array, alto: number, ancho: number): Float64Array {
  const g = new Float64Array(alto * ancho);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    const a = rgba[p + 3] / 255;
    // Mismo compuesto sobre blanco que hace Python, con truncado a entero
    const r = a === 1 ? rgba[p] : Math.trunc(rgba[p] * a + 255 * (1 - a));
    const v = a === 1 ? rgba[p + 1] : Math.trunc(rgba[p + 1] * a + 255 * (1 - a));
    const b = a === 1 ? rgba[p + 2] : Math.trunc(rgba[p + 2] * a + 255 * (1 - a));
    g[i] = 0.299 * r + 0.587 * v + 0.114 * b;
  }
  return g;
}

/** Índices del marco: `_mascara_marco` de Python. */
function indicesMarco(alto: number, ancho: number): number[] {
  const my = Math.max(1, ent(alto * MARGEN_MARCO));
  const mx = Math.max(1, ent(ancho * MARGEN_MARCO));
  const idx: number[] = [];
  for (let y = 0; y < alto; y++) {
    const filaBorde = y < my || y >= alto - my;
    for (let x = 0; x < ancho; x++) {
      if (filaBorde || x < mx || x >= ancho - mx) idx.push(y * ancho + x);
    }
  }
  return idx;
}

/** Índices del centro: `_mascara_centro` de Python. */
function indicesCentro(alto: number, ancho: number): number[] {
  const y0 = ent((alto * (1 - CENTRO)) / 2);
  const y1 = ent((alto * (1 + CENTRO)) / 2);
  const x0 = ent((ancho * (1 - CENTRO)) / 2);
  const x1 = ent((ancho * (1 + CENTRO)) / 2);
  const idx: number[] = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) idx.push(y * ancho + x);
  return idx;
}

function media(g: Float64Array, idx: number[]): number {
  if (idx.length === 0) return NaN;
  let s = 0;
  for (const i of idx) s += g[i];
  return s / idx.length;
}

/**
 * Paso 3. True si el fondo es más claro que el contenido (tinta oscura sobre papel).
 * Así una foto de tinta negra sobre papel y un trazo blanco sobre pizarrón verde
 * llegan iguales a la red.
 */
export function necesitaInversion(g: Float64Array, alto: number, ancho: number): boolean {
  const marco = indicesMarco(alto, ancho);
  const centro = indicesCentro(alto, ancho);
  if (marco.length === 0 || centro.length === 0) return false;
  return media(g, marco) > media(g, centro);
}

/**
 * Paso 4. Lleva el rango [p1, p99] a [0,1]. Percentiles, no mínimo y máximo: un
 * solo píxel quemado no debe decidir la escala de toda la imagen.
 *
 * Si el rango es menor a RANGO_MINIMO la imagen se considera plana y se devuelve en
 * negro: en una hoja en blanco el único "contenido" es el grano del papel, y
 * estirarlo lo convierte en una textura que la red lee como trazos.
 */
export function estirarContraste(g: Float64Array): Float64Array {
  const ordenado = Float64Array.from(g).sort();
  const lo = percentil(ordenado, PCT_BAJO);
  const hi = percentil(ordenado, PCT_ALTO);
  const out = new Float64Array(g.length);
  if (hi - lo < RANGO_MINIMO) return out; // todo en cero
  const rango = hi - lo;
  for (let i = 0; i < g.length; i++) {
    out[i] = Math.min(1, Math.max(0, (g[i] - lo) / rango));
  }
  return out;
}

/** Paso 5. Centra la imagen en un lienzo cuadrado, preservando la proporción. */
export function rellenarACuadrado(
  g: Float64Array,
  alto: number,
  ancho: number,
  valorFondo: number,
): { datos: Float64Array; lado: number } {
  const lado = Math.max(alto, ancho);
  const datos = new Float64Array(lado * lado).fill(valorFondo);
  const y0 = Math.floor((lado - alto) / 2);
  const x0 = Math.floor((lado - ancho) / 2);
  for (let y = 0; y < alto; y++) {
    datos.set(g.subarray(y * ancho, (y + 1) * ancho), (y + y0) * lado + x0);
  }
  return { datos, lado };
}

/**
 * Matriz de promedio por bloques con pesos fraccionarios, igual que
 * `matriz_pesos` de Python. La fila j reparte el píxel de salida j sobre los de
 * entrada que cubre su intervalo, con el peso igual a la fracción solapada.
 * Cada fila suma 1.
 */
export function matrizPesos(nEntrada: number, nSalida: number): Float64Array[] {
  const filas: Float64Array[] = [];
  const escala = nEntrada / nSalida;
  for (let j = 0; j < nSalida; j++) {
    const fila = new Float64Array(nEntrada);
    const ini = j * escala;
    const fin = (j + 1) * escala;
    const i0 = Math.floor(ini);
    const i1 = Math.min(Math.ceil(fin), nEntrada);
    let suma = 0;
    for (let i = i0; i < i1; i++) {
      const w = Math.max(0, Math.min(fin, i + 1) - Math.max(ini, i));
      fila[i] = w;
      suma += w;
    }
    if (suma > 1e-6) for (let i = i0; i < i1; i++) fila[i] /= suma;
    filas.push(fila);
  }
  return filas;
}

/** Paso 6. Wy @ img @ Wx.T, con img cuadrada de lado `ladoEntrada`. */
export function escalarPorBloques(
  g: Float64Array,
  ladoEntrada: number,
  ladoSalida: number = LADO,
): Float64Array {
  const W = matrizPesos(ladoEntrada, ladoSalida);
  // Primero por filas: intermedio[j][x] = suma_y Wy[j][y] * g[y][x]
  const intermedio = new Float64Array(ladoSalida * ladoEntrada);
  for (let j = 0; j < ladoSalida; j++) {
    const wj = W[j];
    for (let y = 0; y < ladoEntrada; y++) {
      const w = wj[y];
      if (w === 0) continue;
      const base = y * ladoEntrada;
      const dest = j * ladoEntrada;
      for (let x = 0; x < ladoEntrada; x++) intermedio[dest + x] += w * g[base + x];
    }
  }
  // Después por columnas: salida[j][k] = suma_x intermedio[j][x] * Wx[k][x]
  const salida = new Float64Array(ladoSalida * ladoSalida);
  for (let j = 0; j < ladoSalida; j++) {
    const base = j * ladoEntrada;
    for (let k = 0; k < ladoSalida; k++) {
      const wk = W[k];
      let s = 0;
      for (let x = 0; x < ladoEntrada; x++) {
        const w = wk[x];
        if (w !== 0) s += intermedio[base + x] * w;
      }
      salida[j * ladoSalida + k] = s;
    }
  }
  return salida;
}

/**
 * Pipeline completo. Recibe los píxeles RGBA tal como los entrega
 * `ImageData`/`getImageData` y devuelve el tensor float32[1,64,64] en [0,1],
 * con la tinta clara sobre fondo oscuro.
 */
export function preparar(
  rgba: Uint8ClampedArray | Uint8Array,
  alto: number,
  ancho: number,
): Float32Array {
  let g = aGris(rgba, alto, ancho); // 2
  if (necesitaInversion(g, alto, ancho)) {
    // 3
    const inv = new Float64Array(g.length);
    for (let i = 0; i < g.length; i++) inv[i] = 255 - g[i];
    g = inv;
  }
  g = estirarContraste(g); // 4

  const marco = indicesMarco(alto, ancho);
  const valoresMarco = new Float64Array(marco.length);
  for (let i = 0; i < marco.length; i++) valoresMarco[i] = g[marco[i]];
  const fondo = mediana(valoresMarco);

  const { datos, lado } = rellenarACuadrado(g, alto, ancho, fondo); // 5
  const chico = escalarPorBloques(datos, lado, LADO); // 6

  const salida = new Float32Array(LADO * LADO); // 7
  for (let i = 0; i < salida.length; i++) {
    salida[i] = Math.fround(Math.min(1, Math.max(0, chico[i])));
  }
  return salida;
}

/**
 * Decodifica un archivo o blob respetando la orientación EXIF y devuelve sus
 * píxeles. Las fotos de celular vienen rotadas; omitir esto hace que la red
 * reciba números acostados, que es un error silencioso y caro.
 *
 * Se limita el lado mayor a 1600 px: más resolución no aporta nada después de
 * reducir a 64x64 y sí hace lento el preprocesamiento en un celular.
 */
export async function pixelesDesde(
  origen: Blob | ImageBitmapSource,
  ladoMaximo = 1600,
): Promise<{ rgba: Uint8ClampedArray; alto: number; ancho: number }> {
  const bitmap = await createImageBitmap(origen as ImageBitmapSource, {
    imageOrientation: "from-image",
  });
  let { width: ancho, height: alto } = bitmap;
  const f = Math.min(1, ladoMaximo / Math.max(alto, ancho));
  if (f < 1) {
    ancho = Math.max(1, Math.round(ancho * f));
    alto = Math.max(1, Math.round(alto * f));
  }
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();
  const datos = ctx.getImageData(0, 0, ancho, alto);
  return { rgba: datos.data, alto, ancho };
}
