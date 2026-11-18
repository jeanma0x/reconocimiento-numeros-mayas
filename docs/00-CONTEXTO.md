# 00 · Contexto: qué nos piden y cómo nos califican

Fuente: `Proyecto 02 - Reconocimiento de números mayas con redes neuronales convolucionales.pdf`
Curso: Inteligencia Artificial · UVG Campus Sur · 2026, II · Docente: Carlos Valdez (cjvaldez@uvg.edu.gt)

## Datos duros

| | |
|---|---|
| **Presentación** | sábado 21 de noviembre de 2026, presencial |
| **Horario** | 07:00 a 09:15 |
| **Salón** | Biblioteca |
| **Modalidad** | en grupos (los del inicio del semestre) |
| **Ponderación** | 30 puntos |
| **Tiempo por grupo** | 30 minutos máximo (exposición + preguntas + pruebas) |
| **Entrega escrita** | no se requiere; sí una presentación bien estructurada con material visual |

## Objetivo

Desarrollar un software que, con redes neuronales convolucionales, reconozca números mayas
del **1 al 19** a partir de una imagen cargada por el usuario, e indique cuándo la imagen
**no corresponde** a un número maya válido en ese rango.

## Componentes exigidos

1. **Dataset.** Construir o recopilar imágenes, organizadas y etiquetadas, preferiblemente por
   carpetas que identifiquen cada clase. Se recomienda incluir imágenes que **no** sean números
   mayas del 1 al 19 para poder implementar y evaluar el rechazo. Fuentes libres: dibujos a mano,
   fotografías, imágenes generadas por software o por IA generativa, recursos de internet.
   Se recomienda variar tamaños, colores, fondos, grosores de trazo e iluminación.
2. **Modelo.** Implementar o adaptar una CNN. Herramientas, librerías y arquitectura a elección.
   Transfer learning permitido. Hay que **explicar las decisiones técnicas**: arquitectura,
   preparación de imágenes, proceso de entrenamiento y mecanismos de mejora.
3. **Reconocimiento y rechazo.**
   - Reconocer números mayas del 1 al 19 y mostrar claramente el número identificado.
   - Rechazar el cero maya y números mayas superiores a 19.
   - Rechazar otros sistemas de numeración, objetos, personas, paisajes, dibujos, etc.
   - Permitir varios reconocimientos consecutivos.
   - Cada imagen válida contiene una sola representación. Varias simultáneas quedan fuera de alcance.
   - La estrategia de rechazo es libre: clases adicionales, umbrales de confianza u otros mecanismos.
4. **Interfaz gráfica** amigable, intuitiva y estéticamente agradable. Mínimo:
   - Cargar imágenes con selector de archivos o drag and drop.
   - Visualizar la imagen cargada.
   - Mostrar claramente el resultado o el mensaje de rechazo.
   - Hacer nuevas pruebas sin reiniciar el programa.
   - Diseño libre; se valora la creatividad y la experiencia de usuario.
5. **Evaluación del modelo.** Pruebas con imágenes distintas a las de entrenamiento. Presentar
   exactitud, matrices de confusión y resultados con imágenes válidas y no válidas. Identificar
   **al menos un caso de error**, explicar causas posibles y describir qué se hizo para corregirlo.
6. **Presentación.** Explicar proceso, decisiones técnicas, resultados y conclusiones, con demo
   funcional. El docente probará con imágenes nuevas: digitales, fotografías **o dibujos hechos a
   mano durante la presentación**.

## Restricciones

- Solo del 1 al 19. El cero y los superiores a 19 se rechazan.
- Transfer learning permitido **siempre que se adapte mediante entrenamiento**.
- **Prohibido** resolver el reconocimiento solo con reglas programadas manualmente.
- **Prohibido** delegar la clasificación a un LLM o a un servicio externo que reconozca
  directamente sin entrenar o adaptar un modelo neuronal.
- Dividir en entrenamiento, validación y prueba, sin que una misma imagen **ni variantes
  derivadas de ella** aparezcan en conjuntos distintos.
- Se recomienda usar IA generativa como apoyo al desarrollo y a la creación de recursos.
- Interfaz gráfica obligatoria: incumplirla **resta 5 puntos**.
- Hay que tener disponibles las evidencias de entrenamiento y evaluación, y el código.
- Durante las pruebas del docente: **no se modifica código, no se reentrena, no se ajusta nada**.
- Las pruebas de reconocimiento y rechazo se califican **de forma binaria**: todo o nada. No hay
  puntos parciales.
- Se recomienda un proceso riguroso de QA antes de la presentación.
- El docente elige **qué estudiante responde cada pregunta**: todos deben conocer todo el trabajo.
- Puntualidad obligatoria: llegar tarde resta **5 puntos individuales**, sin importar el motivo.
- No asistir a la presentación = **0 puntos**.

## Rúbrica

| Criterio | Peso |
|---|---:|
| 1. Construcción del dataset, implementación y evaluación del modelo | 10% |
| 2. Análisis de errores y limitaciones | 5% |
| 3. Calidad de la exposición y del material de apoyo | 5% |
| 4.1 Reconocer imagen de número maya 1–19 dada por el docente | 10% |
| 4.2 Reconocer imagen de número maya 1–19 dada por el docente | 10% |
| 4.3 Reconocer imagen de número maya 1–19 dada por el docente | 10% |
| 4.4 Reconocer imagen de número maya 1–19 dada por el docente | 10% |
| 5.1 Rechazar imagen no válida dada por el docente | 5% |
| 5.2 Rechazar imagen no válida dada por el docente | 5% |
| 6. Respuestas a tres preguntas del docente | 30% |

Para los criterios 4 y 5 la rúbrica solo tiene dos columnas: **Excelente** o **Deficiente**.
No existe "Bueno" ni "Regular". Es acierto o cero.

## Lectura estratégica de la rúbrica

Esto es lo que debe guiar cada decisión del proyecto:

1. **El 50% de la nota se juega en vivo, en binario.** Cuatro reconocimientos (40%) y dos
   rechazos (10%) sobre imágenes que nunca hemos visto, posiblemente dibujadas a mano frente a
   nosotros. Ninguna métrica de validación vale si el modelo falla con el marcador del docente.
   → **Prioridad absoluta: robustez ante fotos y dibujos reales, no exactitud en el set de prueba.**

2. **Las preguntas valen 30%, más que todo el desarrollo documentado junto (20%).** Y las
   responde quien el docente señale. → El banco de preguntas (`09-PREGUNTAS-DOCENTE.md`) y el
   repaso en grupo no son el cierre del proyecto: son la mitad del esfuerzo de los últimos dos días.

3. **Reconocer vale el doble que rechazar** (10% vs 5% por ítem, y son 4 contra 2). Un falso
   rechazo cuesta 10 puntos porcentuales; un falso positivo cuesta 5. → **Los umbrales de rechazo
   se calibran sesgados a aceptar.** Ante la duda, el sistema arriesga un número antes que negarse.
   Esta decisión está registrada en `DECISIONES.md` (ADR-006).

4. **El dataset y el modelo "solo" valen 10%.** Perseguir un 99.8% de exactitud en validación es
   mal uso del tiempo. Ese 10% se asegura con un proceso bien documentado, no con décimas.

5. **La interfaz no suma, pero resta 5 puntos si falla.** Es un requisito de aprobación, no un
   diferenciador. Debe ser sólida y agradable, y no hay que gastar el viernes en animaciones.
