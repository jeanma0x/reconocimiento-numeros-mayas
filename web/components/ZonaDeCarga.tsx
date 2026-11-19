"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TIPOS = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/heic", "image/heif"];
const MAX_BYTES = 20 * 1024 * 1024;

export function validar(archivo: File): string | null {
  if (archivo.size > MAX_BYTES) {
    return `El archivo pesa ${(archivo.size / 1e6).toFixed(1)} MB. El máximo son 20 MB.`;
  }
  if (archivo.type && !TIPOS.includes(archivo.type) && !archivo.type.startsWith("image/")) {
    return `"${archivo.name}" no parece una imagen.`;
  }
  return null;
}

export default function ZonaDeCarga({
  onImagen,
  onError,
}: {
  onImagen: (blob: Blob, origen: "archivo" | "portapapeles") => void;
  onError: (mensaje: string) => void;
}) {
  const [encima, setEncima] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const aceptar = useCallback(
    (archivo: File | null | undefined, origen: "archivo" | "portapapeles") => {
      if (!archivo) return;
      const problema = validar(archivo);
      if (problema) {
        onError(problema);
        return;
      }
      onImagen(archivo, origen);
    },
    [onImagen, onError],
  );

  // Pegar con Ctrl+V: si el docente manda la imagen por chat o correo, se pega y listo
  useEffect(() => {
    const alPegar = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (item) {
        e.preventDefault();
        aceptar(item.getAsFile(), "portapapeles");
      }
    };
    window.addEventListener("paste", alPegar);
    return () => window.removeEventListener("paste", alPegar);
  }, [aceptar]);

  return (
    <>
      <button
        type="button"
        className={`soltar${encima ? " encima" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          setEncima(false);
          aceptar(e.dataTransfer.files?.[0], "archivo");
        }}
      >
        <div>
          <div className="icono" aria-hidden="true">
            ⬆
          </div>
          <div className="fuerte">Arrastrá una imagen aquí</div>
          <div className="tenue">
            o hacé clic para elegir un archivo · también podés pegar con Ctrl+V
          </div>
        </div>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          aceptar(e.target.files?.[0], "archivo");
          e.target.value = "";
        }}
      />
    </>
  );
}
