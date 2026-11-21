import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";

import "./globals.css";

// Las tres se descargan en el build y se sirven desde el propio sitio (no desde
// fonts.googleapis.com en tiempo de ejecución): la app tiene que funcionar sin internet.
const titulo = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--f-titulo",
  display: "swap",
});
const cuerpo = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--f-cuerpo",
  display: "swap",
});
const datos = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-datos",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Numerales mayas · Reconocimiento con CNN",
  description:
    "Reconoce números mayas del 1 al 19 con una red neuronal convolucional que corre en el navegador, sin servidor.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#14130f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titulo.variable} ${cuerpo.variable} ${datos.variable}`}>
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
