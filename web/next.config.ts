import type { NextConfig } from "next";

const config: NextConfig = {
  // onnxruntime-web trae binarios .wasm y código específico de Node que el bundler
  // del servidor no debe tocar: el modelo solo se usa en el cliente.
  serverExternalPackages: ["onnxruntime-web"],
  async headers() {
    return [
      {
        // El modelo se nombra con el id de la corrida, así que su contenido nunca
        // cambia bajo el mismo nombre: se puede cachear para siempre. Eso hace que
        // a partir de la segunda visita la app funcione sin red.
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
