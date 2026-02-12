/* ─── Homework Organizer v2 ─── */
/* Two-column table: Classes (left) | Extracurriculars/Misc (right) */
/* Setup popup on first use, animated transition, inline task editing */

(function () {
  'use strict';

  // ─── Storage keys ───
  const COURSES_KEY = 'hwCourses:v2';
  const TASKS_KEY   = 'hwTasks:v2';

  // ─── State ───
  let courses = [];   // { id, name, type: 'class' | 'misc' }
  let tasks   = [];   // { id, courseId, text, done, due, priority, difficulty }

  // ─── Helpers ───
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ─── Persistence (localStorage) ───
  function save() {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    try { window.dispatchEvent(new CustomEvent('homework:updated')); } catch (e) {}
  }
  function load() {
    try { courses = JSON.parse(localStorage.getItem(COURSES_KEY)) || []; } catch { courses = []; }
    try { tasks   = JSON.parse(localStorage.getItem(TASKS_KEY))   || []; } catch { tasks   = []; }
    tasks = tasks.map(t => ({
      ...t,
      priority: normalizePriority(t.priority),
      difficulty: normalizeDifficulty(t.difficulty)
    }));
  }

  function normalizePriority(priority) {
    const p = String(priority || '').toLowerCase();
    if (p === 'high') return 'high';
    if (p === 'low') return 'low';
    return 'medium';
  }

  function normalizeDifficulty(difficulty) {
    const d = String(difficulty || '').toLowerCase();
    if (d === 'easy' || d === 'low') return 'easy';
    if (d === 'hard' || d === 'high') return 'hard';
    return 'medium';
  }

  // ─── Setup Popup Logic ───
  function showSetup() {
    const overlay = $('#hwSetupOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.classList.remove('fade-out');
    // Clear old chips
    overlay.querySelectorAll('.hw-chip').forEach(c => c.remove());
    const ci = $('#hwClassInput');
    const mi = $('#hwMiscInput');
    if (ci) ci.value = '';
    if (mi) mi.value = '';
  }

  function hideSetupImmediate() {
    const overlay = $('#hwSetupOverlay');
    if (!overlay) return;
    overlay.classList.remove('fade-out');
    overlay.style.display = 'none';
  }

  function hideSetup(callback) {
    const overlay = $('#hwSetupOverlay');
    if (!overlay) { if (callback) callback(); return; }
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      if (callback) callback();
    }, 420);
  }

  function isHomeworkViewActive() {
    const activeView = document.body && document.body.dataset ? document.body.dataset.view : '';
    if (activeView === 'homework') return true;
    const homeworkView = $('#view-homework');
    return !!(homeworkView && homeworkView.classList.contains('active'));
  }

  function shouldPromptSetup() {
    return courses.length === 0;
  }

  function handleHomeworkViewChange(viewName) {
    const view = String(viewName || '').toLowerCase();
    if (view !== 'homework') {
      hideSetupImmediate();
      return;
    }
    if (shouldPromptSetup()) {
      showSetup();
      return;
    }
    hideSetupImmediate();
    render();
  }

  function setupChipInput(wrapSel, inputSel) {
    const wrap  = $(wrapSel);
    const input = $(inputSel);
    if (!wrap || !input) return;

    wrap.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addChip(wrap, input);
      }
      if (e.key === 'Backspace' && input.value === '') {
        const chips = wrap.querySelectorAll('.hw-chip');
        if (chips.length) chips[chips.length - 1].remove();
      }
    });
    input.addEventListener('blur', () => { if (input.value.trim()) addChip(wrap, input); });
  }

  function addChip(wrap, input) {
    const val = input.value.replace(/,/g, '').trim();
    if (!val) return;
    const chip = document.createElement('span');
    chip.className = 'hw-chip';
    chip.innerHTML = `${escHtml(val)} <button type="button">&times;</button>`;
    chip.querySelector('button').addEventListener('click', () => chip.remove());
    wrap.insertBefore(chip, input);
    input.value = '';
  }

  function collectChips(wrapSel) {
    return [...$$(wrapSel + ' .hw-chip')].map(c => c.textContent.replace('\u00d7', '').trim()).filter(Boolean);
  }

  // ─── Render Data Table ───
  function render() {
    const tbody = $('#hwTableBody');
    if (!tbody) return;

    const classes = courses.filter(c => c.type === 'class');
    const miscs   = courses.filter(c => c.type === 'misc');
    const maxRows = Math.max(classes.length, miscs.length, 1);

    let html = '';
    for (let i = 0; i < maxRows; i++) {
      const cls  = classes[i] || null;
      const misc = miscs[i]   || null;
      html += '<tr>';
      // Left side: class
      html += renderCourseCell(cls, 'class');
      html += renderTasksCell(cls);
      // Right side: misc
      html += renderCourseCell(misc, 'misc');
      html += renderTasksCell(misc);
      html += '</tr>';
    }
    tbody.innerHTML = html;

    // Wire inline-add forms
    tbody.querySelectorAll('.hw-inline-add').forEach(form => {
      const cid    = form.dataset.course;
      const btn    = form.querySelector('button');
      const textIn = form.querySelector('input[type="text"]');
      const dateIn = form.querySelector('input[type="date"]');

      const doAdd = () => {
        const text = textIn.value.trim();
        const prioritySel = form.querySelector('.hw-inline-priority');
        if (!text) return;
        tasks.push({
          id: uid(),
          courseId: cid,
          text,
          done: false,
          due: dateIn.value || '',
          priority: normalizePriority(prioritySel ? prioritySel.value : 'medium'),
          difficulty: normalizeDifficulty(form.querySelector('.hw-inline-difficulty') ? form.querySelector('.hw-inline-difficulty').value : 'medium')
        });
        save();
        render();
      };
      btn.addEventListener('click', doAdd);
      textIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });
    });

    // Wire toggle & delete
    tbody.querySelectorAll('[data-toggle]').forEach(b => {
      b.addEventListener('click', () => {
        const t = tasks.find(x => x.id === b.dataset.toggle);
        if (t) { t.done = !t.done; save(); render(); }
      });
    });
    tbody.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', () => {
        tasks = tasks.filter(x => x.id !== b.dataset.del);
        save();
        render();
      });
    });
    tbody.querySelectorAll('[data-del-course]').forEach(b => {
      b.addEventListener('click', () => {
        const cid = b.dataset.delCourse;
        if (!confirm('Remove this class and all its tasks?')) return;
        courses = courses.filter(c => c.id !== cid);
        tasks   = tasks.filter(t => t.courseId !== cid);
        save();
        render();
      });
    });

    tbody.querySelectorAll('[data-priority]').forEach(sel => {
      sel.addEventListener('change', () => {
        const t = tasks.find(x => x.id === sel.dataset.priority);
        if (!t) return;
        t.priority = normalizePriority(sel.value);
        save();
      });
    });

    tbody.querySelectorAll('[data-difficulty]').forEach(sel => {
      sel.addEventListener('change', () => {
        const t = tasks.find(x => x.id === sel.dataset.difficulty);
        if (!t) return;
        t.difficulty = normalizeDifficulty(sel.value);
        save();
      });
    });
  }

  function renderCourseCell(course, type) {
    if (!course) return '<td class="hw-course-name" style="color:var(--text-muted);"></td>';
    const badge = type === 'misc' ? '<span class="hw-misc-badge">MISC</span>' : '';
    return `<td class="hw-course-name">
      ${escHtml(course.name)}${badge}
      <button data-del-course="${course.id}" title="Remove" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:11px;margin-left:4px;">&times;</button>
    </td>`;
  }

  function renderTasksCell(course) {
    if (!course) return '<td></td>';

    const cTasks = tasks.filter(t => t.courseId === course.id);
    let html = '<td><ul class="hw-task-list">';
    cTasks.forEach(t => {
      const priority = normalizePriority(t.priority);
      const difficulty = normalizeDifficulty(t.difficulty);
      const cls = t.done ? 'hw-task-item done' : 'hw-task-item';
      const dueStr = t.due ? `<span class="hw-task-due">${t.due}</span>` : '';
      html += `<li class="${cls}">
        <span class="hw-task-text">${escHtml(t.text)}</span>
        <span class="hw-task-controls">
          <label class="hw-task-control">
            <span>Urgency</span>
            <select data-priority="${t.id}">
              <option value="high" ${priority === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${priority === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </label>
          <label class="hw-task-control">
            <span>Difficulty</span>
            <select data-difficulty="${t.id}">
              <option value="easy" ${difficulty === 'easy' ? 'selected' : ''}>Easy</option>
              <option value="medium" ${difficulty === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="hard" ${difficulty === 'hard' ? 'selected' : ''}>Hard</option>
            </select>
          </label>
        </span>
        ${dueStr}
        <span class="hw-task-actions">
          <button data-toggle="${t.id}" title="${t.done ? 'Undo' : 'Done'}">${t.done ? '\u21a9' : '\u2713'}</button>
          <button data-del="${t.id}" title="Delete">\u2715</button>
        </span>
      </li>`;
    });
    html += '</ul>';
    // Inline add
    html += `<div class="hw-inline-add" data-course="${course.id}">
      <input type="text" placeholder="Add task\u2026" />
      <input type="date" />
      <select class="hw-inline-priority">
        <option value="medium" selected>Medium</option>
        <option value="high">High</option>
        <option value="low">Low</option>
      </select>
      <select class="hw-inline-difficulty">
        <option value="easy">Easy</option>
        <option value="medium" selected>Medium</option>
        <option value="hard">Hard</option>
      </select>
      <button>+</button>
    </div>`;
    html += '</td>';
    return html;
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ─── Add Class / Misc Buttons ───
  function promptAddCourse(type) {
    const label = type === 'class' ? 'class' : 'misc / extracurricular';
    const name = prompt(`Enter new ${label} name:`);
    if (!name || !name.trim()) return;
    courses.push({ id: uid(), name: name.trim(), type });
    save();
    render();
  }

  // ─── Export / Import ───
  function exportJSON() {
    const blob = new Blob([JSON.stringify({ courses, tasks }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `homework-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.courses) courses = data.courses;
        if (data.tasks) {
          tasks = data.tasks.map(t => ({
            ...t,
            priority: normalizePriority(t.priority),
            difficulty: normalizeDifficulty(t.difficulty)
          }));
        }
        save();
        render();
        alert('Imported successfully!');
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
  }

  // ─── Init ───
  function init() {
    load();

    // Setup chip inputs (always wire, they only show when overlay is visible)
    setupChipInput('#hwClassChips', '#hwClassInput');
    setupChipInput('#hwMiscChips', '#hwMiscInput');

    // Bind header buttons
    const addClassBtn = $('#hwAddClassBtn');
    const addMiscBtn  = $('#hwAddMiscBtn');
    const exportBtn   = $('#hwExportBtn');
    const importFile  = $('#hwImportFile');
    const resetBtn    = $('#hwResetBtn');
    const setupDone   = $('#hwSetupDone');
    const setupSkip   = $('#hwSetupSkip');
    const setupOverlay = $('#hwSetupOverlay');

    if (addClassBtn) addClassBtn.addEventListener('click', () => promptAddCourse('class'));
    if (addMiscBtn)  addMiscBtn.addEventListener('click',  () => promptAddCourse('misc'));
    if (exportBtn)   exportBtn.addEventListener('click', exportJSON);
    if (importFile)  importFile.addEventListener('change', e => { if (e.target.files[0]) importJSON(e.target.files[0]); });
    if (resetBtn)    resetBtn.addEventListener('click', () => {
      if (!confirm('This will clear all classes and tasks. Continue?')) return;
      courses = [];
      tasks   = [];
      save();
      showSetup();
    });
    if (setupSkip) setupSkip.addEventListener('click', () => hideSetupImmediate());
    if (setupOverlay) setupOverlay.addEventListener('click', (e) => {
      if (e.target === setupOverlay) hideSetupImmediate();
    });

    if (setupDone) setupDone.addEventListener('click', () => {
      const classNames = collectChips('#hwClassChips');
      const miscNames  = collectChips('#hwMiscChips');
      if (classNames.length === 0 && miscNames.length === 0) {
        alert('Add at least one class or activity.');
        return;
      }
      classNames.forEach(n => courses.push({ id: uid(), name: n, type: 'class' }));
      miscNames.forEach(n  => courses.push({ id: uid(), name: n, type: 'misc' }));
      save();
      hideSetup(() => render());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!isHomeworkViewActive()) return;
      const overlay = $('#hwSetupOverlay');
      if (!overlay || overlay.style.display === 'none') return;
      hideSetupImmediate();
    });

    window.addEventListener('noteflow:view-changed', (event) => {
      const view = event && event.detail ? event.detail.view : '';
      handleHomeworkViewChange(view);
    });

    // Initial render; prompt only when Homework tab is actually active.
    render();
    if (isHomeworkViewActive()) {
      handleHomeworkViewChange('homework');
    } else {
      hideSetupImmediate();
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
