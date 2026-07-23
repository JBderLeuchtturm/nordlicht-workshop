"""Ergaenzt die Notebooks um Fortschritts-Links fuer das Workshop-Portal.

Nach jedem bestandenen Selbsttest wird ein anklickbarer Link ausgegeben, der den
Punkt im Portal automatisch abhakt. Die Portal-Adresse wird aus DATA_URL abgeleitet,
funktioniert also fuer jeden GitHub-Namen ohne weitere Anpassung.

    python src_build/add_fortschritt.py

Idempotent: bereits ergaenzte Dateien werden uebersprungen.
"""
import re
from pathlib import Path

HIER = Path(__file__).resolve().parent

HELFER = '''
# Portal-Adresse aus DATA_URL ableiten und Fortschritt melden koennen
import re as _re

_treffer = _re.search(r"githubusercontent\\.com/([^/]+)/([^/]+)/", DATA_URL)
PORTAL = f"https://{_treffer.group(1)}.github.io/{_treffer.group(2)}" if _treffer else ""


def fortschritt(kennung, text=""):
    """Zeigt einen Link, der den Punkt im Workshop-Portal abhakt."""
    if PORTAL:
        zusatz = f" \\u2014 {text}" if text else ""
        print(f"\\n\\u2611 Im Portal abhaken{zusatz}:")
        print(f"   {PORTAL}/?fertig={kennung}")
'''

# Datei -> Liste von (Ankerzeile, Kennung, Beschriftung)
EINFUEGUNGEN = {
    "01_naive_rag.py": [
        ('print("✅ Übung 1 gelöst! Bester Treffer:", treffer[0][0]["titel"])', "u1", "Übung 1"),
    ],
    "02_hybrid_search_rrf.py": [
        ('print("✅ Übung 2 gelöst! B gewinnt — Konsistenz über beide Listen wird belohnt.")', "u2", "Übung 2"),
    ],
    "03_reranking_metadaten.py": [
        ('print("✅ Übung 3 gelöst! Top-Chunk:", test_ergebnis[0][0]["chunk_id"])', "u3", "Übung 3"),
        ('print("✅ Übung 4 gelöst! Die Pipeline antwortet jetzt aus der gültigen Richtlinie.")', "u4", "Übung 4"),
    ],
}

# Zusaetzlich: Setup-Meldung am Ende der Setup-Zelle
SETUP = {
    "01_naive_rag.py": ("setup", "Setup erledigt"),
    "04_evaluation.py": ("nb4", "Evaluation gesehen"),
}


def bearbeite(pfad: Path):
    quelle = pfad.read_text(encoding="utf-8")
    if "def fortschritt(" in quelle:
        print(f"  {pfad.name}: bereits ergaenzt")
        return False

    # Helfer direkt nach der DATA_URL-Zeile einsetzen
    quelle, anzahl = re.subn(r"^DATA_URL = .*$", lambda m: m.group(0) + "\n" + HELFER,
                             quelle, count=1, flags=re.M)
    if anzahl != 1:
        print(f"  {pfad.name}: DATA_URL nicht gefunden — uebersprungen")
        return False

    for anker, kennung, text in EINFUEGUNGEN.get(pfad.name, []):
        if anker not in quelle:
            print(f"  {pfad.name}: Anker fuer {kennung} nicht gefunden")
            continue
        quelle = quelle.replace(anker, anker + f'\nfortschritt("{kennung}", "{text}")', 1)

    if pfad.name in SETUP:
        kennung, text = SETUP[pfad.name]
        anker = re.search(r'^print\(f?"Setup fertig.*$', quelle, flags=re.M)
        if anker:
            quelle = quelle.replace(anker.group(0), anker.group(0) + f'\nfortschritt("{kennung}", "{text}")', 1)

    pfad.write_text(quelle, encoding="utf-8")
    print(f"  {pfad.name}: Fortschritts-Links ergaenzt")
    return True


if __name__ == "__main__":
    print("Notebooks werden ergaenzt ...")
    geaendert = 0
    for name in ("01_naive_rag.py", "02_hybrid_search_rrf.py",
                 "03_reranking_metadaten.py", "04_evaluation.py"):
        pfad = HIER / name
        if pfad.exists() and bearbeite(pfad):
            geaendert += 1
    print(f"\n{geaendert} Datei(en) geaendert.")
    if geaendert:
        print("Jetzt noch:  python src_build/build_notebooks.py")
