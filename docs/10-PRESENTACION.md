# 10 · Presentación

**30 minutos en total**, e incluyen exposición, preguntas del docente y sus pruebas de
reconocimiento. Agotado el tiempo, se da por finalizada la participación.

## Reparto del tiempo

| Bloque | Minutos | Quién |
|---|---:|---|
| Exposición | 14 | Los cuatro, rotando |
| Demostración funcional | 4 | Imri |
| Pruebas del docente | ~6 | José Julián opera, nadie más toca la laptop |
| Preguntas | ~6 | El docente elige quién responde |

**Ensayar para 14 minutos de exposición, no para 20.** Pasarse de tiempo significa que las
preguntas y las pruebas quedan apretadas, y entre las dos valen el 40% de la nota.

## Estructura

| # | Diapositiva | Qué se dice | Quién |
|---|---|---|---|
| 1 | Portada | Título, integrantes, curso | Imri |
| 2 | El problema | Reconocer 1–19 y rechazar todo lo demás. La tabla barras/puntos: el sistema maya es `5·barras + puntos` | Imri |
| 3 | Por qué no es trivial | Un 13 y un 14 difieren en un punto. Trazo a mano, fondos, luz, perspectiva | Imri |
| 4 | Arquitectura | El diagrama de anillos. **Modelo en el navegador: funciona sin internet** | Jean Marco |
| 5 | Dataset | Las tres fuentes. Ejemplos sintéticos y reales lado a lado | Jorge Luis |
| 6 | Los negativos | Grilla de `casi_valido`. **Es la diapositiva que distingue el proyecto**: muestra que pensamos la frontera del rechazo, no solo las clases | Jorge Luis |
| 7 | Splits honestos | Agrupación por semilla y por toma; prueba = una mano nunca vista | Jorge Luis |
| 8 | Preprocesamiento | Los pasos, con una foto real atravesándolos. Por qué no servía quedarse con el contorno más grande | Jean Marco |
| 9 | La red | El diagrama de capas, el conteo de parámetros, las tres cabezas y por qué | José Julián |
| 10 | Entrenamiento | Dos etapas, curvas de pérdida, early stopping | José Julián |
| 11 | Rechazo | Las cuatro capas y la curva de utilidad contra el umbral | José Julián |
| 12 | Resultados | Exactitud global, **exactitud en fotos reales de mano desconocida**, matriz de confusión | Jorge Luis |
| 13 | Comparación | CNN propia contra transfer learning: exactitud, tamaño, latencia. Cuál elegimos y por qué | José Julián |
| 14 | Análisis de errores | El caso elegido, la causa, la corrección y el antes/después medido | Jean Marco |
| 15 | Limitaciones | Honestas y concretas. Qué haríamos con más tiempo | Jean Marco |
| 16 | **Demo** | En vivo | Imri |

## Guion de la demostración

Cuatro minutos, en este orden, sin improvisar:

1. **Un número fácil** desde archivo. Un 7, por ejemplo. Resultado grande en pantalla.
2. **Abrir el panel "cómo lo vio la red"**: el tensor de 64×64 y las cabezas de barras y puntos.
   Es el momento más convincente de toda la exposición, porque muestra el interior del modelo.
3. **Un número difícil** con la cámara o el lienzo. Un 19, que es el de más elementos.
4. **Un rechazo**: un cero maya o un 4-barras. Mostrar el mensaje y su motivo.
5. **Invitar al docente a probar.** Ofrecerle el marcador y la hoja, o el lienzo directamente.

**Ensayar esta secuencia completa al menos cinco veces el viernes**, con las imágenes exactas
que se van a usar, cargadas y listas.

## Reglas durante las pruebas del docente

- **No se toca el código, no se reentrena, no se ajusta nada.** Lo dice el enunciado.
- Opera una sola persona. Los demás no se acercan a la laptop.
- Si una predicción falla: no hay que justificarse ni pedir otra oportunidad. Se dice qué pasó
  con criterio técnico —"la confianza quedó debajo del umbral, probablemente por el grosor del
  trazo"— y se sigue. Entender el fallo demuestra dominio; excusarse, no. Y recordar que esa
  lucidez puede recuperarse en las preguntas, que valen más.
- Si el docente pide un dibujo a mano: usar el lienzo si es posible, que elimina la fotografía
  como fuente de error.

## Material de apoyo (criterio 3 de la rúbrica, 5%)

- Diapositivas limpias: una idea por lámina, letra grande, pocas palabras.
- **Todas las figuras salen de corridas reales.** Ningún número inventado ni de relleno.
- Las imágenes del dataset se ven bien proyectadas: contraste alto, nada minúsculo.
- La app abierta en otra pestaña, lista, con el modelo ya cargado.
- Respaldo: presentación en USB, en la nube y en una segunda laptop.

## Reparto de la voz

Cuatro diapositivas cada uno. No porque quede bonito, sino porque el docente elige quién
responde cada pregunta: si alguien no abrió la boca en 14 minutos, es a quien le va a preguntar.

El reparto de arriba está hecho a propósito para que **cada quien exponga al menos una parte que
no construyó**: Imri abre con el problema aunque hizo la interfaz, Jorge presenta los resultados
aunque hizo el dataset, Jean Marco explica el preprocesamiento y el análisis de errores. Es el
mismo ejercicio de la ronda de preguntas cruzadas del viernes, y es lo que hace que las
preguntas del docente —el 30% de la nota— no dependan de a quién señale.
