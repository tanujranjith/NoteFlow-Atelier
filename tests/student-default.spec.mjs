// Student-first default navigation + recommended setup (Phase 3A/3B).
import { test, expect } from '@playwright/test';
import { bootApp } from './helpers.mjs';

const tabHidden = (page, view) =>
  page.locator(`.view-tab[data-view="${view}"]`).first().evaluate((el) => el.hidden);

test('fresh install defaults to the focused student set (Business/Life/College hidden)', async ({ page }) => {
  await bootApp(page);

  // Core academic tabs are enabled.
  for (const v of ['today', 'timeline', 'notes', 'homework']) {
    expect(await tabHidden(page, v), `${v} should be visible by default`).toBe(false);
  }
  // Optional modules are hidden by default (data is never deleted — just hidden).
  for (const v of ['business', 'life', 'collegeapp']) {
    expect(await tabHidden(page, v), `${v} should be hidden by default`).toBe(true);
  }
});

test('"recommended student setup" resets optional modules back to hidden', async ({ page }) => {
  await bootApp(page);

  // Turn Business on…
  await page.evaluate(() => window.setFeatureViewEnabled && window.setFeatureViewEnabled('business', true));
  expect(await tabHidden(page, 'business')).toBe(false);

  // …then apply the recommended setup and confirm it is hidden again.
  await page.evaluate(() => window.applyRecommendedStudentSetup());
  expect(await tabHidden(page, 'business')).toBe(true);
  // Core tabs remain.
  expect(await tabHidden(page, 'notes')).toBe(false);
});
