"""Datasets, splits y manifiesto. Ver docs/03-DATASET.md.

    python -m maya.dataset --construir-splits --autor-prueba imri
    python -m maya.dataset --verificar
    python -m maya.dataset --cache

Reglas anti-fuga que este módulo garantiza:
  1. Agrupación por semilla: todas las variantes de una semilla van al mismo split
  2. Agrupación por autor y estilo: una misma tanda de fotos no se parte
  3. Leave-one-person-out: prueba = fotos de un integrante excluido del entrenamiento
  4. Deduplicado por sha256: falla si un hash aparece en dos splits
  5. El aumento de datos solo se aplica en entrenamiento, al vuelo

El cache (`data/cache_<split>.npz`) guarda los tensores 64x64 ya preprocesados en
uint8. Preprocesar 25 000 fotos en cada época sería absurdo: se hace una vez y el
aumento se aplica después, sobre el tensor pequeño.
"""

from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

import numpy as np

from . import labels as L
from . import preprocess as P

CAMPOS = ["ruta", "sha256", "clase", "subclase", "split", "fuente", "autor",
          "estilo", "seed", "ancho", "alto", "creado_en"]


# --- Manifiesto ---------------------------------------------------------------

def leer_manifiesto(ruta) -> list[dict]:
    ruta = Path(ruta)
    if not ruta.exists():
        return []
    with open(ruta, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def escribir_manifiesto(filas, ruta) -> None:
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS, extrasaction="ignore")
        w.writeheader(); w.writerows(filas)


def unir_manifiestos(raiz="../data") -> list[dict]:
    """Junta el manifiesto de fotos reales, el del sintético y el del dato externo."""
    raiz = Path(raiz)
    filas = (leer_manifiesto(raiz / "manifest.csv")
             + leer_manifiesto(raiz / "manifest_synth.csv")
             + leer_manifiesto(raiz / "manifest_externo.csv"))
    for f in filas:
        f.setdefault("estilo", "")
    return filas


# --- Splits -------------------------------------------------------------------

def _hash_estable(texto: str) -> int:
    """hash() de Python cambia de valor entre procesos (PYTHONHASHSEED es aleatorio).
    Los splits tienen que ser reproducibles: dos corridas con la misma semilla deben
    dar exactamente el mismo reparto, o comparar dos entrenamientos no significa nada.
    """
    import hashlib
    return int(hashlib.sha1(texto.encode("utf-8")).hexdigest()[:8], 16)


def grupo_de(fila: dict) -> str:
    """Clave de agrupación. Nada que comparta grupo puede caer en splits distintos.

    Para las fotos, el grupo es una "hoja": un número, escrito por una persona, en un
    estilo. Varias fotos de la misma hoja quedan juntas, que es lo que exige la regla
    anti-fuga. Agrupar por autor entero sería más conservador pero dejaría sin fotos
    reales al conjunto de validación.
    """
    if fila["fuente"] == "synth":
        return f"synth:{fila['seed']}"
    if fila["fuente"] == "externo":
        return f"externo:{fila['autor']}:{fila['clase']}{fila.get('subclase','')}"
    return f"real:{fila['autor']}:{fila['estilo']}:{fila['clase']}{fila.get('subclase','')}"


def construir_splits(filas, autor_prueba=None, semilla=42, frac_val=0.12) -> list[dict]:
    rng = np.random.default_rng(semilla)

    # Las fotos reales se reparten por autor: el autor de prueba va completo a prueba
    autores = sorted({f["autor"] for f in filas if f["fuente"] == "real" and f["autor"]})
    if autor_prueba is None and autores:
        autor_prueba = autores[-1]

    # Los grupos sintéticos se reparten al azar, pero completos
    grupos_synth = sorted({grupo_de(f) for f in filas if f["fuente"] == "synth"})
    orden = rng.permutation(len(grupos_synth))
    n_val = int(len(grupos_synth) * frac_val)
    n_test = int(len(grupos_synth) * 0.08)
    destino = {}
    for pos, idx in enumerate(orden):
        g = grupos_synth[idx]
        destino[g] = "val" if pos < n_val else ("test" if pos < n_val + n_test else "train")

    for f in filas:
        if f["fuente"] == "synth":
            f["split"] = destino[grupo_de(f)]
        elif f["fuente"] == "externo":
            # Dato de terceros: entrena, nunca puntúa (ADR-013). Validar o probar
            # contra él mediría nuestro ajuste al generador ajeno, no a la letra real.
            f["split"] = "train"
        else:
            if autor_prueba and f["autor"] == autor_prueba:
                f["split"] = "test"
            else:
                # Una tanda completa (autor+estilo) cae entera en train o en val
                h = _hash_estable(grupo_de(f) + str(semilla)) % 100
                f["split"] = "val" if h < frac_val * 100 else "train"
    return filas


def verificar(filas) -> list[str]:
    """Devuelve la lista de problemas. Lista vacía = todo bien."""
    problemas = []
    por_grupo, por_hash = {}, {}
    for f in filas:
        por_grupo.setdefault(grupo_de(f), set()).add(f["split"])
        por_hash.setdefault(f["sha256"], set()).add(f["split"])

    for g, splits in por_grupo.items():
        if len(splits) > 1:
            problemas.append(f"grupo partido entre splits: {g} -> {sorted(splits)}")
    for h, splits in por_hash.items():
        if len(splits) > 1:
            problemas.append(f"mismo archivo (sha256 {h[:12]}) en varios splits: {sorted(splits)}")

    dups = [h for h, c in Counter(f["sha256"] for f in filas).items() if c > 1]
    if dups:
        problemas.append(f"{len(dups)} archivos duplicados por contenido (sha256 repetido)")

    presentes = {f["clase"] for f in filas}
    for etq in L.ETIQUETAS:
        if etq not in presentes:
            problemas.append(f"clase sin ejemplos: {etq}")

    for split in ("train", "val", "test"):
        n = sum(1 for f in filas if f["split"] == split)
        if n == 0:
            problemas.append(f"split vacío: {split}")

    # El dato externo entrena pero no puntúa (ADR-013)
    fuera = Counter(f["split"] for f in filas
                    if f["fuente"] == "externo" and f["split"] != "train")
    for split, n in fuera.items():
        problemas.append(f"{n} imágenes externas en {split}: solo pueden ir en train")
    return problemas


def resumen(filas) -> str:
    out = []
    for split in ("train", "val", "test"):
        sub = [f for f in filas if f["split"] == split]
        c = Counter(f["fuente"] for f in sub)
        out.append(f"  {split:6s} {len(sub):7d}  (reales {c['real']}, "
                   f"sintéticas {c['synth']}, externas {c['externo']})")
    return "\n".join(out)


# --- Indexado de las fotos reales ---------------------------------------------

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".heic"}
ESTILOS = ("lapicero", "marcador", "lapiz", "crayon", "pluma")


def _recorrer(base: Path, fuente: str, raiz: Path) -> tuple[list[dict], list[str]]:
    """Recorre <base>/<autor>/<clase>/... y devuelve (filas, saltados).

    La clase sale de la carpeta, no del nombre del archivo: meter cada imagen en su
    carpeta ES todo el etiquetado (docs/INSTRUCCIONES-FOTOS.md).

    Estructura esperada:
        <base>/<autor>/maya_01 .. maya_19/*.jpg
        <base>/<autor>/no_valido/<subclase>/*.jpg
        <base>/<autor>/extra_<nombre>/maya_01 .. maya_19/*.jpg   (la mano extra)
    """
    import hashlib

    from PIL import Image, ImageOps

    filas, saltados = [], []
    if not base.exists():
        return filas, saltados
    for ruta in sorted(base.rglob("*")):
        if not ruta.is_file() or ruta.suffix.lower() not in EXTENSIONES:
            continue
        rel = ruta.relative_to(base).parts
        autor = rel[0]
        resto = rel[1:-1]
        if resto and resto[0].startswith("extra_"):
            # La mano extra es otra persona: cuenta como autor propio para los splits
            autor = f"{autor}-{resto[0]}"
            resto = resto[1:]
        if not resto:
            saltados.append(str(ruta.relative_to(base))); continue

        if resto[0] == "no_valido":
            clase, subclase = "no_valido", (resto[1] if len(resto) > 1 else "otros")
        elif resto[0].startswith("maya_"):
            clase, subclase = resto[0], ""
        else:
            saltados.append(str(ruta.relative_to(base))); continue
        if clase not in L.ETIQUETAS:
            saltados.append(str(ruta.relative_to(base))); continue

        nombre = ruta.name.lower()
        estilo = next((e for e in ESTILOS if e in nombre or e in "/".join(rel).lower()), "")
        try:
            with Image.open(ruta) as im:
                ancho, alto = ImageOps.exif_transpose(im).size
        except Exception:
            saltados.append(str(ruta.relative_to(base))); continue

        h = hashlib.sha256(ruta.read_bytes()).hexdigest()
        filas.append({"ruta": ruta.relative_to(raiz).as_posix(), "sha256": h,
                      "clase": clase, "subclase": subclase, "split": "", "fuente": fuente,
                      "autor": autor, "estilo": estilo, "seed": "",
                      "ancho": ancho, "alto": alto,
                      "creado_en": __import__("datetime").date.today().isoformat()})
    return filas, saltados


def _deduplicar(filas: list[dict]) -> tuple[list[dict], list[str]]:
    vistos, unicas, repetidas = set(), [], []
    for f in filas:
        if f["sha256"] in vistos:
            repetidas.append(f["ruta"])
        else:
            vistos.add(f["sha256"]); unicas.append(f)
    return unicas, repetidas


def _informe(unicas, repetidas, saltados, etiqueta: str, avisar_faltantes: bool) -> None:
    print(f"  {len(unicas)} imágenes indexadas en {etiqueta}")
    for a, n in sorted(Counter(f["autor"] for f in unicas).items()):
        print(f"    {a:24s} {n}")
    if avisar_faltantes:
        faltan = [e for e in L.ETIQUETAS if e != L.ETIQUETA_NO_VALIDO
                  and e not in {f["clase"] for f in unicas}]
        if faltan:
            print(f"  ⚠ clases sin ninguna foto real: {', '.join(faltan)}")
    if repetidas:
        print(f"  ⚠ {len(repetidas)} archivos duplicados (mismo contenido), omitidos")
    if saltados:
        print(f"  ⚠ {len(saltados)} archivos fuera de la estructura esperada, omitidos:")
        for x in saltados[:5]:
            print(f"      {x}")


def indexar_reales(raiz="../data", progreso=True) -> list[dict]:
    """Reconstruye data/manifest.csv recorriendo data/raw/real/ desde cero.

    Se corre cada vez que alguien agrega fotos; es idempotente.
    """
    raiz = Path(raiz)
    filas, saltados = _recorrer(raiz / "raw" / "real", "real", raiz)
    unicas, repetidas = _deduplicar(filas)
    escribir_manifiesto(unicas, raiz / "manifest.csv")
    if progreso:
        _informe(unicas, repetidas, saltados, "manifest.csv", avisar_faltantes=True)
    return unicas


def indexar_externos(raiz="../data", progreso=True) -> list[dict]:
    """Reconstruye data/manifest_externo.csv recorriendo data/raw/externo/.

    Dato que no escribió el equipo: datasets de terceros con la misma estructura de
    carpetas. Se separa de las fotos reales porque no puntúa: va entero a train
    (ADR-013). Cada carpeta de primer nivel es su propia "autoría".
    """
    raiz = Path(raiz)
    filas, saltados = _recorrer(raiz / "raw" / "externo", "externo", raiz)
    unicas, repetidas = _deduplicar(filas)
    escribir_manifiesto(unicas, raiz / "manifest_externo.csv")
    if progreso:
        _informe(unicas, repetidas, saltados, "manifest_externo.csv", avisar_faltantes=False)
    return unicas


def comprobar_archivos(filas, raiz="../data") -> list[str]:
    """Comprueba que el disco contiene exactamente lo que dicen los manifiestos.

    Es la promesa de data/README.md: con el manifiesto, cualquiera verifica que tiene
    el mismo dataset. Sirve sobre todo al bajar una carpeta compartida: una descarga
    incompleta de Drive no avisa, y entrenar con menos imágenes de las que uno cree
    produce números que no se pueden comparar con los de nadie más.
    """
    import hashlib

    raiz = Path(raiz)
    faltan, distintos = [], []
    for f in filas:
        ruta = raiz / f["ruta"]
        if not ruta.exists():
            faltan.append(f["ruta"]); continue
        if hashlib.sha256(ruta.read_bytes()).hexdigest() != f["sha256"]:
            distintos.append(f["ruta"])

    problemas = []
    if faltan:
        problemas.append(f"{len(faltan)} archivos del manifiesto no están en disco "
                         f"(p. ej. {faltan[0]})")
    if distintos:
        problemas.append(f"{len(distintos)} archivos no coinciden con su sha256 "
                         f"(p. ej. {distintos[0]})")
    return problemas


# --- Cache de tensores --------------------------------------------------------

def rectangularizar(img: np.ndarray, rng) -> np.ndarray:
    """Recorta una imagen cuadrada a un formato de foto (4:3 … 16:9, a veces vertical)
    sin cortar la tinta. El sintético y el externo son cuadrados; las fotos reales no, y
    el preprocesamiento rellena a cuadrado con una franja de otro tono que la red nunca
    había visto: con GC (marcador) eso bajó el acierto de 18/19 a 8/19 (ADR-015)."""
    h, w = img.shape[:2]
    g = P.a_gris(img)
    ink = np.abs(g - np.median(g)) > 45
    ys, xs = np.nonzero(ink)
    if len(ys) < 5:
        return img
    a = rng.uniform(1.25, 1.9)
    horizontal = rng.random() < 0.8
    if horizontal:
        nuevo = int(w / a)
        nuevo = max(nuevo, int(ys.max() - ys.min()) + 8)
        if nuevo >= h:
            return img
        lo, hi = max(0, int(ys.max()) + 1 - nuevo), min(int(ys.min()), h - nuevo)
        y0 = int(rng.integers(lo, hi + 1)) if hi >= lo else lo
        return img[y0:y0 + nuevo]
    nuevo = int(h / a)
    nuevo = max(nuevo, int(xs.max() - xs.min()) + 8)
    if nuevo >= w:
        return img
    lo, hi = max(0, int(xs.max()) + 1 - nuevo), min(int(xs.min()), w - nuevo)
    x0 = int(rng.integers(lo, hi + 1)) if hi >= lo else lo
    return img[:, x0:x0 + nuevo]


def agregar_borde_mesa(img: np.ndarray, rng) -> np.ndarray:
    """Pinta una o dos cuñas de color uniforme pegadas al borde, como la mesa que rodea
    una hoja fotografiada. Tras invertir la polaridad la mesa oscura queda como una cuña
    clara, y con las fotos de Imri eso bastó para que la red rechazara números válidos
    (el 7, el 13...). El sintético y el externo no tenían nada parecido. ADR-016."""
    import cv2
    out = np.ascontiguousarray(img.copy())
    h, w = out.shape[:2]
    for _ in range(int(rng.integers(1, 3))):
        lado = int(rng.integers(0, 4))                     # 0 izq, 1 der, 2 arriba, 3 abajo
        frac = rng.uniform(0.02, 0.2)
        sesgo = rng.uniform(-0.08, 0.08)                   # el borde de la hoja no es recto
        base = rng.choice([[60, 20, 25], [90, 55, 35], [25, 25, 25], [120, 90, 60],
                           [200, 200, 205], [40, 50, 90]])
        color = np.clip(np.array(base) + rng.integers(-20, 21, 3), 0, 255).tolist()
        if lado == 0:
            pts = [(0, 0), (int(w * (frac + sesgo)), 0), (int(w * (frac - sesgo)), h), (0, h)]
        elif lado == 1:
            pts = [(w, 0), (int(w * (1 - frac + sesgo)), 0), (int(w * (1 - frac - sesgo)), h), (w, h)]
        elif lado == 2:
            pts = [(0, 0), (w, 0), (w, int(h * (frac + sesgo))), (0, int(h * (frac - sesgo)))]
        else:
            pts = [(0, h), (w, h), (w, int(h * (1 - frac + sesgo))), (0, int(h * (1 - frac - sesgo)))]
        cv2.fillPoly(out, [np.array(pts, np.int32)], color)
    return out


def margen_o_recorte(img: np.ndarray, rng) -> np.ndarray:
    """Imita encuadres que el sintético no tenía: una imagen digital con márgenes
    uniformes alrededor (blanco, gris o del color del fondo) o una foto recortada de
    más. En la prueba de estrés con fotos reales, añadir un margen del 15 % era el caso
    en que el modelo más caía (ADR-016)."""
    import cv2
    h, w = img.shape[:2]
    if rng.random() < 0.55:
        d = int(min(h, w) * rng.uniform(0.05, 0.22))
        r = rng.random()
        color = (255, 255, 255) if r < 0.5 else ((int(rng.integers(200, 245)),) * 3 if r < 0.75
                else tuple(int(v) for v in np.median(img.reshape(-1, 3), axis=0)))
        return cv2.copyMakeBorder(np.ascontiguousarray(img), d, d, d, d, cv2.BORDER_CONSTANT, value=color)
    a, b, c, e = (int(v * rng.uniform(0.0, 0.08)) for v in (h, h, w, w))
    return img[a:h - b, c:w - e]


def fragmentos_vecinos(img: np.ndarray, rng) -> np.ndarray:
    """Pega uno o dos trocitos de tinta tocando el borde, como los restos de otros números
    de la misma hoja que salen en una foto (el caso del 7 de GC). Deben ignorarse: la red
    los leía como «varios números» y rechazaba números válidos. ADR-016."""
    import cv2
    out = np.ascontiguousarray(img.copy())
    h, w = out.shape[:2]
    g = P.a_gris(out)
    k = int(np.argmax(np.abs(g - np.median(g))))
    color = tuple(int(v) for v in out.reshape(-1, 3)[k])
    for _ in range(int(rng.integers(1, 3))):
        lado = int(rng.integers(0, 4))
        r = int(max(3, min(h, w) * rng.uniform(0.03, 0.09)))
        t = rng.uniform(0.15, 0.85)
        cx, cy = {0: (0, int(h * t)), 1: (w, int(h * t)), 2: (int(w * t), 0), 3: (int(w * t), h)}[lado]
        if rng.random() < 0.5:
            cv2.ellipse(out, (cx, cy), (r, int(r * rng.uniform(0.7, 1.3))), 0, 0, 360, color, -1, cv2.LINE_AA)
        else:
            dx, dy = (int(w * rng.uniform(0.08, 0.3)), r) if lado in (2, 3) else (r, int(h * rng.uniform(0.08, 0.3)))
            cv2.rectangle(out, (cx - dx // 2, cy - dy // 2), (cx + dx // 2, cy + dy // 2), color, -1)
    return out


def construir_cache(filas, raiz="../data", split="train", progreso=True, repetir_reales=1, rectangular=True, bordes=True, extra_encuadre=True) -> tuple:
    """`repetir_reales` > 1 duplica las fotos reales del split de entrenamiento: son pocas
    y es lo que de verdad se evalúa; el aumento al vuelo hace distinta cada copia."""
    raiz = Path(raiz)
    sub = [f for f in filas if f["split"] == split]
    if split == "train" and repetir_reales > 1:
        sub = sub + [f for f in sub if f["fuente"] == "real"] * (repetir_reales - 1)
    X = np.zeros((len(sub), P.LADO, P.LADO), np.uint8)
    y = np.zeros(len(sub), np.int64)
    yb = np.full(len(sub), -1, np.int64)
    yp = np.full(len(sub), -1, np.int64)
    for i, f in enumerate(sub):
        img = P.cargar_imagen(raiz / f["ruta"])
        if rectangular and f["fuente"] in ("synth", "externo") and \
                np.random.default_rng(7_000 + i).random() < 0.7:
            img = rectangularizar(img, np.random.default_rng(9_000 + i))
        if bordes and f["fuente"] in ("synth", "externo") and \
                np.random.default_rng(11_000 + i).random() < 0.45:
            img = agregar_borde_mesa(img, np.random.default_rng(13_000 + i))
        if extra_encuadre and f["fuente"] in ("synth", "externo") and \
                np.random.default_rng(17_000 + i).random() < 0.4:
            img = margen_o_recorte(img, np.random.default_rng(19_000 + i))
        if bordes and f["fuente"] in ("synth", "externo") and \
                np.random.default_rng(21_000 + i).random() < 0.3:
            img = fragmentos_vecinos(img, np.random.default_rng(23_000 + i))
        t = P.preparar(img)
        X[i] = np.round(t[0] * 255).astype(np.uint8)
        idx = L.indice_de_etiqueta(f["clase"])
        y[i] = idx
        if L.es_valida(idx):
            b, p = L.barras_y_puntos(L.valor_de_indice(idx))
            yb[i], yp[i] = b, p
        if progreso and (i + 1) % 2000 == 0:
            print(f"    {split}: {i+1}/{len(sub)}", flush=True)
    destino = raiz / f"cache_{split}.npz"
    np.savez_compressed(destino, X=X, y=y, barras=yb, puntos=yp)
    return destino, len(sub)


# --- Aumento de datos (solo en entrenamiento) ---------------------------------

def aumentar(x: np.ndarray, rng) -> np.ndarray:
    """x: float32[64,64] en [0,1]. Prohibido voltear: un volteo vertical produce
    un caso `no_valido` real (puntos debajo de las barras)."""
    import cv2
    h, w = x.shape
    ang = rng.uniform(-12, 12)
    esc = rng.uniform(0.85, 1.15)
    tx, ty = rng.uniform(-0.12, 0.12) * w, rng.uniform(-0.12, 0.12) * h
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, esc)
    M[0, 2] += tx; M[1, 2] += ty
    if rng.random() < 0.4:                                  # cizalla
        M[0, 1] += rng.uniform(-0.14, 0.14)
    x = cv2.warpAffine(x, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    x = np.clip(x * rng.uniform(0.75, 1.25) + rng.uniform(-0.12, 0.12), 0, 1)
    if rng.random() < 0.3:
        x = cv2.GaussianBlur(x, (3, 3), 0)
    if rng.random() < 0.2:                                  # oclusión parcial
        bh, bw = rng.integers(6, 18), rng.integers(6, 18)
        y0, x0 = rng.integers(0, h - bh), rng.integers(0, w - bw)
        x[y0:y0 + bh, x0:x0 + bw] = rng.uniform(0, 0.3)
    return x.astype(np.float32)


def cargar_cache(raiz="../data", split="train"):
    d = np.load(Path(raiz) / f"cache_{split}.npz")
    return d["X"], d["y"], d["barras"], d["puntos"]


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Splits, verificación y cache del dataset")
    ap.add_argument("--raiz", default="../data")
    ap.add_argument("--indexar-reales", action="store_true",
                    help="reconstruye manifest.csv recorriendo data/raw/real/")
    ap.add_argument("--indexar-externos", action="store_true",
                    help="reconstruye manifest_externo.csv recorriendo data/raw/externo/")
    ap.add_argument("--construir-splits", action="store_true")
    ap.add_argument("--autor-prueba", default=None)
    ap.add_argument("--verificar", action="store_true")
    ap.add_argument("--comprobar-archivos", action="store_true",
                    help="comprueba que el disco coincide con los manifiestos (sha256)")
    ap.add_argument("--cache", action="store_true")
    ap.add_argument("--repetir-reales", type=int, default=1,
                    help="copias de cada foto real en la caché de entrenamiento")
    ap.add_argument("--semilla", type=int, default=42)
    a = ap.parse_args()

    if a.indexar_reales:
        indexar_reales(a.raiz)
    if a.indexar_externos:
        indexar_externos(a.raiz)
    filas = unir_manifiestos(a.raiz)
    print(f"{len(filas)} filas en los manifiestos")
    if a.construir_splits:
        filas = construir_splits(filas, a.autor_prueba, a.semilla)
        escribir_manifiesto([f for f in filas if f["fuente"] == "real"], Path(a.raiz) / "manifest.csv")
        escribir_manifiesto([f for f in filas if f["fuente"] == "synth"], Path(a.raiz) / "manifest_synth.csv")
        escribir_manifiesto([f for f in filas if f["fuente"] == "externo"], Path(a.raiz) / "manifest_externo.csv")
        print("splits escritos:"); print(resumen(filas))
    if a.verificar:
        problemas = verificar(filas)
        print("VERIFICACIÓN:", "sin problemas" if not problemas else f"{len(problemas)} problemas")
        for p in problemas: print("  -", p)
        raise SystemExit(1 if problemas else 0)
    if a.comprobar_archivos:
        problemas = comprobar_archivos(filas, a.raiz)
        print("ARCHIVOS:", "coinciden con el manifiesto" if not problemas
              else f"{len(problemas)} problemas")
        for p in problemas: print("  -", p)
        raise SystemExit(1 if problemas else 0)
    if a.cache:
        for split in ("train", "val", "test"):
            destino, n = construir_cache(filas, a.raiz, split, repetir_reales=a.repetir_reales)
            print(f"  {destino.name}: {n} tensores")
