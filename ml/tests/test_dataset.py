"""Las reglas anti-fuga del enunciado: ninguna imagen ni variante derivada de ella
puede aparecer en dos splits distintos."""

from maya import dataset as D


def _fila(**kw):
    base = dict(ruta="x.jpg", sha256="h", clase="maya_01", subclase="", split="",
                fuente="synth", autor="", estilo="", seed="1", ancho="10", alto="10",
                creado_en="2026-11-18")
    base.update(kw); return base


def test_las_variantes_de_una_semilla_comparten_grupo():
    a = _fila(seed="42", sha256="a")
    b = _fila(seed="42", sha256="b")
    assert D.grupo_de(a) == D.grupo_de(b)


def test_una_tanda_de_fotos_comparte_grupo():
    a = _fila(fuente="real", autor="jose", estilo="lapicero", seed="")
    b = _fila(fuente="real", autor="jose", estilo="lapicero", seed="")
    c = _fila(fuente="real", autor="jose", estilo="marcador", seed="")
    assert D.grupo_de(a) == D.grupo_de(b) != D.grupo_de(c)


def test_detecta_un_grupo_partido_entre_splits():
    filas = [_fila(seed="7", sha256="a", split="train"),
             _fila(seed="7", sha256="b", split="test")]
    problemas = D.verificar(filas)
    assert any("grupo partido" in p for p in problemas)


def test_detecta_el_mismo_archivo_en_dos_splits():
    filas = [_fila(seed="1", sha256="igual", split="train"),
             _fila(seed="2", sha256="igual", split="val")]
    problemas = D.verificar(filas)
    assert any("varios splits" in p for p in problemas)


def test_el_autor_de_prueba_queda_fuera_del_entrenamiento():
    filas = [_fila(fuente="real", autor=a, estilo="lapicero", sha256=a) for a in
             ("jose", "jorge", "jean", "imri")]
    filas += [_fila(seed=str(i), sha256=f"s{i}") for i in range(200)]
    filas = D.construir_splits(filas, autor_prueba="imri", semilla=42)
    for f in filas:
        if f["fuente"] == "real":
            assert (f["split"] == "test") == (f["autor"] == "imri")


def test_los_grupos_sinteticos_no_se_parten():
    filas = [_fila(seed=str(i % 50), sha256=f"h{i}") for i in range(300)]
    filas = D.construir_splits(filas, semilla=42)
    assert not [p for p in D.verificar(filas) if "grupo partido" in p]


# --- Dato externo: entrena, nunca puntúa (ADR-013) ---------------------------

def test_lo_externo_siempre_cae_en_entrenamiento():
    filas = [_fila(fuente="externo", autor="mayavision", seed="",
                   clase=f"maya_{i:02d}", sha256=f"e{i}") for i in range(1, 20)]
    filas += [_fila(fuente="real", autor=a, estilo="lapicero", seed="", sha256=a)
              for a in ("jose", "jorge", "imri")]
    filas += [_fila(seed=str(i), sha256=f"s{i}") for i in range(200)]
    filas = D.construir_splits(filas, autor_prueba="imri", semilla=42)
    externas = [f for f in filas if f["fuente"] == "externo"]
    assert externas and all(f["split"] == "train" for f in externas)


def test_detecta_una_imagen_externa_fuera_de_entrenamiento():
    filas = [_fila(fuente="externo", autor="mayavision", seed="",
                   sha256="e1", split="val")]
    assert any("externas en val" in p for p in D.verificar(filas))


def test_el_reparto_no_depende_de_la_semilla_de_hash_del_interprete():
    """hash() de Python cambia entre procesos. Si el reparto dependiera de él, dos
    entrenamientos no serían comparables."""
    import os
    import subprocess
    import sys
    guion = (
        "import sys, json; sys.path.insert(0, 'src');"
        "from maya import dataset as D;"
        "f=[dict(ruta=f'r{i}.jpg', sha256=f'h{i}', clase='maya_01', subclase='',"
        " split='', fuente='real', autor=f'a{i%5}', estilo='lapicero', seed='',"
        " ancho='10', alto='10', creado_en='2026-11-19') for i in range(60)];"
        "f=D.construir_splits(f, autor_prueba='a4', semilla=42);"
        "print(json.dumps({x['ruta']: x['split'] for x in f}, sort_keys=True))"
    )
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    salidas = set()
    for semilla in ("1", "999"):
        entorno = dict(os.environ, PYTHONHASHSEED=semilla)
        salidas.add(subprocess.run([sys.executable, "-c", guion], cwd=raiz,
                                   env=entorno, capture_output=True,
                                   text=True, check=True).stdout)
    assert len(salidas) == 1
