# %% [markdown]
# <div style="background:linear-gradient(135deg,#0B2545 0%,#13315C 100%);border-radius:14px;padding:24px 28px;color:#ffffff;font-family:Helvetica,Arial,sans-serif;margin-bottom:6px">
#   <div style="height:5px;width:130px;background:linear-gradient(90deg,#2EC4B6,#1C7293);border-radius:99px;margin-bottom:16px"></div>
#   <div style="font-size:11px;letter-spacing:2.5px;color:#9BE3D8;font-weight:700">NORDLICHT LOGISTIK · PROJEKT WISSENSASSISTENT</div>
#   <div style="font-size:27px;font-weight:700;margin-top:7px;line-height:1.2">Notebook 03 · Reranking & Metadaten</div>
#   <div style="color:#C7D4E3;font-size:14px;margin-top:7px">Cross-Encoder-Präzision — und die Grenze der Relevanz</div>
#   <div style="color:#7E93AC;font-size:12.5px;margin-top:12px">Workshop RAG Advanced · WDSKI23A · DHBW Mannheim &nbsp;·&nbsp; ⏱ ~25 min · Übungen 3 + 4</div>
# </div>
#
# **Workshop RAG Advanced · WDSKI23A · DHBW Mannheim**
#
# Die Hybrid Search aus Notebook 2 liefert gute **Kandidaten** — aber die Reihenfolge
# ist noch grob. Bevor der Kontext ins LLM wandert, soll eine zweite, präzisere Stufe
# die Top-Kandidaten neu sortieren: **Cross-Encoder Reranking** (vgl. VL 3).
#
# Und am Ende dieses Notebooks stellen wir unserer Luxus-Pipeline eine harmlos
# klingende Frage — und sie wird uns **selbstbewusst die falsche Antwort** geben.
#
# > ⏱️ ca. 25 Minuten · Übungen 3 und 4 sind von euch zu lösen (`# TODO`).

# %% [markdown]
# ## 0 · Setup (kompakt — die fertige Pipeline aus Notebook 1 + 2)

# %%
# %pip install -q sentence-transformers rank_bm25

# %%
import json
import os
import re
import urllib.request

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

DATA_URL = "https://raw.githubusercontent.com/DEIN-GITHUB-NAME/rag-advanced-workshop/main/data"


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
chunks = erstelle_chunks(dokumente)
chunk_nach_id = {c["chunk_id"]: c for c in chunks}

embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
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


def generiere_antwort(frage, treffer):
    """Deterministische 'Generierung': relevantester Satz aus dem Top-1-Chunk."""
    bester_chunk = treffer[0][0]
    frage_woerter = set(re.findall(r"\w+", frage.lower()))
    saetze = re.split(r"(?<=[.!?])\s+", bester_chunk["text"])
    bester_satz = max(
        saetze, key=lambda s: len(frage_woerter & set(re.findall(r"\w+", s.lower())))
    )
    return bester_satz, bester_chunk


def frage_pipeline(frage, suche, k=3, **kwargs):
    treffer = suche(frage, k=k, **kwargs)
    antwort, quelle = generiere_antwort(frage, treffer)
    print(f"❓ {frage}\n")
    for platz, (c, score) in enumerate(treffer, start=1):
        print(f"  {platz}. ({score:.4f}) [{c['status']}] {c['titel']} · {c['chunk_id']}")
    print(f"\n💬 Antwort: {antwort}")
    print(f"📄 Quelle: {quelle['titel']} ({quelle['jahr']}, Status: {quelle['status']})")


print(f"Setup fertig: {len(chunks)} Chunks indexiert.")

# %% [markdown]
# ## 1 · Bi-Encoder vs. Cross-Encoder
#
# Unser Embedding-Modell ist ein **Bi-Encoder**: Frage und Chunk werden *unabhängig*
# encodiert — schnell und vorberechenbar, aber die Vektoren "sehen" einander nie.
#
# Ein **Cross-Encoder** liest `[Frage] [SEP] [Chunk]` **gemeinsam** durch ein
# Transformer-Modell und gibt einen direkten Relevanz-Score aus. Das ist deutlich
# präziser, aber zu teuer für Millionen Chunks — deshalb das **zweistufige Muster**:
#
# > **Stage 1 (Recall):** Hybrid Search holt Top-N Kandidaten.
# > **Stage 2 (Precision):** Cross-Encoder rerankt, nur die Top-k gehen ans LLM.

# %%
from sentence_transformers import CrossEncoder

cross_encoder = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")

# Rohe Scores zum Gefühl bekommen: gleiche Frage, drei unterschiedlich passende Texte
frage = "Wie hoch ist der Dieselzuschlag?"
texte = [
    "Der Dieselzuschlag beträgt im laufenden Quartal 8,5 Prozent des Frachtpreises.",
    "Für Zustellungen auf Inseln fällt ein Inselzuschlag von 12 Euro je Sendung an.",
    "Alle Mitarbeitenden haben Anspruch auf 30 Urlaubstage pro Kalenderjahr.",
]
for text, score in zip(texte, cross_encoder.predict([(frage, t) for t in texte])):
    print(f"  Score {score:7.3f} → {text[:70]}…")

# %% [markdown]
# ## 2 · Übung 3: Reranking implementieren 🛠️
#
# Schreibt die zweite Stufe: Sie bekommt die Frage und eine Liste von Kandidaten-Chunks,
# lässt den Cross-Encoder alle `(Frage, Chunk-Text)`-Paare bewerten und gibt die
# `top_n` besten als `[(chunk, score), …]` absteigend sortiert zurück.
#
# *Hinweis: `cross_encoder.predict(liste_von_paaren)` liefert ein Array von Scores
# in derselben Reihenfolge wie die Eingabe.*

# %%
def reranke(frage, kandidaten, top_n=3):
    """Stage 2: Kandidaten mit dem Cross-Encoder neu sortieren."""
    # === LÖSUNG ===
    paare = [(frage, c["text"]) for c in kandidaten]
    scores = cross_encoder.predict(paare)
    reihenfolge = np.argsort(scores)[::-1][:top_n]
    return [(kandidaten[i], float(scores[i])) for i in reihenfolge]
    # === ENDE LÖSUNG ===

# %%
# ✅ Selbsttest — der Kandidat mit dem Dieselzuschlag muss nach dem Reranking vorn liegen.
test_kandidaten = [c for c in chunks if c["doc_id"] in ("urlaub-2024", "preise-zuschlaege-2025")]
test_ergebnis = reranke("Wie hoch ist der Dieselzuschlag?", test_kandidaten, top_n=3)
assert len(test_ergebnis) == 3, "Es sollen genau top_n Ergebnisse zurückkommen"
assert test_ergebnis[0][1] >= test_ergebnis[1][1], "Ergebnisse müssen absteigend sortiert sein"
assert "Dieselzuschlag" in test_ergebnis[0][0]["text"], "Der Dieselzuschlag-Chunk muss gewinnen"
print("✅ Übung 3 gelöst! Top-Chunk:", test_ergebnis[0][0]["chunk_id"])

# %% [markdown]
# ## 3 · Die Advanced-Pipeline: Hybrid → Rerank → Antwort

# %%
def suche_advanced(frage, k=3, nur_gueltige=False):
    """Stage 1: Hybrid Search (Top-8) → optionaler Filter → Stage 2: Reranking (Top-k)."""
    kandidaten = [c for c, _ in suche_hybrid(frage, k=8)]
    if nur_gueltige:
        # === LÖSUNG ===
        kandidaten = [c for c in kandidaten if c["status"] != "archiviert"]
        # === ENDE LÖSUNG ===
    return reranke(frage, kandidaten, top_n=k)


frage_pipeline("Welche Zustellquote garantiert NL-EXPRESS-24?", suche_advanced)

# %% [markdown]
# Sauber sortiert, richtige Antwort, beste Quelle ganz oben. Unsere Pipeline hat jetzt
# alles, was der Stand der Technik empfiehlt: **Hybrid Search + RRF + Cross-Encoder.**
#
# ## 4 · 🚨 Der Störfall
#
# Eine neue Kollegin fragt den Assistenten etwas völlig Alltägliches:

# %%
frage_pipeline("Wie viele Tage Homeoffice sind bei NordLicht erlaubt?", suche_advanced)

# %% [markdown]
# ### Moment. Lest die Antwort noch einmal. Und dann die Quelle.
#
# Die Pipeline antwortet **"maximal zwei Tage"** — aus der **archivierten Regelung
# von 2022**. Die gültige Richtlinie von 2025 erlaubt **drei Tage** ortsflexibles
# Arbeiten. Die Antwort ist flüssig, mit Quellenangabe, völlig überzeugend — **und falsch.**
#
# ### 🤔 Diskutiert: Warum passiert das? (3 Minuten)
#
# Schaut euch die Trefferliste oben an und die beiden Personal-Dokumente im Korpus.
#
# <details><summary>Auflösung (erst nach der Diskussion aufklappen)</summary>
#
# Alle drei Stufen haben **exakt das getan, wofür sie gebaut sind**:
#
# - **BM25** liebt das Dokument von 2022: Dort steht wörtlich und mehrfach "Homeoffice".
#   Die Richtlinie von 2025 spricht fast nur von "mobilem Arbeiten".
# - **Dense Retrieval** findet 2022 ebenfalls hochrelevant — semantisch geht es genau
#   um das Gefragte.
# - Der **Cross-Encoder** bewertet *literale Relevanz zwischen Frage und Text*.
#   Der 2022er-Text beantwortet die Frage wortwörtlich perfekt. Dass er **nicht mehr
#   gilt**, steht nicht im Text-Frage-Verhältnis — und nur das sieht der Cross-Encoder.
#
# **Kernerkenntnis: Relevanz ≠ Gültigkeit.** Retrieval-Qualität allein garantiert
# keine korrekte Antwort. Die Information "archiviert" existiert — aber in den
# **Metadaten**, und die hat bisher niemand angeschaut.
# </details>

# %% [markdown]
# ## 5 · Übung 4: Der Fix — Metadaten ernst nehmen 🛠️
#
# Unsere Chunks tragen längst `status` und `jahr` mit sich herum. Ergänzt in
# `suche_advanced` (Abschnitt 3, Parameter `nur_gueltige`) den Filter:
# Wenn `nur_gueltige=True`, sollen **archivierte Chunks aus den Kandidaten
# entfernt werden, bevor** der Cross-Encoder rerankt.
#
# Geht dann zurück zu dieser Zelle und prüft das Ergebnis:

# %%
frage_pipeline("Wie viele Tage Homeoffice sind bei NordLicht erlaubt?", suche_advanced, nur_gueltige=True)

# %%
# ✅ Selbsttest für Übung 4
ergebnis = suche_advanced("Wie viele Tage Homeoffice sind bei NordLicht erlaubt?", nur_gueltige=True)
assert all(c["status"] != "archiviert" for c, _ in ergebnis), "Archivierte Chunks müssen rausgefiltert sein"
assert ergebnis[0][0]["doc_id"] == "mobiles-arbeiten-2025", "Jetzt muss die gültige Richtlinie von 2025 gewinnen"
print("✅ Übung 4 gelöst! Die Pipeline antwortet jetzt aus der gültigen Richtlinie.")

# %% [markdown]
# ## 6 · Was nehmen wir mit?
#
# - **Jede Stufe optimiert nur ihr eigenes Kriterium.** BM25 zählt Wortformen, der
#   Bi-Encoder misst Bedeutungsnähe, der Cross-Encoder literale Relevanz. *Gültigkeit,
#   Aktualität, Zuständigkeit* — all das steht in **Metadaten**, nicht im Text.
# - **Der Fix war eine Zeile** — aber nur, weil die Metadaten gepflegt waren. In echten
#   Unternehmen ist genau das der Engpass: Wer setzt den Status "archiviert"? Was ist
#   mit Dokumenten, die sich widersprechen, ohne dass eines archiviert ist?
# - **Alternativen zum harten Filter:** Aktualität als Boost in die Score-Fusion
#   einrechnen, Zeitbezug aus der Frage erkennen ("Was galt 2022?" braucht das Archiv!),
#   oder dem LLM beide Fassungen mit Datum geben und den Konflikt benennen lassen.
#
# **→ Weiter in Notebook 4:** Ein Einzelfall ist noch kein Beweis. Wir messen jetzt
# systematisch auf 15 Gold-Fragen, was jede Ausbaustufe wirklich bringt.
