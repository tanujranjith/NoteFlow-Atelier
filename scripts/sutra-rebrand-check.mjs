#!/usr/bin/env node
// sutra-rebrand-check.mjs — guard against stale PUBLIC-FACING NoteFlow Atelier /
// Flow branding leaking into the shipped Sutra product.
//
// It scans user-visible source (the app shell, landing page, redirect, and the
// JS that renders UI copy) for old product/feature NAMES that should now read
// "Sutra". It deliberately ALLOWS intentional legacy identifiers and
// compatibility references (see ALLOW below): the `.atelier` format, the
// `.atelier-plugin` bundle, `?atelierSafeMode=1`, legacy IndexedDB names, the
// `flowAssistant`/`flowIntelligence` compatibility aliases, NoteFlow Classic,
// and migration/compat comments.
//
// Run: node scripts/sutra-rebrand-check.mjs
import { readFileSync } from 'node:fs';

// Files whose CONTENT is user-visible (rendered copy, titles, labels, tooltips).
const FILES = [
  'Sutra.html',
  'HomePage.html',
  'index.html',
  'src/core/app.js',
  'src/features/flow-assistant.js',
  'src/features/flow-intelligence.js',
  'src/features/homework.js',
  'src/features/ap-study.js',
  'src/features/review.js',
  'src/features/business-workspace.js',
];

// Stale PUBLIC strings that must no longer appear as UI copy.
const STALE = [
  { re: /NoteFlow Atelier/g, what: 'old product name "NoteFlow Atelier"' },
  { re: /\bFlow Assistant\b/g, what: 'old "Flow Assistant" (now Sutra Assistant)' },
  { re: /\bFlow Intelligence\b/g, what: 'old "Flow Intelligence" (now Sutra Intelligence)' },
  { re: /\bAsk Flow\b/g, what: 'old "Ask Flow" (now Ask Sutra)' },
  { re: /\bDaily Brief\b/g, what: 'old "Daily Brief" (now Daily Thread)' },
  { re: /\bPlan My Day\b/g, what: 'old "Plan My Day" (now Shape My Day)' },
  { re: /\bNext Best Action\b/g, what: 'old "Next Best Action" (now Next Step)' },
  { re: /\bWorkspace Modes?\b/g, what: 'old "Workspace Mode(s)" (now Sutra Modes)' },
  { re: /Mods &(amp;)? Customization/g, what: 'old "Mods & Customization" (now Customization)' },
  { re: /Business \/ Freelancer/g, what: 'old "Business / Freelancer" (now Projects & Work)' },
];

// A line is an INTENTIONAL legacy/compat reference if it matches any of these.
const ALLOW = [
  /legacy/i, /compat/i, /pre-rebrand/i, /migrat/i, /backward/i, /retained/i,
  /NoteFlow Classic/i, /Classic/,
  /favicon/i, /alternate icon/i, /%20/, /\.png/i,           // legacy asset paths
  /flowAssistant|flowIntelligence|flowAtelier|flow:activityLog|getFlowAssistantContext/, // compat aliases
  /internal name/i, /still (?:import|restore|work)/i,
  /\.atelier\b/,                                            // legacy format mentions in copy
];

let violations = 0;
for (const file of FILES) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { console.error('  MISSING:', file); violations++; continue; }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    // Skip comment-only lines — code comments are not user-visible copy.
    if (/^\s*(\/\/|\/\*|\*|<!--|\*\/)/.test(line)) return;
    if (ALLOW.some((re) => re.test(line))) return;
    for (const { re, what } of STALE) {
      re.lastIndex = 0;
      if (re.test(line)) {
        violations++;
        console.error(`  STALE: ${file}:${i + 1} — ${what}\n         ${line.trim().slice(0, 160)}`);
        break;
      }
    }
  });
}

// Positive assertions: the new identity must actually be present.
function mustHave(file, needle, label) {
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch {}
  if (!text.includes(needle)) { violations++; console.error(`  MISSING NEW BRAND: ${file} — ${label} (${needle})`); }
}
mustHave('Sutra.html', '<title>Sutra</title>', 'app title');
mustHave('Sutra.html', 'aria-label="Sutra Assistant"', 'Sutra Assistant panel');
mustHave('Sutra.html', 'Powered by Sutra Intelligence', 'intelligence badge');
mustHave('HomePage.html', 'Sutra', 'landing brand');
mustHave('src/features/flow-assistant.js', 'window.sutraAssistant', 'sutraAssistant global');
mustHave('src/features/flow-intelligence.js', 'window.sutraIntelligence', 'sutraIntelligence global');

// Legacy NoteFlow Classic must remain reachable from the landing page.
mustHave('HomePage.html', 'NoteFlow Classic', 'NoteFlow Classic legacy link');

// ---- Public metadata, manifest, and exported-format identity (beta) -------
mustHave('manifest.webmanifest', '"name": "Sutra"', 'web app manifest name is Sutra');
mustHave('manifest.webmanifest', 'sutra-icon-512.png', 'manifest references Sutra icons');
mustHave('HomePage.html', 'rel="manifest"', 'landing links the web manifest');
mustHave('HomePage.html', 'og:title', 'landing has an Open Graph title');
mustHave('HomePage.html', 'twitter:card', 'landing has a Twitter card');
mustHave('Sutra.html', 'rel="manifest"', 'workspace links the web manifest');
mustHave('Sutra.html', 'property="og:title" content="Sutra"', 'workspace Open Graph title is Sutra');
mustHave('package.json', '"name": "sutra"', 'package renamed from noteflow-atelier to sutra');
mustHave('src/core/app.js', 'sutra_workspace_${datePart}.sutra', 'new workspace backup uses the .sutra extension');
mustHave('src/core/app.js', "SUTRA_JSZIP_LOCAL_PATH = 'assets/vendor/jszip/jszip.min.js'", 'JSZip vendored locally so backups work offline');

// ---- Privacy regressions: no unconditional analytics in public surfaces ---
function mustNotHave(file, needle, label) {
  let text = '';
  try { text = readFileSync(file, 'utf8'); } catch {}
  if (text.includes(needle)) { violations++; console.error(`  PRIVACY REGRESSION: ${file} — ${label} (found "${needle}")`); }
}
mustNotHave('HomePage.html', 'googletagmanager.com', 'Google Analytics must not load on the landing page');
mustNotHave('Sutra.html', 'googletagmanager.com', 'Google Analytics must not load in the workspace');
mustNotHave('HomePage.html', 'fonts.googleapis.com', 'landing page must not request remote fonts');
mustNotHave('package.json', 'noteflow-atelier', 'package name must no longer be noteflow-atelier');

if (violations) {
  console.error(`\nRebrand guard FAILED: ${violations} issue${violations === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log('Rebrand guard passed — no unexplained stale public branding; Sutra identity present.');
