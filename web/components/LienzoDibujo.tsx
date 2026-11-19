"use client";

import { useEffect, useRef, useState } from "react";

const ANCHO = 520;
const ALTO = 400;

/**
 * Lienzo para dibujar con mouse o dedo. Es la vía más confiable para las pruebas
 * del docente: elimina por completo la fotografía como fuente de error.
 *
 * Se dibuja en negro sobre blanco, igual que una hoja: el preprocesamiento detecta
 * la polaridad solo, así que no hace falta nada especial.
 */
export default function LienzoDibujo({ onListo }: { onListo: (blob: Blob) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [grosor, setGrosor] = useState(14);
  const [vacio, setVacio] = useState(true);

  const limpiar = () => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
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

  const empezar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    const ctx = lienzo.current!.getContext("2d")!;
    const { x, y } = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = grosor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setVacio(false);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    const ctx = lienzo.current!.getContext("2d")!;
    const { x, y } = punto(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = grosor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const soltar = () => {
    dibujando.current = false;
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
        <button
          className="boton primario"
          disabled={vacio}
          onClick={() => lienzo.current?.toBlob((b) => b && onListo(b), "image/png")}
        >
          Reconocer dibujo
        </button>
        <button className="boton" onClick={limpiar}>
          Borrar
        </button>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "var(--gris)",
          }}
        >
          Grosor
          <input
            type="range"
            min={5}
            max={32}
            value={grosor}
            onChange={(e) => setGrosor(Number(e.target.value))}
          />
        </label>
      </div>
    </>
  );
}
