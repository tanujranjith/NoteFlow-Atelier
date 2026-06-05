# Sutra — Public Beta Manual QA Checklist

This document lists the checks that **cannot** be fully proven by the automated
suite (`npm run check:all` + Playwright) and therefore require a human on real
devices/browsers before the public beta is announced.

> Legend: ☐ = to verify manually · ✅(auto) = already covered by automated tests
> (listed for context, no manual action needed).

Automated coverage already in place (run `npm run check:all && npm run test:e2e`):
- ✅(auto) Fresh startup makes **no third-party network requests**; CSP present.
- ✅(auto) IndexedDB save/verify, quota-failure banner, retry recovery, emergency `.sutra` export.
- ✅(auto) `.sutra` / JSON / legacy `.atelier` import round-trips; corrupt import refused.
- ✅(auto) Backup-folder picker: unsupported fallback, cancel, denied/revoked, handle isolation, filename sanitization.
- ✅(auto) localStorage hardening: Homework survives a storage failure (durable warning, no core banner); optional prefs fail silently; API keys never enter localStorage/exports.
- ✅(auto) Modal a11y: Export, Homework quick-add, and Review modals — dialog semantics, Tab-trap, Escape close, focus restoration, no listener growth, mobile viewport.
- ✅(auto) Deploy artifact contains only the runtime surface; live-smoke (`check:live`) asserts routes/assets/branding and a clean headless boot.

---

## 1. Device / browser matrix

For each platform: open the live URL, dismiss onboarding, create a note, add a
Homework assignment, open the Assistant, switch theme, reload, confirm the
workspace persists.

| Platform | Load | Onboarding | Notes editor | Homework | Assistant composer visible | Reload persists | Notes |
|---|---|---|---|---|---|---|---|
| ☐ iPhone Safari (latest iOS) | | | | | | | software keyboard must not cover composer |
| ☐ iPad Safari | | | | | | | split view / rotation |
| ☐ Android Chrome | | | | | | | |
| ☐ Windows Chrome | | | | | | | |
| ☐ Windows Edge | | | | | | | |
| ☐ Firefox (desktop) | | | | | | | |

## 2. Accessibility & responsive (manual)

- ☐ **Reduced motion**: OS "reduce motion" on — startup intro/animations are calm; no dead scroll space on the landing page.
- ☐ **200% browser zoom**: app and landing remain usable; no clipped controls or horizontal scroll traps.
- ☐ **Keyboard-only navigation**: Tab through Today → Notes → Homework → Settings; every control reachable; visible focus ring.
- ☐ **Screen-reader smoke** (VoiceOver or NVDA): modals announce as dialogs; the Assistant and main nav are labeled; the storage-warning banner is announced (role="alert").
- ☐ **Mobile rotation**: rotate portrait↔landscape in Notes and Today; layout reflows without losing the cursor/scroll position.
- ☐ **Software keyboard**: on iOS/Android, focusing the Assistant composer and the Notes editor keeps the input visible above the keyboard.
- ☐ **Modal focus restoration** (touch): open the Homework quick-add and a Review dialog, close, confirm focus returns sensibly (no focus lost to the page top).

## 3. Native file-system behaviors (mocks cannot prove these)

The optional default backup folder uses the **File System Access API**. Mocks in
the e2e suite simulate the handle; the following must be checked in a **real
Chromium-family browser** (Chrome/Edge desktop). Firefox/Safari/all mobile have
no directory picker and must fall back to ordinary downloads.

- ☐ **Supported browser, permission granted**: Settings ▸ Data ▸ choose a backup folder → pick a real folder → status shows "Ready". Export a `.sutra` → file appears in that folder.
- ☐ **Picker cancelled**: open the picker, press Cancel → **no** error banner; status unchanged.
- ☐ **Permission denied**: deny the folder permission prompt → clear message; export falls back to a normal download.
- ☐ **Permission revoked after reload**: choose a folder, reload, revoke permission in the browser site settings → next export re-prompts or falls back cleanly (no data-loss banner).
- ☐ **Folder cleared**: clear the folder in Settings → exports revert to normal downloads.
- ☐ **Export after reload**: choose a folder, reload, export again → handle is restored from the dedicated config store and the export writes to the folder (a permission re-prompt is acceptable).
- ☐ **Browser without directory picker** (Firefox/Safari): the "choose folder" path is hidden/disabled or explains downloads are used; export downloads normally.
- ☐ **Mobile download fallback** (iOS/Android): export triggers the OS download/share sheet; no picker is attempted.

## 4. Recovery & data safety (manual confirmation)

- ☐ **Emergency export**: with unsaved work, use the save-failure banner's "Export backup" (simulate by filling storage if feasible) → a `.sutra` downloads.
- ☐ **`.sutra` import**: import a real exported `.sutra` on a second browser/profile → notes, Homework, Review, AP Study, document backgrounds, and course attachments all restore.
- ☐ **Legacy `.atelier` import**: import an old `.atelier` backup → workspace restores; runtime-capable plugins come back **disabled / review-required**.
- ☐ **Safe Mode**: load `?sutraSafeMode=1` and legacy `?atelierSafeMode=1`, and (desktop) hold **Shift** during load → custom CSS/plugins are bypassed; data intact.
- ☐ **Storage-degraded warning**: in a private window with site data blocked, add a Homework assignment → the durable storage-warning banner appears, the change stays on screen, and the **core** save-failure banner does **not**.

## 5. First-run & existing-user

- ☐ **Fresh onboarding**: clear site data → onboarding emphasizes Notes/Today/Timeline/Homework/Review/Testing Hub; explains local-first, `.sutra` ownership, optional AI, session-only keys, Safe Mode; secondary modules opt-in.
- ☐ **Existing-user restoration**: with an existing workspace, confirm enabled-view choices and data are preserved after this release (no re-onboarding, no view reset).

## 6. Social preview & live assets

- ☐ **Social previews**: paste the production URL into X, LinkedIn, Discord, and iMessage → the Sutra title/description and 1200×630 preview image render. (Use each platform's card validator/debugger where available.)
- ☐ **Live asset resolution**: after deploy, run `SUTRA_BASE_URL=<prod-url> npm run check:live` and confirm all routes/assets/branding pass and the headless boot is clean.

---

## Known host limitation (see also docs/PRIVACY_AND_LOCAL_FIRST.md)

GitHub Pages cannot send custom HTTP response headers, so a true
`Content-Security-Policy` / `frame-ancestors 'none'` response header is **not**
available there. Sutra ships the strongest practical **meta-tag** CSP in every
HTML entry point, which covers script/style/connect/frame/img sources but
**cannot** enforce `frame-ancestors` (a header-only directive). If the public
beta needs framing protection or header-level CSP, deploy behind a host that can
send response headers (Cloudflare Pages, Netlify, or an Nginx/Caddy front) — see
the deployment notes in `docs/PRIVACY_AND_LOCAL_FIRST.md`.
