# Sutra Architecture

_A high-level map of how Sutra is put together — the entry points, the core, the
feature modules, and how persistence, export/import, and customization wrap
around them. This is a map, not a deep dive; follow the linked docs for detail._

Sutra is a **static web app**: no backend, no build server required to run it. It
loads from static hosting or directly from a local file.

---

## 1. Entry points

- **`Sutra.html`** — the **app shell**. This is the workspace itself (renamed
  from `NoteflowAtelier.html`). It hosts the markup, pulls in the styles and
  scripts, and is where the whole application runs.
- **`HomePage.html`** — the **landing page**. The marketing / introduction
  surface, including the thread-story scrollytelling section.
- **`index.html`** — a thin **redirect** to `HomePage.html`.

> Note: **NoteFlow Classic** is a separate legacy app and is **not** Sutra.

---

## 2. Core

- **`src/core/app.js`** — the **core**, a single large script that runs in
  **global scope**. It owns the data model (`appData`), persistence and
  hydration, the export/import pipeline, the Notes editor (including Document
  Backgrounds, locked pages, Page Mode, split view), and the wiring for most
  views.

  Because `app.js` runs at global scope, top-level names share one namespace —
  worth keeping in mind when reading or extending it.

---

## 3. Feature modules

Self-contained feature areas live in **`src/features/*.js`**:

- `flow-assistant.js` — **Sutra Assistant**, the contextual chat panel and its
  Suggested Actions / Apply-Decline change cards / Assistant Activity.
- `flow-intelligence.js` — **Sutra Intelligence**, the **local** signal layer
  (`deriveStudentContext`) that reads only your workspace; calls no server.
- `homework.js` — the Homework module (its own localStorage source of truth,
  mirrored into `appData`).
- `ap-study.js` — AP Study.
- `review.js` — Review / flashcards (spaced repetition).
- `business-workspace.js` — Projects & Work.
- `handwriting.js` — handwriting / drawing support.
- `customization.js` — the customization engine (themes, CSS overrides).
- `plugin-system.js` — the plugin loader and sandbox.

See [`SUTRA_ASSISTANT.md`](./SUTRA_ASSISTANT.md) for the Assistant + Intelligence
split.

---

## 4. UI enhancers and styles

- **`src/ui/*.js`** — UI helper / enhancer modules layered on top of the core.
- **`styles/`** — the stylesheets:
  - `styles.css` — base styles.
  - `sutra-pro.css` — the "pro" layer (renamed from `atelier-pro.css`).
  - `mobile.css` — responsive / mobile.
  - `customization.css` — customization surfaces.
  - `microinteractions.css`, `macos26-redesign.css`, `settings-redesign.css` —
    interaction and visual-redesign layers.

---

## 5. The window bridge globals

Feature modules expose canonical globals on `window` so the core and other
modules (and plugins) can reach them. The **legacy aliases point at the same
objects**, so code written against the old names keeps working:

| Canonical | Legacy alias | What it is |
|---|---|---|
| `window.sutraAssistant` | `window.flowAssistant` | Sutra Assistant API |
| `window.sutraIntelligence` | `window.flowIntelligence` | Local signal layer (`deriveStudentContext`) |
| `window.getSutraAssistantContext` | `window.getFlowAssistantContext` | Current assistant context |

The persistence/export/import layer also publishes canonical wrappers on
`window` (for serialize/deserialize, save/load locally, export `.sutra`/JSON,
import, and round-trip verification).

---

## 6. Customization engine + plugin sandbox

- The **customization engine** (`customization.js`) drives themes, density,
  motion, text size, and **CSS Overrides**.
- **Plugins** (`plugin-system.js`) are **local bundles only** — there is no
  marketplace. They run **sandboxed in an iframe** with an explicit permission
  allowlist, install **disabled**, and are **reviewed before they run** (review
  is forced on import). Export extension **`.sutra-plugin`**; legacy
  **`.atelier-plugin`** still imports.
- **Safe Mode** (`?sutraSafeMode=1`, legacy `?atelierSafeMode=1`, or hold
  **Shift** on load) **skips custom CSS and plugins** and **never deletes** data,
  CSS, plugins, or workspace — the safe way to recover from a bad customization.

---

## 7. How persistence, export, and import wrap together

At a glance (full detail in [`DATA_AND_BACKUPS.md`](./DATA_AND_BACKUPS.md)):

- **One workspace object** (`appData`) is the in-memory truth; it persists to
  **IndexedDB** (`noteflow_atelier_db`). Course-file binaries persist separately
  to `noteflow_attachments_db`; homework mirrors to localStorage.
- **One hydrate path** merges stored data over defaults and normalizes it on
  load; **one debounced save path** (with a lifecycle flush) writes it back.
- **One persistence-health pipeline** wraps core saves, localStorage mirrors,
  IndexedDB transactions, attachment cache warming, imports, backups, and
  emergency exports. It records the last confirmed save, classifies quota /
  serialization / transaction / attachment / partial-write failures, preserves
  unsaved in-memory state, and drives the non-dismissible save-failure banner
  plus the Settings -> Data -> Storage Health panel.
- **One serializer/deserializer pair** drives both backup formats: **`.sutra`**
  (a ZIP of `manifest.json` / `workspace.json` / `assets/` / `metadata/` with
  checksums) and **JSON** (assets inlined, no zip dependency). JSZip is vendored
  locally under `assets/vendor/jszip/` for core `.sutra` exports/imports.
- **Inline assets** — note images and **Document Backgrounds** — are extracted to
  `assets/` on `.sutra` export and rehydrated on import; **secrets are stripped**
  from every export.
- **Legacy `.atelier`** backups import through the same package importer.

Storage names like `noteflow_atelier_db` are **legacy-named compatibility
identifiers**, kept so existing installs keep working.

For the broader privacy stance, see
[`PRIVACY_AND_LOCAL_FIRST.md`](./PRIVACY_AND_LOCAL_FIRST.md).

---

## 8. Security and network policy

- `index.html`, `HomePage.html`, and `Sutra.html` ship CSP meta tags with
  explicit `script-src`, `connect-src`, `frame-src`, `form-action`, `img-src`,
  `media-src`, `worker-src`, and `object-src 'none'` coverage.
- The local static server used by Playwright adds the same CSP plus
  `frame-ancestors 'none'`. Production static hosts must set that directive as
  an HTTP response header because browsers ignore it in CSP meta tags.
- Fresh startup, core `.sutra` backup, and JSON backup should make zero
  third-party requests. Remaining remote paths are user-triggered and limited to
  configured AI providers, localhost/127.0.0.1 local endpoints, approved
  feedback/media embeds, AP Classroom/resource/help links, ChatGPT/Spotify
  shortcuts, and disclosed optional secondary import/export helpers.
- Custom CSS and local plugins remain local-first. Plugins run in sandboxed
  iframes with an explicit allowlist and are re-reviewed after import.

---

## 9. Test scripts

Run with Node from the project root:

- `npm run check:csp` - static CSP and hosting-header guard.
- `npm run check:persistence` - centralized persistence-health guard.
- `npm run check:modal` - modal accessibility primitive guard.
- `npm run check:network` - approved-origin and startup-network guard.
- `npm run test:e2e` - Chromium, Firefox, and WebKit Playwright matrix for
  persistence, CSP, modal keyboard, reduced-motion, offline-startup, and
  backup/export regressions.

- `node scripts/smoke-check.mjs` — core invariants.
- `node scripts/round-trip-check.mjs` — save/export/import field parity, secret
  redaction, the localStorage allow-list, and the cache-warming guards.
- `node scripts/version-history-check.mjs` — version-history invariants.
- `node scripts/sutra-docbg-check.mjs` — Document Background checks.
- `node scripts/sutra-rebrand-check.mjs` — rebrand guard.
- `node scripts/sutra-responsive-check.mjs` — responsive guard.
- `node --check <file>` — syntax-check each `src` JS file.

Browser QA harness: `scripts/sutra-persistence-qa.js` — paste into the console on
`Sutra.html` and run the round-trip (non-destructive, or full wipe→import). See
[`sutra-save-systems-audit.md`](./sutra-save-systems-audit.md).

---

## 10. Where to go next

| Topic | Doc |
|---|---|
| Assistant + local Intelligence | [`SUTRA_ASSISTANT.md`](./SUTRA_ASSISTANT.md) |
| Document Backgrounds | [`DOCUMENT_BACKGROUNDS.md`](./DOCUMENT_BACKGROUNDS.md) |
| Privacy / local-first | [`PRIVACY_AND_LOCAL_FIRST.md`](./PRIVACY_AND_LOCAL_FIRST.md) |
| Data + backups | [`DATA_AND_BACKUPS.md`](./DATA_AND_BACKUPS.md) |
| Verified persistence audit | [`sutra-save-systems-audit.md`](./sutra-save-systems-audit.md) |
