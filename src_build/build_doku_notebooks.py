"""Erzeugt die Doku-Notebooks aus den Markdown-Dateien.

    python src_build/build_doku_notebooks.py

README.md            -> notebooks/00_README.ipynb
MODERATIONSLEITFADEN.md -> notebooks/00_MODERATIONSLEITFADEN.ipynb

Geteilt wird an den H2-Ueberschriften, damit jede Zelle ein Kapitel enthaelt.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAARE = [
    ("README.md", "notebooks/00_README.ipynb"),
    ("MODERATIONSLEITFADEN.md", "notebooks/00_MODERATIONSLEITFADEN.ipynb"),
]


def baue(quelle: Path, ziel: Path):
    text = quelle.read_text(encoding="utf-8")
    teile = [t for t in re.split(r"(?=^## )", text, flags=re.M) if t.strip()]
    notebook = {
        "cells": [{"cell_type": "markdown", "metadata": {}, "source": t.rstrip() + "\n"} for t in teile],
        "metadata": {"language_info": {"name": "python"}, "colab": {"provenance": []}},
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(json.dumps(notebook, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  {ziel.relative_to(ROOT)}: {len(teile)} Zellen")


if __name__ == "__main__":
    print("Doku-Notebooks werden erzeugt ...")
    for quelle, ziel in PAARE:
        baue(ROOT / quelle, ROOT / ziel)
    print("Fertig.")
