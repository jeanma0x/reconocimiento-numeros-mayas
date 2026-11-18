# Empieza aquí

Si es tu primera vez en este repositorio, leé esta página completa. Son cinco minutos y te
ahorran medio día.

## Qué es esto

Proyecto 02 de Inteligencia Artificial, UVG Campus Sur. Un software que reconoce números mayas
del 1 al 19 en una imagen usando una red neuronal convolucional, y que rechaza todo lo que no
sea eso.

**Se presenta el sábado 21 de noviembre a las 07:00 en Biblioteca. Vale 30 puntos.**

Dos cosas que conviene entender desde el principio, porque explican casi todas las decisiones
del proyecto:

1. **La mitad de la nota se juega en vivo.** El docente nos da 4 imágenes para reconocer (10%
   cada una) y 2 para rechazar (5% cada una), y las puede dibujar a mano en el momento. Se
   califican todo o nada: no hay puntos parciales.
2. **Las preguntas valen 30% y él elige quién responde cada una.** Todos tenemos que entender
   todo el proyecto, no solo nuestra parte.

## Qué hacer, en orden

### 1. Clonar

```bash
git clone https://github.com/josejulianamadogarcia10-lab/reconocimiento-numeros-mayas.git
cd reconocimiento-numeros-mayas
```

### 2. Leer tres archivos

| Archivo | Qué te dice |
|---|---|
| [`ESTADO.md`](ESTADO.md) | En qué va el proyecto **ahora mismo** y cuál es el siguiente paso. Léelo siempre antes de empezar a trabajar. |
| [`../CLAUDE.md`](../CLAUDE.md) | Cómo se trabaja en este repo y las 8 reglas que no se rompen. |
| [`00-CONTEXTO.md`](00-CONTEXTO.md) | El enunciado y la rúbrica completa. |

Después, el documento de tu responsabilidad (lo encontrás en el [`README`](../README.md)).

### 3. Hacer tus fotos

👉 **[`INSTRUCCIONES-FOTOS.md`](INSTRUCCIONES-FOTOS.md)** — unos 30 minutos, con fecha límite el
jueves 19 a mediodía. Acompañala con la **[guía visual](guia-visual-numeros-mayas.html)**, que trae
los 19 números dibujados y los 15 casos inválidos; abrila en el navegador mientras escribís. Es lo único que no se puede acelerar programando y de ello depende que el
modelo funcione el sábado. Hacelo antes que cualquier cosa de código.

### 4. Instalar lo que ocupes

```bash
cd ml && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt && pytest
```

Para la parte web, `web/README.md` tiene los comandos.

---

## Si vas a usar Claude (o cualquier agente) para programar esto

Todo el repositorio está escrito para que un agente pueda trabajar con contexto completo. No le
pidas que improvise: hacelo leer primero.

**Abrí el repo en VS Code con la extensión de Claude y pegale esto como primer mensaje:**

```
Antes de hacer nada, leé en este orden:
1. CLAUDE.md — protocolo de trabajo y las 8 invariantes del proyecto
2. docs/ESTADO.md — en qué va el proyecto y cuál es el siguiente paso
3. docs/00-CONTEXTO.md — el enunciado y la rúbrica
4. docs/DECISIONES.md — las decisiones técnicas ya tomadas (ADR-001 a ADR-009)

Después decime: qué entendiste del estado actual, cuál es el siguiente paso según
ESTADO.md, y qué vas a hacer exactamente antes de escribir una sola línea de código.
No modifiques nada hasta que yo confirme.
```

**Reglas para trabajar con el agente en este repo:**

- **No empieces a programar sin que haya leído `CLAUDE.md`.** Ahí están las 8 invariantes; si las
  rompe, el proyecto se invalida (por ejemplo: está prohibido delegar la clasificación a un LLM,
  y está prohibido resolverlo con reglas programadas a mano).
- **Al terminar tu sesión, pedile que actualice `docs/ESTADO.md`.** Ese archivo es la memoria
  compartida entre los cuatro y entre sesiones. Si queda desactualizado, el siguiente empieza a
  ciegas y se repite trabajo.
- **Si toma una decisión técnica nueva, que la registre en `docs/DECISIONES.md`** con el mismo
  formato ADR que ya está ahí.
- **Ninguna métrica se inventa.** Si un número no salió de una corrida real guardada en
  `ml/runs/`, no va ni en los documentos ni en la presentación. Esto aplica igual al agente que
  a nosotros.
- **Commits pequeños y en español**, formato `tipo(ámbito): descripción`. Ver `CONTRIBUTING.md`.

## Para pushear

El repositorio es **público**, así que cualquiera puede clonarlo y leerlo. Para **subir** cambios
hay que estar invitado como colaborador: mandale tu usuario de GitHub a José Julián y te agrega.

## Dudas

Cualquier cosa, al grupo. Y si algo de la documentación está mal o desactualizado, corregilo y
hacé commit: el repo es de los cuatro.
