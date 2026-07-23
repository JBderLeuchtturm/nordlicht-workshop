"""Erzeugt die Daten fuer die Freigabe-Pruefung (docs/freigabe.html).

Sechs Kundenfragen laufen durch die fertige Advanced-Pipeline, so wie sie nach
Uebung 4 aussieht: Hybrid Search, Cross-Encoder-Reranking, Metadaten-Filter.
Angezeigt werden im Quiz die echten Antworten samt echter Quelle.

    python src_build/export_freigabe_daten.py

Dauer rund zwei Minuten. Ohne Modelle laeuft das Skript nicht; die mitgelieferte
docs/assets/freigabe.json enthaelt dieselben Faelle mit den Quellen, die die
Pipeline im Workshop zieht. Nach der Generalprobe einmal neu erzeugen.

Das Urteil je Fall steht fest und haengt nicht davon ab, was die Pipeline liefert:
Es richtet sich danach, ob die Antwort ueberhaupt im Korpus steht.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ZIEL = ROOT / "docs" / "assets" / "freigabe.json"

# urteil: "freigeben" = Antwort steht so im Korpus, "blockieren" = steht nicht drin
FAELLE = [
    {
        "frage": "Welche Zustellquote garantiert die Servicestufe NL-EXPRESS-24?",
        "kanal": "Kundenservice \u00b7 E-Mail",
        "urteil": "freigeben",
        "pruefwort": "99",
        "warum": "Die Zahl steht genau so im SLA-Dokument von 2025, die Quelle ist g\u00fcltig. "
                 "So soll der Assistent arbeiten.",
        "lehre": "Bei klaren Faktenfragen mit eindeutigem Beleg ist die Pipeline verl\u00e4sslich.",
    },
    {
        "frage": "Wie viele Tage Homeoffice sind bei NordLicht erlaubt?",
        "kanal": "Personalabteilung \u00b7 Chat",
        "urteil": "freigeben",
        "pruefwort": "drei",
        "warum": "Genau diese Frage ging vorhin schief. Euer Metadaten-Filter aus \u00dcbung 4 h\u00e4lt "
                 "die archivierte Regelung von 2022 jetzt zur\u00fcck, geantwortet wird aus der "
                 "g\u00fcltigen Richtlinie von 2025.",
        "lehre": "Wer hier reflexhaft blockiert hat, hat das Muster erkannt statt den Fall gepr\u00fcft. "
                 "Auch das ist ein Fehler.",
    },
    {
        "frage": "Was kostet die Zustellung einer Sendung nach Norwegen?",
        "kanal": "Vertrieb \u00b7 Kundenportal",
        "urteil": "blockieren",
        "pruefwort": None,
        "warum": "Der Korpus kennt nur nationalen St\u00fcckgutversand und Zuschl\u00e4ge f\u00fcr deutsche "
                 "Inseln. Zu Norwegen steht nirgends etwas. Die Antwort nennt trotzdem einen "
                 "konkreten Betrag.",
        "lehre": "Falsche Pr\u00e4misse in der Frage. Kein Retrieval-Verfahren pr\u00fcft, ob die Frage "
                 "\u00fcberhaupt zum Zust\u00e4ndigkeitsbereich passt.",
    },
    {
        "frage": "Was bedeutet der Fehlercode NL-503 im Kundenportal?",
        "kanal": "IT-Support \u00b7 Ticket",
        "urteil": "freigeben",
        "pruefwort": "NL-503",
        "warum": "Ein exakter Code ohne semantischen Gehalt. Genau daf\u00fcr habt ihr BM25 mit ins "
                 "Boot geholt, und es funktioniert.",
        "lehre": "Hybrid Search zahlt sich bei Codes, Produktnamen und Paragraphen aus.",
    },
    {
        "frage": "Gibt es bei NordLicht einen Betriebskindergarten?",
        "kanal": "Bewerbung \u00b7 Kontaktformular",
        "urteil": "blockieren",
        "pruefwort": None,
        "warum": "Im gesamten Korpus steht nichts zu Kinderbetreuung. Der Assistent liefert "
                 "trotzdem einen Absatz mit Quellenangabe.",
        "lehre": "Der Assistent sagt nie \u201eweiss ich nicht\u201c. Er gibt immer das \u00c4hnlichste "
                 "zur\u00fcck, das er finden kann.",
    },
    {
        "frage": "Bekomme ich Geld zur\u00fcck, wenn meine Sendung zwei Tage zu sp\u00e4t ankommt?",
        "kanal": "Kundenservice \u00b7 E-Mail",
        "urteil": "blockieren",
        "pruefwort": None,
        "warum": "Der Reklamationsprozess regelt Sch\u00e4den und Verluste, nicht Versp\u00e4tungen. Die "
                 "Antwort klingt wie eine Erstattungszusage, obwohl NordLicht so etwas nirgends "
                 "zugesagt hat.",
        "lehre": "Das ist der Air-Canada-Fall in klein: eine erfundene Zusage, formuliert wie eine "
                 "Auskunft, mit korrekter Quellenangabe darunter.",
    },
]


def tokenisiere(text):
    return re.findall(r"\w+", text.lower())


def erstelle_chunks(dokumente):
    chunks = []
    for dok in dokumente:
        for i, absatz in enumerate(dok["text"].split("\n\n")):
            chunks.append({
                "chunk_id": f"{dok['doc_id']}#{i}", "doc_id": dok["doc_id"],
                "titel": dok["titel"], "status": dok["status"], "jahr": dok["jahr"],
                "text": absatz.strip(),
            })
    return chunks


def generiere_antwort(frage, chunk):
    """Deterministische Generierung, identisch zu Notebook 03."""
    frage_woerter = set(re.findall(r"\w+", frage.lower()))
    saetze = re.split(r"(?<=[.!?])\s+", chunk["text"])
    return max(saetze, key=lambda s: len(frage_woerter & set(re.findall(r"\w+", s.lower())))).strip()


def main():
    try:
        from rank_bm25 import BM25Okapi
        from sentence_transformers import CrossEncoder, SentenceTransformer
    except ImportError as fehler:
        sys.exit(f"Paket fehlt: {fehler.name}\nBitte zuerst:  pip install -r requirements.txt")

    korpus = json.loads((ROOT / "data" / "nordlicht_corpus.json").read_text(encoding="utf-8"))
    chunks = erstelle_chunks(korpus["dokumente"])
    nach_id = {c["chunk_id"]: c for c in chunks}
    print(f"{len(chunks)} Chunks geladen. Modelle werden vorbereitet ...")

    embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    cross_encoder = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
    vektoren = embedder.encode([c["text"] for c in chunks], show_progress_bar=False)
    bm25 = BM25Okapi([tokenisiere(c["text"]) for c in chunks])

    def dense(frage, k):
        v = embedder.encode(frage)
        s = vektoren @ v / (np.linalg.norm(vektoren, axis=1) * np.linalg.norm(v))
        return [chunks[i]["chunk_id"] for i in np.argsort(s)[::-1][:k]]

    def keyword(frage, k):
        s = bm25.get_scores(tokenisiere(frage))
        return [chunks[i]["chunk_id"] for i in np.argsort(s)[::-1][:k]]

    def advanced(frage):
        punkte = {}
        for liste in (keyword(frage, 8), dense(frage, 8)):
            for rang, cid in enumerate(liste, start=1):
                punkte[cid] = punkte.get(cid, 0.0) + 1.0 / (60 + rang)
        kandidaten = [nach_id[cid] for cid, _ in sorted(punkte.items(), key=lambda x: -x[1])[:8]]
        kandidaten = [c for c in kandidaten if c["status"] != "archiviert"]
        werte = cross_encoder.predict([(frage, c["text"]) for c in kandidaten])
        besitzer = int(np.argmax(werte))
        return kandidaten[besitzer], float(werte[besitzer])

    ausgabe = {"erzeugt": __import__("datetime").date.today().isoformat(), "faelle": []}
    warnungen = []

    for nummer, fall in enumerate(FAELLE, start=1):
        quelle, score = advanced(fall["frage"])
        antwort = generiere_antwort(fall["frage"], quelle)
        if fall["pruefwort"] and fall["pruefwort"].lower() not in antwort.lower():
            warnungen.append(f"Fall {nummer}: erwartet wurde \u201e{fall['pruefwort']}\u201c in der Antwort")
        ausgabe["faelle"].append({
            "nr": nummer, "frage": fall["frage"], "kanal": fall["kanal"],
            "antwort": antwort,
            "quelle": {"titel": quelle["titel"], "jahr": quelle["jahr"],
                       "status": quelle["status"], "chunk": quelle["chunk_id"]},
            "score": round(score, 3),
            "urteil": fall["urteil"], "warum": fall["warum"], "lehre": fall["lehre"],
        })
        print(f"  {nummer}. {fall['urteil']:11s} {quelle['chunk_id']:26s} {antwort[:58]}")

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(json.dumps(ausgabe, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nGeschrieben: {ZIEL.relative_to(ROOT)}")
    for w in warnungen:
        print(f"  Hinweis: {w}")
    if not warnungen:
        print("  Alle Pruefungen bestanden.")


if __name__ == "__main__":
    main()
