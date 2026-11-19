/**
 * Copia los binarios .wasm de onnxruntime-web a public/ort/.
 *
 * Sin esto, onnxruntime los busca en un CDN y la aplicación deja de funcionar sin
 * internet — que es justo lo que no podemos permitirnos el día de la presentación
 * (invariante I5 de CLAUDE.md).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEN = join(RAIZ, "node_modules", "onnxruntime-web", "dist");
const DESTINO = join(RAIZ, "public", "ort");

if (!existsSync(ORIGEN)) {
  console.warn("  onnxruntime-web no está instalado todavía; no se copió ningún .wasm");
  process.exit(0);
}
// Solo los binarios que el navegador pide de verdad con nuestra configuración
// (wasm, un hilo). Copiar los 105 MB del paquete completo engorda el despliegue
// sin que nada los use. Verificado con Chrome midiendo las peticiones reales.
const NECESARIOS = [
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
];

mkdirSync(DESTINO, { recursive: true });
const disponibles = new Set(readdirSync(ORIGEN));
let n = 0;
let bytes = 0;
for (const archivo of NECESARIOS) {
  if (!disponibles.has(archivo)) {
    console.warn(`  AVISO: onnxruntime-web no trae ${archivo}; revisá su versión`);
    continue;
  }
  copyFileSync(join(ORIGEN, archivo), join(DESTINO, archivo));
  bytes += statSync(join(ORIGEN, archivo)).size;
  n++;
}
console.log(`  ${n} archivos de onnxruntime copiados a public/ort/ (${(bytes / 1e6).toFixed(1)} MB)`);
