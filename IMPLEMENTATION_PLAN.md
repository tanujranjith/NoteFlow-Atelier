# NoteFlow Atelier Upgrade Implementation Plan

## Executive Summary

This plan details the comprehensive upgrade of NoteFlow Atelier from a working student workspace into a polished, professional-grade local-first application. The upgrade maintains 100% backward compatibility with existing data, preserves all student OS features, and adds 15+ major capabilities across notes, pages, formatting, organization, and document management.

**Scope:** 30 implementation sections over 8 main feature domains.
**Status:** Planning phase — awaiting approval before implementation begins.

---

## 1. Current Architecture Overview

### Deployment Model
- **Single-file static HTML** (`NoteflowAtelier.html` — 8,226 lines)
- **No build process, no backend, no CDN dependencies for core features**
- Core logic in `src/core/app.js` (38,017 lines) — one monolithic module
- Styles in `styles/` (29,266 lines CSS across 4 files)
- Optional features in `src/features/` (ap-study.js, business-workspace.js, homework.js, review.js)
- UI helpers in `src/ui/` (date-enhancer.js, select-enhancer.js)

### Storage Model
- **IndexedDB** for workspace state (pages, tasks, calendar, settings)
- **JSON export/import** for full workspace backup
- **.atelier ZIP format** for portable backup (contains JSON + metadata)
- **localStorage** for UI state (scroll positions, theme, density)
- **Session storage** for temporary UI state

### Core Data Models

#### Pages/Notes
```javascript
{
  id: string,
  title: string,
  content: string,        // HTML or plaintext
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp,
  parentId: string | null,
  position: number,
  icon: emoji,
  color: string,
  isLocked: boolean,       // Locked Pages feature (May 2026)
  lockHash: string | null,
  lockSalt: string | null,
  tags: string[],
  templates: object,
  customFields: object,
  // Missing: formatting metadata, page mode, headers/footers, version history
}
```

#### Tasks, Timeline, Settings
- Tasks: due date, repeat, priority, difficulty, category, habit tracking
- Timeline: calendar blocks, ICS import/export, Google Calendar overlay
- Settings: theme, density, feature visibility, workspace mode, AI key, etc.

### Current UI Structure
- **Top tab bar**: Today, Timeline, Notes, College, Life, Business, Homework, AP Study, Settings + overflow
- **Left sidebar**: Page tree (hierarchical), with search, + buttons
- **Editor pane**: Rich editor with slash commands and toolbar
- **Right panels**: Task shortcuts, calendar, widgets (varies by view)
- **Floating toolbar**: Above editor (formatting controls)
- **Status bar**: Footer with timer, word count, hints
- **Modals**: Command palette, settings, export/import, etc.

### Current Features (Preserved)
✅ Hierarchical pages with icons, colors, tags, custom fields
✅ Rich editor with slash commands (/, /h1, /code, /list, etc.)
✅ Split-screen view (two pages side-by-side)
✅ Task management with repeat, priority, difficulty, categories
✅ Calendar with time blocks, ICS import/export, Google Calendar overlay
✅ Homework tracking (class lanes, assignments, paste import)
✅ AP Study (units, sessions, practice logs, AP Battle Plan, weak area tracking)
✅ College app tracker (essays, scores, awards, decision matrices)
✅ Life trackers (habits, sleep, spending, journal, goals, books, fitness, calculator, skills)
✅ Business/freelance modules (projects, clients, invoices, CRM, tasks)
✅ Focus timer with ringtones and Focus Mode
✅ Review/spaced repetition
✅ Review & Study tools
✅ Command palette (Ctrl/⌘+K)
✅ Global search
✅ Quick capture
✅ Multiple themes (Light, Dark, Warm, Cool, Retro-ish)
✅ Configurable UI density
✅ Keyboard shortcuts (some)
✅ Mobile/tablet layout
✅ Locked Pages (PIN-protected pages, May 2026)
✅ Flow Assistant (optional AI with user's own API key)
✅ Student Setup wizard
✅ Workspace modes (Student, AP Crunch, College Apps, Writing, Life, Business, Standard)
✅ Export/import (.atelier, JSON, PDF, HTML, Markdown, ICS)

---

## 2. UI/UX Problems Identified

### Main UI Cluttered Areas

**Editor Toolbar (floating above editor)**
- Packed with: bold, italic, underline, code, lists, quotes, strikethrough, text color, highlight, link, emoji, slash commands
- No clear grouping or hierarchy
- On mobile: completely horizontal scroll or hidden
- Problem: Users cannot discover or use formatting tools effectively

**Settings Tab**
- Single flat page with all controls mixed together
- No section grouping or logical organization
- Too many options at once (80+ settings)
- Difficult to find what you need
- No description or help text for advanced settings
- Problems: Overwhelmed new users; hard to find features

**Today/Dashboard View**
- Multiple competing widgets: Daily Brief, Deadline Radar, Plan My Day, Homework, AP metrics, Life trackers, Habits
- Unclear primary action
- Metrics and status scattered
- Mobile: vertically stretched
- Problem: Unclear where to start; too many metrics at once

**Sidebar**
- Page tree sometimes deeply nested (hard to navigate)
- + button placement ambiguous
- Search box, shortcuts, and page tree compete for attention
- Mobile: sidebar collapses but no clear way to expand

**Scattered Controls**
- Page settings: appear in page context menu, in editor toolbar, in Settings
- Theme controls: in top toolbar, in Settings
- Export controls: in toolbar, in command palette, in Settings
- Note mode (normal/page): unclear; no visual indicator
- Font/margin/size settings: not discoverable

**Mobile Layout Issues**
- Toolbar wraps or scrolls horizontally
- Editor becomes narrow and hard to use
- Sidebar collapses with no clear access
- Tables don't fit
- Images overflow
- Comments/outline panels squash content
- Touch targets too small
- Page mode becomes unusable

**Visual Inconsistencies**
- Border radius varies across components
- Shadows inconsistent
- Spacing not grid-aligned
- Button styles mixed (some neumo, some glass, some flat)
- Icon usage inconsistent (emoji icons, Font Awesome, custom)
- Typography scale not clearly defined

**Empty States**
- Many views have no empty state guidance
- New users don't know what to do first
- No onboarding for new features

---

## 3. What Exists vs. What's Needed

| Feature | Current Status | Issue | Action |
|---------|---|---|---|
| Notes/Pages | ✅ Full | No formatting metadata | Add rich formatting |
| Editor | ✅ Full | Limited formatting UI | Redesign toolbar |
| Page Mode | ❌ Not implemented | N/A | Implement (section 7) |
| Page breaks | ❌ Not implemented | N/A | Add visual (section 7) |
| Margins/headers/footers | ❌ Not implemented | N/A | Add document controls (section 9) |
| Formatting controls | ⚠️ Partial | Basic via slash commands only | Add toolbar + persistence (section 8) |
| Tables | ⚠️ Partial | No cell typing; unclear UI | Fix + improve (section 10) |
| Comments | ❌ Not implemented | N/A | Implement (section 11) |
| Suggesting mode | ❌ Not implemented | N/A | Implement (section 12) |
| Find/replace | ❌ Not implemented | N/A | Implement (section 13) |
| Document outline | ❌ Not implemented | N/A | Implement (section 14) |
| Footnotes | ❌ Not implemented | N/A | Implement (section 15) |
| Citations/bibliography | ❌ Not implemented | N/A | Implement (section 15) |
| Equations | ❌ Not implemented | N/A | Implement (section 15) |
| Image resizing | ❌ Not implemented | N/A | Implement (section 16) |
| Photo grids | ❌ Not implemented | N/A | Implement (section 16) |
| Version history | ❌ Not implemented | N/A | Implement (section 17) |
| Spaces/folders | ❌ Not implemented | N/A | Implement (section 6) |
| Settings organization | ⚠️ Flat | Messy single page | Redesign (section 3) |
| UI/UX polish | ⚠️ Needs work | Scattered controls, poor mobile | Clean (sections 1, 4, 5) |
| Adult/professional templates | ❌ Not implemented | N/A | Implement (section 23) |
| Retro theme | ⚠️ Partial | Exists but incomplete | Complete (section 22) |
| First-time setup | ⚠️ Student only | Only offers student mode | Expand (section 23) |
| Mobile experience | ⚠️ Works but hard | Cramped, unpolished | Improve (section 24) |
| Keyboard shortcuts | ⚠️ Some | Incomplete (Ctrl+K only) | Expand (section 19) |
| Link/paste | ⚠️ Partial | No smart paste | Improve (section 20) |
| Word count/stats | ⚠️ Partial | Word count exists | Expand to document stats (section 21) |
| DOCX/PDF export | ⚠️ Works | Limited formatting preservation | Improve fidelity (section 18) |
| Settings persistence | ✅ Works | N/A | Verify & fix (section 26) |

---

## 4. Data Model Changes Required

### New/Modified Page Fields
```javascript
{
  // Existing
  id, title, content, createdAt, updatedAt, parentId, position, icon, color,
  isLocked, lockHash, lockSalt, lockedAt, lockAutoLock, tags, templates, customFields,
  
  // NEW: Formatting
  formatting: {
    fontFamily: string,    // 'default', 'serif', 'mono', 'sans', or Google Font name
    fontSize: number,      // 12-36
    lineHeight: number,    // 1.0-2.0
    textColor: string,     // #hex or css color name
    backgroundColor: string,
    blockquote: boolean,
    alignment: 'left' | 'center' | 'right' | 'justify'
  },
  
  // NEW: Page Mode
  pageMode: {
    enabled: boolean,      // Is this note in page mode?
    size: 'letter' | 'a4', // US Letter (8.5"×11") or A4 (210×297mm)
    margins: {             // in mm
      top: number,
      bottom: number,
      left: number,
      right: number
    },
    headers: {
      enabled: boolean,
      content: string,     // HTML/text
      pageNumberOffset: number
    },
    footers: {
      enabled: boolean,
      content: string,
      pageNumberOffset: number
    },
    pageNumbers: {
      enabled: boolean,
      position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right',
      startFrom: number    // Usually 1
    },
    pageBreaks: string[]   // Array of content offsets where page breaks exist
  },
  
  // NEW: Comments
  comments: [
    {
      id: string,
      text: string,
      startOffset: number,     // Position in content
      endOffset: number,
      author: string,          // "You" or username if multi-user later
      createdAt: ISO timestamp,
      updatedAt: ISO timestamp,
      resolved: boolean,
      replies: [...]           // Similar structure
    }
  ],
  
  // NEW: Suggestions
  suggestions: [
    {
      id: string,
      type: 'insert' | 'delete' | 'replace',
      startOffset: number,
      endOffset: number,
      newText: string,         // For insert/replace
      author: string,
      createdAt: ISO timestamp,
      accepted: boolean | null // null = pending, true = accepted, false = rejected
    }
  ],
  
  // NEW: Footnotes
  footnotes: [
    {
      id: string,
      number: number,
      content: string,
      position: number         // In content
    }
  ],
  
  // NEW: Citations
  citations: [
    {
      id: string,
      number: number,
      title: string,
      author: string,
      url: string,
      dateAccessed: ISO date,
      publicationDate: ISO date,
      source: string,          // Publisher, journal, etc.
      notes: string,
      position: number         // In content
    }
  ],
  
  // NEW: Version History
  versions: [
    {
      id: string,
      content: string,         // Full content at this point
      snapshot: object,        // Other fields snapshot (formatting, pageMode, etc.)
      savedAt: ISO timestamp,
      label: string            // User-assigned label (e.g., "Before major rewrite")
    }
  ],
  
  // NEW: Space/Folder
  spaceId: string             // Which Space this note belongs to
}
```

### New Settings Fields
```javascript
{
  // Existing
  theme, density, workspaceMode, featureTabs, tutorial, ai, ...
  
  // NEW
  userMode: 'student' | 'professional' | 'both' | 'skip',
  
  // Settings organization
  editorPreferences: {
    defaultFontFamily: string,
    defaultFontSize: number,
    defaultLineHeight: number,
    autoFormat: boolean,        // Auto-apply formatting rules
  },
  
  pagePreferences: {
    defaultPageSize: 'letter' | 'a4',
    defaultMargins: { top, bottom, left, right },
    showPageBreaks: boolean,    // Visual indicator
  },
  
  exportPreferences: {
    defaultFormat: 'pdf' | 'docx' | 'md' | 'html' | 'json',
    includeMetadata: boolean,
    preserveFormatting: boolean,
    pageMode: boolean,
  },
  
  dataPreferences: {
    autoBackupDays: number,     // 0 = never
    versionHistoryMax: number,  // Max snapshots to keep
    deleteOldVersions: boolean,
  },
  
  accessibilityPreferences: {
    reduceMotion: boolean,      // Respects prefers-reduced-motion
    largeText: boolean,
    highContrast: boolean,
  }
}
```

### New Workspace-Level Data: Spaces
```javascript
spaces: [
  {
    id: string,
    name: string,
    icon: emoji,
    color: string,
    order: number,
    createdAt: ISO timestamp,
    description: string        // Optional
  }
]
```

---

## 5. Files to Modify/Create

### Core Files
- **NoteflowAtelier.html** — Add new view sections, modals, panels
- **src/core/app.js** — Largest changes: new data models, migration, new features
- **styles/styles.css** — Redesigned Settings, cleaner UI, page mode styles
- **styles/mobile.css** — Improved mobile experience

### New CSS Files (Optional)
- **styles/formatting.css** — Formatting toolbar, document layout UI
- **styles/comments.css** — Comments panel, bubbles, markers
- **styles/page-mode.css** — Page mode visual styles, page breaks
- **styles/spaces.css** — Spaces sidebar, switcher UI

### Documentation
- **README.md** — Update feature list, usage instructions
- **TUTORIAL.md** — Add new features to walkthrough
- **HELP_DOCS.md** — In-app help (new or expanded)

---

## 6. Implementation Order & Dependencies

### Section 1: Full UI/UX Audit and Cleanup (No coding)
- No dependencies
- Produces list of issues and proposed fixes

### Section 2: Move Controls into Settings
- Depends on: Section 1 (identify what to move)
- Prerequisite for: Section 3 (settings redesign)

### Section 3: Redesign Settings Tab
- Depends on: Section 2 (know what controls to organize)
- No other dependencies

### Section 4: Clean Up Main UI
- Depends on: Sections 1-3 (after controls removed from main)
- Prerequisite for: Section 5

### Section 5: Optimize Navigation and Layout
- Depends on: Sections 1-4
- Prerequisite for: Section 24 (mobile improvements)

### Section 6: Add Spaces
- No dependencies on others
- Requires: Migration logic (safest to do early)

### Sections 7-25: New Features
- Most are independent (can work in parallel if needed)
- Some benefit from: Section 1-5 completed first (cleaner UI)
- Section 24 (mobile) depends on earlier features existing

### Section 26: Settings Persistence
- Depends on: All new features (ensure they save)

### Section 27: Documentation
- Depends on: Sections 1-26 complete

### Section 28: Constraint Verification
- Depends on: Sections 1-27 complete

### Section 29: Testing
- Depends on: Sections 1-27 complete

### Section 30: Final Report
- Depends on: Sections 1-29 complete

---

## 7. Data Migration Strategy

### Backward Compatibility (100%)
- Old page data loads correctly in new app
- All fields not recognized are preserved
- Old export/import files work unchanged

### Migration: Old Pages → Default Space
```javascript
// On first load with new app:
if (!workspace.spaces || workspace.spaces.length === 0) {
  // Create default Space
  const defaultSpace = {
    id: generateId(),
    name: 'Notes',
    icon: '📝',
    color: '#d8c4a1',
    order: 1,
    createdAt: new Date().toISOString(),
    description: 'Your existing notes'
  };
  workspace.spaces = [defaultSpace];
  
  // All existing pages without spaceId → default space
  workspace.pages.forEach(page => {
    if (!page.spaceId) {
      page.spaceId = defaultSpace.id;
    }
  });
  
  // Save and log
  saveWorkspace();
}
```

### Settings Migration
```javascript
// Existing settings load unchanged
// New settings use defaults if missing:
if (settings.userMode === undefined) {
  settings.userMode = 'skip';  // Don't ask again
}
if (settings.editorPreferences === undefined) {
  settings.editorPreferences = { /* defaults */ };
}
```

### Version Snapshots Migration
```javascript
// Existing pages have no versions field
// When first saving after upgrade:
if (!page.versions) {
  page.versions = [{
    id: generateId(),
    content: page.content,
    snapshot: { /* current formatting, pageMode, etc. */ },
    savedAt: new Date().toISOString(),
    label: 'Migrated from upgrade'
  }];
}
```

---

## 8. Testing Strategy

### Manual Testing Flows (Required for Each Section)
1. **Create new note** → apply feature → save → reload → verify it persists
2. **Edit existing note** → apply feature → export as JSON → reimport → verify
3. **Export/import .atelier** → verify all fields preserved
4. **Mobile view** → same tests on phone/tablet
5. **Theme switching** → features work in Light, Dark, Warm, Cool, Retro

### Structural Checks
- Run `npm run check` (smoke-check.mjs) after each major section
- Node syntax check: `node --check src/core/app.js` after each section
- Console errors: no new errors in DevTools after feature use

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Smoke Check Additions
If the existing smoke check is insufficient, add lightweight checks for:
- Spaces data structure exists and migrates
- Formatting fields save/load
- Page mode exports correctly
- Comments don't corrupt content
- Find/replace works
- Version history snapshots

---

## 9. Risks and Fragile Areas

### High Risk
1. **Large data model changes** — page object fields growing significantly
   - Mitigation: Defensive normalization function handles missing fields
   - Test: Old workspaces load without error

2. **Single-file HTML constraints** — can't split into modules
   - Mitigation: Keep feature modules in `src/` separate; concatenate in `app.js`
   - Be careful with global scope pollution

3. **IndexedDB quota** — large workspaces could hit storage limit
   - Mitigation: Implement version snapshot pruning; warn users
   - Test: Create large workspace with 100+ notes, verify it doesn't break

4. **Export format compatibility** — JSON and .atelier must remain backward-compatible
   - Mitigation: Old fields preserved, new fields optional with defaults
   - Test: Export old workspace, import into new app, export again

5. **CSS file growth** — styles.css already 29k; adding features could bloat
   - Mitigation: Consider splitting into separate CSS files (but ensure they load)
   - Keep CSS minimal; reuse existing design tokens

### Medium Risk
1. **Mobile layout fragility** — any new UI that doesn't scale breaks mobile
   - Mitigation: Test every feature on mobile immediately after building
   - Keep mobile-first approach
   
2. **Toolbar density** — editor toolbar already packed; adding more could feel cluttered
   - Mitigation: Use dropdowns, popovers, collapsible sections for less-used tools
   - Implement toolbar customization if possible

3. **Performance on large documents** — very long notes could become slow
   - Mitigation: Implement virtual scrolling for page mode view if needed
   - Lazy-load comments/version history panels

4. **Comment/suggestion rendering** — could conflict with rich text editor
   - Mitigation: Keep comments in separate data structure (don't embed in content HTML)
   - Test with complex nested formatting + comments

### Low Risk
1. Theme/dark mode consistency — new features must respect themes
   - Mitigation: Use existing CSS variables throughout
   - Test: Every feature in Light + Dark mode

2. Keyboard shortcut conflicts — new shortcuts could conflict with browser
   - Mitigation: Check against existing shortcuts before adding
   - Document conflicts clearly

---

## 10. Implementation Approach

### Code Organization
- Keep `src/core/app.js` as main module (don't split unnecessarily)
- New features get utility functions near their usage
- HTML markup stays in `NoteflowAtelier.html`
- Styles stay in `styles/` files
- Feature modules in `src/features/` (existing pattern)

### Coding Standards
- No comments unless logic is non-obvious
- Use existing naming conventions
- Use existing design tokens and CSS variables
- Reuse existing components (buttons, modals, panels)
- No external dependencies unless absolutely required
- Keep file sizes manageable (monitor growth)

### Commitment to Local-First
- All data persists to IndexedDB, localStorage, or .atelier exports
- No backend calls for new features
- AI (Flow Assistant) optional, key stored locally
- No analytics, telemetry, or account required

---

## 11. Success Criteria

After all 30 sections are complete:

### Feature Completeness
- ✅ All 15+ new features are working and fully integrated
- ✅ Every feature persists through save/reload/export/import
- ✅ Mobile works for all features
- ✅ Dark/light themes work for all features

### UI/UX Quality
- ✅ Main UI is visibly cleaner (controls moved out of primary views)
- ✅ Settings feel organized and navigable
- ✅ New features discoverable (toolbar, menus, slash commands)
- ✅ No duplicate controls in main views
- ✅ Consistent spacing, colors, typography, border radius
- ✅ No new layout overflow issues

### Data Integrity
- ✅ Old workspaces load without errors
- ✅ Old data migrates safely to Spaces
- ✅ Export/import preserves all data including new features
- ✅ No data loss through feature use
- ✅ Version history snapshots don't exceed storage quota

### Performance
- ✅ App loads in <2 seconds
- ✅ No new console errors
- ✅ Saving and switching notes remains snappy
- ✅ Large documents (5000+ words) remain usable

### Documentation
- ✅ README updated with all new features
- ✅ Help docs explain how to use each feature
- ✅ Tutorial covers major workflows
- ✅ Settings clearly labeled with descriptions

---

## 12. Next Steps

1. **You approve this plan** — review for completeness, risks, scope
2. **Implement Section 1** — audit UI/UX, document findings
3. **Request approval before Section 2** — show audit results, proposed organization
4. **Proceed section-by-section** — each section complete → test → approval → next
5. **Final verification** — run smoke check, manual testing flows
6. **Produce final report** — detailed change log, feature checklist, limitations

---

## Appendix: Estimated Scope (Per Section)

| Section | Estimated Lines | Type | Risk |
|---------|---|---|---|
| 1. Audit & Cleanup | 0 | Analysis | Low |
| 2. Move Controls | 200-400 | Refactor | Low |
| 3. Settings Redesign | 1500-2000 | Redesign | Medium |
| 4. Clean Main UI | 300-500 | Refactor | Low |
| 5. Optimize Layout | 400-600 | Refactor | Medium |
| 6. Spaces | 800-1200 | New Feature | Medium |
| 7. Page Mode | 1500-2000 | New Feature | High |
| 8. Formatting | 1200-1500 | New Feature | High |
| 9. Document Layout | 600-900 | New Feature | Medium |
| 10. Tables | 500-800 | Enhancement | Medium |
| 11. Comments | 1000-1300 | New Feature | High |
| 12. Suggesting Mode | 800-1000 | New Feature | Medium |
| 13. Find/Replace | 600-800 | New Feature | Low |
| 14. Document Outline | 400-600 | New Feature | Low |
| 15. Student Tools | 800-1000 | New Feature | Medium |
| 16. Image Behavior | 1000-1200 | Enhancement | Medium |
| 17. Version History | 700-900 | New Feature | Medium |
| 18. Export Fidelity | 800-1200 | Enhancement | Medium |
| 19. Keyboard Shortcuts | 300-400 | Enhancement | Low |
| 20. Links & Paste | 300-400 | Enhancement | Low |
| 21. Word Count & Stats | 200-300 | Enhancement | Low |
| 22. Retro Theme | 400-600 | Design | Low |
| 23. User Mode Setup | 600-800 | Enhancement | Low |
| 24. Mobile Improvements | 500-1000 | Enhancement | Medium |
| 25. Quote Integration | 100-200 | Enhancement | Low |
| 26. Settings Persistence | 200-300 | Verification | Low |
| 27. Documentation | 1000-2000 | Writing | Low |
| 28. Constraint Check | 100-200 | Verification | Low |
| 29. Testing | 500-1000 | Verification | Medium |
| 30. Final Report | 500-1000 | Writing | Low |
| **TOTAL** | **~20,000-27,000** | Mixed | Managed |

---

## Approval Checklist

Before implementation starts, confirm:

- [ ] Plan scope is acceptable
- [ ] Risk assessment is adequate
- [ ] Data migration strategy is sound
- [ ] You understand section dependencies
- [ ] You want to proceed section-by-section with approvals
- [ ] Testing approach is sufficient
- [ ] You're prepared for potential blockers
- [ ] Implementation timeline is acceptable

**Ready to proceed?** 👉 Approve this plan to start Section 1.

