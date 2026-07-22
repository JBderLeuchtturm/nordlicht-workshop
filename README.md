# Workshop „RAG Advanced" — Hands-on mit Notebooks

**WDSKI23A · DHBW Mannheim · Gruppenleistung Workshop (80 %)**

Ihr baut in vier Jupyter-Notebooks Schritt für Schritt die RAG-Pipeline der fiktiven
**NordLicht Logistik GmbH** aus — von naivem Vektor-Retrieval bis zur Advanced-Pipeline
mit Hybrid Search, Reciprocal Rank Fusion, Cross-Encoder Reranking, Metadaten-Filter
und einer Evaluation auf einem Gold-Testset.

**Höhepunkt:** Eine Frage, bei der selbst die voll ausgebaute Pipeline selbstbewusst
die *falsche* Antwort gibt — und was das über Relevanz vs. Gültigkeit lehrt.

## 💸 Kostenlos-Garantie

Alle Teilnehmenden können mitmachen, **ohne irgendetwas zu kaufen**:

- Nur Open-Source-Modelle von Hugging Face (Download ohne Account möglich):
  `paraphrase-multilingual-MiniLM-L12-v2` (Bi-Encoder) und
  `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1` (Reranker), zusammen ca. 1 GB.
- Keine API-Keys, keine Kreditkarte, keine Registrierung bei LLM-Anbietern.
- Die Generierung ist bewusst deterministisch simuliert (Satz-Extraktion) — der
  „erweiterte Prompt" für ein echtes LLM wird trotzdem gezeigt und erklärt.
- Läuft komplett auf CPU. Google Colab (kostenlos, nur Google-Konto nötig) **oder**
  lokal mit Python ≥ 3.10.

## 🚀 Setup

### Variante A · Google Colab (empfohlen für Teilnehmende)

1. **Einmalig durch die Moderation:** Dieses Repository öffentlich auf GitHub hochladen
   und in allen vier Notebooks in der Setup-Zelle den Platzhalter `JBderLeuchtturm`
   in `DATA_URL` ersetzen (Suchen & Ersetzen, 1 Minute).
2. Teilnehmende öffnen die Notebooks direkt in Colab:
   `https://colab.research.google.com/github/JBderLeuchtturm/rag-advanced-workshop/blob/main/notebooks/01_naive_rag.ipynb`
   (analog für 02–04). Die Daten lädt die Setup-Zelle automatisch von GitHub.
3. Alternativ ohne GitHub: Notebook-Dateien + `data/`-Ordner in Colab hochladen.

### Variante B · Lokal

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
jupyter lab                      # dann notebooks/01_naive_rag.ipynb öffnen
```

Die Daten liegen unter `data/` und werden automatisch gefunden. Beim ersten Lauf
werden die beiden Modelle heruntergeladen (danach im Cache).

## 📁 Struktur

```
data/          nordlicht_corpus.json (12 Dokumente) · gold_testset.json (15 Fragen)
notebooks/     Teilnehmer-Notebooks 01–04 (Übungen mit TODO + Selbsttests)
loesungen/     Musterlösungen zu 01–03 (Notebook 04 ist eine Demo ohne Übung)
src_build/     Jupytext-Quellen, build_notebooks.py, smoke_test.py
```

## 🗺️ Ablauf & Übungen

| Notebook | Inhalt | Übung | ⏱️ |
|---|---|---|---|
| 01 · Naive RAG | Chunking → Embeddings → Vektorsuche → Antwort; Stresstest | Ü1: Kosinus-Ähnlichkeit + Top-k-Suche | ~20 min |
| 02 · Hybrid Search | BM25, Duell der Ranglisten, RRF | Ü2: RRF implementieren (Worked Example aus VL 3 als Selbsttest) | ~20 min |
| 03 · Reranking & Metadaten | Cross-Encoder, 🚨 die Homeoffice-Falle, der Fix | Ü3: Reranking · Ü4: Metadaten-Filter | ~25 min |
| 04 · Evaluation | Hit@3 & MRR über 5 Ausbaustufen, Chart, RAGAS-Einordnung | Demo | ~10 min |

Jede Übung hat eine ✅-Selbsttest-Zelle — läuft sie fehlerfrei, ist die Übung gelöst.

## ✅ Abdeckung der Workshop-Anforderungen (Kick-off, VL 0)

- **Konzept + Unternehmenskontext (~30 min):** Foliensatz; durchgängiger Use Case
  NordLicht Logistik (internes Wissen für Kundenservice & HR).
- **Hands-on (~60–75 min, „Mitmach-Teil"):** Notebooks 01–03 mit vier Übungen und
  Selbsttests; Notebook 04 als Live-Demo. Leitet die drei Kick-off-Leitfragen direkt her
  (Warum scheitert naives RAG? Was bringen Hybrid Search & Reranking? Welche
  Architekturentscheidung hat den größten Hebel? → Antwort: gemessen in NB 04).
- **Reflexion & Q&A (~15–20 min):** Leitfragen und vorbereitete Antworten im
  `MODERATIONSLEITFADEN.md`.
- **Lieferobjekte:** Foliensatz + dieser lauffähige Use Case (Abgabe 22.07., 22 Uhr).

## 🌐 Workshop-Portal (GitHub Pages)

Im Ordner `docs/` liegt ein komplettes **Workshop-Portal im Look eines Firmen-Intranets**
(`docs/index.html`) — eine einzelne HTML-Datei ohne Build-Schritt und ohne Abhängigkeiten.

**Was drin ist**

- Navigation mit Untermenüs, Breadcrumb, Suchfeld und Service-Desk-Block
- Colab-Start-Buttons für alle vier Notebooks (jede Person bekommt eine **eigene** Sitzung,
  beliebig viele Teilnehmende gleichzeitig, komplett kostenlos)
- Gestaffelte Hilfe je Übung: Hinweis 1 → Hinweis 2 → Musterlösung mit Kopier-Button
- Fortschrittsanzeige mit sieben Haken, die im Browser gespeichert bleibt (nur lokal)
- „Aktuelles“-Meldungen, Ablaufplan, filterbares Dokumentenverzeichnis, Team, FAQ
- Impressum, Datenschutz und Barrierefreiheit als Overlays — samt Hinweis, dass die
  Firma fiktiv ist

**Online stellen (einmalig, ~1 Minute):**

1. Repo auf GitHub pushen (siehe unten).
2. Auf GitHub: **Settings → Pages** → unter *Build and deployment*:
   Source **Deploy from a branch**, Branch **main**, Ordner **/docs** → **Save**.
3. Nach 1–2 Minuten ist das Portal erreichbar unter
   `https://JBderLeuchtturm.github.io/<repo-name>/`

Das Portal erkennt Nutzername und Repo **automatisch** aus der GitHub-Pages-URL — die
Colab-Buttons funktionieren dann ohne weitere Anpassung. Nur wer die Datei lokal per
Doppelklick öffnet, trägt oben im `<script>`-Block `GITHUB_USER` und `GITHUB_REPO` ein.

**Präsentationsmodus**

`docs/praesentation.html` zeigt den kompletten Foliensatz im Browser — ohne PowerPoint,
ohne Anmeldung, auch offline. Die 39 Folien liegen als Bilder in `docs/assets/folien/`.
Steuerung: Pfeiltasten/Leertaste, **N** für Sprechernotizen (aus der PPTX übernommen),
**O** für die Folienübersicht, **F** für Vollbild, **T** für den Timer.

Wichtig: Ändert ihr die PPTX, müssen die Bilder neu erzeugt werden — siehe
`src_build/build_praesentation.py`.

**Fotos (optional)**

Ohne Fotos zeigt die Seite gezeichnete Grafiken im NordLicht-Design — sie sieht also
fertig aus, ohne dass ihr etwas tun müsst. Wer echte Bilder einsetzen will, legt sie unter
`docs/assets/img/` ab; welche Dateinamen und Motive erwartet werden, steht in
`docs/assets/img/BILDER-HIER-ABLEGEN.md`. Kein Code muss angefasst werden.
- **Stack-Bezug:** BM25 + Vektorsuche (Hybrid), Cross-Encoder Reranking, Evaluation
  in RAGAS-Logik — bewusst ohne pgvector/LLM-Judge, damit alles kostenlos und in
  2 Minuten Setup für den ganzen Kurs läuft (Begründung in NB 04 und im Leitfaden).

## 🧪 Qualitätssicherung

`python src_build/smoke_test.py` prüft alle modellfreien Mechaniken (21 Checks:
Datenkonsistenz, BM25-Lehr-Momente inkl. Falle, RRF, Antwort-Extraktion, Metriken).
Die modellabhängigen Pfade einmal komplett durchlaufen lassen — Checkliste
„Generalprobe" im Moderationsleitfaden.

