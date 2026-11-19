"""Calibración y umbrales de rechazo. Ver docs/04-MODELO.md y ADR-006.

    python -m maya.calibrate --run runs/<id>   ->  runs/<id>/thresholds.json

1. Temperature scaling: un único escalar T ajustado minimizando la NLL SOBRE
   VALIDACIÓN (nunca sobre prueba). La confianza pasa a ser softmax(logits / T).
   Sin esto, un umbral sobre el softmax no significa nada: una red sin calibrar
   dice 99% y se equivoca a menudo.

2. Búsqueda en rejilla de tau (confianza) y margen maximizando

       U = 0.8 * P(acertar | válida)  +  0.2 * P(rechazar | no válida)

   que son los pesos de la rúbrica (40% por reconocer, 10% por rechazar). El
   resultado es un umbral bajo a propósito: ante la duda, el sistema arriesga un
   número en lugar de negarse, porque un falso rechazo cuesta el cuádruple.

`decidir()` es la política completa R1..R4 y debe ser idéntica a la de
`web/lib/inferencia.ts`. Trabaja sobre numpy, así que se puede probar sin torch.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from . import labels as L

PESO_ACIERTO_VALIDA = 0.8
PESO_RECHAZO_NO_VALIDA = 0.2
TAU_AUX_POR_DEFECTO = 0.5
MOTIVOS = ("clase_no_valida", "baja_confianza", "inconsistencia", "margen")


def softmax(z, T=1.0):
    z = np.asarray(z, dtype=np.float64) / T
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)


def ajustar_temperatura(logits, y, lo=0.25, hi=10.0, pasos=200) -> float:
    """Minimiza la NLL en una rejilla logarítmica. Es un solo parámetro: no hace
    falta un optimizador, y así el resultado es determinista y reproducible."""
    logits, y = np.asarray(logits, np.float64), np.asarray(y, np.int64)
    mejor_T, mejor_nll = 1.0, np.inf
    for T in np.geomspace(lo, hi, pasos):
        p = softmax(logits, T)
        nll = -np.log(np.clip(p[np.arange(len(y)), y], 1e-12, None)).mean()
        if nll < mejor_nll:
            mejor_T, mejor_nll = float(T), float(nll)
    return mejor_T


def _decisiones(probs, barras, puntos, tau, margen, conf_aux=None, tau_aux=0.0):
    """Vectorizado, para la búsqueda en rejilla. Devuelve (valor_pred, rechazada)."""
    orden = np.argsort(-probs, axis=1)
    top1, top2 = orden[:, 0], orden[:, 1]
    p1 = probs[np.arange(len(probs)), top1]
    p2 = probs[np.arange(len(probs)), top2]

    rechaza = top1 == L.INDICE_NO_VALIDO                        # R1
    rechaza |= p1 < tau                                          # R2
    valores = np.where(top1 == L.INDICE_NO_VALIDO, -1, top1 + 1)
    consistente = valores == (5 * barras + puntos)               # R3
    discrepa = (~consistente) & (valores > 0)
    if conf_aux is not None:
        # R3 solo cuenta si las cabezas auxiliares están SEGURAS de su desacuerdo.
        # Si contaron los puntos con tan poca confianza como el resto, su discrepancia
        # no es evidencia contra la cabeza de clase: rechazar ahí es tirar un acierto.
        discrepa &= conf_aux >= tau_aux
    rechaza |= discrepa
    rechaza |= (p1 - p2) < margen                                # R4
    return valores, rechaza


def utilidad(probs, barras, puntos, y, tau, margen, conf_aux=None, tau_aux=0.0) -> float:
    valores, rechaza = _decisiones(probs, barras, puntos, tau, margen, conf_aux, tau_aux)
    es_valida = y != L.INDICE_NO_VALIDO
    if es_valida.sum() == 0 or (~es_valida).sum() == 0:
        return 0.0
    acierta = (~rechaza) & (valores == y + 1) & es_valida
    p_acierto = acierta.sum() / es_valida.sum()
    p_rechazo = (rechaza & ~es_valida).sum() / (~es_valida).sum()
    return PESO_ACIERTO_VALIDA * p_acierto + PESO_RECHAZO_NO_VALIDA * p_rechazo


def buscar_umbrales(logits, barras_logits, puntos_logits, y, temperatura=None) -> dict:
    logits = np.asarray(logits, np.float64)
    y = np.asarray(y, np.int64)
    T = temperatura if temperatura is not None else ajustar_temperatura(logits, y)
    probs = softmax(logits, T)
    pb, pp = softmax(barras_logits), softmax(puntos_logits)
    barras, puntos = pb.argmax(1), pp.argmax(1)
    # Confianza de las cabezas auxiliares: la menor de las dos manda
    conf_aux = np.minimum(pb.max(1), pp.max(1))

    taus = np.round(np.arange(0.05, 0.96, 0.01), 3)
    margenes = np.round(np.arange(0.0, 0.51, 0.04), 3)
    taus_aux = np.round(np.arange(0.0, 0.96, 0.05), 3)
    mejor = {"tau": 0.5, "margen": 0.0, "tau_aux": TAU_AUX_POR_DEFECTO, "u": -1.0}
    curva = []
    for tau in taus:
        curva.append({"tau": float(tau),
                      "u": float(utilidad(probs, barras, puntos, y, tau, 0.0, conf_aux,
                                          TAU_AUX_POR_DEFECTO))})
        for m in margenes:
            for ta in taus_aux:
                u = utilidad(probs, barras, puntos, y, tau, m, conf_aux, ta)
                if u > mejor["u"]:
                    mejor = {"tau": float(tau), "margen": float(m), "tau_aux": float(ta),
                             "u": float(u)}

    valores, rechaza = _decisiones(probs, barras, puntos, mejor["tau"], mejor["margen"],
                                   conf_aux, mejor["tau_aux"])
    es_valida = y != L.INDICE_NO_VALIDO
    return {
        "version": 1, "temperatura": float(T),
        "tau": mejor["tau"], "margen": mejor["margen"], "tau_aux": mejor["tau_aux"],
        "utilidad": mejor["u"],
        "acierto_en_validas": float(((~rechaza) & (valores == y + 1) & es_valida).sum() / max(1, es_valida.sum())),
        "falso_rechazo_en_validas": float((rechaza & es_valida).sum() / max(1, es_valida.sum())),
        "rechazo_en_no_validas": float((rechaza & ~es_valida).sum() / max(1, (~es_valida).sum())),
        "curva_u": curva,
    }


def decidir(logits, barras_logits, puntos_logits, umbrales: dict) -> dict:
    """Política de rechazo completa, R1..R4 en orden. Misma lógica que inferencia.ts."""
    T = umbrales.get("temperatura", 1.0)
    tau, margen = umbrales.get("tau", 0.5), umbrales.get("margen", 0.0)
    tau_aux = umbrales.get("tau_aux", TAU_AUX_POR_DEFECTO)
    p = softmax(np.asarray(logits, np.float64).ravel(), T)
    orden = np.argsort(-p)
    top1, top2 = int(orden[0]), int(orden[1])
    pb = softmax(np.asarray(barras_logits, np.float64).ravel())
    pp = softmax(np.asarray(puntos_logits, np.float64).ravel())
    b, pt = int(pb.argmax()), int(pp.argmax())
    conf_aux = float(min(pb.max(), pp.max()))
    valor = L.valor_de_indice(top1)
    conf = float(p[top1])

    motivo = None
    if top1 == L.INDICE_NO_VALIDO:
        motivo = "clase_no_valida"
    elif conf < tau:
        motivo = "baja_confianza"
    elif valor != 5 * b + pt and conf_aux >= tau_aux:
        motivo = "inconsistencia"
    elif conf - float(p[top2]) < margen:
        motivo = "margen"

    return {"valor": None if motivo else valor, "rechazada": motivo is not None,
            "motivo": motivo, "confianza": conf, "barras": b, "puntos": pt,
            "confianza_aux": conf_aux, "probabilidades": p.tolist()}


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Calibra temperatura y umbrales")
    ap.add_argument("--run", required=True)
    ap.add_argument("--raiz", default="../data")
    a = ap.parse_args()

    from .evaluate import logits_de_split
    lg, lb, lp, y = logits_de_split(a.run, a.raiz, "val")
    res = buscar_umbrales(lg, lb, lp, y)
    Path(a.run, "thresholds.json").write_text(json.dumps(res, indent=2), encoding="utf-8")
    print(f"  temperatura {res['temperatura']:.3f} · tau {res['tau']:.2f} · margen {res['margen']:.2f}")
    print(f"  acierto en válidas     {res['acierto_en_validas']:.1%}")
    print(f"  falso rechazo válidas  {res['falso_rechazo_en_validas']:.1%}")
    print(f"  rechazo en no válidas  {res['rechazo_en_no_validas']:.1%}")
