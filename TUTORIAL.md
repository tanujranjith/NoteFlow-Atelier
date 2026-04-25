# NoteFlow Atelier — User Tutorial

A practical, step-by-step guide to using NoteFlow Atelier from your first launch through your first full week. This is the long-form companion to the in-app **Help & Docs** page and **Interactive Tutorial**.

> If you'd rather watch the app teach itself, open `Settings → Advanced → Tutorial & Onboarding → Start Interactive Tutorial`. The walkthrough that follows mirrors and expands that overlay tour.

---

## Contents

1. [Open the app for the first time](#1-open-the-app-for-the-first-time)
2. [Get oriented in 30 seconds](#2-get-oriented-in-30-seconds)
3. [Pick a Workspace Mode](#3-pick-a-workspace-mode)
4. [Run Student Setup (or skip it)](#4-run-student-setup-or-skip-it)
5. [Make your first note](#5-make-your-first-note)
6. [Add your first task and habit](#6-add-your-first-task-and-habit)
7. [Use the Daily Brief and Plan My Day](#7-use-the-daily-brief-and-plan-my-day)
8. [Block time on the Timeline](#8-block-time-on-the-timeline)
9. [Set up Homework](#9-set-up-homework)
10. [Set up AP Study and the AP Battle Plan](#10-set-up-ap-study-and-the-ap-battle-plan)
11. [Set up the College Workspace](#11-set-up-the-college-workspace)
12. [Use the Life trackers](#12-use-the-life-trackers)
13. [Use the Business / Freelance workspace](#13-use-the-business--freelance-workspace)
14. [Master the Command Palette, Quick Capture, and Global Search](#14-master-the-command-palette-quick-capture-and-global-search)
15. [Split-screen and Focus Mode](#15-split-screen-and-focus-mode)
16. [Connect the Flow Assistant (AI)](#16-connect-the-flow-assistant-ai)
17. [Personalize themes, fonts, and motion](#17-personalize-themes-fonts-and-motion)
18. [Tune Settings](#18-tune-settings)
19. [Back up with `.atelier` (and restore safely)](#19-back-up-with-atelier-and-restore-safely)
20. [Connect Google Calendar and Google Drive (optional)](#20-connect-google-calendar-and-google-drive-optional)
21. [Use Atelier on phone or tablet](#21-use-atelier-on-phone-or-tablet)
22. [Build a weekly review habit](#22-build-a-weekly-review-habit)
23. [Tutorial recap & cheat sheet](#23-tutorial-recap--cheat-sheet)

---

## 1. Open the app for the first time

NoteFlow Atelier is a single static web app — no installer, no account, no build step.

- **Easy way:** double-click `NoteflowAtelier.html`. It opens in your default browser.
- **Marketing landing:** double-click `index.html` (it redirects to `HomePage.html`) and click **Start your session**.
- **Hosted version:** anywhere the repository is deployed as a static site (e.g. GitHub Pages).
- **Optional local server** (nicer for OAuth-based features):

  ```bash
  python -m http.server 5173
  # then visit http://localhost:5173/NoteflowAtelier.html
  ```

The first launch creates a *Welcome to NoteFlow* page and a built-in *Help & Docs* page in your sidebar.

---

## 2. Get oriented in 30 seconds

You'll see three regions:

- **Sidebar (left)** — page tree, sidebar search, tag filter, focus timer, page actions, *New Page* button.
- **Top bar** — brand, view tabs (Today / Timeline / Notes / College / Life / Business / Homework / AP Study / Settings), clock widget, integrations dock (Spotify, ChatGPT, custom shortcuts), theme button, mobile menu toggle.
- **Main area** — the active view.

The very bottom of the app has a **save bar** with quick *Save Locally*, *Export*, *Import*, and *Save to Drive* buttons. Most workflows don't need it because the app autosaves continuously.

Press **Ctrl/⌘+K** at any time (outside an editor field) to open the **Command Palette** — your fastest way around the app.

---

## 3. Pick a Workspace Mode

Workspace Modes promote the views you actually use. They never delete data — hidden views with content stay reachable through the overflow `More` menu.

Open `Settings → Data & Backups` and pick a mode:

| Mode | Best for |
| --- | --- |
| **Standard** | "Show me everything." |
| **Student** | High school / college student with classes, AP, college apps, life. *(Business hidden.)* |
| **AP Crunch** | Days/weeks before an AP exam — Today, AP Study, Homework, Timeline, Notes only. |
| **College Apps** | Senior fall — College, Notes, Today, Timeline, Homework. |
| **Writing** | Notes-first; Today + Timeline as planning aids. |
| **Life** | Habits, sleep, journal, spending, goals. |
| **Business / Freelancer** | Full operations dashboard. |

Click **Save & Apply** at the top of Settings to commit the change.

---

## 4. Run Student Setup (or skip it)

A first-launch wizard offers to:

1. Name your **classes**.
2. Add your **AP subjects**.
3. Decide whether to enable **College App** tools.
4. Pick a **Workspace Mode**.
5. Export an immediate `.atelier` backup.
6. Open Today.

You can skip steps, finish later, or rerun the wizard anytime: `Settings → Advanced → Tutorial & Onboarding → Rerun Student Setup`.

> Setup is local. Nothing leaves your browser. The completed setup is included in your `.atelier` backups.

---

## 5. Make your first note

1. Click `+ New Page` in the sidebar.
2. Give it a title. Use `::` to nest, e.g. `Projects::Website::Launch`.
3. Pick a **template** (Blank, Meeting Notes, 1:1 Check-In, Project Plan, To-Do List, Daily Journal, Weekly Review, Study Notes, Research Brief, Sprint Planner, Roadmap Plan, Client Brief, Content Brief, or Decision Log). Templates can optionally seed starter tasks — toggle this in the preview panel.
4. Click **Create**.

Now write. The editor supports:

- A **toolbar** with bold, italic, underline, strikethrough, H1–H3, bullets, numbered lists, quote, and code block.
- An **insert** menu for link, table, image, video, audio, embed, embed HTML, checklist, collapsible section, and page link.
- A **slash menu** — type `/` and pick from H1/H2/H3, bullet, numbered, to-do, toggle, quote, divider, code, table, image, video, audio, embed, embed HTML, markdown, link, link to page, callout. Type to filter.
- `Tab` and `Shift+Tab` to indent and outdent list items.
- `Ctrl/⌘+Shift+M` to toggle the markdown shortcut on the current selection.
- A live **word count** in the page header.
- **Autosave** every 1 s by default (configurable in `Settings → Editor`).

Try assigning the page an emoji icon (page row icon menu), tagging it (tags input near the title), or marking it favorite for quick access.

### Temporary pages

If you need a scratch page that disposes of itself, mark it temporary. Set the default expiration in `Settings → Advanced → Temporary Pages` (minutes / hours / days).

---

## 6. Add your first task and habit

From **Today**:

1. Click **+ Task** in the header.
2. Fill in title, optional notes, schedule (`once` / `daily` / `weekly` with weekday picker), due date, category, optional linked note, urgency, difficulty, and reference URL.
3. Save.

Tasks appear under **Focus / What matters today**. Commit a few priorities (one click) and the bar at the top of the panel reflects how many you've committed.

To add a habit:

- Type a name in the *Add a habit…* input under the **Habits** card and press Enter.
- Tap the habit each day to mark it done. Streaks, weekly consistency, and freezes are tracked automatically.

To see all tasks (committed, due, overdue, completed) open the **All tasks** drawer from the Today header.

Tweak how tasks behave in `Settings → Tasks`: sort strategy (urgency / easy / due / alpha), completion style (strike / fade / minimal), density, due-date display (relative / absolute / both), include homework, include AP Study, show completed.

---

## 7. Use the Daily Brief and Plan My Day

The **Daily Brief** card on Today summarizes: overdue, today, tomorrow, and this-week counts, plus one **Next Best Action** computed deterministically from your data.

- **Open Deadline Radar** — a modal with every deadline (tasks, homework, AP exams, college, timeline blocks, business deadlines) grouped by *overdue / today / tomorrow / this week / later*. Each row gives you **Open** and **Schedule this** to drop a prep block on Timeline.
- **Plan My Day** — sequences your committed priorities against the calendar. Open the *Recommended sequence* disclosure to see the plan, and pick **Apply plan to calendar** from the header overflow to materialize it as Timeline blocks.
- **Auto-block events** — toggle in the Today header overflow to auto-create blocks from new calendar events going forward.

Use the **Capture** button to fire **Quick Capture**: type *"Chem essay due Friday hard"* or *"AP Physics FRQ practice tomorrow 6pm"* and the parser routes the result into the right surface.

---

## 8. Block time on the Timeline

Open the **Timeline** tab.

1. Pick a view from the mode switcher: **Month**, **Planner**, **Week**, **Day**, or **Year**.
   *(Older "3-Day" data folds into Day.)*
2. Pick a source: **Atelier**, **Google**, or **Both**.
3. Click an empty slot or press **+ Block** to open the block modal.
4. Fill in name, start/end, category, color, recurrence (none / daily / weekdays / weekly / monthly), one-time date, and optional reference URL.
5. Save.

Active blocks light up the **Current Block** card with live progress. The **Time Mode** selector tints the surface for morning / afternoon / evening / night.

To use Timeline as a portable calendar:

- `Settings → Advanced → Calendar Data Files → Export Calendar (.ics)` — share with another calendar app.
- **Import Calendar (.ics)** — bring external events in as imported blocks.
- **Clear Imported Calendar Data** — remove imported entries when you no longer need them.

---

## 9. Set up Homework

Open the **Homework** tab. On first visit you'll see the **Set Up Your Classes** overlay.

1. Add **classes** (chips) and any **misc / extracurricular activities** (chips).
2. Click **Save**.

Each class becomes a **subject lane**; activities go in the parallel **Activities lane**. Add an assignment from the *+* control inside a lane:

- Title
- Due date
- Due time
- Priority
- Difficulty
- Notes
- Done state

Status chips show *no date / upcoming / due soon (≤ 48 h) / overdue*. Use the **...** menu on any assignment for **Schedule this** (creates a Timeline block) and **Open class dashboard** (drawer with open homework, upcoming class deadlines, linked notes, and any matching AP subject).

### Paste import from a school portal

Click **Paste Import** in the Homework header to paste a block of text copied from your school portal. The app parses pipe-, tab-, or dash-separated rows, previews them, and lets you correct title / class / date / time / difficulty / priority before saving. JSON import/export is still available from the same header.

By default, homework items show up in your Today task feed. Toggle this in `Settings → Tasks → Include homework tasks`.

---

## 10. Set up AP Study and the AP Battle Plan

Open the **AP Study** tab.

1. Press **+ Add subject**. Fill in subject name, exam date/time, target score, confidence, teacher, current unit, optional notes, and optionally **link to a Homework class**.
2. In the **Units** section, add your units and topics. Mark any units as weak as you go.
3. In **Sessions**, schedule a session by type: review, FRQ, MCQ, practice test, weak area, or mixed.
4. In **Practice**, log score / max score / minutes / confidence-after / weak flag for each practice run.
5. Watch **Analytics** for coverage, weak-area trends, study streak, and the exam countdown.

The **AP Battle Plan card** at the top of the workspace auto-picks the soonest exam, weighs weak units, recent practice scores, confidence, and days-left, and recommends a concrete next session with reasoning. From the card you can:

- Create a real AP Study **session** for the recommended subject.
- Create or open a **linked AP unit note**.
- Log a regular **task**.
- Schedule a **prep block** on Timeline.

> On the AP Study view, `Ctrl/⌘+K` is reserved for **Add subject** (it does not open the global Command Palette).

---

## 11. Set up the College Workspace

Open the **College** tab. The dashboard shows summary cards (Application Completion %, Upcoming Deadlines (30d), Scholarship Pipeline ($), SAT Countdown) and a button grid into:

- **College Tracker** — schools you're applying to.
- **Essay Organizer** — essay drafts, statuses, links to draft notes.
- **Score Tracker** — SAT / ACT / subject scores.
- **Award / Honors Tracker**.
- **Scholarship Tracker**.
- **Decision Matrix** — score colleges with weighted criteria; podium card highlights the top three.
- **Major Deciding Matrix** — same model for choosing a major.
- **Application Sheets** — a per-school workspace with Research, Checklist, Deadlines, Essay Plan, and Essay Prompts subviews.

Most rows expose a **Schedule this** action so applications, scholarships, and essay milestones become Timeline blocks. Essay rows can create or reopen a draft note directly from the table.

College deadlines and essay milestones with dates also appear in the Deadline Radar.

---

## 12. Use the Life trackers

Open the **Life** tab. The dashboard shows the primary trackers up front:

- **SMART Goals** — write goals in SMART format, set status, due dates, and schedule.
- **Habits** — same data as Today's habit tracker.
- **Sleep** — log nightly. Eight analytics cards: last night, 7-day average, 30-day average, goal progress %, trend, consistency / streak, quality / energy, bedtime / wake-time average.
- **Spending** — ledger with monthly total, transaction count, average per transaction, and top category.
- **Journal** — dated entries.

Secondary trackers under **More Life Tools**: Skills, Fitness, Calories, Calculator, Books.

---

## 13. Use the Business / Freelance workspace

The Business tab is hidden in Student / AP Crunch / College Apps / Writing / Life modes if it has no data, and dimmed (still reachable) if it does. Switch to **Standard** or **Business / Freelancer** mode to use it day-to-day.

Modules:

- **Overview** — KPI cards (active projects, projects at risk, total clients, open invoices, overdue invoices, monthly income, pipeline value).
- **Analytics** — historical metrics.
- **Projects**, **Opportunities**, **Clients**, **Invoices**, **Finance**, **Meetings**, **Tasks**, **Proposals/Contracts**, **Notes**, **Documents/Assets**, **Goals/Targets**.

Highlights:

- **Quick actions strip** for one-click create across projects, clients, invoices, meetings, proposals, follow-ups, notes.
- **Quick business notes** with autosave drafts, templates (proposal draft, invoice follow-up), pinning, and filters.
- **Deadlines aggregation** across projects, milestones, invoices, follow-ups, meetings, proposals, and tasks — surfaced into the global Deadline Radar.
- **Detail panels** with summary / links / activity tabs that cross-reference linked entities.
- **Global business search/filter** with status filters (open / due-soon / overdue / paid / draft / etc.).

---

## 14. Master the Command Palette, Quick Capture, and Global Search

These three shortcuts will save you the most time:

### Command Palette — `Ctrl/⌘+K`

Opens a centered command list. Type to filter. Use it to:

- Jump to any view.
- Run **Quick Capture**.
- **Export `.atelier`** backup.
- **Create a Weekly Review note** (templated 7-day summary).
- **Rerun Student Setup**.
- **Open a class dashboard** by typing the class name.
- And many more workspace actions.

> The AP Study view repurposes `Ctrl/⌘+K` for **Add subject**, so the palette stays out of the way there.

### Quick Capture

Open from the Today header `Capture` button or the Command Palette. Examples:

- *"Lab report due Friday hard"* → Homework.
- *"Read CS 241 Ch 5"* → Task.
- *"AP Physics FRQ practice tomorrow 6pm"* → AP session.
- *"Block deep work 10-12 weekdays"* → Timeline block.
- *"Common App essay revise"* → College essay row.

If you have multiple AP subjects, Quick Capture asks you to pick the destination subject before saving.

### Global Search — `Shift+Ctrl/⌘+F`

Opens a panel that groups results across **Notes**, **Tasks**, **Homework**, **AP Study**, **College**, and **Timeline**. Respects your active workspace mode.

---

## 15. Split-screen and Focus Mode

### Split-screen

In **Notes**, click the split toggle to open a second pane.

- A second-page picker selects the right-hand note.
- The **Presets** button (grid icon) snaps the second pane to a context: Note + Assignment, Note + AP Unit, Essay + Research, Today Plan + Notes, or Calendar + Note.
- Use **Swap** to flip primary/secondary, and **Close** to dismiss the right pane.

Default split-view behavior is configurable in `Settings → Editor → Split view default`.

### Focus Mode

`Alt+Shift+F` (or the floating quick toggle) hides chrome and centers the editor for distraction-free writing. Toggle off the same way.

`Settings → Editor → Focus mode default` makes Focus Mode the default for every new note.

---

## 16. Connect the Flow Assistant (AI)

The Flow Assistant is **opt-in** and uses your own API key.

1. Open the chat button in the Notes view to reveal the panel.
2. Expand the **assistant settings shell**.
3. Pick a provider: **OpenAI**, **Anthropic Claude**, **Google Gemini**, **Groq**, or a custom OpenAI-compatible endpoint.
4. Enter the **exact** model ID for that provider (typos fail at the provider, not in Atelier).
5. Paste your API key and press **Save Keys**.
6. Send a message.

Useful toggles in `Settings → Assistant`:

- **Enable Flow Assistant** — the master switch.
- **Panel default** — open or closed at app launch.
- **Show Insert button in assistant replies** — one-click insert at the editor caret.
- **Assistant suggestions** — auto suggestions toggle.

Privacy:

- Keys are stored only in this browser's `localStorage`.
- Requests go directly from your browser to the provider you chose. Atelier does not proxy them.

---

## 17. Personalize themes, fonts, and motion

### Themes

Click the **palette** button in the top tab strip to open the floating theme panel.

- Built-in presets: Default, Dark, Botanical, Editorial, Luxury, Sepia, Ocean, Sunrise, Graphite, Aurora, Rosewater, macOS 26, Windows 11, ChromeOS, Ubuntu, GitHub, Spotify, Netflix, Slack, Dune.
- **Apply mode**: current page / all pages / custom subset (per-page theming).
- **Custom themes**: create / edit / delete with a saturation/value canvas, hue slider, and HEX entry. Import/export themes as JSON.

### Typography

The same panel lets you pick font family (Inter, Manrope, Sora, Source Sans 3, Source Sans Pro, Open Sans, Roboto, Montserrat, Comfortaa, Fira Sans, Playfair Display, IBM Plex Mono, JetBrains Mono), font size, and line height.

### Motion

`Settings → Appearance → Motion` chooses **full**, **reduced**, or **off**. The app also honors your OS *prefers-reduced-motion* setting.

---

## 18. Tune Settings

Open **Settings**. The view is split into 13 categories. Most controls **stage** as drafts until you press **Save & Apply**; integrations and assistant-provider controls apply immediately.

Quick wins for new users:

- `Layout → Default start view` — open straight into Today, Notes, or Timeline.
- `Editor → Autosave` — pick a cadence between 300 ms and 8000 ms.
- `Editor → Writing width` — narrow / standard / wide / full.
- `Tasks → Sort strategy` — urgency / easy / due / alpha.
- `Calendar → Default view` and `Default source`.
- `Calendar → Day start / end hour`.
- `Notifications → Mode` — quiet / balanced / high.
- `Accessibility → Larger touch targets` — for tablet/phone.

There's a **Reset** button on each section, and a **Reset all categories** button at the bottom of the Settings sidebar.

The right rail shows a **live preview** that updates as you change appearance / layout / task choices. Press **Revert** to discard the staged draft.

---

## 19. Back up with `.atelier` (and restore safely)

The single most important habit is exporting a **`.atelier`** backup before big changes.

### Export

`Settings → Data & Backups → Full Workspace Backup (.atelier)` writes a `.atelier` file containing:

- Notes, tasks, timeline blocks, settings, themes.
- Homework, AP Study, College, Life, Business workspaces.
- A snapshot of relevant `localStorage` keys.
- Metadata (export time, app version).

You can also export a plain **Workspace JSON** for raw data interchange.

### Per-note exports

From the editor, export the active note as DOCX, DOC (legacy), PDF, HTML, Markdown, plain text, or RTF. Set the default in `Settings → Data → Default export format`.

### Import

`Settings → Data & Backups → Import Workspace / Docs` accepts:

`.atelier`, `.json`, `.txt`, `.md`, `.markdown`, `.html`, `.htm`, `.csv`, `.tsv`, `.rtf`, `.pdf`, `.docx`, `.doc`, `.odt`, `.xlsx`, `.xls`, `.pptx`, `.epub`, `.xml`, `.yaml`, `.yml`, `.log`, `.zip`.

Behavior:

- `.atelier` and workspace `.json` payloads **replace** workspace state — but Atelier writes a **pre-import safety snapshot** first.
- Document-type imports become a new `Imported::...` note page.
- `.doc` (legacy Word) is best-effort in-browser; convert to `.docx` or `.pdf` if it looks off.

### Recover from a bad import

`Settings → Data → Local data health → Download local safety snapshot` exports the snapshot Atelier saved just before your last import. Re-import that to roll back.

> `.atelier` files are **not encrypted**. Treat them as personal data.

---

## 20. Connect Google Calendar and Google Drive (optional)

These integrations require **your own** Google OAuth client ID and API key. Atelier does not ship credentials.

### Drive credentials

`Settings → Integrations → Google Drive → Open Drive Settings`. Enter:

- **Drive Client ID** — Google OAuth client ID.
- **Drive API Key** — Google API key.
- Save.

These power both Drive backup and the Google Calendar link.

### Google Calendar

`Settings → Integrations → Google Calendar`:

1. Enter the calendar ID (default: `primary`).
2. Choose a sync interval (1 / 5 / 10 / 15 / 30 / 60 min).
3. Toggle **Auto-sync** if you want background polling.
4. Click **Link Google Calendar**.
5. Click **Sync Now** to pull immediately. Use **Unlink** to disconnect.

In Timeline, set **Source** to *Google* or *Both* to see Google events alongside Atelier blocks.

### Drive backup

From the bottom save bar, **Save to Drive** uploads the current workspace as a backup. Drive is **not** a sync engine — it is one-way uploads/downloads using your account.

> If you only want a portable file, skip Drive and use `.atelier` exports.

---

## 21. Use Atelier on phone or tablet

Atelier ships responsive styles for 1024 / 768 / 640 px breakpoints.

- The sidebar collapses behind a button and a tap-overlay.
- The top tab strip becomes a single **current view** dropdown that expands the full tab list.
- Overflowing tabs slide into a `More` menu.
- Modals stack to a single column under 640 px.
- Turn on `Settings → Accessibility → Larger touch targets` to enlarge tap zones.

Workflows that especially shine on a phone:

- Quick Capture from the Today header.
- Habit checkmarks during the day.
- Reading notes in Focus Mode.

---

## 22. Build a weekly review habit

End-of-week ritual:

1. Open the **Command Palette** with `Ctrl/⌘+K`.
2. Run **Create Weekly Review note**. Atelier creates a templated note summarizing the past 7 days (completed and missed) and next-week deadlines.
3. Fill in wins / misses / what changes next week.
4. Open **Deadline Radar** from Today and **Schedule this** on every prep item that needs a calendar slot.
5. Export a **`.atelier`** backup.
6. Optionally, rerun **Plan My Day** for Monday.

Pair this with a Workspace Mode change if your priorities shift week to week (for example: switch to **AP Crunch** the week before an exam).

---

## 23. Tutorial recap & cheat sheet

**Keyboard:**

| Shortcut | What it does |
| --- | --- |
| `Ctrl/⌘+K` | Command Palette (AP Study uses it for Add subject). |
| `Shift+Ctrl/⌘+F` | Global Search panel. |
| `Alt+Shift+F` | Toggle Focus Mode. |
| `Ctrl/⌘+Shift+M` | Toggle markdown shortcut on selection. |
| `Tab` / `Shift+Tab` | Indent / outdent list items. |
| `/` (in editor) | Slash command menu. |

**Most-used surfaces:**

- **Today** — Daily Brief, Plan My Day, Habits, Schedule snapshot.
- **Timeline** — Day / Week / Month / Year / Planner views.
- **Notes** — slash menu, split-screen presets, Focus Mode, templates.
- **Homework** — paste import, due-state chips, class dashboard.
- **AP Study** — units, sessions, practice, AP Battle Plan.
- **Settings → Data** — Workspace Mode + `.atelier` backup.

**Daily 3-minute loop:**

1. Open Today.
2. Read Daily Brief, click Next Best Action.
3. Commit 1–3 priorities.
4. Plan My Day, push to calendar.
5. Get to work.

That is the entire app. Everything else is layered on top of those five steps.

---

## Where to next

- The in-app **Help & Docs** page is always available at the top of your sidebar — it covers the same ground in shorter form, with deep links inside the app.
- The interactive overlay tour is at `Settings → Advanced → Tutorial & Onboarding → Start Interactive Tutorial` and is the best way to *see* the controls.
- The full feature inventory and architecture details are in the [README](README.md).

If something looks different from this guide, the codebase is the source of truth — check the README's *Project Structure* section and follow the file paths.
