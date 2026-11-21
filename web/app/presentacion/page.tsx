"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import GlifoMaya from "@/components/GlifoMaya";
import { IconoPantalla } from "@/components/Iconos";

import { DIAPOSITIVAS } from "./diapositivas";
import "./presentacion.css";

/**
 * Presentación dentro de la propia aplicación: no depende de otro programa ni de internet.
 *  →  Espacio  Re Pág   avanzan (primero los pasos de la lámina, luego la siguiente)
 *  ←  Av Pág            retroceden        Inicio / Fin  primera / última
 *  F  pantalla completa      Esc  salir a la demo
 */
export default function Presentacion() {
  const total = DIAPOSITIVAS.length;
  const [i, setI] = useState(0);
  const [paso, setPaso] = useState(0);
  const listo = useRef(false);

  // Recuperar la lámina del enlace (#7) para poder volver a ella tras recargar
  useEffect(() => {
    const h = parseInt(window.location.hash.slice(1), 10);
    if (h >= 1 && h <= total) setI(h - 1);
    listo.current = true;
  }, [total]);
  useEffect(() => {
    if (listo.current) window.history.replaceState(null, "", `#${i + 1}`);
  }, [i]);

  const siguiente = useCallback(() => {
    if (paso < DIAPOSITIVAS[i].pasos) setPaso(paso + 1);
    else if (i < total - 1) {
      setI(i + 1);
      setPaso(0);
    }
  }, [paso, i, total]);

  const anterior = useCallback(() => {
    if (paso > 0) setPaso(paso - 1);
    else if (i > 0) {
      setI(i - 1);
      setPaso(DIAPOSITIVAS[i - 1].pasos); // al volver, la lámina se ve completa
    }
  }, [paso, i]);

  const ir = (k: number) => {
    setI(k);
    setPaso(0);
  };

  const pantallaCompleta = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        siguiente();
      } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
        e.preventDefault();
        anterior();
      } else if (e.key === "Home") ir(0);
      else if (e.key === "End") {
        setI(total - 1);
        setPaso(DIAPOSITIVAS[total - 1].pasos);
      } else if (e.key === "f" || e.key === "F") pantallaCompleta();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [siguiente, anterior, total]);

  const { Contenido } = DIAPOSITIVAS[i];

  return (
    <div className="deck" style={{ "--paso": paso } as React.CSSProperties}>
      <div className="fondo" aria-hidden="true">
        <div className="rejilla" />
      </div>
      <div className="deck-top">
        <span className="marca-mini">
          <GlifoMaya valor={19} ancho={30} />
          <span>Numerales mayas</span>
        </span>
        <nav aria-label="Presentación">
          <button type="button" className="boton pequeno" onClick={pantallaCompleta}>
            <IconoPantalla tamano={16} />
            Pantalla completa
          </button>
          <Link className="boton pequeno primario" href="/">
            Ir a la demo
          </Link>
        </nav>
      </div>

      <main className="lamina" key={i} aria-live="polite" aria-label={`Lámina ${i + 1} de ${total}`}>
        <Contenido paso={paso} />
        {i > 0 && (
          <span className="fantasma" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
        )}
      </main>

      <div className="deck-pie">
        <button type="button" className="boton sutil pequeno" onClick={anterior} disabled={i === 0 && paso === 0}>
          Anterior
        </button>
        <div className="progreso" role="tablist" aria-label="Láminas">
          {DIAPOSITIVAS.map((d, k) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={`Ir a la lámina ${k + 1}: ${d.titulo}`}
              title={`${k + 1}. ${d.titulo}`}
              className={k < i ? "hecho" : k === i ? "actual" : ""}
              onClick={() => ir(k)}
            />
          ))}
        </div>
        <span className="contador" aria-hidden="true">
          {String(i + 1).padStart(2, "0")} / {total}
        </span>
        <button
          type="button"
          className="boton pequeno primario"
          onClick={siguiente}
          disabled={i === total - 1 && paso === DIAPOSITIVAS[i].pasos}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
