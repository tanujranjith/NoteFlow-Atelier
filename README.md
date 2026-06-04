# Sutra

**Your academic life, woven into one private workspace.**
*One workspace. Every thread.*

Sutra is a private, **local-first workspace for students**. It brings structured notes, homework, AP exam prep, college applications, spaced-repetition review, focus tools, calendar planning, and life and work trackers behind one calm interface â€” with **no backend, no required account, no telemetry, and no cloud sync**.

If you can open an HTML file, you can run Sutra.

> Eyebrow: `PRIVATE Â· LOCAL-FIRST Â· STUDENT-BUILT`. Built by Tanuj Ranjith.
>
> Sutra was previously released as **NoteFlow Atelier**. It is the same workspace, rebranded. Your existing data loads automatically â€” see [Rebrand & Compatibility](docs/REBRAND_AND_COMPATIBILITY.md). **NoteFlow Classic** is a *separate* legacy app and is not Sutra.

## Table of Contents

1. [What Sutra Is](#what-sutra-is)
2. [Who It's For](#who-its-for)
3. [Why the Name Sutra](#why-the-name-sutra)
4. [Local-First Philosophy](#local-first-philosophy)
5. [Quick Start](#quick-start)
6. [Static-App Architecture](#static-app-architecture)
7. [Product Map](#product-map)
8. [Sutra Assistant & Sutra Intelligence](#sutra-assistant--sutra-intelligence)
9. [Themes, Customization, CSS Overrides, Plugins, Safe Mode](#themes-customization-css-overrides-plugins-safe-mode)
10. [Backups & File Formats](#backups--file-formats)
11. [Mobile & Tablet Behavior](#mobile--tablet-behavior)
12. [Accessibility](#accessibility)
13. [Keyboard Shortcuts](#keyboard-shortcuts)
14. [Onboarding & Help](#onboarding--help)
15. [Privacy](#privacy)
16. [Troubleshooting](#troubleshooting)
17. [Limitations](#limitations)
18. [Release Checklist](#release-checklist)
19. [License & Attribution](#license--attribution)

---

## What Sutra Is

Sutra is one app for everything a student carries:

- **Notes** â€” hierarchical pages, a rich editor with slash commands, Page Mode, document backgrounds, handwriting, split view, and templates.
- **Planning** â€” a Today command center with a Daily Thread, Shape My Day, a deterministic Next Step, Deadline Radar, and a full Timeline calendar.
- **Homework** â€” class and activity lanes, due-state tracking, and Import from School Portal.
- **AP exam prep** â€” units, sessions, practice logs, weak-area tracking, exam countdowns, an automated AP Battle Plan, and a Testing Hub.
- **Review** â€” spaced repetition and active recall with five study modes.
- **College applications** â€” trackers, essays, scholarships, scores, and decision matrices.
- **Life** â€” habits, sleep, journal, spending, goals, books, fitness, calories, and more.
- **Projects & Work** â€” a local operations dashboard for projects, clients, invoices, and deadlines.
- **Focus** â€” a Pomodoro-style Focus Timer with reusable templates, plus a writing-only Focus Mode.
- **Sutra Assistant** â€” an optional, bring-your-own-key AI panel that reads your workspace and proposes changes you approve one card at a time.

Everything is stored on your device. There is no Sutra cloud.

## Who It's For

- **High-school and college students** juggling classes, AP exams, college apps, deadlines, extracurriculars, and a life.
- **Self-directed writers and planners** who want a Notion-style notebook without an account.
- **Solo operators and freelancers** who want a local CRM, invoice list, and deadline radar in the same workspace as their notes.
- Anyone who wants a single offline workspace they can carry between devices via one portable backup file.

## Why the Name Sutra

*Sutra* is Sanskrit for a **thread** or string â€” the line that holds separate beads together into one piece. That is the whole idea: your notes, assignments, exams, deadlines, and reviews are usually scattered across apps and tabs. Sutra runs a single thread through them so they read as one continuous workspace instead of a pile of fragments.

We use the thread metaphor sparingly. Inside the app, labels stay literal â€” *Today*, *Notes*, *Homework*, *Timeline*. The thread is the spirit of the product, not a costume on every button.

## Local-First Philosophy

- **Local-first.** Your workspace lives in browser storage on the device. No login. No telemetry. No required server.
- **One surface, many modes.** Sutra Modes promote the views you need now without deleting the others.
- **Calm by default.** Glass / neumorphic styling, configurable density, and a per-page theme system. Motion and contrast are tunable.
- **Bring your own AI key.** The Sutra Assistant is optional and uses a key you supply. Keys stay on this device for the session only and are never exported.
- **Portable.** A single `.sutra` file is a complete backup of your workspace.

## Quick Start

1. Open **`Sutra.html`** directly (double-click is fine), or open the landing page **`HomePage.html`** and click **Start your session**. (`index.html` simply redirects to `HomePage.html`.)
2. On first launch, the **Sutra Setup** wizard offers to add your classes, AP subjects, college focus, and a Sutra Mode. Skip it if you prefer a blank slate.
3. Open **Today** to see the **Daily Thread** and one **Next Step**.
4. Press **Ctrl/âŒ˜+K** to open the **Command Palette** and try Quick Capture, *Create Weekly Review note*, or *Export backup*.
5. Open **Settings â†’ Data** and save a **`.sutra`** backup as soon as your workspace feels real.

For a full walkthrough, see the [Sutra Guidebook](SUTRA_GUIDE.md).

Developers can use the built-in static server and Playwright matrix:

```bash
npm install
npm run serve
npm run check:all
npm run test:e2e
```

> If your browser blocks some features under `file://` (certain image-upload paths), serve the folder over HTTP with any static server â€” for example `python -m http.server 5173`, then visit `http://localhost:5173/Sutra.html`.

## Static-App Architecture

Sutra is a **plain static site**. There is no backend, no build step, no bundler, and no required server. The page you open *is* the app.

```
Sutra/
â”œâ”€ index.html            # Tiny redirect to HomePage.html
â”œâ”€ HomePage.html         # Landing page with the thread scrollytelling + "Start your session"
â”œâ”€ Sutra.html            # The app shell (views, modals, structural markup)
â”œâ”€ assets/               # Brand logos (assets/brand/sutra/), favicon, marketing imagery
â”œâ”€ styles/
â”‚  â”œâ”€ styles.css             # Core design tokens, components, themes, layout
â”‚  â”œâ”€ sutra-pro.css          # Pro surface styling
â”‚  â”œâ”€ mobile.css             # Mobile / tablet overrides
â”‚  â”œâ”€ customization.css      # Customization + mods UI
â”‚  â”œâ”€ microinteractions.css  # Hover / press / transition polish
â”‚  â”œâ”€ macos26-redesign.css   # macOS 26 theme surface
â”‚  â””â”€ settings-redesign.css  # Settings layout
â”œâ”€ src/
â”‚  â”œâ”€ core/app.js            # Main runtime (global scope): state, notes, tasks, timeline, settings, AI, etc.
â”‚  â”œâ”€ features/              # ap-study.js, homework.js, review.js, business-workspace.js,
â”‚  â”‚                         # flow-assistant.js, flow-intelligence.js, handwriting.js,
â”‚  â”‚                         # customization.js, plugin-system.js
â”‚  â””â”€ ui/                    # date-enhancer.js, select-enhancer.js, and other UI helpers
â”œâ”€ scripts/              # Node test guards (smoke-check, round-trip, doc-background, etc.)
â”œâ”€ docs/                 # This documentation set
â”œâ”€ examples/plugins/     # Example plugin bundle
â”œâ”€ NoteFlow (classic)/   # The separate legacy app (NoteFlow Classic)
â”œâ”€ LICENSE / NOTICE      # Apache License 2.0
â””â”€ TRADEMARK.md          # Brand usage guidelines
```

The core runtime in `src/core/app.js` is a single large **global-scope** script â€” feature modules attach to it rather than importing it as a module. That is why the app opens straight from a file with no module resolver.

> **Heads-up for contributors:** because `app.js` runs in global scope, top-level names live in one shared namespace. Watch for name collisions when adding new top-level functions or variables.

### Renamed files (this release)

| Old | New |
| --- | --- |
| `NoteflowAtelier.html` | `Sutra.html` |
| `styles/atelier-pro.css` | `styles/sutra-pro.css` |
| `scripts/atelier-persistence-qa.js` | `scripts/sutra-persistence-qa.js` |
| `docs/atelier-save-systems-audit.md` | `docs/sutra-save-systems-audit.md` |

## Product Map

The top tab switcher exposes the workspace (visibility depends on the active Sutra Mode). All labels below are the literal names used in the app.

### Today

The default landing experience â€” your daily command center.

- **Daily Thread** â€” overdue / today / tomorrow / this-week counts plus a deterministic **Next Step** you can run directly.
- **Shape My Day** â€” sequences your committed priorities against the calendar; the result appears under a *Recommended sequence* disclosure, and you can apply it back to the Timeline.
- **Next Step** â€” the single most useful action computed from your data, runnable in one click.
- **Deadline Radar** â€” a modal grouping every deadline (tasks, homework, AP exams, college, timeline blocks, work deadlines) by *overdue / today / tomorrow / this week / later*. Each row offers **Open** and **Schedule this** to convert it into a Timeline block.
- **Quick Capture** â€” a natural-language modal (from the *Capture* button or the Command Palette) that parses phrases like *"Chem essay due Friday hard"* into the right surface (task / homework / note / block / AP session / college item).
- Plus habits, a schedule snapshot, a completed-today strip, life signals, an academic planner, and **Momentum** (progress and analytics).

### Timeline

A calendar planner with **Month**, **Planner**, **Week**, **Day**, and **Year** views; a time-block modal (name, start/end, category, color, recurrence, reference URL); a live *Current Block* card; a time-of-day surface tint; and ICS export/import. *Schedule this* actions across the app drop blocks here without retyping.

### Notes

Sutra's writing surface.

- **Page tree** â€” hierarchical titles using `::` (e.g. `Projects::Website::Launch`), with search, tag filter, drag-and-drop reordering, favorites, duplicate, rename, delete, emoji icons, and breadcrumbs. Temporary pages can self-expire. A built-in **Help & Docs** page always lives at the top of the tree.
- **Rich editor** â€” toolbar formatting (bold, italic, underline, strikethrough, H1â€“H3, lists, quote, code), an insert menu (link, table, image, video, audio, embed, checklist, collapsible section, page link), a slash menu (`/`), list indent with `Tab` / `Shift+Tab`, live word count, and configurable autosave.
- **Page Mode** â€” a document-style page presentation for the note surface.
- **Document Backgrounds** â€” a per-page background image set from the editor toolbar's *Document Background* button. Upload a `.png`, `.jpg`, `.jpeg`, or `.webp` (max 6 MB; large images auto-downscale), then tune a **Background Blur** slider (0â€“32 px) and a **Dim Background** slider (0â€“80%, default 25%). The dim overlay tints toward the editor surface so text stays readable in light, dark, and custom themes, and blur applies only to the image, never the text. Backgrounds work in the standard editor, Page Mode, split view, on mobile and tablet, and under custom CSS; they survive refresh, page duplication, and `.sutra` export/restore. **Locked pages never show their background behind the PIN screen.** See [the per-document background facts](docs/_SUTRA_DOC_FACTS.md) and [CHANGELOG](docs/CHANGELOG.md).
- **Handwriting** â€” insert a handwriting block to write, sketch, or annotate with mouse, trackpad, touch, or stylus (pen, highlighter, eraser; blank / lined / grid / dotted paper). Strokes are stored as vectors and round-trip through backups. Full guide: [`docs/HANDWRITING_AND_DRAWING.md`](docs/HANDWRITING_AND_DRAWING.md).
- **Split view** â€” a second pane beside the current note, with split presets (Note + Assignment, Note + AP Unit, Essay + Research, Today Plan + Notes, Calendar + Note) and swap/close controls.
- **Locked pages** â€” PIN-protect any page (4â€“8 digits, stored as a salted SHA-256 hash, never as the raw PIN), with auto-lock options.

### Homework

Two lanes â€” **Subjects** (your classes) and **Activities** (extracurriculars). Per-assignment fields cover title, due date/time, priority, difficulty, notes, and done state, with due-state chips (*no date / upcoming / due soon â‰¤ 48 h / overdue*). **Import from School Portal** pastes lines copied from a school portal (pipe-, tab-, or dash-separated), previews each parsed row, and lets you correct title / class / date / time / difficulty / priority before saving. JSON import/export is available, and each row's menu offers *Schedule this* and *Open class dashboard*.

### AP Study

Sections: **Overview**, **Units**, **Sessions**, **Practice**, **Analytics**. Subjects carry exam date/time, target score, confidence, teacher, current unit, notes, and an optional linked Homework class. Units track topics, status, and weak-area flags; sessions come in types (review, FRQ, MCQ, practice test, weak area, mixed); practice logs capture score, max score, minutes, confidence-after, and a weak marker. On the AP Study view, `Ctrl/âŒ˜+K` is reserved for **Add subject**.

### AP Battle Plan

A card at the top of AP Study that auto-picks the soonest exam, weighs weak units, recent practice, confidence, and days-left, and recommends a concrete next session with reasoning. From the card you can create a real AP session, create or open a linked AP unit note, log a task, or schedule a prep block on the Timeline.

### Testing Hub

A dashboard-first exam-prep hub for pinned exams, with a per-exam calm overview built from test profiles and an integration with AP Study.

### Cram

A focused Cram surface for last-minute sessions; the assistant can create Cram sessions on your approval.

### Review

Sutra's spaced-repetition and active-recall center. It stores **decks**, **review items** (prompt + answer + tags), and **review sessions**, each card carrying scheduling state and graded **Again / Hard / Good / Easy** with a local SM-2-lite algorithm (no backend, no AI). Five study modes:

| Mode | Description |
| --- | --- |
| Flashcards | Reveal the answer, then grade *Again / Hard / Good / Easy*. |
| Learn | Adaptive multiple-choice with mastery levels (*new â†’ learning â†’ familiar â†’ mastered*). |
| Write | Type the answer; a fuzzy compare grades the attempt. |
| Test | Fixed-length mixed-format quiz with a final score and card-by-card review. |
| Match | Timed pair-up grid; best time is stored per deck. |

Review surfaces a *Review due* card on Today, indexes deck names and card text in global search, links to a Focus template, and can take its source from a note, AP class, or homework class.

### College

A dashboard with summary metrics (Application Completion %, Upcoming Deadlines, Scholarship Pipeline, SAT Countdown) and a grid into College Tracker, Essay Organizer, Score Tracker, Award/Honors Tracker, Scholarship Tracker, Decision Matrix, Major Deciding Matrix, and Application Sheets (Research, Checklist, Deadlines, Essay Plan, Essay Prompts). Rows with dates expose *Schedule this*; essay rows can open a draft note.

### Life

A dashboard of primary trackers â€” Goals, Habits, Sleep, Spending, Journal â€” with a *More Life Tools* group for Skills, Fitness, Calories, Calculator, and Books.

### Projects & Work

A local-first operations dashboard (formerly the Business / Freelancer workspace): Overview, Analytics, Projects, Opportunities, Clients, Invoices, Finance, Meetings, Tasks, Proposals/Contracts, Notes, Documents/Assets, and Goals/Targets, with KPI cards, a quick-actions strip, quick notes, and a deadlines aggregation that feeds the global Deadline Radar.

### Focus

A compact **Focus Timer** in the sidebar (quick presets, custom durations, ringtones, alarm volume, a *finish at* preview, and reusable **Focus Templates** like Deep Work and AP Review that link a session to a subject, project, note, or deck). **Focus Mode** (`Alt+Shift+F`) is independent â€” it strips chrome from the writing surface for distraction-free writing.

### Sutra Modes

`Settings â†’ Data` chooses which views are primary. Hidden-by-mode views are never deleted â€” a view that already contains data stays reachable through the overflow menu.

| Mode | Primary emphasis |
| --- | --- |
| **All Tools** | Everything visible. |
| Student | Today, Timeline, Notes, Homework, AP Study, College, Life. |
| AP Crunch | Today, AP Study, Homework, Timeline, Notes. |
| College Apps | Today, College, Notes, Timeline, Homework. |
| Writing | Notes, Today, Timeline. |
| Life | Today, Life, Notes, Timeline. |
| Projects & Work | Full operations dashboard. |

## Sutra Assistant & Sutra Intelligence

**Sutra Assistant** is the contextual chat panel â€” a mascot launcher at the bottom-right that opens a panel which can answer questions about your workspace and **propose local changes** (tasks, timeline blocks, notes, review cards, and more) that you approve one card at a time. It is optional and uses **your own API key**.

**Sutra Intelligence** is the **local signal layer** behind it. It reads *only* your workspace â€” overdue work, workload, schedule conflicts, weak areas, review backlog, and next steps â€” to ground the assistant's answers. **It does not call any server itself.**

### Powered by Sutra Intelligence

A **Powered by Sutra Intelligence** badge sits directly under the panel header, with the subtitle *"Local signals from your workspace."* Hovering, tapping, or focusing it (the text is also the badge's aria-label) explains:

> *Sutra Intelligence analyzes local workspace signals such as overdue work, workload, schedule conflicts, weak areas, review backlog, and next steps. AI requests are sent only to the provider you choose.*

### How requests work

AI requests go **directly from your browser to the provider you choose** â€” Sutra runs no model servers and does not proxy anything. Supported providers:

- OpenAI
- Anthropic Claude
- Google Gemini
- Groq
- OpenRouter
- Custom OpenAI-Compatible Endpoint (a "Local endpoint")

You bring your own API key and the exact **Model ID**. Keys live in **sessionStorage only** (this browser session), are never uploaded, and are never exported.

### Controls

- **Workspace Access** â€” *Current Screen Only* / *Current Area* / *Full Workspace Context*, plus selected-text awareness.
- **Single Request** vs **Conversation Memory** â€” whether the assistant remembers the thread.
- **Suggested Changes** â€” proposals render as **Apply / Decline** cards (with *Apply all* for multi-action replies); **Confirm Before Applying Changes** keeps approval in your hands. Replies also offer **Insert into Note** and **Suggested Prompts**.
- **Assistant Activity** â€” every applied action is logged locally with **undo**.

On mobile the panel fits the viewport, the composer stays usable with the software keyboard open, action cards stack, and the badge stays compact.

## Themes, Customization, CSS Overrides, Plugins, Safe Mode

Apply any theme to the **current page**, **all pages**, or a **custom subset** (per-page theming). Built-in presets include Default, Dark, Botanical, Editorial, Luxury, Sepia, Ocean, Sunrise, Graphite, Aurora, Rosewater, macOS 26, Windows 11, ChromeOS, Ubuntu, GitHub, Spotify, Netflix, Slack, and Dune. You can create, edit, delete, import, and export **custom themes**, and set motion intensity to full / reduced / off (also tied to your OS *prefers-reduced-motion*).

**Customization** (`Settings â†’ Customization`) is the power-user layer â€” everything local-first, no marketplace, traveling inside your workspace backup:

- **CSS Overrides** â€” multiple named snippets with enable/disable, live preview, brace-balance validation, duplicate, reorder, `.css` and JSON import/export, and a non-destructive reset. Custom CSS applies *after* themes and survives theme changes and refresh.
- **Plugins** â€” install local plugin bundles. Plugins are **local bundles only** (no marketplace), run **sandboxed in an iframe** behind an explicit permission allowlist, install **disabled**, and are **reviewed before they run** (forced on import). On import to a new device, runtime plugins return disabled and require re-review.
- **Safe Mode** â€” skip all custom CSS and plugins without deleting anything.

Guides: [`docs/MODS_AND_CUSTOMIZATION.md`](docs/MODS_AND_CUSTOMIZATION.md) and [`docs/PLUGIN_SDK.md`](docs/PLUGIN_SDK.md).

### Safe Mode

Safe Mode loads Sutra with **no custom CSS and no plugins** â€” and **never deletes** data, CSS, plugins, or workspace. Enter it any of these ways:

- Add `?sutraSafeMode=1` to the URL (the legacy `?atelierSafeMode=1` still works).
- Hold **Shift** while the app loads.
- Use the in-app **Recovery** controls.

## Backups & File Formats

### `.sutra` (default)

**`.sutra`** is the default backup format â€” a complete, portable copy of your workspace. Exports are named `sutra_workspace_<YYYY-MM-DD>.sutra`. The file is a ZIP package containing `manifest.json`, `workspace.json`, an `assets/` folder, and `metadata/` (`export-summary.json`, `checksums.json`). The manifest identifies Sutra:

```json
{
  "product": "Sutra",
  "format": "sutra-workspace",
  "formatVersion": 1,
  "legacyCompatible": true,
  "appName": "Sutra"
}
```

Document backgrounds and inline note images ride along as `assets/` files (with checksums) via recursive inline-asset extraction, so a background survives `.sutra` export â†’ wipe â†’ restore.

### Legacy `.atelier` (still imports)

Old **`.atelier`** backups still import â€” the validator accepts both the new `sutra-workspace` manifest and the legacy `noteflow_atelier_project` manifest, and the import dispatcher routes both `.sutra` and `.atelier` files to the same package importer. **Old backups are never broken.**

### Plugins: `.sutra-plugin` (new) and `.atelier-plugin` (still imports)

**`.sutra-plugin`** is the new plugin export extension. Legacy **`.atelier-plugin`** bundles still import. (The bundled example, [`examples/plugins/study-helper.atelier-plugin`](examples/plugins/study-helper.atelier-plugin), uses the legacy extension and imports fine.)

### Never exported

API keys, provider credentials, and tokens live in sessionStorage only and are **never** written into any backup. The assistant activity log (key `sutra:activityLog:v1`, migrated from the legacy `flow:activityLog:v1`) is **not** a secret and travels in backups.

### Internal storage names

For compatibility, Sutra intentionally **retains** its legacy internal identifiers so existing browser data keeps loading: IndexedDB databases `noteflow_atelier_db` (workspace) and `noteflow_attachments_db` (course/file binaries), plus the localStorage mirrors `hwCourses:v2` / `hwTasks:v2`. Treat these as **legacy-named compatibility identifiers** â€” the names are historical, not a sign that anything still calls itself "Atelier." Full detail in [Rebrand & Compatibility](docs/REBRAND_AND_COMPATIBILITY.md).

## Mobile & Tablet Behavior

Sutra is responsive from **1440 px down to 320 px**. Breakpoints in `styles/mobile.css` cover large tablet (1024 px), small tablet (768 px), and phone (640 px).

- The sidebar collapses behind a toggle and a tap-overlay; the pages list scrolls inside the drawer.
- The top tab strip becomes a single **current view** dropdown that expands the full list; overflowing tabs move into a *More* menu.
- Modals scroll internally and keep their primary actions visible above mobile browser chrome; under 640 px they stack to a single column.
- `Settings â†’ Accessibility â†’ Larger touch targets` enlarges interactive elements for thumb use.

## Accessibility

- Keyboard navigation throughout, with **visible focus** and **ARIA labels**.
- **Reduced-motion** and **JavaScript-disabled** fallbacks (the landing thread shows its final connected state with no pinned dead zones).
- Readable at **200% zoom**, with attention to color contrast.
- **Large touch targets** â€” at least 44 px for primary controls (40 px where space is constrained).

## Keyboard Shortcuts

Sutra is keyboard-first. The most important shortcut is the **Command Palette** (`Ctrl/âŒ˜+K`) â€” type to filter, arrow to navigate, `Enter` to run, `Esc` to close. From it you can jump to any view, run Quick Capture, export a backup, create a Weekly Review note, restart onboarding, open a class dashboard, and more.

| Shortcut | Action |
| --- | --- |
| `Ctrl/âŒ˜+K` | Command Palette (on AP Study, this is *Add subject* instead). |
| `Shift+Ctrl/âŒ˜+F` | Global Search across Notes, Tasks, Homework, AP Study, Review, trackers, College, and Timeline. |
| `Alt+Shift+F` | Toggle Focus Mode. |
| `Ctrl/âŒ˜+Shift+M` | Toggle the markdown shortcut on the current selection (where supported). |
| `Tab` / `Shift+Tab` | Indent / outdent list items in the editor. |
| `/` (in editor) | Open the slash command menu. |

## Onboarding & Help

Sutra ships layered help:

1. **Sutra Setup** â€” the first-launch wizard that adds classes, AP subjects, and college focus, picks a Sutra Mode, and offers an immediate `.sutra` backup. Restart it anytime from `Settings â†’ Advanced â†’ Restart Sutra Setup`.
2. **Help & Docs page** â€” an auto-generated, non-removable page at the top of the page tree, with its own table of contents.
3. **Interactive tutorial** â€” a guided overlay tour from Settings â†’ Advanced.

A long-form written tutorial lives in the [Sutra Guidebook](SUTRA_GUIDE.md).

## Privacy

- Storage is **local-first** on this device: IndexedDB holds the workspace; localStorage holds settings, health state, and a few caches.
- There is **no Sutra-operated server**; nothing is uploaded by the app itself. Fresh startup, core `.sutra` backup, and JSON backup are designed to make **zero third-party requests**.
- Optional outbound calls happen only when you trigger them: Sutra Assistant provider requests, approved feedback-form embeds, approved media embeds (YouTube, Vimeo, Spotify, SoundCloud, CodePen, Figma, and YouTube thumbnails), AP Classroom resource links, AI-console help links, ChatGPT/Spotify launch shortcuts, configurable localhost/127.0.0.1 AI endpoints, and secondary document import/export libraries when a browser-native fallback is not enough.
- **API keys never leave sessionStorage** and are never exported.
- `.sutra` exports are **not encrypted**: treat them as personal files. Locked-page PINs protect a page within the browser UI (hashed credentials travel in backups), which is not full-disk encryption.
- Clearing browser storage without a backup will lose your local data.

## Troubleshooting

- **App won't open from `index.html`** â€” it redirects to `HomePage.html`. If your browser blocks the redirect, open `HomePage.html` or `Sutra.html` directly.
- **A custom CSS snippet or plugin broke the UI** â€” load Safe Mode (`?sutraSafeMode=1`, hold **Shift** at load, or the in-app Recovery button) and disable the offending snippet/plugin. Nothing is deleted.
- **Sutra Assistant returns 401 / model errors** â€” re-check the API key for the active provider and the exact Model ID. A wrong Model ID fails at the provider, not in Sutra.
- **An imported backup looks wrong** - a pre-import safety snapshot is written before every workspace import; restore it from `Settings -> Data -> Storage Health`.
- **Tabs are missing** â€” check `Settings â†’ Advanced â†’ Feature Tabs` and the active Sutra Mode. Hidden-by-mode tabs with data still appear under the overflow menu.
- **Fonts look different offline** - external web fonts are not requested on startup. Sutra uses local/system fallbacks unless you explicitly host or allow additional font assets.

## Limitations

- **No multi-device sync.** The "cloud" is whatever you copy â€” a `.sutra` backup or an ICS export.
- **Browser storage caps.** IndexedDB and localStorage quotas vary by browser; very large, media-rich workspaces can hit limits. Export `.sutra` regularly.
- **PDF export uses the browser print pipeline** and can render slightly differently across browsers.
- **External media embeds** depend on the source's CORS / iframe policy and the approved-origin CSP list.
- **Sutra Assistant Model IDs** must match the provider's exact string; typos fail at the provider.
- **`file://` sandboxing** â€” some image-upload paths need an `http(s)://` origin; use a static server if you hit this.
- **Document backgrounds in document exports** â€” HTML export includes the background where feasible and PDF preserves it where browser printing allows; Markdown and plain text omit it cleanly. DOCX/RTF background support is not reliably available and is treated as a known limitation.

## Release Checklist

The canonical pre-release checklist lives at [`docs/TESTING_AND_RELEASE_CHECKLIST.md`](docs/TESTING_AND_RELEASE_CHECKLIST.md). The repository ships Node-based guards you can run with no dependencies:

```bash
node scripts/smoke-check.mjs            # structural assertions across the app
node scripts/round-trip-check.mjs       # backup export â†’ import fidelity
node scripts/version-history-check.mjs  # note version history
node scripts/sutra-docbg-check.mjs      # document-background data model + export
node scripts/sutra-brand-assets-check.mjs  # brand logos, favicon, derivatives + references
npm run check:csp                       # CSP/static network policy guard
npm run check:persistence               # centralized persistence-health guard
npm run check:modal                     # modal accessibility primitive guard
npm run check:network                   # approved-origin/CDN guard
npm run test:e2e                        # Chromium, Firefox, WebKit Playwright matrix
```

Brand icons are generated from two canonical master PNGs (`assets/brand/sutra/`) with `python scripts/generate-sutra-brand-assets.py` (requires Pillow). Full reference: [`docs/BRAND_ASSETS.md`](docs/BRAND_ASSETS.md).

Per the release process, the suite also includes rebrand and responsive guards (`scripts/sutra-rebrand-check.mjs`, `scripts/sutra-responsive-check.mjs`) and a `node --check` syntax pass over each `src` JS file. A browser QA harness is provided at `scripts/sutra-persistence-qa.js`.

## License & Attribution

Sutra is licensed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE) for the full terms.

You may use, modify, and distribute this project under Apache 2.0. When redistributing or building derivative works, please retain the `LICENSE` and `NOTICE` files in full, clearly indicate that your version has been modified, and use the recommended attribution phrase: **"Based on Sutra by Tanuj Ranjith."** (Sutra was formerly NoteFlow Atelier; the legacy attribution phrase remains accurate for older forks.)

The Sutra name, logo, and official branding should not be used in a way that implies endorsement or official affiliation with the original project. See [`TRADEMARK.md`](TRADEMARK.md) for brand usage guidelines.

> **NoteFlow Classic** is a separate legacy app that lives under `NoteFlow (classic)/`. It is not Sutra and is maintained independently.

Copyright 2026 Tanuj Ranjith.
