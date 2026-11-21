/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";

import GlifoMaya from "@/components/GlifoMaya";
import { IconoCheck } from "@/components/Iconos";
import SumaMaya from "@/components/SumaMaya";

import { D } from "./datos";
import { Cabeza, type Diapo, F, Flecha } from "./ui";

/* ------------------------------------------------------------------ 11 · Splits */
function Splits() {
  return (
    <>
      <Cabeza kicker="10 · Evaluar con honestidad" lead="Una métrica solo vale si el modelo nunca vio lo que se le pregunta.">
        Tres bolsas que <em>nunca se mezclan</em>
      </Cabeza>
      <div className="splits">
        <F n={1} className="caja bolsa">
          <b>Entrenamiento</b>
          <small>aprende · ≈ 80 %</small>
          <div className="puntos-bolsa">
            {Array.from({ length: 24 }).map((_, k) => (
              <i key={k} style={{ animationDelay: `${k * 90}ms` }} />
            ))}
          </div>
        </F>
        <F n={1} className="caja bolsa">
          <b>Validación</b>
          <small>elige y calibra · ≈ 12 %</small>
          <div className="puntos-bolsa corto">
            {Array.from({ length: 6 }).map((_, k) => (
              <i key={k} style={{ animationDelay: `${k * 120}ms` }} />
            ))}
          </div>
        </F>
        <F n={1} className="caja bolsa candado">
          <b>Prueba</b>
          <small>solo mide · ≈ 8 % + una mano completa</small>
          <div className="puntos-bolsa corto">
            {Array.from({ length: 4 }).map((_, k) => (
              <i key={k} style={{ animationDelay: `${k * 150}ms` }} />
            ))}
          </div>
        </F>
      </div>
      <div className="cuatro" style={{ marginTop: "clamp(10px, 2vh, 26px)" }}>
        <F n={2} className="tarj">
          <h3>Por grupos</h3>
          <p>Todas las variantes de una misma imagen van al mismo lado. Si no, la prueba sería un examen con respuestas.</p>
        </F>
        <F n={3} className="tarj">
          <h3>Mano excluida</h3>
          <p>Las fotos de Imri jamás se usaron para entrenar. Es lo más cercano a un docente con su propia letra.</p>
        </F>
        <F n={4} className="tarj">
          <h3>Lo externo, solo entrena</h3>
          <p>Un dataset ajeno tiene casi-duplicados entre sus propios splits y inflaría la métrica.</p>
        </F>
        <F n={5} className="tarj">
          <h3>Verificado por código</h3>
          <p>Una comprobación automática falla si una imagen o su copia aparece en dos bolsas.</p>
        </F>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 12 · Preprocesamiento */
const PRE = [
  ["pre-0.jpg", "Foto original", "claro"],
  ["pre-1-gris.png", "Escala de grises", "claro"],
  ["pre-2-recorte.png", "Se quita el 4 % del borde", "claro"],
  ["pre-3-polaridad.png", "Tinta clara, fondo oscuro", ""],
  ["pre-4-contraste.png", "Contraste estirado", ""],
  ["pre-5-cuadrado.png", "Se completa a cuadrado", ""],
  ["pre-6-64.png", "64 × 64 píxeles", ""],
] as const;

function Preproceso() {
  return (
    <>
      <Cabeza kicker="11 · Antes de la red" lead="Cada imagen pasa siempre por los mismos pasos. Así la red ve fotos distintas como si fueran parecidas.">
        De una foto a <em>4 096 números</em>
      </Cabeza>
      <div className="pre-fila">
        {PRE.map(([src, texto, cl], k) => (
          <F key={src} n={k + 1} className="pre-paso">
            <img className={`miniatura ${cl}`} src={`/presentacion/${src}`} alt={texto} />
            <div className="pie-img">
              {k + 1}. {texto}
            </div>
          </F>
        ))}
      </div>
      <div className="dos" style={{ marginTop: "clamp(10px, 2vh, 26px)" }}>
        <F n={7} className="tarj">
          <h3>La misma función en dos lenguajes</h3>
          <p>
            Se entrena en Python y corre en el navegador en TypeScript. Una prueba compara las dos
            sobre 200 imágenes: diferencia <b className="mono">0,0</b>.
          </p>
        </F>
        <F n={7} className="tarj">
          <h3>Un error que encontramos aquí</h3>
          <p>
            Al principio las fotos con sombra salían con la tinta al revés. Está en el análisis de
            errores.
          </p>
        </F>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 13 · Entrenamiento */
function CurvaA() {
  const W = 420;
  const H = 190;
  const px = (e: number) => 34 + (e / 22) * (W - 50);
  const py = (v: number) => H - 26 - ((v - 30) / 70) * (H - 46);
  const d = D.curvaA.map(([e, v], k) => `${k ? "L" : "M"}${px(e).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="grafico" role="img" aria-label="Exactitud en validación durante la etapa A, de 40,8 % a 97,6 %">
      {[40, 60, 80, 100].map((v) => (
        <g key={v}>
          <line x1="34" x2={W - 10} y1={py(v)} y2={py(v)} stroke="var(--linea)" />
          <text x="28" y={py(v) + 4} textAnchor="end" fontSize="11" fontFamily="var(--mono)" fill="var(--gris)">
            {v}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--jade)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="traza" />
      {D.curvaA.map(([e, v]) => (
        <circle key={e} cx={px(e)} cy={py(v)} r="3.5" fill="var(--jade)" />
      ))}
      <text x={W - 10} y={H - 6} textAnchor="end" fontSize="11" fontFamily="var(--mono)" fill="var(--gris)">
        épocas →
      </text>
    </svg>
  );
}

function Entrenamiento() {
  return (
    <>
      <Cabeza kicker="12 · Entrenar" lead="Mostrar ejemplos, medir el error y ajustar los parámetros, miles de veces.">
        Dos etapas de <em>entrenamiento</em>
      </Cabeza>
      <div className="flujo etapas">
        <F n={1} className="caja">
          <b>Etapa A</b>
          <small>sintético · 22 épocas · AdamW · tasa en coseno</small>
        </F>
        <Flecha />
        <F n={2} className="caja">
          <b>Etapa B</b>
          <small>afinado con fotos reales ×10 y el externo</small>
        </F>
        <Flecha />
        <F n={3} className="caja">
          <b>Calibración</b>
          <small>temperatura para que «90 %» signifique 90 %</small>
        </F>
        <Flecha />
        <F n={4} className="caja jade">
          <b>Exportar a ONNX</b>
          <small>{D.tamano} · coincidencia del 100 % con PyTorch</small>
        </F>
      </div>
      <div className="dos" style={{ marginTop: "clamp(10px, 2.2vh, 28px)" }}>
        <F n={1} className="tarj">
          <h3>Exactitud en validación, etapa A</h3>
          <CurvaA />
        </F>
        <div>
          <F n={2} className="tarj">
            <h3>La pérdida: tres errores sumados</h3>
            <p className="mono" style={{ fontSize: "clamp(13px,1.2vw,18px)", color: "var(--tinta)" }}>
              L = error(clase) + 0,3·error(barras) + 0,3·error(puntos)
            </p>
          </F>
          <F n={4} className="tarj" style={{ marginTop: 12 }}>
            <h3>Aumento de datos: nunca voltear</h3>
            <p>
              Rotamos, escalamos, cambiamos brillo, desenfocamos y tapamos partes. Pero{" "}
              <b>nunca volteamos</b>: un volteo vertical pondría los puntos debajo de las barras y
              crearía un caso inválido.
            </p>
          </F>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 14 · Rechazo */
const CAPAS_RECHAZO = [
  ["R1", "¿La red dice «no válido»?", "el cero, objetos, personas…"],
  ["R2", "¿La confianza llega al umbral?", "ya calibrada con temperatura"],
  ["R3", "¿Barras y puntos cuadran con la clase?", "5 × barras + puntos = número"],
  ["R4", "¿Gana por suficiente margen?", "frente a la segunda opción"],
] as const;

function Rechazo() {
  return (
    <>
      <Cabeza kicker="13 · Saber decir «no»" lead="Una imagen solo se acepta si pasa las cuatro puertas, en orden.">
        El rechazo, en <em>cuatro capas</em>
      </Cabeza>
      <div className="dos" style={{ alignItems: "start" }}>
        <div className="embudo">
          {CAPAS_RECHAZO.map(([id, q, sub], k) => (
            <F key={id} n={k + 1} className="puerta">
              <span className="id-puerta">{id}</span>
              <div>
                <b>{q}</b>
                <small>{sub}</small>
              </div>
              <span className="sale">rechaza</span>
            </F>
          ))}
          <F n={5} className="puerta acepta">
            <span className="id-puerta">
              <IconoCheck tamano={20} />
            </span>
            <div>
              <b>Se acepta</b>
              <small>y se muestra el número</small>
            </div>
          </F>
        </div>
        <div>
          <F n={5} className="tarj">
            <h3>Ante la duda, preferimos arriesgar un número</h3>
            <p>
              Equivocarse al rechazar un número válido cuesta cuatro veces más que aceptar uno
              inválido. Por eso el umbral se eligió maximizando <b>0,8 · aciertos en válidas + 0,2 ·
              rechazos en inválidas</b>.
            </p>
          </F>
          <F n={5} className="tarj" style={{ marginTop: 12 }}>
            <h3>Las reglas solo verifican</h3>
            <p>
              La clasificación siempre la hace la red. La aritmética de R3 únicamente comprueba que
              la red sea coherente consigo misma.
            </p>
          </F>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 15 · Recorrido completo */
function Recorrido() {
  return (
    <>
      <Cabeza kicker="14 · De la foto al número" lead="Un recorrido real, de principio a fin, en menos de 20 milisegundos.">
        Un número, <em>paso a paso</em>
      </Cabeza>
      <div className="recorrido">
        <F n={1} className="rec-paso">
          <img className="miniatura claro" src="/presentacion/pre-0.jpg" alt="La foto original" />
          <b>1 · Foto</b>
        </F>
        <Flecha />
        <F n={2} className="rec-paso">
          <img className="miniatura" src="/presentacion/pre-6-64.png" alt="La imagen de 64 por 64 píxeles" />
          <b>2 · 64 × 64</b>
        </F>
        <Flecha />
        <F n={3} className="caja jade rec-red">
          <b>3 · La red</b>
          <small>4 bloques + capa densa</small>
          <div className="viaja" aria-hidden="true" />
        </F>
        <Flecha />
        <F n={4} className="rec-cabezas">
          <div className="caja">
            <b>Clase</b>
            <small>14 · 99 %</small>
            <div className="barra-h" style={{ marginTop: 6 }}>
              <i style={{ "--v": 0.99 } as React.CSSProperties} />
            </div>
          </div>
          <div className="caja">
            <b>Barras</b>
            <small>2</small>
          </div>
          <div className="caja">
            <b>Puntos</b>
            <small>4</small>
          </div>
        </F>
      </div>
      <F n={5} className="dos" style={{ marginTop: "clamp(12px, 2.4vh, 30px)", alignItems: "center" }}>
        <div className="tarj">
          <h3>5 · Se comprueba</h3>
          <SumaMaya barras={2} puntos={4} />
          <p style={{ marginTop: 8 }}>2 × 5 + 4 = 14, igual que la clase: la respuesta es coherente.</p>
        </div>
        <F n={6} className="resultado-final">
          <GlifoMaya valor={14} ancho={120} animado />
          <div className="cifra-mini grande">14</div>
        </F>
      </F>
    </>
  );
}

/* ------------------------------------------------------------------ 16 · Resultados */
function Barra({ n, etiqueta, valor, nota, cin = false }: { n: number; etiqueta: string; valor: number; nota?: string; cin?: boolean }) {
  return (
    <F n={n} className="res-fila">
      <div className="res-cab">
        <span>{etiqueta}</span>
        <b className="mono">{valor.toFixed(1).replace(".", ",")} %</b>
      </div>
      <div className="barra-h">
        <i className={cin ? "cin" : ""} style={{ "--v": valor / 100 } as React.CSSProperties} />
      </div>
      {nota && <small className="nota">{nota}</small>}
    </F>
  );
}

function Resultados() {
  const ev = D.evolucion;
  return (
    <>
      <Cabeza kicker="15 · Resultados" lead="Medimos distintas cosas, porque una sola cifra no cuenta toda la historia.">
        Qué tan bien <em>funciona</em>
      </Cabeza>
      <div className="dos" style={{ alignItems: "start" }}>
        <div className="res-lista">
          <Barra n={1} etiqueta="Fotos de Imri, 38 válidas + 2 ceros" valor={100} nota={`${D.imriValidas} válidas · ${D.imriCeros} ceros rechazados`} />
          <Barra n={2} etiqueta="Estrés: 440 variaciones de esas fotos" valor={D.estres} nota="rotación, poca luz, desenfoque, baja resolución, márgenes" />
          <Barra n={3} etiqueta="Dibujos de lienzo, 5 estilos" valor={D.lienzo} nota="relleno, anillo, fino, garabato y toque" />
          <Barra n={4} etiqueta="Rechazo de casi-números" valor={D.rechazoCasi} cin nota="4 o 5 barras y 5 o más puntos: nuestro punto débil" />
        </div>
        <F n={3} className="tarj">
          <h3>Evolución en las mismas 38 fotos</h3>
          <div className="evo">
            {ev.map((e, k) => (
              <div key={e.etiqueta} className="evo-col" title={e.etiqueta}>
                <b className="mono">{e.v}</b>
                <div className="evo-barra" style={{ "--h": `${e.v}%`, animationDelay: `${k * 120}ms` } as React.CSSProperties} />
                <small>{e.etiqueta}</small>
              </div>
            ))}
          </div>
          <p>
            Cada barra es una corrida real. De <b>29 %</b> a <b>100 %</b>, y cada salto tiene una
            causa que explicamos a continuación.
          </p>
        </F>
      </div>
      <F n={4} className="nota" style={{ marginTop: "clamp(8px, 1.6vh, 20px)", maxWidth: "88ch" }}>
        Honestidad: son pocas fotos (40), y las usamos también para diagnosticar. Por eso sumamos
        pruebas de estrés y de lienzo, escritas aparte del entrenamiento. Un error en 40 fotos son
        2,5 puntos.
      </F>
    </>
  );
}

/* ------------------------------------------------------------------ 17 · Análisis de errores */
const ERRORES = [
  {
    t: "Polaridad invertida",
    sint: "El piloto acertaba solo el 29 %.",
    causa: "La regla marco-contra-centro confundía una sombra con el fondo y mandaba la imagen al revés: 3 de 40 fotos y el 5,8 % del sintético.",
    arreglo: "El fondo es la mediana de los píxeles: la tinta siempre es minoría.",
    antes: "52 errores", despues: "0", a: 0.06, d: 1, texto: "en 891 casos claros",
  },
  {
    t: "Trocitos de otros números",
    sint: "Una mano acertaba 8 de 19.",
    causa: "En la foto, junto al borde, asomaban restos de otros números de la hoja y la red los leía como «varios números».",
    arreglo: "Se descarta el 4 % de cada borde antes de procesar.",
    antes: "8 / 19", despues: "17 / 19", a: 0.42, d: 0.9, texto: "sin reentrenar",
  },
  {
    t: "Puntos huecos y garabatos",
    sint: "Dibujando en el lienzo con anillos: 7 de 38.",
    causa: "Solo había visto puntos rellenos; un círculo hueco le parecía algo distinto.",
    arreglo: "El generador ahora dibuja anillos, garabatos y trazos que tiemblan.",
    antes: "7 / 38", despues: "34 / 38", a: 0.18, d: 0.9, texto: "en la prueba de lienzo",
  },
  {
    t: "4 barras leídas como 3",
    sint: "4 barras + 1 punto salía como 16.",
    causa: "La cabeza de barras solo distingue 0 a 3 y trataba 4 como 3; solo se rechazaba el 69,8 % de los casi-números.",
    arreglo: "Miles de ejemplos de 4 y 5 barras como «no válido».",
    antes: "69,8 %", despues: "ver resultados", a: 0.7, d: 0.7, texto: "en entrenamiento",
  },
];

function Errores() {
  return (
    <>
      <Cabeza kicker="16 · Análisis de errores" lead="Cada fallo tuvo una causa que se pudo medir, corregir y volver a medir.">
        Lo que <em>se rompió</em> y cómo lo arreglamos
      </Cabeza>
      <div className="cuatro errores">
        {ERRORES.map((e, k) => (
          <F key={e.t} n={k + 1} className="tarj err">
            <h3>{e.t}</h3>
            <p className="sint">{e.sint}</p>
            <p>
              <b>Causa.</b> {e.causa}
            </p>
            <p>
              <b>Arreglo.</b> {e.arreglo}
            </p>
            <div className="antes-despues">
              <div>
                <small>antes</small>
                <div className="barra-h">
                  <i className="cin" style={{ "--v": e.a } as React.CSSProperties} />
                </div>
                <b className="mono">{e.antes}</b>
              </div>
              <div>
                <small>después</small>
                <div className="barra-h">
                  <i style={{ "--v": e.d } as React.CSSProperties} />
                </div>
                <b className="mono">{e.despues}</b>
              </div>
            </div>
            <small className="nota">{e.texto}</small>
          </F>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 18 · Límites */
function Limites() {
  return (
    <>
      <Cabeza kicker="17 · Límites y futuro" lead="Lo que todavía no hace bien, dicho con claridad.">
        <em>Limitaciones</em> y qué haríamos después
      </Cabeza>
      <div className="dos" style={{ alignItems: "start" }}>
        <div>
          <F n={1} className="tarj">
            <h3>Pocas manos reales</h3>
            <p>Solo tres personas escribieron los números. Con más manos, mejor generalización.</p>
          </F>
          <F n={2} className="tarj" style={{ marginTop: 12 }}>
            <h3>Resolución de 64 × 64</h3>
            <p>Una barra de lapicero muy fina mide menos de un píxel y se pierde. Subir a 96 o 128 lo atacaría de raíz.</p>
          </F>
          <F n={3} className="tarj" style={{ marginTop: 12 }}>
            <h3>Casi-números</h3>
            <p>Cuatro barras o puntos huecos muy separados siguen siendo la frontera más difícil del rechazo.</p>
          </F>
        </div>
        <F n={4} className="tarj">
          <h3>Con más tiempo</h3>
          <ul className="lista">
            <li>Fotos de muchas más personas, en distintas cámaras.</li>
            <li>Comparar contra transfer learning (MobileNet) en exactitud, tamaño y velocidad.</li>
            <li>Detectar varios números en una misma imagen.</li>
            <li>Mayor resolución de entrada.</li>
          </ul>
        </F>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 19 · Software */
function Software() {
  return (
    <>
      <Cabeza kicker="18 · El sistema completo" lead="El reconocimiento no usa ningún servidor: sucede dentro de tu navegador.">
        Una aplicación que <em>funciona sin internet</em>
      </Cabeza>
      <div className="arq">
        <F n={1} className="caja arq-entrena">
          <b>Entrenamiento</b>
          <small>Python · PyTorch</small>
        </F>
        <F n={1} style={{ alignSelf: "center" }}>
          <Flecha />
          <div className="pie-img">exporta .onnx</div>
        </F>
        <F n={2} className="caja jade arq-nav">
          <b>Tu navegador</b>
          <small>interfaz Next.js · ONNX Runtime Web · modelo de {D.tamano}</small>
          <div className="viaja" aria-hidden="true" />
          <div className="chips" style={{ justifyContent: "center", marginTop: 8 }}>
            <span className="chip">preprocesa</span>
            <span className="chip">reconoce</span>
            <span className="chip">decide</span>
          </div>
        </F>
        <F n={3} className="arq-lado">
          <div className="caja">
            <b>Vercel</b>
            <small>entrega la página y el modelo, una sola vez</small>
          </div>
          <div className="caja punteada">
            <b>Neon (opcional)</b>
            <small>solo registra cada predicción</small>
          </div>
        </F>
      </div>
      <F n={4} className="tres" style={{ marginTop: "clamp(10px, 2vh, 26px)" }}>
        <div className="tarj">
          <h3>Probado sin red</h3>
          <p>Con la conexión cortada, la aplicación sigue reconociendo y rechazando.</p>
        </div>
        <div className="tarj">
          <h3>Misma lógica en dos lenguajes</h3>
          <p>El preprocesamiento de Python y el de TypeScript dan exactamente el mismo resultado.</p>
        </div>
        <div className="tarj">
          <h3>{D.inferenciaMs} por imagen</h3>
          <p>Y {D.tamano} de modelo: cabe en cualquier página web.</p>
        </div>
      </F>
    </>
  );
}

/* ------------------------------------------------------------------ 20 · Conclusiones y demo */
function Final() {
  return (
    <>
      <Cabeza kicker="19 · Para cerrar" lead="Una red entrenada por nosotros, evaluada con honestidad y lista para probarse.">
        Conclusiones y <em>demostración</em>
      </Cabeza>
      <div className="tres">
        <F n={1} className="tarj">
          <h3>Los datos mandan</h3>
          <p>Casi todos nuestros saltos de precisión vinieron de mejorar los datos y su preprocesamiento, no la red.</p>
        </F>
        <F n={2} className="tarj">
          <h3>Rechazar es parte del problema</h3>
          <p>Enseñar qué no es un número, con negativos pensados, fue tan importante como enseñar los 19.</p>
        </F>
        <F n={3} className="tarj">
          <h3>Medir y volver a medir</h3>
          <p>Cada error se diagnosticó, se corrigió y se midió otra vez. Los límites que quedan están dichos.</p>
        </F>
      </div>
      <F n={4} className="cta">
        <Link className="boton primario cta-boton" href="/">
          Abrir la demostración
        </Link>
        <p className="nota">Probaremos del 1 al 19, con cámara, archivo y lienzo, y también imágenes que deben rechazarse.</p>
      </F>
    </>
  );
}

export const PARTE2: Diapo[] = [
  { id: "splits", titulo: "Evaluar con honestidad", pasos: 5, Contenido: Splits },
  { id: "preproceso", titulo: "Preprocesamiento", pasos: 7, Contenido: Preproceso },
  { id: "entrenamiento", titulo: "Entrenamiento", pasos: 4, Contenido: Entrenamiento },
  { id: "rechazo", titulo: "El rechazo", pasos: 5, Contenido: Rechazo },
  { id: "recorrido", titulo: "Un número, paso a paso", pasos: 6, Contenido: Recorrido },
  { id: "resultados", titulo: "Resultados", pasos: 4, Contenido: Resultados },
  { id: "errores", titulo: "Análisis de errores", pasos: 4, Contenido: Errores },
  { id: "limites", titulo: "Limitaciones", pasos: 4, Contenido: Limites },
  { id: "software", titulo: "El sistema completo", pasos: 4, Contenido: Software },
  { id: "final", titulo: "Conclusiones y demo", pasos: 4, Contenido: Final },
];

