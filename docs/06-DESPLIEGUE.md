# 06 · Despliegue: Vercel y Neon

## Flujo

```
GitHub (main) ──push──► Vercel ──build──► CDN (estáticos + .onnx)
                           └──► Route Handlers ──► Neon (Postgres)
```

Cada rama genera un *preview deployment* con su propia URL; `main` va a producción. Nadie
despliega a mano desde su máquina.

## Vercel

### Alta

1. Entrar a vercel.com con la cuenta de GitHub.
2. **Import Project** → seleccionar este repositorio.
3. **Root Directory: `web`** (el repo tiene `ml/` y `web/`; Vercel debe apuntar solo a `web`).
4. Framework: Next.js, detectado automáticamente.
5. Agregar las variables de entorno (abajo) y desplegar.

### Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `DATABASE_URL` | Vercel (server) | Cadena de conexión de Neon. **Nunca con prefijo `NEXT_PUBLIC_`** |
| `BLOB_READ_WRITE_TOKEN` | Vercel (server) | Vercel Blob, para imágenes donadas |
| `NEXT_PUBLIC_MODELO_VERSION` | Vercel (cliente) | Id de la corrida que produjo el `.onnx`; se muestra en la UI |

`web/.env.example` documenta todas. El `.env.local` real **no se versiona**.

### Cabeceras y caché

En `web/next.config.ts`:

- `/models/*.onnx` → `Cache-Control: public, max-age=31536000, immutable`. El modelo se descarga
  una vez y queda en caché. Cuando cambie, cambia el nombre del archivo
  (`maya_cnn.<id-de-corrida>.onnx`), no el contenido del mismo nombre.
- Si se activa el WASM multihilo de `onnxruntime-web`, hacen falta
  `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp`
  (SharedArrayBuffer). **Empezar sin hilos**: un solo hilo es suficiente para un modelo de 0,5 M
  parámetros y evita problemas de aislamiento de origen. Activarlo solo si se mide que hace falta.

### Límites a tener presentes

- Los archivos estáticos en `public/` van al CDN sin límite práctico para nuestros ~2 MB.
- Las funciones serverless tienen límite de tamaño, pero **nosotros no corremos el modelo ahí**:
  las Route Handlers solo escriben en Neon. Por eso no nos afecta.

## Neon

### Alta

1. Entrar a neon.tech con la cuenta de GitHub.
2. Crear un proyecto, región la más cercana (`aws-us-east-1`).
3. Crear dos ramas de base de datos: `main` (producción) y `dev`. Neon permite ramificar la base
   igual que git, lo cual evita ensuciar producción mientras se desarrolla.
4. Copiar la cadena de conexión *pooled* y ponerla en `DATABASE_URL` en Vercel.
5. Correr `scripts/esquema.sql` (el DDL está en `01-ARQUITECTURA.md`) desde el editor SQL de Neon.

> Vercel tiene una integración de un clic con Neon que inyecta `DATABASE_URL` automáticamente en
> los tres entornos. Si está disponible, usarla: ahorra configurar variables a mano.

### Acceso desde el código

```ts
// web/lib/db.ts
import { neon } from '@neondatabase/serverless';
export const sql = neon(process.env.DATABASE_URL!);
```

Driver HTTP, no TCP: es lo que funciona en funciones serverless, donde un pool de conexiones
tradicional se queda colgado.

### Regla no negociable

Toda escritura a Neon ocurre **después** de mostrar el resultado al usuario y va envuelta así:

```ts
void registrarPrediccion(datos).catch(() => {});  // nunca await en el camino crítico
```

Si Neon está caído, lento o sin cuota, la demo no se entera. Ver invariante I5 en `CLAUDE.md`.

## Integración continua

`.github/workflows/ci.yml` en cada push:

1. `cd ml && pip install -r requirements.txt && pytest`
2. `cd web && npm ci && npm run build && npm run test:parity`

Si el test de paridad falla, el build falla y no se despliega. Es la red de seguridad del
invariante I4.

## Plan de respaldo para el sábado

El despliegue en Vercel es la ruta principal, pero el día de la demo **no se depende de la nube**:

1. **Principal:** la URL de Vercel, abierta y con el modelo ya en caché desde la noche anterior.
2. **Respaldo 1:** el repo clonado en la laptop, con `npm run build && npm start` corriendo en
   `localhost:3000`. Probado el viernes, no el sábado.
3. **Respaldo 2:** una segunda laptop del equipo con lo mismo.
4. El viernes por la noche: abrir la app, hacer una predicción, **apagar el wifi** y hacer cinco
   más. Si funcionan, el respaldo está validado.

Checklist completo en `07-QA-Y-EVALUACION.md`.
