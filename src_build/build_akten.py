"""Erzeugt aus data/nordlicht_corpus.json eine Einzelseite je Dokument.

Jede Seite zeigt dasselbe Dokument in zwei Ansichten:
  1. "Dokument"  - so liest es ein Mensch im Intranet
  2. "Als Chunks" - so sieht es die Pipeline nach dem Chunking

Genau dieser Kontrast ist der Lerneffekt: Die Pipeline sieht nie das Dokument,
sondern immer nur Absatz-Haeppchen ohne Kontext drumherum.

Die Seiten sind vollstaendig statisch (kein fetch, kein JSON zur Laufzeit),
laufen also auch per Doppelklick von der Festplatte.

Aufruf aus dem Projektwurzelverzeichnis:
    python src_build/build_akten.py
"""

import html
import json
import os
import re

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KORPUS = os.path.join(WURZEL, "data", "nordlicht_corpus.json")
TESTSET = os.path.join(WURZEL, "data", "gold_testset.json")
ZIEL = os.path.join(WURZEL, "docs", "akten")


def chunks_von(dok):
    """Exakt dieselbe Zerlegung wie in den Notebooks: Absatz = Chunk."""
    return [
        {"chunk_id": f"{dok['doc_id']}#{i}", "text": absatz.strip()}
        for i, absatz in enumerate(dok["text"].split("\n\n"))
    ]


def tokenzahl(text):
    """Grobe Naeherung, dieselbe Tokenisierung wie BM25 im Notebook."""
    return len(re.findall(r"\w+", text.lower()))


KOPF = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titel} · NordLicht Wissensbasis</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{{
  --night:#071627; --navy:#0B2545; --teal:#1C7293; --aurora:#2EC4B6; --aurora-lt:#9BE3D8;
  --paper:#F3F6F9; --white:#FFFFFF; --ink:#14213D; --body-ink:#33455C; --mute:#61738A;
  --line:#DCE5EC; --line-soft:#EAF0F5;
  --warn:#D9703A; --warn-bg:#FBEBE0; --green:#2F8F5B; --green-bg:#E6F2EB;
  --disp:"Newsreader",Georgia,serif; --ui:"Public Sans",system-ui,sans-serif;
  --mono:"IBM Plex Mono",Consolas,monospace; --r:10px;
}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:var(--ui);background:var(--paper);color:var(--body-ink);font-size:16px;line-height:1.62}}
.wrap{{max-width:860px;margin:0 auto;padding:0 24px}}
a{{color:var(--teal)}}

/* Kopfleiste */
.top{{background:var(--navy);color:#CFDCEA;padding:13px 0}}
.top .wrap{{display:flex;align-items:center;justify-content:space-between;gap:16px}}
.zurueck{{display:inline-flex;align-items:center;gap:8px;color:var(--aurora-lt);
  text-decoration:none;font-size:14px;font-weight:600}}
.zurueck:hover{{color:#fff}}
.top .quelle{{font-family:var(--mono);font-size:12px;color:#7E93AC}}

/* Aktenkopf */
.akte{{background:var(--white);border-bottom:1px solid var(--line);padding:38px 0 0}}
.kenn{{font-family:var(--mono);font-size:12.5px;color:var(--mute);letter-spacing:.02em}}
h1{{font-family:var(--disp);font-weight:600;font-size:clamp(25px,4vw,34px);line-height:1.2;
  color:var(--ink);margin-top:6px;letter-spacing:-.01em}}
.meta{{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);
  margin-top:26px;border-top:1px solid var(--line)}}
@media(max-width:640px){{.meta{{grid-template-columns:repeat(2,1fr)}}}}
.meta div{{background:var(--white);padding:13px 4px 15px}}
.meta dt{{font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--teal);font-weight:700}}
.meta dd{{font-size:14px;color:var(--ink);margin-top:3px}}
.tag{{display:inline-block;font-size:12px;font-weight:700;border-radius:5px;padding:2px 9px}}
.tag.g{{background:var(--green-bg);color:var(--green)}}
.tag.a{{background:var(--warn-bg);color:#A85526}}

/* Warnbanner fuer archivierte Akten */
.arch{{background:var(--warn-bg);border-left:4px solid var(--warn);border-radius:0 8px 8px 0;
  padding:15px 19px;margin-top:26px;font-size:14.5px;color:#7A4A26}}
.arch b{{color:#A8461C}}

/* Umschalter */
.tabs{{display:flex;gap:5px;margin-top:30px}}
.tab{{font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;border:1px solid var(--line);
  border-bottom:none;background:var(--paper);color:var(--mute);padding:10px 19px;
  border-radius:8px 8px 0 0}}
.tab.act{{background:var(--white);color:var(--ink);box-shadow:inset 0 3px 0 var(--aurora)}}
.tab:hover{{color:var(--ink)}}

/* Inhalt */
main{{padding:34px 0 70px}}
.blatt{{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:32px 34px}}
@media(max-width:640px){{.blatt{{padding:22px 20px}}}}
.blatt p{{font-size:16px;color:var(--body-ink);margin-bottom:15px;max-width:70ch}}
.blatt p:last-child{{margin-bottom:0}}
.hinw{{font-size:13.5px;color:var(--mute);font-style:italic;margin-bottom:22px;
  padding-bottom:16px;border-bottom:1px solid var(--line-soft)}}

/* Chunk-Ansicht */
.chunk{{border:1px solid var(--line);border-radius:8px;margin-bottom:13px;overflow:hidden}}
.chunk:last-child{{margin-bottom:0}}
.chunk header{{display:flex;justify-content:space-between;align-items:center;gap:12px;
  background:var(--paper);border-bottom:1px solid var(--line);padding:8px 15px}}
.chunk .cid{{font-family:var(--mono);font-size:12.5px;color:var(--teal);font-weight:500}}
.chunk .laenge{{font-size:11.5px;color:var(--mute)}}
.chunk .txt{{padding:14px 16px;font-size:14.5px;color:var(--body-ink)}}

/* Gold-Fragen */
.gold{{margin-top:24px;background:var(--night);color:#CFDDEB;border-radius:var(--r);padding:22px 26px}}
.gold h2{{font-family:var(--ui);font-size:11px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--aurora-lt);font-weight:700;margin-bottom:12px}}
.gold ol{{padding-left:19px}}
.gold li{{font-size:14.5px;margin-bottom:9px;line-height:1.5}}
.gold li:last-child{{margin-bottom:0}}
.gold .kat{{font-family:var(--mono);font-size:11px;color:#7E93AC}}
.gold .falle{{color:#F0A882;font-weight:600}}

.fuss{{margin-top:26px;font-size:13px;color:var(--mute);text-align:center}}
</style>
</head>
<body>

<div class="top">
  <div class="wrap">
    <a class="zurueck" href="../index.html#wissensbasis">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      Zurück zur Wissensbasis
    </a>
    <span class="quelle">NordLicht Logistik GmbH · Intranet</span>
  </div>
</div>

<div class="akte">
  <div class="wrap">
    <div class="kenn">{doc_id}</div>
    <h1>{titel}</h1>
    {banner}
    <dl class="meta">
      <div><dt>Bereich</dt><dd>{kategorie}</dd></div>
      <div><dt>Stand</dt><dd>{jahr}</dd></div>
      <div><dt>Status</dt><dd><span class="tag {tagklasse}">{status}</span></dd></div>
      <div><dt>Chunks</dt><dd>{n_chunks} · {n_token} Token</dd></div>
    </dl>
    <div class="tabs">
      <button class="tab act" id="t1" onclick="zeige(1)">Dokument</button>
      <button class="tab" id="t2" onclick="zeige(2)">Als Chunks ({n_chunks})</button>
    </div>
  </div>
</div>

<main>
  <div class="wrap">
    <div class="blatt" id="ansicht1">
{absaetze}
    </div>

    <div class="blatt" id="ansicht2" style="display:none">
      <p class="hinw">So und nicht anders liegt dieses Dokument in der Vektordatenbank: zerlegt in
        {n_chunks} Absatz-Chunks. Jeder Chunk wird einzeln eingebettet und einzeln gefunden — die
        Pipeline sieht beim Suchen nie das ganze Dokument, sondern immer nur eines dieser Häppchen.</p>
{chunkliste}
    </div>

{goldblock}
    <p class="fuss">Fiktives Dokument · erzeugt für den Workshop „RAG Advanced“ · DHBW Mannheim</p>
  </div>
</main>

<script>
function zeige(n){{
  document.getElementById("ansicht1").style.display = n===1 ? "" : "none";
  document.getElementById("ansicht2").style.display = n===2 ? "" : "none";
  document.getElementById("t1").classList.toggle("act", n===1);
  document.getElementById("t2").classList.toggle("act", n===2);
}}
</script>
</body>
</html>
"""

BANNER_ARCHIV = """<div class="arch">
      <b>Diese Fassung ist archiviert.</b> Sie wurde ersetzt und gilt nicht mehr — inhaltlich ist sie
      trotzdem einschlägig formuliert. Genau deshalb sortiert eine rein relevanzbasierte Suche sie
      nach oben. Das ist der Störfall aus Notebook&nbsp;03.
    </div>"""


def baue_seite(dok, fragen_je_dok):
    ch = chunks_von(dok)
    archiviert = dok["status"] == "archiviert"

    absaetze = "\n".join(
        f"      <p>{html.escape(a.strip())}</p>"
        for a in dok["text"].split("\n\n")
        if a.strip()
    )

    chunkliste = "\n".join(
        f"""      <div class="chunk">
        <header><span class="cid">{html.escape(c['chunk_id'])}</span>
          <span class="laenge">{len(c['text'])} Zeichen · {tokenzahl(c['text'])} Token</span></header>
        <div class="txt">{html.escape(c['text'])}</div>
      </div>"""
        for c in ch
    )

    treffer = fragen_je_dok.get(dok["doc_id"], [])
    if treffer:
        eintraege = "\n".join(
            f"""        <li>{html.escape(f['frage'])}<br>
          <span class="kat">Frage {f['id']} · {html.escape(f['kategorie'])}"""
            + (' · <span class="falle">Störfall</span>' if f["kategorie"] == "falle" else "")
            + "</span></li>"
            for f in treffer
        )
        goldblock = f"""    <div class="gold">
      <h2>Gold-Fragen, die auf dieses Dokument zielen</h2>
      <ol>
{eintraege}
      </ol>
    </div>

"""
    else:
        goldblock = ""

    return KOPF.format(
        titel=html.escape(dok["titel"]),
        doc_id=html.escape(dok["doc_id"]),
        kategorie=html.escape(dok["kategorie"]),
        jahr=dok["jahr"],
        status=html.escape(dok["status"]),
        tagklasse="a" if archiviert else "g",
        banner=BANNER_ARCHIV if archiviert else "",
        n_chunks=len(ch),
        n_token=tokenzahl(dok["text"]),
        absaetze=absaetze,
        chunkliste=chunkliste,
        goldblock=goldblock,
    )


def main():
    with open(KORPUS, encoding="utf-8") as f:
        dokumente = json.load(f)["dokumente"]
    with open(TESTSET, encoding="utf-8") as f:
        fragen = json.load(f)["fragen"]

    fragen_je_dok = {}
    for fr in fragen:
        for d in fr["relevante_docs"]:
            fragen_je_dok.setdefault(d, []).append(fr)

    os.makedirs(ZIEL, exist_ok=True)
    gesamt_chunks = 0
    for dok in dokumente:
        pfad = os.path.join(ZIEL, f"{dok['doc_id']}.html")
        with open(pfad, "w", encoding="utf-8") as f:
            f.write(baue_seite(dok, fragen_je_dok))
        n = len(chunks_von(dok))
        gesamt_chunks += n
        print(f"  {dok['doc_id']:<24} {n} Chunks -> docs/akten/{dok['doc_id']}.html")

    print(f"\n{len(dokumente)} Seiten erzeugt, {gesamt_chunks} Chunks insgesamt.")


if __name__ == "__main__":
    main()
