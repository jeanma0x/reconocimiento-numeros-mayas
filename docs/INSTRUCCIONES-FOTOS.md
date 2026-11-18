# Instrucciones para la captura de fotos

**Para: los cuatro integrantes. Tiempo: unos 30 minutos. Fecha límite: jueves 19 a mediodía.**

Esta es la tarea más importante que cada quien tiene que hacer con sus propias manos, y la
única que no se puede acelerar programando. Léela completa antes de empezar: si la hacés mal,
hay que repetirla.

## Por qué importa

El modelo aprende de ejemplos. El sábado el docente va a escribir números mayas **a mano**, con
su letra, con su marcador, en su hoja. Si el modelo solo vio trazos generados por computadora y
la letra de una persona, va a fallar. Cada mano distinta que entra al dataset es una forma más
de escribir que el modelo aprende a tolerar.

Son cuatro ítems de la rúbrica a 10% cada uno y se califican todo o nada. Estas fotos son,
literalmente, el 40% de la nota.

---

> 📄 **Guía visual con los 19 números dibujados y los 15 inválidos:**
> [`guia-visual-numeros-mayas.html`](guia-visual-numeros-mayas.html) — abrila en el navegador
> (o usá el enlace que circuló por el grupo). Se puede imprimir y se ve bien en el celular.

## Paso 0 · Cómo se escribe un número maya (leer sí o sí)

Dos símbolos: **el punto vale 1** y **la barra vale 5**.

- Las **barras** van abajo, horizontales, apiladas una sobre otra.
- Los **puntos** van arriba, en una fila.
- `valor = 5 × (número de barras) + (número de puntos)`

```
      13                    7                    15
    • • •                 • •
  ▬▬▬▬▬▬▬▬▬           ▬▬▬▬▬▬▬▬▬            ▬▬▬▬▬▬▬▬▬
  ▬▬▬▬▬▬▬▬▬                                ▬▬▬▬▬▬▬▬▬
                                           ▬▬▬▬▬▬▬▬▬
  2 barras + 3 puntos   1 barra + 2 puntos   3 barras + 0 puntos
```

**Tabla completa.** Escribilos en este orden, del 1 al 19:

| Nº | Puntos arriba | Barras abajo | | Nº | Puntos arriba | Barras abajo |
|---:|---:|---:|---|---:|---:|---:|
| 1 | 1 | 0 | | 11 | 1 | 2 |
| 2 | 2 | 0 | | 12 | 2 | 2 |
| 3 | 3 | 0 | | 13 | 3 | 2 |
| 4 | 4 | 0 | | 14 | 4 | 2 |
| 5 | 0 | 1 | | 15 | 0 | 3 |
| 6 | 1 | 1 | | 16 | 1 | 3 |
| 7 | 2 | 1 | | 17 | 2 | 3 |
| 8 | 3 | 1 | | 18 | 3 | 3 |
| 9 | 4 | 1 | | 19 | 4 | 3 |
| 10 | 0 | 2 | | | | |

**Errores que arruinan el dato:**

- ❌ Poner los puntos **abajo** de las barras. Eso es un caso inválido, no el número.
- ❌ Barras verticales. Siempre horizontales.
- ❌ Escribir el número arábigo (13, 7…) **en la misma hoja**. Si sale en la foto, envenena el
  dataset: los dígitos arábigos son una de las categorías que el modelo debe rechazar.
  Si querés anotarlo, **escribilo al reverso de la hoja**.
- ❌ Más de un número por hoja.

---

## Paso 1 · Escribir (unos 10 minutos)

Necesitás: hojas blancas, hojas de cuaderno, un **marcador grueso** y un **lapicero o lápiz**.

**Ronda A — marcador grueso.** Escribí los 19 números, uno por hoja (o un número por cuarto de
hoja, bien separados, y luego fotografiás cada uno por aparte). En orden del 1 al 19.

**Ronda B — lapicero o lápiz.** Los mismos 19, otra vez. Podés usar hojas de cuaderno acá.

> **Escribí con tu letra normal.** No te esfuerces en que quede bonito ni parejo. Trazo chueco,
> puntos de distinto tamaño, barras desiguales: todo eso es exactamente lo que necesitamos.
> Un dataset de números perfectos produce un modelo que solo reconoce números perfectos.

## Paso 2 · Fotografiar (unos 15 minutos)

**Una foto = un número.** Que no se vea ningún otro número en el encuadre.

El número debe ocupar entre la **mitad y tres cuartos** de la foto. Ni un puntito perdido en una
hoja enorme, ni tan pegado que se corten los bordes.

**Variá entre fotos** — esto es lo que hace útil al dataset:

| Qué variar | Cómo |
|---|---|
| Luz | unas con luz de día junto a la ventana, otras con el foco del cuarto, alguna con sombra encima |
| Ángulo | de frente, y algunas inclinadas 10–20° |
| Distancia | unas más cerca, otras más lejos |
| Fondo | hoja blanca, hoja de cuaderno rayada o cuadriculada, sobre una mesa de madera |

**Después de las dos rondas, repetí 12 números cualesquiera** con una combinación distinta de
luz y fondo. Son 12 fotos extra que cuestan dos minutos y valen mucho.

**Total hasta aquí: 50 fotos** (19 + 19 + 12).

## Paso 3 · Los "no válidos" (15 fotos)

El modelo también tiene que saber decir *"esto no es un número maya del 1 al 19"*. Para eso
necesita ver ejemplos. Escribí y fotografiá, **uno por foto**:

| # | Qué escribir | Por qué |
|---|---|---|
| 1 | El **cero maya**: el glifo de concha (un óvalo acostado con una curva adentro, como una concha) | El enunciado pide rechazarlo explícitamente |
| 2 | Otro cero maya, con tu propio estilo | |
| 3 | El **20**: un punto arriba y, bien separado abajo, el glifo de cero | Notación posicional, fuera de rango |
| 4 | El **25**: un punto arriba y una barra abajo, en dos bloques separados | idem |
| 5 | El **33** o cualquier otro mayor a 19 | idem |
| 6 | **5 puntos** en fila (sería una barra, no existe así) | Enseña la frontera |
| 7 | **6 puntos** en fila | idem |
| 8 | **4 barras** apiladas (sería 20) | idem |
| 9 | **5 barras** apiladas | idem |
| 10 | Un número con los **puntos abajo** de las barras | idem |
| 11 | Puntos y barras **dispersos**, sin estructura | idem |
| 12 | **Dos números mayas** en la misma hoja | Fuera de alcance: se rechaza |
| 13 | Un número **arábigo** cualquiera (7, 42…) | Otro sistema de numeración |
| 14 | Un **dibujo** cualquiera: una casita, una flor, un garabato | |
| 15 | Una **hoja en blanco** | El modelo no debe inventar nada |

Los del 6 al 11 son los más valiosos de todo el dataset: son los que le enseñan al modelo dónde
está la frontera. Sin ellos, aceptaría un 4-barras como si fuera un número válido.

## Paso 4 · Una mano extra (10 minutos, y vale doble)

**Conseguí una persona más** —alguien de tu casa, tu pareja, un amigo— y pedile que escriba los
19 números a mano, una sola ronda. Explicale con la tabla del Paso 0.

Somos solo cuatro. Con una persona extra cada uno, el modelo pasa de ver 4 letras distintas a
ver 8. Es la mejora más grande por minuto invertido de todo el proyecto, y además esas fotos nos
sirven para medir honestamente qué tan bien funciona con una mano desconocida — que es
exactamente la situación del sábado.

Anotá cómo se llama esa persona: sus fotos van en una carpeta aparte.

---

## Formato de las fotos

| | |
|---|---|
| ✅ **Sí** | Foto normal del celular, JPG o PNG. Enfocada. Como salga de la cámara. |
| ✅ **Sí** | Resolución original. No la reduzcas. |
| ✅ **Sí** | Que se vea un poco inclinada, con sombra o con el fondo del escritorio. Eso es bueno. |
| ❌ **No** | Filtros, modo retrato, modo belleza, blanco y negro, "mejorar foto". |
| ❌ **No** | Apps de escáner (CamScanner, Adobe Scan, el escáner de Notas). Dejan la imagen demasiado limpia y el modelo aprende algo que no va a ver el sábado. |
| ❌ **No** | PDF, capturas de pantalla, fotos de la pantalla de otro aparato. |
| ❌ **No** | Recortar ni editar a mano. |
| ❌ **No** | Varias fotos del mismo número que sean casi idénticas. Si varías algo, cuenta; si no, es relleno. |

## Cómo organizarlas y enviarlas

En la carpeta compartida de Drive hay una carpeta con tu nombre. Adentro ya están creadas:

```
<tu-nombre>/
├── maya_01/  maya_02/  …  maya_19/      ← una carpeta por número
├── no_valido/
│   ├── cero_maya/      (fotos 1 y 2 del Paso 3)
│   ├── mayor_19/       (fotos 3, 4 y 5)
│   ├── casi_valido/    (fotos 6 a 11)
│   ├── multiples/      (foto 12)
│   └── otros/          (fotos 13, 14 y 15)
└── extra_<nombre-de-la-persona>/
    └── maya_01/ … maya_19/
```

**Meté cada foto en la carpeta del número que le corresponde.** Eso es todo el etiquetado: no
hace falta renombrar ningún archivo. Si una foto queda en la carpeta equivocada, el modelo
aprende mal y nadie se da cuenta hasta el sábado — así que revisá antes de cerrar.

**El truco para que no se te enreden:** tomá las fotos en orden del 1 al 19, subilas todas de
una a Drive y después, desde la computadora con el mouse, arrastralas en orden a sus carpetas.
Es mucho más rápido que hacerlo desde el celular.

## Antes de dar por terminado

- [ ] 19 fotos con marcador grueso, una por número
- [ ] 19 fotos con lapicero o lápiz
- [ ] 12 fotos repetidas con luz o fondo distinto
- [ ] 15 fotos de "no válidos", en sus cinco subcarpetas
- [ ] 19 fotos de la persona extra, en su carpeta
- [ ] Ninguna foto tiene un número arábigo escrito al lado del número maya
- [ ] Ninguna foto tiene dos números mayas (salvo la que va en `multiples/`)
- [ ] Cada foto está en la carpeta de su número
- [ ] **Avisá en el grupo cuando termines**, para llevar la cuenta

**Son unas 65 fotos tuyas más 19 de la persona extra. Entre los cuatro: unas 336 imágenes de
8 manos distintas.** Con eso el modelo tiene con qué.
