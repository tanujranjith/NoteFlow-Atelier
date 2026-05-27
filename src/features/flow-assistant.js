// Flow Assistant — contextual workspace layer for NoteFlow Atelier.
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
        try { if (typeof fn === 'function') return fn(...args); } catch (e) { console.warn('Flow Assistant safeCall failed:', e); }
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
        const selection = options.includeSelection === false ? '' : getEditorSelection();

        const ctx = {
            schema: 'flow-context/1',
            view,
            depth,
            now: new Date().toISOString(),
            timeOfDay: new Date().getHours()
        };

        if (depth === 'minimal') {
            ctx.summary = `User is on the ${view} view in NoteFlow Atelier.`;
            if (selection) ctx.selection = truncate(selection, 1200);
            return ctx;
        }

        // currentView and workspace both include the current note when in Notes.
        if (view === 'notes') {
            ctx.activeNote = getActiveNoteSummary();
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
        return ctx;
    }

    // --------------------------------------------------------------
    // System prompt builder
    // --------------------------------------------------------------
    const ACTION_CATALOG = [
        { type: 'insert_text', desc: 'Insert markdown text into the current note at the caret', fields: { text: 'string' } },
        { type: 'replace_selection', desc: 'Replace the user\'s currently selected text in the editor', fields: { text: 'string' } },
        { type: 'create_task', desc: 'Create a task in the planner', fields: { title: 'string', dueDate: 'YYYY-MM-DD?', dueTime: 'HH:MM?', priority: 'low|medium|high?', notes: 'string?', category: 'string?' } },
        { type: 'create_homework', desc: 'Create a homework assignment', fields: { title: 'string', courseName: 'string?', dueDate: 'YYYY-MM-DD?', difficulty: 'easy|medium|hard?' } },
        { type: 'create_timeline_block', desc: 'Schedule a calendar/timeline block', fields: { name: 'string', date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', category: 'string?' } },
        { type: 'create_page', desc: 'Create a new note page', fields: { title: 'string', body: 'markdown', tags: 'string[]?' } },
        { type: 'create_review_deck', desc: 'Create a review deck (optionally with cards)', fields: { name: 'string', description: 'string?', cards: '[{front,back}]?' } },
        { type: 'add_review_cards', desc: 'Add cards to an existing review deck', fields: { deckId: 'string', cards: '[{front,back}]' } },
        { type: 'create_cram_session', desc: 'Add a cram session entry', fields: { topic: 'string', days: 'number?' } },
        { type: 'create_college_task', desc: 'Add a college-related task (essay, deadline, scholarship)', fields: { title: 'string', dueDate: 'YYYY-MM-DD?', kind: 'essay|deadline|scholarship?' } },
        { type: 'navigate', desc: 'Switch the active view', fields: { view: 'today|notes|homework|timeline|review|cramhub|collegeapp|apstudy|life|business|settings' } }
    ];

    function buildSystemPrompt(context) {
        const catalog = ACTION_CATALOG
            .map(a => `- ${a.type}: ${a.desc} — fields: ${JSON.stringify(a.fields)}`)
            .join('\n');
        const contextJson = (() => { try { return JSON.stringify(context, null, 2); } catch (e) { return '{}'; } })();
        return [
            'You are Flow, the contextual assistant inside NoteFlow Atelier — a local-first student / creator operating system.',
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
            '- For dates, prefer ISO YYYY-MM-DD. Times are HH:MM 24h.',
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
        // the task invisible in Today's filters, Daily Brief counts, and the
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
        return { ok: true, message: 'Task added.' };
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
                    localStorage.setItem(coursesKey, JSON.stringify(courses));
                    courseId = newCourse.id;
                }
            }
            tasks.push({
                id: makeId('hw'),
                title: String(action.title).slice(0, 200),
                done: false,
                courseId,
                dueDate: action.dueDate || '',
                priority: 'medium',
                difficulty: ['easy', 'medium', 'hard'].includes(action.difficulty) ? action.difficulty : 'medium',
                createdAt: new Date().toISOString(),
                source: 'flow'
            });
            localStorage.setItem(tasksKey, JSON.stringify(tasks));
            // renderHomeworkWorkspace refreshes the Homework view; renderTaskViews
            // refreshes Today's task/assignment badges so Flow-added homework
            // shows up in the "What needs attention" cards immediately.
            const b2 = bridge();
            if (b2 && typeof window.renderHomeworkWorkspace === 'function') window.renderHomeworkWorkspace();
            if (b2) b2.renderTaskViews(); else safeCall(window.renderTaskViews);
            return { ok: true, message: 'Homework added.' };
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
        blocks.push({
            id: makeId('b'),
            date: action.date,
            start: action.start,
            end: action.end,
            name: String(action.name).slice(0, 160),
            category: action.category || 'general',
            recurrence: 'none',
            source: 'flow',
            createdAt: now,
            updatedAt: now
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
        return { ok: true, message: 'Block scheduled.' };
    }

    function applyCreatePage(action) {
        const b = bridge();
        const pages = b ? b.pages : window.pages;
        if (!Array.isArray(pages)) return { ok: false, message: 'Pages not available.' };
        const id = makeId('p');
        const body = action.body || '';
        const renderer = b ? b.renderMarkdown : window.renderMarkdown;
        const html = (typeof renderer === 'function') ? renderer(body) : esc(body).replace(/\n/g, '<br>');
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
            spaceId: 'default',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceContext: 'flow',
            templateType: 'flow_generated',
            classLinkId: '',
            apSubjectId: '',
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
        return { ok: true, message: 'Note created.', payload: { pageId: id } };
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
        return { ok: true, message: `Deck created${action.cards ? ` with ${action.cards.length} cards` : ''}.`, payload: { deckId: deck.id } };
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
            case 'create_review_deck': return applyCreateReviewDeck(action);
            case 'add_review_cards': return applyAddReviewCards(action);
            case 'create_cram_session': return applyCreateCramSession(action);
            case 'create_college_task': return applyCreateCollegeTask(action);
            case 'navigate': return applyNavigate(action);
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
            case 'create_review_deck': return `Create review deck "${action.name}"${Array.isArray(action.cards) ? ` with ${action.cards.length} cards` : ''}`;
            case 'add_review_cards': return `Add ${action.cards.length} cards to deck ${action.deckId}`;
            case 'create_cram_session': return `Start cram session: "${action.topic}"`;
            case 'create_college_task': return `Add college ${action.kind || 'deadline'}: "${action.title}"`;
            case 'navigate': return `Go to ${action.view}`;
            default: return `Unknown: ${action.type}`;
        }
    }

    function renderActionCards(hostEl, actions, opts) {
        if (!hostEl || !Array.isArray(actions) || actions.length === 0) return;
        const showPreviews = getPref('assistant.showActionPreviews', true) !== false;
        const wrap = document.createElement('div');
        wrap.className = 'flow-action-cards';
        wrap.setAttribute('role', 'group');
        wrap.setAttribute('aria-label', 'Proposed actions');

        actions.forEach((rawAction, idx) => {
            const action = normalizeActionFields(rawAction);
            const card = document.createElement('div');
            card.className = 'flow-action-card';
            const valid = validateAction(action);

            const label = action.label || describeAction(action);
            const header = document.createElement('div');
            header.className = 'flow-action-card-head';
            header.innerHTML = `<span class="flow-action-type">${esc(action.type)}</span><span class="flow-action-label">${esc(label)}</span>`;
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
            applyBtn.addEventListener('click', () => {
                applyBtn.disabled = true;
                const result = applyAction(action);
                const status = document.createElement('div');
                status.className = result.ok ? 'flow-action-ok' : 'flow-action-error';
                status.textContent = result.ok ? `✓ ${result.message}` : `✗ ${result.message}`;
                card.appendChild(status);
                if (result.ok) {
                    showToast(result.message);
                    applyBtn.textContent = 'Applied';
                } else {
                    applyBtn.disabled = false;
                }
                if (opts && typeof opts.onApplied === 'function') opts.onApplied(action, result);
            });

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

            if (actions.length > 1 && idx === 0) {
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
        });

        hostEl.appendChild(wrap);
    }

    // --------------------------------------------------------------
    // Context chip + quick actions UI
    // --------------------------------------------------------------
    const QUICK_ACTIONS_BY_VIEW = {
        today: [
            { label: 'Plan my day', prompt: 'Plan my day from my open tasks, due homework, and upcoming timeline blocks. Suggest a realistic order and propose timeline blocks as actions.' },
            { label: 'Top risks', prompt: 'What are the top 3 risks across my tasks and deadlines? Be specific and reference items.' },
            { label: 'Next best action', prompt: 'Looking at my current state, what is the single highest-leverage next action I should do right now? Explain why in one sentence.' }
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
            { label: 'Ask Flow about this view', prompt: 'Look at my Life workspace and suggest one improvement I could make this week.' }
        ],
        business: [
            { label: 'Pipeline review', prompt: 'Summarize my business pipeline from the context and propose 3 concrete next actions as create_task actions.' }
        ]
    };

    function getQuickActions(view) {
        const key = String(view || getActiveViewName());
        return QUICK_ACTIONS_BY_VIEW[key] || QUICK_ACTIONS_BY_VIEW.today;
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
            chip.title = `Flow Assistant sees ${normalizeDepth()} context. Change in Settings ▸ Assistant.`;
        }
        const memoryChip = document.getElementById('flowMemoryChip');
        if (memoryChip) {
            const mode = getChatMemoryMode();
            memoryChip.dataset.state = mode;
            memoryChip.textContent = describeChatMemoryChip();
            memoryChip.title = mode === 'stateful'
                ? `Flow Assistant includes recent chat history. Change in Settings ▸ Assistant.`
                : `Flow Assistant sends each message independently. Change in Settings ▸ Assistant.`;
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
            { label: 'Plan my day', prompt: 'Plan my day from my open tasks and timeline. Propose create_timeline_block actions for the most important items.' },
            { label: 'Next best action', prompt: 'Looking at my current state, what is the single highest-leverage next action I should do right now? Explain why in one sentence.' }
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
            { label: 'Ask Flow', prompt: 'Look at my Life workspace and suggest one improvement I could make this week.' }
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
                row.setAttribute('aria-label', 'Ask Flow');
                row.innerHTML = VIEW_FLOW_ROWS[viewId].map(item =>
                    `<button type="button" class="view-flow-btn" data-flow-ask="${esc(item.prompt)}">${esc(item.label)}</button>`
                ).join('');
                // Insert at the top of the view, before existing content.
                if (section.firstChild) section.insertBefore(row, section.firstChild);
                else section.appendChild(row);
            });
        } catch (e) { console.warn('Flow Assistant injectViewFlowRows failed:', e); }
    }

    function ensurePanelChrome() {
        const panel = document.getElementById('chatbotPanel');
        if (!panel) return;
        const header = panel.querySelector('.chatbot-header');
        if (header && !document.getElementById('flowContextChipRow')) {
            const chipRow = document.createElement('div');
            chipRow.id = 'flowContextChipRow';
            chipRow.className = 'flow-context-chip-row';
            chipRow.innerHTML = `
                <span class="flow-context-chip" id="flowContextChip" aria-live="polite"></span>
                <span class="flow-memory-chip" id="flowMemoryChip" aria-live="polite"></span>
                <span class="flow-selection-flag" id="flowSelectionFlag" hidden></span>
            `;
            header.insertAdjacentElement('afterend', chipRow);
        }
        // Action cards host appended after messages on demand; nothing to pre-create.
        updateContextChip();
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
        const ctx = getFlowAssistantContext({});
        const systemPrompt = buildSystemPrompt(ctx);
        return {
            systemPrompt,
            context: ctx,
            providerType,
            requestMessages: buildRequestMessages(userText, options.conversation, options)
        };
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
        // Exposed for app.js to refresh when the active view changes:
        refresh() {
            ensurePanelChrome();
            renderQuickActions();
            updateContextChip();
            injectViewFlowRows();
        }
    };

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
                try { console.info('[Flow Assistant] Backfilled task shape for ' + fixed + ' existing task(s).'); } catch (e) {}
            }
            return fixed;
        } catch (err) {
            console.warn('Flow Assistant task migration failed:', err);
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
        } catch (e) { console.warn('Flow Assistant init failed:', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
