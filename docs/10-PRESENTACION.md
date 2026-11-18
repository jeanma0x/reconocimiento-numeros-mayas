# 10 · Presentación

**30 minutos en total**, e incluyen exposición, preguntas del docente y sus pruebas de
reconocimiento. Agotado el tiempo, se da por finalizada la participación.

## Reparto del tiempo

| Bloque | Minutos | Quién |
|---|---:|---|
| Exposición | 14 | Todos, rotando |
| Demostración funcional | 4 | R3 |
| Pruebas del docente | ~6 | R1 opera, no toca nada más |
| Preguntas | ~6 | El docente elige quién responde |

**Ensayar para 14 minutos de exposición, no para 20.** Pasarse de tiempo significa que las
preguntas y las pruebas quedan apretadas, y entre las dos valen el 40% de la nota.

## Estructura

| # | Diapositiva | Qué se dice | Quién |
|---|---|---|---|
| 1 | Portada | Título, integrantes, curso | R5 |
| 2 | El problema | Reconocer 1–19 y rechazar todo lo demás. La tabla barras/puntos: el sistema maya es `5·barras + puntos` | R5 |
| 3 | Por qué no es trivial | Un 13 y un 14 difieren en un punto. Trazo a mano, fondos, luz, perspectiva | R5 |
| 4 | Arquitectura | El diagrama de anillos. **Modelo en el navegador: funciona sin internet** | R4 |
| 5 | Dataset | Las tres fuentes. Ejemplos sintéticos y reales lado a lado | R2 |
| 6 | Los negativos | Grilla de `casi_valido`. **Es la diapositiva que distingue el proyecto**: muestra que pensamos la frontera del rechazo, no solo las clases | R2 |
| 7 | Splits honestos | Agrupación por semilla y por toma; prueba = una mano nunca vista | R2 |
| 8 | Preprocesamiento | Los pasos, con una foto real atravesándolos. Por qué no servía quedarse con el contorno más grande | R1 |
| 9 | La red | El diagrama de capas, el conteo de parámetros, las tres cabezas y por qué | R1 |
| 10 | Entrenamiento | Dos etapas, curvas de pérdida, early stopping | R1 |
| 11 | Rechazo | Las cuatro capas y la curva de utilidad contra el umbral | R1 |
| 12 | Resultados | Exactitud global, **exactitud en fotos reales de mano desconocida**, matriz de confusión | R5 |
| 13 | Comparación | CNN propia contra transfer learning: exactitud, tamaño, latencia. Cuál elegimos y por qué | R1 |
| 14 | Análisis de errores | El caso elegido, la causa, la corrección y el antes/después medido | R5 |
| 15 | Limitaciones | Honestas y concretas. Qué haríamos con más tiempo | R5 |
| 16 | **Demo** | En vivo | R3 |

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

Todos hablan. No porque quede bonito, sino porque el docente elige quién responde cada pregunta:
si alguien no abrió la boca en 14 minutos, es a quien le va a preguntar. Rotar cada 2 o 3
diapositivas y que cada quien exponga **la parte que no construyó**, que es exactamente el
ejercicio que hay que hacer el viernes.
