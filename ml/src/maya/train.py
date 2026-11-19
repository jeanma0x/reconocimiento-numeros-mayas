"""Ciclo de entrenamiento. Ver docs/04-MODELO.md.

    python -m maya.train --config configs/default.yaml --etapa A
    python -m maya.train --config configs/default.yaml --etapa B --desde runs/001

Etapa A: sintético completo.
Etapa B: afinado con lr bajo sobre fotos reales repetidas, mezcladas con parte del
sintético para evitar el olvido catastrófico (sin esa mezcla el modelo se sobreajusta
a unos cientos de fotos y empeora en todo lo demás).

Early stopping sobre la PÉRDIDA DE VALIDACIÓN. Se guarda el mejor checkpoint, nunca
el último. El conjunto de prueba no se toca en ninguna etapa.
"""

from __future__ import annotations

import json
import math
import time
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset

from . import dataset as D
from . import labels as L
from .model import PerdidaMaya, construir, contar_parametros


def fijar_semilla(s=42):
    import random
    random.seed(s); np.random.seed(s); torch.manual_seed(s)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(s)


class CacheDataset(Dataset):
    """Tensores 64x64 ya preprocesados. El aumento se aplica aquí, al vuelo, y solo
    cuando `aumentar=True` (nunca en validación ni en prueba)."""

    def __init__(self, X, y, yb, yp, aumentar=False, semilla=0, repeticiones=1):
        self.X, self.y, self.yb, self.yp = X, y, yb, yp
        self.aumentar = aumentar
        self.rng = np.random.default_rng(semilla)
        self.rep = repeticiones

    def __len__(self):
        return len(self.y) * self.rep

    def __getitem__(self, i):
        i = i % len(self.y)
        x = self.X[i].astype(np.float32) / 255.0
        if self.aumentar:
            x = D.aumentar(x, self.rng)
        return (torch.from_numpy(x[None]), int(self.y[i]), int(self.yb[i]), int(self.yp[i]))


@torch.no_grad()
def evaluar(modelo, loader, perdida_fn, device):
    modelo.eval()
    total, correctos, suma = 0, 0, 0.0
    for x, y, yb, yp in loader:
        x, y, yb, yp = x.to(device), y.to(device), yb.to(device), yp.to(device)
        s = modelo(x)
        suma += perdida_fn(s, y, yb, yp).item() * y.size(0)
        correctos += (s[0].argmax(1) == y).sum().item()
        total += y.size(0)
    return suma / max(1, total), correctos / max(1, total)


def entrenar(cfg, etapa="A", desde=None, raiz_datos=None, salida="runs", progreso=True) -> str:
    fijar_semilla(cfg["semilla"])
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    raiz = raiz_datos or cfg["datos"]["raiz"]
    par = cfg["entrenamiento"]["etapa_a" if etapa == "A" else "etapa_b"]

    Xtr, ytr, btr, ptr = D.cargar_cache(raiz, "train")
    Xva, yva, bva, pva = D.cargar_cache(raiz, "val")

    if etapa == "B":
        # Las fotos reales pesan más, pero no se quita el sintético: sin él el
        # modelo olvida lo aprendido y se sobreajusta a unos cientos de fotos.
        rep = par.get("repeticiones_reales", 10)
        print(f"  etapa B: fotos reales repetidas x{rep} mezcladas con el sintético")
    ds_tr = CacheDataset(Xtr, ytr, btr, ptr, aumentar=True, semilla=cfg["semilla"])
    ds_va = CacheDataset(Xva, yva, bva, pva, aumentar=False)
    lote = par["lote"]
    dl_tr = DataLoader(ds_tr, batch_size=lote, shuffle=True, num_workers=0, drop_last=True)
    dl_va = DataLoader(ds_va, batch_size=256, shuffle=False, num_workers=0)

    modelo = construir(cfg["modelo"]["arquitectura"], dropout=cfg["modelo"]["dropout"]).to(device)
    if desde:
        ck = torch.load(Path(desde) / "mejor.pt", map_location=device)
        modelo.load_state_dict(ck["modelo"])
        print(f"  continuando desde {desde}")

    perdida_fn = PerdidaMaya(cfg["modelo"]["peso_cabeza_barras"],
                             cfg["modelo"]["peso_cabeza_puntos"],
                             cfg["modelo"]["label_smoothing"])
    opt = torch.optim.AdamW(modelo.parameters(), lr=par["lr"],
                            weight_decay=par.get("weight_decay", 1e-4))
    epocas, calent = par["epocas"], par.get("calentamiento_epocas", 0)

    def factor_lr(e):
        if e < calent:
            return (e + 1) / max(1, calent)
        t = (e - calent) / max(1, epocas - calent)
        return 0.5 * (1 + math.cos(math.pi * t))

    sched = torch.optim.lr_scheduler.LambdaLR(opt, factor_lr)

    run_id = time.strftime("%Y%m%d-%H%M%S") + f"-{etapa}"
    run = Path(salida) / run_id
    run.mkdir(parents=True, exist_ok=True)
    hist = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "lr": []}
    mejor, sin_mejorar, paciencia = float("inf"), 0, par["paciencia"]

    print(f"  modelo: {cfg['modelo']['arquitectura']}, {contar_parametros(modelo):,} parámetros")
    print(f"  dispositivo: {device} · train {len(ds_tr)} · val {len(ds_va)}")

    for e in range(epocas):
        modelo.train()
        suma, correctos, total = 0.0, 0, 0
        for x, y, yb, yp in dl_tr:
            x, y, yb, yp = x.to(device), y.to(device), yb.to(device), yp.to(device)
            s = modelo(x)
            loss = perdida_fn(s, y, yb, yp)
            opt.zero_grad(); loss.backward()
            torch.nn.utils.clip_grad_norm_(modelo.parameters(), 5.0)
            opt.step()
            suma += loss.item() * y.size(0)
            correctos += (s[0].argmax(1) == y).sum().item(); total += y.size(0)
        sched.step()
        tl, ta = suma / total, correctos / total
        vl, va = evaluar(modelo, dl_va, perdida_fn, device)
        for k, v in zip(("train_loss","train_acc","val_loss","val_acc","lr"),
                        (tl, ta, vl, va, opt.param_groups[0]["lr"])):
            hist[k].append(v)
        if progreso:
            print(f"  época {e+1}/{epocas} · train {tl:.4f}/{ta:.4f} · val {vl:.4f}/{va:.4f}", flush=True)

        if vl < mejor - 1e-5:
            mejor, sin_mejorar = vl, 0
            torch.save({"modelo": modelo.state_dict(), "config": cfg, "etapa": etapa,
                        "epoca": e + 1, "val_loss": vl, "val_acc": va}, run / "mejor.pt")
        else:
            sin_mejorar += 1
            if sin_mejorar >= paciencia:
                print(f"  early stopping: {paciencia} épocas sin mejorar en validación")
                break

    json.dump(hist, open(run / "historial.json", "w"), indent=2)
    json.dump(cfg, open(run / "config.json", "w"), indent=2, ensure_ascii=False)
    print(f"  mejor val_loss {mejor:.4f} -> {run}")
    return str(run)


if __name__ == "__main__":
    import argparse, yaml
    ap = argparse.ArgumentParser(description="Entrena la CNN")
    ap.add_argument("--config", default="configs/default.yaml")
    ap.add_argument("--etapa", default="A", choices=["A", "B"])
    ap.add_argument("--desde", default=None)
    ap.add_argument("--epocas", type=int)
    a = ap.parse_args()
    cfg = yaml.safe_load(open(a.config, encoding="utf-8"))
    if a.epocas:
        cfg["entrenamiento"]["etapa_a" if a.etapa == "A" else "etapa_b"]["epocas"] = a.epocas
    entrenar(cfg, a.etapa, a.desde)
