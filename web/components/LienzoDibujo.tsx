"use client";

import { useEffect, useRef, useState } from "react";

const ANCHO = 680;
const ALTO = 520;
const MARGEN = 0.18; // margen alrededor de la tinta al recortar, en fracción del lado

/**
 * Lienzo para dibujar con mouse o dedo. Es la vía más confiable para las pruebas
 * del docente: elimina por completo la fotografía como fuente de error.
 *
 * Al exportar se RECORTA al rectángulo que envuelve la tinta, más un margen. Sin
 * ese recorte el número ocupa como un tercio de un lienzo apaisado, y al rellenar
 * a cuadrado queda en torno al 23% del marco: por debajo del rango de ocupación
 * con que se entrenó el modelo. El recorte es encuadre, no clasificación: hace lo
 * mismo que una persona al enfocar bien la foto.
 */
export default function LienzoDibujo({ onListo }: { onListo: (blob: Blob) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [grosor, setGrosor] = useState(16);
  const [vacio, setVacio] = useState(true);

  const limpiar = () => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    setVacio(true);
  };

  useEffect(limpiar, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = lienzo.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };

  const pincel = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = grosor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const empezar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    const ctx = lienzo.current!.getContext("2d")!;
    const { x, y } = punto(e);
    pincel(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);
    ctx.stroke();
    setVacio(false);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    const ctx = lienzo.current!.getContext("2d")!;
    const { x, y } = punto(e);
    pincel(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const soltar = () => {
    dibujando.current = false;
  };

  /** Recorta al rectángulo de la tinta más un margen, y exporta. */
  const exportar = () => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);

    let x0 = c.width;
    let y0 = c.height;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        // Hay tinta si el píxel es claramente más oscuro que el blanco del lienzo
        if (data[(y * c.width + x) * 4] < 200) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return; // no hay tinta

    const lado = Math.max(x1 - x0, y1 - y0);
    const m = Math.round(lado * MARGEN) + grosor;
    x0 = Math.max(0, x0 - m);
    y0 = Math.max(0, y0 - m);
    x1 = Math.min(c.width - 1, x1 + m);
    y1 = Math.min(c.height - 1, y1 + m);

    const recorte = document.createElement("canvas");
    recorte.width = x1 - x0 + 1;
    recorte.height = y1 - y0 + 1;
    const rctx = recorte.getContext("2d")!;
    rctx.fillStyle = "#ffffff";
    rctx.fillRect(0, 0, recorte.width, recorte.height);
    rctx.drawImage(c, x0, y0, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height);
    recorte.toBlob((b) => b && onListo(b), "image/png");
  };

  return (
    <>
      <div className="vista-previa" style={{ background: "#fff" }}>
        <canvas
          ref={lienzo}
          width={ANCHO}
          height={ALTO}
          style={{ touchAction: "none", cursor: "crosshair" }}
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerLeave={soltar}
        />
      </div>
      <div className="barra-acciones">
        <button className="boton primario" disabled={vacio} onClick={exportar}>
          Reconocer dibujo
        </button>
        <button className="boton" onClick={limpiar} disabled={vacio}>
          Borrar
        </button>
        <label className="control-grosor">
          Grosor
          <input
            type="range"
            min={6}
            max={40}
            value={grosor}
            onChange={(e) => setGrosor(Number(e.target.value))}
          />
          <span className="muestra-grosor" style={{ width: grosor, height: grosor }} />
        </label>
      </div>
      <p className="pista">
        Dibujá los puntos arriba y las barras abajo. Al reconocer se recorta
        automáticamente alrededor del trazo.
      </p>
    </>
  );
}
