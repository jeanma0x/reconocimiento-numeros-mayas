"use client";

import { useEffect, useRef, useState } from "react";

import { IconoBorrar, IconoRayo } from "@/components/Iconos";

const ANCHO = 680;
const ALTO = 520;
/**
 * Lado del recorte, en múltiplos del grosor del trazo.
 *
 * En el generador sintético la escala de un glifo se deriva del largo natural de
 * barra, no de su caja envolvente, y el grosor de barra es ~1/11 de ese largo. Así
 * que el grosor del trazo ES la unidad de medida del dibujo, igual que en el
 * entrenamiento.
 *
 * El valor sale de dos restricciones del entrenamiento, no de probar a ojo:
 *   - un glifo con barras ocupa entre el 26% y el 72% del encuadre, media 49%.
 *     Como una barra mide ~11 grosores, eso pide un lado de ~22 grosores.
 *   - un punto ocupa ~7% del encuadre. Quien dibuja da un toque de un grosor de
 *     diámetro, lo que pide un lado de ~14 grosores.
 * 18 es el punto medio. La diferencia restante se cierra del otro lado: el generador
 * ahora sortea el radio del punto en un rango más amplio.
 *
 * Recortar a la caja de la tinta, como se hacía antes, dejaba todo en ~70%: para los
 * números con barras daba igual, pero a los de solo puntos (1 a 4) los agrandaba
 * hasta un tamaño que la red nunca vio, y por eso el 2 fallaba siempre.
 */
const LADO_POR_GROSOR = 18;
// Cuánto más grande que la tinta es el recorte. Medido con `maya.lienzo_prueba` (dibujos en
// 5 estilos con este mismo recorte): 1,15 → 91,1 %; 1,5 → 95,8 %; 1,8 → 94,7 %; 2,2 → 91,1 %.
// Con 1,15 la tinta llenaba ~87 % del cuadro, fuera de lo que vio el modelo al entrenar.
const HOLGURA = 1.5;

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

    const anchoTinta = x1 - x0 + 1;
    const altoTinta = y1 - y0 + 1;
    const lado = Math.round(
      Math.max(LADO_POR_GROSOR * grosor, Math.max(anchoTinta, altoTinta) * HOLGURA),
    );
    const centroX = (x0 + x1) / 2;
    const centroY = (y0 + y1) / 2;
    const sx = Math.round(centroX - lado / 2);
    const sy = Math.round(centroY - lado / 2);

    const recorte = document.createElement("canvas");
    recorte.width = lado;
    recorte.height = lado;
    const rctx = recorte.getContext("2d")!;
    // Blanco primero: si el recorte se sale del lienzo, lo que sobra queda en
    // blanco en lugar de transparente.
    rctx.fillStyle = "#ffffff";
    rctx.fillRect(0, 0, lado, lado);
    rctx.drawImage(c, sx, sy, lado, lado, 0, 0, lado, lado);
    recorte.toBlob((b) => b && onListo(b), "image/png");
  };

  return (
    <>
      <div className="marco">
        <div className="vista-previa" style={{ background: "#fff" }}>
          <canvas
            ref={lienzo}
            width={ANCHO}
            height={ALTO}
            role="img"
            aria-label="Lienzo de dibujo: dibuja con el mouse o el dedo un número maya"
            style={{ touchAction: "none", cursor: "crosshair" }}
            onPointerDown={empezar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerLeave={soltar}
          />
        </div>
      </div>
      <div className="barra-acciones">
        <button className="boton primario" disabled={vacio} onClick={exportar}>
          <IconoRayo tamano={18} />
          Reconocer dibujo
        </button>
        <button className="boton" onClick={limpiar} disabled={vacio}>
          <IconoBorrar tamano={18} />
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
            aria-label="Grosor del trazo"
          />
          <span className="muestra-grosor" style={{ width: grosor, height: grosor }} />
        </label>
      </div>
      <p className="pista">
        Dibuja los puntos arriba y las barras abajo. El grosor del trazo marca la escala: súbelo
        para trazos gruesos y bájalo para finos, como harías en papel.
      </p>
    </>
  );
}
