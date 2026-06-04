// Data-safety: persistence + offline .sutra backup round-trip (Phase 1).
// The brief's #1 priority — a user must not lose data. These tests exercise the
// real IndexedDB-backed save path, a page reload (cold cache), and a full
// export -> wipe -> import cycle with NO network (proving JSZip is vendored).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { bootApp, dismissOnboarding, wipeAllStorage } from './helpers.mjs';

const READY = () => typeof window.verifyWorkspaceRoundTrip === 'function';

async function waitReady(page) {
  await page.waitForFunction(READY, null, { timeout: 20000 });
}

// Create a note through the real New Page modal (global functions are exposed
// because app.js runs at script scope and is driven by inline onclicks).
async function createNote(page, title) {
  await page.evaluate(() => window.createNewPage());
  await page.locator('#newPageModal.active').waitFor({ state: 'visible', timeout: 8000 });
  await page.fill('#newPageName', title);
  await page.evaluate(() => window.confirmNewPage());
  await page.locator('#newPageModal.active').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  // Let the debounced IndexedDB save settle.
  await page.evaluate(async () => { if (typeof window.flushAppSaveNow === 'function') await window.flushAppSaveNow(); });
  await page.waitForTimeout(500);
}

test('a note survives a page reload (IndexedDB persistence)', async ({ page }) => {
  await bootApp(page);
  const title = 'Reload Survivor ' + Date.now();
  await createNote(page, title);
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOnboarding(page);

  await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 10000 });
});

test('verifyWorkspaceRoundTrip passes with real data present', async ({ page }) => {
  await bootApp(page);
  await createNote(page, 'Round Trip Note ' + Date.now());
  const result = await page.evaluate(() => window.verifyWorkspaceRoundTrip({ verbose: false }));
  expect(result.ok, result.summary).toBe(true);
  expect(result.missingFields).toEqual([]);
});

test('full .sutra backup → wipe → restore works offline', async ({ page, context }) => {
  // Hard-fail if any request escapes to a CDN during export/import — the whole
  // point of vendoring JSZip is that backup/restore is fully offline.
  const offenders = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/cdnjs|jsdelivr|unpkg|googleapis|gstatic|googletagmanager/.test(u)) offenders.push(u);
  });

  await bootApp(page);
  const title = 'Backup Subject ' + Date.now();
  await createNote(page, title);

  // Export — capture the generated .sutra download.
  const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.evaluate(() => window.exportWorkspaceAsAtelier());
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.sutra$/);
  const filePath = await download.path();
  const b64 = readFileSync(filePath).toString('base64');
  expect(b64.length).toBeGreaterThan(100);

  // Wipe everything and confirm the workspace is empty after reload.
  await wipeAllStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOnboarding(page);
  await expect(page.getByText(title, { exact: false })).toHaveCount(0);

  // Import the backup file (constructed in-page from the captured bytes).
  await page.evaluate(async (data) => {
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
    const file = new File([arr], 'backup.sutra', { type: 'application/octet-stream' });
    await window.importWorkspaceFile(file);
  }, b64);
  await page.waitForTimeout(1500);

  // Reload to prove the restored data persisted, not just lived in memory.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOnboarding(page);
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 10000 });

  expect(offenders, `network escaped during offline backup:\n${offenders.join('\n')}`).toEqual([]);
});
