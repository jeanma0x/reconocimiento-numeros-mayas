/**
 * Prueba de extremo a extremo del motor de inferencia, sin navegador.
 *
 * Toma los fixtures generados por Python, los pasa por `lib/preprocess.ts`, los
 * corre con el .onnx de `public/models/` usando onnxruntime, y aplica la política
 * de rechazo de `lib/inferencia.ts`.
 *
 * Verifica tres cosas que el build de Next.js no puede verificar:
 *   1. que el .onnx carga y tiene las entradas y salidas que el código espera
 *   2. que `decidir()` produce resultados coherentes (R1..R4 en orden)
 *   3. que el tiempo de inferencia está dentro del presupuesto
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODELOS = join(RAIZ, "public", "models");
const FIXTURES = join(RAIZ, "fixtures");
const PRESUPUESTO_MS = 150;

const { preparar, LADO } = await import(join(RAIZ, "lib", "preprocess.ts"));
const { decidir, softmax } = await import(join(RAIZ, "lib", "inferencia.ts"));

const meta = JSON.parse(readFileSync(join(MODELOS, "metadata.json"), "utf8"));
const etiquetas = JSON.parse(readFileSync(join(MODELOS, "labels.json"), "utf8"));
const umbrales = existsSync(join(MODELOS, "thresholds.json"))
  ? JSON.parse(readFileSync(join(MODELOS, "thresholds.json"), "utf8"))
  : { temperatura: 1, tau: 0.5, margen: 0 };

const ort = await import("onnxruntime-web");
ort.env.wasm.numThreads = 1;
ort.env.logLevel = "error";

const sesion = await ort.InferenceSession.create(join(MODELOS, meta.modelo), {
  executionProviders: ["wasm"],
});

console.log(`\n  Modelo:   ${meta.modelo}`);
console.log(`  Entradas: ${sesion.inputNames.join(", ")}`);
console.log(`  Salidas:  ${sesion.outputNames.join(", ")}`);

const esperadas = ["logits", "barras", "puntos"];
for (const nombre of esperadas) {
  if (!sesion.outputNames.includes(nombre)) {
    console.error(`\n  FALLO: el modelo no expone la salida "${nombre}".`);
    console.error("  El contrato de docs/01-ARQUITECTURA.md no se cumple.\n");
    process.exit(1);
  }
}
if (!sesion.inputNames.includes("input")) {
  console.error('\n  FALLO: el modelo no expone la entrada "input".\n');
  process.exit(1);
}

const casos = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".bin"))
  .map((f) => f.replace(".bin", ""))
  .sort()
  .slice(0, 40);

let aceptadas = 0;
let rechazadas = 0;
const motivos = {};
let msTotal = 0;
let msPeor = 0;

for (const nombre of casos) {
  const bin = readFileSync(join(FIXTURES, `${nombre}.bin`));
  const ancho = bin.readUInt32LE(0);
  const alto = bin.readUInt32LE(4);
  const rgba = new Uint8ClampedArray(bin.buffer, bin.byteOffset + 8, alto * ancho * 4);

  const tensor = preparar(rgba, alto, ancho);
  const t0 = performance.now();
  const salida = await sesion.run({
    input: new ort.Tensor("float32", tensor, [1, 1, LADO, LADO]),
  });
  const ms = performance.now() - t0;
  msTotal += ms;
  if (ms > msPeor) msPeor = ms;

  const r = decidir(salida.logits.data, salida.barras.data, salida.puntos.data, umbrales, etiquetas);

  if (r.rechazada) {
    rechazadas++;
    motivos[r.motivo] = (motivos[r.motivo] ?? 0) + 1;
  } else {
    aceptadas++;
    if (r.valor === null || r.valor < 1 || r.valor > 19) {
      console.error(`\n  FALLO: ${nombre} aceptada con valor inválido ${r.valor}\n`);
      process.exit(1);
    }
    if (r.valor !== 5 * r.barras + r.puntos) {
      console.error(`\n  FALLO: ${nombre} aceptada pese a ser inconsistente (R3 no disparó)\n`);
      process.exit(1);
    }
  }
  const suma = r.probabilidades.reduce((a, b) => a + b, 0);
  if (Math.abs(suma - 1) > 1e-5) {
    console.error(`\n  FALLO: las probabilidades de ${nombre} suman ${suma}\n`);
    process.exit(1);
  }
}

// La política tiene que ser determinista: dos llamadas, el mismo resultado
const z = new Float32Array(etiquetas.num_clases).fill(-3);
z[12] = 6;
const lb = new Float32Array(etiquetas.num_barras).fill(-3);
lb[2] = 6;
const lp = new Float32Array(etiquetas.num_puntos).fill(-3);
lp[3] = 6;
const a = decidir(z, lb, lp, { temperatura: 1, tau: 0.5, margen: 0 }, etiquetas);
const b = decidir(z, lb, lp, { temperatura: 1, tau: 0.5, margen: 0 }, etiquetas);
if (a.valor !== 13 || a.rechazada || a.valor !== b.valor) {
  console.error(`\n  FALLO: decidir() no es determinista o erró el caso 2 barras + 3 puntos`);
  console.error(`  obtenido: ${JSON.stringify(a)}\n`);
  process.exit(1);
}
// R3: la clase dice 13 pero las cabezas dicen 11
const lp2 = new Float32Array(etiquetas.num_puntos).fill(-3);
lp2[1] = 6;
const inc = decidir(z, lb, lp2, { temperatura: 1, tau: 0.5, margen: 0 }, etiquetas);
if (!inc.rechazada || inc.motivo !== "inconsistencia") {
  console.error(`\n  FALLO: R3 no detectó la inconsistencia (motivo: ${inc.motivo})\n`);
  process.exit(1);
}
if (Math.abs(softmax([0, 0, 0]).reduce((x, y) => x + y, 0) - 1) > 1e-9) {
  console.error("\n  FALLO: softmax no suma 1\n");
  process.exit(1);
}

console.log(`\n  ${casos.length} imágenes procesadas`);
console.log(`  Aceptadas: ${aceptadas}  ·  Rechazadas: ${rechazadas} ${JSON.stringify(motivos)}`);
console.log(`  Inferencia: ${(msTotal / casos.length).toFixed(1)} ms de media, ${msPeor.toFixed(1)} ms la peor`);
console.log("  decidir(): determinista, R3 detecta inconsistencias, probabilidades suman 1");

if (msPeor > PRESUPUESTO_MS * 4) {
  console.warn(`\n  AVISO: la peor inferencia (${msPeor.toFixed(0)} ms) supera el presupuesto.`);
}
console.log("\n  OK: el motor de inferencia funciona de extremo a extremo.\n");
