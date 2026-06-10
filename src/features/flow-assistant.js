// Sutra Assistant (legacy internal name: Flow) — contextual workspace layer for Sutra.
//
// Adds three things on top of the existing inline chat code in app.js:
//   1. getFlowAssistantContext({depth, selection}) — gathers bounded
//      privacy-aware context from the active Atelier workspace (active view,
//      current note, selection, today's tasks, deadlines, homework, timeline,
//      review-due, college, etc.).
//   2. A system prompt that explains Atelier's model, lists supported app
//      actions, and asks the model to return structured action proposals
//      in a fenced ```flow-actions block when it wants the user to confirm
//      a local change.
//   3. An action layer that parses proposals, renders review cards inside
//      the chat panel, validates required fields, and applies approved
//      actions through existing Atelier data paths (tasks, homework,
//      timeline blocks, pages, review decks, navigation). Every applied
//      action calls the same autosave/persist functions the user would.
//
// This module is intentionally a small, side-effect-free IIFE that exposes
// a single window.flowAssistant object. The existing chat plumbing in
// app.js calls into it through optional chaining so the app keeps working
// even if this file fails to load.
(function () {
    'use strict';

    const VERSION = '1.0.0';

    // Safe homework write: assistant-created courses/tasks are user data, so a
    // storage failure must not throw out of an action. Route through the shared
    // wrapper (durable warning + in-memory preservation) when available.
    function safeHwWrite(key, jsonString) {
        if (window.SutraSafeStorage && typeof window.SutraSafeStorage.set === 'function') {
            return window.SutraSafeStorage.set(key, jsonString, { importance: 'important', label: 'Your homework' });
        }
        try { localStorage.setItem(key, jsonString); return { ok: true }; }
        catch (error) { return { ok: false, error }; }
    }

    // --------------------------------------------------------------
    // Small helpers
    // --------------------------------------------------------------
    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getPref(path, fallback) {
        try {
            if (typeof window.getWorkspacePreference === 'function') {
                return window.getWorkspacePreference(path, fallback);
            }
        } catch (e) { /* ignore */ }
        return fallback;
    }

    function safeCall(fn, ...args) {
        try { if (typeof fn === 'function') return fn(...args); } catch (e) { console.warn('Sutra Assistant safeCall failed:', e); }
        return undefined;
    }

    function truncate(str, max) {
        const s = String(str || '');
        if (s.length <= max) return s;
        return s.slice(0, max - 1).trimEnd() + '…';
    }

    function toISODate(value) {
        try {
            if (!value) return '';
            const d = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(d.getTime())) return '';
            return d.toISOString().slice(0, 10);
        } catch (e) { return ''; }
    }

    function makeId(prefix) {
        try {
            if (typeof window.generateId === 'function') return `${prefix}_${window.generateId()}`;
        } catch (e) { /* ignore */ }
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // Homework lives in localStorage (hwTasks:v2); homework.js reloads + re-renders
    // when it hears this event. Use it instead of a (non-existent) global render fn
    // so Flow-created/undone homework shows up live in the Homework view.
    function notifyHomeworkChanged() {
        try { window.dispatchEvent(new CustomEvent('homework:updated')); } catch (e) { /* ignore */ }
    }

    function showToast(message) {
        try {
            if (typeof window.showToast === 'function') window.showToast(message);
        } catch (e) { /* ignore */ }
    }

    function bridge() {
        return (typeof window !== 'undefined' && window.flowAtelier) ? window.flowAtelier : null;
    }

    function getActiveViewName() {
        try {
            const b = bridge();
            if (b && typeof b.activeView === 'string' && b.activeView) return b.activeView;
        } catch (e) { /* ignore */ }
        try {
            if (typeof window.activeView === 'string') return window.activeView;
        } catch (e) { /* ignore */ }
        try {
            const active = document.querySelector('.view.active');
            if (active && active.id && active.id.startsWith('view-')) return active.id.slice(5);
        } catch (e) { /* ignore */ }
        return 'today';
    }

    // --------------------------------------------------------------
    // Context capture
    // --------------------------------------------------------------
    const CONTEXT_DEPTHS = ['minimal', 'currentView', 'workspace'];
    const CHAT_MEMORY_DEPTH_OPTIONS = Object.freeze([3, 5, 10, 15, 25]);

    function normalizeDepth(depth) {
        const wanted = String(depth || getPref('assistant.contextDepth', 'currentView') || 'currentView').trim();
        return CONTEXT_DEPTHS.includes(wanted) ? wanted : 'currentView';
    }

    function normalizeChatMemoryMode(value) {
        const wanted = String(value || getPref('assistant.chatMemoryMode', 'stateless') || 'stateless').trim().toLowerCase();
        return wanted === 'stateful' ? 'stateful' : 'stateless';
    }

    function normalizeChatMemoryDepth(value, fallbackValue = 10) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallbackValue;
        const rounded = Math.round(numeric);
        if (rounded <= 0) return fallbackValue;
        return CHAT_MEMORY_DEPTH_OPTIONS.reduce((best, candidate) => {
            const bestDistance = Math.abs(best - rounded);
            const candidateDistance = Math.abs(candidate - rounded);
            if (candidateDistance < bestDistance) return candidate;
            if (candidateDistance === bestDistance && candidate > best) return candidate;
            return best;
        }, CHAT_MEMORY_DEPTH_OPTIONS[0]);
    }

    function getChatMemoryMode() {
        return normalizeChatMemoryMode(getPref('assistant.chatMemoryMode', 'stateless'));
    }

    function getChatMemoryDepth() {
        return normalizeChatMemoryDepth(getPref('assistant.chatMemoryDepth', 10), 10);
    }

    function buildConversationMessages(conversation, options = {}) {
        const mode = normalizeChatMemoryMode(options.chatMemoryMode != null ? options.chatMemoryMode : getChatMemoryMode());
        if (mode !== 'stateful') return [];
        const depth = normalizeChatMemoryDepth(options.chatMemoryDepth != null ? options.chatMemoryDepth : getChatMemoryDepth(), 10);
        const source = Array.isArray(conversation) ? conversation : [];
        return source.slice(-depth).map(entry => {
            const role = String(entry && entry.role || '').toLowerCase() === 'assistant' ? 'assistant' : 'user';
            return {
                role,
                content: String(entry && entry.content || '').trim()
            };
        }).filter(entry => entry.content);
    }

    function buildRequestMessages(userText, conversation, options = {}) {
        const messages = buildConversationMessages(conversation, options);
        const content = String(userText || '').trim();
        if (content) messages.push({ role: 'user', content });
        return messages;
    }

    function getEditorSelection() {
        try {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return '';
            const range = sel.getRangeAt(0);
            const editor = document.getElementById('editor');
            if (!editor) return '';
            let node = range.commonAncestorContainer;
            while (node && node !== editor) node = node.parentNode;
            if (node !== editor) return '';
            return String(sel.toString() || '').trim();
        } catch (e) { return ''; }
    }

    function getActiveNoteSummary() {
        try {
            const b = bridge();
            const pageId = b ? b.currentPageId : (typeof window.currentPageId !== 'undefined' ? window.currentPageId : null);
            const pages = b ? (Array.isArray(b.pages) ? b.pages : []) : (Array.isArray(window.pages) ? window.pages : []);
            if (!pageId) return null;
            const page = pages.find(p => p && p.id === pageId);
            if (!page) return null;
            const unlocked = b ? b.unlockedPageIds : window.unlockedPageIds;
            if (page.isLocked && !(unlocked && unlocked.has && unlocked.has(pageId))) {
                return { id: page.id, title: page.title || 'Untitled', locked: true };
            }
            if (String(page.type || '').toLowerCase() === 'canvas') {
                return {
                    id: page.id,
                    title: page.title || 'Untitled Canvas',
                    type: 'canvas',
                    objectCount: page.canvas && Array.isArray(page.canvas.objects) ? page.canvas.objects.length : 0
                };
            }
            const tmp = document.createElement('div');
            tmp.innerHTML = String(page.content || page.body || '');
            const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
            return {
                id: page.id,
                title: page.title || 'Untitled',
                tags: Array.isArray(page.tags) ? page.tags.map(t => t.name || t).filter(Boolean) : [],
                excerpt: truncate(text, 800),
                wordCount: text ? text.split(/\s+/).length : 0,
                classLinkId: page.classLinkId || '',
                apSubjectId: page.apSubjectId || '',
                templateType: page.templateType || '',
                dueDate: page.dueDate || '',
                examDate: page.examDate || ''
            };
        } catch (e) { return null; }
    }

    function getCanvasContextSummary() {
        try {
            const api = (window.SutraCanvas && typeof window.SutraCanvas.getContext === 'function') ? window.SutraCanvas : null;
            if (api) return api.getContext();
            const note = getActiveNoteSummary();
            return note && note.type === 'canvas' ? note : null;
        } catch (e) { return null; }
    }

    function summarizeTasksFor(scope) {
        try {
            const b = bridge();
            const tasks = b ? (Array.isArray(b.tasks) ? b.tasks : []) : (Array.isArray(window.tasks) ? window.tasks : []);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const horizon = new Date(today); horizon.setDate(horizon.getDate() + 7);
            const ranked = tasks
                .filter(t => t && !t.completed)
                .map(t => {
                    const due = t.dueDate ? new Date(`${t.dueDate}T00:00:00`) : null;
                    const overdue = due ? due < today : false;
                    const soon = due ? (due >= today && due <= horizon) : false;
                    return { t, due, overdue, soon };
                })
                .filter(r => scope === 'all' || r.overdue || r.soon || r.t.priority === 'high')
                .sort((a, b) => (a.due ? a.due.getTime() : Infinity) - (b.due ? b.due.getTime() : Infinity))
                .slice(0, scope === 'all' ? 25 : 10)
                .map(r => ({
                    title: r.t.title,
                    dueDate: r.t.dueDate || '',
                    dueTime: r.t.dueTime || '',
                    priority: r.t.priority || '',
                    category: r.t.category || '',
                    state: r.overdue ? 'overdue' : (r.soon ? 'soon' : 'open')
                }));
            return ranked;
        } catch (e) { return []; }
    }

    function summarizeTimeline(daysAhead) {
        try {
            const b = bridge();
            const blocks = b ? (Array.isArray(b.timeBlocks) ? b.timeBlocks : []) : (Array.isArray(window.timeBlocks) ? window.timeBlocks : []);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const end = new Date(today); end.setDate(end.getDate() + Math.max(1, daysAhead || 2));
            return blocks
                .map(b => ({ b, d: b.date ? new Date(`${b.date}T00:00:00`) : null }))
                .filter(x => x.d && x.d >= today && x.d <= end)
                .sort((a, b) => a.d - b.d || String(a.b.start).localeCompare(String(b.b.start)))
                .slice(0, 25)
                .map(x => ({ date: x.b.date, start: x.b.start, end: x.b.end, name: truncate(x.b.name, 80), category: x.b.category || '' }));
        } catch (e) { return []; }
    }

    function summarizeHomework() {
        try {
            const raw = JSON.parse(localStorage.getItem('hwTasks:v2') || '[]');
            const courses = JSON.parse(localStorage.getItem('hwCourses:v2') || '[]');
            const courseName = (id) => {
                const c = (Array.isArray(courses) ? courses : []).find(c => String(c.id) === String(id));
                return c ? c.name : '';
            };
            return (Array.isArray(raw) ? raw : [])
                .filter(t => t && !t.done)
                .sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')))
                .slice(0, 15)
                .map(t => ({
                    title: t.title || t.text || 'Assignment',
                    course: courseName(t.courseId),
                    dueDate: t.dueDate || '',
                    priority: t.priority || '',
                    difficulty: t.difficulty || ''
                }));
        } catch (e) { return []; }
    }

    function summarizeReviewDue() {
        try {
            const stats = (typeof window.getReviewTodayStats === 'function') ? window.getReviewTodayStats() : null;
            if (!stats) return null;
            return { dueToday: stats.due || 0, newToday: stats.newToday || 0, totalDecks: stats.totalDecks || 0 };
        } catch (e) { return null; }
    }

    function summarizeDeadlines() {
        try {
            const b = bridge();
            const all = b ? b.collectWorkspaceDeadlines() : ((typeof window.collectWorkspaceDeadlines === 'function') ? window.collectWorkspaceDeadlines() : []);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            return (Array.isArray(all) ? all : [])
                .filter(d => d && d.due)
                .sort((a, b) => new Date(a.due) - new Date(b.due))
                .slice(0, 12)
                .map(d => ({
                    title: truncate(d.title, 80),
                    source: d.source || '',
                    dueDate: toISODate(d.due),
                    subtitle: truncate(d.subtitle || '', 60)
                }));
        } catch (e) { return []; }
    }

    function summarizeCollege() {
        try {
            const b = bridge();
            const cw = b ? b.collegeAppWorkspace : (window.collegeAppWorkspace || null);
            if (!cw) return null;
            const out = {};
            if (Array.isArray(cw.colleges)) out.colleges = cw.colleges.length;
            if (Array.isArray(cw.essays)) {
                out.essays = cw.essays.slice(0, 8).map(e => ({ prompt: truncate(e.prompt || e.title || '', 80), status: e.status || '' }));
            }
            if (Array.isArray(cw.scholarships)) {
                out.scholarships = cw.scholarships.slice(0, 6).map(s => ({ name: truncate(s.name || '', 60), dueDate: s.dueDate || '' }));
            }
            return out;
        } catch (e) { return null; }
    }

    // Course Hub context. File NAMES/metadata only — never file contents
    // (full contents require explicit user selection per privacy rule).
    function summarizeCourses() {
        try {
            const hub = window.courseHub;
            if (!hub) return null;
            const courses = hub.getCourses({ filter: 'active' }) || [];
            if (!courses.length) return null;
            const activeId = (window.appData && window.appData.courseWorkspace && window.appData.courseWorkspace.settings && window.appData.courseWorkspace.settings.activeCourseId) || null;
            const detail = (c) => {
                const stats = hub.getCourseWorkloadStats(c.id);
                const assignments = (hub.getAssignmentsForCourse(c.id) || []).filter(a => !a.done).slice(0, 5)
                    .map(a => ({ title: truncate(a.title, 80), dueDate: a.dueDate || '', type: a.type }));
                const files = (hub.getFilesForCourse(c.id) || []).slice(0, 8).map(f => ({ name: truncate(f.name, 80), kind: f.kind }));
                const notes = (hub.getLinkedNotesForCourse(c.id) || []).slice(0, 6).map(n => ({ title: truncate(n.title || 'Untitled', 80) }));
                return {
                    id: c.id, name: c.name, teacher: c.teacherName || '', room: c.room || '', type: c.type,
                    schedule: hub.getCourseDisplayName ? undefined : undefined,
                    currentGrade: c.currentGrade || '', targetGrade: c.targetGrade || '',
                    open: stats.open, overdue: stats.overdue, files: stats.files, notes: stats.notes,
                    upcomingAssignments: assignments, fileNames: files, linkedNotes: notes
                };
            };
            const active = activeId ? courses.find(c => String(c.id) === String(activeId)) : null;
            return {
                courseCount: courses.length,
                activeCourse: active ? detail(active) : (courses[0] ? detail(courses[0]) : null),
                courses: courses.slice(0, 8).map(c => ({ name: c.name, teacher: c.teacherName || '', open: hub.getCourseWorkloadStats(c.id).open }))
            };
        } catch (e) { return null; }
    }

    function summarizeAllDue() {
        try {
            const hub = window.courseHub;
            if (!hub) return null;
            const items = hub.getAllDueItems({}) || [];
            const groups = hub.groupDueItemsByRange(items);
            const majors = (hub.getUpcomingMajorDeadlines({}) || []).slice(0, 6)
                .map(m => ({ title: truncate(m.title, 80), course: m.courseName || '', due: m.dueDate || '', urgency: m.urgency }));
            const top = items.filter(i => !i.completed).slice(0, 8)
                .map(i => ({ title: truncate(i.title, 80), course: i.courseName || '', due: i.dueDate || '', type: i.type, urgency: i.urgency }));
            return {
                overdue: groups.overdue.length,
                dueToday: groups.today.length,
                dueThisWeek: groups.today.length + groups.tomorrow.length + groups.thisWeek.length,
                examsThisWeek: [...groups.today, ...groups.tomorrow, ...groups.thisWeek].filter(i => i.type === 'Exam').length,
                openAssignments: items.filter(i => !i.completed).length,
                topUrgent: top,
                majorDeadlines: majors
            };
        } catch (e) { return null; }
    }

    function summarizeApStudy() {
        try {
            const b = bridge();
            const aps = b ? b.apStudyWorkspace : (window.apStudyWorkspace || null);
            if (!aps || !Array.isArray(aps.subjects) || aps.subjects.length === 0) return null;
            return {
                subjects: aps.subjects.slice(0, 6).map(s => ({
                    name: s.name || '',
                    examDate: s.examDate || '',
                    confidence: s.confidence || ''
                }))
            };
        } catch (e) { return null; }
    }

    function summarizeCram() {
        try {
            const b = bridge();
            const sessions = b ? (Array.isArray(b.cramSessions) ? b.cramSessions : []) : (Array.isArray(window.cramSessions) ? window.cramSessions : []);
            if (sessions.length === 0) return null;
            return sessions.slice(-3).map(s => ({ topic: truncate(s.topic || s.name || 'Cram', 60), days: s.daysLeft || s.duration || '' }));
        } catch (e) { return null; }
    }

    function getFlowAssistantContext(opts) {
        const options = opts || {};
        const depth = normalizeDepth(options.depth);
        const view = String(options.view || getActiveViewName());
        // Respect the "include selection by default" preference unless the caller
        // explicitly overrides via options.includeSelection.
        const includeSelectionPref = getPref('assistant.includeSelectionByDefault', true) !== false;
        const allowSelection = options.includeSelection != null ? options.includeSelection !== false : includeSelectionPref;
        const selection = allowSelection ? getEditorSelection() : '';

        const ctx = {
            schema: 'flow-context/1',
            view,
            depth,
            now: new Date().toISOString(),
            timeOfDay: new Date().getHours()
        };

        if (depth === 'minimal') {
            ctx.summary = `User is on the ${view} view in Sutra.`;
            if (selection) ctx.selection = truncate(selection, 1200);
            return ctx;
        }

        // Derived "student intelligence" — the model sees risk signals computed
        // locally before the call, so it can reason about overload, overdue work,
        // unscheduled priorities, review debt, etc.
        try {
            const i = intel();
            if (i) {
                const derived = i.deriveStudentContext();
                ctx.derived = {
                    summary: derived.summary,
                    overdueCount: derived.overdueCount,
                    dueSoonCount: derived.dueSoonCount,
                    overloadedDays: derived.overloadedDays,
                    highRiskAssignments: derived.highRiskAssignments,
                    unscheduledHighPriority: derived.unscheduledHighPriority,
                    lowConfidenceApSubjects: derived.lowConfidenceApSubjects,
                    missingExamBlocks: derived.missingExamBlocks,
                    reviewDebt: derived.reviewDebt,
                    conflictingBlocks: derived.conflictingBlocks,
                    nextBestAction: derived.nextBestAction
                };
            }
        } catch (e) { /* intelligence is optional */ }

        // currentView and workspace both include the current note when in Notes.
        if (view === 'notes') {
            ctx.activeNote = getActiveNoteSummary();
            const canvasContext = getCanvasContextSummary();
            if (canvasContext) ctx.canvas = canvasContext;
            if (selection) ctx.selection = truncate(selection, 1500);
        }

        if (depth === 'currentView') {
            if (view === 'today') {
                ctx.tasks = summarizeTasksFor('focus');
                ctx.timelineToday = summarizeTimeline(1);
            } else if (view === 'timeline') {
                ctx.timeline = summarizeTimeline(7);
                ctx.tasks = summarizeTasksFor('focus');
            } else if (view === 'homework') {
                ctx.homework = summarizeHomework();
            } else if (view === 'review' || view === 'cramhub') {
                ctx.review = summarizeReviewDue();
                if (view === 'cramhub') ctx.cram = summarizeCram();
            } else if (view === 'apstudy') {
                ctx.apStudy = summarizeApStudy();
                ctx.deadlines = summarizeDeadlines().filter(d => d.source === 'apexam');
            } else if (view === 'collegeapp') {
                ctx.college = summarizeCollege();
            } else if (view === 'courses') {
                ctx.courses = summarizeCourses();
            } else if (view === 'alldue') {
                ctx.allDue = summarizeAllDue();
            }
            return ctx;
        }

        // depth === 'workspace': full picture (bounded)
        ctx.tasks = summarizeTasksFor('focus');
        ctx.homework = summarizeHomework();
        ctx.timelineUpcoming = summarizeTimeline(7);
        ctx.deadlines = summarizeDeadlines();
        const review = summarizeReviewDue(); if (review) ctx.review = review;
        const aps = summarizeApStudy(); if (aps) ctx.apStudy = aps;
        const college = summarizeCollege(); if (college) ctx.college = college;
        const cram = summarizeCram(); if (cram) ctx.cram = cram;
        const courses = summarizeCourses(); if (courses) ctx.courses = courses;
        const allDue = summarizeAllDue(); if (allDue) ctx.allDue = allDue;
        return ctx;
    }

    // --------------------------------------------------------------
    // System prompt builder
    // --------------------------------------------------------------
    // risk: 'low' | 'medium' | 'high'. Low actions may auto-apply when the
    // user's confirmation mode allows it; high actions ALWAYS require explicit
    // confirmation and can never auto-apply.
    const ACTION_CATALOG = [
        // --- Atomic actions ---
        { type: 'insert_text', desc: 'Insert markdown text into the current note at the caret', risk: 'medium', fields: { text: 'string' } },
        { type: 'replace_selection', desc: 'Replace the user\'s currently selected text in the editor', risk: 'high', fields: { text: 'string' } },
        { type: 'create_task', desc: 'Create a task in the planner', risk: 'medium', fields: { title: 'string', dueDate: 'YYYY-MM-DD?', dueTime: 'HH:MM?', priority: 'low|medium|high?', notes: 'string?', category: 'string?', linkPageId: 'string?' } },
        { type: 'create_homework', desc: 'Create a homework assignment', risk: 'medium', fields: { title: 'string', courseName: 'string?', dueDate: 'YYYY-MM-DD?', difficulty: 'easy|medium|hard?' } },
        { type: 'create_timeline_block', desc: 'Schedule a calendar/timeline block', risk: 'medium', fields: { name: 'string', date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', category: 'string?', linkTaskId: 'string?', linkHomeworkId: 'string?' } },
        { type: 'create_page', desc: 'Create a new note page', risk: 'medium', fields: { title: 'string', body: 'markdown', tags: 'string[]?', classLinkId: 'string?' } },
        { type: 'canvas_add_sticky', desc: 'Add a sticky note to the current Canvas page', risk: 'high', fields: { text: 'string', color: 'string?' } },
        { type: 'canvas_add_text', desc: 'Add a text card to the current Canvas page', risk: 'high', fields: { text: 'string' } },
        { type: 'canvas_create_task_from_selection', desc: 'Create a Sutra task from the current Canvas selection', risk: 'high', fields: {} },
        { type: 'canvas_create_note_from_selection', desc: 'Create a Sutra note from selected Canvas text or grouped cards', risk: 'high', fields: { title: 'string?' } },
        { type: 'canvas_group_selection', desc: 'Organize selected Canvas objects into a labeled group', risk: 'high', fields: { label: 'string?' } },
        { type: 'create_review_deck', desc: 'Create a review deck (optionally with cards)', risk: 'medium', fields: { name: 'string', description: 'string?', cards: '[{front,back}]?', linkPageId: 'string?' } },
        { type: 'add_review_cards', desc: 'Add cards to an existing review deck', risk: 'medium', fields: { deckId: 'string', cards: '[{front,back}]' } },
        { type: 'create_cram_session', desc: 'Add a cram session entry', risk: 'medium', fields: { topic: 'string', days: 'number?' } },
        { type: 'create_college_task', desc: 'Add a college-related task (essay, deadline, scholarship)', risk: 'medium', fields: { title: 'string', dueDate: 'YYYY-MM-DD?', kind: 'essay|deadline|scholarship?' } },
        { type: 'navigate', desc: 'Switch the active view', risk: 'low', fields: { view: 'today|notes|homework|courses|alldue|timeline|review|cramhub|collegeapp|apstudy|life|business|settings' } },
        // --- Course Hub actions ---
        { type: 'create_course', desc: 'Create a course in the Course Hub (also bridges to Homework)', risk: 'high', fields: { name: 'string', type: 'class|ap|activity|self_study|other?', teacherName: 'string?', room: 'string?', subjectArea: 'string?', meetingDays: 'string?', startTime: 'HH:MM?' } },
        { type: 'create_assignment_for_course', desc: 'Create an assignment attached to a specific course', risk: 'high', fields: { courseId: 'string?', courseName: 'string?', title: 'string', dueDate: 'YYYY-MM-DD?', dueTime: 'HH:MM?', priority: 'low|medium|high?', difficulty: 'easy|medium|hard?', notes: 'string?' } },
        { type: 'add_resource_link_to_course', desc: 'Add an external resource link to a course', risk: 'medium', fields: { courseId: 'string?', courseName: 'string?', title: 'string', url: 'string?' } },
        { type: 'link_note_to_course', desc: 'Link an existing note/page to a course', risk: 'medium', fields: { courseId: 'string?', courseName: 'string?', noteId: 'string' } },
        { type: 'archive_course', desc: 'Archive (or unarchive) a course', risk: 'high', fields: { courseId: 'string?', courseName: 'string?', archived: 'boolean?' } },
        { type: 'navigate_to_course', desc: 'Open the Course Hub focused on a specific course', risk: 'low', fields: { courseId: 'string?', courseName: 'string?' } },
        { type: 'navigate_to_all_due', desc: 'Open the All Due command center', risk: 'low', fields: {} },
        // --- Higher-level workflows (each reviews as a coherent unit) ---
        { type: 'import_assignments', desc: 'Import a batch of parsed assignments into a review table (homework/tasks/timeline)', risk: 'high', fields: { assignments: '[{title,course,dueDate,dueTime,type,priority,difficulty,sourceText,confidence}]' } },
        { type: 'create_study_plan', desc: 'A linked study plan: a plan note + timeline study blocks (+ optional review deck)', risk: 'high', fields: { title: 'string', note: 'markdown?', blocks: '[{name,date,start,end}]', deck: '{name,cards}?' } },
        { type: 'create_exam_plan', desc: 'A linked exam plan: plan note + study blocks + review deck, linked to an AP subject if given', risk: 'high', fields: { title: 'string', examDate: 'YYYY-MM-DD?', apSubjectId: 'string?', note: 'markdown?', blocks: '[{name,date,start,end}]', deck: '{name,cards}?' } },
        { type: 'create_assignment_plan', desc: 'A linked assignment plan: homework item + task breakdown + timeline blocks + outline note', risk: 'high', fields: { title: 'string', courseName: 'string?', dueDate: 'YYYY-MM-DD?', steps: 'string[]', blocks: '[{name,date,start,end}]?', note: 'markdown?' } },
        { type: 'plan_week', desc: 'Propose timeline blocks across the coming week from open work', risk: 'high', fields: { blocks: '[{name,date,start,end,category}]' } },
        { type: 'plan_day', desc: 'Propose timeline blocks for a single day', risk: 'high', fields: { date: 'YYYY-MM-DD?', blocks: '[{name,start,end,category}]' } },
        { type: 'triage_deadlines', desc: 'Schedule blocks and/or create tasks to recover overdue or due-soon work', risk: 'high', fields: { blocks: '[{name,date,start,end}]?', tasks: '[{title,dueDate,priority}]?' } },
        { type: 'convert_note_to_study_system', desc: 'Turn the current note into a review deck (+ optional study blocks)', risk: 'high', fields: { deck: '{name,cards}', blocks: '[{name,date,start,end}]?' } },
        { type: 'link_workspace_objects', desc: 'Link existing objects together (page↔task/homework/deck/block)', risk: 'low', fields: { pageId: 'string', taskIds: 'string[]?', homeworkIds: 'string[]?', deckId: 'string?', blockIds: 'string[]?' } },
        { type: 'open_source_object', desc: 'Open an existing object (note/class/deadline source)', risk: 'low', fields: { kind: 'page|class|deadline', id: 'string' } },
        { type: 'start_focus_session', desc: 'Start a focus/pomodoro session', risk: 'low', fields: { title: 'string?', minutes: 'number?', taskId: 'string?' } },
        { type: 'schedule_existing_item', desc: 'Schedule an existing task/homework/deadline onto the timeline', risk: 'medium', fields: { title: 'string', dueDate: 'YYYY-MM-DD?', dueTime: 'HH:MM?', category: 'string?' } },
        { type: 'open_class_dashboard', desc: 'Open the class dashboard for a course', risk: 'low', fields: { courseId: 'string?', courseName: 'string?' } },
        { type: 'run_deadline_radar', desc: 'Open the Deadline Radar', risk: 'low', fields: {} },
        { type: 'run_weekly_review', desc: 'Create a Weekly Review note', risk: 'medium', fields: {} },
        { type: 'create_quick_capture_item', desc: 'Open Quick Capture prefilled with text', risk: 'low', fields: { text: 'string' } },
        { type: 'change_context_depth', desc: 'Change how much workspace context Sutra sends', risk: 'low', fields: { depth: 'minimal|currentView|workspace' } }
    ];

    function classifyRisk(action) {
        const known = ACTION_CATALOG.find(a => a.type === (action && action.type));
        return (known && known.risk) || 'medium';
    }

    function buildSystemPrompt(context) {
        const catalog = ACTION_CATALOG
            .map(a => `- ${a.type}: ${a.desc} — fields: ${JSON.stringify(a.fields)}`)
            .join('\n');
        const contextJson = (() => { try { return JSON.stringify(context, null, 2); } catch (e) { return '{}'; } })();
        return [
            'You are Sutra Assistant, the contextual assistant inside Sutra — a local-first student / creator operating system.',
            'The app has views: today, notes, homework, timeline, review, cramhub, apstudy, collegeapp, life, business, settings.',
            'All data stays on the user\'s device. No backend.',
            '',
            'You can propose local app actions. When you want the user to change app state, append a single fenced block at the end of your reply:',
            '```flow-actions',
            '[ { "type": "create_task", "title": "Draft outline", "dueDate": "2026-05-26", "priority": "high" } ]',
            '```',
            'Rules for action proposals:',
            '- Use only the action types in the catalog below.',
            '- One JSON array per block. Include a "label" field on each action that is a short human-readable description.',
            '- Never put more than ~8 actions in one reply.',
            '- The user must confirm each action; do not assume anything is applied.',
            '- If the user just asked a question, do NOT propose actions. Only propose when the action is clearly useful.',
            '- If context.canvas is present, it is a bounded summary of the active Canvas page. Use Canvas actions only for that active Canvas, and expect explicit user confirmation.',
            '- For dates, prefer ISO YYYY-MM-DD. Times are HH:MM 24h.',
            '- Prefer the higher-level workflow actions when the user wants a plan: import_assignments (one action with an "assignments" array), create_study_plan / create_exam_plan / create_assignment_plan (these produce LINKED objects), plan_day / plan_week / triage_deadlines. Use a single workflow action instead of many atomic ones when it captures the intent.',
            '- When parsing pasted assignment text or a screenshot, return ONE import_assignments action whose "assignments" array has objects with: title, course, dueDate (YYYY-MM-DD), dueTime, type, priority, difficulty, sourceText, confidence (0-1).',
            '- The "derived" object in the context already contains locally-computed risk signals (overdue, overloaded days, review debt, low-confidence AP subjects, unscheduled priorities, nextBestAction). Use it; do not recompute it.',
            '',
            'Action catalog:',
            catalog,
            '',
            'When you write prose, prefer short markdown bullets over long paragraphs.',
            'When the user asks about "this note" or "this view", use the context block below.',
            '',
            'Current context (do not echo to the user, just use it):',
            '```json',
            contextJson,
            '```'
        ].join('\n');
    }

    // --------------------------------------------------------------
    // Response parsing — tolerant of multiple shapes the model may emit:
    //   1. ```flow-actions\n[...]\n```        (canonical, requested by prompt)
    //   2. ```json\n[...]\n```                (model picked a generic json fence)
    //   3. ```\n[...]\n```                    (model used a plain fence)
    //   4. Bare top-level JSON array of action-shaped objects in the text
    // For (4) we only accept arrays whose objects all carry a known `type`
    // from the action catalog — that's our discriminator against the model
    // returning unrelated JSON examples in prose.
    // --------------------------------------------------------------
    function looksLikeActionArray(parsed) {
        if (!Array.isArray(parsed) || parsed.length === 0) return false;
        const knownTypes = new Set(ACTION_CATALOG.map(a => a.type));
        return parsed.every(a => a && typeof a === 'object' && typeof a.type === 'string' && knownTypes.has(a.type));
    }

    function tryParse(raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function pushIfActions(out, parsed) {
        if (!parsed) return false;
        const list = Array.isArray(parsed) ? parsed : [parsed];
        if (!looksLikeActionArray(list)) return false;
        list.forEach(a => out.push(a));
        return true;
    }

    function parseActions(replyText) {
        const src = String(replyText || '');
        const actions = [];
        let cleanText = src;

        // (1) flow-actions fence
        const flowFenceRe = /```flow-actions\s*\n?([\s\S]*?)```/gi;
        let m;
        while ((m = flowFenceRe.exec(src)) !== null) {
            const parsed = tryParse(m[1].trim());
            if (parsed) {
                const list = Array.isArray(parsed) ? parsed : [parsed];
                list.forEach(a => { if (a && typeof a === 'object' && a.type) actions.push(a); });
            }
            cleanText = cleanText.replace(m[0], '').trim();
        }
        if (actions.length) return { actions, cleanText };

        // (2) any code fence — accept only if the contents look like an action array.
        const anyFenceRe = /```(?:[a-zA-Z0-9_-]+)?\s*\n?([\s\S]*?)```/g;
        const fenceMatches = [];
        while ((m = anyFenceRe.exec(src)) !== null) {
            fenceMatches.push({ full: m[0], body: m[1].trim() });
        }
        for (const fm of fenceMatches) {
            const parsed = tryParse(fm.body);
            if (pushIfActions(actions, parsed)) {
                cleanText = cleanText.replace(fm.full, '').trim();
            }
        }
        if (actions.length) return { actions, cleanText };

        // (3) bare top-level JSON array in the text. Find balanced [...] candidates
        // and try parsing each; accept the first that looks like actions.
        const bareCandidates = extractBalancedJsonCandidates(src);
        for (const cand of bareCandidates) {
            const parsed = tryParse(cand.text);
            if (pushIfActions(actions, parsed)) {
                cleanText = cleanText.replace(cand.text, '').trim();
                break; // one match is enough; further bare arrays in prose are unlikely
            }
        }

        return { actions, cleanText };
    }

    // Walk the text and find substrings that look like top-level JSON arrays
    // (balanced brackets, respecting quoted strings and escapes). Returns up
    // to a handful of candidates from longest to shortest so we test the
    // richest one first.
    function extractBalancedJsonCandidates(src) {
        const out = [];
        const len = src.length;
        for (let i = 0; i < len; i += 1) {
            if (src[i] !== '[') continue;
            let depth = 0;
            let inStr = false;
            let escape = false;
            for (let j = i; j < len; j += 1) {
                const c = src[j];
                if (escape) { escape = false; continue; }
                if (c === '\\') { escape = true; continue; }
                if (inStr) {
                    if (c === '"') inStr = false;
                    continue;
                }
                if (c === '"') { inStr = true; continue; }
                if (c === '[') depth += 1;
                else if (c === ']') {
                    depth -= 1;
                    if (depth === 0) {
                        out.push({ start: i, end: j + 1, text: src.slice(i, j + 1) });
                        i = j; // skip past this array; outer for will increment
                        break;
                    }
                }
            }
        }
        // Sort longest first so the most likely action block is tried before noise.
        return out.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    }

    // --------------------------------------------------------------
    // Action field aliasing — models routinely confuse our field names
    // (title vs name vs topic, etc.). Normalize before validating so a
    // perfectly-good proposal isn't rejected over a synonym.
    // --------------------------------------------------------------
    function normalizeActionFields(action) {
        if (!action || typeof action !== 'object') return action;
        const a = { ...action };

        // Pick the first non-empty string from a list of candidate fields.
        const firstNonEmpty = (...keys) => {
            for (const k of keys) {
                const v = a[k];
                if (typeof v === 'string' && v.trim()) return v.trim();
            }
            return '';
        };

        // Universal text aliases — many models confuse title/name/topic and
        // sometimes only fill `label`. Walk the whole synonym set.
        const titleish = () => firstNonEmpty('title', 'name', 'summary', 'heading', 'label');

        if (a.type === 'create_task') {
            if (!a.title) a.title = firstNonEmpty('name', 'task', 'summary', 'label');
            if (!a.notes && a.description) a.notes = a.description;
            if (!a.dueDate && a.due) a.dueDate = a.due;
        }

        if (a.type === 'create_homework') {
            if (!a.title) a.title = firstNonEmpty('name', 'assignment', 'summary', 'label');
            if (!a.courseName) a.courseName = firstNonEmpty('course', 'className', 'class', 'subject');
            if (!a.dueDate && a.due) a.dueDate = a.due;
        }

        if (a.type === 'create_timeline_block') {
            if (!a.name) a.name = firstNonEmpty('title', 'summary', 'eventName', 'blockName', 'event', 'label');
            if (!a.start && a.startTime) a.start = a.startTime;
            if (!a.end && a.endTime) a.end = a.endTime;
            if (!a.date && a.day) a.date = a.day;
            // Some models return start/end as ISO datetimes; trim to HH:MM.
            const trimTime = (v) => {
                if (typeof v !== 'string') return v;
                const m = v.match(/(\d{1,2}):(\d{2})/);
                return m ? `${m[1].padStart(2, '0')}:${m[2]}` : v;
            };
            if (a.start) a.start = trimTime(a.start);
            if (a.end) a.end = trimTime(a.end);
            // If model gave an ISO datetime in `date`, split it.
            if (a.date && a.date.length > 10) {
                const m = a.date.match(/^(\d{4}-\d{2}-\d{2})/);
                if (m) a.date = m[1];
            }
        }

        if (a.type === 'create_page') {
            if (!a.title) a.title = firstNonEmpty('name', 'heading', 'label');
            if (!a.body) a.body = firstNonEmpty('content', 'text', 'markdown');
        }

        if (a.type === 'canvas_add_sticky' || a.type === 'canvas_add_text') {
            if (!a.text) a.text = firstNonEmpty('content', 'body', 'note', 'label');
        }

        if (a.type === 'canvas_create_note_from_selection' && !a.title) {
            a.title = firstNonEmpty('name', 'heading', 'label');
        }

        if (a.type === 'canvas_group_selection' && !a.label) {
            a.label = firstNonEmpty('name', 'title', 'groupName');
        }

        if (a.type === 'create_review_deck') {
            if (!a.name) a.name = firstNonEmpty('title', 'deckName', 'deck', 'topic', 'label');
        }

        if (a.type === 'add_review_cards') {
            if (!a.deckId) a.deckId = firstNonEmpty('deck', 'deckName', 'id');
        }

        if (a.type === 'create_cram_session') {
            if (!a.topic) a.topic = firstNonEmpty('title', 'name', 'subject', 'label');
        }

        if (a.type === 'create_college_task') {
            if (!a.title) a.title = firstNonEmpty('name', 'task', 'label');
            if (!a.dueDate && a.due) a.dueDate = a.due;
        }

        if (a.type === 'navigate') {
            if (!a.view) a.view = firstNonEmpty('target', 'to', 'page', 'destination');
        }

        if (a.type === 'insert_text' || a.type === 'replace_selection') {
            if (!a.text) a.text = firstNonEmpty('content', 'markdown', 'body');
        }

        // Review cards may use prompt/answer instead of front/back.
        if ((a.type === 'create_review_deck' || a.type === 'add_review_cards') && Array.isArray(a.cards)) {
            a.cards = a.cards.map(c => {
                if (!c || typeof c !== 'object') return c;
                const card = { ...c };
                if (!card.front) card.front = card.prompt || card.question || card.q || card.term || '';
                if (!card.back) card.back = card.answer || card.a || card.definition || '';
                return card;
            });
        }

        // --- Workflow actions ---
        if (a.type === 'import_assignments') {
            if (!Array.isArray(a.assignments)) {
                a.assignments = Array.isArray(a.items) ? a.items
                    : Array.isArray(a.homework) ? a.homework
                    : Array.isArray(a.tasks) ? a.tasks : [];
            }
        }
        if (a.type === 'create_study_plan' || a.type === 'create_exam_plan' || a.type === 'plan_week' || a.type === 'plan_day' || a.type === 'triage_deadlines' || a.type === 'convert_note_to_study_system' || a.type === 'create_assignment_plan') {
            if (!Array.isArray(a.blocks) && Array.isArray(a.timeline)) a.blocks = a.timeline;
            if (Array.isArray(a.blocks)) {
                a.blocks = a.blocks.map(bk => {
                    if (!bk || typeof bk !== 'object') return bk;
                    const block = { ...bk };
                    if (!block.name) block.name = block.title || block.label || block.task || '';
                    if (!block.start && block.startTime) block.start = block.startTime;
                    if (!block.end && block.endTime) block.end = block.endTime;
                    if (!block.date && block.day) block.date = block.day;
                    return block;
                });
            }
        }
        if (a.type === 'create_assignment_plan' && !Array.isArray(a.steps)) {
            a.steps = Array.isArray(a.subtasks) ? a.subtasks : (Array.isArray(a.tasks) ? a.tasks.map(t => (typeof t === 'string' ? t : (t && t.title) || '')) : []);
        }
        if (a.type === 'start_focus_session') {
            if (a.minutes == null && a.duration != null) a.minutes = a.duration;
        }
        if (a.type === 'create_quick_capture_item' && !a.text) a.text = firstNonEmpty('content', 'item', 'note');
        if (a.type === 'open_class_dashboard') {
            if (!a.courseName) a.courseName = firstNonEmpty('class', 'course', 'className');
        }
        if (a.type === 'schedule_existing_item' && !a.title) a.title = firstNonEmpty('name', 'item');
        if (a.type === 'change_context_depth' && !a.depth) a.depth = firstNonEmpty('level', 'context');

        return a;
    }

    // --------------------------------------------------------------
    // Action validation
    // --------------------------------------------------------------
    function validateAction(rawAction) {
        if (!rawAction || typeof rawAction !== 'object') return { ok: false, error: 'No action' };
        const action = normalizeActionFields(rawAction);
        const known = ACTION_CATALOG.find(a => a.type === action.type);
        if (!known) return { ok: false, error: `Unknown action type: ${action.type}` };

        switch (action.type) {
            case 'insert_text':
            case 'replace_selection':
                if (!action.text || typeof action.text !== 'string') return { ok: false, error: 'Missing text' };
                break;
            case 'create_task':
            case 'create_homework':
            case 'create_college_task':
                if (!action.title || typeof action.title !== 'string') return { ok: false, error: 'Missing title' };
                break;
            case 'create_timeline_block':
                if (!action.name) return { ok: false, error: 'Missing name' };
                if (!action.date || !/^\d{4}-\d{2}-\d{2}$/.test(action.date)) return { ok: false, error: 'Need date YYYY-MM-DD' };
                if (!action.start || !/^\d{1,2}:\d{2}$/.test(action.start)) return { ok: false, error: 'Need start HH:MM' };
                if (!action.end || !/^\d{1,2}:\d{2}$/.test(action.end)) return { ok: false, error: 'Need end HH:MM' };
                break;
            case 'create_page':
                if (!action.title) return { ok: false, error: 'Missing title' };
                break;
            case 'canvas_add_sticky':
            case 'canvas_add_text':
                if (!action.text || typeof action.text !== 'string') return { ok: false, error: 'Missing text' };
                break;
            case 'create_review_deck':
                if (!action.name) return { ok: false, error: 'Missing deck name' };
                break;
            case 'add_review_cards':
                if (!action.deckId) return { ok: false, error: 'Missing deckId' };
                if (!Array.isArray(action.cards) || action.cards.length === 0) return { ok: false, error: 'No cards' };
                break;
            case 'create_cram_session':
                if (!action.topic) return { ok: false, error: 'Missing topic' };
                break;
            case 'navigate':
                if (!action.view) return { ok: false, error: 'Missing view' };
                break;
            case 'create_course':
                if (!action.name || typeof action.name !== 'string') return { ok: false, error: 'Missing course name' };
                break;
            case 'create_assignment_for_course':
                if (!action.title || typeof action.title !== 'string') return { ok: false, error: 'Missing title' };
                if (!action.courseId && !action.courseName) return { ok: false, error: 'Need courseId or courseName' };
                break;
            case 'add_resource_link_to_course':
                if (!action.title) return { ok: false, error: 'Missing resource title' };
                if (!action.courseId && !action.courseName) return { ok: false, error: 'Need courseId or courseName' };
                break;
            case 'link_note_to_course':
                if (!action.noteId) return { ok: false, error: 'Missing noteId' };
                if (!action.courseId && !action.courseName) return { ok: false, error: 'Need courseId or courseName' };
                break;
            case 'archive_course':
                if (!action.courseId && !action.courseName) return { ok: false, error: 'Need courseId or courseName' };
                break;
            case 'import_assignments':
                if (!Array.isArray(action.assignments) || action.assignments.length === 0) return { ok: false, error: 'No assignments to import' };
                break;
            case 'create_study_plan':
            case 'create_exam_plan':
                if (!action.title) return { ok: false, error: 'Missing plan title' };
                break;
            case 'create_assignment_plan':
                if (!action.title) return { ok: false, error: 'Missing title' };
                if (!Array.isArray(action.steps) || action.steps.length === 0) return { ok: false, error: 'No steps' };
                break;
            case 'plan_week':
            case 'plan_day':
                if (!Array.isArray(action.blocks) || action.blocks.length === 0) return { ok: false, error: 'No blocks proposed' };
                break;
            case 'triage_deadlines':
                if ((!Array.isArray(action.blocks) || !action.blocks.length) && (!Array.isArray(action.tasks) || !action.tasks.length)) return { ok: false, error: 'Nothing to triage' };
                break;
            case 'convert_note_to_study_system':
                if (!action.deck || !(action.deck.name)) return { ok: false, error: 'Missing deck' };
                break;
            case 'link_workspace_objects':
                if (!action.pageId) return { ok: false, error: 'Missing pageId' };
                break;
            case 'open_source_object':
                if (!action.kind || !action.id) return { ok: false, error: 'Missing kind/id' };
                break;
            case 'schedule_existing_item':
                if (!action.title) return { ok: false, error: 'Missing item title' };
                break;
            case 'open_class_dashboard':
                if (!action.courseId && !action.courseName) return { ok: false, error: 'Missing course' };
                break;
            case 'change_context_depth':
                if (!CONTEXT_DEPTHS.includes(action.depth)) return { ok: false, error: 'Invalid depth' };
                break;
            // start_focus_session, run_deadline_radar, run_weekly_review,
            // create_quick_capture_item have no required fields.
        }
        return { ok: true };
    }

    // --------------------------------------------------------------
    // Action appliers — these all flow through existing app paths.
    // --------------------------------------------------------------
    function applyInsertText(action) {
        const b = bridge();
        if (b && typeof b.insertIntoEditor === 'function') {
            b.insertIntoEditor(action.text);
            return { ok: true, message: 'Inserted into current note.' };
        }
        if (typeof window.insertIntoEditor === 'function') {
            window.insertIntoEditor(action.text);
            return { ok: true, message: 'Inserted into current note.' };
        }
        return { ok: false, message: 'Editor not available.' };
    }

    function applyReplaceSelection(action) {
        const editor = document.getElementById('editor');
        if (!editor) return { ok: false, message: 'Editor not available.' };
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !sel.toString()) {
            return applyInsertText(action);
        }
        let node = sel.getRangeAt(0).commonAncestorContainer;
        while (node && node !== editor) node = node.parentNode;
        if (node !== editor) return applyInsertText(action);
        document.execCommand('insertHTML', false,
            (typeof window.renderMarkdown === 'function') ? window.renderMarkdown(action.text) : esc(action.text)
        );
        return { ok: true, message: 'Replaced selection.' };
    }

    function applyCreateTask(action) {
        const b = bridge();
        const tasks = b ? b.tasks : window.tasks;
        if (!Array.isArray(tasks)) return { ok: false, message: 'Tasks not available.' };
        // IMPORTANT: match the canonical Atelier task shape (see app.js task
        // creation at line ~16329). Missing `isActive`/`scheduleType`/etc. makes
        // the task invisible in Today's filters, Daily Thread counts, and the
        // Deadline Radar — even though it shows up in the All Tasks drawer.
        const newTask = {
            id: makeId('t'),
            title: String(action.title).slice(0, 200),
            notes: action.notes || '',
            completed: false,
            isActive: true,
            scheduleType: 'once',
            weeklyDays: [],
            priority: ['low', 'medium', 'high'].includes(action.priority) ? action.priority : 'medium',
            difficulty: ['easy', 'medium', 'hard'].includes(action.difficulty) ? action.difficulty : 'medium',
            estimate: 0,
            dueDate: action.dueDate || '',
            dueTime: action.dueTime || '',
            category: action.category || 'none',
            referenceUrl: null,
            createdAt: new Date().toISOString(),
            origin: 'flow'
        };
        tasks.unshift(newTask);
        // Keep taskOrder in sync if it exists on the bridge.
        try {
            if (typeof window.taskOrder !== 'undefined' && Array.isArray(window.taskOrder)) {
                window.taskOrder.unshift(newTask.id);
            }
        } catch (e) { /* non-critical */ }
        if (b) { b.persistAppData(); b.renderTaskViews(); }
        else { safeCall(window.persistAppData); safeCall(window.renderTaskViews); }
        if (action.linkPageId) safeCall(addPageLinks, action.linkPageId, { taskIds: [newTask.id] });
        return { ok: true, message: 'Task added.', payload: { taskId: newTask.id, createdObjectIds: [{ kind: 'task', id: newTask.id }] } };
    }

    function applyCreateHomework(action) {
        try {
            const tasksKey = 'hwTasks:v2';
            const coursesKey = 'hwCourses:v2';
            const tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');
            const courses = JSON.parse(localStorage.getItem(coursesKey) || '[]');
            let courseId = '';
            if (action.courseName) {
                const lc = String(action.courseName).toLowerCase();
                const match = (Array.isArray(courses) ? courses : []).find(c => String(c.name || '').toLowerCase() === lc);
                if (match) courseId = match.id;
                else {
                    const newCourse = { id: makeId('c'), name: String(action.courseName).slice(0, 80), type: 'class' };
                    courses.push(newCourse);
                    safeHwWrite(coursesKey, JSON.stringify(courses));
                    courseId = newCourse.id;
                }
            }
            const hwId = makeId('hw');
            tasks.push({
                id: hwId,
                title: String(action.title).slice(0, 200),
                done: false,
                courseId,
                dueDate: action.dueDate || '',
                priority: 'medium',
                difficulty: ['easy', 'medium', 'hard'].includes(action.difficulty) ? action.difficulty : 'medium',
                createdAt: new Date().toISOString(),
                source: 'flow'
            });
            safeHwWrite(tasksKey, JSON.stringify(tasks));
            // The homework module (homework.js) reloads + re-renders on the
            // 'homework:updated' event; renderTaskViews refreshes Today's
            // task/assignment badges so Flow-added homework shows up in the
            // "What needs attention" cards immediately.
            notifyHomeworkChanged();
            const b2 = bridge();
            if (b2) b2.renderTaskViews(); else safeCall(window.renderTaskViews);
            return { ok: true, message: 'Homework added.', payload: { homeworkId: hwId, courseId, createdObjectIds: [{ kind: 'homework', id: hwId }] } };
        } catch (e) { return { ok: false, message: e.message }; }
    }

    function applyCreateTimelineBlock(action) {
        const b = bridge();
        const blocks = b ? b.timeBlocks : window.timeBlocks;
        if (!Array.isArray(blocks)) return { ok: false, message: 'Timeline not available.' };
        // Match the canonical timeBlock shape (see app.js auto-block creator):
        // missing recurrence/source/updatedAt would still render, but several
        // filters check these fields, so provide sensible defaults.
        const now = Date.now();
        const blockId = makeId('b');
        blocks.push({
            id: blockId,
            date: action.date,
            start: action.start,
            end: action.end,
            name: String(action.name).slice(0, 160),
            category: action.category || 'general',
            recurrence: 'none',
            source: 'flow',
            createdAt: now,
            updatedAt: now,
            linkedTaskId: action.linkTaskId || null,
            linkedHomeworkId: action.linkHomeworkId || null
        });
        if (b) {
            b.saveTimeBlocks();
            // renderTaskViews cascades into renderTodayView, which refreshes
            // the Today "Calendar" attention card badge with the new block.
            b.renderTaskViews();
            if (getActiveViewName() === 'timeline') b.renderTimeline();
        } else {
            safeCall(window.saveTimeBlocks);
            safeCall(window.renderTaskViews);
            if (getActiveViewName() === 'timeline') safeCall(window.renderTimeline);
        }
        return { ok: true, message: 'Block scheduled.', payload: { blockId, createdObjectIds: [{ kind: 'timeline', id: blockId }] } };
    }

    function applyCreatePage(action) {
        const b = bridge();
        const pages = b ? b.pages : window.pages;
        if (!Array.isArray(pages)) return { ok: false, message: 'Pages not available.' };
        const id = makeId('p');
        const body = action.body || '';
        const renderer = b ? b.renderMarkdown : window.renderMarkdown;
        const html = (typeof renderer === 'function') ? renderer(body) : esc(body).replace(/\n/g, '<br>');
        const activeSpaceId = action.spaceId
            || (b && typeof b.getActiveSpaceId === 'function' ? b.getActiveSpaceId() : '')
            || (b && b.activeSpaceId)
            || 'default';
        // Match canonical page shape (see createDefaultPage + template factory).
        const page = {
            id,
            title: String(action.title).slice(0, 200),
            collapsed: false,
            content: html,
            body: body,
            blocks: [],
            tags: Array.isArray(action.tags) ? action.tags.map(t => ({ name: String(t) })) : [],
            theme: 'default',
            spaceId: activeSpaceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceContext: 'flow',
            templateType: 'flow_generated',
            classLinkId: action.classLinkId || '',
            apSubjectId: action.apSubjectId || '',
            linkedTaskIds: [],
            linkedHomeworkTaskIds: [],
            linkedReviewItemIds: [],
            linkedReviewDeckId: '',
            linkedCalendarBlockIds: [],
            dueDate: '',
            examDate: '',
            deadline: '',
            status: ''
        };
        pages.push(page);
        if (b) { b.persistAppData(); b.renderPagesList(); }
        else { safeCall(window.persistAppData); safeCall(window.renderPagesList); }
        return { ok: true, message: 'Note created.', payload: { pageId: id, createdObjectIds: [{ kind: 'page', id }] } };
    }

    function applyCreateReviewDeck(action) {
        if (typeof window.createReviewDeck !== 'function') {
            return { ok: false, message: 'Review module not available — open the Review view once first.' };
        }
        const deck = window.createReviewDeck({ name: action.name, description: action.description || '' });
        if (!deck || !deck.id) return { ok: false, message: 'Could not create deck.' };
        if (Array.isArray(action.cards) && action.cards.length && typeof window.bulkImportReviewCards === 'function') {
            const lines = action.cards
                .filter(c => c && (c.front || c.prompt) && (c.back || c.answer))
                .map(c => `${c.front || c.prompt}\t${c.back || c.answer}`)
                .join('\n');
            if (lines) window.bulkImportReviewCards(deck.id, lines);
        }
        safeCall(window.renderReviewWorkspace);
        if (action.linkPageId) safeCall(addPageLinks, action.linkPageId, { deckId: deck.id });
        return { ok: true, message: `Deck created${action.cards ? ` with ${action.cards.length} cards` : ''}.`, payload: { deckId: deck.id, createdObjectIds: [{ kind: 'reviewDeck', id: deck.id }] } };
    }

    function applyAddReviewCards(action) {
        if (typeof window.bulkImportReviewCards !== 'function') {
            return { ok: false, message: 'Review module not available.' };
        }
        const lines = action.cards
            .filter(c => c && (c.front || c.prompt) && (c.back || c.answer))
            .map(c => `${c.front || c.prompt}\t${c.back || c.answer}`)
            .join('\n');
        if (!lines) return { ok: false, message: 'No usable cards.' };
        const n = window.bulkImportReviewCards(action.deckId, lines);
        safeCall(window.renderReviewWorkspace);
        return { ok: true, message: `Added ${n || action.cards.length} cards.` };
    }

    function applyCreateCramSession(action) {
        const b = bridge();
        const sessions = b ? b.cramSessions : window.cramSessions;
        if (!Array.isArray(sessions)) return { ok: false, message: 'Cram not available.' };
        // Match canonical cram session shape so renderCramSessionsList /
        // emergency-mode panels don't crash on missing fields.
        const topic = String(action.topic).slice(0, 120);
        const days = Math.max(1, Number(action.days) || 3);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        sessions.unshift({
            id: makeId('cram'),
            topic,
            title: topic,
            subject: action.subject || '',
            deadline: deadline.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: 'high',
            confidenceBefore: 5,
            confidenceAfter: null,
            availableMinutes: 0,
            blocks: [],
            checklist: [],
            resources: { keyConcepts: [], formulas: [], definitions: [], practiceProblems: [], mistakes: [], reminders: [] },
            brainDump: { freeform: '', keyTerms: [], confusingConcepts: [], questions: [] },
            emergency: { top3: '', formulas: '', mistakesToAvoid: '', reviewPlan: '', brainDump: '' },
            notes: '',
            linkedPageId: null,
            linkedHomeworkId: null,
            completed: false,
            source: 'flow'
        });
        if (b) b.persistAppData();
        else safeCall(window.persistAppData);
        return { ok: true, message: 'Cram session added.' };
    }

    function applyCreateCollegeTask(action) {
        const b = bridge();
        const cw = b ? b.collegeAppWorkspace : window.collegeAppWorkspace;
        if (!cw) return { ok: false, message: 'College workspace not available.' };
        const kind = action.kind || 'deadline';
        const item = {
            id: makeId(kind),
            title: String(action.title).slice(0, 160),
            dueDate: action.dueDate || '',
            createdAt: new Date().toISOString(),
            source: 'flow'
        };
        if (kind === 'essay') {
            if (!Array.isArray(cw.essays)) cw.essays = [];
            cw.essays.push({ ...item, prompt: item.title, status: 'todo' });
        } else if (kind === 'scholarship') {
            if (!Array.isArray(cw.scholarships)) cw.scholarships = [];
            cw.scholarships.push({ ...item, name: item.title });
        } else {
            if (!Array.isArray(cw.deadlines)) cw.deadlines = [];
            cw.deadlines.push(item);
        }
        if (b) b.persistAppData();
        else safeCall(window.persistAppData);
        return { ok: true, message: `Added to College (${kind}).` };
    }

    function applyNavigate(action) {
        const view = String(action.view || '').trim();
        if (!view) return { ok: false, message: 'No view.' };
        const b = bridge();
        if (b) b.setActiveView(view);
        else safeCall(window.setActiveView, view);
        return { ok: true, message: `Switched to ${view}.` };
    }

    // ---- Course Hub action appliers ----
    function cwHub() { return (typeof window !== 'undefined' && window.courseHub) ? window.courseHub : null; }
    function cwResolveCourseId(action) {
        const hub = cwHub();
        if (!hub) return '';
        if (action.courseId && hub.getCourseById(action.courseId)) return String(action.courseId);
        const name = String(action.courseName || '').trim().toLowerCase();
        if (name) {
            const match = (hub.getCourses({ filter: 'all' }) || []).find(c => String(c.name).toLowerCase() === name || String(c.shortName || '').toLowerCase() === name);
            if (match) return match.id;
        }
        return '';
    }
    function applyCreateCourse(action) {
        const hub = cwHub();
        if (!hub) return { ok: false, message: 'Course Hub unavailable.' };
        const course = hub.createCourse({
            name: action.name, type: action.type, teacherName: action.teacherName, room: action.room, subjectArea: action.subjectArea
        });
        if (action.meetingDays && typeof window.cwSetCourseTab === 'function') { /* schedule parsed below via updateCourse if helper present */ }
        try { if (typeof window.renderCourseHubView === 'function') window.renderCourseHubView(); } catch (e) {}
        return { ok: !!course, message: course ? `Created course "${course.name}".` : 'Could not create course.' };
    }
    function applyCreateAssignmentForCourse(action) {
        const hub = cwHub();
        if (!hub) return { ok: false, message: 'Course Hub unavailable.' };
        const courseId = cwResolveCourseId(action);
        if (!courseId) return { ok: false, message: 'Course not found.' };
        const created = hub.createAssignmentForCourse(courseId, {
            title: action.title, dueDate: action.dueDate, dueTime: action.dueTime, priority: action.priority, difficulty: action.difficulty, notes: action.notes
        });
        try { if (typeof window.renderCourseHubView === 'function') window.renderCourseHubView(); if (typeof window.renderAllDueView === 'function') window.renderAllDueView(); } catch (e) {}
        return { ok: !!created, message: created ? `Added "${action.title}".` : 'Could not add assignment.' };
    }
    function applyAddResourceLinkToCourse(action) {
        const hub = cwHub();
        if (!hub) return { ok: false, message: 'Course Hub unavailable.' };
        const courseId = cwResolveCourseId(action);
        if (!courseId) return { ok: false, message: 'Course not found.' };
        hub.addCourseResourceLink(courseId, { name: action.title, title: action.title, url: action.url });
        try { if (typeof window.renderCourseHubView === 'function') window.renderCourseHubView(); } catch (e) {}
        return { ok: true, message: `Added resource "${action.title}".` };
    }
    function applyLinkNoteToCourse(action) {
        const hub = cwHub();
        if (!hub) return { ok: false, message: 'Course Hub unavailable.' };
        const courseId = cwResolveCourseId(action);
        if (!courseId) return { ok: false, message: 'Course not found.' };
        hub.linkNoteToCourse(courseId, action.noteId);
        try { if (typeof window.renderCourseHubView === 'function') window.renderCourseHubView(); } catch (e) {}
        return { ok: true, message: 'Linked note to course.' };
    }
    function applyArchiveCourse(action) {
        const hub = cwHub();
        if (!hub) return { ok: false, message: 'Course Hub unavailable.' };
        const courseId = cwResolveCourseId(action);
        if (!courseId) return { ok: false, message: 'Course not found.' };
        const archived = action.archived === false ? false : true;
        hub.archiveCourse(courseId, archived);
        try { if (typeof window.renderCourseHubView === 'function') window.renderCourseHubView(); } catch (e) {}
        return { ok: true, message: archived ? 'Course archived.' : 'Course unarchived.' };
    }
    function applyNavigateToCourse(action) {
        const courseId = cwResolveCourseId(action);
        if (courseId && typeof window.cwSelectCourse === 'function') {
            safeCall(window.setActiveView, 'courses');
            try { window.cwSelectCourse(courseId); } catch (e) {}
            return { ok: true, message: 'Opened course.' };
        }
        safeCall(window.setActiveView, 'courses');
        return { ok: true, message: 'Opened Courses.' };
    }
    function applyNavigateToAllDue() {
        safeCall(window.setActiveView, 'alldue');
        return { ok: true, message: 'Opened All Due.' };
    }

    function applyAction(rawAction) {
        const valid = validateAction(rawAction);
        if (!valid.ok) return { ok: false, message: valid.error };
        const action = normalizeActionFields(rawAction);
        switch (action.type) {
            case 'insert_text': return applyInsertText(action);
            case 'replace_selection': return applyReplaceSelection(action);
            case 'create_task': return applyCreateTask(action);
            case 'create_homework': return applyCreateHomework(action);
            case 'create_timeline_block': return applyCreateTimelineBlock(action);
            case 'create_page': return applyCreatePage(action);
            case 'canvas_add_sticky': return applyCanvasAddSticky(action);
            case 'canvas_add_text': return applyCanvasAddText(action);
            case 'canvas_create_task_from_selection': return applyCanvasCreateTaskFromSelection(action);
            case 'canvas_create_note_from_selection': return applyCanvasCreateNoteFromSelection(action);
            case 'canvas_group_selection': return applyCanvasGroupSelection(action);
            case 'create_review_deck': return applyCreateReviewDeck(action);
            case 'add_review_cards': return applyAddReviewCards(action);
            case 'create_cram_session': return applyCreateCramSession(action);
            case 'create_college_task': return applyCreateCollegeTask(action);
            case 'navigate': return applyNavigate(action);
            case 'create_course': return applyCreateCourse(action);
            case 'create_assignment_for_course': return applyCreateAssignmentForCourse(action);
            case 'add_resource_link_to_course': return applyAddResourceLinkToCourse(action);
            case 'link_note_to_course': return applyLinkNoteToCourse(action);
            case 'archive_course': return applyArchiveCourse(action);
            case 'navigate_to_course': return applyNavigateToCourse(action);
            case 'navigate_to_all_due': return applyNavigateToAllDue(action);
            case 'create_study_plan': return applyCreateStudyPlan(action);
            case 'create_exam_plan': return applyCreateExamPlan(action);
            case 'create_assignment_plan': return applyCreateAssignmentPlan(action);
            case 'plan_week':
            case 'plan_day':
            case 'triage_deadlines': return applyBlockBatch(action);
            case 'convert_note_to_study_system': return applyConvertNote(action);
            case 'link_workspace_objects': return applyLinkObjects(action);
            case 'open_source_object': return applyOpenSource(action);
            case 'start_focus_session': return applyStartFocus(action);
            case 'schedule_existing_item': return applyScheduleExisting(action);
            case 'open_class_dashboard': return applyOpenClassDashboard(action);
            case 'run_deadline_radar': return applyRunDeadlineRadar(action);
            case 'run_weekly_review': return applyRunWeeklyReview(action);
            case 'create_quick_capture_item': return applyQuickCapture(action);
            case 'change_context_depth': return applyChangeContextDepth(action);
            // import_assignments has no atomic applier — it is applied row-by-row
            // through the dedicated review table (see renderImportReview).
            default: return { ok: false, message: 'Unknown action.' };
        }
    }

    // --------------------------------------------------------------
    // Action card rendering (inside chat panel)
    // --------------------------------------------------------------
    function describeAction(action) {
        switch (action.type) {
            case 'insert_text': return `Insert into current note: "${truncate(action.text, 100)}"`;
            case 'replace_selection': return `Replace selection with: "${truncate(action.text, 100)}"`;
            case 'create_task': return `Create task: "${action.title}"${action.dueDate ? ` (due ${action.dueDate})` : ''}`;
            case 'create_homework': return `Add homework: "${action.title}"${action.courseName ? ` for ${action.courseName}` : ''}${action.dueDate ? ` (due ${action.dueDate})` : ''}`;
            case 'create_timeline_block': return `Schedule "${action.name}" on ${action.date} ${action.start}–${action.end}`;
            case 'create_page': return `Create note "${action.title}"`;
            case 'canvas_add_sticky': return `Add Canvas sticky: "${truncate(action.text, 80)}"`;
            case 'canvas_add_text': return `Add Canvas text: "${truncate(action.text, 80)}"`;
            case 'canvas_create_task_from_selection': return 'Create task from current Canvas selection';
            case 'canvas_create_note_from_selection': return `Create note from Canvas selection${action.title ? `: ${action.title}` : ''}`;
            case 'canvas_group_selection': return `Group selected Canvas objects${action.label ? `: ${action.label}` : ''}`;
            case 'create_review_deck': return `Create review deck "${action.name}"${Array.isArray(action.cards) ? ` with ${action.cards.length} cards` : ''}`;
            case 'add_review_cards': return `Add ${action.cards.length} cards to deck ${action.deckId}`;
            case 'create_cram_session': return `Start cram session: "${action.topic}"`;
            case 'create_college_task': return `Add college ${action.kind || 'deadline'}: "${action.title}"`;
            case 'navigate': return `Go to ${action.view}`;
            case 'create_course': return `Create course: "${action.name}"${action.teacherName ? ` (${action.teacherName})` : ''}`;
            case 'create_assignment_for_course': return `Add assignment "${action.title}"${action.courseName ? ` to ${action.courseName}` : ''}`;
            case 'add_resource_link_to_course': return `Add resource "${action.title}"${action.courseName ? ` to ${action.courseName}` : ''}`;
            case 'link_note_to_course': return `Link a note to ${action.courseName || 'a course'}`;
            case 'archive_course': return `${action.archived === false ? 'Unarchive' : 'Archive'} course ${action.courseName || ''}`;
            case 'navigate_to_course': return `Open course ${action.courseName || ''}`;
            case 'navigate_to_all_due': return `Open All Due`;
            case 'import_assignments': return `Import ${Array.isArray(action.assignments) ? action.assignments.length : 0} assignment(s)`;
            case 'create_study_plan': return `Study plan: "${action.title}" (${(action.blocks || []).length} block(s))`;
            case 'create_exam_plan': return `Exam plan: "${action.title}"${action.examDate ? ` (exam ${action.examDate})` : ''}`;
            case 'create_assignment_plan': return `Assignment plan: "${action.title}" (${(action.steps || []).length} step(s))`;
            case 'plan_week': return `Plan week: ${(action.blocks || []).length} block(s)`;
            case 'plan_day': return `Plan day${action.date ? ` ${action.date}` : ''}: ${(action.blocks || []).length} block(s)`;
            case 'triage_deadlines': return `Triage deadlines: ${(action.blocks || []).length} block(s), ${(action.tasks || []).length} task(s)`;
            case 'convert_note_to_study_system': return `Make study system from this note`;
            case 'link_workspace_objects': return `Link objects to a note`;
            case 'open_source_object': return `Open ${action.kind}`;
            case 'start_focus_session': return `Start focus session${action.minutes ? ` (${action.minutes}m)` : ''}`;
            case 'schedule_existing_item': return `Schedule "${action.title}" onto timeline`;
            case 'open_class_dashboard': return `Open class dashboard${action.courseName ? `: ${action.courseName}` : ''}`;
            case 'run_deadline_radar': return `Open Deadline Radar`;
            case 'run_weekly_review': return `Create Weekly Review note`;
            case 'create_quick_capture_item': return `Quick Capture: "${truncate(action.text || '', 60)}"`;
            case 'change_context_depth': return `Set context depth to ${action.depth}`;
            default: return `Unknown: ${action.type}`;
        }
    }

    function getConfirmationMode() {
        const explicit = String(getPref('assistant.confirmationMode', '') || '').trim();
        if (['always', 'auto_low', 'review_batches'].includes(explicit)) return explicit;
        // Legacy fallback: requireConfirmation=false → auto-apply low-risk.
        return getPref('assistant.requireConfirmation', true) === false ? 'auto_low' : 'always';
    }

    function renderActionCards(hostEl, actions, opts) {
        if (!hostEl || !Array.isArray(actions) || actions.length === 0) return;
        const showPreviews = getPref('assistant.showActionPreviews', true) !== false;
        const confirmMode = getConfirmationMode();
        const isBatch = actions.length > 1;

        // Special case: a single import_assignments action renders as a review table.
        if (actions.length === 1 && (normalizeActionFields(actions[0]).type === 'import_assignments')) {
            try { renderImportReview(hostEl, normalizeActionFields(actions[0])); return; } catch (e) { console.warn('Import review failed:', e); }
        }

        const wrap = document.createElement('div');
        wrap.className = 'flow-action-cards';
        wrap.setAttribute('role', 'group');
        wrap.setAttribute('aria-label', 'Proposed actions');

        actions.forEach((rawAction, idx) => {
            const action = normalizeActionFields(rawAction);
            const card = document.createElement('div');
            card.className = 'flow-action-card';
            const valid = validateAction(action);
            const risk = classifyRisk(action);
            card.setAttribute('data-risk', risk);

            const label = action.label || describeAction(action);
            const header = document.createElement('div');
            header.className = 'flow-action-card-head';
            header.innerHTML = `<span class="flow-action-type">${esc(action.type)}</span>`
                + `<span class="flow-action-risk flow-risk-${esc(risk)}" title="Risk level">${esc(risk)}</span>`
                + `<span class="flow-action-label">${esc(label)}</span>`;
            card.appendChild(header);

            if (showPreviews) {
                const preview = document.createElement('details');
                preview.className = 'flow-action-preview';
                preview.innerHTML = `<summary>Details</summary><pre>${esc(JSON.stringify(action, null, 2))}</pre>`;
                card.appendChild(preview);
            }

            if (!valid.ok) {
                const err = document.createElement('div');
                err.className = 'flow-action-error';
                err.textContent = `Invalid: ${valid.error}`;
                card.appendChild(err);
            }

            const actionsRow = document.createElement('div');
            actionsRow.className = 'flow-action-row';

            const applyBtn = document.createElement('button');
            applyBtn.type = 'button';
            applyBtn.className = 'flow-action-apply';
            applyBtn.textContent = 'Apply';
            applyBtn.disabled = !valid.ok;
            const doApply = () => {
                applyBtn.disabled = true;
                const result = applyActionLogged(action, opts && opts.meta);
                const status = document.createElement('div');
                status.className = result.ok ? 'flow-action-ok' : 'flow-action-error';
                status.textContent = result.ok ? `✓ ${result.message}` : `✗ ${result.message}`;
                card.appendChild(status);
                if (result.ok) { showToast(result.message); applyBtn.textContent = 'Applied'; }
                else { applyBtn.disabled = false; }
                if (opts && typeof opts.onApplied === 'function') opts.onApplied(action, result);
            };
            applyBtn.addEventListener('click', doApply);

            const declineBtn = document.createElement('button');
            declineBtn.type = 'button';
            declineBtn.className = 'flow-action-decline';
            declineBtn.textContent = 'Decline';
            declineBtn.addEventListener('click', () => {
                card.classList.add('flow-action-declined');
                applyBtn.disabled = true;
                declineBtn.disabled = true;
            });

            actionsRow.appendChild(applyBtn);
            actionsRow.appendChild(declineBtn);

            if (isBatch && idx === 0) {
                const applyAllBtn = document.createElement('button');
                applyAllBtn.type = 'button';
                applyAllBtn.className = 'flow-action-apply-all';
                applyAllBtn.textContent = `Apply all (${actions.length})`;
                applyAllBtn.addEventListener('click', () => {
                    wrap.querySelectorAll('.flow-action-apply').forEach(btn => { if (!btn.disabled) btn.click(); });
                    applyAllBtn.disabled = true;
                });
                actionsRow.appendChild(applyAllBtn);
            }

            card.appendChild(actionsRow);
            wrap.appendChild(card);

            // Auto-apply only LOW risk actions, only when the user opted into
            // auto_low mode, and never as part of a multi-action batch.
            if (valid.ok && risk === 'low' && confirmMode === 'auto_low' && !isBatch) {
                const note = document.createElement('div');
                note.className = 'flow-action-autonote';
                note.textContent = 'Auto-applied (low-risk).';
                card.appendChild(note);
                setTimeout(doApply, 0);
            }
        });

        hostEl.appendChild(wrap);
    }

    // --------------------------------------------------------------
    // Context chip + quick actions UI
    // --------------------------------------------------------------
    const QUICK_ACTIONS_BY_VIEW = {
        today: [
            { label: 'Shape my day', prompt: 'Plan my day from my open tasks, due homework, and upcoming timeline blocks. Suggest a realistic order and propose timeline blocks as actions.' },
            { label: 'Top risks', prompt: 'What are the top 3 risks across my tasks and deadlines? Be specific and reference items.' },
            { label: 'Next step', prompt: 'Looking at my current state, what is the single highest-leverage next action I should do right now? Explain why in one sentence.' }
        ],
        notes: [
            { label: 'Summarize', prompt: 'Summarize this note into concise bullet points. After the summary, propose an insert_text action that adds a "Summary" section at the top.' },
            { label: 'Make outline', prompt: 'Reorganize this note into a clear outline with H2/H3 sections. Propose a replace_selection action only if I have text selected.' },
            { label: 'Improve writing', prompt: 'Improve the writing in the current selection (or the whole note if nothing is selected) — clearer, tighter, same meaning.' },
            { label: 'Selection → tasks', prompt: 'Turn the selected text into concrete tasks. Propose create_task actions, one per task.' },
            { label: 'Generate review cards', prompt: 'Read this note and propose a create_review_deck action whose cards array contains 8–15 high-quality front/back review pairs covering the key concepts.' }
        ],
        homework: [
            { label: 'Break down assignment', prompt: 'Break the most pressing homework assignment into sub-steps and propose create_task actions for each step.' },
            { label: 'Study plan', prompt: 'Propose a study plan for the next 5 days as create_timeline_block actions, sized realistically around my open homework.' }
        ],
        timeline: [
            { label: 'Schedule open tasks', prompt: 'Look at my open tasks and propose create_timeline_block actions to place focus blocks for them across today and tomorrow.' },
            { label: 'Find conflicts', prompt: 'Scan my upcoming timeline and call out any conflicts, double-bookings, or unrealistic back-to-backs.' },
            { label: 'Add breaks', prompt: 'Propose create_timeline_block actions to insert short breaks between long study blocks today.' }
        ],
        review: [
            { label: 'Build deck from note', prompt: 'Switch context to the current note and propose a create_review_deck action with 10 high-quality cards.' },
            { label: 'Explain weak areas', prompt: 'Using the review stats in context, suggest what topics I should focus on next.' }
        ],
        cramhub: [
            { label: 'Cram plan', prompt: 'Propose a create_cram_session action plus a series of create_timeline_block actions for a realistic 3-day cram on the most urgent exam.' }
        ],
        apstudy: [
            { label: 'Battle plan', prompt: 'Look at my AP subjects and exam dates and propose a focused study plan as create_timeline_block actions for the next week.' }
        ],
        collegeapp: [
            { label: 'Essay outline', prompt: 'Pick the highest-priority essay prompt in context and propose a create_page action with a structured outline.' },
            { label: 'Extract deadlines', prompt: 'Look at the colleges in context and propose create_college_task actions (kind: deadline) for any missing application deadlines.' }
        ],
        life: [
            { label: 'Ask Sutra about this view', prompt: 'Look at my Life workspace and suggest one improvement I could make this week.' }
        ],
        business: [
            { label: 'Pipeline review', prompt: 'Summarize my business pipeline from the context and propose 3 concrete next actions as create_task actions.' }
        ]
    };

    function getQuickActions(view) {
        try { return buildContextualQuickActions(view); } catch (e) {
            const key = String(view || getActiveViewName());
            return QUICK_ACTIONS_BY_VIEW[key] || QUICK_ACTIONS_BY_VIEW.today;
        }
    }

    function describeContextChip() {
        const depth = normalizeDepth();
        const view = getActiveViewName();
        const labels = {
            minimal: 'Minimal context',
            currentView: `Context: ${view}`,
            workspace: 'Context: workspace-aware'
        };
        return labels[depth] || `Context: ${view}`;
    }

    function describeChatMemoryChip() {
        const mode = getChatMemoryMode();
        if (mode === 'stateful') {
            const depth = getChatMemoryDepth();
            return `Stateful · last ${depth} message${depth === 1 ? '' : 's'}`;
        }
        return 'Stateless';
    }

    function updateContextChip() {
        const chip = document.getElementById('flowContextChip');
        if (chip) {
            chip.textContent = describeContextChip();
            chip.title = `Sutra Assistant sees ${normalizeDepth()} context. Change in Settings ▸ Assistant.`;
        }
        const memoryChip = document.getElementById('flowMemoryChip');
        if (memoryChip) {
            const mode = getChatMemoryMode();
            memoryChip.dataset.state = mode;
            memoryChip.textContent = describeChatMemoryChip();
            memoryChip.title = mode === 'stateful'
                ? `Sutra Assistant includes recent chat history. Change in Settings ▸ Assistant.`
                : `Sutra Assistant sends each message independently. Change in Settings ▸ Assistant.`;
        }
        const selectionFlag = document.getElementById('flowSelectionFlag');
        if (selectionFlag) {
            const sel = getEditorSelection();
            if (sel) {
                selectionFlag.hidden = false;
                selectionFlag.textContent = `Using selection (${sel.length} chars)`;
            } else {
                selectionFlag.hidden = true;
            }
        }
    }

    function renderQuickActions() {
        const row = document.getElementById('chatSuggestionRow');
        const input = document.getElementById('chatInput');
        if (!row) return;
        if (getPref('assistant.enabled', true) === false) { row.style.display = 'none'; row.innerHTML = ''; return; }
        if (getPref('assistant.autoSuggestions', true) === false) { row.style.display = 'none'; row.innerHTML = ''; return; }

        const items = getQuickActions(getActiveViewName());
        row.style.display = 'flex';
        row.innerHTML = items.map((it, i) =>
            `<button type="button" class="chatbot-suggestion" data-flow-quick="${i}">${esc(it.label)}</button>`
        ).join('');
        row.querySelectorAll('[data-flow-quick]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-flow-quick'));
                const item = items[idx];
                if (!item || !input) return;
                input.value = item.prompt;
                input.focus();
                if (item.autoSend && typeof window.sendChat === 'function') {
                    try { window.sendChat(); } catch (e) { /* ignore */ }
                }
            });
        });
    }

    // --------------------------------------------------------------
    // View-level "Ask Flow" rows
    // --------------------------------------------------------------
    const VIEW_FLOW_ROWS = {
        today: [
            { label: 'Shape my day', prompt: 'Plan my day from my open tasks and timeline. Propose create_timeline_block actions for the most important items.' },
            { label: 'Next step', prompt: 'Looking at my current state, what is the single highest-leverage next action I should do right now? Explain why in one sentence.' }
        ],
        notes: [
            { label: 'Summarize this note', prompt: 'Summarize the current note as concise bullets, then propose an insert_text action that adds a "Summary" section.' },
            { label: 'Make outline', prompt: 'Reorganize the current note (or selection) into a clear outline.' },
            { label: 'Improve writing', prompt: 'Improve the writing in the current selection (or whole note if nothing is selected).' },
            { label: 'Selection → tasks', prompt: 'Turn the selected text into concrete tasks. Propose create_task actions for each.' },
            { label: 'Generate review cards', prompt: 'Read this note and propose a create_review_deck action with 8–15 high-quality front/back cards.' }
        ],
        homework: [
            { label: 'Break down assignment', prompt: 'Break down the most pressing homework into sub-steps. Propose create_task actions.' },
            { label: 'Build study plan', prompt: 'Propose a study plan as create_timeline_block actions sized realistically around my open homework.' }
        ],
        timeline: [
            { label: 'Schedule open tasks', prompt: 'Propose create_timeline_block actions to place focus blocks for my open tasks today and tomorrow.' },
            { label: 'Find conflicts', prompt: 'Scan my upcoming timeline and call out conflicts or unrealistic back-to-backs.' }
        ],
        review: [
            { label: 'Build deck from current note', prompt: 'Switch context to the current note and propose a create_review_deck action with 10 cards.' },
            { label: 'Explain weak areas', prompt: 'Using my review stats, suggest what topics I should focus on next.' }
        ],
        cramhub: [
            { label: 'Cram plan', prompt: 'Propose a create_cram_session action plus create_timeline_block actions for a realistic 3-day cram on the most urgent exam.' }
        ],
        apstudy: [
            { label: 'AP battle plan', prompt: 'Look at my AP subjects and exam dates and propose a focused 1-week study plan as create_timeline_block actions.' }
        ],
        collegeapp: [
            { label: 'Outline essay', prompt: 'Pick the highest-priority essay prompt and propose a create_page action with a structured outline.' },
            { label: 'Extract deadlines', prompt: 'Propose create_college_task actions (kind: deadline) for any missing application deadlines.' }
        ],
        life: [
            { label: 'Ask Sutra', prompt: 'Look at my Life workspace and suggest one improvement I could make this week.' }
        ],
        business: [
            { label: 'Pipeline review', prompt: 'Summarize my business pipeline and propose 3 concrete next actions as create_task actions.' }
        ]
    };

    function injectViewFlowRows() {
        try {
            Object.keys(VIEW_FLOW_ROWS).forEach(viewId => {
                const section = document.getElementById(`view-${viewId}`);
                if (!section) return;
                if (section.querySelector('.view-flow-row')) return;
                if (getPref('assistant.enabled', true) === false) return;
                const row = document.createElement('div');
                row.className = 'view-flow-row';
                row.setAttribute('data-flow-injected-for', viewId);
                row.setAttribute('aria-label', 'Ask Sutra');
                row.innerHTML = VIEW_FLOW_ROWS[viewId].map(item =>
                    `<button type="button" class="view-flow-btn" data-flow-ask="${esc(item.prompt)}">${esc(item.label)}</button>`
                ).join('');
                // Insert at the top of the view, before existing content.
                if (section.firstChild) section.insertBefore(row, section.firstChild);
                else section.appendChild(row);
            });
        } catch (e) { console.warn('Sutra Assistant injectViewFlowRows failed:', e); }
    }

    function ensurePanelChrome() {
        const panel = document.getElementById('chatbotPanel');
        if (!panel) return;
        const header = panel.querySelector('.chatbot-header');
        // Keep the static "Powered by Sutra Intelligence" badge directly under the
        // header: anchor the dynamic context-chip row after the badge when present.
        const intelBadge = panel.querySelector('[data-sutra-component="assistant-intelligence-badge"]');
        const chipAnchor = intelBadge || header;
        if (header && !document.getElementById('flowContextChipRow')) {
            const chipRow = document.createElement('div');
            chipRow.id = 'flowContextChipRow';
            chipRow.className = 'flow-context-chip-row';
            chipRow.innerHTML = `
                <button type="button" class="flow-context-chip" id="flowContextChip" aria-live="polite" title="View the exact context Sutra sends"></button>
                <span class="flow-memory-chip" id="flowMemoryChip" aria-live="polite"></span>
                <span class="flow-selection-flag" id="flowSelectionFlag" hidden></span>
                <button type="button" class="flow-chip-btn" id="flowAttachBtn" title="Attach files — PDFs, images, and text files. What each model can read is shown on the file chip.">📎 Attach</button>
                <button type="button" class="flow-chip-btn" id="flowViewContextBtn" title="View context being sent">View context</button>
                <button type="button" class="flow-chip-btn" id="flowActivityBtn" title="Assistant activity + undo">Activity</button>
                <input type="file" id="flowAttachInput" multiple hidden aria-label="Attach files to your message" />
            `;
            chipAnchor.insertAdjacentElement('afterend', chipRow);
            const chipsHost = document.createElement('div');
            chipsHost.id = 'flowAttachmentChips';
            chipsHost.className = 'flow-attachment-chips';
            chipsHost.hidden = true;
            chipRow.insertAdjacentElement('afterend', chipsHost);

            // Wire chrome buttons.
            const ctxChip = document.getElementById('flowContextChip');
            if (ctxChip) ctxChip.addEventListener('click', () => { try { showContextModal(); } catch (e) {} });
            const viewCtx = document.getElementById('flowViewContextBtn');
            if (viewCtx) viewCtx.addEventListener('click', () => { try { showContextModal(); } catch (e) {} });
            const actBtn = document.getElementById('flowActivityBtn');
            if (actBtn) actBtn.addEventListener('click', () => { try { openActivityLog(); } catch (e) {} });
            const attachBtn = document.getElementById('flowAttachBtn');
            const attachInput = document.getElementById('flowAttachInput');
            if (attachBtn && attachInput) {
                attachBtn.addEventListener('click', () => {
                    attachInput.click();
                });
                attachInput.addEventListener('change', () => {
                    const files = Array.from(attachInput.files || []);
                    // Sequential so chips appear in selection order.
                    files.reduce((p, f) => p.then(() => addAttachmentFromFile(f)), Promise.resolve())
                        .then(() => { attachInput.value = ''; });
                });
            }
            // Re-evaluate attachment compatibility whenever the provider/model
            // selection changes — chips must always reflect the CURRENT model.
            ['chatProviderSelect', 'chatModelSelect', 'chatCustomModelInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.dataset.flowAttachWatch) {
                    el.dataset.flowAttachWatch = 'true';
                    el.addEventListener('change', () => refreshAttachmentPlans());
                    if (el.tagName === 'INPUT') el.addEventListener('input', () => refreshAttachmentPlans());
                }
            });
            // Drag & drop onto the assistant panel attaches (does NOT upload).
            if (!panel.dataset.flowDropWired) {
                panel.dataset.flowDropWired = 'true';
                panel.addEventListener('dragover', (e) => {
                    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
                        e.preventDefault();
                        panel.classList.add('flow-drop-active');
                    }
                });
                panel.addEventListener('dragleave', (e) => {
                    if (e.target === panel) panel.classList.remove('flow-drop-active');
                });
                panel.addEventListener('drop', (e) => {
                    panel.classList.remove('flow-drop-active');
                    const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
                    if (!files.length) return;
                    e.preventDefault();
                    files.reduce((p, f) => p.then(() => addAttachmentFromFile(f)), Promise.resolve());
                });
            }
        }
        // Action cards host appended after messages on demand; nothing to pre-create.
        updateContextChip();
        updateAttachmentChips();
    }

    // --------------------------------------------------------------
    // Public Ask-Flow helper (used by view buttons / command palette)
    // --------------------------------------------------------------
    function askFlow(prompt, opts) {
        const options = opts || {};
        const panel = document.getElementById('chatbotPanel');
        const input = document.getElementById('chatInput');
        if (!input || !panel) return;
        if (panel.style.display !== 'flex' && typeof window.toggleChat === 'function') {
            try { window.toggleChat(); } catch (e) { /* ignore */ }
        }
        input.value = String(prompt || '');
        input.focus();
        if (options.send && typeof window.sendChat === 'function') {
            setTimeout(() => { try { window.sendChat(); } catch (e) { /* ignore */ } }, 60);
        }
        updateContextChip();
        renderQuickActions();
    }

    // --------------------------------------------------------------
    // Provider-agnostic message enrichment (called by sendChat hook)
    // --------------------------------------------------------------
    function buildRequestEnrichment(userText, providerType, options = {}) {
        if (getPref('assistant.enabled', true) === false) return null;
        lastUserPrompt = String(userText || '');
        const ctx = getFlowAssistantContext({});
        const systemPrompt = buildSystemPrompt(ctx);
        const cap = getVisionCapability();
        const attachments = getAttachments();
        return {
            systemPrompt,
            context: ctx,
            providerType,
            visionCapability: cap,
            attachments,
            requestMessages: buildRequestMessages(userText, options.conversation, options)
        };
    }

    // Called by app.js sendChat BEFORE the provider request. If a natural-
    // language command is recognized it is executed locally and the model call
    // is skipped. Also clears one-shot image attachments after a send.
    function handleOutgoing(userText) {
        const cmd = tryHandleCommand(userText);
        return cmd;
    }

    function consumeAttachments() {
        const a = getAttachments();
        clearAttachments();
        return a;
    }

    // --------------------------------------------------------------
    // flow-intelligence accessor + reused-app-function caller
    // --------------------------------------------------------------
    function intel() {
        return (typeof window !== 'undefined' && window.flowIntelligence) ? window.flowIntelligence : null;
    }

    // Call a function that may live on the bridge or directly on window.
    function callApp(name, ...args) {
        const b = bridge();
        try {
            if (b && typeof b[name] === 'function') return b[name](...args);
        } catch (e) { console.warn('Flow callApp(bridge) failed:', name, e); }
        try {
            if (typeof window[name] === 'function') return window[name](...args);
        } catch (e) { console.warn('Flow callApp(window) failed:', name, e); }
        return undefined;
    }

    function refreshAll() {
        const b = bridge();
        if (b) { safeCall(b.persistAppData); safeCall(b.renderTaskViews); }
        else { safeCall(window.persistAppData); safeCall(window.renderTaskViews); }
    }

    // --------------------------------------------------------------
    // Object linking
    // --------------------------------------------------------------
    function addPageLinks(pageId, links) {
        try {
            const b = bridge();
            const pages = b ? b.pages : window.pages;
            if (!Array.isArray(pages) || !pageId) return false;
            const page = pages.find(p => p && p.id === pageId);
            if (!page) return false;
            const merge = (field, vals) => {
                if (!Array.isArray(vals) || !vals.length) return;
                if (!Array.isArray(page[field])) page[field] = [];
                vals.forEach(v => { if (v && !page[field].includes(v)) page[field].push(v); });
            };
            merge('linkedTaskIds', links.taskIds);
            merge('linkedHomeworkTaskIds', links.homeworkIds);
            merge('linkedReviewItemIds', links.reviewItemIds);
            merge('linkedCalendarBlockIds', links.blockIds);
            if (links.deckId) page.linkedReviewDeckId = links.deckId;
            page.updatedAt = new Date().toISOString();
            if (b) safeCall(b.persistAppData); else safeCall(window.persistAppData);
            return true;
        } catch (e) { console.warn('addPageLinks failed:', e); return false; }
    }

    function mergeCreated(target, result) {
        if (result && result.ok && result.payload && Array.isArray(result.payload.createdObjectIds)) {
            result.payload.createdObjectIds.forEach(o => target.push(o));
        }
    }

    // --------------------------------------------------------------
    // Workflow appliers — compose atomic appliers, aggregate created ids
    // so the activity-log/undo treats the whole workflow as one unit.
    // --------------------------------------------------------------
    function applyBlocksList(blocks, defaults) {
        const created = [];
        const ids = [];
        (Array.isArray(blocks) ? blocks : []).forEach(bk => {
            if (!bk) return;
            const spec = {
                type: 'create_timeline_block',
                name: bk.name || (defaults && defaults.name) || 'Study',
                date: bk.date || (defaults && defaults.date) || '',
                start: bk.start,
                end: bk.end,
                category: bk.category || (defaults && defaults.category) || 'study',
                linkTaskId: bk.linkTaskId,
                linkHomeworkId: bk.linkHomeworkId
            };
            const valid = validateAction(spec);
            if (!valid.ok) return;
            const r = applyCreateTimelineBlock(spec);
            if (r.ok && r.payload) { ids.push(r.payload.blockId); mergeCreated(created, r); }
        });
        return { created, blockIds: ids };
    }

    function setPageMeta(pageId, meta) {
        try {
            const b = bridge();
            const pages = b ? b.pages : window.pages;
            const page = (pages || []).find(p => p && p.id === pageId);
            if (!page) return;
            Object.assign(page, meta);
            page.updatedAt = new Date().toISOString();
            if (b) safeCall(b.persistAppData); else safeCall(window.persistAppData);
        } catch (e) { /* ignore */ }
    }

    function applyCreateStudyPlan(action) {
        const created = [];
        let pageId = '';
        const pageRes = applyCreatePage({ type: 'create_page', title: action.title || 'Study plan', body: action.note || `# ${action.title || 'Study plan'}\n` });
        if (pageRes.ok && pageRes.payload) { pageId = pageRes.payload.pageId; mergeCreated(created, pageRes); }
        const { created: blkCreated, blockIds } = applyBlocksList(action.blocks);
        blkCreated.forEach(o => created.push(o));
        if (action.deck && action.deck.name) {
            const r = applyCreateReviewDeck({ type: 'create_review_deck', name: action.deck.name, cards: action.deck.cards, linkPageId: pageId });
            mergeCreated(created, r);
        }
        if (pageId) addPageLinks(pageId, { blockIds });
        refreshAll();
        return { ok: created.length > 0, message: `Study plan created (${created.length} object${created.length === 1 ? '' : 's'}).`, payload: { createdObjectIds: created, pageId } };
    }

    function applyCreateExamPlan(action) {
        const created = [];
        let pageId = '';
        const pageRes = applyCreatePage({
            type: 'create_page',
            title: action.title || 'Exam plan',
            body: action.note || `# ${action.title || 'Exam plan'}\n`,
            apSubjectId: action.apSubjectId || ''
        });
        if (pageRes.ok && pageRes.payload) { pageId = pageRes.payload.pageId; mergeCreated(created, pageRes); }
        if (pageId && action.examDate) setPageMeta(pageId, { examDate: action.examDate });
        const { created: blkCreated, blockIds } = applyBlocksList(action.blocks, { category: 'exam' });
        blkCreated.forEach(o => created.push(o));
        if (action.deck && action.deck.name) {
            const r = applyCreateReviewDeck({ type: 'create_review_deck', name: action.deck.name, cards: action.deck.cards, linkPageId: pageId });
            mergeCreated(created, r);
        }
        if (pageId) addPageLinks(pageId, { blockIds });
        refreshAll();
        return { ok: created.length > 0, message: `Exam plan created (${created.length} object${created.length === 1 ? '' : 's'}).`, payload: { createdObjectIds: created, pageId } };
    }

    function applyCreateAssignmentPlan(action) {
        const created = [];
        // 1) Homework item.
        const hwRes = applyCreateHomework({ type: 'create_homework', title: action.title, courseName: action.courseName, dueDate: action.dueDate });
        let homeworkId = '';
        if (hwRes.ok && hwRes.payload) { homeworkId = hwRes.payload.homeworkId; mergeCreated(created, hwRes); }
        // 2) Outline note.
        let pageId = '';
        const noteBody = action.note || `# ${action.title}\n\n## Steps\n` + (action.steps || []).map(s => `- [ ] ${s}`).join('\n');
        const pageRes = applyCreatePage({ type: 'create_page', title: `${action.title} — plan`, body: noteBody });
        if (pageRes.ok && pageRes.payload) { pageId = pageRes.payload.pageId; mergeCreated(created, pageRes); }
        // 3) Task breakdown (linked to the note).
        const taskIds = [];
        (action.steps || []).forEach(step => {
            const title = typeof step === 'string' ? step : (step && step.title) || '';
            if (!title) return;
            const r = applyCreateTask({ type: 'create_task', title, dueDate: action.dueDate || '', priority: 'medium', linkPageId: pageId });
            if (r.ok && r.payload) { taskIds.push(r.payload.taskId); mergeCreated(created, r); }
        });
        // 4) Optional timeline blocks.
        const { created: blkCreated, blockIds } = applyBlocksList(action.blocks);
        blkCreated.forEach(o => created.push(o));
        if (pageId) addPageLinks(pageId, { taskIds, homeworkIds: homeworkId ? [homeworkId] : [], blockIds });
        refreshAll();
        return { ok: created.length > 0, message: `Assignment plan created (${created.length} object${created.length === 1 ? '' : 's'}).`, payload: { createdObjectIds: created, pageId } };
    }

    function applyBlockBatch(action) {
        const created = [];
        const { created: blkCreated } = applyBlocksList(action.blocks, action.type === 'plan_day' && action.date ? { date: action.date } : null);
        blkCreated.forEach(o => created.push(o));
        (action.tasks || []).forEach(t => {
            if (!t) return;
            const r = applyCreateTask({ type: 'create_task', title: typeof t === 'string' ? t : t.title, dueDate: (t && t.dueDate) || '', priority: (t && t.priority) || 'medium' });
            mergeCreated(created, r);
        });
        refreshAll();
        const verb = action.type === 'plan_week' ? 'Week planned' : (action.type === 'plan_day' ? 'Day planned' : 'Deadlines triaged');
        return { ok: created.length > 0, message: `${verb} (${created.length} object${created.length === 1 ? '' : 's'}).`, payload: { createdObjectIds: created } };
    }

    function applyConvertNote(action) {
        const created = [];
        const note = getActiveNoteSummary();
        const pageId = note && note.id;
        const deckSpec = action.deck || {};
        const r = applyCreateReviewDeck({ type: 'create_review_deck', name: deckSpec.name || (note ? note.title : 'Study deck'), cards: deckSpec.cards, linkPageId: pageId });
        mergeCreated(created, r);
        const { created: blkCreated, blockIds } = applyBlocksList(action.blocks);
        blkCreated.forEach(o => created.push(o));
        if (pageId) addPageLinks(pageId, { blockIds });
        refreshAll();
        return { ok: created.length > 0, message: `Study system built (${created.length} object${created.length === 1 ? '' : 's'}).`, payload: { createdObjectIds: created } };
    }

    function applyLinkObjects(action) {
        const ok = addPageLinks(action.pageId, {
            taskIds: action.taskIds, homeworkIds: action.homeworkIds, blockIds: action.blockIds, deckId: action.deckId
        });
        return ok ? { ok: true, message: 'Objects linked.' } : { ok: false, message: 'Could not link (page not found).' };
    }

    function applyOpenSource(action) {
        const kind = String(action.kind || '').toLowerCase();
        if (kind === 'page') {
            callApp('loadPage', action.id);
            callApp('setActiveView', 'notes');
            return { ok: true, message: 'Opened note.' };
        }
        if (kind === 'class') {
            callApp('openClassDashboardDrawer', action.id);
            return { ok: true, message: 'Opened class dashboard.' };
        }
        if (kind === 'deadline') {
            if (callApp('openDeadlineSource', { id: action.id }) !== undefined) return { ok: true, message: 'Opened source.' };
            callApp('openDeadlineRadar');
            return { ok: true, message: 'Opened Deadline Radar.' };
        }
        return { ok: false, message: 'Unknown source kind.' };
    }

    function applyStartFocus(action) {
        const minutes = Math.max(1, Number(action.minutes) || 25);
        const r = callApp('startFocusSession', action.taskId || null, { plannedDurationSeconds: minutes * 60, title: action.title || '' });
        return { ok: r !== undefined, message: r !== undefined ? `Focus session started (${minutes}m).` : 'Focus session not available.' };
    }

    function applyScheduleExisting(action) {
        const r = callApp('scheduleGenericItemAsBlock', {
            title: action.title, name: action.title, dueDate: action.dueDate || '', dueTime: action.dueTime || '', category: action.category || 'study'
        });
        return { ok: r !== undefined, message: r !== undefined ? 'Scheduled onto timeline.' : 'Scheduling not available.' };
    }

    function resolveCourseId(action) {
        if (action.courseId) return action.courseId;
        try {
            const courses = JSON.parse(localStorage.getItem('hwCourses:v2') || '[]');
            const lc = String(action.courseName || '').toLowerCase();
            const match = (Array.isArray(courses) ? courses : []).find(c => String(c.name || '').toLowerCase() === lc);
            return match ? match.id : '';
        } catch (e) { return ''; }
    }

    function applyOpenClassDashboard(action) {
        const courseId = resolveCourseId(action);
        if (!courseId) return { ok: false, message: 'No matching class found.' };
        callApp('openClassDashboardDrawer', courseId);
        return { ok: true, message: 'Opened class dashboard.' };
    }

    function applyRunDeadlineRadar() {
        const r = callApp('openDeadlineRadar');
        return { ok: r !== undefined, message: r !== undefined ? 'Opened Deadline Radar.' : 'Deadline Radar not available.' };
    }

    function applyRunWeeklyReview() {
        const r = callApp('createWeeklyReviewNote');
        return { ok: r !== undefined, message: 'Weekly Review note created.', payload: { createdObjectIds: [] } };
    }

    function applyQuickCapture(action) {
        const r = callApp('openQuickCaptureModal', action.text || '');
        return { ok: r !== undefined, message: r !== undefined ? 'Quick Capture opened.' : 'Quick Capture not available.' };
    }

    function applyChangeContextDepth(action) {
        if (typeof window.setWorkspacePreference === 'function') {
            window.setWorkspacePreference('assistant.contextDepth', action.depth);
            updateContextChip();
            return { ok: true, message: `Context depth set to ${action.depth}.` };
        }
        return { ok: false, message: 'Settings not available.' };
    }

    function canvasApi() {
        return (typeof window !== 'undefined' && window.SutraCanvas) ? window.SutraCanvas : null;
    }

    function applyCanvasAddSticky(action) {
        const api = canvasApi();
        if (!api || typeof api.addSticky !== 'function') return { ok: false, message: 'Canvas is not available.' };
        const object = api.addSticky(action.text, action.color ? { fill: action.color } : {});
        return object ? { ok: true, message: 'Added Canvas sticky note.', payload: { canvasObjectId: object.id } } : { ok: false, message: 'Could not add Canvas sticky note.' };
    }

    function applyCanvasAddText(action) {
        const api = canvasApi();
        if (!api || typeof api.addText !== 'function') return { ok: false, message: 'Canvas is not available.' };
        const object = api.addText(action.text);
        return object ? { ok: true, message: 'Added Canvas text card.', payload: { canvasObjectId: object.id } } : { ok: false, message: 'Could not add Canvas text.' };
    }

    function applyCanvasCreateTaskFromSelection() {
        const api = canvasApi();
        if (!api || typeof api.createTaskFromSelection !== 'function') return { ok: false, message: 'Canvas is not available.' };
        const task = api.createTaskFromSelection();
        return task ? { ok: true, message: 'Created task from Canvas selection.', payload: { taskId: task.id } } : { ok: false, message: 'Select Canvas text first.' };
    }

    function applyCanvasCreateNoteFromSelection() {
        const api = canvasApi();
        if (!api || typeof api.convertSelectionToNote !== 'function') return { ok: false, message: 'Canvas is not available.' };
        const result = api.convertSelectionToNote();
        if (result && typeof result.then === 'function') {
            result.then(() => showToast('Canvas note creation completed.')).catch(() => showToast('Canvas note creation canceled.'));
            return { ok: true, message: 'Opened Canvas note creation dialog.' };
        }
        return result ? { ok: true, message: 'Created note from Canvas selection.' } : { ok: false, message: 'Select Canvas text first.' };
    }

    function applyCanvasGroupSelection(action) {
        const api = canvasApi();
        if (!api || typeof api.group !== 'function') return { ok: false, message: 'Canvas is not available.' };
        const group = api.group(null, action.label || 'Group');
        return group ? { ok: true, message: 'Grouped selected Canvas objects.', payload: { canvasGroupId: group.id } } : { ok: false, message: 'Select two or more Canvas objects first.' };
    }

    // --------------------------------------------------------------
    // Apply with activity logging + undo
    // --------------------------------------------------------------
    function getActivityMeta() {
        let provider = '';
        let model = '';
        try {
            const sel = document.getElementById('chatProviderSelect');
            if (sel) provider = sel.value || '';
            const m = document.getElementById('chatModelSelect');
            const c = document.getElementById('chatCustomModelInput');
            model = (c && c.value) || (m && m.value) || '';
        } catch (e) { /* ignore */ }
        return { provider, model, userPrompt: lastUserPrompt };
    }

    function snapshotActivePage() {
        try {
            const note = getActiveNoteSummary();
            if (!note || !note.id) return null;
            const b = bridge();
            const pages = b ? b.pages : window.pages;
            const page = (pages || []).find(p => p && p.id === note.id);
            if (!page) return null;
            return { pageId: page.id, content: page.content, body: page.body };
        } catch (e) { return null; }
    }

    function applyActionLogged(action, meta) {
        const m = Object.assign(getActivityMeta(), meta || {});
        // Capture a before-snapshot for reversible note edits.
        let beforeSnapshot = m.beforeSnapshot || null;
        if (!beforeSnapshot && (action.type === 'insert_text' || action.type === 'replace_selection')) {
            beforeSnapshot = snapshotActivePage();
        }
        const result = applyAction(action);
        if (result && result.ok) {
            const i = intel();
            if (i) {
                const createdObjectIds = (result.payload && result.payload.createdObjectIds) || [];
                const reversible = createdObjectIds.length > 0 || !!beforeSnapshot;
                i.logActivity({
                    actionType: action.type,
                    summary: describeAction(action),
                    userPrompt: m.userPrompt || '',
                    provider: m.provider || '',
                    model: m.model || '',
                    confidence: m.confidence != null ? m.confidence : null,
                    createdObjectIds,
                    beforeSnapshot,
                    batchId: m.batchId || null,
                    reversible
                });
            }
        }
        return result;
    }

    function deleteObject(kind, id) {
        try {
            const b = bridge();
            if (kind === 'task') {
                const tasks = b ? b.tasks : window.tasks;
                const idx = (tasks || []).findIndex(t => t && t.id === id);
                if (idx >= 0) { tasks.splice(idx, 1); return true; }
            } else if (kind === 'timeline') {
                const blocks = b ? b.timeBlocks : window.timeBlocks;
                const idx = (blocks || []).findIndex(x => x && x.id === id);
                if (idx >= 0) { blocks.splice(idx, 1); if (b) safeCall(b.saveTimeBlocks); else safeCall(window.saveTimeBlocks); return true; }
            } else if (kind === 'page') {
                const pages = b ? b.pages : window.pages;
                const idx = (pages || []).findIndex(p => p && p.id === id);
                if (idx >= 0) { pages.splice(idx, 1); return true; }
            } else if (kind === 'homework') {
                const tasks = JSON.parse(localStorage.getItem('hwTasks:v2') || '[]');
                const next = (Array.isArray(tasks) ? tasks : []).filter(t => t && t.id !== id);
                safeHwWrite('hwTasks:v2', JSON.stringify(next));
                notifyHomeworkChanged();
                return true;
            } else if (kind === 'reviewDeck') {
                if (typeof window.deleteReviewDeck === 'function') { window.deleteReviewDeck(id); return true; }
                return false; // cannot reverse without the helper
            }
        } catch (e) { console.warn('deleteObject failed:', kind, id, e); }
        return false;
    }

    function undoActivity(id) {
        const i = intel();
        if (!i) return { ok: false, message: 'Activity log unavailable.' };
        const rec = i.getActivityRecord(id);
        if (!rec) return { ok: false, message: 'Record not found.' };
        if (rec.status === 'undone') return { ok: false, message: 'Already undone.' };
        if (!rec.reversible) return { ok: false, message: 'This action is not reversible.' };
        let removed = 0;
        (rec.createdObjectIds || []).forEach(o => { if (deleteObject(o.kind, o.id)) removed += 1; });
        if (rec.beforeSnapshot && rec.beforeSnapshot.pageId) {
            const b = bridge();
            const pages = b ? b.pages : window.pages;
            const page = (pages || []).find(p => p && p.id === rec.beforeSnapshot.pageId);
            if (page) {
                if (rec.beforeSnapshot.content != null) page.content = rec.beforeSnapshot.content;
                if (rec.beforeSnapshot.body != null) page.body = rec.beforeSnapshot.body;
                callApp('loadPage', page.id);
            }
        }
        i.updateActivityRecord(id, { status: 'undone', undoneAt: new Date().toISOString() });
        const b2 = bridge();
        if (b2) { safeCall(b2.persistAppData); safeCall(b2.renderTaskViews); safeCall(b2.renderPagesList); }
        else { safeCall(window.persistAppData); safeCall(window.renderTaskViews); safeCall(window.renderPagesList); }
        return { ok: true, message: `Undone — ${removed} object(s) removed.` };
    }

    // --------------------------------------------------------------
    // Assignment import review table
    // --------------------------------------------------------------
    function renderImportReview(hostEl, action) {
        const i = intel();
        const raw = Array.isArray(action.assignments) ? action.assignments : [];
        const rows = i ? i.normalizeImportBatch(raw) : raw.map((r, idx) => Object.assign({ rowId: 'imp_' + idx, destinations: ['homework'], ambiguity: [], suggestedDestinations: ['homework'] }, r));
        const wrap = document.createElement('div');
        wrap.className = 'flow-import-review';
        const DEST = ['homework', 'tasks', 'timeline', 'notes', 'review', 'today'];

        const head = document.createElement('div');
        head.className = 'flow-import-head';
        head.innerHTML = `<strong>Review ${rows.length} parsed assignment${rows.length === 1 ? '' : 's'}</strong>
            <span class="flow-import-hint">Edit fields, pick destinations, remove rows, then apply. Duplicates are flagged.</span>`;
        wrap.appendChild(head);

        const table = document.createElement('div');
        table.className = 'flow-import-table';
        wrap.appendChild(table);

        function renderRows() {
            table.innerHTML = '';
            rows.forEach((row) => {
                if (row.__removed) return;
                const card = document.createElement('div');
                card.className = 'flow-import-row';
                if (row.duplicate) card.classList.add('flow-import-dup');
                const conf = Math.round((row.confidence || 0) * 100);
                card.innerHTML = `
                    <div class="flow-import-row-main">
                        <input class="flow-imp-title" data-row="${esc(row.rowId)}" value="${esc(row.title)}" placeholder="Assignment title" />
                        <input class="flow-imp-course" data-row="${esc(row.rowId)}" value="${esc(row.course)}" placeholder="Course" />
                        <input class="flow-imp-date" data-row="${esc(row.rowId)}" value="${esc(row.dueDate)}" placeholder="YYYY-MM-DD" />
                        <select class="flow-imp-type" data-row="${esc(row.rowId)}">${(i ? i.ASSIGNMENT_TYPES : ['homework']).map(t => `<option value="${esc(t)}"${t === row.type ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
                        <button type="button" class="flow-imp-remove" data-row="${esc(row.rowId)}" title="Remove row">✕</button>
                    </div>
                    <div class="flow-import-row-meta">
                        <span class="flow-imp-conf" title="parse confidence">conf ${conf}%</span>
                        ${(row.ambiguity || []).map(a => `<span class="flow-imp-amb">${esc(a)}</span>`).join('')}
                        ${row.duplicate ? `<span class="flow-imp-dupflag" title="${esc(row.duplicate.title || '')}">possible duplicate (${esc(row.duplicate.kind)})</span>` : ''}
                    </div>
                    <div class="flow-import-row-dests">
                        ${DEST.map(d => `<label class="flow-imp-dest"><input type="checkbox" data-row="${esc(row.rowId)}" data-dest="${d}"${(row.destinations || []).includes(d) ? ' checked' : ''}/> ${d}</label>`).join('')}
                    </div>`;
                table.appendChild(card);
            });
            if (!table.children.length) {
                table.innerHTML = '<div class="flow-import-empty">All rows removed.</div>';
            }
        }

        const findRow = (id) => rows.find(r => r.rowId === id);
        table.addEventListener('input', (e) => {
            const t = e.target;
            const id = t.getAttribute && t.getAttribute('data-row');
            if (!id) return;
            const row = findRow(id);
            if (!row) return;
            if (t.classList.contains('flow-imp-title')) row.title = t.value;
            else if (t.classList.contains('flow-imp-course')) row.course = t.value;
            else if (t.classList.contains('flow-imp-date')) row.dueDate = t.value.trim();
            else if (t.classList.contains('flow-imp-type')) row.type = t.value;
        });
        table.addEventListener('change', (e) => {
            const t = e.target;
            if (t.type === 'checkbox' && t.getAttribute('data-dest')) {
                const id = t.getAttribute('data-row');
                const row = findRow(id);
                if (!row) return;
                const dest = t.getAttribute('data-dest');
                row.destinations = row.destinations || [];
                if (t.checked) { if (!row.destinations.includes(dest)) row.destinations.push(dest); }
                else row.destinations = row.destinations.filter(d => d !== dest);
            }
        });
        table.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('.flow-imp-remove');
            if (btn) {
                const row = findRow(btn.getAttribute('data-row'));
                if (row) { row.__removed = true; renderRows(); }
            }
        });

        const footer = document.createElement('div');
        footer.className = 'flow-import-foot';
        const applyAllBtn = document.createElement('button');
        applyAllBtn.type = 'button';
        applyAllBtn.className = 'flow-action-apply-all';
        applyAllBtn.textContent = 'Apply all';
        const skipDupLabel = document.createElement('label');
        skipDupLabel.className = 'flow-import-skipdup';
        skipDupLabel.innerHTML = '<input type="checkbox" id="flowImpSkipDup" checked/> Skip flagged duplicates';
        const status = document.createElement('div');
        status.className = 'flow-import-status';
        footer.appendChild(skipDupLabel);
        footer.appendChild(applyAllBtn);
        footer.appendChild(status);
        wrap.appendChild(footer);

        applyAllBtn.addEventListener('click', () => {
            applyAllBtn.disabled = true;
            const skipDup = document.getElementById('flowImpSkipDup');
            const batchId = makeId('batch');
            const created = [];
            let applied = 0, skipped = 0;
            rows.forEach(row => {
                if (row.__removed) return;
                if (!row.title) { skipped += 1; return; }
                if (row.duplicate && skipDup && skipDup.checked) { skipped += 1; return; }
                (row.destinations || []).forEach(dest => {
                    let res = null;
                    if (dest === 'homework') res = applyCreateHomework({ type: 'create_homework', title: row.title, courseName: row.course, dueDate: row.dueDate, difficulty: row.difficulty });
                    else if (dest === 'tasks' || dest === 'today') res = applyCreateTask({ type: 'create_task', title: row.title, dueDate: row.dueDate, priority: row.priority || 'medium' });
                    else if (dest === 'timeline' && row.dueDate) res = applyCreateTimelineBlock({ type: 'create_timeline_block', name: row.title, date: row.dueDate, start: '16:00', end: '17:00', category: 'study' });
                    else if (dest === 'notes') res = applyCreatePage({ type: 'create_page', title: row.title, body: `# ${row.title}\n\n${row.sourceText || ''}` });
                    else if (dest === 'review') res = applyCreateReviewDeck({ type: 'create_review_deck', name: row.title });
                    if (res && res.ok) { applied += 1; mergeCreated(created, res); }
                });
            });
            const i2 = intel();
            if (i2 && created.length) {
                const meta = getActivityMeta();
                i2.logActivity({
                    actionType: 'import_assignments',
                    summary: `Imported ${applied} destination write(s) from ${rows.filter(r => !r.__removed).length} assignment(s)`,
                    userPrompt: meta.userPrompt, provider: meta.provider, model: meta.model,
                    createdObjectIds: created, batchId, reversible: true
                });
            }
            refreshAll();
            status.textContent = `✓ Applied ${applied} write(s)${skipped ? `, skipped ${skipped}` : ''}.`;
            showToast(`Imported ${applied} item write(s).`);
        });

        renderRows();
        hostEl.appendChild(wrap);
    }

    // --------------------------------------------------------------
    // Natural-language command layer
    // --------------------------------------------------------------
    // Returns { handled:true, message } when it recognized & executed a command,
    // otherwise { handled:false } so the caller sends the text to the model.
    function tryHandleCommand(rawText) {
        const text = String(rawText || '').trim();
        if (!text) return { handled: false };
        const lc = text.toLowerCase();
        const viewMap = {
            today: 'today', notes: 'notes', note: 'notes', homework: 'homework', timeline: 'timeline',
            calendar: 'timeline', review: 'review', cram: 'cramhub', 'cram hub': 'cramhub',
            college: 'collegeapp', 'ap study': 'apstudy', ap: 'apstudy', life: 'life', business: 'business', settings: 'settings'
        };

        const m = (re) => lc.match(re);

        // Deadline radar
        if (/\b(open|run|show)\b.*\bdeadline radar\b/.test(lc) || /^deadline radar$/.test(lc)) {
            callApp('openDeadlineRadar'); return { handled: true, message: 'Opened Deadline Radar.' };
        }
        // Weekly review
        if (/\b(create|make|start|new)\b.*\bweekly review\b/.test(lc)) {
            callApp('createWeeklyReviewNote'); return { handled: true, message: 'Created a Weekly Review note.' };
        }
        // Export backup
        if (/\b(export|backup)\b.*\b(\.?atelier|backup|workspace)\b/.test(lc) || /^export( backup)?$/.test(lc)) {
            if (callApp('exportWorkspaceAsAtelier') !== undefined || callApp('exportWorkspaceAsAtelierPackage') !== undefined) {
                return { handled: true, message: 'Exporting your .sutra backup…' };
            }
        }
        // Open settings section
        const settingsSec = m(/open settings(?:\s*(?:to|section)?\s*([a-z ]+))?/);
        if (settingsSec) {
            callApp('setActiveView', 'settings');
            const sec = (settingsSec[1] || '').trim();
            if (sec) {
                try { const nav = document.querySelector(`[data-settings-nav="${sec.split(' ')[0]}"]`); if (nav) nav.click(); } catch (e) { /* ignore */ }
            }
            return { handled: true, message: 'Opened Settings.' };
        }
        // Focus session
        const focus = m(/\b(start|begin)\b.*\bfocus( session)?\b(?:.*?(\d{1,3})\s*min)?/);
        if (focus) {
            const mins = Number(focus[3]) || 25;
            callApp('startFocusSession', null, { plannedDurationSeconds: mins * 60 });
            return { handled: true, message: `Started a ${mins}-minute focus session.` };
        }
        // Search workspace
        const search = m(/^(?:search|find)\s+(?:for\s+)?(.+)/);
        if (search && search[1]) {
            callApp('openGlobalSearchPanel', search[1].trim());
            return { handled: true, message: `Searching for "${search[1].trim()}"…` };
        }
        // Open a specific note by title
        const openNote = m(/\bopen\b.*\bnote\b(?:\s*(?:called|titled|named)?\s*["']?(.+?)["']?)?$/);
        if (openNote && openNote[1]) {
            const q = openNote[1].trim();
            const b = bridge();
            const pages = b ? b.pages : window.pages;
            const i = intel();
            const match = (pages || []).find(p => p && p.title && (i ? i.titleSimilarity(p.title, q) >= 0.5 : String(p.title).toLowerCase().includes(q.toLowerCase())));
            if (match) { callApp('loadPage', match.id); callApp('setActiveView', 'notes'); return { handled: true, message: `Opened "${match.title}".` }; }
            return { handled: true, message: `No note matching "${q}" found.` };
        }
        // Class dashboard
        const classDash = m(/\bopen\b.*\bclass( dashboard)?\b(?:\s*(?:for)?\s*(.+))?$/);
        if (classDash && classDash[2]) {
            const courseId = resolveCourseId({ courseName: classDash[2].trim() });
            if (courseId) { callApp('openClassDashboardDrawer', courseId); return { handled: true, message: 'Opened class dashboard.' }; }
            return { handled: true, message: 'No matching class found.' };
        }
        // Navigate to a tab ("go to / open / switch to <view>")
        const nav = m(/\b(?:go to|open|switch to|show me|navigate to)\b\s+(?:the\s+)?([a-z ]+?)(?:\s+(?:tab|view|page))?$/);
        if (nav && nav[1]) {
            const key = nav[1].trim();
            const view = viewMap[key];
            if (view) { callApp('setActiveView', view); return { handled: true, message: `Switched to ${view}.` }; }
        }
        return { handled: false };
    }

    // --------------------------------------------------------------
    // Activity log modal
    // --------------------------------------------------------------
    function openActivityLog() {
        const i = intel();
        const log = i ? i.getActivityLog() : [];
        let overlay = document.getElementById('flowActivityOverlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'flowActivityOverlay';
        overlay.className = 'flow-modal-overlay';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        const rows = log.map(r => `
            <div class="flow-act-row" data-id="${esc(r.id)}">
                <div class="flow-act-main">
                    <span class="flow-act-type">${esc(r.actionType)}</span>
                    <span class="flow-act-summary">${esc(r.summary || '')}</span>
                </div>
                <div class="flow-act-meta">
                    <span>${esc(new Date(r.timestamp).toLocaleString())}</span>
                    ${r.provider ? `<span>${esc(r.provider)}${r.model ? ' · ' + esc(r.model) : ''}</span>` : ''}
                    <span class="flow-act-status flow-act-${esc(r.status)}">${esc(r.status)}</span>
                    ${(r.reversible && r.status !== 'undone') ? `<button type="button" class="flow-act-undo" data-undo="${esc(r.id)}">Undo</button>` : (r.reversible ? '' : '<span class="flow-act-noundo">not reversible</span>')}
                </div>
            </div>`).join('');
        overlay.innerHTML = `
            <div class="flow-modal" role="dialog" aria-label="Assistant Activity">
                <div class="flow-modal-head">
                    <strong>Assistant Activity</strong>
                    <div>
                        <button type="button" class="flow-modal-clear" id="flowActClear">Clear</button>
                        <button type="button" class="flow-modal-close" id="flowActClose">Close</button>
                    </div>
                </div>
                <div class="flow-modal-body">${rows || '<div class="flow-act-empty">No assistant actions recorded yet.</div>'}</div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#flowActClose').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#flowActClear').addEventListener('click', () => { if (i) i.clearActivityLog(); overlay.remove(); openActivityLog(); });
        overlay.querySelectorAll('[data-undo]').forEach(btn => {
            btn.addEventListener('click', () => {
                const res = undoActivity(btn.getAttribute('data-undo'));
                showToast(res.message);
                overlay.remove();
                openActivityLog();
            });
        });
    }

    // --------------------------------------------------------------
    // Context transparency modal
    // --------------------------------------------------------------
    function buildInspectableContext() {
        const ctx = getFlowAssistantContext({});
        const cap = getVisionCapability();
        return {
            view: ctx.view,
            depth: ctx.depth,
            includeSelection: getPref('assistant.includeSelectionByDefault', true) !== false,
            selection: ctx.selection ? `[${String(ctx.selection).length} chars]` + (ctx.selection.length > 120 ? '' : '') : null,
            chatMemoryMode: getChatMemoryMode(),
            chatMemoryDepth: getChatMemoryMode() === 'stateful' ? getChatMemoryDepth() : null,
            visionCapability: cap,
            attachments: pendingAttachments.length,
            context: ctx
        };
    }

    function showContextModal() {
        const data = buildInspectableContext();
        let overlay = document.getElementById('flowContextOverlay');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'flowContextOverlay';
        overlay.className = 'flow-modal-overlay';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        let json = '{}';
        try { json = JSON.stringify(data, null, 2); } catch (e) { /* ignore */ }
        overlay.innerHTML = `
            <div class="flow-modal" role="dialog" aria-label="Context being sent">
                <div class="flow-modal-head">
                    <strong>Context Sutra sends</strong>
                    <button type="button" class="flow-modal-close" id="flowCtxClose">Close</button>
                </div>
                <div class="flow-modal-body">
                    <p class="flow-ctx-note">This is the exact bounded JSON sent with your next message. Sensitive fields are redacted. Selected text inclusion is controlled in Settings ▸ Assistant.</p>
                    <pre class="flow-ctx-pre">${esc(json)}</pre>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#flowCtxClose').addEventListener('click', () => overlay.remove());
    }

    // --------------------------------------------------------------
    // File attachments (registry-driven)
    // --------------------------------------------------------------
    // Each pending attachment: { name, mediaType, sizeBytes, category,
    //   dataUrl, extractedText, processingPlan, planLabel, compatible,
    //   reason, blocked, error }.
    // Selecting/attaching/previewing NEVER uploads anything — files are read
    // locally (FileReader / JSZip) and only leave the device when the user
    // explicitly sends a message or starts generation. Incompatible files stay
    // visible and BLOCK the send (no silent drop, no silent model switch).
    let pendingAttachments = [];
    let lastUserPrompt = '';

    const VISION_MODEL_HINTS = /(gpt-4o|gpt-4\.1|gpt-5|o1|o3|o4|claude-3|claude-4|claude-opus|claude-sonnet|claude-haiku|gemini-1\.5|gemini-2|gemini-flash|gemini-pro|vision|llava|scout|maverick|pixtral|qwen.*vl)/i;

    function getActiveProviderModel() {
        let provider = '';
        let model = '';
        try {
            const sel = document.getElementById('chatProviderSelect');
            provider = (sel && sel.value) || '';
            const m = document.getElementById('chatModelSelect');
            const c = document.getElementById('chatCustomModelInput');
            model = (c && c.value) || (m && m.value) || '';
        } catch (e) { /* ignore */ }
        return { provider: provider, model: model };
    }

    function getVisionCapability() {
        const active = getActiveProviderModel();
        const provider = active.provider;
        const model = active.model;
        if (provider === 'local') {
            const supported = getPref('assistant.localEndpoint.visionCapable', false) === true;
            return { provider, model, supported, reason: supported ? 'Local endpoint marked vision-capable.' : 'Local endpoint not marked vision-capable (Settings ▸ Assistant).' };
        }
        const visionProviders = ['openai', 'anthropic', 'gemini', 'openrouter'];
        if (!visionProviders.includes(provider)) {
            return { provider, model, supported: false, reason: `${provider || 'This provider'} does not support image input here. Use pasted text instead.` };
        }
        if (model && VISION_MODEL_HINTS.test(model)) {
            return { provider, model, supported: true, reason: 'Selected model appears to support image input.' };
        }
        return { provider, model, supported: false, reason: 'Selected model may be text-only. Choose a vision-capable model (e.g. GPT-4o, Claude 3+, Gemini 1.5+) to attach images.' };
    }

    function capabilityRegistry() {
        return (typeof window !== 'undefined' && window.SutraModelCapabilities) ? window.SutraModelCapabilities : null;
    }

    // Compute the processing plan for one attachment against the CURRENT
    // provider/model. Local-endpoint vision opt-in overrides the registry's
    // conservative image verdict.
    function planAttachment(att) {
        const reg = capabilityRegistry();
        const active = getActiveProviderModel();
        if (!reg) {
            // Registry missing (should not happen): only images via the legacy
            // vision heuristic; everything else is unsupported.
            const isImage = /^image\//.test(att.mediaType || '');
            const cap = getVisionCapability();
            return {
                plan: isImage && cap.supported ? 'native-image' : 'unsupported-format',
                label: isImage && cap.supported ? 'Analyzed as image' : 'Format not supported',
                compatible: !!(isImage && cap.supported),
                blocked: false,
                reason: cap.reason || '',
                category: isImage ? 'image' : 'unknown'
            };
        }
        const plan = reg.determineAttachmentProcessingPlan(active.provider, active.model, {
            name: att.name, mimeType: att.mediaType, sizeBytes: att.sizeBytes
        });
        if (!plan.compatible && plan.category === 'image' && active.provider === 'local'
            && getPref('assistant.localEndpoint.visionCapable', false) === true) {
            return { plan: 'native-image', label: 'Analyzed as image', compatible: true, blocked: false, reason: 'Local endpoint marked vision-capable.', category: 'image' };
        }
        if (plan.compatible && plan.plan === 'local-extraction' && att.extractionFailed) {
            return { plan: 'extraction-failed', label: 'Could not read file content', compatible: false, blocked: false, reason: att.error || 'The file could not be converted to text on this device.', category: plan.category };
        }
        return plan;
    }

    function applyPlanToAttachment(att) {
        const plan = planAttachment(att);
        att.processingPlan = plan.plan;
        att.planLabel = plan.label;
        att.compatible = plan.compatible !== false;
        att.blocked = plan.blocked === true;
        att.reason = plan.reason || '';
        att.category = plan.category || att.category || 'unknown';
        return att;
    }

    // Re-plan every pending attachment (model/provider switched).
    function refreshAttachmentPlans() {
        pendingAttachments.forEach(applyPlanToAttachment);
        updateAttachmentChips();
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('read failed'));
            reader.readAsDataURL(file);
        });
    }

    function readFileAsText(file, maxChars) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || '').slice(0, maxChars));
            reader.onerror = () => reject(reader.error || new Error('read failed'));
            reader.readAsText(file);
        });
    }

    // Bounded DOCX/PPTX text extraction via the vendored JSZip. The zip is
    // only INSPECTED (named XML entries decoded as text) — nothing inside is
    // executed or rendered, nested archives are never opened, and entry count
    // plus per-entry and total output sizes are hard-capped (zip-bomb guard).
    async function extractOfficeText(file, ext, limits) {
        if (typeof window.JSZip === 'undefined') throw new Error('Archive reader unavailable');
        const zip = await window.JSZip.loadAsync(file);
        const names = Object.keys(zip.files || {});
        if (names.length > limits.maxZipEntries) throw new Error('File has too many internal entries');
        let xmlNames = [];
        if (ext === 'docx') {
            xmlNames = names.filter(n => n === 'word/document.xml');
        } else if (ext === 'pptx') {
            xmlNames = names.filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => {
                const na = Number((a.match(/slide(\d+)/) || [])[1] || 0);
                const nb = Number((b.match(/slide(\d+)/) || [])[1] || 0);
                return na - nb;
            });
        }
        if (!xmlNames.length) throw new Error('No readable text found in this file');
        let out = '';
        for (const name of xmlNames) {
            const entry = zip.files[name];
            if (!entry || entry.dir) continue;
            const xml = await entry.async('string');
            if (xml.length > limits.maxZipEntryBytes) throw new Error('Internal entry too large to extract safely');
            // Pull text runs; insert paragraph breaks at block boundaries.
            const text = xml
                .replace(/<\/(w:p|a:p)>/g, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (mch, code) => {
                    const n = Number(code);
                    return n > 31 && n < 1114112 ? String.fromCodePoint(n) : ' ';
                })
                .replace(/[ \t]+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            if (ext === 'pptx' && text) out += `\n\n[Slide ${(name.match(/slide(\d+)/) || [])[1] || ''}]\n`;
            out += text;
            if (out.length >= limits.maxOutputChars) {
                out = out.slice(0, limits.maxOutputChars);
                break;
            }
        }
        if (!out.trim()) throw new Error('No readable text found in this file');
        return out;
    }

    async function addAttachmentFromFile(file) {
        if (!file) return false;
        const reg = capabilityRegistry();
        const limits = reg ? reg.LOCAL_EXTRACTION_LIMITS : { maxOutputChars: 400000, maxZipEntries: 400, maxZipEntryBytes: 8388608 };
        const att = {
            name: file.name || 'attachment',
            mediaType: file.type || '',
            sizeBytes: file.size || 0,
            dataUrl: '',
            extractedText: '',
            extractionFailed: false,
            error: ''
        };
        applyPlanToAttachment(att);
        try {
            if (att.processingPlan === 'native-image' || att.processingPlan === 'native-pdf'
                || (!att.blocked && (att.category === 'image' || att.category === 'pdf'))) {
                // Keep the local payload even when the current model can't take
                // it — switching to a compatible model must not require re-attaching.
                att.dataUrl = await readFileAsDataUrl(file);
            } else if (att.category === 'text' || att.category === 'code' || att.category === 'svg') {
                att.extractedText = await readFileAsText(file, limits.maxOutputChars);
            } else if (!att.blocked && (att.category === 'document' || att.category === 'presentation')) {
                const ext = String(att.name).toLowerCase().split('.').pop();
                if (ext === 'docx' || ext === 'pptx') {
                    att.extractedText = await extractOfficeText(file, ext, limits);
                }
            }
        } catch (err) {
            att.extractionFailed = true;
            att.error = err && err.message ? err.message : 'Could not read this file.';
        }
        applyPlanToAttachment(att);
        pendingAttachments.push(att);
        updateAttachmentChips();
        return att.compatible;
    }

    function clearAttachments() { pendingAttachments = []; updateAttachmentChips(); }
    function getAttachments() { return pendingAttachments.slice(); }

    // Called by sendChat as the FINAL attachment gate: re-plans everything
    // against the provider/model actually being used, updates the chips, and
    // reports problems + compatible-model suggestions. ok === false blocks
    // the send.
    function validateAttachmentsForSend(provider, model) {
        if (!pendingAttachments.length) return { ok: true, problems: [], suggestions: [] };
        const reg = capabilityRegistry();
        pendingAttachments.forEach(applyPlanToAttachment);
        updateAttachmentChips();
        const problems = [];
        pendingAttachments.forEach((att, index) => {
            if (!att.compatible) {
                problems.push({ index, name: att.name, plan: { plan: att.processingPlan, label: att.planLabel, reason: att.reason } });
            }
        });
        if (reg) {
            const setCheck = reg.validateAttachmentSet(provider, model, pendingAttachments);
            setCheck.problems.forEach(p => { if (p.index === -1) problems.push(p); });
        }
        let suggestions = [];
        if (problems.length && reg) {
            const categories = Array.from(new Set(pendingAttachments.filter(a => !a.compatible).map(a => a.category)));
            categories.forEach(cat => { suggestions = suggestions.concat(reg.suggestCompatibleModels(cat)); });
        }
        return { ok: problems.length === 0, problems, suggestions };
    }

    function attachmentStatusIcon(att) {
        if (att.blocked) return '⛔';
        if (!att.compatible) return '⚠️';
        if (att.processingPlan === 'local-extraction') return '📄';
        if (att.processingPlan === 'native-pdf') return '📕';
        if (att.processingPlan === 'native-image') return '🖼️';
        return '📎';
    }

    function formatAttachmentSize(bytes) {
        const b = Number(bytes) || 0;
        if (!b) return '';
        if (b < 1024) return b + ' B';
        if (b < 1048576) return Math.round(b / 1024) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function updateAttachmentChips() {
        const host = document.getElementById('flowAttachmentChips');
        if (!host) return;
        if (!pendingAttachments.length) { host.innerHTML = ''; host.hidden = true; return; }
        host.hidden = false;
        host.innerHTML = pendingAttachments.map((a, idx) => {
            const stateClass = a.blocked ? 'is-blocked' : (a.compatible ? 'is-ok' : 'is-incompatible');
            const srLabel = `${a.name}, ${formatAttachmentSize(a.sizeBytes) || 'unknown size'}, ${a.planLabel}${a.compatible ? '' : '. ' + (a.reason || 'Incompatible with the selected model.')}`;
            return `<span class="flow-attach-chip ${stateClass}" title="${esc(a.reason || a.planLabel || '')}">
                <span class="flow-attach-ico" aria-hidden="true">${attachmentStatusIcon(a)}</span>
                <span class="flow-attach-main">
                    <span class="flow-attach-name">${esc(truncate(a.name, 30))}</span>
                    <span class="flow-attach-meta">${esc([formatAttachmentSize(a.sizeBytes), a.planLabel].filter(Boolean).join(' · '))}</span>
                </span>
                <span class="sr-only">${esc(srLabel)}</span>
                <button type="button" data-attach-remove="${idx}" aria-label="Remove attachment ${esc(a.name)}">✕</button>
            </span>`;
        }).join('');
        // Contextual entry point: a study-worthy attachment (PDF/document)
        // offers one-click study-material generation through the shared
        // Sutra Intelligence harness.
        const studySourceIdx = pendingAttachments.findIndex(a =>
            (a.category === 'pdf' || a.category === 'document' || a.category === 'presentation') && !a.blocked);
        if (studySourceIdx !== -1 && window.SutraStudyMaterials && typeof window.SutraStudyMaterials.openGenerator === 'function') {
            const genWrap = document.createElement('div');
            genWrap.className = 'flow-attach-generate-row';
            genWrap.innerHTML = `<button type="button" class="flow-chip-btn flow-attach-generate" id="flowGenerateStudyBtn">✨ Generate Study Materials <span class="sutra-exp-badge" role="note">Experimental<span class="sr-only"> feature</span></span></button>`;
            host.appendChild(genWrap);
            genWrap.querySelector('#flowGenerateStudyBtn').addEventListener('click', () => {
                const att = pendingAttachments[studySourceIdx];
                window.SutraStudyMaterials.openGenerator({ source: { kind: 'attachment', attachment: att } });
            });
        }
        host.querySelectorAll('[data-attach-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.getAttribute('data-attach-remove'));
                pendingAttachments.splice(idx, 1);
                updateAttachmentChips();
            });
        });
    }

    // --------------------------------------------------------------
    // Data-aware quick actions
    // --------------------------------------------------------------
    function buildContextualQuickActions(view) {
        const v = String(view || getActiveViewName());
        const items = [];
        const i = intel();
        let ctx = null;
        try { ctx = i ? i.deriveStudentContext() : null; } catch (e) { ctx = null; }
        const selection = getEditorSelection();
        const canvasContext = getCanvasContextSummary();

        // Context-sensitive first.
        if (canvasContext) {
            items.push({ label: 'Canvas map', prompt: 'Look at this Canvas summary and suggest a concept-map structure. Propose Canvas actions only if they clearly improve the active Canvas.' });
            items.push({ label: 'Canvas selection → task', prompt: 'Turn the selected Canvas content into a task. Propose one canvas_create_task_from_selection action.' });
            items.push({ label: 'Group selection', prompt: 'If the selected Canvas objects belong together, propose one canvas_group_selection action with a concise label.' });
        }
        if (selection) {
            items.push({ label: 'Selection → tasks', prompt: 'Turn the selected text into concrete tasks. Propose create_task actions, one per task.' });
            items.push({ label: 'Selection → cards', prompt: 'Turn the selected text into review cards. Propose a create_review_deck action with front/back pairs.' });
        }
        if (v === 'notes') {
            items.push({ label: 'Make study system', prompt: 'Turn this note into a study system. Propose a convert_note_to_study_system action with a deck and a couple of study blocks.' });
        }
        if (ctx) {
            if (ctx.overdueCount > 0) items.push({ label: `Recover ${ctx.overdueCount} overdue`, prompt: 'I have overdue work. Propose a triage_deadlines action to recover it realistically around my routine.' });
            if (ctx.overloadedDays && ctx.overloadedDays.length) items.push({ label: 'Rebalance today', prompt: 'Today/this week looks overloaded. Propose a plan_day action that rebalances my schedule realistically.' });
            if (ctx.lowConfidenceApSubjects && ctx.lowConfidenceApSubjects.length) {
                const s = ctx.lowConfidenceApSubjects[0];
                items.push({ label: `Build AP plan: ${truncate(s.name, 14)}`, prompt: `Build an exam plan for ${s.name} (exam ${s.examDate}). Propose a create_exam_plan action with study blocks and a review deck.` });
            }
            if (ctx.missingExamBlocks && ctx.missingExamBlocks.length) {
                const e = ctx.missingExamBlocks[0];
                items.push({ label: `Schedule ${truncate(e.name, 14)} study`, prompt: `I have no study block for ${e.name} (exam ${e.examDate}). Propose create_timeline_block actions in the run-up.` });
            }
            if (ctx.nextBestAction) items.push({ label: 'Next step', prompt: 'Looking at my derived risk context, what is the single highest-leverage next action? Explain why in one sentence.' });
        }
        if (v === 'homework') {
            items.push({ label: 'Import assignments', prompt: 'I will paste assignment text from a class portal. Parse it into an import_assignments action with structured rows.' });
        }
        // Fall back to static per-view prompts to fill out the row.
        (QUICK_ACTIONS_BY_VIEW[v] || QUICK_ACTIONS_BY_VIEW.today).forEach(it => {
            if (items.length >= 6) return;
            if (!items.some(x => x.label === it.label)) items.push(it);
        });
        return items.slice(0, 6);
    }

    // --------------------------------------------------------------
    // Public surface
    // --------------------------------------------------------------
    const api = {
        VERSION,
        ACTION_CATALOG,
        CONTEXT_DEPTHS,
        getFlowAssistantContext,
        buildSystemPrompt,
        parseActions,
        validateAction,
        applyAction,
        renderActionCards,
        describeAction,
        getQuickActions,
        updateContextChip,
        renderQuickActions,
        ensurePanelChrome,
        askFlow,
        buildConversationMessages,
        buildRequestMessages,
        buildRequestEnrichment,
        // Workflow + intelligence surface
        classifyRisk,
        applyActionLogged,
        undoActivity,
        tryHandleCommand,
        handleOutgoing,
        renderImportReview,
        openActivityLog,
        showContextModal,
        buildInspectableContext,
        // File attachments (registry-driven; see model-capabilities.js)
        getVisionCapability,
        getActiveProviderModel,
        getAttachments,
        consumeAttachments,
        clearAttachments,
        addAttachmentFromFile,
        updateAttachmentChips,
        refreshAttachmentPlans,
        validateAttachmentsForSend,
        // Exposed for app.js to refresh when the active view changes:
        refresh() {
            ensurePanelChrome();
            renderQuickActions();
            updateContextChip();
            injectViewFlowRows();
        }
    };

    // Canonical post-rebrand globals (Sutra Assistant). The legacy "flow"
    // aliases point at the same objects so existing code / plugins keep working.
    window.sutraAssistant = api;
    window.getSutraAssistantContext = getFlowAssistantContext;
    window.flowAssistant = api;
    window.getFlowAssistantContext = getFlowAssistantContext;

    // One-time backfill: tasks created by earlier Flow versions (or other
    // shortcut paths in the app) lack `isActive` / `scheduleType` and are
    // therefore invisible in Today filters even though they show up in
    // the All Tasks drawer. Walk the live tasks array and add the missing
    // fields with safe defaults, then persist + re-render once. Idempotent:
    // tasks that already have both fields are left untouched.
    function migrateLegacyTaskShapes() {
        try {
            const b = bridge();
            if (!b || !Array.isArray(b.tasks)) return 0;
            let fixed = 0;
            b.tasks.forEach(task => {
                if (!task || typeof task !== 'object') return;
                let mutated = false;
                if (typeof task.isActive !== 'boolean') {
                    // A task that has a future dueDate, recurrence, or is not
                    // explicitly completed should default to active.
                    task.isActive = task.completed ? false : true;
                    mutated = true;
                }
                if (typeof task.scheduleType !== 'string' || !task.scheduleType) {
                    // Existing weekly recurring tasks tend to be flagged via
                    // weeklyDays or category cues; default everything else to 'once'.
                    task.scheduleType = (Array.isArray(task.weeklyDays) && task.weeklyDays.length) ? 'weekly' : 'once';
                    mutated = true;
                }
                if (!Array.isArray(task.weeklyDays)) { task.weeklyDays = []; mutated = true; }
                if (typeof task.estimate !== 'number') { task.estimate = 0; mutated = true; }
                if (typeof task.category !== 'string') { task.category = 'none'; mutated = true; }
                if (mutated) fixed += 1;
            });
            if (fixed > 0) {
                b.persistAppData();
                b.renderTaskViews();
                try { console.info('[Sutra Assistant] Backfilled task shape for ' + fixed + ' existing task(s).'); } catch (e) {}
            }
            return fixed;
        } catch (err) {
            console.warn('Sutra Assistant task migration failed:', err);
            return 0;
        }
    }

    // Wire light DOM behaviors on load.
    function init() {
        try {
            ensurePanelChrome();
            renderQuickActions();
            injectViewFlowRows();
            // Defer the migration until the bridge has finished installing
            // (app.js installs it during chat code init, which runs after
            // this script tag but before DOMContentLoaded handlers complete).
            setTimeout(migrateLegacyTaskShapes, 500);
            setTimeout(migrateLegacyTaskShapes, 2500); // second pass after late hydrations
            // Refresh chip/selection on common interaction events.
            document.addEventListener('selectionchange', () => updateContextChip());
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!target) return;
                // Ask Flow buttons embedded in views.
                const askBtn = target.closest && target.closest('[data-flow-ask]');
                if (askBtn) {
                    e.preventDefault();
                    const prompt = askBtn.getAttribute('data-flow-ask') || '';
                    const autoSend = askBtn.getAttribute('data-flow-send') === 'true';
                    askFlow(prompt, { send: autoSend });
                    return;
                }
                // Reopening chat panel — refresh chrome.
                if (target.id === 'chatbotBtn' || (target.closest && target.closest('#chatbotBtn'))) {
                    setTimeout(() => { ensurePanelChrome(); renderQuickActions(); updateContextChip(); }, 30);
                }
            }, true);
        } catch (e) { console.warn('Sutra Assistant init failed:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
