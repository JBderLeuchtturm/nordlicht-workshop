"""Erzeugt docs/live.html - die echte Live-Demo, komplett im Browser.

Kein Server, kein Colab, kein API-Key. Die Modelle laufen per transformers.js
direkt im Browser der Teilnehmenden (WebAssembly/WebGPU).

Aufgebaut in drei Stufen, die einzeln zuschaltbar sind:

  Stufe 1  BM25            sofort bereit, kein Download (reines JavaScript)
  Stufe 2  Vektorsuche     Embedder ~120 MB  -> schaltet auch Hybrid + RRF frei
  Stufe 3  Reranking       Cross-Encoder     -> schaltet Advanced frei

Faellt eine Stufe aus (kein Netz, Modell nicht ladbar), bleiben die
darunterliegenden Stufen benutzbar. Die Demo ist damit nie ganz kaputt.

BM25 und RRF sind originalgetreu aus rank_bm25 bzw. den Notebooks portiert,
die Browser-Demo rechnet also dieselben Zahlen wie Notebook 1 bis 3.

    python src_build/build_live_demo.py
"""

import json
import os

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KORPUS = os.path.join(WURZEL, "data", "nordlicht_corpus.json")
TESTSET = os.path.join(WURZEL, "data", "gold_testset.json")
ZIEL = os.path.join(WURZEL, "docs", "live.html")

# Version bewusst gepinnt: 3.8.1 ist die letzte 3.x und hat die stabile API.
TRANSFORMERS_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"

# Vorschlagsfragen. Die erste ist der Stoerfall - sie gehoert nach vorn.
VORSCHLAEGE = [
    ("Wie viele Tage Homeoffice sind bei NordLicht erlaubt?", True),
    ("Welche Zustellquote garantiert die Servicestufe NL-EXPRESS-24?", False),
    ("Was bedeutet der Fehlercode NL-503 im Kundenportal?", False),
    ("Bekomme ich mein Geld zurück, wenn mein Paket kaputt ankommt?", False),
    ("Wie viele Urlaubstage stehen mir zu?", False),
    ("Wie hoch ist aktuell der Dieselzuschlag?", False),
]


def erstelle_chunks(dokumente):
    chunks = []
    for dok in dokumente:
        for i, absatz in enumerate(dok["text"].split("\n\n")):
            chunks.append(
                {
                    "chunk_id": f"{dok['doc_id']}#{i}",
                    "doc_id": dok["doc_id"],
                    "titel": dok["titel"],
                    "kategorie": dok["kategorie"],
                    "status": dok["status"],
                    "jahr": dok["jahr"],
                    "text": absatz.strip(),
                }
            )
    return chunks


VORLAGE = r"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Live-Demo · NordLicht Wissensassistent</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --night:#071627; --navy:#0B2545; --teal:#1C7293; --aurora:#2EC4B6; --aurora-lt:#9BE3D8;
  --paper:#F3F6F9; --white:#FFF; --ink:#14213D; --body-ink:#33455C; --mute:#61738A;
  --line:#DCE5EC; --line-soft:#EAF0F5;
  --warn:#D9703A; --warn-bg:#FBEBE0; --green:#2F8F5B; --green-bg:#E6F2EB;
  --disp:"Newsreader",Georgia,serif; --ui:"Public Sans",system-ui,sans-serif;
  --mono:"IBM Plex Mono",Consolas,monospace; --r:10px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--ui);background:var(--paper);color:var(--body-ink);font-size:16px;line-height:1.6}
.wrap{max-width:1240px;margin:0 auto;padding:0 24px}
a{color:var(--teal)}
h1{font-family:var(--disp);font-weight:600;font-size:clamp(26px,3.6vw,36px);color:var(--ink);
  line-height:1.18;letter-spacing:-.01em}
.eyebrow{font-size:11.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--aurora)}

.top{background:var(--navy);color:#CFDCEA;padding:13px 0}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px}
.zurueck{display:inline-flex;align-items:center;gap:8px;color:var(--aurora-lt);text-decoration:none;
  font-size:14px;font-weight:600}
.zurueck:hover{color:#fff}
.top .hinw{font-family:var(--mono);font-size:12px;color:#7E93AC}

.kopf{background:var(--night);color:#CFDDEB;padding:40px 0 34px}
.kopf .lead{color:#A9BDD2;max-width:70ch;margin-top:12px;font-size:15.5px}

/* Stufen */
.stufen{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px}
@media(max-width:860px){.stufen{grid-template-columns:1fr}}
.stufe{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);
  border-radius:var(--r);padding:16px 18px}
.stufe.bereit{border-color:rgba(46,196,182,.55);background:rgba(46,196,182,.09)}
.stufe.fehler{border-color:rgba(217,112,58,.55);background:rgba(217,112,58,.10)}
.stufe .nr{font-family:var(--mono);font-size:11px;color:var(--aurora-lt);letter-spacing:.05em}
.stufe h3{font-family:var(--ui);font-size:15px;font-weight:700;color:#fff;margin:3px 0 5px}
.stufe p{font-size:12.5px;color:#93A9C0;line-height:1.5}
.stufe .zustand{margin-top:11px;font-size:12.5px;font-weight:600;color:var(--aurora-lt);min-height:19px}
.balken{height:4px;background:rgba(255,255,255,.14);border-radius:99px;overflow:hidden;margin-top:9px;display:none}
.balken i{display:block;height:100%;width:0;background:var(--aurora);transition:width .25s}

.btn{font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;border-radius:7px;
  padding:8px 15px;border:1px solid transparent;display:inline-flex;align-items:center;gap:7px}
.btn--aur{background:var(--aurora);color:#06231F}
.btn--aur:hover{filter:brightness(1.07)}
.btn--out{background:transparent;color:var(--aurora-lt);border-color:rgba(155,227,216,.45)}
.btn--out:hover{background:rgba(155,227,216,.12)}
.btn:disabled{opacity:.45;cursor:not-allowed;filter:none}

/* Frageleiste */
.frage-sec{background:var(--white);border-bottom:1px solid var(--line);padding:26px 0 30px}
.eingabe{display:flex;gap:10px;margin-top:6px}
@media(max-width:620px){.eingabe{flex-direction:column}}
.eingabe input{flex:1;font:inherit;font-size:16px;color:var(--ink);background:var(--paper);
  border:1px solid var(--line);border-radius:8px;padding:13px 16px}
.eingabe input:focus{outline:2px solid var(--aurora);outline-offset:1px;background:#fff}
.btn--go{background:var(--teal);color:#fff;padding:13px 26px;font-size:15px}
.btn--go:hover{background:#17607d}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}
.chip{font:inherit;font-size:12.5px;cursor:pointer;background:var(--paper);color:var(--body-ink);
  border:1px solid var(--line);border-radius:99px;padding:6px 13px}
.chip:hover{border-color:var(--teal);color:var(--teal)}
.chip.stoer{background:var(--warn-bg);border-color:#EFD8C7;color:#A8461C;font-weight:600}
.schalter{display:inline-flex;align-items:center;gap:9px;margin-top:16px;font-size:13.5px;
  color:var(--body-ink);cursor:pointer;user-select:none}
.schalter input{width:17px;height:17px;accent-color:var(--aurora);cursor:pointer}

/* Ergebnisse */
main{padding:30px 0 70px}
.spalten{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media(max-width:1080px){.spalten{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.spalten{grid-template-columns:1fr}}
.spalte{background:var(--white);border:1px solid var(--line);border-radius:var(--r);
  display:flex;flex-direction:column;overflow:hidden}
.spalte.aus{opacity:.5}
.spalte > header{padding:14px 16px 12px;border-bottom:1px solid var(--line-soft)}
.spalte h2{font-family:var(--ui);font-size:14.5px;font-weight:700;color:var(--ink)}
.spalte .unter{font-size:12px;color:var(--mute);margin-top:2px}
.spalte .skala{font-family:var(--mono);font-size:10.5px;color:var(--teal);margin-top:6px;
  text-transform:uppercase;letter-spacing:.05em}
.treffer{padding:11px 16px;border-bottom:1px solid var(--line-soft)}
.treffer:last-of-type{border-bottom:none}
.treffer.arch{background:var(--warn-bg)}
.treffer .zeile{display:flex;justify-content:space-between;gap:9px;align-items:baseline}
.treffer .rang{font-family:var(--mono);font-size:11px;color:var(--mute)}
.treffer .score{font-family:var(--mono);font-size:11.5px;color:var(--ink);font-weight:500}
.treffer .titel{font-size:13px;color:var(--ink);font-weight:600;margin-top:3px;line-height:1.35}
.treffer .meta{font-family:var(--mono);font-size:10.5px;color:var(--mute);margin-top:3px}
.treffer .tag{display:inline-block;font-size:10px;font-weight:700;border-radius:4px;padding:1px 6px;
  margin-left:5px}
.tag.g{background:var(--green-bg);color:var(--green)}
.tag.a{background:#F5D9C7;color:#A8461C}
.antwort{margin-top:auto;padding:13px 16px;background:var(--paper);border-top:1px solid var(--line)}
.antwort .lab{font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:var(--teal);font-weight:700}
.antwort p{font-size:13px;color:var(--ink);margin-top:5px;line-height:1.45}
.antwort .quelle{font-family:var(--mono);font-size:10.5px;color:var(--mute);margin-top:7px}
.antwort.falsch{background:var(--warn-bg);border-top-color:#EFD8C7}
.leer{padding:26px 16px;font-size:13px;color:var(--mute);text-align:center}

.notiz{margin-top:22px;font-size:13px;color:var(--mute);text-align:center}
.fehlerbox{display:none;margin-top:18px;background:var(--warn-bg);border-left:4px solid var(--warn);
  border-radius:0 8px 8px 0;padding:14px 18px;font-size:14px;color:#7A4A26}
</style>
</head>
<body>

<div class="top">
  <div class="wrap">
    <a class="zurueck" href="index.html">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Zurück zum Portal
    </a>
    <span class="hinw">läuft vollständig im Browser · kein Server</span>
  </div>
</div>

<div class="kopf">
  <div class="wrap">
    <span class="eyebrow">Live-Demo</span>
    <h1>Fragt die Pipeline, was ihr wollt</h1>
    <p class="lead">Vier Suchverfahren, dieselbe Frage, nebeneinander. Die Modelle laufen hier
      direkt in eurem Browser — es geht nichts an einen Server, und es rechnet wirklich in dem
      Moment, in dem ihr auf Suchen drückt. Die drei Stufen lassen sich einzeln zuschalten.</p>

    <div class="stufen">
      <div class="stufe bereit" id="stufe1">
        <div class="nr">STUFE 1</div>
        <h3>BM25</h3>
        <p>Reine Stichwortsuche. Reines JavaScript, kein Modell, kein Download.</p>
        <div class="zustand" id="zustand1">bereit</div>
      </div>
      <div class="stufe" id="stufe2">
        <div class="nr">STUFE 2</div>
        <h3>Vektorsuche + Hybrid</h3>
        <p>Embedder, rund 120 MB. Schaltet auch Hybrid&nbsp;+&nbsp;RRF frei.</p>
        <div class="zustand" id="zustand2">nicht geladen</div>
        <div class="balken" id="balken2"><i></i></div>
        <button class="btn btn--out" id="lade2" style="margin-top:11px">Modell laden</button>
      </div>
      <div class="stufe" id="stufe3">
        <div class="nr">STUFE 3</div>
        <h3>Reranking → Advanced</h3>
        <p>Cross-Encoder. Braucht Stufe&nbsp;2 und schaltet Advanced frei.</p>
        <div class="zustand" id="zustand3">nicht geladen</div>
        <div class="balken" id="balken3"><i></i></div>
        <button class="btn btn--out" id="lade3" style="margin-top:11px" disabled>Modell laden</button>
      </div>
    </div>

    <div style="margin-top:16px">
      <button class="btn btn--aur" id="ladeAlles">Alle Stufen laden</button>
    </div>
    <div class="fehlerbox" id="fehlerbox"></div>
  </div>
</div>

<div class="frage-sec">
  <div class="wrap">
    <div class="eingabe">
      <input id="frage" type="text" placeholder="Eigene Frage an die Wissensbasis …"
             value="Wie viele Tage Homeoffice sind bei NordLicht erlaubt?"
             aria-label="Frage an die Wissensbasis">
      <button class="btn btn--go" id="suchen">Suchen</button>
    </div>
    <div class="chips" id="chips"></div>
    <label class="schalter">
      <input type="checkbox" id="filter" checked>
      Metadatenfilter aktiv <span style="color:var(--mute)">— archivierte Dokumente fliegen vor dem Reranking raus (Übung&nbsp;4)</span>
    </label>
  </div>
</div>

<main>
  <div class="wrap">
    <div class="spalten" id="spalten"></div>
    <p class="notiz" id="notiz">36 Chunks aus 12 Dokumenten · BM25 und RRF rechnen exakt wie in den Notebooks.</p>
  </div>
</main>

<script type="module">
import { pipeline, AutoTokenizer, AutoModelForSequenceClassification, env }
  from "%%CDN%%";

env.allowLocalModels = false;

const CHUNKS = %%CHUNKS%%;
const VORSCHLAEGE = %%VORSCHLAEGE%%;

const MODI = [
  { id:"bm25",     name:"BM25",         unter:"Reine Stichwortsuche",        skala:"BM25-Score",    stufe:1 },
  { id:"dense",    name:"Vektorsuche",  unter:"Bedeutung statt Buchstaben",  skala:"Kosinus",       stufe:2 },
  { id:"hybrid",   name:"Hybrid + RRF", unter:"Beide Listen fusioniert",     skala:"RRF-Score",     stufe:2 },
  { id:"advanced", name:"Advanced",     unter:"Reranking + Metadatenfilter", skala:"Cross-Encoder", stufe:3 },
];

/* ══ Tokenisierung: entspricht re.findall(r"\w+", text.lower()) in Python ══ */
const tok = t => (t.toLowerCase().match(/[\p{L}\p{N}_]+/gu) || []);

/* ══ BM25Okapi — originalgetreu aus rank_bm25 portiert ══════════════════════ */
class BM25Okapi {
  constructor(korpus, k1 = 1.5, b = 0.75, epsilon = 0.25) {
    this.k1 = k1; this.b = b;
    this.docFreqs = []; this.docLen = []; this.idf = {};
    this.corpusSize = korpus.length;
    let nd = {}, gesamt = 0;
    for (const doc of korpus) {
      this.docLen.push(doc.length); gesamt += doc.length;
      const f = {};
      for (const w of doc) f[w] = (f[w] || 0) + 1;
      this.docFreqs.push(f);
      for (const w of Object.keys(f)) nd[w] = (nd[w] || 0) + 1;
    }
    this.avgdl = gesamt / this.corpusSize;
    // IDF inklusive Epsilon-Boden fuer negative Werte, genau wie rank_bm25
    let summe = 0; const negativ = [];
    for (const [w, freq] of Object.entries(nd)) {
      const idf = Math.log(this.corpusSize - freq + 0.5) - Math.log(freq + 0.5);
      this.idf[w] = idf; summe += idf;
      if (idf < 0) negativ.push(w);
    }
    const eps = epsilon * (summe / Object.keys(this.idf).length);
    for (const w of negativ) this.idf[w] = eps;
  }
  scores(frage) {
    const out = new Array(this.corpusSize).fill(0);
    for (const q of tok(frage)) {
      const idf = this.idf[q] || 0;
      if (!idf) continue;
      for (let i = 0; i < this.corpusSize; i++) {
        const f = this.docFreqs[i][q] || 0;
        out[i] += idf * (f * (this.k1 + 1)) /
                  (f + this.k1 * (1 - this.b + this.b * this.docLen[i] / this.avgdl));
      }
    }
    return out;
  }
}
const bm25 = new BM25Okapi(CHUNKS.map(c => tok(c.text)));

/* ══ RRF — identisch zu Übung 2 ═════════════════════════════════════════════ */
function rrfFusion(ranglisten, k = 60) {
  const s = {};
  for (const liste of ranglisten)
    liste.forEach((cid, i) => { s[cid] = (s[cid] || 0) + 1 / (k + i + 1); });
  return s;
}

const topN = (scores, k) => scores
  .map((s, i) => [i, s]).sort((a, b) => b[1] - a[1]).slice(0, k)
  .map(([i, s]) => [CHUNKS[i], s]);

/* ══ Modelle ════════════════════════════════════════════════════════════════ */
let embedder = null, ceTok = null, ceModel = null, vektoren = null;

const RERANKER = [
  "Xenova/mmarco-mMiniLMv2-L12-H384-v1",
  "jeffwan/mmarco-mMiniLMv2-L12-H384-v1",
  "corrius/cross-encoder-mmarco-mMiniLMv2-L12-H384-v1",
  "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1",
  "Xenova/bge-reranker-base",
];

function setzeZustand(n, text, klasse) {
  document.getElementById("zustand" + n).textContent = text;
  const box = document.getElementById("stufe" + n);
  box.classList.remove("bereit", "fehler");
  if (klasse) box.classList.add(klasse);
}
function fortschritt(n, p) {
  const b = document.getElementById("balken" + n);
  b.style.display = "block";
  b.firstElementChild.style.width = Math.round(p) + "%";
}
function zeigeFehler(text) {
  const f = document.getElementById("fehlerbox");
  f.style.display = "block"; f.innerHTML = text;
}

async function ladeEmbedder() {
  if (embedder) return true;
  const btn = document.getElementById("lade2");
  btn.disabled = true;
  setzeZustand(2, "lädt …");
  try {
    embedder = await pipeline("feature-extraction",
      "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
        dtype: "q8",
        progress_callback: d => { if (d.status === "progress" && d.progress) fortschritt(2, d.progress); }
      });
    setzeZustand(2, "Chunks werden eingebettet …");
    const aus = await embedder(CHUNKS.map(c => c.text), { pooling: "mean", normalize: true });
    vektoren = aus.tolist();
    setzeZustand(2, "bereit · " + vektoren.length + " Vektoren", "bereit");
    document.getElementById("balken2").style.display = "none";
    document.getElementById("lade3").disabled = false;
    zeichne();
    return true;
  } catch (e) {
    setzeZustand(2, "Laden fehlgeschlagen", "fehler");
    btn.disabled = false;
    zeigeFehler("<b>Stufe 2 konnte nicht laden.</b> BM25 funktioniert weiterhin. " +
                "Meist liegt es am Netz oder an einem blockierten CDN. Details: " + e);
    return false;
  }
}

async function ladeReranker() {
  if (ceModel) return true;
  if (!embedder && !(await ladeEmbedder())) return false;
  const btn = document.getElementById("lade3");
  btn.disabled = true;
  let letzterFehler = null;
  for (const name of RERANKER) {
    try {
      setzeZustand(3, "versuche " + name.split("/")[0] + " …");
      ceTok = await AutoTokenizer.from_pretrained(name);
      ceModel = await AutoModelForSequenceClassification.from_pretrained(name, {
        dtype: "q8",
        progress_callback: d => { if (d.status === "progress" && d.progress) fortschritt(3, d.progress); }
      });
      setzeZustand(3, "bereit · " + name.split("/")[1], "bereit");
      document.getElementById("balken3").style.display = "none";
      zeichne();
      return true;
    } catch (e) { letzterFehler = e; ceTok = null; ceModel = null; }
  }
  setzeZustand(3, "kein Reranker verfügbar", "fehler");
  btn.disabled = false;
  zeigeFehler("<b>Stufe 3 konnte nicht laden.</b> Die Stufen 1 und 2 funktionieren weiter — " +
              "der Störfall lässt sich auch ohne Reranking zeigen, die archivierte Fassung " +
              "taucht schon in der Hybrid-Spalte auf. Details: " + letzterFehler);
  return false;
}

/* ══ Die vier Suchverfahren ═════════════════════════════════════════════════ */
function sucheBm25(frage, k = 3) { return topN(bm25.scores(frage), k); }

async function sucheDense(frage, k = 3) {
  const fv = (await embedder(frage, { pooling: "mean", normalize: true })).tolist()[0];
  // Vektoren sind normalisiert, das Skalarprodukt ist damit der Kosinus.
  return topN(vektoren.map(v => v.reduce((s, x, i) => s + x * fv[i], 0)), k);
}

async function sucheHybrid(frage, k = 3, proListe = 8) {
  const b = sucheBm25(frage, proListe).map(([c]) => c.chunk_id);
  const d = (await sucheDense(frage, proListe)).map(([c]) => c.chunk_id);
  const s = rrfFusion([b, d]);
  const nachId = Object.fromEntries(CHUNKS.map(c => [c.chunk_id, c]));
  return Object.entries(s).sort((a, b2) => b2[1] - a[1])
    .slice(0, k).map(([cid, sc]) => [nachId[cid], sc]);
}

async function sucheAdvanced(frage, k = 3, filter = true) {
  let kandidaten = (await sucheHybrid(frage, 8)).map(([c]) => c);
  if (filter) kandidaten = kandidaten.filter(c => c.status !== "archiviert");
  if (!kandidaten.length) return [];
  const eingabe = await ceTok(kandidaten.map(() => frage),
    { text_pair: kandidaten.map(c => c.text), padding: true, truncation: true });
  const { logits } = await ceModel(eingabe);
  // Ein-Logit-Reranker (mmarco) liefern direkt den Score, Zwei-Logit-Modelle
  // eine Klassifikation. Beides sinnvoll auf eine Zahl bringen.
  const zeilen = logits.tolist();
  const scores = zeilen.map(r => r.length === 1 ? r[0] : r[1] - r[0]);
  return kandidaten.map((c, i) => [c, scores[i]])
    .sort((a, b) => b[1] - a[1]).slice(0, k);
}

/* ══ Antwort: derselbe deterministische Satz-Auszug wie in Notebook 1 ═══════ */
function antwortAus(frage, treffer) {
  if (!treffer.length) return null;
  const chunk = treffer[0][0];
  const fw = new Set(tok(frage));
  const saetze = chunk.text.split(/(?<=[.!?])\s+/);
  let best = saetze[0], bestN = -1;
  for (const s of saetze) {
    const n = tok(s).filter(w => fw.has(w)).length;
    if (n > bestN) { bestN = n; best = s; }
  }
  return { satz: best, quelle: chunk };
}

/* ══ Darstellung ════════════════════════════════════════════════════════════ */
let letzte = {};

function zeichne() {
  const wurzel = document.getElementById("spalten");
  wurzel.innerHTML = MODI.map(m => {
    const aktiv = (m.stufe === 1) || (m.stufe === 2 && embedder) || (m.stufe === 3 && ceModel);
    const daten = letzte[m.id];
    let inhalt;
    if (!aktiv) {
      inhalt = `<div class="leer">Stufe ${m.stufe} noch nicht geladen</div>`;
    } else if (!daten) {
      inhalt = `<div class="leer">Noch keine Suche</div>`;
    } else if (!daten.treffer.length) {
      inhalt = `<div class="leer">Keine Kandidaten übrig</div>`;
    } else {
      inhalt = daten.treffer.map(([c, s], i) => `
        <div class="treffer${c.status === "archiviert" ? " arch" : ""}">
          <div class="zeile"><span class="rang">${i + 1}.</span>
            <span class="score">${s.toFixed(3)}</span></div>
          <div class="titel">${c.titel}</div>
          <div class="meta">${c.chunk_id} · ${c.jahr}
            <span class="tag ${c.status === "archiviert" ? "a" : "g"}">${c.status}</span></div>
        </div>`).join("");
      const a = daten.antwort;
      if (a) inhalt += `
        <div class="antwort${a.quelle.status === "archiviert" ? " falsch" : ""}">
          <div class="lab">Antwort</div><p>${a.satz}</p>
          <div class="quelle">${a.quelle.titel} · ${a.quelle.jahr} · ${a.quelle.status}</div>
        </div>`;
    }
    return `<section class="spalte${aktiv ? "" : " aus"}">
      <header><h2>${m.name}</h2><div class="unter">${m.unter}</div>
        <div class="skala">${m.skala}</div></header>${inhalt}</section>`;
  }).join("");
}

async function suchen() {
  const frage = document.getElementById("frage").value.trim();
  if (!frage) return;
  const filter = document.getElementById("filter").checked;
  const btn = document.getElementById("suchen");
  btn.disabled = true; btn.textContent = "rechnet …";
  try {
    letzte = {};
    let t = sucheBm25(frage);
    letzte.bm25 = { treffer: t, antwort: antwortAus(frage, t) };
    zeichne();
    if (embedder) {
      t = await sucheDense(frage);
      letzte.dense = { treffer: t, antwort: antwortAus(frage, t) };
      t = await sucheHybrid(frage);
      letzte.hybrid = { treffer: t, antwort: antwortAus(frage, t) };
      zeichne();
    }
    if (ceModel) {
      t = await sucheAdvanced(frage, 3, filter);
      letzte.advanced = { treffer: t, antwort: antwortAus(frage, t) };
      zeichne();
    }
  } catch (e) {
    zeigeFehler("<b>Bei der Suche ist etwas schiefgegangen.</b> " + e);
  } finally {
    btn.disabled = false; btn.textContent = "Suchen";
  }
}

document.getElementById("chips").innerHTML = VORSCHLAEGE
  .map(([f, stoer]) => `<button class="chip${stoer ? " stoer" : ""}" data-f="${f.replace(/"/g, "&quot;")}">${stoer ? "⚠ " : ""}${f}</button>`)
  .join("");
document.getElementById("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.getElementById("frage").value = b.dataset.f;
  suchen();
});
document.getElementById("suchen").addEventListener("click", suchen);
document.getElementById("frage").addEventListener("keydown", e => { if (e.key === "Enter") suchen(); });
document.getElementById("filter").addEventListener("change", () => { if (ceModel) suchen(); });
document.getElementById("lade2").addEventListener("click", ladeEmbedder);
document.getElementById("lade3").addEventListener("click", ladeReranker);
document.getElementById("ladeAlles").addEventListener("click", async e => {
  e.target.disabled = true; await ladeReranker(); e.target.disabled = false;
});

zeichne();
suchen();
</script>
</body>
</html>
"""


def main():
    with open(KORPUS, encoding="utf-8") as f:
        dokumente = json.load(f)["dokumente"]
    chunks = erstelle_chunks(dokumente)

    html = (
        VORLAGE
        .replace("%%CDN%%", TRANSFORMERS_CDN)
        .replace("%%CHUNKS%%", json.dumps(chunks, ensure_ascii=False))
        .replace("%%VORSCHLAEGE%%", json.dumps(VORSCHLAEGE, ensure_ascii=False))
    )

    os.makedirs(os.path.dirname(ZIEL), exist_ok=True)
    with open(ZIEL, "w", encoding="utf-8") as f:
        f.write(html)

    kb = os.path.getsize(ZIEL) / 1024
    print(f"docs/live.html erzeugt ({kb:.0f} KB)")
    print(f"  {len(dokumente)} Dokumente, {len(chunks)} Chunks eingebettet")
    print(f"  transformers.js {TRANSFORMERS_CDN.rsplit('@', 1)[1]}")
    print("\nVor dem Workshop einmal im Browser oeffnen und 'Alle Stufen laden' druecken -")
    print("die Modelle liegen danach im Browser-Cache und starten sofort.")


if __name__ == "__main__":
    main()
