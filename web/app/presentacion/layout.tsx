import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presentación · Numerales mayas",
  description:
    "Cómo funciona una red neuronal convolucional y cómo construimos el sistema que reconoce números mayas del 1 al 19.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
