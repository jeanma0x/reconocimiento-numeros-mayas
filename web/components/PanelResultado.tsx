"use client";

import { useEffect, useRef } from "react";

import GlifoMaya from "@/components/GlifoMaya";
import SumaMaya from "@/components/SumaMaya";
import { IconoAlerta, IconoCheck, IconoGirar, IconoProhibido } from "@/components/Iconos";
import { LADO } from "@/lib/preprocess";
import type { Resultado } from "@/lib/tipos";

/** Por debajo de esto la red está prácticamente adivinando (al azar sería 5%). */
const CONFIANZA_BAJA = 0.4;

/** Lo que se le dice a quien usa la app: una frase por motivo, sin jerga. */
const FRASE_MOTIVO: Record<string, string> = {
  clase_no_valida: "La red lo clasificó como algo distinto de un número maya del 1 al 19.",
  baja_confianza: "La red no tiene certeza suficiente para dar un número.",
  inconsistencia: "Las barras y los puntos que contó la red no coinciden con el número que propuso.",
  margen: "Dos números quedaron casi empatados y la red no se decide por ninguno.",
};

function BarrasConfianza({ r }: { r: Resultado }) {
  return (
    <div className="barras" role="list" aria-label="Las tres opciones más probables">
      {r.top.map((t, i) => (
        <div className={`barra${i > 0 ? " secundaria" : ""}`} key={t.etiqueta} role="listitem">
          <span className="etq">{t.valor ?? "no válido"}</span>
          <span className="riel" aria-hidden="true">
            <span className="relleno" style={{ width: `${Math.round(t.probabilidad * 100)}%` }} />
          </span>
          <span className="val">{(t.probabilidad * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/** Muestra el tensor 64x64 que realmente entró a la red. */
function VistaTensor({ tensor }: { tensor: Float32Array }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(LADO, LADO);
    for (let i = 0; i < LADO * LADO; i++) {
      const v = Math.round(Math.min(1, Math.max(0, tensor[i])) * 255);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [tensor]);
  return (
    <canvas
      ref={ref}
      width={LADO}
      height={LADO}
      role="img"
      aria-label="La imagen tal como la recibe la red: 64 por 64 píxeles en escala de grises"
    />
  );
}

/** Lista de los 19 números válidos: dice qué reconoce el sistema antes de usarlo. */
function Leyenda() {
  return (
    <ol className="leyenda" aria-label="Los 19 números que reconoce el sistema">
      {Array.from({ length: 19 }, (_, i) => i + 1).map((v) => (
        <li key={v}>
          <GlifoMaya valor={v} ancho={44} />
          <span>{v}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * El análisis en tres pasos, pensado para quien nunca ha visto una red neuronal.
 *
 * OJO: las cabezas de barras y puntos solo se entrenaron con números válidos, así que ante
 * una foto de una persona devuelven igualmente *algún* conteo. Presentarlo como «contó 4
 * puntos» sería engañoso, por eso el paso 2 cuenta una historia distinta según el motivo del
 * rechazo y solo muestra las fichas cuando el conteo significa algo.
 */
function Explicacion({ r, consistente }: { r: Resultado; consistente: boolean }) {
  const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)} %`;
  const nombre = (v: number | null | undefined) => (v == null ? "no válido" : `el ${v}`);
  const [primera, segunda] = r.top;
  const total = 5 * r.barras + r.puntos;

  let paso2: { titulo: string; cuerpo: React.ReactNode };
  let paso3: { titulo: string; cuerpo: React.ReactNode };

  if (!r.rechazada) {
    paso2 = {
      titulo: "Contó las barras y los puntos",
      cuerpo: (
        <>
          <SumaMaya barras={r.barras} puntos={r.puntos} />
          <p>En el sistema maya cada barra vale 5 y cada punto vale 1.</p>
        </>
      ),
    };
    paso3 = {
      titulo: `Eligió el ${r.valor}`,
      cuerpo: (
        <p>
          Con {pct(r.confianza)} de confianza.
          {segunda ? ` La segunda opción (${nombre(segunda.valor)}) quedó en ${pct(segunda.probabilidad)}.` : ""}{" "}
          {consistente
            ? "Lo que contó coincide con el número elegido, así que la respuesta es confiable."
            : "Ojo: lo que contó no coincide con el número elegido."}
        </p>
      ),
    };
  } else if (r.motivo === "inconsistencia") {
    paso2 = {
      titulo: "Contó las barras y los puntos",
      cuerpo: (
        <>
          <SumaMaya barras={r.barras} puntos={r.puntos} />
          <p>
            Contó {r.barras} {r.barras === 1 ? "barra" : "barras"} y {r.puntos}{" "}
            {r.puntos === 1 ? "punto" : "puntos"}, que suman {total}.
          </p>
        </>
      ),
    };
    paso3 = {
      titulo: "Descartó la imagen",
      cuerpo: (
        <p>
          Había propuesto {nombre(primera?.valor)}, pero lo que contó suma {total}. Como las dos
          lecturas no coinciden, no se fía de ninguna.
        </p>
      ),
    };
  } else if (r.motivo === "baja_confianza") {
    paso2 = {
      titulo: "Comparó con los 19 números",
      cuerpo: (
        <p>
          Ninguno se parecía lo bastante. Lo más cercano fue {nombre(primera?.valor)} con{" "}
          {pct(primera?.probabilidad ?? r.confianza)}.
        </p>
      ),
    };
    paso3 = {
      titulo: "Descartó la imagen",
      cuerpo: <p>Su confianza quedó por debajo del mínimo para dar un número, y prefiere no adivinar.</p>,
    };
  } else if (r.motivo === "margen") {
    paso2 = {
      titulo: "Comparó con los 19 números",
      cuerpo: (
        <p>
          Dudó entre {nombre(primera?.valor)} ({pct(primera?.probabilidad ?? 0)}) y{" "}
          {nombre(segunda?.valor)} ({pct(segunda?.probabilidad ?? 0)}).
        </p>
      ),
    };
    paso3 = {
      titulo: "No se decidió",
      cuerpo: <p>Las dos opciones estaban demasiado cerca para elegir una, y prefiere no adivinar.</p>,
    };
  } else {
    // clase_no_valida: la red reconoce directamente que NO es un número maya del 1 al 19
    paso2 = {
      titulo: "Buscó la forma de un número maya",
      cuerpo: (
        <p>
          No encontró puntos arriba y barras abajo, ordenados como en un número maya. Por eso aquí
          no hay conteo que mostrar.
        </p>
      ),
    };
    paso3 = {
      titulo: "Descartó la imagen",
      cuerpo: (
        <p>
          Con {pct(r.confianza)} de confianza concluyó que no es un número maya del 1 al 19. Puede
          ser un objeto, una persona, un dibujo, el cero, un número de otro sistema o uno fuera de
          rango.
        </p>
      ),
    };
  }

  // Si la red descartó la forma, sus cabezas de barras y puntos no significan nada
  const cabezasUtiles = !(r.rechazada && r.motivo === "clase_no_valida");

  return (
    <section className="explicacion" aria-label="Cómo llegó la red a esta respuesta">
      <h3 className="subtitulo">
        {r.rechazada ? "Por qué la descartó" : "Cómo llegó a esta respuesta"}
      </h3>
      <ol className="pasos">
        <li>
          <span className="n" aria-hidden="true">
            1
          </span>
          <div>
            <b>Preparó la imagen</b>
            <p>Se pasa a blanco y negro y se reduce a 64 × 64 píxeles. Esto es lo que recibe la red:</p>
            <VistaTensor tensor={r.tensor} />
          </div>
        </li>
        <li>
          <span className="n" aria-hidden="true">
            2
          </span>
          <div>
            <b>{paso2.titulo}</b>
            {paso2.cuerpo}
          </div>
        </li>
        <li>
          <span className="n" aria-hidden="true">
            3
          </span>
          <div>
            <b>{paso3.titulo}</b>
            {paso3.cuerpo}
          </div>
        </li>
      </ol>

      <details className="depuracion">
        <summary>Datos técnicos</summary>
        <div className="depu-datos">
          <div className="fila">
            <span>Entrada a la red</span>
            <b>
              {LADO}×{LADO}, 1 canal
            </b>
          </div>
          {cabezasUtiles ? (
            <>
              <div className="fila">
                <span>Cabeza de barras</span>
                <b>{r.barras}</b>
              </div>
              <div className="fila">
                <span>Cabeza de puntos</span>
                <b>{r.puntos}</b>
              </div>
              <div className="fila">
                <span>5 × barras + puntos</span>
                <b>{total}</b>
              </div>
              <div className="fila">
                <span>Coincide con la clase</span>
                <b>{consistente ? "sí" : "no"}</b>
              </div>
              <div className="fila">
                <span>Confianza de esas cabezas</span>
                <b>{(r.confianzaAux * 100).toFixed(0)}%</b>
              </div>
            </>
          ) : (
            <p>
              Las cabezas de barras y puntos solo se entrenaron con números válidos: ante una imagen
              que la red descarta, su conteo no significa nada y no se muestra.
            </p>
          )}
          <div className="fila">
            <span>Motivo del descarte</span>
            <b>{r.rechazada ? (r.motivo ?? "—") : "—"}</b>
          </div>
          <div className="fila">
            <span>Inferencia</span>
            <b>{r.msInferencia.toFixed(0)} ms</b>
          </div>
          <p>
            Las tres cabezas son salidas de la red. La suma solo <i>verifica</i> que concuerden;
            nunca decide la clase.
          </p>
        </div>
      </details>
    </section>
  );
}

export default function PanelResultado({
  resultado,
  cargando,
}: {
  resultado: Resultado | null;
  cargando: boolean;
}) {
  const r = resultado;
  const consistente = r !== null && r.valor !== null && r.valor === 5 * r.barras + r.puntos;
  const dudosa = r !== null && !r.rechazada && r.confianza < CONFIANZA_BAJA;

  // Lo que se anuncia a un lector de pantalla cuando cambia el resultado
  const anuncio = cargando
    ? "Analizando la imagen."
    : r === null
      ? ""
      : r.rechazada
        ? "No es un número maya del 1 al 19."
        : `Resultado: ${r.valor}. Confianza ${(r.confianza * 100).toFixed(0)} por ciento. ` +
          `${r.barras} ${r.barras === 1 ? "barra" : "barras"} y ${r.puntos} ${
            r.puntos === 1 ? "punto" : "puntos"
          }.`;

  return (
    <>
      <p className="solo-lector" role="status" aria-live="polite" aria-atomic="true">
        {anuncio}
      </p>

      {cargando && (
        <div className="cargando-resultado">
          <IconoGirar tamano={22} />
          <span>Analizando…</span>
        </div>
      )}

      {!cargando && r === null && (
        <div className="dictamen vacio">
          <p className="titular">Esperando una imagen</p>
          <p>
            Sube una foto, usa la cámara o dibuja un número. La red responde en milisegundos, sin
            salir de tu navegador.
          </p>
          <div className="bloque-leyenda">
            <div className="etiqueta" style={{ margin: "20px 0 0" }}>
              Lo que reconoce
            </div>
            <Leyenda />
            <p className="fuera-de-alcance">
              Rechaza el cero maya, los números de 20 en adelante, otros sistemas de numeración,
              objetos, dibujos y cualquier imagen con más de un número.
            </p>
          </div>
        </div>
      )}

      {!cargando && r !== null && (
        <>
          <div className="dictamen">
            {r.rechazada ? (
              <div className="rechazo">
                <span className="marca-rechazo">
                  <IconoProhibido tamano={34} />
                </span>
                <div className="frase">No es un número maya del 1 al 19</div>
                <div className="detalle">{r.motivo ? FRASE_MOTIVO[r.motivo] : ""}</div>
                <div className="motivo">
                  motivo: {r.motivo ?? "—"} · confianza {(r.confianza * 100).toFixed(0)}%
                </div>
              </div>
            ) : (
              <>
                <div className="lectura">
                  <p className={`cifra acierto${dudosa ? " dudosa" : ""}`}>{r.valor}</p>
                  <GlifoMaya
                    valor={r.valor as number}
                    ancho={132}
                    animado
                    className="glifo-lectura"
                    titulo={`Número maya ${r.valor}: ${r.barras} ${r.barras === 1 ? "barra" : "barras"} y ${r.puntos} ${r.puntos === 1 ? "punto" : "puntos"}`}
                  />
                </div>

                <div className="confianza-medidor">
                  <div className="cabeza">
                    <span>Confianza</span>
                    <b>{(r.confianza * 100).toFixed(0)}%</b>
                  </div>
                  <div className={`medidor${dudosa ? " dudosa" : ""}`} aria-hidden="true">
                    <span style={{ width: `${Math.round(r.confianza * 100)}%` }} />
                  </div>
                </div>

                {dudosa && (
                  <div className="aviso-duda">
                    <IconoAlerta tamano={18} />
                    <span>La red no está segura. Con 20 clases, acertar al azar sería 5%.</span>
                  </div>
                )}

                <div className="composicion">
                  <span>
                    <b>{r.barras}</b> {r.barras === 1 ? "barra" : "barras"} · <b>{r.puntos}</b>{" "}
                    {r.puntos === 1 ? "punto" : "puntos"}
                  </span>
                  <span>
                    5 × {r.barras} + {r.puntos} = <b>{5 * r.barras + r.puntos}</b>
                  </span>
                  <span className={`ok${consistente ? "" : " no"}`}>
                    {consistente ? <IconoCheck tamano={16} /> : <IconoAlerta tamano={16} />}
                    {consistente ? "cuadra con la clase" : "no cuadra con la clase"}
                  </span>
                </div>
              </>
            )}
          </div>

          <BarrasConfianza r={r} />

          <Explicacion r={r} consistente={consistente} />
        </>
      )}
    </>
  );
}
