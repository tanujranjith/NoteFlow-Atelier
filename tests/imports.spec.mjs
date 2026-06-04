// Import safety + backward compatibility (Phase 1B + Phase 5B).
// A failed/hostile import must never wipe the live workspace, and legacy
// .atelier backups must still restore.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { bootApp, dismissOnboarding, wipeAllStorage } from './helpers.mjs';

const READY = () => typeof window.verifyWorkspaceRoundTrip === 'function';
async function waitReady(page) { await page.waitForFunction(READY, null, { timeout: 20000 }); }

async function createNote(page, title) {
  await page.evaluate(() => window.createNewPage());
  await page.locator('#newPageModal.active').waitFor({ state: 'visible', timeout: 8000 });
  await page.fill('#newPageName', title);
  await page.evaluate(() => window.confirmNewPage());
  await page.locator('#newPageModal.active').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  await page.evaluate(async () => { if (typeof window.flushAppSaveNow === 'function') await window.flushAppSaveNow(); });
  await page.waitForTimeout(400);
}

test('a corrupt .sutra import is rejected without wiping the live workspace', async ({ page }) => {
  await bootApp(page);
  const title = 'Survives Bad Import ' + Date.now();
  await createNote(page, title);
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();

  // Feed garbage bytes with a .sutra name — importAtelierPackage must throw,
  // be caught, and leave existing data untouched.
  await page.evaluate(async () => {
    const junk = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const file = new File([junk], 'corrupt.sutra', { type: 'application/octet-stream' });
    await window.importWorkspaceFile(file);
  });
  await page.waitForTimeout(800);

  // The note must still be present (no partial overwrite).
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();

  // Reload to confirm nothing was corrupted on disk either.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOnboarding(page);
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 10000 });
});

test('malformed JSON import does not crash the app', async ({ page }) => {
  await bootApp(page);
  const title = 'JSON Guard ' + Date.now();
  await createNote(page, title);

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.evaluate(async () => {
    const file = new File(['{ this is not: valid json ]['], 'broken.json', { type: 'application/json' });
    await window.importWorkspaceFile(file);
  });
  await page.waitForTimeout(800);

  // No uncaught exception, and existing data preserved.
  expect(errors, errors.join('\n')).toEqual([]);
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
});

test('legacy .atelier backup still imports (backward compatibility)', async ({ page }) => {
  await bootApp(page);
  const title = 'Legacy Atelier ' + Date.now();
  await createNote(page, title);

  // Export the modern package, then re-feed the SAME bytes with the legacy
  // .atelier extension to prove the importer still routes it.
  const dl = page.waitForEvent('download', { timeout: 20000 });
  await page.evaluate(() => window.exportWorkspaceAsAtelier());
  const download = await dl;
  const b64 = readFileSync(await download.path()).toString('base64');

  await wipeAllStorage(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOnboarding(page);
  await expect(page.getByText(title, { exact: false })).toHaveCount(0);

  await page.evaluate(async (data) => {
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
    const file = new File([arr], 'legacy-workspace.atelier', { type: 'application/octet-stream' });
    await window.importWorkspaceFile(file);
  }, b64);
  await page.waitForTimeout(1200);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOnboarding(page);
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 10000 });
});
