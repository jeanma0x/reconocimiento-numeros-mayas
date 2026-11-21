/**
 * Set de íconos propio, todos con la misma retícula (24×24) y el mismo trazo.
 * Nunca emoji ni caracteres Unicode como ícono: se renderizan distinto en cada sistema.
 */
type Props = { tamano?: number; className?: string };

function Base({ tamano = 20, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconoSubir = (p: Props) => (
  <Base {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
  </Base>
);

export const IconoCamara = (p: Props) => (
  <Base {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </Base>
);

export const IconoLapiz = (p: Props) => (
  <Base {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </Base>
);

export const IconoCheck = (p: Props) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);

export const IconoAlerta = (p: Props) => (
  <Base {...p}>
    <path d="M12 4 3 19.5h18L12 4Z" />
    <path d="M12 10v4.5" />
    <path d="M12 17.2v.01" />
  </Base>
);

export const IconoProhibido = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Base>
);

export const IconoGirar = (p: Props) => (
  <Base {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
  </Base>
);

export const IconoBorrar = (p: Props) => (
  <Base {...p}>
    <path d="M5 7h14" />
    <path d="M9 7V5h6v2" />
    <path d="m7 7 .8 12h8.4L17 7" />
  </Base>
);

export const IconoRayo = (p: Props) => (
  <Base {...p}>
    <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
  </Base>
);
