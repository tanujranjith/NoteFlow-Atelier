# NoteFlow Atelier

NoteFlow Atelier is a local-first productivity workspace built as a static Vite web app. It combines notes, planning, calendar-aware scheduling, and focused workflow tools in a single interface while keeping data ownership local by default.

## Highlights

- Local-first workspace with IndexedDB persistence and optional cloud backup
- Rich Notes workspace with hierarchical pages (`::` paths), templates, tags, and editor blocks
- Today dashboard for tasks, habits, streaks, and daily execution
- Timeline planner with horizontal three-day window:
  - day before today
  - today
  - day after today
- Timeline layout switch:
  - Modern timeline
  - Legacy calendar (day/week/month/year)
- Timeline source switching:
  - Atelier Calendar
  - Google Calendar
  - Combined (both)
- Temporary pages (ephemeral notes) with irreversible auto-expiration
- Calendar portability with ICS import/export
- Current-note export options including hardened PDF export path
- Optional Flow Assistant panel with local provider/model settings

## Recent Changes in This Version

- Added three-day Timeline view with event lane overlap handling
- Added timeline source selector (Atelier / Google / Both)
- Added temporary-page system with configurable expiration settings
- Added automatic purge of expired temporary pages on load and periodic refresh
- Improved PDF export reliability and fallback behavior
- Removed Google Docs import feature (general document import remains)
- Updated in-app Help & Docs content to align with current behavior

## Setup

### Prerequisites

- Node.js 18+
- npm

### Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

### Build

```bash
npm run build
npm run preview
```

## Project Structure

- `NoteflowAtelier.html`: Main app shell and modal/view structure
- `app.js`: Application state, feature logic, storage, import/export, integrations
- `styles.css`: Primary styling and theme system
- `HomePage.html`: Launcher/landing page
- `Homework.html`: Homework-focused path

## Architecture (High Level)

- Frontend-only static app (no required backend for core usage)
- State domains in one workspace object:
  - pages/content
  - tasks/habits/streaks
  - timeline blocks/events
  - college/life/homework workspace data
  - UI and feature settings
- Primary persistence in IndexedDB (`noteflow_atelier_db`, store `workspace`, key `root`)
- Some compatibility and auxiliary values in `localStorage`

## Data and Integrations

- Google Drive backup: optional, user-provided credentials
- Google Calendar: optional, read-only event sync into timeline blocks
- ICS calendar import/export supported

## Temporary Pages

Temporary pages are designed for scratch or short-lived notes.

- Each temporary page stores creation and expiration metadata
- Expired pages are permanently deleted (no recovery)
- Expiration cleanup runs:
  - at app startup
  - on periodic intervals
  - during relevant refresh cycles
- Lifetime is configurable in Settings (`minutes`, `hours`, `days`)

## Export and Import

- Workspace export/import: JSON
- Current-note export: DOCX, PDF, HTML, Markdown, TXT, RTF, DOC
- PDF export uses a print-safe layout and falls back to print dialog if browser PDF generation fails
- Document import supports the general parser pipeline
- Google Docs import flow is intentionally removed

## Known Limitations

- External document parsing quality depends on source formatting and browser/runtime behavior
- Google Calendar availability depends on user OAuth/configuration and sync state
- Legacy `.doc` parsing remains limited in-browser compared to `.docx` or PDF
- Client-side PDF generation can vary by browser engine; print fallback is provided

## Potential Future Improvements

- Drag-to-resize timeline events directly in the timeline lane UI
- Dedicated recurring-event editing UX for imported calendar events
- Optional conflict recommendations for overlapping events
- Broader automated verification coverage for import/export edge cases

## License

Licensed under Apache License 2.0. See `LICENSE` and `NOTICE`.
