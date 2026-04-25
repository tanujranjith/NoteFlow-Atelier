# NoteFlow Atelier

NoteFlow Atelier is a local-first **student / life / work workspace** that runs as a single static web app. It bundles structured notes, tasks, focus tools, calendar planning, homework, AP exam prep, college applications, life trackers, and a freelance/business operations module behind one calm interface — without a backend, account, or build step.

If you can open an HTML file, you can run NoteFlow Atelier.

> **Status:** the app ships as a static site. There is no current `package.json` in the working tree — every feature works straight from the HTML/JS/CSS files. See [Setup and Run](#setup-and-run).

## Table of Contents

1. [What It Is](#what-it-is)
2. [Who It Is For](#who-it-is-for)
3. [Design Philosophy](#design-philosophy)
4. [Quick Start](#quick-start)
5. [Project Structure](#project-structure)
6. [Setup and Run](#setup-and-run)
7. [Workspace Map](#workspace-map)
8. [Workspace Modes](#workspace-modes)
9. [Today: Daily Brief, Deadline Radar, Plan My Day](#today-daily-brief-deadline-radar-plan-my-day)
10. [Notes and the Editor](#notes-and-the-editor)
11. [Timeline and Calendar](#timeline-and-calendar)
12. [Focus Timer and Focus Mode](#focus-timer-and-focus-mode)
13. [Homework](#homework)
14. [AP Study and AP Battle Plan](#ap-study-and-ap-battle-plan)
15. [College Workspace](#college-workspace)
16. [Life Workspace](#life-workspace)
17. [Business Workspace](#business-workspace)
18. [Flow Assistant (AI)](#flow-assistant-ai)
19. [Themes, Fonts, and Motion](#themes-fonts-and-motion)
20. [Settings Reference](#settings-reference)
21. [Command Palette, Quick Capture, Global Search](#command-palette-quick-capture-global-search)
22. [Import, Export, and Backups](#import-export-and-backups)
23. [Mobile and Tablet Behavior](#mobile-and-tablet-behavior)
24. [Keyboard Shortcuts](#keyboard-shortcuts)
25. [Help, Tutorial, and Onboarding](#help-tutorial-and-onboarding)
26. [Data Storage and Privacy](#data-storage-and-privacy)
27. [High-Level Architecture](#high-level-architecture)
28. [Known Limitations](#known-limitations)
29. [Troubleshooting](#troubleshooting)
30. [Roadmap and Not-Yet-Implemented](#roadmap-and-not-yet-implemented)
31. [License](#license)

## What It Is

NoteFlow Atelier is one app for:

- **Notes** — hierarchical pages, a rich editor with slash commands, split-screen, embeds, and templates.
- **Tasks** — once / daily / weekly tasks with priority, difficulty, categories, references, and habit tracking.
- **Calendar** — Atelier time blocks, optional Google Calendar overlay, ICS import/export.
- **Homework** — class and extracurricular lanes, assignment tracking, paste import from school portals.
- **AP exam prep** — units, sessions, practice logs, weak-area tracking, exam countdowns, and an automated **AP Battle Plan**.
- **College applications** — tracker, essays, scholarships, scores, decision matrices, application sheets.
- **Life trackers** — habits, sleep, journal, spending, goals, books, fitness, calories, calculator, skills.
- **Business / freelance** — projects, opportunities, clients, invoices, finance, meetings, tasks, proposals/contracts, notes, documents, goals.
- **Focus** — Pomodoro-style timer with ringtones, plus a writing-only Focus Mode.
- **An optional Flow Assistant** that talks to OpenAI / Anthropic / Gemini / Groq / OpenAI-compatible providers using **your own API key**, stored locally.

Everything is stored on your device. There is no Atelier cloud.

## Who It Is For

- **High-school and college students** who juggle classes, AP exams, college apps, deadlines, extracurriculars, and a life.
- **Self-directed writers and planners** who want a Notion-style notebook without an account.
- **Freelancers and solo operators** who need a local CRM, invoice list, and deadline radar in the same workspace as their notes.
- Anyone who wants a single offline workspace they can carry between devices via a portable backup file.

## Design Philosophy

- **Local-first.** Your workspace lives in browser storage on the device. No login. No telemetry. No required server.
- **One surface, many modes.** Workspace Modes (Student, AP Crunch, College Apps, Writing, Life, Business, Standard) emphasize the views you need now without deleting the others.
- **Calm by default.** Glass / neumorphic styling, configurable density, and a per-page theme system. Motion and contrast are tunable.
- **Bring your own AI key.** The Flow Assistant is optional and uses keys you supply. Keys stay in `localStorage`.
- **Portable.** A single `.atelier` file is a complete backup of your workspace.

## Quick Start

1. Open `NoteflowAtelier.html` directly, or open `index.html` (which redirects to the marketing page) and click **Start your session**.
2. On first launch, the **Student Setup** wizard offers to add your classes, AP subjects, college focus, and a workspace mode. Skip if you prefer a blank slate.
3. Open **Today** to see the Daily Brief and one Next Best Action.
4. Press **Ctrl/⌘+K** to open the Command Palette and try `quick capture`, `weekly review`, or `export .atelier`.
5. Open **Settings → Data & Backups** and save a `.atelier` backup as soon as your workspace feels real.

For a full walkthrough see [TUTORIAL.md](TUTORIAL.md).

## Project Structure

```
NoteFlow Atelier/
├─ index.html                       # Tiny redirect to HomePage.html
├─ HomePage.html                    # Marketing/landing page with "Start your session" CTA
├─ NoteflowAtelier.html             # The actual app shell (views, modals, structural markup)
├─ assets/                          # Mascot, favicon, marketing screenshots
├─ styles/
│  ├─ styles.css                    # Core design tokens, components, themes, layout
│  ├─ mobile.css                    # Mobile/tablet overrides (640 / 768 / 1024 breakpoints)
│  ├─ microinteractions.css         # Hover, press, transition polish
│  └─ macos26-redesign.css          # macOS 26 theme surface
├─ src/
│  ├─ core/app.js                   # Main app: state, notes, tasks, timeline, settings, tutorial, AI, etc.
│  ├─ data/emoji-keywords.generated.js  # Emoji search index
│  ├─ features/
│  │  ├─ ap-study.js                # AP Study workspace (units, sessions, practice, analytics)
│  │  ├─ business-workspace.js      # Business/freelance modules
│  │  └─ homework.js                # Homework lanes, assignments, paste import
│  └─ ui/
│     ├─ date-enhancer.js           # Custom date input UX
│     └─ select-enhancer.js         # Custom select UX
├─ scripts/
│  └─ smoke-check.mjs               # Structural assertion script (no deps, runs on plain Node)
├─ NoteFlow (classic)/              # Older standalone version, accessible from the landing page
├─ .github/workflows/deploy.yml     # Deploys the repo to GitHub Pages as a static site
├─ LICENSE / NOTICE                 # Apache License 2.0
└─ TUTORIAL.md                      # Step-by-step user tutorial
```

## Setup and Run

NoteFlow Atelier is a **plain static site** — no compile step, no bundler, no server required.

### Requirements

- A modern browser (Chrome, Edge, Firefox, Safari).
- *(Optional)* Node.js 18+ if you want to run the repository smoke check.

### Run locally

The simplest way:

```text
Double-click NoteflowAtelier.html
```

That's it. The file loads `styles/`, `src/`, and the in-page Google fonts and Font Awesome over the public CDN.

If your browser blocks features under `file://` (some integrations, image upload behaviour), serve the folder over HTTP. Any static server works:

```bash
# Python (built-in)
python -m http.server 5173

# Node
npx serve .

# Or any other static file server
```

Then visit `http://localhost:5173/NoteflowAtelier.html`.

### Repository check (optional)

`scripts/smoke-check.mjs` is a structural assertion script. It does **not** execute the app — it just verifies that key wiring (`.atelier` export/import, settings save/apply, command palette, deadline radar, AP Battle Plan, ICS import/export, etc.) is still present in the source. It has zero dependencies.

```bash
# From the repo root
node scripts/smoke-check.mjs
```

You can also syntax-check each JS file individually:

```bash
node --check src/core/app.js
node --check src/features/ap-study.js
node --check src/features/business-workspace.js
node --check src/features/homework.js
node --check src/ui/date-enhancer.js
node --check src/ui/select-enhancer.js
```

> A `package.json` previously declared `npm run dev` / `npm run build` / `npm run preview` Vite scripts. The current working tree no longer ships `package.json`, and the app does not require a bundler. Use the smoke check + raw `node --check` if you want CI-style verification.

### Deployment

`.github/workflows/deploy.yml` deploys the repository as-is to GitHub Pages on every push to `main`. There is no build step — the Pages artifact is the repo root.

## Workspace Map

The top tab switcher exposes (visibility depends on Workspace Mode):

- **Today** — daily command center: Daily Brief, Plan My Day, schedule snapshot, habits, academic planner, life signals, completed strip, weekly/monthly analytics.
- **Timeline** — calendar planner: Month / Planner / Week / Day / Year views, time blocks, ICS, Google Calendar.
- **Notes** — page tree with hierarchical titles, rich editor, split screen, slash commands.
- **College** — admissions tracker, essays, scores, awards, scholarships, decision matrices, application sheets.
- **Life** — habits, sleep, spending, journal, goals, plus a "More Life Tools" group for skills, fitness, calories, calculator, books.
- **Business** — projects, clients, invoices, finance, meetings, opportunities, tasks, proposals, notes, documents, goals.
- **Homework** — class and extracurricular assignment lanes, paste import, JSON import/export.
- **AP Study** — exam-prep workspace with units, sessions, practice logs, analytics, AP Battle Plan.
- **Settings** — workspace control center.

A "More" overflow appears when the tab bar is too narrow. Visibility per tab is controlled by **Settings → Advanced → Feature Tabs** *and* by the active **Workspace Mode**. At least one workspace tab and Settings always remain available.

## Workspace Modes

`Settings → Data & Backups → Workspace mode` chooses which views are primary. Hidden-by-mode views are never deleted. If a hidden view already contains data, it stays reachable through the overflow menu so you don't lose access.

| Mode | Primary views |
| --- | --- |
| Standard | All views |
| Student | Today, Timeline, Notes, Homework, AP Study, College, Life *(Business hidden)* |
| AP Crunch | Today, AP Study, Homework, Timeline, Notes |
| College Apps | Today, College, Notes, Timeline, Homework |
| Writing | Notes, Today, Timeline |
| Life | Today, Life, Notes, Timeline |
| Business / Freelancer | All views |

You can also rerun Student Setup from `Settings → Advanced → Tutorial & Onboarding → Rerun Student Setup`.

## Today: Daily Brief, Deadline Radar, Plan My Day

The Today view is the default landing experience.

- **Daily Brief** — overdue / today / tomorrow / this-week counts plus a deterministic *Next Best Action* you can run directly.
- **Deadline Radar** — opens a modal that groups every deadline (tasks, homework, AP exams, college, timeline blocks, business deadlines) by *overdue / today / tomorrow / this week / later*. Each row offers Open and **Schedule this** to convert it into a Timeline block.
- **Plan My Day** — sequences your committed priorities against the calendar; result appears under the *Recommended sequence* disclosure. Optionally apply the plan back to Timeline.
- **Auto-block events** — auto-creates time blocks from new calendar events. Toggle persists.
- **Quick Capture** — `Capture` button or `Ctrl/⌘+K → Quick Capture`. Parses phrases like *"Chem essay due Friday hard"* or *"AP Physics FRQ practice tomorrow 6pm"* into the right surface (task / homework / note / block / AP session / college item). When more than one AP subject exists, you'll be asked to pick a destination.
- **Habits** — add habits with one click; current and best streaks, weekly consistency, and freezes are tracked.
- **Schedule snapshot** — the next blocks for the day with a jump-to-Timeline action.
- **Completed today strip** — collapsed by default; expand to see and undo completions.
- **Life signals (student hub)** — at-a-glance metrics: active tasks, homework, AP focus, notes, calendar (7d), college deadlines (14d), habits today.
- **Academic planner** — assignments + exams table with status, class, priority filters; extracurriculars table.
- **Progress & Analytics** — weekly sparkline, monthly heatmap, category donut, current/best streaks, freezes remaining.

## Notes and the Editor

### Page Management

- Hierarchical titles using `::`, e.g. `Projects::Website::Launch`. Renaming a parent updates child paths.
- Sidebar tree with search, tag filter, drag-and-drop reordering, collapse/expand, favorites, duplicate, rename, delete, emoji icons, and breadcrumb navigation.
- Inline page-title editing.
- **Temporary pages** with configurable expiration (minutes / hours / days). Set the default duration in `Settings → Advanced → Temporary Pages`.
- A built-in **Help & Docs** page is always available in the page tree.

### Page Templates

Available in `New Page → Template`:

- Blank Page
- Meeting Notes
- 1:1 Check-In
- Project Plan
- To-Do List
- Daily Journal
- Weekly Review
- Study Notes
- Research Brief
- Sprint Planner
- Roadmap Plan
- Client Brief
- Content Brief
- Decision Log

Templates can optionally seed starter tasks (toggle in the template preview panel).

### Rich Editor

- Toolbar formatting: **Bold**, *Italic*, Underline, ~~Strikethrough~~, H1 / H2 / H3, bullets, numbered lists, quote, code block, clear formatting.
- Insert: link, table, image, video, audio, embed, embed HTML, checklist, collapsible section, page link.
- Tables, images, video, audio, and embeds support both URL and file upload paths where the browser allows it.
- Slash menu (`/`) with: H1 / H2 / H3, bullet, numbered, to-do, toggle, quote, divider, code, table, image, video, audio, embed, embed HTML, markdown, link, link to page, callout.
- `Tab` / `Shift+Tab` indent and outdent list items.
- `Ctrl/⌘+Shift+M` toggles the markdown shortcut for the current selection (where supported).
- Word count for the active editor pane.
- Autosave is configurable from 300 ms to 8 s in `Settings → Editor → Autosave`.

### Split Notes

- Toggle a second pane next to the current note (`#splitNotesToggleBtn`).
- A second-page picker selects what to load on the right.
- **Split-screen presets** (`#splitNotesPresetsBtn`) snap your current note next to a context: Note + Assignment, Note + AP Unit, Essay + Research, Today Plan + Notes, Calendar + Note.
- Swap and close controls move/clear the secondary pane.
- The split-view default is configurable in `Settings → Editor`.

### Floating Font Panel

- Choose font family (Inter, Manrope, Sora, Source Sans 3, Source Sans Pro, Open Sans, Roboto, Montserrat, Comfortaa, Fira Sans, Playfair Display, IBM Plex Mono, JetBrains Mono).
- Adjust font size and line height.
- Toggle motion / animations.

### Focus Mode

- `Alt+Shift+F` (or the on-screen toggle) hides chrome and centers the editor for distraction-free writing.
- Focus Mode default is configurable in `Settings → Editor`.

## Timeline and Calendar

- View modes: **Month**, **Planner**, **Week**, **Day**, **Year**.
  *(A standalone "3-Day" view existed in older builds and now folds into the Day view.)*
- Source modes: **Atelier**, **Google**, or **Both**.
- Center-day picker for fast navigation; Today button.
- **Time block modal** fields: name, start/end, category, color, recurrence (none / daily / weekdays / weekly / monthly), one-time date, reference URL.
- Current Block card shows the active block with live progress.
- Time mode selector (auto, morning, afternoon, evening, night) tints the surface.
- ICS export/import (`Settings → Advanced → Calendar Data Files`) and a *Clear Imported Calendar Data* maintenance action.
- Google Calendar link — calendar ID, sync interval, auto-sync toggle, sync now, unlink. Uses *your own* Google credentials configured in Drive Settings.
- "Schedule this" actions across Today, Homework, College, and Deadline Radar create Timeline blocks without retyping.

## Focus Timer and Focus Mode

The compact focus timer in the sidebar supports:

- Quick presets: 15 / 25 / 50 minutes.
- Custom hours, minutes, seconds.
- Start / Pause / Reset.
- Ringtones: Classic Bell, Digital Beep, Soft Chime, Zen Bowl, Sonar Pulse, Arcade Alert, Crystal Ping.
- Alarm volume slider.
- Completion popup with persistent alarm until dismissed.
- "Finish at" preview while running.

Focus *Mode* (`Alt+Shift+F`) is independent — it strips chrome from the writing surface.

## Homework

- Two lanes: **Subjects** (your classes) and **Activities** (extracurriculars / misc).
- Setup overlay on first launch; chips let you bulk-add classes and activities.
- Per-assignment fields: title, due date, due time, priority, difficulty, notes, done state.
- Due-state chips: *no date*, *upcoming*, *due soon* (≤ 48 h), *overdue*.
- Header actions: Add Class, Add Misc, Export JSON, Import JSON, Reset setup.
- **Homework Paste Import** — paste lines copied from a school portal (pipe-, tab-, or dash-separated). The app previews each parsed row and lets you correct title / class / date / time / difficulty / priority before saving.
- Each assignment row has a "..." menu with **Schedule this** (Timeline block) and **Open class dashboard**.
- Homework items sync into Today's task surfaces and Daily Brief counts (toggle in `Settings → Tasks → Include homework tasks`).

## AP Study and AP Battle Plan

Sections: **Overview**, **Units**, **Sessions**, **Practice**, **Analytics**.

- **Subjects** include exam date/time, target score, confidence, teacher, current unit, notes, and an optional linked Homework class.
- **Units** track topics, status, and weak-area flags.
- **Session types**: review, FRQ, MCQ, practice test, weak area, mixed.
- **Practice logs** capture score, max score, minutes, confidence-after, and a weak-area marker.
- Exam countdown and readiness analytics sit at the top of the workspace.
- **AP Battle Plan card** picks the soonest exam, weighs weak units / practice logs / confidence / days-left, and recommends a concrete next session with reasoning. From the card you can:
  - Create a real AP Study session for that subject.
  - Create or open a linked AP unit note.
  - Log a regular task.
  - Schedule a prep block on Timeline.
- AP items can be included in Today's task feed (`Settings → Tasks → Include AP Study tasks`).
- `Ctrl/⌘+K` on the AP Study view shortcuts to **Add subject** instead of the global Command Palette.

## College Workspace

A dashboard with summary metrics — Application Completion %, Upcoming Deadlines (30d), Scholarship Pipeline ($), SAT Countdown — plus a button grid into:

- College Tracker
- Essay Organizer
- Score Tracker
- Award / Honors Tracker
- Scholarship Tracker
- Decision Matrix
- Major Deciding Matrix
- Application Sheets

**Application Sheets** has dedicated subviews: Research, Checklist, Deadlines, Essay Plan, Essay Prompts.

The Decision and Major Deciding Matrices both use weighted criteria (1–5) and 0–10 scores, with auto-calculated ranks and a podium card for the top three.

Rows with dates expose **Schedule this** so applications, scholarships, and essay milestones can become Timeline blocks. Essay rows can create or reopen a draft note directly.

## Life Workspace

The Life dashboard organizes:

**Primary trackers:** Goals, Habits, Sleep, Spending, Journal.
**More Life Tools:** Skills, Fitness, Calories, Calculator, Books.

Notable modules:

- **Sleep** — last night, 7-day average, 30-day average, goal progress %, trend, consistency / streak, quality / energy, bedtime / wake-time average.
- **Spending** — monthly total, transaction count, average per transaction, top category, ledger.
- **Habits** — shared with the Today habit tracker.
- **Goals** — SMART-format with status, due dates, scheduling.

## Business Workspace

Local-first operations dashboard with:

**Modules:** Overview, Analytics, Projects, Opportunities, Clients, Invoices, Finance, Meetings, Tasks, Proposals / Contracts, Notes, Documents / Assets, Goals / Targets.

Operational features:

- KPI cards: active projects, projects at risk, total clients, open invoices, overdue invoices, monthly income, pipeline value.
- Activity summaries.
- Global search/filter across clients, projects, invoices (status filters: open, due-soon, overdue, paid, draft), tasks, meetings, proposals.
- Quick actions strip: create project, client, invoice, meeting, proposal, follow-up, note.
- **Quick business notes** with autosave drafts, templates (proposal draft, invoice follow-up), pinning, filters.
- **Deadlines aggregation** across projects, milestones, invoices, follow-ups, meetings, proposals, and tasks.
- Cross-entity detail panels with summary, links, and activity tabs.

The Business tab is hidden in Student / AP Crunch / College Apps / Writing / Life modes if it has no data, and dimmed (still reachable) if it does.

## Flow Assistant (AI)

A floating chat panel (`Notes → chatbot button`) lets you talk to an AI provider using **your own API key**. Keys are stored only in this browser's `localStorage`.

Supported providers (selected from the chat settings shell):

- **OpenAI** (`https://api.openai.com/v1/chat/completions`)
- **Anthropic Claude** (`https://api.anthropic.com/v1/messages`)
- **Google Gemini**
- **Groq** (`https://api.groq.com/openai/v1/chat/completions`)
- **Custom OpenAI-compatible endpoint** (you supply base URL, model, key)

Capabilities:

- Open / close, fullscreen toggle, info pane (key setup + privacy notes).
- Provider, model, and API-key controls in the assistant settings shell.
- Optional **Insert** button on assistant replies that inserts text at the editor caret (`Settings → Assistant → Show Insert button in assistant replies`).
- Auto-suggestions toggle.
- Panel-default open/closed.
- Enable/disable the entire assistant from `Settings → Assistant → Enable Flow Assistant`.

The provider field accepts an *exact* model ID. Wrong IDs will fail at the provider's API, not in Atelier. Save Keys persists keys for this device only.

> Heads-up: API requests go directly from your browser to the provider you choose. Atelier does not proxy them.

## Themes, Fonts, and Motion

Apply a theme to the **current page**, **all pages**, or a **custom subset** (per-page theming).

Built-in theme presets:

Default, Dark, Botanical, Editorial, Luxury, Sepia, Ocean, Sunrise, Graphite, Aurora, Rosewater, macOS 26, Windows 11, ChromeOS, Ubuntu, GitHub, Spotify, Netflix, Slack, Dune.

Plus:

- Create / edit / delete **custom themes** (saturation/value canvas + hue slider + HEX entry).
- Import and export custom themes as JSON.
- Floating font panel for fast typography changes.
- Motion intensity: full / reduced / off (also tied to system *prefers-reduced-motion*).

## Settings Reference

The Settings view is split into 13 categories. Most controls **stage** a draft until you press **Save & Apply**; integration and assistant-provider controls apply immediately.

| Category | Controls |
| --- | --- |
| Appearance | Light/Dark, density, contrast, card style, corners, shadows, blur, icon size, sidebar style, motion intensity. |
| Layout | Default start view, sidebar default, toolbar visibility, notes list style, dashboard density. |
| Editor | Writing width, autosave (300–8000 ms), font scale, indent size, show metadata, focus-mode default, split-view default. |
| Tasks | Sort strategy (urgency / easy / due / alpha), completion style, density, due-date display, show completed, include homework, include AP Study. |
| Calendar | Default view & source, day start/end hour, time format, timeline density, clock visibility/seconds, planner inclusions (completed / homework / business). |
| Study | Homework density, AP default section, weak-area highlight, due-time visibility, difficulty visibility, student-hub homework toggle. |
| Business | Default business view, compact cards, analytics / activity / deadlines visibility. |
| Assistant | Panel default, enable Flow Assistant, Insert button on replies, auto suggestions. |
| Integrations | Spotify / ChatGPT quick-launch toggles, Google Calendar (id, interval, auto-sync, link / sync-now / unlink), Google Drive (open Drive Settings), Flow Assistant provider settings shortcut. |
| Notifications | Mode (quiet / balanced / high), deadline alerts, study reminders, planner alerts. |
| Accessibility | Interface scale, larger touch targets, high contrast, quiet mode. |
| Data | Workspace mode, default export format, confirm before import, backup nudges, .atelier export, JSON export, import, **Local Data Health** card (last export / import / safety snapshot). |
| Advanced | Feature tabs, web shortcuts, temporary page duration, calendar (.ics) data files, tutorial controls, **Rerun Student Setup**. |

A live preview rail in Settings reflects appearance / layout / task choices as you change them. Each section has a **Reset** button; a **Reset all categories** button is at the bottom of the sidebar.

## Command Palette, Quick Capture, Global Search

- **Command Palette** — `Ctrl/⌘+K` (outside editor inputs). Jump to any view, run Quick Capture, export a `.atelier` backup, create a Weekly Review note, rerun onboarding, open a class dashboard, search by class name, and more.
- **Quick Capture** — natural-language modal accessible from Today's `Capture` button or the Command Palette. Routes the result to Tasks, Homework, Notes, Timeline, AP Study, or College.
- **Global Search** — `Shift+Ctrl/⌘+F` (or `Search everywhere…` in the Command Palette). Groups results across Notes, Tasks, Homework, AP Study, College, and Timeline; respects your workspace mode.
- **Weekly Review** — `Command Palette → Create Weekly Review note` summarizes the past 7 days (completed and missed) plus next-week deadlines into a templated note.

## Import, Export, and Backups

### Workspace exports

- **`.atelier`** — full-fidelity workspace backup (notes, tasks, timeline, settings, homework, AP, college, business, life, theme set, raw `localStorage` snapshot). Use to move between devices.
- **Workspace JSON (`.json`)** — raw data interchange.

A **pre-import safety snapshot** is written automatically before any workspace import.

### Per-note exports

DOCX, DOC (legacy compatibility), PDF, HTML, Markdown, plain text, RTF.

### Calendar

ICS export and import for Timeline interoperability. Includes a *Clear Imported Calendar Data* maintenance action.

### Supported import file extensions

`.atelier`, `.json`, `.txt`, `.md`, `.markdown`, `.html`, `.htm`, `.csv`, `.tsv`, `.rtf`, `.pdf`, `.docx`, `.doc`, `.odt`, `.xlsx`, `.xls`, `.pptx`, `.epub`, `.xml`, `.yaml`, `.yml`, `.log`, `.zip`.

Behavior:

- `.atelier` and workspace `.json` payloads replace the workspace state (after the safety snapshot).
- Document-type imports create an `Imported::...` note page.
- `.doc` (legacy Word) is best-effort in the browser; convert to `.docx` or `.pdf` for higher fidelity.

### Google Drive backup *(experimental, BYO credentials)*

Configure your own OAuth client ID and API key under *Google Drive Settings* (`Settings → Integrations → Google Drive → Open Drive Settings`). Drive is used only for backup uploads/downloads; it is not a sync engine.

## Mobile and Tablet Behavior

- Responsive breakpoints in `styles/mobile.css` at 1024 px (large tablet), 768 px (small tablet), and 640 px (phone).
- The sidebar collapses behind a toggle button and a tap-overlay; pages list scrolls inside the drawer.
- The top tab strip becomes a single **current view** dropdown that expands the full tab list.
- Tabs that overflow available width move into a `More` menu.
- `Settings → Accessibility → Larger touch targets` enlarges interactive elements for thumb-friendly use.
- Modals (task, block, homework, college, life, business) are designed to stack to a single column under 640 px.

The Mascot illustration and marketing landing page (`HomePage.html`) are also mobile-friendly.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/⌘+K` | Open Command Palette (everywhere except editor fields and the AP Study view, which uses the same shortcut for *Add subject*). |
| `Shift+Ctrl/⌘+F` | Open Global Search panel. |
| `Alt+Shift+F` | Toggle Focus Mode. |
| `Ctrl/⌘+Shift+M` | Toggle markdown shortcut on the current selection (where supported). |
| `Tab` / `Shift+Tab` | Indent / outdent list items in the editor. |
| `/` (in editor) | Open the slash command menu. |
| `Enter` / `→` / `←` / `Esc` | Tutorial overlay navigation. |
| `Ctrl/⌘+Enter` | Confirm in some modal contexts. |

Inside the Command Palette, type to filter; arrow keys navigate; `Enter` runs the highlighted command; `Esc` closes.

## Help, Tutorial, and Onboarding

NoteFlow Atelier ships three layered help surfaces:

1. **Student Setup** — the first-launch onboarding wizard adds classes, AP subjects, college focus, picks a workspace mode, and offers an immediate `.atelier` backup. Rerun anytime from `Settings → Advanced → Rerun Student Setup`.
2. **Help & Docs page** — auto-generated as a non-removable page at the top of your tree. It is the in-app source of truth for major features and includes a Table of Contents.
3. **Interactive tutorial** — a guided overlay tour from `Settings → Advanced → Start Interactive Tutorial`. It walks through navigation, notes/templates, slash commands, split view, tasks/streaks, focus timer, themes, calendar, college, life, homework, AP, business, command palette, deadline radar, workspace modes, .atelier backup, ICS, Drive, and the Flow Assistant. Use `Enter` / `→` / `←` to navigate and `Esc` to skip.

A long-form written tutorial lives at [TUTORIAL.md](TUTORIAL.md).

## Data Storage and Privacy

- Storage is **local-first** on this device:
  - **IndexedDB** holds the unified workspace state.
  - **`localStorage`** stores theme settings, AP/homework workspace caches, AI provider keys, and a few other preferences.
- No NoteFlow-operated server; nothing is uploaded by the app itself. The only outbound network calls are:
  - Google Fonts and Font Awesome on the public CDN for typography and icons.
  - Google APIs **only** when you have linked Google Calendar or Google Drive with your own credentials.
  - Your chosen AI provider **only** when you use Flow Assistant with your own key.
- The Local Data Health card in `Settings → Data` shows last `.atelier` export, last import, and last pre-import safety snapshot.
- `.atelier` exports are **not encrypted**. Treat them as personal files. Atelier filters known sensitive setting keys from the export payload, but you should still store backups carefully.
- Clearing browser storage without a backup will lose your local data.

## High-Level Architecture

- `NoteflowAtelier.html` — app shell, view sections, modal markup, structural UI.
- `styles/styles.css` (+ `mobile.css`, `microinteractions.css`, `macos26-redesign.css`) — design tokens, layout, themes, motion, responsive behavior.
- `src/core/app.js` — the bulk of the runtime: state, notes/task/timeline logic, settings orchestration, themes, command palette, deadline radar, AP Battle Plan helpers, tutorial generator, Help & Docs generator, import/export pipeline, Flow Assistant (provider/model/keys), Google Calendar/Drive wiring.
- `src/features/ap-study.js` — AP Study workspace rendering and state.
- `src/features/business-workspace.js` — Business modules, forms, KPI grid, activity, deadline aggregation, detail panels.
- `src/features/homework.js` — Homework data model, lane rendering, paste import parser, JSON import/export, task scheduling integration.
- `src/data/emoji-keywords.generated.js` — emoji search index used by page-icon picker.
- `src/ui/select-enhancer.js`, `src/ui/date-enhancer.js` — custom select/date pickers.
- `scripts/smoke-check.mjs` — repository structural assertions (no deps).

The app is intentionally a single static bundle so that it can be opened directly, served by any static server, or hosted on GitHub Pages without a build pipeline.

## Known Limitations

- **No multi-device sync.** The "cloud" is whatever you copy: a `.atelier` backup, a Drive upload, or an ICS export.
- **Browser storage caps.** IndexedDB and `localStorage` quotas vary by browser; very large media-rich workspaces can hit limits. Export `.atelier` regularly.
- **PDF export uses the browser print pipeline** and can render slightly differently across browsers.
- **External media embeds** depend on the source's CORS / iframe policy. Some sites block embeds.
- **Legacy `.doc` import** is intentionally constrained in-browser. Prefer `.docx`, `.pdf`, or plain text.
- **Google Calendar / Drive** require *your own* OAuth client ID and API key. Behavior depends on those credentials and on Google's quota.
- **Flow Assistant provider/model strings** must match the provider's exact model ID; typos fail at the provider, not in Atelier.
- **`file://` browser sandboxing.** A few features (some image-upload paths, Google Calendar OAuth) need an `http(s)://` origin. Use a static server if you hit this.
- **3-Day timeline view** has been retired; older 3-day data folds into the Day view.

## Troubleshooting

- **App won't open from `index.html`** — `index.html` redirects to `HomePage.html`. If your browser blocks `<meta refresh>`, open `HomePage.html` or `NoteflowAtelier.html` directly.
- **Fonts or icons missing** — the app loads Google Fonts and Font Awesome from the public CDN. Offline use will still work but display fallback fonts.
- **Google Calendar won't link** — open `Settings → Integrations → Google Drive → Open Drive Settings`, enter your OAuth client ID + API key, then try `Link Google Calendar` again.
- **Flow Assistant returns 401 / model errors** — re-check the API key for the active provider and the exact model ID. Both are saved in `localStorage` only.
- **Imported `.atelier` looks wrong** — restore the pre-import safety snapshot from `Settings → Data → Local data health → Download local safety snapshot`.
- **Tabs are missing** — check `Settings → Advanced → Feature Tabs` and the active **Workspace Mode**. Hidden-by-mode tabs with data still appear under the overflow menu.
- **Timer alarm won't stop** — the completion popup keeps the alarm playing until you click *Dismiss*; this is intentional for focus sessions.

## Roadmap and Not-Yet-Implemented

These are *not* in the current build:

- Native voice / audio recording inside notes. *(Audio embeds and uploads work; capture-from-mic does not.)*
- Drawing or sketch canvas inside notes.
- Native multi-device sync without `.atelier` files or your own Drive setup.
- A first-party hosted backup service.
- Shared / multi-user workspaces.
- Server-side AI proxy.

Anything not in this list and not labeled experimental is implemented today.

## License

Licensed under the Apache License 2.0. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
