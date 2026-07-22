"""Erzeugt die Bilder und Sprechernotizen für docs/praesentation.html aus der PPTX.

Immer dann ausführen, wenn sich RAG_Advanced_Folien.pptx geändert hat
(zum Beispiel nachdem die echten Benchmark-Zahlen auf Folie 27 eingetragen wurden):

    python src_build/build_praesentation.py

Voraussetzungen: LibreOffice (soffice), poppler-utils (pdftoppm), Pillow, python-pptx.
Unter Windows am einfachsten über die WSL/Ubuntu-Shell oder mit installiertem LibreOffice
im PATH. Wer das nicht hat: Folien in PowerPoint über "Datei > Exportieren > Bilder"
als JPG mit 1600 px Breite ausgeben und als 01.jpg … 39.jpg nach docs/assets/folien/ legen.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PPTX = ROOT / "RAG_Advanced_Folien.pptx"
OUT_IMG = ROOT / "docs" / "assets" / "folien"
PRESENTER = ROOT / "docs" / "praesentation.html"
TMP = ROOT / ".build_praes"
BREITE = 1600
QUALITAET = 90

# Titel je Folie — bei Umbau des Decks hier anpassen.
TITEL = {
    1: "Titel — RAG Advanced", 2: "Was euch heute erwartet", 3: "Was ihr danach könnt",
    4: "Teil 1 · RAG-Grundlagen", 5: "LLMs haben ein Wissensproblem", 6: "Der Fall Air Canada",
    7: "RAG in zwei Phasen", 8: "Was ist ein Embedding?", 9: "Der Bi-Encoder (SBERT)",
    10: "Warum eine Vektordatenbank?", 11: "Welche Vektordatenbank?", 12: "Chunking-Strategien",
    13: "Der erweiterte Prompt", 14: "Die naive Pipeline", 15: "Zwei blinde Flecken der Vektorsuche",
    16: "Hands-on · Notebook 01", 17: "Teil 2 · Advanced RAG", 18: "Hybrid Search: zwei Sucher",
    19: "BM25 verstehen: drei Zutaten", 20: "Reciprocal Rank Fusion (RRF)", 21: "Hands-on · Notebook 02",
    22: "Cross-Encoder Reranking", 23: "Das zweistufige Muster", 24: "Hands-on · Notebook 03",
    25: "Relevanz ist nicht Gültigkeit", 26: "Der Fix: Metadaten ernst nehmen",
    27: "Beweisen statt behaupten: Evaluation", 28: "Precision vs. Recall", 29: "RAGAS: vier Metriken",
    30: "Diagnose-Logik: wo klemmt es?", 31: "Hands-on · Notebook 04", 32: "Teil 3 · Über RAG hinaus",
    33: "RAG oder Fine-Tuning?", 34: "LoRA & QLoRA", 35: "Die Grenzen von statischem RAG",
    36: "Das ReAct-Paradigma", 37: "Chancen, Risiken, Enterprise-Reife", 38: "Glossar",
    39: "Fazit & Fragen",
}


def kapitel(n: int) -> str:
    if n <= 3:
        return "Einstieg"
    if n <= 16:
        return "Teil 1 · Grundlagen"
    if n <= 31:
        return "Teil 2 · Advanced RAG"
    return "Teil 3 · Ausblick"


def pruefe_werkzeuge():
    fehlt = [w for w in ("soffice", "pdftoppm") if not shutil.which(w)]
    if fehlt:
        sys.exit(f"Fehlt im PATH: {', '.join(fehlt)}. Siehe Hinweis oben im Skript.")


def bilder_erzeugen():
    from PIL import Image

    TMP.mkdir(exist_ok=True)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(TMP), str(PPTX)],
                   check=True, capture_output=True)
    pdf = TMP / (PPTX.stem + ".pdf")
    subprocess.run(["pdftoppm", "-png", "-r", "96", "-scale-to-x", str(BREITE), "-scale-to-y", "-1",
                    str(pdf), str(TMP / "f")], check=True)

    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for alt in OUT_IMG.glob("*.jpg"):
        alt.unlink()

    gesamt = 0
    seiten = sorted(TMP.glob("f-*.png"))
    for p in seiten:
        n = int(re.search(r"f-(\d+)", p.name).group(1))
        ziel = OUT_IMG / f"{n:02d}.jpg"
        Image.open(p).convert("RGB").save(ziel, "JPEG", quality=QUALITAET, optimize=True, progressive=True)
        gesamt += ziel.stat().st_size
    shutil.rmtree(TMP, ignore_errors=True)
    print(f"  {len(seiten)} Bilder erzeugt ({gesamt / 1024 / 1024:.1f} MB) → {OUT_IMG.relative_to(ROOT)}")
    return len(seiten)


def notizen_lesen():
    from pptx import Presentation

    prs = Presentation(PPTX)
    daten = []
    for i, folie in enumerate(prs.slides, start=1):
        notiz = ""
        if folie.has_notes_slide:
            notiz = folie.notes_slide.notes_text_frame.text.strip()
        daten.append({"n": i, "t": TITEL.get(i, f"Folie {i}"), "k": notiz, "kap": kapitel(i)})
    fehlend = [d["n"] for d in daten if not d["k"]]
    if fehlend:
        print(f"  Hinweis: keine Sprechernotiz auf Folie {fehlend}")
    return daten


def presenter_aktualisieren(daten):
    html = PRESENTER.read_text(encoding="utf-8")
    neu = json.dumps(daten, ensure_ascii=False, separators=(",", ":"))
    html, anzahl = re.subn(r"const S = \[.*?\];", f"const S = {neu};", html, count=1, flags=re.S)
    if anzahl != 1:
        sys.exit("Datenblock in praesentation.html nicht gefunden — bitte manuell prüfen.")
    PRESENTER.write_text(html, encoding="utf-8")
    print(f"  Titel und Notizen für {len(daten)} Folien in praesentation.html eingesetzt")


if __name__ == "__main__":
    if not PPTX.exists():
        sys.exit(f"Nicht gefunden: {PPTX}")
    pruefe_werkzeuge()
    print("Folien werden neu erzeugt …")
    anzahl_bilder = bilder_erzeugen()
    daten = notizen_lesen()
    if len(daten) != anzahl_bilder:
        print(f"  Achtung: {anzahl_bilder} Bilder, aber {len(daten)} Folien in der PPTX.")
    presenter_aktualisieren(daten)
    print("Fertig. docs/praesentation.html ist auf dem aktuellen Stand.")
