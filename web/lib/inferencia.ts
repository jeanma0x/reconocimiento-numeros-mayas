/**
 * Motor de inferencia: carga el .onnx, lo ejecuta y aplica la política de rechazo.
 *
 * Todo corre en el navegador. La nube no participa en el reconocimiento, así que la
 * demo funciona aunque no haya internet (invariante I5 de CLAUDE.md).
 *
 * `decidir()` es el espejo exacto de `calibrate.decidir()` de Python: mismas cuatro
 * capas, en el mismo orden. Si una cambia, la otra cambia.
 */
import type { InferenceSession } from "onnxruntime-web";

import { LADO, preparar } from "./preprocess.ts";
import type { Etiquetas, MotivoRechazo, Metadata, Resultado, Umbrales } from "./tipos.ts";

const RUTA_MODELOS = "/models";

let sesionPromesa: Promise<Recursos> | null = null;

export interface Recursos {
  sesion: InferenceSession;
  etiquetas: Etiquetas;
  umbrales: Umbrales;
  metadata: Metadata;
}

async function leerJSON<T>(nombre: string): Promise<T> {
  const r = await fetch(`${RUTA_MODELOS}/${nombre}`, { cache: "force-cache" });
  if (!r.ok) throw new Error(`No se pudo leer ${nombre} (${r.status})`);
  return (await r.json()) as T;
}

/**
 * Carga el modelo una sola vez y reutiliza la sesión. Crearla en cada predicción
 * añade cientos de milisegundos y puede agotar la memoria del navegador.
 */
export function cargarRecursos(): Promise<Recursos> {
  if (sesionPromesa) return sesionPromesa;
  sesionPromesa = (async () => {
    const ort = await import("onnxruntime-web");
    // Los .wasm se sirven desde /ort/, copiados en el build. Nada de CDN: si el
    // navegador tuviera que bajarlos de internet, la demo dependería del wifi.
    ort.env.wasm.wasmPaths = "/ort/";
    ort.env.wasm.numThreads = 1; // sin SharedArrayBuffer: evita exigir COOP/COEP
    ort.env.logLevel = "error";

    const [etiquetas, umbrales, metadata] = await Promise.all([
      leerJSON<Etiquetas>("labels.json"),
      leerJSON<Umbrales>("thresholds.json").catch(() => ({
        version: 0,
        temperatura: 1,
        tau: 0.5,
        margen: 0,
      })),
      leerJSON<Metadata>("metadata.json"),
    ]);

    const sesion = await ort.InferenceSession.create(`${RUTA_MODELOS}/${metadata.modelo}`, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    return { sesion, etiquetas, umbrales, metadata };
  })();
  return sesionPromesa;
}

/** softmax con temperatura, idéntico al de `calibrate.py`. */
export function softmax(logits: Float32Array | number[], T = 1): number[] {
  const z = Array.from(logits, (v) => v / T);
  const max = Math.max(...z);
  const e = z.map((v) => Math.exp(v - max));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

function argmax(a: Float32Array | number[]): number {
  let mejor = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[mejor]) mejor = i;
  return mejor;
}

/**
 * Política de rechazo, R1..R4 en orden. Espejo de `calibrate.decidir()`.
 *
 *   R1  la red predice directamente la clase `no_valido`
 *   R2  la confianza calibrada no llega al umbral
 *   R3  inconsistencia: la clase no coincide con 5*barras + puntos
 *   R4  el margen entre la primera y la segunda opción es demasiado pequeño
 *
 * La aritmética de R3 solo VERIFICA la coherencia entre dos salidas neuronales;
 * nunca clasifica. El clasificador es siempre la cabeza de clase (invariante I2).
 */
export function decidir(
  logits: Float32Array,
  logitsBarras: Float32Array,
  logitsPuntos: Float32Array,
  umbrales: Umbrales,
  etiquetas: Etiquetas,
): Omit<Resultado, "tensor" | "msInferencia"> {
  const p = softmax(logits, umbrales.temperatura ?? 1);
  const orden = p.map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
  const top1 = orden[0].i;
  const top2 = orden[1].i;
  const confianza = orden[0].prob;

  const barras = argmax(logitsBarras);
  const puntos = argmax(logitsPuntos);
  const valor = etiquetas.valores[top1] ?? null;

  let motivo: MotivoRechazo | null = null;
  if (top1 === etiquetas.indice_no_valido) motivo = "clase_no_valida";
  else if (confianza < umbrales.tau) motivo = "baja_confianza";
  else if (valor !== 5 * barras + puntos) motivo = "inconsistencia";
  else if (confianza - orden[1].prob < umbrales.margen) motivo = "margen";

  return {
    valor: motivo ? null : valor,
    rechazada: motivo !== null,
    motivo,
    confianza,
    barras,
    puntos,
    probabilidades: p,
    top: orden.slice(0, 3).map(({ i, prob }) => ({
      etiqueta: etiquetas.etiquetas[i],
      valor: etiquetas.valores[i] ?? null,
      probabilidad: prob,
    })),
  };
}

/** Preprocesa, ejecuta el modelo y aplica el rechazo. */
export async function reconocer(
  rgba: Uint8ClampedArray,
  alto: number,
  ancho: number,
): Promise<Resultado> {
  const { sesion, etiquetas, umbrales } = await cargarRecursos();
  const ort = await import("onnxruntime-web");

  const tensorPlano = preparar(rgba, alto, ancho);
  const entrada = new ort.Tensor("float32", tensorPlano, [1, 1, LADO, LADO]);

  const t0 = performance.now();
  const salida = await sesion.run({ input: entrada });
  const ms = performance.now() - t0;

  const base = decidir(
    salida.logits.data as Float32Array,
    salida.barras.data as Float32Array,
    salida.puntos.data as Float32Array,
    umbrales,
    etiquetas,
  );
  return { ...base, tensor: tensorPlano, msInferencia: ms };
}

export const TEXTO_MOTIVO: Record<MotivoRechazo, string> = {
  clase_no_valida: "la red la reconoció como algo que no es un número maya",
  baja_confianza: "la confianza quedó por debajo del umbral",
  inconsistencia: "las barras y los puntos detectados no concuerdan con la clase",
  margen: "la red dudó entre dos números demasiado parecidos",
};
