"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cámara en vivo. Es la vía más rápida cuando el docente dibuja un número a mano
 * durante la presentación: apuntar y capturar, sin pasar por fotografiar, transferir
 * el archivo y subirlo.
 */
export default function CapturaCamara({
  onCaptura,
  onError,
}: {
  onCaptura: (blob: Blob) => void;
  onError: (mensaje: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [lista, setLista] = useState(false);

  const detener = useCallback(() => {
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelado) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        flujo.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play();
          setLista(true);
        }
      } catch {
        onError(
          "No se pudo abrir la cámara. Revisá el permiso del navegador, o usá el modo Archivo o Dibujar.",
        );
      }
    })();
    return () => {
      cancelado = true;
      detener();
    };
  }, [detener, onError]);

  const capturar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const lienzo = document.createElement("canvas");
    lienzo.width = v.videoWidth;
    lienzo.height = v.videoHeight;
    lienzo.getContext("2d")!.drawImage(v, 0, 0);
    lienzo.toBlob((b) => b && onCaptura(b), "image/jpeg", 0.95);
  };

  return (
    <>
      <div className="vista-previa">
        <video ref={video} playsInline muted />
      </div>
      <div className="barra-acciones">
        <button className="boton primario" onClick={capturar} disabled={!lista}>
          Capturar
        </button>
      </div>
    </>
  );
}
