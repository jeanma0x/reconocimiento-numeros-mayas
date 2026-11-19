"""Evaluación, métricas y análisis de errores. Ver docs/07-QA-Y-EVALUACION.md.

    python -m maya.evaluate --run runs/<id> [--split test]

La métrica que manda NO es la exactitud global, sino la exactitud sobre fotos reales
de la mano excluida del entrenamiento: es lo más parecido a lo que pasa el sábado.
Un 99% en sintético con un 70% ahí significa que vamos a fallar.

Produce en runs/<id>/: metricas.json, confusion.png, curvas.png, por_clase.png,
kernels.png y errores/ con TODAS las imágenes mal clasificadas (insumo del criterio 2).
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from . import dataset as D
from . import labels as L


def logits_de_split(run, raiz="../data", split="val"):
    """Pasa un split entero por el modelo guardado. Devuelve (clase, barras, puntos, y)."""
    import torch
    from .model import construir

    ck = torch.load(Path(run) / "mejor.pt", map_location="cpu", weights_only=False)
    cfg = ck["config"]
    modelo = construir(cfg["modelo"]["arquitectura"], dropout=cfg["modelo"]["dropout"])
    modelo.load_state_dict(ck["modelo"])
    modelo.eval()                      # imprescindible: cambia dropout y batchnorm

    X, y, _, _ = D.cargar_cache(raiz, split)
    lg, lb, lp = [], [], []
    with torch.no_grad():
        for i in range(0, len(X), 512):
            x = torch.from_numpy(X[i:i + 512].astype(np.float32)[:, None] / 255.0)
            c, b, p = modelo(x)
            lg.append(c.numpy()); lb.append(b.numpy()); lp.append(p.numpy())
    return np.concatenate(lg), np.concatenate(lb), np.concatenate(lp), y


def matriz_confusion(y_real, y_pred, n=L.NUM_CLASES):
    m = np.zeros((n, n), np.int64)
    for r, p in zip(y_real, y_pred):
        m[r, p] += 1
    return m


def metricas(y_real, y_pred, barras_pred=None, puntos_pred=None, fuentes=None, autores=None,
             subclases=None) -> dict:
    y_real, y_pred = np.asarray(y_real), np.asarray(y_pred)
    es_valida = y_real != L.INDICE_NO_VALIDO
    out = {
        "n": int(len(y_real)),
        "exactitud_global": float((y_pred == y_real).mean()),
        "exactitud_validas": float((y_pred[es_valida] == y_real[es_valida]).mean()) if es_valida.any() else None,
        "rechazo_correcto": float((y_pred[~es_valida] == L.INDICE_NO_VALIDO).mean()) if (~es_valida).any() else None,
        "falso_rechazo": float((y_pred[es_valida] == L.INDICE_NO_VALIDO).mean()) if es_valida.any() else None,
    }
    out["por_clase"] = {
        L.ETIQUETAS[c]: float((y_pred[y_real == c] == c).mean())
        for c in range(L.NUM_CLASES) if (y_real == c).any()
    }
    # Desgloses que el docente va a preguntar (docs/07)
    if barras_pred is not None:
        out["por_n_barras"] = {}
        for b in range(L.NUM_BARRAS):
            sel = np.array([es_valida[i] and L.barras_y_puntos(y_real[i] + 1)[0] == b
                            for i in range(len(y_real))])
            if sel.any():
                out["por_n_barras"][str(b)] = float((y_pred[sel] == y_real[sel]).mean())
        out["por_n_puntos"] = {}
        for p in range(L.NUM_PUNTOS):
            sel = np.array([es_valida[i] and L.barras_y_puntos(y_real[i] + 1)[1] == p
                            for i in range(len(y_real))])
            if sel.any():
                out["por_n_puntos"][str(p)] = float((y_pred[sel] == y_real[sel]).mean())
    for nombre, valores in (("por_fuente", fuentes), ("por_autor", autores),
                            ("por_subclase_rechazo", subclases)):
        if valores is not None:
            valores = np.asarray(valores)
            out[nombre] = {}
            for v in sorted(set(valores.tolist())):
                if not v:
                    continue
                sel = valores == v
                out[nombre][str(v)] = float((y_pred[sel] == y_real[sel]).mean())
    return out


def figuras(run, hist=None, matriz=None, por_clase=None, modelo=None):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    run = Path(run)

    if hist:
        fig, ax = plt.subplots(1, 2, figsize=(12, 4))
        ep = range(1, len(hist["train_loss"]) + 1)
        ax[0].plot(ep, hist["train_loss"], "o-", label="Entrenamiento")
        ax[0].plot(ep, hist["val_loss"], "o-", label="Validación")
        ax[0].set_title("Pérdida (más bajo es mejor)")
        ax[1].plot(ep, hist["train_acc"], "o-", label="Entrenamiento")
        ax[1].plot(ep, hist["val_acc"], "o-", label="Validación")
        ax[1].set_title("Exactitud (más alto es mejor)")
        for a in ax:
            a.set_xlabel("Época"); a.grid(alpha=.3); a.legend()
        fig.suptitle("Curvas de entrenamiento")
        fig.tight_layout(); fig.savefig(run / "curvas.png", dpi=130); plt.close(fig)

    if matriz is not None:
        fig, ax = plt.subplots(figsize=(9, 8))
        ax.imshow(np.log1p(matriz), cmap="Blues")
        for i in range(matriz.shape[0]):
            for j in range(matriz.shape[1]):
                if matriz[i, j]:
                    ax.text(j, i, int(matriz[i, j]), ha="center", va="center", fontsize=6,
                            color="white" if i == j else "black")
        ax.set_xticks(range(L.NUM_CLASES)); ax.set_yticks(range(L.NUM_CLASES))
        ax.set_xticklabels([e.replace("maya_", "") for e in L.ETIQUETAS], rotation=90, fontsize=7)
        ax.set_yticklabels([e.replace("maya_", "") for e in L.ETIQUETAS], fontsize=7)
        ax.set_xlabel("Predicción"); ax.set_ylabel("Real")
        ax.set_title("Matriz de confusión (la diagonal son los aciertos)")
        fig.tight_layout(); fig.savefig(run / "confusion.png", dpi=130); plt.close(fig)

    if por_clase:
        fig, ax = plt.subplots(figsize=(11, 4))
        nombres = list(por_clase); vals = [por_clase[n] for n in nombres]
        ax.bar(range(len(vals)), vals, color=["#1f7a4d" if v >= .8 else "#b42318" for v in vals])
        ax.set_xticks(range(len(vals)))
        ax.set_xticklabels([n.replace("maya_", "") for n in nombres], rotation=90, fontsize=8)
        ax.axhline(.8, ls="--", c="gray", lw=1); ax.set_ylim(0, 1)
        ax.set_title("Exactitud por clase (línea: meta del 80%)")
        fig.tight_layout(); fig.savefig(run / "por_clase.png", dpi=130); plt.close(fig)

    if modelo is not None:
        w = None
        for m in modelo.modules():
            import torch.nn as nn
            if isinstance(m, nn.Conv2d):
                w = m.weight.detach().cpu()[:, 0]; break
        if w is not None:
            n = min(24, len(w))
            fig, ax = plt.subplots(3, 8, figsize=(12, 4.5))
            for i, a in enumerate(ax.flat):
                if i < n:
                    a.imshow(w[i], cmap="RdBu_r"); a.set_title(f"k{i}", fontsize=8)
                a.axis("off")
            fig.suptitle("Kernels aprendidos por la primera capa")
            fig.tight_layout(); fig.savefig(run / "kernels.png", dpi=130); plt.close(fig)


def evaluar(run, raiz="../data", split="test") -> dict:
    run = Path(run)
    lg, lb, lp, y = logits_de_split(run, raiz, split)
    y_pred = lg.argmax(1)

    filas = [f for f in D.unir_manifiestos(raiz) if f["split"] == split]
    fuentes = [f["fuente"] for f in filas] if len(filas) == len(y) else None
    autores = [f["autor"] for f in filas] if len(filas) == len(y) else None
    subclases = [f["subclase"] for f in filas] if len(filas) == len(y) else None

    m = metricas(y, y_pred, lb.argmax(1), lp.argmax(1), fuentes, autores, subclases)
    m["split"] = split
    umbral = run / "thresholds.json"
    if umbral.exists():
        from .calibrate import _decisiones, softmax
        u = json.loads(umbral.read_text(encoding="utf-8"))
        valores, rechaza = _decisiones(softmax(lg, u["temperatura"]), lb.argmax(1), lp.argmax(1),
                                       u["tau"], u["margen"])
        es_valida = y != L.INDICE_NO_VALIDO
        m["con_politica_de_rechazo"] = {
            "acierto_en_validas": float(((~rechaza) & (valores == y + 1) & es_valida).sum() / max(1, es_valida.sum())),
            "falso_rechazo_en_validas": float((rechaza & es_valida).sum() / max(1, es_valida.sum())),
            "rechazo_en_no_validas": float((rechaza & ~es_valida).sum() / max(1, (~es_valida).sum())),
        }

    hist_p = run / "historial.json"
    hist = json.loads(hist_p.read_text(encoding="utf-8")) if hist_p.exists() else None
    figuras(run, hist, matriz_confusion(y, y_pred), m["por_clase"])
    (run / "metricas.json").write_text(json.dumps(m, indent=2, ensure_ascii=False), encoding="utf-8")

    # Todas las imágenes mal clasificadas, para el análisis de errores (criterio 2)
    err = run / "errores"; err.mkdir(exist_ok=True)
    malas = np.nonzero(y_pred != y)[0]
    if filas and len(filas) == len(y):
        reg = [{"ruta": filas[i]["ruta"], "real": L.ETIQUETAS[y[i]],
                "predicha": L.ETIQUETAS[y_pred[i]],
                "top3": [L.ETIQUETAS[j] for j in np.argsort(-lg[i])[:3]]} for i in malas]
        (err / "errores.json").write_text(json.dumps(reg, indent=2, ensure_ascii=False), encoding="utf-8")
    m["n_errores"] = int(len(malas))
    return m


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Evalúa una corrida")
    ap.add_argument("--run", required=True)
    ap.add_argument("--raiz", default="../data")
    ap.add_argument("--split", default="test")
    a = ap.parse_args()
    m = evaluar(a.run, a.raiz, a.split)
    print(f"  split {m['split']} · n={m['n']}")
    print(f"  exactitud global     {m['exactitud_global']:.2%}")
    if m["exactitud_validas"] is not None:
        print(f"  exactitud en válidas {m['exactitud_validas']:.2%}")
    if m["rechazo_correcto"] is not None:
        print(f"  rechazo correcto     {m['rechazo_correcto']:.2%}")
    if m["falso_rechazo"] is not None:
        print(f"  falso rechazo        {m['falso_rechazo']:.2%}")
    print(f"  errores: {m['n_errores']}")
