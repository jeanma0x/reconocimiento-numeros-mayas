import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Números mayas · Reconocimiento con CNN",
  description:
    "Reconoce números mayas del 1 al 19 con una red neuronal convolucional que corre en el navegador.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
