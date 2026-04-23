(function () {
  'use strict';

  const COURSES_KEY = 'hwCourses:v2';
  const TASKS_KEY = 'hwTasks:v2';
  const SCHEMA_KEY = 'hwSchemaVersion';
  const LEGACY_COURSES_KEY = 'homeworkCourses:v1';
  const LEGACY_TASKS_KEY = 'homeworkTasks:v1';

  const HARD_DIFFICULTY_WEIGHT = Object.freeze({ easy: 1, medium: 2, hard: 3 });
  const PRIORITY_WEIGHT = Object.freeze({ high: 1, medium: 2, low: 3 });

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });

  let courses = [];
  let tasks = [];
  let activeTaskMenuId = null;
  let courseQuickModalState = { type: 'class', onCreated: null };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => root.querySelectorAll(selector);
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  function showHomeworkToast(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message);
      return;
    }
    console.warn(message);
  }

  function showHomeworkAlert(message, options = {}) {
    if (typeof window.showCustomAlertDialog === 'function') {
      return window.showCustomAlertDialog({
        title: options.title || 'Homework',
        message: String(message || ''),
        confirmText: options.confirmText || 'OK'
      });
    }
    showHomeworkToast(message);
    return Promise.resolve();
  }

  function showHomeworkConfirm(message, options = {}) {
    if (typeof window.showCustomConfirmDialog === 'function') {
      return window.showCustomConfirmDialog({
        title: options.title || 'Confirm Action',
        message: String(message || ''),
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        confirmVariant: options.confirmVariant || 'danger'
      });
    }
    showHomeworkToast(message);
    return Promise.resolve(false);
  }

  function escHtml(value) {
    const el = document.createElement('div');
    el.textContent = String(value || '');
    return el.innerHTML;
  }

  function parseArrayFromStorage(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeArrayToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  }

  function formatDateKey(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function normalizeDueDate(rawValue) {
    const raw = String(rawValue || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const dateTimeMatch = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    if (dateTimeMatch) return dateTimeMatch[1];

    return formatDateKey(raw);
  }

  function normalizeDueTime(rawValue) {
    const raw = String(rawValue || '').trim().toLowerCase();
    if (!raw) return '';

    if (/^\d{2}:\d{2}$/.test(raw)) {
      const [hh, mm] = raw.split(':').map(Number);
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
    }

    const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (ampmMatch) {
      let hour = Number(ampmMatch[1]);
      const minute = Number(ampmMatch[2]);
      const marker = ampmMatch[3].toLowerCase();
      if (minute >= 0 && minute <= 59 && hour >= 1 && hour <= 12) {
        if (marker === 'pm' && hour < 12) hour += 12;
        if (marker === 'am' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      }
    }

    const isoTimeMatch = raw.match(/[t\s](\d{2}:\d{2})/i);
    if (isoTimeMatch) return normalizeDueTime(isoTimeMatch[1]);

    return '';
  }

  function extractDueParts(rawDue) {
    const raw = String(rawDue || '').trim();
    if (!raw) return { dueDate: '', dueTime: '' };

    const dateTimeMatch = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    if (dateTimeMatch) {
      return {
        dueDate: normalizeDueDate(dateTimeMatch[1]),
        dueTime: normalizeDueTime(dateTimeMatch[2])
      };
    }

    return {
      dueDate: normalizeDueDate(raw),
      dueTime: ''
    };
  }

  function normalizePriority(rawValue) {
    const value = String(rawValue || '').toLowerCase();
    if (value === 'high') return 'high';
    if (value === 'low') return 'low';
    return 'medium';
  }

  function normalizeDifficulty(rawValue) {
    const value = String(rawValue || '').toLowerCase();
    if (value === 'easy' || value === 'low') return 'easy';
    if (value === 'hard' || value === 'high') return 'hard';
    return 'medium';
  }

  function ensureCourseIdByName(courseName, type = 'class') {
    const normalizedName = String(courseName || '').trim();
    if (!normalizedName) return '';

    const normalizedType = type === 'misc' ? 'misc' : 'class';
    const existing = courses.find(course => (
      course.type === normalizedType &&
      String(course.name || '').toLowerCase() === normalizedName.toLowerCase()
    ));
    if (existing) return existing.id;

    const next = {
      id: uid(),
      name: normalizedName,
      type: normalizedType
    };
    courses.push(next);
    return next.id;
  }

  function serializeTask(task) {
    const dueDate = normalizeDueDate(task.dueDate);
    const dueTime = normalizeDueTime(task.dueTime);
    const title = String(task.title || task.text || '').trim();

    return {
      id: String(task.id || uid()),
      courseId: task.courseId ? String(task.courseId) : '',
      title,
      text: title,
      done: !!task.done,
      dueDate,
      dueTime,
      due: dueDate,
      priority: normalizePriority(task.priority),
      difficulty: normalizeDifficulty(task.difficulty),
      notes: String(task.notes || '').trim(),
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeState() {
    const normalizedCourses = [];
    const courseIds = new Set();

    (Array.isArray(courses) ? courses : []).forEach(rawCourse => {
      if (!rawCourse || typeof rawCourse !== 'object') return;
      const name = String(rawCourse.name || rawCourse.subject || rawCourse.title || '').trim();
      if (!name) return;

      let id = String(rawCourse.id || uid());
      while (courseIds.has(id)) id = uid();

      const type = rawCourse.type === 'misc' ? 'misc' : 'class';
      normalizedCourses.push({ id, name, type });
      courseIds.add(id);
    });

    courses = normalizedCourses;

    const tasksSeen = new Set();
    const normalizedTasks = [];

    (Array.isArray(tasks) ? tasks : []).forEach(rawTask => {
      if (!rawTask || typeof rawTask !== 'object') return;

      const title = String(rawTask.title || rawTask.text || rawTask.task || '').trim();
      if (!title) return;

      let id = String(rawTask.id || uid());
      while (tasksSeen.has(id)) id = uid();
      tasksSeen.add(id);

      let courseId = rawTask.courseId ? String(rawTask.courseId) : '';
      const sourceCourseName = String(rawTask.subject || rawTask.course || rawTask.className || '').trim();
      if (!courseId && sourceCourseName) {
        courseId = ensureCourseIdByName(sourceCourseName, 'class');
      }
      if (courseId && !courseIds.has(courseId) && sourceCourseName) {
        courseId = ensureCourseIdByName(sourceCourseName, 'class');
      }

      const extractedDue = extractDueParts(rawTask.due || rawTask.duedate);
      const dueDate = normalizeDueDate(rawTask.dueDate || rawTask.date || extractedDue.dueDate);
      const dueTime = normalizeDueTime(rawTask.dueTime || rawTask.time || extractedDue.dueTime);

      normalizedTasks.push(serializeTask({
        ...rawTask,
        id,
        courseId,
        title,
        done: !!rawTask.done || !!rawTask.completed,
        dueDate,
        dueTime,
        priority: normalizePriority(rawTask.priority),
        difficulty: normalizeDifficulty(rawTask.difficulty),
        createdAt: rawTask.createdAt || new Date().toISOString()
      }));
    });

    tasks = normalizedTasks.sort(compareHomeworkTasks);
  }

  function load() {
    courses = parseArrayFromStorage(COURSES_KEY);
    tasks = parseArrayFromStorage(TASKS_KEY);

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

  function notifyHomeworkUpdated() {
    try {
      window.dispatchEvent(new CustomEvent('homework:updated'));
    } catch (error) {
      // no-op
    }
  }

  function save() {
    normalizeState();
    writeArrayToStorage(COURSES_KEY, courses);
    writeArrayToStorage(TASKS_KEY, tasks.map(task => serializeTask(task)));
    localStorage.setItem(SCHEMA_KEY, '3');
    notifyHomeworkUpdated();
  }

  function normalizeCourseType(rawType) {
    return rawType === 'misc' ? 'misc' : 'class';
  }

  function createCourseFromName(rawType, rawName) {
    const type = normalizeCourseType(rawType);
    const normalizedName = String(rawName || '').trim();
    if (!normalizedName) return null;

    const duplicate = courses.some(course => (
      course.type === type &&
      String(course.name || '').toLowerCase() === normalizedName.toLowerCase()
    ));

    if (duplicate) {
      showHomeworkAlert('That subject/category already exists.');
      return null;
    }

    const created = {
      id: uid(),
      name: normalizedName,
      type
    };
    courses.push(created);
    save();
    return created;
  }

  function ensureCourseQuickModal() {
    let modal = $('#hwCourseQuickModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'hwCourseQuickModal';
    modal.className = 'hw-course-quick-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="hw-course-quick-card" role="dialog" aria-modal="true" aria-labelledby="hwCourseQuickTitle">
        <div class="hw-course-quick-head">
          <h3 id="hwCourseQuickTitle" class="hw-course-quick-title">Add Subject</h3>
          <button type="button" class="hw-course-quick-close" data-course-quick-close aria-label="Close">&times;</button>
        </div>
        <p class="hw-course-quick-copy" id="hwCourseQuickCopy">Type a class name and press Enter.</p>
        <form data-course-quick-form>
          <input type="text" data-course-quick-input maxlength="120" placeholder="Type and press Enter" autocomplete="off" />
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const titleEl = $('#hwCourseQuickTitle', modal);
    const copyEl = $('#hwCourseQuickCopy', modal);
    const closeBtn = $('[data-course-quick-close]', modal);
    const form = $('[data-course-quick-form]', modal);
    const input = $('[data-course-quick-input]', modal);

    const closeModal = () => {
      modal.hidden = true;
      courseQuickModalState.onCreated = null;
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });

    if (form && input) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const created = createCourseFromName(courseQuickModalState.type, input.value);
        if (!created) return;
        closeModal();
        if (typeof courseQuickModalState.onCreated === 'function') {
          courseQuickModalState.onCreated(created);
        }
      });

      input.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeModal();
        }
      });
    }

    modal._setContext = (type) => {
      const normalized = normalizeCourseType(type);
      courseQuickModalState.type = normalized;
      if (titleEl) titleEl.textContent = normalized === 'misc' ? 'Add Extracurricular' : 'Add Class';
      if (copyEl) copyEl.textContent = normalized === 'misc'
        ? 'Type an extracurricular/activity and press Enter.'
        : 'Type a class name and press Enter.';
      if (input) {
        input.value = '';
        input.placeholder = normalized === 'misc' ? 'e.g. Debate Club' : 'e.g. Chemistry';
      }
    };

    return modal;
  }

  function promptAddCourse(rawType, options = {}) {
    const modal = ensureCourseQuickModal();
    const type = normalizeCourseType(rawType);
    courseQuickModalState.onCreated = typeof options.onCreated === 'function' ? options.onCreated : null;
    if (typeof modal._setContext === 'function') modal._setContext(type);
    modal.hidden = false;
    const input = $('[data-course-quick-input]', modal);
    if (input) setTimeout(() => input.focus(), 30);
  }

  function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function getTaskDueDateTime(task) {
    const dueDate = normalizeDueDate(task && task.dueDate);
    if (!dueDate) return null;
    const dueTime = normalizeDueTime(task && task.dueTime) || '23:59';
    const parsed = new Date(`${dueDate}T${dueTime}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function compareHomeworkTasks(a, b) {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;

    const dueA = getTaskDueDateTime(a);
    const dueB = getTaskDueDateTime(b);
    if (dueA && dueB) {
      const delta = dueA.getTime() - dueB.getTime();
      if (delta !== 0) return delta;
    } else if (dueA) {
      return -1;
    } else if (dueB) {
      return 1;
    }

    const priorityDelta = (PRIORITY_WEIGHT[normalizePriority(a.priority)] || 99) - (PRIORITY_WEIGHT[normalizePriority(b.priority)] || 99);
    if (priorityDelta !== 0) return priorityDelta;

    const difficultyDelta = (HARD_DIFFICULTY_WEIGHT[normalizeDifficulty(b.difficulty)] || 0) - (HARD_DIFFICULTY_WEIGHT[normalizeDifficulty(a.difficulty)] || 0);
    if (difficultyDelta !== 0) return difficultyDelta;

    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  function formatDueDateLabel(dueDate) {
    const normalized = normalizeDueDate(dueDate);
    if (!normalized) return 'No date';
    const parsed = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return normalized;
    return dateFormatter.format(parsed);
  }

  function formatDueTimeLabel(dueTime) {
    const normalized = normalizeDueTime(dueTime);
    if (!normalized) return 'No time';
    const [hourRaw, minuteRaw] = normalized.split(':').map(Number);
    const suffix = hourRaw >= 12 ? 'PM' : 'AM';
    const hour12 = hourRaw % 12 || 12;
    return `${hour12}:${String(minuteRaw).padStart(2, '0')} ${suffix}`;
  }

  function getTaskDueState(task) {
    const dueDate = normalizeDueDate(task && task.dueDate);
    const dueTime = normalizeDueTime(task && task.dueTime);

    if (!dueDate) {
      return {
        statusText: task.done ? 'Done' : 'Open',
        stateClass: task.done ? 'is-done' : 'is-open',
        dueDateLabel: 'No date',
        dueTimeLabel: dueTime ? formatDueTimeLabel(dueTime) : 'No time'
      };
    }

    const dueMoment = getTaskDueDateTime({ dueDate, dueTime });
    if (!dueMoment) {
      return {
        statusText: task.done ? 'Done' : 'Open',
        stateClass: task.done ? 'is-done' : 'is-open',
        dueDateLabel: formatDueDateLabel(dueDate),
        dueTimeLabel: formatDueTimeLabel(dueTime)
      };
    }

    if (task.done) {
      return {
        statusText: 'Done',
        stateClass: 'is-done',
        dueDateLabel: formatDueDateLabel(dueDate),
        dueTimeLabel: formatDueTimeLabel(dueTime)
      };
    }

    const now = new Date();
    const diff = dueMoment.getTime() - now.getTime();
    const twoDays = 48 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (diff < 0) {
      return {
        statusText: 'Overdue',
        stateClass: 'is-overdue',
        dueDateLabel: formatDueDateLabel(dueDate),
        dueTimeLabel: formatDueTimeLabel(dueTime)
      };
    }

    if (diff <= twoDays) {
      return {
        statusText: 'Due Soon',
        stateClass: 'is-soon',
        dueDateLabel: formatDueDateLabel(dueDate),
        dueTimeLabel: formatDueTimeLabel(dueTime)
      };
    }

    if (diff <= sevenDays) {
      return {
        statusText: 'Upcoming',
        stateClass: 'is-upcoming',
        dueDateLabel: formatDueDateLabel(dueDate),
        dueTimeLabel: formatDueTimeLabel(dueTime)
      };
    }

    return {
      statusText: 'Scheduled',
      stateClass: 'is-open',
      dueDateLabel: formatDueDateLabel(dueDate),
      dueTimeLabel: formatDueTimeLabel(dueTime)
    };
  }

  function setDashboardStat(selector, value) {
    const el = $(selector);
    if (el) el.textContent = String(value);
  }

  function closeTaskContextMenus() {
    const board = $('#hwDataTable');
    if (!board) return;

    board.querySelectorAll('.hw-task-menu').forEach(menu => {
      menu.hidden = true;
    });
    board.querySelectorAll('.hw-task-menu-btn').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
    activeTaskMenuId = null;
  }

  function toggleTaskMenu(taskId, triggerBtn) {
    const board = $('#hwDataTable');
    if (!board || !taskId) return;

    const menu = board.querySelector(`.hw-task-menu[data-task-menu="${CSS.escape(taskId)}"]`);
    if (!menu) return;

    const isOpening = menu.hidden;
    closeTaskContextMenus();

    if (isOpening) {
      menu.hidden = false;
      if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
      activeTaskMenuId = taskId;
    }
  }

  function renderHomeworkTaskRow(task) {
    const dueState = getTaskDueState(task);
    const difficulty = normalizeDifficulty(task.difficulty);
    const priority = normalizePriority(task.priority);

    return `
      <li class="hw-assignment ${task.done ? 'is-done' : ''}" data-task-id="${escHtml(task.id)}">
        <div class="hw-assignment-head">
          <div class="hw-assignment-title-wrap">
            <span class="hw-task-badge">Assignment</span>
            <div class="hw-assignment-title">${escHtml(task.title)}</div>
          </div>
          <div class="hw-assignment-menu-wrap">
            <button type="button" class="hw-task-menu-btn" data-task-menu-trigger="${escHtml(task.id)}" aria-haspopup="menu" aria-expanded="false" aria-label="Assignment actions">
              <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
            </button>
            <div class="hw-task-menu" data-task-menu="${escHtml(task.id)}" role="menu" hidden>
              <button type="button" data-task-open="${escHtml(task.id)}" role="menuitem">Open details</button>
              <button type="button" data-task-toggle="${escHtml(task.id)}" role="menuitem">${task.done ? 'Mark as open' : 'Mark as done'}</button>
              <button type="button" class="danger" data-task-delete="${escHtml(task.id)}" role="menuitem">Delete assignment</button>
            </div>
          </div>
        </div>
        <div class="hw-assignment-meta">
          <span class="hw-meta-chip hw-meta-due"><i class="fas fa-calendar-day" aria-hidden="true"></i>${escHtml(dueState.dueDateLabel)}</span>
          <span class="hw-meta-chip hw-meta-time"><i class="fas fa-clock" aria-hidden="true"></i>${escHtml(dueState.dueTimeLabel)}</span>
          <span class="hw-meta-chip hw-meta-difficulty">Difficulty: ${escHtml(difficulty.charAt(0).toUpperCase() + difficulty.slice(1))}</span>
          <span class="hw-meta-chip hw-meta-priority">Urgency: ${escHtml(priority.charAt(0).toUpperCase() + priority.slice(1))}</span>
          <span class="hw-status-chip ${escHtml(dueState.stateClass)}">${escHtml(dueState.statusText)}</span>
        </div>
      </li>
    `;
  }

  function renderCoursePanel(course, laneType, tasksByCourse) {
    const courseTasks = (tasksByCourse.get(String(course.id)) || []).slice().sort(compareHomeworkTasks);
    const openCount = courseTasks.filter(task => !task.done).length;
    const dueSoonCount = courseTasks.filter(task => !task.done && getTaskDueState(task).stateClass === 'is-soon').length;

    const assignmentMarkup = courseTasks.length
      ? `<ul class="hw-assignment-list">${courseTasks.map(renderHomeworkTaskRow).join('')}</ul>`
      : `
        <div class="hw-lane-empty">
          <p class="hw-empty-copy">No assignments yet.</p>
          <button type="button" class="hw-lane-action" data-open-add-assignment="${escHtml(course.id)}">+ Add Assignment</button>
        </div>
      `;

    return `
      <article class="hw-course-panel ${laneType === 'misc' ? 'is-misc' : ''}">
        <div class="hw-course-row">
          <div>
            <div class="hw-course-title">${escHtml(course.name)}${laneType === 'misc' ? ' <span class="hw-misc-badge">Misc</span>' : ''}</div>
            <div class="hw-course-meta">${openCount} open · ${courseTasks.length} total${dueSoonCount ? ` · ${dueSoonCount} due soon` : ''}</div>
          </div>
          <button class="hw-course-remove" type="button" data-course-delete="${escHtml(course.id)}" aria-label="Remove ${escHtml(course.name)}">&times;</button>
        </div>
        ${assignmentMarkup}
      </article>
    `;
  }

  function renderGlobalAssignmentComposer() {
    const classCourses = courses.filter(course => course.type === 'class');
    const miscCourses = courses.filter(course => course.type === 'misc');
    const classOptions = classCourses.map(course => `<option value="${escHtml(course.id)}">${escHtml(course.name)}</option>`).join('');
    const miscOptions = miscCourses.map(course => `<option value="${escHtml(course.id)}">${escHtml(course.name)}</option>`).join('');

    return `
      <section class="hw-global-add-wrap">
        <button type="button" id="hwOpenAddAssignment" class="hw-global-add-trigger" aria-label="Add assignment or task" title="Add assignment or task">
          <i class="fas fa-plus" aria-hidden="true"></i>
        </button>
        <div class="hw-global-add-modal" id="hwGlobalAddModal" hidden>
          <div class="hw-global-add-card" role="dialog" aria-modal="true" aria-labelledby="hwGlobalAddTitle">
            <div class="hw-global-add-head">
              <h3 id="hwGlobalAddTitle" class="hw-global-add-title">Add Assignment / Task</h3>
              <button type="button" class="hw-global-close" id="hwCloseAddAssignment" aria-label="Close add assignment">&times;</button>
            </div>
            <form id="hwGlobalAddForm" class="hw-global-add-form" autocomplete="off">
              <input type="text" data-field="title" placeholder="Assignment title" maxlength="180" />
              <div class="hw-global-course-grid">
                <div class="hw-global-course-col">
                  <div class="hw-global-col-head">
                    <label for="hwClassCourseSelect">Classes</label>
                    <button type="button" class="hw-global-mini-add" data-add-course-modal="class">+ Add</button>
                  </div>
                  <select id="hwClassCourseSelect" data-field="classCourseId">
                    ${classOptions ? `<option value="">Select class</option>${classOptions}` : '<option value="">No classes yet</option>'}
                  </select>
                </div>
                <div class="hw-global-course-col">
                  <div class="hw-global-col-head">
                    <label for="hwMiscCourseSelect">Extracurriculars</label>
                    <button type="button" class="hw-global-mini-add" data-add-course-modal="misc">+ Add</button>
                  </div>
                  <select id="hwMiscCourseSelect" data-field="miscCourseId">
                    ${miscOptions ? `<option value="">Select activity</option>${miscOptions}` : '<option value="">No activities yet</option>'}
                  </select>
                </div>
              </div>
              <div class="hw-global-meta-row">
                <input type="date" data-field="dueDate" />
                <input type="time" data-field="dueTime" />
                <select data-field="difficulty">
                  <option value="easy">Easy</option>
                  <option value="medium" selected>Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  function renderCourseLane(options) {
    const { laneType, title, subtitle, emptyCopy } = options;
    const laneCourses = courses.filter(course => course.type === laneType);
    const tasksByCourse = tasks.reduce((map, task) => {
      const key = String(task.courseId || '');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
      return map;
    }, new Map());

    const addLabel = laneType === 'misc' ? 'Activity' : 'Subject';

    const bodyMarkup = laneCourses.length
      ? `<div class="hw-course-grid">${laneCourses.map(course => renderCoursePanel(course, laneType, tasksByCourse)).join('')}</div>`
      : `
        <div class="hw-lane-empty">
          <p class="hw-empty-copy">${escHtml(emptyCopy)}</p>
          <button type="button" class="hw-lane-action" data-course-add="${escHtml(laneType)}">+ Add ${escHtml(addLabel)}</button>
        </div>
      `;

    return `
      <section class="hw-lane" data-lane="${escHtml(laneType)}">
        <div class="hw-lane-head">
          <div>
            <h3 class="hw-lane-title">${escHtml(title)}</h3>
            <p class="hw-lane-sub">${escHtml(subtitle)}</p>
          </div>
          <button type="button" class="hw-btn hw-btn-compact" data-course-add="${escHtml(laneType)}">+ Add ${escHtml(addLabel)}</button>
        </div>
        <div class="hw-lane-list">${bodyMarkup}</div>
      </section>
    `;
  }

  function renderLegacyTable() {
    const tbody = $('#tasksBody');
    if (!tbody) return false;

    if (!tasks.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="small muted">No homework yet.</td></tr>';
      return true;
    }

    const courseMap = new Map(courses.map(course => [String(course.id), course]));

    tbody.innerHTML = tasks.map(task => {
      const course = courseMap.get(String(task.courseId));
      const subject = course ? course.name : 'General';
      return `
        <tr class="${task.done ? 'done' : ''}">
          <td>${escHtml(subject)}</td>
          <td>${escHtml(task.title)}</td>
          <td>${escHtml(task.dueDate || '')}</td>
          <td>${escHtml(normalizePriority(task.priority))}</td>
          <td>
            <button type="button" class="btn-ghost" data-task-toggle="${escHtml(task.id)}">${task.done ? 'Undo' : 'Done'}</button>
            <button type="button" class="btn-ghost" data-task-delete="${escHtml(task.id)}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    return true;
  }

  function render() {
    const board = $('#hwDataTable');
    const headerActions = $('#view-homework .hw-header-actions');
    if (!board) {
      renderLegacyTable();
      return;
    }

    const openTasks = tasks.filter(task => !task.done);
    const completedCount = tasks.length - openTasks.length;
    const dueSoonCount = openTasks.reduce((count, task) => {
      const dueMoment = getTaskDueDateTime(task);
      if (!dueMoment) return count;
      const diff = dueMoment.getTime() - Date.now();
      return diff >= 0 && diff <= (7 * 24 * 60 * 60 * 1000) ? count + 1 : count;
    }, 0);
    const completionPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

    setDashboardStat('#hwStatOpen', openTasks.length);
    setDashboardStat('#hwStatDueSoon', dueSoonCount);
    setDashboardStat('#hwStatCompleted', completedCount);
    setDashboardStat('#hwStatCourses', courses.length);
    setDashboardStat('#hwStatProgress', `${completionPercent}% completed`);

    if (headerActions) {
      headerActions.querySelectorAll('.hw-global-add-wrap').forEach(node => node.remove());
      headerActions.insertAdjacentHTML('beforeend', renderGlobalAssignmentComposer());
    }

    board.innerHTML = [
      renderCourseLane({
        laneType: 'class',
        title: 'Classes',
        subtitle: 'Assignments grouped by class.',
        emptyCopy: 'No subjects yet. Add one to start organizing homework.'
      }),
      renderCourseLane({
        laneType: 'misc',
        title: 'Extracurriculars',
        subtitle: 'Clubs, projects, and non-class commitments.',
        emptyCopy: 'No activities yet. Add one to track work outside class.'
      })
    ].join('');

    bindBoardInteractions(board);
  }

  function inferPriorityFromDueDate(dueDate) {
    const normalizedDate = normalizeDueDate(dueDate);
    if (!normalizedDate) return 'medium';

    const today = startOfDay(new Date());
    const due = new Date(`${normalizedDate}T00:00:00`);
    if (Number.isNaN(due.getTime())) return 'medium';

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays <= 0) return 'high';
    if (diffDays <= 2) return 'medium';
    return 'low';
  }

  function addTaskToCourse(courseId, payload) {
    const title = String(payload.title || '').trim();
    if (!title) return false;

    tasks.push(serializeTask({
      id: uid(),
      courseId,
      title,
      done: false,
      dueDate: normalizeDueDate(payload.dueDate),
      dueTime: normalizeDueTime(payload.dueTime),
      priority: normalizePriority(payload.priority || inferPriorityFromDueDate(payload.dueDate)),
      difficulty: normalizeDifficulty(payload.difficulty || 'medium'),
      createdAt: new Date().toISOString()
    }));

    save();
    return true;
  }

  async function deleteCourse(courseId) {
    const target = courses.find(course => String(course.id) === String(courseId));
    if (!target) return;

    const confirmed = await showHomeworkConfirm(`Remove "${target.name}" and all assignments in it?`, {
      title: 'Delete Subject',
      confirmText: 'Delete Subject',
      cancelText: 'Keep Subject',
      confirmVariant: 'danger'
    });
    if (!confirmed) return;

    courses = courses.filter(course => String(course.id) !== String(courseId));
    tasks = tasks.filter(task => String(task.courseId) !== String(courseId));
    save();
    render();
  }

  function toggleTaskDone(taskId) {
    const task = tasks.find(row => String(row.id) === String(taskId));
    if (!task) return;
    task.done = !task.done;
    task.updatedAt = new Date().toISOString();
    save();
    render();
  }

  function deleteTask(taskId) {
    tasks = tasks.filter(task => String(task.id) !== String(taskId));
    save();
    render();
  }

  function openHomeworkTaskEditor(taskId) {
    const normalizedId = String(taskId || '').trim();
    if (!normalizedId) return;

    if (typeof window.openHomeworkTaskModal === 'function') {
      const opened = window.openHomeworkTaskModal('v2', normalizedId);
      if (opened) return;
    }

    if (typeof window.openTaskModal === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('homework:updated'));
      } catch (error) {
        // no-op
      }
      setTimeout(() => {
        try {
          window.openTaskModal(`hw_v2_${normalizedId}`);
        } catch (error) {
          // no-op
        }
      }, 180);
    }
  }

  function bindBoardInteractions(board) {
    const addModal = $('#hwGlobalAddModal');
    const openAddBtn = $('#hwOpenAddAssignment');
    const closeAddBtn = $('#hwCloseAddAssignment');
    const globalAddForm = $('#hwGlobalAddForm');
    if (globalAddForm) {
      const titleInput = $('[data-field="title"]', globalAddForm);
      const classSelect = $('[data-field="classCourseId"]', globalAddForm);
      const miscSelect = $('[data-field="miscCourseId"]', globalAddForm);
      const dueDateInput = $('[data-field="dueDate"]', globalAddForm);
      const dueTimeInput = $('[data-field="dueTime"]', globalAddForm);
      const difficultySelect = $('[data-field="difficulty"]', globalAddForm);

      if (titleInput && classSelect && miscSelect && dueDateInput && dueTimeInput && difficultySelect) {
        const openModal = (courseId = '') => {
          if (!addModal) return;
          const selectedCourseId = String(courseId || '').trim();
          if (selectedCourseId) {
            const selectedCourse = courses.find(course => String(course.id) === selectedCourseId);
            if (selectedCourse && selectedCourse.type === 'misc') {
              miscSelect.value = selectedCourseId;
              classSelect.value = '';
            } else {
              classSelect.value = selectedCourseId;
              miscSelect.value = '';
            }
          } else {
            classSelect.value = '';
            miscSelect.value = '';
          }
          addModal.hidden = false;
          setTimeout(() => titleInput.focus(), 40);
        };
        const closeModal = () => {
          if (!addModal) return;
          addModal.hidden = true;
        };

        if (openAddBtn) openAddBtn.addEventListener('click', () => openModal());
        if (closeAddBtn) closeAddBtn.addEventListener('click', closeModal);
        if (addModal) {
          addModal.addEventListener('click', event => {
            if (event.target === addModal) closeModal();
          });
        }

        document.querySelectorAll('[data-add-course-modal]').forEach(button => {
          button.addEventListener('click', () => {
            const laneType = button.getAttribute('data-add-course-modal') === 'misc' ? 'misc' : 'class';
            if (addModal && !addModal.hidden) closeModal();
            promptAddCourse(laneType);
          });
        });

        board.querySelectorAll('[data-open-add-assignment]').forEach(button => {
          button.addEventListener('click', () => {
            openModal(button.getAttribute('data-open-add-assignment'));
          });
        });

        classSelect.addEventListener('change', () => {
          if (classSelect.value) miscSelect.value = '';
        });
        miscSelect.addEventListener('change', () => {
          if (miscSelect.value) classSelect.value = '';
        });

        globalAddForm.addEventListener('submit', async event => {
          event.preventDefault();
          const selectedCourseId = String(classSelect.value || miscSelect.value || '').trim();
          if (!selectedCourseId) {
            await showHomeworkAlert('Select a class or extracurricular first.');
            return;
          }

          const created = addTaskToCourse(selectedCourseId, {
            title: titleInput.value,
            dueDate: dueDateInput.value,
            dueTime: dueTimeInput.value,
            difficulty: difficultySelect.value
          });
          if (!created) return;

          titleInput.value = '';
          dueDateInput.value = '';
          dueTimeInput.value = '';
          difficultySelect.value = 'medium';
          closeModal();
          render();
        });

        titleInput.addEventListener('keydown', event => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          globalAddForm.requestSubmit();
        });
      }
    }

    board.querySelectorAll('[data-course-add]').forEach(button => {
      button.addEventListener('click', () => {
        promptAddCourse(button.getAttribute('data-course-add'));
      });
    });

    board.querySelectorAll('[data-course-delete]').forEach(button => {
      button.addEventListener('click', async () => {
        await deleteCourse(button.getAttribute('data-course-delete'));
      });
    });

    board.querySelectorAll('[data-task-menu-trigger]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation();
        const taskId = button.getAttribute('data-task-menu-trigger');
        toggleTaskMenu(taskId, button);
      });
    });

    board.querySelectorAll('[data-task-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        closeTaskContextMenus();
        toggleTaskDone(button.getAttribute('data-task-toggle'));
      });
    });

    board.querySelectorAll('[data-task-delete]').forEach(button => {
      button.addEventListener('click', async () => {
        const confirmed = await showHomeworkConfirm('Delete this assignment?', {
          title: 'Delete Assignment',
          confirmText: 'Delete Assignment',
          cancelText: 'Keep Assignment',
          confirmVariant: 'danger'
        });
        if (!confirmed) return;
        closeTaskContextMenus();
        deleteTask(button.getAttribute('data-task-delete'));
      });
    });

    board.querySelectorAll('[data-task-open]').forEach(button => {
      button.addEventListener('click', () => {
        closeTaskContextMenus();
        openHomeworkTaskEditor(button.getAttribute('data-task-open'));
      });
    });
  }

  function addLegacyTask() {
    const subjectInput = $('#subject');
    const taskInput = $('#task');
    const dueInput = $('#duedate');
    const priorityInput = $('#priority');
    if (!taskInput) return;

    const title = taskInput.value.trim();
    if (!title) return;

    const subject = subjectInput ? subjectInput.value.trim() : '';
    let courseId = '';
    if (subject) {
      courseId = ensureCourseIdByName(subject, 'class');
    }

    addTaskToCourse(courseId, {
      title,
      dueDate: dueInput ? dueInput.value : '',
      dueTime: '',
      difficulty: 'medium',
      priority: priorityInput ? priorityInput.value : 'medium'
    });

    taskInput.value = '';
    if (dueInput) dueInput.value = '';
    taskInput.focus();
    render();
  }

  function exportJSON() {
    const payload = {
      schema: 'noteflow_homework_v3',
      exportedAt: new Date().toISOString(),
      courses,
      tasks: tasks.map(task => serializeTask(task))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `homework-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || '{}'));
        if (!payload || typeof payload !== 'object') {
          throw new Error('Invalid payload');
        }

        if (Array.isArray(payload.courses)) {
          courses = payload.courses;
        }
        if (Array.isArray(payload.tasks)) {
          tasks = payload.tasks;
        }

        normalizeState();
        save();
        render();
        showHomeworkAlert('Homework imported.', { title: 'Homework Import' });
      } catch (error) {
        showHomeworkAlert('Invalid homework JSON file.', { title: 'Homework Import' });
      }
    };
    reader.readAsText(file);
  }

  function isHomeworkViewActive() {
    const activeView = document.body && document.body.dataset ? document.body.dataset.view : '';
    if (activeView === 'homework') return true;
    const homeworkView = $('#view-homework');
    return !!(homeworkView && homeworkView.classList.contains('active'));
  }

  function showSetup() {
    const overlay = $('#hwSetupOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    overlay.classList.remove('fade-out');
    overlay.querySelectorAll('.hw-chip').forEach(chip => chip.remove());

    const classInput = $('#hwClassInput');
    const miscInput = $('#hwMiscInput');
    if (classInput) classInput.value = '';
    if (miscInput) miscInput.value = '';
  }

  function hideSetupImmediate() {
    const overlay = $('#hwSetupOverlay');
    if (!overlay) return;
    overlay.classList.remove('fade-out');
    overlay.style.display = 'none';
  }

  function hideSetup(callback) {
    const overlay = $('#hwSetupOverlay');
    if (!overlay) {
      if (typeof callback === 'function') callback();
      return;
    }

    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
      if (typeof callback === 'function') callback();
    }, 380);
  }

  function setupChipInput(wrapperSelector, inputSelector) {
    const wrapper = $(wrapperSelector);
    const input = $(inputSelector);
    if (!wrapper || !input) return;

    wrapper.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addChip(wrapper, input);
      }
      if (event.key === 'Backspace' && input.value === '') {
        const chips = wrapper.querySelectorAll('.hw-chip');
        if (chips.length) chips[chips.length - 1].remove();
      }
    });

    input.addEventListener('blur', () => {
      if (!input.value.trim()) return;
      addChip(wrapper, input);
    });
  }

  function addChip(wrapper, input) {
    const value = input.value.replace(/,/g, '').trim();
    if (!value) return;

    const chip = document.createElement('span');
    chip.className = 'hw-chip';
    chip.innerHTML = `${escHtml(value)} <button type="button" aria-label="Remove">&times;</button>`;

    const removeBtn = chip.querySelector('button');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => chip.remove());
    }

    wrapper.insertBefore(chip, input);
    input.value = '';
  }

  function collectChips(wrapperSelector) {
    return [...$$(`${wrapperSelector} .hw-chip`)]
      .map(chip => chip.textContent.replace('\u00d7', '').trim())
      .filter(Boolean);
  }

  function shouldPromptSetup() {
    return courses.length === 0;
  }

  function handleHomeworkViewChange(nextView) {
    const normalized = String(nextView || '').toLowerCase();
    if (normalized !== 'homework') {
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

  function init() {
    load();

    setupChipInput('#hwClassChips', '#hwClassInput');
    setupChipInput('#hwMiscChips', '#hwMiscInput');

    const addClassBtn = $('#hwAddClassBtn');
    const addMiscBtn = $('#hwAddMiscBtn');
    const exportBtn = $('#hwExportBtn');
    const importInput = $('#hwImportFile');
    const resetBtn = $('#hwResetBtn');
    const setupDoneBtn = $('#hwSetupDone');
    const setupSkipBtn = $('#hwSetupSkip');
    const setupOverlay = $('#hwSetupOverlay');

    const legacyAddBtn = $('#addBtn');
    const legacyTaskInput = $('#task');

    if (addClassBtn) addClassBtn.addEventListener('click', () => promptAddCourse('class'));
    if (addMiscBtn) addMiscBtn.addEventListener('click', () => promptAddCourse('misc'));
    if (exportBtn) exportBtn.addEventListener('click', exportJSON);

    if (importInput) {
      importInput.addEventListener('change', event => {
        const file = event.target && event.target.files ? event.target.files[0] : null;
        if (file) importJSON(file);
        event.target.value = '';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const confirmed = await showHomeworkConfirm('Clear all homework subjects and assignments?', {
          title: 'Reset Homework',
          confirmText: 'Clear Homework',
          cancelText: 'Keep Homework',
          confirmVariant: 'danger'
        });
        if (!confirmed) return;
        courses = [];
        tasks = [];
        save();
        showSetup();
      });
    }

    if (legacyAddBtn) legacyAddBtn.addEventListener('click', addLegacyTask);
    if (legacyTaskInput) {
      legacyTaskInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        addLegacyTask();
      });
    }

    if (setupSkipBtn) {
      setupSkipBtn.addEventListener('click', () => hideSetupImmediate());
    }

    if (setupOverlay) {
      setupOverlay.addEventListener('click', event => {
        if (event.target === setupOverlay) hideSetupImmediate();
      });
    }

    if (setupDoneBtn) {
      setupDoneBtn.addEventListener('click', async () => {
        const classNames = collectChips('#hwClassChips');
        const miscNames = collectChips('#hwMiscChips');

        if (!classNames.length && !miscNames.length) {
          await showHomeworkAlert('Add at least one subject or activity.');
          return;
        }

        classNames.forEach(name => courses.push({ id: uid(), name, type: 'class' }));
        miscNames.forEach(name => courses.push({ id: uid(), name, type: 'misc' }));

        save();
        hideSetup(() => render());
      });
    }

    document.addEventListener('click', event => {
      const board = $('#hwDataTable');
      if (!board) return;
      if (!board.contains(event.target)) {
        closeTaskContextMenus();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const courseQuickModal = $('#hwCourseQuickModal');
      if (courseQuickModal && !courseQuickModal.hidden) {
        courseQuickModal.hidden = true;
        return;
      }
      const addModal = $('#hwGlobalAddModal');
      if (addModal && !addModal.hidden) {
        addModal.hidden = true;
        return;
      }
      if (activeTaskMenuId) {
        closeTaskContextMenus();
        return;
      }
      if (!isHomeworkViewActive()) return;
      const overlay = $('#hwSetupOverlay');
      if (overlay && overlay.style.display !== 'none') hideSetupImmediate();
    });

    window.addEventListener('resize', () => {
      if (activeTaskMenuId) closeTaskContextMenus();
    });

    window.addEventListener('noteflow:view-changed', event => {
      const view = event && event.detail ? event.detail.view : '';
      handleHomeworkViewChange(view);
    });

    window.addEventListener('homework:updated', () => {
      load();
      if (isHomeworkViewActive()) render();
    });

    render();
    if (isHomeworkViewActive()) {
      handleHomeworkViewChange('homework');
    } else {
      hideSetupImmediate();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

