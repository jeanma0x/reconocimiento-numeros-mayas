/**
 * Test de paridad del preprocesamiento — invariante I4 de CLAUDE.md.
 *
 * Compara `lib/preprocess.ts` contra los tensores que produjo
 * `ml/src/maya/preprocess.py` sobre los mismos píxeles. Si los dos lados divergen,
 * el modelo recibe en producción algo distinto de lo que vio al entrenar y falla
 * en la demo aunque sus métricas sean excelentes.
 *
 * Los fixtures se generan con:
 *     cd ml && python -m maya.preprocess --fixtures ../web/fixtures
 *
 * Criterio: diferencia absoluta máxima < 1e-4 en los 200 casos.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");
const FIXTURES = join(RAIZ, "fixtures");
const TOLERANCIA = 1e-4;

if (!existsSync(FIXTURES)) {
  console.error(`\n  No hay fixtures en ${FIXTURES}`);
  console.error("  Generalos con:  cd ml && python -m maya.preprocess --fixtures ../web/fixtures\n");
  process.exit(1);
}

// Node 22 importa TypeScript directamente quitando los tipos: no hace falta
// compilar nada, y así el test corre exactamente el mismo archivo que el navegador.
const { preparar } = await import(join(RAIZ, "lib", "preprocess.ts"));

const casos = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".bin"))
  .map((f) => f.replace(".bin", ""))
  .sort();

if (casos.length === 0) {
  console.error("  La carpeta de fixtures está vacía.");
  process.exit(1);
}

let peor = 0;
let peorCaso = "";
const fallos = [];

for (const nombre of casos) {
  const bin = readFileSync(join(FIXTURES, `${nombre}.bin`));
  const ancho = bin.readUInt32LE(0);
  const alto = bin.readUInt32LE(4);
  const rgba = new Uint8ClampedArray(bin.buffer, bin.byteOffset + 8, alto * ancho * 4);

  const esperado = new Float32Array(
    readFileSync(join(FIXTURES, `${nombre}.f32`)).buffer.slice(0),
  );
  const obtenido = preparar(rgba, alto, ancho);

  if (obtenido.length !== esperado.length) {
    fallos.push(`${nombre}: longitud ${obtenido.length} != ${esperado.length}`);
    continue;
  }
  let maxDif = 0;
  for (let i = 0; i < esperado.length; i++) {
    const d = Math.abs(obtenido[i] - esperado[i]);
    if (d > maxDif) maxDif = d;
  }
  if (maxDif > peor) {
    peor = maxDif;
    peorCaso = `${nombre} (${ancho}x${alto})`;
  }
  if (maxDif > TOLERANCIA) {
    fallos.push(`${nombre} (${ancho}x${alto}): diferencia máxima ${maxDif.toExponential(2)}`);
  }
}

console.log(`\n  Paridad del preprocesamiento — ${casos.length} casos`);
console.log(`  Peor diferencia: ${peor.toExponential(2)}  en ${peorCaso}`);
console.log(`  Tolerancia:      ${TOLERANCIA.toExponential(0)}`);

if (fallos.length) {
  console.error(`\n  FALLO: ${fallos.length} casos fuera de tolerancia\n`);
  for (const f of fallos.slice(0, 10)) console.error(`    - ${f}`);
  if (fallos.length > 10) console.error(`    ... y ${fallos.length - 10} más`);
  console.error(
    "\n  Python y TypeScript divergen. NO se despliega hasta arreglarlo:\n" +
      "  el modelo recibiría en producción algo distinto de lo que vio al entrenar.\n",
  );
  process.exit(1);
}

console.log("\n  OK: Python y TypeScript producen el mismo tensor.\n");
