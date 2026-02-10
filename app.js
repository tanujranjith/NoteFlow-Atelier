function updateToolbarTimeWidget() {
                const widget = document.getElementById('toolbarTimeWidget');
                if (!widget) return;
            const formatSelect = document.getElementById('timeFormatSelect');
            const showSecondsSelect = document.getElementById('showSecondsSelect');
            const format = formatSelect ? formatSelect.value : (appSettings ? appSettings.timeFormat || '12' : '12');
            const showSeconds = showSecondsSelect ? showSecondsSelect.value === 'true' : (appSettings ? appSettings.showSeconds !== false : true);
                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes().toString().padStart(2, '0');
                let seconds = now.getSeconds().toString().padStart(2, '0');
                let timeStr = '';
                if (format === '24') {
                    timeStr = hours.toString().padStart(2, '0') + ':' + minutes;
                    if (showSeconds) timeStr += ':' + seconds;
                } else {
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    timeStr = hours + ':' + minutes;
                    if (showSeconds) timeStr += ':' + seconds;
                    timeStr += ' ' + ampm;
                }
                widget.textContent = timeStr;
            }
            function toggleToolbarTimeControls(e) {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                const controls = document.getElementById('toolbarTimeControls');
                if (!controls) return;
                controls.style.display = controls.style.display === 'none' ? 'inline-flex' : 'none';
                if (controls.style.display !== 'none') {
                    setTimeout(positionToolbarTimeControls, 0);
                } else {
                    controls.style.transform = 'translateX(0)';
                }
            }
            function hideToolbarTimeControls() {
                const controls = document.getElementById('toolbarTimeControls');
                if (controls) {
                    controls.style.display = 'none';
                    controls.style.transform = 'translateX(0)';
                }
            }

            function positionToolbarTimeControls() {
                const controls = document.getElementById('toolbarTimeControls');
                if (!controls || controls.style.display === 'none') return;
                const clampContainer = controls.closest('.tabs-shell') || document.querySelector('.toolbar-wrapper');
                if (!clampContainer) return;

                controls.style.transform = 'translateX(0)';
                const wrapperRect = clampContainer.getBoundingClientRect();
                const controlsRect = controls.getBoundingClientRect();
                const gutter = 8;

                let dx = 0;
                if (controlsRect.right > wrapperRect.right - gutter) {
                    dx = controlsRect.right - (wrapperRect.right - gutter);
                }
                if (controlsRect.left - dx < wrapperRect.left + gutter) {
                    dx = controlsRect.left - (wrapperRect.left + gutter);
                }
                if (dx !== 0) {
                    controls.style.transform = `translateX(${-Math.round(dx)}px)`;
                }
            }

            function syncToolbarLayoutWithSidebar() {
                const toolbarWrapper = document.querySelector('.toolbar-wrapper');
                const sidebar = document.getElementById('sidebar');
                if (!toolbarWrapper || !sidebar) return;

                if (window.innerWidth <= 768) {
                    toolbarWrapper.style.left = '0';
                    toolbarWrapper.style.right = '0';
                    toolbarWrapper.style.maxWidth = 'none';
                } else if (sidebar.classList.contains('collapsed')) {
                    toolbarWrapper.style.left = '16px';
                    toolbarWrapper.style.right = '16px';
                    toolbarWrapper.style.maxWidth = 'calc(100% - 32px)';
                } else {
                    toolbarWrapper.style.left = 'calc(var(--sidebar-width) + 16px)';
                    toolbarWrapper.style.right = '16px';
                    toolbarWrapper.style.maxWidth = 'calc(100% - (var(--sidebar-width) + 32px))';
                }

                setTimeout(() => {
                    try { updateScrollButtons(); } catch (err) { /* non-critical */ }
                    positionToolbarTimeControls();
                }, 0);
            }
            document.addEventListener('DOMContentLoaded', function() {
                updateToolbarTimeWidget();
                setInterval(updateToolbarTimeWidget, 1000);
                const formatSelect = document.getElementById('timeFormatSelect');
                const showSecondsSelect = document.getElementById('showSecondsSelect');
                if (formatSelect) formatSelect.addEventListener('change', updateToolbarTimeWidget);
                if (showSecondsSelect) showSecondsSelect.addEventListener('change', updateToolbarTimeWidget);
                const gearBtn = document.getElementById('toolbarTimeGear');
                if (gearBtn) gearBtn.addEventListener('click', toggleToolbarTimeControls);
                document.addEventListener('click', function(e) {
                    // Only hide if click is outside the time widget area
                    const timeElegant = document.querySelector('.toolbar-time-elegant');
                    if (timeElegant && !timeElegant.contains(e.target)) {
                        hideToolbarTimeControls();
                    }
                });
                
                // Initialize toolbar scroll buttons
                initToolbarScroll();
                syncToolbarLayoutWithSidebar();
                window.addEventListener('resize', () => {
                    syncToolbarLayoutWithSidebar();
                    positionToolbarTimeControls();
                });
                // Populate progress dashboard (safe call)
                try { populateProgressDashboard(); } catch (e) { console.warn('populateProgressDashboard failed', e); }
            });
            
            // Toolbar scroll functions
            function scrollToolbar(amount) {
                const toolbar = document.getElementById('toolbar');
                if (toolbar) {
                    toolbar.scrollBy({ left: amount, behavior: 'smooth' });
                }
            }
            
            function updateScrollButtons() {
                const toolbar = document.getElementById('toolbar');
                const leftBtn = document.getElementById('toolbarScrollLeft');
                const rightBtn = document.getElementById('toolbarScrollRight');
                
                if (!toolbar || !leftBtn || !rightBtn) return;
                
                const scrollLeft = toolbar.scrollLeft;
                const scrollWidth = toolbar.scrollWidth;
                const clientWidth = toolbar.clientWidth;
                const maxScroll = scrollWidth - clientWidth;
                
                // Show/hide left button
                if (scrollLeft > 5) {
                    leftBtn.classList.add('visible');
                } else {
                    leftBtn.classList.remove('visible');
                }
                
                // Show/hide right button
                if (scrollLeft < maxScroll - 5) {
                    rightBtn.classList.add('visible');
                } else {
                    rightBtn.classList.remove('visible');
                }
            }
            
            function initToolbarScroll() {
                const toolbar = document.getElementById('toolbar');
                if (!toolbar) return;
                
                // Update buttons on scroll
                toolbar.addEventListener('scroll', updateScrollButtons);
                
                // Update buttons on window resize
                window.addEventListener('resize', updateScrollButtons);
                
                // Initial update
                setTimeout(updateScrollButtons, 100);
            }

// -------------------------
// Progress dashboard wiring
// -------------------------
function formatDateKey(d) {
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
}

function safeGetTasks() {
    return Array.isArray(tasks) ? tasks : [];
}

function parseDateField(v) {
    if (!v) return null;
    const d = new Date(v);
    if (!isNaN(d)) return d;
    return null;
}

function countCompletionsInRange(startDate, endDate) {
    const ts = safeGetTasks();
    let count = 0;
    ts.forEach(t => {
        // prefer a 'completedAt' or 'completed' with timestamp fields
        const cand = t.completedAt || t.completedDate || t.lastCompletedAt || t.completedOn || null;
        if (cand) {
            const d = parseDateField(cand);
            if (d && d >= startDate && d <= endDate) count++;
        } else if (t.completed === true) {
            // no timestamp, assume it's completed sometime — count it conservatively
            count++;
        }
    });
    return count;
}

function buildSparklineData(daysBack) {
    const now = new Date();
    const arr = [];
    for (let i = daysBack-1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999);
        arr.push(countCompletionsInRange(start, end));
    }
    return arr;
}

function renderSparkline(el, data) {
    if (!el) return;
    const w = 220, h = 40, pad = 6;
    const max = Math.max(1, ...data);
    const step = (w - pad*2) / Math.max(1, data.length-1);
    const points = data.map((v,i) => {
        const x = pad + i*step;
        const y = pad + (1 - (v/max)) * (h - pad*2);
        return x + ',' + y;
    }).join(' ');
    const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polyline fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2" points="${points}" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
    el.innerHTML = svg;
}

function renderHeatmap(el, counts) {
    if (!el) return;
    // simple 30 day row of squares
    const cols = 15; const rows = Math.ceil(counts.length/cols);
    let html = '<div style="display:grid; grid-template-columns: repeat('+cols+', 12px); gap:6px;">';
    const max = Math.max(1, ...counts);
    counts.forEach(c => {
        const alpha = Math.min(0.85, 0.12 + (c/max)*0.85);
        const color = `rgba(0,128,96,${alpha})`;
        html += `<div title="${c} activity" style="width:12px;height:12px;border-radius:3px;background:${color};"></div>`;
    });
    html += '</div>';
    el.innerHTML = html;
}

function renderDonut(el, breakdown) {
    if (!el) return;
    const total = Object.values(breakdown).reduce((s,v)=>s+v,0) || 1;
    const colors = ['#00b894','#6c5ce7','#ffb22b','#ff7675','#0984e3'];
    const size = 84; const stroke = 18; const c = size/2; const r = (size - stroke)/2;
    const circumference = 2*Math.PI*r;
    let offset = 0;
    let parts = '';
    let i = 0;
    for (const k in breakdown) {
        const val = breakdown[k];
        const frac = val/total;
        const dash = frac * circumference;
        parts += `<circle r="${r}" cx="${c}" cy="${c}" fill="transparent" stroke="${colors[i%colors.length]}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circumference-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${c} ${c})"></circle>`;
        offset += dash;
        i++;
    }
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${parts}</svg>`;
    el.innerHTML = svg;
}

function populateProgressDashboard() {
    const weeklyTotalEl = document.getElementById('weeklyTotal');
    const weeklyChangeEl = document.getElementById('weeklyChange');
    const sparkEl = document.getElementById('sparklineWeekly');
    const heatEl = document.getElementById('monthlyHeatmap');
    const donutEl = document.getElementById('categoryDonut');
    const legendEl = document.getElementById('categoryLegend');
    const streakEl = document.getElementById('streakCurrent');
    const bestEl = document.getElementById('streakBest');
    const longestEl = document.getElementById('streakLongest');

    const now = new Date();
    // helper: count completed tasks for a given dateKey (uses dayStates)
    function completedCountForDateKey(dateKeyStr) {
        const ds = dayStates[dateKeyStr];
        if (!ds || !ds.completedTaskIds) return 0;
        return Array.isArray(ds.completedTaskIds) ? ds.completedTaskIds.length : 0;
    }

    // weekly totals using dayStates
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    let weeklyCount = 0;
    for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
        weeklyCount += completedCountForDateKey(dateKey(new Date(d)));
    }
    if (weeklyTotalEl) weeklyTotalEl.textContent = String(weeklyCount);
    // compute percent change vs previous week
    if (weeklyChangeEl) {
        const prevStart = new Date(startOfWeek);
        prevStart.setDate(startOfWeek.getDate() - 7);
        prevStart.setHours(0,0,0,0);
        const prevEnd = new Date(prevStart);
        prevEnd.setDate(prevStart.getDate() + 6);
        prevEnd.setHours(23,59,59,999);

        let prevCount = 0;
        for (let d = new Date(prevStart); d <= prevEnd; d.setDate(d.getDate() + 1)) {
            prevCount += completedCountForDateKey(dateKey(new Date(d)));
        }

        let pct = 0;
        if (prevCount === 0) {
            pct = weeklyCount === 0 ? 0 : 100;
        } else {
            pct = Math.round(((weeklyCount - prevCount) / prevCount) * 100);
        }
        const sign = pct > 0 ? '+' : (pct < 0 ? '' : '+');
        weeklyChangeEl.textContent = `${sign}${pct}%`;
        weeklyChangeEl.classList.remove('positive','negative','neutral');
        weeklyChangeEl.classList.add(pct > 0 ? 'positive' : (pct < 0 ? 'negative' : 'neutral'));
        weeklyChangeEl.title = `${weeklyCount - prevCount >= 0 ? '+' : ''}${weeklyCount - prevCount} vs previous week`;
    }

    // sparkline: last 7 days using dayStates
    const sparkData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        sparkData.push(completedCountForDateKey(dateKey(d)));
    }
    renderSparkline(sparkEl, sparkData);

    // monthly heatmap (last 30 days) using dayStates
    const heatCounts = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        heatCounts.push(completedCountForDateKey(dateKey(d)));
    }
    renderHeatmap(heatEl, heatCounts);

    // category breakdown (last 30 days completed tasks by category) using dayStates
    const catCounts = {};
    const tasksArr = Array.isArray(tasks) ? tasks : [];
    // collect completed task ids in last 30 days
    const completedIds = new Set();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const ds = dayStates[dateKey(d)];
        if (ds && Array.isArray(ds.completedTaskIds)) ds.completedTaskIds.forEach(id => completedIds.add(id));
        if (ds && ds.freezeUsed) {
            // freeze doesn't provide task ids, but it's accounted in streak; no category impact
        }
    }
    // map ids to tasks
    completedIds.forEach(id => {
        const t = tasksArr.find(x => x.id === id) || {};
        const k = (t.category && String(t.category)) || 'Uncategorized';
        catCounts[k] = (catCounts[k]||0) + 1;
    });
    // Ensure at least some sample categories to avoid an empty donut
    if (Object.keys(catCounts).length === 0) { catCounts['Work'] = 0; catCounts['Personal'] = 0; }
    renderDonut(donutEl, catCounts);
    if (legendEl) {
        legendEl.innerHTML = '';
        Object.keys(catCounts).forEach((k, idx) => {
            const v = catCounts[k];
            const color = ['#00b894','#6c5ce7','#ffb22b','#ff7675','#0984e3'][idx%5];
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><span class="legend-color" style="background:${color}"></span><span>${k}</span></div><div class="legend-value">${v}</div>`;
            legendEl.appendChild(item);
        });
    }

    // Streaks
    const s = (typeof streakState !== 'undefined' && streakState) ? streakState : { globalCurrent:0, globalBest:0, freezesRemainingThisWeek:0 };
    const current = s.globalCurrent || (s.streakState && s.streakState.globalCurrent) || 0;
    const best = s.globalBest || (s.streakState && s.streakState.globalBest) || 0;
    if (streakEl) streakEl.textContent = String(current);
    if (bestEl) bestEl.textContent = String(best);
    if (longestEl) longestEl.textContent = String(best);

    // Update freeze count display if present
    const freezeLeftEl = document.getElementById('freezeLeft');
    if (freezeLeftEl) freezeLeftEl.textContent = String(s.freezesRemainingThisWeek || (s.streakState && s.streakState.freezesRemainingThisWeek) || 0);
}

// Google Drive API Configuration
        let CLIENT_ID = '';
        let API_KEY = '';
        const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        const SCOPES = 'https://www.googleapis.com/auth/drive.file';

        // Unified Storage (IndexedDB)
        const APP_DB_NAME = 'noteflow_atelier_db';
        const APP_DB_STORE = 'workspace';
        const APP_DB_KEY = 'root';
        const APP_SCHEMA_VERSION = 1;
        let appData = null;
        let pendingAppSave = null;

        function getDefaultAppData() {
            return {
                version: APP_SCHEMA_VERSION,
                pages: [],
                tasks: [],
                taskOrder: [],
                streaks: {
                    dayStates: {},
                    taskStreaks: {},
                    streakState: {
                        globalCurrent: 0,
                        globalBest: 0,
                        globalLastKeptDateKey: null,
                        freezesRemainingThisWeek: 2,
                        freezeWeekKey: null
                    }
                },
                settings: {
                    theme: 'light',
                    motionEnabled: true,
                    sidebarCollapsed: false,
                    timeFormat: '12',
                    showSeconds: true,
                    themeApplyMode: 'current',
                    selectedPagesForTheme: [],
                    font: {
                        fontFamily: 'Source Sans 3',
                        fontSize: '16px',
                        lineHeight: '1.6'
                    },
                    focusTimer: {
                        durationSeconds: 25 * 60,
                        remaining: 25 * 60,
                        running: false
                    },
                    soundEnabled: true,
                    hapticEnabled: true,
                    tutorialSeen: false,
                    tutorialCompleted: false,
                    tutorialCompletedAt: null,
                    drive: {
                        clientId: '',
                        apiKey: ''
                    }
                },
                ui: {
                    favoritePageId: null,
                    defaultPageId: null
                }
            };
        }

        function openAppDb() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(APP_DB_NAME, APP_SCHEMA_VERSION);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(APP_DB_STORE)) {
                        db.createObjectStore(APP_DB_STORE);
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function readAppData() {
            const db = await openAppDb();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(APP_DB_STORE, 'readonly');
                const store = tx.objectStore(APP_DB_STORE);
                const request = store.get(APP_DB_KEY);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        }

        async function writeAppData(data) {
            const db = await openAppDb();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(APP_DB_STORE, 'readwrite');
                const store = tx.objectStore(APP_DB_STORE);
                store.put(data, APP_DB_KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }

        function scheduleAppSave() {
            if (pendingAppSave) return;
            pendingAppSave = setTimeout(async () => {
                pendingAppSave = null;
                try {
                    await writeAppData(appData);
                } catch (e) {
                    console.error('Failed to save workspace data', e);
                }
            }, 250);
        }

        function mergeAppDataDefaults(stored) {
            const defaults = getDefaultAppData();
            const merged = { ...defaults, ...stored };
            merged.settings = { ...defaults.settings, ...(stored && stored.settings ? stored.settings : {}) };
            merged.settings.font = { ...defaults.settings.font, ...(stored && stored.settings && stored.settings.font ? stored.settings.font : {}) };
            merged.settings.drive = { ...defaults.settings.drive, ...(stored && stored.settings && stored.settings.drive ? stored.settings.drive : {}) };
            merged.ui = { ...defaults.ui, ...(stored && stored.ui ? stored.ui : {}) };
            merged.streaks = { ...defaults.streaks, ...(stored && stored.streaks ? stored.streaks : {}) };
            merged.streaks.dayStates = (stored && stored.streaks && stored.streaks.dayStates) || stored.dayStates || defaults.streaks.dayStates;
            merged.streaks.taskStreaks = (stored && stored.streaks && stored.streaks.taskStreaks) || stored.taskStreaks || defaults.streaks.taskStreaks;
            merged.streaks.streakState = { ...defaults.streaks.streakState, ...((stored && stored.streaks && stored.streaks.streakState) || stored.streakState || {}) };
            return merged;
        }

        function normalizeThemeName(name) {
            if (!name) return 'light';
            if (name === 'default') return 'light';
            if (name === 'dark') return 'dark';
            return 'light';
        }

        function migrateLegacyData() {
            const data = getDefaultAppData();

            try {
                const storedPages = localStorage.getItem('noteflow_pages');
                if (storedPages) data.pages = JSON.parse(storedPages);
            } catch (e) {
                console.warn('Unable to migrate NoteFlow pages', e);
            }

            try {
                const themeSettings = JSON.parse(localStorage.getItem('noteflow_theme_settings') || '{}');
                data.settings.theme = normalizeThemeName(themeSettings.globalTheme || 'light');
            } catch (e) {
                console.warn('Unable to migrate NoteFlow theme settings', e);
            }

            try {
                const fontSettings = JSON.parse(localStorage.getItem('noteflow_font_settings') || '{}');
                data.settings.font = { ...data.settings.font, ...fontSettings };
            } catch (e) {
                console.warn('Unable to migrate NoteFlow font settings', e);
            }

            try {
                const animations = localStorage.getItem('noteflow_animations');
                if (animations !== null) data.settings.motionEnabled = animations !== 'false';
            } catch (e) {
                console.warn('Unable to migrate animation settings', e);
            }

            try {
                const collapsed = localStorage.getItem('noteflow_sidebar_collapsed');
                if (collapsed !== null) data.settings.sidebarCollapsed = collapsed === 'true';
            } catch (e) {
                console.warn('Unable to migrate sidebar state', e);
            }

            try {
                data.ui.favoritePageId = localStorage.getItem('noteflow_favorite_page');
                data.ui.defaultPageId = localStorage.getItem('noteflow_default_page');
            } catch (e) {
                console.warn('Unable to migrate page prefs', e);
            }

            try {
                const todos = JSON.parse(localStorage.getItem('noteflow_todos') || '[]');
                todos.forEach(todo => {
                    const id = `nf_${todo.id || Date.now()}`;
                    const scheduleType = todo.recurring === 'daily' ? 'daily' : todo.recurring === 'weekly' ? 'weekly' : 'once';
                    const weeklyDays = scheduleType === 'weekly'
                        ? [new Date(todo.dueDate || Date.now()).getDay()]
                        : [];
                    data.tasks.push({
                        id,
                        title: todo.text || 'Untitled task',
                        notes: '',
                        scheduleType,
                        weeklyDays,
                        category: todo.category || 'none',
                        estimate: 0,
                        createdAt: todo.createdAt || new Date().toISOString(),
                        isActive: !todo.completed,
                        noteId: null,
                        dueDate: todo.dueDate || null,
                        origin: 'quick'
                    });
                    data.taskOrder.push(id);
                });
            } catch (e) {
                console.warn('Unable to migrate NoteFlow todos', e);
            }

            try {
                const streakState = JSON.parse(localStorage.getItem('streakApp:v1') || 'null');
                if (streakState) {
                    const tasks = streakState.tasks || [];
                    tasks.forEach(task => {
                        data.tasks.push({ ...task, noteId: task.noteId || null, origin: task.origin || 'streak' });
                    });
                    data.taskOrder = [...data.taskOrder, ...(streakState.taskOrder || tasks.map(t => t.id))];
                    data.streaks.dayStates = streakState.dayStates || {};
                    data.streaks.taskStreaks = streakState.taskStreaks || {};
                    data.streaks.streakState = { ...data.streaks.streakState, ...(streakState.streakState || {}) };
                }
            } catch (e) {
                console.warn('Unable to migrate Streaks data', e);
            }

            try {
                const streakSettings = JSON.parse(localStorage.getItem('streakApp:settings') || 'null');
                if (streakSettings) {
                    data.settings.soundEnabled = streakSettings.soundEnabled !== false;
                    data.settings.hapticEnabled = streakSettings.hapticEnabled !== false;
                }
            } catch (e) {
                console.warn('Unable to migrate Streaks settings', e);
            }

            return data;
        }

        async function initAppData() {
            const stored = await readAppData();
            if (stored) {
                appData = mergeAppDataDefaults(stored);
            } else {
                appData = migrateLegacyData();
                await writeAppData(appData);
            }
        }

        function getDefaultStreaks() {
            return JSON.parse(JSON.stringify(getDefaultAppData().streaks));
        }

        function hydrateStateFromAppData() {
            if (!appData) appData = getDefaultAppData();
            pages = Array.isArray(appData.pages) ? appData.pages : [];
            tasks = Array.isArray(appData.tasks) ? appData.tasks : [];
            taskOrder = Array.isArray(appData.taskOrder) ? appData.taskOrder : tasks.map(task => task.id);

            const defaultStreaks = getDefaultStreaks();
            const storedStreaks = appData.streaks || defaultStreaks;
            dayStates = storedStreaks.dayStates || {};
            taskStreaks = storedStreaks.taskStreaks || {};
            streakState = { ...defaultStreaks.streakState, ...(storedStreaks.streakState || {}) };

            appSettings = { ...getDefaultAppData().settings, ...(appData.settings || {}) };
            appSettings.font = { ...getDefaultAppData().settings.font, ...(appData.settings && appData.settings.font ? appData.settings.font : {}) };
            appSettings.drive = { ...getDefaultAppData().settings.drive, ...(appData.settings && appData.settings.drive ? appData.settings.drive : {}) };
            appSettings.focusTimer = { ...getDefaultAppData().settings.focusTimer, ...(appData.settings && appData.settings.focusTimer ? appData.settings.focusTimer : {}) };
            appSettings.selectedPagesForTheme = appSettings.selectedPagesForTheme || [];

            if (!appData.ui) appData.ui = { favoritePageId: null, defaultPageId: null };
        }

        function persistAppData() {
            if (!appData) return;
            appData.pages = pages;
            appData.tasks = tasks;
            appData.taskOrder = taskOrder;
            appData.streaks = {
                dayStates,
                taskStreaks,
                streakState
            };
            appData.settings = appSettings;
            scheduleAppSave();
        }

        // Application State
        let pages = [];
        let currentPageId = null;
        let pageToRenameId = null; // For rename functionality
        let isGoogleSignedIn = false;
        let themeApplyMode = 'current'; // 'current', 'all', 'custom'
        let selectedPagesForTheme = [];
        let globalTheme = 'default';
        let tasks = [];
        let taskOrder = [];
        let dayStates = {};
        let taskStreaks = {};
        let streakState = getDefaultStreaks().streakState;
        let appSettings = getDefaultAppData().settings;
        let activeView = 'today';
        let searchQuery = '';
        const HOMEWORK_STORAGE_KEYS = ['hwTasks:v2', 'hwCourses:v2', 'homeworkTasks:v1', 'homeworkCourses:v1'];
        let homeworkSyncBound = false;
        let tutorialRepositionTimer = null;
        const tutorialState = {
            active: false,
            stepIndex: 0,
            steps: [],
            openedThemePanel: false
        };

        // Theme configurations
        const themes = {
            default: {
                name: 'Default',
                bgPrimary: '#ffffff',
                bgSecondary: '#ffffff',
                bgHover: '#f5f7fa',
                textPrimary: '#2a2621',
                textSecondary: '#5f6670',
                border: 'rgba(22, 30, 45, 0.12)',
                accent: '#b8860b',
                editorBg: '#ffffff',
                codeBg: '#f5f7fa'
            },
            dark: {
                name: 'Dark',
                bgPrimary: '#0f0e0c',
                bgSecondary: '#171513',
                bgHover: '#201e1b',
                textPrimary: '#ece6dd',
                textSecondary: '#c3bbb1',
                border: 'rgba(255, 255, 255, 0.08)',
                accent: '#d2a74d',
                editorBg: '#14120f',
                codeBg: '#1c1a17'
            }
        };

    // No hard limit on commits per day — allow unlimited commits
    const MAX_COMMITS_PER_DAY = Infinity;
        const FREEZES_PER_WEEK = 2;
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const CATEGORY_COLORS = {
            none: '#9c9284',
            work: '#b8860b',
            health: '#7aa37a',
            personal: '#c27b66',
            learning: '#7a8bb6'
        };

        // Utility function for debouncing
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // -------------------- Focus Timer (single duration H:M:S) --------------------
        const FOCUS_KEY = 'noteflow_focus_timer';
        let focusTimer = {
            durationSeconds: 25 * 60,
            remaining: 25 * 60,
            running: false,
            intervalId: null
        };

        function formatTime(sec) {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
            const s = (sec % 60).toString().padStart(2, '0');
            return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
        }

        function saveFocusState() {
            if (appSettings) {
                appSettings.focusTimer = {
                    durationSeconds: focusTimer.durationSeconds,
                    remaining: focusTimer.remaining,
                    running: focusTimer.running
                };
                persistAppData();
            } else {
                const toSave = {
                    durationSeconds: focusTimer.durationSeconds,
                    remaining: focusTimer.remaining,
                    running: focusTimer.running
                };
                localStorage.setItem(FOCUS_KEY, JSON.stringify(toSave));
            }
        }

        function loadFocusState() {
            try {
                if (appSettings && appSettings.focusTimer) {
                    const obj = appSettings.focusTimer;
                    focusTimer.durationSeconds = typeof obj.durationSeconds === 'number' ? obj.durationSeconds : focusTimer.durationSeconds;
                    focusTimer.remaining = typeof obj.remaining === 'number' ? obj.remaining : focusTimer.durationSeconds;
                    focusTimer.running = !!obj.running;
                    return;
                }
                const stored = localStorage.getItem(FOCUS_KEY);
                if (stored) {
                    const obj = JSON.parse(stored);
                    focusTimer.durationSeconds = typeof obj.durationSeconds === 'number' ? obj.durationSeconds : focusTimer.durationSeconds;
                    focusTimer.remaining = typeof obj.remaining === 'number' ? obj.remaining : focusTimer.durationSeconds;
                    focusTimer.running = !!obj.running;
                } else {
                    focusTimer.remaining = focusTimer.durationSeconds;
                }
            } catch (e) {
                focusTimer.remaining = focusTimer.durationSeconds;
            }
        }

        function updateTimerUI() {
            const display = document.getElementById('timerDisplay');
            const modeEl = document.getElementById('timerMode');
            const progressBar = document.getElementById('timerProgress');
            if (!display || !modeEl || !progressBar) return;

            display.textContent = formatTime(focusTimer.remaining);
            modeEl.textContent = 'Timer';

            const total = Math.max(1, focusTimer.durationSeconds);
            const perc = Math.max(0, Math.min(100, ((total - focusTimer.remaining) / total) * 100));
            progressBar.style.width = perc + '%';

            // buttons
            document.getElementById('timerStartBtn').style.display = focusTimer.running ? 'none' : 'inline-block';
            document.getElementById('timerPauseBtn').style.display = focusTimer.running ? 'inline-block' : 'none';
        }

        function tickTimer() {
            if (!focusTimer.running) return;
            if (focusTimer.remaining > 0) {
                focusTimer.remaining -= 1;
                updateTimerUI();
            } else {
                pauseTimer();
                focusTimer.remaining = 0;
                saveFocusState();
                updateTimerUI();
                showToast('Time is up!');
            }
        }

        function startTimer() {
            if (focusTimer.running) return;
            focusTimer.running = true;
            focusTimer.intervalId = setInterval(tickTimer, 1000);
            saveFocusState();
            updateTimerUI();
        }

        function pauseTimer() {
            focusTimer.running = false;
            if (focusTimer.intervalId) {
                clearInterval(focusTimer.intervalId);
                focusTimer.intervalId = null;
            }
            saveFocusState();
            updateTimerUI();
        }

        function setDurationFromInputs() {
            const h = Number(document.getElementById('hoursInput')?.value || 0);
            const m = Number(document.getElementById('minutesInput')?.value || 0);
            const s = Number(document.getElementById('secondsInput')?.value || 0);
            const total = Math.max(1, (h * 3600) + (m * 60) + s);
            focusTimer.durationSeconds = total;
            if (!focusTimer.running) focusTimer.remaining = total;
            saveFocusState();
            updateTimerUI();
        }

        function resetTimer() {
            pauseTimer();
            setDurationFromInputs();
            updateTimerUI();
        }

        function toggleTimerSettings() {
            const container = document.getElementById('focusTimer');
            if (container) {
                container.classList.toggle('expanded');
            }
        }

        function setTimerPreset(minutes) {
            const hInput = document.getElementById('hoursInput');
            const mInput = document.getElementById('minutesInput');
            const sInput = document.getElementById('secondsInput');
            
            if (hInput) hInput.value = 0;
            if (mInput) mInput.value = minutes;
            if (sInput) sInput.value = 0;
            
            setDurationFromInputs();
        }

        function initFocusTimer() {
            loadFocusState();
            // wire up controls
            const startBtn = document.getElementById('timerStartBtn');
            const pauseBtn = document.getElementById('timerPauseBtn');
            const resetBtn = document.getElementById('timerResetBtn');
            const settingsBtn = document.getElementById('timerSettingsBtn');
            const settingsPane = document.getElementById('timerSettings');
            const hoursInput = document.getElementById('hoursInput');
            const minutesInput = document.getElementById('minutesInput');
            const secondsInput = document.getElementById('secondsInput');

            // initialize H:M:S inputs from durationSeconds
            const h = Math.floor(focusTimer.durationSeconds / 3600);
            const m = Math.floor((focusTimer.durationSeconds % 3600) / 60);
            const s = focusTimer.durationSeconds % 60;
            if (hoursInput) hoursInput.value = h;
            if (minutesInput) minutesInput.value = m;
            if (secondsInput) secondsInput.value = s;

            if (startBtn) startBtn.addEventListener('click', (e) => { e.stopPropagation(); startTimer(); });
            if (pauseBtn) pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); pauseTimer(); });
            if (resetBtn) resetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetTimer(); });
            if (settingsBtn) settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTimerSettings();
            });

            [hoursInput, minutesInput, secondsInput].forEach(inp => {
                if (!inp) return;
                inp.addEventListener('change', () => {
                    setDurationFromInputs();
                });
            });

            updateTimerUI();
            // If the timer was running when last saved, don't auto-start; keep it paused for safety
        }

        // ------------------ end Focus Timer ------------------

        // Initialize the app
        function initApp() {
            loadPagesFromLocal();
            loadThemeSettings();
            loadSidebarState();
            
            ensureHelpPage();
            
            if (pages.length === 0) {
                createDefaultPage();
            } else {
                // Check for favorite page first
                const favoritePageId = appData && appData.ui ? appData.ui.favoritePageId : null;
                const favoritePage = favoritePageId ? pages.find(p => p.id === favoritePageId) : null;
                
                if (favoritePage) {
                    // Load favorite page on startup
                    loadPage(favoritePageId);
                } else if (!currentPageId || !pages.find(p => p.id === currentPageId)) {
                    loadPage(pages.find(p => p.id !== 'help_page')?.id || pages[0].id);
                }
            }
            
            renderPagesList();
            renderSidebarTags();
            renderTaskViews();
            // Initialize focus timer UI
            initFocusTimer();
            initLinkTooltip();
            initSlashCommands();
            initResizableMedia();
            
            // Auto-save every 30 seconds
            setInterval(autoSave, 30000);
            
            // Save on input
            const debouncedSave = debounce(savePage, 1000);
            document.getElementById('pageTitle').addEventListener('input', debouncedSave);
            
            // Optimize editor input handling
            const editor = document.getElementById('editor');
            editor.addEventListener('input', () => {
                updateWordCount();
                debouncedSave();
            });
            
            // Handle Enter key to break out of blockquotes and pre blocks
            editor.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    const selection = window.getSelection();
                    if (!selection.rangeCount) return;
                    
                    const node = selection.anchorNode;
                    const blockquote = node.nodeType === 3 ? node.parentElement.closest('blockquote') : node.closest('blockquote');
                    const preBlock = node.nodeType === 3 ? node.parentElement.closest('pre') : node.closest('pre');
                    
                    const parentBlock = blockquote || preBlock;
                    
                    if (parentBlock) {
                        // Check if we're at an empty line or end of content
                        const textContent = node.textContent || '';
                        const isAtEnd = selection.anchorOffset === textContent.length;
                        const isEmpty = textContent.trim() === '';
                        
                        // If pressing Enter on empty line or at the very end with empty last line, break out
                        if (isEmpty || (isAtEnd && textContent.endsWith('\n'))) {
                            e.preventDefault();
                            
                            // Create a new paragraph after the block
                            const p = document.createElement('p');
                            p.innerHTML = '<br>';
                            parentBlock.parentNode.insertBefore(p, parentBlock.nextSibling);
                            
                            // Move cursor to new paragraph
                            const range = document.createRange();
                            range.setStart(p, 0);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
            });
            
            // Also update word count on keyup for better responsiveness
            editor.addEventListener('keyup', updateWordCount);
            
            // Initial word count update
            updateWordCount();
        }

        // Sidebar Toggle Function
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            const overlay = document.getElementById('sidebarOverlay');
            const storageOptions = document.getElementById('storageOptions');
            
            sidebar.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed');
            
            // Update taskbar position based on sidebar state (docked to edge)
            if (storageOptions) {
                if (sidebar.classList.contains('collapsed')) {
                    storageOptions.style.left = '0';
                } else {
                    storageOptions.style.left = 'var(--sidebar-width)';
                }
            }
            
            // Handle mobile overlay
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains('collapsed')) {
                    overlay.classList.remove('active');
                } else {
                    overlay.classList.add('active');
                }
            }

            // Toggle a body-level class so we can target UI outside the sidebar's DOM
            if (sidebar.classList.contains('collapsed')) {
                document.body.classList.remove('sidebar-open');
            } else {
                document.body.classList.add('sidebar-open');
            }
            
            // Save state to workspace settings
            const isCollapsed = sidebar.classList.contains('collapsed');
            if (appSettings) {
                appSettings.sidebarCollapsed = isCollapsed;
                persistAppData();
            }
            if (typeof syncToolbarLayoutWithSidebar === 'function') syncToolbarLayoutWithSidebar();
            if (typeof positionToolbarTimeControls === 'function') positionToolbarTimeControls();
            // Recompute chatbot position after sidebar toggle to avoid overlaps
            if (typeof adjustChatbotPosition === 'function') adjustChatbotPosition();
        }

            // Ensure chatbot button doesn't overlap the storage/save stack on small screens.
            // This computes positions at runtime and moves the button to the safest available spot.
            function adjustChatbotPosition() {
                const chatBtn = document.getElementById('chatbotBtn');
                const storage = document.querySelector('.storage-options');
                const sidebarEl = document.getElementById('sidebar');
                if (!chatBtn) return;

                // Clear inline styles first
                chatBtn.style.left = '';
                chatBtn.style.right = '';
                chatBtn.style.bottom = '';

                // Mobile-specific behavior
                if (window.innerWidth <= 768 && sidebarEl && storage) {
                    const sidebarOpen = !sidebarEl.classList.contains('collapsed');
                    const storageRect = storage.getBoundingClientRect();
                    const chatRect = chatBtn.getBoundingClientRect();
                    const sidebarRect = sidebarEl.getBoundingClientRect();

                    if (sidebarOpen) {
                        // Place the chat button centered horizontally above the storage stack
                        const storageCenterX = (storageRect.left + storageRect.right) / 2;
                        let proposedLeft = Math.round(storageCenterX - (chatRect.width / 2));
                        // Ensure we don't place it inside the sidebar
                        const minLeft = Math.round(sidebarRect.right + 8);
                        if (proposedLeft < minLeft) proposedLeft = minLeft;
                        chatBtn.style.left = proposedLeft + 'px';
                        chatBtn.style.right = 'auto';
                        // Position vertically so the button sits slightly above the top of the storage stack
                        const offsetAbove = 8; // px gap above storage
                        const bottomPx = Math.round(window.innerHeight - storageRect.top + offsetAbove);
                        chatBtn.style.bottom = bottomPx + 'px';
                        // Ensure the chat button is above the storage stack visually
                        chatBtn.style.zIndex = 2400;
                        return;
                    }
                }

                // Default fallback: keep on right edge but raised on mobile
                chatBtn.style.right = '12px';
                chatBtn.style.left = 'auto';
                chatBtn.style.bottom = window.innerWidth <= 768 ? '80px' : '90px';
            }

            // Wire adjustment on load and resize so it adapts dynamically
            document.addEventListener('DOMContentLoaded', function() {
                adjustChatbotPosition();
                window.addEventListener('resize', adjustChatbotPosition);
            });
        
        function loadSidebarState() {
            const isCollapsed = appSettings ? appSettings.sidebarCollapsed : false;
            const storageOptions = document.getElementById('storageOptions');
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                toggleBtn.classList.add('collapsed');
                if (storageOptions) {
                    storageOptions.style.left = '0';
                }
            } else {
                sidebar.classList.remove('collapsed');
                toggleBtn.classList.remove('collapsed');
                if (storageOptions) {
                    storageOptions.style.left = 'var(--sidebar-width)';
                }
            }

            // Keep a body-level flag for sidebar open state so CSS can target elements
            if (sidebar.classList.contains('collapsed')) {
                document.body.classList.remove('sidebar-open');
            } else {
                document.body.classList.add('sidebar-open');
            }
            if (typeof syncToolbarLayoutWithSidebar === 'function') syncToolbarLayoutWithSidebar();
        }

        // Theme Management Functions
        function syncPresetCardsWithTheme(themeName) {
            const normalized = themeName === 'dark' ? 'dark' : 'default';
            document.querySelectorAll('.preset-card').forEach(card => {
                card.classList.toggle('active', card.dataset.theme === normalized);
            });
        }

        function toggleThemePanel() {
            const panel = document.getElementById('themePanel');
            panel.classList.toggle('active');
            
            if (panel.classList.contains('active')) {
                updatePageSelectorList();
                const currentTheme = document.body.getAttribute('data-theme');
                syncPresetCardsWithTheme(currentTheme);
            }
        }

        // Quick tasks removed: sidebar quick-tasks feature was intentionally removed from the UI.
        // Related functions and DOM hooks were stripped to avoid orphaned references.

        // ===== Unified Task & Streak Logic =====
        function dateKey(date) {
            const d = date || new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function parseDate(dateKeyStr) {
            const [year, month, day] = dateKeyStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        function getWeekKey(date) {
            const d = new Date(date.getTime());
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            const yearStart = new Date(d.getFullYear(), 0, 1);
            const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
            return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        }

        function today() { return dateKey(new Date()); }

        function yesterday() {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return dateKey(d);
        }

        function getDayState(dateKeyStr) {
            if (!dayStates[dateKeyStr]) {
                dayStates[dateKeyStr] = { committedTaskIds: [], completedTaskIds: [], freezeUsed: false };
            }
            return dayStates[dateKeyStr];
        }

        function dayCountsForStreak(dateKeyStr) {
            const dayState = dayStates[dateKeyStr];
            if (!dayState) return false;
            return !!dayState.freezeUsed || (dayState.completedTaskIds && dayState.completedTaskIds.length > 0);
        }

        function refreshFreezeWeek() {
            const currentWeekKey = getWeekKey(new Date());
            if (streakState.freezeWeekKey !== currentWeekKey) {
                streakState.freezesRemainingThisWeek = FREEZES_PER_WEEK;
                streakState.freezeWeekKey = currentWeekKey;
            }
        }

        function updateGlobalStreak() {
            refreshFreezeWeek();
            const todayKey = today();
            let streak = 0;
            let checkDate = todayKey;
            if (!dayCountsForStreak(todayKey)) {
                checkDate = yesterday();
            }
            while (dayCountsForStreak(checkDate)) {
                streak++;
                const d = parseDate(checkDate);
                d.setDate(d.getDate() - 1);
                checkDate = dateKey(d);
            }
            streakState.globalCurrent = streak;
            streakState.globalBest = Math.max(streakState.globalBest || 0, streak);
            if (streak > 0) {
                streakState.globalLastKeptDateKey = todayKey;
            }
            persistAppData();
        }

        function updateTaskStreak(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task || task.scheduleType === 'once') return;

            if (!taskStreaks[taskId]) {
                taskStreaks[taskId] = { current: 0, best: 0, lastCompletedDateKey: null };
            }

            const taskStreak = taskStreaks[taskId];
            const todayKey = today();
            const dayState = dayStates[todayKey];
            const completedToday = dayState && dayState.completedTaskIds && dayState.completedTaskIds.includes(taskId);

            if (completedToday) {
                const lastCompleted = taskStreak.lastCompletedDateKey;
                if (!lastCompleted) {
                    taskStreak.current = 1;
                } else if (lastCompleted === todayKey) {
                    return;
                } else {
                    const d1 = parseDate(lastCompleted);
                    const d2 = parseDate(todayKey);
                    const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
                    let allowedGap = 1;
                    if (task.scheduleType === 'weekly') allowedGap = 7;
                    if (diffDays <= allowedGap + 1) {
                        taskStreak.current++;
                    } else {
                        taskStreak.current = 1;
                    }
                }
                taskStreak.lastCompletedDateKey = todayKey;
                taskStreak.best = Math.max(taskStreak.best, taskStreak.current);
            }
            persistAppData();
        }

        function isTaskDueOn(task, dateKeyStr) {
            if (!task.isActive) return false;

            switch (task.scheduleType) {
                case 'once':
                    if (!task.dueDate) return true;
                    return dateKeyStr >= task.dueDate;
                case 'daily':
                    return true;
                case 'weekly':
                    const dayOfWeek = parseDate(dateKeyStr).getDay();
                    return task.weeklyDays && task.weeklyDays.includes(dayOfWeek);
                default:
                    return false;
            }
        }

        function toggleCommit(taskId) {
            const todayKey = today();
            const dayState = getDayState(todayKey);
            const index = dayState.committedTaskIds.indexOf(taskId);

            if (index === -1) {
                // allow committing any number of tasks
                dayState.committedTaskIds.push(taskId);
                showToast('Task committed');
            } else {
                dayState.committedTaskIds.splice(index, 1);
                showToast('Commitment removed');
            }
            persistAppData();
            renderTaskViews();
            try { populateProgressDashboard(); } catch (e) { /* ignore */ }
        }

        function toggleComplete(taskId) {
            const todayKey = today();
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const dayState = getDayState(todayKey);
            const index = dayState.completedTaskIds.indexOf(taskId);
            const wasCompleted = index !== -1;

            if (wasCompleted) {
                dayState.completedTaskIds.splice(index, 1);
                if (task.scheduleType === 'once') task.isActive = true;
                setHomeworkTaskDoneInStorage(task, false);
                showToast('Completion removed');
            } else {
                dayState.completedTaskIds.push(taskId);
                if (task.scheduleType === 'once') task.isActive = false;
                setHomeworkTaskDoneInStorage(task, true);
                showToast('Task completed');
            }

            updateTaskStreak(taskId);
            updateGlobalStreak();
            persistAppData();
            renderTaskViews();
            try { populateProgressDashboard(); } catch (e) { /* ignore */ }
        }

        function deleteTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.origin === 'homework') {
                deleteHomeworkTaskInStorage(task);
            }
            tasks = tasks.filter(task => task.id !== taskId);
            taskOrder = taskOrder.filter(id => id !== taskId);
            delete taskStreaks[taskId];
            removeTaskReferencesFromDayStates(taskId);
            persistAppData();
            renderTaskViews();
            try { populateProgressDashboard(); } catch (e) { /* ignore */ }
        }

        function useFreeze() {
            refreshFreezeWeek();
            if (streakState.freezesRemainingThisWeek <= 0) {
                showToast('No freezes remaining this week');
                return;
            }
            const yesterdayKey = yesterday();
            const dayState = getDayState(yesterdayKey);
            if (dayState.freezeUsed) {
                showToast('Freeze already used for yesterday');
                return;
            }
            if (dayCountsForStreak(yesterdayKey)) {
                showToast('Yesterday already counts');
                return;
            }

            dayState.freezeUsed = true;
            streakState.freezesRemainingThisWeek--;
            persistAppData();
            updateGlobalStreak();
            renderTaskViews();
            showToast('Freeze used');
            try { populateProgressDashboard(); } catch (e) { /* ignore */ }
        }

        function getScheduleLabel(task) {
            if (task.scheduleType === 'once') return 'One-off';
            if (task.scheduleType === 'daily') return 'Daily';
            if (task.scheduleType === 'weekly') return `Weekly · ${task.weeklyDays?.map(d => DAY_NAMES[d]).join(', ') || 'custom'}`;
            return 'Task';
        }

        function filterTasksBySearch(list) {
            if (!searchQuery) return list;
            const q = searchQuery.toLowerCase();
            return list.filter(task => {
                const noteTitle = task.noteId ? (pages.find(p => p.id === task.noteId)?.title || '') : '';
                return task.title.toLowerCase().includes(q) || (task.notes || '').toLowerCase().includes(q) || noteTitle.toLowerCase().includes(q);
            });
        }

        function normalizePriorityValue(priority) {
            const p = String(priority || '').toLowerCase();
            if (p === 'high') return 'high';
            if (p === 'medium' || p === 'med') return 'medium';
            if (p === 'low') return 'low';
            return 'medium';
        }

        function parseHomeworkDueDate(input) {
            if (!input) return null;
            if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
            const d = new Date(input);
            if (isNaN(d)) return null;
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        function inferHomeworkPriority(rawTask) {
            const dueDate = parseHomeworkDueDate(rawTask && (rawTask.dueDate || rawTask.due || rawTask.duedate));
            if (!dueDate) return 'medium';
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const due = new Date(`${dueDate}T00:00:00`);
            const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
            if (diffDays <= 0) return 'high';
            if (diffDays <= 2) return 'medium';
            return 'low';
        }

        function readLocalArraySafe(key) {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (err) {
                return [];
            }
        }

        function writeLocalArraySafe(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
            } catch (err) {
                console.warn(`Failed to persist ${key}`, err);
            }
        }

        function getHomeworkSnapshotForSync() {
            const snapshot = [];

            const coursesV2 = readLocalArraySafe('hwCourses:v2');
            const courseMapV2 = new Map(coursesV2.map(c => [String(c.id), c.name || 'Course']));
            const tasksV2 = readLocalArraySafe('hwTasks:v2');
            tasksV2.forEach(item => {
                const sourceId = String(item.id || `${item.courseId || 'course'}-${item.text || item.task || 'task'}`);
                const courseName = item.courseId ? (courseMapV2.get(String(item.courseId)) || '') : '';
                const label = String(item.text || item.task || item.title || '').trim();
                if (!label) return;
                snapshot.push({
                    source: 'v2',
                    sourceId,
                    title: courseName ? `${courseName}: ${label}` : label,
                    dueDate: parseHomeworkDueDate(item.due || item.duedate || item.dueDate),
                    priority: normalizePriorityValue(item.priority || inferHomeworkPriority(item)),
                    done: !!item.done,
                    createdAt: item.createdAt || null
                });
            });

            const coursesV1 = readLocalArraySafe('homeworkCourses:v1');
            const courseMapV1 = new Map(coursesV1.map(c => [String(c.id), c.name || c.subject || 'Course']));
            const tasksV1 = readLocalArraySafe('homeworkTasks:v1');
            tasksV1.forEach(item => {
                const sourceId = String(item.id || `${item.courseId || item.subject || 'course'}-${item.task || item.title || 'task'}`);
                const courseName = item.courseId
                    ? (courseMapV1.get(String(item.courseId)) || '')
                    : (item.subject || '');
                const label = String(item.task || item.title || item.text || '').trim();
                if (!label) return;
                snapshot.push({
                    source: 'v1',
                    sourceId,
                    title: courseName ? `${courseName}: ${label}` : label,
                    dueDate: parseHomeworkDueDate(item.duedate || item.due || item.dueDate),
                    priority: normalizePriorityValue(item.priority || inferHomeworkPriority(item)),
                    done: !!item.done || !!item.completed,
                    createdAt: item.createdAt || null
                });
            });

            return snapshot;
        }

        function removeTaskReferencesFromDayStates(taskId) {
            Object.values(dayStates).forEach(day => {
                if (day.committedTaskIds) day.committedTaskIds = day.committedTaskIds.filter(id => id !== taskId);
                if (day.completedTaskIds) day.completedTaskIds = day.completedTaskIds.filter(id => id !== taskId);
            });
        }

        function syncHomeworkTasksIntoTaskStore() {
            const snapshot = getHomeworkSnapshotForSync();
            const desiredMap = new Map(snapshot.map(item => [`hw_${item.source}_${item.sourceId}`, item]));
            const existingHomeworkTasks = tasks.filter(task => task.origin === 'homework');
            let changed = false;

            existingHomeworkTasks.forEach(task => {
                if (desiredMap.has(task.id)) return;
                changed = true;
                taskOrder = taskOrder.filter(id => id !== task.id);
                delete taskStreaks[task.id];
                removeTaskReferencesFromDayStates(task.id);
            });
            if (changed) {
                tasks = tasks.filter(task => !(task.origin === 'homework' && !desiredMap.has(task.id)));
            }

            desiredMap.forEach((item, id) => {
                const existing = tasks.find(task => task.id === id);
                const nextData = {
                    title: item.title,
                    notes: 'Synced from Homework',
                    scheduleType: 'once',
                    weeklyDays: [],
                    category: 'school',
                    priority: normalizePriorityValue(item.priority),
                    estimate: 0,
                    dueDate: item.dueDate || null,
                    noteId: null,
                    isActive: !item.done,
                    origin: 'homework',
                    homeworkSource: item.source,
                    homeworkSourceId: item.sourceId
                };

                if (!existing) {
                    const newTask = {
                        id,
                        ...nextData,
                        createdAt: item.createdAt || new Date().toISOString()
                    };
                    tasks.unshift(newTask);
                    if (!taskOrder.includes(id)) taskOrder.unshift(id);
                    changed = true;
                    return;
                }

                let taskChanged = false;
                Object.keys(nextData).forEach(key => {
                    if (existing[key] !== nextData[key]) {
                        existing[key] = nextData[key];
                        taskChanged = true;
                    }
                });
                if (!taskOrder.includes(id)) {
                    taskOrder.unshift(id);
                    taskChanged = true;
                }

                if (!item.done) {
                    Object.values(dayStates).forEach(day => {
                        if (!day || !Array.isArray(day.completedTaskIds)) return;
                        const before = day.completedTaskIds.length;
                        day.completedTaskIds = day.completedTaskIds.filter(taskId => taskId !== id);
                        if (day.completedTaskIds.length !== before) taskChanged = true;
                    });
                }
                if (taskChanged) changed = true;
            });

            if (changed) {
                persistAppData();
            }
        }

        function setHomeworkTaskDoneInStorage(task, done) {
            if (!task || task.origin !== 'homework') return;
            const source = task.homeworkSource || 'v2';
            const sourceId = String(task.homeworkSourceId || '');
            if (!sourceId) return;

            if (source === 'v2') {
                const list = readLocalArraySafe('hwTasks:v2');
                const idx = list.findIndex(item => String(item.id) === sourceId);
                if (idx !== -1) {
                    list[idx].done = !!done;
                    writeLocalArraySafe('hwTasks:v2', list);
                }
                return;
            }

            if (source === 'v1') {
                const list = readLocalArraySafe('homeworkTasks:v1');
                const idx = list.findIndex(item => String(item.id) === sourceId);
                if (idx !== -1) {
                    list[idx].done = !!done;
                    writeLocalArraySafe('homeworkTasks:v1', list);
                }
            }
        }

        function deleteHomeworkTaskInStorage(task) {
            if (!task || task.origin !== 'homework') return;
            const source = task.homeworkSource || 'v2';
            const sourceId = String(task.homeworkSourceId || '');
            if (!sourceId) return;

            if (source === 'v2') {
                const list = readLocalArraySafe('hwTasks:v2');
                writeLocalArraySafe('hwTasks:v2', list.filter(item => String(item.id) !== sourceId));
                return;
            }

            if (source === 'v1') {
                const list = readLocalArraySafe('homeworkTasks:v1');
                writeLocalArraySafe('homeworkTasks:v1', list.filter(item => String(item.id) !== sourceId));
            }
        }

        function renderTaskCard(task, options = {}) {
            const todayKey = today();
            const dayState = dayStates[todayKey];
            const committed = dayState && dayState.committedTaskIds.includes(task.id);
            const completedToday = dayState && dayState.completedTaskIds.includes(task.id);
            const normalizedPriority = normalizePriorityValue(task.priority);
            const noteTitle = task.noteId ? (pages.find(p => p.id === task.noteId)?.title || '') : '';
            const metaParts = [getScheduleLabel(task)];
            if (noteTitle) metaParts.push(noteTitle.split('::').pop());
            if (task.category && task.category !== 'none') metaParts.push(task.category);
            if (task.origin === 'homework') metaParts.push('Homework');
            const priorityDot = `<span class="priority-dot priority-${normalizedPriority}" title="${escapeHtml(normalizedPriority)}"></span>`;
            const allowEdit = !!options.showEdit && task.origin !== 'homework';

            // If the task has a dueDate in the future, show a small 'Due in X days' micro-label
            if (task.dueDate) {
                try {
                    const due = parseDate(task.dueDate);
                    const now = parseDate(today());
                    const diffMs = due.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffMs / 86400000);
                    if (diffDays > 0) {
                        metaParts.push(`Due in ${diffDays}d`);
                    } else if (diffDays === 0) {
                        metaParts.push('Due today');
                    } else {
                        metaParts.push('Overdue');
                    }
                } catch (e) { /* ignore parsing errors */ }
            }

            return `
                <div class="task-card task-priority-${normalizedPriority} ${completedToday ? 'completed' : ''}">
                    <div class="task-main">
                        <div class="task-title">${priorityDot}${escapeHtml(task.title)}</div>
                        <div class="task-meta">${metaParts.map(part => `<span>${escapeHtml(part)}</span>`).join('<span>•</span>')}</div>
                    </div>
                    <div class="task-actions">
                        ${options.showCommit ? `<button class="neumo-btn" onclick="toggleCommit('${task.id}')">${committed ? 'Uncommit' : 'Commit'}</button>` : ''}
                        ${options.showComplete ? `<button class="neumo-btn" onclick="toggleComplete('${task.id}')">${completedToday ? 'Undo' : 'Done'}</button>` : ''}
                        ${allowEdit ? `<button class="neumo-btn" onclick="openTaskModal('${task.id}')">Edit</button>` : ''}
                        ${options.showDelete ? `<button class="neumo-btn" onclick="if(confirm('Delete this task?')) deleteTask('${task.id}')">Delete</button>` : ''}
                    </div>
                </div>
            `;
        }

        function renderTodayView() {
            const todayKey = today();
            refreshFreezeWeek();
            updateGlobalStreak();

            const committedIds = (dayStates[todayKey] && dayStates[todayKey].committedTaskIds) || [];
            const completedIds = (dayStates[todayKey] && dayStates[todayKey].completedTaskIds) || [];
            const committedTasks = filterTasksBySearch(tasks.filter(task => committedIds.includes(task.id)));
            const dueTasks = filterTasksBySearch(tasks.filter(task => isTaskDueOn(task, todayKey) && !completedIds.includes(task.id)));

            // Sort pending/due tasks by priority (high -> medium -> low), then by due date (earlier first), then createdAt
            const priorityWeight = p => p === 'high' ? 3 : (p === 'medium' ? 2 : 1);
            dueTasks.sort((a, b) => {
                const pa = priorityWeight(a.priority || 'medium');
                const pb = priorityWeight(b.priority || 'medium');
                if (pa !== pb) return pb - pa; // higher weight first
                // then by due date (nulls last)
                const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                if (da !== db) return da - db;
                // fallback to creation time
                const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return ca - cb;
            });

            const committedList = document.getElementById('today-committed-list');
            const dueList = document.getElementById('today-due-list');
            const committedEmpty = document.getElementById('today-committed-empty');
            const dueEmpty = document.getElementById('today-due-empty');

            if (committedList) {
                committedList.innerHTML = committedTasks.map(task => renderTaskCard(task, { showCommit: true, showComplete: true, showEdit: true, showDelete: true })).join('');
                committedEmpty.style.display = committedTasks.length ? 'none' : 'block';
            }

            if (dueList) {
                dueList.innerHTML = dueTasks.map(task => renderTaskCard(task, { showCommit: true, showComplete: true, showEdit: true, showDelete: true })).join('');
                dueEmpty.style.display = dueTasks.length ? 'none' : 'block';
            }

            // Populate 'All Tasks' fallback panel (shows all non-completed tasks regardless of due date)
            const allList = document.getElementById('today-all-list');
            const allEmpty = document.getElementById('today-all-empty');
            const allCount = document.getElementById('allCount');
            if (allList) {
                const allTasks = filterTasksBySearch(tasks.filter(task => !completedIds.includes(task.id)));
                allList.innerHTML = allTasks.map(task => renderTaskCard(task, { showCommit: true, showComplete: true, showEdit: true, showDelete: true })).join('');
                if (allEmpty) allEmpty.style.display = allTasks.length ? 'none' : 'block';
                if (allCount) allCount.textContent = `${allTasks.length}`;
            }

            const commitCount = document.getElementById('commitCount');
            if (commitCount) commitCount.textContent = `(${committedTasks.length})`;

            const dueCount = document.getElementById('dueCount');
            if (dueCount) dueCount.textContent = `${dueTasks.length} due`;

            const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            const todayLabel = document.getElementById('todayLabel');
            if (todayLabel) todayLabel.textContent = dateLabel;

            const streakPill = document.getElementById('todayStreakPill');
            if (streakPill) streakPill.textContent = `Streak: ${streakState.globalCurrent || 0} days`;

            const globalStreak = document.getElementById('globalStreak');
            if (globalStreak) globalStreak.textContent = streakState.globalCurrent || 0;

            const globalBest = document.getElementById('globalBest');
            if (globalBest) globalBest.textContent = `Best: ${streakState.globalBest || 0}`;

            const weekCompletions = document.getElementById('weekCompletions');
            const weekCommitDays = document.getElementById('weekCommitDays');
            const freezeLeft = document.getElementById('freezeLeft');

            const weekDates = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return dateKey(d);
            });
            const weeklyCompletionCount = weekDates.reduce((sum, key) => {
                const day = dayStates[key];
                return sum + (day && day.completedTaskIds ? day.completedTaskIds.length : 0);
            }, 0);
            const weeklyCommitDays = weekDates.filter(key => {
                const day = dayStates[key];
                return day && day.committedTaskIds && day.committedTaskIds.length > 0;
            }).length;

            if (weekCompletions) weekCompletions.textContent = weeklyCompletionCount;
            if (weekCommitDays) weekCommitDays.textContent = weeklyCommitDays;
            if (freezeLeft) freezeLeft.textContent = streakState.freezesRemainingThisWeek || 0;
        }

        function renderProgressView() {
            const weeklyChart = document.getElementById('weekly-chart');
            if (weeklyChart) {
                const weekDates = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return dateKey(d);
                });
                const values = weekDates.map(key => {
                    const day = dayStates[key];
                    return day && day.completedTaskIds ? day.completedTaskIds.length : 0;
                });
                const max = Math.max(1, ...values);
                weeklyChart.innerHTML = values.map((val, index) => {
                    const height = Math.round((val / max) * 100);
                    return `<div class="bar" style="height:${height}%"><span>${DAY_NAMES[parseDate(weekDates[index]).getDay()]}</span></div>`;
                }).join('');
            }

            const streakStats = document.getElementById('streak-stats');
            if (streakStats) {
                streakStats.innerHTML = `
                    <div class="task-card">
                        <div class="task-main">
                            <div class="task-title">Current Streak</div>
                            <div class="task-meta">${streakState.globalCurrent || 0} days</div>
                        </div>
                    </div>
                    <div class="task-card">
                        <div class="task-main">
                            <div class="task-title">Best Streak</div>
                            <div class="task-meta">${streakState.globalBest || 0} days</div>
                        </div>
                    </div>
                `;
            }

            const categoryStats = document.getElementById('category-stats');
            if (categoryStats) {
                const categoryCounts = tasks.reduce((acc, task) => {
                    const key = task.category || 'none';
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});
                categoryStats.innerHTML = Object.keys(categoryCounts).map(key => `
                    <div class="task-card">
                        <div class="task-main">
                            <div class="task-title">${key === 'none' ? 'Uncategorized' : key}</div>
                            <div class="task-meta">${categoryCounts[key]} tasks</div>
                        </div>
                    </div>
                `).join('');
            }

            const historyList = document.getElementById('history-list');
            if (historyList) {
                const historyDates = Array.from({ length: 14 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return dateKey(d);
                });
                historyList.innerHTML = historyDates.map(key => {
                    const day = dayStates[key];
                    const count = day && day.completedTaskIds ? day.completedTaskIds.length : 0;
                    return `<div class="task-card"><div class="task-main"><div class="task-title">${key}</div><div class="task-meta">${count} completed</div></div></div>`;
                }).join('');
            }
        }

        function renderLinkedTasks() {
            const list = document.getElementById('linkedTaskList');
            if (!list) return;
            const linkedTasks = filterTasksBySearch(tasks.filter(task => task.noteId === currentPageId));
            if (!linkedTasks.length) {
                list.innerHTML = '<div class="empty-state"><div class="empty-title">No linked tasks</div><div class="empty-subtitle">Add a task tied to this note.</div></div>';
                return;
            }
            list.innerHTML = linkedTasks.map(task => renderTaskCard(task, { showComplete: true, showDelete: true, showEdit: true })).join('');
        }

        function renderTaskViews() {
            syncHomeworkTasksIntoTaskStore();
            renderTodayView();
            renderProgressView();
            renderLinkedTasks();
            // Quick tasks removed; no sidebar todo rendering required.
        }

        // (debug helper removed)

        let editingTaskId = null;

        function openTaskModal(taskId = null, preset = {}) {
            const modal = document.getElementById('taskModal');
            if (!modal) return;

            editingTaskId = taskId;
            const task = taskId ? tasks.find(t => t.id === taskId) : null;

            document.getElementById('taskModalTitle').textContent = task ? 'Edit Task' : 'Add Task';
            document.getElementById('taskTitleInput').value = task?.title || preset.title || '';
            document.getElementById('taskNotesInput').value = task?.notes || preset.notes || '';
            document.getElementById('taskScheduleInput').value = task?.scheduleType || preset.scheduleType || 'once';
            document.getElementById('taskDueDateInput').value = task?.dueDate || preset.dueDate || '';
            document.getElementById('taskCategoryInput').value = task?.category || preset.category || 'none';
            document.getElementById('taskPriorityInput').value = task?.priority || preset.priority || 'medium';

            const noteSelect = document.getElementById('taskNoteInput');
            if (noteSelect) {
                noteSelect.innerHTML = '<option value="">No note</option>' + pages
                    .filter(page => page.id !== 'help_page')
                    .map(page => `<option value="${page.id}">${escapeHtml(page.title)}</option>`)
                    .join('');
                noteSelect.value = task?.noteId || preset.noteId || '';
            }

            const weeklyContainer = document.getElementById('taskWeeklyDays');
            if (weeklyContainer) {
                weeklyContainer.style.display = document.getElementById('taskScheduleInput').value === 'weekly' ? 'block' : 'none';
                weeklyContainer.querySelectorAll('input[type="checkbox"]').forEach(box => {
                    const day = Number(box.value);
                    box.checked = task?.weeklyDays?.includes(day) || preset.weeklyDays?.includes(day) || false;
                });
            }

            modal.classList.add('active');
        }

        function closeTaskModal() {
            const modal = document.getElementById('taskModal');
            if (modal) modal.classList.remove('active');
            editingTaskId = null;
        }

        function saveTaskFromModal() {
            const title = document.getElementById('taskTitleInput').value.trim();
            if (!title) {
                showToast('Task title required');
                return;
            }

            const scheduleType = document.getElementById('taskScheduleInput').value;
            const weeklyDays = [];
            if (scheduleType === 'weekly') {
                document.querySelectorAll('#taskWeeklyDays input[type="checkbox"]:checked').forEach(box => {
                    weeklyDays.push(Number(box.value));
                });
                if (!weeklyDays.length) weeklyDays.push(new Date().getDay());
            }

            const taskData = {
                title,
                notes: document.getElementById('taskNotesInput').value.trim(),
                scheduleType,
                weeklyDays,
                category: document.getElementById('taskCategoryInput').value,
                priority: document.getElementById('taskPriorityInput') ? document.getElementById('taskPriorityInput').value : 'medium',
                estimate: 0,
                dueDate: document.getElementById('taskDueDateInput').value || null,
                noteId: document.getElementById('taskNoteInput').value || null
            };

            if (editingTaskId) {
                const task = tasks.find(t => t.id === editingTaskId);
                if (task) {
                    Object.assign(task, taskData);
                }
            } else {
                const newTask = {
                    id: generateId(),
                    ...taskData,
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    origin: taskData.noteId ? 'note' : 'streak'
                };
                tasks.unshift(newTask);
                taskOrder.unshift(newTask.id);
            }

            // Persist and ensure the today view reflects the new task immediately.
            persistAppData();
            console.log('saveTaskFromModal - taskData:', taskData, 'tasksCount:', tasks.length);
            // Activate Today to help users spot the new task and re-render views.
            try { setActiveView('today'); } catch (e) { /* non-critical */ }
            renderTaskViews();
            closeTaskModal();
            showToast('Task saved');
        }

        function addLinkedTaskFromInput() {
            const input = document.getElementById('linkedTaskInput');
            if (!input || !currentPageId) return;
            const title = input.value.trim();
            if (!title) return;

            const newTask = {
                id: generateId(),
                title,
                notes: '',
                scheduleType: 'once',
                weeklyDays: [],
                category: 'none',
                estimate: 0,
                createdAt: new Date().toISOString(),
                isActive: true,
                noteId: currentPageId,
                dueDate: null,
                priority: 'medium',
                origin: 'note'
            };

            tasks.unshift(newTask);
            taskOrder.unshift(newTask.id);
            persistAppData();
            renderTaskViews();
            input.value = '';
            showToast('Linked task added');
        }

        function setActiveView(view) {
            activeView = view;
            document.querySelectorAll('.view').forEach(section => {
                const isActive = section.id === `view-${view}`;
                section.classList.toggle('active', isActive);
                // Keep inline display in sync with active state.
                // Some auxiliary scripts set inline display styles, which can otherwise
                // leave the selected view hidden even when it has the active class.
                section.style.display = isActive ? '' : 'none';
            });
            document.querySelectorAll('.view-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.view === view);
            });
            document.body.dataset.view = view;
            // Update mobile tab toggle label and collapse the expanded list for a cleaner UX
            try {
                const toggle = document.querySelector('.view-tabs-toggle');
                const tabs = document.querySelector('.view-tabs');
                if (toggle) {
                    const active = document.querySelector('.view-tab.active');
                    if (active) toggle.querySelector('.view-tabs-current').textContent = active.textContent.trim();
                    // collapse the expanded tabs after selection
                    if (tabs && tabs.classList.contains('expanded')) {
                        tabs.classList.remove('expanded');
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }
            } catch (e) { /* non-critical */ }
            // Refresh dashboard when user opens Progress view
            if (view === 'progress') {
                try { populateProgressDashboard(); } catch (e) { console.warn('populateProgressDashboard failed on view change', e); }
            }
            // Render timeline when switching to Timeline view
            if (view === 'timeline') {
                try { renderTimeline(); applyTimeMode(); } catch (e) { console.warn('renderTimeline failed on view change', e); }
            }
        }

        function syncSettingsControls() {
            const themeButtons = document.querySelectorAll('#view-settings [data-theme]');
            const currentTheme = document.body.getAttribute('data-theme');
            const isDark = currentTheme === 'dark';
            themeButtons.forEach(btn => {
                const active = btn.dataset.theme === (isDark ? 'dark' : 'light');
                btn.classList.toggle('active', active);
            });
            syncPresetCardsWithTheme(currentTheme);

            const motionToggle = document.getElementById('motionToggle');
            if (motionToggle) {
                motionToggle.checked = appSettings ? appSettings.motionEnabled === false : false;
            }
            syncTutorialSettingsControls();
        }

        function syncTutorialSettingsControls() {
            const statusEl = document.getElementById('tutorialStatusText');
            const buttonEl = document.getElementById('startTutorialBtn');
            if (!statusEl || !buttonEl || !appSettings) return;

            if (appSettings.tutorialCompleted) {
                const completedAt = appSettings.tutorialCompletedAt
                    ? new Date(appSettings.tutorialCompletedAt).toLocaleDateString()
                    : null;
                statusEl.textContent = completedAt
                    ? `Tutorial completed on ${completedAt}.`
                    : 'Tutorial completed.';
                buttonEl.textContent = 'Redo Tutorial';
            } else if (appSettings.tutorialSeen) {
                statusEl.textContent = 'Tutorial skipped or not finished yet.';
                buttonEl.textContent = 'Resume Tutorial';
            } else {
                statusEl.textContent = 'Take a full product walkthrough covering pages, tasks, timeline, notes, and settings.';
                buttonEl.textContent = 'Start Interactive Tutorial';
            }
        }

        function ensureSidebarExpandedForTutorial() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('collapsed')) {
                toggleSidebar();
            }
        }

        function getTutorialPrimaryPage() {
            return pages.find(page => page.id !== 'help_page') || pages[0] || null;
        }

        function ensureTutorialPageLoaded() {
            const page = getTutorialPrimaryPage();
            if (!page) return null;
            if (currentPageId !== page.id) loadPage(page.id);
            return page;
        }

        function ensureTutorialNestedPageLoaded() {
            const nested = pages.find(page => page.title.includes('::'));
            if (nested) {
                if (currentPageId !== nested.id) loadPage(nested.id);
                return nested;
            }
            return ensureTutorialPageLoaded();
        }

        function setTutorialFieldValue(id, value, eventType = 'input') {
            const field = document.getElementById(id);
            if (!field) return;
            field.value = value;
            field.dispatchEvent(new Event(eventType, { bubbles: true }));
        }

        function focusEditorForTutorial() {
            const editor = document.getElementById('editor');
            if (!editor) return;
            editor.focus();
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }

        function openSlashMenuForTutorial(filterText = '') {
            focusEditorForTutorial();
            showSlashMenu();
            if (!filterText) return;
            slashFilterText = String(filterText).toLowerCase();
            slashMenuSelectedIndex = 0;
            renderSlashMenuItems(getFilteredCommands());
        }

        function closeModalIfOpen(modalId) {
            const modal = document.getElementById(modalId);
            if (modal && modal.classList.contains('active')) closeModal(modalId);
        }

        function resetTutorialTransientUi() {
            closeModalIfOpen('newPageModal');
            closeModalIfOpen('renamePageModal');
            closeModalIfOpen('driveSettingsModal');
            if (typeof closeTaskModal === 'function') closeTaskModal();
            if (typeof closeBlockModal === 'function') closeBlockModal();

            const drawer = document.getElementById('allTasksDrawer');
            if (drawer) drawer.setAttribute('aria-hidden', 'true');

            const themePanel = document.getElementById('themePanel');
            if (themePanel && themePanel.classList.contains('active')) {
                themePanel.classList.remove('active');
            }
            tutorialState.openedThemePanel = false;

            const fontPanel = document.getElementById('fontSettingsPanel');
            if (fontPanel) fontPanel.style.display = 'none';

            const timerContainer = document.getElementById('focusTimer');
            if (timerContainer) timerContainer.classList.remove('expanded');

            const chatbotPanel = document.getElementById('chatbotPanel');
            if (chatbotPanel) {
                chatbotPanel.classList.remove('fullscreen');
                chatbotPanel.style.display = 'none';
                chatbotPanel.setAttribute('aria-hidden', 'true');
            }

            const chatbotInfo = document.getElementById('chatbotInfo');
            if (chatbotInfo) chatbotInfo.style.display = 'none';

            if (typeof hideToolbarTimeControls === 'function') hideToolbarTimeControls();
            if (typeof hideSlashMenu === 'function') hideSlashMenu();
            if (typeof hideEmojiPicker === 'function') hideEmojiPicker();
        }

        function closeTutorialThemePanelIfNeeded() {
            const panel = document.getElementById('themePanel');
            if (tutorialState.openedThemePanel && panel && panel.classList.contains('active')) {
                panel.classList.remove('active');
            }
            tutorialState.openedThemePanel = false;
        }

        function openThemePanelForTutorial() {
            const panel = document.getElementById('themePanel');
            if (panel && !panel.classList.contains('active')) {
                toggleThemePanel();
                tutorialState.openedThemePanel = true;
            }
        }

        function getTutorialSteps() {
            return [
                { title: 'Welcome to NoteFlow Atelier', body: 'This tutorial triggers real UI actions. Use Next/Back to navigate and Run Action for prompt-based features.' },
                { selector: '.view-tabs', before: () => setActiveView('today'), title: 'Main Views', body: 'Switch between Today, Timeline, Notes, and Settings.', action: () => setActiveView('today') },
                { selector: '#sidebarToggle', before: () => setActiveView('notes'), title: 'Sidebar Toggle', body: 'Open/close the sidebar from this button.', action: () => ensureSidebarExpandedForTutorial() },
                { selector: '#globalSearch', before: () => setActiveView('today'), title: 'Global Search', body: 'Search notes and tasks from one place.', action: () => { setTutorialFieldValue('globalSearch', 'help'); filterPages(); } },
                { selector: '#searchInput', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Sidebar Search', body: 'Sidebar search syncs with global search and filters the page tree.', action: () => { setTutorialFieldValue('searchInput', 'welcome'); filterPages(); } },
                { selector: '#pagesList', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Page Tree', body: 'Manage hierarchy, favorites, duplicate, rename, delete, and drag/drop.', action: () => { setTutorialFieldValue('searchInput', ''); setTutorialFieldValue('globalSearch', ''); filterPages(); } },
                { selector: '#newPageModal', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Create Pages', body: 'Create new pages and choose a template.', action: () => { createNewPage(); setTutorialFieldValue('newPageName', 'Tutorial Project'); setTutorialFieldValue('newPageTemplate', 'project', 'change'); } },
                { selector: '#newPageName', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Hierarchy With ::', body: 'Use `::` in names to nest pages automatically.', action: () => { createNewPage(); setTutorialFieldValue('newPageName', 'Projects::Website::Launch'); setTutorialFieldValue('newPageTemplate', 'meeting', 'change'); } },
                { selector: '#renamePageModal', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Rename Pages', body: 'Renaming a parent updates child paths.', action: () => { const page = ensureTutorialPageLoaded(); if (!page) return; showRenameModal(page.id); setTutorialFieldValue('renamePageName', `${page.title}::Renamed Example`); } },
                { selector: '.page-item .page-item-icons', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Quick Page Actions', body: 'Favorite, duplicate, rename, and delete are on each page row.' },
                { selector: '.page-item', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Collapse Branches', body: 'Parent branches can be collapsed for cleaner navigation.', action: () => { const parent = pages.find(page => pages.some(child => child.id !== page.id && child.title.startsWith(`${page.title}::`))); if (parent) toggleCollapse(parent.id); } },
                { selector: '#emojiPicker', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Page Icons', body: 'Open emoji picker to customize page icons.', action: () => { const page = ensureTutorialPageLoaded(); if (page) openEmojiPicker(page.id); } },
                { selector: '#breadcrumbs', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Breadcrumbs', body: 'Breadcrumbs show nested path and let you jump quickly.', action: () => ensureTutorialNestedPageLoaded() },
                { selector: '#pageTitle', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Inline Title Editing', body: 'Edit current page title directly.', action: () => { const titleInput = document.getElementById('pageTitle'); if (titleInput) { titleInput.focus(); titleInput.select(); } } },
                { selector: '#tagsContainer', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Tags', body: 'Use tags to label pages and filter from sidebar.' },
                { selector: '#focusTimer', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Focus Timer', body: 'Timer includes presets, custom H:M:S, start/pause/reset.' },
                { selector: '#timerSettings', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Timer Settings', body: 'Open timer settings and customize durations.', action: () => { const container = document.getElementById('focusTimer'); if (container && !container.classList.contains('expanded')) toggleTimerSettings(); } },
                { selector: '.timer-presets', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Timer Presets', body: 'Quick switch to 15m/25m/50m.', action: () => { const container = document.getElementById('focusTimer'); if (container && !container.classList.contains('expanded')) toggleTimerSettings(); setTimerPreset(50); } },
                { selector: '#timerStartBtn', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Timer Start/Pause', body: 'Start countdown and pause safely.', action: () => { startTimer(); setTimeout(() => pauseTimer(), 900); } },
                { selector: '#today-committed-list', before: () => setActiveView('today'), title: 'Today Task Areas', body: 'Committed and due sections keep daily focus clear.' },
                { selector: '#allTasksDrawer', before: () => setActiveView('today'), title: 'All Tasks Drawer', body: 'Open full list access from Today.', action: () => { const drawer = document.getElementById('allTasksDrawer'); if (drawer) drawer.setAttribute('aria-hidden', 'false'); } },
                { selector: '#taskModal', before: () => setActiveView('today'), title: 'Task Modal', body: 'Set task title, notes, recurrence, due date, category, note link, and priority.', action: () => { const page = ensureTutorialPageLoaded(); openTaskModal(null, { title: 'Tutorial Task Example', notes: 'Demo task from tutorial.', scheduleType: 'once', category: 'work', priority: 'high', noteId: page ? page.id : null }); } },
                { selector: '#taskWeeklyDays', before: () => setActiveView('today'), title: 'Weekly Recurrence', body: 'Weekly schedule reveals weekday selectors.', action: () => { openTaskModal(null, { title: 'Weekly Demo Task' }); setTutorialFieldValue('taskScheduleInput', 'weekly', 'change'); document.querySelectorAll('#taskWeeklyDays input[type=\"checkbox\"]').forEach(box => { box.checked = box.value === '1' || box.value === '3' || box.value === '5'; }); } },
                { selector: '#taskNoteInput', before: () => setActiveView('today'), title: 'Attach Task to Note', body: 'Link tasks to notes and prioritize execution.', action: () => { const page = ensureTutorialPageLoaded(); openTaskModal(null, { title: 'Linked Task Demo' }); if (page) setTutorialFieldValue('taskNoteInput', page.id, 'change'); setTutorialFieldValue('taskPriorityInput', 'high', 'change'); } },
                { selector: '#view-timeline', before: () => setActiveView('timeline'), title: 'Timeline View', body: 'Plan your day in time blocks with live status.', action: () => { setActiveView('timeline'); renderTimeline(); } },
                { selector: '#blockModal', before: () => setActiveView('timeline'), title: 'Add Time Block', body: 'Set name, time range, category, color, and recurrence.', action: () => { openBlockModal(null); setTutorialFieldValue('blockNameInput', 'Deep Work'); setTutorialFieldValue('blockStartInput', '09:00', 'change'); setTutorialFieldValue('blockEndInput', '10:30', 'change'); setTutorialFieldValue('blockCategoryInput', 'work', 'change'); setTutorialFieldValue('blockRecurrenceInput', 'weekdays', 'change'); } },
                { selector: '#timeModeSelect', before: () => setActiveView('timeline'), title: 'Time Modes', body: 'Use auto mode or force morning/afternoon/evening/night.', action: () => setTutorialFieldValue('timeModeSelect', 'evening', 'change') },
                { selector: '#currentBlockCard', before: () => setActiveView('timeline'), title: 'Current Block Card', body: 'Shows active block countdown and progress.' },
                { selector: '#editor', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Notes Editor', body: 'Rich editor for writing, formatting, and embedded content.', action: () => focusEditorForTutorial() },
                { selector: '#toolbar', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Toolbar', body: 'Use formatting and insert actions from this toolbar.' },
                { selector: 'button[onclick=\"insertLink()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Links', body: 'Add web links directly into notes.', actionLabel: 'Run Link Prompt', autoAction: false, action: () => insertLink() },
                { selector: 'button[onclick=\"insertTable()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Tables', body: 'Create structured tables in notes.', actionLabel: 'Run Table Prompt', autoAction: false, action: () => insertTable() },
                { selector: 'button[onclick=\"insertImage()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Images', body: 'Insert images via URL or upload.', actionLabel: 'Run Image Prompt', autoAction: false, action: () => insertImage() },
                { selector: 'button[onclick=\"insertVideo()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Videos', body: 'Embed YouTube/Vimeo/direct video or upload.', actionLabel: 'Run Video Prompt', autoAction: false, action: () => insertVideo() },
                { selector: 'button[onclick=\"insertAudio()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Audio', body: 'Embed Spotify/SoundCloud/direct audio or upload.', actionLabel: 'Run Audio Prompt', autoAction: false, action: () => insertAudio() },
                { selector: 'button[onclick=\"insertEmbed()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Web Embeds', body: 'Embed Docs, Figma, CodePen, and more.', actionLabel: 'Run Embed Prompt', autoAction: false, action: () => insertEmbed() },
                { selector: 'button[onclick=\"insertChecklist()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Checklists', body: 'Insert interactive checklist blocks.', actionLabel: 'Run Checklist Prompt', autoAction: false, action: () => insertChecklist() },
                { selector: 'button[onclick=\"insertCollapsible()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Collapsible', body: 'Create collapsible sections for dense notes.', actionLabel: 'Run Collapsible Prompt', autoAction: false, action: () => insertCollapsible() },
                { selector: 'button[onclick=\"insertPageLink()\"]', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Insert Page Links', body: 'Link to another page in your workspace.', actionLabel: 'Run Page-Link Prompt', autoAction: false, action: () => insertPageLink() },
                { selector: '#slashMenu', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Slash Commands', body: 'Type / in editor for quick command search.', action: () => openSlashMenuForTutorial('table') },
                { selector: '#fontSettingsPanel', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Font Panel', body: 'Adjust typography, colors, highlight, and animations.', action: () => { const panel = document.getElementById('fontSettingsPanel'); if (panel && panel.style.display !== 'block') toggleFontPanel(); } },
                { selector: '#toolbarTimeControls', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Tab Clock', body: 'Clock settings are embedded in the top tab switcher.', action: () => { const controls = document.getElementById('toolbarTimeControls'); if (controls && controls.style.display === 'none') { const gear = document.getElementById('toolbarTimeGear'); if (gear) gear.click(); } } },
                { selector: '.theme-switcher-btn', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Theme Switcher', body: 'Open floating theme customization panel.', action: () => openThemePanelForTutorial() },
                { selector: '.apply-mode-toggle', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); openThemePanelForTutorial(); }, title: 'Theme Apply Modes', body: 'Apply themes to current page, all pages, or selected pages.', action: () => { const customBtn = document.querySelector('.mode-btn[onclick*=\"custom\"]'); if (customBtn) customBtn.click(); } },
                { selector: '#customAccent', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); openThemePanelForTutorial(); }, title: 'Custom Colors', body: 'Customize background, text, and accent colors.' },
                { selector: '#fontFamilySelect', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); openThemePanelForTutorial(); }, title: 'Theme Typography', body: 'Set font family, size, and line-height.' },
                { selector: '#animationsToggle', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); openThemePanelForTutorial(); }, title: 'Theme Animations', body: 'Enable or disable interface motion.' },
                { selector: '#view-settings', before: () => setActiveView('settings'), title: 'Settings View', body: 'Central place for appearance, data, backup, and tutorial controls.' },
                { selector: '#view-settings [data-theme=\"dark\"]', before: () => setActiveView('settings'), title: 'Settings Appearance', body: 'Quick light/dark theme switches are available here.', action: () => { const darkBtn = document.querySelector('#view-settings [data-theme=\"dark\"]'); if (darkBtn) darkBtn.click(); const lightBtn = document.querySelector('#view-settings [data-theme=\"light\"]'); if (lightBtn) lightBtn.click(); } },
                { selector: '#exportWorkspaceBtn', before: () => setActiveView('settings'), title: 'Export and Import', body: 'Backup/restore workspace JSON, or import common documents into new note pages.' },
                { selector: '#driveSettingsModal', before: () => setActiveView('settings'), title: 'Google Drive Settings', body: 'Configure your own Drive credentials for backup.', action: () => openDriveSettings() },
                { selector: '#storageOptions', before: () => setActiveView('settings'), title: 'Bottom Save Bar', body: 'Manual local save, export/import, and Drive save actions.' },
                { selector: '#saveLocalBtn', before: () => setActiveView('settings'), title: 'Manual Local Save', body: 'Save Locally persists workspace to browser storage on demand.' },
                { selector: '#chatbotBtn', before: () => setActiveView('notes'), title: 'Flow Assistant', body: 'Open assistant from this floating button.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); } },
                { selector: '#chatbotInfo', before: () => setActiveView('notes'), title: 'Assistant Info', body: 'See API-key setup and privacy details.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); openChatInfo(); } },
                { selector: '#chatFullBtn', before: () => setActiveView('notes'), title: 'Assistant Fullscreen', body: 'Expand chat for longer sessions.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); const fullBtn = document.getElementById('chatFullBtn'); if (fullBtn && !panel.classList.contains('fullscreen')) fullBtn.click(); } },
                { selector: '#groqApiKeyInput', before: () => setActiveView('notes'), title: 'Assistant API Key', body: 'Store your Groq API key locally to enable responses.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); } },
                { selector: '#startTutorialBtn', before: () => setActiveView('settings'), title: 'Redo Tutorial', body: 'Run this walkthrough again from settings whenever you want.' },
                { title: 'Tutorial Complete', body: 'You just covered pages, hierarchy, tasks, timeline, editor inserts, theme system, backups, and assistant tools.' }
            ];
        }

        function positionTutorialElements(step) {
            const spotlight = document.getElementById('tutorialSpotlight');
            const card = document.getElementById('tutorialCard');
            if (!spotlight || !card || !tutorialState.active) return;

            let target = null;
            if (step && step.selector) {
                target = document.querySelector(step.selector);
            }

            if (target) {
                target.scrollIntoView({ block: 'center', inline: 'nearest' });
                const rect = target.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const padding = 8;
                    const left = Math.max(8, rect.left - padding);
                    const top = Math.max(8, rect.top - padding);
                    const width = Math.min(window.innerWidth - left - 8, rect.width + padding * 2);
                    const height = Math.min(window.innerHeight - top - 8, rect.height + padding * 2);

                    spotlight.style.display = 'block';
                    spotlight.style.left = `${left}px`;
                    spotlight.style.top = `${top}px`;
                    spotlight.style.width = `${Math.max(40, width)}px`;
                    spotlight.style.height = `${Math.max(32, height)}px`;

                    card.classList.remove('centered');
                    card.style.transform = 'none';
                    const cardRect = card.getBoundingClientRect();
                    const viewportPadding = 12;
                    let cardTop = rect.bottom + 14;
                    if (cardTop + cardRect.height > window.innerHeight - viewportPadding) {
                        cardTop = rect.top - cardRect.height - 14;
                    }
                    cardTop = Math.max(viewportPadding, Math.min(cardTop, window.innerHeight - cardRect.height - viewportPadding));

                    let cardLeft = rect.left;
                    if (cardLeft + cardRect.width > window.innerWidth - viewportPadding) {
                        cardLeft = window.innerWidth - cardRect.width - viewportPadding;
                    }
                    cardLeft = Math.max(viewportPadding, cardLeft);

                    card.style.left = `${cardLeft}px`;
                    card.style.top = `${cardTop}px`;
                    return;
                }
            }

            spotlight.style.display = 'none';
            card.classList.add('centered');
            card.style.left = '50%';
            card.style.top = '50%';
            card.style.transform = 'translate(-50%, -50%)';
        }

        function renderTutorialStep() {
            if (!tutorialState.active || tutorialState.steps.length === 0) return;
            const step = tutorialState.steps[tutorialState.stepIndex];
            if (!step) return;

            resetTutorialTransientUi();
            if (typeof step.before === 'function') step.before();

            const counter = document.getElementById('tutorialStepCounter');
            const title = document.getElementById('tutorialTitle');
            const body = document.getElementById('tutorialBody');
            const prevBtn = document.getElementById('tutorialPrevBtn');
            const nextBtn = document.getElementById('tutorialNextBtn');
            const actionBtn = document.getElementById('tutorialActionBtn');
            if (counter) counter.textContent = `Step ${tutorialState.stepIndex + 1} of ${tutorialState.steps.length}`;
            if (title) title.textContent = step.title || 'Step';
            if (body) body.textContent = step.body || '';
            if (prevBtn) prevBtn.disabled = tutorialState.stepIndex === 0;
            if (nextBtn) nextBtn.textContent = tutorialState.stepIndex === tutorialState.steps.length - 1 ? 'Finish' : 'Next';
            if (actionBtn) {
                const hasAction = typeof step.action === 'function';
                actionBtn.style.display = hasAction ? 'inline-flex' : 'none';
                actionBtn.disabled = !hasAction;
                actionBtn.textContent = step.actionLabel || 'Run Action';
            }

            runTutorialStepAction(step, false);

            if (tutorialRepositionTimer) clearTimeout(tutorialRepositionTimer);
            tutorialRepositionTimer = setTimeout(() => positionTutorialElements(step), 140);
        }

        function runTutorialStepAction(step, manual = false) {
            if (!step || typeof step.action !== 'function') return;
            if (!manual && step.autoAction === false) return;
            try {
                step.action({ manual });
            } catch (err) {
                console.warn('Tutorial step action failed', err);
                if (manual) showToast('This action could not run automatically.');
            }
        }

        function closeInteractiveTutorial() {
            const overlay = document.getElementById('tutorialOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
            }
            tutorialState.active = false;
            tutorialState.steps = [];
            tutorialState.stepIndex = 0;
            resetTutorialTransientUi();
            closeTutorialThemePanelIfNeeded();
            if (tutorialRepositionTimer) {
                clearTimeout(tutorialRepositionTimer);
                tutorialRepositionTimer = null;
            }
            syncTutorialSettingsControls();
        }

        function finishInteractiveTutorial() {
            if (appSettings) {
                appSettings.tutorialSeen = true;
                appSettings.tutorialCompleted = true;
                appSettings.tutorialCompletedAt = new Date().toISOString();
                persistAppData();
            }
            closeInteractiveTutorial();
            showToast('Tutorial complete. You can rerun it from Settings.');
        }

        function skipInteractiveTutorial() {
            if (appSettings) {
                appSettings.tutorialSeen = true;
                persistAppData();
            }
            closeInteractiveTutorial();
            showToast('Tutorial skipped. Reopen it from Settings any time.');
        }

        function startInteractiveTutorial(forceStart = false) {
            const overlay = document.getElementById('tutorialOverlay');
            if (!overlay || tutorialState.active) return;
            if (!forceStart && appSettings && appSettings.tutorialSeen) return;

            const confirmationMessage = forceStart
                ? 'Start the interactive tutorial now? It will run guided actions across the app.'
                : 'Would you like to start the interactive tutorial now?';
            const shouldStart = window.confirm(confirmationMessage);
            if (!shouldStart) {
                if (!forceStart && appSettings && !appSettings.tutorialSeen) {
                    appSettings.tutorialSeen = true;
                    persistAppData();
                    syncTutorialSettingsControls();
                }
                showToast('Tutorial not started. You can launch it from Settings any time.');
                return;
            }

            tutorialState.steps = getTutorialSteps();
            tutorialState.stepIndex = 0;
            tutorialState.active = true;

            if (appSettings) {
                appSettings.tutorialSeen = true;
                persistAppData();
            }

            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            renderTutorialStep();
        }

        function maybeStartInteractiveTutorial() {
            syncTutorialSettingsControls();
            if (!appSettings || appSettings.tutorialSeen) return;
            setTimeout(() => startInteractiveTutorial(false), 700);
        }

        function initTutorialBindings() {
            const overlay = document.getElementById('tutorialOverlay');
            const nextBtn = document.getElementById('tutorialNextBtn');
            const prevBtn = document.getElementById('tutorialPrevBtn');
            const skipBtn = document.getElementById('tutorialSkipBtn');
            const actionBtn = document.getElementById('tutorialActionBtn');
            if (!overlay || !nextBtn || !prevBtn || !skipBtn) return;
            if (overlay.dataset.bound === 'true') return;
            overlay.dataset.bound = 'true';

            nextBtn.addEventListener('click', () => {
                if (!tutorialState.active) return;
                if (tutorialState.stepIndex >= tutorialState.steps.length - 1) {
                    finishInteractiveTutorial();
                } else {
                    tutorialState.stepIndex += 1;
                    renderTutorialStep();
                }
            });

            prevBtn.addEventListener('click', () => {
                if (!tutorialState.active) return;
                tutorialState.stepIndex = Math.max(0, tutorialState.stepIndex - 1);
                renderTutorialStep();
            });

            skipBtn.addEventListener('click', () => {
                if (!tutorialState.active) return;
                skipInteractiveTutorial();
            });

            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    if (!tutorialState.active) return;
                    const step = tutorialState.steps[tutorialState.stepIndex];
                    runTutorialStepAction(step, true);
                    if (step) setTimeout(() => positionTutorialElements(step), 120);
                });
            }

            window.addEventListener('resize', () => {
                if (!tutorialState.active) return;
                const step = tutorialState.steps[tutorialState.stepIndex];
                if (step) positionTutorialElements(step);
            });

            window.addEventListener('scroll', () => {
                if (!tutorialState.active) return;
                const step = tutorialState.steps[tutorialState.stepIndex];
                if (step) positionTutorialElements(step);
            }, true);

            document.addEventListener('keydown', (event) => {
                if (!tutorialState.active) return;
                if (event.key === 'Escape') {
                    event.preventDefault();
                    skipInteractiveTutorial();
                    return;
                }
                if (event.key === 'ArrowRight' || event.key === 'Enter') {
                    event.preventDefault();
                    nextBtn.click();
                    return;
                }
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    prevBtn.click();
                }
            });
        }

        function initWorkspaceUI() {
            document.querySelectorAll('.view-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    setActiveView(tab.dataset.view);
                });
            });

            // Mobile tab toggle: expand/collapse the view-tabs list
            const viewToggle = document.querySelector('.view-tabs-toggle');
            const viewTabs = document.querySelector('.view-tabs');
            if (viewToggle && viewTabs) {
                // initialize label
                const active = viewTabs.querySelector('.view-tab.active');
                if (active) viewToggle.querySelector('.view-tabs-current').textContent = active.textContent.trim();

                viewToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const expanded = viewTabs.classList.toggle('expanded');
                    viewToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                    // if expanded, move focus into the first tab for keyboard users
                    if (expanded) {
                        const first = viewTabs.querySelector('.view-tab');
                        if (first) first.focus();
                    }
                });

                // Click outside should collapse
                document.addEventListener('click', (e) => {
                    if (!viewTabs.contains(e.target) && !viewToggle.contains(e.target) && viewTabs.classList.contains('expanded')) {
                        viewTabs.classList.remove('expanded');
                        viewToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }

            // Ensure FAB works even if the direct listener wasn't attached (delegation fallback)
            document.addEventListener('click', (e) => {
                const btn = e.target.closest && e.target.closest('#addTaskBtn');
                if (btn) {
                    try { openTaskModal(); } catch (err) { console.warn('openTaskModal failed', err); }
                }
            });

            const globalSearchInput = document.getElementById('globalSearch');
            if (globalSearchInput) {
                globalSearchInput.addEventListener('input', () => {
                    const sidebarSearch = document.getElementById('searchInput');
                    if (sidebarSearch && sidebarSearch.value !== globalSearchInput.value) {
                        sidebarSearch.value = globalSearchInput.value;
                    }
                    filterPages();
                });
            }

            const sidebarSearch = document.getElementById('searchInput');
            if (sidebarSearch) {
                sidebarSearch.addEventListener('input', () => {
                    const global = document.getElementById('globalSearch');
                    if (global && global.value !== sidebarSearch.value) {
                        global.value = sidebarSearch.value;
                    }
                    filterPages();
                });
            }

            const addTaskBtn = document.getElementById('addTaskBtn');
            if (addTaskBtn) addTaskBtn.addEventListener('click', () => openTaskModal());

            const addNoteBtn = document.getElementById('addNoteBtn');
            if (addNoteBtn) addNoteBtn.addEventListener('click', () => createNewPage());

            const useFreezeBtn = document.getElementById('useFreezeBtn');
            if (useFreezeBtn) useFreezeBtn.addEventListener('click', useFreeze);

            const linkedTaskAddBtn = document.getElementById('linkedTaskAddBtn');
            if (linkedTaskAddBtn) linkedTaskAddBtn.addEventListener('click', addLinkedTaskFromInput);
            const addLinkedTaskBtn = document.getElementById('addLinkedTaskBtn');
            if (addLinkedTaskBtn) {
                addLinkedTaskBtn.addEventListener('click', () => openTaskModal(null, { noteId: currentPageId }));
            }
            const linkedTaskInput = document.getElementById('linkedTaskInput');
            if (linkedTaskInput) linkedTaskInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') addLinkedTaskFromInput();
            });

            const taskScheduleInput = document.getElementById('taskScheduleInput');
            if (taskScheduleInput) {
                taskScheduleInput.addEventListener('change', () => {
                    const weeklyContainer = document.getElementById('taskWeeklyDays');
                    if (weeklyContainer) {
                        weeklyContainer.style.display = taskScheduleInput.value === 'weekly' ? 'block' : 'none';
                    }
                });
            }

            // All Tasks drawer controls (header toggle + close button)
            try {
                const toggleAll = document.getElementById('toggleAllTasksBtn');
                const closeAll = document.getElementById('closeAllTasksBtn');
                const drawer = document.getElementById('allTasksDrawer');
                const topAdd = document.getElementById('topAddTaskBtn');
                if (toggleAll && drawer) {
                    toggleAll.addEventListener('click', () => {
                        const isOpen = drawer.getAttribute('aria-hidden') === 'false';
                        drawer.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
                    });
                }
                if (closeAll && drawer) closeAll.addEventListener('click', () => drawer.setAttribute('aria-hidden', 'true'));
                if (topAdd) topAdd.addEventListener('click', () => openTaskModal());
            } catch (e) { /* non-critical */ }

            document.querySelectorAll('#view-settings [data-theme]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.dataset.theme === 'dark' ? 'dark' : 'default';
                    themeApplyMode = 'current';
                    applyPresetTheme(theme);
                    saveThemeSettings();
                    syncSettingsControls();
                });
            });

            const motionToggle = document.getElementById('motionToggle');
            if (motionToggle) {
                motionToggle.addEventListener('change', () => {
                    if (appSettings) {
                        appSettings.motionEnabled = !motionToggle.checked;
                        persistAppData();
                    }
                    applyMotionSetting();
                });
            }

            const timeFormatSelect = document.getElementById('timeFormatSelect');
            const showSecondsSelect = document.getElementById('showSecondsSelect');
            if (timeFormatSelect && appSettings) {
                timeFormatSelect.value = appSettings.timeFormat || '12';
                timeFormatSelect.addEventListener('change', () => {
                    appSettings.timeFormat = timeFormatSelect.value;
                    persistAppData();
                    updateToolbarTimeWidget();
                });
            }
            if (showSecondsSelect && appSettings) {
                showSecondsSelect.value = appSettings.showSeconds ? 'true' : 'false';
                showSecondsSelect.addEventListener('change', () => {
                    appSettings.showSeconds = showSecondsSelect.value === 'true';
                    persistAppData();
                    updateToolbarTimeWidget();
                });
            }

            if (!homeworkSyncBound) {
                homeworkSyncBound = true;
                const homeworkSyncHandler = () => {
                    try {
                        renderTaskViews();
                    } catch (err) {
                        console.warn('Homework sync failed', err);
                    }
                };
                window.addEventListener('storage', (event) => {
                    if (!event || !HOMEWORK_STORAGE_KEYS.includes(event.key)) return;
                    homeworkSyncHandler();
                });
                window.addEventListener('homework:updated', homeworkSyncHandler);
            }

            initTutorialBindings();
            const tutorialBtn = document.getElementById('startTutorialBtn');
            if (tutorialBtn && tutorialBtn.dataset.bound !== 'true') {
                tutorialBtn.dataset.bound = 'true';
                tutorialBtn.addEventListener('click', () => startInteractiveTutorial(true));
            }

            syncSettingsControls();
            setActiveView(activeView);
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        function setApplyMode(mode) {
            themeApplyMode = mode;
            if (appSettings) {
                appSettings.themeApplyMode = mode;
                persistAppData();
            }
            
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            const selector = document.getElementById('pageSelector');
            selector.classList.toggle('active', mode === 'custom');
            if (mode === 'custom') updatePageSelectorList();
        }

        function updatePageSelectorList() {
            const list = document.getElementById('pageSelectorList');
            list.innerHTML = '';
            
            pages.forEach(page => {
                const checkbox = document.createElement('div');
                checkbox.className = 'page-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" id="theme-page-${page.id}" 
                           ${selectedPagesForTheme.includes(page.id) ? 'checked' : ''}>
                    <label for="theme-page-${page.id}" style="cursor: pointer; flex: 1;">
                        ${page.title}
                    </label>
                `;
                
                checkbox.querySelector('input').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedPagesForTheme.push(page.id);
                    } else {
                        selectedPagesForTheme = selectedPagesForTheme.filter(id => id !== page.id);
                    }
                });
                
                list.appendChild(checkbox);
            });
        }

        function applyPresetTheme(themeName) {
            document.querySelectorAll('.preset-card').forEach(card => {
                card.classList.toggle('active', card.dataset.theme === themeName);
            });
            
            if (themeApplyMode === 'all') {
                globalTheme = themeName;
                pages.forEach(page => { page.theme = themeName; });
                document.body.setAttribute('data-theme', themeName);
            } else if (themeApplyMode === 'current') {
                const page = pages.find(p => p.id === currentPageId);
                if (page) page.theme = themeName;
                document.body.setAttribute('data-theme', themeName);
            } else if (themeApplyMode === 'custom') {
                selectedPagesForTheme.forEach(pageId => {
                    const page = pages.find(p => p.id === pageId);
                    if (page) page.theme = themeName;
                });
                if (selectedPagesForTheme.includes(currentPageId)) {
                    document.body.setAttribute('data-theme', themeName);
                }
            }
            
            savePagesToLocal();
            saveThemeSettings();
            renderPagesList();
            const themeLabel = themes[themeName] ? themes[themeName].name : 'Custom';
            showToast(`Theme applied: ${themeLabel}`);
            
            syncSettingsControls();
        }

        function applyCustomColors() {
            const customTheme = {
                bgPrimary: document.getElementById('customBgPrimary').value,
                bgSecondary: document.getElementById('customBgSecondary').value,
                textPrimary: document.getElementById('customTextPrimary').value,
                accent: document.getElementById('customAccent').value
            };
            
            const root = document.documentElement;
            Object.keys(customTheme).forEach(key => {
                root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, customTheme[key]);
            });

            const applyToPage = (page) => {
                page.customTheme = customTheme;
                page.theme = 'custom';
            };
            
            if (themeApplyMode === 'all') pages.forEach(applyToPage);
            else if (themeApplyMode === 'current') applyToPage(pages.find(p => p.id === currentPageId));
            else if (themeApplyMode === 'custom') {
                selectedPagesForTheme.forEach(pageId => applyToPage(pages.find(p => p.id === pageId)));
            }
            
            savePagesToLocal();
            saveThemeSettings();
            showToast('Custom colors applied!');
        }

        function resetTheme() {
            const resetPage = (page) => {
                page.theme = 'default';
                delete page.customTheme;
            };

            if (themeApplyMode === 'all') {
                pages.forEach(resetPage);
                globalTheme = 'default';
            } else if (themeApplyMode === 'current') {
                resetPage(pages.find(p => p.id === currentPageId));
            } else if (themeApplyMode === 'custom') {
                selectedPagesForTheme.forEach(pageId => resetPage(pages.find(p => p.id === pageId)));
            }
            
            document.body.setAttribute('data-theme', 'default');
            document.documentElement.style = '';
            
            savePagesToLocal();
            saveThemeSettings();
            renderPagesList();
            showToast('Theme reset to default!');
        }

        function loadPageTheme(pageId) {
            const page = pages.find(p => p.id === pageId);
            const themeToApply = (page && page.theme) ? page.theme : globalTheme;
            
            if (themeToApply === 'custom' && page.customTheme) {
                const root = document.documentElement;
                Object.entries(page.customTheme).forEach(([key, value]) => {
                     root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
                });
                document.body.removeAttribute('data-theme');
            } else {
                document.body.setAttribute('data-theme', themeToApply);
                document.documentElement.style = '';
            }
            
            syncSettingsControls();
        }

        function saveThemeSettings() {
            if (!appSettings) return;
            appSettings.theme = globalTheme === 'dark' ? 'dark' : 'light';
            appSettings.selectedPagesForTheme = selectedPagesForTheme;
            appSettings.themeApplyMode = themeApplyMode;
            persistAppData();
        }

        function loadThemeSettings() {
            globalTheme = appSettings && appSettings.theme === 'dark' ? 'dark' : 'default';
            selectedPagesForTheme = appSettings && Array.isArray(appSettings.selectedPagesForTheme)
                ? appSettings.selectedPagesForTheme
                : [];
            themeApplyMode = appSettings && appSettings.themeApplyMode ? appSettings.themeApplyMode : 'current';
            
            // Load font settings
            loadFontSettings();
            
            // Load animation settings
            loadAnimationSettings();
        }

        // Font Settings Functions
        function applyFontSettings() {
            const fontFamily = document.getElementById('fontFamilySelect').value;
            const fontSize = document.getElementById('fontSizeSelect').value;
            const lineHeight = document.getElementById('lineHeightSelect').value;
            
            const editor = document.getElementById('editor');
            editor.style.fontFamily = fontFamily;
            editor.style.fontSize = fontSize;
            editor.style.lineHeight = lineHeight;
            
            // Save settings
            saveFontSettings();
            showToast('Font settings applied!');
        }

        function saveFontSettings() {
            const settings = {
                fontFamily: document.getElementById('fontFamilySelect').value,
                fontSize: document.getElementById('fontSizeSelect').value,
                lineHeight: document.getElementById('lineHeightSelect').value
            };
            if (appSettings) {
                appSettings.font = settings;
                persistAppData();
            }
        }

        function loadFontSettings() {
            const settings = appSettings && appSettings.font ? appSettings.font : {};
            
            if (settings.fontFamily) {
                document.getElementById('fontFamilySelect').value = settings.fontFamily;
                if (document.getElementById('fontFamilySelectToolbar')) {
                    document.getElementById('fontFamilySelectToolbar').value = settings.fontFamily;
                }
            }
            if (settings.fontSize) {
                document.getElementById('fontSizeSelect').value = settings.fontSize;
                if (document.getElementById('fontSizeSelectToolbar')) {
                    document.getElementById('fontSizeSelectToolbar').value = settings.fontSize;
                }
            }
            if (settings.lineHeight) {
                document.getElementById('lineHeightSelect').value = settings.lineHeight;
                if (document.getElementById('lineHeightSelectToolbar')) {
                    document.getElementById('lineHeightSelectToolbar').value = settings.lineHeight;
                }
            }
            
            // Apply settings
            const editor = document.getElementById('editor');
            if (settings.fontFamily) editor.style.fontFamily = settings.fontFamily;
            if (settings.fontSize) editor.style.fontSize = settings.fontSize;
            if (settings.lineHeight) editor.style.lineHeight = settings.lineHeight;
        }

        // Animation Settings Functions
        function toggleAnimations() {
            const enabled = document.getElementById('animationsToggle').checked;
            if (appSettings) {
                appSettings.motionEnabled = enabled;
                persistAppData();
            }
            applyMotionSetting();
        }

        function loadAnimationSettings() {
            const enabled = appSettings ? appSettings.motionEnabled !== false : true;
            document.getElementById('animationsToggle').checked = enabled;
            if (document.getElementById('animationsToggleToolbar')) {
                document.getElementById('animationsToggleToolbar').checked = enabled;
            }
            applyMotionSetting();
        }

        function applyMotionSetting() {
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const enabled = (appSettings ? appSettings.motionEnabled !== false : true) && !prefersReduced;
            if (enabled) {
                document.body.classList.add('animations-enabled');
            } else {
                document.body.classList.remove('animations-enabled');
            }
            const motionToggle = document.getElementById('motionToggle');
            if (motionToggle) {
                motionToggle.checked = !enabled;
            }
            const animationsToggle = document.getElementById('animationsToggle');
            if (animationsToggle) animationsToggle.checked = enabled;
            const animationsToggleToolbar = document.getElementById('animationsToggleToolbar');
            if (animationsToggleToolbar) animationsToggleToolbar.checked = enabled;
        }

        // Toolbar Font Settings Functions
        function toggleFontPanel() {
            const panel = document.getElementById('fontSettingsPanel');
            const btn = document.getElementById('fontPanelBtn');
            if (panel.style.display === 'none' || panel.style.display === '') {
                // Position the panel near the button
                if (btn) {
                    const rect = btn.getBoundingClientRect();
                    panel.style.top = (rect.bottom + 8) + 'px';
                    panel.style.right = (window.innerWidth - rect.right) + 'px';
                }
                panel.style.display = 'block';
                syncToolbarFontSettings();
            } else {
                panel.style.display = 'none';
            }
        }
        
        // Close font panel when clicking outside
        // Use mousedown to prevent closing before select/input events
        document.addEventListener('mousedown', function(e) {
            const panel = document.getElementById('fontSettingsPanel');
            const btn = document.getElementById('fontPanelBtn');
            if (panel && panel.style.display === 'block') {
                if (!panel.contains(e.target) && !btn.contains(e.target)) {
                    panel.style.display = 'none';
                }
            }
        });

        function syncToolbarFontSettings() {
            // Sync toolbar dropdowns with theme panel dropdowns
            const fontFamily = document.getElementById('fontFamilySelect').value;
            const fontSize = document.getElementById('fontSizeSelect').value;
            const lineHeight = document.getElementById('lineHeightSelect').value;
            const animations = document.getElementById('animationsToggle').checked;
            
            document.getElementById('fontFamilySelectToolbar').value = fontFamily;
            document.getElementById('fontSizeSelectToolbar').value = fontSize;
            document.getElementById('lineHeightSelectToolbar').value = lineHeight;
            document.getElementById('animationsToggleToolbar').checked = animations;
        }

        function applyFontSettingsFromToolbar() {
            const fontFamily = document.getElementById('fontFamilySelectToolbar').value;
            const fontSize = document.getElementById('fontSizeSelectToolbar').value;
            const lineHeight = document.getElementById('lineHeightSelectToolbar').value;
            
            const editor = document.getElementById('editor');
            editor.style.fontFamily = fontFamily;
            editor.style.fontSize = fontSize;
            editor.style.lineHeight = lineHeight;
            
            // Sync with theme panel
            document.getElementById('fontFamilySelect').value = fontFamily;
            document.getElementById('fontSizeSelect').value = fontSize;
            document.getElementById('lineHeightSelect').value = lineHeight;
            
            // Save settings
            saveFontSettings();
        }

        function toggleAnimationsFromToolbar() {
            const enabled = document.getElementById('animationsToggleToolbar').checked;
            document.getElementById('animationsToggle').checked = enabled;
            if (appSettings) {
                appSettings.motionEnabled = enabled;
                persistAppData();
            }
            applyMotionSetting();
        }

        // Close font panel when clicking outside
        // (Removed duplicate outside-close handler)
        
        // --- HELP PAGE ---
        function ensureHelpPage() {
            const helpContent = `
<h1>NoteFlow Help and Documentation</h1>
<p>NoteFlow Atelier is an offline-first workspace for notes, tasks, streaks, and timeline planning.</p>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Views</h2>
<ul>
  <li><strong>Today</strong> - committed tasks, due tasks, streak summary, and progress cards</li>
  <li><strong>Timeline</strong> - day time-block planner with live current-block tracking</li>
  <li><strong>Notes</strong> - hierarchical pages and rich editor tools</li>
  <li><strong>Settings</strong> - appearance, data export/import, and Drive backup setup</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Page Management</h2>

<h3>Create and Organize Pages</h3>
<p>Use <strong>+ New Page</strong> to create pages. You can start blank or from a template.</p>
<p>Use <code>::</code> in titles to nest pages:</p>
<ul>
  <li><code>Projects</code></li>
  <li><code>Projects::Website</code></li>
  <li><code>Projects::Website::Launch</code></li>
</ul>

<h3>Sidebar Actions</h3>
<ul>
  <li>Drag and drop pages to reorder or re-nest</li>
  <li>Collapse/expand parent branches</li>
  <li>Rename pages (child paths update automatically)</li>
  <li>Duplicate pages</li>
  <li>Delete pages (children are deleted with the parent)</li>
  <li>Star one favorite page to auto-load on startup</li>
  <li>Set per-page emoji icons</li>
</ul>

<h3>Find and Filter</h3>
<ul>
  <li>Sidebar search filters page list</li>
  <li>Global search filters notes and tasks together</li>
  <li>Tags can be added per page and used as sidebar filters</li>
  <li>Breadcrumbs show your current nested path and support quick navigation</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Templates</h2>
<p>New page templates:</p>
<ul>
  <li>Blank Page</li>
  <li>Meeting Notes</li>
  <li>Project Plan</li>
  <li>To-Do List</li>
  <li>Daily Journal</li>
  <li>Weekly Review</li>
  <li>Study Notes</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Editor Features</h2>

<h3>Formatting</h3>
<ul>
  <li>Bold, italic, underline, strikethrough</li>
  <li>Headings (H1, H2, H3)</li>
  <li>Bullet and numbered lists</li>
  <li>Block quote and code block</li>
  <li>Clear formatting</li>
</ul>

<h3>Blocks and Embeds</h3>
<ul>
  <li>Tables</li>
  <li>Images (URL or upload)</li>
  <li>Video (YouTube, Vimeo, direct URL, or upload)</li>
  <li>Audio (Spotify, SoundCloud, direct URL, or upload)</li>
  <li>Web embeds (Google Docs, Figma, CodePen, generic iframe, and more)</li>
  <li>Interactive checklists</li>
  <li>Collapsible sections</li>
  <li>Links and links to other pages</li>
</ul>
<p>Inserted media supports resizing, alignment controls, duplicate, and delete actions.</p>

<h3>Slash Commands</h3>
<p>Type <code>/</code> in the editor to open quick insert commands.</p>

<h3>Other Editor Tools</h3>
<ul>
  <li>Live word count</li>
  <li>Font controls</li>
  <li>Toolbar clock with 12h/24h and seconds options</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Tasks and Streaks</h2>

<h3>Task Fields</h3>
<ul>
  <li>Title and notes</li>
  <li>Priority: low, medium, high</li>
  <li>Category: none, work, health, personal, learning</li>
  <li>Due date</li>
  <li>Attach task to a note page</li>
</ul>

<h3>Scheduling</h3>
<ul>
  <li>One-off</li>
  <li>Daily</li>
  <li>Weekly with custom weekday selection</li>
</ul>

<h3>Today Workflow</h3>
<ul>
  <li>Commit and uncommit tasks for focus</li>
  <li>Mark tasks complete</li>
  <li>Open All Tasks drawer for full list access</li>
  <li>Track current streak and weekly freeze usage</li>
</ul>

<h3>Progress Cards</h3>
<ul>
  <li>Weekly completion total and week-over-week delta</li>
  <li>Monthly 30-day activity heatmap</li>
  <li>Category completion donut</li>
  <li>Current, best, and longest streak values</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Timeline</h2>
<p>Use Timeline view to plan your day with time blocks.</p>
<ul>
  <li>Add, edit, and delete blocks</li>
  <li>Set block name, time range, category, color, and recurrence</li>
  <li>Recurrence options: one-time, daily, weekdays, weekly</li>
  <li>See live current block with countdown and progress</li>
  <li>Use automatic or manual time-mode styling (morning, afternoon, evening, night)</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Themes and Appearance</h2>
<ul>
  <li>Preset themes: Light and Dark</li>
  <li>Custom color controls (background, secondary, text, accent)</li>
  <li>Apply modes: current page, all pages, selected pages</li>
  <li>Reduce motion setting</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Saving, Import, and Backup</h2>

<h3>Local Save</h3>
<p>Changes are auto-saved every 30 seconds and on edits. You can also click <strong>Save Locally</strong>.</p>

<h3>Export and Import</h3>
<p>Export creates a full JSON workspace backup including pages, tasks, streak data, settings, and time blocks.</p>
<p>Import restores from a compatible JSON export.</p>

<h3>Google Drive Backup (Optional)</h3>
<p>Open Drive Settings and provide your own Google Cloud Client ID and API Key, then use <strong>Save to Drive</strong>.</p>
<p>Backups are written to your own Drive account.</p>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Flow Assistant</h2>
<ul>
  <li>Optional in-app AI panel</li>
  <li>Uses your own Groq API key stored locally in your browser</li>
  <li>Insert or copy assistant replies into notes</li>
  <li>Fullscreen chat mode available</li>
  <li>To reduce token usage, previous messages are not sent as continuous context</li>
</ul>

<hr style="border: none; border-top: 2px solid var(--border); margin: 25px 0;">

<h2>Privacy and Data Ownership</h2>
<ul>
  <li>Local-first by default</li>
  <li>No required account</li>
  <li>No app-hosted note storage backend</li>
  <li>Optional cloud backup is your own Google Drive</li>
</ul>

<p style="text-align: center; color: var(--text-secondary); margin-top: 30px; font-size: 14px;">
  <strong>NoteFlow Atelier Help</strong><br>
  Keep this page as your in-app feature reference.
</p>
                    `;
            const existingHelpPage = pages.find(p => p.id === 'help_page');
            if (existingHelpPage) {
                existingHelpPage.title = 'Help & Docs';
                existingHelpPage.collapsed = false;
                existingHelpPage.content = helpContent;
                existingHelpPage.updatedAt = new Date().toISOString();
                if (!existingHelpPage.theme) existingHelpPage.theme = 'default';
                return;
            }
            pages.push({
                    id: 'help_page',
                    title: 'Help & Docs',
                    collapsed: false,
                    content: helpContent,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    theme: 'default'
                });
        }

        // Create default page
        function createDefaultPage() {
            const defaultPage = {
                id: generateId(),
                title: 'Welcome to NoteFlow',
                collapsed: false,
                content: '<h2>Welcome to NoteFlow! 🎉</h2><p>This is your personal workspace where you can:</p><ul><li>Create and organize pages in a hierarchy</li><li>Collapse and expand nested pages</li><li>Rename pages directly from the sidebar</li><li>Apply custom themes</li><li>Save your work locally or to Google Drive</li></ul><p>Check out the <b>Help & Docs</b> page for more details!</p>',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                theme: 'default'
            };
            pages.push(defaultPage);
            currentPageId = defaultPage.id;
            savePagesToLocal();
        }

        // Generate unique ID
        function generateId() {
            return '_' + Math.random().toString(36).substr(2, 9);
        }

        // Page Management
        function createNewPage() {
            document.getElementById('newPageModal').classList.add('active');
            document.getElementById('newPageName').focus();
        }

        function confirmNewPage() {
            const name = document.getElementById('newPageName').value.trim();
            const templateId = document.getElementById('newPageTemplate').value;
            if (name) {
                const template = pageTemplates[templateId] || pageTemplates['blank'];
                const newPage = {
                    id: generateId(),
                    title: name,
                    content: template.content,
                    icon: template.icon,
                    collapsed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    theme: globalTheme
                };
                pages.push(newPage);
                savePagesToLocal();
                renderPagesList();
                loadPage(newPage.id);
                setActiveView('notes');
                closeModal('newPageModal');
                // Reset template selector
                document.getElementById('newPageTemplate').value = 'blank';
                showToast('Page created successfully!');
            }
        }
        
        function showRenameModal(pageId) {
            pageToRenameId = pageId;
            const page = pages.find(p => p.id === pageId);
            if(page) {
                document.getElementById('renamePageName').value = page.title;
                document.getElementById('renamePageModal').classList.add('active');
                document.getElementById('renamePageName').focus();
            }
        }
        
        function confirmRename() {
            if (!pageToRenameId) return;
            
            const page = pages.find(p => p.id === pageToRenameId);
            const oldTitle = page.title;
            const newTitle = document.getElementById('renamePageName').value.trim();
            
            if (newTitle && newTitle !== oldTitle) {
                page.title = newTitle;
                
                // Update children titles
                const oldPrefix = oldTitle + '::';
                const newPrefix = newTitle + '::';
                pages.forEach(p => {
                    if (p.title.startsWith(oldPrefix)) {
                        p.title = p.title.replace(oldPrefix, newPrefix);
                    }
                });

                if (currentPageId === pageToRenameId) {
                    document.getElementById('pageTitle').value = newTitle.split('::').pop();
                }
                
                savePagesToLocal();
                renderPagesList();
                closeModal('renamePageModal');
                showToast('Page renamed!');
            } else {
                closeModal('renamePageModal');
            }
        }
        
        function toggleCollapse(pageId) {
            const page = pages.find(p => p.id === pageId);
            if (page) {
                page.collapsed = !page.collapsed;
                savePagesToLocal();
                renderPagesList();
            }
        }

        function loadPage(pageId) {
            if (currentPageId) savePage(); // Save current page before switching
            
            const page = pages.find(p => p.id === pageId);
            if (page) {
                currentPageId = pageId;
                document.getElementById('pageTitle').value = page.title.split('::').pop();
                document.getElementById('editor').innerHTML = page.content;
                
                loadPageTheme(pageId);
                renderBreadcrumbs(page);
                renderTagsContainer();
                renderLinkedTasks();
                
                document.querySelectorAll('.page-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.pageId === pageId);
                });
                
                updateWordCount();
                setActiveView('notes');
                
                // On mobile, close the sidebar after selecting a page for better UX
                if (window.innerWidth <= 900) {
                    const sidebar = document.getElementById('sidebar');
                    const toggleBtn = document.getElementById('sidebarToggle');
                    const overlay = document.getElementById('sidebarOverlay');
                    if (sidebar && !sidebar.classList.contains('collapsed')) {
                        sidebar.classList.add('collapsed');
                        if (toggleBtn) toggleBtn.classList.add('collapsed');
                        if (overlay) overlay.classList.remove('active');
                        // Ensure body-level flag is cleared so hidden UI (theme switcher) returns
                        document.body.classList.remove('sidebar-open');
                    }
                }
            }
        }

        function renderBreadcrumbs(page) {
            const breadcrumbsEl = document.getElementById('breadcrumbs');
            if (!breadcrumbsEl) return;
            
            const parts = page.title.split('::');
            
            // If no hierarchy, hide breadcrumbs
            if (parts.length <= 1) {
                breadcrumbsEl.innerHTML = '';
                return;
            }
            
            let html = '<span class="breadcrumb-item"><i class="fas fa-home breadcrumb-link" onclick="goToFirstPage()" title="Home"></i></span>';
            
            // Build breadcrumb path (all parts except the last one)
            let currentPath = '';
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath = i === 0 ? parts[i] : currentPath + '::' + parts[i];
                const pathCopy = currentPath;
                const parentPage = pages.find(p => p.title === pathCopy);
                
                html += '<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>';
                
                if (parentPage) {
                    html += `<span class="breadcrumb-item"><span class="breadcrumb-link" onclick="loadPage('${parentPage.id}')">${parts[i]}</span></span>`;
                } else {
                    html += `<span class="breadcrumb-item"><span class="breadcrumb-current">${parts[i]}</span></span>`;
                }
            }
            
            // Add current page (last part)
            html += '<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>';
            html += `<span class="breadcrumb-item"><span class="breadcrumb-current">${parts[parts.length - 1]}</span></span>`;
            
            breadcrumbsEl.innerHTML = html;
        }

        function goToFirstPage() {
            const firstPage = pages.find(p => p.id !== 'help_page');
            if (firstPage) loadPage(firstPage.id);
        }

        function savePage() {
            if (!currentPageId) return;
            
            updateSaveStatus('saving');
            
            const page = pages.find(p => p.id === currentPageId);
            if (page) {
                const titleInput = document.getElementById('pageTitle').value || 'Untitled';
                const titleParts = page.title.split('::');
                titleParts[titleParts.length - 1] = titleInput;
                page.title = titleParts.join('::');

                page.content = document.getElementById('editor').innerHTML;
                page.updatedAt = new Date().toISOString();
                savePagesToLocal();
                // A soft-render to update title in sidebar without full redraw
                const pageTitleSpan = document.querySelector(`.page-item[data-page-id="${currentPageId}"] .page-title-text`);
                if (pageTitleSpan) pageTitleSpan.textContent = titleInput;
                
                setTimeout(() => updateSaveStatus('saved'), 800);
            }
        }

        function deletePage(pageId) {
            const pageToDelete = pages.find(p => p.id === pageId);
            if (!pageToDelete) return;
            
            if (confirm(`Are you sure you want to delete "${pageToDelete.title}" and all its sub-pages?`)) {
                const prefix = pageToDelete.title + '::';
                const idsToDelete = new Set([pageId]);
                pages.forEach(p => {
                    if (p.title.startsWith(prefix)) {
                        idsToDelete.add(p.id);
                    }
                });

                // Clear favorite if deleting a favorited page
                if (appData && appData.ui && appData.ui.favoritePageId && idsToDelete.has(appData.ui.favoritePageId)) {
                    appData.ui.favoritePageId = null;
                    persistAppData();
                }

                pages = pages.filter(p => !idsToDelete.has(p.id));
                tasks.forEach(task => {
                    if (task.noteId && idsToDelete.has(task.noteId)) {
                        task.noteId = null;
                        if (task.origin === 'note') task.origin = 'streak';
                    }
                });
                savePagesToLocal();
                
                if (idsToDelete.has(currentPageId)) {
                    if (pages.length > 0) {
                        // Load first non-help page
                        const nextPage = pages.find(p => p.id !== 'help_page') || pages[0];
                        loadPage(nextPage.id);
                    } else {
                        createDefaultPage();
                        loadPage(pages[0].id);
                    }
                }
                
                renderPagesList();
                showToast('Page deleted successfully!');
            }
        }

        function getDefaultPage() {
            const defaultPageId = appData && appData.ui ? appData.ui.defaultPageId : null;
            if (defaultPageId) {
                const page = pages.find(p => p.id === defaultPageId);
                if (page) return page.id;
            }
            // Return first non-help page
            const firstPage = pages.find(p => p.id !== 'help_page');
            return firstPage ? firstPage.id : null;
        }

        // Toggle Star/Favorite Page Function
        function toggleStar(pageId) {
            const page = pages.find(p => p.id === pageId);
            if (!page) return;
            
            // If this page is already starred, unstar it
            if (page.starred) {
                page.starred = false;
                if (appData && appData.ui) appData.ui.favoritePageId = null;
                showToast('Removed from favorites');
            } else {
                // Unstar all other pages first
                pages.forEach(p => p.starred = false);
                // Star this page
                page.starred = true;
                if (appData && appData.ui) appData.ui.favoritePageId = pageId;
                showToast('Set as favorite - will load on startup!');
            }
            
            savePagesToLocal();
            renderPagesList();
        }

        // Duplicate Page Function
        function duplicatePage(pageId) {
            const originalPage = pages.find(p => p.id === pageId);
            if (!originalPage) return;
            
            const newPage = {
                id: generateId(),
                title: originalPage.title + ' (Copy)',
                content: originalPage.content,
                icon: originalPage.icon,
                theme: originalPage.theme,
                customTheme: originalPage.customTheme ? {...originalPage.customTheme} : null,
                collapsed: false,
                starred: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            pages.push(newPage);
            savePagesToLocal();
            renderPagesList();
            loadPage(newPage.id);
            showToast('Page duplicated!');
        }

        // Template Functions
        const pageTemplates = {
            blank: {
                name: 'Blank Page',
                icon: '📄',
                content: ''
            },
            meeting: {
                name: 'Meeting Notes',
                icon: '📅',
                content: `<h2>Meeting Notes</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> </p>
<h3>Agenda</h3>
<ul><li>Topic 1</li><li>Topic 2</li><li>Topic 3</li></ul>
<h3>Discussion</h3>
<p><br></p>
<h3>Action Items</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Action 1 - Owner</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Action 2 - Owner</span></div>
<h3>Next Steps</h3>
<p><br></p>`
            },
            project: {
                name: 'Project Plan',
                icon: '🚀',
                content: `<h2>Project: Your Project Name</h2>
<h3>Overview</h3>
<p>Brief description of the project...</p>
<h3>Goals</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 1</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 2</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 3</span></div>
<h3>Timeline</h3>
<table><thead><tr><th>Phase</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>
<tr><td>Planning</td><td></td><td></td><td>🟡 In Progress</td></tr>
<tr><td>Development</td><td></td><td></td><td>⚪ Not Started</td></tr>
<tr><td>Testing</td><td></td><td></td><td>⚪ Not Started</td></tr>
<tr><td>Launch</td><td></td><td></td><td>⚪ Not Started</td></tr></tbody></table>
<h3>Resources</h3>
<ul><li>Resource 1</li><li>Resource 2</li></ul>
<h3>Notes</h3>
<p><br></p>`
            },
            todo: {
                name: 'To-Do List',
                icon: '✅',
                content: `<h2>To-Do List</h2>
<h3>🔴 High Priority</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 1</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 2</span></div>
<h3>🟡 Medium Priority</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 3</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 4</span></div>
<h3>🟢 Low Priority</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 5</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 6</span></div>
<h3>✅ Completed</h3>
<div class="checklist-item"><input type="checkbox" checked><span contenteditable="true">Completed task example</span></div>`
            },
            journal: {
                name: 'Daily Journal',
                icon: '📔',
                content: `<h2>📔 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
<h3>🌅 Morning Intentions</h3>
<p>What do I want to accomplish today?</p>
<h3>📝 Notes & Thoughts</h3>
<p><br></p>
<h3>🙏 Gratitude</h3>
<ul><li>I'm grateful for...</li><li></li><li></li></ul>
<h3>🌙 Evening Reflection</h3>
<p>What went well today? What could be improved?</p>`
            },
            weekly: {
                name: 'Weekly Review',
                icon: '📊',
                content: `<h2>📊 Week of ${new Date().toLocaleDateString()}</h2>
<h3>🎯 This Week's Goals</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 1</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 2</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 3</span></div>
<h3>📅 Day by Day</h3>
<p><strong>Monday:</strong> </p>
<p><strong>Tuesday:</strong> </p>
<p><strong>Wednesday:</strong> </p>
<p><strong>Thursday:</strong> </p>
<p><strong>Friday:</strong> </p>
<h3>🏆 Wins</h3>
<ul><li></li></ul>
<h3>📈 Areas for Improvement</h3>
<ul><li></li></ul>
<h3>💡 Ideas & Notes</h3>
<p><br></p>`
            },
            notes: {
                name: 'Study Notes',
                icon: '📚',
                content: `<h2>📚 Subject/Topic</h2>
<h3>Key Concepts</h3>
<ul><li><strong>Concept 1:</strong> Definition...</li><li><strong>Concept 2:</strong> Definition...</li></ul>
<h3>Detailed Notes</h3>
<p><br></p>
<h3>Examples</h3>
<p><br></p>
<h3>Questions</h3>
<ul><li>Question to explore...</li></ul>
<h3>Summary</h3>
<p><br></p>
<h3>Resources & Links</h3>
<ul><li></li></ul>`
            }
        };

        function showTemplateModal() {
            document.getElementById('templateModal').classList.add('active');
        }

        function createFromTemplate(templateKey) {
            const template = pageTemplates[templateKey];
            if (!template) return;
            
            const pageName = prompt('Page name:', template.name);
            if (!pageName) return;
            
            const newPage = {
                id: generateId(),
                title: pageName,
                content: template.content,
                icon: template.icon,
                theme: globalTheme,
                collapsed: false,
                starred: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            pages.push(newPage);
            savePagesToLocal();
            renderPagesList();
            loadPage(newPage.id);
            setActiveView('notes');
            closeModal('templateModal');
            showToast('Page created from template!');
        }

        // Hierarchical Sidebar Rendering
        function renderPagesList() {
            const pagesList = document.getElementById('pagesList');
            pagesList.innerHTML = '';
            // No sort: use the order in the pages array
            const pageMap = new Map(pages.map(p => [p.id, p]));
            const childrenMap = new Map();
            // Build parent-child relationships
            pages.forEach(page => {
                const parts = page.title.split('::');
                if (parts.length > 1) {
                    const parentTitle = parts.slice(0, -1).join('::');
                    const parent = pages.find(p => p.title === parentTitle);
                    if (parent) {
                        if (!childrenMap.has(parent.id)) childrenMap.set(parent.id, []);
                        childrenMap.get(parent.id).push(page.id);
                    }
                }
            });
            // --- DRAG AND DROP LOGIC ---
            let dragPageId = null;
            let dropTargetPageId = null;
            let dropPosition = null; // 'inside' or 'after' or 'before'
            // Recursive function to render page tree
            function renderTree(pageId, depth, parentId) {
                const page = pageMap.get(pageId);
                if (!page) return;
                const displayTitle = page.title.split('::').pop();
                const hasChildren = childrenMap.has(page.id);
                let themeColor = '#ccc'; // Default color
                if (page.theme && page.theme !== 'default') {
                    if (page.theme === 'custom' && page.customTheme) {
                        themeColor = page.customTheme.accent;
                    } else if (themes[page.theme]) {
                        themeColor = themes[page.theme].accent;
                    }
                }
                const pageItem = document.createElement('div');
                pageItem.className = 'page-item';
                pageItem.dataset.pageId = page.id;
                pageItem.classList.toggle('active', page.id === currentPageId);
                pageItem.style.paddingLeft = (12 + depth * 20) + 'px';
                pageItem.onclick = () => loadPage(page.id);
                pageItem.draggable = true;
                // Drag events
                pageItem.addEventListener('dragstart', function(e) {
                    dragPageId = page.id;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', page.id);
                    setTimeout(() => pageItem.classList.add('dragging'), 0);
                });
                pageItem.addEventListener('dragend', function(e) {
                    dragPageId = null;
                    dropTargetPageId = null;
                    dropPosition = null;
                    document.querySelectorAll('.page-item').forEach(item => {
                        item.classList.remove('drop-inside', 'drop-after', 'drop-before');
                    });
                });
                pageItem.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    if (dragPageId && dragPageId !== page.id) {
                        const rect = pageItem.getBoundingClientRect();
                        const offset = e.clientY - rect.top;
                        if (offset < rect.height / 3) {
                            pageItem.classList.add('drop-before');
                            pageItem.classList.remove('drop-after', 'drop-inside');
                            dropPosition = 'before';
                        } else if (offset > rect.height * 2 / 3) {
                            pageItem.classList.add('drop-after');
                            pageItem.classList.remove('drop-before', 'drop-inside');
                            dropPosition = 'after';
                        } else {
                            pageItem.classList.add('drop-inside');
                            pageItem.classList.remove('drop-before', 'drop-after');
                            dropPosition = 'inside';
                        }
                        dropTargetPageId = page.id;
                    }
                });
                pageItem.addEventListener('dragleave', function(e) {
                    pageItem.classList.remove('drop-inside', 'drop-after', 'drop-before');
                });
                pageItem.addEventListener('drop', function(e) {
                    e.preventDefault();
                    pageItem.classList.remove('drop-inside', 'drop-after', 'drop-before');
                    if (dragPageId && dragPageId !== page.id) {
                        handlePageDrop(dragPageId, page.id, dropPosition, parentId);
                    }
                });
                const collapseIcon = hasChildren 
                    ? `<i class="fas ${page.collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}" style="width:14px; text-align:center; cursor:pointer;" onclick="event.stopPropagation(); toggleCollapse('${page.id}')"></i>`
                    : '';
                const themeIndicator = (page.theme && page.theme !== 'default') 
                    ? `<div class="page-theme-indicator" style="background:${themeColor};" title="Custom theme applied"></div>` : '';
                const iconDisplay = page.icon || '📄';
                const pageIcon = `<span class="page-icon" onclick="event.stopPropagation(); openEmojiPicker('${page.id}')" title="Click to change icon">${iconDisplay}</span>`;
                const starIndicator = page.starred ? '<i class="fas fa-star page-star-indicator" title="Favorite"></i>' : '';
                pageItem.innerHTML = `
                    ${collapseIcon}
                    ${pageIcon}
                    <span class="page-title-text">${displayTitle}</span>
                    ${starIndicator}
                    ${themeIndicator}
                    <div class="page-item-icons">
                         <i class="fas ${page.starred ? 'fa-star starred' : 'fa-star'}" title="${page.starred ? 'Remove from favorites' : 'Add to favorites'}" onclick="event.stopPropagation(); toggleStar('${page.id}')"></i>
                         <i class="fas fa-copy" title="Duplicate" onclick="event.stopPropagation(); duplicatePage('${page.id}')"></i>
                         <i class="fas fa-pencil-alt" title="Rename" onclick="event.stopPropagation(); showRenameModal('${page.id}')"></i>
                         <i class="fas fa-trash" title="Delete" onclick="event.stopPropagation(); deletePage('${page.id}')"></i>
                    </div>
                `;
                pagesList.appendChild(pageItem);
                if (hasChildren && !page.collapsed) {
                    childrenMap.get(page.id).forEach(childId => renderTree(childId, depth + 1, page.id));
                }
            }
            // Start rendering from top-level pages
            pages.filter(p => !p.title.includes('::')).forEach(page => renderTree(page.id, 0, null));
            filterPages();
        }

        // Handle drop logic for nesting, un-nesting, and reordering
        function handlePageDrop(dragId, targetId, position, parentId) {
            if (dragId === targetId) return;
            const dragPage = pages.find(p => p.id === dragId);
            const targetPage = pages.find(p => p.id === targetId);
            if (!dragPage || !targetPage) return;
            // Remove dragPage from its current location in the array
            const dragIndex = pages.findIndex(p => p.id === dragId);
            if (dragIndex === -1) return;
            pages.splice(dragIndex, 1);
            // For nesting
            const oldTitle = dragPage.title;
            let newTitle = dragPage.title;
            if (position === 'inside') {
                newTitle = targetPage.title + '::' + oldTitle.split('::').pop();
            } else if (position === 'after' || position === 'before') {
                // Sibling: same parent as targetPage
                const targetParts = targetPage.title.split('::');
                const parentTitle = targetParts.slice(0, -1).join('::');
                newTitle = parentTitle ? parentTitle + '::' + oldTitle.split('::').pop() : oldTitle.split('::').pop();
            }
            // Prevent circular nesting
            if (newTitle && (dragPage.title !== newTitle) && !newTitle.startsWith(dragPage.title + '::')) {
                const oldPrefix = dragPage.title + '::';
                const newPrefix = newTitle + '::';
                dragPage.title = newTitle;
                pages.forEach(p => {
                    if (p.id !== dragPage.id && p.title.startsWith(oldPrefix)) {
                        p.title = p.title.replace(oldPrefix, newPrefix);
                    }
                });
            }
            // Insert dragPage at the correct position in the array
            let targetIndex = pages.findIndex(p => p.id === targetId);
            if (position === 'after') {
                pages.splice(targetIndex + 1, 0, dragPage);
            } else if (position === 'before') {
                pages.splice(targetIndex, 0, dragPage);
            } else if (position === 'inside') {
                // Place as first child after targetPage and its children
                // Find last descendant of targetPage
                let insertAt = targetIndex + 1;
                for (let i = targetIndex + 1; i < pages.length; i++) {
                    if (!pages[i].title.startsWith(targetPage.title + '::')) {
                        insertAt = i;
                        break;
                    }
                }
                pages.splice(insertAt, 0, dragPage);
            }
            savePagesToLocal();
            renderPagesList();
        }

        // Local Storage Functions
        function savePagesToLocal() {
            persistAppData();
        }

        function loadPagesFromLocal() {
            pages = Array.isArray(appData && appData.pages) ? appData.pages : [];

            // Migration for new properties
            pages.forEach(p => {
                if (p.collapsed === undefined) p.collapsed = false;
            });

            // Keep nested pages accessible by auto-creating missing parent chain pages.
            ensureHierarchyParentsForAllPages();

            // Legacy orphan cleanup (should be no-op after parent creation)
            let hasOrphans = true;
            while (hasOrphans) {
                hasOrphans = false;
                const pageTitles = new Set(pages.map(p => p.title));
                pages = pages.filter(p => {
                    const parts = p.title.split('::');
                    if (parts.length > 1) {
                        const parentTitle = parts.slice(0, -1).join('::');
                        if (!pageTitles.has(parentTitle)) {
                            hasOrphans = true;
                            return false; // Remove orphan
                        }
                    }
                    return true;
                });
            }

            // Clean up stale favorite reference
            if (appData && appData.ui && appData.ui.favoritePageId && !pages.find(p => p.id === appData.ui.favoritePageId)) {
                appData.ui.favoritePageId = null;
            }

            // Clean up stale default page reference
            if (appData && appData.ui && appData.ui.defaultPageId && !pages.find(p => p.id === appData.ui.defaultPageId)) {
                appData.ui.defaultPageId = null;
            }

            savePagesToLocal();
        }

        function ensureHierarchyParentsForAllPages() {
            if (!Array.isArray(pages) || pages.length === 0) return;
            const existing = new Set(pages.map(p => p.title));
            const parentsToAdd = [];
            const now = new Date().toISOString();

            pages.forEach(page => {
                const rawTitle = String((page && page.title) || '');
                const parts = rawTitle.split('::').map(part => part.trim()).filter(Boolean);
                if (parts.length <= 1) return;

                let path = '';
                for (let i = 0; i < parts.length - 1; i += 1) {
                    path = path ? `${path}::${parts[i]}` : parts[i];
                    if (existing.has(path)) continue;

                    existing.add(path);
                    parentsToAdd.push({
                        id: generateId(),
                        title: path,
                        content: `<h2>${escapeHtml(parts[i])}</h2><p>Auto-created parent page for nested notes.</p>`,
                        icon: '📁',
                        collapsed: false,
                        starred: false,
                        createdAt: now,
                        updatedAt: now,
                        theme: globalTheme
                    });
                }
            });

            if (parentsToAdd.length > 0) {
                pages = [...parentsToAdd, ...pages];
            }
        }

        function saveToLocal() {
            savePage();
            savePagesToLocal();
            showToast('Workspace saved!');
        }

        function autoSave() {
            savePage();
        }

        // Export/Import Functions
        function exportToFile() {
            savePage();
            const dataStr = JSON.stringify({
                version: APP_SCHEMA_VERSION,
                pages,
                tasks,
                taskOrder,
                timeBlocks: timeBlocks || [],
                streaks: { dayStates, taskStreaks, streakState },
                settings: appSettings,
                ui: appData ? appData.ui : {},
                globalTheme,
                exportedAt: new Date().toISOString(),
            }, null, 2);
            
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const linkElement = document.createElement('a');
            linkElement.href = url;
            linkElement.download = `noteflow_export_${new Date().toISOString().split('T')[0]}.json`;
            linkElement.click();
            URL.revokeObjectURL(url);
            
            showToast('Exported successfully!');
        }

        const IMPORT_ACCEPT = [
            '.json', '.txt', '.md', '.markdown', '.html', '.htm', '.csv', '.tsv', '.rtf',
            '.pdf', '.docx', '.doc', '.odt', '.xlsx', '.xls', '.pptx', '.epub',
            '.xml', '.yaml', '.yml', '.log'
        ].join(',');

        const EXTERNAL_SCRIPT_CACHE = {};

        function importFromFile() {
            const input = document.getElementById('fileInput');
            if (!input) return;
            input.accept = IMPORT_ACCEPT;
            input.click();
        }

        function getFileExtension(name) {
            const n = String(name || '');
            const idx = n.lastIndexOf('.');
            return idx === -1 ? '' : n.slice(idx + 1).toLowerCase();
        }

        function getBaseFileName(name) {
            const n = String(name || 'Imported File');
            const idx = n.lastIndexOf('.');
            return (idx > 0 ? n.slice(0, idx) : n).trim() || 'Imported File';
        }

        function isWorkspacePayload(data) {
            return !!(data && (data.pages || (data.workspace && data.workspace.pages)));
        }

        function readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = evt => resolve(String(evt.target.result || ''));
                reader.onerror = () => reject(new Error('Unable to read file as text'));
                reader.readAsText(file);
            });
        }

        function readFileAsArrayBuffer(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = evt => resolve(evt.target.result);
                reader.onerror = () => reject(new Error('Unable to read file as binary'));
                reader.readAsArrayBuffer(file);
            });
        }

        function loadExternalScript(src, globalSymbol) {
            if (globalSymbol && window[globalSymbol]) return Promise.resolve(window[globalSymbol]);
            if (EXTERNAL_SCRIPT_CACHE[src]) return EXTERNAL_SCRIPT_CACHE[src];

            EXTERNAL_SCRIPT_CACHE[src] = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => {
                    if (globalSymbol && !window[globalSymbol]) {
                        reject(new Error(`Library "${globalSymbol}" did not load`));
                        return;
                    }
                    resolve(globalSymbol ? window[globalSymbol] : true);
                };
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });

            return EXTERNAL_SCRIPT_CACHE[src];
        }

        function normalizeTextToHtml(text) {
            const safe = escapeHtml(String(text || ''));
            const blocks = safe.split(/\r?\n\r?\n/).map(block => block.trim()).filter(Boolean);
            if (!blocks.length) return '<p>(No content)</p>';
            return blocks.map(block => `<p>${block.replace(/\r?\n/g, '<br>')}</p>`).join('');
        }

        function parseDelimitedTextToTableHtml(text, delimiter) {
            const lines = String(text || '').split(/\r?\n/).filter(line => line.trim().length > 0);
            if (!lines.length) return '<p>(No rows found)</p>';
            const rows = lines.map(line => line.split(delimiter));
            const head = rows[0] || [];
            const body = rows.slice(1);
            let html = '<div class="table-container" style="overflow-x:auto;"><table><thead><tr>';
            head.forEach(cell => { html += `<th>${escapeHtml(String(cell).trim())}</th>`; });
            html += '</tr></thead><tbody>';
            body.forEach(row => {
                html += '<tr>';
                row.forEach(cell => { html += `<td>${escapeHtml(String(cell).trim())}</td>`; });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            return html;
        }

        function parseRtfToText(rtf) {
            let txt = String(rtf || '');
            txt = txt.replace(/\\par[d]?/g, '\n');
            txt = txt.replace(/\\line/g, '\n');
            txt = txt.replace(/\\'[0-9a-fA-F]{2}/g, '');
            txt = txt.replace(/\\[a-zA-Z]+-?\d* ?/g, '');
            txt = txt.replace(/[{}]/g, '');
            return txt.replace(/\n{3,}/g, '\n\n').trim();
        }

        function extractXmlText(xmlString) {
            const parser = new DOMParser();
            const xml = parser.parseFromString(String(xmlString || ''), 'application/xml');
            const nodes = xml.getElementsByTagName('*');
            const parts = [];
            for (let i = 0; i < nodes.length; i += 1) {
                const n = nodes[i];
                if (n && n.children && n.children.length === 0) {
                    const t = (n.textContent || '').trim();
                    if (t) parts.push(t);
                }
            }
            return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        }

        function decodeHtmlEntities(value) {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = String(value || '');
            return textarea.value;
        }

        function extractDocxRunsFromXml(xmlString) {
            const xml = String(xmlString || '');
            const parts = [];
            const runRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi;
            let match;
            while ((match = runRegex.exec(xml)) !== null) {
                const txt = decodeHtmlEntities(match[1] || '').replace(/\s+/g, ' ').trim();
                if (txt) parts.push(txt);
            }
            return parts.join(' ').trim();
        }

        function createImportedPage(title, contentHtml, icon = '📥') {
            ensureHierarchyParentsForTitle(title);
            const page = {
                id: generateId(),
                title,
                content: contentHtml,
                icon,
                collapsed: false,
                starred: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                theme: globalTheme
            };
            pages.push(page);
            savePagesToLocal();
            renderPagesList();
            loadPage(page.id);
            setActiveView('notes');
            return page;
        }

        function ensureHierarchyParentsForTitle(title) {
            const rawTitle = String(title || '');
            const parts = rawTitle.split('::').map(part => part.trim()).filter(Boolean);
            if (parts.length <= 1) return;

            const existing = new Set(pages.map(p => p.title));
            const parentsToAdd = [];
            const now = new Date().toISOString();
            let path = '';

            for (let i = 0; i < parts.length - 1; i += 1) {
                path = path ? `${path}::${parts[i]}` : parts[i];
                if (existing.has(path)) continue;

                existing.add(path);
                parentsToAdd.push({
                    id: generateId(),
                    title: path,
                    content: `<h2>${escapeHtml(parts[i])}</h2><p>Auto-created parent page for imported documents.</p>`,
                    icon: '📁',
                    collapsed: false,
                    starred: false,
                    createdAt: now,
                    updatedAt: now,
                    theme: globalTheme
                });
            }

            if (parentsToAdd.length > 0) {
                pages.push(...parentsToAdd);
            }
        }

        function importWorkspacePayload(data) {
            const importedPages = data.pages || data.workspace.pages;
            const importedTasks = data.tasks || (data.workspace && data.workspace.tasks) || null;
            const importedTaskOrder = data.taskOrder || (data.workspace && data.workspace.taskOrder) || null;
            const importedStreaks = data.streaks || (data.workspace && data.workspace.streaks) || null;
            const importedSettings = data.settings || (data.workspace && data.workspace.settings) || null;
            const importedUi = data.ui || (data.workspace && data.workspace.ui) || null;

            pages = importedPages;
            if (importedTasks) {
                tasks = importedTasks;
                taskOrder = importedTaskOrder && importedTaskOrder.length ? importedTaskOrder : importedTasks.map(task => task.id);
            }
            if (importedStreaks) {
                dayStates = importedStreaks.dayStates || {};
                taskStreaks = importedStreaks.taskStreaks || {};
                streakState = { ...getDefaultStreaks().streakState, ...(importedStreaks.streakState || {}) };
            }
            if (importedSettings) {
                appSettings = { ...getDefaultAppData().settings, ...importedSettings };
            }
            if (data.globalTheme && !importedSettings) {
                globalTheme = data.globalTheme;
            }
            if (importedUi) {
                appData.ui = importedUi;
            }
            if (data.timeBlocks && Array.isArray(data.timeBlocks)) {
                timeBlocks = data.timeBlocks;
                saveTimeBlocks();
            }

            savePagesToLocal();
            loadThemeSettings();
            renderPagesList();
            if (pages.length > 0) loadPage(pages[0].id);
            renderTaskViews();
            showToast('Workspace imported successfully!');
        }

        async function importPdfFile(file) {
            const pdfjsLib = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageTexts = [];
            for (let p = 1; p <= pdf.numPages; p += 1) {
                const page = await pdf.getPage(p);
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ').trim();
                pageTexts.push(`Page ${p}\n${text}`);
            }
            return normalizeTextToHtml(pageTexts.join('\n\n'));
        }

        async function importDocxFile(file) {
            const mammoth = await loadExternalScript('https://unpkg.com/mammoth/mammoth.browser.min.js', 'mammoth');
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            let html = result.value || '';

            // Some DOCX files render as empty with mammoth (complex layouts/text boxes).
            // Fallback to extracting text from word/document.xml so the page is never blank.
            if (!stripHtml(html)) {
                try {
                    const raw = await mammoth.extractRawText({ arrayBuffer });
                    const rawText = String(raw && raw.value ? raw.value : '').trim();
                    if (rawText) {
                        html = normalizeTextToHtml(rawText);
                    }
                } catch (err) {
                    // proceed to zip/xml fallback
                }
            }

            if (!stripHtml(html)) {
                const JSZip = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
                const zip = await JSZip.loadAsync(arrayBuffer);
                const names = Object.keys(zip.files).filter(n => /^word\/.*\.xml$/i.test(n)).sort();
                const chunks = [];
                for (const name of names) {
                    const xmlText = await zip.file(name).async('text');
                    const line = extractDocxRunsFromXml(xmlText);
                    if (line) chunks.push(line);
                }
                if (chunks.length) {
                    html = normalizeTextToHtml(chunks.join('\n\n'));
                }
            }

            const messages = (result.messages || []).map(msg => msg.message).filter(Boolean);
            if (messages.length) {
                return `${html}<hr><p><strong>Import notes:</strong> ${escapeHtml(messages.join(' | '))}</p>`;
            }
            return html || '<p>(No content extracted)</p>';
        }

        async function importSpreadsheetFile(file) {
            const XLSX = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetNames = workbook.SheetNames || [];
            if (!sheetNames.length) return '<p>(No sheets found)</p>';

            const blocks = [];
            sheetNames.slice(0, 8).forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                blocks.push(`<h3>${escapeHtml(sheetName)}</h3>`);
                blocks.push(XLSX.utils.sheet_to_html(sheet));
            });
            return blocks.join('');
        }

        async function importZipXmlBasedFile(file, kind) {
            const JSZip = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const zip = await JSZip.loadAsync(arrayBuffer);
            const names = Object.keys(zip.files);
            const blocks = [];

            let matches = [];
            if (kind === 'pptx') matches = names.filter(n => /^ppt\/slides\/slide\d+\.xml$/i.test(n)).sort();
            if (kind === 'odt') matches = names.filter(n => /content\.xml$/i.test(n));
            if (kind === 'epub') matches = names.filter(n => /\.(xhtml|html)$/i.test(n)).sort();
            if (kind === 'docx') {
                matches = names.filter(n =>
                    /^word\/document\.xml$/i.test(n) ||
                    /^word\/header\d+\.xml$/i.test(n) ||
                    /^word\/footer\d+\.xml$/i.test(n) ||
                    /^word\/footnotes\.xml$/i.test(n) ||
                    /^word\/endnotes\.xml$/i.test(n)
                ).sort();
            }

            for (const name of matches.slice(0, 200)) {
                const xmlText = await zip.file(name).async('text');
                const extracted = extractXmlText(xmlText);
                if (!extracted) continue;
                blocks.push(kind === 'pptx' ? `<h3>${escapeHtml(name.split('/').pop())}</h3>` : '');
                blocks.push(normalizeTextToHtml(extracted));
            }

            return blocks.filter(Boolean).join('') || '<p>(No readable content found)</p>';
        }

        async function importDocumentIntoNewPage(file) {
            const ext = getFileExtension(file.name);
            const baseName = getBaseFileName(file.name);
            const importedTitle = `Imported::${baseName}`;
            let contentHtml = '';
            let icon = '📥';

            if (['txt', 'log', 'yaml', 'yml', 'xml'].includes(ext)) {
                const text = await readFileAsText(file);
                contentHtml = normalizeTextToHtml(text);
            } else if (['md', 'markdown'].includes(ext)) {
                const text = await readFileAsText(file);
                contentHtml = renderMarkdown(text);
                icon = '📝';
            } else if (['html', 'htm'].includes(ext)) {
                contentHtml = await readFileAsText(file);
                icon = '🌐';
            } else if (ext === 'csv') {
                const text = await readFileAsText(file);
                contentHtml = parseDelimitedTextToTableHtml(text, ',');
                icon = '📊';
            } else if (ext === 'tsv') {
                const text = await readFileAsText(file);
                contentHtml = parseDelimitedTextToTableHtml(text, '\t');
                icon = '📊';
            } else if (ext === 'rtf') {
                const text = await readFileAsText(file);
                contentHtml = normalizeTextToHtml(parseRtfToText(text));
                icon = '📄';
            } else if (ext === 'pdf') {
                contentHtml = await importPdfFile(file);
                icon = '📕';
            } else if (ext === 'docx') {
                contentHtml = await importDocxFile(file);
                icon = '🅦';
            } else if (['xlsx', 'xls'].includes(ext)) {
                contentHtml = await importSpreadsheetFile(file);
                icon = '📈';
            } else if (ext === 'pptx') {
                contentHtml = await importZipXmlBasedFile(file, 'pptx');
                icon = '📽️';
            } else if (ext === 'odt') {
                contentHtml = await importZipXmlBasedFile(file, 'odt');
                icon = '📗';
            } else if (ext === 'epub') {
                contentHtml = await importZipXmlBasedFile(file, 'epub');
                icon = '📚';
            } else if (ext === 'json') {
                const text = await readFileAsText(file);
                try {
                    const parsed = JSON.parse(text);
                    contentHtml = `<pre><code>${escapeHtml(JSON.stringify(parsed, null, 2))}</code></pre>`;
                } catch (err) {
                    contentHtml = `<pre><code>${escapeHtml(text)}</code></pre>`;
                }
                icon = '🧾';
            } else if (ext === 'doc') {
                icon = '🅦';
                throw new Error('Legacy .doc files are not reliably parseable in-browser. Save as .docx or PDF and import again.');
            } else {
                const text = await readFileAsText(file);
                contentHtml = `<pre><code>${escapeHtml(text)}</code></pre>`;
            }

            const importedPage = createImportedPage(importedTitle, contentHtml, icon);
            if (importedPage && importedPage.id) {
                loadPage(importedPage.id);
            }
            showToast(`Imported "${file.name}" into a new page`);
            return importedPage;
        }

        document.getElementById('fileInput').addEventListener('change', async function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const ext = getFileExtension(file.name);
                if (ext === 'json') {
                    const raw = await readFileAsText(file);
                    try {
                        const data = JSON.parse(raw);
                        if (isWorkspacePayload(data)) {
                            importWorkspacePayload(data);
                        } else {
                            await importDocumentIntoNewPage(file);
                        }
                    } catch (err) {
                        await importDocumentIntoNewPage(file);
                    }
                } else {
                    await importDocumentIntoNewPage(file);
                }
            } catch (error) {
                console.error('Import failed', error);
                showToast(`Import failed: ${error.message || 'Unknown error'}`);
            } finally {
                e.target.value = '';
            }
        });

        // Google Drive Functions (requires credentials)
        function initGoogleDrive() {
            if (appSettings && appSettings.drive) {
                CLIENT_ID = appSettings.drive.clientId || '';
                API_KEY = appSettings.drive.apiKey || '';
                if (CLIENT_ID && API_KEY) {
                    loadGapi();
                }
            }
        }

        function loadGapi() {
            if (typeof gapi === 'undefined') return;
            
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES
                }).then(() => {
                    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
                    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                }, (error) => {
                    console.error('Error initializing Google Drive API', error);
                    showToast('Error connecting to Google Drive');
                });
            });
        }

        function updateSigninStatus(isSignedIn) {
            isGoogleSignedIn = isSignedIn;
        }

        function openDriveSettings() {
            const modal = document.getElementById('driveSettingsModal');
            if (!modal) return;
            if (appSettings && appSettings.drive) {
                document.getElementById('driveClientId').value = appSettings.drive.clientId || '';
                document.getElementById('driveApiKey').value = appSettings.drive.apiKey || '';
            }
            modal.classList.add('active');
        }

        function saveToGoogleDrive() {
            if (!CLIENT_ID || !API_KEY) {
                document.getElementById('driveSettingsModal').classList.add('active');
                if (appSettings && appSettings.drive) {
                    document.getElementById('driveClientId').value = appSettings.drive.clientId || '';
                    document.getElementById('driveApiKey').value = appSettings.drive.apiKey || '';
                }
                return;
            }

            // Check if Google API is loaded
            if (typeof gapi === 'undefined' || !gapi.auth2 || !gapi.auth2.getAuthInstance()) {
                showToast('Google API not loaded. Please check your internet connection and try again.');
                return;
            }

            if (!isGoogleSignedIn) {
                gapi.auth2.getAuthInstance().signIn().then(uploadToDrive, (error) => {
                    showToast('Google Sign-In failed: ' + error.error);
                });
            } else {
                uploadToDrive();
            }
        }
        
        function saveDriveSettings() {
            const clientId = document.getElementById('driveClientId').value.trim();
            const apiKey = document.getElementById('driveApiKey').value.trim();
            
            if (clientId && apiKey) {
                if (appSettings) {
                    appSettings.drive = { clientId, apiKey };
                    persistAppData();
                }
                
                CLIENT_ID = clientId;
                API_KEY = apiKey;
                
                closeModal('driveSettingsModal');
                loadGapi();
                showToast('Settings saved! Connecting...');
            } else {
                showToast('Please enter both Client ID and API Key');
            }
        }

        function uploadToDrive() {
            savePage();
            const fileContent = JSON.stringify({
                version: APP_SCHEMA_VERSION,
                exportedAt: new Date().toISOString(),
                pages,
                tasks,
                taskOrder,
                streaks: { dayStates, taskStreaks, streakState },
                settings: appSettings,
                ui: appData ? appData.ui : {}
            });
            const file = new Blob([fileContent], {type: 'application/json'});
            
            const metadata = {
                'name': `noteflow_backup_${new Date().toISOString().split('T')[0]}.json`,
                'mimeType': 'application/json'
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', file);
            
            fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({'Authorization': 'Bearer ' + gapi.auth.getToken().access_token}),
                body: form
            }).then(res => res.json()).then(res => {
                if (res.error) throw new Error(res.error.message);
                showToast('Saved to Google Drive!');
            }).catch(error => {
                showToast('Error saving to Drive: ' + error.message);
            });
        }

        // Text Formatting Functions
        function formatText(command) {
            document.execCommand(command, false, null);
        }

        // Apply text color using execCommand (works on selection)
        function applyTextColor(color) {
            try {
                // Use foreColor to change text color
                document.execCommand('foreColor', false, color);
                // Keep focus in editor after applying
                const editor = document.getElementById('editor');
                if (editor) editor.focus();
            } catch (e) {
                console.warn('applyTextColor failed', e);
            }
        }

        // Convert rgb(...) to hex for syncing with color input
        function rgbToHex(rgb) {
            if (!rgb) return rgb;
            const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            if (!m) return rgb;
            const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
            return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        }

        // Handler for the preset select in the toolbar font panel
        function applyTextColorFromToolbar() {
            const sel = document.getElementById('textColorSelectToolbar');
            if (!sel) return;
            let value = sel.value;
            if (value === 'default') {
                // Map 'default' to the theme's text color variable
                const root = getComputedStyle(document.documentElement);
                const themeColor = root.getPropertyValue('--text-primary').trim() || '#000000';
                value = themeColor;
            }
            applyTextColor(value);

            // Sync toolbar color input if present
            const picker = document.getElementById('textColorPicker');
            if (picker) {
                // If value is rgb(...) convert to hex
                const pickVal = value.startsWith('rgb') ? rgbToHex(value) : value;
                try { picker.value = pickVal; } catch (e) {}
            }
        }

        // Highlight functions: apply and remove background highlight
        function applyHighlight(color) {
            const editor = document.getElementById('editor');
            if (!editor) return;
            editor.focus();

            // If 'none' requested, remove highlight from selection
            if (!color || color === 'none') {
                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return;
                for (let i = 0; i < sel.rangeCount; i++) {
                    removeHighlightInRange(sel.getRangeAt(i));
                }
                return;
            }

            try {
                // Prefer hiliteColor; fall back to backColor on some browsers
                const ok = document.execCommand('hiliteColor', false, color);
                if (!ok) document.execCommand('backColor', false, color);
                // keep focus
                editor.focus();
            } catch (e) {
                // Fallback: wrap selection with a span
                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return;
                const range = sel.getRangeAt(0);
                if (range.collapsed) return;
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                try {
                    range.surroundContents(span);
                } catch (err) {
                    // If surroundContents fails (partially selected nodes), use safer approach
                    const frag = range.extractContents();
                    span.appendChild(frag);
                    range.insertNode(span);
                }
                // collapse selection after inserted span
                sel.removeAllRanges();
                const r = document.createRange();
                r.setStartAfter(span);
                r.collapse(true);
                sel.addRange(r);
            }
        }

        function removeHighlightInRange(range) {
            const common = range.commonAncestorContainer;
            const root = common.nodeType === 1 ? common : common.parentElement;
            if (!root) return;
            const nodes = root.querySelectorAll('*');
            nodes.forEach(el => {
                if (range.intersectsNode(el)) {
                    if (el.style && el.style.backgroundColor) {
                        el.style.backgroundColor = '';
                        if (!el.getAttribute('style')) el.removeAttribute('style');
                        // unwrap empty spans
                        if (el.tagName === 'SPAN' && el.attributes.length === 0) {
                            while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                            el.parentNode.removeChild(el);
                        }
                    }
                }
            });
        }

        function applyHighlightFromToolbar() {
            const sel = document.getElementById('textHighlightSelectToolbar');
            if (!sel) return;
            const value = sel.value;
            applyHighlight(value === 'none' ? 'none' : value);
        }

        // Clear formatting for the current selection
        function clearFormatting() {
            const editor = document.getElementById('editor');
            if (!editor) return;
            editor.focus();

            // Basic browser removal (bold/italic/underline/inline tags)
            try { document.execCommand('removeFormat', false, null); } catch (e) {}
            // Remove links
            try { document.execCommand('unlink', false, null); } catch (e) {}

            // Remove color/background and inline styles within selection ranges
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            for (let i = 0; i < sel.rangeCount; i++) {
                cleanRangeFormatting(sel.getRangeAt(i));
            }
            // keep focus
            editor.focus();
        }

        // Remove highlight/background color for the current selection
        function clearHighlightSelection() {
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount) return;
            for (let i = 0; i < sel.rangeCount; i++) {
                removeHighlightInRange(sel.getRangeAt(i));
            }
        }

        // Helper: clean inline formatting styles and unwrap simple formatting tags in a Range
        function cleanRangeFormatting(range) {
            const common = range.commonAncestorContainer;
            const root = common.nodeType === 1 ? common : common.parentElement;
            if (!root) return;

            // Query elements inside the root and remove inline styles / unwrap formatting tags
            const nodes = root.querySelectorAll('*');
            nodes.forEach(el => {
                if (!range.intersectsNode(el)) return;

                // Remove problematic inline styles
                if (el.style) {
                    el.style.color = '';
                    el.style.backgroundColor = '';
                    el.style.fontWeight = '';
                    el.style.fontStyle = '';
                    el.style.textDecoration = '';
                    el.style.fontFamily = '';
                    el.style.fontSize = '';
                    // Remove style attribute if empty
                    if (!el.getAttribute('style')) el.removeAttribute('style');
                }

                // Unwrap common formatting tags (b, strong, i, em, u, s, strike, mark, font)
                const tag = (el.tagName || '').toUpperCase();
                const unwrapTags = ['B','STRONG','I','EM','U','S','STRIKE','MARK','FONT','SPAN'];
                if (unwrapTags.includes(tag)) {
                    // Only unwrap if element has no remaining attributes (safe unwrap)
                    if (!el.attributes || el.attributes.length === 0) {
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        el.parentNode.removeChild(el);
                    }
                }

                // Remove anchor tags while preserving inner text
                if (tag === 'A') {
                    const parent = el.parentNode;
                    while (el.firstChild) parent.insertBefore(el.firstChild, el);
                    parent.removeChild(el);
                }
            });
        }

        // Emoji Picker Functions
        const emojiCategories = {
            'Common': ['📄', '📝', '📋', '📁', '📂', '🗂️', '📌', '📎', '📊', '📈', '📉', '💼', '🎯', '✅', '❌', '⭐'],
            'Objects': ['🔥', '💡', '🎨', '🎵', '🎮', '📱', '💻', '🖥️', '🏠', '🏢', '🌍', '✈️', '🚀', '⚡', '🔧', '🔨', '📚', '📖', '✏️', '🖊️', '🔍', '🔎', '💬', '💭', '📷', '🎬', '🎤', '🎧', '📻', '⏰', '⌚', '📿'],
            'Hearts': ['❤️', '🧡', '�', '💚', '�', '💜', '🖤', '🤍', '�', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
            'Nature': ['🌟', '🌙', '☀️', '🌈', '🌸', '🌺', '🌻', '🍀', '🌲', '🌴', '🍁', '🍂', '🌊', '🔥', '❄️', '⛅', '🌤️', '🌧️', '⚡', '🌪️', '🦋', '🐝', '🌹', '🌷'],
            'Food': ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍑', '🍒', '🥑', '🥕', '🌽', '🍕', '🍔', '🍟', '🌮', '🍜', '🍣', '🍰', '🧁', '🍩', '🍪', '☕', '🍵', '🥤'],
            'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎳', '🏓', '🥊', '🎿', '⛷️', '🏂', '🏋️', '🧘', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁'],
            'Travel': ['🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🏰', '🗼', '🗽', '🏛️', '⛪', '🕌', '🛕', '⛩️', '🏔️', '🗻'],
            'Symbols': ['✨', '💫', '⭐', '�', '💥', '💢', '💦', '💨', '🔔', '🎵', '🎶', '💤', '💭', '👁️‍🗨️', '🗯️', '💬', '♠️', '♣️', '♥️', '♦️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'],
            'Celebration': ['�🎉', '🎊', '�', '🎁', '🎀', '�🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💎', '🔮', '🧿', '�', '🪄', '✨', '💫', '🌠', '🎆', '🎇', '🧨', '🪅'],
            'People': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😎', '🤓', '🧐', '🤔', '🤨', '😐', '😑', '😶', '🙄'],
            'Hands': ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👈', '👉', '👆', '👇', '☝️', '✋'],
            'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺']
        };

        let currentEmojiPageId = null;
        let currentEmojiCategory = 'All';
        let emojiSearchQuery = '';

        // Flatten all emojis for search
        function getAllEmojis() {
            let all = [];
            Object.values(emojiCategories).forEach(arr => {
                all = all.concat(arr);
            });
            return [...new Set(all)]; // Remove duplicates
        }

        function openEmojiPicker(pageId) {
            currentEmojiPageId = pageId;
            currentEmojiCategory = 'All';
            emojiSearchQuery = '';
            const picker = document.getElementById('emojiPicker');
            const overlay = document.getElementById('emojiModalOverlay');
            // Build search bar, category tabs and grid
            let html = '';
            html += '<div class="emoji-picker-header">';
            html += '  <div class="emoji-header-left">';
            html += '    <span class="emoji-picker-title">Choose Icon</span>';
            html += '    <span class="emoji-picker-subtitle">Set a visual icon for this page</span>';
            html += '  </div>';
            html += '  <div class="emoji-header-actions">';
            html += '    <button type="button" class="emoji-remove-btn" onclick="removePageIcon();hideEmojiPicker();">Remove</button>';
            html += '    <button type="button" class="emoji-close-btn" onclick="hideEmojiPicker()" title="Close" aria-label="Close emoji picker"><i class="fas fa-times"></i></button>';
            html += '  </div>';
            html += '</div>';
            html += '<div class="emoji-search-container">';
            html += '<input type="text" class="emoji-search" id="emojiSearch" placeholder="Search emojis..." oninput="searchEmojis(this.value)">';
            html += '</div>';
            const categories = ['All', ...Object.keys(emojiCategories)];
            html += '<div class="emoji-categories">';
            categories.forEach(cat => {
                html += `<button type="button" class="emoji-cat-btn ${cat === currentEmojiCategory ? 'active' : ''}" onclick="switchEmojiCategory('${cat}')">${cat}</button>`;
            });
            html += '</div>';
            html += '<div class="emoji-grid" id="emojiGrid"></div>';
            picker.innerHTML = html;
            renderEmojiGrid();
            // Show overlay and position picker (desktop: centered, mobile: above save stack)
            picker.classList.add('active');
            if (overlay) overlay.classList.add('active');
            // Prevent background scroll while modal open
            try { document.body.classList.add('modal-open'); } catch(e) {}
            // Positioning helper will compute a mobile-safe placement
            positionEmojiPicker(picker, overlay);
            // Focus search input
            setTimeout(() => {
                const searchInput = document.getElementById('emojiSearch');
                if (searchInput) searchInput.focus();
            }, 100);
        }

        function positionEmojiPicker(picker, overlay) {
            if (!picker) return;
            // Clear any previous inline positioning we set
            picker.style.left = '';
            picker.style.right = '';
            picker.style.top = '';
            picker.style.bottom = '';
            picker.style.transform = '';

            // For small screens, make the picker full-width with margins and sit it above the storage/save stack
            try {
                const winW = window.innerWidth || document.documentElement.clientWidth;
                if (winW <= 768) {
                    // make it flush with small margins
                    picker.style.left = '12px';
                    picker.style.right = '12px';
                    picker.style.transform = 'none';

                    // compute bottom offset to sit above storage options if present
                    const storage = document.querySelector('.storage-options');
                    let bottomGap = 16; // default gap
                    if (storage) {
                        const rect = storage.getBoundingClientRect();
                        // if storage is anchored to bottom, use its height
                        if (rect && rect.height) bottomGap = rect.height + 12;
                    }
                    picker.style.bottom = `${bottomGap}px`;
                    // limit height so it fits above the storage stack and toolbar
                    const viewportH = window.innerHeight || document.documentElement.clientHeight;
                    let maxH = viewportH - (bottomGap + 96); // leave space for top toolbar + margins
                    if (maxH < 160) maxH = Math.max(160, viewportH - 40);
                    picker.style.maxHeight = `${maxH}px`;
                    picker.style.overflow = 'hidden';
                    // ensure overlay is visible behind
                    if (overlay) overlay.classList.add('active');
                    return;
                }
            } catch (e) {
                console.warn('positionEmojiPicker error', e);
            }

            // Desktop: center on screen
            picker.style.left = '50%';
            picker.style.top = '50%';
            picker.style.transform = 'translate(-50%, -50%)';
        }

        function hideEmojiPicker() {
            // alias used in markup; ensure overlay and picker are closed
            const picker = document.getElementById('emojiPicker');
            const overlay = document.getElementById('emojiModalOverlay');
            if (picker) picker.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            try { document.body.classList.remove('modal-open'); } catch(e) {}
            // reset inline styles (avoid leaving it anchored)
            if (picker) {
                picker.style.left = '';
                picker.style.right = '';
                picker.style.top = '';
                picker.style.bottom = '';
                picker.style.transform = '';
            }
            currentEmojiPageId = null;
        }

        // Reposition emoji picker on resize if open
        window.addEventListener('resize', function() {
            const picker = document.getElementById('emojiPicker');
            const overlay = document.getElementById('emojiModalOverlay');
            if (picker && picker.classList.contains('active')) {
                positionEmojiPicker(picker, overlay);
            }
        });

        function searchEmojis(query) {
            emojiSearchQuery = query.toLowerCase();
            renderEmojiGrid();
        }

        function switchEmojiCategory(category) {
            currentEmojiCategory = category;
            emojiSearchQuery = '';
            document.getElementById('emojiSearch').value = '';
            document.querySelectorAll('.emoji-cat-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent === category);
            });
            renderEmojiGrid();
        }

        function renderEmojiGrid() {
            const grid = document.getElementById('emojiGrid');
            if (!grid) return;
            
            let emojis;
            if (currentEmojiCategory === 'All') {
                emojis = getAllEmojis();
            } else {
                emojis = emojiCategories[currentEmojiCategory] || [];
            }
            
            // Filter by search query if any
            if (emojiSearchQuery) {
                // Simple search - show all emojis that match commonly searched terms
                const searchTerms = {
                    'heart': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
                    'star': ['⭐', '🌟', '✨', '💫', '🌠'],
                    'fire': ['🔥', '🔥'],
                    'smile': ['😀', '😃', '😄', '😁', '😊', '🙂', '😉'],
                    'sad': ['😢', '😭', '😞', '😔', '🙁'],
                    'check': ['✅', '☑️', '✔️'],
                    'book': ['📚', '📖', '📕', '📗', '📘', '📙'],
                    'folder': ['📁', '📂', '🗂️'],
                    'work': ['💼', '🏢', '💻', '📊'],
                    'home': ['🏠', '🏡', '🏘️'],
                    'music': ['🎵', '🎶', '🎼', '🎹', '🎸', '🎤'],
                    'food': ['🍎', '🍕', '🍔', '🍟', '🌮', '🍜'],
                    'animal': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
                    'plant': ['🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌲', '🌴'],
                    'weather': ['☀️', '🌙', '⭐', '🌈', '☁️', '🌧️', '❄️', '⚡'],
                    'sport': ['⚽', '🏀', '🏈', '⚾', '🎾'],
                    'travel': ['✈️', '🚗', '🚀', '🚁', '⛵'],
                    'money': ['💰', '💵', '💴', '💶', '💷', '💎'],
                    'time': ['⏰', '⌚', '⏱️', '📅', '📆'],
                    'idea': ['💡', '🧠', '💭', '🤔'],
                    'party': ['🎉', '🎊', '🎈', '🎁', '🎀']
                };
                
                // Check if query matches any search term
                let matchedEmojis = [];
                Object.keys(searchTerms).forEach(term => {
                    if (term.includes(emojiSearchQuery) || emojiSearchQuery.includes(term)) {
                        matchedEmojis = matchedEmojis.concat(searchTerms[term]);
                    }
                });
                
                if (matchedEmojis.length > 0) {
                    emojis = [...new Set(matchedEmojis)];
                }
            }
            
            if (emojis.length === 0) {
                grid.innerHTML = '<div class="emoji-empty">No emojis found</div>';
            } else {
                grid.innerHTML = emojis.map(emoji => 
                    `<span class="emoji-option" onclick="setPageIcon('${emoji}')">${emoji}</span>`
                ).join('');
            }
        }

        function setPageIcon(emoji) {
            if (!currentEmojiPageId) return;
            const page = pages.find(p => p.id === currentEmojiPageId);
            if (page) {
                page.icon = emoji;
                savePagesToLocal();
                renderPagesList();
                closeEmojiPicker();
                showToast('Icon updated!');
            }
        }

        function removePageIcon() {
            if (!currentEmojiPageId) return;
            const page = pages.find(p => p.id === currentEmojiPageId);
            if (page) {
                delete page.icon;
                savePagesToLocal();
                renderPagesList();
                closeEmojiPicker();
                showToast('Icon removed!');
            }
        }

        function closeEmojiPicker() {
            const picker = document.getElementById('emojiPicker');
            const overlay = document.getElementById('emojiModalOverlay');
            if (picker) {
                picker.classList.remove('active');
                picker.style.left = '';
                picker.style.right = '';
                picker.style.top = '';
                picker.style.bottom = '';
                picker.style.transform = '';
                picker.style.maxHeight = '';
                picker.style.overflow = '';
            }
            if (overlay) overlay.classList.remove('active');
            try { document.body.classList.remove('modal-open'); } catch(e) {}
            currentEmojiPageId = null;
        }

        // Close emoji picker when clicking outside
        document.addEventListener('click', function(e) {
            const picker = document.getElementById('emojiPicker');
            if (picker && picker.classList.contains('active')) {
                if (!picker.contains(e.target) && !e.target.classList.contains('page-icon')) {
                    closeEmojiPicker();
                }
            }
        });

        function formatBlock(tag) {
            document.execCommand('formatBlock', false, `<${tag}>`);
            document.getElementById('editor').focus();
        }

        function insertLink() {
            const url = prompt('Enter URL:');
            if (url) {
                document.execCommand('createLink', false, url);
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const node = selection.anchorNode;
                    const element = node.nodeType === 3 ? node.parentElement : node;
                    const link = element.closest('a');
                    if (link) showLinkTooltip(link);
                }
                document.getElementById('editor').focus();
            }
        }

        // Helper function to create media wrapper with action button and resize
        function createMediaWrapper(content, type = 'media', resizable = true) {
            const resizeHandles = resizable ? `
                <div class="resize-handle se" onmousedown="startMediaWrapperResize(event, this.parentElement)"></div>
                <div class="size-indicator"></div>
            ` : '';
            
            return `
                <div class="media-wrapper resizable-media" data-type="${type}" contenteditable="false" style="position: relative; margin: 16px 0;">
                    <button class="media-action-btn" onclick="event.stopPropagation(); toggleMediaWrapperDropdown(this)" style="position: absolute; top: 8px; right: 8px; z-index: 20;">
                        <i class="fas fa-ellipsis-v"></i>
                        <div class="media-dropdown">
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperSize(this, 'small')">
                                <i class="fas fa-compress-alt"></i> Small
                            </div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperSize(this, 'medium')">
                                <i class="fas fa-expand"></i> Medium
                            </div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperSize(this, 'large')">
                                <i class="fas fa-expand-arrows-alt"></i> Large
                            </div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperSize(this, 'full')">
                                <i class="fas fa-arrows-alt-h"></i> Full Width
                            </div>
                            <div class="media-dropdown-divider"></div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperAlign(this, 'left')">
                                <i class="fas fa-align-left"></i> Align Left
                            </div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperAlign(this, 'center')">
                                <i class="fas fa-align-center"></i> Align Center
                            </div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); setMediaWrapperAlign(this, 'right')">
                                <i class="fas fa-align-right"></i> Align Right
                            </div>
                            <div class="media-dropdown-divider"></div>
                            <div class="media-dropdown-item" onclick="event.stopPropagation(); duplicateMediaWrapper(this)">
                                <i class="fas fa-copy"></i> Duplicate
                            </div>
                            <div class="media-dropdown-item danger" onclick="event.stopPropagation(); deleteMediaWrapper(this)">
                                <i class="fas fa-trash"></i> Delete
                            </div>
                        </div>
                    </button>
                    ${resizeHandles}
                    ${content}
                </div>
            `;
        }
        
        function toggleMediaWrapperDropdown(btn) {
            document.querySelectorAll('.media-dropdown.active').forEach(d => {
                if (!btn.contains(d)) d.classList.remove('active');
            });
            const dropdown = btn.querySelector('.media-dropdown');
            if (dropdown) dropdown.classList.toggle('active');
        }
        
        function closeMediaWrapperDropdowns() {
            document.querySelectorAll('.media-wrapper .media-dropdown.active').forEach(d => {
                d.classList.remove('active');
            });
        }
        
        function setMediaWrapperSize(item, size) {
            const wrapper = item.closest('.media-wrapper');
            if (!wrapper) return;
            
            const sizes = { small: '25%', medium: '50%', large: '75%', full: '100%' };
            wrapper.style.width = sizes[size] || '50%';
            
            closeMediaWrapperDropdowns();
            savePage();
            showToast(`Size set to ${size}`);
        }
        
        function setMediaWrapperAlign(item, align) {
            const wrapper = item.closest('.media-wrapper');
            if (!wrapper) return;
            
            wrapper.style.marginLeft = align === 'center' ? 'auto' : (align === 'right' ? 'auto' : '0');
            wrapper.style.marginRight = align === 'center' ? 'auto' : (align === 'left' ? 'auto' : '0');
            
            closeMediaWrapperDropdowns();
            savePage();
            showToast(`Aligned ${align}`);
        }
        
        function duplicateMediaWrapper(item) {
            const wrapper = item.closest('.media-wrapper');
            if (!wrapper) return;
            const clone = wrapper.cloneNode(true);
            wrapper.parentNode.insertBefore(clone, wrapper.nextSibling);
            closeMediaWrapperDropdowns();
            savePage();
            showToast('Duplicated!');
        }
        
        function deleteMediaWrapper(item) {
            const wrapper = item.closest('.media-wrapper');
            if (!wrapper) return;
            wrapper.remove();
            savePage();
            showToast('Deleted!');
        }
        
        // Resize functionality for media wrapper
        let mediaWrapperResizeState = { isResizing: false, element: null, startX: 0, startWidth: 0 };
        
        function startMediaWrapperResize(e, element) {
            e.preventDefault();
            e.stopPropagation();
            
            mediaWrapperResizeState.isResizing = true;
            mediaWrapperResizeState.element = element;
            mediaWrapperResizeState.startX = e.clientX;
            mediaWrapperResizeState.startWidth = element.offsetWidth;
            
            element.classList.add('resizing');
            
            const indicator = element.querySelector('.size-indicator');
            if (indicator) indicator.style.opacity = '1';
        }
        
        document.addEventListener('mousemove', (e) => {
            if (!mediaWrapperResizeState.isResizing) return;
            
            const element = mediaWrapperResizeState.element;
            const deltaX = e.clientX - mediaWrapperResizeState.startX;
            const newWidth = Math.max(100, mediaWrapperResizeState.startWidth + deltaX);
            
            element.style.width = newWidth + 'px';
            
            const indicator = element.querySelector('.size-indicator');
            if (indicator) indicator.textContent = `${Math.round(newWidth)}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (!mediaWrapperResizeState.isResizing) return;
            
            const element = mediaWrapperResizeState.element;
            if (element) {
                element.classList.remove('resizing');
                const indicator = element.querySelector('.size-indicator');
                if (indicator) indicator.style.opacity = '0';
            }
            
            mediaWrapperResizeState.isResizing = false;
            mediaWrapperResizeState.element = null;
            savePage();
        });

        // Insert Table Function
        function insertTable() {
            const rows = prompt('Number of rows:', '3');
            const cols = prompt('Number of columns:', '3');
            
            if (!rows || !cols) return;
            
            const numRows = parseInt(rows);
            const numCols = parseInt(cols);
            
            if (isNaN(numRows) || isNaN(numCols) || numRows < 1 || numCols < 1) {
                showToast('Invalid table dimensions');
                return;
            }
            
            let tableHtml = '<div class="table-container" style="overflow-x: auto;"><table>';
            // Header row
            tableHtml += '<tr>';
            for (let c = 0; c < numCols; c++) {
                tableHtml += '<th>Header ' + (c + 1) + '</th>';
            }
            tableHtml += '</tr>';
            // Data rows
            for (let r = 0; r < numRows - 1; r++) {
                tableHtml += '<tr>';
                for (let c = 0; c < numCols; c++) {
                    tableHtml += '<td>Cell</td>';
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</table></div>';
            
            insertHtmlAtCursor(createMediaWrapper(tableHtml, 'table') + '<p></p>');
            showToast('Table inserted!');
        }

        // Insert Image Function
        function insertImage() {
            const choice = prompt('Enter image URL or type "upload" to upload a file:', '');
            
            if (!choice) return;
            
            if (choice.toLowerCase() === 'upload') {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            const imgHtml = `<img src="${event.target.result}" alt="Uploaded image" style="max-width: 100%; border-radius: 8px;">`;
                            insertHtmlAtCursor(createMediaWrapper(imgHtml, 'image'));
                            showToast('Image inserted!');
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            } else {
                const imgHtml = `<img src="${choice}" alt="Image" style="max-width: 100%; border-radius: 8px;">`;
                insertHtmlAtCursor(createMediaWrapper(imgHtml, 'image'));
                showToast('Image inserted!');
            }
        }

        // Insert Video Function
        function insertVideo() {
            const choice = prompt('Enter video URL (YouTube, Vimeo, or direct video link) or type "upload" to upload:', '');
            
            if (!choice) return;
            
            if (choice.toLowerCase() === 'upload') {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'video/*';
                fileInput.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            const videoHtml = `
                                <div style="border-radius: 8px; overflow: hidden;">
                                    <video controls style="width: 100%; max-width: 720px; display: block;">
                                        <source src="${event.target.result}" type="${file.type}">
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            `;
                            insertHtmlAtCursor(createMediaWrapper(videoHtml, 'video'));
                            showToast('Video inserted!');
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            } else {
                // Check if it's a YouTube or Vimeo URL
                const embedHtml = getVideoEmbedHtml(choice);
                insertHtmlAtCursor(createMediaWrapper(embedHtml, 'video'));
                showToast('Video inserted!');
            }
        }
        
        function getVideoEmbedHtml(url) {
            let embedUrl = '';
            
            // YouTube
            const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (youtubeMatch) {
                embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                return `
                    <div style="border-radius: 8px; overflow: hidden; position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                    </div>
                `;
            }
            
            // Vimeo
            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
                embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                return `
                    <div style="border-radius: 8px; overflow: hidden; position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                    </div>
                `;
            }
            
            // Direct video URL
            return `
                <div style="border-radius: 8px; overflow: hidden;">
                    <video controls style="width: 100%; max-width: 720px; display: block;">
                        <source src="${url}">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        }

        // Insert Audio Function
        function insertAudio() {
            const choice = prompt('Enter audio URL (Spotify, SoundCloud, or direct link) or type "upload" to upload:', '');
            
            if (!choice) return;
            
            if (choice.toLowerCase() === 'upload') {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'audio/*';
                fileInput.onchange = function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            const audioHtml = `
                                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                                    <audio controls style="width: 100%;">
                                        <source src="${event.target.result}" type="${file.type}">
                                        Your browser does not support the audio tag.
                                    </audio>
                                </div>
                            `;
                            insertHtmlAtCursor(createMediaWrapper(audioHtml, 'audio'));
                            showToast('Audio inserted!');
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            } else {
                // Check if it's Spotify or SoundCloud
                const embedHtml = getAudioEmbedHtml(choice);
                insertHtmlAtCursor(createMediaWrapper(embedHtml, 'audio'));
                showToast('Audio inserted!');
            }
        }
        
        function getAudioEmbedHtml(url) {
            // Spotify track/album/playlist
            const spotifyMatch = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
            if (spotifyMatch) {
                const type = spotifyMatch[1];
                const id = spotifyMatch[2];
                return `
                    <div style="border-radius: 12px; overflow: hidden;">
                        <iframe src="https://open.spotify.com/embed/${type}/${id}" width="100%" height="${type === 'track' ? '152' : '352'}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
                    </div>
                `;
            }
            
            // SoundCloud
            if (url.includes('soundcloud.com')) {
                return `
                    <div style="border-radius: 8px; overflow: hidden;">
                        <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
                    </div>
                `;
            }
            
            // Direct audio URL
            return `
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <audio controls style="width: 100%;">
                        <source src="${url}">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            `;
        }

        // Insert Web Embed Function
        function insertEmbed() {
            const url = prompt('Enter URL to embed (web page, Google Docs, Figma, CodePen, etc.):', '');
            
            if (!url) return;
            
            // Try to get special embed for known services
            const embedHtml = getWebEmbedHtml(url);
            insertHtmlAtCursor(createMediaWrapper(embedHtml, 'embed'));
            showToast('Content embedded!');
        }
        
        function getWebEmbedHtml(url) {
            // Google Docs/Sheets/Slides
            if (url.includes('docs.google.com')) {
                const embedUrl = url.replace('/edit', '/preview').replace('/view', '/preview');
                return `
                    <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                        <iframe src="${embedUrl}" style="width: 100%; height: 500px; border: none;"></iframe>
                    </div>
                `;
            }
            
            // Figma
            if (url.includes('figma.com')) {
                const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
                return `
                    <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                        <iframe src="${embedUrl}" style="width: 100%; height: 450px; border: none;" allowfullscreen></iframe>
                    </div>
                `;
            }
            
            // CodePen
            const codepenMatch = url.match(/codepen\.io\/([^\/]+)\/pen\/([^\/\?]+)/);
            if (codepenMatch) {
                return `
                    <div style="border-radius: 8px; overflow: hidden;">
                        <iframe height="400" style="width: 100%;" scrolling="no" src="https://codepen.io/${codepenMatch[1]}/embed/${codepenMatch[2]}?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>
                    </div>
                `;
            }
            
            // Twitter/X post
            if (url.includes('twitter.com') || url.includes('x.com')) {
                return `
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                        <blockquote class="twitter-tweet"><a href="${url}">Loading tweet...</a></blockquote>
                        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"><\/script>
                    </div>
                `;
            }
            
            // GitHub Gist
            if (url.includes('gist.github.com')) {
                return `
                    <div style="border-radius: 8px; overflow: hidden;">
                        <script src="${url}.js"><\/script>
                    </div>
                `;
            }
            
            // Generic iframe embed
            return `
                <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                    <iframe src="${url}" style="width: 100%; height: 400px; border: none;" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
                </div>
            `;
        }

        // Insert Checklist Function
        function insertChecklist() {
            const items = prompt('Enter checklist items (comma-separated):', 'Item 1, Item 2, Item 3');
            
            if (!items) return;
            
            const itemList = items.split(',').map(i => i.trim()).filter(i => i);
            
            let checklistContent = '<div class="checklist-container" style="width: 100%;">';
            itemList.forEach(item => {
                checklistContent += `
                    <div class="checklist-item">
                        <input type="checkbox" onchange="toggleChecklistItem(this)">
                        <span class="checklist-text" contenteditable="true">${item}</span>
                    </div>
                `;
            });
            checklistContent += '</div>';
            
            insertHtmlAtCursor(createMediaWrapper(checklistContent, 'checklist', false) + '<p></p>');
            showToast('Checklist inserted!');
        }

        function toggleChecklistItem(checkbox) {
            const item = checkbox.closest('.checklist-item');
            if (checkbox.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        }

        // Insert Collapsible Section Function
        function insertCollapsible() {
            const title = prompt('Section title:', 'Click to expand');
            
            if (!title) return;
            
            const collapsibleHtml = `
                <div class="collapsible-section">
                    <div class="collapsible-header" onclick="toggleCollapsibleSection(this)">
                        <i class="fas fa-chevron-down collapsible-icon"></i>
                        <span class="collapsible-title" contenteditable="true">${title}</span>
                    </div>
                    <button class="collapsible-action-btn" onclick="event.stopPropagation(); toggleCollapsibleDropdown(this)">
                        <i class="fas fa-ellipsis-v"></i>
                        <div class="collapsible-dropdown">
                            <div class="collapsible-dropdown-item" onclick="event.stopPropagation(); duplicateCollapsible(this)">
                                <i class="fas fa-copy"></i> Duplicate
                            </div>
                            <div class="collapsible-dropdown-item danger" onclick="event.stopPropagation(); deleteCollapsible(this)">
                                <i class="fas fa-trash"></i> Delete
                            </div>
                        </div>
                    </button>
                    <div class="collapsible-content" contenteditable="true">
                        <p>Click here to add content...</p>
                    </div>
                </div>
                <p></p>
            `;
            
            insertHtmlAtCursor(collapsibleHtml);
            showToast('Collapsible section inserted!');
        }

        function toggleCollapsibleSection(header) {
            const section = header.closest('.collapsible-section');
            section.classList.toggle('collapsed');
        }
        
        function toggleCollapsibleDropdown(btn) {
            // Close all other dropdowns
            document.querySelectorAll('.collapsible-dropdown.active').forEach(d => {
                if (d !== btn.querySelector('.collapsible-dropdown')) {
                    d.classList.remove('active');
                }
            });
            
            const dropdown = btn.querySelector('.collapsible-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        }
        
        function duplicateCollapsible(item) {
            const section = item.closest('.collapsible-section');
            if (!section) return;
            
            const clone = section.cloneNode(true);
            section.parentNode.insertBefore(clone, section.nextSibling);
            
            closeCollapsibleDropdowns();
            savePage();
            showToast('Section duplicated');
        }
        
        function deleteCollapsible(item) {
            const section = item.closest('.collapsible-section');
            if (!section) return;
            
            section.remove();
            savePage();
            showToast('Section deleted');
        }
        
        function closeCollapsibleDropdowns() {
            document.querySelectorAll('.collapsible-dropdown.active').forEach(d => {
                d.classList.remove('active');
            });
        }
        
        // Close collapsible dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.collapsible-action-btn')) {
                closeCollapsibleDropdowns();
            }
        });

        // Helper function to insert HTML at cursor
        function insertHtmlAtCursor(html) {
            const editor = document.getElementById('editor');
            editor.focus();
            
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                const fragment = document.createDocumentFragment();
                let lastNode;
                while (tempDiv.firstChild) {
                    lastNode = fragment.appendChild(tempDiv.firstChild);
                }
                
                range.insertNode(fragment);
                
                // Move cursor to end
                if (lastNode) {
                    const newRange = document.createRange();
                    newRange.setStartAfter(lastNode);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            } else {
                editor.innerHTML += html;
            }
        }

        // Insert Page Link Function
        function insertPageLink() {
            const pageList = pages.filter(p => p.id !== 'help_page').map(p => `${p.title}`).join(', ');
            const pageName = prompt(`Enter page name to link to:\n\nAvailable: ${pageList}`, '');
            
            if (!pageName) return;
            
            const targetPage = pages.find(p => p.title.toLowerCase() === pageName.toLowerCase());
            
            if (targetPage) {
                // Add a space after the link so cursor can escape the span
                const linkHtml = '<span class="page-link" data-page-id="' + targetPage.id + '" onclick="loadPage(\'' + targetPage.id + '\')" contenteditable="false">\u{1F4C4} ' + targetPage.title + '</span>&nbsp;';
                insertHtmlAtCursor(linkHtml);
                showToast('Page link inserted!');
            } else {
                showToast('Page not found');
            }
        }

        // UI Functions
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            const overlay = document.getElementById('sidebarOverlay');
            const storageOptions = document.getElementById('storageOptions');

            sidebar.classList.toggle('collapsed');
            if (toggleBtn) {
                toggleBtn.classList.toggle('collapsed');
            }
            
            // Update taskbar position (docked to edge)
            if (storageOptions) {
                if (sidebar.classList.contains('collapsed')) {
                    storageOptions.style.left = '0';
                } else {
                    storageOptions.style.left = 'var(--sidebar-width)';
                }
            }
            
            if (window.innerWidth <= 768 && overlay) {
                if (sidebar.classList.contains('collapsed')) {
                    overlay.classList.remove('active');
                } else {
                    overlay.classList.add('active');
                }
            }

            // Mirror sidebar state on body so CSS outside sidebar's DOM can react
            if (sidebar.classList.contains('collapsed')) {
                document.body.classList.remove('sidebar-open');
            } else {
                document.body.classList.add('sidebar-open');
            }

            const isCollapsed = sidebar.classList.contains('collapsed');
            if (appSettings) {
                appSettings.sidebarCollapsed = isCollapsed;
                persistAppData();
            }
            if (typeof syncToolbarLayoutWithSidebar === 'function') syncToolbarLayoutWithSidebar();
            if (typeof positionToolbarTimeControls === 'function') positionToolbarTimeControls();
            if (typeof adjustChatbotPosition === 'function') adjustChatbotPosition();
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            if (modalId === 'newPageModal') document.getElementById('newPageName').value = '';
            if (modalId === 'renamePageModal') {
                document.getElementById('renamePageName').value = '';
                pageToRenameId = null;
            }
            if (modalId === 'driveSettingsModal') {
                // Optional: clear inputs or leave them for convenience
            }
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        // New Features Functions
        function getSearchQuery() {
            const globalValue = document.getElementById('globalSearch')?.value || '';
            const localValue = document.getElementById('searchInput')?.value || '';
            return (globalValue || localValue).toLowerCase().trim();
        }

        function filterPages() {
            const query = getSearchQuery();
            searchQuery = query;
            const pageItems = document.querySelectorAll('.page-item');
            
            if (query === '') {
                // Show all pages when search is empty
                pageItems.forEach(item => {
                    item.style.display = 'flex';
                });
                return;
            }
            
            pageItems.forEach(item => {
                const pageId = item.dataset.pageId;
                const page = pages.find(p => p.id === pageId);
                if (!page) {
                    item.style.display = 'none';
                    return;
                }
                
                const title = page.title.toLowerCase();
                // Strip HTML tags for content search
                const contentText = page.content ? page.content.replace(/<[^>]*>/g, '').toLowerCase() : '';
                
                if (title.includes(query) || contentText.includes(query)) {
                    item.style.display = 'flex';
                    // Highlight matching pages
                    item.style.background = title.includes(query) ? 'var(--bg-hover)' : '';
                } else {
                    item.style.display = 'none';
                }
            });

            renderTaskViews();
        }

        function updateWordCount() {
            const text = document.getElementById('editor').innerText || '';
            // Optimized word count using regex match which is faster than split for large text
            const matches = text.match(/\S+/g);
            const count = matches ? matches.length : 0;
            const display = document.getElementById('wordCountDisplay');
            if (display) display.textContent = `${count} words`;
        }

        function updateSaveStatus(status) {
            const el = document.getElementById('saveStatus');
            const taskbarEl = document.getElementById('taskbarSaveStatus');
            
            if (status === 'saving') {
                if (el) el.innerHTML = '<i class="fas fa-sync fa-spin"></i> Saving...';
                if (taskbarEl) {
                    taskbarEl.innerHTML = '<i class="fas fa-sync fa-spin"></i><span>Saving...</span>';
                    taskbarEl.classList.remove('saved');
                    taskbarEl.classList.add('saving');
                }
            } else {
                if (el) el.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
                if (taskbarEl) {
                    taskbarEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Saved</span>';
                    taskbarEl.classList.remove('saving');
                    taskbarEl.classList.add('saved');
                }
            }
        }

        // Link Tooltip Functions
        let currentLinkElement = null;

        function initLinkTooltip() {
            const editor = document.getElementById('editor');
            const tooltip = document.getElementById('linkTooltip');

            // Handle clicks
            document.addEventListener('click', (e) => {
                if (tooltip.contains(e.target)) return; // Clicked inside tooltip

                if (e.target.tagName === 'A' && editor.contains(e.target)) {
                    showLinkTooltip(e.target);
                } else {
                    tooltip.classList.remove('active');
                }
            });

            // Handle keyboard navigation
            editor.addEventListener('keyup', (e) => {
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const node = selection.anchorNode;
                    const element = node.nodeType === 3 ? node.parentElement : node;
                    const link = element.closest('a');
                    
                    if (link && editor.contains(link)) {
                        showLinkTooltip(link);
                    } else {
                        tooltip.classList.remove('active');
                    }
                }
            });
            
            // Hide on scroll
            editor.addEventListener('scroll', () => {
                tooltip.classList.remove('active');
            });
        }

        function showLinkTooltip(link) {
            currentLinkElement = link;
            const tooltip = document.getElementById('linkTooltip');
            const urlLink = document.getElementById('linkTooltipUrl');
            
            urlLink.href = link.href;
            urlLink.textContent = link.href;
            
            const rect = link.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 5}px`; // Fixed positioning relative to viewport
            tooltip.style.left = `${rect.left}px`;
            
            // Ensure tooltip doesn't go off screen
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
            }
            
            tooltip.classList.add('active');
        }

        function editLink() {
            if (currentLinkElement) {
                const newUrl = prompt('Edit URL:', currentLinkElement.href);
                if (newUrl) {
                    currentLinkElement.href = newUrl;
                    document.getElementById('linkTooltipUrl').href = newUrl;
                    document.getElementById('linkTooltipUrl').textContent = newUrl;
                    savePage(); // Save changes
                }
            }
        }

        function removeLink() {
            if (currentLinkElement) {
                const parent = currentLinkElement.parentNode;
                while (currentLinkElement.firstChild) {
                    parent.insertBefore(currentLinkElement.firstChild, currentLinkElement);
                }
                parent.removeChild(currentLinkElement);
                document.getElementById('linkTooltip').classList.remove('active');
                savePage(); // Save changes
            }
        }

        document.addEventListener('DOMContentLoaded', async () => {
            await initAppData();
            hydrateStateFromAppData();
            initApp();
            initGoogleDrive();
            initWorkspaceUI();
            renderTaskViews();
            try { populateProgressDashboard(); } catch (e) { console.warn('populateProgressDashboard failed after init', e); }
            maybeStartInteractiveTutorial();
        });

        window.addEventListener('beforeunload', savePage);

        document.addEventListener('click', (e) => {
            const themePanel = document.getElementById('themePanel');
            const themeSwitcher = document.querySelector('.theme-switcher-btn');
            if (themePanel.classList.contains('active') && !themePanel.contains(e.target) && !themeSwitcher.contains(e.target)) {
                themePanel.classList.remove('active');
            }
            
            // Close slash menu on outside click
            const slashMenu = document.getElementById('slashMenu');
            if (slashMenu && slashMenu.classList.contains('active') && !slashMenu.contains(e.target)) {
                hideSlashMenu();
            }
        });

        // ==================== SLASH COMMANDS ====================
        const slashCommands = [
            { id: 'h1', icon: 'fa-heading', title: 'Heading 1', desc: 'Large section heading', action: () => formatBlock('h1') },
            { id: 'h2', icon: 'fa-heading', title: 'Heading 2', desc: 'Medium section heading', action: () => formatBlock('h2') },
            { id: 'h3', icon: 'fa-heading', title: 'Heading 3', desc: 'Small section heading', action: () => formatBlock('h3') },
            { id: 'bullet', icon: 'fa-list-ul', title: 'Bullet List', desc: 'Create a bulleted list', action: () => formatText('insertUnorderedList') },
            { id: 'numbered', icon: 'fa-list-ol', title: 'Numbered List', desc: 'Create a numbered list', action: () => formatText('insertOrderedList') },
            { id: 'todo', icon: 'fa-tasks', title: 'To-do List', desc: 'Track tasks with checkboxes', action: () => insertChecklist() },
            { id: 'toggle', icon: 'fa-chevron-down', title: 'Toggle', desc: 'Collapsible content section', action: () => insertCollapsible() },
            { id: 'quote', icon: 'fa-quote-left', title: 'Quote', desc: 'Capture a quote', action: () => formatBlock('blockquote') },
            { id: 'divider', icon: 'fa-minus', title: 'Divider', desc: 'Horizontal line separator', action: () => insertDivider() },
            { id: 'code', icon: 'fa-code', title: 'Code Block', desc: 'Capture code snippet', action: () => formatBlock('pre') },
            { id: 'table', icon: 'fa-table', title: 'Table', desc: 'Add a table', action: () => insertTable() },
            { id: 'image', icon: 'fa-image', title: 'Image', desc: 'Upload or embed image', action: () => insertImage() },
            { id: 'video', icon: 'fa-video', title: 'Video', desc: 'Embed YouTube, Vimeo, or upload', action: () => insertVideo() },
            { id: 'audio', icon: 'fa-music', title: 'Audio', desc: 'Embed Spotify, SoundCloud, or upload', action: () => insertAudio() },
            { id: 'embed', icon: 'fa-globe', title: 'Embed', desc: 'Embed external content', action: () => insertEmbed() },
            { id: 'link', icon: 'fa-link', title: 'Link', desc: 'Add a web link', action: () => insertLink() },
            { id: 'pagelink', icon: 'fa-file-alt', title: 'Link to Page', desc: 'Link to another page', action: () => insertPageLink() },
            { id: 'callout', icon: 'fa-exclamation-circle', title: 'Callout', desc: 'Highlight important info', action: () => insertCallout() },
        ];
        
        let slashMenuVisible = false;
        let slashMenuSelectedIndex = 0;
        let slashTriggerRange = null;
        let slashFilterText = '';
        
        function initSlashCommands() {
            const editor = document.getElementById('editor');
            
            editor.addEventListener('keydown', handleSlashKeydown);
            editor.addEventListener('input', handleSlashInput);
        }
        
        function handleSlashInput(e) {
            if (!slashMenuVisible) {
                // Check if user just typed /
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                
                const range = selection.getRangeAt(0);
                const textNode = range.startContainer;
                
                if (textNode.nodeType === 3) { // Text node
                    const text = textNode.textContent;
                    const cursorPos = range.startOffset;
                    
                    // Look for / at the start of line or after space
                    if (cursorPos > 0) {
                        const charBefore = text[cursorPos - 1];
                        const charBeforeThat = cursorPos > 1 ? text[cursorPos - 2] : ' ';
                        
                        if (charBefore === '/' && (charBeforeThat === ' ' || charBeforeThat === '\n' || cursorPos === 1)) {
                            showSlashMenu();
                            slashTriggerRange = range.cloneRange();
                            slashTriggerRange.setStart(textNode, cursorPos - 1);
                        }
                    }
                }
            } else {
                // Update filter
                updateSlashFilter();
            }
        }
        
        function handleSlashKeydown(e) {
            if (!slashMenuVisible) return;
            
            const filteredCommands = getFilteredCommands();
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                slashMenuSelectedIndex = (slashMenuSelectedIndex + 1) % filteredCommands.length;
                renderSlashMenuItems(filteredCommands);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                slashMenuSelectedIndex = (slashMenuSelectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
                renderSlashMenuItems(filteredCommands);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[slashMenuSelectedIndex]) {
                    executeSlashCommand(filteredCommands[slashMenuSelectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideSlashMenu();
            }
        }
        
        function updateSlashFilter() {
            const selection = window.getSelection();
            if (!selection.rangeCount || !slashTriggerRange) return;
            
            const range = selection.getRangeAt(0);
            
            // Get text between slash and cursor
            try {
                const filterRange = document.createRange();
                filterRange.setStart(slashTriggerRange.startContainer, slashTriggerRange.startOffset + 1);
                filterRange.setEnd(range.startContainer, range.startOffset);
                slashFilterText = filterRange.toString().toLowerCase();
            } catch (e) {
                slashFilterText = '';
            }
            
            const filtered = getFilteredCommands();
            if (filtered.length === 0) {
                hideSlashMenu();
            } else {
                slashMenuSelectedIndex = 0;
                renderSlashMenuItems(filtered);
            }
        }
        
        function getFilteredCommands() {
            if (!slashFilterText) return slashCommands;
            return slashCommands.filter(cmd => 
                cmd.title.toLowerCase().includes(slashFilterText) ||
                cmd.id.toLowerCase().includes(slashFilterText)
            );
        }
        
        function showSlashMenu() {
            const menu = document.getElementById('slashMenu');
            const selection = window.getSelection();
            
            if (!selection.rangeCount) return;
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Position menu below cursor
            menu.style.left = rect.left + 'px';
            menu.style.top = (rect.bottom + 8) + 'px';
            
            slashMenuVisible = true;
            slashMenuSelectedIndex = 0;
            slashFilterText = '';
            menu.classList.add('active');
            
            renderSlashMenuItems(slashCommands);
        }
        
        function hideSlashMenu() {
            const menu = document.getElementById('slashMenu');
            menu.classList.remove('active');
            slashMenuVisible = false;
            slashTriggerRange = null;
            slashFilterText = '';
        }
        
        function renderSlashMenuItems(commands) {
            const container = document.getElementById('slashMenuItems');
            
            if (commands.length === 0) {
                container.innerHTML = '<div class="slash-menu-empty">No matching commands</div>';
                return;
            }
            
            container.innerHTML = commands.map((cmd, index) => `
                <div class="slash-menu-item ${index === slashMenuSelectedIndex ? 'selected' : ''}" 
                     onclick="executeSlashCommand(slashCommands.find(c => c.id === '${cmd.id}'))"
                     onmouseenter="slashMenuSelectedIndex = ${index}; renderSlashMenuItems(getFilteredCommands());">
                    <div class="slash-menu-item-icon">
                        <i class="fas ${cmd.icon}"></i>
                    </div>
                    <div class="slash-menu-item-content">
                        <div class="slash-menu-item-title">${cmd.title}</div>
                        <div class="slash-menu-item-desc">${cmd.desc}</div>
                    </div>
                </div>
            `).join('');
        }
        
        function executeSlashCommand(command) {
            // Remove the slash and any filter text
            if (slashTriggerRange) {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                const deleteRange = document.createRange();
                deleteRange.setStart(slashTriggerRange.startContainer, slashTriggerRange.startOffset);
                deleteRange.setEnd(range.startContainer, range.startOffset);
                deleteRange.deleteContents();
            }
            
            hideSlashMenu();
            
            // Execute the command
            if (command && command.action) {
                command.action();
            }
        }
        
        function insertDivider() {
            insertHtmlAtCursor('<hr style="border: none; border-top: 1px solid var(--border); margin: 16px 0;">');
        }
        
        function insertCallout() {
            const calloutContent = `
                <div class="callout" contenteditable="true" style="padding: 16px; background: var(--bg-hover); border-left: 4px solid var(--accent); border-radius: 4px; width: 100%;">
                    <strong>💡 Note:</strong> Type your callout text here...
                </div>
            `;
            insertHtmlAtCursor(createMediaWrapper(calloutContent, 'callout', false) + '<p></p>');
        }

        // ==================== RESIZABLE MEDIA ====================
        let resizeState = {
            isResizing: false,
            element: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            aspectRatio: 1
        };
        
        function initResizableMedia() {
            const editor = document.getElementById('editor');
            
            // Use MutationObserver to watch for new images/media
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            makeMediaResizable(node);
                        }
                    });
                });
            });
            
            observer.observe(editor, { childList: true, subtree: true });
            
            // Initial setup for existing content
            setTimeout(() => {
                editor.querySelectorAll('img, .media-container').forEach(makeMediaResizable);
            }, 100);
            
            // Global mouse event handlers
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        }
        
        function makeMediaResizable(element) {
            // Skip media-wrapper elements as they already have resize functionality
            if (element.classList && element.classList.contains('media-wrapper')) return;
            
            // Check if it's an image or media container
            if (element.tagName === 'IMG') {
                wrapImageForResize(element);
            } else if (element.classList && element.classList.contains('media-container')) {
                addResizeHandles(element);
            }
            
            // Check children too
            if (element.querySelectorAll) {
                element.querySelectorAll('img').forEach(img => {
                    if (!img.closest('.resizable-media') && !img.closest('.media-wrapper')) {
                        wrapImageForResize(img);
                    }
                });
            }
        }
        
        function wrapImageForResize(img) {
            if (img.closest('.resizable-media')) return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'resizable-media';
            wrapper.contentEditable = 'false';
            wrapper.style.width = img.style.width || img.width + 'px' || 'auto';
            
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
            
            addResizeHandles(wrapper);
        }
        
        function addResizeHandles(element) {
            if (element.querySelector('.resize-handle')) return;
            
            element.classList.add('resizable-media');
            element.contentEditable = 'false';
            
            // Add resize handle (bottom-right)
            const handleSE = document.createElement('div');
            handleSE.className = 'resize-handle se';
            handleSE.addEventListener('mousedown', (e) => startResize(e, element));
            element.appendChild(handleSE);
            
            // Add size indicator
            const indicator = document.createElement('div');
            indicator.className = 'size-indicator';
            element.appendChild(indicator);
            
            // Add action button with dropdown
            addMediaActionButton(element);
        }
        
        function addMediaActionButton(element) {
            if (element.querySelector('.media-action-btn')) return;
            
            const btn = document.createElement('button');
            btn.className = 'media-action-btn';
            btn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMediaDropdown(element);
            };
            
            const dropdown = document.createElement('div');
            dropdown.className = 'media-dropdown';
            dropdown.innerHTML = `
                <div class="media-dropdown-item" onclick="setMediaSize(this.closest('.resizable-media'), 'small')">
                    <i class="fas fa-compress-alt"></i> Small
                </div>
                <div class="media-dropdown-item" onclick="setMediaSize(this.closest('.resizable-media'), 'medium')">
                    <i class="fas fa-expand"></i> Medium
                </div>
                <div class="media-dropdown-item" onclick="setMediaSize(this.closest('.resizable-media'), 'large')">
                    <i class="fas fa-expand-arrows-alt"></i> Large
                </div>
                <div class="media-dropdown-item" onclick="setMediaSize(this.closest('.resizable-media'), 'full')">
                    <i class="fas fa-arrows-alt-h"></i> Full Width
                </div>
                <div class="media-dropdown-divider"></div>
                <div class="media-dropdown-item" onclick="setMediaAlign(this.closest('.resizable-media'), 'left')">
                    <i class="fas fa-align-left"></i> Align Left
                </div>
                <div class="media-dropdown-item" onclick="setMediaAlign(this.closest('.resizable-media'), 'center')">
                    <i class="fas fa-align-center"></i> Align Center
                </div>
                <div class="media-dropdown-item" onclick="setMediaAlign(this.closest('.resizable-media'), 'right')">
                    <i class="fas fa-align-right"></i> Align Right
                </div>
                <div class="media-dropdown-divider"></div>
                <div class="media-dropdown-item" onclick="duplicateMedia(this.closest('.resizable-media'))">
                    <i class="fas fa-copy"></i> Duplicate
                </div>
                <div class="media-dropdown-item danger" onclick="deleteMedia(this.closest('.resizable-media'))">
                    <i class="fas fa-trash"></i> Delete
                </div>
            `;
            
            btn.appendChild(dropdown);
            element.appendChild(btn);
        }
        
        function toggleMediaDropdown(element) {
            // Close all other dropdowns
            document.querySelectorAll('.media-dropdown.active').forEach(d => {
                if (d.closest('.resizable-media') !== element) {
                    d.classList.remove('active');
                }
            });
            
            const dropdown = element.querySelector('.media-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        }
        
        function setMediaSize(element, size) {
            if (!element) return;
            
            const sizes = {
                small: '300px',
                medium: '500px',
                large: '720px',
                full: '100%'
            };
            
            element.style.width = sizes[size] || 'auto';
            closeMediaDropdowns();
            savePage();
        }
        
        function setMediaAlign(element, align) {
            if (!element) return;
            
            // Reset alignment styles
            element.style.marginLeft = '';
            element.style.marginRight = '';
            element.style.display = 'inline-block';
            
            if (align === 'center') {
                element.style.display = 'block';
                element.style.marginLeft = 'auto';
                element.style.marginRight = 'auto';
            } else if (align === 'right') {
                element.style.display = 'block';
                element.style.marginLeft = 'auto';
                element.style.marginRight = '0';
            } else {
                element.style.marginLeft = '0';
                element.style.marginRight = 'auto';
            }
            
            closeMediaDropdowns();
            savePage();
        }
        
        function duplicateMedia(element) {
            if (!element) return;
            
            const clone = element.cloneNode(true);
            element.parentNode.insertBefore(clone, element.nextSibling);
            
            // Re-initialize resize handles on clone
            addResizeHandles(clone);
            
            closeMediaDropdowns();
            savePage();
            showToast('Media duplicated');
        }
        
        function deleteMedia(element) {
            if (!element) return;
            
            element.remove();
            savePage();
            showToast('Media deleted');
        }
        
        function closeMediaDropdowns() {
            document.querySelectorAll('.media-dropdown.active').forEach(d => {
                d.classList.remove('active');
            });
        }
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.media-action-btn')) {
                closeMediaDropdowns();
                closeMediaWrapperDropdowns();
            }
        });
        
        function startResize(e, element) {
            e.preventDefault();
            e.stopPropagation();
            
            const rect = element.getBoundingClientRect();
            
            resizeState.isResizing = true;
            resizeState.element = element;
            resizeState.startX = e.clientX;
            resizeState.startY = e.clientY;
            resizeState.startWidth = rect.width;
            resizeState.startHeight = rect.height;
            resizeState.aspectRatio = rect.width / rect.height;
            
            element.classList.add('resizing');
            
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
        }
        
        function handleResizeMove(e) {
            if (!resizeState.isResizing || !resizeState.element) return;
            
            const deltaX = e.clientX - resizeState.startX;
            
            // Calculate new width maintaining aspect ratio
            let newWidth = resizeState.startWidth + deltaX;
            newWidth = Math.max(100, Math.min(newWidth, 1200)); // Min 100px, max 1200px
            
            const newHeight = newWidth / resizeState.aspectRatio;
            
            // Apply to element
            resizeState.element.style.width = newWidth + 'px';
            
            // Apply to inner image/video/iframe if exists
            const inner = resizeState.element.querySelector('img, video, iframe');
            if (inner) {
                inner.style.width = '100%';
                inner.style.height = 'auto';
            }
            
            // Update size indicator
            const indicator = resizeState.element.querySelector('.size-indicator');
            if (indicator) {
                indicator.textContent = Math.round(newWidth) + ' x ' + Math.round(newHeight);
            }
        }
        
        function handleResizeEnd(e) {
            if (!resizeState.isResizing) return;
            
            if (resizeState.element) {
                resizeState.element.classList.remove('resizing');
            }
            
            resizeState.isResizing = false;
            resizeState.element = null;
            
            document.body.style.userSelect = '';
            
            // Trigger save
            savePage();
        }

        // ==================== TAGS SYSTEM ====================
        const tagColors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'];
        let activeTagFilter = null;
        
        function getAllTags() {
            const allTags = new Set();
            pages.forEach(page => {
                if (page.tags && Array.isArray(page.tags)) {
                    page.tags.forEach(tag => allTags.add(tag.name));
                }
            });
            return Array.from(allTags);
        }
        
        function renderTagsContainer() {
            const container = document.getElementById('tagsContainer');
            if (!container || !currentPageId) return;
            
            const page = pages.find(p => p.id === currentPageId);
            if (!page) return;
            
            const tags = page.tags || [];
            
            let html = '';
            tags.forEach((tag, index) => {
                html += `
                    <span class="tag" data-color="${tag.color || 'gray'}" onclick="event.stopPropagation();">
                        ${tag.name}
                        <span class="tag-remove" onclick="removeTag(${index})">&times;</span>
                    </span>
                `;
            });
            
            html += `
                <button class="add-tag-btn" onclick="showAddTagInput()">
                    <i class="fas fa-plus"></i> Add tag
                </button>
            `;
            
            container.innerHTML = html;
        }
        
        function showAddTagInput() {
            const container = document.getElementById('tagsContainer');
            const addBtn = container.querySelector('.add-tag-btn');
            
            // Create input wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'tag-input-wrapper';
            wrapper.innerHTML = `
                <input type="text" class="tag-input" id="tagInput" placeholder="Tag name..." 
                    onkeydown="handleTagInputKeydown(event)" onblur="handleTagInputBlur(event)">
            `;
            
            addBtn.style.display = 'none';
            container.insertBefore(wrapper, addBtn);
            
            const input = document.getElementById('tagInput');
            input.focus();
        }
        
        function handleTagInputKeydown(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTag(event.target.value);
            } else if (event.key === 'Escape') {
                cancelTagInput();
            }
        }
        
        function handleTagInputBlur(event) {
            const value = event.target.value.trim();
            if (value) {
                addTag(value);
            } else {
                cancelTagInput();
            }
        }
        
        function cancelTagInput() {
            const container = document.getElementById('tagsContainer');
            const wrapper = container.querySelector('.tag-input-wrapper');
            const addBtn = container.querySelector('.add-tag-btn');
            
            if (wrapper) wrapper.remove();
            if (addBtn) addBtn.style.display = 'flex';
        }
        
        function addTag(name) {
            name = name.trim();
            if (!name || !currentPageId) return;
            
            const page = pages.find(p => p.id === currentPageId);
            if (!page) return;
            
            if (!page.tags) page.tags = [];
            
            // Check for duplicate
            if (page.tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
                showToast('Tag already exists');
                cancelTagInput();
                return;
            }
            
            // Assign a random color
            const color = tagColors[Math.floor(Math.random() * tagColors.length)];
            
            page.tags.push({ name, color });
            savePagesToLocal();
            renderTagsContainer();
            renderSidebarTags();
            showToast('Tag added!');
        }
        
        function removeTag(index) {
            if (!currentPageId) return;
            
            const page = pages.find(p => p.id === currentPageId);
            if (!page || !page.tags) return;
            
            page.tags.splice(index, 1);
            savePagesToLocal();
            renderTagsContainer();
            renderSidebarTags();
        }
        
        function renderSidebarTags() {
            const container = document.getElementById('sidebarTagsList');
            const filterSection = document.getElementById('sidebarTagsFilter');
            
            if (!container || !filterSection) return;
            
            const allTags = getAllTags();
            
            if (allTags.length === 0) {
                filterSection.style.display = 'none';
                return;
            }
            
            filterSection.style.display = 'block';
            
            let html = `<span class="sidebar-tag ${!activeTagFilter ? 'active' : ''}" onclick="filterByTag(null)">All</span>`;
            allTags.forEach(tag => {
                html += `<span class="sidebar-tag ${activeTagFilter === tag ? 'active' : ''}" onclick="filterByTag('${tag}')">${tag}</span>`;
            });
            
            container.innerHTML = html;
        }
        
        function filterByTag(tagName) {
            activeTagFilter = tagName;
            renderSidebarTags();
            filterPagesByTag();
        }
        
        function filterPagesByTag() {
            const pageItems = document.querySelectorAll('.page-item');
            
            pageItems.forEach(item => {
                const pageId = item.dataset.pageId;
                const page = pages.find(p => p.id === pageId);
                
                if (!activeTagFilter) {
                    item.style.display = 'flex';
                    return;
                }
                
                if (page && page.tags && page.tags.some(t => t.name === activeTagFilter)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }

// Chatbot UI bindings
        const chatbotBtn = document.getElementById('chatbotBtn');
        const chatbotPanel = document.getElementById('chatbotPanel');
        const chatSendBtn = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');
        const messagesEl = document.getElementById('chatbotMessages');
    const groqApiKeyInput = document.getElementById('groqApiKeyInput');
    const saveGroqKeyBtn = document.getElementById('saveGroqKeyBtn');
        const chatInfoBtn = document.getElementById('chatInfoBtn');
        const chatInfo = document.getElementById('chatbotInfo');

        function loadGroqKey() {
            const k = localStorage.getItem('groq_api_key');
            if (k) groqApiKeyInput.value = k;
            return k;
        }

        // model selection removed; default model chosen for reasonable cost/quality balance
        // recommended default: 'llama-3.1-8b-instant'

        function saveGroqKey() {
            const v = groqApiKeyInput.value.trim();
            if (v) {
                localStorage.setItem('groq_api_key', v);
                showToast('Groq API key saved locally');
            } else {
                localStorage.removeItem('groq_api_key');
                showToast('Groq API key removed');
            }
        }

        function toggleChat() {
            const visible = chatbotPanel.style.display === 'flex';
            chatbotPanel.style.display = visible ? 'none' : 'flex';
            chatbotPanel.setAttribute('aria-hidden', visible ? 'true' : 'false');
            if (!visible) {
                loadGroqKey();
                setTimeout(()=> chatInput.focus(), 120);
            }
        }

        function openChatInfo() {
            // Ensure info modal sits above the chat panel even when fullscreen
            try {
                if (chatbotPanel && chatbotPanel.classList && chatbotPanel.classList.contains('fullscreen')) {
                    // fullscreen panel uses a very large z-index; put info above it
                    chatInfo.style.zIndex = '10001';
                } else {
                    chatInfo.style.zIndex = '2300';
                }
            } catch (e) {
                // fallback to default z-index if anything goes wrong
                chatInfo.style.zIndex = '2300';
            }
            chatInfo.style.display = 'block';
        }
        function closeChatInfo() { 
            chatInfo.style.display = 'none';
            // reset z-index so styles revert to CSS defaults
            chatInfo.style.zIndex = '';
        }

        // basic HTML-escaping to avoid accidental injection
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Improved light-weight markdown-ish renderer with list support
        function renderMarkdown(md) {
            if (!md) return '';
            // work on a string copy
            let s = String(md);
            // escape HTML
            s = escapeHtml(s);

            // extract and replace code blocks first
            const codeBlocks = [];
            s = s.replace(/```([\s\S]*?)```/g, function(_, code) {
                const idx = codeBlocks.length;
                codeBlocks.push('<pre><code>' + escapeHtml(code) + '</code></pre>');
                return `@@CODE_BLOCK_${idx}@@`;
            });

            // inline code
            s = s.replace(/`([^`]+?)`/g, function(_, code) { return '<code>' + escapeHtml(code) + '</code>'; });
            // bold
            s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            // italic (avoid interfering with bold)
            s = s.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, function(_, a, inner, b){ return a + '<em>' + inner + '</em>' + b; });
            // urls -> links
            s = s.replace(/(https?:\/\/[\w\-./?=&#%+~,:;@()\[\]\$]+)/g, '<a href="$1" target="_blank" rel="noreferrer noopener">$1</a>');

            // handle lists and line grouping
            const lines = s.split(/\r?\n/);
            let out = '';
            let inUl = false;
            let inOl = false;

            lines.forEach(line => {
                const trimmed = line.trim();
                const ulMatch = trimmed.match(/^[-\*]\s+(.*)$/);
                const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

                if (ulMatch) {
                    if (inOl) { out += '</ol>'; inOl = false; }
                    if (!inUl) { out += '<ul>'; inUl = true; }
                    out += '<li>' + ulMatch[1] + '</li>';
                } else if (olMatch) {
                    if (inUl) { out += '</ul>'; inUl = false; }
                    if (!inOl) { out += '<ol>'; inOl = true; }
                    out += '<li>' + olMatch[2] + '</li>';
                } else {
                    if (inUl) { out += '</ul>'; inUl = false; }
                    if (inOl) { out += '</ol>'; inOl = false; }
                    if (trimmed === '') {
                        out += '<br>';
                    } else {
                        out += '<p>' + trimmed + '</p>';
                    }
                }
            });

            if (inUl) out += '</ul>';
            if (inOl) out += '</ol>';

            // restore code blocks
            out = out.replace(/@@CODE_BLOCK_(\d+)@@/g, function(_, id) { return codeBlocks[Number(id)] || ''; });
            return out;
        }

        // Conversation/history storage (for summarization and continuation)
        const editorEl = document.getElementById('editor');
        const MAX_HISTORY_MESSAGES = 8; // keep last N messages for context
        let convo = [];

        function saveConvo() {
            try { localStorage.setItem('chat_history', JSON.stringify(convo)); } catch(e){}
        }

        function loadConvo() {
            try { convo = JSON.parse(localStorage.getItem('chat_history') || '[]'); } catch(e){ convo = []; }
        }

        // Insert text into the main editor at caret (or append at end)
        function insertIntoEditor(text) {
            if (!editorEl) return;
            editorEl.focus();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                // verify selection is inside the editor
                let node = range.commonAncestorContainer;
                while (node && node !== editorEl) node = node.parentNode;
                if (node === editorEl) {
                    range.deleteContents();
                    const frag = document.createDocumentFragment();
                    const tmp = document.createElement('div');
                    // render markdown to HTML for nicer insertion (renderMarkdown escapes HTML internally)
                    tmp.innerHTML = renderMarkdown(text);
                    let lastInserted = null;
                    while (tmp.firstChild) {
                        lastInserted = tmp.firstChild;
                        frag.appendChild(lastInserted);
                    }
                    range.insertNode(frag);
                    // move caret after inserted content
                    sel.removeAllRanges();
                    const newRange = document.createRange();
                    if (lastInserted && lastInserted.parentNode) {
                        newRange.setStartAfter(lastInserted);
                    } else {
                        newRange.setStart(range.endContainer, range.endOffset);
                    }
                    newRange.collapse(true);
                    sel.addRange(newRange);
                    return;
                }
            }
            // fallback: append at end (render markdown)
            editorEl.insertAdjacentHTML('beforeend', renderMarkdown(text));
        }

        // appendMessage now adds an insert button for assistant messages
        function appendMessage(role, text) {
            const wrap = document.createElement('div');
            wrap.className = 'chatbot-msg ' + (role === 'user' ? 'user' : 'assistant');
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            if (role === 'assistant') {
                bubble.innerHTML = renderMarkdown(text);
                // actions: insert/copy
                const actions = document.createElement('div');
                actions.className = 'assistant-actions';
                const insertBtn = document.createElement('button');
                insertBtn.type = 'button';
                insertBtn.textContent = 'Insert';
                insertBtn.title = 'Insert this reply into the editor';
                insertBtn.addEventListener('click', ()=> insertIntoEditor(text));
                const copyBtn = document.createElement('button');
                copyBtn.type = 'button';
                copyBtn.textContent = 'Copy';
                copyBtn.title = 'Copy to clipboard';
                copyBtn.addEventListener('click', ()=> navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : null);
                actions.appendChild(insertBtn);
                actions.appendChild(copyBtn);
                wrap.appendChild(bubble);
                wrap.appendChild(actions);
            } else {
                // user content kept as text to avoid injection
                bubble.textContent = text;
                wrap.appendChild(bubble);
            }
            messagesEl.appendChild(wrap);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        // Summarization removed: chats are not continuous (we do not send history to the API to save tokens)

        // new element refs for fullscreen + close
        const chatCloseBtn = document.getElementById('chatCloseBtn');
        const chatFullBtn = document.getElementById('chatFullBtn');

        async function sendChat() {
            const text = chatInput.value.trim();
            if (!text) return;
            appendMessage('user', text);
            chatInput.value = '';
            // maintain conversation history
            convo.push({ role: 'user', content: text });
            saveConvo();
            const apiKey = loadGroqKey();
            // Use correct Groq endpoint that supports browser CORS
            const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
            if (!apiKey) {
                appendMessage('assistant', 'Please save your Groq API key in the field below first.');
                return;
            }

            appendMessage('assistant', 'Thinking...');
            // Call Groq REST endpoint (non-streaming simple call)
            try {
                // pick a reasonable default model (cost-effective + useful)
                // default: 'llama-3.1-8b-instant'
                const selectedModel = localStorage.getItem('chat_model') || 'llama-3.1-8b-instant';

                // Chats are not continuous to save tokens: send only the latest user message as context
                let requestMessages = [{ role: 'user', content: text }];

                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: requestMessages,
                        temperature: 1,
                        max_tokens: 1024,
                        top_p: 1
                    })
                });

                // Try to parse JSON, but gracefully handle non-JSON responses
                let data;
                try {
                    data = await resp.json();
                } catch (e) {
                    const raw = await resp.text();
                    data = { __raw_text: raw, __parseError: true };
                }

                // remove the temporary 'Thinking...' bubble (last assistant)
                const bubbles = messagesEl.querySelectorAll('.chatbot-msg.assistant');
                if (bubbles.length) bubbles[bubbles.length-1].remove();

                // Helper: extract a human-friendly message from the response body
                function extractMessage(obj) {
                    if (!obj) return null;
                    if (typeof obj === 'string') return obj;
                    // common Groq/OpenAI-style error shapes
                    if (obj.error) {
                        if (typeof obj.error === 'string') return obj.error;
                        if (obj.error.message) return obj.error.message;
                        if (obj.error.detail) return obj.error.detail;
                    }
                    if (obj.message) return obj.message;
                    if (obj.detail) return obj.detail;
                    if (obj.choices && obj.choices[0]) {
                        const c = obj.choices[0];
                        if (c.message && c.message.content) return c.message.content;
                        if (c.delta && c.delta.content) return c.delta.content;
                        if (c.text) return c.text;
                    }
                    if (obj.__raw_text) return obj.__raw_text;
                    try { return JSON.stringify(obj); } catch (e) { return String(obj); }
                }

                let assistantText = '';
                if (!resp.ok) {
                    const serverMsg = extractMessage(data) || '(no details)';
                    assistantText = `HTTP ${resp.status} — ${serverMsg}`;
                } else {
                    assistantText = extractMessage(data) || '(no response)';
                }

                appendMessage('assistant', assistantText);
                // persist assistant reply into convo
                convo.push({ role: 'assistant', content: assistantText });
                saveConvo();
            } catch (err) {
                // remove thinking bubble
                const bubbles = messagesEl.querySelectorAll('.chatbot-msg.assistant');
                if (bubbles.length) bubbles[bubbles.length-1].remove();
                // Friendly guidance for common CORS/network failure
                let msg = 'Request failed: ' + err.message;
                if (err && err.message && err.message.toLowerCase().includes('failed to fetch')) {
                    msg += ' — this usually indicates a network issue or a CORS block. Try running a local proxy (see the info panel \u2013 click the i button) and set the proxy URL.';
                }
                appendMessage('assistant', msg);
            }
        }

        // fullscreen toggle
        function toggleFullscreen() {
            const isFull = chatbotPanel.classList.toggle('fullscreen');
            if (isFull) {
                chatFullBtn.textContent = '⤡'; // collapse icon
            } else {
                chatFullBtn.textContent = '⤢'; // expand icon
            }
            // ensure messages area scrolls to bottom
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        chatbotBtn.addEventListener('click', toggleChat);
        chatSendBtn.addEventListener('click', sendChat);
        saveGroqKeyBtn.addEventListener('click', saveGroqKey);
        chatInfoBtn.addEventListener('click', openChatInfo);
        chatCloseBtn.addEventListener('click', () => { if (chatbotPanel.classList.contains('fullscreen')) chatbotPanel.classList.remove('fullscreen'); toggleChat(); });
        chatFullBtn.addEventListener('click', toggleFullscreen);
        document.getElementById('groqApiKeyInput').addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ saveGroqKey(); } });
        chatInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });

        // Initialize
        loadGroqKey();
        // load and render conversation history
        loadConvo();
        if (convo && convo.length) {
            convo.forEach(m => appendMessage(m.role, m.content));
        }

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE / TIME-BLOCKING (TimeTile integration)
// ═══════════════════════════════════════════════════════════════════════════════

let timeBlocks = [];
let editingBlockId = null;
let timeMode = null; // null = auto

// Time mode detection
function detectTimeMode() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

function getCurrentTimeMode() {
    return timeMode || detectTimeMode();
}

function applyTimeMode() {
    const mode = getCurrentTimeMode();
    document.body.setAttribute('data-time-mode', mode);
    const badge = document.getElementById('timeModeBadge');
    if (badge) badge.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
}

function initTimeModeSelector() {
    const select = document.getElementById('timeModeSelect');
    if (!select) return;
    select.value = timeMode || '';
    select.addEventListener('change', (e) => {
        timeMode = e.target.value || null;
        applyTimeMode();
        // Save preference
        if (appSettings) {
            appSettings.timeMode = timeMode;
            persistAppData();
        }
    });
}

// Time blocks data persistence
function loadTimeBlocks() {
    if (appData && appData.timeBlocks) {
        timeBlocks = appData.timeBlocks;
    } else {
        timeBlocks = [];
    }
}

function saveTimeBlocks() {
    if (appData) {
        appData.timeBlocks = timeBlocks;
        persistAppData();
    }
}

function generateBlockId() {
    return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2,9);
}

// Render timeline
function renderTimeline() {
    const scaleEl = document.getElementById('timelineScale');
    const blocksEl = document.getElementById('timelineBlocks');
    if (!scaleEl || !blocksEl) return;

    // Clear
    scaleEl.innerHTML = '';
    blocksEl.innerHTML = '';

    const containerHeight = 600; // px for 24 hours
    const pxPerHour = containerHeight / 24;

    // Hour markers
    for (let h = 0; h < 24; h += 2) {
        const marker = document.createElement('div');
        marker.className = 'hour-marker';
        marker.style.top = (h * pxPerHour) + 'px';
        marker.textContent = String(h).padStart(2,'0') + ':00';
        scaleEl.appendChild(marker);
    }

    // Current block detection
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let currentBlock = null;

    // Render blocks with collision-resolution to add a small vertical gap
    const GAP = 12; // px gap to separate overlapping blocks (increased)
    // map blocks to computed positions and sort by start time (earliest first)
    const blocksData = timeBlocks.map(block => {
        const [sh, sm] = block.start.split(':').map(Number);
        const [eh, em] = block.end.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        const duration = Math.max(30, endMins - startMins);
        const top = (startMins / 60 * pxPerHour);
        const height = Math.max(30, duration / 60 * pxPerHour);
        return { block, startMins, endMins, top, height };
    }).sort((a,b) => a.startMins - b.startMins);

    const placed = [];
    blocksData.forEach(data => {
        const { block, startMins } = data;
        if (nowMins >= data.startMins && nowMins < data.endMins) {
            currentBlock = block;
        }

        let desiredTop = data.top;
        let desiredBottom = desiredTop + data.height;
        let attempts = 0;
        // If this block overlaps any already-placed (earlier) block, nudge it down
        while (placed.some(p => !(desiredBottom <= p.top || desiredTop >= p.bottom)) && attempts < 100) {
            desiredTop += GAP;
            desiredBottom = desiredTop + data.height;
            attempts++;
        }

        const el = document.createElement('div');
        el.className = 'timeline-block' + (currentBlock === block ? ' current' : '');
        el.style.top = desiredTop + 'px';
        el.style.height = data.height + 'px';
        el.style.borderLeftColor = block.color || 'var(--accent)';
        // Ensure earlier blocks stack above later ones
        el.style.zIndex = String(2000 - startMins);

        el.innerHTML = `
            <div class="block-name">${block.name || 'Untitled'}</div>
            <div class="block-time">${block.start} → ${block.end}</div>
        `;
        el.addEventListener('click', () => openBlockModal(block));
        blocksEl.appendChild(el);

        placed.push({ top: desiredTop, bottom: desiredBottom });
    });

    // Now indicator
    const nowTop = nowMins / 60 * pxPerHour;
    const nowLine = document.createElement('div');
    nowLine.className = 'now-indicator';
    nowLine.style.top = nowTop + 'px';
    blocksEl.appendChild(nowLine);

    // Update current block card
    updateCurrentBlockCard(currentBlock);
}

function updateCurrentBlockCard(block) {
    const infoEl = document.getElementById('currentBlockInfo');
    const progressEl = document.getElementById('blockProgressFill');
    const countdownEl = document.getElementById('blockCountdown');

    if (!block) {
        if (infoEl) infoEl.textContent = 'No active block right now';
        if (progressEl) progressEl.style.width = '0%';
        if (countdownEl) countdownEl.textContent = '--:--';
        return;
    }

    // compute using seconds for accuracy (show seconds in countdown)
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const startSecs = (sh * 3600) + (sm * 60);
    const endSecs = (eh * 3600) + (em * 60);
    const now = new Date();
    const nowSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

    const elapsedSecs = nowSecs - startSecs;
    const totalSecs = Math.max(1, endSecs - startSecs);
    const remainingSecs = endSecs - nowSecs;
    const pct = Math.min(100, Math.max(0, (elapsedSecs / totalSecs) * 100));

    if (infoEl) {
        infoEl.innerHTML = `<strong style="font-size:18px;">${block.name}</strong><br><span style="color:var(--text-secondary)">${block.start} → ${block.end}</span>`;
    }
    if (progressEl) progressEl.style.width = pct + '%';
    if (countdownEl) {
        if (remainingSecs <= 0) {
            countdownEl.textContent = '0s left';
        } else {
            const h = Math.floor(remainingSecs / 3600);
            const m = Math.floor((remainingSecs % 3600) / 60);
            const s = remainingSecs % 60;
            let txt = '';
            if (h > 0) txt += h + 'h ';
            if (m > 0 || h > 0) txt += m + 'm ';
            txt += s + 's left';
            countdownEl.textContent = txt;
        }
    }
}

// Block modal
function openBlockModal(block) {
    editingBlockId = block ? block.id : null;
    const modal = document.getElementById('blockModal');
    const titleEl = document.getElementById('blockModalTitle');
    const deleteBtn = document.getElementById('deleteBlockBtn');

    document.getElementById('blockNameInput').value = block ? block.name : '';
    document.getElementById('blockStartInput').value = block ? block.start : '09:00';
    document.getElementById('blockEndInput').value = block ? block.end : '10:00';
    document.getElementById('blockCategoryInput').value = block ? (block.category || 'default') : 'default';
    document.getElementById('blockColorInput').value = block ? (block.color || '#b8860b') : '#b8860b';
    document.getElementById('blockRecurrenceInput').value = block ? (block.recurrence || 'none') : 'none';

    titleEl.textContent = block ? 'Edit Time Block' : 'Add Time Block';
    deleteBtn.style.display = block ? 'inline-block' : 'none';

    modal.classList.add('active');
    modal.style.display = 'flex';
}

function closeBlockModal() {
    const modal = document.getElementById('blockModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    editingBlockId = null;
}

function saveBlockFromModal() {
    const name = document.getElementById('blockNameInput').value.trim() || 'Untitled Block';
    const start = document.getElementById('blockStartInput').value;
    const end = document.getElementById('blockEndInput').value;
    const category = document.getElementById('blockCategoryInput').value;
    const color = document.getElementById('blockColorInput').value;
    const recurrence = document.getElementById('blockRecurrenceInput').value;

    if (editingBlockId) {
        // Update existing
        const idx = timeBlocks.findIndex(b => b.id === editingBlockId);
        if (idx !== -1) {
            timeBlocks[idx] = { ...timeBlocks[idx], name, start, end, category, color, recurrence, updatedAt: Date.now() };
        }
    } else {
        // Create new
        timeBlocks.push({
            id: generateBlockId(),
            name,
            start,
            end,
            category,
            color,
            recurrence,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    }

    // Sort by start time
    timeBlocks.sort((a, b) => {
        const [ah, am] = a.start.split(':').map(Number);
        const [bh, bm] = b.start.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
    });

    saveTimeBlocks();
    closeBlockModal();
    renderTimeline();
    showToast(editingBlockId ? 'Block updated!' : 'Block created!');
}

function deleteBlock() {
    if (!editingBlockId) return;
    timeBlocks = timeBlocks.filter(b => b.id !== editingBlockId);
    saveTimeBlocks();
    closeBlockModal();
    renderTimeline();
    showToast('Block deleted');
}

// Initialize timeline
function initTimeline() {
    loadTimeBlocks();
    applyTimeMode();
    initTimeModeSelector();
    renderTimeline();

    // Add block button
    const addBtn = document.getElementById('addBlockBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openBlockModal(null));
    }

    // Delete button in modal
    const deleteBtn = document.getElementById('deleteBlockBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteBlock);
    }

    // Update timeline every minute
    setInterval(() => {
        if (activeView === 'timeline') {
            renderTimeline();
            applyTimeMode();
        }
    }, 60000);
}

// Hook into view switching
const originalSwitchView = typeof switchView === 'function' ? switchView : null;
function enhancedSwitchView(viewName) {
    if (originalSwitchView) {
        originalSwitchView(viewName);
    }
    if (viewName === 'timeline') {
        renderTimeline();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for appData to be ready
    setTimeout(() => {
        initTimeline();
        // Patch view tab clicks
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.dataset.view;
                if (view === 'timeline') {
                    setTimeout(renderTimeline, 50);
                }
            });
        });
    }, 500);
});


