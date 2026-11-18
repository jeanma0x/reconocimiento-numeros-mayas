# 05 · Interfaz gráfica

La interfaz **no suma puntos, pero resta 5 si incumple**. Tiene que ser sólida, clara y agradable,
y no debe consumir el viernes. Prioridad: que nunca se trabe durante la demo.

## Requisitos mínimos del enunciado

| Requisito | Cómo se cumple |
|---|---|
| Cargar imágenes con selector o drag and drop | Las dos, más pegar desde el portapapeles |
| Visualizar la imagen cargada | Vista previa grande, antes de predecir |
| Mostrar claramente el resultado o el rechazo | Número gigante, o aviso de rechazo con su motivo |
| Nuevas pruebas sin reiniciar | Historial de la sesión; cargar otra imagen no recarga nada |

## Lo que agregamos (y por qué)

| Función | Razón |
|---|---|
| **Cámara en vivo** | El docente puede dibujar a mano durante la presentación. Apuntar el celular o la webcam y capturar es más rápido y más confiable que fotografiar, pasar el archivo y subirlo |
| **Lienzo para dibujar** | Permite al docente dibujar directo con el mouse o el dedo. Elimina por completo la fotografía como fuente de error |
| **Pegar con Ctrl+V** | Si el docente manda la imagen por correo o chat, se pega y listo |
| **Panel "cómo lo vio la red"** | Muestra el tensor de 64×64 que realmente entró, más las cabezas de barras y puntos. Es la mejor herramienta de depuración y, en la exposición, demuestra que entendemos lo que hicimos |
| **Historial de la sesión** | Deja ver varias pruebas seguidas de un vistazo, y es la evidencia de "múltiples reconocimientos consecutivos" |
| **¿Fue correcto? Sí / No** | Alimenta Neon y el volante de datos |

## Pantallas

### `/` — Reconocedor

```
┌─────────────────────────────────────────────────────────────┐
│  Números mayas · CNN            [Archivo][Cámara][Dibujar]  │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   ┌──────────────────────┐   │          ┌───────┐           │
│   │                      │   │          │  13   │           │
│   │   arrastra una       │   │          └───────┘           │
│   │   imagen aquí        │   │        confianza 94 %        │
│   │                      │   │                              │
│   │   o haz clic         │   │   2 barras · 3 puntos  ✓     │
│   │                      │   │                              │
│   └──────────────────────┘   │   13 ████████████████ 94 %   │
│                              │   12 ██ 3 %                  │
│   [vista previa de la        │   14 █ 1 %                   │
│    imagen cargada]           │                              │
│                              │   ¿Correcto?  [Sí]  [No]     │
│                              │   ▸ Cómo lo vio la red       │
├──────────────────────────────┴──────────────────────────────┤
│  Historial:  [13 ✓] [7 ✓] [no válido] [19 ✓] [4 ✓]          │
└─────────────────────────────────────────────────────────────┘
```

**Caso de rechazo:** en lugar del número grande, un panel claramente distinto (color de
advertencia, ícono) con el texto:

> **No es un número maya del 1 al 19.**
> Motivo: la imagen no corresponde a un número maya válido en ese rango.

El motivo técnico (`baja_confianza`, `clase_no_valida`, `inconsistencia`) se muestra en letra
pequeña, porque es información útil para nosotros durante las pruebas del docente.

### `/dashboard` — Evidencia

Lee de Neon: total de predicciones, distribución por clase, tasa de rechazo, latencia media,
últimas 20 predicciones con miniatura. Sirve como material visual de la exposición.

### `/acerca` — Cómo funciona

Una página con el diagrama de la arquitectura, la tabla de los 19 números con sus barras y
puntos, las métricas de la corrida en producción y el enlace al repositorio. Es el respaldo
visual de la exposición y vive dentro de la propia app.

## Componentes

```
web/
├── app/
│   ├── page.tsx                   Reconocedor
│   ├── dashboard/page.tsx
│   ├── acerca/page.tsx
│   └── api/
│       ├── predicciones/route.ts  POST registra · GET lista
│       └── retroalimentacion/route.ts
├── components/
│   ├── ZonaDeCarga.tsx            drag&drop + selector + pegar
│   ├── CapturaCamara.tsx          getUserMedia + captura a canvas
│   ├── LienzoDibujo.tsx           pointer events, grosor y borrar
│   ├── PanelResultado.tsx         número grande o rechazo
│   ├── BarrasConfianza.tsx        top 3 con Recharts
│   ├── PanelDepuracion.tsx        tensor 64×64 + cabezas
│   └── HistorialSesion.tsx
├── lib/
│   ├── labels.ts                  generado desde labels.py — NO editar a mano
│   ├── preprocess.ts              port exacto de preprocess.py
│   ├── inferencia.ts              carga el .onnx, ejecuta, aplica rechazo
│   └── db.ts                      cliente de Neon
└── public/models/                 maya_cnn.onnx + labels.json + thresholds.json
```

## Reglas técnicas

1. **La sesión de ONNX se crea una sola vez** y se reutiliza. Crearla por predicción agrega
   cientos de milisegundos y puede agotar la memoria.
2. **Precargar el modelo al abrir la página**, con un indicador de "preparando modelo…". Para
   cuando el docente cargue la primera imagen, ya debe estar listo.
3. **Nada bloquea la UI.** El preprocesamiento y la inferencia corren sin congelar la página
   (Web Worker si hace falta).
4. **Ninguna llamada de red en el camino crítico.** El registro en Neon va después de mostrar el
   resultado, en un `try/catch` silencioso.
5. **Respuesta en menos de 300 ms** desde que se suelta la imagen hasta que aparece el número.
6. **Modo presentación** (tecla `P`): oculta paneles secundarios y agranda el resultado, para que
   se lea desde el fondo del salón.
7. Formatos aceptados: `png`, `jpg`, `jpeg`, `webp`, `heic` si el navegador lo permite. Límite
   20 MB. Mensaje claro si el archivo no sirve, nunca una pantalla en blanco.
8. **Manejo de errores visible.** Si algo falla, el usuario ve un mensaje entendible, no una
   excepción en consola.

## Diseño

- Tipografía grande; el resultado en 96 px o más.
- Paleta sobria con un acento. Contraste AA como mínimo: el salón tiene proyector y mala luz.
- Modo claro y oscuro (el proyector suele verse mejor en claro — probarlo antes).
- Funciona en móvil: alguien puede terminar usando un celular para capturar.
- Sin animaciones largas. Una transición de 150 ms basta; nada que haga esperar al docente.

## Criterios de aceptación

- [ ] Las cuatro formas de entrada funcionan: archivo, drag and drop, cámara, lienzo
- [ ] Se puede hacer 20 predicciones seguidas sin recargar ni degradar el rendimiento
- [ ] El resultado se lee desde 5 metros
- [ ] El rechazo es visualmente inconfundible frente a un acierto
- [ ] Con el wifi apagado, todo sigue funcionando (probado de verdad, no asumido)
- [ ] Probado en el navegador y la laptop exactos que se usarán el sábado
- [ ] Sin errores en consola durante un recorrido completo
