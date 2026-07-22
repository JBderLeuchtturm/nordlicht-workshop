// Theorie-Foliensatz "RAG Advanced" · WDSKI23A · DHBW Mannheim
// Palette "Aurora / NordLicht": tiefes Marineblau (dominant) + Türkis/Mint-Akzent.
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Icons = require("react-icons/fa");

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY = "0B2545";   // dominante Dunkelfläche (Titel/Sektion/Schluss)
const NAVY2 = "13315C";  // Karten auf Dunkel
const TEAL = "1C7293";   // Stützfarbe
const AURORA = "2EC4B6"; // Akzent
const AURORA_LT = "9BE3D8";
const INK = "14213D";    // Text auf Hell
const MUTE = "5B6B7E";   // gedämpft
const LIGHT = "F4F8FB";  // heller Hintergrund
const WHITE = "FFFFFF";
const WARN = "E07A3F";   // warmer Kontrast für die "Falle"
const WARN_BG = "FBEDE2";
const GREEN = "3AA76D";
const RED = "C6485B";

const HEAD = "Cambria";  // Serif-Header (safe-list)
const BODY = "Calibri";  // Sans-Body (safe-list)

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" × 7.5"
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
const W = 13.333, H = 7.5;

// ── Icon-Rendering (react-icons → PNG-Base64) ───────────────────────────────
async function icon(name, hex) {
  const El = Icons[name];
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(El, { color: "#" + hex, size: 256 })
  );
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
const ICON_NAMES = {
  truck: "FaTruck", brain: "FaBrain", warn: "FaExclamationTriangle",
  db: "FaDatabase", search: "FaSearch", layers: "FaLayerGroup",
  filter: "FaFilter", chart: "FaChartBar", check: "FaClipboardCheck",
  bulb: "FaLightbulb", hand: "FaHandPointer", scale: "FaBalanceScale",
  cut: "FaCut", vector: "FaProjectDiagram", robot: "FaRobot",
  clock: "FaHistory", quote: "FaQuoteLeft", rocket: "FaRocket",
  shield: "FaShieldAlt", gauge: "FaTachometerAlt", link: "FaLink",
  users: "FaUsers", arrow: "FaArrowRight", code: "FaCode",
};
let IC = {};
async function loadIcons() {
  for (const [k, v] of Object.entries(ICON_NAMES)) {
    IC[k] = { light: await icon(v, AURORA), dark: await icon(v, NAVY),
              warn: await icon(v, WARN), white: await icon(v, WHITE),
              teal: await icon(v, TEAL) };
  }
}

// ── Bausteine ───────────────────────────────────────────────────────────────
function bg(slide, hex) {
  slide.background = { color: hex };
}
function pageNo(slide, n) {
  slide.addText(String(n).padStart(2, "0"), {
    x: W - 0.9, y: H - 0.55, w: 0.6, h: 0.3, align: "right",
    fontFace: BODY, fontSize: 10, color: MUTE,
  });
}
// Kopf für Inhaltsfolien: Kicker + Titel, ohne Akzentlinie (per Skill verboten)
function contentHead(slide, kicker, title, kickerColor = TEAL) {
  slide.addText(kicker.toUpperCase(), {
    x: 0.7, y: 0.5, w: 11.9, h: 0.32, fontFace: BODY, fontSize: 12.5,
    bold: true, color: kickerColor, charSpacing: 2,
  });
  slide.addText(title, {
    x: 0.7, y: 0.82, w: 11.9, h: 0.7, fontFace: HEAD, fontSize: 32,
    bold: true, color: INK,
  });
}
function iconCircle(slide, x, y, d, fillHex, iconData) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fillHex } });
  const pad = d * 0.26;
  slide.addImage({ data: iconData, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}
function card(slide, x, y, w, h, fillHex) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09, fill: { color: fillHex },
    shadow: { type: "outer", color: "0B2545", opacity: 0.16, blur: 7, offset: 3, angle: 90 },
  });
}
function chip(slide, x, y, w, text, fillHex, textHex) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.34, rectRadius: 0.17, fill: { color: fillHex } });
  slide.addText(text, { x, y, w, h: 0.34, align: "center", valign: "middle",
    fontFace: BODY, fontSize: 11, bold: true, color: textHex, margin: 0 });
}
function bullets(slide, x, y, w, h, items, opts = {}) {
  slide.addText(
    items.map((t, i) => ({
      text: t, options: {
        bullet: { code: "2022", indent: 14 }, color: opts.color || INK,
        fontFace: BODY, fontSize: opts.fontSize || 14.5,
        paraSpaceAfter: opts.gap != null ? opts.gap : 9, breakLine: true,
      },
    })),
    { x, y, w, h, valign: "top" }
  );
}

// ════════════════════════════════════════════════════════════════════════════
async function build() {
  await loadIcons();

  // 1 · TITEL ────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, NAVY);
    // Aurora-Bänder (Motiv), dezent oben rechts
    s.addShape(pres.ShapeType.roundRect, { x: 8.7, y: -1.6, w: 6.5, h: 3.4, rectRadius: 0.4,
      fill: { color: TEAL, transparency: 55 }, rotate: 25, line: { type: "none" } });
    s.addShape(pres.ShapeType.roundRect, { x: 9.6, y: -1.2, w: 6.5, h: 2.2, rectRadius: 0.4,
      fill: { color: AURORA, transparency: 62 }, rotate: 25, line: { type: "none" } });
    s.addText("WORKSHOP · SÄULE 2 — LLMs, RAG & AGENTS", {
      x: 0.9, y: 1.35, w: 10, h: 0.4, fontFace: BODY, fontSize: 14, bold: true,
      color: AURORA_LT, charSpacing: 2 });
    s.addText("RAG Advanced", {
      x: 0.85, y: 1.85, w: 11.5, h: 1.4, fontFace: HEAD, fontSize: 60, bold: true, color: WHITE });
    s.addText("Warum naive Retrieval-Pipelines scheitern — und wie Hybrid Search, Reranking und Evaluation sie retten.", {
      x: 0.9, y: 3.35, w: 10.8, h: 0.9, fontFace: BODY, fontSize: 18, color: "CBD9E8", lineSpacingMultiple: 1.1 });
    // Use-Case-Chip
    iconCircle(s, 0.9, 4.75, 0.6, TEAL, IC.truck.white);
    s.addText("Use Case: NordLicht Logistik GmbH — internes Wissen für Kundenservice & Personal", {
      x: 1.65, y: 4.78, w: 10.5, h: 0.55, valign: "middle", fontFace: BODY, fontSize: 14.5,
      italic: true, color: AURORA_LT });
    // Fußzeile
    s.addShape(pres.ShapeType.line, { x: 0.9, y: 6.1, w: 11.5, h: 0, line: { color: "35507A", width: 1 } });
    s.addText("Jannik Braunshausen · Theodor Höfer · Darnell Himmighöfer", {
      x: 0.9, y: 6.25, w: 8.5, h: 0.4, fontFace: BODY, fontSize: 15, color: WHITE, bold: true });
    s.addText("WDSKI23A · DHBW Mannheim", {
      x: 8.5, y: 6.25, w: 3.9, h: 0.4, align: "right", fontFace: BODY, fontSize: 13, color: "9FB2C9" });
    s.addNotes("Begrüßung. Story-Hook: 850 Mitarbeitende, das Wissen steht in Dokumenten — aber niemand findet es. Wichtig: JETZT die Setup-Zelle von NB 01 starten lassen, damit die Modell-Downloads während des Theorieteils laufen.");
  }

  // 2 · AGENDA ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Fahrplan", "Drei Blöcke in ~2 Stunden");
    const blocks = [
      { ic: IC.brain.light, t: "Konzept & Kontext", d: "Das Wissensproblem, die RAG-Architektur und warum naive Pipelines scheitern.", time: "~30 min", accent: TEAL },
      { ic: IC.hand.light, t: "Hands-on (Mitmach-Teil)", d: "Vier Notebooks: von naivem Retrieval bis zur Advanced-Pipeline mit Evaluation.", time: "~60–75 min", accent: AURORA },
      { ic: IC.bulb.light, t: "Reflexion & Q&A", d: "Chancen, Risiken, Enterprise-Tauglichkeit — und die offene Fragerunde.", time: "~15–20 min", accent: TEAL },
    ];
    let x = 0.7;
    const cw = 3.9, gap = 0.32;
    blocks.forEach((b, i) => {
      card(s, x, 2.0, cw, 3.9, WHITE);
      iconCircle(s, x + 0.35, 2.35, 0.85, b.accent, b.ic);
      s.addText(`0${i + 1}`, { x: x + cw - 1.25, y: 2.3, w: 1.0, h: 0.8, align: "right",
        fontFace: HEAD, fontSize: 40, bold: true, color: "E1E9F1" });
      s.addText(b.t, { x: x + 0.35, y: 3.45, w: cw - 0.7, h: 0.7, fontFace: HEAD, fontSize: 19, bold: true, color: INK });
      s.addText(b.d, { x: x + 0.35, y: 4.15, w: cw - 0.7, h: 1.2, fontFace: BODY, fontSize: 13.5, color: MUTE, lineSpacingMultiple: 1.05 });
      chip(s, x + 0.35, 5.35, 1.7, b.time, b.accent === AURORA ? "E4F6F3" : "E3EEF3", b.accent === AURORA ? "1B7A70" : TEAL);
      x += cw + gap;
    });
    s.addText("Kein Frontalvortrag: Ziel ist, dass ihr das Thema am Ende selbst angefasst habt.", {
      x: 0.7, y: 6.35, w: 11.9, h: 0.4, fontFace: BODY, fontSize: 13.5, italic: true, color: TEAL });
    pageNo(s, 2);
    s.addNotes("Erwartungsmanagement: Der Hands-on-Teil ist der größte Block und fließt mit 35 % in die Bewertung. Blöcke kurz durchgehen.");
  }

  // 3 · STORY NORDLICHT ────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Der Kontext", "Willkommen bei NordLicht Logistik");
    // linke Karte: Firmenprofil
    card(s, 0.7, 2.0, 5.5, 4.35, LIGHT);
    iconCircle(s, 1.05, 2.35, 0.8, TEAL, IC.truck.white);
    s.addText("Mittelständischer Stückgut-Logistiker", { x: 2.05, y: 2.42, w: 4.0, h: 0.7, valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    const facts = [
      ["Hauptsitz", "Hamburg"],
      ["Mitarbeitende", "~ 850"],
      ["Depots", "Bremen · Hannover · Kiel · Rostock"],
      ["Leistungen", "Stückgut · Lager · Retouren"],
    ];
    let fy = 3.45;
    facts.forEach(([k, v]) => {
      s.addText(k, { x: 1.05, y: fy, w: 1.7, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: TEAL });
      s.addText(v, { x: 2.75, y: fy, w: 3.3, h: 0.4, fontFace: BODY, fontSize: 12.5, color: INK });
      fy += 0.55;
    });
    // rechte Karte: das Problem
    card(s, 6.5, 2.0, 6.1, 4.35, NAVY);
    s.addText("Das Alltagsproblem", { x: 6.9, y: 2.3, w: 5.3, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: WHITE });
    bullets(s, 6.9, 2.95, 5.3, 2.4, [
      "Kundenservice und Personal ertrinken in Rückfragen.",
      "Die Antworten stehen längst in internen Dokumenten: SLAs, Richtlinien, Preisblätter, Handbücher.",
      "Niemand findet sie schnell genug — und Wissen veraltet.",
    ], { color: "DCE6F1", fontSize: 14.5, gap: 11 });
    card(s, 6.9, 5.3, 5.3, 0.85, "1B3A66");
    iconCircle(s, 7.1, 5.45, 0.55, AURORA, IC.robot.dark);
    s.addText("Auftrag: ein Assistent, der Fragen direkt aus diesen Dokumenten beantwortet.", {
      x: 7.8, y: 5.32, w: 4.25, h: 0.8, valign: "middle", fontFace: BODY, fontSize: 13, italic: true, color: AURORA_LT });
    pageNo(s, 3);
    s.addNotes("Der rote Faden des ganzen Workshops. Alle Dokumente sind erfunden, aber realistisch. Dieser Assistent ist das, was wir in den Notebooks bauen.");
  }

  // 4 · WISSENSPROBLEM ─────────────────────────────────────────────────────────
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
    // Lösungs-Band
    card(s, 0.7, 5.05, 11.9, 1.35, NAVY);
    iconCircle(s, 1.1, 5.35, 0.75, AURORA, IC.search.dark);
    s.addText([
      { text: "Die Lösung zur Laufzeit:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 15 } },
      { text: "relevante Dokumente suchen und dem LLM als Kontext mitgeben. Es antwortet aus dem, was es gerade liest — statt aus dem Gedächtnis. Das ist ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
      { text: "Retrieval-Augmented Generation.", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 15 } },
    ], { x: 2.05, y: 5.35, w: 10.2, h: 0.8, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 4);
    s.addNotes("Drei Wurzeln des Wissensproblems (VL 3). Kernbotschaft: RAG behebt ein WISSENS-Problem, kein Verhaltensproblem — das ist die Abgrenzung zu Fine-Tuning.");
  }

  // 5 · AIR CANADA ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, NAVY);
    s.addText("WARNGESCHICHTE", { x: 0.9, y: 0.7, w: 8, h: 0.35, fontFace: BODY, fontSize: 12.5, bold: true, color: WARN, charSpacing: 2 });
    s.addText("Wenn der Bot Unsinn erzählt, haftet das Unternehmen", { x: 0.9, y: 1.05, w: 11.5, h: 1.0, fontFace: HEAD, fontSize: 30, bold: true, color: WHITE });
    // großes Zitat-Icon
    iconCircle(s, 0.95, 2.55, 1.0, "1B3A66", IC.quote.warn);
    card(s, 2.4, 2.5, 6.1, 3.5, NAVY2);
    s.addText("Der Fall Air Canada (2024)", { x: 2.8, y: 2.8, w: 5.3, h: 0.5, fontFace: HEAD, fontSize: 17, bold: true, color: AURORA_LT });
    bullets(s, 2.8, 3.4, 5.3, 2.5, [
      "Ein Support-Chatbot erfindet eine Rückerstattungs-Regel, die es nie gab.",
      "Ein Kunde verlässt sich darauf und klagt.",
      "Das Gericht entscheidet: Die Airline haftet für die Aussage ihres Bots.",
    ], { color: "DCE6F1", fontSize: 14.5, gap: 12 });
    // Konsequenz-Callout
    card(s, 8.8, 2.5, 3.8, 3.5, "3A1F14");
    s.addText("Die Lektion", { x: 9.15, y: 2.8, w: 3.1, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: WARN });
    s.addText("Eine flüssige, falsche Antwort ist teurer als gar keine.\n\nVertrauen, Recht und Reputation hängen an der Faktentreue.", {
      x: 9.15, y: 3.35, w: 3.15, h: 2.5, fontFace: BODY, fontSize: 14, color: "F0D9CB", lineSpacingMultiple: 1.15 });
    s.addText("Genau diese Art Fehler werden wir heute an unserer eigenen Pipeline reproduzieren — und beheben.", {
      x: 0.9, y: 6.35, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 13.5, italic: true, color: AURORA_LT });
    pageNo(s, 5);
    s.addNotes("Der emotionale Anker für den ganzen Workshop. Am Ende (NB 03) bauen wir denselben Fehlertyp nach: eine treue Antwort aus einer falschen Quelle.");
  }

  // 6 · WAS IST RAG (Architektur) ──────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Die Architektur", "RAG in zwei Phasen");
    // Phase 1 (offline)
    card(s, 0.7, 2.05, 5.75, 4.3, LIGHT);
    chip(s, 1.05, 2.35, 2.5, "PHASE 1 · OFFLINE (einmalig)", "E3EEF3", TEAL);
    const off = [
      { ic: IC.cut.teal, t: "Chunking", d: "Dokumente in Häppchen teilen" },
      { ic: IC.vector.teal, t: "Embedding", d: "Jeder Chunk wird zum Vektor" },
      { ic: IC.db.teal, t: "Indexieren", d: "Vektoren in die (Vektor-)Datenbank" },
    ];
    let oy = 2.95;
    off.forEach((o) => {
      iconCircle(s, 1.05, oy, 0.6, WHITE, o.ic);
      s.addShape(pres.ShapeType.ellipse, { x: 1.05, y: oy, w: 0.6, h: 0.6, fill: { type: "none" }, line: { color: TEAL, width: 1.25 } });
      s.addText(o.t, { x: 1.85, y: oy - 0.02, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 14.5, bold: true, color: INK });
      s.addText(o.d, { x: 1.85, y: oy + 0.32, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 12, color: MUTE });
      oy += 1.05;
    });
    // Phase 2 (online)
    card(s, 6.85, 2.05, 5.75, 4.3, NAVY);
    chip(s, 7.2, 2.35, 2.7, "PHASE 2 · ZUR LAUFZEIT (pro Frage)", "1B3A66", AURORA_LT);
    const on = [
      { ic: IC.search.dark, t: "Retrieval", d: "Passende Chunks zur Frage suchen" },
      { ic: IC.link.dark, t: "Augmentierung", d: "Chunks in den Prompt einbetten" },
      { ic: IC.robot.dark, t: "Generierung", d: "LLM antwortet aus dem Kontext" },
    ];
    let ny = 2.95;
    on.forEach((o) => {
      iconCircle(s, 7.2, ny, 0.6, AURORA, o.ic);
      s.addText(o.t, { x: 8.0, y: ny - 0.02, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 14.5, bold: true, color: WHITE });
      s.addText(o.d, { x: 8.0, y: ny + 0.32, w: 4.4, h: 0.35, fontFace: BODY, fontSize: 12, color: "C4D3E4" });
      ny += 1.05;
    });
    s.addText("Der Schlüsselsatz für heute: Die Generierung kann nur so gut sein wie das Retrieval.", {
      x: 0.7, y: 6.5, w: 11.9, h: 0.4, align: "center", fontFace: BODY, fontSize: 14, bold: true, italic: true, color: TEAL });
    pageNo(s, 6);
    s.addNotes("Zwei Phasen sauber trennen. Offline berechnen wir einmal alle Vektoren (Bi-Encoder!), online läuft nur die Suche + Generierung. Der Merksatz unten trägt den gesamten Rest des Workshops.");
  }

  // 7 · NAIVE PIPELINE (Prozessfluss) ──────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Notebook 01", "Die naive Pipeline — unser Startpunkt");
    const steps = [
      { ic: IC.cut.white, t: "Chunking", d: "1 Absatz = 1 Chunk" },
      { ic: IC.vector.white, t: "Embedding", d: "MiniLM, mehrsprachig" },
      { ic: IC.search.white, t: "Vektorsuche", d: "Kosinus-Ähnlichkeit, Top-k" },
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
    // Übung-Hinweis
    card(s, 0.7, 5.2, 11.9, 1.2, NAVY);
    iconCircle(s, 1.05, 5.45, 0.7, AURORA, IC.code.dark);
    s.addText([
      { text: "Eure Übung 1:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 14.5 } },
      { text: "Kosinus-Ähnlichkeit und die Top-k-Suche selbst implementieren. Eine ✅-Selbsttest-Zelle prüft euch automatisch.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 14.5 } },
    ], { x: 1.9, y: 5.45, w: 10.3, h: 0.75, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 7);
    s.addNotes("Bewusst simpel gehalten. Für viele Fragen funktioniert das erstaunlich gut — das ist wichtig, damit der Kontrast später wirkt. Die Generierung ist deterministisch (Satz-Extraktion), damit alles kostenlos & reproduzierbar bleibt.");
  }

  // 8 · WO NAIVE RAG SCHEITERT ─────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Die Grenze", "Zwei blinde Flecken der Vektorsuche");
    const cases = [
      { ic: IC.warn.warn, tag: "Exakte Begriffe", q: "\u201eNL-410\u201c", d: "Fehlercodes, Produktnamen, Paragraphen. Embeddings erfassen Bedeutung — aber ein kryptischer Code hat kaum semantischen Gehalt.", col: WARN, bg: WARN_BG },
      { ic: IC.warn.teal, tag: "Umgangssprache", q: "\u201eKrieg ich Kohle zur\u00fcck?\u201c", d: "Kein einziges Wort steht so im Dokument. Hier bräuchte man Bedeutung — Keyword-Suche würde komplett scheitern.", col: TEAL, bg: "E9F1F5" },
    ];
    let x = 0.7; const cw = 5.9, gap = 0.3;
    cases.forEach((c) => {
      card(s, x, 2.05, cw, 3.35, c.bg);
      iconCircle(s, x + 0.4, 2.4, 0.8, c.col, c.ic === IC.warn.warn ? IC.warn.white : IC.search.white);
      s.addText(c.tag, { x: x + 1.4, y: 2.45, w: cw - 1.7, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: c.col, charSpacing: 1 });
      s.addText(c.q, { x: x + 1.4, y: 2.82, w: cw - 1.7, h: 0.55, fontFace: HEAD, fontSize: 22, bold: true, color: INK });
      s.addText(c.d, { x: x + 0.4, y: 3.75, w: cw - 0.8, h: 1.5, fontFace: BODY, fontSize: 14, color: "3A4A5A", lineSpacingMultiple: 1.15 });
      x += cw + gap;
    });
    card(s, 0.7, 5.65, 11.9, 0.9, NAVY);
    s.addText([
      { text: "Die Diagnose:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 15 } },
      { text: "Ein Verfahren allein reicht nicht. Wir brauchen ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
      { text: "Bedeutung UND exakte Begriffe", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 15 } },
      { text: " — das führt uns zu Hybrid Search.", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
    ], { x: 1.05, y: 5.65, w: 11.2, h: 0.9, valign: "middle" });
    pageNo(s, 8);
    s.addNotes("Diese beiden Fälle probieren die Teilnehmenden in NB 01 selbst aus. Auf die Score-Nähe der Top-3 hinweisen: Der Score sagt nicht, ob ein Treffer gut ist — nur dass er der beste war.");
  }

  // 9 · HANDS-ON ÜBERGANG NB 01 ────────────────────────────────────────────────
  handsOn(9, "01", "Naive RAG bauen & an die Grenze bringen", [
    "Chunking, Embeddings und die Vektorsuche zum Laufen bringen",
    "Übung 1: Kosinus-Ähnlichkeit + Top-k selbst implementieren",
    "Die zwei blinden Flecken am eigenen Rechner erleben",
  ]);

  // 10 · HYBRID SEARCH ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Notebook 02 · Konzept", "Hybrid Search: zwei Sucher, zwei Stärken");
    // BM25
    card(s, 0.7, 2.05, 5.75, 3.05, WHITE);
    iconCircle(s, 1.05, 2.4, 0.75, TEAL, IC.search.white);
    s.addText("BM25 · Keyword-Suche", { x: 1.95, y: 2.45, w: 4.3, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 16.5, bold: true, color: INK });
    bullets(s, 1.05, 3.35, 5.05, 1.6, [
      "Vergleicht exakte Wortformen (seit den 90ern Standard).",
      "Stark bei Codes, Produktnamen, Fachbegriffen.",
      "Blind für Synonyme und Umschreibungen.",
    ], { fontSize: 13.5, gap: 7 });
    // Dense
    card(s, 6.85, 2.05, 5.75, 3.05, WHITE);
    iconCircle(s, 7.2, 2.4, 0.75, AURORA, IC.vector.dark);
    s.addText("Dense · Vektorsuche", { x: 8.1, y: 2.45, w: 4.3, h: 0.65, valign: "middle", fontFace: HEAD, fontSize: 16.5, bold: true, color: INK });
    bullets(s, 7.2, 3.35, 5.05, 1.6, [
      "Vergleicht Bedeutung über Embeddings.",
      "Stark bei Synonymen und Umgangssprache.",
      "Schwach bei exakten, semantisch armen Begriffen.",
    ], { fontSize: 13.5, gap: 7 });
    // Fusion
    card(s, 0.7, 5.35, 11.9, 1.2, NAVY);
    iconCircle(s, 1.05, 5.6, 0.7, AURORA, IC.layers.dark);
    s.addText([
      { text: "Idee:  ", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 15 } },
      { text: "beide parallel laufen lassen und die Ergebnislisten fair verschmelzen. Aber die Scores sind ", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
      { text: "nicht vergleichbar", options: { bold: true, color: WHITE, fontFace: BODY, fontSize: 15 } },
      { text: " (BM25: 0…>10, Kosinus: −1…1). Wie fusioniert man das?", options: { color: "DCE6F1", fontFace: BODY, fontSize: 15 } },
    ], { x: 1.9, y: 5.6, w: 10.3, h: 0.75, valign: "middle", lineSpacingMultiple: 1.05 });
    pageNo(s, 10);
    s.addNotes("Das Duell im Notebook zeigt beide Asymmetrien live. Überleitung zum Fusionsproblem — genau das löst RRF auf der nächsten Folie.");
  }

  // 11 · RRF ───────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Notebook 02 · Kernkonzept", "Reciprocal Rank Fusion (RRF)");
    // Formel-Karte
    card(s, 0.7, 2.05, 5.5, 2.35, NAVY);
    s.addText("Nur Ränge zählen — keine rohen Scores.", { x: 1.05, y: 2.3, w: 4.8, h: 0.5, fontFace: BODY, fontSize: 13.5, italic: true, color: AURORA_LT });
    s.addText([
      { text: "RRF(d) = ", options: { fontFace: "Cambria", fontSize: 24, italic: true, color: WHITE } },
      { text: "Σ ", options: { fontFace: "Cambria", fontSize: 26, color: AURORA } },
      { text: "1 / (k + rang", options: { fontFace: "Cambria", fontSize: 24, italic: true, color: WHITE } },
      { text: "r", options: { fontFace: "Cambria", fontSize: 15, italic: true, color: AURORA_LT } },
      { text: "(d))", options: { fontFace: "Cambria", fontSize: 24, italic: true, color: WHITE } },
    ], { x: 1.05, y: 2.95, w: 4.9, h: 0.7, valign: "middle" });
    s.addText([
      { text: "k = 60", options: { bold: true, color: AURORA_LT, fontFace: BODY, fontSize: 13 } },
      { text: "  · robuster Default aus dem Original-Paper (Cormack et al., SIGIR 2009).", options: { color: "C4D3E4", fontFace: BODY, fontSize: 13 } },
    ], { x: 1.05, y: 3.7, w: 4.9, h: 0.6, valign: "middle", lineSpacingMultiple: 1.05 });
    // Worked Example Tabelle
    s.addText("Worked Example  (aus VL 3)", { x: 6.5, y: 2.05, w: 6.1, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    const rows = [
      ["Dok.", "BM25", "Dense", "RRF", ""],
      ["A", "1", "3", "0,0321", ""],
      ["B", "2", "1", "0,0326", "★"],
      ["C", "3", "2", "0,0319", ""],
    ];
    const tX = 6.5, tY = 2.55, colW = [1.0, 1.2, 1.2, 1.5, 0.7], rH = 0.62;
    rows.forEach((r, ri) => {
      let cx = tX;
      r.forEach((cell, ci) => {
        const isHead = ri === 0;
        const isWin = r[4] === "★";
        const fill = isHead ? NAVY2 : (isWin ? "E4F6F3" : (ri % 2 ? "F4F8FB" : WHITE));
        s.addShape(pres.ShapeType.rect, { x: cx, y: tY + ri * rH, w: colW[ci], h: rH, fill: { color: fill }, line: { color: "DCE6F1", width: 0.75 } });
        s.addText(cell, { x: cx, y: tY + ri * rH, w: colW[ci], h: rH, align: ci === 0 ? "left" : "center", valign: "middle",
          fontFace: BODY, fontSize: isHead ? 12.5 : 14, bold: isHead || ci === 0 || isWin,
          color: isHead ? WHITE : (ci === 4 ? AURORA : INK), margin: ci === 0 ? 0.08 : 0 });
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
    pageNo(s, 11);
    s.addNotes("Brücke zu VL 3 explizit machen — dasselbe Zahlenbeispiel. Intuition: Dokumente, die in BEIDEN Listen oben stehen, setzen sich durch. k=60 dämpft die Dominanz der Spitzenränge.");
  }

  // 12 · HANDS-ON ÜBERGANG NB 02 ───────────────────────────────────────────────
  handsOn(12, "02", "Hybrid Search & RRF selbst bauen", [
    "BM25 gegen die Vektorsuche antreten lassen (das Duell)",
    "Übung 2: Reciprocal Rank Fusion implementieren",
    "Beide blinden Flecken aus NB 01 verschwinden — ohne neue Nachteile",
  ]);

  // 13 · CROSS-ENCODER ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Notebook 03 · Konzept", "Cross-Encoder Reranking");
    // Bi vs Cross
    card(s, 0.7, 2.05, 5.75, 2.7, LIGHT);
    s.addText("Bi-Encoder  (Retrieval)", { x: 1.05, y: 2.3, w: 5.05, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: TEAL });
    s.addText("Frage und Dokument werden getrennt encodiert. Vektoren sind vorberechenbar.", { x: 1.05, y: 2.8, w: 5.05, h: 0.75, fontFace: BODY, fontSize: 13.5, color: MUTE, lineSpacingMultiple: 1.1 });
    chip(s, 1.05, 3.65, 2.3, "Schnell · Millionen Chunks", "E3EEF3", TEAL);
    chip(s, 3.5, 3.65, 2.4, "Ungenauer im Ranking", "F0E4DC", WARN);
    card(s, 6.85, 2.05, 5.75, 2.7, NAVY);
    s.addText("Cross-Encoder  (Reranking)", { x: 7.2, y: 2.3, w: 5.05, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: AURORA_LT });
    s.addText("Liest [Frage] [SEP] [Dokument] gemeinsam und gibt einen direkten Relevanz-Score.", { x: 7.2, y: 2.8, w: 5.05, h: 0.75, fontFace: BODY, fontSize: 13.5, color: "C4D3E4", lineSpacingMultiple: 1.1 });
    chip(s, 7.2, 3.65, 1.9, "Sehr präzise", "1B3A66", AURORA_LT);
    chip(s, 9.25, 3.65, 3.0, "Teuer · nur für Top-N", "3A2A18", WARN);
    // Zweistufiges Muster
    card(s, 0.7, 5.05, 11.9, 1.5, LIGHT);
    s.addText("Das zweistufige Muster", { x: 1.05, y: 5.25, w: 4, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    const stages = [
      { t: "Stage 1 · Recall", d: "Hybrid Search → Top-50 Kandidaten", col: TEAL },
      { t: "Stage 2 · Precision", d: "Cross-Encoder rerankt → Top-5 ans LLM", col: AURORA },
    ];
    let sx = 1.05;
    stages.forEach((st, i) => {
      s.addShape(pres.ShapeType.roundRect, { x: sx, y: 5.7, w: 5.0, h: 0.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: st.col, width: 1.25 } });
      s.addText([
        { text: st.t + "   ", options: { bold: true, color: st.col, fontFace: BODY, fontSize: 13.5 } },
        { text: st.d, options: { color: INK, fontFace: BODY, fontSize: 13 } },
      ], { x: sx + 0.2, y: 5.7, w: 4.7, h: 0.7, valign: "middle" });
      if (i === 0) s.addImage({ data: IC.arrow.teal, x: sx + 5.05, y: 5.9, w: 0.28, h: 0.28 });
      sx += 5.35;
    });
    pageNo(s, 13);
    s.addNotes("Übung 3: Reranking implementieren. Betonen: Stage 1 maximiert Recall (nichts verpassen), Stage 2 maximiert Precision (das Beste nach oben). Danach kommt der Höhepunkt.");
  }

  // 14 · HANDS-ON ÜBERGANG NB 03 ───────────────────────────────────────────────
  handsOn(14, "03", "Reranking bauen — und dem System eine Falle stellen", [
    "Übung 3: Cross-Encoder-Reranking implementieren",
    "Die voll ausgebaute Pipeline an einer Alltagsfrage testen",
    "Übung 4: den Fehler beheben — sobald wir ihn verstanden haben",
  ]);

  // 15 · DIE FALLE ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, NAVY);
    s.addText("DER AHA-MOMENT", { x: 0.9, y: 0.6, w: 8, h: 0.35, fontFace: BODY, fontSize: 12.5, bold: true, color: WARN, charSpacing: 2 });
    s.addText("Relevanz ist nicht Gültigkeit", { x: 0.9, y: 0.95, w: 11.5, h: 0.9, fontFace: HEAD, fontSize: 34, bold: true, color: WHITE });
    // Frage
    card(s, 0.7, 2.15, 5.5, 1.05, "1B3A66");
    iconCircle(s, 1.0, 2.4, 0.55, WARN, IC.warn.white);
    s.addText("\u201eWie viele Tage Homeoffice sind erlaubt?\u201c", { x: 1.7, y: 2.2, w: 4.4, h: 0.95, valign: "middle", fontFace: HEAD, fontSize: 15.5, bold: true, color: WHITE });
    // Antwort der Pipeline (falsch)
    card(s, 0.7, 3.35, 5.5, 2.95, "3A1F14");
    s.addText("Die Pipeline antwortet:", { x: 1.05, y: 3.6, w: 4.8, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: WARN });
    s.addText("\u201emaximal zwei Tage\u201c", { x: 1.05, y: 4.0, w: 4.8, h: 0.6, fontFace: HEAD, fontSize: 24, bold: true, color: WHITE });
    s.addText([
      { text: "Quelle: ", options: { color: "E7C3AE", fontFace: BODY, fontSize: 12.5 } },
      { text: "Homeoffice-Regelung (2022) · Status: archiviert", options: { bold: true, color: WARN, fontFace: BODY, fontSize: 12.5 } },
    ], { x: 1.05, y: 4.7, w: 4.8, h: 0.5, valign: "middle" });
    s.addText("Flüssig. Mit Quellenangabe. Völlig überzeugend — und falsch. Gültig sind seit 2025 drei Tage.", {
      x: 1.05, y: 5.25, w: 4.8, h: 0.9, fontFace: BODY, fontSize: 13.5, italic: true, color: "F0D9CB", lineSpacingMultiple: 1.15 });
    // Warum? — rechte Seite
    s.addText("Warum passiert das?", { x: 6.6, y: 2.15, w: 6, h: 0.5, fontFace: HEAD, fontSize: 18, bold: true, color: AURORA_LT });
    const why = [
      ["BM25", "liebt 2022 — dort steht wörtlich & oft \u201eHomeoffice\u201c. 2025 spricht von \u201emobilem Arbeiten\u201c."],
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
    pageNo(s, 15);
    s.addNotes("DAS HERZSTÜCK. Antwort laut vorlesen, Kunstpause, dann die Quelle zeigen. 3 Min Team-Diskussion 'Warum?' BEVOR die Auflösung kommt. Merksatz: Alle drei Stufen haben exakt das getan, wofür sie gebaut sind.");
  }

  // 16 · DER FIX ───────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Notebook 03 · Übung 4", "Der Fix: Metadaten ernst nehmen", GREEN);
    // Code-Karte
    card(s, 0.7, 2.05, 5.75, 2.4, NAVY);
    s.addText("Ein Filter vor dem Reranking", { x: 1.05, y: 2.3, w: 4.9, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: AURORA_LT });
    s.addText("kandidaten = [c for c in kandidaten\n            if c[\"status\"] != \"archiviert\"]", {
      x: 1.05, y: 2.85, w: 4.9, h: 1.0, fontFace: "Courier New", fontSize: 13, color: AURORA_LT, lineSpacingMultiple: 1.2 });
    s.addText("Die Chunks trugen status und jahr die ganze Zeit mit sich.", {
      x: 1.05, y: 3.9, w: 4.9, h: 0.45, fontFace: BODY, fontSize: 12.5, italic: true, color: "C4D3E4" });
    // Vorher/Nachher
    card(s, 6.85, 2.05, 5.75, 2.4, "EAF5EF");
    s.addText("Jetzt antwortet die Pipeline:", { x: 7.2, y: 2.3, w: 5.0, h: 0.4, fontFace: BODY, fontSize: 12.5, bold: true, color: GREEN });
    s.addText("\u201edrei Tage\u201c", { x: 7.2, y: 2.75, w: 5.0, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: INK });
    s.addText([
      { text: "Quelle: ", options: { color: "4A6A56", fontFace: BODY, fontSize: 12.5 } },
      { text: "Richtlinie Mobiles Arbeiten (2025) · gültig ✓", options: { bold: true, color: GREEN, fontFace: BODY, fontSize: 12.5 } },
    ], { x: 7.2, y: 3.5, w: 5.0, h: 0.5, valign: "middle" });
    s.addText("Der Selbsttest bestätigt: archivierte Chunks sind raus, die gültige Quelle gewinnt.", {
      x: 7.2, y: 3.95, w: 5.0, h: 0.45, fontFace: BODY, fontSize: 12.5, italic: true, color: "3F5A4B" });
    // Die eigentliche Lektion
    card(s, 0.7, 4.75, 11.9, 1.8, LIGHT);
    iconCircle(s, 1.1, 5.15, 0.85, GREEN, IC.filter.white);
    s.addText("Der Code war eine Zeile — die Lektion ist es nicht", { x: 2.2, y: 4.95, w: 10.2, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: INK });
    bullets(s, 2.2, 5.4, 10.2, 1.0, [
      "Gültigkeit, Aktualität, Zuständigkeit stehen in Metadaten, nicht im Text — und keine Retrieval-Stufe sieht sie von allein.",
      "Der echte Engpass in Unternehmen: Wer pflegt den Status? Was tun bei widersprüchlichen, nicht archivierten Dokumenten?",
    ], { fontSize: 13, gap: 5 });
    pageNo(s, 16);
    s.addNotes("Die Pointe ist nicht der Code, sondern Data Governance. Alternativen zum harten Filter kurz nennen: Aktualität als Score-Boost, Zeitbezug aus der Frage erkennen ('Was galt 2022?'), oder dem LLM beide Fassungen mit Datum geben.");
  }

  // 17 · EVALUATION (Ergebnis-Platzhalter) ─────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, LIGHT);
    contentHead(s, "Notebook 04", "Beweisen statt behaupten: die Evaluation");
    // Metriken links
    card(s, 0.7, 2.05, 4.1, 4.35, WHITE);
    s.addText("Zwei Metriken auf 15 Gold-Fragen", { x: 1.0, y: 2.3, w: 3.5, h: 0.7, fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    iconCircle(s, 1.0, 3.15, 0.6, TEAL, IC.check.dark);
    s.addText("Hit@3", { x: 1.75, y: 3.13, w: 2.9, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: INK });
    s.addText("Ist ein relevantes Dokument in den Top-3?", { x: 1.75, y: 3.46, w: 2.9, h: 0.55, fontFace: BODY, fontSize: 11.5, color: MUTE });
    iconCircle(s, 1.0, 4.25, 0.6, AURORA, IC.gauge.dark);
    s.addText("MRR", { x: 1.75, y: 4.23, w: 2.9, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: INK });
    s.addText("Wie weit oben steht der erste Treffer?", { x: 1.75, y: 4.56, w: 2.9, h: 0.55, fontFace: BODY, fontSize: 11.5, color: MUTE });
    s.addText("Rang 1 → 1,0 · Rang 2 → 0,5 · Rang 3 → 0,33", { x: 1.0, y: 5.35, w: 3.6, h: 0.5, fontFace: BODY, fontSize: 11.5, italic: true, color: TEAL, lineSpacingMultiple: 1.1 });
    // Ergebnis-Platzhalter rechts
    card(s, 4.95, 2.05, 7.65, 4.35, WHITE);
    s.addText("Retrieval-Qualität je Ausbaustufe", { x: 5.3, y: 2.3, w: 5, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: INK });
    chip(s, 10.15, 2.32, 2.15, "★ ECHTE ZAHLEN EINSETZEN", WARN_BG, WARN);
    // Angedeutetes Balkenschema (Platzhalter, monoton steigend)
    const configs = ["Dense", "BM25", "Hybrid", "+ Rerank", "Advanced"];
    const demoVals = [0.62, 0.55, 0.80, 0.87, 1.0];
    const chartX = 5.35, chartBase = 5.75, chartH = 2.5, bw = 1.15, cgap = 0.28;
    let bx = chartX;
    configs.forEach((c, i) => {
      const h = chartH * demoVals[i];
      s.addShape(pres.ShapeType.roundRect, { x: bx, y: chartBase - h, w: bw, h, rectRadius: 0.04,
        fill: { color: i === 4 ? AURORA : (i === 1 ? "9FB2C9" : TEAL) } });
      s.addText(c, { x: bx - 0.1, y: chartBase + 0.05, w: bw + 0.2, h: 0.55, align: "center", fontFace: BODY, fontSize: 10.5, bold: i === 4, color: i === 4 ? AURORA : MUTE });
      bx += bw + cgap;
    });
    s.addShape(pres.ShapeType.line, { x: chartX - 0.15, y: chartBase, w: 6.9, h: 0, line: { color: "D4DEE8", width: 1 } });
    s.addText("Schema (Platzhalter). Erwartetes Muster: jede Stufe legt zu, erst der Metadaten-Filter fixt Frage 13.", {
      x: 5.3, y: 6.35, w: 6.9, h: 0.4, fontFace: BODY, fontSize: 11, italic: true, color: MUTE });
    pageNo(s, 17);
    s.addNotes("WICHTIG: Vor der Abgabe die echten Zahlen aus eurer Generalprobe (benchmark_ergebnis.png) hier einsetzen. Auf Frage 13 zeigen: 'Hybrid + Rerank' scheitert an der Falle, erst 'Advanced' löst sie — die Anekdote wird zur Messung.");
  }

  // 18 · RAGAS ─────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, WHITE);
    contentHead(s, "Einordnung", "Von unseren Metriken zu RAGAS");
    // Tabelle
    const trows = [
      ["Unsere Metrik", "RAGAS-Verwandter", "Frage dahinter"],
      ["Hit@3", "Context Recall", "Ist die nötige Info im Kontext?"],
      ["MRR", "Context Precision", "Steht Relevantes oben, ohne Ballast?"],
      ["—", "Faithfulness", "Hält sich die Antwort an den Kontext?"],
      ["—", "Answer Relevancy", "Beantwortet sie die Frage?"],
    ];
    const tx = 0.7, ty = 2.1, cw = [3.1, 3.4, 5.4], rh = 0.6;
    trows.forEach((r, ri) => {
      let cx = tx;
      r.forEach((cell, ci) => {
        const head = ri === 0;
        s.addShape(pres.ShapeType.rect, { x: cx, y: ty + ri * rh, w: cw[ci], h: rh,
          fill: { color: head ? NAVY : (ri % 2 ? "F4F8FB" : WHITE) }, line: { color: "DCE6F1", width: 0.75 } });
        s.addText(cell, { x: cx + 0.15, y: ty + ri * rh, w: cw[ci] - 0.2, h: rh, valign: "middle",
          fontFace: BODY, fontSize: head ? 13 : 13.5, bold: head || ci === 0,
          color: head ? WHITE : (ci === 0 ? (cell === "—" ? "B7C2CE" : TEAL) : INK), margin: 0 });
        cx += cw[ci];
      });
    });
    // Warum kein LLM-Judge
    card(s, 0.7, 5.35, 5.75, 1.2, LIGHT);
    iconCircle(s, 1.0, 5.6, 0.65, TEAL, IC.shield.dark);
    s.addText([
      { text: "Warum LLM-frei?  ", options: { bold: true, color: TEAL, fontFace: BODY, fontSize: 13 } },
      { text: "Kostenlos, deterministisch, sekundenschnell — misst aber nur das Retrieval.", options: { color: INK, fontFace: BODY, fontSize: 13 } },
    ], { x: 1.75, y: 5.6, w: 4.55, h: 0.75, valign: "middle", lineSpacingMultiple: 1.1 });
    card(s, 6.6, 5.35, 6.0, 1.2, WARN_BG);
    iconCircle(s, 6.9, 5.6, 0.65, WARN, IC.warn.white);
    s.addText([
      { text: "Die Lücke jeder Metrik:  ", options: { bold: true, color: WARN, fontFace: BODY, fontSize: 13 } },
      { text: "Frage 13 hätte VOR dem Filter perfekte Scores gehabt. Faktentreue muss man gegen Gold-Antworten prüfen.", options: { color: "5A3A28", fontFace: BODY, fontSize: 13 } },
    ], { x: 7.65, y: 5.6, w: 4.7, h: 0.75, valign: "middle", lineSpacingMultiple: 1.1 });
    pageNo(s, 18);
    s.addNotes("Diagnose-Logik aus VL 3 kurz aufgreifen: niedriger Recall → Chunking/Hybrid/k; viel Irrelevantes → Reranking; Antwort ignoriert Kontext → Prompt/Modell. Der Störfall zeigt eine Lücke, die keine dieser Metriken allein fängt.");
  }

  // 19 · REFLEXION ─────────────────────────────────────────────────────────────
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
    pageNo(s, 19);
    s.addNotes("Die drei Leitfragen des Kick-offs hier zusammenführen. Bewusst provokant die Hebel-Frage stellen und die Q&A eröffnen. Air Canada als Anker für die Risiken zurückholen.");
  }

  // 20 · FAZIT / DANKE ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); bg(s, NAVY);
    s.addShape(pres.ShapeType.roundRect, { x: -1.6, y: 5.4, w: 6.5, h: 3.2, rectRadius: 0.4,
      fill: { color: TEAL, transparency: 60 }, rotate: -20, line: { type: "none" } });
    s.addShape(pres.ShapeType.roundRect, { x: -1.0, y: 5.9, w: 6.5, h: 2.0, rectRadius: 0.4,
      fill: { color: AURORA, transparency: 66 }, rotate: -20, line: { type: "none" } });
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
    s.addNotes("Kernbotschaft wiederholen. Dann in die offene Q&A. Vorbereitete Antworten stehen im Moderationsleitfaden (warum kein echtes LLM, warum k=60, warum numpy statt pgvector, hätte ein besseres Modell die Falle verhindert).");
  }

  // ── Hands-on-Übergangsfolie (Vorlage) ──────────────────────────────────────
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
    s.addNotes(`Übergang in den Mitmach-Teil (Notebook ${nb}). Bearbeitungszeit ansagen, dann die Lösung live tippen. Floorwalker aktiv durch die Reihen.`);
  }

  await pres.writeFile({ fileName: "/home/claude/rag-advanced-workshop/RAG_Advanced_Folien.pptx" });
  console.log("✓ Deck geschrieben");
}

build().catch((e) => { console.error(e); process.exit(1); });
