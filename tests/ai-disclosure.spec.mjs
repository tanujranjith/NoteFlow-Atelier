// AI privacy disclosure gate + accessible modal primitive (Phase 2D + 4B).
import { test, expect } from '@playwright/test';
import { bootApp } from './helpers.mjs';

const overlay = '.sutra-modal-overlay [role="dialog"]';

test('first remote send shows a disclosure that lists what is sent', async ({ page }) => {
  await bootApp(page);
  expect(await page.evaluate(() => localStorage.getItem('sutra_ai_send_ack_v1'))).not.toBe('1');

  const pending = page.evaluate(() => window.ensureAiSendDisclosure({ providerLabel: 'OpenAI-compatible', model: 'gpt-test-1' }));
  await expect(page.locator(overlay)).toBeVisible();
  await expect(page.locator(overlay)).toContainText(/remote AI provider/i);
  await expect(page.locator(overlay)).toContainText(/session storage/i);
  await expect(page.locator(overlay)).toContainText(/context depth/i);
  await expect(page.locator(overlay)).toContainText('gpt-test-1');

  // Dialog semantics + focus moved into the modal.
  await expect(page.locator(overlay)).toHaveAttribute('aria-modal', 'true');

  // Escape cancels (resolves false) and closes — accessible-modal behavior.
  await page.keyboard.press('Escape');
  expect(await pending).toBe(false);
  await expect(page.locator('.sutra-modal-overlay')).toHaveCount(0);
});

test('cancel does not acknowledge; acknowledge persists and suppresses re-prompt', async ({ page }) => {
  await bootApp(page);

  // Cancel button → false, no ack stored.
  const p1 = page.evaluate(() => window.ensureAiSendDisclosure({ providerLabel: 'X', model: 'm' }));
  await expect(page.locator(overlay)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect(await p1).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('sutra_ai_send_ack_v1'))).not.toBe('1');

  // Acknowledge → true, ack persisted.
  const p2 = page.evaluate(() => window.ensureAiSendDisclosure({ providerLabel: 'X', model: 'm' }));
  await expect(page.locator(overlay)).toBeVisible();
  await page.getByRole('button', { name: /Send & don.t ask again/i }).click();
  expect(await p2).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('sutra_ai_send_ack_v1'))).toBe('1');

  // Subsequent calls resolve true immediately with no modal.
  const r3 = await page.evaluate(() => window.ensureAiSendDisclosure({ providerLabel: 'X', model: 'm' }));
  expect(r3).toBe(true);
  await expect(page.locator('.sutra-modal-overlay')).toHaveCount(0);
});
