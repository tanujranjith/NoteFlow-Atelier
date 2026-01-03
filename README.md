# NoteFlow Atelier

A cohesive offline-first productivity workspace that merges NoteFlow notes with Streaks accountability. This repository is the merged output (single app) with a premium editorial UI blending glassmorphism + neumorphism.

## Why NoteFlow as base
NoteFlow already ships a robust hierarchical notes editor, page structure, and export/import workflows. It offered the closest match to the desired editor experience and local-first behavior, so the merged app extends it with streak tasks and a unified data layer.

## Quick start

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Implementation plan (concise)
- Centralize design tokens in CSS variables and reuse across components.
- Create reusable UI primitives (glass panels/cards and neumo controls).
- Migrate both legacy storage formats into a single IndexedDB workspace.
- Merge task + streak logic with notes, enabling note-linked tasks.
- Deliver core views: Today, Notes, Progress, Settings with shared data.
- Keep export/import unified while preserving legacy NoteFlow exports.
- Ensure accessibility: focus-visible, reduced motion, contrast on glass.

## Architecture overview
- `index.html`: App shell + primary layout (sidebar, views, modals).
- `styles.css`: Design tokens, glass/neumo styles, layout, and view styling.
- `app.js`: Unified data layer, migrations, notes editor, streak tasks, and UI state.

### Data model (IndexedDB)
All data is stored in IndexedDB under a single workspace entry:

- `pages`: NoteFlow pages (hierarchy via `::` titles).
- `tasks`: Unified tasks with streak metadata, schedule, and optional `noteId`.
- `streaks`: `dayStates`, `taskStreaks`, and global streak counters.
- `settings`: theme, motion, typography, time widget, drive settings.
- `ui`: app-only preferences (favorite page, default page).

Legacy migration imports existing NoteFlow localStorage pages and Streaks app data on first run.

## Views
- **Today**: committed tasks, due tasks, quick actions, streak counters.
- **Notes**: hierarchical pages + editor with linked tasks panel.
- **Progress**: weekly completion chart, streak stats, category summary, history.
- **Settings**: theme, motion, export/import, optional Google Drive settings.

## Export / Import
Single JSON export/import containing full workspace:
- pages, tasks, streaks, settings, ui
- legacy NoteFlow exports are detected and mapped

## Design tokens
Tokens live in `styles.css` as CSS variables.

- Color: warm ivory backgrounds, charcoal text, warm grays, restrained gold accent.
- Typography: Playfair Display (headings), Source Sans 3 (body/UI).
- Glass: frosted panels with blur, inner highlight, and soft shadow.
- Neumo: soft dual shadows, inset states for presses/toggles.
- Motion: smooth transitions; reduced motion respected.

## Notes
- The app is local-first and offline-capable.
- Optional Google Drive backup uses your own credentials.
