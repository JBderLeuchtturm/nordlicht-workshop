"""Erzeugt aus den Jupytext-Quellen (src_build/*.py) zwei Notebook-Varianten:

- notebooks/  → Teilnehmer-Version: Lösungsblöcke durch TODO + NotImplementedError ersetzt
- loesungen/  → Musterlösung: Lösungsblöcke enthalten, Marker entfernt

Aufruf:  python src_build/build_notebooks.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src_build"
NB_DIR = ROOT / "notebooks"
LSG_DIR = ROOT / "loesungen"

START = "# === LÖSUNG ==="
END = "# === ENDE LÖSUNG ==="

TODO_LINES = [
    "# ✏️ TODO: Implementiert hier eure Lösung (siehe Aufgabenstellung oben).",
    "#          Die ✅-Selbsttest-Zelle weiter unten verrät euch, ob alles stimmt.",
    'raise NotImplementedError("Übung noch nicht gelöst — ersetzt diesen Block durch euren Code.")',
]

QUELLEN = [
    "01_naive_rag.py",
    "02_hybrid_search_rrf.py",
    "03_reranking_metadaten.py",
    "04_evaluation.py",
]


def teilnehmer_version(text: str) -> str:
    zeilen, ausgabe, i = text.split("\n"), [], 0
    while i < len(zeilen):
        zeile = zeilen[i]
        if zeile.strip() == START:
            einzug = zeile[: len(zeile) - len(zeile.lstrip())]
            ausgabe.extend(einzug + t for t in TODO_LINES)
            while i < len(zeilen) and zeilen[i].strip() != END:
                i += 1
            i += 1  # END-Marker überspringen
        else:
            ausgabe.append(zeile)
            i += 1
    return "\n".join(ausgabe)


def loesungs_version(text: str) -> str:
    return "\n".join(z for z in text.split("\n") if z.strip() not in (START, END))


def py_zu_ipynb(py_text: str, ziel: Path) -> None:
    ziel.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(py_text)
        tmp = Path(f.name)
    subprocess.run(
        [sys.executable, "-m", "jupytext", "--to", "ipynb", str(tmp), "-o", str(ziel)],
        check=True,
        capture_output=True,
    )
    tmp.unlink()
    nachbearbeiten(ziel)


def nachbearbeiten(ipynb: Path) -> None:
    """Magics entkommentieren (# %pip → %pip), Jupytext-Metadaten entfernen, Kernel setzen."""
    nb = json.loads(ipynb.read_text(encoding="utf-8"))
    for zelle in nb["cells"]:
        if zelle["cell_type"] == "code":
            zelle["source"] = [
                z[2:] if z.lstrip().startswith(("# %", "# !")) and z.startswith("# ") else z
                for z in zelle["source"]
            ]
            zelle["outputs"] = []
            zelle["execution_count"] = None
    nb["metadata"] = {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11"},
        "colab": {"provenance": []},
    }
    ipynb.write_text(json.dumps(nb, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> None:
    for name in QUELLEN:
        quelle = (SRC / name).read_text(encoding="utf-8")
        stamm = name.removesuffix(".py")
        py_zu_ipynb(teilnehmer_version(quelle), NB_DIR / f"{stamm}.ipynb")
        if START in quelle:
            py_zu_ipynb(loesungs_version(quelle), LSG_DIR / f"{stamm}_loesung.ipynb")
        print(f"✓ {stamm}")
    print(f"\nFertig → {NB_DIR}  und  {LSG_DIR}")


if __name__ == "__main__":
    main()
