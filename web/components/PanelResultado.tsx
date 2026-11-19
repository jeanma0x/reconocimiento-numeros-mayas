"use client";

import { useEffect, useRef } from "react";

import { TEXTO_MOTIVO } from "@/lib/inferencia";
import { LADO } from "@/lib/preprocess";
import type { Resultado } from "@/lib/tipos";

/** Por debajo de esto la red está prácticamente adivinando (al azar sería 5%). */
const CONFIANZA_BAJA = 0.4;

function BarrasConfianza({ r }: { r: Resultado }) {
  return (
    <div className="barras">
      {r.top.map((t, i) => (
        <div className={`barra${i > 0 ? " secundaria" : ""}`} key={t.etiqueta}>
          <span className="etq">{t.valor ?? "no válido"}</span>
          <span className="riel">
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
  return <canvas ref={ref} width={LADO} height={LADO} />;
}

export default function PanelResultado({
  resultado,
  cargando,
}: {
  resultado: Resultado | null;
  cargando: boolean;
}) {
  if (cargando) {
    return (
      <div className="resultado">
        <div className="esperando">
          <span className="icono" aria-hidden="true">
            ⏳
          </span>
          Analizando…
        </div>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="resultado">
        <div className="esperando">
          <span className="icono" aria-hidden="true">
            ◻
          </span>
          Cargá una imagen para empezar
        </div>
      </div>
    );
  }

  const r = resultado;
  const consistente = r.valor !== null && r.valor === 5 * r.barras + r.puntos;

  return (
    <>
      <div className="resultado">
        {r.rechazada ? (
          <div className="rechazo">
            <div className="marca" aria-hidden="true">
              ⃠
            </div>
            <div className="frase">No es un número maya del 1 al 19</div>
            <div className="detalle">
              La imagen no corresponde a un número maya válido en ese rango.
              <br />
              <small>
                Motivo técnico: {r.motivo ? TEXTO_MOTIVO[r.motivo] : "—"} · confianza{" "}
                {(r.confianza * 100).toFixed(0)}%
              </small>
            </div>
          </div>
        ) : (
          <div>
            <div className={`cifra acierto${r.confianza < CONFIANZA_BAJA ? " dudosa" : ""}`}>
              {r.valor}
            </div>
            <div className="confianza">confianza {(r.confianza * 100).toFixed(0)}%</div>
            {r.confianza < CONFIANZA_BAJA && (
              <div className="aviso-duda">
                La red no está segura. Con 20 clases, acertar al azar sería 5%.
              </div>
            )}
            <div className="composicion">
              <span>
                {r.barras} {r.barras === 1 ? "barra" : "barras"} · {r.puntos}{" "}
                {r.puntos === 1 ? "punto" : "puntos"}
              </span>
              <span aria-hidden="true">{consistente ? "✓" : "⚠"}</span>
            </div>
          </div>
        )}
      </div>

      <BarrasConfianza r={r} />

      <details className="depuracion" open>
        <summary>Cómo lo vio la red</summary>
        <div className="depu-cuerpo">
          <VistaTensor tensor={r.tensor} />
          <div className="depu-datos">
            <div className="fila">
              <span>Entrada a la red</span>
              <b>
                {LADO}×{LADO}, 1 canal
              </b>
            </div>
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
              <b>{5 * r.barras + r.puntos}</b>
            </div>
            <div className="fila">
              <span>Coincide con la clase</span>
              <b>{consistente ? "sí" : "no"}</b>
            </div>
            <div className="fila">
              <span>Confianza de esas cabezas</span>
              <b>{(r.confianzaAux * 100).toFixed(0)}%</b>
            </div>
            <div className="fila">
              <span>Inferencia</span>
              <b>{r.msInferencia.toFixed(0)} ms</b>
            </div>
            <p style={{ margin: "4px 0 0", lineHeight: 1.45 }}>
              Las tres cabezas son salidas de la red. La suma solo <i>verifica</i> que
              concuerden; nunca decide la clase.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
