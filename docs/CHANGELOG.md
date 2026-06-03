# Changelog

All notable changes to this project are recorded here. Dates use `YYYY-MM`.

---

## 2026-06 — Rebrand to Sutra + document backgrounds

The app formerly released as **NoteFlow Atelier** is now **Sutra** — a private, local-first workspace for students. This release is a full rebrand plus a new per-document background feature, refreshed AI naming, and a redesigned landing page. **Existing data loads automatically and old backups still import.** See [Rebrand & Compatibility](REBRAND_AND_COMPATIBILITY.md) for the full migration detail.

### Rebrand

- **Full rebrand** from NoteFlow Atelier to **Sutra** across the app shell, landing page, and documentation. Tagline: *Your academic life, woven into one private workspace.* (*Sutra* = Sanskrit for a thread.)
- **NoteFlow Classic** remains a separate legacy app and is unaffected by the rebrand.
- Internal storage identifiers (`noteflow_atelier_db`, `noteflow_attachments_db`, `hwCourses:v2`, `hwTasks:v2`) are **intentionally retained** as legacy-named compatibility identifiers so existing browser data keeps loading with no migration step.

### Backup & plugin formats

- **`.sutra`** is the new **default** backup format — a ZIP package (`manifest.json`, `workspace.json`, `assets/*`, `metadata/export-summary.json`, `metadata/checksums.json`) identified by a `{ "product": "Sutra", "format": "sutra-workspace", "formatVersion": 1, "legacyCompatible": true }` manifest. Export filename: `sutra_workspace_<YYYY-MM-DD>.sutra`.
- **Legacy `.atelier` backups still import.** The validator accepts both `sutra-workspace` and legacy `noteflow_atelier_project` manifests, and the dispatcher routes both `.sutra` and `.atelier` to the same package importer.
- **`.sutra-plugin`** is the new plugin export extension; legacy **`.atelier-plugin`** bundles still import. Plugins remain local-only, sandboxed, install disabled, and reviewed before they run.
- API keys, provider credentials, and tokens are still **never exported** (sessionStorage only).

### Sutra Assistant + Sutra Intelligence

- **Flow Assistant → Sutra Assistant** (the contextual chat panel) and **Flow Intelligence → Sutra Intelligence** (the local `deriveStudentContext` signal layer that reads only your workspace).
- New **Powered by Sutra Intelligence** badge under the panel header, subtitle *"Local signals from your workspace,"* with a stable `data-sutra-component="assistant-intelligence-badge"` hook and an explanatory tooltip/aria-label.
- Canonical window globals are now **`sutraAssistant`** / **`sutraIntelligence`**; legacy **`flowAssistant`** / **`flowIntelligence`** are retained.
- Activity-log key **`flow:activityLog:v1` → `sutra:activityLog:v1`**, migrated automatically.
- Added a **Custom OpenAI-Compatible Endpoint** (Local endpoint) provider option alongside OpenAI, Anthropic Claude, Google Gemini, Groq, and OpenRouter.

### Per-document backgrounds (Notes)

- New **Document Background** feature: a per-page background image set from the Notes editor toolbar.
- Controls: Upload / Replace / Remove, preview thumbnail + filename, **Background Blur** slider (0–32 px, default 0), **Dim Background** slider (0–80%, default 25%), Reset to Default, and Done. Keyboard- and touch-accessible; controls stack under 520 px.
- Formats `.png` / `.jpg` / `.jpeg` / `.webp`; MIME + size validated; **max 6 MB**; images over 2048 px on the longest side auto-downscale (failing safe to the original). Corrupt / zero-byte / non-image files are rejected non-destructively with a toast.
- Stored as a data URL on `page.documentBackground` (same model as inline note images), so it rides existing persistence, `.sutra`/`.atelier` package export (via recursive inline-asset extraction → packaged `assets/` file with checksum), and JSON export/import — no separate blob lifecycle.
- Renders on a dedicated layer behind the note surface; the dim overlay tints toward the editor surface color so text stays readable in light, dark, and custom themes, and blur applies only to the image. Works in the standard editor, Page Mode, split view, on mobile/tablet, and under custom CSS. Duplicating a page copies its background. **Locked pages never show their background behind the PIN screen.** Survives refresh, close/reopen, page duplication, and `.sutra` export → wipe → restore.

### Landing page

- New **thread scrollytelling** section after the hero: scattered workflow fragments (Notes, Assignments, Timeline, Tasks, Deadline Radar, Review, AP Study, Focus) are connected by a single continuous animated SVG thread that settles into the Sutra dashboard reveal.
- Respects `prefers-reduced-motion` (shows the final connected state, no pinned dead zones) and works with JavaScript disabled (final state visible). Mobile uses a simplified vertical thread.

### Naming map (applied this release)

| Old | New |
| --- | --- |
| Daily Brief | Daily Thread |
| Plan My Day | Shape My Day |
| Next Best Action | Next Step |
| Workspace Modes | Sutra Modes |
| Standard mode | All Tools |
| Business / Freelancer | Projects & Work |
| Flow Assistant | Sutra Assistant |
| Ask Flow | Ask Sutra |
| Flow Intelligence | Sutra Intelligence |
| Flow Activity Log | Assistant Activity |
| Context depth | Workspace Access |
| Stateless / Stateful | Single Request / Conversation Memory |
| Mods & Customization | Customization |
| Progress & Analytics | Momentum |
| Local Data Health | Workspace Health |
| Last export / Last import | Last Backup / Last Restore |
| Student Setup | Sutra Setup |
| Rerun Student Setup | Restart Sutra Setup |
| Homework Paste Import | Import from School Portal |

Workspace Access levels are **Current Screen Only / Current Area / Full Workspace Context**.

### File renames

| Old | New |
| --- | --- |
| `NoteflowAtelier.html` | `Sutra.html` |
| `styles/atelier-pro.css` | `styles/sutra-pro.css` |
| `scripts/atelier-persistence-qa.js` | `scripts/sutra-persistence-qa.js` |
| `docs/atelier-save-systems-audit.md` | `docs/sutra-save-systems-audit.md` |

### Compatibility (still works)

- Legacy `.atelier` and `.atelier-plugin` imports.
- Legacy Safe Mode parameter `?atelierSafeMode=1` (canonical is now `?sutraSafeMode=1`).
- Legacy window globals `flowAssistant` / `flowIntelligence`.

### Tests / guards

- New Node guards: `scripts/sutra-docbg-check.mjs` (document-background data model + export), `scripts/sutra-rebrand-check.mjs` (rebrand naming/format guard), and `scripts/sutra-responsive-check.mjs` (responsive guard), alongside the existing `scripts/smoke-check.mjs`, `scripts/round-trip-check.mjs`, and `scripts/version-history-check.mjs`. A `node --check` syntax pass runs over each `src` JS file. Browser QA harness renamed to `scripts/sutra-persistence-qa.js`.

> **Upgrade note:** the rebrand is non-destructive and your data loads automatically, but export a backup before upgrading anyway. See [Rebrand & Compatibility → Before you upgrade](REBRAND_AND_COMPATIBILITY.md#before-you-upgrade).
