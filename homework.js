(() => {
  const STORAGE_KEY = 'homeworkTasks:v1';
  const COURSES_KEY = 'homeworkCourses:v1';
  const DB_NAME = 'noteflow_atelier_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'homework';

  const $subject = document.getElementById('subject');
  const $task = document.getElementById('task');
  const $duedate = document.getElementById('duedate');
  const $priority = document.getElementById('priority');
  const $addBtn = document.getElementById('addBtn');
  const $addCourseBtn = document.getElementById('addCourseBtn');
  const $newCourseName = document.getElementById('newCourseName');
  const $coursesList = document.getElementById('coursesList');
  const $coursesListUl = document.getElementById('coursesListUl');
  const $tasksBody = document.getElementById('tasksBody');
  const $exportBtn = document.getElementById('hwExportBtn');
  const $importFile = document.getElementById('hwImportFile');

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

  // --- IndexedDB helpers (simple promise wrapper) ---
  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) { console.warn('IDB open error', e); resolve(null); };
    });
  }

  async function idbGetAll() {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async function idbPut(item) {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async function idbDelete(id) {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  async function idbClearAll() {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }

  // --- Storage abstraction: prefer IDB, fallback to localStorage ---
  async function load() {
    try {
      const idb = await idbGetAll();
      if (idb && idb.length >= 0) return idb;
    } catch (e) { /* fallback */ }
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }

  async function saveItem(item) {
    try { await idbPut(item); } catch(e) { /* ignore */ }
    // always mirror into localStorage list
    const list = await loadLocalOnly();
    const idx = list.findIndex(x=>x.id===item.id);
    if(idx===-1) list.push(item); else list[idx]=item;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  async function deleteItem(id) {
    try { await idbDelete(id); } catch(e) {}
    const list = await loadLocalOnly();
    const idx = list.findIndex(x=>x.id===id);
    if(idx!==-1) { list.splice(idx,1); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
  }

  async function clearAll() {
    try { await idbClearAll(); } catch(e) {}
    localStorage.removeItem(STORAGE_KEY);
  }

  function loadLocalOnly(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; } }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Courses helpers (simple localStorage-backed list)
  // Courses helpers (store as objects {id,name})
  function loadCourses(){ try { return JSON.parse(localStorage.getItem(COURSES_KEY) || '[]'); } catch(e){ return []; } }
  function saveCourses(list){ try { localStorage.setItem(COURSES_KEY, JSON.stringify(list)); } catch(e){} }
  function populateCoursesDatalist(){
    const list = loadCourses();
    if(!$coursesList) return;
    $coursesList.innerHTML = '';
    for(const c of list){ const opt = document.createElement('option'); opt.value = c.name; $coursesList.appendChild(opt); }
  }

  // render courses list in sidebar
  let selectedCourseId = localStorage.getItem('homeworkSelectedCourse') || null;
  function renderCoursesList(){
    const list = loadCourses();
    if(!$coursesListUl) return;
    $coursesListUl.innerHTML = '';
    for(const c of list){
      const li = document.createElement('li');
      li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center';
      const btn = document.createElement('button');
      btn.textContent = c.name; btn.className = 'btn-ghost'; btn.style.flex = '1';
      if(c.id === selectedCourseId) btn.style.fontWeight = '700';
      btn.addEventListener('click', ()=> selectCourse(c.id));
      const del = document.createElement('button'); del.className = 'btn-ghost'; del.textContent = '✕'; del.title = 'Delete course';
      del.addEventListener('click', (e)=>{ e.stopPropagation(); removeCourse(c.id); });
      li.appendChild(btn); li.appendChild(del); $coursesListUl.appendChild(li);
    }
  }

  function selectCourse(id){
    const courses = loadCourses();
    const c = courses.find(x=>x.id===id);
    if(!c) return;
    selectedCourseId = id;
    localStorage.setItem('homeworkSelectedCourse', id);
    if($subject) $subject.value = c.name;
    render(); renderCoursesList();
  }

  async function removeCourse(id){
    const courses = loadCourses();
    const c = courses.find(x=>x.id===id);
    if(!c) return;
    const ok = confirm('Delete course "' + c.name + '" and its assignments? OK deletes both, Cancel deletes only the course.');
    const newCourses = courses.filter(x=>x.id!==id);
    saveCourses(newCourses);
    if(ok){
      // delete tasks with this courseId
      const tasks = await load();
      for(const t of tasks){ if(t.courseId===id) await deleteItem(t.id); }
    } else {
      // clear courseId from tasks
      const tasks = await load();
      for(const t of tasks){ if(t.courseId===id){ t.courseId = null; await saveItem(t); } }
    }
    if(selectedCourseId === id) selectedCourseId = null;
    localStorage.removeItem('homeworkSelectedCourse');
    populateCoursesDatalist(); renderCoursesList(); render();
  }

  async function addCourse(){
    const name = ($newCourseName && $newCourseName.value || '').trim();
    if(!name) { if(!name) { alert('Enter a course name'); return; } }
    const list = loadCourses();
    if(list.some(x=>x.name === name)){
      // select existing
      const existing = list.find(x=>x.name===name); selectCourse(existing.id); $newCourseName.value=''; return;
    }
    const c = { id: uid(), name };
    list.push(c); saveCourses(list); $newCourseName.value=''; populateCoursesDatalist(); renderCoursesList(); selectCourse(c.id);
  }

  // --- UI rendering and actions ---
  async function render() {
    const all = (await load()).slice();
    // filter by selected course if present
    const list = selectedCourseId ? all.filter(t => t.courseId === selectedCourseId) : all.slice();
    list.sort((a,b)=>{ if(!a.duedate) return 1; if(!b.duedate) return -1; return new Date(a.duedate) - new Date(b.duedate); });
    $tasksBody.innerHTML = '';
    for (const item of list) {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;
      // find course name
      const courses = loadCourses();
      const course = courses.find(c=>c.id===item.courseId);
      tr.innerHTML = `
        <td class="${item.done? 'done':''}">${escapeHtml(course? course.name : (item.subject||''))}</td>
        <td class="${item.done? 'done':''}"><input class="edit-task" value="${escapeHtml(item.task||'')}" /></td>
        <td><input type="date" class="edit-duedate" value="${item.duedate? escapeHtml(item.duedate): ''}" /></td>
        <td>
          <select class="edit-priority">
            <option value="low" ${item.priority==='low'?'selected':''}>Low</option>
            <option value="med" ${item.priority==='med'?'selected':''}>Medium</option>
            <option value="high" ${item.priority==='high'?'selected':''}>High</option>
          </select>
        </td>
        <td style="white-space:nowrap">
          <button data-id="${item.id}" class="btn-ghost toggle">${item.done? 'Undone':'Done'}</button>
          <button data-id="${item.id}" class="btn-ghost save">Save</button>
          <button data-id="${item.id}" class="btn-ghost del">Delete</button>
        </td>
      `;
      $tasksBody.appendChild(tr);
    }
  }

  async function addTask() {
    const subject = $subject.value.trim();
    const task = $task.value.trim();
    const duedate = $duedate.value || '';
    const priority = $priority.value || 'low';
    if(!task) { $task.focus(); return; }
    // determine courseId from selectedCourseId or match by name
    let courseId = selectedCourseId || null;
    if(!courseId){
      const courses = loadCourses(); const match = courses.find(c=>c.name === subject); if(match) courseId = match.id;
    }
    const item = { id: uid(), subject, task, duedate, priority, done: false, courseId };
    await saveItem(item);
    $subject.value=''; $task.value=''; $duedate.value=''; $priority.value='low';
    await render();
  }

  $addBtn?.addEventListener('click', addTask);
  $task?.addEventListener('keydown', (e)=>{ if(e.key==='Enter') addTask(); });

  // course wiring
  $addCourseBtn?.addEventListener('click', addCourse);
  populateCoursesDatalist(); renderCoursesList();
  // auto-select first course if none
  (function(){ const cs = loadCourses(); if(!selectedCourseId && cs.length) selectCourse(cs[0].id); })();

  $tasksBody?.addEventListener('click', async (e)=>{
    const id = e.target.getAttribute('data-id') || (e.target.closest && e.target.closest('tr') && e.target.closest('tr').dataset.id);
    if(!id) return;
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if(!row) return;
    const list = await load();
    const idx = list.findIndex(x=>x.id===id);
    if(idx===-1) return;
    if(e.target.classList.contains('del')){
      await deleteItem(id); await render(); return;
    }
    if(e.target.classList.contains('toggle')){
      list[idx].done = !list[idx].done; await saveItem(list[idx]); await render(); return;
    }
    if(e.target.classList.contains('save')){
      // gather edited values from inputs
      const subjectV = row.querySelector('.edit-subject').value.trim();
      const taskV = row.querySelector('.edit-task').value.trim();
      const dueV = row.querySelector('.edit-duedate').value || '';
      const pr = row.querySelector('.edit-priority').value || 'low';
      list[idx].subject = subjectV; list[idx].task = taskV; list[idx].duedate = dueV; list[idx].priority = pr;
      await saveItem(list[idx]); await render(); return;
    }
  });

  // Export current tasks as JSON file
  $exportBtn?.addEventListener('click', async ()=>{
    const list = await load();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'homework.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Import JSON file and merge (overwrite by id)
  $importFile?.addEventListener('change', async (e)=>{
    const f = e.target.files && e.target.files[0]; if(!f) return;
    try {
      const txt = await f.text();
      const incoming = JSON.parse(txt);
      if(!Array.isArray(incoming)) throw new Error('Invalid format');
      // write to IDB/localStorage
      for (const it of incoming) {
        if(!it.id) it.id = uid();
        await saveItem(it);
      }
      await render();
    } catch(err){ alert('Import failed: ' + err.message); }
    e.target.value = '';
  });

  // Initial render
  render();
})();
