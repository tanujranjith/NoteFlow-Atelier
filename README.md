# NoteFlow Atelier

NoteFlow Atelier is a local-first productivity workspace built as a static web app. It combines rich notes, planning, AP/homework tracking, timeline scheduling, themed workspaces, and business operations in one interface while keeping core data on-device.

## Table of Contents

1. [Product Overview](#product-overview)
2. [Major Features](#major-features)
3. [AP Study Workspace](#ap-study-workspace)
4. [College App and Life Workspaces](#college-app-and-life-workspaces)
5. [Export Capabilities](#export-capabilities)
6. [Theme System](#theme-system)
7. [Homework Workspace](#homework-workspace)
8. [Business Workspace](#business-workspace)
9. [Integrations and Shortcuts](#integrations-and-shortcuts)
10. [In-App Help and Tutorial](#in-app-help-and-tutorial)
11. [Mobile Responsiveness](#mobile-responsiveness)
12. [Setup / Run](#setup--run)
13. [High-Level Architecture](#high-level-architecture)
14. [Known Limitations](#known-limitations)
15. [License](#license)

## Product Overview

NoteFlow Atelier is designed as a single workspace for:
- writing and organizing notes
- planning daily execution
- tracking assignments and deadlines
- managing multi-surface workspaces (College, College App, Life)
- exporting data and documents without a backend requirement

Core behavior is local-first by default. Optional Google integrations are available but not required for primary usage.

## Major Features

- Hierarchical Notes with rich editor blocks, slash insertions, tables, media wrappers, and collapsibles
- Split-screen Notes with secondary note picker for side-by-side compare/edit workflows
- Google Docs-like list indentation with `Tab` / `Shift+Tab` nesting for ordered and unordered lists
- Sidebar navigation with expanded and collapsed states (desktop icon rail + mobile off-canvas behavior)
- Today workspace for tasks, habits, and streak-aware execution
- Timeline planner with three-day focus and source switching (Atelier / Google / both)
- AP Study workspace for subject readiness, unit coverage, session planning, and FRQ/MCQ practice logs
- College App and Life dashboards for admissions planning and personal trackers
- Homework workspace organized by Subjects and Activities with assignment title, due date, due time, difficulty, and contextual three-dot menu actions
- Business workspace for projects, clients, invoices, income/expense logs, deadlines, and quick notes
- Custom web/page shortcuts in top tabs and sidebar navigation
- Theme system with curated presets, custom themes, and per-scope application modes
- New Dune preset theme (cinematic desert-luxury palette with restrained display typography accents)

## AP Study Workspace

AP Study is a dedicated exam-prep system inside Atelier:
- AP subject portfolio with exam countdowns, confidence levels, and target scores
- Unit/topic tracking with progress and weak-area signals
- Session planner for review blocks, FRQ/MCQ sets, and practice tests
- Practice logs that can link to notes and feed planning context into tasks/timeline

## College App and Life Workspaces

- College App dashboard includes tracker, essays, scores, scholarships, decision tools, and application planning sheets
- Major Deciding Matrix supports weighted criteria and ranked outcomes
- Life workspace includes goals, habits, skills, fitness, books, spending, and journal trackers
- Both modules support quick-add flows and dashboard/sub-page navigation

## Export Capabilities

### Workspace Export
- Full workspace JSON export/import (backup + restore)

### Current Note Export
- Word (`.docx`, fallback `.doc`)
- PDF (`.pdf`)
- HTML (`.html`)
- Markdown (`.md`)
- Plain text (`.txt`)
- Rich Text (`.rtf`)

### Export Reliability and Media
- Export pipeline preprocesses note content and strips editor-only UI artifacts
- Images embedded in the note are included in Word/PDF/HTML exports when technically available
- PDF generation uses direct export first and falls back to a print-ready PDF view if needed
- Export limitations/errors are surfaced via UI messages (no silent failures)

## Theme System

- Preset themes: editorial/light/dark/platform-inspired palettes plus Dune
- Custom theme creation/editing/import/export
- Theme application scopes: all pages, current page, or custom page selection
- Dune display typography uses `Dune Rise` when locally/self-hosted available and falls back to editorial serif stacks automatically

## Homework Workspace

Homework is a dedicated planning surface with grouped assignment lanes:
- Subjects (class coursework)
- Activities (non-class commitments)

Each assignment includes structured metadata and a context menu for quick actions. Homework state syncs into the task system for cross-view planning.

## Business Workspace

Business is an integrated operational dashboard that stays local-first:
- Top-level operating dashboard with KPI cards, quick actions, recent activity, and mini analytics
- Project/work tracker with budgets, revenue, hours, risks, next steps, milestones, subtasks, and linked records
- Client/contact manager with lead stages, follow-ups, notes, outstanding balance, relationship metadata, and CRM-style filters
- Invoice/payment tracker with draft/sent/paid/canceled states, due-soon and overdue detection, tax/discount support, and linked projects
- Income/expense ledger with categories, subcategories, payment method, recurring flag, tax relevance, and client/project linkage
- Automatic deadlines aggregation from projects, milestones, invoices, follow-ups, meetings, proposals, and business tasks
- Pipeline/opportunity tracking with grouped stage view and stage-level value totals
- Meetings/calls, proposals/contracts, business tasks, documents/assets, and goals/targets modules
- Quick business notes with autosaved draft capture, saved snippets, pinned notes, and note templates
- Contextual detail panel that links projects, clients, invoices, finance, meetings, proposals, tasks, notes, documents, and goals

Current limitations:
- Documents/assets are tracked as a lightweight local metadata index rather than a managed file storage system
- Business notes stay inside `businessWorkspace`; they do not automatically generate full Notes-tab pages

## Integrations and Shortcuts

- Google Calendar link + sync controls with source blending in Timeline
- Google Drive backup/restore with user-provided credentials
- Spotify and ChatGPT quick launch controls
- Custom shortcut modal for external URLs or internal note/page jumps

## In-App Help and Tutorial

- Interactive tutorial can be started or rerun from Settings
- Help & Docs page is generated in-app and intended to be a living source of truth
- Tutorial now covers AP Study, Business workspace, split-screen notes, integrations, and shortcut controls

## Mobile Responsiveness

The app is optimized for phone and tablet usage, including:
- responsive sidebar behavior
- stacked modal/footer actions
- export modal usability on compact screens
- homework lane/card scaling
- touch-friendly controls and spacing

## Setup / Run

### Runtime Reality
- The product runtime is static-first: `index.html` redirects to `HomePage.html`, and the main app lives in `NoteflowAtelier.html` + `app.js` + `styles.css`.
- There is no React component runtime in the current app shell.

### Requirements
- Node.js 18+
- npm

### Quick Local Open (No Build Step)
Open either:
- `HomePage.html` (landing page)
- `NoteflowAtelier.html` (main app)

### Development
```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Vite is used as a static dev server for this codebase.

### Build / Preview
```bash
npm run build
npm run preview
```

### Static Checks
```bash
npm run check
```

`npm run check` runs JavaScript syntax checks and a lightweight smoke check for key DOM IDs, export-format parity, and stabilized UI hooks.

## High-Level Architecture

- `NoteflowAtelier.html`: app shell, view structure, modal scaffolding, and inline UI guard styles
- `styles.css`: primary token system, component styling, theme surfaces, responsive behavior
- `app.js`: core state, notes/tasks/timeline systems, tutorial/help generators, theme engine, import/export pipeline, integrations, and Business workspace data normalization/delegation
- `ap-study.js`: AP Study workspace rendering, subject/unit/session/practice state normalization, and sync hooks into planning surfaces
- `business-workspace.js`: rich Business workspace renderer, linked-entity workflows, modal forms, analytics, detail panel, and section controls
- `homework.js`: homework data model, rendering, interactions, import/export, sync signaling
- `select-enhancer.js`, `date-enhancer.js`: custom input UX helpers

### Storage Model
- Primary app state persists locally in browser storage
- Local storage keys include workspace domains and homework datasets (`hwCourses:v2`, `hwTasks:v2`)
- Business records are persisted in the same workspace payload under `businessWorkspace`
- Business entities are linked locally through shared ids (`clientId`, `projectId`, `invoiceId`, `meetingId`, `proposalId`) and rendered as derived relationships inside the dashboard
- Quick note draft state is persisted locally inside `businessWorkspace` alongside saved business notes and activity
- Optional Google sync/backup flows use user-provided credentials

## Known Limitations

- Browser support for direct client-side PDF generation can vary; print fallback is provided
- External image URLs may fail to embed if blocked by source restrictions/CORS
- Some legacy document formats (`.doc`) remain less reliable for import compared to `.docx`/PDF
- Google Calendar visibility depends on user configuration and token/link state

## License

Licensed under Apache License 2.0. See `LICENSE` and `NOTICE`.
