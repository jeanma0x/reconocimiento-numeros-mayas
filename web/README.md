# web · Interfaz

Next.js + TypeScript + Tailwind + shadcn/ui. Corre el modelo en el navegador con
`onnxruntime-web`. Especificación completa en `../docs/05-FRONTEND.md`.

## Arranque

La aplicación ya está construida. Solo hay que instalar y correr:

```bash
cd web
npm install
npm run dev            # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción, lo mismo que corre Vercel |
| `npm start` | Sirve el build. **Es el respaldo local del día de la presentación** |
| `npm run test:parity` | Paridad del preprocesamiento contra los fixtures de Python |
| `npm run test:inference` | Carga el `.onnx` y verifica el motor de inferencia de punta a punta |

Los dos tests necesitan los fixtures, que se generan una vez desde `ml/`:

```bash
cd ../ml && python -m maya.preprocess --fixtures ../web/fixtures
```

`npm run dev` y `npm run build` copian antes los binarios `.wasm` de onnxruntime a
`public/ort/`. Sin eso el navegador los buscaría en un CDN y la aplicación dejaría de
funcionar sin internet, que es justo lo que no podemos permitirnos el sábado.

## Qué hay implementado

- **Cuatro formas de entrada**: selector de archivos, arrastrar y soltar, pegar con Ctrl+V,
  cámara en vivo y lienzo para dibujar con el mouse o el dedo.
- **Resultado** con el número en grande o el aviso de rechazo con su motivo técnico.
- **Barras de confianza** con las tres clases más probables.
- **Panel "cómo lo vio la red"**: el tensor de 64×64 que realmente entró, las cabezas de
  barras y puntos, la verificación de consistencia y el tiempo de inferencia.
- **Historial de la sesión**: se puede volver a cualquier predicción anterior.
- **Modo presentación** con la tecla `P`: agranda el resultado y oculta lo secundario.
- **Página `/acerca`** con la tabla de los 19 números, las métricas del modelo y la
  arquitectura. Sirve de material de apoyo en la exposición.

## Sin Tailwind ni shadcn/ui

Se usa CSS escrito a mano en `app/globals.css`, con variables y modo claro/oscuro. Menos
dependencias es menos cosas que pueden romperse el viernes por la noche. Ver ADR-010.

## Variables de entorno

Copiar `.env.example` a `.env.local`. `DATABASE_URL` **nunca** lleva prefijo `NEXT_PUBLIC_`.

## Archivos que no se editan a mano

| Archivo | Origen |
|---|---|
| `lib/labels.ts` | generado desde `ml/src/maya/labels.py` |
| `public/models/labels.json` | `python -m maya.labels` |
| `public/models/thresholds.json` | `python -m maya.calibrate` |
| `public/models/maya_cnn.*.onnx` | `python -m maya.export_onnx` |

`lib/preprocess.ts` sí se escribe a mano, pero es un **port exacto** de
`ml/src/maya/preprocess.py`. Si cambia uno, cambian los dos, y hay que correr el test de
paridad en el mismo PR (invariante I4).
