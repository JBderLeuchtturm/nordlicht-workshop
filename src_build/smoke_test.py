"""Smoke-Test für alle modellfreien Bestandteile des Workshops.

Prüft ohne Downloads (kein Embedder/Cross-Encoder nötig):
1. Datenkonsistenz (Korpus ↔ Testset)
2. Chunking
3. BM25-Verhalten der eingebauten Lehr-Momente
4. RRF (inkl. Worked Example aus VL 3)
5. Extraktive Antwort (liefert die Falle den dramatischen Satz?)
6. Metriken Hit@k / MRR

Aufruf:  python src_build/smoke_test.py
"""
import json
import re
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi

ROOT = Path(__file__).resolve().parents[1]


def lade(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def erstelle_chunks(dokumente):
    chunks = []
    for dok in dokumente:
        for i, absatz in enumerate(dok["text"].split("\n\n")):
            chunks.append(
                {
                    "chunk_id": f"{dok['doc_id']}#{i}",
                    "doc_id": dok["doc_id"],
                    "titel": dok["titel"],
                    "status": dok["status"],
                    "jahr": dok["jahr"],
                    "text": absatz.strip(),
                }
            )
    return chunks


def tokenisiere(text):
    return re.findall(r"\w+", text.lower())


def generiere_antwort(frage, treffer):
    bester_chunk = treffer[0][0]
    frage_woerter = set(re.findall(r"\w+", frage.lower()))
    saetze = re.split(r"(?<=[.!?])\s+", bester_chunk["text"])
    bester_satz = max(saetze, key=lambda s: len(frage_woerter & set(re.findall(r"\w+", s.lower()))))
    return bester_satz, bester_chunk


def rrf_fusion(ranglisten, k=60):
    scores = {}
    for rangliste in ranglisten:
        for rang, chunk_id in enumerate(rangliste, start=1):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rang)
    return scores


def hit_at_k(treffer, relevante_docs, k=3):
    return float(any(c["doc_id"] in relevante_docs for c, _ in treffer[:k]))


def reciprocal_rank(treffer, relevante_docs):
    for rang, (c, _) in enumerate(treffer, start=1):
        if c["doc_id"] in relevante_docs:
            return 1.0 / rang
    return 0.0


ok = 0


def check(bedingung, meldung):
    global ok
    assert bedingung, f"FEHLGESCHLAGEN: {meldung}"
    ok += 1
    print(f"  ✓ {meldung}")


# ── 1 · Daten ──────────────────────────────────────────────────────────────
print("1 · Datenkonsistenz")
korpus = lade("nordlicht_corpus.json")
testset = lade("gold_testset.json")["fragen"]
doc_ids = {d["doc_id"] for d in korpus["dokumente"]}
check(len(korpus["dokumente"]) == 12, "12 Dokumente im Korpus")
check(len(testset) == 15, "15 Fragen im Gold-Testset")
check(
    all(set(f["relevante_docs"]) <= doc_ids for f in testset),
    "alle relevante_docs existieren im Korpus",
)
check(
    sum(1 for d in korpus["dokumente"] if d["status"] == "archiviert") == 1,
    "genau 1 archiviertes Dokument (homeoffice-2022)",
)

# ── 2 · Chunking ───────────────────────────────────────────────────────────
print("2 · Chunking")
chunks = erstelle_chunks(korpus["dokumente"])
check(all(c["text"] for c in chunks), f"alle {len(chunks)} Chunks nicht leer")
check(
    len({c["chunk_id"] for c in chunks}) == len(chunks),
    "chunk_ids sind eindeutig",
)

# ── 3 · BM25-Lehr-Momente ─────────────────────────────────────────────────
print("3 · BM25-Verhalten (eingebaute Lehr-Momente)")
bm25 = BM25Okapi([tokenisiere(c["text"]) for c in chunks])


def suche_bm25(frage, k=3):
    scores = bm25.get_scores(tokenisiere(frage))
    reihenfolge = np.argsort(scores)[::-1][:k]
    return [(chunks[i], float(scores[i])) for i in reihenfolge]


falle = "Wie viele Tage Homeoffice sind bei NordLicht erlaubt?"
top_falle = suche_bm25(falle, k=8)
check(top_falle[0][0]["doc_id"] == "homeoffice-2022", "Falle: BM25-Rang 1 = archivierte 2022er-Regelung")
check(
    any(c["chunk_id"] == "mobiles-arbeiten-2025#0" for c, _ in top_falle),
    "Falle: gültige 2025er-Richtlinie ist in den BM25-Top-8 (Kandidat für den Fix)",
)

top_code = suche_bm25("NL-410", k=3)
check(top_code[0][0]["doc_id"] == "kundenportal-2025", "Exakter Code 'NL-410': BM25-Rang 1 = Kundenportal")

top_slang = suche_bm25("Krieg ich Kohle zurück, wenn's Paket im Eimer ankommt?", k=3)
check(
    all(c["doc_id"] != "reklamation-2025" for c, _ in top_slang),
    "Umgangssprache: BM25 verfehlt das Reklamations-Dokument (Dense-Win-Case)",
)

top_sla = suche_bm25("Welche Zustellquote garantiert NL-EXPRESS-24?", k=3)
check(top_sla[0][0]["doc_id"] == "sla-2025", "SLA-Frage: BM25-Rang 1 = SLA-Übersicht")

# ── 4 · RRF ────────────────────────────────────────────────────────────────
print("4 · RRF (Worked Example aus VL 3)")
beispiel = rrf_fusion([["A", "B", "C"], ["B", "C", "A"]], k=60)
check(max(beispiel, key=beispiel.get) == "B", "B gewinnt (Rang 2 + Rang 1)")
check(abs(beispiel["B"] - (1 / 62 + 1 / 61)) < 1e-12, "RRF-Score von B exakt 1/62 + 1/61")
check(beispiel["A"] > beispiel["C"], "A (Rang 1+3) schlägt C (Rang 3+2)")

# ── 5 · Extraktive Antwort ────────────────────────────────────────────────
print("5 · Extraktive Antwort (Dramaturgie der Falle)")
chunk_2022 = next(c for c in chunks if c["chunk_id"] == "homeoffice-2022#0")
antwort, quelle = generiere_antwort(falle, [(chunk_2022, 1.0)])
check(
    "maximal zwei Tage" in antwort,
    f"Falsche Antwort enthält 'maximal zwei Tage' → »{antwort}«",
)
chunk_2025 = next(c for c in chunks if c["chunk_id"] == "mobiles-arbeiten-2025#0")
antwort_fix, _ = generiere_antwort(falle, [(chunk_2025, 1.0)])
check(
    "drei Tage" in antwort_fix,
    f"Korrigierte Antwort enthält 'drei Tage' → »{antwort_fix}«",
)
antwort_urlaub, _ = generiere_antwort(
    "Wie viele Urlaubstage habe ich pro Jahr?",
    [(next(c for c in chunks if c["chunk_id"] == "urlaub-2024#0"), 1.0)],
)
check("30 Urlaubstage" in antwort_urlaub, f"Urlaubs-Antwort enthält '30 Urlaubstage' → »{antwort_urlaub}«")

# ── 6 · Metriken ──────────────────────────────────────────────────────────
print("6 · Metriken")
dummy = [(chunk_2022, 0.9), (chunk_2025, 0.8)]
check(hit_at_k(dummy, ["mobiles-arbeiten-2025"], k=3) == 1.0, "Hit@3 erkennt Treffer auf Rang 2")
check(hit_at_k(dummy, ["mobiles-arbeiten-2025"], k=1) == 0.0, "Hit@1 verpasst Treffer auf Rang 2")
check(reciprocal_rank(dummy, ["mobiles-arbeiten-2025"]) == 0.5, "RR für Rang 2 = 0,5")
check(reciprocal_rank(dummy, ["sla-2025"]) == 0.0, "RR ohne Treffer = 0")

print(f"\nAlle {ok} Checks bestanden.")
print("Hinweis: Modellabhängige Pfade (Dense-Retrieval, Cross-Encoder) bitte einmal lokal/in Colab")
print("         komplett durchlaufen lassen, siehe MODERATIONSLEITFADEN, Abschnitt Generalprobe.")
