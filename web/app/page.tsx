"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CapturaCamara from "@/components/CapturaCamara";
import GlifoMaya from "@/components/GlifoMaya";
import {
  IconoBorrar,
  IconoCamara,
  IconoCerrar,
  IconoLapiz,
  IconoPantalla,
  IconoSubir,
} from "@/components/Iconos";
import LienzoDibujo from "@/components/LienzoDibujo";
import PanelResultado from "@/components/PanelResultado";
import ZonaDeCarga from "@/components/ZonaDeCarga";
import { cargarRecursos, reconocer } from "@/lib/inferencia";
import { pixelesDesde } from "@/lib/preprocess";
import type { EntradaHistorial, Metadata, Origen, Resultado } from "@/lib/tipos";

type Modo = "archivo" | "camara" | "lienzo";

const MODOS: { id: Modo; texto: string; Icono: typeof IconoSubir }[] = [
  { id: "archivo", texto: "Archivo", Icono: IconoSubir },
  { id: "camara", texto: "Cámara", Icono: IconoCamara },
  { id: "lienzo", texto: "Dibujar", Icono: IconoLapiz },
];

export default function Reconocedor() {
  const [modo, setModo] = useState<Modo>("archivo");
  const [imagenURL, setImagenURL] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoModelo, setEstadoModelo] = useState<"cargando" | "listo" | "error">("cargando");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [enLinea, setEnLinea] = useState(true);
  const [presentacion, setPresentacion] = useState(false);
  const [barrido, setBarrido] = useState(0);
  const urlActual = useRef<string | null>(null);

  // La app corre entera en el navegador: mostrar si no hay red, porque sigue funcionando
  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

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

  // Modo presentación: botón o tecla P. Agranda el resultado y oculta lo secundario, pero la
  // entrada sigue a la vista: hay que poder cargar la imagen del docente sin salir del modo.
  useEffect(() => {
    document.body.classList.toggle("presentacion", presentacion);
  }, [presentacion]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const enCampo = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/);
      if (enCampo) return;
      if (e.key === "p" || e.key === "P") setPresentacion((v) => !v);
      if (e.key === "Escape") setPresentacion(false);
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
      setBarrido((n) => n + 1);

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
        "No se pudo procesar la imagen. Prueba con otro archivo, o revisa que sea una imagen válida.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  const alTeclearPestana = (e: React.KeyboardEvent, i: number) => {
    const destino =
      e.key === "ArrowRight" ? (i + 1) % MODOS.length
      : e.key === "ArrowLeft" ? (i - 1 + MODOS.length) % MODOS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? MODOS.length - 1
      : null;
    if (destino === null) return;
    e.preventDefault();
    setModo(MODOS[destino].id);
    limpiar();
    document.getElementById(`pestana-${MODOS[destino].id}`)?.focus();
  };

  const limpiar = () => {
    if (urlActual.current) URL.revokeObjectURL(urlActual.current);
    urlActual.current = null;
    setImagenURL(null);
    setResultado(null);
    setError(null);
  };

  const estado =
    estadoModelo === "error"
      ? { clase: "error", texto: "Modelo no disponible" }
      : estadoModelo === "cargando"
        ? { clase: "", texto: "Cargando modelo…" }
        : !enLinea
          ? { clase: "sinred", texto: "Sin conexión · funciona igual" }
          : { clase: "listo", texto: "Modelo listo · corre en tu navegador" };

  return (
    <div className="envoltorio">
      <header className="cabecera">
        <a className="marca" href="/" aria-label="Numerales mayas, inicio">
          <GlifoMaya valor={19} ancho={44} className="marca-glifo" animado />
          <h1 className="titulo">
            Numerales mayas
            <span>Reconocimiento con CNN · 1 a 19</span>
          </h1>
        </a>
        <nav aria-label="Principal">
          <span className={`estado ${estado.clase}`} role="status">
            <i aria-hidden="true" />
            {estado.texto}
          </span>
          <button
            type="button"
            className="boton"
            aria-pressed={presentacion}
            onClick={() => setPresentacion((v) => !v)}
          >
            <IconoPantalla tamano={18} />
            Presentar
          </button>
          <a className="boton" href="/acerca">
            Cómo funciona
          </a>
        </nav>
      </header>

      <p className="lede">
        Una red neuronal entrenada por nosotros lee números mayas del 1 al 19 y rechaza todo lo
        demás. Todo ocurre en tu navegador.
      </p>

      {presentacion && (
        <button
          type="button"
          className="boton salir-presentacion"
          onClick={() => setPresentacion(false)}
        >
          <IconoCerrar tamano={16} />
          Salir · Esc
        </button>
      )}

      <main id="contenido">
        {estadoModelo === "error" && (
          <div className="aviso error" role="alert">
            No se pudo cargar el modelo. Verifica que <code>web/public/models/</code> tenga el
            archivo <code>.onnx</code>, <code>labels.json</code> y <code>metadata.json</code>.
          </div>
        )}
        {error && (
          <div className="aviso error" role="alert">
            {error}
          </div>
        )}

        <div className="tablero">
          <section className="panel secundario" aria-label="Entrada">
            <div className="pestanas" role="tablist" aria-label="Cómo entregar la imagen">
              {MODOS.map(({ id, texto, Icono }, i) => (
                <button
                  key={id}
                  id={`pestana-${id}`}
                  role="tab"
                  aria-selected={modo === id}
                  aria-controls="entrada"
                  tabIndex={modo === id ? 0 : -1}
                  className="pestana"
                  onKeyDown={(e) => alTeclearPestana(e, i)}
                  onClick={() => {
                    setModo(id);
                    limpiar();
                  }}
                >
                  <Icono tamano={18} />
                  {texto}
                </button>
              ))}
            </div>

            <div id="entrada" role="tabpanel" aria-labelledby={`pestana-${modo}`}>
              {modo === "archivo" &&
                (imagenURL ? (
                  <>
                    <div className="marco">
                      <div className="vista-previa">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagenURL} alt="Imagen cargada para reconocer" />
                        <span key={barrido} className="barrido" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="barra-acciones">
                      <button className="boton" onClick={limpiar}>
                        <IconoSubir tamano={18} />
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
            </div>
          </section>

          <section className="panel" aria-label="Resultado">
            <h2>Dictamen</h2>
            <PanelResultado resultado={resultado} cargando={cargando} />
          </section>
        </div>

        {historial.length > 0 && (
          <section className="historial" aria-label="Historial de la sesión">
            <div className="historial-cabecera">
              <h2>Historial de la sesión · {historial.length}</h2>
              <button className="boton sutil pequeno" onClick={() => setHistorial([])}>
                <IconoBorrar tamano={16} />
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
                  aria-label={
                    h.resultado.rechazada
                      ? "Ver resultado anterior: no válido"
                      : `Ver resultado anterior: ${h.resultado.valor}`
                  }
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
      </main>

      <footer className="pie-pagina">
        <span>
          Modelo {metadata?.run_id ?? "—"} · {metadata?.arquitectura ?? "—"} ·{" "}
          {metadata ? (metadata.bytes_onnx / 1e6).toFixed(2) : "—"} MB
        </span>
        <span>
          <kbd>P</kbd> presentar · <kbd>Esc</kbd> salir
        </span>
      </footer>
    </div>
  );
}
