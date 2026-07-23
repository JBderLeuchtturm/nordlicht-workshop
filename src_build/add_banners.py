"""Ersetzt die H1-Titelzeile jeder Notebook-Quelle durch einen NordLicht-HTML-Banner.
HTML in Markdown-Zellen wird von Colab und Jupyter gerendert; die restliche Zelle bleibt unverändert.
Idempotent: läuft die Datei schon mit Banner, passiert nichts."""
import re
from pathlib import Path

META = {
    "01_naive_rag.py": (
        "Notebook 01 · Naive RAG",
        "Die Basis-Pipeline: Chunking → Embeddings → Vektorsuche",
        "ca. 15 min · Übung 1",
    ),
    "02_hybrid_search_rrf.py": (
        "Notebook 02 · Hybrid Search & RRF",
        "BM25 + Vektorsuche, fair fusioniert über Reciprocal Rank Fusion",
        "ca. 15 min · Übung 2",
    ),
    "03_reranking_metadaten.py": (
        "Notebook 03 · Reranking & Metadaten",
        "Cross-Encoder-Präzision — und die Grenze der Relevanz",
        "ca. 25 min · Übungen 3 + 4",
    ),
    "04_evaluation.py": (
        "Notebook 04 · Evaluation",
        "Fünf Ausbaustufen, fünfzehn Gold-Fragen, zwei Metriken",
        "ca. 10 min · Demo",
    ),
}

BANNER = """# <div style="background:linear-gradient(135deg,#0B2545 0%,#13315C 100%);border-radius:14px;padding:24px 28px;color:#ffffff;font-family:Helvetica,Arial,sans-serif;margin-bottom:6px">
#   <div style="height:5px;width:130px;background:linear-gradient(90deg,#2EC4B6,#1C7293);border-radius:99px;margin-bottom:16px"></div>
#   <div style="font-size:11px;letter-spacing:2.5px;color:#9BE3D8;font-weight:700">NORDLICHT LOGISTIK · PROJEKT WISSENSASSISTENT</div>
#   <div style="font-size:27px;font-weight:700;margin-top:7px;line-height:1.2">{title}</div>
#   <div style="color:#C7D4E3;font-size:14px;margin-top:7px">{sub}</div>
#   <div style="color:#7E93AC;font-size:12.5px;margin-top:12px">Workshop RAG Advanced · WDSKI23A · DHBW Mannheim &nbsp;·&nbsp; {meta}</div>
# </div>"""

for fname, (title, sub, meta) in META.items():
    p = Path(fname)
    src = p.read_text(encoding="utf-8")
    if "PROJEKT WISSENSASSISTENT" in src:
        print(f"{fname}: Banner bereits vorhanden — übersprungen")
        continue
    new_src, n = re.subn(r"^# # Notebook .*$",
                         BANNER.format(title=title, sub=sub, meta=meta),
                         src, count=1, flags=re.M)
    if n != 1:
        raise SystemExit(f"{fname}: H1-Zeile nicht gefunden!")
    p.write_text(new_src, encoding="utf-8")
    print(f"{fname}: Banner eingesetzt ✓")
