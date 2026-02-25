# NoteFlow Atelier

NoteFlow Atelier is a local-first, static multi-page workspace with notes, tasks, timeline planning, academic planning, college application workflows, life tracking, homework tracking, and optional Google Drive backup.

## 2026 Feature Expansion (Academic + College App + Life)

This release adds three new first-class tabs and keeps all existing views intact:

- `Academic` tab
  - Assignment database (CRUD + filter/sort by due date, priority, class, status)
  - Exam database (CRUD + filter/sort)
  - Class database
  - Class notes templates with one-click insert into current note
  - Flashcards organizer with spaced-repetition fields (`reviewOutcome`, `nextReviewDate`, `intervalDays`)
  - Extracurricular tracker
  - Upcoming deadlines aggregate panel (next 7 days) combining assignments, exams, and class meetings

- `College App` tab
  - College tracker (`school`, `deadline`, `status`, `checklist`)
  - Essay organizer (`prompt`, `draftStatus`, `versionNotes`)
  - Score tracker (SAT/ACT/AP + date + breakdown)
  - Awards/Honors tracker
  - Scholarship tracker (`amount`, `deadline`, `status`)
  - Decision matrix with weighted criteria and computed rankings per college
  - Dashboard card for application completion progress

- `Life` tab
  - SMART goals tracker (`targetDate`, `progress`)
  - Habit tracker with daily completion and visible current streaks
  - Skills tracker
  - Fitness tracker
  - Book tracker
  - Spending tracker with monthly summary
  - Daily journal with date-based quick-create naming (`Journal YYYY-MM-DD`)
  - Dashboard card for habit consistency

### Migration and compatibility

- Workspace schema version increased to `2`.
- New workspace fields are persisted in IndexedDB and included in JSON export/import:
  - `academicWorkspace`
  - `collegeAppWorkspace`
  - `lifeWorkspace`
  - `ui.lastActiveView` (persists the last selected tab)
- Import remains backward compatible:
  - Old exports without new fields are normalized with safe defaults/starter seeds.
  - New exports round-trip with full Academic/College App/Life data.
- Existing tabs and data (`Today`, `Timeline`, `Notes`, legacy `College`, `Homework`, `Settings`) are preserved and still reachable.

## Getting Started

### Option 1: Open as plain static files (no tooling)
1. Open `HomePage.html` in a modern browser.
2. Use the launch buttons to open:
   - `NoteflowAtelier.html` (main app)
   - `NoteFlow (classic)/NoteFlow.html` (classic app)
  - `Homework.html` (launcher that opens the Homework view in Atelier)

### Option 2: Run as a static site with Vite (recommended for local hosting)
```bash
npm install
npm run dev
```
Then open the URL shown by Vite.

### Build/preview (optional)
```bash
npm run build
npm run preview
```

## Pages

| Entry page | Purpose | How users reach it |
| --- | --- | --- |
| `HomePage.html` | Landing page and launcher | Start here directly |
| `NoteflowAtelier.html` | Main NoteFlow Atelier workspace | `HomePage.html` buttons |
| `Homework.html` | Redirect launcher to Atelier Homework view | `HomePage.html` button |
| `NoteFlow (classic)/NoteFlow.html` | Classic NoteFlow interface | `HomePage.html` button |

## Features

### `HomePage.html` (Landing)

- **Primary app launch links** - Opens Atelier, Classic, and Homework pages. Where: top bar, hero CTA, and bottom CTA. How: click launch buttons. Storage: none.
- **In-page navigation** - Anchor jump to Features section and skip-to-content link. Where: top hero and skip link. How: click `See Features` or keyboard focus `Skip to content`. Storage: none.
- **Preview image viewer links** - Opens full screenshot assets in new tabs. Where: hero preview cards. How: click either screenshot card. Storage: none.
- **Reveal-on-scroll animations** - Section cards animate into view. Where: major content sections. How: scroll page. Storage: none.
- **Reduced-motion fallback** - Reveals content immediately when reduced motion is preferred. Where: landing script behavior. How: browser/system reduced motion setting. Storage: none.
- **Current year auto-fill** - Footer year updates at runtime. Where: footer. How: automatic. Storage: none.

### `NoteflowAtelier.html` + `app.js` (Main Workspace)

#### Navigation and layout

- **Multi-view workspace tabs** - `Today`, `Timeline`, `Notes`, `Academic`, `College App`, `Life`, legacy `College`, `Settings`, `Homework`. Where: top nav tabs. How: click tab buttons. Storage: last selected tab is persisted in `ui.lastActiveView`.
- **Mobile tab toggle** - Collapsible view tab list on smaller screens. Where: top nav (mobile). How: tap tab toggle. Storage: none.
- **Collapsible sidebar** - Expands/collapses notes sidebar with mobile overlay support. Where: left sidebar and floating toggle. How: click sidebar toggle. Storage: saved in workspace settings (`sidebarCollapsed`).
- **Global search input** - Filters notes/tasks context from top nav. Where: top-right search field. How: type search terms. Storage: runtime search only (not persisted).

#### Notes workspace and organization

- **Hierarchical pages via `::` naming** - Supports nested page structure. Where: page creation/renaming and sidebar tree. How: create names like `Projects::Website::Launch`. Storage: page titles in workspace `pages`.
- **Create page modal with templates** - New page modal supports template starter content. Where: `New Page` button and modal. How: create page, choose optional template. Storage: new page object saved to workspace `pages`.
- **Rename page flow** - Rename modal updates page title. Where: page actions. How: trigger rename and save. Storage: updated page title in `pages`.
- **Delete page** - Removes selected page. Where: page actions. How: trigger delete action. Storage: page removed from `pages`.
- **Duplicate page** - Clones selected page content/theme metadata. Where: page actions. How: trigger duplicate action. Storage: additional page record in `pages`.
- **Drag-and-drop page reordering/nesting** - Sidebar supports drag interactions for hierarchy ordering. Where: pages list. How: drag page entries. Storage: resulting order/path in `pages`.
- **Collapse/expand page branches** - Parent nodes can collapse nested pages. Where: sidebar tree. How: click collapse control. Storage: collapsed state on page objects.
- **Favorite/default page support** - Stores preferred startup page IDs. Where: page actions/settings logic. How: set favorite/default in UI actions. Storage: workspace `ui.favoritePageId` / `ui.defaultPageId`.
- **Sidebar search** - Filters pages in sidebar by title/content query. Where: sidebar search box. How: type query. Storage: none.
- **Breadcrumb trail** - Shows current hierarchical path. Where: notes editor header. How: automatic when page loaded. Storage: derived from page title.
- **Page emoji icon picker** - Assign/remove emoji icons for pages. Where: page list icon control and emoji modal. How: open picker, choose emoji or remove. Storage: page `icon` property in `pages`.
- **Page tags** - Add/remove per-page tags and filter pages by tags. Where: notes header tags area + sidebar tag filter. How: add tags with tag input; click tags to filter. Storage: tag arrays on pages.

#### Notes editor

- **Rich text toolbar formatting** - Bold, italic, underline, strikethrough, headings, quote, code block, ordered/unordered lists. Where: Notes toolbar. How: click toolbar buttons. Storage: HTML content in page `content`.
- **Link insertion and management** - Insert links, click tooltip to edit/remove links. Where: toolbar and link tooltip. How: insert link then use tooltip actions. Storage: editor HTML content.
- **Table insertion** - Inserts configurable table blocks. Where: Notes toolbar and slash commands. How: click table icon or slash command. Storage: editor HTML content.
- **Media insertion** - Image/video/audio with URL or upload flows; embed web content. Where: toolbar actions. How: choose insert action and provide URL/file. Storage: editor HTML content; uploaded data URLs can increase saved data size.
- **Checklist blocks** - Adds interactive checkbox tasks in editor content. Where: toolbar/slash commands. How: insert checklist block. Storage: checklist HTML in page content.
- **Collapsible/toggle blocks** - Expand/collapse custom content sections. Where: toolbar/slash commands. How: insert collapsible block and edit title/body. Storage: HTML structure in page content.
- **Page-to-page links** - Insert links that jump to another note page by ID. Where: toolbar page-link action. How: choose target page name from prompt. Storage: special link span in page content.
- **Slash command menu (`/`)** - Keyboard command palette for block insertion/formatting. Where: editor. How: type `/` and select command. Storage: resulting inserted content only.
- **Word count** - Live count for current note. Where: toolbar word count display. How: automatic while typing. Storage: none.
- **Media resizing/alignment controls** - Resizable wrappers and alignment/size actions for media blocks. Where: media block controls. How: drag resize handle or use media menu. Storage: inline style/markup in page content.
- **Auto-save behavior** - Editor changes trigger debounced saves plus periodic persistence. Where: runtime app logic. How: automatic. Storage: persisted to IndexedDB workspace.

#### Tasks, streaks, and progress

- **Task CRUD modal** - Add/edit tasks with title, notes, schedule type, weekly days, due date, category, note link, priority, and difficulty. Where: Today view add-task buttons + task cards. How: open task modal and save. Storage: workspace `tasks` and `taskOrder`.
- **Task scheduling modes** - One-time, daily, and weekly recurring tasks. Where: task modal schedule selector. How: select schedule and optional days. Storage: task `scheduleType` and `weeklyDays`.
- **Commit/uncommit flow** - Mark tasks as committed for current day. Where: task cards in Today view. How: commit/uncommit actions. Storage: streak day-state structures in workspace `streaks.dayStates`.
- **Completion tracking** - Mark tasks complete/incomplete with streak impact. Where: task cards. How: complete/undo actions. Storage: task state plus day-state history.
- **Today panels** - Dedicated lists for Committed Today, Due Today, Completed Today. Where: Today view. How: automatic categorization and task actions. Storage: derived from task/day-state data.
- **All Tasks drawer** - Collapsible panel listing all tasks. Where: Today view drawer. How: `All Tasks` button open/close. Storage: none beyond task data.
- **Streak and summary cards** - Current streak, best streak, committed days, weekly completions, freezes left. Where: Today summary cards. How: automatic updates from day-state logic. Storage: workspace `streaks.streakState` and related maps.
- **Progress dashboard widgets** - Weekly sparkline, monthly heatmap, category donut, streak stats cards. Where: Today view "Progress" section. How: automatic rendering from tasks/streak state. Storage: derived; no extra key.
- **Task ordering strategy** - `Urgency first` or `Easy-first momentum`. Where: Settings view. How: select from dropdown. Storage: workspace settings (`taskOrderStrategy`).

#### Timeline (TimeTile)

- **Daily timeline view** - Visual schedule lane with hour markers and blocks. Where: Timeline tab. How: switch to Timeline view. Storage: workspace `timeBlocks`.
- **Add/edit/delete time blocks** - Block modal supports name, start/end time, category, color, recurrence. Where: Timeline view + block modal. How: click `+ Add Block` or existing block. Storage: `timeBlocks` entries.
- **Current block card** - Shows active block info, remaining time, and progress bar. Where: Timeline view. How: automatic based on current time. Storage: none (derived).
- **Time mode themes** - Auto/morning/afternoon/evening/night mode badge and selector. Where: Timeline view header. How: choose mode from selector (or auto). Storage: workspace setting `timeMode`.

#### Homework (embedded in main app)

- **First-run setup overlay** - Add class and misc chips before using homework table. Where: Homework tab. How: type names, press Enter/comma, click `Get Started`. Storage: `hwCourses:v2` and `hwTasks:v2` in `localStorage`.
- **Homework table by class/misc** - Two-sided table with classes and extracurricular/misc columns. Where: Homework tab. How: add tasks inline per course row. Storage: `localStorage` homework keys.
- **Homework task controls** - Due date, urgency, difficulty, done/undo, delete task. Where: Homework table rows. How: use inline controls per task. Storage: `localStorage` homework keys.
- **Class/misc management** - Add class, add misc, delete course with cascading task removal. Where: Homework header buttons and course delete control. How: buttons/prompts and delete action. Storage: `localStorage` homework keys.
- **Homework JSON export/import** - Export and import `courses/tasks` payload. Where: Homework tab buttons. How: click Export or choose JSON file on Import. Storage: imported data writes to homework keys.
- **Homework setup reset** - Clears homework data and reopens setup. Where: `Setup` button in Homework tab. How: confirm reset prompt. Storage: clears `hwCourses:v2` and `hwTasks:v2`.
- **Cross-view homework task sync** - Homework items are mirrored into task surfaces for Today/Progress calculations. Where: app sync logic. How: automatic via `homework:updated` and periodic refresh. Storage: homework source remains localStorage; synced task projections are in runtime/workspace task data.

#### Settings, personalization, and assistance

- **Theme presets and custom colors** - Light/dark presets plus custom palette controls. Where: theme panel and settings. How: open theme switcher and apply preset/custom values. Storage: workspace settings theme/custom theme values.
- **Apply theme scope** - Apply theme to current page, all pages, or selected pages. Where: theme panel apply-mode controls. How: choose mode and apply theme. Storage: page theme/custom theme fields + selected page IDs.
- **Typography controls** - Font family, size, and line-height controls with toolbar/settings hooks. Where: font panel and settings controls. How: select typography options. Storage: workspace font settings.
- **Motion controls** - Toggle reduced motion from settings/toolbar. Where: Settings and toolbar toggles. How: switch motion toggle. Storage: workspace setting `motionEnabled`.
- **Toolbar clock + settings** - 12h/24h format and seconds toggle. Where: tab-embedded clock widget. How: open clock settings gear and choose options. Storage: workspace settings (`timeFormat`, `showSeconds`).
- **Focus timer** - Start/pause/reset timer with configurable H/M/S and presets. Where: sidebar timer widget and controls. How: use timer buttons/settings inputs. Storage: workspace `settings.focusTimer` (fallback key `noteflow_focus_timer`).
- **Bottom save bar** - Save locally, export, import, save to Drive actions + save-status pill. Where: bottom floating action bar. How: click corresponding buttons. Storage: depends on action (workspace persistence/export/Drive).
- **Interactive guided tutorial** - Multi-step product walkthrough with guided actions. Where: Settings `Start Interactive Tutorial`. How: start tutorial and use next/back/action controls. Storage: tutorial completion timestamp in workspace settings.
- **Built-in AI assistant (Flow)** - Chat panel with Groq API key input, markdown-ish response rendering, copy/insert actions, fullscreen, and info panel. Where: floating mascot/chat panel. How: save Groq key, send prompt. Storage: API keys and chat history are session-scoped; model preferences remain in `localStorage`.
- **Google Drive backup (optional)** - Configure own Google Cloud Client ID/API key and save workspace JSON to Drive. Where: Drive settings modal and save-to-drive button. How: enter credentials, connect, save. Storage: workspace `settings.drive`; Drive receives uploaded backup file.
- **Google Calendar live sync (optional)** - Link a Google Calendar (read-only) and auto-sync upcoming events into Timeline blocks. Where: Settings `Calendar Sync`. How: set calendar id/interval, link, sync now, optionally auto-sync. Storage: workspace `settings.googleCalendar`; synced events stored as timeline blocks with source `calendar_google`.

#### Import/export and migration

- **Workspace export JSON** - Exports pages, tasks, task order, time blocks, streaks, academic workspace, college app workspace, life workspace, settings, UI metadata, schema version, timestamp, and theme info. Where: save bar/settings export buttons. How: click Export. Storage: downloaded file only.
- **Workspace import JSON** - Imports compatible workspace payloads and refreshes UI/state. Where: import modal/file picker. How: choose JSON export file. Storage: overwrites in-browser workspace data.
- **Document import into new notes** - Imports non-workspace files into new pages under `Imported::...`. Supported extensions include `.txt`, `.md`, `.html`, `.csv`, `.tsv`, `.rtf`, `.pdf`, `.docx`, `.xlsx`, `.xls`, `.pptx`, `.odt`, `.epub`, `.xml`, `.yaml`, `.yml`, `.log`, and `.json` (as document if not workspace payload). Where: import flow. How: choose or drag-drop file. Storage: imported content saved into new note pages in workspace.
- **Legacy migration reads** - Migrates old NoteFlow/Streak localStorage keys when IndexedDB workspace is missing. Where: startup initialization. How: automatic. Storage: migrated data written to IndexedDB workspace.

### `Homework.html` + `homework.js` (Homework Entry + Embedded Homework)

- **Homework entry launcher** - `Homework.html` redirects to `NoteflowAtelier.html?view=homework` for direct access to the embedded Homework workspace.
- **Homework data engine** - `homework.js` powers the Homework UI inside Atelier, including setup flow, task editing, and import/export with compatibility for legacy keys.

### `NoteFlow (classic)/NoteFlow.html` (Classic Interface)

- **Classic notes workspace** - Sidebar pages, page editor, tag system, and rich text toolbar. Where: Classic page main UI. How: create/select/edit pages in classic interface. Storage: browser-local (classic workspace logic).
- **Classic todo panel** - Sidebar todo input, filters, priority/category/recurrence controls, progress indicator. Where: classic sidebar. How: add tasks and manage with filter controls. Storage: browser-local classic storage.
- **Classic theme panel** - Multiple presets (Default, Dark, Forest, Ocean, Sunset, Sepia) and apply scopes. Where: classic theme panel. How: open palette button and apply preset/customization. Storage: browser-local classic settings.
- **Classic import/export and Drive controls** - Local save/export/import plus Drive backup settings/actions. Where: classic save bar/modals. How: use storage buttons and Drive modal. Storage: browser local + optional Drive upload.
- **Classic AI assistant panel** - Groq key-based assistant with insert/copy actions. Where: classic chat panel. How: same as Atelier flow. Storage: API key and chat history are session-scoped.
- **Classic focus timer and clock widget** - Timer controls and toolbar clock settings. Where: sidebar/top toolbar. How: use timer and clock controls. Storage: browser-local settings.

## Data and Storage

### Primary workspace storage

- **IndexedDB database:** `noteflow_atelier_db`
- **Object store:** `workspace`
- **Record key:** `root`
- **Schema field:** `version` (currently `2` in code)

Main persisted workspace payload includes:
- `pages`
- `tasks`
- `taskOrder`
- `streaks` (`dayStates`, `taskStreaks`, `streakState`)
- `academicWorkspace`
- `collegeAppWorkspace`
- `lifeWorkspace`
- `settings` (theme/font/motion/drive/time/focus timer/tutorial/task order)
- `ui` (`favoritePageId`, `defaultPageId`, `lastActiveView`)
- `timeBlocks`

### LocalStorage keys used directly by current code

- `hwCourses:v2`, `hwTasks:v2` (homework data)
- `homeworkCourses:v1`, `homeworkTasks:v1` (legacy homework fallback read)
- `noteflow_focus_timer` (focus timer fallback)
- `chat_model` (optional model override)

### Legacy migration keys read by Atelier startup

- `noteflow_pages`
- `noteflow_theme_settings`
- `noteflow_font_settings`
- `noteflow_animations`
- `noteflow_sidebar_collapsed`
- `noteflow_favorite_page`
- `noteflow_default_page`
- `noteflow_todos`
- `streakApp:v1`
- `streakApp:settings`

### Export formats

- **Workspace export:** JSON file named like `noteflow_export_YYYY-MM-DD.json`.
- **Homework export:** JSON file named like `homework-YYYY-MM-DD.json` with `{ courses, tasks }`.

## File/Folder Overview

```text
.
|-- HomePage.html
|-- Homework.html
|-- index.html
|-- NoteflowAtelier.html
|-- NoteFlow (classic)/
|   `-- NoteFlow.html
|-- app.js
|-- date-enhancer.js
|-- homework.js
|-- select-enhancer.js
|-- styles.css
|-- assets/
|   |-- Mascot-320.png
|   |-- Mascot.png
|   |-- NoteFlow Atelier Daily view.png
|   |-- NoteFlow Atelier favicon-64.png
|   |-- NoteFlow Atelier favicon.png
|   `-- NoteFlow Atelier text editing.png
|-- package.json
|-- vite.config.js
`-- README.md
```

## Troubleshooting

- **Atelier import of some file types fails**
  - Cause: external parser scripts (PDF.js, Mammoth, JSZip, XLSX) need network access.
  - Fix: ensure internet connectivity and allow script loading from their CDNs.

- **`.doc` import fails with an explicit error**
  - Cause: legacy `.doc` is intentionally not parsed reliably in-browser.
  - Fix: convert to `.docx` or `.pdf` and import again.

- **Google Drive backup does not connect**
  - Cause: missing/invalid Client ID or API key, or blocked Google API script.
  - Fix: verify credentials in Drive settings and check browser console/network access.

- **AI assistant replies with auth/network errors**
  - Cause: missing Groq API key, invalid key, or network/CORS failure.
  - Fix: save a valid key in assistant settings and retry.

- **Homework view does not show expected old records**
  - Cause: data may exist in legacy keys.
  - Current behavior: page now reads legacy homework keys when v2 keys are empty.

- **Opening via `file://` works but some integrations are limited**
  - Cause: browser security/network restrictions for remote APIs/scripts.
  - Fix: run through a local static server (`npm run dev`) for more consistent behavior.

