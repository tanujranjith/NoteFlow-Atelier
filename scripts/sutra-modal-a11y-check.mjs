#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const app = readFileSync('src/core/app.js', 'utf8');
const css = readFileSync('styles/sutra-pro.css', 'utf8');
const html = readFileSync('Sutra.html', 'utf8');

const required = [
  'const SutraModalManager',
  'focusableSelector',
  'aria-modal',
  'aria-labelledby',
  'handleKeydown',
  "event.key === 'Escape'",
  "event.key !== 'Tab'",
  'previousFocus',
  'sutra-modal-lock',
  'MutationObserver',
  'getListenerCount'
];

const surfaces = [
  'studentOnboardingOverlay',
  'exportOptionsModal',
  'homeworkPasteImportModal',
  'versionHistoryModal',
  'businessEntityModal',
  'googleFeedbackIframe',
  'atelierDialogBackdrop',
  'documentBackgroundModal',
  'cw-modal-overlay',
  'th2-modal-overlay'
];

let failures = 0;
for (const needle of required) {
  if (!app.includes(needle) && !css.includes(needle)) {
    console.error(`FAIL modal manager missing ${needle}`);
    failures += 1;
  }
}
for (const needle of surfaces) {
  if (!app.includes(needle) && !html.includes(needle)) {
    console.error(`FAIL modal coverage missing surface ${needle}`);
    failures += 1;
  }
}
if (!css.includes('@media (max-width: 720px)') || !css.includes('border-radius: 20px 20px 0 0')) {
  console.error('FAIL mobile bottom-sheet modal styling missing');
  failures += 1;
}

if (failures) {
  console.error(`Modal accessibility check FAILED (${failures} issue${failures === 1 ? '' : 's'}).`);
  process.exit(1);
}
console.log('Modal accessibility check passed.');
