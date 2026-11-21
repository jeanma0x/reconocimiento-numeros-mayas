import type { NextConfig } from "next";

const config: NextConfig = {
  // Id que cambia en cada despliegue; versiona las URL de los JSON del modelo (ver
  // lib/inferencia.ts). En Vercel es el SHA del commit.
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now()) },
  // onnxruntime-web trae binarios .wasm y código específico de Node que el bundler
  // del servidor no debe tocar: el modelo solo se usa en el cliente.
  serverExternalPackages: ["onnxruntime-web"],
  async headers() {
    return [
      {
        // El .onnx lleva el id de la corrida en el nombre y los JSON se piden con
        // ?v=<despliegue>: ninguno cambia bajo la misma URL, así que se cachean para
        // siempre y desde la segunda visita la app funciona sin red.
        source: "/models/:archivo*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/ort/:archivo*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default config;
