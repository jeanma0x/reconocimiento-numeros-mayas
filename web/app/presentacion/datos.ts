/**
 * Cifras y textos de la presentación. TODO número sale de una corrida o medición real
 * (docs/ESTADO.md y docs/DECISIONES.md); si cambia el modelo instalado, se actualiza AQUÍ.
 */
export const EQUIPO = ["Jorge Zamora", "Julián Amado", "Gabriel Contreras", "Jean Marco Portillo"];

export const D = {
  parametros: "541 629",
  tamano: "2,22 MB",
  inferenciaMs: "7–19 ms",
  sinteticas: "más de 50 000",
  fotosReales: 93,
  externas: "4 701",
  clases: 20,

  // Mediciones del modelo instalado (corrida 20261121-003545-B (modelo J))
  imriValidas: "38 / 38",
  imriCeros: "2 / 2",
  estres: 98.4,
  lienzo: 95.3,
  validacion: 95.8,
  rechazoCasi: 90.6,

  // Evolución sobre las mismas 38 fotos válidas de Imri (cada punto es una corrida real)
  evolucion: [
    { etiqueta: "Piloto", v: 29 },
    { etiqueta: "Datos reales", v: 53 },
    { etiqueta: "Afinado", v: 68 },
    { etiqueta: "Formato", v: 71 },
    { etiqueta: "Polaridad", v: 89 },
    { etiqueta: "Bordes", v: 97 },
    { etiqueta: "Mano alzada", v: 100 },
  ],

  // Exactitud en validación del mejor punto guardado durante la etapa A (época, %)
  curvaA: [
    [1, 40.8], [2, 68.3], [4, 83.7], [5, 89.4], [6, 92.8], [9, 92.8],
    [11, 96.2], [16, 96.5], [17, 97.0], [19, 97.4], [22, 97.6],
  ] as [number, number][],
};
