"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import GlifoMaya from "@/components/GlifoMaya";

import { D, EQUIPO } from "./datos";
import { Cabeza, dec, F, miles, N, useContar, type Diapo } from "./ui";

const IMG = "/presentacion";

/* ───────────── 1 · Portada ───────────── */
function Portada() {
  const [v, setV] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setV((x) => (x % 19) + 1), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="portada">
      <div>
        <p className="k">Proyecto final · Inteligencia Artificial</p>
        <h1 className="h">
          Una red que lee <em>números mayas</em>
        </h1>
        <p className="sub">Reconoce del 1 al 19 y avisa cuando lo que ve no es un número.</p>
        <div className="portada-pie">
          <div>
            <small>Universidad</small>
            <b>UVG Campus Sur</b>
          </div>
          <div>
            <small>Equipo</small>
            <b>
              {EQUIPO[0]} · {EQUIPO[1]}
              <br />
              {EQUIPO[2]} · {EQUIPO[3]}
            </b>
          </div>
        </div>
      </div>
      <div className="reloj" aria-hidden="true">
        <GlifoMaya key={v} valor={v} ancho={340} className="glifo" animado />
        <span className="valor">{v}</span>
      </div>
    </div>
  );
}

/* ───────────── 2 · Qué es una CNN (introducción) ───────────── */
const COLS = [6, 7, 7, 3];
const CX = [12, 38, 64, 90];
const ny = (i: number, n: number) => 30 - ((n - 1) * 5.2) / 2 + i * 5.2;
function IntroCNN() {
  const lineas: React.ReactNode[] = [];
  for (let c = 0; c < COLS.length - 1; c++)
    for (let i = 0; i < COLS[c]; i++)
      for (let j = 0; j < COLS[c + 1]; j++)
        lineas.push(
          <line key={`${c}-${i}-${j}`} className="enlace" style={{ animationDelay: `${c * 0.8 + ((i + j) % 5) * 0.05}s` }} x1={CX[c]} y1={ny(i, COLS[c])} x2={CX[c + 1]} y2={ny(j, COLS[c + 1])} />,
        );
  const nombres = ["Imagen", "Filtros", "Formas", "Respuesta"];
  return (
    <div className="dos intro">
      <div>
        <Cabeza k="Antes de empezar" sub={<>Un programa que <b>aprende a reconocer imágenes</b> viendo miles de ejemplos, sin que nadie le escriba las reglas.</>}>
          ¿Qué es una <em>CNN</em>?
        </Cabeza>
        <F n={1} className="tres-pasos">
          <div><b className="jade">1 · Mira</b><span>filtros que buscan trazos</span></div>
          <div><b className="azul">2 · Combina</b><span>capas que arman formas</span></div>
          <div><b className="ocre">3 · Decide</b><span>entrega una respuesta</span></div>
        </F>
        <F n={2}>
          <p className="pregunta">No le dimos reglas. Le dimos ejemplos y aprendió sola.</p>
        </F>
      </div>
      <div className="red" aria-hidden="true">
        <svg viewBox="0 0 102 62">
          {lineas}
          {COLS.map((n, c) =>
            Array.from({ length: n }).map((_, i) => (
              <circle key={`${c}-${i}`} className="neurona" style={{ animationDelay: `${c * 0.8 + i * 0.06}s` }} cx={CX[c]} cy={ny(i, n)} r="1.9" />
            )),
          )}
          {nombres.map((t, c) => (
            <text key={t} x={CX[c]} y="58" textAnchor="middle" className="nom-red">{t}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ───────────── 3 · Cómo funciona (de lo simple a lo complejo) ───────────── */
function Complejo({ paso }: { paso: number }) {
  const nodos = [
    {
      t: "Trazos",
      d: "Primero busca líneas y bordes sueltos",
      vis: (
        <svg width="84" height="70" viewBox="0 0 84 70" fill="none" stroke="var(--jade)" strokeWidth="5" strokeLinecap="round" aria-hidden="true">
          <path d="M10 16h26" /><path d="M48 12l22 10" /><path d="M14 40v20" /><path d="M44 58h28" /><path d="M56 34l12 14" />
        </svg>
      ),
    },
    {
      t: "Partes",
      d: "Luego las junta: puntos y barras",
      vis: (
        <svg width="84" height="70" viewBox="0 0 84 70" fill="var(--azul)" aria-hidden="true">
          <circle cx="24" cy="20" r="9" /><circle cx="54" cy="20" r="9" /><rect x="8" y="42" width="68" height="12" rx="6" />
        </svg>
      ),
    },
    { t: "Número", d: "Al final entiende cuántos hay y dónde", vis: <GlifoMaya valor={14} ancho={92} className="glifo" /> },
    {
      t: "Votación",
      d: "Reparte su confianza entre las opciones",
      vis: (
        <svg width="110" height="70" viewBox="0 0 110 70" aria-hidden="true">
          {[["14", 88, "var(--jade)"], ["13", 30, "var(--ocre)"], ["no", 14, "var(--cinabrio)"]].map(([t, w, col], i) => (
            <g key={String(t)}>
              <text x="0" y={16 + i * 22} fill="#a3ada6" fontSize="11" fontFamily="monospace">{t}</text>
              <rect x="22" y={7 + i * 22} width={Number(w)} height="12" rx="6" fill={String(col)} />
            </g>
          ))}
        </svg>
      ),
    },
  ];
  return (
    <>
      <Cabeza k="Cómo funciona">
        De lo simple <em>a lo complejo</em>
      </Cabeza>
      <div className="flujo">
        {nodos.map((n, i) => (
          <div key={n.t} style={{ display: "contents" }}>
            {i > 0 && <div className="conn" style={N(i)} />}
            <F n={i + 1} className={`nodo${paso === i + 1 ? " activo" : paso > i + 1 ? " hecho" : ""}`}>
              <div className="caja">{n.vis}</div>
              <h3>{n.t}</h3>
              <p>{n.d}</p>
            </F>
          </div>
        ))}
      </div>
      <F n={5}>
        <p className="pregunta" style={{ maxWidth: "52ch" }}>
          Mientras aprende, cada error ajusta un poco sus filtros. Con miles de ejemplos, cada vez se equivoca menos.
        </p>
      </F>
      <F n={4}><p className="nota" style={{ marginTop: 10 }}>Las barras de votación son un ejemplo ilustrativo.</p></F>
    </>
  );
}

/* ───────────── 4 · El reto ───────────── */
function Reto() {
  return (
    <>
      <Cabeza k="El reto">
        Tres símbolos, <em>diecinueve</em> números
      </Cabeza>
      <F n={1} className="simbolos">
        <div className="simbolo">
          <GlifoMaya valor={1} ancho={92} />
          <div className="vale">1</div>
          <small>un punto</small>
        </div>
        <div className="simbolo">
          <GlifoMaya valor={5} ancho={92} />
          <div className="vale">5</div>
          <small>una barra</small>
        </div>
        <div className="simbolo">
          <svg width="92" height="76" viewBox="0 0 92 76" fill="none" stroke="currentColor" strokeWidth="5" aria-hidden="true">
            <ellipse cx="46" cy="38" rx="26" ry="14" />
            <path d="M30 38c10 6 22 6 32 0" strokeWidth="3" />
          </svg>
          <div className="vale">0</div>
          <small>concha · fuera del reto</small>
        </div>
      </F>
      <F n={2} className="cuenta">
        <span className="pastilla">3 barras</span>+<span className="pastilla">4 puntos</span>=
        <span className="res">5×3 + 4 = 19</span>
        <GlifoMaya valor={19} ancho={110} className="glifo" />
      </F>
      <F n={3} className="pregunta">
        Y si la imagen no es un número del 1 al 19, la red debe decir «no sé».
      </F>
    </>
  );
}

/* ───────────── 3 · Qué es una CNN ───────────── */
const BITMAP = [
  "..............",
  "..##..##..##..",
  "..##..##..##..",
  "..............",
  ".############.",
  ".############.",
  "..............",
  ".############.",
  ".############.",
  "..............",
];
const W = BITMAP[0].length;
const H = BITMAP.length;
const KERNEL = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];
const OW = W - 2;
const OH = H - 2;
const RESP: number[] = [];
for (let y = 0; y < OH; y++)
  for (let x = 0; x < OW; x++) {
    let s = 0;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) s += KERNEL[j][i] * (BITMAP[y + j][x + i] === "#" ? 1 : 0);
    RESP.push(s);
  }

function Convolucion({ paso }: { paso: number }) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (paso < 1) {
      setK(0);
      return;
    }
    const t = setInterval(() => setK((x) => (x >= OW * OH + 70 ? 0 : x + 1)), 48);
    return () => clearInterval(t);
  }, [paso]);
  const pos = Math.min(k, OW * OH - 1);
  const wx = pos % OW;
  const wy = Math.floor(pos / OW);
  const celda = "calc(var(--u) * 2.15)";
  return (
    <>
      <Cabeza k="El filtro">
        Cómo <em>mira</em> una CNN
      </Cabeza>
      <div className="escena">
        <div>
          <div className="pix" style={{ gridTemplateColumns: `repeat(${W}, ${celda})` }}>
            {BITMAP.flatMap((fila, y) => [...fila].map((c, x) => <i key={`${x}-${y}`} className={c === "#" ? "on" : ""} />))}
            {paso >= 1 && (
              <div className="ventana" style={{ left: `calc(${wx} * (${celda} + 2px) + 3px)`, top: `calc(${wy} * (${celda} + 2px) + 3px)` }} />
            )}
          </div>
          <div className="leyenda">La foto: una cuadrícula de números</div>
        </div>
        <F n={1} className="filtro-col esc-fil">
          <div className="filtro" aria-hidden="true">
            {KERNEL.flat().map((v, i) => (
              <span key={i} className={v > 0 ? "cp" : v < 0 ? "cn" : "cz"}>
                {v > 0 ? "+1" : v}
              </span>
            ))}
          </div>
          <div className="leyenda">Un filtro, como una linterna</div>
        </F>
        <F n={1} className="esc-mapa">
          <div className="pix mapa" style={{ gridTemplateColumns: `repeat(${OW}, ${celda})` }}>
            {RESP.map((r, i) => (
              <i key={i} className={i >= k ? "sinval" : r > 0 ? "pos" : r < 0 ? "neg" : "sinval"} style={i < k && r !== 0 ? { opacity: Math.min(1, Math.abs(r) / 3 + 0.25) } : undefined} />
            ))}
          </div>
          <div className="leyenda">Dónde encontró lo que busca</div>
          <div className="claves">
            <span><i className="v" />borde de arriba</span>
            <span><i className="r" />borde de abajo</span>
          </div>
        </F>
      </div>
      <F n={2}>
        <p className="sub" style={{ maxWidth: "none", textAlign: "center" }}>
          Cada cuadro compara con el filtro y se pinta: <b>verde</b> si hay un borde de arriba, <b>rojo</b> si hay uno de abajo. La red aprende sola cientos de filtros como este.
        </p>
      </F>
    </>
  );
}

/* ───────────── 4 · Flujo de punta a punta ───────────── */
function Flujo({ paso }: { paso: number }) {
  const nodos = [
    { t: "Tu imagen", d: "Subes una foto o la dibujas", vis: <img src={`${IMG}/pre-0.jpg`} alt="Foto de un número maya" /> },
    { t: "Se limpia", d: "Blanco y negro, 64 × 64", vis: <img className="px" src={`${IMG}/pre-6-64.png`} alt="La misma imagen reducida a 64 por 64 píxeles" /> },
    {
      t: "La red mira",
      d: "Capa tras capa, de líneas a números",
      vis: (
        <svg className="pila-svg" width="84" height="62" viewBox="0 0 84 62" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${i * 17},${i * 2})`}>
              <rect x="0" y={6 + i * 3} width={22 - i * 4} height={42 - i * 8} rx="3" />
              <rect x="5" y={1 + i * 3} width={22 - i * 4} height={42 - i * 8} rx="3" fill="rgba(78,224,168,.12)" />
            </g>
          ))}
        </svg>
      ),
    },
    {
      t: "Se revisa",
      d: "¿Tiene sentido la respuesta?",
      vis: (
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m7.5 12.5 3 3 6-6.5" />
        </svg>
      ),
    },
    { t: "Respuesta", d: "Catorce, con su confianza", vis: <GlifoMaya valor={14} ancho={92} className="glifo" /> },
  ];
  return (
    <>
      <Cabeza k="El recorrido">
        Del dibujo a <em>la respuesta</em>
      </Cabeza>
      <div className="flujo">
        {nodos.map((n, i) => (
          <div key={n.t} style={{ display: "contents" }}>
            {i > 0 && <div className="conn" style={N(i)} />}
            <F n={i + 1} className={`nodo${paso === i + 1 ? " activo" : paso > i + 1 ? " hecho" : ""}`}>
              <div className="caja">{n.vis}</div>
              <h3>{n.t}</h3>
              <p>{n.d}</p>
            </F>
          </div>
        ))}
      </div>
      <F n={3} className="detalle-red">
        <b>Dentro de «La red mira»:</b> 4 bloques de filtros, de líneas simples a las partes del número. Lo vemos en detalle en la diapositiva 7.
      </F>
      <F n={6}>
        <span className="sello">Todo ocurre en tu navegador · sin servidor · sin internet</span>
      </F>
    </>
  );
}

/* ───────────── 5 · Por dentro ───────────── */
function Pila({ n, lado, i }: { n: number; lado: number; i: number }) {
  const off = 0.9;
  return (
    <div className="pila" style={{ width: `calc(var(--u) * ${lado + n * off})`, height: `calc(var(--u) * ${lado + n * off})` }}>
      {Array.from({ length: n }).map((_, k) => (
        <b key={k} style={{ width: `calc(var(--u) * ${lado})`, height: `calc(var(--u) * ${lado})`, left: `calc(var(--u) * ${k * off})`, bottom: `calc(var(--u) * ${k * off})`, "--i": i + k * 0.12 } as React.CSSProperties} />
      ))}
    </div>
  );
}
function PorDentro() {
  const capas = [
    { n: 2, lado: 6.6, t: "Líneas", d: "bordes y trazos" },
    { n: 3, lado: 5.4, t: "Formas", d: "curvas y esquinas" },
    { n: 4, lado: 4.3, t: "Partes", d: "puntos y barras" },
    { n: 5, lado: 3.1, t: "Posición", d: "dónde está cada parte" },
  ];
  return (
    <>
      <Cabeza k="Por dentro">
        De líneas a <em>números</em>
      </Cabeza>
      <F n={1} className="capas">
        <div className="capa entrada">
          <img src={`${IMG}/pre-6-64.png`} alt="Imagen de 64 por 64 píxeles que entra a la red" />
          <h3>Imagen</h3>
          <p>64 × 64 píxeles</p>
        </div>
        {capas.map((c, i) => (
          <div key={c.t} style={{ display: "contents" }}>
            <span className="sig" aria-hidden="true">→</span>
            <div className="capa">
              <Pila n={c.n} lado={c.lado} i={i} />
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </div>
          </div>
        ))}
      </F>
      <F n={1}>
        <p className="nota" style={{ textAlign: "center", marginTop: 8 }}>
          Cada cuadro es un filtro que busca algo distinto. Cada bloque ve «más lejos» que el anterior y usa más filtros.
        </p>
      </F>
      <F n={2} className="tres">
        <div className="cab"><small>Pregunta 1</small><div className="q">¿Qué número es?</div><div className="r">14</div></div>
        <div className="cab"><small>Pregunta 2</small><div className="q">¿Cuántas barras?</div><div className="r">2</div></div>
        <div className="cab"><small>Pregunta 3</small><div className="q">¿Cuántos puntos?</div><div className="r">4</div></div>
      </F>
      <F n={3} className="verif">
        5 × 2 + 4 = 14 <span className="ok-p">COINCIDEN → respuesta segura</span>
      </F>
    </>
  );
}

/* ───────────── 6 · Datos ───────────── */
function Datos({ paso }: { paso: number }) {
  const a = useContar(50000, paso >= 1);
  const b = useContar(D.fotosReales, paso >= 2, 1200);
  const c = useContar(4701, paso >= 3);
  return (
    <>
      <Cabeza k="Con qué la entrenamos">
        Con qué <em>aprendió</em>
      </Cabeza>
      <div className="tarjetas">
        <F n={1} className="tarj">
          <div className="grande jade">+{miles(a)}</div>
          <h3>Creadas por código</h3>
          <p>Generamos números con distinta letra, luz, fondo y perspectiva.</p>
          <div className="miniaturas">
            {[0, 1, 2, 3].map((k) => (
              <img key={k} src={`${IMG}/sint-${k}.jpg`} alt="Ejemplo de imagen generada" />
            ))}
          </div>
        </F>
        <F n={2} className="tarj">
          <div className="grande azul">{Math.round(b)}</div>
          <h3>Fotos reales</h3>
          <p>Hechas a mano por distintas personas. Con ellas medimos de verdad.</p>
          <div className="miniaturas">
            <img src={`${IMG}/pre-0.jpg`} alt="Foto real de un número maya" />
            <img src={`${IMG}/neg-cero_maya.jpg`} alt="Foto real de un cero maya" />
          </div>
        </F>
        <F n={3} className="tarj">
          <div className="grande ocre">{miles(c)}</div>
          <h3>De un dataset público</h3>
          <p>Las revisamos una por una y quitamos las mal etiquetadas. Solo sirven para entrenar.</p>
        </F>
      </div>
      <F n={4} className="reparto">
        <p className="nota" style={{ marginBottom: 10 }}>
          Una misma imagen nunca está en dos grupos: <b>nada de copiar el examen</b>.
        </p>
        <div className="tramos">
          <span style={{ flex: 82, background: "var(--jade)" }}>82 %</span>
          <span style={{ flex: 11, background: "var(--azul)" }}>11 %</span>
          <span style={{ flex: 7, background: "var(--ocre)" }}>7 %</span>
        </div>
        <div className="claves-reparto">
          <span><i style={{ background: "var(--jade)" }} /><b>Entrena</b> aprende de estas</span>
          <span><i style={{ background: "var(--azul)" }} /><b>Valida</b> se ajusta mientras aprende</span>
          <span><i style={{ background: "var(--ocre)" }} /><b>Prueba</b> examen final</span>
        </div>
      </F>
    </>
  );
}

/* ───────────── 7 · Preparar la imagen ───────────── */
function Preparar({ paso }: { paso: number }) {
  const pasos = [
    { src: "pre-0.jpg", t: "Tu foto", d: "tal cual llega" },
    { src: "pre-1-gris.png", t: "Sin color", d: "solo luz y sombra" },
    { src: "pre-3-polaridad.png", t: "Trazo claro", d: "fondo oscuro, siempre igual" },
    { src: "pre-4-contraste.png", t: "Más contraste", d: "el trazo resalta" },
    { src: "pre-6-64.png", t: "64 × 64", d: "lo que ve la red", px: true },
  ];
  return (
    <>
      <Cabeza k="Preparar la imagen" sub={<>La red recibe <b>siempre lo mismo</b>: da igual la cámara o la hoja.</>}>
        Limpiar <em>antes de mirar</em>
      </Cabeza>
      <div className="tira-p">
        {pasos.map((p, i) => (
          <div key={p.t} style={{ display: "contents" }}>
            {i > 0 && (
              <F n={i + 1} className="flecha">
                →
              </F>
            )}
            <F n={i + 1} className={`paso-img${paso === i + 1 ? " activo" : ""}`}>
              <div className="marco-p">
                <img className={p.px ? "px" : undefined} src={`${IMG}/${p.src}`} alt={p.t} />
              </div>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </F>
          </div>
        ))}
      </div>
    </>
  );
}

/* ───────────── 8 · Cómo aprende ───────────── */
const PX = (e: number) => 4 + ((e - 1) / 21) * 92;
const PY = (v: number) => 30 - ((v - 35) / 65) * 27;
function Aprende({ paso }: { paso: number }) {
  const pct = 40.8 + (97.6 - 40.8) * Math.min(1, useContar(1, paso >= 2, 3400));
  const d = D.curvaA.map(([e, v], i) => `${i ? "L" : "M"}${PX(e).toFixed(2)} ${PY(v).toFixed(2)}`).join(" ");
  const [ex, ey] = [PX(22), PY(97.6)];
  return (
    <>
      <Cabeza k="Cómo aprende">
        Adivina, compara, <em>corrige</em>
      </Cabeza>
      <F n={1} className="ciclo">
        <span className="paso">Adivina el número</span>→<span className="paso">Mira la respuesta correcta</span>→<span className="paso">Se corrige</span>
        <span className="vuelve">↻ muchas veces, con miles de imágenes</span>
      </F>
      <div className="grafica">
        <div className="grande-pct">{dec(pct)} <small>% aciertos</small></div>
        <svg viewBox="0 0 100 35" aria-label="Exactitud en validación durante el entrenamiento: sube de 41 % a 97,6 %">
          <defs>
            <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4ee0a8" stopOpacity=".35" />
              <stop offset="1" stopColor="#4ee0a8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[50, 75, 100].map((v) => (
            <g key={v}>
              <line x1="4" x2="98" y1={PY(v)} y2={PY(v)} stroke="rgba(255,255,255,.14)" strokeWidth=".2" strokeDasharray="1 1" />
              <text x="0" y={PY(v) + 0.8} fill="#a3ada6" fontSize="2.2">{v}%</text>
            </g>
          ))}
          <path className="area" d={`${d} L${PX(22)} 30 L${PX(1)} 30 Z`} fill="url(#relleno)" />
          <path className="trazo" pathLength={1} d={d} fill="none" stroke="#4ee0a8" strokeWidth=".9" strokeLinejoin="round" strokeLinecap="round" />
          <circle className="punta" cx={ex} cy={ey} r="1.4" fill="#4ee0a8" />
          <text x="48" y="34.5" fill="#a3ada6" fontSize="2.2" textAnchor="middle">Rondas de entrenamiento →</text>
        </svg>
      </div>
    </>
  );
}

/* ───────────── 9 · Rechazo ───────────── */
function Rechazo({ paso }: { paso: number }) {
  const reglas = ["La red dice: «esto no es un número»", "La red está poco segura", "Sus tres respuestas no coinciden"];
  const muestras = [
    ["neg-digitos_arabigos.jpg", "Dígitos"],
    ["neg-romanos.jpg", "Romanos"],
    ["neg-dibujos.jpg", "Un dibujo"],
    ["neg-mayor_19.jpg", "Otro símbolo"],
  ];
  return (
    <>
      <Cabeza k="Decir «no sé»">
        También sabe <em>rechazar</em>
      </Cabeza>
      <div className="dos" style={{ marginTop: "calc(var(--u) * 1)" }}>
        <div className="reglas">
          <p className="nota" style={{ margin: 0 }}>Se rechaza la imagen si…</p>
          {reglas.map((r, i) => (
            <F key={r} n={i + 1} className="regla">
              <b>{i + 1}</b>
              {r}
            </F>
          ))}
        </div>
        <div className="muestras">
          {muestras.map(([src, t], j) => (
            <F key={src} n={4} className="muestra">
              <img src={`${IMG}/${src}`} alt={t} />
              {paso >= 4 && <span style={{ "--j": j } as React.CSSProperties}>No es un número · {t}</span>}
            </F>
          ))}
        </div>
      </div>
    </>
  );
}

/* ───────────── 10 · Resultados ───────────── */
function Anillo({ n, paso, pct, color, texto, titulo, desc, dato }: { n: number; paso: number; pct: number; color: string; texto: string; titulo: string; desc: string; dato: number }) {
  const v = useContar(dato, paso >= n, 2000);
  return (
    <F n={n} className="anillo">
      <div className="dona">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="pista-a" cx="50" cy="50" r="45" />
          <circle className="valor-a" cx="50" cy="50" r="45" style={{ stroke: color, color, strokeDashoffset: paso >= n ? 282.7 * (1 - pct / 100) : 282.7 }} />
        </svg>
        <div className="cifra-a" style={{ color }}>
          <span>
            {dec(v, dato % 1 ? 1 : 0)}
            <small>%</small>
          </span>
        </div>
      </div>
      <h3>{titulo}</h3>
      <p>{desc}</p>
      <span className="sr-only">{texto}</span>
    </F>
  );
}
function Resultados({ paso }: { paso: number }) {
  return (
    <>
      <Cabeza k="Qué tan bien funciona">
        Lo que midió <em>cada prueba</em>
      </Cabeza>
      <div className="anillos">
        <Anillo n={1} paso={paso} pct={100} dato={100} color="#4ee0a8" texto="38 de 38" titulo="Fotos de otra persona" desc="38 de 38 fotos que la red nunca había visto, hechas por un compañero." />
        <Anillo n={2} paso={paso} pct={D.estres} dato={D.estres} color="#62c9ff" texto="440 variantes" titulo="Prueba de estrés" desc="440 versiones con giro, poca luz, ruido y desenfoque." />
        <Anillo n={3} paso={paso} pct={D.lienzo} dato={D.lienzo} color="#ffbd4f" texto="lienzo" titulo="Dibujo en el lienzo" desc="Números dibujados con el mouse, como en la demo." />
      </div>
    </>
  );
}

/* ───────────── 11 · Mejora ───────────── */
function Mejora({ paso }: { paso: number }) {
  const etiquetas: [string, string][] = [
    ["Primer intento", "primer modelo"],
    ["Fotos reales", "sumamos fotos hechas a mano"],
    ["Más ajuste", "afinado con esas fotos"],
    ["Rectángulos", "fotos no cuadradas"],
    ["Fondo oscuro", "trazo claro u oscuro"],
    ["Bordes de mesa", "ignorar sombras y bordes"],
    ["Mano alzada", "puntos huecos y garabatos"],
  ];
  return (
    <>
      <Cabeza k="Cómo fuimos mejorando">
        Del <em>29 %</em> al 100 %
      </Cabeza>
      <p className="sub" style={{ maxWidth: "none" }}>
        Cada barra: % de aciertos en las <b>mismas 38 fotos de un compañero</b>, que la red nunca usó para aprender.
      </p>
      <div className="escalera">
        {D.evolucion.map((e, i) => (
          <div key={e.v} className={`peldano${i === D.evolucion.length - 1 ? " ultimo" : ""}`} style={{ "--k": i, "--alto": `${e.v}%` } as React.CSSProperties}>
            <div className="v">{e.v}%</div>
            <div className="b" />
          </div>
        ))}
      </div>
      <div className="etiquetas">
        {etiquetas.map(([t, d]) => (
          <span key={t}>
            <b>{t}</b>
            {d}
          </span>
        ))}
      </div>
    </>
  );
}

/* ───────────── 12 · Errores ───────────── */
function Errores() {
  return (
    <>
      <Cabeza k="Sin maquillaje">
        Dónde todavía <em>se equivoca</em>
      </Cabeza>
      <div className="fallos">
        <F n={1} className="fallo">
          <div className="dibujo"><GlifoMaya valor={20} ancho={96} /></div>
          <h3>Cuatro barras</h3>
          <p>No existe en el sistema (llega al 19). A veces la red lee 3 barras o un 16 en vez de rechazarlo.</p>
          <div className="hicimos"><b>Lo que medimos</b>Rechaza {Math.round(D.rechazoCasi / 10)} de cada 10.</div>
        </F>
        <F n={2} className="fallo">
          <div className="dibujo">
            <svg width="130" height="46" viewBox="0 0 130 46" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              {[22, 65, 108].map((x) => <circle key={x} cx={x} cy="23" r="12" />)}
            </svg>
          </div>
          <h3>Puntos huecos</h3>
          <p>Si alguien dibuja círculos vacíos o garabatos, la red puede dudar entre 1, 2 y 3.</p>
          <div className="hicimos"><b>Lo que hicimos</b>Entrenarla con puntos en aro y garabatos.</div>
        </F>
        <F n={3} className="fallo">
          <div className="dibujo">
            <svg width="150" height="46" viewBox="0 0 150 46" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
              <path d="M8 12h134" strokeWidth="1.2" /><path d="M8 24h134" strokeWidth="1.2" /><path d="M8 36h134" strokeWidth="1.2" />
            </svg>
          </div>
          <h3>Trazos muy finos</h3>
          <p>Al reducir a 64 × 64, una línea de lápiz muy delgada casi desaparece.</p>
          <div className="hicimos"><b>Lo que hicimos</b>Barras delgadas en el entrenamiento.</div>
        </F>
      </div>
    </>
  );
}

/* ───────────── 13 · Cierre ───────────── */
function Cierre() {
  return (
    <div className="dos" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
      <div>
        <Cabeza k="Para terminar">
          Probémoslo <em>en vivo</em>
        </Cabeza>
        <div className="puntos-cierre">
          <F n={1}><div><i />Una red entrenada por nosotros, sin servicios externos</div></F>
          <F n={2}><div><i />Corre en el navegador, sin internet</div></F>
          <F n={3}><div><i />Lee del 1 al 19 y sabe decir «no es un número»</div></F>
        </div>
        <F n={4}>
          <Link className="cta" href="/">
            Abrir la demo →
          </Link>
        </F>
      </div>
      <F n={4} className="qr-caja">
        <img src={`${IMG}/qr-demo.svg`} alt="Código QR que abre la demo en reconocimiento-numeros-mayas.vercel.app" />
        <b>Pruébala en tu celular</b>
        <span>reconocimiento-numeros-mayas.vercel.app</span>
      </F>
    </div>
  );
}

export const SLIDES: Diapo[] = [
  { id: "portada", titulo: "Portada", pasos: 0, Contenido: Portada },
  { id: "intro", titulo: "Qué es una CNN", pasos: 2, Contenido: IntroCNN },
  { id: "complejo", titulo: "Cómo funciona", pasos: 5, Contenido: Complejo },
  { id: "reto", titulo: "El reto", pasos: 3, Contenido: Reto },
  { id: "cnn", titulo: "El filtro", pasos: 2, Contenido: Convolucion },
  { id: "flujo", titulo: "El recorrido", pasos: 6, Contenido: Flujo },
  { id: "dentro", titulo: "Por dentro", pasos: 3, Contenido: PorDentro },
  { id: "datos", titulo: "Los datos", pasos: 4, Contenido: Datos },
  { id: "preparar", titulo: "Preparar la imagen", pasos: 5, Contenido: Preparar },
  { id: "aprende", titulo: "Cómo aprende", pasos: 2, Contenido: Aprende },
  { id: "rechazo", titulo: "Rechazar", pasos: 4, Contenido: Rechazo },
  { id: "resultados", titulo: "Resultados", pasos: 3, Contenido: Resultados },
  { id: "mejora", titulo: "Mejora", pasos: 1, Contenido: Mejora },
  { id: "errores", titulo: "Errores", pasos: 3, Contenido: Errores },
  { id: "cierre", titulo: "Cierre", pasos: 4, Contenido: Cierre },
];
