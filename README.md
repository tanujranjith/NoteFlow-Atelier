# NoteFlow Atelier

NoteFlow Atelier is a local-first productivity workspace built as a static web app. It combines structured notes, task execution, timeline scheduling, academic planning, life tracking, and business operations in one interface.

This README is the complete feature inventory and usage guide for the current app.

## Table of Contents

1. [Product Overview](#product-overview)
2. [Quick Start](#quick-start)
3. [Workspace Map](#workspace-map)
4. [Navigation and Global Controls](#navigation-and-global-controls)
5. [Notes and Pages](#notes-and-pages)
6. [Today Workspace](#today-workspace)
7. [Task System](#task-system)
8. [Focus Timer and Focus Mode](#focus-timer-and-focus-mode)
9. [Timeline and Calendar](#timeline-and-calendar)
10. [College Workspace](#college-workspace)
11. [Life Workspace](#life-workspace)
12. [Homework Workspace](#homework-workspace)
13. [AP Study Workspace](#ap-study-workspace)
14. [Business Workspace](#business-workspace)
15. [Themes, Fonts, and Motion](#themes-fonts-and-motion)
16. [Settings Reference](#settings-reference)
17. [Flow Assistant, Integrations, and Shortcuts](#flow-assistant-integrations-and-shortcuts)
18. [Import, Export, and Backups](#import-export-and-backups)
19. [Help and Tutorial](#help-and-tutorial)
20. [Keyboard and Workflow Shortcuts](#keyboard-and-workflow-shortcuts)
21. [Privacy and Storage Model](#privacy-and-storage-model)
22. [Setup and Run](#setup-and-run)
23. [High-Level Architecture](#high-level-architecture)
24. [Known Limitations](#known-limitations)
25. [License](#license)

## Product Overview

NoteFlow Atelier is designed as one place to:
- capture and organize notes
- run daily execution from tasks and habits
- schedule time with timeline blocks and calendar data
- manage school systems (homework, AP prep, college planning)
- track business operations (clients, projects, invoices, finance)
- maintain local backups and document exports without requiring a backend

Core behavior is local-first. Google Calendar and Google Drive are optional integrations.

## Quick Start

1. Open `NoteflowAtelier.html` (or run `npm run dev` and open the local URL).
2. Create your first page from Notes (`+ New Page`).
3. Use a template or blank page, then start writing.
4. Convert work into tasks from Today and schedule blocks in Timeline.
5. Configure defaults in Settings (appearance, editor, tasks, calendar, data).
6. Export a backup from Settings > Data.

## Workspace Map

- `Today`: command center, tasks, habits, academic planner, execution analytics, focus timer.
- `Timeline`: month/planner/3-day/week/day/year views, block scheduling, source blending.
- `Notes`: page hierarchy, tags, rich editor, split-screen editing, slash commands.
- `College`: admissions workspace with tracker, essays, scores, scholarships, matrices, application sheets.
- `Life`: goals/habits/sleep/skills/fitness/calories/calculator/books/spending/journal.
- `Business`: projects, opportunities, clients, invoices, finance, meetings, tasks, proposals/contracts, notes, docs/assets, goals/targets.
- `Homework`: class/activity assignment lanes with setup tools and JSON import/export.
- `AP Study`: AP subject readiness, units, sessions, practice logs, analytics, weak-area tracking.
- `Settings`: all system preferences and controls.

## Navigation and Global Controls

- Top tab switcher with overflow handling for small widths.
- Collapsible sidebar with page tree, search, tag filtering, hierarchy collapse/expand, favorites, duplicate/rename/delete, drag-and-drop ordering, emoji page icons, and breadcrumb navigation.
- Top clock widget with show/hide, 12h/24h, and seconds controls.
- Integrations dock with Spotify, ChatGPT, and custom shortcuts.
- Bottom save bar with local save, import, export, and Drive backup actions.
- Feature tab visibility toggles in Settings > Advanced.

## Notes and Pages

### Page Management

- Hierarchical titles using `::` (example: `Projects::Website::Launch`).
- Inline page-title editing.
- Template-based creation with live template preview.
- Template starter tasks (optional, per-template).
- Temporary pages with configurable expiration duration.

### Available Page Templates

- Blank Page
- Meeting Notes
- Project Plan
- To-Do List
- Daily Journal
- Weekly Review
- Study Notes
- Sprint Planner
- Client Brief
- Decision Log

### Rich Editor Features

- Formatting: bold, italic, underline, strikethrough, heading 1/2/3, bullets, numbering, quote, code block, clear formatting.
- Insert tools: link, table, image, video, audio, embed, HTML embed, checklist, collapsible section, page link.
- Slash menu (`/`) commands include:
- `h1`, `h2`, `h3`
- `bullet`, `numbered`, `todo`, `toggle`
- `quote`, `divider`, `code`
- `table`, `image`, `video`, `audio`, `embed`, `html`
- `link`, `pagelink`, `callout`
- List indent controls with `Tab` and `Shift+Tab`.
- Word count for active editor pane.

### Split Notes and Focus

- Split-screen notes with secondary-page picker.
- Swap and close controls for secondary pane workflows.
- Focus Mode quick toggle (`Alt+Shift+F`) and Settings default.
- Floating font panel for fast typography and motion controls.

## Today Workspace

Today combines planning and execution in one screen:

- Daily Command Center and summary cards.
- Schedule snapshot with timeline jump actions.
- Task lanes: committed, due today, overdue, completed, all tasks drawer.
- Habit tracker with streak behavior.
- Academic planner for deadlines and extracurricular entries.
- Student hub shortcuts to Homework, AP Study, College, Life, and Business.
- Visual analytics modules: weekly sparkline, monthly heatmap, category donut, and streak counters.

## Task System

Task modal fields and behavior:

- Title
- Notes
- Schedule type (`once`, `daily`, `weekly`)
- Weekly weekday selectors
- Due date
- Category
- Linked note
- Urgency priority
- Difficulty
- Reference URL

Task settings include sorting strategy (urgent first, easy first, due first, alphabetical), density and completion style, due-date display behavior, include/exclude homework and AP-derived tasks, and completed-item visibility.

## Focus Timer and Focus Mode

- Quick presets: 15, 25, 50 minutes.
- Custom hours/minutes/seconds.
- Start, pause, reset actions.
- Ringtone and alarm-volume settings.
- Completion popup with persistent alarm until dismissed.
- Focus Mode strips non-essential chrome for writing/planning.

## Timeline and Calendar

- View modes: Month, Planner, 3-Day, Week, Day, Year.
- Source modes: Atelier, Google, Both.
- Center-day picker for timeline context.
- Time block modal fields: name, start/end, category, color, recurrence, one-time date, reference URL.
- Current block card with live progress.
- Time mode controls (auto or manual morning/afternoon/evening/night).
- ICS export/import and cleanup for imported calendar data.
- Optional auto-sync from Google Calendar with interval control.

## College Workspace

Dashboard and modules:

- Dashboard metrics (completion, deadlines, scholarships, SAT countdown).
- College Tracker
- Essay Organizer
- Score Tracker
- Award/Honors Tracker
- Scholarship Tracker
- Decision Matrix
- Major Deciding Matrix
- Application Sheets

Application Sheets tabs:

- Research
- Checklist
- Deadlines
- Essay Plan
- Essay Prompts

Decision Matrix and Major Deciding Matrix both support weighted criteria and ranked outcomes.

## Life Workspace

Dashboard plus dedicated trackers:

- SMART Goals
- Habits
- Sleep
- Skills
- Fitness
- Calories
- Calculator
- Books
- Spending
- Journal

Notable modules:

- Sleep analytics cards (last night, trend, consistency, goal progress, quality/energy, bedtime/wake pattern).
- Spending summary metrics and category breakdown with transaction ledger.

## Homework Workspace

- Two-lane model: Subjects (classes) and Activities (misc/extracurricular).
- Setup overlay for initial course/activity creation.
- Assignment fields: title, due date, due time, priority, difficulty, notes, done state.
- Due-state chips (no date, overdue, due soon, upcoming).
- Header controls: add class, add misc, export JSON, import JSON, reset setup.

Homework records can sync into Today task surfaces.

## AP Study Workspace

Sections:

- Overview
- Units
- Sessions
- Practice
- Analytics

AP subject model includes exam date/time, target score, confidence, teacher, current unit, notes, and optional linked homework course.

Planning and logging features:

- unit/topic progress and weak-area flags
- session planning by type (`review`, `frq`, `mcq`, `practice test`, `weak area`, `mixed`)
- practice logs with score, max score, minutes, confidence-after, weak flag
- exam countdown and readiness analytics
- hooks to tasks and timeline planning

## Business Workspace

Core modules:

- Overview
- Analytics
- Projects
- Opportunities
- Clients
- Invoices
- Finance
- Meetings
- Tasks
- Proposals/Contracts
- Notes
- Documents/Assets
- Goals/Targets

Operational features:

- KPI cards and activity summaries.
- Global business search/filtering.
- Quick actions for common record creation.
- Quick business notes with autosave draft, templates, pinning, and filters.
- Deadlines aggregation (projects, invoices, follow-ups, meetings, proposals, tasks).
- Detail panel tabs (summary, links, activity) with cross-entity linking.

## Themes, Fonts, and Motion

Theme capabilities:

- apply to current page, all pages, or custom page set
- built-in presets: Default, Dark, Botanical, Editorial, Luxury, Sepia, Ocean, Sunrise, Graphite, Aurora, Rosewater, macOS 26, Windows 11, ChromeOS, Ubuntu, GitHub, Spotify, Netflix, Slack, Dune, and Custom Theme
- custom theme create/edit/import/export

Typography and motion:

- font family, size, and line-height controls
- theme panel and floating font panel support
- global motion toggle plus reduced/off intensity settings

## Settings Reference

Settings categories and what they control:

- Appearance: density, contrast, card style, corners, shadows, blur, icon size, sidebar style, motion intensity.
- Layout: default start view, sidebar default, toolbar visibility, notes list style, dashboard density.
- Editor: writing width, autosave interval, font scale, indent size, metadata visibility, focus-mode default, split-view default.
- Tasks: sorting, completion style, density, due display, include AP/homework tasks, show completed.
- Calendar: default view/source, day start/end, time format, timeline density, clock/seconds, planner include toggles.
- Study: homework density, AP default section, weak-area highlight, due-time and difficulty visibility, student-hub homework visibility.
- Business: default section, compact cards, analytics/activity/deadline visibility.
- Assistant: panel default, enable toggle, selected-text action button, auto suggestions.
- Integrations: Spotify/ChatGPT launcher toggles, Google Calendar controls, Drive settings, assistant provider shell.
- Notifications: quiet/balanced/high mode and planner/deadline/study nudges.
- Accessibility: UI scale, larger touch targets, high contrast, quiet mode.
- Data: workspace import/export controls, default export format, import confirmation, backup reminders.
- Advanced: feature tab toggles, custom shortcuts, temporary page duration, ICS controls, tutorial relaunch.

## Flow Assistant, Integrations, and Shortcuts

- Flow Assistant panel supports open/close, fullscreen, info, provider/model/key controls, and optional selected-text insertion actions.
- Google Calendar controls include calendar ID, sync interval, auto-sync toggle, and link/sync-now/unlink actions.
- Google Drive supports credential entry (client ID and API key) and backup actions.
- Quick app launchers support Spotify and ChatGPT.
- Custom shortcuts can target URLs or pages, include optional icon/emoji, and be placed in tabs dock or sidebar.

## Import, Export, and Backups

### Workspace Exports

- Atelier project package (`.atelier`) for full-fidelity backup.
- Workspace JSON (`.json`) for raw data interchange.

### Current Note Exports

- DOCX (`.docx`)
- DOC (`.doc`, compatibility path)
- PDF (`.pdf`)
- HTML (`.html`)
- Markdown (`.md`)
- Plain text (`.txt`)
- Rich text (`.rtf`)

### Calendar Exports

- ICS (`.ics`) export and import for planner interoperability.

### Supported Import Extensions

`.atelier`, `.json`, `.txt`, `.md`, `.markdown`, `.html`, `.htm`, `.csv`, `.tsv`, `.rtf`, `.pdf`, `.docx`, `.doc`, `.odt`, `.xlsx`, `.xls`, `.pptx`, `.epub`, `.xml`, `.yaml`, `.yml`, `.log`, `.zip`

Import behavior:

- `.atelier` and workspace `.json` payloads replace workspace state.
- Document-type imports create a new `Imported::...` note page.
- Legacy `.doc` import is intentionally limited and may require conversion to `.docx` or PDF first.

## Help and Tutorial

- The `Help & Docs` page is auto-generated inside the app and acts as the in-app source of truth.
- A multi-step interactive tutorial can be started, resumed, skipped, or redone from Settings.
- Tutorial covers navigation, notes, tasks, timeline, school modules, business modules, theme/system settings, import/export, and assistant/integrations.

## Keyboard and Workflow Shortcuts

- `Alt+Shift+F`: toggle Focus Mode.
- `Tab` / `Shift+Tab`: indent/outdent list levels in the editor.
- `/` inside editor: open slash command menu.
- Tutorial overlay controls: `Enter` or `ArrowRight` for next, `ArrowLeft` for previous, `Escape` to skip.

## Privacy and Storage Model

- Local-first by default: workspace state is stored in browser storage on the device.
- No account is required for core features.
- Google integrations are optional and only used when configured.
- Backup and restore are user-driven through local files and optional Drive sync.

## Setup and Run

### Runtime Reality

- `index.html` routes to `HomePage.html`.
- Main app runtime is static: `NoteflowAtelier.html` + `app.js` + `styles.css`.
- No React runtime is required.

### Requirements

- Node.js 18+
- npm

### Local Open

Open either:

- `HomePage.html` (landing page)
- `NoteflowAtelier.html` (main app)

### Development

```bash
npm install
npm run dev
```

### Build and Preview

```bash
npm run build
npm run preview
```

### Checks

```bash
npm run check
```

## High-Level Architecture

- `NoteflowAtelier.html`: shell, views, modal markup, and structural UI regions.
- `styles.css`: design tokens, component styles, responsive behavior, theme surfaces.
- `app.js`: core app state, notes/task/timeline logic, tutorial/help generation, import/export pipeline, integrations, settings orchestration.
- `ap-study.js`: AP Study rendering and state synchronization.
- `business-workspace.js`: business modules, forms, analytics, links, detail panel logic.
- `homework.js`: homework data model, rendering, actions, and import/export.
- `select-enhancer.js`, `date-enhancer.js`: enhanced select/date UX controls.

## Known Limitations

- Browser PDF rendering/export behavior can vary; fallback paths are provided.
- External media embedding can fail under CORS or source restrictions.
- Legacy `.doc` import is intentionally constrained in-browser.
- Google Calendar and Drive behavior depends on user credentials and browser/network state.

## License

Licensed under Apache License 2.0. See `LICENSE` and `NOTICE`.
