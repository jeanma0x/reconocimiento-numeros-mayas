# 07 · Puntos a evaluar, métricas y QA

Este documento responde a una pregunta: **¿cómo sabemos que esto funciona antes de que lo sepa
el docente?**

## Parte A · Evaluación del modelo

### Métricas obligatorias (criterio 1 de la rúbrica)

| Métrica | Dónde se reporta | Meta |
|---|---|---|
| Exactitud global en prueba (20 clases) | `runs/<id>/metricas.json` | ≥ 93 % |
| **Exactitud solo en fotos reales de la persona excluida** | idem | **≥ 90 %** ← la que importa |
| Exactitud por clase (las 19) | tabla + gráfica de barras | ninguna clase < 80 % |
| Matriz de confusión 20×20 | figura PNG | diagonal dominante |
| Precisión / exhaustividad / F1 por clase | `classification_report` | |
| Tasa de rechazo correcto sobre no válidas | idem | ≥ 90 % |
| **Tasa de falso rechazo sobre válidas** | idem | **≤ 5 %** ← la más cara |
| Tamaño del `.onnx` | `metadata.json` | < 5 MB |
| Latencia de inferencia en el navegador | medida real | < 150 ms |

**La métrica que manda es la exactitud sobre fotos reales de una mano que el modelo nunca vio.**
Es lo más parecido al sábado. Un 99 % en sintético con un 70 % ahí significa que vamos a fallar.

### Desgloses que hay que tener listos

Porque son las preguntas evidentes del docente:

1. Exactitud **por número de barras** (0, 1, 2, 3) y **por número de puntos** (0–4). Revela si el
   problema es contar barras o contar puntos.
2. Exactitud **por subcategoría de rechazo**. ¿Rechaza bien el cero maya? ¿Y el 20? ¿Y un
   4-barras? Se reporta por separado, no agregado.
3. Exactitud **por fuente**: sintético contra real. La brecha entre ambos es la medida del
   *domain shift*, y hay que poder explicarla.
4. Exactitud **por autor** de las fotos. Si una letra específica se le dificulta, hay que saberlo.

### Figuras para la presentación

- Curvas de pérdida y exactitud (entrenamiento y validación) — demuestran que hubo early stopping
  y que no hay sobreajuste descontrolado.
- Matriz de confusión.
- Grilla de errores: imagen real, etiqueta verdadera, predicha, top-3.
- Curva de utilidad `U` contra el umbral `τ`, con el punto elegido marcado.
- Los kernels de la primera capa y un par de feature maps. Visualmente contundente y conecta
  directo con lo que vieron en clase.
- Comparación CNN propia contra transfer learning: exactitud, tamaño, latencia.

## Parte B · QA del software

### Pruebas automatizadas

| Prueba | Qué verifica |
|---|---|
| `test_labels.py` | Las 19 clases corresponden a los pares (barras, puntos) correctos; `labels.json` coincide con `labels.py` |
| `test_paridad_preproceso.py` | Python y TypeScript producen el mismo tensor (diff < 1e-4) en 200 imágenes |
| `test_export_onnx.py` | PyTorch y onnxruntime dan la misma salida (diff < 1e-5) y la misma etiqueta en 200 muestras |
| `test_dataset.py` | Ningún grupo partido entre splits; sin hashes repetidos; el manifiesto cuadra con el disco |
| `test_rechazo.py` | La política de rechazo respeta el orden R1→R4 y es determinista |

### Checklist manual — se corre completo el viernes

**Carga de imágenes**
- [ ] Selector de archivos
- [ ] Drag and drop
- [ ] Pegar con Ctrl+V
- [ ] Cámara (webcam y celular)
- [ ] Lienzo de dibujo
- [ ] Archivo que no es imagen → mensaje claro, no se rompe
- [ ] Archivo enorme (> 20 MB) → mensaje claro
- [ ] Foto vertical de celular → **no sale rotada** (EXIF)
- [ ] PNG con transparencia → no se vuelve negro

**Reconocimiento**
- [ ] Los 19 números, uno por uno, con fotos nuevas → correcto
- [ ] 20 predicciones seguidas sin recargar → sin degradación ni fuga de memoria
- [ ] Foto inclinada 15° → correcto
- [ ] Foto con poca luz → correcto
- [ ] Trazo muy grueso (marcador ancho) → correcto
- [ ] Trazo muy delgado (lapicero fino) → correcto
- [ ] Papel cuadriculado de fondo → las líneas no se leen como barras

**Rechazo**
- [ ] Cero maya → rechazado
- [ ] 20, 25, 33 en notación posicional → rechazados
- [ ] 5 puntos, 6 puntos → rechazados
- [ ] 4 barras → rechazado
- [ ] Puntos debajo de las barras → rechazado
- [ ] Dos números mayas en la misma imagen → rechazado
- [ ] Dígito arábigo, número romano → rechazados
- [ ] Objeto, rostro, paisaje → rechazados
- [ ] Hoja en blanco → rechazada
- [ ] Imagen completamente negra → rechazada

**Interfaz**
- [ ] El resultado se lee desde 5 metros
- [ ] Rechazo visualmente inconfundible frente a acierto
- [ ] Sin errores en consola
- [ ] Funciona en Chrome, Edge y Safari
- [ ] **Con el wifi apagado funciona todo**
- [ ] Responde en menos de 300 ms

### Simulacro — jueves por la noche y viernes

Esta es la prueba que de verdad predice la nota.

**Protocolo:**

1. Alguien ajeno al equipo (un compañero de otro grupo, un familiar) escribe **10 números mayas
   a mano** y **5 imágenes no válidas**, sin que nadie del equipo vea cómo las hace.
2. Se corren por la app, **sin tocar nada**, igual que el sábado.
3. Se anota cada resultado: acierto o fallo. **Sin puntos parciales**, igual que la rúbrica.
4. Meta: **15/15**. Por debajo de 13/15 hay que corregir antes de seguir.
5. Se repite con una persona distinta el viernes.

Las imágenes del simulacro **no entran al entrenamiento**. Si se usan para entrenar, el simulacro
deja de medir nada.

### Día de la presentación

- [ ] 05:45 — salir con tiempo. Llegar tarde resta **5 puntos individuales**, sin excepción
- [ ] Laptop cargada **y** cargador
- [ ] App abierta y modelo en caché **desde la noche anterior**
- [ ] Respaldo local corriendo en `localhost`
- [ ] Segunda laptop lista con lo mismo
- [ ] Marcador grueso y hojas blancas propias, por si el docente quiere dibujar
- [ ] Presentación abierta en otra pestaña **y** en USB **y** en la nube
- [ ] Adaptador HDMI / USB-C
- [ ] **Código congelado.** No se toca nada después del viernes por la noche
- [ ] Todos repasaron `09-PREGUNTAS-DOCENTE.md`

## Parte C · Definición de "listo para presentar"

El proyecto está listo cuando **todo** esto se cumple:

- [ ] Exactitud en fotos reales de una mano desconocida ≥ 90 %
- [ ] Falso rechazo sobre válidas ≤ 5 %
- [ ] Rechazo correcto sobre no válidas ≥ 90 %
- [ ] Dos simulacros con personas ajenas, ≥ 13/15 cada uno
- [ ] Checklist manual completo, sin fallos abiertos
- [ ] Todos los tests automatizados en verde
- [ ] Funciona sin internet, verificado
- [ ] Análisis de al menos un error, con corrección aplicada y medida
- [ ] Presentación ensayada completa en menos de 20 minutos (quedan 10 para preguntas y pruebas)
- [ ] Los cinco integrantes pueden explicar cualquier parte del proyecto
