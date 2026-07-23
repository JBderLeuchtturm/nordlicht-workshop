"""Erzeugt die echten Benchmark-Zahlen fuer den Ergebnis-Block auf der Website.

Faehrt dieselbe Auswertung wie Notebook 04 (fuenf Ausbaustufen gegen das
Gold-Testset) und schreibt das Ergebnis nach docs/assets/benchmark.json.

Der Abschnitt "Beweisen statt behaupten" auf der Website bleibt so lange
ausgeblendet, bis diese Datei existiert. Damit steht auf dem Portal niemals
eine geschaetzte Zahl.

    python src_build/export_benchmark.py

Dauer: rund zwei Minuten (die Modelle muessen einmal geladen werden).
Benoetigt dieselbe Umgebung wie die Notebooks:

    pip install -r requirements.txt
"""

import datetime
import json
import re
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer

ROOT = Path(__file__).resolve().parent.parent
ZIEL = ROOT / "docs" / "assets" / "benchmark.json"


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


def main():
    dokumente = lade("nordlicht_corpus.json")["dokumente"]
    testset = lade("gold_testset.json")["fragen"]
    chunks = erstelle_chunks(dokumente)
    chunk_nach_id = {c["chunk_id"]: c for c in chunks}

    print(f"{len(dokumente)} Dokumente, {len(chunks)} Chunks, {len(testset)} Gold-Fragen.")
    print("Lade Modelle ...")
    embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    cross_encoder = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
    chunk_vektoren = embedder.encode([c["text"] for c in chunks], show_progress_bar=False)
    bm25 = BM25Okapi([tokenisiere(c["text"]) for c in chunks])

    def suche_dense(frage, k=3):
        fv = embedder.encode(frage)
        scores = chunk_vektoren @ fv / (
            np.linalg.norm(chunk_vektoren, axis=1) * np.linalg.norm(fv)
        )
        return [(chunks[i], float(scores[i])) for i in np.argsort(scores)[::-1][:k]]

    def suche_bm25(frage, k=3):
        scores = bm25.get_scores(tokenisiere(frage))
        return [(chunks[i], float(scores[i])) for i in np.argsort(scores)[::-1][:k]]

    def rrf_fusion(ranglisten, k=60):
        scores = {}
        for rangliste in ranglisten:
            for rang, cid in enumerate(rangliste, start=1):
                scores[cid] = scores.get(cid, 0.0) + 1.0 / (k + rang)
        return scores

    def suche_hybrid(frage, k=3, kandidaten_pro_liste=8):
        b = [c["chunk_id"] for c, _ in suche_bm25(frage, k=kandidaten_pro_liste)]
        d = [c["chunk_id"] for c, _ in suche_dense(frage, k=kandidaten_pro_liste)]
        beste = sorted(rrf_fusion([b, d]).items(), key=lambda x: -x[1])[:k]
        return [(chunk_nach_id[cid], s) for cid, s in beste]

    def reranke(frage, kandidaten, top_n=3):
        scores = cross_encoder.predict([(frage, c["text"]) for c in kandidaten])
        return [(kandidaten[i], float(scores[i])) for i in np.argsort(scores)[::-1][:top_n]]

    def suche_rerank(frage, k=3):
        return reranke(frage, [c for c, _ in suche_hybrid(frage, k=8)], top_n=k)

    def suche_advanced(frage, k=3):
        kand = [c for c, _ in suche_hybrid(frage, k=8) if c["status"] != "archiviert"]
        return reranke(frage, kand, top_n=k)

    konfigurationen = {
        "Dense": suche_dense,
        "BM25": suche_bm25,
        "Hybrid (RRF)": suche_hybrid,
        "+ Rerank": suche_rerank,
        "Advanced": suche_advanced,
    }

    stufen, rr_falle = [], {}
    for name, suche in konfigurationen.items():
        hits, rrs = [], []
        for frage in testset:
            treffer = suche(frage["frage"], k=3)
            rel = frage["relevante_docs"]
            hits.append(float(any(c["doc_id"] in rel for c, _ in treffer[:3])))
            rr = 0.0
            for rang, (c, _) in enumerate(treffer, start=1):
                if c["doc_id"] in rel:
                    rr = 1.0 / rang
                    break
            rrs.append(rr)
            if frage["kategorie"] == "falle":
                rr_falle[name] = rr
        stufen.append(
            {"name": name, "hit3": round(float(np.mean(hits)), 3), "mrr": round(float(np.mean(rrs)), 3)}
        )
        print(f"  {name:<14} Hit@3 {stufen[-1]['hit3']:.2f}   MRR {stufen[-1]['mrr']:.2f}")

    # Pointe automatisch aus den Messwerten formulieren, nichts hartkodieren.
    falle = next((f for f in testset if f["kategorie"] == "falle"), None)
    pointe = ""
    if falle:
        vorher = rr_falle.get("+ Rerank", 0.0)
        nachher = rr_falle.get("Advanced", 0.0)
        if nachher > vorher:
            pointe = (
                f"<b>Frage {falle['id']} ist der Grund für die letzte Stufe.</b> "
                f"Bis einschließlich Reranking landet dort die archivierte Fassung von 2022 vorn "
                f"(RR&nbsp;{vorher:.2f}); erst der Metadaten-Filter dreht das auf RR&nbsp;{nachher:.2f}. "
                f"Kein Retrieval-Trick hat das gelöst — nur gepflegte Metadaten."
            )
        else:
            pointe = (
                f"<b>Frage {falle['id']} ist die Kontrollfrage.</b> "
                f"Reranking erreicht dort RR&nbsp;{vorher:.2f}, mit Metadaten-Filter RR&nbsp;{nachher:.2f}."
            )

    ausgabe = {
        "erzeugt": datetime.date.today().isoformat(),
        "dokumente": len(dokumente),
        "chunks": len(chunks),
        "fragen": len(testset),
        "stufen": stufen,
        "pointe": pointe,
    }

    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(json.dumps(ausgabe, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nFertig: {ZIEL.relative_to(ROOT)}")
    print("Der Ergebnis-Block auf der Website erscheint jetzt automatisch.")


if __name__ == "__main__":
    main()
