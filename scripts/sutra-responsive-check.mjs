#!/usr/bin/env node
// sutra-responsive-check.mjs — guard the mobile/responsive contract.
//
// Static checks that the responsive hooks every Sutra surface depends on are
// present: viewport metas, a mobile stylesheet with media queries, reduced-motion
// fallbacks, and the new-feature mobile rules (Sutra Assistant badge, document-
// background controls, the scrollytelling vertical-thread fallback). Static
// checks can't prove pixel layout, but they catch a desktop-only regression
// (a new component shipped with no mobile handling) before release.
//
// Run: node scripts/sutra-responsive-check.mjs
import { readFileSync } from 'node:fs';

let failures = 0;
function read(file) { try { return readFileSync(file, 'utf8'); } catch { return null; } }
function has(file, needle, label, re = false) {
  const text = read(file);
  if (text == null) { failures++; console.error('  MISSING FILE:', file); return; }
  const ok = re ? needle.test(text) : text.includes(needle);
  if (ok) console.log('  ok:', label);
  else { failures++; console.error(`  FAIL: ${label} — not found in ${file}`); }
}
function count(file, re) { const t = read(file) || ''; return (t.match(re) || []).length; }

console.log('Viewport + base responsive plumbing');
has('Sutra.html', 'name="viewport"', 'app shell has a viewport meta');
has('Sutra.html', 'width=device-width', 'app shell viewport scales to device width');
has('HomePage.html', 'width=device-width', 'landing viewport scales to device width');

console.log('\nMobile stylesheet');
has('Sutra.html', 'styles/mobile.css', 'mobile stylesheet linked in the app shell');
const mq = count('styles/mobile.css', /@media[^{]*max-width/gi);
if (mq >= 10) console.log(`  ok: mobile.css has ${mq} max-width media queries`);
else { failures++; console.error(`  FAIL: mobile.css has too few media queries (${mq})`); }

console.log('\nReduced motion + responsive math');
has('HomePage.html', 'prefers-reduced-motion', 'landing respects reduced motion');
has('Sutra.html', 'prefers-reduced-motion', 'app shell respects reduced motion (doc-bg + badge)');
has('HomePage.html', 'clamp(', 'landing uses fluid type/space (clamp)');

console.log('\nNew-feature mobile rules');
// Powered by Sutra Intelligence badge — compact on small screens.
has('Sutra.html', '@media (max-width:560px)', 'Sutra Intelligence badge has a mobile breakpoint', false);
has('Sutra.html', '.sutra-intel-badge', 'assistant intelligence badge styles present');
// Document-background controls — stack/expand under 520px.
has('Sutra.html', '@media (max-width:520px)', 'document-background controls have a mobile breakpoint', false);
has('Sutra.html', 'width:min(440px,94vw)', 'document-background modal is viewport-bounded (min())', false);
has('Sutra.html', 'max-height:90vh;overflow-y:auto', 'document-background modal scrolls internally on short screens', false);
// Scrollytelling — simplified vertical thread on phones.
has('HomePage.html', '.problem-cluster::before', 'scrollytelling has a mobile vertical-thread fallback');
has('HomePage.html', /@media \(max-width: 760px\)[\s\S]*sutra-thread-svg \{ display: none/, 'desktop SVG thread is hidden on phones', true);
// Assistant panel responsiveness (existing).
has('styles/mobile.css', 'chatbot-panel', 'Sutra Assistant panel has mobile styles');

console.log('\nTouch-target + overflow hygiene (new controls)');
has('Sutra.html', 'min-height:44px', 'document-background buttons meet the 44px touch target', false);
has('Sutra.html', 'flex-wrap:wrap', 'document-background action rows wrap rather than overflow', false);

if (failures) { console.error(`\nResponsive guard FAILED: ${failures} issue${failures === 1 ? '' : 's'}.`); process.exit(1); }
console.log('\nResponsive guard passed — required mobile hooks present.');
