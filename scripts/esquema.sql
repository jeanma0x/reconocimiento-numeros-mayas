-- Esquema de Neon. Correr desde el editor SQL de Neon o con psql.
-- Ver docs/01-ARQUITECTURA.md y ADR-007.
-- Regla: nada de esto está en el camino crítico de la demo.

create table if not exists predicciones (
  id            bigserial primary key,
  creado_en     timestamptz not null default now(),
  origen        text        not null,   -- 'archivo' | 'camara' | 'lienzo'
  valor         smallint,               -- 1..19, null si fue rechazada
  rechazada     boolean     not null,
  motivo        text,                   -- 'baja_confianza' | 'clase_no_valida' | 'inconsistencia' | 'margen'
  confianza     real        not null,
  barras        smallint,
  puntos        smallint,
  ms_inferencia integer,
  modelo        text        not null,   -- id de la corrida que produjo el .onnx
  hash_imagen   text,                   -- sha256, para deduplicar
  blob_url      text,                   -- Vercel Blob, solo si el usuario autoriza
  constraint valor_coherente check (
    (rechazada and valor is null) or (not rechazada and valor between 1 and 19)
  )
);

create table if not exists retroalimentacion (
  id            bigserial primary key,
  prediccion_id bigint      not null references predicciones(id) on delete cascade,
  correcta      boolean     not null,
  valor_real    smallint,               -- lo que el usuario dice que era
  creado_en     timestamptz not null default now()
);

create index if not exists idx_predicciones_fecha on predicciones (creado_en desc);
create index if not exists idx_predicciones_valor on predicciones (valor) where not rechazada;
create index if not exists idx_retro_prediccion  on retroalimentacion (prediccion_id);
