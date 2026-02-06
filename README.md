# NoteFlow Atelier

NoteFlow Atelier is an offline-first productivity workspace that combines:
- hierarchical notes
- task and streak tracking
- day timeline time-blocking
- local-first backup/export controls
- optional personal-cloud backup via your own Google Drive

## Quick Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

## Core Features

### Notes Workspace
- Nested pages with `::` path naming (for example `Projects::Website::Launch`)
- Drag-and-drop page tree reordering and nesting
- Collapse/expand page branches
- Rename with child path propagation
- Duplicate and delete pages (delete removes child pages too)
- Favorite page (auto-opens on startup)
- Per-page emoji icon picker
- Breadcrumb navigation for nested pages
- Sidebar search and global search
- Page tags with tag-based sidebar filtering
- 7 built-in templates:
  - Blank Page
  - Meeting Notes
  - Project Plan
  - To-Do List
  - Daily Journal
  - Weekly Review
  - Study Notes

### Rich Editor
- Formatting: bold, italic, underline, strikethrough
- Headings (`H1`, `H2`, `H3`), block quote, code block
- Ordered and unordered lists
- Links and link editing controls
- Insert table
- Insert media:
  - image (URL/upload)
  - video (YouTube/Vimeo/direct/upload)
  - audio (Spotify/SoundCloud/direct/upload)
  - web embeds (Google Docs, Figma, CodePen, generic iframe, and more)
- Interactive checklist blocks
- Collapsible/toggle sections
- Link to another page in the workspace
- Slash commands (`/`) for fast block insertion
- Live word count
- Resizable/alignment controls for inserted media blocks

### Tasks, Streaks, and Progress
- Task CRUD with title, notes, schedule, due date, category, priority, note attachment
- Schedules:
  - one-off
  - daily
  - weekly with custom weekday selection
- Commit/uncommit tasks for today focus
- Mark complete and track day-level completion history
- Today view:
  - Committed Today
  - Due Today
  - All Tasks drawer
  - streak status pill
- Progress cards:
  - weekly completions and percent delta vs prior week
  - monthly activity heatmap (last 30 days)
  - category completion donut
  - streak stats (current, best, longest)
  - committed days and weekly completion rollups
  - weekly freeze allowance tracking

### Timeline (TimeTile)
- Day timeline with visual time blocks
- Create/edit/delete blocks with:
  - start/end time
  - category
  - color
  - recurrence (one-time, daily, weekdays, weekly)
- Automatic current block detection
- Live "Current Block" card with progress and countdown
- Time mode themes:
  - auto (based on time of day)
  - morning / afternoon / evening / night

### Personalization and UX
- Light and dark presets
- Custom theme colors (background, secondary, text, accent)
- Theme apply modes:
  - current page
  - all pages
  - selected pages
- Font and typography controls
- Reduce motion toggle
- Toolbar clock with 12h/24h and seconds toggle
- Focus timer with presets and custom H:M:S input
- Responsive mobile behavior (collapsed sidebar flow, mobile tab toggle)

### Data, Backup, and Migration
- Local-first persistence in IndexedDB
- Auto-save every 30 seconds + on content changes
- Manual "Save Locally" action
- Full workspace export/import JSON
- Export includes:
  - pages
  - tasks and task order
  - time blocks
  - streak state
  - settings and UI preferences
  - schema version + export timestamp
- Optional Google Drive backup using user-provided API key/client ID
- Legacy migration support from older NoteFlow and streak storage formats

### Built-in AI Assistant (Flow)
- Optional in-app assistant panel
- Uses your own Groq API key (stored locally in browser)
- Markdown-style response rendering
- One-click insert response into editor
- Copy response action
- Fullscreen chat mode
- Privacy note in UI: prior chat turns are not sent as continuous context

## Project Structure
- `NoteflowAtelier.html`: main app shell and UI layout
- `app.js`: app logic (data layer, views, editor features, tasks, timeline, help docs)
- `styles.css`: theme tokens, layouts, components, responsive styling
- `HomePage.html`: landing page
- `assets/`: app imagery

## Privacy Model
- No account required
- Data stays local by default
- No app-hosted backend for notes/tasks
- Google Drive backup (if enabled) writes to your own Drive credentials
