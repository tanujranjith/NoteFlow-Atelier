# NoteFlow Atelier

NoteFlow Atelier is a local-first productivity workspace that combines notes, planning, and life systems in one interface. It runs as a static web app, stores your data in your browser by default, and offers optional backup/sync utilities when you want them.

## What NoteFlow Atelier Is

NoteFlow Atelier is built for people who want one place for:
- Writing and organizing notes
- Planning tasks and time blocks
- Tracking long-term goals, habits, and school workflows
- Exporting and backing up data without relying on a hosted backend

The design goal is practical depth: broad feature coverage without forcing you to split your workflow across multiple tools.

## Core Workspaces

### Today
- Committed, due, and completed task lanes
- Habit tracker and streak metrics
- Progress widgets (weekly sparkline, monthly heatmap, category breakdown)
- Academic planner section for deadlines and extracurricular tracking

### Timeline
- Time-block planner with day/week/month/year modes
- Add/edit/delete blocks with recurrence and references
- Current block card with live countdown and progress
- Time-mode support for schedule context

### Notes
- Hierarchical pages using `::` naming
- Rich-text editor with tables, links, checklists, collapsibles, embeds, and slash commands
- Page tags, emoji icons, breadcrumbs, and drag/drop organization
- Built-in templates for common note workflows

### College (Dashboard)
- College application workspace with multiple sub-pages
- Tracker utilities for deadlines, essays, scores, scholarships, and decisions
- Major Deciding Matrix for weighted comparisons

### Life
- Dashboard plus focused modules for goals, habits, skills, fitness, books, journal, and spending
- Structured add-item workflows and summary cards

### Homework
- Dedicated assignment planner with class/misc organization
- Export/import support
- Sync path into broader planning/task workflows

### Settings
- Theme, motion, and feature visibility controls
- Data export/import controls
- Google Drive and Google Calendar settings
- Guided in-app tutorial launcher

## Platform Features

### Notes and Content
- Rich editor formatting and media embedding
- Table, checklist, and collapsible blocks
- Link-to-page references inside notes
- Live word count and typography controls

### Tasks and Planning
- Task modal with schedule, priority, category, due date, and note linking
- One-time, daily, and weekly recurrence support
- Streak logic and progress cards
- Focus timer with ringtone and volume controls

### Theming and Personalization
- Preset themes plus custom theme editing
- Scoped apply modes (current page, all pages, selected pages)
- Custom Atelier color picker for theme palette editing
- Motion and visual preference controls

### Data Portability
- Full workspace JSON export/import
- Homework-specific export/import
- Document import pipeline for supported file types into notes

### Assistant and Integrations
- Optional Flow Assistant panel with provider/model controls
- Optional Google Drive backup flow using your own credentials
- Optional Google Calendar import/sync workflow for timeline planning

## Local-First Data Model

### Primary storage
- IndexedDB database: `noteflow_atelier_db`
- Object store: `workspace`
- Key: `root`

### Persisted workspace domains
- Pages/content
- Tasks/order/streak state
- Timeline blocks
- Academic, college, and life workspace data
- Theme/font/motion/time/tutorial settings
- UI preferences (favorite/default/last active view)

### Additional local keys
- Homework keys in `localStorage`
- Fallback timer settings key (`noteflow_focus_timer`)
- Optional assistant model key (`chat_model`)

## Getting Started

### Option 1: Open directly
1. Open `HomePage.html` in a modern browser.
2. Launch NoteFlow Atelier from the landing page.

### Option 2: Run with Vite (recommended)
```bash
npm install
npm run dev
```
Then open the local URL printed by Vite.

### Optional build/preview
```bash
npm run build
npm run preview
```

## Project Entry Points

- `HomePage.html`: launcher/landing page
- `NoteflowAtelier.html`: primary NoteFlow Atelier app shell
- `app.js`: core application logic
- `styles.css`: global styling and theme system
- `Homework.html`: homework-focused launcher path
- `NoteFlow (classic)/NoteFlow.html`: legacy classic interface

## Backup, Privacy, and Ownership

- Local-first by default
- No required hosted account for core usage
- Your optional cloud backup path uses your own Google Drive credentials
- Workspace export is always available for manual backup and migration
