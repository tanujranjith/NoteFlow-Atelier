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

// Canonical save/export/import wrapper presence
mustContain('src/core/app.js', 'function serializeWorkspace', 'canonical serializeWorkspace wrapper');
mustContain('src/core/app.js', 'function deserializeWorkspace', 'canonical deserializeWorkspace wrapper');
mustContain('src/core/app.js', 'function saveWorkspaceLocally', 'canonical saveWorkspaceLocally wrapper');
mustContain('src/core/app.js', 'function loadWorkspaceLocally', 'canonical loadWorkspaceLocally wrapper');
mustContain('src/core/app.js', 'function exportWorkspaceAsAtelier', 'canonical exportWorkspaceAsAtelier wrapper');
mustContain('src/core/app.js', 'function exportWorkspaceAsJson', 'canonical exportWorkspaceAsJson wrapper');
mustContain('src/core/app.js', 'function importWorkspaceFile', 'canonical importWorkspaceFile wrapper');
mustContain('src/core/app.js', 'function verifyWorkspaceRoundTrip', 'in-browser round-trip verifier');
mustContain('src/core/app.js', 'window.verifyWorkspaceRoundTrip', 'round-trip verifier exposed on window');
mustContain('src/core/app.js', "atelierTheme: 'light'", 'Atelier shell theme default in settings');
mustContain('src/core/app.js', "retro95: {", 'Retro preset theme registry entry');
mustContain('src/core/app.js', "name: 'Retro 95'", 'Retro preset theme label');
mustContain('src/core/app.js', "['light', 'dark', 'retro95']", 'Atelier theme normalizer accepts Retro 95');
mustContain('src/core/app.js', 'applyAtelierTheme(normalizedTheme);', 'Retro preset syncs the shell theme');
// Regression guard: switching FROM Retro 95 to any other preset must clear the
// retro body class and inline CSS variable overrides.  This check ensures
// applyPresetTheme() calls applyAtelierTheme when wasRetroShellActive is true
// and the new theme is NOT retro95.
mustContain('src/core/app.js', 'wasRetroShellActive', 'applyPresetTheme detects when Retro 95 shell was active before switching away');
mustContain('src/core/app.js', '!isRetroTheme && wasRetroShellActive', 'applyPresetTheme resets Atelier shell when leaving Retro 95');
mustContain('src/core/app.js', "chatMemoryMode: 'stateless'", 'assistant chat memory mode default');
mustContain('src/core/app.js', 'chatMemoryDepth: 10', 'assistant chat memory depth default');

// JSON export must redact sensitive credentials, like the .atelier export does.
mustContain('src/core/app.js', 'mode: \'json\', includeSensitiveSettings: false', 'JSON export strips sensitive credentials');

// Settings save/apply UI hooks
mustContain('src/core/app.js', 'applySettingsDraftChanges', 'settings apply function');
mustContain('src/core/app.js', "settingsApplyBtn", 'settings apply button');
mustContain('src/core/app.js', "settingsApplyBtnTop", 'top settings apply button');
mustContain('NoteflowAtelier.html', 'id="settingsApplyBtnTop"', 'top settings apply button in HTML');
mustContain('NoteflowAtelier.html', 'atelier-data-health-card', 'data health card in HTML');
mustContain('NoteflowAtelier.html', 'data-theme="retro95"', 'Retro shell theme button in settings');
mustContain('NoteflowAtelier.html', "applyPresetTheme('retro95')", 'Retro preset tile in the preset grid');
mustContain('NoteflowAtelier.html', 'Retro 95', 'Retro preset label in the preset grid');

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

// Student Onboarding Wizard — preserved as compatibility wrappers around the
// unified onboarding controller.
mustContain('src/core/app.js', 'showStudentOnboarding', 'student onboarding opener');
mustContain('src/core/app.js', 'isStudentOnboardingPending', 'student onboarding pending check');
mustContain('src/core/app.js', 'applyStudentOnboarding', 'student onboarding apply');
mustContain('src/core/app.js', 'ONBOARDING_STEPS', 'onboarding step list');
mustContain('NoteflowAtelier.html', 'id="studentOnboardingOverlay"', 'onboarding overlay markup');
mustContain('NoteflowAtelier.html', 'id="rerunOnboardingBtn"', 'rerun onboarding button in Settings');

// Unified Onboarding controller (single source of truth replacing the user
// mode modal, feature setup overlay, student wizard, and tutorial auto-popup).
mustContain('src/core/app.js', 'AtelierOnboardingController', 'unified onboarding controller');
mustContain('src/core/app.js', 'getDefaultOnboardingState', 'unified onboarding default state factory');
mustContain('src/core/app.js', 'normalizeOnboardingState', 'unified onboarding state normalizer/migrator');
mustContain('src/core/app.js', 'maybeStartUnifiedOnboarding', 'unified onboarding first-run trigger');
mustContain('src/core/app.js', 'rerunAtelierOnboarding', 'Settings rerun-onboarding entry point');
mustContain('src/core/app.js', 'resetAtelierOnboardingForTesting', 'Settings reset-onboarding-status entry point');
mustContain('src/core/app.js', 'ONBOARDING_USER_INTENTS', 'unified onboarding user intent options');
mustContain('src/core/app.js', 'ONBOARDING_WORKSPACE_FOCUS_OPTIONS', 'unified onboarding workspace focus options');
mustContain('src/core/app.js', 'ONBOARDING_FEATURE_VIEWS', 'unified onboarding feature tile catalog');
mustContain('src/core/app.js', "ONBOARDING_STEPS = ['welcome', 'focus', 'features', 'setup', 'ai', 'tour']", 'unified onboarding 6-step ordering');
mustContain('src/core/app.js', 'syncOnboardingStatusUi', 'onboarding status text updater');
mustContain('NoteflowAtelier.html', 'atelier-onboarding-rail', 'unified onboarding left rail markup');
mustContain('NoteflowAtelier.html', 'id="onboardingSteps"', 'unified onboarding step list anchor');
mustContain('NoteflowAtelier.html', 'id="onboardingMainPanel"', 'unified onboarding main panel anchor');
mustContain('NoteflowAtelier.html', 'id="resetOnboardingBtn"', 'reset-onboarding-for-testing button in Settings');
mustContain('NoteflowAtelier.html', 'rerunAtelierOnboarding()', 'rerun-onboarding wired to controller');
mustContain('styles/styles.css', '.atelier-onboarding-shell', 'unified onboarding shell stylesheet');
mustContain('styles/styles.css', '.atelier-onboarding-rail', 'unified onboarding rail stylesheet');
mustContain('styles/styles.css', '.atelier-onboarding-card.is-selected', 'unified onboarding selection state stylesheet');
mustContain('styles/styles.css', '.legacy-overlay-hidden', 'legacy overlay neutralizer stylesheet');

// Legacy overlays must be permanently neutralized — no separate user-mode or
// feature-setup modal can render.
mustContain('NoteflowAtelier.html', 'id="userModeOverlay" class="legacy-overlay-hidden"', 'legacy user-mode overlay hidden');
mustContain('NoteflowAtelier.html', 'feature-setup-overlay legacy-overlay-hidden', 'legacy feature-setup overlay hidden');

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

// ----------------------------------------------------------------------
// Connected productivity upgrade: Review, Focus templates, Split context,
// Mobile Today Mode, extended Global Search.
// ----------------------------------------------------------------------

// Review tab + scheduling module (Quizlet-style with 5 study modes)
mustContain('src/core/app.js', "OPTIONAL_FEATURE_VIEWS = ['today'", 'feature-views array exists');
mustContain('src/core/app.js', "'review'", 'review view registered in OPTIONAL_FEATURE_VIEWS');
mustContain('src/core/app.js', 'getDefaultReviewWorkspace', 'review workspace defaults helper');
mustContain('src/core/app.js', 'normalizeReviewWorkspace', 'review workspace normalizer');
mustContain('src/core/app.js', 'reviewWorkspace = getDefaultReviewWorkspace()', 'review workspace runtime variable');
mustContain('src/core/app.js', 'appData.reviewWorkspace = normalizeReviewWorkspace', 'review workspace persisted');
mustContain('src/core/app.js', "defaultStudyMode: 'flashcards'", 'review settings default study mode');
mustContain('src/core/app.js', 'testQuestionCount', 'review settings test question count');
mustContain('src/core/app.js', 'matchPairCount', 'review settings match pair count');
mustContain('src/features/review.js', 'function applyGrade', 'review SM-2 grader');
mustContain('src/features/review.js', 'function promoteMastery', 'review mastery promoter');
mustContain('src/features/review.js', 'function bulkImportCards', 'review bulk import helper');
mustContain('src/features/review.js', "function buildLearnChoices", 'review learn-mode choice builder');
mustContain('src/features/review.js', 'function buildTestQuestions', 'review test-mode question builder');
mustContain('src/features/review.js', 'function buildMatchTiles', 'review match-mode tile builder');
mustContain('src/features/review.js', "function fuzzyEqual", 'review fuzzy answer comparator');
mustContain('src/features/review.js', "STUDY_MODES = ['flashcards', 'learn', 'write', 'test', 'match']", 'review study modes list');
mustContain('src/features/review.js', 'window.renderReviewWorkspace', 'review render exposed on window');
mustContain('src/features/review.js', 'window.getReviewTodayStats', 'review today stats exposed on window');
mustContain('src/features/review.js', 'window.getReviewSearchResults', 'review search bridge exposed on window');
mustContain('src/features/review.js', 'window.openReviewDeck', 'review open-deck bridge exposed on window');
mustContain('NoteflowAtelier.html', 'id="view-review"', 'review view section in HTML');
mustContain('NoteflowAtelier.html', 'id="tabReview"', 'review tab button in HTML');
mustContain('NoteflowAtelier.html', 'id="reviewMount"', 'review mount point in HTML');
mustContain('NoteflowAtelier.html', 'id="reviewCreateItemForm"', 'legacy review form retained for back-compat');
mustContain('NoteflowAtelier.html', 'src/features/review.js', 'review.js script included');
mustContain('styles/styles.css', '.review-bigcard', 'review big-card flashcard style present');
mustContain('styles/styles.css', '.review-match-grid', 'review match-mode grid style present');
mustContain('styles/styles.css', '.review-mastery-bar', 'review mastery bar style present');

// Focus templates
mustContain('src/core/app.js', 'getDefaultFocusTemplates', 'focus templates defaults helper');
mustContain('src/core/app.js', 'normalizeFocusTemplates', 'focus templates normalizer');
mustContain('src/core/app.js', 'function applyFocusTemplate', 'focus template applier');
mustContain('src/core/app.js', 'function renderFocusTemplateStrip', 'focus template strip renderer');
mustContain('src/core/app.js', 'window.applyFocusTemplate', 'focus template applier exposed on window');
mustContain('NoteflowAtelier.html', 'id="focusTemplateStrip"', 'focus template strip in HTML');

// Split View pane context
mustContain('src/core/app.js', 'getDefaultSplitPaneContexts', 'split pane contexts defaults helper');
mustContain('src/core/app.js', 'normalizeSplitPaneContexts', 'split pane contexts normalizer');
mustContain('src/core/app.js', 'function updateSplitPaneContext', 'split pane context updater');
mustContain('src/core/app.js', 'function setSplitViewSelection', 'split view selection setter');
mustContain('src/core/app.js', 'splitPaneContexts = getDefaultSplitPaneContexts()', 'split pane contexts runtime variable');
mustContain('src/core/app.js', 'appData.splitPaneContexts = normalizeSplitPaneContexts', 'split pane contexts persisted');

// Today integration
mustContain('src/core/app.js', 'function renderTodayReviewCard', 'today review-due card renderer');
mustContain('src/core/app.js', 'function renderTodayTrackerSummary', 'today tracker summary renderer');
mustContain('src/core/app.js', 'function renderTodayMobileShell', 'today mobile shell renderer');
mustContain('NoteflowAtelier.html', 'id="todayReviewCard"', 'today review card host in HTML');
mustContain('NoteflowAtelier.html', 'id="todayTrackerSummary"', 'today tracker summary host in HTML');
mustContain('NoteflowAtelier.html', 'id="todayMobileShell"', 'today mobile shell host in HTML');

// Mobile Today Mode
mustContain('src/core/app.js', 'function shouldUseMobileTodayMode', 'mobile today mode decider');
mustContain('src/core/app.js', 'function applyMobileTodayModeClass', 'mobile today mode class applier');
mustContain('src/core/app.js', "mobileTodayMode: 'auto'", 'mobile today mode default in settings');
mustContain('styles/styles.css', '.today-mobile-shell', 'mobile today shell stylesheet block');
mustContain('styles/styles.css', 'body.mobile-today-mode', 'mobile today mode CSS scope');

// Extended Global Search + recent-searches persistence
mustContain('src/core/app.js', 'review: []', 'global search now indexes review');
mustContain('src/core/app.js', 'trackers: []', 'global search now indexes trackers');
mustContain('src/core/app.js', 'recentSearches', 'recent searches setting wired');

// Persistence parity for new top-level keys
mustContain('src/core/app.js', "reviewWorkspace: payload.reviewWorkspace", 'review workspace in jsonPayload');
mustContain('src/core/app.js', "focusTemplates: payload.focusTemplates", 'focus templates in jsonPayload');
mustContain('src/core/app.js', "splitPaneContexts: payload.splitPaneContexts", 'split pane contexts in jsonPayload');

// ----------------------------------------------------------------------
// Integrated New Page templates: 5 student templates + picker + helpers.
// ----------------------------------------------------------------------
mustContain('src/core/app.js', "lecture_notes:", 'lecture notes template registered');
mustContain('src/core/app.js', "homework_tracker:", 'homework tracker template registered');
mustContain('src/core/app.js', "study_session:", 'study session template registered');
mustContain('src/core/app.js', "exam_prep:", 'exam prep template registered');
mustContain('src/core/app.js', "project_workspace:", 'project workspace template registered');
mustContain('src/core/app.js', 'INTEGRATED_TEMPLATE_IDS', 'integrated template id list registered');
mustContain('src/core/app.js', 'isIntegratedStudentTemplate', 'integrated template predicate present');
mustContain('src/core/app.js', 'function getActiveCreationContext', 'creation context detector present');
mustContain('src/core/app.js', 'function addHomeworkAssignmentForTemplate', 'template homework helper present');
mustContain('src/core/app.js', 'function addCalendarBlockForTemplate', 'template calendar helper present');
mustContain('src/core/app.js', 'function addReviewDeckForTemplate', 'template review deck helper present');
mustContain('src/core/app.js', 'function fillTemplateContentTokens', 'template content token filler present');
mustContain('src/core/app.js', 'function readNewPageContextFields', 'context fields reader present');
mustContain('src/core/app.js', 'function renderTemplatePickerCards', 'template picker card renderer present');
mustContain('src/core/app.js', 'function setNewPageTemplateSelection', 'template picker selection setter present');
mustContain('src/core/app.js', 'function populateContextClassPicker', 'class picker populator present');
mustContain('src/core/app.js', 'TEMPLATE_CONNECTION_LABELS', 'template connection label map present');
mustContain('src/core/app.js', "templateType: template.id", 'page metadata records templateType');
mustContain('src/core/app.js', "linkedHomeworkTaskIds:", 'page metadata records linkedHomeworkTaskIds');
mustContain('src/core/app.js', "linkedReviewItemIds:", 'page metadata records linkedReviewItemIds');
mustContain('src/core/app.js', "linkedReviewDeckId:", 'page metadata records linkedReviewDeckId');
mustContain('src/core/app.js', "linkedCalendarBlockIds:", 'page metadata records linkedCalendarBlockIds');
mustContain('src/core/app.js', "sourceContext:", 'page metadata records sourceContext');
mustContain('NoteflowAtelier.html', 'id="templatePickerGrid"', 'template picker grid in HTML');
mustContain('NoteflowAtelier.html', 'id="templatePickerSearch"', 'template picker search input in HTML');
mustContain('NoteflowAtelier.html', 'id="newPageContextPanel"', 'new page context panel in HTML');
mustContain('NoteflowAtelier.html', 'id="newPageContextClass"', 'new page class picker in HTML');
mustContain('NoteflowAtelier.html', 'id="newPageDueDate"', 'new page due date input in HTML');
mustContain('NoteflowAtelier.html', 'id="newPageExamDate"', 'new page exam date input in HTML');
mustContain('NoteflowAtelier.html', 'id="newPageDeadline"', 'new page deadline input in HTML');
mustContain('NoteflowAtelier.html', 'id="templatePreviewConnections"', 'connections preview chips in HTML');
mustContain('styles/styles.css', '.template-card-grid', 'template card grid stylesheet');
mustContain('styles/styles.css', '.template-card.selected', 'selected card style');
mustContain('styles/styles.css', '.new-page-context-panel', 'context panel style');

// ----------------------------------------------------------------------
// Flow Assistant — contextual workspace assistant layer.
// ----------------------------------------------------------------------
mustContain('NoteflowAtelier.html', 'src/features/flow-assistant.js', 'Flow Assistant script included');
mustContain('NoteflowAtelier.html', 'id="chatbotBtn"', 'Flow Assistant mascot button present');
mustContain('NoteflowAtelier.html', 'id="chatbotPanel"', 'Flow Assistant panel present');
mustContain('NoteflowAtelier.html', 'data-pref-path="assistant.contextDepth"', 'Assistant context depth setting in HTML');
mustContain('NoteflowAtelier.html', 'data-pref-path="assistant.showActionPreviews"', 'Assistant show-action-previews setting in HTML');
mustContain('NoteflowAtelier.html', 'data-pref-path="assistant.requireConfirmation"', 'Assistant require-confirmation setting in HTML');

mustContain('src/features/flow-assistant.js', 'function getFlowAssistantContext', 'Flow context gatherer');
mustContain('src/features/flow-assistant.js', 'function buildSystemPrompt', 'Flow system prompt builder');
mustContain('src/features/flow-assistant.js', 'function parseActions', 'Flow action parser');
mustContain('src/features/flow-assistant.js', 'function applyAction', 'Flow action dispatcher');
mustContain('src/features/flow-assistant.js', 'function renderActionCards', 'Flow action-card renderer');
mustContain('src/features/flow-assistant.js', 'function injectViewFlowRows', 'Flow per-view Ask-Flow row injector');
mustContain('src/features/flow-assistant.js', "'flow-context/1'", 'Flow context schema marker');
mustContain('src/features/flow-assistant.js', 'flow-actions', 'Flow action fence token');
mustContain('src/features/flow-assistant.js', 'window.flowAssistant', 'Flow Assistant exposed on window');

mustContain('src/core/app.js', 'window.flowAtelier', 'Flow Assistant bridge exposed from app.js');
mustContain('src/core/app.js', 'buildRequestEnrichment', 'sendChat calls Flow request enrichment');
mustContain('src/core/app.js', "contextDepth: normalizeSettingChoice", 'assistant.contextDepth normalized in settings');
mustContain('src/core/app.js', "contextDepth: 'currentView'", 'assistant.contextDepth default registered');

mustContain('src/features/review.js', 'window.createReviewDeck', 'review.js exposes createReviewDeck for Flow actions');
mustContain('src/features/review.js', 'window.bulkImportReviewCards', 'review.js exposes bulkImportReviewCards for Flow actions');

mustContain('src/core/app.js', "'flow-ask'", 'Flow command palette entry: Ask Flow');
mustContain('src/core/app.js', "'flow-plan-day'", 'Flow command palette entry: Plan my day');
mustContain('src/core/app.js', "'flow-cards-from-note'", 'Flow command palette entry: Create review cards from note');
mustContain('src/core/app.js', "'flow-schedule-tasks'", 'Flow command palette entry: Schedule tasks');
mustContain('src/core/app.js', "'flow-import-assignments'", 'Flow command palette entry: Import assignments from pasted text');

// Confirm secret-key exclusion: chat provider API keys live in sessionStorage and
// must NOT be included in the .atelier raw-localStorage allowlist.
mustContainAny('src/core/app.js', ['Intentionally NOT exported', 'sessionStorage entries'],
    '.atelier export comment documents why chat API keys are excluded');

// Syntax check already covers all .js files via check:syntax.

if (failures.length) {
    console.error('SMOKE CHECK FAILED:');
    failures.forEach(f => console.error(' - ' + f));
    process.exit(1);
}

console.log('Smoke check passed (all assertions).');
