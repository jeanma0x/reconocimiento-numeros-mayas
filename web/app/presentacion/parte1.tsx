/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

import GlifoMaya from "@/components/GlifoMaya";
import SumaMaya from "@/components/SumaMaya";

import { D, EQUIPO } from "./datos";
import { Cabeza, type Diapo, F, Flecha } from "./ui";

/* ------------------------------------------------------------------ 1 · Portada */
function Portada() {
  return (
    <div className="portada">
      <div className="portada-texto">
        <p className="k">Proyecto 02 · Inteligencia Artificial · 2026, II</p>
        <h1 className="titulo-portada">
          Reconocimiento de <em>números mayas</em> con redes neuronales convolucionales
        </h1>
        <p className="lead">
          Un sistema que lee del <b>1 al 19</b> y rechaza todo lo demás, y que corre entero en el
          navegador, sin servidor.
        </p>
        <div className="portada-pie">
          <div>
            <span className="etiqueta-pie">Universidad</span>
            <b>Universidad del Valle de Guatemala</b>
            <span>UVG Campus Sur</span>
          </div>
          <div>
            <span className="etiqueta-pie">Equipo</span>
            <b>{EQUIPO.slice(0, 2).join(" · ")}</b>
            <b>{EQUIPO.slice(2).join(" · ")}</b>
          </div>
        </div>
      </div>
      <div className="portada-glifo flota" aria-hidden="true">
        <GlifoMaya valor={19} ancho={220} animado />
      </div>
      <p className="portada-ayuda">
        <kbd className="tecla">→</kbd> avanzar · <kbd className="tecla">F</kbd> pantalla completa
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ 2 · El problema */
function Reto() {
  return (
    <>
      <Cabeza
        kicker="01 · El problema"
        lead={
          <>
            Dada una imagen, decir <b>qué número maya del 1 al 19 es</b>, o avisar de que{" "}
            <b>no lo es</b>.
          </>
        }
      >
        Leer un número… o <em>saber que no lo es</em>
      </Cabeza>
      <div className="flujo reto">
        <F n={1} className="tarj">
          <h3>Entrada</h3>
          <div className="fotos">
            <img className="miniatura claro" src="/presentacion/pre-0.jpg" alt="Foto real de un número maya" />
            <img className="miniatura claro" src="/presentacion/sint-0.jpg" alt="Imagen sintética sobre papel cuadriculado" />
            <img className="miniatura claro" src="/presentacion/sint-3.jpg" alt="Imagen sintética sobre fondo de madera" />
          </div>
          <p>Foto, cámara o dibujo. Cualquier fondo, luz y trazo.</p>
        </F>
        <Flecha />
        <F n={2} className="caja jade reto-red">
          <b>Red neuronal convolucional</b>
          <small>entrenada por nosotros</small>
          <div className="viaja" aria-hidden="true" />
        </F>
        <Flecha />
        <div className="salidas">
          <F n={3} className="tarj sal-ok">
            <div className="cifra-mini">14</div>
            <GlifoMaya valor={14} ancho={86} />
            <p>Un número del 1 al 19</p>
          </F>
          <F n={4} className="tarj sal-no">
            <h3>No es un número maya del 1 al 19</h3>
            <p>cero · 20 o más · otros sistemas · objetos, personas, paisajes</p>
          </F>
        </div>
      </div>
      <F n={4} className="chips" style={{ marginTop: "clamp(12px, 2.2vh, 28px)" }}>
        <span className="chip">Una imagen = un solo número</span>
        <span className="chip">Clasifica una red entrenada, no reglas escritas a mano</span>
        <span className="chip jade">Funciona sin internet</span>
      </F>
    </>
  );
}

/* ------------------------------------------------------------------ 3 · Numeración maya */
function Numeracion({ paso }: { paso: number }) {
  return (
    <>
      <Cabeza kicker="02 · El sistema maya" lead="Solo hay dos símbolos. Todo lo demás es aritmética.">
        Un punto vale <em>1</em>, una barra vale <em>5</em>
      </Cabeza>
      <div className="dos">
        <div className="constructor">
          <F n={1} className="par-simbolo">
            <svg width="58" height="58" viewBox="0 0 58 58" fill="currentColor" aria-hidden="true">
              <circle cx="29" cy="29" r="12" />
            </svg>
            <span>punto</span>
            <b>= 1</b>
          </F>
          <F n={2} className="par-simbolo">
            <svg width="58" height="58" viewBox="0 0 58 58" fill="currentColor" aria-hidden="true">
              <rect x="2" y="22" width="54" height="14" rx="7" />
            </svg>
            <span>barra</span>
            <b>= 5</b>
          </F>
          <F n={3} className="armado">
            <GlifoMaya valor={14} ancho={170} animado={paso >= 3} titulo="El número maya 14" />
            <SumaMaya barras={2} puntos={4} />
          </F>
          <F n={4} className="formula">
            valor = 5 × <em>barras</em> + <em>puntos</em>
            <small>0 a 3 barras · 0 a 4 puntos · 20 combinaciones, menos el (0, 0) = 19 números</small>
          </F>
        </div>
        <div className="rejilla19" aria-label="Los 19 números mayas">
          {Array.from({ length: 19 }, (_, k) => k + 1).map((v) => (
            <div key={v} className={`celda19${paso >= 3 && v === 14 ? " resalta" : ""}`}>
              <GlifoMaya valor={v} ancho={50} />
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 4 · Qué ve un computador */
/** Mapa de ink de 12×9: dos puntos y una barra (un «7»), como lo recibiría una red. */
export const MAPA = [
  "000000000000",
  "000990009900",
  "000990009900",
  "000000000000",
  "000000000000",
  "099999999990",
  "099999999990",
  "000000000000",
  "000000000000",
].map((f) => [...f].map(Number));

function QueVe({ paso }: { paso: number }) {
  const C = 38;
  return (
    <>
      <Cabeza kicker="03 · Cómo ve una máquina" lead="La red no «mira» un dibujo: recibe una tabla de números.">
        Una imagen es una <em>tabla de números</em>
      </Cabeza>
      <div className="dos">
        <svg viewBox={`0 0 ${12 * C} ${9 * C}`} className="mapa" role="img" aria-label="Mapa de píxeles de un siete maya">
          <rect width={12 * C} height={9 * C} fill="var(--superficie)" />
          {MAPA.map((fila, y) =>
            fila.map((v, x) => (
              <g key={`${x}-${y}`}>
                <rect
                  x={x * C}
                  y={y * C}
                  width={C}
                  height={C}
                  fill="var(--tinta)"
                  opacity={v / 9}
                  stroke="var(--linea)"
                  strokeWidth="1"
                />
                <text
                  x={x * C + C / 2}
                  y={y * C + C / 2 + 6}
                  textAnchor="middle"
                  fontFamily="var(--mono)"
                  fontSize="17"
                  fill={v > 4 ? "var(--superficie)" : "var(--gris)"}
                  opacity={paso >= 2 ? 1 : 0}
                  style={{ transition: "opacity .6s" }}
                >
                  {v}
                </text>
              </g>
            )),
          )}
        </svg>
        <div>
          <F n={1} className="tarj">
            <h3>Cada cuadro es un píxel</h3>
            <p>0 es papel en blanco y 9 es tinta. Esto es un «7» de 12 × 9 píxeles.</p>
          </F>
          <F n={2} className="tarj" style={{ marginTop: 14 }}>
            <h3>Eso es lo único que recibe la red</h3>
            <p>Nuestra red recibe 64 × 64 = <b className="mono">4 096</b> números por imagen.</p>
          </F>
          <F n={3} className="tarj" style={{ marginTop: 14 }}>
            <h3>Y aprende sola qué mirar</h3>
            <p>
              No le escribimos «una barra mide tanto». Le mostramos miles de ejemplos y ajusta sus
              propios parámetros hasta acertar.
            </p>
          </F>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 5 · Convolución */
const K = [
  [-1, -1, -1],
  [0, 0, 0],
  [1, 1, 1],
];
const SALIDA = Array.from({ length: MAPA.length - 2 }, (_, y) =>
  Array.from({ length: MAPA[0].length - 2 }, (_, x) => {
    let s = 0;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) s += K[j][i] * (MAPA[y + j][x + i] / 9);
    return s;
  }),
);
const FILAS_S = SALIDA.length;
const COLS_S = SALIDA[0].length;

function Convolucion({ paso }: { paso: number }) {
  const [k, setK] = useState(0);
  const total = FILAS_S * COLS_S;
  useEffect(() => {
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) {
      setK(total);
      return;
    }
    const id = setInterval(() => setK((v) => (v >= total + 14 ? 0 : v + 1)), 200);
    return () => clearInterval(id);
  }, [total]);

  const C = 30;
  const pos = Math.min(k, total - 1);
  const wy = Math.floor(pos / COLS_S);
  const wx = pos % COLS_S;
  return (
    <>
      <Cabeza
        kicker="04 · La convolución"
        lead="Un filtro pequeño recorre la imagen y mide, en cada lugar, cuánto se parece a un patrón."
      >
        Un filtro que <em>recorre</em> la imagen
      </Cabeza>
      <div className="conv">
        <figure>
          <svg viewBox={`0 0 ${12 * C} ${9 * C}`} className="mapa" role="img" aria-label="La imagen con el filtro de 3 por 3 recorriéndola">
            {MAPA.map((fila, y) =>
              fila.map((v, x) => (
                <rect key={`${x}-${y}`} x={x * C} y={y * C} width={C} height={C} fill="var(--tinta)" opacity={0.06 + (v / 9) * 0.94} stroke="var(--superficie)" strokeWidth="1" />
              )),
            )}
            <rect x={wx * C} y={wy * C} width={3 * C} height={3 * C} fill="none" stroke="var(--jade)" strokeWidth="3.5" />
          </svg>
          <figcaption className="pie-img">imagen (12 × 9)</figcaption>
        </figure>

        <F n={1} className="kernel">
          <div className="x">×</div>
          <table aria-label="Matriz del filtro">
            <tbody>
              {K.map((f, y) => (
                <tr key={y}>
                  {f.map((v, x) => (
                    <td key={x} className={v > 0 ? "pos" : v < 0 ? "neg" : ""}>
                      {v > 0 ? "+1" : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pie-img">filtro de bordes horizontales</div>
        </F>

        <figure>
          <svg viewBox={`0 0 ${COLS_S * C} ${FILAS_S * C}`} className="mapa" role="img" aria-label="Mapa de características resultante">
            {SALIDA.map((fila, y) =>
              fila.map((v, x) => {
                const idx = y * COLS_S + x;
                const visible = idx <= k;
                const fuerza = Math.min(1, Math.abs(v) / 3);
                return (
                  <rect
                    key={`${x}-${y}`}
                    x={x * C}
                    y={y * C}
                    width={C}
                    height={C}
                    fill={v > 0.02 ? "var(--jade)" : v < -0.02 ? "var(--cinabrio)" : "var(--linea)"}
                    opacity={visible ? (Math.abs(v) < 0.02 ? 0.35 : 0.25 + fuerza * 0.75) : 0.08}
                    stroke="var(--superficie)"
                    strokeWidth="1"
                  />
                );
              }),
            )}
          </svg>
          <figcaption className="pie-img">mapa de características (10 × 7)</figcaption>
        </figure>
      </div>
      <F n={2} className="chips" style={{ marginTop: "clamp(10px, 2vh, 24px)" }}>
        <span className="chip jade">Verde: el filtro encuentra el borde superior de una barra o punto</span>
        <span className="chip cin">Rojo: encuentra el borde inferior</span>
        <span className="chip">Nuestra red tiene 4 bloques, y cada filtro lo aprende ella sola</span>
      </F>
      <span className="solo-lector">Paso {paso}</span>
    </>
  );
}

/* ------------------------------------------------------------------ 6 · Las capas */
function Capa({
  n,
  lado,
  apiladas,
  titulo,
  forma,
  texto,
}: {
  n: number;
  lado: number;
  apiladas: number;
  titulo: string;
  forma: string;
  texto: string;
}) {
  const W = 130;
  const a = apiladas;
  return (
    <F n={n} className="capa">
      <svg viewBox={`0 0 ${W} ${W}`} width="100%" aria-hidden="true">
        {Array.from({ length: a }).map((_, idx) => {
          const j = a - 1 - idx; // idx 0 se dibuja al fondo; j = 0 es la capa frontal
          return (
            <rect
              key={idx}
              x={8 + j * 7}
              y={8 + (a - 1 - j) * 7}
              width={lado}
              height={lado}
              fill="var(--superficie)"
              stroke="var(--tinta)"
              strokeWidth="1.3"
              opacity={j === 0 ? 1 : 0.7}
            />
          );
        })}
      </svg>
      <b>{titulo}</b>
      <span className="mono">{forma}</span>
      <p>{texto}</p>
    </F>
  );
}

function Capas({ paso }: { paso: number }) {
  return (
    <>
      <Cabeza kicker="05 · La red por dentro" lead="Cada bloque mira a la imagen con más «distancia»: de trazos sueltos a partes del número.">
        De la imagen a las <em>partes</em> del número
      </Cabeza>
      <div className="capas">
        <Capa n={1} lado={86} apiladas={1} titulo="Imagen" forma="64 × 64 × 1" texto="Lo que recibe la red" />
        <Flecha />
        <Capa n={2} lado={72} apiladas={3} titulo="Bloque 1" forma="32 × 32 · 32 filtros" texto="Bordes y trazos" />
        <Flecha />
        <Capa n={3} lado={58} apiladas={4} titulo="Bloque 2" forma="16 × 16 · 64" texto="Curvas y esquinas" />
        <Flecha />
        <Capa n={4} lado={46} apiladas={5} titulo="Bloque 3" forma="8 × 8 · 96" texto="Puntos y barras" />
        <Flecha />
        <Capa n={5} lado={36} apiladas={5} titulo="Bloque 4" forma="4 × 4 · 128" texto="Partes del número" />
        <Flecha />
        <Capa n={6} lado={28} apiladas={5} titulo="Rejilla 3 × 3" forma="128 × 3 × 3" texto="Dónde está cada parte" />
      </div>
      <F n={6} className="dos" style={{ marginTop: "clamp(10px, 2vh, 26px)", alignItems: "start" }}>
        <div className="chips">
          <span className="chip">Convolución: detecta patrones</span>
          <span className="chip">ReLU: deja pasar solo lo positivo</span>
          <span className="chip">Pooling: resume cada 2 × 2 y reduce a la mitad</span>
        </div>
        <p className="nota">
          Al final usamos una rejilla de 3 × 3 y no un promedio global: en un número maya{" "}
          <b>la posición es el significado</b>. Los puntos van arriba y las barras abajo; un
          promedio global borraría eso.
        </p>
      </F>
      <span className="solo-lector">Paso {paso}</span>
    </>
  );
}

/* ------------------------------------------------------------------ 7 · Tres cabezas */
function Cabezas() {
  return (
    <>
      <Cabeza kicker="06 · Nuestro modelo" lead="Una sola red, tres respuestas: el mismo hecho contado por tres caminos.">
        Una red, <em>tres cabezas</em>
      </Cabeza>
      <div className="cabezas">
        <F n={1} className="caja tronco">
          <b>Tronco compartido</b>
          <small>4 bloques de convolución + capa densa de 192</small>
        </F>
        <div className="tres-cab">
          <F n={2} className="caja jade">
            <b>Clase · 20 salidas</b>
            <small>los 19 números + «no válido»</small>
            <div className="tag-decide">decide</div>
          </F>
          <F n={2} className="caja">
            <b>Barras · 0 a 3</b>
            <small>cuántas barras ve</small>
          </F>
          <F n={2} className="caja">
            <b>Puntos · 0 a 4</b>
            <small>cuántos puntos ve</small>
          </F>
        </div>
        <F n={3} className="caja punteada verifica">
          <b>
            ¿5 × barras + puntos = clase?
          </b>
          <small>solo verifica, nunca decide la respuesta</small>
        </F>
      </div>
      <F n={3} className="tres" style={{ marginTop: "clamp(10px, 2vh, 24px)" }}>
        <div className="tarj">
          <h3>Regulariza</h3>
          <p>Aprender el mismo hecho por tres caminos evita memorizar.</p>
        </div>
        <div className="tarj">
          <h3>Se verifica solo</h3>
          <p>Si la clase y el conteo no coinciden, la red desconfía de sí misma.</p>
        </div>
        <div className="tarj">
          <h3>Es explicable</h3>
          <p>Se puede mostrar qué contó. {D.parametros} parámetros · {D.tamano} · {D.inferenciaMs} por imagen.</p>
        </div>
      </F>
    </>
  );
}

/* ------------------------------------------------------------------ 8 · Dataset */
function Dataset() {
  return (
    <>
      <Cabeza kicker="07 · El dataset" lead="Tres fuentes con papeles distintos, y 20 clases: los 19 números y «no válido».">
        Cómo armamos <em>los datos</em>
      </Cabeza>
      <div className="tres">
        <F n={1} className="tarj">
          <div className="grande">{D.sinteticas}</div>
          <h3>Sintéticas</h3>
          <div className="mosaico">
            {[0, 1, 2, 3].map((k) => (
              <img key={k} className="miniatura claro" src={`/presentacion/sint-${k}.jpg`} alt="Ejemplo de imagen sintética" />
            ))}
          </div>
          <p>Generadas por código: fondos, luz, perspectiva, ruido.</p>
          <div className="rol">entrena · valida · prueba</div>
        </F>
        <F n={2} className="tarj">
          <div className="grande">{D.fotosReales}</div>
          <h3>Fotos reales</h3>
          <img className="miniatura claro" style={{ marginBottom: 8 }} src="/presentacion/pre-0.jpg" alt="Foto real de un número maya" />
          <p>Tres manos distintas, con marcador, lapicero y pluma fina.</p>
          <div className="rol">lo que de verdad se evalúa</div>
        </F>
        <F n={3} className="tarj">
          <div className="grande">{D.externas}</div>
          <h3>Dataset externo</h3>
          <p style={{ margin: "12px 0" }}>
            De terceros. Lo auditamos: descartamos 240 imágenes mal etiquetadas y quitamos 339
            duplicadas.
          </p>
          <p>Mide parecido con su generador, no acierto sobre letra humana.</p>
          <div className="rol">solo entrena, nunca puntúa</div>
        </F>
      </div>
      <F n={4} className="fila-clases">
        <div className="glifos-fila" aria-hidden="true">
          {Array.from({ length: 19 }, (_, k) => (
            <GlifoMaya key={k} valor={k + 1} ancho={34} />
          ))}
        </div>
        <span className="chip cin">+ no válido</span>
        <span className="nota"> = {D.clases} clases</span>
      </F>
    </>
  );
}

/* ------------------------------------------------------------------ 9 · Generador sintético */
function Generador() {
  const pasos = ["Glifo", "Fondo", "Luz y sombra", "Perspectiva", "Ruido y foco"];
  const detalle = [
    "puntos y barras con temblor, huecos o rellenos",
    "papel, cuadriculado, madera, pizarrón…",
    "iluminación desigual y sombras",
    "rotación e inclinación",
    "grano, desenfoque, compresión",
  ];
  return (
    <>
      <Cabeza kicker="08 · Datos sintéticos" lead="Como no hay miles de fotos, escribimos un programa que dibuja números mayas y los «fotografía» de mil maneras.">
        Un generador de <em>imágenes</em>
      </Cabeza>
      <div className="flujo gen">
        {pasos.map((p, k) => (
          <div key={p} style={{ display: "contents" }}>
            <F n={k + 1} className="caja">
              <b>{p}</b>
              <small>{detalle[k]}</small>
            </F>
            {k < pasos.length - 1 && <Flecha />}
          </div>
        ))}
      </div>
      <div className="galeria">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <F key={k} n={5} style={{ transitionDelay: `${k * 90}ms` }}>
            <img className="miniatura claro" src={`/presentacion/sint-${k}.jpg`} alt="Ejemplo de imagen sintética" />
          </F>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 10 · Negativos */
const NEG = [
  ["cero_maya", "el cero maya"],
  ["mayor_19", "20 o más"],
  ["casi_valido", "casi válido"],
  ["multiples", "varios números"],
  ["digitos_arabigos", "dígitos arábigos"],
  ["romanos", "números romanos"],
  ["dibujos", "dibujos"],
  ["vacio", "hoja vacía"],
];

function Negativos() {
  return (
    <>
      <Cabeza kicker="09 · Lo que NO es un número" lead="Enseñar qué no es un número vale tanto como enseñar los 19. Aquí está la frontera del rechazo.">
        Los <em>negativos</em>
      </Cabeza>
      <div className="negativos">
        {NEG.map(([id, nombre], k) => (
          <F key={id} n={1} style={{ transitionDelay: `${k * 80}ms` }} className={id === "casi_valido" ? "neg resalta-neg" : "neg"}>
            <img className="miniatura claro" src={`/presentacion/neg-${id}.jpg`} alt={`Ejemplo negativo: ${nombre}`} />
            <div className="pie-img">{nombre}</div>
          </F>
        ))}
      </div>
      <F n={2} className="tarj" style={{ marginTop: "clamp(10px, 2vh, 24px)" }}>
        <h3>«Casi válido» es la clase que más cuesta</h3>
        <p>
          Cinco puntos, cuatro barras, puntos debajo de las barras, elementos dispersos: se parecen
          a un número y no lo son. Es donde se decide si el rechazo funciona.
        </p>
      </F>
    </>
  );
}

export const PARTE1: Diapo[] = [
  { id: "portada", titulo: "Portada", pasos: 0, Contenido: Portada },
  { id: "reto", titulo: "El problema", pasos: 4, Contenido: Reto },
  { id: "numeracion", titulo: "El sistema maya", pasos: 4, Contenido: Numeracion },
  { id: "que-ve", titulo: "Cómo ve una máquina", pasos: 3, Contenido: QueVe },
  { id: "convolucion", titulo: "La convolución", pasos: 2, Contenido: Convolucion },
  { id: "capas", titulo: "La red por dentro", pasos: 6, Contenido: Capas },
  { id: "cabezas", titulo: "Tres cabezas", pasos: 3, Contenido: Cabezas },
  { id: "dataset", titulo: "El dataset", pasos: 4, Contenido: Dataset },
  { id: "generador", titulo: "Datos sintéticos", pasos: 5, Contenido: Generador },
  { id: "negativos", titulo: "Los negativos", pasos: 2, Contenido: Negativos },
];

