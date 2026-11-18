# 02 · Lenguajes y librerías

Dos lenguajes, una frontera clara: **Python entrena, TypeScript ejecuta.** ONNX es el contrato
entre los dos.

## Resumen

| Capa | Tecnología | Versión objetivo | Por qué |
|---|---|---|---|
| Entrenamiento | **Python** | 3.10+ | Es lo que corre en Colab con GPU y lo que usa el notebook de referencia del curso |
| Deep learning | **PyTorch** + torchvision | 2.x | El notebook del instructor (`CNN_como_ve_una_maquina.ipynb`) es PyTorch. Hablar el mismo idioma que el docente ayuda en las preguntas |
| Visión / imagen | **OpenCV** (`opencv-python`) + **Pillow** | 4.x / 10.x | Preprocesamiento, umbral adaptativo, componentes conexas, y generación del dataset sintético |
| Numérico | **NumPy** | 1.26+ | Base de todo |
| Métricas | **scikit-learn** | 1.4+ | Matriz de confusión, classification report, curvas |
| Gráficas | **Matplotlib** | 3.8+ | Figuras para la presentación |
| Configuración | **PyYAML** | 6.x | Hiperparámetros fuera del código |
| Barras de progreso | **tqdm** | 4.x | |
| Export | **onnx**, **onnxruntime**, **onnxscript** | últimas | Exportar y verificar que el ONNX da lo mismo que PyTorch |
| Tests | **pytest** | 8.x | Test de paridad de preprocesamiento, principalmente |
| | | | |
| Interfaz | **TypeScript** | 5.x | Tipado estricto en el contrato con el modelo. Un `number[]` mal ordenado es el bug más caro posible |
| Framework | **Next.js** (App Router) | 15.x | Despliegue en Vercel sin fricción; estáticos + Route Handlers en el mismo proyecto |
| UI | **React** 19 + **Tailwind CSS** 4 + **shadcn/ui** | | Componentes accesibles y buen aspecto sin perder días en CSS. La interfaz resta 5 puntos si falla, pero no suma por ser bonita |
| Inferencia | **onnxruntime-web** | 1.x | Corre el `.onnx` en el navegador con WASM + SIMD. Sin servidor, sin latencia, sin internet |
| Base de datos | **Neon** (Postgres serverless) + `@neondatabase/serverless` | | Driver HTTP: funciona en funciones serverless, donde un pool TCP normal no |
| Almacenamiento | **Vercel Blob** | | Guardar imágenes que el usuario autorice donar al dataset |
| Hosting | **Vercel** | | Integración directa con GitHub, previews por rama, CDN para el `.onnx` |
| Gráficas web | **Recharts** | 2.x | Barras de confianza y dashboard |

## Decisiones que vale la pena justificar

### PyTorch y no TensorFlow/Keras

El notebook de referencia que nos compartió el instructor está escrito en PyTorch. Usar lo mismo
significa que cada concepto que preguntó en clase tiene una correspondencia directa con nuestro
código, y que podemos explicar nuestras decisiones con su mismo vocabulario. En las preguntas
(30% de la nota) eso importa más que cualquier preferencia técnica.

### ONNX Runtime Web y no un backend de Python

| | ONNX en el navegador | API de Python |
|---|---|---|
| Funciona sin internet | ✅ | ❌ |
| Latencia | ~20–60 ms | 200 ms a varios segundos con cold start |
| Costo | 0 | servidor siempre encendido o cold starts |
| Riesgo el día de la demo | descarga del modelo una vez | wifi, cold start, cuota, caída del proveedor |
| Riesgo de desarrollo | **hay que portar el preprocesamiento a TS** | ninguno |

El único costo real es portar el preprocesamiento. Ese costo se paga una vez y se blinda con un
test automatizado de paridad. A cambio, el escenario catastrófico del sábado (no hay wifi, el
servidor está dormido) desaparece. Es el trade-off correcto cuando la calificación es binaria.

Este riesgo está mitigado además por el diseño del preprocesamiento: la **versión 1 es
deliberadamente trivial** (gris → recorte → escalar → normalizar), justo para que portarla sea
mecánico. La versión 2, con umbral adaptativo y componentes conexas, solo entra si las métricas
la justifican. Ver `04-MODELO.md` y ADR-004.

### Next.js y no una SPA con Vite

Necesitamos Route Handlers para hablar con Neon sin exponer la cadena de conexión en el cliente.
Next.js da eso, el frontend y el despliegue en una sola pieza. Con Vite habría que montar un
backend aparte.

### CNN propia como modelo principal, transfer learning como comparación

No es una u otra: entrenamos **las dos** y elegimos por validación.

- **CNN propia** (~300 K parámetros): el `.onnx` pesa poco más de 1 MB, carga rápido en el
  navegador y la podemos explicar capa por capa en la presentación.
- **Transfer learning** (MobileNetV3-Small o ResNet-18 adaptada): más robusta ante fotos reales,
  pero 10–45 MB de descarga.

Tener la comparación medida es material directo para el criterio 1 de la rúbrica
("justifican las decisiones técnicas") y para las preguntas. Ver `04-MODELO.md`.

## Dónde se entrena

| Entorno | Para qué |
|---|---|
| **Google Colab con GPU** | Entrenamientos completos. Es gratis, tiene GPU y es el entorno que recomienda el instructor. El notebook de `ml/notebooks/` clona este repo y corre `maya.train` |
| **Máquina local** | Generación del dataset sintético, preprocesamiento, evaluación, export y toda la parte web. No necesita GPU |

Nada de código vive solo en Colab: el notebook únicamente orquesta. Todo lo que importa está en
`ml/src/maya/` y versionado.

## Versiones y reproducibilidad

- `ml/requirements.txt` fija las versiones mayores.
- `web/package-lock.json` se versiona. Nadie corre `npm update` sin avisar.
- Semilla fija (`SEED = 42`) en generación, splits y entrenamiento, registrada en cada corrida.
- Cada corrida escribe en `ml/runs/<id>/` su config, métricas y checkpoint. Ninguna cifra de la
  presentación sale de un lugar distinto.
