import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

export const N = (n: number, extra: CSSProperties = {}) => ({ "--n": n, ...extra }) as CSSProperties;

/** Fragmento: aparece cuando el presentador avanza hasta el paso `n`. */
export function F({ n, className = "", style, children }: { n: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`f ${className}`} style={N(n, style)}>
      {children}
    </div>
  );
}

/** Encabezado de lámina: etiqueta + título corto (una palabra en cursiva de acento). */
export function Cabeza({ k, children, sub }: { k: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <header>
      <p className="k">{k}</p>
      <h2 className="h">{children}</h2>
      {sub && <p className="sub">{sub}</p>}
    </header>
  );
}

/** Cuenta de 0 a `hasta` cuando `activo` es verdadero. */
export function useContar(hasta: number, activo: boolean, ms = 1700) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!activo) {
      setV(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(hasta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [hasta, activo, ms]);
  return v;
}

export const miles = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const dec = (n: number, d = 1) => n.toFixed(d).replace(".", ",");

export type Diapo = {
  id: string;
  titulo: string;
  pasos: number;
  Contenido: (p: { paso: number }) => React.JSX.Element;
};
