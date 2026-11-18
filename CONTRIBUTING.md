# Cómo trabajamos en este repositorio

## Ramas

- `main` — siempre desplegable. **Lo que esté en `main` el sábado a las 07:00 es lo que se presenta.**
- `feat/<tema>` — trabajo nuevo. Ejemplos: `feat/generador-sintetico`, `feat/ui-camara`.
- `fix/<tema>` — correcciones.

Nunca se trabaja directo sobre `main` después del jueves. Antes del jueves, está bien para avanzar rápido.

## Commits

Formato: `tipo(ámbito): descripción en español`

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `data`.

```
feat(synth): generador de barras y puntos con jitter de trazo
fix(preprocess): conservar componentes múltiples, no solo el contorno más grande
docs(modelo): justificar el umbral de rechazo elegido
data(real): 240 fotos del equipo, clases 1-19
```

## Pull requests

Antes del jueves: push directo a `main` para avanzar, con commits pequeños.
Desde el jueves: PR con al menos una revisión de otro integrante. Nada entra a `main` sin que
alguien más lo haya corrido en su máquina.

## Sincronizar el dataset

Las imágenes **no van en git** (ver `.gitignore`). Se comparten por la carpeta compartida del
equipo descrita en `data/README.md`. Lo que sí va en git es el **manifiesto**
(`data/manifest.csv`): la lista de archivos con su hash, clase y split. Así cualquiera puede
verificar que tiene exactamente el mismo dataset.

## Antes de pushear

```bash
cd ml && pytest          # que los tests pasen
cd ../web && npm run build   # que el build de producción no truene
```

## Reglas de oro

1. No rompas `main`.
2. Si cambias el preprocesamiento, corre el test de paridad y arregla el lado de TypeScript en el mismo PR.
3. Si cambias `labels.py`, hay que reentrenar. No es un cambio cosmético.
4. Actualiza `docs/ESTADO.md` al terminar.
