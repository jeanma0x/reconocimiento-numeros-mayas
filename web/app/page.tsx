"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CapturaCamara from "@/components/CapturaCamara";
import LienzoDibujo from "@/components/LienzoDibujo";
import PanelResultado from "@/components/PanelResultado";
import ZonaDeCarga from "@/components/ZonaDeCarga";
import { cargarRecursos, reconocer } from "@/lib/inferencia";
import { pixelesDesde } from "@/lib/preprocess";
import type { EntradaHistorial, Metadata, Origen, Resultado } from "@/lib/tipos";

type Modo = "archivo" | "camara" | "lienzo";

export default function Reconocedor() {
  const [modo, setModo] = useState<Modo>("archivo");
  const [imagenURL, setImagenURL] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoModelo, setEstadoModelo] = useState<"cargando" | "listo" | "error">("cargando");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const urlActual = useRef<string | null>(null);

  // Precargar el modelo al abrir la página: para cuando el docente cargue la
  // primera imagen, la sesión ya tiene que estar lista.
  useEffect(() => {
    cargarRecursos()
      .then(({ metadata }) => {
        setMetadata(metadata);
        setEstadoModelo("listo");
      })
      .catch((e) => {
        console.error(e);
        setEstadoModelo("error");
      });
  }, []);

  // Modo presentación con la tecla P: agranda el resultado y oculta lo secundario
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const enCampo = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/);
      if (!enCampo && (e.key === "p" || e.key === "P")) {
        document.body.classList.toggle("presentacion");
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  const procesar = useCallback(async (blob: Blob, origen: Origen) => {
    setError(null);
    setCargando(true);
    setResultado(null);
    try {
      if (urlActual.current) URL.revokeObjectURL(urlActual.current);
      const url = URL.createObjectURL(blob);
      urlActual.current = url;
      setImagenURL(url);

      const { rgba, alto, ancho } = await pixelesDesde(blob);
      const r = await reconocer(rgba, alto, ancho);
      setResultado(r);

      setHistorial((h) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            resultado: r,
            miniatura: url,
            origen,
            cuando: Date.now(),
          },
          ...h,
        ].slice(0, 24),
      );

      // Registro en la nube: después de mostrar el resultado y sin esperar
      // respuesta. Si falla, el usuario no se entera (ADR-007).
      void fetch("/api/predicciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origen,
          valor: r.valor,
          rechazada: r.rechazada,
          motivo: r.motivo,
          confianza: r.confianza,
          barras: r.barras,
          puntos: r.puntos,
          ms_inferencia: Math.round(r.msInferencia),
        }),
      }).catch(() => {});
    } catch (e) {
      console.error(e);
      setError(
        "No se pudo procesar la imagen. Probá con otro archivo, o revisá que sea una imagen válida.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  const limpiar = () => {
    if (urlActual.current) URL.revokeObjectURL(urlActual.current);
    urlActual.current = null;
    setImagenURL(null);
    setResultado(null);
    setError(null);
  };

  return (
    <div className="envoltorio">
      <header className="cabecera">
        <h1 className="titulo">
          Números mayas <span>· reconocimiento con CNN</span>
        </h1>
        <nav>
          <div className="pestanas" role="tablist">
            {(
              [
                ["archivo", "Archivo"],
                ["camara", "Cámara"],
                ["lienzo", "Dibujar"],
              ] as [Modo, string][]
            ).map(([m, texto]) => (
              <button
                key={m}
                role="tab"
                aria-selected={modo === m}
                className="pestana"
                onClick={() => {
                  setModo(m);
                  limpiar();
                }}
              >
                {texto}
              </button>
            ))}
          </div>
          <a className="boton sutil" href="/acerca">
            Cómo funciona
          </a>
        </nav>
      </header>

      {estadoModelo === "cargando" && (
        <div className="aviso cargando">Preparando el modelo…</div>
      )}
      {estadoModelo === "error" && (
        <div className="aviso error">
          No se pudo cargar el modelo. Verificá que <code>web/public/models/</code> tenga el
          archivo <code>.onnx</code>, <code>labels.json</code> y <code>metadata.json</code>.
        </div>
      )}
      {error && <div className="aviso error">{error}</div>}

      <div className="tablero">
        <section className="panel secundario">
          <h2>Imagen</h2>
          {modo === "archivo" &&
            (imagenURL ? (
              <>
                <div className="vista-previa">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagenURL} alt="Imagen cargada" />
                </div>
                <div className="barra-acciones">
                  <button className="boton" onClick={limpiar}>
                    Cargar otra
                  </button>
                </div>
              </>
            ) : (
              <ZonaDeCarga onImagen={procesar} onError={setError} />
            ))}

          {modo === "camara" && (
            <CapturaCamara onCaptura={(b) => procesar(b, "camara")} onError={setError} />
          )}

          {modo === "lienzo" && <LienzoDibujo onListo={(b) => procesar(b, "lienzo")} />}
        </section>

        <section className="panel">
          <h2>Resultado</h2>
          <PanelResultado resultado={resultado} cargando={cargando} />
        </section>
      </div>

      {historial.length > 0 && (
        <section className="historial">
          <div className="historial-cabecera">
            <h2>Historial de la sesión ({historial.length})</h2>
            <button className="boton sutil pequeno" onClick={() => setHistorial([])}>
              Limpiar
            </button>
          </div>
          <div className="tira">
            {historial.map((h) => (
              <button
                key={h.id}
                className="ficha"
                onClick={() => {
                  setResultado(h.resultado);
                  setImagenURL(h.miniatura);
                }}
                title={new Date(h.cuando).toLocaleTimeString()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.miniatura} alt="" />
                <div className={`pie ${h.resultado.rechazada ? "no" : "ok"}`}>
                  {h.resultado.rechazada ? "no válido" : h.resultado.valor}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="pie-pagina">
        <span>
          Modelo {metadata?.run_id ?? "—"} · {metadata?.arquitectura ?? "—"} ·{" "}
          {metadata ? (metadata.bytes_onnx / 1e6).toFixed(2) : "—"} MB · corre en tu navegador
        </span>
        <span>Tecla P para modo presentación</span>
      </footer>
    </div>
  );
}
