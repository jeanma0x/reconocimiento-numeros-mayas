"use client";

import { useEffect, useState } from "react";

import GlifoMaya from "@/components/GlifoMaya";
import type { Metadata } from "@/lib/tipos";

export default function Acerca() {
  const [meta, setMeta] = useState<Metadata | null>(null);
  useEffect(() => {
    fetch(`/models/metadata.json?v=${process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  const m = meta?.metricas as Record<string, number | null> | undefined;
  const pct = (v: number | null | undefined) =>
    typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "—";

  return (
    <div className="envoltorio">
      <header className="cabecera">
        <a className="marca" href="/" aria-label="Numerales mayas, inicio">
          <GlifoMaya valor={19} ancho={44} className="marca-glifo" />
          <h1 className="titulo">
            Cómo funciona
            <span>Numerales mayas con CNN</span>
          </h1>
        </a>
        <nav>
          <a className="boton" href="/">
            ← Volver al reconocedor
          </a>
        </nav>
      </header>

      <main id="contenido">
      <section className="panel" style={{ marginBottom: 18 }}>
        <h2>El sistema de numeración</h2>
        <p style={{ marginTop: 0 }}>
          Dos símbolos: el <b>punto</b> vale 1 y la <b>barra</b> vale 5. Las barras van abajo,
          apiladas; los puntos arriba, en fila. Por lo tanto{" "}
          <b>valor = 5 × barras + puntos</b>, con 0 a 3 barras y 0 a 4 puntos. Las 20
          combinaciones posibles menos (0, 0) dan exactamente las 19 clases válidas.
        </p>
        <p style={{ color: "var(--gris)", fontSize: 14 }}>
          Esa estructura es la razón de que el modelo tenga tres cabezas: una predice la clase
          entre las 20, otra cuántas barras y otra cuántos puntos. Las tres son salidas de la
          red; la aritmética solo verifica que concuerden.
        </p>
        <div className="rejilla-numeros">
          {Array.from({ length: 19 }, (_, i) => i + 1).map((v) => (
            <div className="celda-numero" key={v}>
              <div className="n">{v}</div>
              <GlifoMaya valor={v} />
              <div className="c">
                {Math.floor(v / 5)}b · {v % 5}p
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="tablero">
        <section className="panel">
          <h2>El modelo</h2>
          <table className="datos">
            <tbody>
              <tr>
                <th>Corrida</th>
                <td>{meta?.run_id ?? "—"}</td>
              </tr>
              <tr>
                <th>Arquitectura</th>
                <td>{meta?.arquitectura ?? "—"}</td>
              </tr>
              <tr>
                <th>Parámetros</th>
                <td>{meta ? meta.parametros.toLocaleString("es") : "—"}</td>
              </tr>
              <tr>
                <th>Tamaño</th>
                <td>{meta ? `${(meta.bytes_onnx / 1e6).toFixed(2)} MB` : "—"}</td>
              </tr>
              <tr>
                <th>Entrada</th>
                <td>{meta ? `${meta.lado_entrada}×${meta.lado_entrada}, 1 canal` : "—"}</td>
              </tr>
              <tr>
                <th>ONNX vs PyTorch</th>
                <td>
                  {meta?.verificacion
                    ? `máx. diferencia ${meta.verificacion.max_diff.toExponential(1)}, ` +
                      `${(meta.verificacion.coincidencia_etiquetas * 100).toFixed(0)}% de ` +
                      `coincidencia en ${meta.verificacion.n_muestras} muestras`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Resultados</h2>
          <table className="datos">
            <tbody>
              <tr>
                <th>Exactitud global</th>
                <td>{pct(m?.exactitud_global)}</td>
              </tr>
              <tr>
                <th>Exactitud en válidas</th>
                <td>{pct(m?.exactitud_validas)}</td>
              </tr>
              <tr>
                <th>Rechazo correcto</th>
                <td>{pct(m?.rechazo_correcto)}</td>
              </tr>
              <tr>
                <th>Falso rechazo</th>
                <td>{pct(m?.falso_rechazo)}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ color: "var(--gris)", fontSize: 13, marginBottom: 0 }}>
            Medidas sobre el conjunto de prueba de la corrida, que mezcla imágenes sintéticas que
            la red no vio con fotos de una persona excluida del entrenamiento. Las cifras de
            las fotos reales, con n pequeño, están en <code>docs/DECISIONES.md</code> (ADR-016).
            Un guion significa que esa corrida no se evaluó sobre este conjunto.
          </p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Arquitectura</h2>
        <p style={{ marginTop: 0 }}>
          El modelo se entrena en PyTorch, se exporta a ONNX y corre{" "}
          <b>dentro de tu navegador</b> con ONNX Runtime. Ningún servidor participa en el
          reconocimiento: una vez cargada la página, la aplicación funciona sin internet.
        </p>
        <p style={{ color: "var(--gris)", fontSize: 14, marginBottom: 0 }}>
          El rechazo son cuatro capas en orden: que la red prediga directamente la clase
          &ldquo;no válido&rdquo;; que la confianza calibrada no llegue al umbral; que la clase
          no concuerde con las cabezas de barras y puntos; y que el margen entre las dos
          opciones más probables sea demasiado pequeño.
        </p>
      </section>

      </main>

      <footer className="pie-pagina">
        <span>Proyecto 02 · Inteligencia Artificial · UVG Campus Sur</span>
        <a href="https://github.com/josejulianamadogarcia10-lab/reconocimiento-numeros-mayas">
          Código en GitHub
        </a>
      </footer>
    </div>
  );
}
