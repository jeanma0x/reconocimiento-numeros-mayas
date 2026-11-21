import { neon } from "@neondatabase/serverless";

/**
 * /dashboard — evidencia para la exposición. Lee de Neon en el servidor.
 *
 * Es opcional POR DISEÑO (ADR-007, invariante I5): la demo no depende de esta página.
 * Sin DATABASE_URL, o si Neon falla, muestra un aviso y no rompe nada.
 */
export const dynamic = "force-dynamic";

type Resumen = {
  total: number;
  rechazadas: number;
  ms_medio: number | null;
  por_valor: { valor: number; n: number }[];
  por_motivo: { motivo: string; n: number }[];
  por_origen: { origen: string; n: number }[];
  ultimas: {
    creado_en: string;
    origen: string;
    valor: number | null;
    rechazada: boolean;
    motivo: string | null;
    confianza: number;
  }[];
};

async function cargar(): Promise<{ datos?: Resumen; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { error: "Neon no está configurado (falta DATABASE_URL en Vercel)." };
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [tot] = (await sql`
      select count(*)::int as total,
             count(*) filter (where rechazada)::int as rechazadas,
             avg(ms_inferencia)::float as ms_medio
      from predicciones`) as { total: number; rechazadas: number; ms_medio: number | null }[];
    const por_valor = (await sql`
      select valor::int as valor, count(*)::int as n from predicciones
      where not rechazada group by valor order by valor`) as Resumen["por_valor"];
    const por_motivo = (await sql`
      select motivo, count(*)::int as n from predicciones
      where rechazada group by motivo order by n desc`) as Resumen["por_motivo"];
    const por_origen = (await sql`
      select origen, count(*)::int as n from predicciones
      group by origen order by n desc`) as Resumen["por_origen"];
    const ultimas = (await sql`
      select creado_en, origen, valor, rechazada, motivo, confianza
      from predicciones order by id desc limit 20`) as Resumen["ultimas"];
    return { datos: { ...tot, por_valor, por_motivo, por_origen, ultimas } };
  } catch (e) {
    console.error("dashboard: Neon falló:", e);
    return { error: "No se pudo leer la base de datos." };
  }
}

const ETIQUETA_MOTIVO: Record<string, string> = {
  clase_no_valida: "La red dijo «no es número maya»",
  baja_confianza: "Confianza por debajo del umbral",
  inconsistencia: "Barras y puntos no cuadran con la clase",
  margen: "Dos candidatos casi empatados",
};

export default async function Dashboard() {
  const { datos, error } = await cargar();
  const max = datos ? Math.max(1, ...datos.por_valor.map((v) => v.n)) : 1;
  const tasa = datos && datos.total ? (datos.rechazadas / datos.total) * 100 : 0;

  return (
    <div className="envoltorio">
      <header className="cabecera">
        <h1 className="titulo">
          Evidencia <span>· predicciones registradas</span>
        </h1>
        <nav>
          <a className="boton" href="/">
            ← Volver al reconocedor
          </a>
        </nav>
      </header>

      {error && (
        <p className="aviso" role="status">
          {error} La demostración no depende de esto: el reconocimiento corre en el navegador.
        </p>
      )}

      {datos && (
        <>
          <div className="tablero" style={{ marginBottom: 18 }}>
            <section className="panel">
              <h2>Resumen</h2>
              <table className="datos">
                <tbody>
                  <tr>
                    <th>Predicciones</th>
                    <td>{datos.total.toLocaleString("es")}</td>
                  </tr>
                  <tr>
                    <th>Rechazadas</th>
                    <td>
                      {datos.rechazadas.toLocaleString("es")} ({tasa.toFixed(1)} %)
                    </td>
                  </tr>
                  <tr>
                    <th>Latencia media</th>
                    <td>{datos.ms_medio == null ? "—" : `${datos.ms_medio.toFixed(0)} ms`}</td>
                  </tr>
                  {datos.por_origen.map((o) => (
                    <tr key={o.origen}>
                      <th>Origen: {o.origen}</th>
                      <td>{o.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h2>Por qué se rechazó</h2>
              {datos.por_motivo.length === 0 && <p className="pista">Sin rechazos todavía.</p>}
              <table className="datos">
                <tbody>
                  {datos.por_motivo.map((m) => (
                    <tr key={m.motivo ?? "?"}>
                      <th>{ETIQUETA_MOTIVO[m.motivo ?? ""] ?? m.motivo ?? "—"}</th>
                      <td>{m.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <section className="panel" style={{ marginBottom: 18 }}>
            <h2>Números reconocidos</h2>
            <div className="barras">
              {datos.por_valor.length === 0 && <p className="pista">Sin datos todavía.</p>}
              {datos.por_valor.map((v) => (
                <div className="barra" key={v.valor}>
                  <span className="etq">{v.valor}</span>
                  <span className="riel">
                    <span className="relleno" style={{ width: `${(v.n / max) * 100}%` }} />
                  </span>
                  <span className="val">{v.n}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Últimas 20</h2>
            <table className="datos">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Origen</th>
                  <th>Resultado</th>
                  <th>Confianza</th>
                </tr>
              </thead>
              <tbody>
                {datos.ultimas.map((u, i) => (
                  <tr key={i}>
                    <td>{new Date(u.creado_en).toLocaleTimeString("es-GT")}</td>
                    <td>{u.origen}</td>
                    <td>{u.rechazada ? "Rechazada" : u.valor}</td>
                    <td>{(u.confianza * 100).toFixed(0)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
