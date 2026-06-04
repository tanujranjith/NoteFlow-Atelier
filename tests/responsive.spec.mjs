// Responsive shell sanity across phone / tablet / laptop / desktop (Phase 13).
// Confirms the workspace boots and does not overflow horizontally at each class.
import { test, expect } from '@playwright/test';
import { bootApp } from './helpers.mjs';

const VIEWPORTS = [
  { name: 'phone-375', width: 375, height: 812 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1366', width: 1366, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
];

for (const vp of VIEWPORTS) {
  test(`workspace renders without horizontal overflow @ ${vp.name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await bootApp(page);

    // App shell is present.
    await expect(page.locator('body')).toBeVisible();

    // No significant horizontal scrollbar (allow a small rounding tolerance).
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `horizontal overflow ${overflow}px @ ${vp.width}px`).toBeLessThanOrEqual(4);

    expect(errors, errors.join('\n')).toEqual([]);
    await context.close();
  });
}
