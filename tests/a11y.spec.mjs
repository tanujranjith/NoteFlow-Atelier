// Accessibility basics for high-impact dialogs + reduced motion (Phase 4B/15).
import { test, expect } from '@playwright/test';
import { bootApp } from './helpers.mjs';

test('feedback modal has dialog semantics, a disclosure, and closes on Escape', async ({ page }) => {
  await bootApp(page);

  // The modal markup is present with correct dialog semantics.
  const card = page.locator('#googleFeedbackModal .google-feedback-card');
  await expect(card).toHaveAttribute('role', 'dialog');
  await expect(card).toHaveAttribute('aria-modal', 'true');

  // Open via the exposed control and confirm the external-form disclosure shows.
  await page.evaluate(() => window.openGoogleFeedbackModal());
  await expect(page.locator('#googleFeedbackModal')).toBeVisible();
  await expect(page.locator('.google-feedback-disclosure')).toContainText(/Google Forms/i);

  // The iframe src must be an approved Google Forms URL (allowlist).
  const src = await page.locator('#googleFeedbackIframe').getAttribute('src');
  expect(src || '').toMatch(/^https:\/\/docs\.google\.com\/forms\//);

  // Escape closes it.
  await page.keyboard.press('Escape');
  await expect(page.locator('#googleFeedbackModal')).toBeHidden();
});

test('new-page modal opens from its button and Escape returns focus to the trigger', async ({ page }) => {
  await bootApp(page);
  const trigger = page.locator('.new-page-btn').first();
  await trigger.click();
  await expect(page.locator('#newPageModal')).toHaveClass(/active/);

  await page.keyboard.press('Escape');
  await expect(page.locator('#newPageModal')).not.toHaveClass(/active/);
});

test('app boots under prefers-reduced-motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await bootApp(page);
  expect(errors, errors.join('\n')).toEqual([]);
  // The startup chime must stay silent regardless under reduced motion.
  const flag = await page.evaluate(() => localStorage.getItem('sutra_startup_sound'));
  expect(flag).not.toBe('1');
  await context.close();
});
