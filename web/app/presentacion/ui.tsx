import type { CSSProperties, ReactNode } from "react";

/** Estilo con el número de paso en el que aparece un elemento (--n). */
export const N = (n: number, extra: CSSProperties = {}) =>
  ({ "--n": n, ...extra }) as CSSProperties;

/** Fragmento: aparece cuando el presentador avanza hasta el paso `n`. */
export function F({
  n,
  className = "",
  style,
  children,
}: {
  n: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`f ${className}`} style={N(n, style)}>
      {children}
    </div>
  );
}

/** Encabezado de cada lámina: capítulo + título (con una palabra en cursiva de acento). */
export function Cabeza({
  kicker,
  children,
  lead,
}: {
  kicker: string;
  children: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <header className="cabeza-lamina">
      <p className="k">{kicker}</p>
      <h2 className="t">{children}</h2>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}

/** Flecha de diagrama. */
export function Flecha({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg
      className={`flecha${vertical ? " vertical" : ""}`}
      width={vertical ? 14 : 44}
      height={vertical ? 34 : 14}
      viewBox={vertical ? "0 0 14 34" : "0 0 44 14"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {vertical ? (
        <>
          <path d="M7 1v30" />
          <path d="m2 26 5 6 5-6" />
        </>
      ) : (
        <>
          <path d="M1 7h40" />
          <path d="m36 2 6 5-6 5" />
        </>
      )}
    </svg>
  );
}

export type Diapo = {
  id: string;
  titulo: string;
  /** Cuántas veces se puede avanzar dentro de la lámina antes de pasar a la siguiente. */
  pasos: number;
  Contenido: (p: { paso: number }) => React.JSX.Element;
};
