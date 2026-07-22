// Theorie-Foliensatz "RAG Advanced" · WDSKI23A · DHBW Mannheim · Langfassung
// Palette "Aurora / NordLicht": tiefes Marineblau (dominant) + Türkis/Mint-Akzent.
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Icons = require("react-icons/fa");

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY = "0B2545", NAVY2 = "13315C", TEAL = "1C7293", AURORA = "2EC4B6",
      AURORA_LT = "9BE3D8", INK = "14213D", MUTE = "5B6B7E", LIGHT = "F4F8FB",
      WHITE = "FFFFFF", WARN = "E07A3F", WARN_BG = "FBEDE2", GREEN = "3AA76D",
      GREEN_BG = "E7F3EC", RED = "C6485B", PURP = "6C5CE7", PURP_BG = "ECE9FB";
const HEAD = "Cambria", BODY = "Calibri", MONO = "Courier New";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
const W = 13.333, H = 7.5;

// ── Icon-Rendering ───────────────────────────────────────────────────────────
async function renderIcon(name, hex) {
  const El = Icons[name];
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(El, { color: "#" + hex, size: 256 }));
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
const ICON_NAMES = {
  truck: "FaTruck", brain: "FaBrain", warn: "FaExclamationTriangle", db: "FaDatabase",
  search: "FaSearch", layers: "FaLayerGroup", filter: "FaFilter", chart: "FaChartBar",
  check: "FaClipboardCheck", bulb: "FaLightbulb", hand: "FaHandPointer", scale: "FaBalanceScale",
  cut: "FaCut", vector: "FaProjectDiagram", robot: "FaRobot", clock: "FaHistory",
  quote: "FaQuoteLeft", rocket: "FaRocket", shield: "FaShieldAlt", gauge: "FaTachometerAlt",
  link: "FaLink", users: "FaUsers", arrow: "FaArrowRight", code: "FaCode", cubes: "FaCubes",
  bolt: "FaBolt", sitemap: "FaSitemap", sync: "FaSync", key: "FaKey", book: "FaBookOpen",
  compress: "FaCompressArrowsAlt", route: "FaRoute", crosshair: "FaCrosshairs", server: "FaServer",
  balance: "FaBalanceScaleLeft", cog: "FaCogs", eye: "FaEye", tag: "FaTags", flask: "FaFlask",
};
let IC = {};
async function loadIcons() {
  for (const [k, v] of Object.entries(ICON_NAMES)) {
    IC[k] = {
      light: await renderIcon(v, AURORA), dark: await renderIcon(v, NAVY),
      warn: await renderIcon(v, WARN), white: await renderIcon(v, WHITE),
      teal: await renderIcon(v, TEAL), green: await renderIcon(v, GREEN),
      purp: await renderIcon(v, PURP),
    };
  }
}

// ── Bausteine ────────────────────────────────────────────────────────────────
const bg = (s, hex) => { s.background = { color: hex }; };
function pageNo(s, n) {
  s.addText(String(n).padStart(2, "0"), { x: W - 0.9, y: H - 0.5, w: 0.6, h: 0.3,
    align: "right", fontFace: BODY, fontSize: 10, color: MUTE });
}
function contentHead(s, kicker, title, kickerColor = TEAL) {
  s.addText(kicker.toUpperCase(), { x: 0.7, y: 0.48, w: 11.9, h: 0.32, fontFace: BODY,
    fontSize: 12.5, bold: true, color: kickerColor, charSpacing: 2 });
  s.addText(title, { x: 0.7, y: 0.8, w: 11.9, h: 0.7, fontFace: HEAD, fontSize: 31, bold: true, color: INK });
}
function iconCircle(s, x, y, d, fillHex, iconData) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fillHex } });
  const pad = d * 0.26;
  s.addImage({ data: iconData, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}
function card(s, x, y, w, h, fillHex, opts = {}) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.09, fill: { color: fillHex },
    line: opts.line || { type: "none" },
    shadow: opts.noShadow ? undefined : { type: "outer", color: "0B2545", opacity: 0.15, blur: 7, offset: 3, angle: 90 } });
}
function chip(s, x, y, w, text, fillHex, textHex, h = 0.34, fs = 11) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: h / 2, fill: { color: fillHex } });
  s.addText(text, { x, y, w, h, align: "center", valign: "middle", fontFace: BODY, fontSize: fs, bold: true, color: textHex, margin: 0 });
}
function bullets(s, x, y, w, h, items, opts = {}) {
  s.addText(items.map((t) => ({
    text: t, options: { bullet: { code: "2022", indent: 14 }, color: opts.color || INK,
      fontFace: BODY, fontSize: opts.fontSize || 14.5, paraSpaceAfter: opts.gap != null ? opts.gap : 9, breakLine: true },
  })), { x, y, w, h, valign: "top" });
}
function auroraBands(s, ox, oy, rot, sign = 1) {
  s.addShape(pres.ShapeType.roundRect, { x: ox, y: oy, w: 6.5, h: 3.4, rectRadius: 0.4,
    fill: { color: TEAL, transparency: 58 }, rotate: rot, line: { type: "none" } });
  s.addShape(pres.ShapeType.roundRect, { x: ox + 0.9 * sign, y: oy + 0.4, w: 6.5, h: 2.2, rectRadius: 0.4,
    fill: { color: AURORA, transparency: 64 }, rotate: rot, line: { type: "none" } });
}
// Abschnitts-Teiler
function sectionDivider(no, num, title, sub, items, iconKey) {
  const s = pres.addSlide(); bg(s, NAVY);
  auroraBands(s, 8.9, 4.7, 20, 1);
  s.addText(`TEIL ${num}`, { x: 0.9, y: 2.35, w: 6, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: AURORA_LT, charSpacing: 3 });
  s.addText(title, { x: 0.85, y: 2.75, w: 9.5, h: 1.1, fontFace: HEAD, fontSize: 42, bold: true, color: WHITE });
  s.addText(sub, { x: 0.9, y: 3.95, w: 8.6, h: 0.5, fontFace: BODY, fontSize: 16, italic: true, color: "C4D3E4" });
  let y = 4.75;
  items.forEach((it) => {
    s.addShape(pres.ShapeType.ellipse, { x: 0.95, y: y + 0.03, w: 0.16, h: 0.16, fill: { color: AURORA } });
    s.addText(it, { x: 1.35, y: y - 0.08, w: 8.2, h: 0.4, valign: "middle", fontFace: BODY, fontSize: 14.5, color: "DCE6F1" });
    y += 0.46;
  });
  iconCircle(s, 11.15, 2.4, 1.5, "16305A", IC[iconKey].light);
  pageNo(s, no);
  return s;
}
// Hands-on-Übergang
function handsOn(no, nb, title, items) {
  const s = pres.addSlide(); bg(s, NAVY);
  s.addShape(pres.ShapeType.roundRect, { x: 9.0, y: 4.9, w: 6.5, h: 3.4, rectRadius: 0.4,
    fill: { color: AURORA, transparency: 66 }, rotate: 18, line: { type: "none" } });
  iconCircle(s, 0.9, 1.15, 1.3, AURORA, IC.hand.dark);
  s.addText("JETZT IHR · HANDS-ON", { x: 2.5, y: 1.2, w: 9, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: AURORA_LT, charSpacing: 2 });
  s.addText(`Notebook ${nb}`, { x: 2.45, y: 1.55, w: 9.5, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: WHITE });
  s.addText(title, { x: 0.9, y: 2.95, w: 11.5, h: 0.7, fontFace: HEAD, fontSize: 22, bold: true, color: AURORA_LT });
  let iy = 3.95;
  items.forEach((it) => {
    s.addShape(pres.ShapeType.roundRect, { x: 0.9, y: iy, w: 0.42, h: 0.42, rectRadius: 0.21, fill: { color: NAVY2 } });
    s.addImage({ data: IC.arrow.white, x: 1.0, y: iy + 0.1, w: 0.22, h: 0.22 });
    s.addText(it, { x: 1.55, y: iy - 0.05, w: 10.8, h: 0.55, valign: "middle", fontFace: BODY, fontSize: 15.5, color: "DCE6F1" });
    iy += 0.72;
  });
  s.addShape(pres.ShapeType.line, { x: 0.9, y: 6.35, w: 11.5, h: 0, line: { color: "35507A", width: 1 } });
  s.addText("Die ✅-Selbsttest-Zellen sagen euch, wann eine Übung sitzt. Floorwalker helfen — einfach melden.", {
    x: 0.9, y: 6.5, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: "9FB2C9" });
  pageNo(s, no);
  return s;
}

async function build() {
  await loadIcons();

  // ══ 1 · TITEL ══════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, NAVY);
    auroraBands(s, 8.7, -1.6, 25, 1);
    s.addText("WORKSHOP · SÄULE 2 — LLMs, RAG & AGENTS", { x: 0.9, y: 1.3, w: 10, h: 0.4,
      fontFace: BODY, fontSize: 14, bold: true, color: AURORA_LT, charSpacing: 2 });
    s.addText("RAG Advanced", { x: 0.85, y: 1.8, w: 11.5, h: 1.4, fontFace: HEAD, fontSize: 60, bold: true, color: WHITE });
    s.addText("Warum naive Retrieval-Pipelines scheitern — und wie Hybrid Search, Reranking und Evaluation sie retten.", {
      x: 0.9, y: 3.3, w: 10.8, h: 0.9, fontFace: BODY, fontSize: 18, color: "CBD9E8", lineSpacingMultiple: 1.1 });
    iconCircle(s, 0.9, 4.72, 0.6, TEAL, IC.truck.white);
    s.addText("Use Case: NordLicht Logistik GmbH — internes Wissen für Kundenservice & Personal", {
      x: 1.65, y: 4.75, w: 10.5, h: 0.55, valign: "middle", fontFace: BODY, fontSize: 14.5, italic: true, color: AURORA_LT });
    s.addShape(pres.ShapeType.line, { x: 0.9, y: 6.1, w: 11.5, h: 0, line: { color: "35507A", width: 1 } });
    s.addText("Jannik Braunshausen · Theodor Höfer · Darnell Himmighöfer", {
      x: 0.9, y: 6.25, w: 8.5, h: 0.4, fontFace: BODY, fontSize: 15, color: WHITE, bold: true });
    s.addText("WDSKI23A · DHBW Mannheim", { x: 8.5, y: 6.25, w: 3.9, h: 0.4, align: "right", fontFace: BODY, fontSize: 13, color: "9FB2C9" });
    s.addNotes("Begrüßung. Story-Hook: 850 Mitarbeitende, das Wissen steht in Dokumenten — aber niemand findet es. WICHTIG: jetzt die Setup-Zelle von NB 01 starten lassen, damit die Modell-Downloads während des Theorieteils laufen.");
  }

  // ══ 2 · AGENDA ═════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Fahrplan", "Was euch heute erwartet");
    const rows = [
      { ic: IC.book.light, t: "Teil 1 · RAG-Grundlagen", d: "Embeddings, Vektor-DBs, Chunking, der Prompt — und warum naives RAG scheitert.", col: TEAL },
      { ic: IC.layers.light, t: "Teil 2 · Advanced RAG", d: "Hybrid Search, RRF, Reranking, die Metadaten-Falle und Evaluation.", col: AURORA },
      { ic: IC.rocket.light, t: "Teil 3 · Über RAG hinaus", d: "Fine-Tuning vs. RAG, LoRA/QLoRA und ein Ausblick auf Agents.", col: TEAL },
    ];
    let y = 1.75;
    rows.forEach((r, i) => {
      card(s, 0.7, y, 8.0, 1.35, WHITE);
      iconCircle(s, 1.0, y + 0.3, 0.75, r.col, r.ic);
      s.addText(r.t, { x: 2.0, y: y + 0.22, w: 6.4, h: 0.45, fontFace: HEAD, fontSize: 18, bold: true, color: INK });
      s.addText(r.d, { x: 2.0, y: y + 0.66, w: 6.5, h: 0.55, fontFace: BODY, fontSize: 13, color: MUTE, lineSpacingMultiple: 1.02 });
      y += 1.5;
    });
    // rechte Spalte: Format + Zeiten
    card(s, 8.95, 1.75, 3.65, 4.35, NAVY);
    s.addText("Format", { x: 9.3, y: 2.05, w: 3, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: AURORA_LT });
    const meta = [
      [IC.hand.dark, "Mitmach-Workshop", "4 Notebooks in Colab — kein Frontalvortrag"],
      [IC.clock.dark, "~ 2 Stunden", "Konzept · Hands-on · Reflexion"],
      [IC.users.dark, "In 2er-Teams", "am eigenen Rechner, mit Betreuung"],
      [IC.key.dark, "Komplett kostenlos", "Open-Source-Modelle, keine API-Keys"],
    ];
    let my = 2.55;
    meta.forEach(([ic, t, d]) => {
      iconCircle(s, 9.3, my, 0.55, "1B3A66", ic);
      s.addText(t, { x: 9.95, y: my - 0.04, w: 2.6, h: 0.35, fontFace: BODY, fontSize: 13.5, bold: true, color: WHITE });
      s.addText(d, { x: 9.95, y: my + 0.3, w: 2.6, h: 0.5, fontFace: BODY, fontSize: 10.5, color: "B7C6D8", lineSpacingMultiple: 1.0 });
      my += 0.88;
    });
    pageNo(s, 2);
    s.addNotes("Struktur in drei Teilen. Teil 1 legt die Grundlagen, damit alle dem Hands-on folgen können. Betonen: Mitmach-Format, kostenlos, Teamarbeit.");
  }

  // ══ 3 · LERNZIELE ══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Ziel des Workshops", "Was ihr danach könnt");
    const goals = [
      { ic: IC.sitemap.white, c: TEAL, t: "Eine RAG-Pipeline erklären", d: "Von Chunking über Embeddings und Vektorsuche bis zur Antwortgenerierung." },
      { ic: IC.search.white, c: AURORA, t: "Verstehen, warum naives RAG scheitert", d: "Vocabulary Mismatch, fehlende exakte Begriffe, veraltete Quellen." },
      { ic: IC.layers.white, c: TEAL, t: "Advanced-RAG einordnen", d: "Hybrid Search, Reciprocal Rank Fusion und Cross-Encoder-Reranking gezielt einsetzen." },
      { ic: IC.chart.white, c: AURORA, t: "Retrieval-Qualität messen", d: "Mit Hit@3, MRR und der RAGAS-Logik eine Pipeline objektiv bewerten." },
      { ic: IC.balance.white, c: TEAL, t: "RAG von Fine-Tuning abgrenzen", d: "Wissensproblem vs. Verhaltensproblem — und wann welcher Hebel greift." },
      { ic: IC.robot.white, c: AURORA, t: "Agents einordnen", d: "Wann ein einzelner Retrieval-Schritt nicht reicht und ReAct ins Spiel kommt." },
    ];
    const cw = 3.85, ch = 1.95, gx = 0.35, gy = 0.3;
    goals.forEach((g, i) => {
      const x = 0.7 + (i % 3) * (cw + gx);
      const y = 1.85 + Math.floor(i / 3) * (ch + gy);
      card(s, x, y, cw, ch, LIGHT);
      iconCircle(s, x + 0.3, y + 0.3, 0.65, g.c, g.ic);
      s.addText(g.t, { x: x + 1.05, y: y + 0.28, w: cw - 1.25, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 14.5, bold: true, color: INK });
      s.addText(g.d, { x: x + 0.3, y: y + 1.02, w: cw - 0.6, h: 0.85, fontFace: BODY, fontSize: 12, color: MUTE, lineSpacingMultiple: 1.05 });
    });
    pageNo(s, 3);
    s.addNotes("Die sechs Lernziele decken sich mit VL 3. Kurz durchgehen — das ist der Kompass für die nächsten zwei Stunden.");
  }

  // ══ SECTION 1 ══════════════════════════════════════════════════════════════
  sectionDivider(4, "1", "RAG-Grundlagen", "Wie eine Retrieval-Pipeline von Grund auf funktioniert", [
    "Das Wissensproblem der LLMs und die Idee von RAG",
    "Embeddings, Bi-Encoder und Vektordatenbanken",
    "Chunking-Strategien und der erweiterte Prompt",
    "Warum die naive Pipeline an ihre Grenzen stößt",
  ], "book").addNotes("Übergang in den Grundlagenteil. Ziel: Alle im Raum haben dasselbe mentale Modell, bevor es ans Selbstbauen geht.");

  // ══ 5 · WISSENSPROBLEM ═════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Warum überhaupt RAG?", "LLMs haben ein Wissensproblem");
    const roots = [
      { ic: IC.clock.light, t: "Statisches Wissen", d: "Das Modell kennt nur seinen Trainingsstand. Interne Dokumente und aktuelle Fakten fehlen." },
      { ic: IC.brain.light, t: "Keine Quellen", d: "Antworten sind plausibel formuliert, aber nicht belegt — Halluzinationen sind strukturell angelegt." },
      { ic: IC.db.light, t: "Kein Zugriff", d: "Firmenwissen liegt in Systemen, auf die das LLM von sich aus keinen Zugriff hat." },
    ];
    let x = 0.7; const cw = 3.9, gap = 0.32;
    roots.forEach((r) => {
      card(s, x, 2.05, cw, 2.65, WHITE);
      iconCircle(s, x + 0.35, 2.4, 0.75, TEAL, r.ic);
      s.addText(r.t, { x: x + 1.25, y: 2.45, w: cw - 1.5, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
      s.addText(r.d, { x: x + 0.35, y: 3.35, w: cw - 0.7, h: 1.25, fontFace: BODY, fontSize: 13, color: MUTE, lineSpacingMultiple: 1.05 });
      x += cw + gap;
    });
    card(s, 0.7, 5.05, 11.9, 1.35, NAVY);
    iconCircle(s, 1.1, 5.35, 0.75, AURORA, IC.search.dark);
    s.addText([
      { text: "Die Lösung zur Laufzeit:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 15 } },
      { text: "relevante Dokumente suchen und dem LLM als Kontext mitgeben. Es antwortet aus dem, was es gerade liest — statt aus dem Gedächtnis. Das ist ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
      { text: "Retrieval-Augmented Generation.", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 15 } },
    ], { x: 2.05, y: 5.35, w: 10.2, h: 0.8, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 5);
    s.addNotes("Drei Wurzeln des Wissensproblems (VL 3). Kernbotschaft: RAG behebt ein WISSENS-Problem, kein Verhaltensproblem — die Abgrenzung zu Fine-Tuning kommt in Teil 3.");
  }

  // ══ 6 · AIR CANADA ═════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, NAVY);
    s.addText("WARNGESCHICHTE", { x: 0.9, y: 0.7, w: 8, h: 0.35, fontFace: BODY, fontSize: 12.5, bold: true, color: WARN, charSpacing: 2 });
    s.addText("Wenn der Bot Unsinn erzählt, haftet das Unternehmen", { x: 0.9, y: 1.05, w: 11.5, h: 1.0, fontFace: HEAD, fontSize: 30, bold: true, color: WHITE });
    iconCircle(s, 0.95, 2.55, 1.0, "1B3A66", IC.quote.warn);
    card(s, 2.4, 2.5, 6.1, 3.5, NAVY2);
    s.addText("Der Fall Air Canada (2024)", { x: 2.8, y: 2.8, w: 5.3, h: 0.5, fontFace: HEAD, fontSize: 17, bold: true, color: AURORA_LT });
    bullets(s, 2.8, 3.4, 5.3, 2.5, [
      "Ein Support-Chatbot erfindet eine Rückerstattungs-Regel, die es nie gab.",
      "Ein Kunde verlässt sich darauf und klagt.",
      "Das Gericht entscheidet: Die Airline haftet für die Aussage ihres Bots.",
    ], { color: "DCE6F1", fontSize: 14.5, gap: 12 });
    card(s, 8.8, 2.5, 3.8, 3.5, "3A1F14");
    s.addText("Die Lektion", { x: 9.15, y: 2.8, w: 3.1, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: WARN });
    s.addText("Eine flüssige, falsche Antwort ist teurer als gar keine.\n\nVertrauen, Recht und Reputation hängen an der Faktentreue.", {
      x: 9.15, y: 3.35, w: 3.15, h: 2.5, fontFace: BODY, fontSize: 14, color: "F0D9CB", lineSpacingMultiple: 1.15 });
    s.addText("Genau diese Art Fehler werden wir heute an unserer eigenen Pipeline reproduzieren — und beheben.", {
      x: 0.9, y: 6.35, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 13.5, italic: true, color: AURORA_LT });
    pageNo(s, 6);
    s.addNotes("Der emotionale Anker. Am Ende (NB 03) bauen wir denselben Fehlertyp nach: eine treue Antwort aus einer falschen Quelle.");
  }

  // ══ 7 · ARCHITEKTUR ZWEI PHASEN ════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Die Architektur", "RAG in zwei Phasen");
    card(s, 0.7, 2.05, 5.75, 4.3, LIGHT);
    chip(s, 1.05, 2.35, 2.5, "PHASE 1 · OFFLINE (einmalig)", "E3EEF3", TEAL);
    const off = [[IC.cut.teal, "Chunking", "Dokumente in Häppchen teilen"], [IC.vector.teal, "Embedding", "Jeder Chunk wird zum Vektor"], [IC.db.teal, "Indexieren", "Vektoren in die Vektor-Datenbank"]];
    let oy = 2.95;
    off.forEach(([ic, t, d]) => {
      iconCircle(s, 1.05, oy, 0.6, WHITE, ic);
      s.addShape(pres.ShapeType.ellipse, { x: 1.05, y: oy, w: 0.6, h: 0.6, fill: { type: "none" }, line: { color: TEAL, width: 1.25 } });
      s.addText(t, { x: 1.85, y: oy - 0.02, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 14.5, bold: true, color: INK });
      s.addText(d, { x: 1.85, y: oy + 0.32, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 12, color: MUTE });
      oy += 1.05;
    });
    card(s, 6.85, 2.05, 5.75, 4.3, NAVY);
    chip(s, 7.2, 2.35, 2.7, "PHASE 2 · ZUR LAUFZEIT (pro Frage)", "1B3A66", AURORA_LT);
    const on = [[IC.search.dark, "Retrieval", "Passende Chunks zur Frage suchen"], [IC.link.dark, "Augmentierung", "Chunks in den Prompt einbetten"], [IC.robot.dark, "Generierung", "LLM antwortet aus dem Kontext"]];
    let ny = 2.95;
    on.forEach(([ic, t, d]) => {
      iconCircle(s, 7.2, ny, 0.6, AURORA, ic);
      s.addText(t, { x: 8.0, y: ny - 0.02, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 14.5, bold: true, color: WHITE });
      s.addText(d, { x: 8.0, y: ny + 0.32, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 12, color: "C4D3E4" });
      ny += 1.05;
    });
    s.addText("Der Schlüsselsatz für heute: Die Generierung kann nur so gut sein wie das Retrieval.", {
      x: 0.7, y: 6.5, w: 11.9, h: 0.4, align: "center", fontFace: BODY, fontSize: 14, bold: true, italic: true, color: TEAL });
    pageNo(s, 7);
    s.addNotes("Zwei Phasen sauber trennen. Offline berechnen wir einmal alle Vektoren (Bi-Encoder!), online läuft nur Suche + Generierung. Der Merksatz unten trägt den gesamten Rest des Workshops.");
  }

  // ══ 8 · WAS IST EIN EMBEDDING ══════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Grundbaustein", "Was ist ein Embedding?");
    card(s, 0.7, 2.0, 5.75, 2.15, WHITE);
    s.addText("Vom Wort zur Zahl", { x: 1.05, y: 2.25, w: 5.0, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    s.addText("Ein neuronales Netz rechnet mit Vektoren — ein Wort wie „Hamburg\" ist keine Zahl. Ein Embedding bildet Text auf einen dichten Vektor ab (typisch 128–4096 Dimensionen).", {
      x: 1.05, y: 2.7, w: 5.1, h: 1.35, fontFace: BODY, fontSize: 13.5, color: MUTE, lineSpacingMultiple: 1.15 });
    card(s, 0.7, 4.3, 5.75, 2.1, WHITE);
    s.addText("Die zentrale Eigenschaft", { x: 1.05, y: 4.55, w: 5.0, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: TEAL });
    s.addText("Ähnliche Bedeutung → ähnliche Vektoren. „Paket\" und „Sendung\" landen nah beieinander, „Paket\" und „Urlaub\" weit auseinander. Das macht Bedeutung rechenbar.", {
      x: 1.05, y: 5.0, w: 5.1, h: 1.3, fontFace: BODY, fontSize: 13.5, color: MUTE, lineSpacingMultiple: 1.15 });
    // Kosinus-Panel
    card(s, 6.85, 2.0, 5.75, 4.4, NAVY);
    s.addText("Nähe messen: Kosinus-Ähnlichkeit", { x: 7.2, y: 2.3, w: 5.1, h: 0.4, fontFace: HEAD, fontSize: 15.5, bold: true, color: AURORA_LT });
    s.addText("Der Winkel zwischen zwei Vektoren — nicht ihre Länge — misst, wie ähnlich zwei Texte sind:", {
      x: 7.2, y: 2.75, w: 5.1, h: 0.65, fontFace: BODY, fontSize: 13, color: "C4D3E4", lineSpacingMultiple: 1.1 });
    s.addText([
      { text: "cos(v", options: { fontFace: HEAD, fontSize: 22, italic: true, color: WHITE } },
      { text: "q", options: { fontFace: HEAD, fontSize: 13, italic: true, color: AURORA_LT } },
      { text: ", v", options: { fontFace: HEAD, fontSize: 22, italic: true, color: WHITE } },
      { text: "d", options: { fontFace: HEAD, fontSize: 13, italic: true, color: AURORA_LT } },
      { text: ") ∈ [−1, 1]", options: { fontFace: HEAD, fontSize: 22, italic: true, color: WHITE } },
    ], { x: 7.2, y: 3.45, w: 5.1, h: 0.6, valign: "middle" });
    // kleine Skala
    const scaleY = 4.35;
    s.addShape(pres.ShapeType.line, { x: 7.4, y: scaleY, w: 4.7, h: 0, line: { color: "35507A", width: 2 } });
    [["1,0", 7.4, AURORA, "identisch"], ["0,5", 9.0, "9FB2C9", "verwandt"], ["0", 10.6, "9FB2C9", "unabhängig"]].forEach(([v, x, c, lab]) => {
      s.addShape(pres.ShapeType.ellipse, { x: x - 0.06, y: scaleY - 0.06, w: 0.12, h: 0.12, fill: { color: c } });
      s.addText(v, { x: x - 0.4, y: scaleY - 0.5, w: 0.8, h: 0.3, align: "center", fontFace: BODY, fontSize: 12, bold: true, color: WHITE });
      s.addText(lab, { x: x - 0.7, y: scaleY + 0.12, w: 1.4, h: 0.3, align: "center", fontFace: BODY, fontSize: 9.5, color: "9FB2C9" });
    });
    card(s, 7.2, 5.35, 5.05, 0.85, "1B3A66");
    s.addText("Beispiel: „Passwort zurücksetzen?\" ↔ „Passwort vergessen?\"  →  cos ≈ 0,92", {
      x: 7.4, y: 5.35, w: 4.65, h: 0.85, valign: "middle", fontFace: BODY, fontSize: 12.5, italic: true, color: AURORA_LT, lineSpacingMultiple: 1.1 });
    pageNo(s, 8);
    s.addNotes("Fundament für alles Weitere. Analogie: Bedeutung wird zu Koordinaten im Raum. Kosinus = Winkel, nicht Länge. Die 0,92 ist das SBERT-Beispiel aus VL 3.");
  }

  // ══ 9 · BI-ENCODER / SBERT ═════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Das Retrieval-Werkzeug", "Der Bi-Encoder (SBERT)");
    s.addText("Zwei Encoder teilen sich die Gewichte und verarbeiten Frage und Dokument unabhängig voneinander — dadurch lassen sich alle Dokument-Vektoren einmal vorberechnen.", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.6, fontFace: BODY, fontSize: 14.5, color: MUTE, lineSpacingMultiple: 1.1 });
    // Diagramm
    const dy = 2.75;
    card(s, 1.3, dy, 3.4, 2.6, LIGHT);
    s.addText("Frage", { x: 1.3, y: dy + 0.2, w: 3.4, h: 0.35, align: "center", fontFace: BODY, fontSize: 13, bold: true, color: INK });
    s.addText("„Passwort zurücksetzen?\"", { x: 1.45, y: dy + 0.55, w: 3.1, h: 0.35, align: "center", fontFace: BODY, fontSize: 11.5, italic: true, color: MUTE });
    chip(s, 1.85, dy + 1.05, 2.3, "Embedding-Modell", "E3EEF3", TEAL, 0.42, 12);
    iconCircle(s, 2.35, dy + 1.7, 0.6, TEAL, IC.vector.white);
    s.addText("v_q", { x: 2.95, y: dy + 1.78, w: 1.2, h: 0.4, valign: "middle", fontFace: HEAD, fontSize: 18, italic: true, bold: true, color: TEAL });
    card(s, 8.6, dy, 3.4, 2.6, LIGHT);
    s.addText("FAQ-Eintrag", { x: 8.6, y: dy + 0.2, w: 3.4, h: 0.35, align: "center", fontFace: BODY, fontSize: 13, bold: true, color: INK });
    s.addText("„Passwort vergessen?\"", { x: 8.75, y: dy + 0.55, w: 3.1, h: 0.35, align: "center", fontFace: BODY, fontSize: 11.5, italic: true, color: MUTE });
    chip(s, 9.15, dy + 1.05, 2.3, "Embedding-Modell", "E4F6F3", "1B7A70", 0.42, 12);
    iconCircle(s, 9.65, dy + 1.7, 0.6, AURORA, IC.vector.dark);
    s.addText("v_d", { x: 10.25, y: dy + 1.78, w: 1.2, h: 0.4, valign: "middle", fontFace: HEAD, fontSize: 18, italic: true, bold: true, color: "1B7A70" });
    // Mitte: cos
    s.addImage({ data: IC.arrow.teal, x: 4.9, y: dy + 1.85, w: 0.35, h: 0.35 });
    s.addImage({ data: IC.arrow.teal, x: 8.05, y: dy + 1.85, w: 0.35, h: 0.35, rotate: 180 });
    card(s, 5.35, dy + 1.35, 2.65, 1.35, NAVY);
    s.addText("cos ≈ 0,92", { x: 5.35, y: dy + 1.5, w: 2.65, h: 0.5, align: "center", fontFace: HEAD, fontSize: 22, bold: true, color: AURORA_LT });
    s.addText("hohe Ähnlichkeit", { x: 5.35, y: dy + 2.05, w: 2.65, h: 0.4, align: "center", fontFace: BODY, fontSize: 11, italic: true, color: "C4D3E4" });
    // Vorteil-Leiste
    card(s, 0.7, 5.65, 11.9, 0.95, GREEN_BG);
    iconCircle(s, 1.0, 5.85, 0.55, GREEN, IC.bolt.white);
    s.addText([
      { text: "Warum das zählt:  ", options: { bold: true, color: GREEN, fontFace: BODY, fontSize: 14 } },
      { text: "Dokument-Vektoren werden einmal offline berechnet. Zur Laufzeit muss nur die Frage encodiert und der Abstand verglichen werden — aus Stunden werden Sekunden.", options: { color: "2E4A3A", fontFace: BODY, fontSize: 14 } },
    ], { x: 1.7, y: 5.85, w: 10.6, h: 0.6, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 9);
    s.addNotes("SBERT (Reimers & Gurevych 2019), siamesische Architektur. Kernpunkt: getrennt encodieren = vorberechenbar. Das ist der Gegensatz zum Cross-Encoder in Teil 2, der beides gemeinsam liest.");
  }

  // ══ 10 · VEKTORDATENBANKEN: WARUM SPEZIELL ═════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Skalierung", "Warum eine Vektordatenbank?");
    card(s, 0.7, 2.0, 5.75, 2.75, WARN_BG);
    iconCircle(s, 1.05, 2.35, 0.7, WARN, IC.server.white);
    s.addText("Naiv: Brute-Force", { x: 1.95, y: 2.4, w: 4.3, h: 0.6, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    s.addText("Bei jeder Frage den Abstand zu allen Vektoren rechnen. Bei 1 Mio. Vektoren × 768 Dim. sind das 750 Mio. Operationen — pro Query.", {
      x: 1.05, y: 3.2, w: 5.1, h: 0.95, fontFace: BODY, fontSize: 13, color: "5A3A28", lineSpacingMultiple: 1.12 });
    chip(s, 1.05, 4.25, 1.7, "Komplexität O(n)", WHITE, WARN, 0.34, 11);
    card(s, 6.85, 2.0, 5.75, 2.75, GREEN_BG);
    iconCircle(s, 7.2, 2.35, 0.7, GREEN, IC.route.white);
    s.addText("Lösung: ANN", { x: 8.1, y: 2.4, w: 4.3, h: 0.6, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    s.addText("Approximate Nearest Neighbor: nicht exakt den nächsten, sondern schnell einen sehr guten Nachbarn finden. In der Praxis vernachlässigbarer Qualitätsverlust.", {
      x: 7.2, y: 3.2, w: 5.1, h: 0.95, fontFace: BODY, fontSize: 13, color: "2E4A3A", lineSpacingMultiple: 1.12 });
    chip(s, 7.2, 4.25, 1.75, "Komplexität O(log n)", WHITE, GREEN, 0.34, 11);
    // HNSW-Band
    card(s, 0.7, 4.95, 11.9, 1.55, NAVY);
    s.addText("HNSW · Hierarchical Navigable Small World", { x: 1.05, y: 5.15, w: 6.5, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: AURORA_LT });
    s.addText("(Malkov & Yashunin, 2018)", { x: 7.4, y: 5.22, w: 3, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: "9FB2C9" });
    s.addText("Ein mehrschichtiger Graph: Die Suche startet oben mit großen Sprüngen, navigiert zur richtigen Region und findet auf der untersten Ebene das genaue Ergebnis.", {
      x: 1.05, y: 5.58, w: 8.1, h: 0.8, fontFace: BODY, fontSize: 12.5, color: "DCE6F1", lineSpacingMultiple: 1.12 });
    // Mini-HNSW-Visual (3 Ebenen)
    const gy0 = 5.55;
    [0, 1, 2].forEach((lvl) => {
      const yy = gy0 + lvl * 0.3;
      const n = lvl === 0 ? 6 : lvl === 1 ? 4 : 2;
      for (let i = 0; i < n; i++) {
        const xx = 9.55 + i * (2.5 / (n - 1 || 1));
        s.addShape(pres.ShapeType.ellipse, { x: xx, y: yy, w: 0.1, h: 0.1, fill: { color: lvl === 2 ? AURORA : "5A7BA6" } });
      }
    });
    s.addText("Ebene 2 → 0", { x: 9.55, y: gy0 + 0.92, w: 2.6, h: 0.25, align: "center", fontFace: BODY, fontSize: 9, italic: true, color: "9FB2C9" });
    pageNo(s, 10);
    s.addNotes("Der Grund, warum man keine Excel-Tabelle nimmt. Brute-Force O(n) vs. HNSW O(log n). Für unsere 36 Chunks reicht numpy — aber ab Millionen Chunks braucht man genau das.");
  }

  // ══ 11 · VEKTORDATENBANK-LANDSCHAFT ════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Werkzeug-Landschaft", "Welche Vektordatenbank?");
    const dbs = [
      { ic: IC.db.white, c: TEAL, t: "pgvector", tag: "PostgreSQL-Extension", d: "Vektorsuche direkt in Postgres, kein neuer Stack. Ideal für kleinere Projekte.", star: true },
      { ic: IC.bolt.white, c: AURORA, t: "Qdrant", tag: "Dedicated · Rust", d: "Sehr schnell, speichereffizient, Hybrid Search nativ. Gut für Production." },
      { ic: IC.cubes.white, c: TEAL, t: "Chroma", tag: "Lightweight", d: "Einfachster Einstieg, In-Process-Python. Für Notebooks und Prototypen." },
      { ic: IC.sitemap.white, c: AURORA, t: "Weaviate", tag: "Cloud-native", d: "Hybrid & multimodal eingebaut, GraphQL-API für komplexe Schemata." },
    ];
    const cw = 2.85, gx = 0.28;
    dbs.forEach((d, i) => {
      const x = 0.7 + i * (cw + gx);
      card(s, x, 2.05, cw, 3.4, i === 0 ? "EAF6FA" : LIGHT, i === 0 ? { line: { color: TEAL, width: 1.5 } } : {});
      iconCircle(s, x + cw / 2 - 0.4, 2.35, 0.8, d.c, d.ic);
      s.addText(d.t, { x, y: 3.25, w: cw, h: 0.4, align: "center", fontFace: HEAD, fontSize: 18, bold: true, color: INK });
      chip(s, x + cw / 2 - 1.1, 3.72, 2.2, d.tag, WHITE, d.c, 0.32, 10.5);
      s.addText(d.d, { x: x + 0.25, y: 4.2, w: cw - 0.5, h: 1.15, align: "center", fontFace: BODY, fontSize: 11.5, color: MUTE, lineSpacingMultiple: 1.1 });
      if (d.star) s.addText("★ unser Stack-Vorbild", { x, y: 5.15, w: cw, h: 0.25, align: "center", fontFace: BODY, fontSize: 9.5, bold: true, color: TEAL });
    });
    card(s, 0.7, 5.7, 11.9, 0.7, NAVY);
    s.addText([
      { text: "Faustregel:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 14 } },
      { text: "pgvector, wenn es einfach bleiben soll — Qdrant, wenn Hybrid Search und Performance gefragt sind. Im Workshop nutzen wir bewusst nur numpy: 36 Chunks brauchen keinen Index.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14 } },
    ], { x: 1.05, y: 5.7, w: 11.2, h: 0.7, valign: "middle" });
    pageNo(s, 11);
    s.addNotes("Marktüberblick aus VL 3. Wichtig für die Q&A: Warum numpy statt pgvector? Weil die Konzepte identisch sind und 36 Chunks keinen ANN-Index brauchen. pgvector wäre der Produktionsschritt.");
  }

  // ══ 12 · CHUNKING-STRATEGIEN ═══════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Dokumente aufbereiten", "Chunking-Strategien");
    s.addText("Embedding-Modelle verarbeiten begrenzte Textlängen, und kleinere Einheiten lassen sich präziser wiederfinden. Wie man teilt, entscheidet über die Retrieval-Qualität.", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.55, fontFace: BODY, fontSize: 14, color: MUTE, lineSpacingMultiple: 1.1 });
    const strat = [
      { ic: IC.cut.white, c: TEAL, t: "Fixed-Size", sub: "Der robuste Default", pts: ["Feste Tokenzahl je Chunk", "Overlap gegen Kontextverlust", "Sweet Spot: 256–512 Token", "Overlap: 50–100 Token (10–20 %)"] },
      { ic: IC.crosshair.white, c: AURORA, t: "Semantic", sub: "Thematisch kohärent", pts: ["Kosinus zwischen Nachbarsätzen", "Teilen bei Ähnlichkeitsabfall", "Kohärente Einheiten", "Langsamer, variable Größen"] },
      { ic: IC.sitemap.white, c: PURP, t: "Hierarchical", sub: "State of the Art", pts: ["Kleine Child-Chunks fürs Retrieval", "Große Parent-Chunks für den LLM-Kontext", "Karteikarte suchen, Kapitel lesen", "Für komplexe Dokumente"] },
    ];
    const cw = 3.85, gx = 0.35;
    strat.forEach((st, i) => {
      const x = 0.7 + i * (cw + gx);
      card(s, x, 2.4, cw, 3.15, WHITE);
      iconCircle(s, x + 0.3, 2.7, 0.7, st.c, st.ic);
      s.addText(st.t, { x: x + 1.1, y: 2.68, w: cw - 1.3, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: INK });
      s.addText(st.sub, { x: x + 1.1, y: 3.08, w: cw - 1.3, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: st.c });
      bullets(s, x + 0.3, 3.6, cw - 0.6, 1.9, st.pts, { fontSize: 11.5, gap: 6 });
    });
    card(s, 0.7, 5.75, 11.9, 0.65, NAVY);
    s.addText([
      { text: "In der Praxis:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 13.5 } },
      { text: "Fixed-Size als Baseline. Semantic oder Hierarchical, wenn die RAGAS-Scores niedrig sind. Chunk-Größen immer empirisch testen. — Im Workshop: 1 Absatz = 1 Chunk.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 13.5 } },
    ], { x: 1.05, y: 5.75, w: 11.2, h: 0.65, valign: "middle" });
    pageNo(s, 12);
    s.addNotes("Drei Strategien aus VL 3. Unser NB nutzt bewusst Absatz-Chunking (simpel, nachvollziehbar). Diskussionsanker: Was wäre bei 50-seitigen Verträgen anders? → Hierarchical.");
  }

  // ══ 13 · DER ERWEITERTE PROMPT ═════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Das Herzstück der Generierung", "Der erweiterte Prompt");
    const parts = [
      { n: "1", t: "System-Instruktion", d: "„Beantworte die Frage ausschließlich anhand des Kontexts. Steht die Antwort nicht drin, sage es ehrlich.\"", c: TEAL },
      { n: "2", t: "Kontext-Chunks", d: "Die k ähnlichsten Dokumentabschnitte — nummeriert und mit Quellenangabe.", c: AURORA },
      { n: "3", t: "Nutzeranfrage", d: "Die ursprüngliche Frage, unverändert angehängt.", c: TEAL },
    ];
    let y = 1.95;
    parts.forEach((p) => {
      card(s, 0.7, y, 7.3, 1.15, LIGHT);
      s.addShape(pres.ShapeType.roundRect, { x: 1.0, y: y + 0.28, w: 0.6, h: 0.6, rectRadius: 0.1, fill: { color: p.c } });
      s.addText(p.n, { x: 1.0, y: y + 0.28, w: 0.6, h: 0.6, align: "center", valign: "middle", fontFace: HEAD, fontSize: 24, bold: true, color: WHITE });
      s.addText(p.t, { x: 1.85, y: y + 0.2, w: 6.0, h: 0.4, fontFace: HEAD, fontSize: 15.5, bold: true, color: INK });
      s.addText(p.d, { x: 1.85, y: y + 0.6, w: 6.0, h: 0.5, fontFace: BODY, fontSize: 12.5, color: MUTE, lineSpacingMultiple: 1.05 });
      y += 1.3;
    });
    // rechte Spalte: Effekt + DSGVO
    card(s, 8.2, 1.95, 4.4, 2.0, NAVY);
    iconCircle(s, 8.55, 2.25, 0.6, AURORA, IC.shield.dark);
    s.addText("Der Effekt", { x: 9.25, y: 2.3, w: 3, h: 0.5, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: AURORA_LT });
    s.addText("Das LLM wird gezwungen, auf echten Quellen zu basieren. Halluzinationen sind nicht ausgeschlossen, aber die Fehlerquote sinkt erheblich.", {
      x: 8.55, y: 2.95, w: 3.75, h: 0.95, fontFace: BODY, fontSize: 12.5, color: "DCE6F1", lineSpacingMultiple: 1.1 });
    card(s, 8.2, 4.1, 4.4, 1.95, GREEN_BG);
    iconCircle(s, 8.55, 4.4, 0.6, GREEN, IC.key.white);
    s.addText("DSGVO-Vorteil", { x: 9.25, y: 4.45, w: 3, h: 0.5, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: GREEN });
    s.addText("Nicht-parametrisches Wissen ist löschbar: Dokument aus dem Index entfernen — fertig. Kein Modell-Retraining nötig.", {
      x: 8.55, y: 5.1, w: 3.75, h: 0.9, fontFace: BODY, fontSize: 12.5, color: "2E4A3A", lineSpacingMultiple: 1.1 });
    s.addText("Genau diesen Prompt zeigt Notebook 01 — die „Generierung\" simulieren wir dann deterministisch, damit alles kostenlos bleibt.", {
      x: 0.7, y: 6.3, w: 7.3, h: 0.55, fontFace: BODY, fontSize: 12, italic: true, color: TEAL, lineSpacingMultiple: 1.05 });
    pageNo(s, 13);
    s.addNotes("Drei Bausteine in fester Reihenfolge. Der DSGVO-Punkt ist ein starkes Praxis-Argument für RAG gegenüber Fine-Tuning. Überleitung: So weit die Theorie — jetzt bauen wir die naive Variante.");
  }


  // ══ 14 · NAIVE PIPELINE ════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Notebook 01", "Die naive Pipeline — unser Startpunkt");
    const steps = [
      { ic: IC.cut.white, t: "Chunking", d: "1 Absatz = 1 Chunk" },
      { ic: IC.vector.white, t: "Embedding", d: "MiniLM, mehrsprachig" },
      { ic: IC.search.white, t: "Vektorsuche", d: "Kosinus, Top-k" },
      { ic: IC.robot.dark, t: "Antwort", d: "aus dem besten Chunk" },
    ];
    const cw = 2.75, gap = 0.32; let x = 0.7;
    steps.forEach((st, i) => {
      card(s, x, 2.25, cw, 2.6, WHITE);
      iconCircle(s, x + cw / 2 - 0.45, 2.6, 0.9, i === 3 ? AURORA : TEAL, st.ic);
      s.addText(st.t, { x: x + 0.15, y: 3.6, w: cw - 0.3, h: 0.4, align: "center", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
      s.addText(st.d, { x: x + 0.15, y: 4.02, w: cw - 0.3, h: 0.7, align: "center", fontFace: BODY, fontSize: 12.5, color: MUTE });
      if (i < 3) s.addImage({ data: IC.arrow.teal, x: x + cw + 0.02, y: 3.35, w: 0.28, h: 0.28 });
      x += cw + gap;
    });
    card(s, 0.7, 5.2, 11.9, 1.2, NAVY);
    iconCircle(s, 1.05, 5.45, 0.7, AURORA, IC.code.dark);
    s.addText([
      { text: "Eure Übung 1:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 14.5 } },
      { text: "Kosinus-Ähnlichkeit und die Top-k-Suche selbst implementieren. Eine ✅-Selbsttest-Zelle prüft euch automatisch.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14.5 } },
    ], { x: 1.9, y: 5.45, w: 10.3, h: 0.75, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 14);
    s.addNotes("Bewusst simpel. Für viele Fragen funktioniert das erstaunlich gut — wichtig, damit der Kontrast später wirkt. Generierung deterministisch (Satz-Extraktion), damit kostenlos & reproduzierbar.");
  }

  // ══ 15 · WO NAIVE RAG SCHEITERT (Vocabulary Mismatch) ══════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Die Grenze", "Zwei blinde Flecken der Vektorsuche");
    const cases = [
      { tag: "Vocabulary Mismatch", q: "„SLA für P1-Tickets?\"", d: "Das Wiki schreibt „Service Level Agreement\" und „Priority-1-Vorfälle\" — aber nie die Kürzel. Bei internen Codes und Versionsnummern bleibt die Bedeutungssuche unzuverlässig.", col: WARN, bg: WARN_BG, ic: IC.warn.white },
      { tag: "Das andere Extrem: BM25", q: "„Kosten für Cloud-Speicher\"", d: "Reine Keyword-Suche findet keine Seite, die nur von „Preisen für Objektspeicherung\" spricht. Sie kennt exakte Wörter, aber keine Bedeutung.", col: TEAL, bg: "E9F1F5", ic: IC.search.white },
    ];
    let x = 0.7; const cw = 5.9, gap = 0.3;
    cases.forEach((c) => {
      card(s, x, 2.05, cw, 3.35, c.bg);
      iconCircle(s, x + 0.4, 2.4, 0.8, c.col, c.ic);
      s.addText(c.tag, { x: x + 1.4, y: 2.45, w: cw - 1.7, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: c.col, charSpacing: 1 });
      s.addText(c.q, { x: x + 1.4, y: 2.82, w: cw - 1.7, h: 0.55, fontFace: HEAD, fontSize: 21, bold: true, color: INK });
      s.addText(c.d, { x: x + 0.4, y: 3.7, w: cw - 0.8, h: 1.55, fontFace: BODY, fontSize: 13.5, color: "3A4A5A", lineSpacingMultiple: 1.15 });
      x += cw + gap;
    });
    card(s, 0.7, 5.65, 11.9, 0.9, NAVY);
    s.addText([
      { text: "Die Diagnose:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 15 } },
      { text: "Ein Verfahren allein reicht nicht. Wir brauchen ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
      { text: "Bedeutung UND exakte Begriffe", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 15 } },
      { text: " — das führt uns zu Hybrid Search.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
    ], { x: 1.05, y: 5.65, w: 11.2, h: 0.9, valign: "middle" });
    pageNo(s, 15);
    s.addNotes("Vocabulary Mismatch ist der Fachbegriff (VL 3). Beide Fälle probieren die Teilnehmenden in NB 01 selbst. Auf Score-Nähe der Top-3 hinweisen.");
  }

  // ══ 16 · HANDS-ON NB 01 ════════════════════════════════════════════════════
  handsOn(16, "01", "Naive RAG bauen & an die Grenze bringen", [
    "Chunking, Embeddings und die Vektorsuche zum Laufen bringen",
    "Übung 1: Kosinus-Ähnlichkeit + Top-k selbst implementieren",
    "Die zwei blinden Flecken am eigenen Rechner erleben",
  ]).addNotes("Übergang in den Mitmach-Teil (NB 01). Bearbeitungszeit ansagen, dann Lösung live tippen. Floorwalker aktiv.");

  // ══ SECTION 2 ══════════════════════════════════════════════════════════════
  sectionDivider(17, "2", "Advanced RAG", "Von brauchbaren Treffern zu präzisen, überprüfbaren Antworten", [
    "Hybrid Search: BM25 und Vektorsuche vereint (RRF)",
    "Cross-Encoder-Reranking und das zweistufige Muster",
    "Die Metadaten-Falle: Relevanz ist nicht Gültigkeit",
    "Evaluation mit Hit@3, MRR und der RAGAS-Logik",
  ], "layers").addNotes("Kern des Workshops. Hier lösen wir die Probleme aus Teil 1 und lernen zu messen, ob es wirklich besser wird.");

  // ══ 18 · HYBRID SEARCH ═════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Notebook 02 · Konzept", "Hybrid Search: zwei Sucher, zwei Stärken");
    card(s, 0.7, 2.05, 5.75, 3.05, WHITE);
    iconCircle(s, 1.05, 2.4, 0.75, TEAL, IC.search.white);
    s.addText("BM25 · Keyword-Suche", { x: 1.95, y: 2.45, w: 4.3, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 16.5, bold: true, color: INK });
    bullets(s, 1.05, 3.35, 5.05, 1.6, ["Vergleicht exakte Wortformen (seit den 90ern Standard).", "Stark bei Codes, Produktnamen, Fachbegriffen.", "Blind für Synonyme und Umschreibungen."], { fontSize: 13.5, gap: 7 });
    card(s, 6.85, 2.05, 5.75, 3.05, WHITE);
    iconCircle(s, 7.2, 2.4, 0.75, AURORA, IC.vector.dark);
    s.addText("Dense · Vektorsuche", { x: 8.1, y: 2.45, w: 4.3, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 16.5, bold: true, color: INK });
    bullets(s, 7.2, 3.35, 5.05, 1.6, ["Vergleicht Bedeutung über Embeddings.", "Stark bei Synonymen und Umgangssprache.", "Schwach bei exakten, semantisch armen Begriffen."], { fontSize: 13.5, gap: 7 });
    card(s, 0.7, 5.35, 11.9, 1.2, NAVY);
    iconCircle(s, 1.05, 5.6, 0.7, AURORA, IC.layers.dark);
    s.addText([
      { text: "Idee:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 15 } },
      { text: "beide parallel laufen lassen und die Ergebnislisten fair verschmelzen. Aber die Scores sind ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
      { text: "nicht vergleichbar", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 15 } },
      { text: " (BM25: 0…>10, Kosinus: −1…1). Wie fusioniert man das?", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
    ], { x: 1.9, y: 5.6, w: 10.3, h: 0.75, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 18);
    s.addNotes("Das Duell im Notebook zeigt beide Asymmetrien live. Überleitung zum Fusionsproblem — löst RRF (nächste Folien).");
  }

  // ══ 19 · BM25 VERSTEHEN ════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Vertiefung", "BM25 verstehen: drei Zutaten");
    s.addText("BM25 („Best Matching 25\") ist der Standard klassischer Suchmaschinen. Ein Dokument ist relevant, wenn es die Suchbegriffe passend enthält — drei Faktoren zusammen:", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.55, fontFace: BODY, fontSize: 14, color: MUTE, lineSpacingMultiple: 1.1 });
    const ings = [
      { ic: IC.chart.white, c: TEAL, t: "Term Frequency", d: "Wie oft steht der Begriff im Dokument? Öfter = relevanter — aber mit abnehmendem Grenznutzen." },
      { ic: IC.crosshair.white, c: AURORA, t: "Inverse Document Frequency", d: "Wie selten ist der Begriff im ganzen Korpus? Seltene Wörter tragen mehr Information als „und\" oder „die\"." },
      { ic: IC.compress.white, c: PURP, t: "Längen-Normalisierung", d: "Lange Dokumente enthalten Begriffe naturgemäß öfter. BM25 rechnet das heraus, um kurze nicht zu benachteiligen." },
    ];
    const cw = 3.85, gx = 0.35;
    ings.forEach((g, i) => {
      const x = 0.7 + i * (cw + gx);
      card(s, x, 2.4, cw, 2.75, LIGHT);
      iconCircle(s, x + 0.3, 2.7, 0.7, g.c, g.ic);
      s.addText(g.t, { x: x + 0.3, y: 3.5, w: cw - 0.6, h: 0.7, fontFace: HEAD, fontSize: 15, bold: true, color: INK });
      s.addText(g.d, { x: x + 0.3, y: 4.15, w: cw - 0.6, h: 0.95, fontFace: BODY, fontSize: 12, color: MUTE, lineSpacingMultiple: 1.1 });
    });
    card(s, 0.7, 5.4, 11.9, 1.0, NAVY);
    s.addText([
      { text: "Warum es die Vektorsuche ergänzt:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 14 } },
      { text: "BM25 matcht exakte Zeichenketten. Genau deshalb trifft es Fehlercodes wie „NL-410\" sicher — dort, wo Embeddings scheitern. Es versteht nur keine Synonyme. Die perfekte Ergänzung zur Bedeutungssuche.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14 } },
    ], { x: 1.05, y: 5.4, w: 11.2, h: 1.0, valign: "middle", lineSpacingMultiple: 1.1 });
    pageNo(s, 19);
    s.addNotes("Nicht die Formel auswendig — die Intuition zählt: häufig im Dok (TF), selten im Korpus (IDF), längenkorrigiert. Das erklärt, warum BM25 und Dense sich so gut ergänzen.");
  }

  // ══ 20 · RRF ═══════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Notebook 02 · Kernkonzept", "Reciprocal Rank Fusion (RRF)");
    card(s, 0.7, 2.05, 5.5, 2.35, NAVY);
    s.addText("Nur Ränge zählen — keine rohen Scores.", { x: 1.05, y: 2.3, w: 4.8, h: 0.5, fontFace: BODY, fontSize: 13.5, italic: true, color: AURORA_LT });
    s.addText([
      { text: "RRF(d) = ", options: { fontFace: HEAD, fontSize: 24, italic: true, color: WHITE } },
      { text: "Σ ", options: { fontFace: HEAD, fontSize: 26, color: AURORA } },
      { text: "1 / (k + rang", options: { fontFace: HEAD, fontSize: 24, italic: true, color: WHITE } },
      { text: "r", options: { fontFace: HEAD, fontSize: 15, italic: true, color: AURORA_LT } },
      { text: "(d))", options: { fontFace: HEAD, fontSize: 24, italic: true, color: WHITE } },
    ], { x: 1.05, y: 2.95, w: 4.9, h: 0.7, valign: "middle" });
    s.addText([
      { text: "k = 60", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 13 } },
      { text: "  · robuster Default aus dem Original-Paper (Cormack et al., SIGIR 2009).", options: { color: "C4D3E4", fontFace: BODY, fontSize: 13 } },
    ], { x: 1.05, y: 3.7, w: 4.9, h: 0.6, valign: "middle", lineSpacingMultiple: 1.05 });
    s.addText("Worked Example  (aus VL 3)", { x: 6.5, y: 2.05, w: 6.1, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    const rows = [["Dok.", "BM25", "Dense", "RRF", ""], ["A", "1", "3", "0,0321", ""], ["B", "2", "1", "0,0326", "★"], ["C", "3", "2", "0,0319", ""]];
    const tX = 6.5, tY = 2.55, colW = [1.0, 1.2, 1.2, 1.5, 0.7], rH = 0.62;
    rows.forEach((r, ri) => {
      let cx = tX;
      r.forEach((cell, ci) => {
        const isHead = ri === 0, isWin = r[4] === "★";
        const fill = isHead ? NAVY2 : (isWin ? "E4F6F3" : (ri % 2 ? "F4F8FB" : WHITE));
        s.addShape(pres.ShapeType.rect, { x: cx, y: tY + ri * rH, w: colW[ci], h: rH, fill: { color: fill }, line: { color: "DCE6F1", width: 0.75 } });
        s.addText(cell, { x: cx, y: tY + ri * rH, w: colW[ci], h: rH, align: ci === 0 ? "left" : "center", valign: "middle",
          fontFace: BODY, fontSize: isHead ? 12.5 : 14, bold: isHead || ci === 0 || isWin, color: isHead ? WHITE : (ci === 4 ? AURORA : INK), margin: ci === 0 ? 0.08 : 0 });
        cx += colW[ci];
      });
    });
    s.addText([
      { text: "B gewinnt: ", options: { bold: true, color: TEAL, fontFace: BODY, fontSize: 14.5 } },
      { text: "Rang 2 und Rang 1. Konsistenz über beide Listen wird belohnt — nicht der eine Spitzenplatz.", options: { color: INK, fontFace: BODY, fontSize: 14.5 } },
    ], { x: 6.5, y: 5.35, w: 6.1, h: 0.7, valign: "top", lineSpacingMultiple: 1.1 });
    card(s, 0.7, 4.7, 5.5, 1.85, LIGHT);
    s.addText([
      { text: "Eure Übung 2:  ", options: { bold: true, color: TEAL, fontFace: BODY, fontSize: 14 } },
      { text: "RRF implementieren. Der Selbsttest ist genau dieses Beispiel — B muss gewinnen (1/62 + 1/61).", options: { color: INK, fontFace: BODY, fontSize: 14 } },
    ], { x: 1.05, y: 4.95, w: 4.85, h: 1.35, valign: "top", lineSpacingMultiple: 1.15 });
    pageNo(s, 20);
    s.addNotes("Brücke zu VL 3 explizit — dasselbe Zahlenbeispiel. Intuition: was in BEIDEN Listen oben steht, gewinnt. k=60 dämpft die Dominanz der Spitzenränge.");
  }

  // ══ 21 · HANDS-ON NB 02 ════════════════════════════════════════════════════
  handsOn(21, "02", "Hybrid Search & RRF selbst bauen", [
    "BM25 gegen die Vektorsuche antreten lassen (das Duell)",
    "Übung 2: Reciprocal Rank Fusion implementieren",
    "Beide blinden Flecken aus NB 01 verschwinden — ohne neue Nachteile",
  ]).addNotes("Übergang NB 02. Das Duell zeigt die Asymmetrie, RRF vereint beides. Bearbeitungszeit ~8 min.");

  // ══ 22 · CROSS-ENCODER ═════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Notebook 03 · Konzept", "Cross-Encoder Reranking");
    card(s, 0.7, 2.05, 5.75, 2.9, LIGHT);
    s.addText("Bi-Encoder  (Retrieval)", { x: 1.05, y: 2.3, w: 5.05, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: TEAL });
    s.addText("Frage und Dokument getrennt encodiert. Vektoren sind vorberechenbar.", { x: 1.05, y: 2.8, w: 5.05, h: 0.75, fontFace: BODY, fontSize: 13.5, color: MUTE, lineSpacingMultiple: 1.1 });
    chip(s, 1.05, 3.75, 2.3, "Schnell · Millionen Chunks", "E3EEF3", TEAL, 0.42, 11.5);
    chip(s, 3.5, 3.75, 2.4, "Ungenauer im Ranking", "F0E4DC", WARN, 0.42, 11.5);
    s.addText("Query und Dokument „sehen\" einander nie.", { x: 1.05, y: 4.3, w: 5.0, h: 0.5, fontFace: BODY, fontSize: 12, italic: true, color: MUTE });
    card(s, 6.85, 2.05, 5.75, 2.9, NAVY);
    s.addText("Cross-Encoder  (Reranking)", { x: 7.2, y: 2.3, w: 5.05, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: AURORA_LT });
    s.addText("Liest [Frage] [SEP] [Dokument] gemeinsam und gibt einen direkten Relevanz-Score.", { x: 7.2, y: 2.8, w: 5.05, h: 0.75, fontFace: BODY, fontSize: 13.5, color: "C4D3E4", lineSpacingMultiple: 1.1 });
    chip(s, 7.2, 3.75, 1.9, "Sehr präzise", "1B3A66", AURORA_LT, 0.42, 11.5);
    chip(s, 9.25, 3.75, 3.0, "Teuer · nur für Top-N", "3A2A18", WARN, 0.42, 11.5);
    s.addText("Volle Aufmerksamkeit über das Frage-Dokument-Paar.", { x: 7.2, y: 4.3, w: 5.0, h: 0.5, fontFace: BODY, fontSize: 12, italic: true, color: "9FB2C9" });
    card(s, 0.7, 5.2, 11.9, 1.2, GREEN_BG);
    iconCircle(s, 1.05, 5.45, 0.7, GREEN, IC.code.white);
    s.addText([
      { text: "Eure Übung 3:  ", options: { bold: true, color: GREEN, fontFace: BODY, fontSize: 14.5 } },
      { text: "das Reranking implementieren — den Cross-Encoder alle Kandidaten-Paare bewerten lassen und die Top-N zurückgeben.", options: { color: "2E4A3A", fontFace: BODY, fontSize: 14.5 } },
    ], { x: 1.9, y: 5.45, w: 10.3, h: 0.75, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 22);
    s.addNotes("Gegensatz zum Bi-Encoder von Folie 9: hier lesen Frage und Dokument GEMEINSAM. Deshalb präzise, aber teuer. Führt zum zweistufigen Muster.");
  }

  // ══ 23 · DAS ZWEISTUFIGE MUSTER (Funnel) ═══════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Das Zusammenspiel", "Das zweistufige Muster");
    s.addText("Der Trick: erst breit sammeln (billig), dann präzise sortieren (teuer, aber nur für wenige Kandidaten).", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 14.5, color: MUTE, lineSpacingMultiple: 1.1 });
    // Funnel: 3 gestapelte Balken
    const fx = 1.0, fy = 2.6;
    const funnel = [
      { w: 6.5, label: "Alle Chunks", sub: "der gesamte Korpus", c: "D4DEE8", tc: INK },
      { w: 4.6, label: "Stage 1 · Hybrid Search → Top-50", sub: "Recall: bloß nichts Relevantes verpassen", c: TEAL, tc: WHITE },
      { w: 2.7, label: "Stage 2 · Cross-Encoder → Top-5", sub: "Precision: das Beste nach ganz oben", c: AURORA, tc: NAVY },
    ];
    let yy = fy;
    funnel.forEach((f, i) => {
      const cx = fx + (6.5 - f.w) / 2;
      s.addShape(pres.ShapeType.roundRect, { x: cx, y: yy, w: f.w, h: 0.95, rectRadius: 0.06, fill: { color: f.c },
        shadow: { type: "outer", color: "0B2545", opacity: 0.12, blur: 5, offset: 2, angle: 90 } });
      s.addText(f.label, { x: cx, y: yy + 0.16, w: f.w, h: 0.4, align: "center", fontFace: BODY, fontSize: i === 0 ? 13 : 13.5, bold: true, color: f.tc });
      s.addText(f.sub, { x: cx, y: yy + 0.53, w: f.w, h: 0.3, align: "center", fontFace: BODY, fontSize: 10, italic: true, color: i === 0 ? MUTE : (i === 1 ? "CFE3EC" : "0B3A44") });
      if (i < 2) s.addImage({ data: IC.arrow.teal, x: fx + 6.5 / 2 - 0.14, y: yy + 1.0, w: 0.28, h: 0.28, rotate: 90 });
      yy += 1.35;
    });
    // rechte Erklärkarten
    card(s, 8.2, 2.6, 4.4, 1.75, WHITE);
    iconCircle(s, 8.5, 2.9, 0.6, TEAL, IC.search.white);
    s.addText("Stage 1: Recall", { x: 9.2, y: 2.95, w: 3, h: 0.5, valign: "middle", fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    s.addText("Billige Verfahren holen viele Kandidaten. Lieber ein paar zu viel als das Richtige verpassen.", { x: 8.5, y: 3.55, w: 3.85, h: 0.75, fontFace: BODY, fontSize: 12, color: MUTE, lineSpacingMultiple: 1.1 });
    card(s, 8.2, 4.5, 4.4, 1.75, WHITE);
    iconCircle(s, 8.5, 4.8, 0.6, AURORA, IC.crosshair.dark);
    s.addText("Stage 2: Precision", { x: 9.2, y: 4.85, w: 3, h: 0.5, valign: "middle", fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    s.addText("Der teure Cross-Encoder bewertet nur die 50 Kandidaten und hebt die besten 5 ins LLM.", { x: 8.5, y: 5.45, w: 3.85, h: 0.75, fontFace: BODY, fontSize: 12, color: MUTE, lineSpacingMultiple: 1.1 });
    pageNo(s, 23);
    s.addNotes("Der Recall/Precision-Gedanke greift der Evaluation vor. Zahlen (Top-50/Top-5) sind illustrativ; im NB nutzen wir Top-8/Top-3 für Tempo.");
  }

  // ══ 24 · HANDS-ON NB 03 ════════════════════════════════════════════════════
  handsOn(24, "03", "Reranking bauen — und dem System eine Falle stellen", [
    "Übung 3: Cross-Encoder-Reranking implementieren",
    "Die voll ausgebaute Pipeline an einer Alltagsfrage testen",
    "Übung 4: den Fehler beheben — sobald wir ihn verstanden haben",
  ]).addNotes("Übergang NB 03. Erst Übung 3, dann kommt der Höhepunkt (die Falle) im Plenum, danach Übung 4.");

  // ══ 25 · DIE FALLE ═════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, NAVY);
    s.addText("DER AHA-MOMENT", { x: 0.9, y: 0.6, w: 8, h: 0.35, fontFace: BODY, fontSize: 12.5, bold: true, color: WARN, charSpacing: 2 });
    s.addText("Relevanz ist nicht Gültigkeit", { x: 0.9, y: 0.95, w: 11.5, h: 0.9, fontFace: HEAD, fontSize: 34, bold: true, color: WHITE });
    card(s, 0.7, 2.15, 5.5, 1.05, "1B3A66");
    iconCircle(s, 1.0, 2.4, 0.55, WARN, IC.warn.white);
    s.addText("„Wie viele Tage Homeoffice sind erlaubt?\"", { x: 1.7, y: 2.2, w: 4.4, h: 0.95, valign: "middle", fontFace: HEAD, fontSize: 15.5, bold: true, color: WHITE });
    card(s, 0.7, 3.35, 5.5, 2.95, "3A1F14");
    s.addText("Die Pipeline antwortet:", { x: 1.05, y: 3.6, w: 4.8, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: WARN });
    s.addText("„maximal zwei Tage\"", { x: 1.05, y: 4.0, w: 4.8, h: 0.6, fontFace: HEAD, fontSize: 24, bold: true, color: WHITE });
    s.addText([
      { text: "Quelle: ", options: { color: "E7C3AE", fontFace: BODY, fontSize: 12.5 } },
      { text: "Homeoffice-Regelung (2022) · Status: archiviert", options: { bold: true, color: WARN, fontFace: BODY, fontSize: 12.5 } },
    ], { x: 1.05, y: 4.7, w: 4.8, h: 0.5, valign: "middle" });
    s.addText("Flüssig. Mit Quellenangabe. Völlig überzeugend — und falsch. Gültig sind seit 2025 drei Tage.", {
      x: 1.05, y: 5.25, w: 4.8, h: 0.9, fontFace: BODY, fontSize: 13.5, italic: true, color: "F0D9CB", lineSpacingMultiple: 1.15 });
    s.addText("Warum passiert das?", { x: 6.6, y: 2.15, w: 6, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: AURORA_LT });
    const why = [
      ["BM25", "liebt 2022 — dort steht wörtlich & oft „Homeoffice\". 2025 spricht von „mobilem Arbeiten\"."],
      ["Dense", "findet 2022 ebenfalls hochrelevant — es geht semantisch exakt um die Frage."],
      ["Cross-Encoder", "bewertet literale Relevanz. Der 2022-Text passt perfekt — dass er nicht mehr gilt, steht nicht drin."],
    ];
    let wy = 2.75;
    why.forEach(([k, v]) => {
      s.addShape(pres.ShapeType.roundRect, { x: 6.6, y: wy, w: 1.75, h: 0.95, rectRadius: 0.06, fill: { color: NAVY2 } });
      s.addText(k, { x: 6.6, y: wy, w: 1.75, h: 0.95, align: "center", valign: "middle", fontFace: BODY, fontSize: 12.5, bold: true, color: AURORA_LT, margin: 0.05 });
      s.addText(v, { x: 8.5, y: wy, w: 4.1, h: 0.95, valign: "middle", fontFace: BODY, fontSize: 12.5, color: "DCE6F1", lineSpacingMultiple: 1.05 });
      wy += 1.1;
    });
    card(s, 6.6, 6.05, 6.0, 0.75, AURORA);
    s.addText("Alle drei taten exakt, wofür sie gebaut sind. Retrieval-Qualität ≠ korrekte Antwort.", {
      x: 6.7, y: 6.05, w: 5.8, h: 0.75, valign: "middle", align: "center", fontFace: BODY, fontSize: 14, bold: true, color: NAVY });
    pageNo(s, 25);
    s.addNotes("DAS HERZSTÜCK. Antwort laut vorlesen, Kunstpause, dann Quelle zeigen. 3 Min Team-Diskussion 'Warum?' BEVOR die Auflösung. Merksatz: Alle drei Stufen taten exakt, wofür sie gebaut sind.");
  }

  // ══ 26 · DER FIX ═══════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Notebook 03 · Übung 4", "Der Fix: Metadaten ernst nehmen", GREEN);
    card(s, 0.7, 2.05, 5.75, 2.4, NAVY);
    s.addText("Ein Filter vor dem Reranking", { x: 1.05, y: 2.3, w: 4.9, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: AURORA_LT });
    s.addText("kandidaten = [c for c in kandidaten\n            if c[\"status\"] != \"archiviert\"]", {
      x: 1.05, y: 2.85, w: 4.9, h: 1.0, fontFace: MONO, fontSize: 13, color: AURORA_LT, lineSpacingMultiple: 1.2 });
    s.addText("Die Chunks trugen status und jahr die ganze Zeit mit sich.", { x: 1.05, y: 3.9, w: 4.9, h: 0.45, fontFace: BODY, fontSize: 12.5, italic: true, color: "C4D3E4" });
    card(s, 6.85, 2.05, 5.75, 2.4, GREEN_BG);
    s.addText("Jetzt antwortet die Pipeline:", { x: 7.2, y: 2.3, w: 5.0, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: GREEN });
    s.addText("„drei Tage\"", { x: 7.2, y: 2.75, w: 5.0, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: INK });
    s.addText([
      { text: "Quelle: ", options: { color: "4A6A56", fontFace: BODY, fontSize: 12.5 } },
      { text: "Richtlinie Mobiles Arbeiten (2025) · gültig ✓", options: { bold: true, color: GREEN, fontFace: BODY, fontSize: 12.5 } },
    ], { x: 7.2, y: 3.5, w: 5.0, h: 0.5, valign: "middle" });
    s.addText("Der Selbsttest bestätigt: archivierte Chunks sind raus, die gültige Quelle gewinnt.", { x: 7.2, y: 3.95, w: 5.0, h: 0.45, fontFace: BODY, fontSize: 12.5, italic: true, color: "3F5A4B" });
    card(s, 0.7, 4.75, 11.9, 1.8, LIGHT);
    iconCircle(s, 1.1, 5.15, 0.85, GREEN, IC.filter.white);
    s.addText("Der Code war eine Zeile — die Lektion ist es nicht", { x: 2.2, y: 4.95, w: 10.2, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    bullets(s, 2.2, 5.4, 10.2, 1.0, [
      "Gültigkeit, Aktualität, Zuständigkeit stehen in Metadaten, nicht im Text — und keine Retrieval-Stufe sieht sie von allein.",
      "Der echte Engpass in Unternehmen: Wer pflegt den Status? Was tun bei widersprüchlichen, nicht archivierten Dokumenten?",
    ], { fontSize: 13, gap: 5 });
    pageNo(s, 26);
    s.addNotes("Pointe ist Data Governance, nicht der Code. Alternativen zum harten Filter: Aktualität als Score-Boost, Zeitbezug aus der Frage erkennen, oder dem LLM beide Fassungen mit Datum geben.");
  }

  // ══ 27 · EVALUATION (Platzhalter) ══════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Notebook 04", "Beweisen statt behaupten: die Evaluation");
    card(s, 0.7, 2.05, 4.1, 4.35, WHITE);
    s.addText("Zwei Metriken auf 15 Gold-Fragen", { x: 1.0, y: 2.3, w: 3.5, h: 0.7, fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    iconCircle(s, 1.0, 3.15, 0.6, TEAL, IC.check.dark);
    s.addText("Hit@3", { x: 1.75, y: 3.13, w: 2.9, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: INK });
    s.addText("Ist ein relevantes Dokument in den Top-3?", { x: 1.75, y: 3.46, w: 2.9, h: 0.55, fontFace: BODY, fontSize: 11.5, color: MUTE });
    iconCircle(s, 1.0, 4.25, 0.6, AURORA, IC.gauge.dark);
    s.addText("MRR", { x: 1.75, y: 4.23, w: 2.9, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: INK });
    s.addText("Wie weit oben steht der erste Treffer?", { x: 1.75, y: 4.56, w: 2.9, h: 0.55, fontFace: BODY, fontSize: 11.5, color: MUTE });
    s.addText("Rang 1 → 1,0 · Rang 2 → 0,5 · Rang 3 → 0,33", { x: 1.0, y: 5.35, w: 3.6, h: 0.5, fontFace: BODY, fontSize: 11.5, italic: true, color: TEAL, lineSpacingMultiple: 1.1 });
    card(s, 4.95, 2.05, 7.65, 4.35, WHITE);
    s.addText("Retrieval-Qualität je Ausbaustufe", { x: 5.3, y: 2.3, w: 5, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    chip(s, 10.15, 2.32, 2.15, "★ ECHTE ZAHLEN EINSETZEN", WARN_BG, WARN, 0.34, 10);
    const configs = ["Dense", "BM25", "Hybrid", "+ Rerank", "Advanced"];
    const demoVals = [0.62, 0.55, 0.80, 0.87, 1.0];
    const chartX = 5.35, chartBase = 5.75, chartH = 2.5, bw = 1.15, cgap = 0.28;
    let bx = chartX;
    configs.forEach((c, i) => {
      const h = chartH * demoVals[i];
      s.addShape(pres.ShapeType.roundRect, { x: bx, y: chartBase - h, w: bw, h, rectRadius: 0.04, fill: { color: i === 4 ? AURORA : (i === 1 ? "9FB2C9" : TEAL) } });
      s.addText(c, { x: bx - 0.1, y: chartBase + 0.05, w: bw + 0.2, h: 0.55, align: "center", fontFace: BODY, fontSize: 10.5, bold: i === 4, color: i === 4 ? AURORA : MUTE });
      bx += bw + cgap;
    });
    s.addShape(pres.ShapeType.line, { x: chartX - 0.15, y: chartBase, w: 6.9, h: 0, line: { color: "D4DEE8", width: 1 } });
    s.addText("Schema (Platzhalter). Erwartetes Muster: jede Stufe legt zu, erst der Metadaten-Filter fixt Frage 13.", { x: 5.3, y: 6.35, w: 6.9, h: 0.4, fontFace: BODY, fontSize: 11, italic: true, color: MUTE });
    pageNo(s, 27);
    s.addNotes("WICHTIG: echte Zahlen aus benchmark_ergebnis.png hier einsetzen. Auf Frage 13 zeigen: 'Hybrid + Rerank' scheitert an der Falle, erst 'Advanced' löst sie.");
  }

  // ══ 28 · PRECISION/RECALL-TRADEOFF ═════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Der zentrale Kompromiss", "Precision vs. Recall");
    card(s, 0.7, 2.05, 5.75, 2.7, "E9F1F5");
    iconCircle(s, 1.05, 2.4, 0.75, TEAL, IC.eye.white);
    s.addText("Recall", { x: 1.95, y: 2.45, w: 4.3, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 17, bold: true, color: INK });
    s.addText("Von allem Relevanten — wie viel habe ich gefunden? Hohes k, viele Kandidaten: nichts wird übersehen, aber es kommt auch Ballast mit.", {
      x: 1.05, y: 3.3, w: 5.1, h: 1.35, fontFace: BODY, fontSize: 13.5, color: "3A4A5A", lineSpacingMultiple: 1.15 });
    card(s, 6.85, 2.05, 5.75, 2.7, GREEN_BG);
    iconCircle(s, 7.2, 2.4, 0.75, GREEN, IC.crosshair.white);
    s.addText("Precision", { x: 8.1, y: 2.45, w: 4.3, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 17, bold: true, color: INK });
    s.addText("Von dem, was ich gefunden habe — wie viel ist wirklich relevant? Reranking und kleines k halten den Kontext sauber, riskieren aber, Gutes wegzulassen.", {
      x: 7.2, y: 3.3, w: 5.1, h: 1.35, fontFace: BODY, fontSize: 13.5, color: "2E4A3A", lineSpacingMultiple: 1.15 });
    card(s, 0.7, 4.95, 11.9, 1.6, NAVY);
    iconCircle(s, 1.1, 5.35, 0.8, AURORA, IC.balance.dark);
    s.addText("So löst unsere Pipeline den Kompromiss auf", { x: 2.2, y: 5.15, w: 10.2, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: AURORA_LT });
    s.addText([
      { text: "Stage 1 (Hybrid Search) maximiert Recall", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 14 } },
      { text: " — viele Kandidaten, nichts verpassen. ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14 } },
      { text: "Stage 2 (Reranking) maximiert Precision", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 14 } },
      { text: " — nur das Beste geht ans LLM. Genau das messen Hit@3 (Recall-nah) und MRR (Precision-nah).", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14 } },
    ], { x: 2.2, y: 5.6, w: 10.2, h: 0.85, valign: "top", lineSpacingMultiple: 1.15 });
    pageNo(s, 28);
    s.addNotes("Der konzeptionelle Anker hinter dem zweistufigen Muster UND den Metriken. Recall = nichts verpassen, Precision = kein Ballast. Beide Stufen adressieren je eine Seite.");
  }

  // ══ 29 · RAGAS: VIER METRIKEN ══════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Der Industriestandard", "RAGAS: vier Metriken");
    s.addText("Unsere Metriken bewerten nur das Retrieval. RAGAS misst zusätzlich die Generierung — braucht dafür aber ein LLM als Judge (= API-Kosten).", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.55, fontFace: BODY, fontSize: 14, color: MUTE, lineSpacingMultiple: 1.1 });
    const quad = [
      { t: "Context Recall", d: "Ist die nötige Information überhaupt im abgerufenen Kontext?", side: "Retrieval", c: TEAL, our: "≈ unser Hit@3" },
      { t: "Context Precision", d: "Steht das Relevante oben — ohne viel Irrelevantes dazwischen?", side: "Retrieval", c: TEAL, our: "≈ unser MRR" },
      { t: "Faithfulness", d: "Hält sich die Antwort an den Kontext, ohne zu erfinden?", side: "Generierung", c: AURORA, our: "braucht LLM-Judge" },
      { t: "Answer Relevancy", d: "Beantwortet die Antwort tatsächlich die gestellte Frage?", side: "Generierung", c: AURORA, our: "braucht LLM-Judge" },
    ];
    const cw = 5.85, ch = 1.75, gx = 0.2, gy = 0.25;
    quad.forEach((q, i) => {
      const x = 0.7 + (i % 2) * (cw + gx);
      const y = 2.4 + Math.floor(i / 2) * (ch + gy);
      card(s, x, y, cw, ch, WHITE);
      chip(s, x + 0.3, y + 0.28, 1.5, q.side, q.c === TEAL ? "E3EEF3" : "E4F6F3", q.c === TEAL ? TEAL : "1B7A70", 0.3, 10);
      s.addText(q.t, { x: x + 1.95, y: y + 0.24, w: cw - 2.2, h: 0.4, fontFace: HEAD, fontSize: 15.5, bold: true, color: INK });
      s.addText(q.d, { x: x + 0.3, y: y + 0.72, w: cw - 0.6, h: 0.65, fontFace: BODY, fontSize: 12.5, color: MUTE, lineSpacingMultiple: 1.05 });
      s.addText(q.our, { x: x + 0.3, y: y + 1.38, w: cw - 0.6, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, bold: true, color: q.c });
    });
    pageNo(s, 29);
    s.addNotes("Vier Metriken, zwei Achsen: Retrieval (Recall/Precision) und Generierung (Faithfulness/Answer Relevancy). Unsere zwei decken die Retrieval-Seite kostenlos ab.");
  }

  // ══ 30 · RAGAS: DIAGNOSE-LOGIK ═════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "RAGAS in der Praxis", "Diagnose-Logik: wo klemmt es?");
    s.addText("Der eigentliche Wert von RAGAS: Die Kombination der Werte sagt nicht nur, DASS etwas falsch ist, sondern WO — und was zu tun ist.", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.55, fontFace: BODY, fontSize: 14, color: MUTE, lineSpacingMultiple: 1.1 });
    const diag = [
      { sym: "↓ Faithfulness, ↑ Context Precision", mean: "Das LLM ignoriert den Kontext oder überschreibt ihn mit eigenem Wissen.", fix: "System-Prompt schärfen, Modell wechseln", c: WARN },
      { sym: "↓ Context Recall, ↑ Faithfulness", mean: "Der Retriever findet nicht alles — nutzt aber gut, was er findet.", fix: "Chunking überdenken, Hybrid Search, k erhöhen", c: TEAL },
      { sym: "↓ Context Precision, ↑ Context Recall", mean: "Der Retriever findet viel — aber auch viel Irrelevantes.", fix: "Reranking einsetzen, k reduzieren", c: AURORA },
      { sym: "↓ Answer Relevancy", mean: "Die Antwort weicht vom Thema ab.", fix: "Prompt Engineering", c: PURP },
    ];
    let y = 2.4;
    diag.forEach((d) => {
      card(s, 0.7, y, 11.9, 0.92, LIGHT);
      s.addShape(pres.ShapeType.roundRect, { x: 0.9, y: y + 0.16, w: 3.6, h: 0.6, rectRadius: 0.06, fill: { color: NAVY } });
      s.addText(d.sym, { x: 0.9, y: y + 0.16, w: 3.6, h: 0.6, align: "center", valign: "middle", fontFace: BODY, fontSize: 11.5, bold: true, color: AURORA_LT, margin: 0.06 });
      s.addText(d.mean, { x: 4.7, y: y + 0.14, w: 4.5, h: 0.65, valign: "middle", fontFace: BODY, fontSize: 12, color: INK, lineSpacingMultiple: 1.02 });
      s.addImage({ data: IC.arrow.teal, x: 9.3, y: y + 0.32, w: 0.24, h: 0.24 });
      s.addText(d.fix, { x: 9.7, y: y + 0.14, w: 2.75, h: 0.65, valign: "middle", fontFace: BODY, fontSize: 11.5, bold: true, color: d.c, lineSpacingMultiple: 1.02 });
      y += 1.0;
    });
    pageNo(s, 30);
    s.addNotes("Direkt aus VL 3. Diese Tabelle ist Gold für die Q&A. Und: unsere Falle zeigt eine Lücke, die KEINE dieser Metriken allein fängt — Frage 13 hätte perfekte Retrieval-Scores gehabt.");
  }

  // ══ 31 · HANDS-ON NB 04 ════════════════════════════════════════════════════
  handsOn(31, "04", "Evaluation: den Fortschritt messbar machen", [
    "Alle fünf Ausbaustufen gegen 15 Gold-Fragen benchmarken",
    "Hit@3 und MRR pro Stufe vergleichen (mit Balkendiagramm)",
    "Sehen, warum erst der Metadaten-Filter Frage 13 löst",
  ]).addNotes("NB 04 ist eine Demo (keine Übung). P2 führt sie am Beamer. ~1 Min Rechenzeit. Danach die echten Zahlen auf Folie 27 zeigen.");

  // ══ SECTION 3 ══════════════════════════════════════════════════════════════
  sectionDivider(32, "3", "Über RAG hinaus", "Wann RAG nicht das richtige Werkzeug ist — und was dann kommt", [
    "Wissensproblem vs. Verhaltensproblem: RAG oder Fine-Tuning?",
    "LoRA und QLoRA: Fine-Tuning für alle",
    "Die Grenzen von statischem RAG",
    "Das ReAct-Paradigma und Agentic RAG",
  ], "rocket").addNotes("Ausblick, der den Workshop einordnet und die volle Breite von VL 3 abdeckt. Zeigt, dass ihr das große Bild versteht.");

  // ══ 33 · WISSEN VS VERHALTEN ═══════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Die richtige Frage", "RAG oder Fine-Tuning?");
    s.addText("„RAG oder Fine-Tuning?\" ist falsch gestellt. Die richtige Frage lautet: Was ist eigentlich das Problem?", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 15, italic: true, color: TEAL, lineSpacingMultiple: 1.1 });
    card(s, 0.7, 2.4, 5.75, 3.5, "E9F1F5");
    iconCircle(s, 1.05, 2.75, 0.8, TEAL, IC.book.white);
    s.addText("Wissensproblem", { x: 2.0, y: 2.8, w: 4.2, h: 0.7, valign: "middle", fontFace: HEAD, fontSize: 18, bold: true, color: INK });
    s.addText("Das Modell weiß etwas nicht — zu neu, zu spezifisch, nie im Training gesehen.", {
      x: 1.05, y: 3.7, w: 5.1, h: 0.75, fontFace: BODY, fontSize: 13.5, color: "3A4A5A", lineSpacingMultiple: 1.1 });
    chip(s, 1.05, 4.5, 1.6, "→ Lösung: RAG", WHITE, TEAL, 0.42, 13);
    s.addText("Gibt dem Modell Information von außen.", { x: 1.05, y: 5.1, w: 5.1, h: 0.6, fontFace: BODY, fontSize: 12.5, italic: true, color: MUTE });
    card(s, 6.85, 2.4, 5.75, 3.5, PURP_BG);
    iconCircle(s, 7.2, 2.75, 0.8, PURP, IC.cog.white);
    s.addText("Verhaltensproblem", { x: 8.15, y: 2.8, w: 4.2, h: 0.7, valign: "middle", fontFace: HEAD, fontSize: 18, bold: true, color: INK });
    s.addText("Das Modell weiß es prinzipiell, antwortet aber nicht auf die benötigte Art.", {
      x: 7.2, y: 3.7, w: 5.1, h: 0.75, fontFace: BODY, fontSize: 13.5, color: "3A2F52", lineSpacingMultiple: 1.1 });
    chip(s, 7.2, 4.5, 2.3, "→ Lösung: Fine-Tuning", WHITE, PURP, 0.42, 13);
    s.addText("Immer JSON · Unternehmensstil · Klausel-Extraktion · kleines Modell spezialisieren.", { x: 7.2, y: 5.1, w: 5.1, h: 0.65, fontFace: BODY, fontSize: 12, italic: true, color: "5A4A7A", lineSpacingMultiple: 1.05 });
    card(s, 0.7, 6.05, 11.9, 0.7, NAVY);
    s.addText([
      { text: "Kein Entweder-Oder:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 14 } },
      { text: "RAG gibt Information, Fine-Tuning verändert das Modell. In der Praxis werden beide oft kombiniert.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14 } },
    ], { x: 1.05, y: 6.05, w: 11.2, h: 0.7, valign: "middle" });
    pageNo(s, 33);
    s.addNotes("Kernunterscheidung aus VL 3. Orthogonale Dimensionen. Beispiel für Kombination: juristischer Assistent — Fine-Tuning für Stil, RAG für aktuelle Urteile.");
  }

  // ══ 34 · LoRA / QLoRA ══════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Effizientes Fine-Tuning", "LoRA & QLoRA: Fine-Tuning für alle");
    card(s, 0.7, 2.05, 5.75, 2.95, WHITE);
    iconCircle(s, 1.05, 2.4, 0.7, PURP, IC.compress.white);
    s.addText("LoRA · Low-Rank Adaptation", { x: 1.95, y: 2.45, w: 4.3, h: 0.6, valign: "middle", fontFace: HEAD, fontSize: 15.5, bold: true, color: INK });
    s.addText("Statt alle Gewichte zu trainieren: Die Änderung ΔW wird als Produkt zweier kleiner Matrizen dargestellt (ΔW = B·A). Die Originalgewichte bleiben eingefroren.", {
      x: 1.05, y: 3.25, w: 5.1, h: 1.15, fontFace: BODY, fontSize: 13, color: MUTE, lineSpacingMultiple: 1.12 });
    chip(s, 1.05, 4.45, 3.3, "Nur wenige Prozent trainierbar", PURP_BG, PURP, 0.42, 12);
    card(s, 6.85, 2.05, 5.75, 2.95, NAVY);
    iconCircle(s, 7.2, 2.4, 0.7, AURORA, IC.bolt.dark);
    s.addText("QLoRA · noch effizienter", { x: 8.1, y: 2.45, w: 4.3, h: 0.6, valign: "middle", fontFace: HEAD, fontSize: 15.5, bold: true, color: AURORA_LT });
    s.addText("Kombiniert 4-Bit-Quantisierung des Basismodells mit LoRA-Adaptern in voller Präzision.", {
      x: 7.2, y: 3.25, w: 5.1, h: 0.75, fontFace: BODY, fontSize: 13, color: "DCE6F1", lineSpacingMultiple: 1.12 });
    card(s, 7.2, 4.1, 5.05, 0.85, "1B3A66");
    s.addText([
      { text: "Llama-2-70B: ", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 12.5 } },
      { text: "statt ~140 GB VRAM reicht eine einzige 80-GB-GPU. Nur 0,04 % der Parameter trainierbar.", options: { color: "C4D3E4", fontFace: BODY, fontSize: 12.5 } },
    ], { x: 7.4, y: 4.1, w: 4.65, h: 0.85, valign: "middle", lineSpacingMultiple: 1.1 });
    card(s, 0.7, 5.25, 11.9, 1.3, GREEN_BG);
    iconCircle(s, 1.1, 5.55, 0.7, GREEN, IC.link.white);
    s.addText([
      { text: "RAG + Fine-Tuning kombinieren:  ", options: { bold: true, color: GREEN, fontFace: BODY, fontSize: 14 } },
      { text: "Ein juristischer Assistent nutzt Fine-Tuning für Stil und Terminologie, RAG für aktuelle Urteile. Oft besonders wirkungsvoll: das Embedding-Modell selbst auf Domänen-Paare fine-tunen.", options: { color: "2E4A3A", fontFace: BODY, fontSize: 14 } },
    ], { x: 1.9, y: 5.55, w: 10.4, h: 0.75, valign: "middle", lineSpacingMultiple: 1.1 });
    pageNo(s, 34);
    s.addNotes("LoRA (Hu 2021), QLoRA (Dettmers 2023). Nicht die Mathematik, die Idee: nur ein kleiner Teil wird trainiert. QLoRA hat Fine-Tuning demokratisiert. Embedding-Fine-Tuning als Extra-Tipp.");
  }

  // ══ 35 · GRENZEN STATISCHES RAG → AGENTS ═══════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Wenn ein Schritt nicht reicht", "Die Grenzen von statischem RAG");
    card(s, 0.7, 2.0, 5.75, 3.6, WARN_BG);
    iconCircle(s, 1.05, 2.35, 0.7, WARN, IC.warn.white);
    s.addText("RAG ist einschrittig", { x: 1.95, y: 2.4, w: 4.3, h: 0.6, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    s.addText("Einmal retrieven, einmal generieren, fertig. Das reicht nicht für:", {
      x: 1.05, y: 3.2, w: 5.1, h: 0.55, fontFace: BODY, fontSize: 13.5, color: "5A3A28" });
    s.addText("„Analysiere die Quartalsberichte der letzten drei Jahre, vergleiche sie mit unseren drei größten Wettbewerbern und fasse die strategischen Divergenzen zusammen.\"", {
      x: 1.05, y: 3.8, w: 5.1, h: 1.55, fontFace: BODY, fontSize: 13, italic: true, color: INK, lineSpacingMultiple: 1.15 });
    card(s, 6.85, 2.0, 5.75, 3.6, NAVY);
    s.addText("Was RAG nicht kann", { x: 7.2, y: 2.3, w: 5.0, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: AURORA_LT });
    bullets(s, 7.2, 2.85, 5.1, 2.5, [
      "Multi-Step Reasoning über mehrere Quellen",
      "Dynamische Planung des nächsten Schritts",
      "Iteratives Nachsuchen mit neuen Begriffen",
      "Aufgaben mit eigener Abbruchbedingung",
    ], { color: "DCE6F1", fontSize: 14, gap: 10 });
    card(s, 6.85, 5.75, 5.75, 0.65, AURORA);
    s.addText("Genau hier setzt Agentic AI an.", { x: 6.85, y: 5.75, w: 5.75, h: 0.65, align: "center", valign: "middle", fontFace: HEAD, fontSize: 15, bold: true, color: NAVY });
    s.addText("Ein Workflow statt eines einzelnen Schritts: retrieven, nachdenken, planen, integrieren, synthetisieren.", {
      x: 0.7, y: 5.85, w: 5.75, h: 0.55, fontFace: BODY, fontSize: 12, italic: true, color: TEAL, lineSpacingMultiple: 1.05 });
    pageNo(s, 35);
    s.addNotes("Der Brückenschlag zu Agents. Statisches RAG = ein Schuss. Komplexe Aufgaben brauchen einen mehrschrittigen Workflow.");
  }

  // ══ 36 · ReAct + Agentic RAG ═══════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Ausblick", "Das ReAct-Paradigma");
    s.addText("Reasoning + Acting (Yao et al., ICLR 2023): Nachdenken und Handeln wechseln sich ab, bis die Antwort steht.", {
      x: 0.7, y: 1.75, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 14, color: MUTE, lineSpacingMultiple: 1.1 });
    // Loop: Thought → Action → Observation
    const loop = [
      { t: "Thought", d: "Das Modell denkt laut, plant den nächsten Schritt, prüft ob es fertig ist.", c: TEAL, ic: IC.brain.white },
      { t: "Action", d: "Ruft ein Werkzeug auf — z. B. search(\"Siemens Q3 2024\").", c: AURORA, ic: IC.bolt.dark },
      { t: "Observation", d: "Das Ergebnis fließt in den nächsten Thought ein.", c: PURP, ic: IC.eye.white },
    ];
    const cw = 3.7, gx = 0.35;
    loop.forEach((l, i) => {
      const x = 0.7 + i * (cw + gx);
      card(s, x, 2.4, cw, 2.2, WHITE);
      iconCircle(s, x + cw / 2 - 0.4, 2.7, 0.8, l.c, l.ic);
      s.addText(l.t, { x, y: 3.55, w: cw, h: 0.4, align: "center", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
      s.addText(l.d, { x: x + 0.25, y: 3.98, w: cw - 0.5, h: 0.6, align: "center", fontFace: BODY, fontSize: 11.5, color: MUTE, lineSpacingMultiple: 1.08 });
      if (i < 2) s.addImage({ data: IC.arrow.teal, x: x + cw + 0.03, y: 3.35, w: 0.28, h: 0.28 });
    });
    s.addText("↻  Die Schleife wiederholt sich bis zur finalen Antwort", { x: 0.7, y: 4.75, w: 11.9, h: 0.35, align: "center", fontFace: BODY, fontSize: 12.5, italic: true, bold: true, color: TEAL });
    // Agentic RAG + Risiken
    card(s, 0.7, 5.25, 5.75, 1.3, NAVY);
    s.addText("Agentic RAG (Stand 2026)", { x: 1.05, y: 5.45, w: 5.0, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: AURORA_LT });
    s.addText("Der Agent entscheidet dynamisch: Brauche ich Retrieval? Muss ich die Frage zerlegen? Reichen die Dokumente? Nochmal suchen?", {
      x: 1.05, y: 5.8, w: 5.25, h: 0.7, fontFace: BODY, fontSize: 11.5, color: "DCE6F1", lineSpacingMultiple: 1.08 });
    card(s, 6.85, 5.25, 5.75, 1.3, WARN_BG);
    s.addText("Neue Risiken", { x: 7.2, y: 5.45, w: 5.0, h: 0.35, fontFace: HEAD, fontSize: 14, bold: true, color: WARN });
    s.addText("Halluzinierte Werkzeugaufrufe · Endlosschleifen · Prompt Injection · Kosten & Latenz. Produktive Systeme brauchen Maximalschritte und Timeouts.", {
      x: 7.2, y: 5.8, w: 5.25, h: 0.7, fontFace: BODY, fontSize: 11.5, color: "5A3A28", lineSpacingMultiple: 1.08 });
    pageNo(s, 36);
    s.addNotes("ReAct-Loop mit dem Siemens/ABB-Beispiel erklärbar. Agentic RAG = Stand der Technik. Risiken sind das Gegenstück zu unserer Reflexion. Frameworks: LangGraph, LlamaIndex, AutoGen, CrewAI, MCP.");
  }

  // ══ 37 · REFLEXION ═════════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Reflexion", "Chancen, Risiken, Enterprise-Tauglichkeit");
    const cols = [
      { ic: IC.rocket.white, col: GREEN, t: "Chancen", items: ["Schnellster ROI: interne Wissenssuche", "Support-Entlastung & Onboarding", "Belegbare Antworten mit Quellen"] },
      { ic: IC.warn.white, col: WARN, t: "Risiken", items: ["Treue Antwort aus falscher Quelle (Air Canada)", "Veraltetes Wissen ohne Governance", "Blindes Vertrauen in flüssige Sprache"] },
      { ic: IC.shield.white, col: TEAL, t: "Enterprise-Reife", items: ["Skalierbare Vektor-DB (pgvector)", "Zugriffsrechte & Metadaten-Pflege", "Monitoring + CI-Regressionstests"] },
    ];
    let x = 0.7; const cw = 3.9, gap = 0.32;
    cols.forEach((c) => {
      card(s, x, 2.05, cw, 3.75, WHITE);
      iconCircle(s, x + 0.35, 2.35, 0.8, c.col, c.ic);
      s.addText(c.t, { x: x + 1.3, y: 2.4, w: cw - 1.5, h: 0.7, valign: "middle", fontFace: HEAD, fontSize: 18, bold: true, color: INK });
      bullets(s, x + 0.35, 3.4, cw - 0.7, 2.3, c.items, { fontSize: 13, gap: 10 });
      x += cw + gap;
    });
    s.addText("Größter Hebel auf die Antwortqualität? Nach heute lautet die belegbare Antwort: Evaluation + Datenqualität — nicht das schickste Modell.", {
      x: 0.7, y: 6.05, w: 11.9, h: 0.6, align: "center", fontFace: BODY, fontSize: 14, bold: true, italic: true, color: TEAL, lineSpacingMultiple: 1.05 });
    pageNo(s, 37);
    s.addNotes("Die drei Kick-off-Leitfragen zusammenführen. Provokant die Hebel-Frage stellen und die Q&A eröffnen. Air Canada als Anker zurückholen.");
  }

  // ══ 38 · GLOSSAR / CHEAT-SHEET ═════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Zum Nachschlagen", "Glossar: die wichtigsten Begriffe");
    const terms = [
      ["Embedding", "Text als dichter Vektor; ähnliche Bedeutung → ähnliche Vektoren."],
      ["Bi-Encoder", "Encodiert Frage & Doku getrennt → vorberechenbar, schnell."],
      ["Cross-Encoder", "Liest Frage & Doku gemeinsam → präzise, aber teuer."],
      ["Chunking", "Dokumente in Häppchen teilen (Fixed / Semantic / Hierarchical)."],
      ["BM25", "Keyword-Suche über TF, IDF und Längen-Normalisierung."],
      ["Hybrid Search", "BM25 + Vektorsuche kombiniert — Bedeutung UND exakte Begriffe."],
      ["RRF", "Fusioniert Ranglisten nur über Rangpositionen (k = 60)."],
      ["Reranking", "Zweite, präzisere Sortierung der Top-Kandidaten."],
      ["HNSW / ANN", "Schnelle Näherungssuche in Vektor-DBs, O(log n)."],
      ["Hit@3 / MRR", "Retrieval-Metriken: Treffer in Top-3 / Rang des ersten Treffers."],
      ["RAGAS", "Eval-Framework: Faithfulness, Answer Relevancy, Context Prec./Recall."],
      ["ReAct", "Agent-Schleife aus Thought → Action → Observation."],
    ];
    const cw = 5.85, rh = 0.72, gx = 0.2;
    terms.forEach((t, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.7 + col * (cw + gx), y = 1.9 + row * (rh + 0.08);
      s.addShape(pres.ShapeType.roundRect, { x, y, w: cw, h: rh, rectRadius: 0.06, fill: { color: i % 2 ? "F4F8FB" : LIGHT }, line: { color: "E1E9F1", width: 0.75 } });
      s.addText(t[0], { x: x + 0.2, y: y + 0.06, w: cw - 0.4, h: 0.3, fontFace: BODY, fontSize: 12.5, bold: true, color: TEAL });
      s.addText(t[1], { x: x + 0.2, y: y + 0.35, w: cw - 0.4, h: 0.33, fontFace: BODY, fontSize: 10.8, color: MUTE, lineSpacingMultiple: 1.0 });
    });
    pageNo(s, 38);
    s.addNotes("Nachschlage-Folie / Leave-behind. Muss man nicht vortragen — als Referenz im geteilten Material sehr wertvoll für die Vorbereitung der Zuhörer.");
  }

  // ══ 39 · FAZIT / DANKE ═════════════════════════════════════════════════════
  {
    const s = pres.addSlide(); bg(s, NAVY);
    s.addShape(pres.ShapeType.roundRect, { x: -1.6, y: 5.4, w: 6.5, h: 3.2, rectRadius: 0.4, fill: { color: TEAL, transparency: 60 }, rotate: -20, line: { type: "none" } });
    s.addShape(pres.ShapeType.roundRect, { x: -1.0, y: 5.9, w: 6.5, h: 2.0, rectRadius: 0.4, fill: { color: AURORA, transparency: 66 }, rotate: -20, line: { type: "none" } });
    s.addText("ZUM MITNEHMEN", { x: 0.9, y: 1.0, w: 8, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: AURORA_LT, charSpacing: 2 });
    s.addText("Relevanz ist nicht Gültigkeit.", { x: 0.85, y: 1.4, w: 11.5, h: 1.0, fontFace: HEAD, fontSize: 42, bold: true, color: WHITE });
    const take = [
      "Naives RAG scheitert vorhersehbar — Hybrid Search + Reranking heben die Retrieval-Qualität deutlich.",
      "Aber keine Retrieval-Stufe ersetzt gepflegte Metadaten und eine ehrliche Evaluation.",
      "Erst messen, dann optimieren: ohne Gold-Testset ist jede Architekturdiskussion Geschmackssache.",
    ];
    let ty = 2.85;
    take.forEach((t, i) => {
      iconCircle(s, 0.95, ty, 0.5, AURORA, [IC.layers.dark, IC.filter.dark, IC.chart.dark][i]);
      s.addText(t, { x: 1.65, y: ty - 0.05, w: 10.6, h: 0.6, valign: "middle", fontFace: BODY, fontSize: 15.5, color: "DCE6F1", lineSpacingMultiple: 1.05 });
      ty += 0.78;
    });
    s.addShape(pres.ShapeType.line, { x: 0.9, y: 5.6, w: 11.5, h: 0, line: { color: "35507A", width: 1 } });
    s.addText("Vielen Dank — Fragen?", { x: 0.9, y: 5.8, w: 8, h: 0.7, fontFace: HEAD, fontSize: 26, bold: true, color: WHITE });
    s.addText("Jannik Braunshausen · Theodor Höfer · Darnell Himmighöfer", { x: 0.9, y: 6.55, w: 8.5, h: 0.4, fontFace: BODY, fontSize: 13, color: "9FB2C9" });
    s.addText("WDSKI23A · DHBW Mannheim", { x: 8.5, y: 6.55, w: 3.9, h: 0.4, align: "right", fontFace: BODY, fontSize: 12, color: "9FB2C9" });
    s.addNotes("Kernbotschaft wiederholen, dann offene Q&A. Vorbereitete Antworten im Moderationsleitfaden (warum kein echtes LLM, warum k=60, warum numpy statt pgvector, hätte ein besseres Modell die Falle verhindert).");
  }

  await pres.writeFile({ fileName: "/home/claude/rag-advanced-workshop/RAG_Advanced_Folien.pptx" });
  console.log("✓ Deck geschrieben:", pres.slides ? pres.slides.length : "?", "Folien");
}

build().catch((e) => { console.error(e); process.exit(1); });
