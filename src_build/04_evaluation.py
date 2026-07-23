# %% [markdown]
# <div style="background:linear-gradient(135deg,#0B2545 0%,#13315C 100%);border-radius:14px;padding:24px 28px;color:#ffffff;font-family:Helvetica,Arial,sans-serif;margin-bottom:6px">
#   <div style="height:5px;width:130px;background:linear-gradient(90deg,#2EC4B6,#1C7293);border-radius:99px;margin-bottom:16px"></div>
#   <div style="font-size:11px;letter-spacing:2.5px;color:#9BE3D8;font-weight:700">NORDLICHT LOGISTIK · PROJEKT WISSENSASSISTENT</div>
#   <div style="font-size:27px;font-weight:700;margin-top:7px;line-height:1.2">Notebook 04 · Evaluation</div>
#   <div style="color:#C7D4E3;font-size:14px;margin-top:7px">Fünf Ausbaustufen, fünfzehn Gold-Fragen, zwei Metriken</div>
#   <div style="color:#7E93AC;font-size:12.5px;margin-top:12px">Workshop RAG Advanced · WDSKI23A · DHBW Mannheim &nbsp;·&nbsp; ca. 10 min · Demo</div>
# </div>
#
# **Workshop RAG Advanced · WDSKI23A · DHBW Mannheim**
#
# In Notebook 3 haben wir *eine* Frage gesehen, die schiefging. Aber Architekturentscheidungen
# trifft man nicht anhand von Anekdoten. Wir messen jetzt auf einem **Gold-Testset**
# (15 Fragen mit bekannten Quell-Dokumenten), was jede Ausbaustufe tatsächlich bringt:
#
# | Konfiguration | Stufen |
# |---|---|
# | Dense | nur Vektorsuche (Notebook 1) |
# | BM25 | nur Keyword-Suche |
# | Hybrid | BM25 + Dense + RRF (Notebook 2) |
# | Hybrid + Rerank | + Cross-Encoder (Notebook 3) |
# | **Advanced** | + Metadaten-Filter (Notebook 3, Übung 4) |
#
# > Dauer ca. 10 Minuten · Dieses Notebook ist eine Demo, keine Übung. Gern selbst durchklicken.

# %% [markdown]
# ## 0 · Setup (die komplette Pipeline aus den Notebooks 1 bis 3)

# %%
# %pip install -q sentence-transformers rank_bm25 pandas matplotlib

# %%
import json
import os
import re
import urllib.request

import numpy as np
import pandas as pd
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer

DATA_URL = "https://raw.githubusercontent.com/JBderLeuchtturm/nordlicht-workshop/main/data"

# Portal-Adresse aus DATA_URL ableiten und Fortschritt melden koennen
import re as _re

_treffer = _re.search(r"githubusercontent\.com/([^/]+)/([^/]+)/", DATA_URL)
PORTAL = f"https://{_treffer.group(1)}.github.io/{_treffer.group(2)}" if _treffer else ""


def fortschritt(kennung, text=""):
    """Zeigt einen Link, der den Punkt im Workshop-Portal abhakt."""
    if PORTAL:
        zusatz = f": {text}" if text else ""
        print(f"\nIm Portal abhaken{zusatz}:")
        print(f"   {PORTAL}/?fertig={kennung}")



def lade_json(dateiname):
    for pfad in (os.path.join("..", "data", dateiname), os.path.join("data", dateiname)):
        if os.path.exists(pfad):
            with open(pfad, encoding="utf-8") as f:
                return json.load(f)
    with urllib.request.urlopen(f"{DATA_URL}/{dateiname}") as antwort:
        return json.loads(antwort.read().decode("utf-8"))


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


dokumente = lade_json("nordlicht_corpus.json")["dokumente"]
testset = lade_json("gold_testset.json")["fragen"]
chunks = erstelle_chunks(dokumente)
chunk_nach_id = {c["chunk_id"]: c for c in chunks}

embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
cross_encoder = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
chunk_vektoren = embedder.encode([c["text"] for c in chunks], show_progress_bar=True)
bm25 = BM25Okapi([tokenisiere(c["text"]) for c in chunks])


def suche_dense(frage, k=3):
    frage_vektor = embedder.encode(frage)
    scores = chunk_vektoren @ frage_vektor / (
        np.linalg.norm(chunk_vektoren, axis=1) * np.linalg.norm(frage_vektor)
    )
    reihenfolge = np.argsort(scores)[::-1][:k]
    return [(chunks[i], float(scores[i])) for i in reihenfolge]


def suche_bm25(frage, k=3):
    scores = bm25.get_scores(tokenisiere(frage))
    reihenfolge = np.argsort(scores)[::-1][:k]
    return [(chunks[i], float(scores[i])) for i in reihenfolge]


def rrf_fusion(ranglisten, k=60):
    scores = {}
    for rangliste in ranglisten:
        for rang, chunk_id in enumerate(rangliste, start=1):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rang)
    return scores


def suche_hybrid(frage, k=3, kandidaten_pro_liste=8):
    bm25_liste = [c["chunk_id"] for c, _ in suche_bm25(frage, k=kandidaten_pro_liste)]
    dense_liste = [c["chunk_id"] for c, _ in suche_dense(frage, k=kandidaten_pro_liste)]
    scores = rrf_fusion([bm25_liste, dense_liste])
    beste = sorted(scores.items(), key=lambda x: -x[1])[:k]
    return [(chunk_nach_id[cid], score) for cid, score in beste]


def reranke(frage, kandidaten, top_n=3):
    paare = [(frage, c["text"]) for c in kandidaten]
    scores = cross_encoder.predict(paare)
    reihenfolge = np.argsort(scores)[::-1][:top_n]
    return [(kandidaten[i], float(scores[i])) for i in reihenfolge]


def suche_rerank(frage, k=3):
    return reranke(frage, [c for c, _ in suche_hybrid(frage, k=8)], top_n=k)


def suche_advanced(frage, k=3):
    kandidaten = [c for c, _ in suche_hybrid(frage, k=8)]
    kandidaten = [c for c in kandidaten if c["status"] != "archiviert"]
    return reranke(frage, kandidaten, top_n=k)


print(f"Setup fertig: {len(chunks)} Chunks, {len(testset)} Gold-Fragen.")

# %% [markdown]
# ## 1 · Metriken: Hit@3 und MRR
#
# Das Testset kennt zu jeder Frage die **relevanten Dokumente**. Wir messen auf
# Dokument-Ebene:
#
# - **Hit@3**: Steht mindestens ein relevantes Dokument in den Top-3? *(Anteil der
#   Fragen, bei denen das LLM die richtige Information überhaupt im Kontext hätte.)*
# - **MRR** (Mean Reciprocal Rank): Auf welchem Rang steht der erste relevante
#   Treffer? Rang 1 → 1,0 · Rang 2 → 0,5 · Rang 3 → 0,33 · nicht dabei → 0.
#   *(Belohnt, dass die beste Quelle ganz oben steht, genau dort liest unsere Generierung.)*

# %%
def hit_at_k(treffer, relevante_docs, k=3):
    return float(any(c["doc_id"] in relevante_docs for c, _ in treffer[:k]))


def reciprocal_rank(treffer, relevante_docs):
    for rang, (c, _) in enumerate(treffer, start=1):
        if c["doc_id"] in relevante_docs:
            return 1.0 / rang
    return 0.0

# %% [markdown]
# ## 2 · Der Benchmark
#
# Alle 5 Konfigurationen × 15 Fragen. Auf CPU dauert das etwa eine Minute
# (der Cross-Encoder bewertet 2 × 15 × 8 Paare).

# %%
konfigurationen = {
    "Dense": suche_dense,
    "BM25": suche_bm25,
    "Hybrid (RRF)": suche_hybrid,
    "Hybrid + Rerank": suche_rerank,
    "Advanced (+ Filter)": suche_advanced,
}

zeilen = []
details = {}
for name, suche in konfigurationen.items():
    hits, rrs = [], []
    for frage in testset:
        treffer = suche(frage["frage"], k=3)
        hits.append(hit_at_k(treffer, frage["relevante_docs"]))
        rrs.append(reciprocal_rank(treffer, frage["relevante_docs"]))
        details[(name, frage["id"])] = treffer
    zeilen.append({"Konfiguration": name, "Hit@3": np.mean(hits), "MRR": np.mean(rrs)})

ergebnis = pd.DataFrame(zeilen).set_index("Konfiguration")
ergebnis.style.format("{:.2f}").background_gradient(cmap="Greens", axis=None)

# %%
import matplotlib.pyplot as plt

achse = ergebnis.plot.bar(rot=15, figsize=(9, 4.5), color=["#4c72b0", "#dd8452"])
achse.set_ylim(0, 1.05)
achse.set_ylabel("Score (0 bis 1)")
achse.set_title("Retrieval-Qualität je Ausbaustufe · 15 Gold-Fragen · NordLicht-Korpus")
for container in achse.containers:
    achse.bar_label(container, fmt="%.2f", fontsize=9)
plt.tight_layout()
plt.savefig("benchmark_ergebnis.png", dpi=150)
fortschritt("nb4", "Evaluation gesehen")
plt.show()

# %% [markdown]
# ## 3 · Blick in die Details: Wo genau gewinnt welche Stufe?
#
# Aggregierte Zahlen verstecken die Geschichten. Schauen wir uns die Fragen an,
# bei denen sich die Konfigurationen **unterscheiden**:

# %%
for frage in testset:
    raenge = {}
    for name in konfigurationen:
        rr = reciprocal_rank(details[(name, frage["id"])], frage["relevante_docs"])
        raenge[name] = rr
    if len(set(raenge.values())) > 1:  # nur Fragen mit Unterschieden zeigen
        print(f"Frage {frage['id']:>2} ({frage['kategorie']}): {frage['frage']}")
        for name, rr in raenge.items():
            symbol = "Rang 1 " if rr == 1.0 else ("Treffer" if rr > 0 else "daneben")
            print(f"    [{symbol}] {name:<22} RR = {rr:.2f}")
        print()

# %% [markdown]
# Achtet besonders auf **Frage 13** (Kategorie `falle`): Sie ist der Grund, warum
# "Hybrid + Rerank" trotz Cross-Encoder nicht auf 100 % kommt, und warum erst der
# Metadaten-Filter das Problem löst. Genau diese Zahlen gehören auf die Ergebnis-Folie.
#
# ## 4 · Einordnung: Von unseren Metriken zu RAGAS
#
# Unsere Messung ist bewusst **LLM-frei** (kostenlos, deterministisch, sekundenschnell).
# Sie bewertet aber nur das **Retrieval**. Das Framework **RAGAS** (vgl. VL 3) misst
# zusätzlich die **Generierung**, braucht dafür jedoch ein LLM als Judge (= API-Kosten):
#
# | Unsere Metrik | RAGAS-Verwandter | Frage dahinter |
# |---|---|---|
# | Hit@3 | Context Recall | Ist die nötige Information im Kontext? |
# | MRR | Context Precision (Ranking-Aspekt) | Steht das Relevante oben, ohne Ballast? |
# | (kein Pendant) | Faithfulness | Hält sich die Antwort an den Kontext? |
# | (kein Pendant) | Answer Relevancy | Beantwortet die Antwort die Frage? |
#
# Die **Diagnose-Logik** bleibt dieselbe: niedriger Recall → Chunking/Hybrid/k prüfen;
# viel Irrelevantes im Kontext → Reranking; Antwort ignoriert Kontext → Prompt/Modell.
# Und unser Störfall zeigt eine Lücke *jeder* dieser Metriken: **Frage 13 hätte vor dem
# Filter perfekte Retrieval-Scores gehabt**, das gefundene Dokument war ja "relevant",
# nur eben veraltet. Faktische Korrektheit muss man **gegen Gold-Antworten** prüfen,
# nicht nur gegen Relevanz.
#
# ## 5 · Fazit für die Praxis
#
# 1. **Evaluation zuerst bauen, dann optimieren.** Ohne Testset ist jede
#    Architekturdiskussion Geschmackssache.
# 2. **Jede Stufe hat einen messbaren, spezifischen Beitrag**, und keine ersetzt
#    gepflegte Metadaten.
# 3. In CI/CD gehört so ein Benchmark als **Regressionstest**: Jede Änderung an
#    Chunking, Modellen oder Prompts läuft gegen das Gold-Set (vgl. VL 3, CI-Integration).
