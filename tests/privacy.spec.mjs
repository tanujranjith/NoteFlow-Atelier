// Privacy / local-first guarantees (Phase 2 + Phase 3D).
// These tests fail loudly if Sutra makes a hidden third-party request on load,
// if the feedback embed accepts an unapproved URL, or if startup audio is on by
// default.
import { test, expect } from '@playwright/test';
import { APP, LANDING, collectRequests, thirdPartyHits, bootApp } from './helpers.mjs';

test.describe('No third-party requests on load', () => {
  test('landing page contacts no analytics / font CDNs and has no CSP violations', async ({ page }) => {
    const { urls } = collectRequests(page);
    const cspErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /content security policy/i.test(msg.text())) cspErrors.push(msg.text());
    });
    await page.goto(LANDING, { waitUntil: 'networkidle' });
    expect(thirdPartyHits(urls), `unexpected third-party requests:\n${thirdPartyHits(urls).join('\n')}`).toEqual([]);
    expect(cspErrors, `CSP violations on landing:\n${cspErrors.join('\n')}`).toEqual([]);
    await expect(page).toHaveTitle(/Sutra/i);
    // The ambient canvas inline script must still run under the CSP.
    await expect(page.locator('#ambient-canvas')).toBeVisible();
  });

  test('workspace shell contacts no analytics / font CDNs on load', async ({ page }) => {
    const { urls } = collectRequests(page);
    await bootApp(page);
    await page.waitForLoadState('networkidle');
    expect(thirdPartyHits(urls), `unexpected third-party requests:\n${thirdPartyHits(urls).join('\n')}`).toEqual([]);
  });
});

test.describe('Feedback iframe allowlist (Phase 2C)', () => {
  test('only official Google Forms URLs are accepted', async ({ page }) => {
    await bootApp(page);
    const verdicts = await page.evaluate(() => {
      const f = window.isAllowedFeedbackUrl;
      const cases = {
        validForm: 'https://docs.google.com/forms/d/e/1FAIpQLSc2ZeWlDsgtLCNRTFskWx0tJrah6dS21t-xSGsGDQvekehPNQ/viewform?embedded=true',
        validShort: 'https://forms.gle/abc123',
        evilHost: 'https://evil.example.com/phish',
        httpForm: 'http://docs.google.com/forms/d/e/abc/viewform',
        fakeSubdomain: 'https://docs.google.com.evil.com/forms/x',
        pathTrick: 'https://evil.com/docs.google.com/forms/x',
        nonFormGoogle: 'https://docs.google.com/document/d/x/edit',
        javascript: 'javascript:alert(1)',
        dataUri: 'data:text/html,<script>alert(1)</script>',
        empty: ''
      };
      const out = {};
      for (const [k, v] of Object.entries(cases)) out[k] = !!(typeof f === 'function' && f(v));
      return out;
    });
    expect(verdicts.validForm).toBe(true);
    expect(verdicts.validShort).toBe(true);
    expect(verdicts.evilHost).toBe(false);
    expect(verdicts.httpForm).toBe(false);
    expect(verdicts.fakeSubdomain).toBe(false);
    expect(verdicts.pathTrick).toBe(false);
    expect(verdicts.nonFormGoogle).toBe(false);
    expect(verdicts.javascript).toBe(false);
    expect(verdicts.dataUri).toBe(false);
    expect(verdicts.empty).toBe(false);
  });

  test('feedback iframe is not loaded until the modal opens', async ({ page }) => {
    await bootApp(page);
    const srcBefore = await page.locator('#googleFeedbackIframe').getAttribute('src');
    expect(srcBefore == null || srcBefore === '').toBeTruthy();
  });
});

test.describe('Startup sound is opt-in (Phase 3D)', () => {
  test('fresh profile does not enable the startup chime', async ({ page }) => {
    await bootApp(page);
    const state = await page.evaluate(() => ({
      flag: localStorage.getItem('sutra_startup_sound'),
      hasIntro: !!(window.SutraStartupIntro && typeof window.SutraStartupIntro.testSound === 'function')
    }));
    // Default must not be the explicit "on" value.
    expect(state.flag).not.toBe('1');
    expect(state.hasIntro).toBe(true);
  });
});

test.describe('Editorial web fonts are opt-in (Phase 2B)', () => {
  test('no web-font stylesheet until enabled, then injected on opt-in', async ({ page }) => {
    await bootApp(page);
    const before = await page.evaluate(() => ({
      enabled: window.SutraWebFonts ? window.SutraWebFonts.isEnabled() : null,
      linkPresent: !!document.getElementById('sutra-web-fonts')
    }));
    expect(before.enabled).toBe(false);
    expect(before.linkPresent).toBe(false);

    const after = await page.evaluate(() => {
      window.SutraWebFonts.enable();
      const link = document.getElementById('sutra-web-fonts');
      return { enabled: window.SutraWebFonts.isEnabled(), href: link ? link.href : null };
    });
    expect(after.enabled).toBe(true);
    expect(after.href).toContain('fonts.googleapis.com');
  });
});
