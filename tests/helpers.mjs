// Shared helpers for Sutra release-gate browser tests.
import { expect } from '@playwright/test';

export const APP = '/Sutra.html';
export const LANDING = '/HomePage.html';
export const ROOT = '/index.html';

// Third-party hosts that must NOT be contacted on a plain page load. Sutra is
// local-first: analytics + web fonts were removed / made opt-in, so a fresh
// load should reach none of these.
export const FORBIDDEN_ON_LOAD = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com'
];

// Attach a request collector. Returns { urls } that fills as requests fire.
export function collectRequests(page) {
  const urls = [];
  page.on('request', (req) => urls.push(req.url()));
  return { urls };
}

export function thirdPartyHits(urls) {
  return urls.filter((u) => FORBIDDEN_ON_LOAD.some((h) => u.includes(h)));
}

// Boot the workspace and deterministically get past onboarding. A fresh
// profile shows the unified onboarding overlay ~600ms after load; we click
// "Skip setup" if it appears, otherwise continue.
export async function bootApp(page) {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  // app.js exposes these once initialization completes.
  await page.waitForFunction(() => typeof window.verifyWorkspaceRoundTrip === 'function', null, { timeout: 20000 });
  await dismissOnboarding(page);
  return page;
}

export async function dismissOnboarding(page) {
  const skip = page.locator('#onboardingSkipBtn');
  try {
    await skip.waitFor({ state: 'visible', timeout: 2500 });
    await skip.click();
    // overlay animates out
    await page.waitForTimeout(300);
  } catch {
    // Onboarding not shown (already completed in this context) — fine.
  }
}

// Wipe every Sutra persistence surface: localStorage, sessionStorage, and the
// two IndexedDB databases (main workspace + course attachments).
export async function wipeAllStorage(page) {
  await page.evaluate(async () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    const dbs = ['noteflow_atelier_db', 'noteflow_attachments_db'];
    await Promise.all(dbs.map((name) => new Promise((res) => {
      try {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = req.onerror = req.onblocked = () => res(true);
      } catch { res(true); }
    })));
  });
}

// Read the primary workspace record straight from IndexedDB (the source of
// truth) without depending on in-memory app state.
export async function readWorkspaceFromIDB(page) {
  return page.evaluate(async () => {
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (!settled) { settled = true; resolve(v); } };
      try {
        const open = indexedDB.open('noteflow_atelier_db');
        open.onerror = () => done(null);
        open.onsuccess = () => {
          const db = open.result;
          let store;
          try { store = db.objectStoreNames[0]; } catch { return done(null); }
          if (!store) return done(null);
          const tx = db.transaction(store, 'readonly');
          const all = tx.objectStore(store).getAll();
          all.onsuccess = () => done(all.result);
          all.onerror = () => done(null);
        };
      } catch { done(null); }
    });
  });
}

export { expect };
