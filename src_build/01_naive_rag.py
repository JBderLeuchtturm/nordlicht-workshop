# %% [markdown]
# <div style="background:linear-gradient(135deg,#0B2545 0%,#13315C 100%);border-radius:14px;padding:24px 28px;color:#ffffff;font-family:Helvetica,Arial,sans-serif;margin-bottom:6px">
#   <div style="height:5px;width:130px;background:linear-gradient(90deg,#2EC4B6,#1C7293);border-radius:99px;margin-bottom:16px"></div>
#   <div style="font-size:11px;letter-spacing:2.5px;color:#9BE3D8;font-weight:700">NORDLICHT LOGISTIK · PROJEKT WISSENSASSISTENT</div>
#   <div style="font-size:27px;font-weight:700;margin-top:7px;line-height:1.2">Notebook 01 · Naive RAG</div>
#   <div style="color:#C7D4E3;font-size:14px;margin-top:7px">Die Basis-Pipeline: Chunking → Embeddings → Vektorsuche</div>
#   <div style="color:#7E93AC;font-size:12.5px;margin-top:12px">Workshop RAG Advanced · WDSKI23A · DHBW Mannheim &nbsp;·&nbsp; ⏱ ~15 min · Übung 1</div>
# </div>
#
# **Workshop RAG Advanced · WDSKI23A · DHBW Mannheim**
#
# Ihr seid das neue Data-Team der **NordLicht Logistik GmbH** (Hamburg, 850 Mitarbeitende).
# Der Kundenservice und die Personalabteilung ertrinken in Rückfragen, deren Antworten
# längst in internen Dokumenten stehen: SLAs, Richtlinien, Preisblätter, Handbücher.
#
# **Auftrag:** Ein Assistent, der Fragen direkt aus diesen Dokumenten beantwortet — eine
# RAG-Pipeline (Retrieval-Augmented Generation).
#
# In diesem Notebook baut ihr die **naive** Variante: Chunking → Embeddings → Vektorsuche → Antwort.
# In den Notebooks 2 und 3 werdet ihr sehen, wo sie versagt — und sie Schritt für Schritt aufrüsten.
#
# > ⏱️ ca. 20 Minuten · Übung 1 ist von euch zu lösen (`# TODO`).

# %% [markdown]
# ## 0 · Setup
#
# Läuft in **Google Colab** (empfohlen, nichts zu installieren außer zwei Paketen) oder lokal.
# Alles ist Open Source und kostenlos — keine API-Keys, keine Accounts bei Anbietern nötig.

# %%
# %pip install -q sentence-transformers rank_bm25

# %%
import json
import os
import re
import urllib.request

import numpy as np

# Falls ihr die Daten nicht lokal habt (z. B. in Colab), werden sie von GitHub geladen.
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
    """Lädt eine JSON-Datei: erst lokal aus data/, sonst von DATA_URL."""
    for pfad in (os.path.join("..", "data", dateiname), os.path.join("data", dateiname)):
        if os.path.exists(pfad):
            with open(pfad, encoding="utf-8") as f:
                return json.load(f)
    try:
        with urllib.request.urlopen(f"{DATA_URL}/{dateiname}") as antwort:
            return json.loads(antwort.read().decode("utf-8"))
    except Exception as fehler:
        raise FileNotFoundError(
            f"'{dateiname}' weder lokal noch unter {DATA_URL} gefunden.\n"
            "→ Lade den Ordner 'data/' mit hoch oder trage oben die richtige DATA_URL ein."
        ) from fehler


korpus = lade_json("nordlicht_corpus.json")
dokumente = korpus["dokumente"]
print(f"{len(dokumente)} Dokumente geladen — {korpus['unternehmen']}")
for dok in dokumente:
    print(f"  [{dok['status']:>10}] {dok['jahr']} · {dok['titel']}")

# %% [markdown]
# 👀 **Schaut euch die Liste an:** Zu einem Thema gibt es offenbar zwei Dokumente aus
# verschiedenen Jahren, eines davon *archiviert*. Merkt euch das — es wird in Notebook 3 wichtig.

# %% [markdown]
# ## 1 · Chunking: Dokumente in Häppchen teilen
#
# Embedding-Modelle verarbeiten begrenzte Textlängen, und kleinere Einheiten lassen sich
# präziser wiederfinden. Wir chunken hier bewusst simpel: **ein Absatz = ein Chunk**.
# Jeder Chunk behält die Metadaten seines Dokuments (`status`, `jahr`, …) — auch das
# wird später noch entscheidend.
#
# *Diskussion für später: Was wäre bei 50-seitigen Verträgen anders? (Overlap, Satzgrenzen,
# strukturbasiertes Chunking — vgl. VL 3.)*

# %%
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


chunks = erstelle_chunks(dokumente)
print(f"{len(dokumente)} Dokumente → {len(chunks)} Chunks")
print("\nBeispiel-Chunk:")
print(json.dumps(chunks[0], ensure_ascii=False, indent=2))

# %% [markdown]
# ## 2 · Embeddings: Text wird zum Vektor
#
# Wir nutzen einen **Bi-Encoder** (`paraphrase-multilingual-MiniLM-L12-v2`):
# ein kleines, mehrsprachiges Open-Source-Modell (~470 MB, läuft auf CPU).
# Er bildet jeden Chunk **unabhängig** auf einen 384-dimensionalen Vektor ab —
# deshalb können wir alle Chunk-Vektoren **einmal vorberechnen**.
#
# ⏳ Der erste Aufruf lädt das Modell herunter (1–2 Minuten, einmalig).

# %%
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
chunk_vektoren = embedder.encode([c["text"] for c in chunks], show_progress_bar=True)
print(f"Matrix der Chunk-Vektoren: {chunk_vektoren.shape}  (Chunks × Dimensionen)")
fortschritt("setup", "Setup erledigt")

# %% [markdown]
# ## 3 · Übung 1: Vektorsuche implementieren 🛠️
#
# Jetzt seid ihr dran. Die Suche funktioniert so:
#
# 1. Die **Frage** wird mit demselben Modell in einen Vektor umgewandelt.
# 2. Für jeden Chunk-Vektor berechnen wir die **Kosinus-Ähnlichkeit** zur Frage:
#    $\cos(\vec{a}, \vec{b}) = \dfrac{\vec{a} \cdot \vec{b}}{\lVert\vec{a}\rVert \, \lVert\vec{b}\rVert}$
# 3. Die **k Chunks mit den höchsten Scores** werden zurückgegeben.
#
# *Hinweise: `np.dot(a, b)` ist das Skalarprodukt, `np.linalg.norm(a)` die Länge eines
# Vektors, `np.argsort(scores)` liefert Indizes aufsteigend sortiert (`[::-1]` dreht um).*

# %%
def kosinus_aehnlichkeit(a, b):
    """Kosinus-Ähnlichkeit zweier Vektoren (float zwischen -1 und 1)."""
    # === LÖSUNG ===
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    # === ENDE LÖSUNG ===


def suche_dense(frage, k=3):
    """Gibt die k ähnlichsten Chunks zur Frage zurück: Liste von (chunk, score),
    absteigend nach Score sortiert."""
    frage_vektor = embedder.encode(frage)
    # === LÖSUNG ===
    scores = [kosinus_aehnlichkeit(frage_vektor, v) for v in chunk_vektoren]
    reihenfolge = np.argsort(scores)[::-1][:k]
    return [(chunks[i], float(scores[i])) for i in reihenfolge]
    # === ENDE LÖSUNG ===

# %%
# ✅ Selbsttest — läuft dieser Block ohne Fehler, ist Übung 1 gelöst.
v = np.array([1.0, 0.0])
assert abs(kosinus_aehnlichkeit(v, v) - 1.0) < 1e-9, "Identische Vektoren müssen Score 1 haben"
assert abs(kosinus_aehnlichkeit(v, np.array([0.0, 1.0]))) < 1e-9, "Orthogonale Vektoren müssen Score 0 haben"

treffer = suche_dense("Wie viele Urlaubstage habe ich pro Jahr?", k=3)
assert len(treffer) == 3, "Es sollen genau k Treffer zurückkommen"
assert treffer[0][1] >= treffer[1][1] >= treffer[2][1], "Treffer müssen absteigend sortiert sein"
print("✅ Übung 1 gelöst! Bester Treffer:", treffer[0][0]["titel"])
fortschritt("u1", "Übung 1")

# %% [markdown]
# ## 4 · Generierung: Vom Chunk zur Antwort
#
# In einer echten Pipeline würden die Top-Chunks jetzt als Kontext in einen
# **erweiterten Prompt** an ein LLM gehen (vgl. VL 3). Damit der Workshop ohne
# API-Kosten und für alle reproduzierbar bleibt, simulieren wir die Generierung
# **deterministisch**: Aus dem besten Chunk wird der Satz mit der größten
# Wortüberlappung zur Frage extrahiert.
#
# Wichtig zu verstehen: **Die Generierung kann nur so gut sein wie das Retrieval.**
# Steht die falsche Information im Kontext, antwortet auch das beste LLM falsch.

# %%
def baue_prompt(frage, treffer):
    """So sähe der erweiterte Prompt für ein echtes LLM aus."""
    kontext = "\n\n".join(
        f"[Quelle: {c['titel']} ({c['jahr']}, Status: {c['status']})]\n{c['text']}"
        for c, _ in treffer
    )
    return (
        "Beantworte die Frage ausschließlich anhand des folgenden Kontexts.\n\n"
        f"### Kontext\n{kontext}\n\n### Frage\n{frage}\n\n### Antwort\n"
    )


def generiere_antwort(frage, treffer):
    """Deterministische 'Generierung': relevantester Satz aus dem Top-1-Chunk."""
    bester_chunk = treffer[0][0]
    frage_woerter = set(re.findall(r"\w+", frage.lower()))
    saetze = re.split(r"(?<=[.!?])\s+", bester_chunk["text"])
    bester_satz = max(
        saetze, key=lambda s: len(frage_woerter & set(re.findall(r"\w+", s.lower())))
    )
    return bester_satz, bester_chunk


def frage_pipeline(frage, suche, k=3, zeige_treffer=True):
    treffer = suche(frage, k=k)
    antwort, quelle = generiere_antwort(frage, treffer)
    print(f"❓ {frage}\n")
    if zeige_treffer:
        for platz, (c, score) in enumerate(treffer, start=1):
            print(f"  {platz}. ({score:.3f}) [{c['status']}] {c['titel']} · {c['chunk_id']}")
        print()
    print(f"💬 Antwort: {antwort}")
    print(f"📄 Quelle: {quelle['titel']} ({quelle['jahr']}, Status: {quelle['status']})")

# %% [markdown]
# ## 5 · Die Pipeline im Einsatz
#
# Erst ein Blick auf den erweiterten Prompt, dann zwei Fragen an die Pipeline:

# %%
print(baue_prompt("Wie viele Urlaubstage habe ich pro Jahr?", suche_dense("Wie viele Urlaubstage habe ich pro Jahr?", k=2))[:600], "…")

# %%
frage_pipeline("Wie viele Urlaubstage habe ich pro Jahr?", suche_dense)

# %%
frage_pipeline("Welche Zustellquote garantiert NL-EXPRESS-24?", suche_dense)

# %% [markdown]
# 🎉 Sieht gut aus! Naives RAG funktioniert für viele Fragen erstaunlich gut.
#
# ## 6 · Stresstest: Wo die Vektorsuche ins Schwitzen kommt
#
# Probiert jetzt zwei fiese Fälle. Schaut dabei **auf die komplette Trefferliste
# und die Scores**, nicht nur auf die Antwort:

# %%
# Fall A: Ein Kunde tippt nur einen kryptischen Fehlercode ein.
frage_pipeline("NL-410", suche_dense)

# %%
# Fall B: Sehr umgangssprachliche Formulierung.
frage_pipeline("Krieg ich Kohle zurück, wenn's Paket im Eimer ankommt?", suche_dense)
fortschritt("nb1", "Notebook 01 durchgearbeitet")

# %% [markdown]
# ### 🤔 Diskutiert kurz zu zweit (2 Minuten)
#
# 1. Wie nah liegen die Scores der Top-3 beieinander? Könnt ihr aus dem Score ablesen,
#    ob ein Treffer *wirklich* relevant ist — oder nur *am wenigsten unpassend*?
# 2. Embeddings erfassen **Bedeutung**, keine exakten Zeichenketten. Bei welchem der
#    beiden Fälle würdet ihr einer klassischen **Keyword-Suche** mehr zutrauen? Warum?
# 3. Was passiert wohl bei Fragen, für die es **mehrere ähnliche Dokumente** im Korpus gibt?
#
# **→ Weiter in Notebook 2:** Wir kombinieren die Vektorsuche mit BM25-Keyword-Suche
# zu einer **Hybrid Search** — und lernen, wie man zwei völlig verschiedene
# Ranglisten fair fusioniert (RRF).
