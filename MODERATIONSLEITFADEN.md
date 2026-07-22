# Moderationsleitfaden · Workshop „RAG Advanced"

**~120 Minuten · 4 Moderator:innen · Kurs arbeitet in 2er-Teams (Pairing) an eigenen Rechnern**

## Rollenverteilung (Vorschlag)

- **P1 · Host & Theorie:** Folienteil, Überleitungen, Zeitwächter:in
- **P2 · Live-Coder:** führt die Notebooks am Beamer, tippt die Lösungen live
- **P3 + P4 · Floorwalker:** helfen den Teams bei Setup und Übungen, sammeln gute
  Diskussionsbeiträge für die Reflexion ein

## Ablaufplan

| Zeit | Block | Wer | Material |
|---|---|---|---|
| 00:00–00:05 | Begrüßung, Story-Setup NordLicht, Setup-Zelle NB 01 starten lassen (Downloads laufen im Hintergrund!) | P1 | Folien 1–3 |
| 00:05–00:30 | **Konzept:** Wissensproblem-Recap, naive Pipeline, warum sie scheitert, Hybrid/RRF, Cross-Encoder, Evaluation (Überblick) | P1 | Folien |
| 00:30–00:50 | **NB 01 · Naive RAG** + Übung 1 + Stresstest-Diskussion | P2, P3/P4 | Notebook 01 |
| 00:50–01:10 | **NB 02 · Hybrid & RRF** + Übung 2 | P2, P3/P4 | Notebook 02 |
| 01:10–01:35 | **NB 03 · Reranking, 🚨 Falle, Fix** + Übungen 3 & 4 | P2, P3/P4 | Notebook 03 |
| 01:35–01:45 | **NB 04 · Evaluation** als Live-Demo, Ergebnis-Folie | P2 → P1 | Notebook 04, Folien |
| 01:45–02:00 | **Reflexion & Q&A** | P1, alle | Leitfragen unten |

Puffer: Die Diskussionsblöcke in NB 01/02 lassen sich auf je 1 Minute kürzen; NB 04
kann notfalls nur gezeigt (nicht live gerechnet) werden — Screenshot vorbereiten.

## Regieanweisungen je Notebook

### NB 01 · Naive RAG (20 min)

- **Ganz zu Beginn** alle die ersten beiden Code-Zellen ausführen lassen (pip +
  Modell-Download ≈ 1–3 min) — währenddessen läuft der Theorieteil weiter? Nein:
  Setup startet um 00:00–00:05, Theorie überbrückt die Downloads. ✔️
- Übung 1 (Kosinus + Top-k): 6–8 min Bearbeitungszeit, dann Lösung live tippen.
- Erwartete Ergebnisse: Urlaubs- und SLA-Frage liefern saubere Antworten.
  Stresstest: bei `NL-410` und der „Kohle zurück"-Frage auf **Score-Nähe der Top-3**
  zeigen. Kernsatz: *„Embeddings erfassen Bedeutung, keine Zeichenketten — und der
  Score sagt euch nicht, ob ein Treffer wirklich gut ist, nur dass er der beste war."*

### NB 02 · Hybrid & RRF (20 min)

- Duell-Zelle: **verifiziert** — BM25 trifft `NL-410` mit großem Score-Abstand
  (Rang 1 = Kundenportal) und verfehlt die umgangssprachliche Reklamations-Frage
  komplett (kein Wort-Overlap). Genau diese Asymmetrie herausarbeiten.
- Übung 2 (RRF): 6–8 min. Der Selbsttest ist das **Worked Example aus VL 3**
  (Ranglisten A,B,C / B,C,A → B gewinnt mit 1/62 + 1/61) — explizit die Brücke zur
  Vorlesung schlagen.
- Kernsatz: *„RRF braucht keinen gemeinsamen Score-Raum — nur Ränge. Konsistenz
  über beide Listen wird belohnt."*

### NB 03 · Reranking & die Falle (25 min) — das Herzstück

1. Cross-Encoder-Intro + Übung 3 (8 min): zweistufiges Muster betonen
   (Stage 1 Recall, Stage 2 Precision).
2. SLA-Frage durch `suche_advanced` → alles wirkt perfekt. Kurz feiern.
3. **Die Falle:** *„Eine neue Kollegin fragt etwas ganz Alltägliches…"* — Zelle
   ausführen, Antwort **laut vorlesen**: „maximal zwei Tage". Kunstpause. Dann:
   *„Lest mal die Quelle. Status: archiviert. Die gültige Richtlinie von 2025 sagt
   drei Tage. Die Antwort ist flüssig, belegt — und falsch."*
4. 3 min Team-Diskussion „Warum?", Beiträge einsammeln, erst dann das
   `<details>`-Feld aufklappen. Kernsatz: *„Alle drei Stufen haben exakt das getan,
   wofür sie gebaut sind. **Relevanz ist nicht Gültigkeit.**"*
5. Übung 4 (Filter, ~5 min): Der Fix ist bewusst **eine Zeile** — die Pointe ist
   nicht der Code, sondern dass die Information die ganze Zeit in den **Metadaten**
   lag und niemand hingeschaut hat.
6. Abschluss-Diskussion aus Abschnitt 6: Wer pflegt in echten Unternehmen den
   Status? Was bei widersprüchlichen, nicht archivierten Dokumenten? (Brücke zur
   Reflexion.)

### NB 04 · Evaluation (10 min, Demo durch P2)

- Benchmark läuft ~1 min auf CPU (Fortschritt kommentieren: 5 Konfigurationen ×
  15 Fragen).
- Auf **Frage 13** zeigen: „Hybrid + Rerank" scheitert an der Falle, erst
  „Advanced (+ Filter)" löst sie — die Anekdote aus NB 03 wird zur Messung.
- Erwartetes Muster: Dense schwach bei exakten Begriffen, BM25 schwach bei
  Paraphrasen, Hybrid ≥ beide, Rerank verbessert MRR, Filter fixt die Falle.
  **Die konkreten Zahlen aus eurer Generalprobe in die Ergebnis-Folien
  (Folie 14/17) übernehmen** — `benchmark_ergebnis.png` wird automatisch gespeichert.
- RAGAS-Tabelle: ehrlich einordnen, warum wir ohne LLM-Judge messen (Kosten,
  Determinismus) und was RAGAS zusätzlich könnte.

## Reflexion & Q&A (15–20 min) — Leitfragen

1. **Chancen:** Wo im Unternehmen liegt der schnellste ROI? (Interne Wissenssuche,
   Support-Entlastung, Onboarding.)
2. **Risiken:** Was passiert, wenn NordLicht die Falle *nicht* gefunden hätte?
   (Falsche HR-Auskünfte, Vertrauensverlust, ggf. rechtliche Folgen — Air-Canada-Fall
   aus VL 3 als Anker.)
3. **Enterprise-Tauglichkeit:** Was fehlt unserem Prototyp für Produktion?
   (Skalierbare Vektor-DB wie pgvector, Zugriffsrechte, Dokumenten-Governance/
   Metadaten-Pflege, Monitoring, CI-Regressionstests mit dem Gold-Set, echtes LLM
   mit Guardrails.)
4. **Größter Hebel?** Provokant fragen — nach diesem Workshop lautet die belegbare
   Antwort: *Evaluation + Datenqualität/Metadaten*, nicht das schickste Modell.

**Vorbereitete Q&A-Antworten:**

- *„Warum kein echtes LLM?"* — Kostenlos-Anforderung + Determinismus für die Übungen;
  der erweiterte Prompt wird gezeigt, der Austausch der Extraktion gegen einen
  LLM-Call ist eine Funktion. Kernaussage bleibt: Retrieval bestimmt die Obergrenze.
- *„Warum k=60 bei RRF?"* — Robuster Default aus Cormack et al. (SIGIR 2009);
  dämpft die Dominanz der Spitzenränge. In der Praxis selten getunt.
- *„Warum numpy statt pgvector?"* — 36 Chunks brauchen keinen Index; die Konzepte
  sind identisch, pgvector wäre der Produktionsschritt (ANN-Index, SQL-Filter für
  Metadaten — unser Übung-4-Filter wäre dort ein `WHERE status != 'archiviert'`).
- *„Hätte ein besseres Embedding-Modell die Falle verhindert?"* — Nein, das ist der
  Punkt: Das 2022er-Dokument *ist* maximal relevant zur Frage. Gültigkeit steht in
  Metadaten, nicht im Text.
- *„Was ist mit Halluzinationen trotz RAG?"* — RAGAS Faithfulness misst genau das;
  unsere Falle zeigt die zweite Sorte Fehler: treue Antwort aus falscher Quelle.

## Troubleshooting

- **Colab:** Bei „Session abgelaufen" einfach neu verbinden, Zellen von oben laufen
  lassen. GPU ist **nicht** nötig.
- **Langsames WLAN:** Downloads (~1 GB) laufen nur beim ersten Setup — deshalb
  Setup-Zelle ganz zu Beginn starten. Fallback: 2er-Teams um funktionierende
  Rechner bilden.
- **Kein Google-Konto:** lokale Variante (README, Variante B) oder Pairing.
- **Übung nicht geschafft:** Erst auf die gestaffelten **Hinweis-Buttons im
  Workshop-Portal** verweisen (Hinweis 1 → Hinweis 2 → Lösung); die Lösung wird
  zusätzlich live getippt. `loesungen/`-Notebooks erst nach dem Workshop teilen.
- **Windows lokal:** `py -m venv .venv` und `.venv\Scripts\activate`.

**Workshop-Portal als zentrale Anlaufstelle:** Die GitHub-Pages-URL
(`https://<name>.github.io/<repo>/`) zu Beginn groß an die Tafel /
auf die Folie — von dort erreichen alle die Colab-Buttons, Hinweise und das FAQ,
ohne dass ihr Links diktieren müsst.

**Vortragen ohne PowerPoint:** Unter `/praesentation.html` läuft der Foliensatz direkt
im Browser. **F** für Vollbild, Pfeiltasten zum Blättern, **N** blendet die
Sprechernotizen seitlich ein (nur für euch sichtbar, wenn ihr auf dem Laptop-Bildschirm
bleibt und den Beamer erweitert), **T** startet den Timer, **O** zeigt alle Folien als
Übersicht — praktisch, um in der Q&A gezielt zurückzuspringen. Als Rückfallebene liegt
die PPTX weiterhin im Repository.

## Generalprobe (vor dem 22.07. erledigen)

1. `python src_build/smoke_test.py` → 21/21 Checks grün.
2. Repo auf GitHub pushen, `JBderLeuchtturm` in allen 4 Notebooks ersetzen,
   Colab-Links testen.
   Danach **GitHub Pages aktivieren** (Settings → Pages → Branch `main`, Ordner
   `/docs`) und das Portal einmal im Browser durchklicken: alle vier
   Colab-Buttons, ein Hinweis-Button, eine Lösung.
3. **Alle 4 Lösungs-Notebooks einmal komplett in Colab durchlaufen lassen** und
   abhaken: Ü1–Ü4-Selbsttests grün · Falle antwortet „maximal zwei Tage" aus
   `[archiviert] Homeoffice-Regelung (2022)` · Fix antwortet „drei Tage" aus der
   2025er-Richtlinie · NB 04 läuft durch.
4. Benchmark-Zahlen + `benchmark_ergebnis.png` in die Ergebnis-Folien übernehmen.
   Danach **`python src_build/build_praesentation.py`** ausführen, damit der
   Präsentationsmodus im Portal die neuen Folien zeigt — und erneut pushen.
5. Screenshot-Backup der wichtigsten Outputs (falls WLAN im Raum ausfällt).

