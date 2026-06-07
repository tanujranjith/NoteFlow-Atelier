// Sutra Comprehensive Product Guide -- docx-js builder
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak, TableOfContents, Bookmark,
  ExternalHyperlink, VerticalAlign
} = require("docx");

const IMG = "/tmp/build/img/";
const NAVY = "0F1830", BLUE = "3A5BD0", BLUEL = "5D82F5", INK = "1B2333", MUT = "5D6A86",
      GREEN = "1AA179", AMBER = "B9700F", VIOLET = "6B4FC0", SLATE = "5D6A86",
      LIGHT = "EEF3FF", LIGHT2 = "E2E9FB", RULE = "C4D0EF", CALLBG = "F2F6FF", WARNBG = "FDF4E8";
const FONT = "Arial";

const K = [];
const add = (...e) => e.forEach(x => K.push(x));

// ---------- run + paragraph helpers ----------
function run(t, o = {}) {
  return new TextRun({ text: t, bold: !!o.b, italics: !!o.i, color: o.c || INK,
    size: o.s || 22, font: FONT, highlight: o.hl });
}
function P(runs, o = {}) {
  if (typeof runs === "string") runs = [run(runs, o)];
  return new Paragraph({ children: runs, spacing: { after: o.after == null ? 140 : o.after, line: 276 },
    alignment: o.align, indent: o.indent });
}
function H1(num, title) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 },
    children: [ new Bookmark({ id: "s" + num, children: [ new TextRun({ text: num + ".  " + title }) ] }) ] });
}
function H2(title) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 }, children: [ new TextRun(title) ] }); }
function H3(title) { return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 90 }, children: [ new TextRun(title) ] }); }
function BUL(items) { return items.map(it => new Paragraph({ numbering: { reference: "bul", level: 0 },
  spacing: { after: 70, line: 270 }, children: Array.isArray(it) ? it : [ run(it) ] })); }
function NUM(items) { return items.map(it => new Paragraph({ numbering: { reference: "num", level: 0 },
  spacing: { after: 70, line: 270 }, children: Array.isArray(it) ? it : [ run(it) ] })); }

// ---------- status chip run ----------
const STATUS_C = { "Shipped and functional": GREEN, "Functional but incomplete": AMBER,
  "Experimental": VIOLET, "Scaffolded but unfinished": AMBER, "Roadmap concept": SLATE,
  "Legacy or deprecated": SLATE, "Unclear and requiring manual verification": "B23B3B" };
function status(label) { return new TextRun({ text: " " + label + " ", bold: true, color: "FFFFFF",
  size: 18, font: FONT, shading: { type: ShadingType.CLEAR, fill: STATUS_C[label] || MUT } }); }
function STAT(label, text) { return P([ status(label), run("   " + text) ]); }

// ---------- callout ----------
function CALL(title, runsOrText, fill) {
  const kids = [];
  if (title) kids.push(new Paragraph({ spacing: { after: 60 }, children: [ run(title, { b: true, c: NAVY, s: 21 }) ] }));
  const body = typeof runsOrText === "string" ? [ run(runsOrText) ] : runsOrText;
  kids.push(new Paragraph({ spacing: { after: 0 }, children: body }));
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    borders: { top:{style:BorderStyle.SINGLE,size:2,color:RULE}, bottom:{style:BorderStyle.SINGLE,size:2,color:RULE},
      left:{style:BorderStyle.SINGLE,size:12,color:fill===WARNBG?AMBER:BLUEL}, right:{style:BorderStyle.SINGLE,size:2,color:RULE},
      insideHorizontal:{style:BorderStyle.NONE}, insideVertical:{style:BorderStyle.NONE} },
    rows: [ new TableRow({ children: [ new TableCell({ width:{size:9360,type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR,fill:fill||CALLBG}, margins:{top:120,bottom:120,left:180,right:180}, children: kids }) ] }) ] });
}

// ---------- image ----------
function pngRatio(buf){ // height/width from PNG IHDR
  const W = buf.readUInt32BE(16), H = buf.readUInt32BE(20); return H / W; }
function IMG_(file, wIn, caption) {
  const data = fs.readFileSync(IMG + file);
  const w = Math.round(wIn * 96), h = Math.round(w * pngRatio(data));
  const els = [ new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: caption?40:140 },
    children: [ new ImageRun({ type: "png", data, transformation: { width: w, height: h },
      altText: { title: caption||file, description: caption||file, name: file } }) ] }) ];
  if (caption) els.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [ run(caption, { i: true, c: MUT, s: 17 }) ] }));
  return els;
}
const DIM = {};
function dim(file){ return DIM[file] || 0.56; }

// ---------- table ----------
function TBL(headers, rows, fracs) {
  const total = 9360; const widths = fracs.map(f => Math.round(total * f));
  const diff = total - widths.reduce((a,b)=>a+b,0); widths[0]+=diff;
  const border = { style: BorderStyle.SINGLE, size: 1, color: RULE };
  const borders = { top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border };
  const headRow = new TableRow({ tableHeader:true, children: headers.map((htxt,i)=> new TableCell({
    width:{size:widths[i],type:WidthType.DXA}, shading:{type:ShadingType.CLEAR,fill:NAVY},
    margins:{top:60,bottom:60,left:90,right:90}, verticalAlign:VerticalAlign.CENTER,
    children:[ new Paragraph({ spacing:{after:0}, children:[ run(htxt,{b:true,c:"FFFFFF",s:18}) ] }) ] })) });
  const bodyRows = rows.map((r,ri)=> new TableRow({ children: r.map((cell,ci)=>{
    const runs = Array.isArray(cell)? cell : [ run(String(cell),{s:18}) ];
    return new TableCell({ width:{size:widths[ci],type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR, fill: ri%2? "F6F8FF":"FFFFFF"},
      margins:{top:50,bottom:50,left:90,right:90}, verticalAlign:VerticalAlign.CENTER,
      children:[ new Paragraph({ spacing:{after:0}, children: runs }) ] }); }) }));
  return new Table({ width:{size:total,type:WidthType.DXA}, columnWidths:widths, borders, rows:[headRow,...bodyRows] });
}
function sc(text){ // small status-colored cell text
  const c = STATUS_C[text]||INK; return [ new TextRun({ text, color:c, bold:true, size:17, font:FONT }) ];
}

// ===================================================================
// TITLE PAGE
// ===================================================================
add(
  new Paragraph({ spacing:{before:400,after:0}, alignment:AlignmentType.CENTER,
    children:[ new ImageRun({ type:"png", data: fs.readFileSync(IMG+"sutra-icon.png"),
      transformation:{width:140,height:140}, altText:{title:"Sutra",description:"Sutra logo",name:"logo"} }) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:200,after:40},
    children:[ new TextRun({ text:"Sutra", font:FONT, bold:true, size:72, color:NAVY }) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:30},
    children:[ new TextRun({ text:"Comprehensive Product Guide", font:FONT, bold:true, size:34, color:BLUE }) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:240},
    children:[ new TextRun({ text:"Your academic life, woven into one private workspace.", font:FONT, italics:true, size:24, color:MUT }) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:20},
    children:[ new TextRun({ text:"A local-first student workspace — what it is, how it works, what is built, and where it goes next.", font:FONT, size:22, color:INK }) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:0},
    children:[ new TextRun({ text:"PRIVATE  ·  LOCAL-FIRST  ·  STUDENT-BUILT", font:FONT, bold:true, size:18, color:BLUEL }) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:500,after:0},
    children:[ run("Repository: github.com/tanujranjith/Sutra   ·   Branch: main   ·   License: Apache-2.0", {s:18,c:MUT}) ] }),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:40,after:0},
    children:[ run("Author: Tanuj Ranjith   ·   Document date: 5 June 2026   ·   Status: product preview / pre-public-beta", {s:18,c:MUT}) ] }),
  new Paragraph({ children:[ new PageBreak() ] })
);

// ===================================================================
// TABLE OF CONTENTS
// ===================================================================
add(
  new Paragraph({ spacing:{after:120}, children:[ run("Contents", {b:true,s:36,c:NAVY}) ] }),
  new TableOfContents("Contents", { hyperlink:true, headingStyleRange:"1-2",
    stylesWithLevels:[] }),
  new Paragraph({ spacing:{before:80}, children:[ run("If the contents above appear empty, open in Word and choose “Update Field” (the PDF build updates it automatically).", {i:true,s:16,c:MUT}) ] }),
  new Paragraph({ children:[ new PageBreak() ] })
);

// ===================================================================
// 1. EXECUTIVE SUMMARY
// ===================================================================
add(H1("1","Executive Summary"));
add(P([ run("Sutra is a ", ), run("private, local-first workspace for students", {b:true}),
  run(". It brings structured notes, homework, AP exam preparation, college applications, spaced-repetition review, focus tools, a calendar, and life and work trackers behind one calm interface — with no backend, no required account, no telemetry, and no cloud sync. If you can open an HTML file, you can run Sutra.") ]));
add(P([ run("The product’s organizing idea is in its name. "), run("Sutra", {i:true}),
  run(" is Sanskrit for a thread — the line that holds separate beads together into one piece. A student’s academic life is normally scattered across a notes app, a school portal, a calendar, a task manager, an AI chatbot, study tools, documents, and a wall of browser tabs. Sutra runs a single thread through them so they read as one continuous workspace rather than a pile of fragments.") ]));
add(H2("Who it serves and what it addresses"));
add(P("The primary user is a high-school or college student juggling classes, AP exams, college applications, deadlines, extracurriculars, and a personal life. Secondary users include self-directed writers and planners who want a Notion-style notebook without an account, and solo operators who want a local CRM, invoice list, and deadline radar beside their notes. The core problem Sutra addresses is fragmentation: the loss of context, ownership, and continuity that happens when planning, writing, studying, and tracking each live in a different tool that never talks to the others."));
add(H2("Why local-first matters here"));
add(P("Sutra is a static web app. It loads from static hosting or directly from a local file, stores the entire workspace in the browser on the user’s device, and needs no network connection to read or edit that workspace once it has loaded. That architecture is not incidental; it is the product thesis. It gives the student ownership of their data, fast local interaction, resilience offline, privacy by default, and portability through a single backup file. Optional AI assistance exists, but it is bring-your-own-key and reaches the network only when the user sends a message."));
add(H2("What exists today, and what does not"));
add(P([ run("The verified, shipped surface is large and coherent. Notes with a rich editor, the Today command center, a full Timeline calendar, Homework, AP Study with an automated Battle Plan, a five-mode Review (spaced-repetition) system, College and Life and Projects-and-Work workspaces, local-first persistence with a save-failure safety net, the "),
  run(".sutra", {b:true}), run(" portable backup format, themes and CSS overrides, sandboxed plugins, and a hardened privacy and security posture are all present and exercised by a 14-check static release gate that passes cleanly. What is still in motion: mobile QA across every surface and physical-device testing, Testing Hub depth, onboarding polish, the plugin ecosystem, and header-level security on the host. What is genuinely future work: optional opt-in sync, a service worker for guaranteed offline reopen, cross-device workflow, and the broader “student operating system” ambition.") ]));
add(CALL("Bottom line",
  [ run("Sutra is strong enough today for private testing, portfolio and showcase use, hackathons, and a controlled student beta. It is not yet appropriate for production-critical use by people who will not keep their own backups, chiefly because there is no sync and no service worker — the user’s exported "),
    run(".sutra", {b:true}), run(" file is the safety net. Every claim in this guide is separated into what works today, what is being refined, what is experimental, and what is planned.") ]));

// ===================================================================
// 2. PRODUCT ORIGIN AND MOTIVATION
// ===================================================================
add(H1("2","Product Origin and Motivation"));
add(P("Sutra exists because the tools a student relies on are individually capable and collectively incoherent. Each app is excellent at one job and indifferent to the others. A notes app writes beautifully but knows nothing about Friday’s deadline. A task manager tracks to-dos but cannot hold the lecture notes or the exam that the to-do is about. An AI chatbot answers questions but has no memory of the workspace and pulls the student’s data out of their control. A school portal lists assignments but is read-only and lives behind a login that resets every term. A study app drills flashcards that are disconnected from the material and the calendar that should drive them."));
add(P("The result is a tax the student pays all day: context-switching to re-find where each thing lives, information lost in the gaps between apps, studying that floats free of the deadlines and notes it should be anchored to, and missed due dates. Underneath all of that sits a quieter problem — the student does not really own the system. Their academic life is spread across accounts on servers they do not control."));
add(P([ run("Sutra’s motivation is to collapse that fragmentation into one private surface the student owns. The repository documents the product as “one app for everything a student carries,” and is explicit that the rebrand from its earlier identity, "),
  run("NoteFlow Atelier", {i:true}), run(", was a name and surface change rather than a change of mission (see "),
  run("docs/REBRAND_AND_COMPATIBILITY.md", {i:true}), run("). This guide does not invent a personal founder narrative beyond what the repository states: Sutra is student-built, authored by Tanuj Ranjith, and licensed under Apache-2.0.") ]));

// ===================================================================
// 3. PRODUCT THESIS
// ===================================================================
add(H1("3","Product Thesis"));
add(CALL(null, [ run("Academic productivity is not a collection of isolated tasks. Notes, deadlines, classes, files, studying, planning, and assistance form one continuous workflow. Sutra makes that workflow coherent while preserving the student’s ownership of their data.", {b:true, c:NAVY, s:24}) ]));
add(P("Two commitments make the thesis real rather than rhetorical. The first is continuity: the surfaces in Sutra reference one another instead of standing alone. A task can link to a note; a homework row can open a class dashboard or drop a block on the Timeline; the Deadline Radar aggregates deadlines from tasks, homework, AP exams, college items, timeline blocks, and work; Review can take its source from a note, an AP class, or a homework class. The same single workspace object underlies all of them, so a change in one place is visible in the others."));
add(P([ run("The second commitment is ownership. Everything is stored locally and travels in a single portable file. There is no Sutra server in the loop and nothing is uploaded by the app itself. Even the optional AI assistant is constrained by this: the local signal layer that understands the student’s situation, "),
  run("Sutra Intelligence", {b:true}), run(", runs entirely on-device and calls no server, and any model request goes directly from the browser to a provider the user has chosen. The thesis, in one line, is the product’s own tagline: ") ,
  run("one workspace, every thread.", {i:true}) ]));

// ===================================================================
// 4. TARGET USERS
// ===================================================================
add(H1("4","Target Users"));
add(H2("Primary users"));
add(...BUL([
  [ run("High-school and college students", {b:true}), run(" managing classes, AP exams, college applications, deadlines, extracurriculars, and a personal life in one place.") ],
  [ run("AP-focused students", {b:true}), run(" in an exam crunch who need unit tracking, practice logging, weak-area awareness, and a concrete next study action.") ],
  [ run("College applicants", {b:true}), run(" tracking schools, essays, scholarships, scores, and decisions across a long, deadline-dense season.") ],
]));
add(H2("Secondary users"));
add(...BUL([
  [ run("Self-directed writers and planners", {b:true}), run(" who want a Notion-style notebook with a rich editor, but without an account or a cloud.") ],
  [ run("Solo operators and freelancers", {b:true}), run(" who want a local CRM, invoice list, and deadline radar in the same workspace as their notes (the Projects & Work module).") ],
  [ run("Privacy-conscious users", {b:true}), run(" who want a single offline workspace they can carry between devices via one portable backup file.") ],
]));
add(H2("Pain points and usage patterns"));
add(P("These users share a daily pattern: capture something quickly, decide what matters today, do focused work, study against upcoming exams, and keep the whole thing organized without babysitting a dozen apps. Sutra is built around that loop — Quick Capture for capture, Today for triage, the editor and Focus tools for work, Review and the Testing Hub for study, and local-first persistence so none of it is lost."));
add(H2("Who Sutra is not ready to serve yet"));
add(...BUL([
  [ run("Teams and collaborators", {b:true}), run(" — Sutra is single-user and local; there is no real-time collaboration or shared workspace.") ],
  [ run("Multi-device users who expect automatic sync", {b:true}), run(" — moving between devices today means copying a "), run(".sutra", {i:true}), run(" backup or an ICS export by hand.") ],
  [ run("Users who will not keep backups", {b:true}), run(" — because clearing browser storage without an export loses local data, Sutra is not yet a safe sole home for irreplaceable data.") ],
  [ run("Mobile-first users expecting a native app", {b:true}), run(" — Sutra is responsive on phones and tablets, but it is a web surface, and full cross-device mobile QA is still in progress.") ],
]));

// ===================================================================
// 5. PRODUCT PRINCIPLES
// ===================================================================
add(H1("5","Product Principles"));
add(P("The following principles are stated in the repository’s documentation; each is assessed here against the actual implementation."));
const PRIN = [
  ["Local-first by default","Shipped and functional","The workspace lives in IndexedDB and localStorage on the device; once loaded, all data operations are local. Verified across the persistence layer and the static persistence guard."],
  ["User ownership","Shipped and functional","The student holds the master copy; a single .sutra file is a complete backup, and there is no server copy to depend on."],
  ["Structured organization","Shipped and functional","Hierarchical notes, classes, assignments, AP units, decks, and trackers give the workspace explicit structure rather than a flat pile."],
  ["Recoverability","Shipped and functional","Autosave, a persistence-health pipeline, a non-dismissible save-failure banner, an emergency export, and a pre-import safety snapshot all exist and are tested."],
  ["Privacy-conscious design","Shipped and functional","No telemetry, no account; secrets live only in sessionStorage and are redacted from every export; a visible badge states the AI privacy boundary."],
  ["Continuity of context","Shipped and functional","Cross-feature links (task↔note, homework↔class, Schedule-this→Timeline, Review sources) keep one thread through the workspace."],
  ["Student-specific workflows","Shipped and functional","AP Battle Plan, Testing Hub, Homework portal import, and college trackers are designed for school work specifically, not generic productivity."],
  ["Low-friction capture","Shipped and functional","Quick Capture parses natural language into the right surface; the Command Palette reaches everything from the keyboard."],
  ["Useful AI rather than decorative AI","Functional but incomplete","The assistant proposes concrete, approvable changes grounded in local signals. Depth of retrieval and proactive assistance are still being developed."],
  ["Progressive disclosure","Shipped and functional","Sutra Modes promote the views you need now without deleting the rest; advanced power lives under Customization and Settings."],
  ["Customizability","Shipped and functional","Themes, per-page theming, CSS overrides, and sandboxed plugins are all present, traveling inside the workspace backup."],
];
add(TBL(["Principle","Status","How the implementation supports it"],
  PRIN.map(r=>[ [run(r[0],{b:true,s:18})], sc(r[1]), r[2] ]), [0.22,0.20,0.58]));

// ===================================================================
// 6. PRODUCT TERMINOLOGY
// ===================================================================
add(H1("6","Product Terminology"));
add(P("The following terms are used throughout Sutra and this guide. Inside the app, labels stay literal — Today, Notes, Homework, Timeline — and the thread metaphor is used sparingly."));
const TERMS = [
  ["Workspace","The single in-memory object (appData) that holds everything; persisted to IndexedDB and exported as a backup."],
  ["Note / Page","A document in the hierarchical page tree, edited in the rich editor; titles use :: to nest (e.g. Projects::Website::Launch)."],
  ["Collection / Space / Folder","Groupings of pages; pages carry a spaceId linking them to a space."],
  ["Class / Course","An academic subject in Homework (Subjects lane) or Course Hub, optionally linked to AP Study."],
  ["Assignment / Task","A unit of work with due date, priority, difficulty, and done state; tasks can link to notes."],
  ["Today view","The default landing surface: a daily command center with the Daily Thread and a single Next Step."],
  ["Testing Hub","A dashboard-first exam-prep hub for pinned exams, integrated with AP Study."],
  ["Sutra Assistant","The optional contextual chat panel (launcher bottom-right) that answers questions and proposes approvable changes."],
  ["Sutra Intelligence","The on-device signal layer (deriveStudentContext) that grounds the assistant; it calls no server."],
  ["Theme","An appearance preset applied to the current page, all pages, or a custom subset."],
  ["Plugin","A local, sandboxed extension bundle (.sutra-plugin), installed disabled and reviewed before it runs."],
  ["Import / Export","Reading or writing a backup from Settings ▸ Data."],
  [".sutra file","The default backup: a ZIP package of manifest, workspace, assets, and metadata with checksums."],
  ["Emergency export","A save-failure-triggered .sutra export that refuses to run if required attachment blobs are missing."],
  ["Persistence / Storage Health","The pipeline and readout that confirm saves and warn when a save cannot be confirmed."],
  ["Revision / Version history","Per-note snapshots that can be restored without altering lock or identity."],
  ["Sutra Mode","A preset (Student, AP Crunch, Writing, etc.) that decides which views are primary; hidden views are never deleted."],
];
add(TBL(["Term","Meaning in Sutra"], TERMS.map(r=>[ [run(r[0],{b:true,s:18})], r[1] ]), [0.27,0.73]));
add(P([ run("Obsolete terminology to retire: ", {b:true}), run("“NoteFlow Atelier,” “Atelier,” and “Flowy” (an old assistant name) are legacy and should not appear in user-facing copy. “NoteFlow Classic” refers to a separate legacy app that ships in the repository and is "),
  run("not", {i:true}), run(" Sutra. Section 36 audits the remaining legacy references in detail.") ]));

// ===================================================================
// 7. USER-EXPERIENCE OVERVIEW
// ===================================================================
add(H1("7","User-Experience Overview"));
add(P("A new user’s journey runs from first launch to daily use to recovery, and Sutra is designed so that each step is reachable without an account or a network. The figure below traces the full daily loop; the onboarding sequence is detailed in Section 9 and the application shell in Section 10."));
add(...IMG_("diagram-workflow.png", 6.4, "Figure 7.1 — A day in Sutra: one thread through capture, planning, studying, and recovery."));
add(H2("The journey, end to end"));
add(...NUM([
  [ run("First launch.", {b:true}), run(" Open Sutra.html (or the landing page and click Start your session). The Sutra Setup wizard offers to add classes, AP subjects, and a college focus, and to pick a Sutra Mode — or you can skip to a blank workspace.") ],
  [ run("Daily use.", {b:true}), run(" Land on Today to see the Daily Thread (overdue / today / tomorrow / this-week counts) and one deterministic Next Step you can run immediately.") ],
  [ run("Capture and create.", {b:true}), run(" Use Quick Capture or the Command Palette (Ctrl/⌘+K) to add tasks, homework, notes, or blocks; write in the rich editor.") ],
  [ run("Organize.", {b:true}), run(" Nest notes in the page tree, file homework under classes, and link tasks to notes; the workspace cross-references itself.") ],
  [ run("Plan and study.", {b:true}), run(" Schedule blocks on the Timeline, work through Review and the Testing Hub, and let the AP Battle Plan suggest a next session.") ],
  [ run("Save, export, recover.", {b:true}), run(" Autosave keeps the workspace current; export a .sutra backup from Settings ▸ Data; recover via import or the pre-import safety snapshot if needed.") ],
  [ run("Customize.", {b:true}), run(" Apply themes, write CSS overrides, or install a sandboxed plugin — all local, all traveling in the backup.") ],
]));

// ===================================================================
// 8. LANDING PAGE AND PRODUCT POSITIONING
// ===================================================================
add(H1("8","Landing Page and Product Positioning"));
add(P([ run("The landing page ("), run("HomePage.html", {i:true}),
  run(") tells the Sutra story: scattered schoolwork is gradually threaded together into one calm workspace. Its centerpiece is a single scroll-linked “thread story” layered onto the problem section — a continuous SVG thread draws through scattered workflow fragments (notes, assignments, timeline, tasks, AP study, review, focus, radar) as they settle into place, then the page reveals a dashboard with annotation chips.") ]));
add(H2("Structure and value proposition"));
add(P([ run("The narrative runs: hero → thread story (fragments → continuous thread → settle) → solution reveal → guided workspace tour → bento grid → privacy → founder → call to action. The hero headline is “The workspace for…” and the primary call to action is "),
  run("Start your session", {b:true}), run(". The promise is explicit and on-brand: a private, local-first, student-built workspace, with “no account required” and “export complete .sutra backups.”") ]));
add(H2("Scrollytelling, accessibility, and mobile"));
add(P([ run("The animation is driven by a single CSS custom property "), run("--p", {i:true}),
  run(" (0→1) computed from the section’s position in the viewport, throttled with requestAnimationFrame, with no external animation library. It degrades responsibly: on screens ≤760px the SVG weave is hidden and a simple vertical thread connects the stacked fragments; under prefers-reduced-motion the pinned sections collapse and the final connected state is shown; with JavaScript disabled, the cluster defaults to the converged state and the thread renders fully drawn. The smoke check asserts the thread hooks, nodes, gradient, draw logic, and mobile fallback all exist.") ]));
add(H2("Gaps between promise and product"));
add(P("The landing page promises a calm, unified, private workspace, and the product delivers that surface. The honest gaps a careful reader should note are the same ones this guide flags elsewhere: the bundled marketing screenshots in the repository predate the rebrand and still show the old name; multi-device portability is manual rather than synced; and dependable offline reopen of the hosted app is not yet guaranteed without a local copy. None of these contradict the page’s core claims, but the screenshots in particular should be recaptured before the page is used publicly."));

// ===================================================================
// 9. ONBOARDING AND SETUP
// ===================================================================
add(H1("9","Onboarding and Setup"));
add(...IMG_("diagram-onboarding.png", 6.4, "Figure 9.1 — First-time onboarding: Sutra Setup is skippable, local, and account-free."));
add(P([ run("Sutra ships layered help. The first-launch experience is the "),
  run("Sutra Setup", {b:true}), run(" wizard, which offers to add classes, AP subjects, and a college focus, lets the user pick a Sutra Mode, and offers an immediate "),
  run(".sutra", {i:true}), run(" backup. It can be skipped entirely for a blank slate, and restarted at any time from Settings ▸ Advanced ▸ Restart Sutra Setup. Beyond the wizard, an auto-generated, non-removable "),
  run("Help & Docs", {b:true}), run(" page always sits at the top of the page tree, and an interactive guided tour is available from Settings ▸ Advanced.") ]));
add(H2("Decisions, defaults, and storage setup"));
add(P("Onboarding asks for nothing that blocks use: there is no account creation, no email, and no permission wall. Storage is automatic — the workspace begins persisting to IndexedDB immediately, with no setup step. The one decision that materially shapes the interface is the Sutra Mode, which determines which views are primary; because hidden-by-mode views are never deleted, this choice is low-stakes and reversible."));
add(H2("Friction points and simplification opportunities"));
add(...BUL([
  "The breadth of the wizard (classes, AP subjects, college focus, mode) is powerful but can feel heavy for a user who just wants to start writing; a clearer “skip for now” path and a lighter default would reduce first-run friction.",
  "Because there is no cloud, the single most important habit — taking a .sutra backup — depends entirely on the user; the wizard’s offer to export early is the right instinct and could be reinforced later with a gentle recurring reminder.",
  "The optional default backup folder (File System Access) is a strong recent addition; surfacing it during onboarding would make the backup habit easier to keep.",
]));

// ===================================================================
// 10. APPLICATION SHELL AND NAVIGATION
// ===================================================================
add(H1("10","Application Shell and Navigation"));
add(P([ run("The app shell is "), run("Sutra.html", {i:true}),
  run(", a single HTML file (~605 KB) that hosts the views, modals, and structural markup, and pulls in the styles and scripts. The layout is a conventional three-region workspace: a left sidebar (page tree, Focus Timer, navigation), a top tab strip that switches between the major views, and a main content panel that renders the active surface. Modals are layered on top via a reusable accessibility primitive (Section 21).") ]));
add(H2("Navigation and keyboard control"));
add(P([ run("Sutra is keyboard-first. The most important shortcut is the Command Palette ("),
  run("Ctrl/⌘+K", {b:true}), run("): type to filter, arrow to navigate, Enter to run, Esc to close. From it you can jump to any view, run Quick Capture, export a backup, create a Weekly Review note, restart onboarding, or open a class dashboard. Other bindings include Shift+Ctrl/⌘+F for global search, Alt+Shift+F to toggle Focus Mode, Tab / Shift+Tab to indent or outdent list items in the editor, and / to open the slash menu. On the AP Study view, Ctrl/⌘+K is intentionally remapped to Add subject.") ]));
add(H2("Mobile adaptation and accessibility"));
add(P([ run("Responsive behavior is defined in "), run("styles/mobile.css", {i:true}),
  run(" from 1440px down to 320px, with breakpoints for large tablet (1024px), small tablet (768px), and phone (640px). The sidebar collapses behind a toggle and a tap-overlay; the top tab strip becomes a single current-view dropdown with overflowing tabs in a More menu; and modals scroll internally while keeping primary actions visible above mobile browser chrome. A Larger touch targets accessibility setting enlarges interactive elements for thumb use. The responsive guard ("),
  run("sutra-responsive-check.mjs", {i:true}), run(") statically verifies these hooks; full cross-viewport behavior on physical devices remains a manual-QA item.") ]));

// ===================================================================
// 11. NOTES SYSTEM
// ===================================================================
add(H1("11","Notes System"));
add(STAT("Shipped and functional","The notes system is the most mature surface in Sutra and the original heart of the product."));
add(...IMG_("notes-editor-desktop.png", 6.2, "Figure 11.1 — The notes editor (real screenshot from a pre-rebrand build; the header wordmark predates the Sutra rename, the layout is current)."));
add(H2("Creating, editing, and formatting"));
add(P([ run("Notes are pages in a hierarchical tree, with titles that nest using "),
  run("::", {i:true}), run(" (for example Projects::Website::Launch). The tree supports search, tag filtering, drag-and-drop reordering, favorites, duplicate, rename, delete, emoji icons, and breadcrumbs; temporary pages can self-expire. The rich editor offers toolbar formatting (bold, italic, underline, strikethrough, H1–H3, lists, quote, code), an insert menu (link, table, image, video, audio, embed, checklist, collapsible section, page link), a slash menu, list indentation with Tab / Shift+Tab, a live word count, and configurable autosave.") ]));
add(H2("Page Mode, document backgrounds, handwriting, and split view"));
add(...BUL([
  [ run("Page Mode", {b:true}), run(" presents the note as a document with configurable size and margins and a document layout (header, footer, page number).") ],
  [ run("Document Backgrounds", {b:true}), run(" set a per-page background image from the editor toolbar (PNG/JPG/JPEG/WebP, max 6 MB; large images auto-downscale), with a Background Blur slider (0–32px) and a Dim slider (0–80%, default 25%). Blur applies only to the image; the dim overlay tints toward the editor surface so text stays readable. Backgrounds work in the standard editor, Page Mode, and split view, on mobile and tablet, and under custom CSS; they survive refresh, duplication, and .sutra export/restore. A locked page never shows its background behind the PIN screen.") ],
  [ run("Handwriting blocks", {b:true}), run(" let the user write, sketch, or annotate with mouse, trackpad, touch, or stylus (pen, highlighter, eraser; blank/lined/grid/dotted paper). Strokes are stored as vectors and round-trip through backups (src/features/handwriting.js).") ],
  [ run("Split view", {b:true}), run(" opens a second pane beside the current note, with presets (Note + Assignment, Note + AP Unit, Essay + Research, Today Plan + Notes, Calendar + Note) and swap/close controls.") ],
]));
add(H2("Locked pages, version history, search, and export"));
add(P([ run("Any page can be PIN-locked (4–8 digits) with the PIN stored as a salted SHA-256 hash, never as the raw value; the in-session unlocked state is intentionally not persisted, so a locked page requires the PIN again after a reload and travels locked in backups. Notes carry a bounded "),
  run("version history", {b:true}), run(" — verified by a dedicated guard ("), run("version-history-check.mjs", {i:true}),
  run(", 55 assertions) that confirms legacy snapshots normalize, only selected editable fields are captured (never secrets), values are deep-cloned, duplicates are suppressed, history is capped, and restore recovers state while leaving lock and identity untouched. Pages are indexed in global search, and inline images and document backgrounds are extracted into the "),
  run(".sutra", {i:true}), run(" package on export and rehydrated on import.") ]));
add(H2("Limitations"));
add(...BUL([
  "Document backgrounds are preserved in HTML and PDF note exports where the browser allows, omitted cleanly from Markdown and plain text, and treated as a known limitation for DOCX/RTF.",
  "Some image-upload paths require an http(s):// origin rather than file:// sandboxing; serving the folder over HTTP resolves this.",
]));

// ===================================================================
// 12. CLASSES, COURSES, ASSIGNMENTS, AND DEADLINES
// ===================================================================
add(H1("12","Classes, Courses, Assignments, and Deadlines"));
add(STAT("Shipped and functional","Homework and academic planning are shipped; the Course Hub file binaries are covered by a fixed-and-guarded export path."));
add(...IMG_("homework-desktop.png", 6.0, "Figure 12.1 — Homework: Subjects and Activities lanes with due-state chips (pre-rebrand build)."));
add(P([ run("The Homework module ("), run("src/features/homework.js", {i:true}),
  run(", ~1,541 lines) has two lanes: "), run("Subjects", {b:true}), run(" (your classes) and "),
  run("Activities", {b:true}), run(" (extracurriculars). Each assignment carries a title, due date and time, priority, difficulty, notes, and a done state, with due-state chips (no date / upcoming / due soon ≤48h / overdue). "),
  run("Import from School Portal", {b:true}), run(" parses lines pasted from a school portal (pipe-, tab-, or dash-separated), previews each parsed row, and lets the user correct the title, class, date, time, difficulty, and priority before saving. JSON import/export is available, and each row’s menu offers Schedule this and Open class dashboard.") ]));
add(H2("Storage model and resilience"));
add(P([ run("Homework is its own source of truth in localStorage ("),
  run("hwCourses:v2", {i:true}), run(" / "), run("hwTasks:v2", {i:true}),
  run("), mirrored into the workspace at save time and restored on import so it travels in backups while remaining the live runtime source. Crucially, homework writes go through a shared safe-storage wrapper: if a write fails (quota exhausted, private-mode error), the new or edited item stays on screen and a clear, durable warning banner appears offering an emergency backup — a behavior kept deliberately separate from the catastrophic core save-failure banner so a localStorage hiccup never falsely claims total workspace loss.") ]));
add(H2("Aggregate deadline views and current maturity"));
add(P("Course Hub stores course metadata, links, resources, file metadata, and (separately) file binaries. Rows with dates expose Schedule this, which drops a block on the Timeline. Every deadline across the workspace — tasks, homework, AP exams, college items, timeline blocks, and work — is aggregated into the global Deadline Radar (Section 13). The module is mature and tested for round-trip fidelity; the known historical risk, course-file binaries being dropped from an export on a cold cache, was found, fixed, and locked behind a regression guard (Section 17 and Section 18)."));
add(H2("Known gaps"));
add(...BUL([
  "There is no notification system tied to a server, so deadline reminders are surfaced in-app rather than pushed to the OS unless browser notification permission is granted.",
  "Calendar relationships are one-directional in the sense that Schedule this creates Timeline blocks; there is no two-way external calendar sync (the old Google integrations were intentionally removed).",
]));

// ===================================================================
// 13. TODAY VIEW
// ===================================================================
add(H1("13","Today View"));
add(STAT("Shipped and functional","Today is the default landing experience and the product’s command center."));
add(...IMG_("today-view-desktop.png", 6.2, "Figure 13.1 — The Today command center (pre-rebrand build)."));
add(P("Today is built to answer one question on open: what should I do now? It does so with a small set of focused surfaces."));
add(...BUL([
  [ run("Daily Thread", {b:true}), run(" — overdue / today / tomorrow / this-week counts, plus a deterministic Next Step you can run directly.") ],
  [ run("Shape My Day", {b:true}), run(" — sequences committed priorities against the calendar; the result appears under a Recommended sequence disclosure and can be applied back to the Timeline.") ],
  [ run("Deadline Radar", {b:true}), run(" — a modal grouping every deadline by overdue / today / tomorrow / this week / later, with Open and Schedule this on each row.") ],
  [ run("Quick Capture", {b:true}), run(" — a natural-language modal that parses phrases like “Chem essay due Friday hard” into the right surface (task, homework, note, block, AP session, or college item).") ],
  [ run("Supporting surfaces", {b:true}), run(" — habits, a schedule snapshot, a completed-today strip, life signals, an academic planner, daily quotes, and Momentum (progress and analytics).") ],
]));
add(H2("Information hierarchy and known concerns"));
add(P("Today’s strength — breadth — is also its main usability risk. The number of cards (Daily Thread, Next Step, Shape My Day, habits, schedule, completed strip, life signals, planner, Momentum, quotes) can feel dense, and the hierarchy between “the one thing to do now” and the supporting context is something the roadmap (Section 32, Phase 2) explicitly targets for refinement. The deterministic Next Step is the right anchor; sharpening the visual priority around it would reduce clutter."));

// ===================================================================
// 14. TESTING HUB AND STUDY WORKFLOWS
// ===================================================================
add(H1("14","Testing Hub and Study Workflows"));
add(STAT("Functional but incomplete","The Testing Hub is shipped and was recently redesigned; it is the study surface most actively being deepened."));
add(...IMG_("testing-hub-desktop.png", 6.2, "Figure 14.1 — The Testing Hub (pre-rebrand build)."));
add(P("Study in Sutra spans three connected surfaces: Review (spaced repetition), AP Study (units, sessions, practice, and the Battle Plan), and the Testing Hub (a dashboard-first home for pinned exams). The Testing Hub presents a per-exam calm overview built from test profiles and integrates with AP Study; it stores exams, pinned items, mistakes, practice, tasks, custom entries, scores, countdowns, and the active exam, all normalized through a dedicated path and round-tripped in backups."));
add(H2("Review and active recall"));
add(P([ run("Review ("), run("src/features/review.js", {i:true}),
  run(", ~3,099 lines) is the spaced-repetition and active-recall center. It stores decks, review items (prompt + answer + tags), and review sessions, each card carrying scheduling state and graded Again / Hard / Good / Easy with a local SM-2-lite algorithm — no backend and no AI. Five study modes are available:") ]));
add(TBL(["Mode","What it does"], [
  ["Flashcards","Reveal the answer, then grade Again / Hard / Good / Easy."],
  ["Learn","Adaptive multiple-choice with mastery levels (new → learning → familiar → mastered)."],
  ["Write","Type the answer; a fuzzy compare grades the attempt."],
  ["Test","Fixed-length mixed-format quiz with a final score and card-by-card review."],
  ["Match","Timed pair-up grid; best time is stored per deck."],
].map(r=>[ [run(r[0],{b:true,s:18})], r[1] ]), [0.2,0.8]));
add(P("Review surfaces a Review due card on Today, indexes deck names and card text in global search, links to a Focus template, and can take its source from a note, an AP class, or a homework class. The Cram surface is a lighter, last-minute companion; the assistant can create Cram sessions on the user’s approval. Cram is the least-developed of the study surfaces and is a candidate either to deepen or to fold into the Testing Hub."));
add(H2("Limitations and opportunities"));
add(...BUL([
  "The Testing Hub’s depth (rich per-exam analytics, deeper question handling) is still growing relative to Review and AP Study.",
  "Question authoring in Review is manual; importing or generating cards from notes (with assistant help) is an obvious enhancement.",
]));

// ===================================================================
// 15. SUTRA ASSISTANT
// ===================================================================
add(H1("15","Sutra Assistant"));
add(STAT("Shipped and functional","The assistant and its local signal layer ship; retrieval depth and proactive assistance are still maturing."));
add(...IMG_("diagram-assistant.png", 6.6, "Figure 15.1 — Sutra Assistant data flow: local signals ground every reply; the network is reached only on send."));
add(P([ run("It helps to separate two pieces. "), run("Sutra Assistant", {b:true}),
  run(" is the contextual chat panel, opened from the launcher at the bottom-right; it is where the user types a question, reads a reply, and accepts or declines proposed edits. "),
  run("Sutra Intelligence", {b:true}), run(" is the local signal layer beneath it — a single derivation pass ("),
  run("deriveStudentContext", {i:true}), run(") over the local workspace that produces plain signals (overdue work, workload, schedule conflicts, weak areas, review backlog, next steps). Sutra Intelligence calls no server; it computes on-device and hands context to the assistant. The mental model: Intelligence understands the situation locally; the assistant is the conversation, and it reaches the network only when the user sends a message.") ]));
add(H2("Context control, memory, and approval"));
add(...BUL([
  [ run("Workspace Access", {b:true}), run(" — Current Screen Only, Current Area, or Full Workspace Context, plus selected-text awareness. The context is assembled locally first; only the portion needed for the message is sent.") ],
  [ run("Single Request vs Conversation Memory", {b:true}), run(" — whether the assistant carries earlier turns forward. Single Request sends the least context per message; Conversation Memory enables natural follow-ups.") ],
  [ run("Suggested Actions and Apply/Decline cards", {b:true}), run(" — the assistant proposes concrete changes (a note, a task, a block, a review deck) as cards; nothing changes until the user clicks Apply, and a Confirm-Before-Applying setting adds a second guardrail.") ],
  [ run("Assistant Activity + undo", {b:true}), run(" — every applied change is logged locally and can be undone; the log is not a secret and travels in backups (key sutra:activityLog:v1).") ],
]));
add(H2("Providers, keys, and network behavior"));
add(P([ run("The user brings their own provider — OpenAI, Anthropic Claude, Google Gemini, Groq, OpenRouter, or a Custom OpenAI-Compatible (local) endpoint — and the exact Model ID. Requests go directly from the browser to the chosen provider; Sutra runs no model servers and no relay (the connect-src CSP lists exactly these provider origins plus localhost). Provider and model "),
  run("choices", {i:true}), run(" travel in backups; the API "), run("key", {i:true}),
  run(" lives in sessionStorage only and is never written to long-term storage or any export.") ]));
add(H2("Privacy implications, limitations, and roadmap"));
add(...BUL([
  "What reaches the provider is the user’s message plus the context permitted by Workspace Access (and the current selection), not the whole workspace by default; the always-visible “Powered by Sutra Intelligence” badge states this boundary.",
  "The assistant cannot answer with a model while offline unless a reachable local endpoint is configured; reply quality depends on the chosen provider and Model ID; image understanding requires a vision-capable model.",
  "Roadmap opportunities (Section 32, Phase 3): higher-quality retrieval, clearer context controls, and proactive assistance that surfaces help without being asked.",
]));

// ===================================================================
// 16. LOCAL-FIRST ARCHITECTURE
// ===================================================================
add(H1("16","Local-First Architecture"));
add(...IMG_("diagram-architecture.png", 6.6, "Figure 16.1 — High-level architecture: a static, no-build web app that runs entirely in the browser."));
add(P([ run("Sutra is a "), run("plain static site", {b:true}),
  run(": no backend, no build step, no bundler, and no required server. The page you open is the app. Three HTML entry points front it — "),
  run("index.html", {i:true}), run(" (a thin redirect to the landing page), "),
  run("HomePage.html", {i:true}), run(" (the landing page), and "),
  run("Sutra.html", {i:true}), run(" (the app shell). The core runtime, "),
  run("src/core/app.js", {i:true}), run(", is a single large script (~52,000 lines) that runs in global scope; feature modules under "),
  run("src/features/", {i:true}), run(" and UI enhancers under "), run("src/ui/", {i:true}),
  run(" attach to it rather than importing it, which is why the app opens straight from a file with no module resolver.") ]));
add(H2("Why local-first, concretely"));
add(P("Because the workspace is a single object held in the browser and written to IndexedDB, every read and edit is a local operation. There is no login, no telemetry, and no cloud sync; once the app has loaded, it needs no network to read or edit the workspace. This yields ownership (the data is on the device), speed (no server round-trips), privacy (nothing is uploaded by the app), resilience (offline editing always works), and portability (one file moves everything)."));
add(H2("Storage mechanisms and the data lifecycle"));
add(...BUL([
  [ run("IndexedDB", {b:true}), run(" holds the bulk of the workspace (database noteflow_atelier_db, store workspace, key root) and, separately, course-file binaries (noteflow_attachments_db, store blobs).") ],
  [ run("localStorage", {b:true}), run(" holds the homework source of truth (hwCourses:v2 / hwTasks:v2), a curated allow-list of preferences, and the Storage-Health / save-failure banner state.") ],
  [ run("sessionStorage", {b:true}), run(" holds only session-scoped items — principally API keys and chat history — which are never persisted and never exported.") ],
]));
add(CALL("On the “legacy-named” storage identifiers",
  [ run("Several store names — notably "), run("noteflow_atelier_db", {i:true}),
    run(" and "), run("noteflow_attachments_db", {i:true}),
    run(" — are retained unchanged across the rename to Sutra. They are legacy-named compatibility identifiers, not a sign that anything still calls itself “Atelier.” Renaming them would orphan every existing user’s data, so they were deliberately left as-is. The name is only an identifier; the data is always local on the device.") ]));
add(H2("Browser and cross-device limitations"));
add(...BUL([
  "Browser storage quotas vary; very large, media-rich workspaces can hit limits, which is one reason regular .sutra export is encouraged.",
  "There is no multi-device sync; “the cloud is whatever you copy” — a .sutra backup or an ICS export.",
  "Sutra ships no service worker, so reopening the hosted app offline after a full browser restart relies on the browser’s ordinary HTTP cache and is not guaranteed; a locally-saved copy always opens offline.",
]));

// ===================================================================
// 17. PERSISTENCE, AUTOSAVE, AND RECOVERY
// ===================================================================
add(H1("17","Persistence, Autosave, and Recovery"));
add(STAT("Shipped and functional","Persistence is a deliberately engineered, tested layer with a real save-failure safety net."));
add(...IMG_("diagram-persistence.png", 6.3, "Figure 17.1 — The persistence flow: one in-memory object, one hydrate path, one debounced save path."));
add(H2("The save pipeline and autosave timing"));
add(P([ run("Local state is a single "), run("appData", {i:true}),
  run(" object. On save, "), run("persistAppData()", {i:true}),
  run(" (app.js ~5388) copies every runtime collection into "), run("appData", {i:true}),
  run(", then "), run("scheduleAppSave()", {i:true}),
  run(" (app.js ~4978) debounces a "), run("writeAppData()", {i:true}),
  run(" by 250 ms, and "), run("flushAppSaveOnLifecycle()", {i:true}),
  run(" forces a synchronous flush on page-hide / beforeunload so in-progress edits are not lost. On load, "),
  run("initAppData()", {i:true}), run(" reads the store and "),
  run("mergeAppDataDefaults()", {i:true}), run(" deep-merges stored data over fresh defaults and runs every per-feature normalizer; if no stored data exists, a one-time legacy migration runs. The schema version is "),
  run("APP_SCHEMA_VERSION = 2", {i:true}), run(", written on every save.") ]));
add(H2("Persistence health, save-failure detection, and recovery"));
add(...IMG_("diagram-recovery.png", 6.2, "Figure 17.2 — Autosave and recovery: when a save cannot be confirmed, the in-memory workspace is preserved and the user is warned."));
add(P([ run("A centralized persistence-health pipeline wraps core saves, localStorage mirrors, IndexedDB transactions, attachment cache warming, imports, backups, and emergency exports. It records the last confirmed save and classifies failures as quota, serialization, IndexedDB-transaction, attachment, cache-warming, or partial-write/readback. When a save cannot be confirmed it preserves the in-memory state and shows a "),
  run("non-dismissible save-failure banner", {b:true}), run(" (element "),
  run("#sutraSaveFailureBanner", {i:true}), run(", Sutra.html line 5878) offering Retry, Emergency .sutra Export, Technical Details, the last-confirmed-save time, and attachment warnings. The emergency export refuses to run if required attachment blobs are missing, rather than producing a misleading partial backup. This behavior is exercised by Playwright tests (storage-hardening, public-beta-hardening) and a static persistence guard.") ]));
add(H2("Failure modes, data-loss risks, and remaining risk"));
add(...BUL([
  "The catastrophic core save-failure banner is reserved for the canonical workspace pipeline; a homework/localStorage hiccup shows a separate warning banner so it never falsely claims total data loss.",
  "The dominant residual data-loss risk is user-side: clearing browser storage without a backup, since there is no server copy. The product mitigates this with the save-failure safety net, the pre-import safety snapshot, and the persistent encouragement to export .sutra.",
  "One historical bug — course-file binaries dropped from an export on a cold attachment cache — was real, was fixed by awaiting the cache warm on all three export entry points, and is now locked behind a static regression guard so it cannot silently return.",
]));

// ===================================================================
// 18. .SUTRA IMPORT AND EXPORT
// ===================================================================
add(H1("18",".sutra Import and Export"));
add(STAT("Shipped and functional","The portable backup format is the backbone of Sutra’s ownership promise."));
add(...IMG_("diagram-sutra-lifecycle.png", 6.2, "Figure 18.1 — The .sutra export and import lifecycle."));
add(H2("Export format and what travels"));
add(P([ run("The default backup is a "), run(".sutra", {b:true}),
  run(" file named "), run("sutra_workspace_<YYYY-MM-DD>_<HH-mm-ss>.sutra", {i:true}),
  run(" (app.js lines 37846–37847). It is a ZIP package containing "),
  run("manifest.json", {i:true}), run(" (product: Sutra, format: sutra-workspace, formatVersion 1, legacyCompatible true, appName: Sutra — app.js lines 37705–37710), "),
  run("workspace.json", {i:true}), run(" (the full serialized payload), an "),
  run("assets/", {i:true}), run(" folder (inline note images and document backgrounds extracted and deduplicated, each with a checksum), and a "),
  run("metadata/", {i:true}), run(" folder (export-summary and checksums). A plain JSON export is available as a no-ZIP alternative with assets inlined. JSZip is vendored locally under "),
  run("assets/vendor/jszip/", {i:true}), run(", so core backups make no CDN request.") ]));
add(P([ run("Travels in a backup: ", {b:true}), run("all notes (content, structure, inline images, document backgrounds, locked-page lock data), spaces and pinned pages, tasks and time blocks, homework (courses and assignments) and Course Hub metadata and file binaries, Testing Hub, AP Study, Review, College, Academic, Life, and Projects & Work data, streaks and habits, cram sessions, focus templates, split-view contexts, settings and themes and custom themes, onboarding state, assistant preferences and provider/model choices, and the Assistant Activity log.") ]));
add(P([ run("Excluded by design: ", {b:true}), run("AI provider API keys and secrets (sessionStorage only, actively redacted from every export), conversation history (session-local), regenerable caches, and ephemeral UI state such as scroll position and the in-session unlocked-page set — so locked pages correctly require the PIN again after a reload.") ]));
add(H2("Import, validation, versioning, and legacy compatibility"));
add(P([ run("Import rebuilds every runtime collection, restores course-file binaries into the attachments database, restores the homework localStorage snapshot, re-applies the theme and preferences, re-renders every view, and writes the result straight back to IndexedDB so the import is durable across the next reload. Before applying an import, Sutra writes a "),
  run("pre-import safety snapshot", {b:true}), run(" of the existing workspace, restorable from Settings ▸ Data ▸ Storage Health. The validator accepts "),
  run("both", {i:true}), run(" the new sutra-workspace manifest and the legacy noteflow_atelier_project manifest, and the dispatcher routes both "),
  run(".sutra", {i:true}), run(" and legacy "), run(".atelier", {i:true}),
  run(" files to the same package importer. Files newer than the supported format are rejected with a clear message rather than partially applied.") ]));
add(H2("Does a .sutra export preserve every meaningful user-visible change?"));
add(P([ run("For the documented inventory, ", ), run("yes", {b:true}),
  run(". The repository’s save-systems audit inventoried every user-changeable data category and verified it across browser refresh, IndexedDB reload, and a full destructive export → wipe → import → reload cycle, reporting the workspace round-trips with cross-feature relationships (IDs and links) preserved; a static parity check guards against silent field drift. The honest, precise gaps are the "),
  run("by-design exclusions", {b:true}), run(" listed above (API keys, conversation history, regenerable caches, and ephemeral UI state) plus two documented limitations: note "),
  run("document exports", {i:true}), run(" to DOCX/RTF do not reliably carry document backgrounds, and the cold-cache attachment risk — now fixed and guarded — should be re-confirmed on the live build with the in-browser QA harness after any change to the export path.") ]));

// ===================================================================
// 19. THEMES, PERSONALIZATION, AND EXTENSIBILITY
// ===================================================================
add(H1("19","Themes, Personalization, and Extensibility"));
add(P([ run("Sutra’s customization layer is local-first with no marketplace; everything travels inside the workspace backup. Built-in theme presets include Default, Dark, the Sutra signature theme, Botanical, Editorial, Luxury, Sepia, Ocean, Sunrise, Graphite, Aurora, Rosewater, macOS 26, Windows 11, ChromeOS, Ubuntu, GitHub, Spotify, Netflix, Slack, and Dune, plus a Retro theme. A theme can be applied to the current page, all pages, or a custom subset (per-page theming), and the user can create, edit, delete, import, and export custom themes and set motion intensity to full / reduced / off (also tied to the OS prefers-reduced-motion).") ]));
add(STAT("Shipped and functional","Themes and CSS Overrides are mature."));
add(P([ run("CSS Overrides", {b:true}), run(" (Settings ▸ Customization) are the power-user layer: multiple named snippets with enable/disable, live preview, brace-balance validation, duplicate, reorder, .css and JSON import/export, and a non-destructive reset. Custom CSS applies after themes and survives theme changes and refresh.") ]));
add(STAT("Functional but incomplete","The plugin system ships and is sandboxed, but the ecosystem is nascent."));
add(P([ run("Plugins", {b:true}), run(" (src/features/plugin-system.js) are local bundles only — there is no marketplace. They run sandboxed in an iframe behind an explicit permission allowlist, install disabled, and are reviewed before they run (review is forced on import). The export extension is "),
  run(".sutra-plugin", {i:true}), run("; legacy "), run(".atelier-plugin", {i:true}),
  run(" bundles still import. On import to a new device, runtime plugins return disabled and require re-review. "),
  run("Safe Mode", {b:true}), run(" (add ?sutraSafeMode=1, hold Shift on load, or use the in-app Recovery controls) loads with no custom CSS and no plugins and never deletes anything — the safe way back from a bad customization.") ]));
add(H2("Security implications and roadmap"));
add(P("The iframe sandbox plus permission allowlist plus forced re-review is a sound posture for user-authored extensions, and Safe Mode provides a guaranteed escape hatch. The roadmap opportunity (Section 32, Phase 5) is to grow the extensibility surface — a documented plugin SDK already exists (docs/PLUGIN_SDK.md) — while keeping the security boundary strict, and to consider sharing mechanisms that do not compromise the no-server, no-marketplace stance."));

// ===================================================================
// 20. NOTIFICATIONS AND PROACTIVE ASSISTANCE
// ===================================================================
add(H1("20","Notifications and Proactive Assistance"));
add(STAT("Shipped and functional","In-app notifications, banners, and proactive signals are present (src/features/notifications.js, ~943 lines)."));
add(P("Sutra’s proactive surfaces are deliberately in-app and local rather than server-pushed. They include:"));
add(...BUL([
  [ run("Deadline awareness", {b:true}), run(" — due-state chips on assignments and the Deadline Radar’s grouped urgency view, with a Review-due card on Today.") ],
  [ run("Save and persistence alerts", {b:true}), run(" — the non-dismissible save-failure banner and the separate homework storage-warning banner, each with an emergency-backup path.") ],
  [ run("Upcoming work and next actions", {b:true}), run(" — the Daily Thread counts, the deterministic Next Step, and Shape My Day sequencing.") ],
  [ run("Ambient touches", {b:true}), run(" — daily lock-in quotes (source-audited in docs/DAILY_QUOTES_SOURCE_AUDIT.md) and microinteractions that confirm actions.") ],
]));
add(P("Because there is no backend, OS-level push notifications depend on the browser’s notification permission and the tab being available; the design leans on in-context banners and cards so the workspace remains useful and honest even without notification permission. Proactive assistance via the Sutra Assistant (surfacing help before being asked) is identified as roadmap depth rather than a fully realized capability today."));

// ===================================================================
// 21. ACCESSIBILITY
// ===================================================================
add(H1("21","Accessibility"));
add(STAT("Functional but incomplete","Solid primitives are in place and guarded; full physical-device and screen-reader QA remains."));
add(P([ run("Sutra ships a reusable modal accessibility primitive that layers dialog semantics, initial focus, Tab / Shift+Tab focus trapping, Escape behavior, focus restoration, scroll locking, background blocking, and mobile bottom-sheet behavior across the app’s modal surfaces. A dedicated guard ("),
  run("sutra-modal-a11y-check.mjs", {i:true}), run(") and a Playwright modal-keyboard test exercise this, including the Review and Homework surfaces.") ]));
add(H2("What is covered"));
add(...BUL([
  "Keyboard navigation throughout, with visible focus rings and ARIA labels on icon-only controls (the Sutra Intelligence badge exposes its explanatory text as both a tooltip and an aria-label).",
  "Reduced-motion support tied to the OS setting, with the landing scrollytelling collapsing to its final connected state and no pinned dead zones.",
  "A JavaScript-disabled fallback on the landing page that shows the final connected thread state.",
  "Readability at 200% zoom and attention to color contrast across Default, Dark, Retro, and custom themes, including the document-background dim overlay keeping text legible.",
  "Large touch targets — at least 44px for primary controls (40px where space is constrained).",
]));
add(H2("Remaining gaps"));
add(P("The accessibility checklist in the release process is not yet fully signed off: screen-reader passes, full keyboard-order audits across every surface, and contrast verification on all themes are manual items that require real assistive technology and physical devices. These are tracked as part of release hardening (Section 32, Phase 1)."));

// ===================================================================
// 22. PRIVACY
// ===================================================================
add(H1("22","Privacy"));
add(STAT("Shipped and functional","Privacy is a first-class, documented property of the product."));
add(P("The privacy stance is simple to state because the architecture enforces it. Everything — every note (including inline images and document backgrounds), task, time block, homework course and assignment, Testing Hub and AP Study data, Review decks, College, Life, and Projects & Work data, streaks, focus templates, themes, preferences, and onboarding state — is stored locally in the browser, and none of it is sent anywhere by Sutra. There is no Sutra-operated server, no required account, and no telemetry; fresh startup, core .sutra backup, and JSON backup are designed to make zero third-party requests."));
add(H2("What may leave the device, and only on your action"));
add(P("Optional outbound calls happen only when the user triggers them: Sutra Assistant provider requests, approved feedback-form embeds, approved media embeds (YouTube, Vimeo, Spotify, SoundCloud, CodePen, Figma, and YouTube thumbnails), AP Classroom resource links, AI-console help links, ChatGPT/Spotify launch shortcuts, configurable localhost/127.0.0.1 AI endpoints, and secondary document import/export libraries when a browser-native fallback is not enough. For AI specifically, the request goes directly from the browser to the chosen provider; the local Sutra Intelligence layer calls no server, and only the message plus the context permitted by Workspace Access is sent."));
add(H2("Secrets, consent, and ownership"));
add(...BUL([
  "API keys, provider credentials, and tokens live in sessionStorage only and are never written to long-term storage and never included in any export; the exporter actively redacts secret-shaped fields.",
  "Conversation history is session-local and not exported.",
  ".sutra exports are not encrypted — treat them as personal files; locked-page PINs protect a page within the browser UI (hashed credentials travel in backups), which is not full-disk encryption.",
  "Clearing browser storage without a backup will lose local data, since there is no server copy.",
]));

// ===================================================================
// 23. SECURITY POSTURE
// ===================================================================
add(H1("23","Security Posture"));
add(STAT("Shipped and functional","A hardened, guarded posture for a static app; a few documented limitations remain."));
add(H2("Content Security Policy and network policy"));
add(P([ run("Every HTML entry point ships a strict meta-tag CSP with explicit "),
  run("script-src", {i:true}), run(", "), run("style-src", {i:true}), run(", "),
  run("connect-src", {i:true}), run(", "), run("frame-src", {i:true}), run(", "),
  run("img-src", {i:true}), run(", "), run("media-src", {i:true}), run(", "),
  run("worker-src", {i:true}), run(", "), run("form-action", {i:true}), run(", and "),
  run("object-src 'none'", {i:true}), run(". connect-src lists exactly the supported AI provider origins (Groq, OpenAI, Anthropic, Google, OpenRouter) plus localhost/127.0.0.1; frame-src and media-src list the approved embed origins. The local dev server adds the same CSP plus "),
  run("frame-ancestors 'none'", {i:true}), run(". A CSP guard and a network/approved-origin guard both pass.") ]));
add(CALL("Documented security limitations",
  [ run("Two tradeoffs are worth stating plainly. First, "), run("script-src", {i:true}),
    run(" includes "), run("'unsafe-inline'", {i:true}),
    run(" (and allows cdnjs and unpkg for optional secondary import/export libraries), which is necessary for the inline-script, no-build architecture but is weaker than a nonce/hash policy. Second, "),
    run("frame-ancestors", {i:true}), run(" is header-only and cannot be enforced from a meta tag; GitHub Pages cannot send custom response headers, so on Pages this clickjacking protection is unavailable. The recommendation is to deploy behind a header-capable host (Cloudflare Pages, Netlify, or an Nginx/Caddy front) before a wider public launch.") ], WARNBG));
add(H2("Input, export, plugins, and key handling"));
add(...BUL([
  "File-import validation: backups are validated against accepted manifests; files newer than the supported format are rejected rather than partially applied; a pre-import safety snapshot is taken first.",
  "Export security: secret-shaped fields are redacted from every export and the redacted paths are recorded in export diagnostics (enforced by the round-trip guard).",
  "Plugins run sandboxed in an iframe behind an explicit permission allowlist, install disabled, and are re-reviewed after import.",
  "API-key handling: keys are sessionStorage-only, never persisted, never exported, and migrated out of any legacy localStorage location on read.",
]));
add(H2("Threat model and recommendations"));
add(P("The realistic threats for a local-first app are local device access, malicious imports, malicious custom CSS or plugins, and accidental secret leakage. Sutra addresses these with hashed page locks, import validation plus a safety snapshot, an iframe sandbox plus Safe Mode, and systematic secret redaction. The main hardening recommendations are to move to a header-capable host (for frame-ancestors and other response headers), to keep the approved-origin lists tight, and, longer term, to explore removing 'unsafe-inline' — a substantial refactor for a no-build app."));

// ===================================================================
// 24. TECHNICAL ARCHITECTURE
// ===================================================================
add(H1("24","Technical Architecture"));
add(...IMG_("diagram-modules.png", 6.0, "Figure 24.1 — Repository module map."));
add(P([ run("The runtime is organized around a single global-scope core with feature modules attached to it. The core ("),
  run("src/core/app.js", {i:true}), run(") owns the data model, persistence and hydration, the export/import pipeline, the notes editor (including document backgrounds, locked pages, Page Mode, and split view), and the wiring for most views. A small "),
  run("safe-storage", {i:true}), run(" module wraps storage writes. Feature modules expose canonical globals on "),
  run("window", {i:true}), run(" so the core, other modules, and plugins can reach them, with legacy aliases pointing at the same objects (for example "),
  run("window.sutraAssistant", {i:true}), run(" with legacy "),
  run("window.flowAssistant", {i:true}), run(").") ]));
add(H2("Layers"));
add(TBL(["Layer","Where","Responsibility"], [
  ["UI shell + views","Sutra.html, src/core/app.js, src/ui/*","Markup, view rendering, editor, modals, keyboard, enhancers (date/time/select)."],
  ["State + persistence","src/core/app.js, src/core/safe-storage.js","appData, hydrate/save paths, persistence-health pipeline."],
  ["Serialization","src/core/app.js","buildWorkspaceExportPayload, package/JSON export, import, round-trip wrappers."],
  ["Feature modules","src/features/*.js","Assistant, Intelligence, homework, AP study, review, business, handwriting, customization, plugins, notifications."],
  ["Theme + customization","src/features/customization.js, styles/*","Themes, density, motion, text size, CSS overrides."],
  ["Assistant","flow-assistant.js + flow-intelligence.js","Chat panel + on-device signal layer (deriveStudentContext)."],
  ["Tests + build","scripts/*.mjs, tests/*, .github/workflows","Static guards, Playwright matrix, deploy artifact, CI."],
].map(r=>[ [run(r[0],{b:true,s:18})], [run(r[1],{i:true,s:17})], r[2] ]), [0.2,0.32,0.48]));
add(H2("Build, deployment, and CI"));
add(P("There is no build step: the page that is opened is the app. The static release gate (npm run check:all) runs fourteen Node guards with no browser, and a Playwright matrix (Chromium, Firefox, WebKit) covers persistence, CSP, modal keyboard behavior, reduced-motion, offline startup, and backup/export regressions. Deployment is to GitHub Pages from a clean, allowlisted artifact, with a post-deploy live-smoke check. The single largest maintainability concern is that app.js runs in one ~52,000-line global namespace, which the repository itself flags as a watch-point for name collisions."));

// ===================================================================
// 25. DATA MODEL
// ===================================================================
add(H1("25","Data Model"));
add(P([ run("The entire workspace is one "), run("appData", {i:true}),
  run(" object. Each feature owns a top-level collection within it, normalized on load and copied back on save. The table below summarizes the key models, their storage location, and their import/export behavior.") ]));
add(TBL(["Model","Holds / key fields","Storage location","Travels in backup?"], [
  ["Workspace (appData)","Root object; schema version 2","IndexedDB noteflow_atelier_db / workspace / root","Yes (the whole thing)"],
  ["Pages (notes)","content, title, order, icon, theme, pageMode, documentLayout, lock, comments, version history","appData.pages[]","Yes (inline images → assets/)"],
  ["Spaces / pinned","space defs, page→space links, pinned set","appData.spaces, pinnedPages","Yes"],
  ["Tasks / timeline","tasks, taskOrder, noteId links, time blocks","appData.tasks, timeBlocks","Yes"],
  ["Homework","courses + assignments (due/priority/difficulty/done)","localStorage hwCourses:v2 / hwTasks:v2 → mirrored","Yes (restored to localStorage)"],
  ["Course Hub","course metadata + file metadata / binaries","appData.courseWorkspace + noteflow_attachments_db","Yes (binaries as base64)"],
  ["Testing Hub","exams, pinned, mistakes, practice, scores, countdowns","appData.testingHub","Yes"],
  ["AP Study","subjects/units/topics/sessions/practiceLogs","appData.apStudyWorkspace","Yes"],
  ["Review","decks, items, SRS state, sessions","appData.reviewWorkspace","Yes"],
  ["College / Life / Work","trackers, essays, habits, projects, invoices","appData.collegeAppWorkspace / lifeWorkspace / businessWorkspace","Yes"],
  ["Settings / themes","theme, custom themes, density, motion, enabledViews","appData.settings, globalTheme","Yes"],
  ["Assistant","preferences, provider/model choices, activity log","appData.settings.preferences.assistant + localStorage","Yes (key excluded)"],
  ["Secrets","API keys, chat history","sessionStorage only","No (redacted / session-local)"],
].map(r=>[ [run(r[0],{b:true,s:17})], [run(r[1],{s:16})], [run(r[2],{i:true,s:16})], [run(r[3],{s:16})] ]), [0.16,0.34,0.32,0.18]));
add(H2("Relationships and migration"));
add(P("Cross-feature relationships are preserved on import: tasks keep their id, taskOrder is rebuilt from surviving ids, and noteId / courseId links are carried verbatim. The Homework↔Course bridge re-runs after the imported homework snapshot is restored so links reconcile against final state, and page spaceIds pointing at missing spaces are remapped to a default. Schema migration is tolerant: mergeAppDataDefaults deep-merges older shapes over fresh defaults and per-feature normalizers fill gaps, so legacy JSON and .atelier files import without crashing."));

// ===================================================================
// 26. DEPLOYMENT AND RELEASE PROCESS
// ===================================================================
add(H1("26","Deployment and Release Process"));
add(P([ run("Sutra deploys to "), run("GitHub Pages", {b:true}),
  run(" via a GitHub Actions workflow ("), run(".github/workflows/deploy.yml", {i:true}),
  run("). On push to "), run("main", {i:true}), run(", a release-gate job runs the full static checks and the Playwright browser matrix, then builds a clean deploy artifact ("),
  run("npm run build:deploy", {i:true}), run(") and verifies it ("),
  run("npm run check:deploy", {i:true}), run("). The artifact is rebuilt from an allowlist so the Pages upload only ever contains the runtime surface — never node_modules, tests, scripts, docs, package metadata, or the legacy NoteFlow Classic app. After deployment, a post-deploy live-smoke job polls the published URL and runs a live smoke check ("),
  run("npm run check:live", {i:true}), run(").") ]));
add(H2("Hosting notes and a brief discrepancy to record"));
add(...BUL([
  [ run("No Vercel configuration exists", {b:true}), run(" in the repository; deployment is GitHub Pages. (The original task brief referenced Vercel; the verified mechanism is GitHub Pages with a clean artifact build.)") ],
  "Because GitHub Pages cannot send custom response headers, header-only protections such as frame-ancestors are unavailable there; a header-capable host is recommended before a wider public launch.",
  "Several backup and feature branches (backup/*, copilot/*, origin/Agentic-coding) diverge from main; main is the canonical implementation. Consolidating or archiving stale branches would reduce confusion for new contributors.",
]));
add(H2("Repository vs deployed product"));
add(P("The deploy job rebuilds the artifact from main on every push and gates on the static checks, the browser matrix, an artifact verification, and a post-deploy smoke check, so the live Pages bundle should track main closely. One consequence worth noting: the user-visible legacy “Flowy” string present in main (Section 36) is also present in the committed .deploy artifact, so it would reach the deployed app until corrected."));

// ===================================================================
// 27. AUTOMATED TESTS AND QA COVERAGE
// ===================================================================
add(H1("27","Automated Tests and QA Coverage"));
add(P("Sutra’s automated coverage is unusually strong for a static, no-build app, and it is the primary basis for this guide’s confidence in the persistence, security, and rebrand claims. The static release gate (npm run check:all) ran cleanly in preparing this document (exit 0)."));
add(TBL(["Guard / suite","What it verifies","Result here"], [
  ["syntax-check","node --check on each src JS file","Pass"],
  ["smoke-check","Structural integrity, feature hooks, badge/landing hooks","Pass"],
  ["round-trip-check","Save/export/import field parity, secret redaction, cache-warming guard","Pass (20 fields)"],
  ["version-history-check","Version-history semantics (55 assertions)","Pass"],
  ["sutra-rebrand-check","Rebrand consistency; retained legacy identifiers","Pass"],
  ["sutra-compat-check","Old .atelier / new .sutra interoperability","Pass"],
  ["sutra-csp-check","CSP / hosting-header policy","Pass"],
  ["sutra-persistence-health-check","Centralized persistence-health pipeline","Pass"],
  ["sutra-modal-a11y-check","Modal accessibility primitive (incl. Review, Homework)","Pass"],
  ["sutra-network-check","Approved-origin / startup-network policy","Pass"],
  ["sutra-encoding-check","Encoding integrity (22 allowlisted findings suppressed)","Pass"],
  ["sutra-responsive-check","Responsive hooks across the viewport range","Pass"],
  ["sutra-brand-assets-check","Brand masters, derivatives, references (56 assertions)","Pass"],
  ["sutra-docbg-check","Document-background clamps, gating, export wiring","Pass"],
  ["Playwright e2e","Chromium/Firefox/WebKit: persistence, CSP, modal, offline, export","Defined; runs in CI"],
].map(r=>[ [run(r[0],{i:true,s:17})], r[1], [run(r[2],{b:r[2].startsWith("Pass"), c:r[2].startsWith("Pass")?GREEN:INK, s:17})] ]), [0.27,0.55,0.18]));
add(H2("Coverage gaps and manual QA needs"));
add(...BUL([
  "The manual viewport × surface QA matrix (ten widths × ~19 surfaces) is defined in the release checklist but not yet signed off, and physical-device results must be gathered on real hardware before claiming device-specific behavior.",
  "The encoding gate passes while suppressing 22 allowlisted findings; periodic review of that allowlist is advisable.",
  "Screen-reader and full accessibility audits remain manual.",
]));

// ===================================================================
// 28. CURRENT FEATURE MATRIX
// ===================================================================
add(H1("28","Current Feature Matrix"));
add(P("A condensed matrix follows; the full, evidence-rich version (with file paths, functions, tests, and confidence) lives in the companion workbook, Sutra_Audit_Notes.xlsx, sheet 1."));
const FM = [
  ["Notes & rich editor","Shipped and functional","Yes (pre-rebrand shot)","Yes"],
  ["Today / Deadline Radar / Quick Capture","Shipped and functional","Yes","Yes"],
  ["Timeline calendar","Shipped and functional","Yes","Yes"],
  ["Homework + portal import","Shipped and functional","Yes","Yes"],
  ["AP Study + Battle Plan","Shipped and functional","Partial","Yes"],
  ["Testing Hub","Functional but incomplete","Yes","Yes"],
  ["Cram","Functional but incomplete","Partial","Yes"],
  ["Review (5 modes, SRS)","Shipped and functional","Partial","Yes"],
  ["College / Life / Projects & Work","Shipped and functional","Partial","Yes"],
  ["Sutra Assistant + Intelligence","Shipped and functional","Partial","Yes"],
  ["Local-first persistence + health","Shipped and functional","Author QA","Yes"],
  [".sutra / .atelier backup + import","Shipped and functional","Author QA","Yes"],
  ["Emergency export + safety snapshot","Shipped and functional","Code + e2e","Yes"],
  ["Themes + per-page theming + CSS","Shipped and functional","Partial","Yes"],
  ["Plugins (sandboxed)","Functional but incomplete","Partial","Yes"],
  ["Safe Mode","Shipped and functional","Code","Yes"],
  ["Onboarding (Sutra Setup)","Shipped and functional","Partial","Yes"],
  ["Accessibility primitives","Functional but incomplete","Partial","Yes"],
  ["Responsive / mobile (320–1440px)","Functional but incomplete","Code + guard","Yes"],
  ["CSP / network policy","Shipped and functional","Code + guard","Yes"],
  ["Multi-device sync","Roadmap concept","No","N/A"],
  ["Service-worker offline reopen","Roadmap concept","No","N/A"],
  ["frame-ancestors (header-only)","Functional but incomplete","Code","Partial"],
];
add(TBL(["Feature","Status","Verified in UI","Verified in code"],
  FM.map(r=>[ [run(r[0],{s:17})], sc(r[1]), [run(r[2],{s:16})], [run(r[3],{s:16})] ]), [0.36,0.30,0.18,0.16]));

// ===================================================================
// 29. KNOWN ISSUES AND TECHNICAL DEBT
// ===================================================================
add(H1("29","Known Issues and Technical Debt"));
add(P("Prioritized by severity. The full issue log is in Sutra_Audit_Notes.xlsx, sheet 4."));
add(H2("High"));
add(...BUL([
  [ run("User-visible legacy name “Flowy.” ", {b:true}), run("The Assistant’s stateless/stateful help text (Sutra.html line 4314) still reads “Flowy,” the old assistant name. The rebrand guard checks for “Flow Assistant” but not “Flowy,” so it passes CI. Fix the string and extend the guard.") ],
  [ run("Pre-rebrand marketing/app screenshots. ", {b:true}), run("The bundled screenshots in assets/ss/ still show the NoteFlow Atelier wordmark and seeded content; recapture on the current build before any public, portfolio, or landing use.") ],
]));
add(H2("Medium"));
add(...BUL([
  [ run("Manual cross-viewport QA not signed off. ", {b:true}), run("The device matrix is defined but unchecked; walk it on real hardware before public beta.") ],
  [ run("Header-only security unavailable on Pages. ", {b:true}), run("frame-ancestors cannot be set on GitHub Pages; move to a header-capable host.") ],
  [ run("script-src 'unsafe-inline'. ", {b:true}), run("A real CSP weakness inherent to the no-build approach; a nonce/hash migration is a large refactor.") ],
  [ run("Monolithic app.js. ", {b:true}), run("A single ~52,000-line global-scope file risks name collisions; gradual modularization with guard tests would reduce debt.") ],
]));
add(H2("Low"));
add(...BUL([
  [ run("22 allowlisted encoding findings. ", {b:true}), run("The encoding gate suppresses them; review periodically.") ],
  [ run("Branch divergence. ", {b:true}), run("Several backup/feature branches diverge from main; consolidate or archive.") ],
  [ run("Cram depth + DOCX/RTF background export. ", {b:true}), run("Cram is lighter than its siblings; DOCX/RTF note export does not reliably carry document backgrounds (documented).") ],
  [ run("Internal “Atelier” code identifiers. ", {b:true}), run("Function and CSS-class names retain “Atelier”; intentional and non-user-visible, optional cosmetic cleanup.") ],
]));

// ===================================================================
// 30. COMPETITIVE FRAMING
// ===================================================================
add(H1("30","Competitive Framing"));
add(P("Sutra is compared here against broad product categories rather than named competitors, and no unsupported claims are made about specific products. “~,” “Varies,” and “Partial” mean the capability depends on the particular product in that category."));
add(TBL(["Capability","Sutra","Notes app","Task mgr","AI chatbot","School LMS","Study app"], [
  ["Student-specific workflow","Yes","~","No","No","Per-school","Partial"],
  ["Local-first data ownership","Yes","Varies","Varies","No","No","Varies"],
  ["Academic planning + deadlines","Yes","No","Yes","No","Read-only","No"],
  ["Notes ↔ study ↔ tasks continuity","Yes","No","No","No","No","No"],
  ["Spaced-repetition review","Yes","No","No","No","No","Yes"],
  ["Recoverable single-file backup","Yes","Varies","Varies","No","No","No"],
  ["Optional, approval-gated AI","Yes","Add-on","No","Core","No","Varies"],
  ["Deep customization / themes / CSS","Yes","Varies","Limited","No","No","Limited"],
].map(r => r.map((cell,i) => {
    if (i===0) return [ run(cell,{s:16}) ];
    if (i===1) return [ run(cell,{b:true,c:GREEN,s:16}) ];
    return [ run(cell,{s:16, c: cell==="Yes"?GREEN:MUT}) ];
  })), [0.28,0.12,0.12,0.12,0.12,0.13,0.11]));
add(P([ run("The point is not that Sutra beats any single tool at its specialty — a dedicated flashcard app may drill more elegantly, a dedicated planner may have richer calendar features. Sutra’s differentiators are "),
  run("continuity", {b:true}), run(" (one thread through planning, writing, studying, and tracking), "),
  run("ownership", {b:true}), run(" (local-first, single-file portability), and "),
  run("student-specific design", {b:true}), run(" (AP Battle Plan, portal import, college trackers). Present capabilities, incomplete areas, and roadmap ambitions are kept distinct throughout this guide so the comparison is honest.") ]));

// ===================================================================
// 31. RELEASE-READINESS ASSESSMENT
// ===================================================================
add(H1("31","Release-Readiness Assessment"));
add(TBL(["Audience","Ready?","Evidence and caveats"], [
  ["Private testing","Yes","All 14 static guards pass; persistence and recovery verified; data is local and safe to experiment with."],
  ["Portfolio / showcase","Yes","Strong, coherent product story and architecture; recapture Sutra-branded screenshots and fix the “Flowy” string first."],
  ["Hackathon / demo","Yes","Local-first means no server to fail on stage; the workspace runs from a file."],
  ["Controlled student beta","Yes, with caveats","Walk the device-QA matrix, fix the “Flowy” string, and reinforce the backup habit; users must keep .sutra backups."],
  ["Wider public beta","Almost","Move to a header-capable host (frame-ancestors), complete mobile/accessibility QA, and review the encoding allowlist."],
  ["Production-critical use","Not yet","No sync and no service worker; the user’s .sutra backup is the only safety net, so it is not yet a safe sole home for irreplaceable data."],
].map(r=>[ [run(r[0],{b:true,s:18})], [run(r[1],{b:true,c:r[1].startsWith("Yes")?GREEN:(r[1]==="Almost"?AMBER:"B23B3B"),s:18})], r[2] ]), [0.22,0.16,0.62]));
add(P("Prioritized next steps to raise readiness are consolidated in Section 40 (Final Recommendations)."));

// ===================================================================
// 32. PRODUCT ROADMAP
// ===================================================================
add(H1("32","Product Roadmap"));
add(...IMG_("diagram-roadmap.png", 6.4, "Figure 32.1 — A phased roadmap from release hardening to a broader student operating system."));
function phase(title, color, goals, candidates, deps, risk, priority, evidence) {
  add(H2(title));
  add(P([ run("Goals. ", {b:true}), run(goals) ]));
  add(P([ run("Candidate features. ", {b:true}), run(candidates) ]));
  add(P([ run("Dependencies. ", {b:true}), run(deps), run("   "), run("Risks. ", {b:true}), run(risk) ]));
  add(P([ run("Priority. ", {b:true}), run(priority), run("   "), run("Evidence from current gaps. ", {b:true}), run(evidence) ]));
}
phase("Phase 1 — Stability and release hardening", GREEN,
  "Make the product safe to hand to real students: protect data, finish accessibility, verify import/export, and clean the rebrand.",
  "Fix the user-visible “Flowy” string and extend the rebrand guard; recapture Sutra-branded screenshots; walk the device-QA matrix; review the 22 allowlisted encoding findings; consolidate stale branches; move to a header-capable host for frame-ancestors.",
  "Access to physical devices and a header-capable host.",
  "Low technical risk; mostly QA and hygiene.",
  "Highest.",
  "Sections 21, 23, 26, 27, 29, 36.");
phase("Phase 2 — Core-workflow refinement", AMBER,
  "Sharpen the daily loop and the information hierarchy so the breadth never feels like clutter.",
  "Tighten the Today hierarchy around the single Next Step; deepen the Testing Hub; smooth onboarding and the first backup; polish mobile layouts and information architecture.",
  "Phase 1 stability.",
  "Scope creep on Today; balancing breadth with focus.",
  "High.",
  "Sections 9, 13, 14, 10.");
phase("Phase 3 — Assistant depth", VIOLET,
  "Make the assistant genuinely useful rather than decorative, with clearer privacy controls.",
  "Higher-quality local retrieval; refined Workspace Access controls; better stateful/stateless behavior; proactive, approval-gated assistance; clearer error handling.",
  "A stable assistant surface and the local Intelligence layer (both present).",
  "Provider variability; keeping the privacy boundary clear as context grows.",
  "Medium-high.",
  "Section 15.");
phase("Phase 4 — Optional sync and portability", SLATE,
  "Let users move between devices without losing the local-first, no-account promise.",
  "Opt-in, end-to-end-respecting sync; scheduled backups; cross-device workflow; conflict handling; richer file portability; stronger recovery.",
  "A rock-solid persistence and .sutra layer (present) and a careful privacy design.",
  "Sync inherently tensions with local-first; conflict resolution complexity.",
  "Medium.",
  "Sections 16, 17, 18.");
phase("Phase 5 — Extensibility", SLATE,
  "Grow what users and the community can build, without weakening the security boundary.",
  "A maturing plugin SDK; richer custom CSS and theme sharing; safe local APIs; community workflows within the no-marketplace stance.",
  "The sandboxed plugin system and Safe Mode (present).",
  "Security of third-party extensions; supportability.",
  "Medium.",
  "Section 19.");
phase("Phase 6 — Student-OS expansion", SLATE,
  "Realize the broader “student operating system”: deeper academic planning and study intelligence as a durable differentiator.",
  "Smarter academic planning; study intelligence that connects review, practice, and outcomes; optional integrations; long-term workflow continuity.",
  "All prior phases.",
  "Ambition outrunning focus; keeping simplicity, ownership, and trust intact.",
  "Lower (long-term).",
  "Sections 3, 33.");

// ===================================================================
// 33. FUTURE VISION
// ===================================================================
add(H1("33","Future Vision"));
add(P([ run("The strongest credible version of Sutra is a "), run("personal academic operating system", {b:true}),
  run(": one private, local-first surface where a student plans, writes, studies, tracks, and reflects, and where each of those is connected by design rather than glued together by the student. The thread that today runs through notes, deadlines, classes, and review would deepen into genuine study intelligence — the workspace noticing that a weak AP unit, an upcoming exam, a stale review deck, and a free block on Tuesday afternoon are the same problem, and offering a concrete, approvable plan that links all four.") ]));
add(P("Crucially, that ambition has to be realized without sacrificing the four things that make Sutra worth using: simplicity (it stays calm and legible, not a control panel), user ownership (the data stays on the device and in a single portable file), privacy (no telemetry, no required account, AI only on the user’s action), and recoverability (the save-failure net, the backup habit, and the import path remain first-class). Optional sync, when it comes, must be opt-in and must not quietly turn Sutra into a cloud product. The vision is expansive in capability and deliberately conservative in trust."));

// ===================================================================
// 34. MESSAGING GUIDE
// ===================================================================
add(H1("34","Messaging Guide"));
add(P("Reusable copy that does not overstate maturity. Where a claim touches an in-progress area, the wording stays honest."));
add(H3("One-sentence description"));
add(P([ run("Sutra is a private, local-first workspace that brings a student’s notes, deadlines, classes, studying, and planning into one surface they own.", {i:true}) ]));
add(H3("Two-sentence description"));
add(P([ run("Sutra is a private, local-first workspace for students: notes, homework, AP prep, college apps, spaced-repetition review, a calendar, and life trackers behind one calm interface, with no backend, no account, and no cloud sync. Everything stays on your device and travels in a single portable .sutra backup.", {i:true}) ]));
add(H3("30-second elevator pitch"));
add(P([ run("A student’s day is scattered across a notes app, a school portal, a calendar, a task manager, an AI chatbot, and twenty browser tabs — and nothing talks to anything else. Sutra runs one thread through all of it: a private, local-first workspace where your notes, deadlines, classes, studying, and planning live together and reference each other, stored on your device and owned by you. Optional AI assistance reads your workspace and proposes changes you approve, one card at a time — and it only ever talks to a provider you choose.", {i:true}) ]));
add(H3("60-second pitch"));
add(P([ run("Students don’t need another isolated productivity app; they need continuity. Sutra is a private, local-first student workspace that unifies notes, homework, AP exam prep with an automated Battle Plan, college applications, spaced-repetition review, a full calendar, focus tools, and life trackers. Because it’s a static web app with no backend, your entire workspace lives in your browser on your device — fast, offline-capable, and yours — and a single .sutra file is a complete, portable backup. A save-failure safety net protects your work, and an optional bring-your-own-key assistant grounds its answers in on-device signals while keeping your API key in the browser session only. It’s strong enough today for personal use, portfolios, and a controlled student beta; sync and a few hardening items are on the roadmap.", {i:true}) ]));
add(H3("Portfolio description"));
add(P([ run("Sutra is a local-first student workspace I designed and built as a single static web app (~52k-line core, no backend, no build step). It unifies notes, planning, homework, AP prep, spaced-repetition review, and college and life trackers, with a deliberately engineered persistence layer — debounced autosave, a persistence-health pipeline, a non-dismissible save-failure banner with emergency export, and a portable .sutra backup format — all verified by a 14-check static release gate and a cross-browser Playwright matrix.", {i:true}) ]));
add(H3("GitHub repository description"));
add(P([ run("Sutra — a private, local-first productivity workspace for students. Notes, homework, AP prep, review, calendar, and life trackers in one static web app. No backend, no account, no telemetry; portable .sutra backups.", {i:true}) ]));
add(H3("LinkedIn project description"));
add(P([ run("I built Sutra, a local-first “student operating system” — one private workspace for notes, deadlines, classes, studying, and planning, with no backend and no account. It runs as a single static web app, stores everything on-device, and exports a complete portable backup. Highlights: a tested persistence + recovery layer, an optional bring-your-own-key AI assistant grounded in on-device signals, deep theming and sandboxed plugins, and a 14-check release gate. Currently in product-preview / controlled-beta stage.", {i:true}) ]));
add(H3("Landing-page hero copy"));
add(P([ run("The workspace for the way students actually work. Your notes, deadlines, classes, studying, and planning — woven into one private workspace you own. No account. No cloud. Export a complete .sutra backup anytime. Start your session.", {i:true}) ]));
add(H3("Release-announcement paragraph"));
add(P([ run("Sutra enters product preview: a private, local-first workspace that brings a student’s whole academic life into one calm surface. This build ships notes, planning, homework, AP prep, review, college and life trackers, an optional bring-your-own-key assistant, deep customization, and a hardened persistence and privacy layer behind a passing 14-check release gate. It’s ready for personal use, portfolios, and a controlled student beta; multi-device sync and a few hardening items are next.", {i:true}) ]));
add(H3("Technical summary"));
add(P([ run("Static, no-build web app. A global-scope core (src/core/app.js) owns a single appData workspace persisted to IndexedDB through one hydrate path and one debounced save path, with a centralized persistence-health pipeline and a portable .sutra ZIP backup (vendored JSZip). Feature modules attach on window; an on-device signal layer grounds an optional BYO-key assistant whose key stays in sessionStorage. Strict meta-CSP, sandboxed iframe plugins, and a 14-guard static gate plus a Chromium/Firefox/WebKit Playwright matrix.", {i:true}) ]));
add(H3("Privacy-focused summary"));
add(P([ run("Sutra keeps your academic life on your device. No backend, no account, no telemetry, no cloud sync. Your API keys never leave the browser session and are never exported; the local intelligence layer calls no server; and AI requests go only to a provider you choose, only when you send a message.", {i:true}) ]));
add(H3("Student-focused summary"));
add(P([ run("One place for everything you carry: notes, homework, AP prep, college apps, flashcards, your calendar, and your habits. Sutra keeps it all together and on your own device, helps you find the one next thing to do, and lets you back the whole thing up to a single file. No sign-up, works offline.", {i:true}) ]));

// ===================================================================
// 35. FREQUENTLY ASKED QUESTIONS
// ===================================================================
add(H1("35","Frequently Asked Questions"));
function faq(q,a){ add(new Paragraph({ spacing:{before:140,after:50}, children:[ run(q,{b:true,c:NAVY,s:22}) ] })); add(P(a)); }
faq("What is Sutra?","A private, local-first workspace for students that unifies notes, homework, AP prep, college applications, spaced-repetition review, a calendar, focus tools, and life and work trackers in one static web app with no backend.");
faq("Is Sutra a notes app?","It has a first-class notes system, but it is broader than that: notes are one thread among planning, homework, studying, and tracking, all in the same workspace.");
faq("Is Sutra an AI app?","No. AI is an optional, bring-your-own-key assistant. Sutra is fully usable with no AI configured, and the assistant never changes your workspace without your approval.");
faq("Does Sutra require an account?","No. There is nobody to sign up with. Your workspace is stored locally in your browser.");
faq("Where is my data stored?","On your device: IndexedDB holds the workspace and attachments, and localStorage holds homework, some preferences, and storage-health state. Nothing is uploaded by the app itself.");
faq("Can I export my data?","Yes. From Settings ▸ Data you can export a .sutra package (the default) or a single JSON file; both round-trip your workspace so you can move between browsers or machines.");
faq("What is a .sutra file?","Your portable backup: a ZIP package containing a manifest, the full workspace, your assets (with checksums), and metadata. It is the complete, movable copy of your workspace — and it never contains your API keys.");
faq("Does Sutra work offline?","Editing your workspace works fully offline once Sutra has loaded, as do .sutra/JSON backup and restore. Reopening the hosted app offline after a full browser restart is not guaranteed (there is no service worker), so keep a local copy or a backup if you need dependable offline reopen.");
faq("Does Sutra sync across devices?","Not today. Moving between devices means copying a .sutra backup or an ICS export. Opt-in sync is on the roadmap.");
faq("What does Sutra Assistant do?","It answers questions about your workspace and proposes concrete changes (notes, tasks, blocks, review cards) as Apply/Decline cards you approve. It is grounded by an on-device signal layer and uses a provider and key you supply.");
faq("Does Sutra send my notes to an AI provider?","Only what you send. The local intelligence layer calls no server; when you send a message, only your message plus the context permitted by your Workspace Access setting (and your current selection) goes directly to the provider you chose — never your whole workspace by default.");
faq("What happens if saving fails?","Your in-memory workspace is preserved and a non-dismissible banner appears with Retry, an emergency .sutra export, technical details, and your last-confirmed-save time. The emergency export refuses to run if it would be incomplete.");
faq("Is Sutra ready for public use?","It is ready for personal use, portfolios, and a controlled student beta. For a wider public beta it should move to a header-capable host and complete mobile/accessibility QA; it is not yet suited to production-critical use without the user keeping backups.");
faq("What is still under development?","Mobile QA across all surfaces, Testing Hub depth, onboarding polish, the plugin ecosystem, header-level security on the host, and — as roadmap — optional sync, a service worker, and deeper study intelligence.");

// ===================================================================
// 36. LEGACY BRANDING AUDIT
// ===================================================================
add(H1("36","Legacy Branding Audit"));
add(P([ run("Sutra was previously released as "), run("NoteFlow Atelier", {i:true}),
  run(". The rebrand is largely complete and a rebrand guard enforces it, but a small number of references remain. The table distinguishes intentional, retained compatibility identifiers from genuine leftovers that should be corrected. The full audit is in Sutra_Audit_Notes.xlsx, sheet 3.") ]));
const LB = [
  ["“Flowy” (old assistant name)","Sutra.html (and .deploy/Sutra.html)","4314","Yes","High","Rename to “Sutra Assistant”; the rebrand guard checks “Flow Assistant” but not “Flowy.” Add it."],
  ["Pre-rebrand screenshots (NoteFlow Atelier wordmark)","assets/ss/*.png","raster","Yes","High","Recapture on the current Sutra build before public/portfolio use."],
  ["Legacy-branded image assets","assets/NoteFlow Atelier *.png","raster","If referenced","Medium","Confirm unreferenced, then archive or delete."],
  ["Save-systems audit titled “NoteFlow Atelier”; describes .atelier naming","docs/sutra-save-systems-audit.md","1, 9","No (internal doc)","Medium","Add a header note or refresh user-facing naming; line references remain valid."],
  ["Internal export fn names (exportWorkspaceAsAtelierPackage)","src/core/app.js","~37608, 37775","No","Low","Intentional; optional cosmetic rename."],
  ["CSS/JS identifiers (atelier-*, AtelierCustomization)","Sutra.html","57+","No","Low","Retained as compatibility identifiers; no action."],
  ["IndexedDB / localStorage names (noteflow_atelier_db, hwCourses:v2)","src/core/app.js","~2068","No (devtools only)","Low","KEEP — renaming would orphan user data; documented."],
  ["Legacy .atelier / ?atelierSafeMode=1 in user copy","Sutra.html, HomePage.html, README","various","Intentional","Low","Correct as-is; communicates that old backups still import."],
  ["NoteFlow Classic legacy app in repo","NoteFlow (classic)/","folder","No","Low","Separate app, excluded from deploy; keep clearly separated."],
];
add(TBL(["Legacy reference","File path","Lines","User-visible?","Severity","Recommended action"],
  LB.map(r=>[ [run(r[0],{s:16})], [run(r[1],{i:true,s:15})], [run(r[2],{s:15})], [run(r[3],{s:15})],
    [run(r[4],{b:true,s:15,c: r[4]==="High"?AMBER:(r[4]==="Medium"?VIOLET:MUT)})], [run(r[5],{s:15})] ]),
  [0.24,0.20,0.08,0.13,0.10,0.25]));

// ===================================================================
// 37. EVIDENCE APPENDIX
// ===================================================================
add(H1("37","Evidence Appendix"));
add(P("Representative material claims with classification, supporting files, verification, and confidence. The complete evidence sheet (with line ranges) is in Sutra_Audit_Notes.xlsx, sheet 2."));
const EV = [
  ["One appData object in IndexedDB; debounced save + lifecycle flush","Shipped and functional","src/core/app.js (~2068, 4978, 5388)","Author browser QA + persistence guard","High"],
  ["Export is sutra_workspace_*.sutra with a Sutra manifest","Shipped and functional","src/core/app.js (37846, 37705)","Code + round-trip + compat guards","High"],
  ["Import accepts both .sutra and legacy .atelier","Shipped and functional","src/core/app.js (validate/import)","Compat guard (passed)","High"],
  ["API keys sessionStorage-only; redacted from exports","Shipped and functional","src/core/app.js (42454+)","Round-trip secret-redaction guard","High"],
  ["Course-file binary cold-cache export bug fixed + guarded","Shipped and functional","src/core/app.js (20769–20797)","Author wipe→import QA + regression guard","High"],
  ["On-device intelligence calls no server","Shipped and functional","src/features/flow-intelligence.js","Network guard (passed)","High"],
  ["AI requests go browser→provider; no relay","Shipped and functional","Sutra.html CSP line 6; app.js call sites","CSP + network guards","High"],
  ["Strict meta-CSP on all entry points","Shipped and functional","Sutra.html/index/HomePage/404 line 6","CSP guard (passed)","High"],
  ["14 static guards pass (exit 0)","Shipped and functional","scripts/*.mjs; package.json","Executed in this build","High"],
  ["Deploy = GitHub Pages clean artifact + live smoke","Shipped and functional",".github/workflows/deploy.yml","Code","High"],
  ["script-src allows 'unsafe-inline'","Functional but incomplete","Sutra.html line 6","Code","High"],
  ["No service worker; offline reopen not guaranteed","Roadmap concept","(absence) network guard","Code","High"],
  ["Multi-device sync absent","Roadmap concept","N/A","N/A","High"],
];
add(TBL(["Claim","Classification","Supporting files","Verification","Confidence"],
  EV.map(r=>[ [run(r[0],{s:16})], sc(r[1]), [run(r[2],{i:true,s:15})], [run(r[3],{s:15})], [run(r[4],{s:15})] ]),
  [0.30,0.20,0.24,0.18,0.08]));

// ===================================================================
// 38. REPOSITORY MAP APPENDIX
// ===================================================================
add(H1("38","Repository Map Appendix"));
add(TBL(["Path","Purpose","Important modules / notes"], [
  ["index.html / HomePage.html / Sutra.html / 404.html","Entry points","Redirect; landing + scrollytelling; app shell (~605 KB); offline error page."],
  ["src/core/","Runtime core","app.js (~52k lines, global scope); safe-storage.js."],
  ["src/features/","Feature modules","flow-assistant, flow-intelligence, homework, ap-study, review, business-workspace, handwriting, customization, plugin-system, notifications, startup-intro, daily-lock-in-quote."],
  ["src/ui/","UI enhancers","date-enhancer, time-enhancer, select-enhancer."],
  ["src/components/icons/","Icon set","icon-paths.js, index.js."],
  ["src/data/","Static data","daily-lock-in-quotes, emoji-keywords."],
  ["styles/","Stylesheets","styles.css (core), sutra-pro.css, mobile.css, customization.css, microinteractions.css, macos26-redesign.css, settings-redesign.css, notifications.css, startup-intro.css."],
  ["scripts/","Node guards + tooling","14 check:* guards, build/verify deploy, live smoke, persistence QA harness, brand-asset generator."],
  ["tests/","Playwright + bench","e2e specs (persistence, modal, encoding, storage, public-beta) + heavy-workspace bench."],
  ["docs/","Documentation","18 files: architecture, assistant, privacy, data/backups, save-systems audit, rebrand, testing checklist, etc."],
  ["assets/","Brand + media","brand/sutra (masters + generated icons + social preview), vendor/jszip, ss/ (pre-rebrand screenshots)."],
  [".github/workflows/","CI/CD","ci.yml (release gate) and deploy.yml (Pages + live smoke)."],
  ["examples/plugins/","Sample plugin","study-helper.atelier-plugin (legacy extension, imports fine)."],
  ["NoteFlow (classic)/","Legacy app","Separate app, not Sutra; excluded from the deploy artifact."],
].map(r=>[ [run(r[0],{i:true,s:16})], [run(r[1],{b:true,s:16})], [run(r[2],{s:16})] ]), [0.30,0.18,0.52]));

// ===================================================================
// 39. SCREENSHOT INDEX
// ===================================================================
add(H1("39","Screenshot Index"));
add(P("Screenshots are stored in the package’s Screenshots folder. Note: the in-app screenshots are real but were captured on a pre-rebrand build (the header wordmark predates the Sutra rename); the brand card and diagrams reflect current Sutra branding."));
const SI = [
  ["today-view-desktop.png","Today command center","Deck + Guide","Real (pre-rebrand)"],
  ["notes-editor-desktop.png","Notes editor","Deck + Guide","Real (pre-rebrand)"],
  ["homework-desktop.png","Homework module","Guide","Real (pre-rebrand)"],
  ["deadline-radar-desktop.png","Deadline Radar","Deck","Real (pre-rebrand)"],
  ["timeline-daily-desktop.png / timeline-weekly-desktop.png","Timeline calendar","Guide","Real (pre-rebrand)"],
  ["testing-hub-desktop.png / testing-hub-ap-review-desktop.png","Testing Hub","Deck + Guide","Real (pre-rebrand)"],
  ["life-habit-tracker-desktop.png","Life tracker","Guide","Real (pre-rebrand)"],
  ["diagram-architecture / persistence / recovery / sutra-lifecycle","Architecture & data flows","Deck + Guide","Generated (current brand)"],
  ["diagram-assistant / onboarding / workflow / modules / roadmap","Concept diagrams","Deck + Guide","Generated (current brand)"],
  ["social-preview.png","Sutra brand card","Deck title/close","Current brand asset"],
];
add(TBL(["Screenshot / figure","Interface","Used in","Type"],
  SI.map(r=>[ [run(r[0],{i:true,s:16})], r[1], r[2], r[3] ]), [0.40,0.24,0.18,0.18]));

// ===================================================================
// 40. FINAL RECOMMENDATIONS
// ===================================================================
add(H1("40","Final Recommendations"));
add(H2("Must fix before a public beta"));
add(...NUM([
  [ run("Remove the user-visible “Flowy” string", {b:true}), run(" (Sutra.html:4314) and extend the rebrand guard to catch “Flowy,” not just “Flow Assistant.”") ],
  [ run("Recapture all in-app and marketing screenshots", {b:true}), run(" on the current Sutra build so no public asset shows the old wordmark.") ],
  [ run("Move to a header-capable host", {b:true}), run(" (Cloudflare Pages / Netlify / Nginx) to enable frame-ancestors 'none' and other response headers.") ],
  [ run("Walk the manual device-QA matrix", {b:true}), run(" (ten widths × all surfaces) on real hardware and complete the accessibility checklist.") ],
]));
add(H2("Should improve soon after beta"));
add(...NUM([
  [ run("Sharpen the Today hierarchy", {b:true}), run(" around the single Next Step to reduce density.") ],
  [ run("Deepen the Testing Hub", {b:true}), run(" and decide Cram’s future (deepen or fold into the Hub).") ],
  [ run("Review the 22 allowlisted encoding findings", {b:true}), run(" and consolidate stale branches into main.") ],
  [ run("Reinforce the backup habit", {b:true}), run(" — surface the default backup folder during onboarding and add a gentle recurring reminder.") ],
]));
add(H2("Useful medium-term enhancements"));
add(...NUM([
  [ run("Assistant depth", {b:true}), run(": better retrieval, clearer context controls, and proactive, approval-gated help.") ],
  [ run("Modularize app.js", {b:true}), run(" gradually, guarded by tests, to reduce global-namespace risk.") ],
  [ run("Consider a conservative service worker", {b:true}), run(" for dependable offline reopen — or keep the honest current behavior with clear guidance.") ],
]));
add(H2("Longer-term product opportunities"));
add(...NUM([
  [ run("Opt-in sync and cross-device workflow", {b:true}), run(" that preserves the local-first, no-account promise.") ],
  [ run("A maturing extensibility surface", {b:true}), run(" (plugin SDK, theme/CSS sharing) within the strict security boundary.") ],
  [ run("Study intelligence", {b:true}), run(" that connects review, practice, deadlines, and free time into one approvable plan — the heart of the student-OS vision.") ],
]));
add(new Paragraph({ spacing:{before:240}, children:[ run("End of guide. Companion artifacts: Sutra_Pitch_Deck.(pptx|pdf), Sutra_Audit_Notes.xlsx, and the Screenshots folder.", {i:true, c:MUT, s:18}) ] }));

// ===================================================================
// DOCUMENT ASSEMBLY
// ===================================================================
const doc = new Document({
  creator: "Tanuj Ranjith", title: "Sutra — Comprehensive Product Guide",
  description: "Evidence-backed product and engineering guide for Sutra (local-first student workspace).",
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: INK } } },
    paragraphStyles: [
      { id:"Title", name:"Title", basedOn:"Normal", next:"Normal", run:{ size:64, bold:true, color:NAVY, font:FONT } },
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:30, bold:true, color:NAVY, font:FONT },
        paragraph:{ spacing:{ before:320, after:160 }, outlineLevel:0, keepNext:true,
          border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:"5D82F5", space:4 } } } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:24, bold:true, color:BLUE, font:FONT },
        paragraph:{ spacing:{ before:220, after:110 }, outlineLevel:1, keepNext:true } },
      { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:22, bold:true, color:INK, font:FONT },
        paragraph:{ spacing:{ before:150, after:80 }, outlineLevel:2, keepNext:true } },
    ],
  },
  numbering: { config: [
    { reference:"bul", levels:[{ level:0, format:LevelFormat.BULLET, text:"•", alignment:AlignmentType.LEFT,
      style:{ paragraph:{ indent:{ left:540, hanging:260 } } } }] },
    { reference:"num", levels:[{ level:0, format:LevelFormat.DECIMAL, text:"%1.", alignment:AlignmentType.LEFT,
      style:{ paragraph:{ indent:{ left:540, hanging:300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size:{ width:12240, height:15840 }, margin:{ top:1440, right:1440, bottom:1440, left:1440 } } },
    headers: { default: new Header({ children:[ new Paragraph({ alignment:AlignmentType.RIGHT, spacing:{after:0},
      children:[ run("Sutra — Comprehensive Product Guide", { c:MUT, s:16 }) ] }) ] }) },
    footers: { default: new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:0},
      children:[ run("Private · Local-first · Student-built     ·     ", { c:MUT, s:16 }),
        new TextRun({ children:[ "Page ", PageNumber.CURRENT ], color:MUT, size:16, font:FONT }) ] }) ] }) },
    children: K,
  }],
});
Packer.toBuffer(doc).then(buf => { fs.writeFileSync("/tmp/build/Sutra_Comprehensive_Product_Guide.docx", buf);
  console.log("GUIDE WRITTEN, children:", K.length); });
