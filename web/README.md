# web · Interfaz

Next.js + TypeScript + Tailwind + shadcn/ui. Corre el modelo en el navegador con
`onnxruntime-web`. Especificación completa en `../docs/05-FRONTEND.md`.

## Crear el proyecto (solo la primera vez)

Desde la raíz del repositorio:

```bash
npx create-next-app@latest web --ts --tailwind --eslint --app --src-dir=false \
    --import-alias "@/*" --use-npm
cd web
npm install onnxruntime-web @neondatabase/serverless recharts
npx shadcn@latest init
npx shadcn@latest add button card tabs badge progress alert skeleton
```

Conservar este README al sobrescribir la carpeta.

## Desarrollo

```bash
npm run dev            # http://localhost:3000
npm run build          # lo mismo que corre Vercel
npm start              # respaldo local para el día de la presentación
npm run test:parity    # paridad del preprocesamiento contra los fixtures de Python
```

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
