#!/usr/bin/env node
// Smoke check: verifies that the Atelier .atelier export/import wiring
// and settings save/apply wiring are intact. Does not execute the app;
// runs text-level structural assertions against the shipped source.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const rel = (p) => resolve(repoRoot, p);

const failures = [];

function mustContain(file, needle, label) {
    try {
        const text = readFileSync(rel(file), 'utf8');
        if (!text.includes(needle)) {
            failures.push(`${label} missing: ${needle} in ${file}`);
        }
    } catch (err) {
        failures.push(`${label} read failed for ${file}: ${err.message}`);
    }
}

function mustContainAny(file, needles, label) {
    try {
        const text = readFileSync(rel(file), 'utf8');
        if (!needles.some(n => text.includes(n))) {
            failures.push(`${label} missing any of: [${needles.join(', ')}] in ${file}`);
        }
    } catch (err) {
        failures.push(`${label} read failed for ${file}: ${err.message}`);
    }
}

// .atelier export/import coverage
mustContain('src/core/app.js', 'exportWorkspaceAsAtelierPackage', '.atelier export function');
mustContain('src/core/app.js', 'importAtelierPackage', '.atelier import function');
mustContain('src/core/app.js', 'buildWorkspaceExportPayload', 'export payload builder');
mustContain('src/core/app.js', 'importWorkspacePayload', 'workspace import function');
mustContain('src/core/app.js', 'collectAtelierRawLocalStorageSnapshot', 'raw localStorage capture');
mustContain('src/core/app.js', 'restoreAtelierRawLocalStorageSnapshot', 'raw localStorage restore');
mustContain('src/core/app.js', 'createPreImportSafetySnapshot', 'pre-import safety snapshot');
mustContain('src/core/app.js', 'ATELIER_SENSITIVE_SETTING_KEYS', 'sensitive key filter');
mustContain('src/core/app.js', "localStorageSnapshot:", 'localStorageSnapshot in payload');
mustContain('src/core/app.js', 'recordAtelierDataHealth', 'data health recorder');
mustContain('src/core/app.js', 'updateAtelierDataHealthUi', 'data health UI update');

// Settings save/apply UI hooks
mustContain('src/core/app.js', 'applySettingsDraftChanges', 'settings apply function');
mustContain('src/core/app.js', "settingsApplyBtn", 'settings apply button');
mustContain('src/core/app.js', "settingsApplyBtnTop", 'top settings apply button');
mustContain('NoteflowAtelier.html', 'id="settingsApplyBtnTop"', 'top settings apply button in HTML');
mustContain('NoteflowAtelier.html', 'atelier-data-health-card', 'data health card in HTML');

// Workspace mode preference plumbing
mustContain('src/core/app.js', "workspace:", 'workspace preference group');
mustContain('src/core/app.js', "'ap_crunch'", 'ap_crunch mode choice');
mustContain('NoteflowAtelier.html', 'data-pref-path="workspace.mode"', 'workspace mode select in HTML');

// Workspace Mode UI gating helpers
mustContain('src/core/app.js', 'getActiveWorkspaceMode', 'active workspace mode getter');
mustContain('src/core/app.js', 'getWorkspaceModeLabel', 'workspace mode label helper');
mustContain('src/core/app.js', 'shouldShowViewForWorkspaceMode', 'per-view gating helper');
mustContain('src/core/app.js', 'applyWorkspaceModeVisibility', 'apply workspace mode visibility');
mustContain('src/core/app.js', 'hasWorkspaceData', 'workspace data presence check');
mustContain('src/core/app.js', 'WORKSPACE_MODE_VIEW_PROFILE', 'workspace mode profile table');

// Deadline aggregation helpers
mustContain('src/core/app.js', 'collectWorkspaceDeadlines', 'deadline aggregator');
mustContain('src/core/app.js', 'groupDeadlinesByTimeframe', 'deadline grouper');
mustContain('src/core/app.js', 'normalizeDeadlineDate', 'deadline date normalizer');
mustContain('src/core/app.js', 'openDeadlineSource', 'open deadline source helper');
mustContain('src/core/app.js', 'pickNextBestAction', 'next best action picker');

// Daily Brief
mustContain('src/core/app.js', 'renderTodayDailyBrief', 'daily brief renderer');
mustContain('NoteflowAtelier.html', 'id="todayDailyBrief"', 'Daily Brief container');

// Deadline Radar modal
mustContain('src/core/app.js', 'openDeadlineRadar', 'deadline radar open');
mustContain('src/core/app.js', 'closeDeadlineRadar', 'deadline radar close');
mustContain('NoteflowAtelier.html', 'id="deadlineRadarModal"', 'Deadline Radar modal markup');

// Student Onboarding Wizard
mustContain('src/core/app.js', 'showStudentOnboarding', 'student onboarding opener');
mustContain('src/core/app.js', 'isStudentOnboardingPending', 'student onboarding pending check');
mustContain('src/core/app.js', 'applyStudentOnboarding', 'student onboarding apply');
mustContain('src/core/app.js', 'ONBOARDING_STEPS', 'onboarding step list');
mustContain('NoteflowAtelier.html', 'id="studentOnboardingOverlay"', 'onboarding overlay markup');
mustContain('NoteflowAtelier.html', 'id="rerunOnboardingBtn"', 'rerun onboarding button in Settings');

// Help/tutorial references
mustContainAny('src/core/app.js', ['Daily Brief', 'Deadline Radar', 'Workspace Mode', '.atelier'], 'tutorial mentions new features');
mustContainAny('src/core/app.js', ['Command Palette', 'Quick Capture', 'Weekly Review', 'AP Exam Battle Plan', 'Class Dashboard'], 'tutorial mentions newer features');

// Command Palette
mustContain('src/core/app.js', 'openCommandPalette', 'command palette opener');
mustContain('src/core/app.js', 'closeCommandPalette', 'command palette closer');
mustContain('src/core/app.js', 'getCommandPaletteCommands', 'command palette command list');
mustContain('src/core/app.js', 'renderCommandPalette', 'command palette renderer');
mustContain('src/core/app.js', 'bindCommandPaletteInput', 'command palette input binder');
mustContain('NoteflowAtelier.html', 'id="commandPaletteModal"', 'command palette modal markup');

// Quick Capture
mustContain('src/core/app.js', 'openQuickCaptureModal', 'quick capture opener');
mustContain('src/core/app.js', 'closeQuickCaptureModal', 'quick capture closer');
mustContain('src/core/app.js', 'submitQuickCapture', 'quick capture submit');
mustContain('src/core/app.js', 'parseQuickCaptureText', 'quick capture parser');
mustContain('src/core/app.js', 'getQuickCaptureApSubjects', 'quick capture AP subject helper');
mustContain('src/core/app.js', 'syncQuickCaptureApSubjectField', 'quick capture AP picker sync');
mustContain('NoteflowAtelier.html', 'id="quickCaptureModal"', 'quick capture modal markup');
mustContain('NoteflowAtelier.html', 'id="quickCaptureApSubject"', 'quick capture AP picker markup');

// Global Search
mustContain('src/core/app.js', 'globalSearchAll', 'global search aggregator');

// Weekly Review
mustContain('src/core/app.js', 'createWeeklyReviewNote', 'weekly review note creator');

// AP Battle Plan
mustContain('src/core/app.js', 'computeApBattlePlan', 'AP Battle Plan computer');
mustContain('src/core/app.js', 'renderApBattlePlan', 'AP Battle Plan renderer');
mustContain('NoteflowAtelier.html', 'id="apBattlePlanCard"', 'AP Battle Plan card markup');

// Class Dashboard
mustContain('src/core/app.js', 'openClassDashboardDrawer', 'class dashboard opener');
mustContain('src/core/app.js', 'closeClassDashboardDrawer', 'class dashboard closer');
mustContain('NoteflowAtelier.html', 'id="classDashboardDrawer"', 'class dashboard markup');
mustContain('src/features/homework.js', 'data-task-dashboard', 'homework assignment class dashboard entry');
mustContain('src/features/ap-study.js', 'data-ap-action="open-class-dashboard"', 'AP Study class dashboard entry');
mustContain('src/core/app.js', 'breadcrumb-class-chip', 'notes class chip entry point');
mustContain('src/core/app.js', 'data-brief-open-class', 'daily brief class dashboard entry');
mustContain('src/core/app.js', 'data-deadline-open-class', 'deadline radar class dashboard entry');

// Schedule this on deadline items
mustContain('src/core/app.js', 'scheduleDeadlineItemAsBlock', 'Schedule-this helper for deadlines');
mustContain('src/core/app.js', 'data-deadline-schedule', 'Schedule button in deadline radar rendering');

// Mode-aware overflow menu
mustContain('src/core/app.js', 'shouldShowViewForWorkspaceMode(view)', 'overflow menu mode gating filter');

// Homework paste import
mustContain('src/core/app.js', 'parseHomeworkPasteText', 'homework paste parser');
mustContain('src/core/app.js', 'openHomeworkPasteImport', 'homework paste opener');
mustContain('src/core/app.js', 'submitHomeworkPasteImport', 'homework paste submit');
mustContain('NoteflowAtelier.html', 'id="homeworkPasteImportModal"', 'homework paste modal markup');
mustContain('NoteflowAtelier.html', 'id="hwPasteImportBtn"', 'homework paste import button');

// Split-screen presets
mustContain('src/core/app.js', 'NOTES_SPLIT_PRESETS', 'split-screen presets table');
mustContain('src/core/app.js', 'applyNotesSplitPreset', 'split-screen preset applier');
mustContain('src/core/app.js', 'openNotesSplitPresetsPicker', 'split-screen presets picker');
mustContain('NoteflowAtelier.html', 'id="splitNotesPresetsBtn"', 'split-screen presets button');

// Class Dashboard note linking
mustContain('src/core/app.js', 'getNotesLinkedToClass', 'class-note linked notes getter');
mustContain('src/core/app.js', 'linkCurrentNoteToClass', 'class-note linker');
mustContain('src/core/app.js', 'createNoteLinkedToClass', 'class-note creator');
mustContain('src/core/app.js', 'classLinkId', 'class link property');

// AP Battle Plan native
mustContain('src/core/app.js', 'createApStudySessionFromBattlePlan', 'AP battle plan session creator');
mustContain('src/core/app.js', 'createApUnitNoteFromBattlePlan', 'AP battle plan note creator');
mustContain('src/core/app.js', 'apBattleCreateSessionBtn', 'AP battle plan session button');

// Global Search panel
mustContain('src/core/app.js', 'openGlobalSearchPanel', 'global search panel opener');
mustContain('src/core/app.js', 'closeGlobalSearchPanel', 'global search panel closer');
mustContain('NoteflowAtelier.html', 'id="globalSearchPanel"', 'global search panel markup');

// Quick Capture native routing
mustContain('src/core/app.js', 'apStudyWorkspace.sessions.push', 'Quick Capture AP session creation');
mustContain('src/core/app.js', 'collegeTracker.essays', 'Quick Capture college essay routing');

// Schedule-this helpers
mustContain('src/core/app.js', 'scheduleGenericItemAsBlock', 'generic schedule helper');
mustContain('src/features/homework.js', 'data-task-schedule', 'Schedule this button in homework menu');
mustContain('src/core/app.js', "'college-action': 'schedule'", 'college sheet schedule action');
mustContain('src/core/app.js', "'collegeapp-action': 'schedule'", 'college app schedule action');
mustContain('src/core/app.js', 'createCollegeEssayNoteFromContext', 'college essay note creator');
mustContain('src/core/app.js', "'college-action': 'essay-note'", 'college sheet essay note action');
mustContain('src/core/app.js', "'collegeapp-action': 'essay-note'", 'college app essay note action');

// ICS import/export
mustContain('src/core/app.js', 'parseIcsEvents', 'ICS parser');
mustContain('src/core/app.js', 'exportCalendarIcs', 'ICS export function');
mustContainAny('src/core/app.js', ['importCalendarIcsBtn', 'parseIcsEvents(icsText)', 'calendar_ics'], 'ICS import wiring');

// Tutorial / help updates
mustContainAny('src/core/app.js', ['Homework Paste Import', 'homework-paste-import'], 'tutorial/help mentions homework paste import');
mustContainAny('src/core/app.js', ['Split-screen Workflow', 'split-screen-presets'], 'tutorial/help mentions split-screen presets');
mustContainAny('src/core/app.js', ['Search Everywhere', 'search-everywhere'], 'tutorial/help mentions Search Everywhere');
mustContainAny('src/core/app.js', ['First 10 Minutes In Atelier', 'Workspace Modes', 'Daily Brief And Deadline Radar'], 'help rewrite mentions current onboarding flow');
mustContainAny('src/core/app.js', ['.atelier Backup And Restore', 'Local-First Warning', 'exports are not encrypted'], 'help warns about local-first backup limits');

// Life / Business refinement
mustContain('NoteflowAtelier.html', 'More Life Tools', 'life dashboard secondary tools grouping');
mustContainAny('src/core/app.js', ['bw.finance', 'bw.tasks', 'bw.proposals'], 'business data visibility logic');
mustContainAny('src/core/app.js', ['lw.journals', 'lw.spending'], 'life data visibility logic');

// Syntax check already covers all .js files via check:syntax.

if (failures.length) {
    console.error('SMOKE CHECK FAILED:');
    failures.forEach(f => console.error(' - ' + f));
    process.exit(1);
}

console.log('Smoke check passed (all assertions).');
