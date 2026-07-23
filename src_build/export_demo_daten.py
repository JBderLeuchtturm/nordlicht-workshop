"""Erzeugt die Daten fuer die Live-Demo auf der Website.

Laesst die echte Workshop-Pipeline ueber ein paar ausgewaehlte Fragen laufen und
schreibt die tatsaechlichen Ergebnisse nach docs/assets/demo-daten.json.
Die Website spielt danach echte Rankings ab - nichts ist simuliert.

    python src_build/export_demo_daten.py

Dauer: rund zwei Minuten (die Modelle muessen einmal geladen werden).
Benoetigt dieselbe Umgebung wie die Notebooks:

    pip install -r requirements.txt
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ZIEL = ROOT / "docs" / "assets" / "demo-daten.json"

# Fragen fuer die Demo. Reihenfolge = Reihenfolge auf der Website.
# "hinweis" erscheint als Einordnung unter der Frage, "falle" hebt sie farblich hervor.
FRAGEN = [
    {
        "frage": "Wie viele Tage Homeoffice sind bei NordLicht erlaubt?",
        "kurz": "Homeoffice",
        "hinweis": "Die entscheidende Frage des Workshops. Achtet auf das Jahr der Quelle.",
        "falle": True,
    },
    {
        "frage": "Was bedeutet der Fehlercode NL-410 im Kundenportal?",
        "kurz": "Fehlercode NL-410",
        "hinweis": "Ein exakter Code ohne semantischen Gehalt - hier spielt BM25 seine Staerke aus.",
        "falle": False,
    },
    {
        "frage": "Krieg ich Kohle zurueck, wenn ein Paket kaputt geht?",
        "kurz": "Umgangssprache",
        "hinweis": "Kein einziges Wort steht so im Dokument - hier braucht es Bedeutung statt Buchstaben.",
        "falle": False,
    },
    {
        "frage": "Welche Zustellquote garantiert die Servicestufe NL-EXPRESS-24?",
        "kurz": "SLA-Zustellquote",
        "hinweis": "Eine saubere Faktenfrage: So sieht es aus, wenn alles funktioniert.",
        "falle": False,
    },
    {
        "frage": "Wie viele Urlaubstage stehen mir zu?",
        "kurz": "Urlaubstage",
        "hinweis": "Alltagsfrage aus der Personalabteilung - eindeutig beantwortbar.",
        "falle": False,
    },
]


def tokenisiere(text):
    return re.findall(r"\w+", text.lower())


def erstelle_chunks(dokumente):
    chunks = []
    for dok in dokumente:
        for i, absatz in enumerate(dok["text"].split("\n\n")):
            chunks.append({
                "chunk_id": f"{dok['doc_id']}#{i}",
                "doc_id": dok["doc_id"],
                "titel": dok["titel"],
                "status": dok["status"],
                "jahr": dok["jahr"],
                "text": absatz.strip(),
            })
    return chunks


def generiere_antwort(frage, treffer):
    """Deterministische 'Generierung' - identisch zu Notebook 03."""
    bester_chunk = treffer[0][0]
    frage_woerter = set(re.findall(r"\w+", frage.lower()))
    saetze = re.split(r"(?<=[.!?])\s+", bester_chunk["text"])
    bester_satz = max(saetze, key=lambda s: len(frage_woerter & set(re.findall(r"\w+", s.lower()))))
    return bester_satz, bester_chunk


def main():
    try:
        from rank_bm25 import BM25Okapi
        from sentence_transformers import CrossEncoder, SentenceTransformer
    except ImportError as fehler:
        sys.exit(f"Paket fehlt: {fehler.name}\nBitte zuerst:  pip install -r requirements.txt")

    korpus = json.loads((ROOT / "data" / "nordlicht_corpus.json").read_text(encoding="utf-8"))
    chunks = erstelle_chunks(korpus["dokumente"])
    chunk_nach_id = {c["chunk_id"]: c for c in chunks}
    print(f"{len(chunks)} Chunks aus {len(korpus['dokumente'])} Dokumenten.")

    print("Modelle werden geladen (beim ersten Mal dauert das etwas) ...")
    embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    cross_encoder = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
    chunk_vektoren = embedder.encode([c["text"] for c in chunks], show_progress_bar=False)
    bm25 = BM25Okapi([tokenisiere(c["text"]) for c in chunks])

    def suche_dense(frage, k=3):
        v = embedder.encode(frage)
        scores = chunk_vektoren @ v / (np.linalg.norm(chunk_vektoren, axis=1) * np.linalg.norm(v))
        return [(chunks[i], float(scores[i])) for i in np.argsort(scores)[::-1][:k]]

    def suche_bm25(frage, k=3):
        scores = bm25.get_scores(tokenisiere(frage))
        return [(chunks[i], float(scores[i])) for i in np.argsort(scores)[::-1][:k]]

    def suche_hybrid(frage, k=3, kandidaten_pro_liste=8):
        listen = [[c["chunk_id"] for c, _ in suche_bm25(frage, kandidaten_pro_liste)],
                  [c["chunk_id"] for c, _ in suche_dense(frage, kandidaten_pro_liste)]]
        punkte = {}
        for liste in listen:
            for rang, cid in enumerate(liste, start=1):
                punkte[cid] = punkte.get(cid, 0.0) + 1.0 / (60 + rang)
        beste = sorted(punkte.items(), key=lambda x: -x[1])[:k]
        return [(chunk_nach_id[cid], s) for cid, s in beste]

    def reranke(frage, kandidaten, top_n=3):
        scores = cross_encoder.predict([(frage, c["text"]) for c in kandidaten])
        return [(kandidaten[i], float(scores[i])) for i in np.argsort(scores)[::-1][:top_n]]

    def suche_advanced(frage, k=3, nur_gueltige=False):
        kandidaten = [c for c, _ in suche_hybrid(frage, k=8)]
        if nur_gueltige:
            kandidaten = [c for c in kandidaten if c["status"] != "archiviert"]
        return reranke(frage, kandidaten, top_n=k)

    modi = [
        {"id": "bm25", "name": "BM25", "unter": "Reine Stichwortsuche",
         "fn": lambda f: suche_bm25(f, 3), "skala": "BM25-Score"},
        {"id": "dense", "name": "Vektorsuche", "unter": "Bedeutung statt Buchstaben",
         "fn": lambda f: suche_dense(f, 3), "skala": "Kosinus"},
        {"id": "hybrid", "name": "Hybrid + RRF", "unter": "Beide Listen fusioniert",
         "fn": lambda f: suche_hybrid(f, 3), "skala": "RRF-Score"},
        {"id": "advanced", "name": "Advanced", "unter": "Reranking + Metadatenfilter",
         "fn": lambda f: suche_advanced(f, 3, nur_gueltige=True), "skala": "Cross-Encoder"},
    ]

    ausgabe = {
        "erzeugt": __import__("datetime").date.today().isoformat(),
        "korpus": {"dokumente": len(korpus["dokumente"]), "chunks": len(chunks)},
        "modi": [{"id": m["id"], "name": m["name"], "unter": m["unter"], "skala": m["skala"]} for m in modi],
        "fragen": [],
    }

    for eintrag in FRAGEN:
        frage = eintrag["frage"]
        print(f"  → {eintrag['kurz']}")
        ergebnisse = {}
        for modus in modi:
            treffer = modus["fn"](frage)
            antwort, quelle = generiere_antwort(frage, treffer)
            ergebnisse[modus["id"]] = {
                "treffer": [{
                    "titel": c["titel"], "jahr": c["jahr"], "status": c["status"],
                    "chunk": c["chunk_id"], "score": round(s, 4),
                    "auszug": c["text"][:150].strip() + ("…" if len(c["text"]) > 150 else ""),
                } for c, s in treffer],
                "antwort": antwort.strip(),
                "quelle": {"titel": quelle["titel"], "jahr": quelle["jahr"], "status": quelle["status"]},
            }
        ausgabe["fragen"].append({
            "frage": frage, "kurz": eintrag["kurz"],
            "hinweis": eintrag["hinweis"], "falle": eintrag["falle"],
            "ergebnisse": ergebnisse,
        })

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(json.dumps(ausgabe, ensure_ascii=False, indent=1), encoding="utf-8")
    groesse = ZIEL.stat().st_size / 1024
    print(f"\nFertig: {ZIEL.relative_to(ROOT)} ({groesse:.0f} KB, {len(FRAGEN)} Fragen)")
    print("Jetzt nur noch committen und pushen - die Website nutzt die Datei automatisch.")


if __name__ == "__main__":
    main()
