/* ─── Homework Organizer v2 ─── */
/* Two-column table: Classes (left) | Extracurriculars/Misc (right) */
/* Setup popup on first use, animated transition, inline task editing */

(function () {
  'use strict';

  // ─── Storage keys ───
  const COURSES_KEY = 'hwCourses:v2';
  const TASKS_KEY   = 'hwTasks:v2';
  const LEGACY_COURSES_KEY = 'homeworkCourses:v1';
  const LEGACY_TASKS_KEY   = 'homeworkTasks:v1';

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

  function parseArrayFromStorage(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function normalizeState() {
    const normalizedCourses = [];
    const courseIdSet = new Set();
    const courseNameMap = new Map();

    (Array.isArray(courses) ? courses : []).forEach(course => {
      if (!course || typeof course !== 'object') return;
      const name = String(course.name || course.subject || course.title || '').trim();
      if (!name) return;
      const id = String(course.id || uid());
      if (courseIdSet.has(id)) return;
      const type = course.type === 'misc' ? 'misc' : 'class';
      const normalized = { id, name, type };
      normalizedCourses.push(normalized);
      courseIdSet.add(id);
      courseNameMap.set(`${type}:${name.toLowerCase()}`, id);
    });

    courses = normalizedCourses;

    function ensureCourseId(name, type) {
      const cleanName = String(name || '').trim();
      const cleanType = type === 'misc' ? 'misc' : 'class';
      if (!cleanName) return '';
      const mapKey = `${cleanType}:${cleanName.toLowerCase()}`;
      if (courseNameMap.has(mapKey)) return courseNameMap.get(mapKey);
      const id = uid();
      courses.push({ id, name: cleanName, type: cleanType });
      courseIdSet.add(id);
      courseNameMap.set(mapKey, id);
      return id;
    }

    tasks = (Array.isArray(tasks) ? tasks : []).reduce((acc, task) => {
      if (!task || typeof task !== 'object') return acc;
      const text = String(task.text || task.task || task.title || '').trim();
      if (!text) return acc;

      const subjectName = String(task.subject || task.course || '').trim();
      let courseId = task.courseId != null ? String(task.courseId) : '';
      if (!courseId && subjectName) {
        courseId = ensureCourseId(subjectName, 'class');
      }
      if (courseId && !courseIdSet.has(courseId) && subjectName) {
        courseId = ensureCourseId(subjectName, 'class');
      }

      acc.push({
        ...task,
        id: String(task.id || uid()),
        courseId,
        text,
        done: !!task.done || !!task.completed,
        due: String(task.due || task.duedate || task.dueDate || ''),
        priority: normalizePriority(task.priority),
        difficulty: normalizeDifficulty(task.difficulty)
      });
      return acc;
    }, []);
  }

  function load() {
    courses = parseArrayFromStorage(COURSES_KEY);
    tasks = parseArrayFromStorage(TASKS_KEY);

    // Backward-compatible fallback for users with legacy homework keys.
    if (courses.length === 0 && tasks.length === 0) {
      const legacyCourses = parseArrayFromStorage(LEGACY_COURSES_KEY);
      const legacyTasks = parseArrayFromStorage(LEGACY_TASKS_KEY);
      if (legacyCourses.length || legacyTasks.length) {
        courses = legacyCourses;
        tasks = legacyTasks;
      }
    }

    normalizeState();
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
  function renderLegacyTable() {
    const tbody = $('#tasksBody');
    if (!tbody) return false;

    const coursesById = new Map(courses.map(c => [String(c.id), c]));
    if (!tasks.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="small muted">No homework yet.</td></tr>';
      return true;
    }

    const toPriorityLabel = (value) => {
      const p = normalizePriority(value);
      if (p === 'high') return 'High';
      if (p === 'low') return 'Low';
      return 'Medium';
    };

    tbody.innerHTML = tasks.map(task => {
      const course = task.courseId ? coursesById.get(String(task.courseId)) : null;
      const subject = course ? course.name : (task.subject || 'General');
      const due = task.due ? escHtml(task.due) : '';
      const rowClass = task.done ? 'done' : '';
      return `<tr class="${rowClass}">
        <td>${escHtml(subject)}</td>
        <td>${escHtml(task.text)}</td>
        <td>${due}</td>
        <td>${toPriorityLabel(task.priority)}</td>
        <td>
          <button class="btn-ghost" type="button" data-toggle="${task.id}">${task.done ? 'Undo' : 'Done'}</button>
          <button class="btn-ghost" type="button" data-del="${task.id}">Delete</button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = tasks.find(item => item.id === btn.dataset.toggle);
        if (!task) return;
        task.done = !task.done;
        save();
        render();
      });
    });

    tbody.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        tasks = tasks.filter(item => item.id !== btn.dataset.del);
        save();
        render();
      });
    });

    return true;
  }

  function render() {
    const tbody = $('#hwTableBody');
    if (!tbody) {
      renderLegacyTable();
      return;
    }

    const classes = courses.filter(c => c.type === 'class');
    const miscs   = courses.filter(c => c.type === 'misc');
    const tasksByCourse = tasks.reduce((acc, task) => {
      const key = String(task && task.courseId ? task.courseId : '');
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
    const maxRows = Math.max(classes.length, miscs.length, 1);

    let html = '';
    for (let i = 0; i < maxRows; i++) {
      const cls  = classes[i] || null;
      const misc = miscs[i]   || null;
      html += '<tr>';
      // Left side: class
      html += renderCourseCell(cls, 'class');
      html += renderTasksCell(cls, tasksByCourse);
      // Right side: misc
      html += renderCourseCell(misc, 'misc');
      html += renderTasksCell(misc, tasksByCourse);
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
    tbody.querySelectorAll('[data-edit]').forEach(b => {
      b.addEventListener('click', () => {
        openHomeworkTaskEditor(b.dataset.edit);
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
    if (!course) return '<td class="hw-course-name hw-course-empty"></td>';
    const badge = type === 'misc' ? '<span class="hw-misc-badge">MISC</span>' : '';
    return `<td class="hw-course-name">
      <div class="hw-course-row">
        <span class="hw-course-title">${escHtml(course.name)}${badge}</span>
        <button class="hw-course-remove" data-del-course="${course.id}" title="Remove">&times;</button>
      </div>
    </td>`;
  }

  function renderTasksCell(course, tasksByCourse) {
    if (!course) return '<td class="hw-task-cell hw-task-cell-empty"></td>';

    const cTasks = (tasksByCourse && tasksByCourse[String(course.id)]) ? tasksByCourse[String(course.id)] : [];
    let html = '<td class="hw-task-cell"><ul class="hw-task-list">';
    cTasks.forEach(t => {
      const priority = normalizePriority(t.priority);
      const difficulty = normalizeDifficulty(t.difficulty);
      const cls = t.done ? 'hw-task-item done' : 'hw-task-item';
      const dueText = t.due ? escHtml(t.due) : 'No date';
      html += `<li class="${cls}">
        <div class="hw-task-main">
          <span class="hw-task-badge">Task</span>
          <span class="hw-task-text">${escHtml(t.text)}</span>
        </div>
        <div class="hw-task-meta">
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
          <span class="hw-task-due-wrap">
            <span class="hw-task-label">Due</span>
            <span class="hw-task-due">${dueText}</span>
          </span>
          <span class="hw-task-actions">
          <button data-edit="${t.id}" title="Edit">Edit</button>
          <button data-toggle="${t.id}" title="${t.done ? 'Undo' : 'Done'}">${t.done ? 'Undo' : 'Done'}</button>
          <button data-del="${t.id}" title="Delete">Delete</button>
          </span>
        </div>
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
      <button>Add</button>
    </div>`;
    html += '</td>';
    return html;
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function openHomeworkTaskEditor(taskId) {
    const id = String(taskId || '').trim();
    if (!id) return;

    if (typeof window.openHomeworkTaskModal === 'function') {
      const opened = window.openHomeworkTaskModal('v2', id);
      if (opened) return;
    }

    if (typeof window.openTaskModal === 'function') {
      try { window.dispatchEvent(new CustomEvent('homework:updated')); } catch (e) {}
      setTimeout(() => {
        try { window.openTaskModal(`hw_v2_${id}`); } catch (err) {}
      }, 180);
    }
  }

  function addLegacyTask() {
    const subjectInput = $('#subject');
    const taskInput = $('#task');
    const dueInput = $('#duedate');
    const priorityInput = $('#priority');
    if (!taskInput) return;

    const text = taskInput.value.trim();
    if (!text) return;

    const subject = subjectInput ? subjectInput.value.trim() : '';
    let courseId = '';
    if (subject) {
      const existing = courses.find(c => c.type === 'class' && c.name.toLowerCase() === subject.toLowerCase());
      if (existing) {
        courseId = existing.id;
      } else {
        courseId = uid();
        courses.push({ id: courseId, name: subject, type: 'class' });
      }
    }

    tasks.push({
      id: uid(),
      courseId,
      text,
      done: false,
      due: dueInput && dueInput.value ? dueInput.value : '',
      priority: normalizePriority(priorityInput ? priorityInput.value : 'medium'),
      difficulty: 'medium'
    });

    save();
    render();
    taskInput.value = '';
    if (dueInput) dueInput.value = '';
    taskInput.focus();
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
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `homework-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object') throw new Error('Invalid payload');
        if (Array.isArray(data.courses)) courses = data.courses;
        if (Array.isArray(data.tasks)) tasks = data.tasks;
        normalizeState();
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
    const legacyAddBtn = $('#addBtn');
    const legacyTaskInput = $('#task');
    const exportBtn   = $('#hwExportBtn');
    const importFile  = $('#hwImportFile');
    const resetBtn    = $('#hwResetBtn');
    const setupDone   = $('#hwSetupDone');
    const setupSkip   = $('#hwSetupSkip');
    const setupOverlay = $('#hwSetupOverlay');

    if (addClassBtn) addClassBtn.addEventListener('click', () => promptAddCourse('class'));
    if (addMiscBtn)  addMiscBtn.addEventListener('click',  () => promptAddCourse('misc'));
    if (legacyAddBtn) legacyAddBtn.addEventListener('click', addLegacyTask);
    if (legacyTaskInput) {
      legacyTaskInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addLegacyTask();
        }
      });
    }
    if (exportBtn)   exportBtn.addEventListener('click', exportJSON);
    if (importFile)  importFile.addEventListener('change', e => {
      if (e.target.files[0]) importJSON(e.target.files[0]);
      e.target.value = '';
    });
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
    window.addEventListener('homework:updated', () => {
      load();
      if (isHomeworkViewActive()) render();
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
