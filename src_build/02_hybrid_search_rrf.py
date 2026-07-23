# %% [markdown]
# <div style="background:linear-gradient(135deg,#0B2545 0%,#13315C 100%);border-radius:14px;padding:24px 28px;color:#ffffff;font-family:Helvetica,Arial,sans-serif;margin-bottom:6px">
#   <div style="height:5px;width:130px;background:linear-gradient(90deg,#2EC4B6,#1C7293);border-radius:99px;margin-bottom:16px"></div>
#   <div style="font-size:11px;letter-spacing:2.5px;color:#9BE3D8;font-weight:700">NORDLICHT LOGISTIK · PROJEKT WISSENSASSISTENT</div>
#   <div style="font-size:27px;font-weight:700;margin-top:7px;line-height:1.2">Notebook 02 · Hybrid Search & RRF</div>
#   <div style="color:#C7D4E3;font-size:14px;margin-top:7px">BM25 + Vektorsuche, fair fusioniert über Reciprocal Rank Fusion</div>
#   <div style="color:#7E93AC;font-size:12.5px;margin-top:12px">Workshop RAG Advanced · WDSKI23A · DHBW Mannheim &nbsp;·&nbsp; ⏱ ~15 min · Übung 2</div>
# </div>
#
# **Workshop RAG Advanced · WDSKI23A · DHBW Mannheim**
#
# In Notebook 1 hat die reine Vektorsuche bei exakten Begriffen (Fehlercodes,
# Produktnamen) geschwächelt — Embeddings erfassen Bedeutung, keine Zeichenketten.
# Klassische **Keyword-Suche (BM25)** kann genau das. Dafür scheitert sie an
# Umgangssprache und Synonymen.
#
# **Plan:** Beide Verfahren parallel laufen lassen und die Ranglisten mit
# **Reciprocal Rank Fusion (RRF)** verschmelzen — das Beste aus beiden Welten.
#
# > ⏱️ ca. 20 Minuten · Übung 2 ist von euch zu lösen (`# TODO`).

# %% [markdown]
# ## 0 · Setup (kompakt aus Notebook 1)

# %%
# %pip install -q sentence-transformers rank_bm25

# %%
import json
import os
import re
import urllib.request

import numpy as np
from sentence_transformers import SentenceTransformer

DATA_URL = "https://raw.githubusercontent.com/JBderLeuchtturm/nordlicht-workshop/main/data"

# Portal-Adresse aus DATA_URL ableiten und Fortschritt melden koennen
import re as _re

_treffer = _re.search(r"githubusercontent\.com/([^/]+)/([^/]+)/", DATA_URL)
PORTAL = f"https://{_treffer.group(1)}.github.io/{_treffer.group(2)}" if _treffer else ""


def fortschritt(kennung, text=""):
    """Zeigt einen Link, der den Punkt im Workshop-Portal abhakt."""
    if PORTAL:
        zusatz = f" \u2014 {text}" if text else ""
        print(f"\n\u2611 Im Portal abhaken{zusatz}:")
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


dokumente = lade_json("nordlicht_corpus.json")["dokumente"]
chunks = erstelle_chunks(dokumente)

embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
chunk_vektoren = embedder.encode([c["text"] for c in chunks], show_progress_bar=True)


def suche_dense(frage, k=3):
    frage_vektor = embedder.encode(frage)
    scores = chunk_vektoren @ frage_vektor / (
        np.linalg.norm(chunk_vektoren, axis=1) * np.linalg.norm(frage_vektor)
    )
    reihenfolge = np.argsort(scores)[::-1][:k]
    return [(chunks[i], float(scores[i])) for i in reihenfolge]


print(f"Setup fertig: {len(chunks)} Chunks indexiert.")

# %% [markdown]
# ## 1 · BM25: Die bewährte Keyword-Suche
#
# **BM25** ("Best Matching 25") ist seit den 90ern der Standard klassischer Suchmaschinen.
# Grundidee (vgl. VL 3): Ein Dokument ist relevant, wenn es die Suchbegriffe
# **häufig** enthält (Term Frequency), die Begriffe **selten** im Gesamtkorpus sind
# (Inverse Document Frequency) — normalisiert um die Dokumentlänge.
#
# BM25 vergleicht **exakte Wortformen**. Genau deshalb ist es stark bei Codes,
# Produktnamen und Fachbegriffen — und blind für Synonyme.

# %%
from rank_bm25 import BM25Okapi


def tokenisiere(text):
    return re.findall(r"\w+", text.lower())


bm25 = BM25Okapi([tokenisiere(c["text"]) for c in chunks])


def suche_bm25(frage, k=3):
    scores = bm25.get_scores(tokenisiere(frage))
    reihenfolge = np.argsort(scores)[::-1][:k]
    return [(chunks[i], float(scores[i])) for i in reihenfolge]

# %% [markdown]
# ## 2 · Duell: BM25 vs. Vektorsuche
#
# Wir schicken die beiden Stresstest-Fragen aus Notebook 1 in **beide** Suchen:

# %%
def zeige_duell(frage, k=3):
    print(f"❓ {frage}\n")
    print(f"{'BM25 (Keyword)':<52} | Dense (Vektor)")
    print("-" * 105)
    for (c_b, s_b), (c_d, s_d) in zip(suche_bm25(frage, k), suche_dense(frage, k)):
        links = f"({s_b:5.2f}) {c_b['chunk_id']}"
        rechts = f"({s_d:.3f}) {c_d['chunk_id']}"
        print(f"{links:<52} | {rechts}")
    print()


zeige_duell("NL-410")                                            # exakter Code
zeige_duell("Krieg ich Kohle zurück, wenn's Paket im Eimer ankommt?")  # Umgangssprache

# %% [markdown]
# 💡 **Beobachtung:** Beim Fehlercode trifft BM25 sicher (exakter Token-Match, hoher Score-Abstand).
# Bei der umgangssprachlichen Frage findet BM25 fast nichts Brauchbares — kein einziges
# Wort der Frage steht im Reklamations-Dokument. Die Vektorsuche versteht dagegen die *Bedeutung*.
#
# **Zwei Ranglisten, zwei Stärken — aber welche gilt jetzt?**
#
# ## 3 · Das Fusionsproblem
#
# Die Scores sind **nicht vergleichbar**: BM25 liefert unbeschränkte Werte (0 bis >10),
# Kosinus-Ähnlichkeit liegt zwischen −1 und 1. Einfach addieren? Normalisieren? Beides fragil.
#
# **Reciprocal Rank Fusion (RRF)** (Cormack et al., SIGIR 2009) löst das elegant:
# Es ignoriert die Scores komplett und nutzt **nur die Rangpositionen**:
#
# $$\mathrm{RRF}(d) = \sum_{r \,\in\, \text{Ranglisten}} \frac{1}{k + \mathrm{rang}_r(d)}$$
#
# - $k = 60$ ist der robuste Default aus dem Original-Paper (dämpft den Einfluss der Spitzenplätze).
# - Dokumente, die in einer Liste fehlen, tragen aus dieser Liste einfach nichts bei.
# - Dokumente, die **in beiden Listen weit oben** stehen, gewinnen.

# %% [markdown]
# ## 4 · Übung 2: RRF implementieren 🛠️
#
# Implementiert die Fusion. Input: mehrere Ranglisten (je eine Liste von `chunk_id`s,
# Position 0 = Rang 1). Output: Dictionary `{chunk_id: rrf_score}`.
#
# *Hinweis: `enumerate(liste, start=1)` liefert gleich die Rangnummer mit.*

# %%
def rrf_fusion(ranglisten, k=60):
    """Reciprocal Rank Fusion über mehrere Ranglisten von chunk_ids."""
    scores = {}
    # === LÖSUNG ===
    for rangliste in ranglisten:
        for rang, chunk_id in enumerate(rangliste, start=1):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rang)
    # === ENDE LÖSUNG ===
    return scores

# %%
# ✅ Selbsttest mit dem Worked Example aus VL 3 (Folie "Reciprocal Rank Fusion"):
#    BM25-Rangliste: A, B, C   ·   Dense-Rangliste: B, C, A
beispiel = rrf_fusion([["A", "B", "C"], ["B", "C", "A"]], k=60)
gewinner = max(beispiel, key=beispiel.get)
for name, score in sorted(beispiel.items(), key=lambda x: -x[1]):
    print(f"  {name}: {score:.4f}")
assert gewinner == "B", "B steht auf Rang 2 und Rang 1 — Konsistenz muss belohnt werden!"
assert abs(beispiel["B"] - (1 / 62 + 1 / 61)) < 1e-9
print("✅ Übung 2 gelöst! B gewinnt — Konsistenz über beide Listen wird belohnt.")
fortschritt("u2", "Übung 2")

# %% [markdown]
# ## 5 · Hybrid Search zusammenbauen
#
# Jetzt stecken wir alles zusammen: beide Suchen liefern ihre Top-N, RRF fusioniert.

# %%
def suche_hybrid(frage, k=3, kandidaten_pro_liste=8):
    bm25_liste = [c["chunk_id"] for c, _ in suche_bm25(frage, k=kandidaten_pro_liste)]
    dense_liste = [c["chunk_id"] for c, _ in suche_dense(frage, k=kandidaten_pro_liste)]
    scores = rrf_fusion([bm25_liste, dense_liste])
    chunk_nach_id = {c["chunk_id"]: c for c in chunks}
    beste = sorted(scores.items(), key=lambda x: -x[1])[:k]
    return [(chunk_nach_id[cid], score) for cid, score in beste]


for frage in [
    "NL-410",
    "Krieg ich Kohle zurück, wenn's Paket im Eimer ankommt?",
    "Welche Zustellquote garantiert NL-EXPRESS-24?",
]:
    print(f"❓ {frage}")
    for platz, (c, score) in enumerate(suche_hybrid(frage), start=1):
        print(f"  {platz}. (RRF {score:.4f}) [{c['status']}] {c['titel']} · {c['chunk_id']}")
    print()

# %% [markdown]
# 💪 **Beide Problemfälle aus Notebook 1 sitzen jetzt** — ohne dass wir für den
# jeweils anderen Fall etwas verschlechtert hätten.
#
# ### 🤔 Diskutiert kurz (2 Minuten)
#
# 1. Ein RRF-Score von 0,0325 — ist das "gut"? Was sagt der Wert aus, was nicht?
#    *(Tipp: Er hängt nur von Rängen ab, nicht vom Inhalt — über verschiedene Fragen
#    hinweg ist er nicht vergleichbar.)*
# 2. Wir holen jetzt pro Liste 8 Kandidaten statt 3. Das erhöht den **Recall**
#    (mehr Relevantes im Topf) — was passiert dabei tendenziell mit der **Precision**
#    im Kontextfenster des LLM?
# 3. Reicht "das richtige Dokument ist *irgendwo* in den Top-8"? Wer entscheidet,
#    was davon wirklich ins LLM wandert?
#
# **→ Weiter in Notebook 3:** Ein **Cross-Encoder** liest Frage und Kandidaten
# *gemeinsam* und sortiert die Top-Kandidaten präzise — Reranking. Und dann zeigen
# wir euch eine Frage, an der selbst diese Luxus-Pipeline grandios scheitert …
