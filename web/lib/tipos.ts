export type MotivoRechazo = "clase_no_valida" | "baja_confianza" | "inconsistencia" | "margen";

export type Origen = "archivo" | "camara" | "lienzo" | "portapapeles";

export interface Umbrales {
  version: number;
  temperatura: number;
  tau: number;
  margen: number;
  utilidad?: number;
  acierto_en_validas?: number;
  falso_rechazo_en_validas?: number;
  rechazo_en_no_validas?: number;
}

export interface Etiquetas {
  version: number;
  num_clases: number;
  indice_no_valido: number;
  num_barras: number;
  num_puntos: number;
  etiquetas: string[];
  valores: (number | null)[];
  composicion: Record<string, { barras: number; puntos: number }>;
  subclases_no_valido: string[];
}

export interface Metadata {
  run_id: string;
  modelo: string;
  arquitectura: string;
  parametros: number;
  bytes_onnx: number;
  lado_entrada: number;
  verificacion?: { max_diff: number; coincidencia_etiquetas: number; n_muestras: number };
  metricas?: Record<string, unknown> | null;
}

export interface Resultado {
  /** Número 1..19, o null si la imagen fue rechazada. */
  valor: number | null;
  rechazada: boolean;
  motivo: MotivoRechazo | null;
  /** Confianza calibrada de la clase más probable. */
  confianza: number;
  /** Cabezas auxiliares: lo que la red "contó". */
  barras: number;
  puntos: number;
  /** Probabilidades calibradas de las 20 clases. */
  probabilidades: number[];
  /** Las tres clases más probables, ya ordenadas. */
  top: { etiqueta: string; valor: number | null; probabilidad: number }[];
  /** El tensor 64x64 que realmente entró a la red, para el panel de depuración. */
  tensor: Float32Array;
  msInferencia: number;
}

export interface EntradaHistorial {
  id: string;
  resultado: Resultado;
  miniatura: string;
  origen: Origen;
  cuando: number;
}
