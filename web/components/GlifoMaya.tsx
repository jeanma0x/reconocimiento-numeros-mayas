/**
 * Dibuja un número maya del 1 al 19 como SVG: los puntos arriba, en fila, y las barras
 * debajo, apiladas. Es el dibujo canónico del sistema (valor = 5 × barras + puntos), no
 * una predicción: sirve para mostrar qué leyó la red, para la leyenda y para el logotipo.
 *
 * Usa `currentColor`, así que hereda el color del texto y funciona en claro y oscuro.
 */
export default function GlifoMaya({
  valor,
  ancho = 92,
  titulo,
  className,
}: {
  valor: number;
  ancho?: number;
  /** Texto accesible. Sin él, el SVG se marca como decorativo. */
  titulo?: string;
  className?: string;
}) {
  const barras = Math.floor(valor / 5);
  const puntos = valor % 5;

  const W = 92;
  const H = 76;
  const BARRA_W = 64;
  const BARRA_H = 9;
  const SEP_BARRA = 6;
  const R = 5.5;
  const SEP_PUNTO = 15;
  const HUECO = 10;

  const altoTotal =
    (puntos ? 2 * R : 0) +
    (puntos && barras ? HUECO : 0) +
    (barras ? barras * BARRA_H + (barras - 1) * SEP_BARRA : 0);
  let y = (H - altoTotal) / 2;
  const elementos: React.ReactNode[] = [];

  if (puntos) {
    const x0 = W / 2 - ((puntos - 1) * SEP_PUNTO) / 2;
    for (let i = 0; i < puntos; i++) {
      elementos.push(<circle key={`p${i}`} cx={x0 + i * SEP_PUNTO} cy={y + R} r={R} />);
    }
    y += 2 * R + (barras ? HUECO : 0);
  }
  for (let i = 0; i < barras; i++) {
    elementos.push(
      <rect
        key={`b${i}`}
        x={W / 2 - BARRA_W / 2}
        y={y + i * (BARRA_H + SEP_BARRA)}
        width={BARRA_W}
        height={BARRA_H}
        rx={4}
      />,
    );
  }

  return (
    <svg
      className={className}
      width={ancho}
      height={(ancho * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      fill="currentColor"
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {titulo && <title>{titulo}</title>}
      {elementos}
    </svg>
  );
}
