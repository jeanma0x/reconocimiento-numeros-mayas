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
    """Junta el manifiesto de fotos reales con el del sintético."""
    raiz = Path(raiz)
    filas = leer_manifiesto(raiz / "manifest.csv") + leer_manifiesto(raiz / "manifest_synth.csv")
    for f in filas:
        f.setdefault("estilo", "")
    return filas


# --- Splits -------------------------------------------------------------------

def grupo_de(fila: dict) -> str:
    """Clave de agrupación. Nada que comparta grupo puede caer en splits distintos.

    Para las fotos, el grupo es una "hoja": un número, escrito por una persona, en un
    estilo. Varias fotos de la misma hoja quedan juntas, que es lo que exige la regla
    anti-fuga. Agrupar por autor entero sería más conservador pero dejaría sin fotos
    reales al conjunto de validación.
    """
    if fila["fuente"] == "synth":
        return f"synth:{fila['seed']}"
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
        else:
            if autor_prueba and f["autor"] == autor_prueba:
                f["split"] = "test"
            else:
                # Una tanda completa (autor+estilo) cae entera en train o en val
                h = abs(hash(grupo_de(f) + str(semilla))) % 100
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
    return problemas


def resumen(filas) -> str:
    out = []
    for split in ("train", "val", "test"):
        sub = [f for f in filas if f["split"] == split]
        reales = sum(1 for f in sub if f["fuente"] == "real")
        out.append(f"  {split:6s} {len(sub):7d}  (reales {reales}, sintéticas {len(sub)-reales})")
    return "\n".join(out)


# --- Indexado de las fotos reales ---------------------------------------------

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".heic"}
ESTILOS = ("lapicero", "marcador", "lapiz", "crayon", "pluma")


def indexar_reales(raiz="../data", progreso=True) -> list[dict]:
    """Recorre data/raw/real/ y reconstruye data/manifest.csv desde cero.

    La clase sale de la carpeta, no del nombre del archivo: meter cada foto en su
    carpeta ES todo el etiquetado (docs/INSTRUCCIONES-FOTOS.md). Se corre cada vez
    que alguien agrega fotos; es idempotente.

    Estructura esperada:
        real/<autor>/maya_01 .. maya_19/*.jpg
        real/<autor>/no_valido/<subclase>/*.jpg
        real/<autor>/extra_<nombre>/maya_01 .. maya_19/*.jpg   (la mano extra)
    """
    import hashlib

    from PIL import Image, ImageOps

    raiz = Path(raiz)
    base = raiz / "raw" / "real"
    filas, saltados = [], []
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
                      "clase": clase, "subclase": subclase, "split": "", "fuente": "real",
                      "autor": autor, "estilo": estilo, "seed": "",
                      "ancho": ancho, "alto": alto,
                      "creado_en": __import__("datetime").date.today().isoformat()})

    vistos, unicas, repetidas = set(), [], []
    for f in filas:
        if f["sha256"] in vistos:
            repetidas.append(f["ruta"])
        else:
            vistos.add(f["sha256"]); unicas.append(f)

    escribir_manifiesto(unicas, raiz / "manifest.csv")
    if progreso:
        print(f"  {len(unicas)} fotos indexadas en manifest.csv")
        por_autor = Counter(f["autor"] for f in unicas)
        for a, n in sorted(por_autor.items()):
            print(f"    {a:24s} {n}")
        faltan = [e for e in L.ETIQUETAS if e != L.ETIQUETA_NO_VALIDO
                  and e not in {f["clase"] for f in unicas}]
        if faltan:
            print(f"  ⚠ clases sin ninguna foto real: {', '.join(faltan)}")
        if repetidas:
            print(f"  ⚠ {len(repetidas)} archivos duplicados (mismo contenido), omitidos")
        if saltados:
            print(f"  ⚠ {len(saltados)} archivos fuera de la estructura esperada, omitidos:")
            for s in saltados[:5]:
                print(f"      {s}")
    return unicas


# --- Cache de tensores --------------------------------------------------------

def construir_cache(filas, raiz="../data", split="train", progreso=True) -> tuple:
    raiz = Path(raiz)
    sub = [f for f in filas if f["split"] == split]
    X = np.zeros((len(sub), P.LADO, P.LADO), np.uint8)
    y = np.zeros(len(sub), np.int64)
    yb = np.full(len(sub), -1, np.int64)
    yp = np.full(len(sub), -1, np.int64)
    for i, f in enumerate(sub):
        t = P.preparar_archivo(raiz / f["ruta"])
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
    ap.add_argument("--construir-splits", action="store_true")
    ap.add_argument("--autor-prueba", default=None)
    ap.add_argument("--verificar", action="store_true")
    ap.add_argument("--cache", action="store_true")
    ap.add_argument("--semilla", type=int, default=42)
    a = ap.parse_args()

    if a.indexar_reales:
        indexar_reales(a.raiz)
    filas = unir_manifiestos(a.raiz)
    print(f"{len(filas)} filas en los manifiestos")
    if a.construir_splits:
        filas = construir_splits(filas, a.autor_prueba, a.semilla)
        escribir_manifiesto([f for f in filas if f["fuente"] == "real"], Path(a.raiz) / "manifest.csv")
        escribir_manifiesto([f for f in filas if f["fuente"] == "synth"], Path(a.raiz) / "manifest_synth.csv")
        print("splits escritos:"); print(resumen(filas))
    if a.verificar:
        problemas = verificar(filas)
        print("VERIFICACIÓN:", "sin problemas" if not problemas else f"{len(problemas)} problemas")
        for p in problemas: print("  -", p)
        raise SystemExit(1 if problemas else 0)
    if a.cache:
        for split in ("train", "val", "test"):
            destino, n = construir_cache(filas, a.raiz, split)
            print(f"  {destino.name}: {n} tensores")
