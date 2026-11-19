import { NextResponse } from "next/server";

/**
 * Registro de predicciones. Opcional POR DISEÑO (ADR-007): si no hay base de datos
 * configurada, responde 204 y no pasa nada. La demo nunca depende de esto.
 *
 * Jean Marco: para activarlo, instalar @neondatabase/serverless, correr
 * scripts/esquema.sql en Neon y poner DATABASE_URL en Vercel.
 */
export async function POST(peticion: Request) {
  if (!process.env.DATABASE_URL) {
    return new NextResponse(null, { status: 204 });
  }
  try {
    const datos = await peticion.json();
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      insert into predicciones
        (origen, valor, rechazada, motivo, confianza, barras, puntos, ms_inferencia, modelo)
      values
        (${datos.origen}, ${datos.valor}, ${datos.rechazada}, ${datos.motivo},
         ${datos.confianza}, ${datos.barras}, ${datos.puntos}, ${datos.ms_inferencia},
         ${process.env.NEXT_PUBLIC_MODELO_VERSION ?? "desconocido"})`;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("registro de predicción falló:", e);
    return new NextResponse(null, { status: 204 });
  }
}
