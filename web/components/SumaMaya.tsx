/**
 * La cuenta de la red dibujada con fichas: una ficha por barra (vale 5) y una por punto
 * (vale 1), y el total. Es la forma más rápida de que cualquiera entienda por qué el
 * número es el que es, sin saber qué es una red neuronal.
 */
export default function SumaMaya({ barras, puntos }: { barras: number; puntos: number }) {
  const total = 5 * barras + puntos;
  return (
    <div
      className="suma"
      role="img"
      aria-label={`${barras} ${barras === 1 ? "barra" : "barras"} de 5 y ${puntos} ${
        puntos === 1 ? "punto" : "puntos"
      } de 1: suman ${total}`}
    >
      {Array.from({ length: barras }).map((_, i) => (
        <span className="ficha-suma" key={`b${i}`} style={{ animationDelay: `${i * 90}ms` }}>
          <svg width="28" height="12" viewBox="0 0 34 12" fill="currentColor" aria-hidden="true">
            <rect y="1" width="34" height="10" rx="5" />
          </svg>
          <b>5</b>
        </span>
      ))}
      {Array.from({ length: puntos }).map((_, i) => (
        <span
          className="ficha-suma"
          key={`p${i}`}
          style={{ animationDelay: `${(barras + i) * 90}ms` }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <circle cx="7" cy="7" r="6" />
          </svg>
          <b>1</b>
        </span>
      ))}
      <span className="igual">= {total}</span>
    </div>
  );
}
