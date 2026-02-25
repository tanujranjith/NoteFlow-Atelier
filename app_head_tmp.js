const COMPACT_LAYOUT_MAX_WIDTH = 1024;

const OPTIONAL_FEATURE_VIEWS = ['today', 'timeline', 'notes', 'college', 'homework', 'collegeapp', 'life'];
const FEATURE_VIEW_FALLBACK_ORDER = ['today', 'timeline', 'notes', 'collegeapp', 'life', 'college', 'homework', 'settings'];

function getDefaultEnabledViews() {
    return OPTIONAL_FEATURE_VIEWS.reduce((acc, view) => {
        acc[view] = true;
        return acc;
    }, {});
}

function normalizeEnabledViews(raw) {
    const normalized = getDefaultEnabledViews();
    if (!raw || typeof raw !== 'object') return normalized;
    OPTIONAL_FEATURE_VIEWS.forEach(view => {
        if (Object.prototype.hasOwnProperty.call(raw, view)) {
            normalized[view] = raw[view] !== false;
        }
    });
    return normalized;
}

const PAGE_ICONS = Object.freeze({
    DOC: '\u{1F4C4}',
    CALENDAR: '\u{1F4C6}',
    ROCKET: '\u{1F680}',
    CHECK: '\u{2705}',
    JOURNAL: '\u{1F4D4}',
    CHART: '\u{1F4CA}',
    BOOKS: '\u{1F4DA}',
    FOLDER: '\u{1F4C1}',
    IMPORT: '\u{1F4E5}',
    NOTE: '\u{1F4DD}',
    GLOBE: '\u{1F310}',
    PDF: '\u{1F4D5}',
    GRAPH: '\u{1F4C8}',
    VIDEO: '\u{1F4FD}\uFE0F',
    BOOK_RED: '\u{1F4D7}',
    SCROLL: '\u{1F9FE}'
});

const PAGE_ICON_MOJIBAKE_MAP = Object.freeze({
    'ðŸ“„': PAGE_ICONS.DOC,
    'ðŸ“…': PAGE_ICONS.CALENDAR,
    'ðŸš€': PAGE_ICONS.ROCKET,
    'âœ…': PAGE_ICONS.CHECK,
    'ðŸ“”': PAGE_ICONS.JOURNAL,
    'ðŸ“Š': PAGE_ICONS.CHART,
    'ðŸ“š': PAGE_ICONS.BOOKS,
    'ðŸ“': PAGE_ICONS.FOLDER,
    'ðŸ“¥': PAGE_ICONS.IMPORT,
    'ðŸ“': PAGE_ICONS.NOTE,
    'ðŸŒ': PAGE_ICONS.GLOBE,
    'ðŸ“•': PAGE_ICONS.PDF,
    'ðŸ“ˆ': PAGE_ICONS.GRAPH,
    'ðŸ“½ï¸': PAGE_ICONS.VIDEO,
    'ðŸ“—': PAGE_ICONS.BOOK_RED,
    'ðŸ§¾': PAGE_ICONS.SCROLL
});

function normalizePageIcon(icon) {
    if (typeof icon !== 'string') return '';
    const raw = String(icon).trim();
    if (!raw) return '';
    if (PAGE_ICON_MOJIBAKE_MAP[raw]) return PAGE_ICON_MOJIBAKE_MAP[raw];
    if (/[<>]/.test(raw)) return PAGE_ICONS.DOC;
    return raw;
}

function normalizePageTitle(rawTitle) {
    const parts = String(rawTitle || '')
        .split('::')
        .map(part => part.trim())
        .filter(Boolean);
    return parts.length ? parts.join('::') : 'Untitled';
}

function normalizePagesCollection(rawPages) {
    const seenIds = new Set();
    const now = new Date().toISOString();
    return (Array.isArray(rawPages) ? rawPages : []).reduce((acc, rawPage) => {
        if (!rawPage || typeof rawPage !== 'object') return acc;
        const page = rawPage;
        let id = String(page.id || '').trim();
        if (!id || seenIds.has(id)) id = generateId();
        seenIds.add(id);
        acc.push({
            ...page,
            id,
            title: normalizePageTitle(page.title),
            content: typeof page.content === 'string' ? page.content : String(page.content || ''),
            icon: normalizePageIcon(page.icon),
            collapsed: page.collapsed === true,
            starred: page.starred === true,
            createdAt: typeof page.createdAt === 'string' ? page.createdAt : now,
            updatedAt: typeof page.updatedAt === 'string' ? page.updatedAt : now
        });
        return acc;
    }, []);
}

function isCompactViewport() {
    return window.innerWidth <= COMPACT_LAYOUT_MAX_WIDTH;
}

function enforceInitialViewVisibilityFallback() {
    const todaySection = document.getElementById('view-today');
    const activeSection = document.querySelector('.view.active') || todaySection;
    document.querySelectorAll('.view').forEach(section => {
        section.style.display = section === activeSection ? '' : 'none';
    });
}

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

                if (isCompactViewport()) {
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
                enforceInitialViewVisibilityFallback();
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

const DASHBOARD_CATEGORY_COLORS = [
    '#ff9f1c',
    '#2f80ed',
    '#10b981',
    '#e056fd',
    '#f43f5e',
    '#f7b801',
    '#22d3ee',
    '#a78bfa'
];

function polarToCartesian(cx, cy, radius, angleDegrees) {
    const radians = ((angleDegrees - 90) * Math.PI) / 180;
    return {
        x: cx + (radius * Math.cos(radians)),
        y: cy + (radius * Math.sin(radians))
    };
}

function describePieSlice(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function renderDonut(el, breakdown) {
    if (!el) return { total: 0, entries: [] };
    const entries = Object.entries(breakdown || {})
        .map(([name, rawValue]) => ({
            name,
            value: Math.max(0, Number(rawValue) || 0)
        }))
        .sort((a, b) => (b.value - a.value) || a.name.localeCompare(b.name));
    const total = entries.reduce((sum, entry) => sum + entry.value, 0);
    const withColors = entries.map((entry, index) => ({
        ...entry,
        color: DASHBOARD_CATEGORY_COLORS[index % DASHBOARD_CATEGORY_COLORS.length],
        percent: total > 0 ? ((entry.value / total) * 100) : 0
    }));

    const size = 164;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 66;
    const innerRadius = 34;
    const centerFill = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#131313';

    if (total <= 0) {
        const emptySvg = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No completed tasks by category">
                <circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="14"></circle>
                <circle cx="${cx}" cy="${cy}" r="${innerRadius}" style="fill:${centerFill};" stroke="rgba(255,255,255,0.12)" stroke-width="1"></circle>
                <text x="${cx}" y="${cy - 3}" text-anchor="middle" fill="var(--text-primary)" style="font-size:28px;font-weight:700;">0</text>
                <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="var(--text-secondary)" style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;">No data</text>
            </svg>
        `;
        el.innerHTML = emptySvg;
        el.setAttribute('aria-label', 'Category breakdown pie chart with no completed tasks');
        return { total: 0, entries: withColors };
    }

    let currentAngle = 0;
    const slices = withColors
        .filter(entry => entry.value > 0)
        .map(entry => {
            const sweep = (entry.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sweep;
            currentAngle = endAngle;

            if (sweep >= 359.999) {
                return `<circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${entry.color}" stroke="rgba(255,255,255,0.24)" stroke-width="1"></circle>`;
            }

            const path = describePieSlice(cx, cy, outerRadius, startAngle, endAngle);
            return `<path d="${path}" fill="${entry.color}" stroke="rgba(14,14,16,0.45)" stroke-width="1.2"></path>`;
        })
        .join('');

    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Category breakdown pie chart">
            <circle cx="${cx}" cy="${cy}" r="${outerRadius + 2}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"></circle>
            ${slices}
            <circle cx="${cx}" cy="${cy}" r="${innerRadius}" style="fill:${centerFill};" stroke="rgba(255,255,255,0.14)" stroke-width="1.2"></circle>
            <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--text-primary)" style="font-size:30px;font-weight:700;">${total}</text>
            <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="var(--text-secondary)" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Tasks</text>
        </svg>
    `;
    el.innerHTML = svg;
    el.setAttribute('aria-label', `Category breakdown pie chart with ${total} completed tasks`);
    return { total, entries: withColors };
}

function parseTimeToMinutes(value) {
    const [h, m] = String(value || '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return (h * 60) + m;
}

function getBlockDurationHours(block) {
    const startMins = parseTimeToMinutes(block && block.start);
    const endMins = parseTimeToMinutes(block && block.end);
    if (startMins === null || endMins === null) return 0;
    return Math.max(0, endMins - startMins) / 60;
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
    const taskById = new Map(tasksArr.map(task => [task && task.id, task]));
    // map ids to tasks
    completedIds.forEach(id => {
        const t = taskById.get(id) || {};
        const k = (t.category && String(t.category)) || 'Uncategorized';
        catCounts[k] = (catCounts[k]||0) + 1;
    });
    // Ensure at least some sample categories to avoid an empty donut
    if (Object.keys(catCounts).length === 0) { catCounts['Work'] = 0; catCounts['Personal'] = 0; }
    const categoryChart = renderDonut(donutEl, catCounts);
    if (legendEl) {
        legendEl.innerHTML = '';
        (categoryChart.entries || []).forEach(entry => {
            const percent = categoryChart.total > 0 ? Math.round(entry.percent) : 0;
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-main">
                    <span class="legend-color" style="background:${entry.color}"></span>
                    <span class="legend-label">${escapeHtml(String(entry.name || 'Uncategorized'))}</span>
                </div>
                <div class="legend-metrics">
                    <span class="legend-percent">${percent}%</span>
                    <span class="legend-value">${entry.value}</span>
                </div>
            `;
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

// Google API Configuration
        let CLIENT_ID = '';
        let API_KEY = '';
        const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        const CALENDAR_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        const DISCOVERY_DOCS = [DRIVE_DISCOVERY_DOC, CALENDAR_DISCOVERY_DOC];
        const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
        const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
        const SCOPES = `${DRIVE_SCOPE} ${CALENDAR_SCOPE}`;

        // Unified Storage (IndexedDB)
        const APP_DB_NAME = 'noteflow_atelier_db';
        const APP_DB_STORE = 'workspace';
        const APP_DB_KEY = 'root';
        const APP_SCHEMA_VERSION = 2;
        let appData = null;
        let pendingAppSave = null;

        const COLLEGE_SHEET_KEYS = ['research', 'checklist', 'deadlines', 'essays', 'prompts'];
        const COLLEGE_SHEET_LABELS = {
            research: 'Research',
            checklist: 'Checklist',
            deadlines: 'Deadlines',
            essays: 'Essay Plan',
            prompts: 'Essay Prompts'
        };

        function createCollegeTrackerRow(sheetKey) {
            const id = generateId();
            if (sheetKey === 'research') {
                return {
                    id,
                    college: '',
                    decision: 'pending',
                    system: '',
                    studentBody: '',
                    ratio: '',
                    city: '',
                    avgGpa: '',
                    testOptional: false,
                    recommendation: '',
                    likelihood: '',
                    acceptanceRate: '',
                    essays: '',
                    notes: ''
                };
            }
            if (sheetKey === 'checklist') {
                return {
                    id,
                    college: '',
                    commonApp: 'na',
                    transcript: 'na',
                    counselorLetter: 'no',
                    teacherLetters: '',
                    cssProfile: 'na',
                    earlyDeadline: '',
                    regularDeadline: '',
                    fafsaDeadline: '',
                    cssDeadline: '',
                    appSubmitted: false,
                    transcriptSubmitted: false,
                    recommendationsSubmitted: false
                };
            }
            if (sheetKey === 'deadlines') {
                return {
                    id,
                    college: '',
                    essaysDoneBy: '',
                    submitBy: '',
                    applicationDeadline: '',
                    submitted: false,
                    decisionDate: '',
                    notes: ''
                };
            }
            if (sheetKey === 'essays') {
                return {
                    id,
                    essay: '',
                    firstDraftBy: '',
                    firstDraftDone: false,
                    reviewBy: '',
                    reviewSubmitted: false,
                    revisionBy: '',
                    revisionSubmitted: false,
                    finalBy: '',
                    finalDraft: false,
                    wordLimit: '',
                    notes: ''
                };
            }
            if (sheetKey === 'prompts') {
                return {
                    id,
                    school: '',
                    prompt: '',
                    targetWords: '',
                    draftPage: '',
                    completed: false
                };
            }
            return { id };
        }

        function normalizeCollegeTrackerRow(sheetKey, row) {
            const defaults = createCollegeTrackerRow(sheetKey);
            const source = row && typeof row === 'object' ? row : {};
            const normalized = { ...defaults, ...source, id: source.id || defaults.id };

            const toBool = (value) => {
                if (typeof value === 'boolean') return value;
                if (typeof value === 'string') {
                    const v = value.trim().toLowerCase();
                    return v === 'true' || v === '1' || v === 'yes' || v === 'y';
                }
                return !!value;
            };

            if (sheetKey === 'research') {
                normalized.testOptional = toBool(normalized.testOptional);
            }
            if (sheetKey === 'checklist') {
                normalized.appSubmitted = toBool(normalized.appSubmitted);
                normalized.transcriptSubmitted = toBool(normalized.transcriptSubmitted);
                normalized.recommendationsSubmitted = toBool(normalized.recommendationsSubmitted);
            }
            if (sheetKey === 'deadlines') {
                normalized.submitted = toBool(normalized.submitted);
            }
            if (sheetKey === 'essays') {
                normalized.firstDraftDone = toBool(normalized.firstDraftDone);
                normalized.reviewSubmitted = toBool(normalized.reviewSubmitted);
                normalized.revisionSubmitted = toBool(normalized.revisionSubmitted);
                normalized.finalDraft = toBool(normalized.finalDraft);
            }
            if (sheetKey === 'prompts') {
                normalized.completed = toBool(normalized.completed);
            }

            return normalized;
        }

        function getDefaultCollegeTracker() {
            return {
                activeTab: 'research',
                research: [],
                checklist: [],
                deadlines: [],
                essays: [],
                prompts: []
            };
        }

        function normalizeCollegeTracker(data) {
            const defaults = getDefaultCollegeTracker();
            const source = data && typeof data === 'object' ? data : {};
            const normalized = {
                ...defaults,
                ...source
            };
            normalized.activeTab = COLLEGE_SHEET_KEYS.includes(source.activeTab) ? source.activeTab : defaults.activeTab;
            COLLEGE_SHEET_KEYS.forEach(sheetKey => {
                const rows = Array.isArray(source[sheetKey]) ? source[sheetKey] : [];
                normalized[sheetKey] = rows.map(row => normalizeCollegeTrackerRow(sheetKey, row));
            });
            return normalized;
        }

        function normalizeBooleanValue(value) {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                const normalized = value.trim().toLowerCase();
                return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y';
            }
            return !!value;
        }

        function normalizeFiniteNumber(value, fallback = 0) {
            const numeric = Number(value);
            return Number.isFinite(numeric) ? numeric : fallback;
        }

        function normalizeGoogleCalendarSettings(settings) {
            const source = settings && typeof settings === 'object' ? settings : {};
            const interval = Math.max(1, Math.min(60, Math.floor(normalizeFiniteNumber(source.syncIntervalMinutes, 5))));
            const calendarIdRaw = String(source.calendarId || 'primary').trim();
            const normalized = {
                enabled: !!source.enabled,
                autoSync: source.autoSync !== false,
                calendarId: calendarIdRaw || 'primary',
                syncIntervalMinutes: interval,
                lastSyncedAt: source.lastSyncedAt ? String(source.lastSyncedAt) : null
            };
            return normalized;
        }

        function offsetDateKey(daysOffset) {
            const base = new Date();
            base.setHours(0, 0, 0, 0);
            base.setDate(base.getDate() + Number(daysOffset || 0));
            return dateKey(base);
        }

        function createAcademicClassRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                instructor: seed.instructor || '',
                meetingDate: seed.meetingDate || '',
                meetingTime: seed.meetingTime || '',
                location: seed.location || '',
                status: seed.status || 'active',
                notes: seed.notes || ''
            };
        }

        function createAcademicAssignmentRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                title: seed.title || '',
                classId: seed.classId || '',
                className: seed.className || '',
                dueDate: seed.dueDate || '',
                priority: seed.priority || 'medium',
                status: seed.status || 'not_started',
                notes: seed.notes || ''
            };
        }

        function createAcademicExamRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                title: seed.title || '',
                classId: seed.classId || '',
                className: seed.className || '',
                examDate: seed.examDate || '',
                examTime: seed.examTime || '',
                priority: seed.priority || 'high',
                status: seed.status || 'scheduled',
                notes: seed.notes || ''
            };
        }

        function createAcademicNotesTemplateRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                classId: seed.classId || '',
                title: seed.title || '',
                template: seed.template || 'Topic:\nSummary:\nKey concepts:\nQuestions:\nAction items:',
                updatedAt: seed.updatedAt || new Date().toISOString()
            };
        }

        function createAcademicFlashcardRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                deck: seed.deck || '',
                front: seed.front || '',
                back: seed.back || '',
                dueDate: seed.dueDate || '',
                reviewOutcome: seed.reviewOutcome || 'new',
                nextReviewDate: seed.nextReviewDate || '',
                intervalDays: normalizeFiniteNumber(seed.intervalDays, 1)
            };
        }

        function createAcademicExtracurricularRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                role: seed.role || '',
                meetingDate: seed.meetingDate || '',
                status: seed.status || 'active',
                notes: seed.notes || ''
            };
        }

        function getDefaultAcademicWorkspace() {
            return {
                onboardingSeeded: true,
                filters: {
                    status: 'all',
                    className: 'all',
                    priority: 'all',
                    sortBy: 'dueDate',
                    sortDirection: 'asc'
                },
                classes: [],
                assignments: [
                    createAcademicAssignmentRow({
                        title: 'Calc problem set 6',
                        className: 'AP Calculus',
                        dueDate: offsetDateKey(3),
                        priority: 'high',
                        status: 'in_progress',
                        notes: 'Focus on implicit differentiation.'
                    }),
                    createAcademicAssignmentRow({
                        title: 'History primary source notes',
                        className: 'US History',
                        dueDate: offsetDateKey(5),
                        priority: 'medium',
                        status: 'not_started',
                        notes: 'Summarize 3 main arguments.'
                    })
                ],
                exams: [
                    createAcademicExamRow({
                        title: 'AP Calculus Quiz',
                        className: 'AP Calculus',
                        examDate: offsetDateKey(6),
                        examTime: '10:30',
                        priority: 'high',
                        status: 'scheduled',
                        notes: 'Covers limits + derivatives.'
                    })
                ],
                notesTemplates: [],
                flashcards: [],
                extracurriculars: [
                    createAcademicExtracurricularRow({
                        name: 'Debate Club',
                        role: 'Research lead',
                        meetingDate: offsetDateKey(1),
                        status: 'active',
                        notes: 'Prep evidence packets.'
                    })
                ]
            };
        }

        function normalizeAcademicWorkspace(data) {
            const defaults = getDefaultAcademicWorkspace();
            const source = data && typeof data === 'object' ? data : {};
            const normalized = {
                ...defaults,
                ...source
            };
            normalized.filters = {
                ...defaults.filters,
                ...(source.filters && typeof source.filters === 'object' ? source.filters : {})
            };
            normalized.classes = Array.isArray(source.classes)
                ? source.classes.map(row => createAcademicClassRow(row))
                : defaults.classes;
            normalized.assignments = Array.isArray(source.assignments)
                ? source.assignments.map(row => createAcademicAssignmentRow(row))
                : defaults.assignments;
            normalized.exams = Array.isArray(source.exams)
                ? source.exams.map(row => createAcademicExamRow(row))
                : defaults.exams;
            normalized.notesTemplates = Array.isArray(source.notesTemplates)
                ? source.notesTemplates.map(row => createAcademicNotesTemplateRow(row))
                : defaults.notesTemplates;
            normalized.flashcards = Array.isArray(source.flashcards)
                ? source.flashcards.map(row => createAcademicFlashcardRow(row))
                : defaults.flashcards;
            normalized.extracurriculars = Array.isArray(source.extracurriculars)
                ? source.extracurriculars.map(row => createAcademicExtracurricularRow(row))
                : defaults.extracurriculars;
            normalized.assignments = normalized.assignments.map(row => {
                const className = String(row.className || '').trim();
                if (className) return row;
                const legacyClassName = row.classId ? getAcademicClassNameFromRows(normalized.classes, row.classId) : '';
                return { ...row, className: legacyClassName || '' };
            });
            normalized.exams = normalized.exams.map(row => {
                const className = String(row.className || '').trim();
                if (className) return row;
                const legacyClassName = row.classId ? getAcademicClassNameFromRows(normalized.classes, row.classId) : '';
                return { ...row, className: legacyClassName || '' };
            });
            const legacyFilterClassId = source && source.filters && source.filters.classId ? String(source.filters.classId) : '';
            const legacyFilterClassName = legacyFilterClassId && legacyFilterClassId !== 'all'
                ? getAcademicClassNameFromRows(normalized.classes, legacyFilterClassId)
                : '';
            normalized.filters.className = String(normalized.filters.className || legacyFilterClassName || 'all');
            delete normalized.filters.classId;
            delete normalized.studyDashboard;
            return normalized;
        }

        function createCollegeAppTrackerRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                school: seed.school || '',
                deadline: seed.deadline || '',
                status: seed.status || 'planning',
                checklist: seed.checklist || ''
            };
        }

        function createCollegeEssayRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                school: seed.school || '',
                prompt: seed.prompt || '',
                draftStatus: seed.draftStatus || 'brainstorming',
                versionNotes: seed.versionNotes || '',
                dueDate: seed.dueDate || ''
            };
        }

        function createCollegeScoreRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                testType: seed.testType || 'SAT',
                testDate: seed.testDate || '',
                totalScore: seed.totalScore || '',
                breakdown: seed.breakdown || ''
            };
        }

        function createCollegeAwardRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                title: seed.title || '',
                level: seed.level || '',
                date: seed.date || '',
                description: seed.description || ''
            };
        }

        function createCollegeScholarshipRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                amount: seed.amount || '',
                deadline: seed.deadline || '',
                status: seed.status || 'researching',
                notes: seed.notes || ''
            };
        }

        function createDecisionCriterionRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                weight: Math.max(0, normalizeFiniteNumber(seed.weight, 1))
            };
        }

        function createDecisionCollegeRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                scores: seed.scores && typeof seed.scores === 'object' ? seed.scores : {}
            };
        }

        function getDefaultCollegeAppWorkspace() {
            const criterionFit = createDecisionCriterionRow({ name: 'Program fit', weight: 4 });
            const criterionCost = createDecisionCriterionRow({ name: 'Affordability', weight: 5 });
            const criterionCampus = createDecisionCriterionRow({ name: 'Campus life', weight: 2 });
            const criterionLocation = createDecisionCriterionRow({ name: 'Location', weight: 3 });
            const criterionAid = createDecisionCriterionRow({ name: 'Financial aid', weight: 4 });
            const criterionPrestige = createDecisionCriterionRow({ name: 'Prestige / Reputation', weight: 3 });
            const criterionCareer = createDecisionCriterionRow({ name: 'Career outcomes', weight: 4 });
            const criterionSize = createDecisionCriterionRow({ name: 'Class size', weight: 2 });
            const criterionResearch = createDecisionCriterionRow({ name: 'Research opportunities', weight: 3 });
            const criterionDiversity = createDecisionCriterionRow({ name: 'Diversity & inclusion', weight: 2 });
            const northwood = createDecisionCollegeRow({
                name: 'Northwood University',
                scores: {
                    [criterionFit.id]: 8,
                    [criterionCost.id]: 7,
                    [criterionCampus.id]: 6,
                    [criterionLocation.id]: 7,
                    [criterionAid.id]: 6,
                    [criterionPrestige.id]: 8,
                    [criterionCareer.id]: 8,
                    [criterionSize.id]: 5,
                    [criterionResearch.id]: 9,
                    [criterionDiversity.id]: 7
                }
            });
            const lakeview = createDecisionCollegeRow({
                name: 'Lakeview College',
                scores: {
                    [criterionFit.id]: 7,
                    [criterionCost.id]: 9,
                    [criterionCampus.id]: 8,
                    [criterionLocation.id]: 8,
                    [criterionAid.id]: 9,
                    [criterionPrestige.id]: 6,
                    [criterionCareer.id]: 7,
                    [criterionSize.id]: 8,
                    [criterionResearch.id]: 5,
                    [criterionDiversity.id]: 8
                }
            });
            return {
                onboardingSeeded: true,
                collegeTracker: [
                    createCollegeAppTrackerRow({
                        school: 'Northwood University',
                        deadline: offsetDateKey(21),
                        status: 'in_progress',
                        checklist: 'Create portal account\nRequest counselor recommendation\nSubmit FAFSA'
                    })
                ],
                essayOrganizer: [
                    createCollegeEssayRow({
                        school: 'Common App',
                        prompt: 'Discuss an accomplishment, event, or realization that sparked personal growth.',
                        draftStatus: 'drafting',
                        versionNotes: 'v1 focuses on robotics mentorship story.',
                        dueDate: offsetDateKey(14)
                    })
                ],
                scoreTracker: [
                    createCollegeScoreRow({
                        testType: 'SAT',
                        testDate: offsetDateKey(-20),
                        totalScore: '1480',
                        breakdown: 'Math 760 / RW 720'
                    })
                ],
                awardsHonors: [
                    createCollegeAwardRow({
                        title: 'National Merit Commended',
                        level: 'National',
                        date: offsetDateKey(-120),
                        description: 'Recognition based on PSAT score.'
                    })
                ],
                scholarships: [
                    createCollegeScholarshipRow({
                        name: 'STEM Leaders Scholarship',
                        amount: '2500',
                        deadline: offsetDateKey(28),
                        status: 'applying',
                        notes: 'Need recommendation + short essay.'
                    })
                ],
                decisionMatrix: {
                    criteria: [criterionFit, criterionCost, criterionCampus, criterionLocation, criterionAid, criterionPrestige, criterionCareer, criterionSize, criterionResearch, criterionDiversity],
                    colleges: [northwood, lakeview]
                }
            };
        }

        function normalizeCollegeAppWorkspace(data) {
            const defaults = getDefaultCollegeAppWorkspace();
            const source = data && typeof data === 'object' ? data : {};
            const normalized = {
                ...defaults,
                ...source
            };
            normalized.collegeTracker = Array.isArray(source.collegeTracker)
                ? source.collegeTracker.map(row => createCollegeAppTrackerRow(row))
                : defaults.collegeTracker;
            normalized.essayOrganizer = Array.isArray(source.essayOrganizer)
                ? source.essayOrganizer.map(row => createCollegeEssayRow(row))
                : defaults.essayOrganizer;
            normalized.scoreTracker = Array.isArray(source.scoreTracker)
                ? source.scoreTracker.map(row => createCollegeScoreRow(row))
                : defaults.scoreTracker;
            normalized.awardsHonors = Array.isArray(source.awardsHonors)
                ? source.awardsHonors.map(row => createCollegeAwardRow(row))
                : defaults.awardsHonors;
            normalized.scholarships = Array.isArray(source.scholarships)
                ? source.scholarships.map(row => createCollegeScholarshipRow(row))
                : defaults.scholarships;
            const sourceMatrix = source.decisionMatrix && typeof source.decisionMatrix === 'object' ? source.decisionMatrix : {};
            normalized.decisionMatrix = {
                criteria: Array.isArray(sourceMatrix.criteria)
                    ? sourceMatrix.criteria.map(row => createDecisionCriterionRow(row))
                    : defaults.decisionMatrix.criteria,
                colleges: Array.isArray(sourceMatrix.colleges)
                    ? sourceMatrix.colleges.map(row => createDecisionCollegeRow(row))
                    : defaults.decisionMatrix.colleges
            };
            normalized.decisionMatrix.colleges = normalized.decisionMatrix.colleges.map(college => {
                const scores = {};
                Object.entries(college.scores || {}).forEach(([criterionId, value]) => {
                    scores[criterionId] = Math.max(0, Math.min(10, normalizeFiniteNumber(value, 0)));
                });
                return { ...college, scores };
            });
            return normalized;
        }

        function createLifeGoalRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                title: seed.title || '',
                specific: seed.specific || '',
                measurable: seed.measurable || '',
                achievable: seed.achievable || '',
                relevant: seed.relevant || '',
                timeBound: seed.timeBound || '',
                targetDate: seed.targetDate || '',
                progress: Math.max(0, Math.min(100, normalizeFiniteNumber(seed.progress, 0)))
            };
        }

        function createLifeHabitRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                category: seed.category || '',
                targetPerWeek: Math.max(1, Math.min(14, Math.floor(normalizeFiniteNumber(seed.targetPerWeek, 7))))
            };
        }

        function createLifeSkillRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                name: seed.name || '',
                level: seed.level || 'beginner',
                hoursInvested: Math.max(0, normalizeFiniteNumber(seed.hoursInvested, 0)),
                nextMilestone: seed.nextMilestone || '',
                status: seed.status || 'active'
            };
        }

        function createLifeFitnessRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                date: seed.date || '',
                activity: seed.activity || '',
                durationMinutes: Math.max(0, normalizeFiniteNumber(seed.durationMinutes, 0)),
                intensity: seed.intensity || 'moderate',
                notes: seed.notes || ''
            };
        }

        function createLifeBookRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                title: seed.title || '',
                author: seed.author || '',
                status: seed.status || 'reading',
                pagesRead: Math.max(0, Math.floor(normalizeFiniteNumber(seed.pagesRead, 0))),
                totalPages: Math.max(0, Math.floor(normalizeFiniteNumber(seed.totalPages, 0))),
                rating: Math.max(0, Math.min(5, normalizeFiniteNumber(seed.rating, 0)))
            };
        }

        function createLifeSpendingRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                date: seed.date || '',
                category: seed.category || '',
                amount: normalizeFiniteNumber(seed.amount, 0),
                note: seed.note || ''
            };
        }

        function createLifeJournalRow(seed = {}) {
            return {
                id: seed.id || generateId(),
                date: seed.date || '',
                title: seed.title || '',
                mood: seed.mood || '',
                content: seed.content || ''
            };
        }

        function getDefaultLifeWorkspace() {
            const defaultHabitId = generateId();
            return {
                onboardingSeeded: true,
                goals: [
                    createLifeGoalRow({
                        title: 'Build a weekly review habit',
                        specific: 'Run a 30-minute Sunday reflection.',
                        measurable: 'Complete 4 reflections each month.',
                        achievable: 'Schedule reminder in calendar.',
                        relevant: 'Keeps school + personal priorities aligned.',
                        timeBound: 'Complete by end of semester.',
                        targetDate: offsetDateKey(45),
                        progress: 20
                    })
                ],
                habits: [
                    createLifeHabitRow({
                        id: defaultHabitId,
                        name: 'Read 20 minutes',
                        category: 'Learning',
                        targetPerWeek: 7
                    })
                ],
                habitCompletions: {
                    [offsetDateKey(0)]: [defaultHabitId]
                },
                skills: [
                    createLifeSkillRow({
                        name: 'Public speaking',
                        level: 'intermediate',
                        hoursInvested: 16,
                        nextMilestone: 'Lead next debate prep workshop.',
                        status: 'active'
                    })
                ],
                fitness: [
                    createLifeFitnessRow({
                        date: offsetDateKey(-1),
                        activity: 'Run',
                        durationMinutes: 30,
                        intensity: 'moderate',
                        notes: 'Steady pace, felt good.'
                    })
                ],
                books: [
                    createLifeBookRow({
                        title: 'Atomic Habits',
                        author: 'James Clear',
                        status: 'reading',
                        pagesRead: 72,
                        totalPages: 320,
                        rating: 4
                    })
                ],
                spending: [
                    createLifeSpendingRow({
                        date: offsetDateKey(0),
                        category: 'Food',
                        amount: 12.5,
                        note: 'Lunch after class'
                    })
                ],
                journals: [
                    createLifeJournalRow({
                        date: offsetDateKey(0),
                        title: `Journal ${offsetDateKey(0)}`,
                        mood: 'Focused',
                        content: 'Today I made progress on my weekly priorities.'
                    })
                ]
            };
        }

        function normalizeLifeWorkspace(data) {
            const defaults = getDefaultLifeWorkspace();
            const source = data && typeof data === 'object' ? data : {};
            const normalized = {
                ...defaults,
                ...source
            };
            normalized.goals = Array.isArray(source.goals)
                ? source.goals.map(row => createLifeGoalRow(row))
                : defaults.goals;
            normalized.habits = Array.isArray(source.habits)
                ? source.habits.map(row => createLifeHabitRow(row))
                : defaults.habits;
            normalized.habitCompletions = source.habitCompletions && typeof source.habitCompletions === 'object'
                ? source.habitCompletions
                : defaults.habitCompletions;
            normalized.skills = Array.isArray(source.skills)
                ? source.skills.map(row => createLifeSkillRow(row))
                : defaults.skills;
            normalized.fitness = Array.isArray(source.fitness)
                ? source.fitness.map(row => createLifeFitnessRow(row))
                : defaults.fitness;
            normalized.books = Array.isArray(source.books)
                ? source.books.map(row => createLifeBookRow(row))
                : defaults.books;
            normalized.spending = Array.isArray(source.spending)
                ? source.spending.map(row => createLifeSpendingRow(row))
                : defaults.spending;
            normalized.journals = Array.isArray(source.journals)
                ? source.journals.map(row => createLifeJournalRow(row))
                : defaults.journals;
            return normalized;
        }

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
                habitTracker: {
                    habits: [],
                    dayStates: {}
                },
                collegeTracker: getDefaultCollegeTracker(),
                academicWorkspace: getDefaultAcademicWorkspace(),
                collegeAppWorkspace: getDefaultCollegeAppWorkspace(),
                lifeWorkspace: getDefaultLifeWorkspace(),
                settings: {
                    theme: 'light',
                    motionEnabled: true,
                    quickAppLaunchersEnabled: false,
                    sidebarCollapsed: false,
                    enabledViews: getDefaultEnabledViews(),
                    featureSelectionCompleted: false,
                    taskOrderStrategy: 'urgent_first',
                    timeFormat: '12',
                    showSeconds: true,
                    timelineViewDate: null,
                    timelineViewMode: 'day',
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
                        running: false,
                        endsAtMs: null,
                        ringtone: 'classic',
                        volume: 0.6
                    },
                    soundEnabled: true,
                    hapticEnabled: true,
                    tutorialSeen: false,
                    tutorialCompleted: false,
                    tutorialCompletedAt: null,
                    drive: {
                        clientId: '',
                        apiKey: ''
                    },
                    googleCalendar: {
                        enabled: false,
                        autoSync: true,
                        calendarId: 'primary',
                        syncIntervalMinutes: 5,
                        lastSyncedAt: null
                    }
                },
                ui: {
                    favoritePageId: null,
                    defaultPageId: null,
                    lastActiveView: 'today'
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

        async function flushAppSaveNow() {
            if (pendingAppSave) {
                clearTimeout(pendingAppSave);
                pendingAppSave = null;
            }
            if (!appData) return;
            await writeAppData(appData);
        }

        function mergeAppDataDefaults(stored) {
            const defaults = getDefaultAppData();
            const merged = { ...defaults, ...stored };
            const storedSettings = stored && stored.settings ? stored.settings : {};
            merged.settings = { ...defaults.settings, ...storedSettings };
            merged.settings.font = { ...defaults.settings.font, ...(stored && stored.settings && stored.settings.font ? stored.settings.font : {}) };
            merged.settings.drive = { ...defaults.settings.drive, ...(stored && stored.settings && stored.settings.drive ? stored.settings.drive : {}) };
            merged.settings.googleCalendar = normalizeGoogleCalendarSettings({ ...defaults.settings.googleCalendar, ...(stored && stored.settings && stored.settings.googleCalendar ? stored.settings.googleCalendar : {}) });
            merged.settings.focusTimer = { ...defaults.settings.focusTimer, ...(stored && stored.settings && stored.settings.focusTimer ? stored.settings.focusTimer : {}) };
            merged.settings.enabledViews = normalizeEnabledViews(storedSettings.enabledViews);
            if (stored && stored.settings && !Object.prototype.hasOwnProperty.call(stored.settings, 'featureSelectionCompleted')) {
                merged.settings.featureSelectionCompleted = true;
            }
            merged.ui = { ...defaults.ui, ...(stored && stored.ui ? stored.ui : {}) };
            merged.streaks = { ...defaults.streaks, ...(stored && stored.streaks ? stored.streaks : {}) };
            merged.streaks.dayStates = (stored && stored.streaks && stored.streaks.dayStates) || stored.dayStates || defaults.streaks.dayStates;
            merged.streaks.taskStreaks = (stored && stored.streaks && stored.streaks.taskStreaks) || stored.taskStreaks || defaults.streaks.taskStreaks;
            merged.streaks.streakState = { ...defaults.streaks.streakState, ...((stored && stored.streaks && stored.streaks.streakState) || stored.streakState || {}) };
            merged.habitTracker = { ...defaults.habitTracker, ...(stored && stored.habitTracker ? stored.habitTracker : {}) };
            merged.habitTracker.habits = Array.isArray(merged.habitTracker.habits) ? merged.habitTracker.habits : [];
            merged.habitTracker.dayStates = merged.habitTracker.dayStates || {};
            merged.collegeTracker = normalizeCollegeTracker(stored && stored.collegeTracker ? stored.collegeTracker : defaults.collegeTracker);
            merged.academicWorkspace = normalizeAcademicWorkspace(stored && stored.academicWorkspace ? stored.academicWorkspace : defaults.academicWorkspace);
            merged.collegeAppWorkspace = normalizeCollegeAppWorkspace(stored && stored.collegeAppWorkspace ? stored.collegeAppWorkspace : defaults.collegeAppWorkspace);
            merged.lifeWorkspace = normalizeLifeWorkspace(stored && stored.lifeWorkspace ? stored.lifeWorkspace : defaults.lifeWorkspace);
            const mergedLastView = String(merged.ui.lastActiveView || '').trim();
            merged.ui.lastActiveView = (mergedLastView === 'settings' || OPTIONAL_FEATURE_VIEWS.includes(mergedLastView))
                ? mergedLastView
                : defaults.ui.lastActiveView;
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
                const legacyKeys = [
                    'noteflow_pages',
                    'noteflow_theme_settings',
                    'noteflow_font_settings',
                    'noteflow_animations',
                    'noteflow_sidebar_collapsed',
                    'noteflow_favorite_page',
                    'noteflow_default_page',
                    'noteflow_todos',
                    'streakApp:v1',
                    'streakApp:settings',
                    'hwCourses:v2',
                    'hwTasks:v2',
                    'homeworkCourses:v1',
                    'homeworkTasks:v1'
                ];
                const hasLegacyStorage = legacyKeys.some(key => localStorage.getItem(key) !== null);
                if (hasLegacyStorage) {
                    data.settings.featureSelectionCompleted = true;
                }
            } catch (e) {
                console.warn('Unable to inspect legacy storage keys', e);
            }

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
                        priority: normalizePriorityValue(todo.priority),
                        difficulty: normalizeDifficultyValue(todo.difficulty),
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
                        data.tasks.push({
                            ...task,
                            noteId: task.noteId || null,
                            origin: task.origin || 'streak',
                            priority: normalizePriorityValue(task.priority),
                            difficulty: normalizeDifficultyValue(task.difficulty)
                        });
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
            tasks = Array.isArray(appData.tasks)
                ? appData.tasks.map(task => ({
                    ...task,
                    priority: normalizePriorityValue(task.priority),
                    difficulty: normalizeDifficultyValue(task.difficulty)
                }))
                : [];
            taskOrder = Array.isArray(appData.taskOrder) ? appData.taskOrder : tasks.map(task => task.id);

            const defaultStreaks = getDefaultStreaks();
            const storedStreaks = appData.streaks || defaultStreaks;
            dayStates = storedStreaks.dayStates || {};
            taskStreaks = storedStreaks.taskStreaks || {};
            streakState = { ...defaultStreaks.streakState, ...(storedStreaks.streakState || {}) };
            const defaultHabits = getDefaultAppData().habitTracker;
            const storedHabits = appData.habitTracker || defaultHabits;
            habits = Array.isArray(storedHabits.habits) ? storedHabits.habits : [];
            habitDayStates = storedHabits.dayStates || {};
            collegeTracker = normalizeCollegeTracker(appData.collegeTracker);
            academicWorkspace = normalizeAcademicWorkspace(appData.academicWorkspace);
            collegeAppWorkspace = normalizeCollegeAppWorkspace(appData.collegeAppWorkspace);
            lifeWorkspace = normalizeLifeWorkspace(appData.lifeWorkspace);

            const defaultSettings = getDefaultAppData().settings;
            const storedSettings = appData.settings || {};
            appSettings = { ...defaultSettings, ...storedSettings };
            appSettings.font = { ...defaultSettings.font, ...(appData.settings && appData.settings.font ? appData.settings.font : {}) };
            appSettings.drive = { ...defaultSettings.drive, ...(appData.settings && appData.settings.drive ? appData.settings.drive : {}) };
            appSettings.googleCalendar = normalizeGoogleCalendarSettings({ ...defaultSettings.googleCalendar, ...(appData.settings && appData.settings.googleCalendar ? appData.settings.googleCalendar : {}) });
            appSettings.focusTimer = { ...defaultSettings.focusTimer, ...(appData.settings && appData.settings.focusTimer ? appData.settings.focusTimer : {}) };
            appSettings.enabledViews = normalizeEnabledViews(storedSettings.enabledViews || appSettings.enabledViews);
            if (!Object.prototype.hasOwnProperty.call(storedSettings, 'featureSelectionCompleted')) {
                appSettings.featureSelectionCompleted = true;
            }
            appSettings.selectedPagesForTheme = appSettings.selectedPagesForTheme || [];

            const defaultUi = getDefaultAppData().ui;
            appData.ui = { ...defaultUi, ...(appData.ui || {}) };
            const lastView = String(appData.ui.lastActiveView || '').trim();
            const validLastView = (lastView === 'settings' || OPTIONAL_FEATURE_VIEWS.includes(lastView))
                ? lastView
                : defaultUi.lastActiveView;
            appData.ui.lastActiveView = validLastView;
            activeView = validLastView || defaultUi.lastActiveView;
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
            appData.habitTracker = {
                habits,
                dayStates: habitDayStates
            };
            appData.collegeTracker = collegeTracker;
            appData.academicWorkspace = academicWorkspace;
            appData.collegeAppWorkspace = collegeAppWorkspace;
            appData.lifeWorkspace = lifeWorkspace;
            appData.settings = appSettings;
            if (!appData.ui) appData.ui = { ...getDefaultAppData().ui };
            appData.ui.lastActiveView = activeView;
            scheduleAppSave();
        }

        // Application State
        let pages = [];
        let currentPageId = null;
        let pageToRenameId = null; // For rename functionality
        let isGoogleSignedIn = false;
        let googleCalendarSyncTimer = null;
        let googleCalendarSyncInFlight = false;
        let themeApplyMode = 'current'; // 'current', 'all', 'custom'
        let selectedPagesForTheme = [];
        let globalTheme = 'default';
        let tasks = [];
        let taskOrder = [];
        let dayStates = {};
        let taskStreaks = {};
        let streakState = getDefaultStreaks().streakState;
        let habits = [];
        let habitDayStates = {};
        let collegeTracker = getDefaultCollegeTracker();
        let academicWorkspace = getDefaultAcademicWorkspace();
        let collegeAppWorkspace = getDefaultCollegeAppWorkspace();
        let lifeWorkspace = getDefaultLifeWorkspace();
        let appSettings = getDefaultAppData().settings;
        let activeView = 'today';
        let searchQuery = '';
        let searchForceExpanded = false;
        const HOMEWORK_STORAGE_KEYS = ['hwTasks:v2', 'hwCourses:v2', 'homeworkTasks:v1', 'homeworkCourses:v1'];
        let homeworkSyncBound = false;
        let tutorialRepositionTimer = null;
        const tutorialState = {
            active: false,
            stepIndex: 0,
            steps: [],
            openedThemePanel: false
        };
        const completionCelebrationState = {
            dayKey: null,
            tasksAllDone: null,
            habitsAllDone: null
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

    // No hard limit on commits per day -- allow unlimited commits
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

        // -------------------- College Tracker --------------------
        function getCollegeRows(sheetKey) {
            if (!collegeTracker || typeof collegeTracker !== 'object') {
                collegeTracker = getDefaultCollegeTracker();
            }
            if (!Array.isArray(collegeTracker[sheetKey])) {
                collegeTracker[sheetKey] = [];
            }
            return collegeTracker[sheetKey];
        }

        function setCollegeSummaryValue(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = String(value);
        }

        function parseCollegeDate(value) {
            const raw = String(value || '').trim();
            if (!raw) return null;
            const isoDate = /^\d{4}-\d{2}-\d{2}$/;
            const date = isoDate.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
            if (isNaN(date)) return null;
            date.setHours(0, 0, 0, 0);
            return date;
        }

        function countUpcomingCollegeDeadlines(daysAhead = 14) {
            const rows = getCollegeRows('deadlines');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cutoff = new Date(today);
            cutoff.setDate(cutoff.getDate() + Math.max(0, Number(daysAhead) || 0));

            return rows.filter(row => {
                if (row && row.submitted) return false;
                const due = parseCollegeDate(row && row.applicationDeadline);
                return !!(due && due >= today && due <= cutoff);
            }).length;
        }

        function renderCollegeSummary() {
            const researchRows = getCollegeRows('research');
            const checklistRows = getCollegeRows('checklist');
            const deadlineRows = getCollegeRows('deadlines');
            const essayRows = getCollegeRows('essays');

            const schools = new Set();
            [researchRows, checklistRows, deadlineRows].forEach(rows => {
                rows.forEach(row => {
                    const name = String(row && row.college ? row.college : '').trim();
                    if (name) schools.add(name.toLowerCase());
                });
            });

            const submittedApps = checklistRows.filter(row => !!(row && row.appSubmitted)).length;
            const acceptedCount = researchRows.filter(row => {
                const decision = String(row && row.decision ? row.decision : '').toLowerCase();
                return decision === 'accepted';
            }).length;
            const totalEssays = essayRows.filter(row => String(row && row.essay ? row.essay : '').trim()).length;
            const completedEssays = essayRows.filter(row => !!(row && row.finalDraft)).length;

            setCollegeSummaryValue('collegeSummarySchools', schools.size);
            setCollegeSummaryValue('collegeSummarySubmitted', submittedApps);
            setCollegeSummaryValue('collegeSummaryUpcoming', countUpcomingCollegeDeadlines(14));
            setCollegeSummaryValue('collegeSummaryEssays', `${completedEssays}/${Math.max(totalEssays, 0)}`);
            setCollegeSummaryValue('collegeSummaryAcceptances', acceptedCount);
        }

        function renderCollegeTextInput(sheetKey, rowId, field, value, placeholder = '') {
            return `<input class="college-input" type="text" data-college-sheet="${sheetKey}" data-college-row-id="${rowId}" data-college-field="${field}" value="${escapeHtml(String(value || ''))}" placeholder="${escapeHtml(String(placeholder || ''))}" />`;
        }

        function renderCollegeDateInput(sheetKey, rowId, field, value) {
            return `<input class="college-input" type="date" data-college-sheet="${sheetKey}" data-college-row-id="${rowId}" data-college-field="${field}" value="${escapeHtml(String(value || ''))}" />`;
        }

        function renderCollegeCheckboxInput(sheetKey, rowId, field, checked) {
            return `<input class="college-checkbox-input" type="checkbox" data-college-sheet="${sheetKey}" data-college-row-id="${rowId}" data-college-field="${field}" ${checked ? 'checked' : ''} />`;
        }

        function renderCollegeTextareaInput(sheetKey, rowId, field, value, rows = 2) {
            return `<textarea class="college-textarea" rows="${rows}" data-college-sheet="${sheetKey}" data-college-row-id="${rowId}" data-college-field="${field}" placeholder="Add notes...">${escapeHtml(String(value || ''))}</textarea>`;
        }

        function renderCollegeSelectInput(sheetKey, rowId, field, value, options) {
            const optionMarkup = (Array.isArray(options) ? options : []).map(option => {
                const val = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                const selected = String(value || '') === String(val) ? 'selected' : '';
                return `<option value="${escapeHtml(String(val))}" ${selected}>${escapeHtml(String(label))}</option>`;
            }).join('');
            return `<select class="college-select" data-college-sheet="${sheetKey}" data-college-row-id="${rowId}" data-college-field="${field}">${optionMarkup}</select>`;
        }

        function renderCollegeDeleteButton(sheetKey, rowId) {
            return `<button type="button" class="icon-btn college-delete-row-btn" data-college-sheet="${sheetKey}" data-college-row-id="${rowId}" title="Delete row"><i class="fas fa-trash"></i></button>`;
        }

        function renderCollegeResearchRows() {
            const body = document.getElementById('collegeResearchTableBody');
            if (!body) return;
            const rows = getCollegeRows('research');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="14">No colleges yet. Use "+ Add Row" to start your list.</td></tr>';
                return;
            }

            body.innerHTML = rows.map(row => `
                <tr>
                    <td>${renderCollegeTextInput('research', row.id, 'college', row.college, 'Stanford')}</td>
                    <td>${renderCollegeSelectInput('research', row.id, 'decision', row.decision, [
                        { value: 'pending', label: 'Pending' },
                        { value: 'ed', label: 'ED' },
                        { value: 'ea', label: 'EA' },
                        { value: 'rd', label: 'RD' },
                        { value: 'accepted', label: 'Accepted' },
                        { value: 'waitlist', label: 'Waitlist' },
                        { value: 'rejected', label: 'Rejected' }
                    ])}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'system', row.system, 'UC / CSU / Common App')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'studentBody', row.studentBody, '32000')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'ratio', row.ratio, '18:1')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'city', row.city, 'City')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'avgGpa', row.avgGpa, '4.10-4.40')}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('research', row.id, 'testOptional', row.testOptional)}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'recommendation', row.recommendation, 'None / 1 / 2')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'likelihood', row.likelihood, 'Reach / Target / Safety')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'acceptanceRate', row.acceptanceRate, '11%')}</td>
                    <td>${renderCollegeTextInput('research', row.id, 'essays', row.essays, 'UC PIQ / Common App')}</td>
                    <td>${renderCollegeTextareaInput('research', row.id, 'notes', row.notes, 1)}</td>
                    <td class="college-row-actions">${renderCollegeDeleteButton('research', row.id)}</td>
                </tr>
            `).join('');
        }

        function renderCollegeChecklistRows() {
            const body = document.getElementById('collegeChecklistTableBody');
            if (!body) return;
            const rows = getCollegeRows('checklist');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="14">No checklist rows yet. Track application requirements here.</td></tr>';
                return;
            }

            const yesNoNaOptions = [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'na', label: 'N/A' }
            ];

            body.innerHTML = rows.map(row => `
                <tr>
                    <td>${renderCollegeTextInput('checklist', row.id, 'college', row.college, 'College')}</td>
                    <td>${renderCollegeSelectInput('checklist', row.id, 'commonApp', row.commonApp, yesNoNaOptions)}</td>
                    <td>${renderCollegeSelectInput('checklist', row.id, 'transcript', row.transcript, yesNoNaOptions)}</td>
                    <td>${renderCollegeSelectInput('checklist', row.id, 'counselorLetter', row.counselorLetter, yesNoNaOptions)}</td>
                    <td>${renderCollegeTextInput('checklist', row.id, 'teacherLetters', row.teacherLetters, '0 / 1 / 2')}</td>
                    <td>${renderCollegeSelectInput('checklist', row.id, 'cssProfile', row.cssProfile, yesNoNaOptions)}</td>
                    <td>${renderCollegeDateInput('checklist', row.id, 'earlyDeadline', row.earlyDeadline)}</td>
                    <td>${renderCollegeDateInput('checklist', row.id, 'regularDeadline', row.regularDeadline)}</td>
                    <td>${renderCollegeDateInput('checklist', row.id, 'fafsaDeadline', row.fafsaDeadline)}</td>
                    <td>${renderCollegeDateInput('checklist', row.id, 'cssDeadline', row.cssDeadline)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('checklist', row.id, 'appSubmitted', row.appSubmitted)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('checklist', row.id, 'transcriptSubmitted', row.transcriptSubmitted)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('checklist', row.id, 'recommendationsSubmitted', row.recommendationsSubmitted)}</td>
                    <td class="college-row-actions">${renderCollegeDeleteButton('checklist', row.id)}</td>
                </tr>
            `).join('');
        }

        function renderCollegeDeadlineRows() {
            const body = document.getElementById('collegeDeadlinesTableBody');
            if (!body) return;
            const rows = getCollegeRows('deadlines');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="8">No deadlines yet. Add each college deadline and mark submitted when done.</td></tr>';
                return;
            }

            body.innerHTML = rows.map(row => `
                <tr>
                    <td>${renderCollegeTextInput('deadlines', row.id, 'college', row.college, 'College')}</td>
                    <td>${renderCollegeDateInput('deadlines', row.id, 'essaysDoneBy', row.essaysDoneBy)}</td>
                    <td>${renderCollegeDateInput('deadlines', row.id, 'submitBy', row.submitBy)}</td>
                    <td>${renderCollegeDateInput('deadlines', row.id, 'applicationDeadline', row.applicationDeadline)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('deadlines', row.id, 'submitted', row.submitted)}</td>
                    <td>${renderCollegeDateInput('deadlines', row.id, 'decisionDate', row.decisionDate)}</td>
                    <td>${renderCollegeTextareaInput('deadlines', row.id, 'notes', row.notes, 1)}</td>
                    <td class="college-row-actions">${renderCollegeDeleteButton('deadlines', row.id)}</td>
                </tr>
            `).join('');
        }

        function renderCollegeEssayRows() {
            const body = document.getElementById('collegeEssayTableBody');
            if (!body) return;
            const rows = getCollegeRows('essays');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="12">No essay plan rows yet. Break every essay into draft and revision milestones.</td></tr>';
                return;
            }

            body.innerHTML = rows.map(row => `
                <tr>
                    <td>${renderCollegeTextInput('essays', row.id, 'essay', row.essay, 'UC PIQ #1')}</td>
                    <td>${renderCollegeDateInput('essays', row.id, 'firstDraftBy', row.firstDraftBy)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('essays', row.id, 'firstDraftDone', row.firstDraftDone)}</td>
                    <td>${renderCollegeDateInput('essays', row.id, 'reviewBy', row.reviewBy)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('essays', row.id, 'reviewSubmitted', row.reviewSubmitted)}</td>
                    <td>${renderCollegeDateInput('essays', row.id, 'revisionBy', row.revisionBy)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('essays', row.id, 'revisionSubmitted', row.revisionSubmitted)}</td>
                    <td>${renderCollegeDateInput('essays', row.id, 'finalBy', row.finalBy)}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('essays', row.id, 'finalDraft', row.finalDraft)}</td>
                    <td>${renderCollegeTextInput('essays', row.id, 'wordLimit', row.wordLimit, '350')}</td>
                    <td>${renderCollegeTextareaInput('essays', row.id, 'notes', row.notes, 1)}</td>
                    <td class="college-row-actions">${renderCollegeDeleteButton('essays', row.id)}</td>
                </tr>
            `).join('');
        }

        function renderCollegePromptRows() {
            const body = document.getElementById('collegePromptTableBody');
            if (!body) return;
            const rows = getCollegeRows('prompts');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No prompt bank entries yet. Add your Common App and school-specific prompts here.</td></tr>';
                return;
            }

            body.innerHTML = rows.map(row => `
                <tr>
                    <td>${renderCollegeTextInput('prompts', row.id, 'school', row.school, 'Common App / UC')}</td>
                    <td>${renderCollegeTextareaInput('prompts', row.id, 'prompt', row.prompt, 2)}</td>
                    <td>${renderCollegeTextInput('prompts', row.id, 'targetWords', row.targetWords, '650')}</td>
                    <td>${renderCollegeTextInput('prompts', row.id, 'draftPage', row.draftPage, 'Linked note/page')}</td>
                    <td class="college-cell-center">${renderCollegeCheckboxInput('prompts', row.id, 'completed', row.completed)}</td>
                    <td class="college-row-actions">${renderCollegeDeleteButton('prompts', row.id)}</td>
                </tr>
            `).join('');
        }

        function renderCollegeSheetRows(sheetKey) {
            if (sheetKey === 'research') renderCollegeResearchRows();
            if (sheetKey === 'checklist') renderCollegeChecklistRows();
            if (sheetKey === 'deadlines') renderCollegeDeadlineRows();
            if (sheetKey === 'essays') renderCollegeEssayRows();
            if (sheetKey === 'prompts') renderCollegePromptRows();
        }

        function applyCollegeTabState() {
            const activeTab = collegeTracker && COLLEGE_SHEET_KEYS.includes(collegeTracker.activeTab)
                ? collegeTracker.activeTab
                : 'research';
            document.querySelectorAll('[data-college-tab]').forEach(button => {
                button.classList.toggle('active', button.dataset.collegeTab === activeTab);
            });
            document.querySelectorAll('[data-college-panel]').forEach(panel => {
                panel.classList.toggle('active', panel.dataset.collegePanel === activeTab);
            });

            const addRowBtn = document.getElementById('collegeAddRowBtn');
            if (addRowBtn) {
                addRowBtn.dataset.collegeSheet = activeTab;
                const label = COLLEGE_SHEET_LABELS[activeTab] || 'Sheet';
                addRowBtn.innerHTML = `<i class="fas fa-plus"></i> Add ${escapeHtml(label)} Row`;
            }

            const clearBtn = document.getElementById('collegeClearSheetBtn');
            if (clearBtn) {
                clearBtn.dataset.collegeSheet = activeTab;
                const label = COLLEGE_SHEET_LABELS[activeTab] || 'Sheet';
                clearBtn.innerHTML = `<i class="fas fa-eraser"></i> Clear ${escapeHtml(label)}`;
            }
        }

        function setCollegeTab(tabKey, options = {}) {
            const shouldPersist = options.persist !== false;
            const nextTab = COLLEGE_SHEET_KEYS.includes(tabKey) ? tabKey : 'research';
            if (!collegeTracker || typeof collegeTracker !== 'object') {
                collegeTracker = getDefaultCollegeTracker();
            }
            collegeTracker.activeTab = nextTab;
            applyCollegeTabState();
            if (shouldPersist) persistAppData();
        }

        function addCollegeSheetRow(sheetKey) {
            const rows = getCollegeRows(sheetKey);
            rows.push(createCollegeTrackerRow(sheetKey));
            persistAppData();
            renderCollegeSheetRows(sheetKey);
            renderCollegeSummary();
        }

        function clearCollegeSheet(sheetKey) {
            const rows = getCollegeRows(sheetKey);
            if (!rows.length) {
                showToast('No rows to clear');
                return;
            }
            const label = COLLEGE_SHEET_LABELS[sheetKey] || 'Sheet';
            const confirmed = window.confirm(`Clear all rows from ${label}?`);
            if (!confirmed) return;
            collegeTracker[sheetKey] = [];
            persistAppData();
            renderCollegeSheetRows(sheetKey);
            renderCollegeSummary();
            showToast(`${label} cleared`);
        }

        function removeCollegeSheetRow(sheetKey, rowId) {
            const rows = getCollegeRows(sheetKey);
            const nextRows = rows.filter(row => String(row.id) !== String(rowId));
            if (nextRows.length === rows.length) return;
            collegeTracker[sheetKey] = nextRows;
            persistAppData();
            renderCollegeSheetRows(sheetKey);
            renderCollegeSummary();
        }

        function updateCollegeField(target) {
            if (!target || !target.dataset) return;
            const sheetKey = target.dataset.collegeSheet;
            const rowId = target.dataset.collegeRowId;
            const field = target.dataset.collegeField;
            if (!COLLEGE_SHEET_KEYS.includes(sheetKey) || !rowId || !field) return;

            const row = getCollegeRows(sheetKey).find(item => String(item.id) === String(rowId));
            if (!row) return;

            const isCheckbox = target.type === 'checkbox';
            row[field] = isCheckbox ? !!target.checked : target.value;
            persistAppData();
            renderCollegeSummary();
        }

        function renderCollegeTracker() {
            const root = document.getElementById('view-college');
            if (!root) return;
            collegeTracker = normalizeCollegeTracker(collegeTracker);
            applyCollegeTabState();
            COLLEGE_SHEET_KEYS.forEach(renderCollegeSheetRows);
            renderCollegeSummary();
        }

        function initCollegeTrackerUI() {
            const root = document.getElementById('view-college');
            if (!root) return;
            if (root.dataset.bound === 'true') {
                renderCollegeTracker();
                return;
            }
            root.dataset.bound = 'true';

            root.querySelectorAll('[data-college-tab]').forEach(button => {
                button.addEventListener('click', () => {
                    setCollegeTab(button.dataset.collegeTab);
                });
            });

            const addRowBtn = document.getElementById('collegeAddRowBtn');
            if (addRowBtn) {
                addRowBtn.addEventListener('click', () => {
                    const sheetKey = addRowBtn.dataset.collegeSheet || (collegeTracker && collegeTracker.activeTab) || 'research';
                    if (!COLLEGE_SHEET_KEYS.includes(sheetKey)) return;
                    addCollegeSheetRow(sheetKey);
                });
            }

            const clearBtn = document.getElementById('collegeClearSheetBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    const sheetKey = clearBtn.dataset.collegeSheet || (collegeTracker && collegeTracker.activeTab) || 'research';
                    if (!COLLEGE_SHEET_KEYS.includes(sheetKey)) return;
                    clearCollegeSheet(sheetKey);
                });
            }

            root.addEventListener('click', (event) => {
                const deleteBtn = event.target.closest('.college-delete-row-btn');
                if (deleteBtn) {
                    removeCollegeSheetRow(deleteBtn.dataset.collegeSheet, deleteBtn.dataset.collegeRowId);
                }
            });

            const handleFieldChange = (event) => {
                const fieldEl = event.target.closest('[data-college-field]');
                if (!fieldEl) return;
                updateCollegeField(fieldEl);
            };
            root.addEventListener('input', handleFieldChange);
            root.addEventListener('change', handleFieldChange);

            renderCollegeTracker();
        }
        // ------------------ end College Tracker ------------------

        // -------------------- Academic Workspace --------------------
        function getAcademicCollectionRows(collectionKey) {
            if (!academicWorkspace || typeof academicWorkspace !== 'object') {
                academicWorkspace = getDefaultAcademicWorkspace();
            }
            if (!Array.isArray(academicWorkspace[collectionKey])) {
                academicWorkspace[collectionKey] = [];
            }
            return academicWorkspace[collectionKey];
        }

        function getAcademicClassNameFromRows(rows, classId) {
            const rowList = Array.isArray(rows) ? rows : [];
            const row = rowList.find(item => String(item.id) === String(classId));
            return row ? String(row.name || '') : '';
        }

        function getAcademicClassNameById(classId) {
            const classes = getAcademicCollectionRows('classes');
            return getAcademicClassNameFromRows(classes, classId);
        }

        function resolveAcademicClassName(row) {
            if (!row || typeof row !== 'object') return '';
            const explicit = String(row.className || '').trim();
            if (explicit) return explicit;
            if (!row.classId) return '';
            return String(getAcademicClassNameById(row.classId) || '').trim();
        }

        function normalizeAcademicFilters() {
            const defaults = {
                status: 'all',
                className: 'all',
                priority: 'all',
                sortBy: 'dueDate',
                sortDirection: 'asc'
            };
            academicWorkspace.filters = {
                ...defaults,
                ...(academicWorkspace && academicWorkspace.filters && typeof academicWorkspace.filters === 'object'
                    ? academicWorkspace.filters
                    : {})
            };
            if (!academicWorkspace.filters.className) {
                academicWorkspace.filters.className = 'all';
            }
            return academicWorkspace.filters;
        }

        function parseComparableDate(value) {
            const raw = String(value || '').trim();
            if (!raw) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return parseDate(raw);
            const parsed = new Date(raw);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        function rankPriority(priority) {
            const normalized = String(priority || '').toLowerCase();
            if (normalized === 'high') return 0;
            if (normalized === 'medium') return 1;
            if (normalized === 'low') return 2;
            return 3;
        }

        function getAcademicCollectionKeyFromDeadlineType(type) {
            return String(type || '').toLowerCase() === 'exam' ? 'exams' : 'assignments';
        }

        function getAcademicStatusOptions(collectionKey) {
            if (collectionKey === 'assignments') {
                return [
                    { value: 'not_started', label: 'Not Started' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'done', label: 'Done' }
                ];
            }
            if (collectionKey === 'exams') {
                return [
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'studying', label: 'Studying' },
                    { value: 'completed', label: 'Completed' }
                ];
            }
            return [
                { value: 'active', label: 'Active' },
                { value: 'planned', label: 'Planned' },
                { value: 'paused', label: 'Paused' }
            ];
        }

        function getAcademicDefaultStatus(collectionKey) {
            const options = getAcademicStatusOptions(collectionKey);
            return options.length ? options[0].value : '';
        }

        function buildAcademicStatusOptionsHtml(collectionKey, selectedValue) {
            const selected = String(selectedValue || '');
            return getAcademicStatusOptions(collectionKey).map(option => `
                <option value="${escapeHtml(option.value)}" ${selected === option.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>
            `).join('');
        }

        function normalizeAcademicStatusForCollection(collectionKey, status) {
            const raw = String(status || '');
            const options = getAcademicStatusOptions(collectionKey);
            return options.some(option => option.value === raw) ? raw : getAcademicDefaultStatus(collectionKey);
        }

        function mapAssignmentStatusToExam(status) {
            if (status === 'done') return 'completed';
            if (status === 'in_progress') return 'studying';
            return 'scheduled';
        }

        function mapExamStatusToAssignment(status) {
            if (status === 'completed') return 'done';
            if (status === 'studying') return 'in_progress';
            return 'not_started';
        }

        function getAcademicDeadlineRows() {
            const assignmentRows = getAcademicCollectionRows('assignments').map(row => ({
                key: `assignments:${String(row.id)}`,
                rowId: String(row.id),
                collection: 'assignments',
                type: 'assignment',
                title: String(row.title || ''),
                className: String(resolveAcademicClassName(row) || ''),
                date: String(row.dueDate || ''),
                time: '',
                priority: String(row.priority || 'medium'),
                status: normalizeAcademicStatusForCollection('assignments', row.status),
                notes: String(row.notes || ''),
                dateField: 'dueDate'
            }));
            const examRows = getAcademicCollectionRows('exams').map(row => ({
                key: `exams:${String(row.id)}`,
                rowId: String(row.id),
                collection: 'exams',
                type: 'exam',
                title: String(row.title || ''),
                className: String(resolveAcademicClassName(row) || ''),
                date: String(row.examDate || ''),
                time: String(row.examTime || ''),
                priority: String(row.priority || 'high'),
                status: normalizeAcademicStatusForCollection('exams', row.status),
                notes: String(row.notes || ''),
                dateField: 'examDate'
            }));
            return assignmentRows.concat(examRows);
        }

        function compareAcademicDeadlineRows(a, b, filters) {
            const sortBy = filters.sortBy || 'dueDate';
            const direction = filters.sortDirection === 'desc' ? -1 : 1;
            if (sortBy === 'priority') {
                return (rankPriority(a.priority) - rankPriority(b.priority)) * direction;
            }
            if (sortBy === 'class') {
                return String(a.className || '').toLowerCase().localeCompare(String(b.className || '').toLowerCase()) * direction;
            }
            if (sortBy === 'status') {
                return String(a.status || '').localeCompare(String(b.status || '')) * direction;
            }
            const dateA = parseComparableDate(a.date);
            const dateB = parseComparableDate(b.date);
            const tsA = dateA ? dateA.getTime() : Number.MAX_SAFE_INTEGER;
            const tsB = dateB ? dateB.getTime() : Number.MAX_SAFE_INTEGER;
            if (tsA !== tsB) return (tsA - tsB) * direction;
            return String(a.title || '').localeCompare(String(b.title || '')) * direction;
        }

        function getAcademicFilteredDeadlines() {
            const filters = normalizeAcademicFilters();
            return getAcademicDeadlineRows()
                .filter(row => filters.status === 'all' || String(row.status || '') === String(filters.status))
                .filter(row => filters.className === 'all' || String(row.className || '') === String(filters.className))
                .filter(row => filters.priority === 'all' || String(row.priority || '') === String(filters.priority))
                .sort((a, b) => compareAcademicDeadlineRows(a, b, filters));
        }

        function getAcademicUpcomingDeadlines(daysAhead = 7) {
            const items = [];
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(end.getDate() + Number(daysAhead || 0));

            getAcademicCollectionRows('assignments').forEach(row => {
                const due = parseComparableDate(row.dueDate);
                if (!due || due < now || due > end) return;
                items.push({
                    kind: 'Assignment',
                    title: row.title || 'Untitled assignment',
                    className: resolveAcademicClassName(row),
                    dateKey: dateKey(due),
                    status: row.status || 'not_started'
                });
            });

            getAcademicCollectionRows('exams').forEach(row => {
                const due = parseComparableDate(row.examDate);
                if (!due || due < now || due > end) return;
                items.push({
                    kind: 'Exam',
                    title: row.title || 'Untitled exam',
                    className: resolveAcademicClassName(row),
                    dateKey: dateKey(due),
                    status: row.status || 'scheduled'
                });
            });

            getAcademicCollectionRows('extracurriculars').forEach(row => {
                const meeting = parseComparableDate(row.meetingDate);
                if (!meeting || meeting < now || meeting > end) return;
                items.push({
                    kind: 'Activity',
                    title: row.name || 'Extracurricular',
                    className: '',
                    dateKey: dateKey(meeting),
                    status: row.status || 'active'
                });
            });

            return items.sort((a, b) => {
                const da = parseComparableDate(a.dateKey);
                const db = parseComparableDate(b.dateKey);
                const ta = da ? da.getTime() : Number.MAX_SAFE_INTEGER;
                const tb = db ? db.getTime() : Number.MAX_SAFE_INTEGER;
                if (ta !== tb) return ta - tb;
                return String(a.title || '').localeCompare(String(b.title || ''));
            });
        }

        function renderAcademicDeadlineRows() {
            const body = document.getElementById('todayAcademicDeadlineTableBody') || document.getElementById('academicDeadlineTableBody');
            if (!body) return;
            const rows = getAcademicFilteredDeadlines();
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="9">No assignments or exams match your filters. Add one to get started.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => {
                const statusOptions = buildAcademicStatusOptionsHtml(row.collection, row.status);
                const timeCell = row.collection === 'exams'
                    ? `<input type="time" class="college-input" data-academic-collection="exams" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="examTime" value="${escapeHtml(row.time)}">`
                    : '<input type="time" class="college-input" value="" disabled aria-label="Time not used for assignments">';
                return `
                    <tr>
                        <td>
                            <select class="college-select" data-academic-deadline-type="true" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}">
                                <option value="assignment" ${row.type === 'assignment' ? 'selected' : ''}>Assignment</option>
                                <option value="exam" ${row.type === 'exam' ? 'selected' : ''}>Exam</option>
                            </select>
                        </td>
                        <td><input class="college-input" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="title" value="${escapeHtml(row.title)}" placeholder="Name"></td>
                        <td><input class="college-input" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="className" value="${escapeHtml(row.className)}" placeholder="Class"></td>
                        <td><input type="date" class="college-input" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="${escapeHtml(row.dateField)}" value="${escapeHtml(row.date)}"></td>
                        <td>${timeCell}</td>
                        <td>
                            <select class="college-select" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="priority">
                                <option value="high" ${row.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="medium" ${row.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="low" ${row.priority === 'low' ? 'selected' : ''}>Low</option>
                            </select>
                        </td>
                        <td>
                            <select class="college-select" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="status">
                                ${statusOptions}
                            </select>
                        </td>
                        <td><textarea class="college-textarea" rows="1" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" data-academic-field="notes" placeholder="Notes">${escapeHtml(row.notes)}</textarea></td>
                        <td class="college-row-actions"><button type="button" class="icon-btn academic-delete-row-btn" data-academic-collection="${escapeHtml(row.collection)}" data-academic-row-id="${escapeHtml(row.rowId)}" aria-label="Delete deadline row"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `;
            }).join('');
        }

        function renderAcademicExtracurricularRows() {
            const body = document.getElementById('todayAcademicExtracurricularTableBody') || document.getElementById('academicExtracurricularTableBody');
            if (!body) return;
            const rows = getAcademicCollectionRows('extracurriculars');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No extracurricular entries yet. Add clubs, volunteer work, and leadership activities.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-academic-collection="extracurriculars" data-academic-row-id="${escapeHtml(String(row.id))}" data-academic-field="name" value="${escapeHtml(String(row.name || ''))}" placeholder="Activity"></td>
                    <td><input class="college-input" data-academic-collection="extracurriculars" data-academic-row-id="${escapeHtml(String(row.id))}" data-academic-field="role" value="${escapeHtml(String(row.role || ''))}" placeholder="Role"></td>
                    <td><input type="date" class="college-input" data-academic-collection="extracurriculars" data-academic-row-id="${escapeHtml(String(row.id))}" data-academic-field="meetingDate" value="${escapeHtml(String(row.meetingDate || ''))}"></td>
                    <td>
                        <select class="college-select" data-academic-collection="extracurriculars" data-academic-row-id="${escapeHtml(String(row.id))}" data-academic-field="status">
                            <option value="active" ${row.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="planned" ${row.status === 'planned' ? 'selected' : ''}>Planned</option>
                            <option value="paused" ${row.status === 'paused' ? 'selected' : ''}>Paused</option>
                        </select>
                    </td>
                    <td><textarea class="college-textarea" rows="1" data-academic-collection="extracurriculars" data-academic-row-id="${escapeHtml(String(row.id))}" data-academic-field="notes" placeholder="Notes">${escapeHtml(String(row.notes || ''))}</textarea></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn academic-delete-row-btn" data-academic-collection="extracurriculars" data-academic-row-id="${escapeHtml(String(row.id))}" aria-label="Delete extracurricular"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderAcademicUpcomingDeadlinesPanel() {
            const items = getAcademicUpcomingDeadlines(7);
            const countEls = [
                document.getElementById('todayAcademicUpcomingCount'),
                document.getElementById('academicUpcomingCount')
            ].filter(Boolean);
            countEls.forEach(el => { el.textContent = String(items.length); });

            const bodies = [
                document.getElementById('todayAcademicUpcomingTableBody'),
                document.getElementById('academicUpcomingTableBody')
            ].filter(Boolean);
            if (!bodies.length) return;

            const html = !items.length
                ? '<tr class="college-empty-row"><td colspan="5">No assignments, exams, or extracurricular meetings in the next 7 days.</td></tr>'
                : items.map(item => `
                    <tr>
                        <td>${escapeHtml(item.kind)}</td>
                        <td>${escapeHtml(item.title)}</td>
                        <td>${escapeHtml(item.className || '-')}</td>
                        <td>${escapeHtml(item.dateKey)}</td>
                        <td>${escapeHtml(item.status || '-')}</td>
                    </tr>
                `).join('');
            bodies.forEach(body => { body.innerHTML = html; });
        }

        function resetAcademicDeadlineForm() {
            const typeEl = document.getElementById('todayAcademicNewType');
            const titleEl = document.getElementById('todayAcademicNewTitle');
            const classEl = document.getElementById('todayAcademicNewClass');
            const dateEl = document.getElementById('todayAcademicNewDate');
            const timeEl = document.getElementById('todayAcademicNewTime');
            const priorityEl = document.getElementById('todayAcademicNewPriority');
            const notesEl = document.getElementById('todayAcademicNewNotes');
            if (typeEl) typeEl.value = 'assignment';
            if (titleEl) titleEl.value = '';
            if (classEl) classEl.value = '';
            if (dateEl) dateEl.value = offsetDateKey(2);
            if (timeEl) timeEl.value = '09:00';
            if (priorityEl) priorityEl.value = 'medium';
            if (notesEl) notesEl.value = '';
            syncAcademicDeadlineFormControls();
        }

        function setAcademicDeadlineFormVisibility(visible) {
            const form = document.getElementById('todayAcademicDeadlineForm');
            if (!form) return;
            const shouldShow = !!visible;
            form.hidden = !shouldShow;
            if (shouldShow) {
                const dateEl = document.getElementById('todayAcademicNewDate');
                if (dateEl && !dateEl.value) dateEl.value = offsetDateKey(2);
                syncAcademicDeadlineFormControls();
                const titleEl = document.getElementById('todayAcademicNewTitle');
                if (titleEl) {
                    window.requestAnimationFrame(() => titleEl.focus());
                }
            } else {
                resetAcademicDeadlineForm();
            }
        }

        function toggleAcademicDeadlineForm() {
            const form = document.getElementById('todayAcademicDeadlineForm');
            if (!form) return;
            setAcademicDeadlineFormVisibility(form.hidden);
        }

        function syncAcademicDeadlineFormControls() {
            const typeEl = document.getElementById('todayAcademicNewType');
            const statusEl = document.getElementById('todayAcademicNewStatus');
            const timeWrap = document.getElementById('todayAcademicNewTimeWrap');
            const timeEl = document.getElementById('todayAcademicNewTime');
            if (!typeEl || !statusEl) return;
            const collectionKey = getAcademicCollectionKeyFromDeadlineType(typeEl.value);
            const previous = String(statusEl.value || '');
            statusEl.innerHTML = buildAcademicStatusOptionsHtml(collectionKey, previous);
            statusEl.value = normalizeAcademicStatusForCollection(collectionKey, previous);
            const isExam = collectionKey === 'exams';
            if (timeWrap) timeWrap.classList.toggle('is-hidden', !isExam);
            if (timeEl) {
                timeEl.disabled = !isExam;
                if (!isExam) {
                    timeEl.value = '';
                } else if (!timeEl.value) {
                    timeEl.value = '09:00';
                }
            }
        }

        function createAcademicDeadlineFromForm() {
            const typeEl = document.getElementById('todayAcademicNewType');
            const titleEl = document.getElementById('todayAcademicNewTitle');
            const classEl = document.getElementById('todayAcademicNewClass');
            const dateEl = document.getElementById('todayAcademicNewDate');
            const timeEl = document.getElementById('todayAcademicNewTime');
            const priorityEl = document.getElementById('todayAcademicNewPriority');
            const statusEl = document.getElementById('todayAcademicNewStatus');
            const notesEl = document.getElementById('todayAcademicNewNotes');
            if (!typeEl || !dateEl || !priorityEl || !statusEl) return;

            const collectionKey = getAcademicCollectionKeyFromDeadlineType(typeEl.value);
            const title = String(titleEl && titleEl.value ? titleEl.value : '').trim();
            const className = String(classEl && classEl.value ? classEl.value : '').trim();
            const dateValue = String(dateEl.value || '').trim() || offsetDateKey(2);
            const notes = String(notesEl && notesEl.value ? notesEl.value : '').trim();
            const priority = String(priorityEl.value || 'medium');
            const status = normalizeAcademicStatusForCollection(collectionKey, statusEl.value);

            if (collectionKey === 'exams') {
                const examTime = String(timeEl && timeEl.value ? timeEl.value : '').trim();
                getAcademicCollectionRows('exams').push(createAcademicExamRow({
                    title: title || 'Untitled exam',
                    className,
                    examDate: dateValue,
                    examTime: examTime || '09:00',
                    priority,
                    status,
                    notes
                }));
            } else {
                getAcademicCollectionRows('assignments').push(createAcademicAssignmentRow({
                    title: title || 'Untitled assignment',
                    className,
                    dueDate: dateValue,
                    priority,
                    status,
                    notes
                }));
            }

            persistAppData();
            renderAcademicWorkspace();
            setAcademicDeadlineFormVisibility(false);
        }

        function convertAcademicDeadlineType(target) {
            if (!target || !target.dataset) return;
            const fromCollection = String(target.dataset.academicCollection || '');
            const rowId = String(target.dataset.academicRowId || '');
            if (!fromCollection || !rowId) return;
            const toCollection = getAcademicCollectionKeyFromDeadlineType(target.value);
            if (fromCollection === toCollection) return;
            if (!['assignments', 'exams'].includes(fromCollection) || !['assignments', 'exams'].includes(toCollection)) return;

            const sourceRows = getAcademicCollectionRows(fromCollection);
            const index = sourceRows.findIndex(item => String(item.id) === rowId);
            if (index < 0) return;
            const source = sourceRows[index];
            sourceRows.splice(index, 1);

            if (toCollection === 'exams') {
                getAcademicCollectionRows('exams').push(createAcademicExamRow({
                    id: source.id,
                    title: source.title || '',
                    className: resolveAcademicClassName(source),
                    classId: source.classId || '',
                    examDate: source.dueDate || offsetDateKey(2),
                    examTime: '09:00',
                    priority: source.priority || 'high',
                    status: mapAssignmentStatusToExam(source.status),
                    notes: source.notes || ''
                }));
            } else {
                getAcademicCollectionRows('assignments').push(createAcademicAssignmentRow({
                    id: source.id,
                    title: source.title || '',
                    className: resolveAcademicClassName(source),
                    classId: source.classId || '',
                    dueDate: source.examDate || offsetDateKey(2),
                    priority: source.priority || 'medium',
                    status: mapExamStatusToAssignment(source.status),
                    notes: source.notes || ''
                }));
            }

            persistAppData();
            renderAcademicWorkspace();
        }

        function addAcademicRow(collectionKey) {
            if (collectionKey === 'assignments') getAcademicCollectionRows('assignments').push(createAcademicAssignmentRow({ dueDate: offsetDateKey(2) }));
            if (collectionKey === 'exams') getAcademicCollectionRows('exams').push(createAcademicExamRow({ examDate: offsetDateKey(4), examTime: '09:00' }));
            if (collectionKey === 'extracurriculars') getAcademicCollectionRows('extracurriculars').push(createAcademicExtracurricularRow({ meetingDate: offsetDateKey(1) }));
            persistAppData();
            renderAcademicWorkspace();
        }

        function removeAcademicRow(collectionKey, rowId) {
            const rows = getAcademicCollectionRows(collectionKey);
            const nextRows = rows.filter(item => String(item.id) !== String(rowId));
            if (nextRows.length === rows.length) return;
            academicWorkspace[collectionKey] = nextRows;
            persistAppData();
            renderAcademicWorkspace();
        }

        function updateAcademicField(target) {
            if (!target || !target.dataset) return;
            const collection = target.dataset.academicCollection;
            const rowId = target.dataset.academicRowId;
            const field = target.dataset.academicField;
            if (!collection || !rowId || !field) return;
            const rows = getAcademicCollectionRows(collection);
            const row = rows.find(item => String(item.id) === String(rowId));
            if (!row) return;
            let nextValue = target.type === 'checkbox' ? !!target.checked : target.value;
            if (field === 'intervalDays' || field === 'targetPerWeek') {
                nextValue = Math.max(1, Math.floor(normalizeFiniteNumber(nextValue, 1)));
            }
            if (field === 'status') {
                nextValue = normalizeAcademicStatusForCollection(collection, nextValue);
            }
            if (field === 'className' && Object.prototype.hasOwnProperty.call(row, 'classId')) {
                row.classId = '';
            }
            row[field] = nextValue;
            persistAppData();
            renderAcademicWorkspace();
        }

        function updateAcademicFiltersFromControl(target) {
            const key = target && target.dataset ? target.dataset.academicFilter : '';
            if (!key) return;
            const filters = normalizeAcademicFilters();
            filters[key] = target.value;
            academicWorkspace.filters = filters;
            persistAppData();
            renderAcademicWorkspace();
        }

        function syncAcademicFilterControls() {
            const filters = normalizeAcademicFilters();
            const statusEl = document.getElementById('todayAcademicFilterStatus') || document.getElementById('academicFilterStatus');
            const classEl = document.getElementById('todayAcademicFilterClass') || document.getElementById('academicFilterClass');
            const priorityEl = document.getElementById('todayAcademicFilterPriority') || document.getElementById('academicFilterPriority');
            const sortByEl = document.getElementById('todayAcademicSortBy') || document.getElementById('academicSortBy');
            const sortDirEl = document.getElementById('todayAcademicSortDirection') || document.getElementById('academicSortDirection');
            if (statusEl) statusEl.value = filters.status || 'all';
            if (priorityEl) priorityEl.value = filters.priority || 'all';
            if (sortByEl) sortByEl.value = filters.sortBy || 'dueDate';
            if (sortDirEl) sortDirEl.value = filters.sortDirection || 'asc';
            if (classEl) {
                const classNames = new Set();
                getAcademicCollectionRows('assignments').forEach(row => {
                    const name = resolveAcademicClassName(row);
                    if (name) classNames.add(name);
                });
                getAcademicCollectionRows('exams').forEach(row => {
                    const name = resolveAcademicClassName(row);
                    if (name) classNames.add(name);
                });
                const sorted = Array.from(classNames).sort((a, b) => a.localeCompare(b));
                const options = ['<option value="all">All Classes</option>']
                    .concat(sorted.map(name => `<option value="${escapeHtml(String(name))}">${escapeHtml(String(name))}</option>`));
                classEl.innerHTML = options.join('');
                classEl.value = sorted.includes(filters.className) ? filters.className : 'all';
            }
        }

        function renderAcademicWorkspace() {
            academicWorkspace = normalizeAcademicWorkspace(academicWorkspace);
            syncAcademicFilterControls();
            renderAcademicDeadlineRows();
            renderAcademicExtracurricularRows();
            renderAcademicUpcomingDeadlinesPanel();
            const plannerRoot = document.querySelector('#view-today .today-academic-section');
            if (plannerRoot) {
                if (typeof window.refreshCustomSelects === 'function') window.refreshCustomSelects(plannerRoot);
                if (typeof window.refreshCustomDates === 'function') window.refreshCustomDates(plannerRoot);
            }
        }

        function initAcademicWorkspaceUI() {
            const roots = [
                document.getElementById('view-academic'),
                document.querySelector('#view-today .today-academic-section')
            ].filter(Boolean);
            if (!roots.length) return;

            const bindRoot = (root) => {
                if (!root || root.dataset.bound === 'true') return;
                root.dataset.bound = 'true';

                root.addEventListener('click', (event) => {
                    const plannerBtn = event.target.closest('#academicOpenTodayPlannerBtn');
                    if (plannerBtn) {
                        setActiveView('today');
                        return;
                    }

                    const deadlineToggleBtn = event.target.closest('#todayAcademicToggleDeadlineFormBtn, #todayAcademicToggleDeadlineFormBtnSecondary');
                    if (deadlineToggleBtn) {
                        toggleAcademicDeadlineForm();
                        return;
                    }

                    const createDeadlineBtn = event.target.closest('#todayAcademicCreateDeadlineBtn');
                    if (createDeadlineBtn) {
                        createAcademicDeadlineFromForm();
                        return;
                    }

                    const cancelDeadlineBtn = event.target.closest('#todayAcademicCancelDeadlineBtn');
                    if (cancelDeadlineBtn) {
                        setAcademicDeadlineFormVisibility(false);
                        return;
                    }

                    const addActivityBtn = event.target.closest('#todayAcademicAddExtracurricularBtn, #todayAcademicAddExtracurricularBtnSecondary, #academicAddExtracurricularBtn');
                    if (addActivityBtn) {
                        addAcademicRow('extracurriculars');
                        return;
                    }

                    const deleteButton = event.target.closest('.academic-delete-row-btn');
                    if (deleteButton) {
                        removeAcademicRow(deleteButton.dataset.academicCollection, deleteButton.dataset.academicRowId);
                        return;
                    }
                });

                root.addEventListener('change', (event) => {
                    if (event.target && event.target.id === 'todayAcademicNewType') {
                        syncAcademicDeadlineFormControls();
                        return;
                    }

                    const deadlineTypeEl = event.target.closest('[data-academic-deadline-type]');
                    if (deadlineTypeEl) {
                        convertAcademicDeadlineType(deadlineTypeEl);
                        return;
                    }

                    const fieldEl = event.target.closest('[data-academic-field]');
                    if (fieldEl) {
                        updateAcademicField(fieldEl);
                        return;
                    }

                    const filterEl = event.target.closest('[data-academic-filter]');
                    if (filterEl) {
                        updateAcademicFiltersFromControl(filterEl);
                        return;
                    }
                });
            };

            roots.forEach(bindRoot);
            renderAcademicWorkspace();
        }
        // ------------------ end Academic Workspace ------------------

        // -------------------- College App Workspace --------------------
        function getCollegeAppRows(collectionKey) {
            if (!collegeAppWorkspace || typeof collegeAppWorkspace !== 'object') {
                collegeAppWorkspace = getDefaultCollegeAppWorkspace();
            }
            if (collectionKey === 'decisionCriteria') {
                if (!collegeAppWorkspace.decisionMatrix || typeof collegeAppWorkspace.decisionMatrix !== 'object') {
                    collegeAppWorkspace.decisionMatrix = { criteria: [], colleges: [] };
                }
                if (!Array.isArray(collegeAppWorkspace.decisionMatrix.criteria)) {
                    collegeAppWorkspace.decisionMatrix.criteria = [];
                }
                return collegeAppWorkspace.decisionMatrix.criteria;
            }
            if (collectionKey === 'decisionColleges') {
                if (!collegeAppWorkspace.decisionMatrix || typeof collegeAppWorkspace.decisionMatrix !== 'object') {
                    collegeAppWorkspace.decisionMatrix = { criteria: [], colleges: [] };
                }
                if (!Array.isArray(collegeAppWorkspace.decisionMatrix.colleges)) {
                    collegeAppWorkspace.decisionMatrix.colleges = [];
                }
                return collegeAppWorkspace.decisionMatrix.colleges;
            }
            if (!Array.isArray(collegeAppWorkspace[collectionKey])) {
                collegeAppWorkspace[collectionKey] = [];
            }
            return collegeAppWorkspace[collectionKey];
        }

        // ==================== Add-Item Modal System ====================
        const ADD_ITEM_FIELD_CONFIGS = {
            // ----- College App -----
            collegeTracker: {
                title: 'Add College',
                fields: [
                    { key: 'school', label: 'School Name', type: 'text', placeholder: 'e.g. MIT' },
                    { key: 'deadline', label: 'Deadline', type: 'date', defaultFn: () => offsetDateKey(14) },
                    { key: 'status', label: 'Status', type: 'select', options: [
                        { value: 'planning', label: 'Planning' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'submitted', label: 'Submitted' },
                        { value: 'accepted', label: 'Accepted' },
                        { value: 'waitlisted', label: 'Waitlisted' },
                        { value: 'rejected', label: 'Rejected' }
                    ], default: 'planning' },
                    { key: 'checklist', label: 'Checklist Notes', type: 'textarea', placeholder: 'Items to complete...' }
                ],
                createFn: seed => createCollegeAppTrackerRow(seed)
            },
            essayOrganizer: {
                title: 'Add Essay',
                fields: [
                    { key: 'school', label: 'School', type: 'text', placeholder: 'School name' },
                    { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Essay prompt...' },
                    { key: 'draftStatus', label: 'Draft Status', type: 'select', options: [
                        { value: 'brainstorming', label: 'Brainstorming' },
                        { value: 'drafting', label: 'Drafting' },
                        { value: 'review', label: 'Review' },
                        { value: 'final', label: 'Final' }
                    ], default: 'brainstorming' },
                    { key: 'versionNotes', label: 'Version Notes', type: 'textarea', placeholder: 'Notes...' },
                    { key: 'dueDate', label: 'Due Date', type: 'date', defaultFn: () => offsetDateKey(10) }
                ],
                createFn: seed => createCollegeEssayRow(seed)
            },
            scoreTracker: {
                title: 'Add Score',
                fields: [
                    { key: 'testType', label: 'Test Type', type: 'select', options: [
                        { value: 'SAT', label: 'SAT' },
                        { value: 'ACT', label: 'ACT' },
                        { value: 'AP', label: 'AP' },
                        { value: 'IB', label: 'IB' }
                    ], default: 'SAT' },
                    { key: 'testDate', label: 'Test Date', type: 'date', defaultFn: () => today() },
                    { key: 'totalScore', label: 'Total Score', type: 'text', placeholder: 'e.g. 1520' },
                    { key: 'breakdown', label: 'Score Breakdown', type: 'textarea', placeholder: 'e.g. Math 780, Reading 740' }
                ],
                createFn: seed => createCollegeScoreRow(seed)
            },
            awardsHonors: {
                title: 'Add Award / Honor',
                fields: [
                    { key: 'title', label: 'Award Title', type: 'text', placeholder: 'e.g. National Merit Semifinalist' },
                    { key: 'level', label: 'Level', type: 'text', placeholder: 'e.g. National, State, School' },
                    { key: 'date', label: 'Date', type: 'date', defaultFn: () => today() },
                    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description...' }
                ],
                createFn: seed => createCollegeAwardRow(seed)
            },
            scholarships: {
                title: 'Add Scholarship',
                fields: [
                    { key: 'name', label: 'Scholarship Name', type: 'text', placeholder: 'e.g. Gates Scholarship' },
                    { key: 'amount', label: 'Amount ($)', type: 'number', min: 0, step: 1, placeholder: '0' },
                    { key: 'deadline', label: 'Deadline', type: 'date', defaultFn: () => offsetDateKey(21) },
                    { key: 'status', label: 'Status', type: 'select', options: [
                        { value: 'researching', label: 'Researching' },
                        { value: 'applying', label: 'Applying' },
                        { value: 'submitted', label: 'Submitted' },
                        { value: 'won', label: 'Won' },
                        { value: 'not_awarded', label: 'Not Awarded' }
                    ], default: 'researching' },
                    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Requirements, links, etc.' }
                ],
                createFn: seed => createCollegeScholarshipRow(seed)
            },
            decisionCriteria: {
                title: 'Add Decision Criterion',
                fields: [
                    { key: 'name', label: 'Criterion Name', type: 'text', placeholder: 'e.g. Location, Cost, Rankings' },
                    { key: 'weight', label: 'Weight', type: 'number', min: 0, step: 0.1, default: 1, placeholder: '1' }
                ],
                createFn: seed => createDecisionCriterionRow(seed)
            },
            decisionColleges: {
                title: 'Add College to Decision Matrix',
                fields: [
                    { key: 'name', label: 'College Name', type: 'text', placeholder: 'e.g. Stanford' }
                ],
                createFn: seed => createDecisionCollegeRow(seed)
            },
            // ----- Life -----
            goals: {
                title: 'Add SMART Goal',
                fields: [
                    { key: 'title', label: 'Goal Title', type: 'text', placeholder: 'What do you want to achieve?' },
                    { key: 'specific', label: 'Specific', type: 'textarea', placeholder: 'What exactly will you accomplish?' },
                    { key: 'measurable', label: 'Measurable', type: 'textarea', placeholder: 'How will you measure progress?' },
                    { key: 'achievable', label: 'Achievable', type: 'textarea', placeholder: 'Is this realistic?' },
                    { key: 'relevant', label: 'Relevant', type: 'textarea', placeholder: 'Why does this matter?' },
                    { key: 'timeBound', label: 'Time-bound', type: 'textarea', placeholder: 'When will you complete this?' },
                    { key: 'targetDate', label: 'Target Date', type: 'date', defaultFn: () => offsetDateKey(30) },
                    { key: 'progress', label: 'Progress %', type: 'number', min: 0, max: 100, default: 0, placeholder: '0' }
                ],
                createFn: seed => createLifeGoalRow(seed)
            },
            habits: {
                title: 'Add Habit',
                fields: [
                    { key: 'name', label: 'Habit Name', type: 'text', placeholder: 'e.g. Read 30 minutes' },
                    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Health, Learning, Mindfulness' },
                    { key: 'targetPerWeek', label: 'Target per Week', type: 'number', min: 1, max: 14, default: 7, placeholder: '7' }
                ],
                createFn: seed => createLifeHabitRow(seed)
            },
            skills: {
                title: 'Add Skill',
                fields: [
                    { key: 'name', label: 'Skill Name', type: 'text', placeholder: 'e.g. Piano, Python, Drawing' },
                    { key: 'level', label: 'Level', type: 'select', options: [
                        { value: 'beginner', label: 'Beginner' },
                        { value: 'intermediate', label: 'Intermediate' },
                        { value: 'advanced', label: 'Advanced' }
                    ], default: 'beginner' },
                    { key: 'hoursInvested', label: 'Hours Invested', type: 'number', min: 0, default: 0, placeholder: '0' },
                    { key: 'nextMilestone', label: 'Next Milestone', type: 'textarea', placeholder: 'What are you working toward?' },
                    { key: 'status', label: 'Status', type: 'select', options: [
                        { value: 'active', label: 'Active' },
                        { value: 'paused', label: 'Paused' },
                        { value: 'completed', label: 'Completed' }
                    ], default: 'active' }
                ],
                createFn: seed => createLifeSkillRow(seed)
            },
            fitness: {
                title: 'Add Fitness Entry',
                fields: [
                    { key: 'date', label: 'Date', type: 'date', defaultFn: () => today() },
                    { key: 'activity', label: 'Activity', type: 'text', placeholder: 'e.g. Running, Yoga, Weights' },
                    { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number', min: 0, default: 0, placeholder: '30' },
                    { key: 'intensity', label: 'Intensity', type: 'select', options: [
                        { value: 'light', label: 'Light' },
                        { value: 'moderate', label: 'Moderate' },
                        { value: 'high', label: 'High' }
                    ], default: 'moderate' },
                    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'How did it go?' }
                ],
                createFn: seed => createLifeFitnessRow(seed)
            },
            books: {
                title: 'Add Book',
                fields: [
                    { key: 'title', label: 'Book Title', type: 'text', placeholder: 'Title' },
                    { key: 'author', label: 'Author', type: 'text', placeholder: 'Author' },
                    { key: 'status', label: 'Status', type: 'select', options: [
                        { value: 'planned', label: 'Planned' },
                        { value: 'reading', label: 'Reading' },
                        { value: 'completed', label: 'Completed' }
                    ], default: 'reading' },
                    { key: 'totalPages', label: 'Total Pages', type: 'number', min: 0, default: 0, placeholder: '300' },
                    { key: 'pagesRead', label: 'Pages Read', type: 'number', min: 0, default: 0, placeholder: '0' },
                    { key: 'rating', label: 'Rating (0-5)', type: 'number', min: 0, max: 5, step: 0.5, default: 0, placeholder: '0' }
                ],
                createFn: seed => createLifeBookRow(seed)
            },
            spending: {
                title: 'Add Spending Entry',
                fields: [
                    { key: 'date', label: 'Date', type: 'date', defaultFn: () => today() },
                    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Food, Transport, Entertainment' },
                    { key: 'amount', label: 'Amount ($)', type: 'number', min: 0, step: 0.01, default: 0, placeholder: '0.00' },
                    { key: 'note', label: 'Note', type: 'text', placeholder: 'Details...' }
                ],
                createFn: seed => createLifeSpendingRow(seed)
            },
            journals: {
                title: 'Add Journal Entry',
                fields: [
                    { key: 'date', label: 'Date', type: 'date', defaultFn: () => today() },
                    { key: 'title', label: 'Title', type: 'text', placeholder: 'Entry title', defaultFn: () => `Journal ${today()}` },
                    { key: 'mood', label: 'Mood', type: 'text', placeholder: 'e.g. Happy, Stressed, Calm' },
                    { key: 'content', label: 'Entry', type: 'textarea', placeholder: 'Write your thoughts...' }
                ],
                createFn: seed => createLifeJournalRow(seed)
            }
        };

        let _addItemModalContext = null;

        function openAddItemModal(collectionKey, workspace) {
            const config = ADD_ITEM_FIELD_CONFIGS[collectionKey];
            if (!config) return;
            const modal = document.getElementById('addItemModal');
            const titleEl = document.getElementById('addItemModalTitle');
            const bodyEl = document.getElementById('addItemModalBody');
            if (!modal || !bodyEl) return;

            _addItemModalContext = { collectionKey, workspace, config };
            if (titleEl) titleEl.textContent = config.title;

            // Build form fields
            let html = '';
            const fields = config.fields;
            for (let i = 0; i < fields.length; i++) {
                const f = fields[i];
                const defaultVal = f.defaultFn ? f.defaultFn() : (f.default !== undefined ? f.default : '');
                // Pair short fields in a row
                const isShort = f.type === 'date' || f.type === 'number' || f.type === 'select';
                const nextF = fields[i + 1];
                const nextIsShort = nextF && (nextF.type === 'date' || nextF.type === 'number' || nextF.type === 'select');
                if (isShort && nextIsShort) {
                    const nextDefault = nextF.defaultFn ? nextF.defaultFn() : (nextF.default !== undefined ? nextF.default : '');
                    html += '<div class="add-item-row">';
                    html += buildFieldHtml(f, defaultVal);
                    html += buildFieldHtml(nextF, nextDefault);
                    html += '</div>';
                    i++; // skip next
                } else {
                    html += buildFieldHtml(f, defaultVal);
                }
            }
            bodyEl.innerHTML = html;
            modal.classList.add('active');
            // Focus first input
            const firstInput = bodyEl.querySelector('input, textarea, select');
            if (firstInput) setTimeout(() => firstInput.focus(), 80);
        }

        function buildFieldHtml(f, defaultVal) {
            const id = `addItemField_${f.key}`;
            let inputHtml = '';
            if (f.type === 'select') {
                inputHtml = `<select class="modal-input" id="${id}" data-field-key="${f.key}">`;
                (f.options || []).forEach(opt => {
                    const sel = String(opt.value) === String(defaultVal) ? ' selected' : '';
                    inputHtml += `<option value="${escapeHtml(opt.value)}"${sel}>${escapeHtml(opt.label)}</option>`;
                });
                inputHtml += '</select>';
            } else if (f.type === 'textarea') {
                inputHtml = `<textarea class="modal-input" id="${id}" data-field-key="${f.key}" rows="2" placeholder="${escapeHtml(f.placeholder || '')}">${escapeHtml(String(defaultVal))}</textarea>`;
            } else {
                const attrs = [];
                attrs.push(`type="${f.type || 'text'}"`);
                attrs.push(`class="modal-input"`);
                attrs.push(`id="${id}"`);
                attrs.push(`data-field-key="${f.key}"`);
                if (f.placeholder) attrs.push(`placeholder="${escapeHtml(f.placeholder)}"`);
                if (f.min !== undefined) attrs.push(`min="${f.min}"`);
                if (f.max !== undefined) attrs.push(`max="${f.max}"`);
                if (f.step !== undefined) attrs.push(`step="${f.step}"`);
                attrs.push(`value="${escapeHtml(String(defaultVal))}"`);
                inputHtml = `<input ${attrs.join(' ')}>`;
            }
            return `<div class="add-item-field"><label for="${id}">${escapeHtml(f.label)}</label>${inputHtml}</div>`;
        }

        function closeAddItemModal() {
            const modal = document.getElementById('addItemModal');
            if (modal) modal.classList.remove('active');
            _addItemModalContext = null;
        }

        function saveAddItemModal() {
            if (!_addItemModalContext) return;
            const { collectionKey, workspace, config } = _addItemModalContext;
            const bodyEl = document.getElementById('addItemModalBody');
            if (!bodyEl) return;

            // Collect values
            const seed = {};
            config.fields.forEach(f => {
                const el = bodyEl.querySelector(`[data-field-key="${f.key}"]`);
                if (!el) return;
                let val = el.value;
                if (f.type === 'number') val = parseFloat(val) || (f.default !== undefined ? f.default : 0);
                seed[f.key] = val;
            });

            // Insert into the right workspace
            if (workspace === 'collegeapp') {
                if (collectionKey === 'decisionCriteria') {
                    const criterion = config.createFn(seed);
                    getCollegeAppRows('decisionCriteria').push(criterion);
                    getCollegeAppRows('decisionColleges').forEach(college => {
                        college.scores = { ...(college.scores || {}), [criterion.id]: 0 };
                    });
                } else if (collectionKey === 'decisionColleges') {
                    const criteria = getCollegeAppRows('decisionCriteria');
                    const scores = {};
                    criteria.forEach(c => { scores[c.id] = 0; });
                    seed.scores = scores;
                    getCollegeAppRows('decisionColleges').push(config.createFn(seed));
                } else {
                    getCollegeAppRows(collectionKey).push(config.createFn(seed));
                }
                persistAppData();
                renderCollegeAppWorkspace();
            } else if (workspace === 'life') {
                if (collectionKey === 'journals') {
                    getLifeRows('journals').unshift(config.createFn(seed));
                } else {
                    getLifeRows(collectionKey).push(config.createFn(seed));
                }
                persistAppData();
                renderLifeWorkspace();
            }

            closeAddItemModal();
        }

        // Wire up modal buttons
        document.addEventListener('DOMContentLoaded', () => {
            const cancelBtn = document.getElementById('addItemModalCancel');
            const saveBtn = document.getElementById('addItemModalSave');
            const modal = document.getElementById('addItemModal');
            if (cancelBtn) cancelBtn.addEventListener('click', closeAddItemModal);
            if (saveBtn) saveBtn.addEventListener('click', saveAddItemModal);
            // Close on backdrop click
            if (modal) modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAddItemModal();
            });
            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeAddItemModal();
            });
            // Submit on Enter (unless in textarea)
            if (modal) modal.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    saveAddItemModal();
                }
            });
        });
        // ==================== End Add-Item Modal ====================

        function addCollegeAppRow(collectionKey) {
            openAddItemModal(collectionKey, 'collegeapp');
        }

        function removeCollegeAppRow(collectionKey, rowId) {
            const rows = getCollegeAppRows(collectionKey);
            const nextRows = rows.filter(item => String(item.id) !== String(rowId));
            if (nextRows.length === rows.length) return;
            if (collectionKey === 'decisionCriteria') {
                collegeAppWorkspace.decisionMatrix.criteria = nextRows;
                getCollegeAppRows('decisionColleges').forEach(college => {
                    if (!college.scores || typeof college.scores !== 'object') college.scores = {};
                    delete college.scores[rowId];
                });
            } else if (collectionKey === 'decisionColleges') {
                collegeAppWorkspace.decisionMatrix.colleges = nextRows;
            } else {
                collegeAppWorkspace[collectionKey] = nextRows;
            }
            persistAppData();
            renderCollegeAppWorkspace();
        }

        function updateCollegeAppField(target) {
            if (!target || !target.dataset) return;
            const collection = target.dataset.collegeappCollection;
            const rowId = target.dataset.collegeappRowId;
            const field = target.dataset.collegeappField;
            if (!collection || !rowId || !field) return;
            const rows = getCollegeAppRows(collection);
            const row = rows.find(item => String(item.id) === String(rowId));
            if (!row) return;
            let value = target.type === 'checkbox' ? !!target.checked : target.value;
            if (field === 'weight') value = Math.max(0, normalizeFiniteNumber(value, 1));
            row[field] = value;
            persistAppData();
            renderCollegeAppWorkspace();
        }

        function updateCollegeAppDecisionScore(target) {
            const rowId = target.dataset.collegeappRowId;
            const criterionId = target.dataset.collegeappScoreCriterion;
            if (!rowId || !criterionId) return;
            const college = getCollegeAppRows('decisionColleges').find(item => String(item.id) === String(rowId));
            if (!college) return;
            if (!college.scores || typeof college.scores !== 'object') college.scores = {};
            college.scores[criterionId] = Math.max(0, Math.min(10, normalizeFiniteNumber(target.value, 0)));
            persistAppData();
            renderCollegeAppWorkspace();
        }

        function renderCollegeAppTrackerRows() {
            const body = document.getElementById('collegeAppTrackerTableBody');
            if (!body) return;
            const rows = getCollegeAppRows('collegeTracker');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No colleges tracked yet. Add schools and keep your checklist here.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-collegeapp-collection="collegeTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="school" value="${escapeHtml(String(row.school || ''))}" placeholder="School"></td>
                    <td><input type="date" class="college-input" data-collegeapp-collection="collegeTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="deadline" value="${escapeHtml(String(row.deadline || ''))}"></td>
                    <td>
                        <select class="college-select" data-collegeapp-collection="collegeTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="status">
                            <option value="planning" ${row.status === 'planning' ? 'selected' : ''}>Planning</option>
                            <option value="in_progress" ${row.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="submitted" ${row.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                            <option value="accepted" ${row.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                            <option value="waitlisted" ${row.status === 'waitlisted' ? 'selected' : ''}>Waitlisted</option>
                            <option value="rejected" ${row.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td><textarea class="college-textarea" rows="2" data-collegeapp-collection="collegeTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="checklist" placeholder="Checklist items">${escapeHtml(String(row.checklist || ''))}</textarea></td>
                    <td>${escapeHtml(String(row.deadline || '-'))}</td>
                    <td class="college-row-actions"><button type="button" class="icon-btn collegeapp-delete-row-btn" data-collegeapp-collection="collegeTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" aria-label="Delete college row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderCollegeAppEssayRows() {
            const body = document.getElementById('collegeAppEssayTableBody');
            if (!body) return;
            const rows = getCollegeAppRows('essayOrganizer');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No essays yet. Add prompts and draft milestones.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-collegeapp-collection="essayOrganizer" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="school" value="${escapeHtml(String(row.school || ''))}" placeholder="School"></td>
                    <td><textarea class="college-textarea" rows="2" data-collegeapp-collection="essayOrganizer" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="prompt" placeholder="Prompt">${escapeHtml(String(row.prompt || ''))}</textarea></td>
                    <td>
                        <select class="college-select" data-collegeapp-collection="essayOrganizer" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="draftStatus">
                            <option value="brainstorming" ${row.draftStatus === 'brainstorming' ? 'selected' : ''}>Brainstorming</option>
                            <option value="drafting" ${row.draftStatus === 'drafting' ? 'selected' : ''}>Drafting</option>
                            <option value="review" ${row.draftStatus === 'review' ? 'selected' : ''}>Review</option>
                            <option value="final" ${row.draftStatus === 'final' ? 'selected' : ''}>Final</option>
                        </select>
                    </td>
                    <td><textarea class="college-textarea" rows="2" data-collegeapp-collection="essayOrganizer" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="versionNotes" placeholder="Version notes">${escapeHtml(String(row.versionNotes || ''))}</textarea></td>
                    <td><input type="date" class="college-input" data-collegeapp-collection="essayOrganizer" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="dueDate" value="${escapeHtml(String(row.dueDate || ''))}"></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn collegeapp-delete-row-btn" data-collegeapp-collection="essayOrganizer" data-collegeapp-row-id="${escapeHtml(String(row.id))}" aria-label="Delete essay row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderCollegeAppScoreRows() {
            const body = document.getElementById('collegeAppScoreTableBody');
            if (!body) return;
            const rows = getCollegeAppRows('scoreTracker');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="5">No scores logged yet. Track SAT/ACT/AP results with breakdowns.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td>
                        <select class="college-select" data-collegeapp-collection="scoreTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="testType">
                            <option value="SAT" ${row.testType === 'SAT' ? 'selected' : ''}>SAT</option>
                            <option value="ACT" ${row.testType === 'ACT' ? 'selected' : ''}>ACT</option>
                            <option value="AP" ${row.testType === 'AP' ? 'selected' : ''}>AP</option>
                            <option value="IB" ${row.testType === 'IB' ? 'selected' : ''}>IB</option>
                        </select>
                    </td>
                    <td><input type="date" class="college-input" data-collegeapp-collection="scoreTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="testDate" value="${escapeHtml(String(row.testDate || ''))}"></td>
                    <td><input class="college-input" data-collegeapp-collection="scoreTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="totalScore" value="${escapeHtml(String(row.totalScore || ''))}" placeholder="Total"></td>
                    <td><textarea class="college-textarea" rows="2" data-collegeapp-collection="scoreTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="breakdown" placeholder="Breakdown">${escapeHtml(String(row.breakdown || ''))}</textarea></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn collegeapp-delete-row-btn" data-collegeapp-collection="scoreTracker" data-collegeapp-row-id="${escapeHtml(String(row.id))}" aria-label="Delete score row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderCollegeAppAwardRows() {
            const body = document.getElementById('collegeAppAwardTableBody');
            if (!body) return;
            const rows = getCollegeAppRows('awardsHonors');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="5">No awards yet. Capture recognitions for applications and scholarship forms.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-collegeapp-collection="awardsHonors" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="title" value="${escapeHtml(String(row.title || ''))}" placeholder="Award"></td>
                    <td><input class="college-input" data-collegeapp-collection="awardsHonors" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="level" value="${escapeHtml(String(row.level || ''))}" placeholder="Level"></td>
                    <td><input type="date" class="college-input" data-collegeapp-collection="awardsHonors" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="date" value="${escapeHtml(String(row.date || ''))}"></td>
                    <td><textarea class="college-textarea" rows="2" data-collegeapp-collection="awardsHonors" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="description" placeholder="Description">${escapeHtml(String(row.description || ''))}</textarea></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn collegeapp-delete-row-btn" data-collegeapp-collection="awardsHonors" data-collegeapp-row-id="${escapeHtml(String(row.id))}" aria-label="Delete award row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderCollegeAppScholarshipRows() {
            const body = document.getElementById('collegeAppScholarshipTableBody');
            if (!body) return;
            const rows = getCollegeAppRows('scholarships');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No scholarships yet. Track amount, deadline, and status here.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-collegeapp-collection="scholarships" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="name" value="${escapeHtml(String(row.name || ''))}" placeholder="Scholarship"></td>
                    <td><input type="number" min="0" class="college-input" data-collegeapp-collection="scholarships" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="amount" value="${escapeHtml(String(row.amount || ''))}" placeholder="Amount"></td>
                    <td><input type="date" class="college-input" data-collegeapp-collection="scholarships" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="deadline" value="${escapeHtml(String(row.deadline || ''))}"></td>
                    <td>
                        <select class="college-select" data-collegeapp-collection="scholarships" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="status">
                            <option value="researching" ${row.status === 'researching' ? 'selected' : ''}>Researching</option>
                            <option value="applying" ${row.status === 'applying' ? 'selected' : ''}>Applying</option>
                            <option value="submitted" ${row.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                            <option value="won" ${row.status === 'won' ? 'selected' : ''}>Won</option>
                            <option value="not_awarded" ${row.status === 'not_awarded' ? 'selected' : ''}>Not Awarded</option>
                        </select>
                    </td>
                    <td><textarea class="college-textarea" rows="2" data-collegeapp-collection="scholarships" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="notes" placeholder="Notes">${escapeHtml(String(row.notes || ''))}</textarea></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn collegeapp-delete-row-btn" data-collegeapp-collection="scholarships" data-collegeapp-row-id="${escapeHtml(String(row.id))}" aria-label="Delete scholarship row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function computeCollegeAppDecisionScores() {
            const criteria = getCollegeAppRows('decisionCriteria');
            const colleges = getCollegeAppRows('decisionColleges');
            const totalWeight = criteria.reduce((sum, criterion) => sum + Math.max(0, normalizeFiniteNumber(criterion.weight, 0)), 0);
            return colleges
                .map(college => {
                    const weighted = criteria.reduce((sum, criterion) => {
                        const score = Math.max(0, Math.min(10, normalizeFiniteNumber(college.scores && college.scores[criterion.id], 0)));
                        const weight = Math.max(0, normalizeFiniteNumber(criterion.weight, 0));
                        return sum + (score * weight);
                    }, 0);
                    const normalizedScore = totalWeight > 0 ? (weighted / totalWeight) : 0;
                    return {
                        id: college.id,
                        name: college.name || 'Untitled College',
                        weighted,
                        normalizedScore
                    };
                })
                .sort((a, b) => b.normalizedScore - a.normalizedScore);
        }

        function renderCollegeAppDecisionMatrix() {
            const criteriaContainer = document.getElementById('collegeAppDecisionCriteriaBody');
            const collegesHeader = document.getElementById('collegeAppDecisionCollegesHeader');
            const collegesBody = document.getElementById('collegeAppDecisionCollegesBody');
            const rankingList = document.getElementById('collegeAppDecisionRankingList');
            const heroName = document.getElementById('dmHeroName');
            const heroScore = document.getElementById('dmHeroScore');
            const heroBar = document.getElementById('dmHeroBar');
            const hero = document.getElementById('dmHero');
            const criteria = getCollegeAppRows('decisionCriteria');
            const colleges = getCollegeAppRows('decisionColleges');

            /* ------ Criteria panel (card-based, not table) ------ */
            if (criteriaContainer) {
                if (!criteria.length) {
                    criteriaContainer.innerHTML = '<div class="dm-empty"><i class="fas fa-sliders-h"></i>No criteria yet. Add weighted criteria to start ranking schools.</div>';
                } else {
                    const maxWeight = Math.max(1, ...criteria.map(c => Math.max(0, normalizeFiniteNumber(c.weight, 0))));
                    criteriaContainer.innerHTML = criteria.map(row => {
                        const w = Math.max(0, normalizeFiniteNumber(row.weight, 0));
                        const pct = maxWeight > 0 ? ((w / maxWeight) * 100).toFixed(1) : 0;
                        return `
                        <div class="dm-criterion-card">
                            <input class="dm-criterion-name-input" data-collegeapp-collection="decisionCriteria" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="name" value="${escapeHtml(String(row.name || ''))}" placeholder="Criterion name">
                            <div class="dm-criterion-weight">
                                <div class="dm-criterion-weight-bar-wrap"><div class="dm-criterion-weight-bar" style="width:${pct}%"></div></div>
                                <input type="number" min="0" step="0.1" class="dm-criterion-weight-input" data-collegeapp-collection="decisionCriteria" data-collegeapp-row-id="${escapeHtml(String(row.id))}" data-collegeapp-field="weight" value="${escapeHtml(String(w))}">
                            </div>
                            <button type="button" class="icon-btn collegeapp-delete-row-btn dm-criterion-delete" data-collegeapp-collection="decisionCriteria" data-collegeapp-row-id="${escapeHtml(String(row.id))}" aria-label="Delete criterion"><i class="fas fa-trash"></i></button>
                        </div>`;
                    }).join('');
                }
            }

            /* ------ College Scores header ------ */
            if (collegesHeader) {
                collegesHeader.innerHTML = [
                    '<th class="dm-col-college">College</th>',
                    ...criteria.map(criterion => `<th>${escapeHtml(String(criterion.name || 'Criterion'))}<small>w ${escapeHtml(String(criterion.weight || 0))}</small></th>`),
                    '<th class="dm-col-total">Total</th>',
                    '<th class="dm-col-action"></th>'
                ].join('');
            }

            /* ------ College Scores body ------ */
            if (collegesBody) {
                if (!colleges.length) {
                    collegesBody.innerHTML = `<tr><td colspan="${Math.max(4, criteria.length + 3)}"><div class="dm-empty"><i class="fas fa-university"></i>No colleges in matrix yet. Add at least one college to compare.</div></td></tr>`;
                } else {
                    collegesBody.innerHTML = colleges.map(college => {
                        const scoreCells = criteria.map(criterion => {
                            const scoreValue = Math.max(0, Math.min(10, normalizeFiniteNumber(college.scores && college.scores[criterion.id], 0)));
                            return `<td><input type="number" min="0" max="10" step="0.1" class="dm-score-input" data-collegeapp-row-id="${escapeHtml(String(college.id))}" data-collegeapp-score-criterion="${escapeHtml(String(criterion.id))}" value="${escapeHtml(String(scoreValue))}"></td>`;
                        }).join('');
                        const weighted = criteria.reduce((sum, criterion) => {
                            const score = Math.max(0, Math.min(10, normalizeFiniteNumber(college.scores && college.scores[criterion.id], 0)));
                            const weight = Math.max(0, normalizeFiniteNumber(criterion.weight, 0));
                            return sum + (score * weight);
                        }, 0);
                        return `
                            <tr>
                                <td><input class="dm-college-name-input" data-collegeapp-collection="decisionColleges" data-collegeapp-row-id="${escapeHtml(String(college.id))}" data-collegeapp-field="name" value="${escapeHtml(String(college.name || ''))}" placeholder="College name"></td>
                                ${scoreCells}
                                <td><span class="dm-weighted-total">${weighted.toFixed(1)}</span></td>
                                <td class="college-row-actions"><button type="button" class="icon-btn collegeapp-delete-row-btn" data-collegeapp-collection="decisionColleges" data-collegeapp-row-id="${escapeHtml(String(college.id))}" aria-label="Delete college"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            /* ------ Rankings ------ */
            const rankings = computeCollegeAppDecisionScores();
            const maxNorm = rankings.length ? rankings[0].normalizedScore : 0;

            if (rankingList) {
                if (!rankings.length) {
                    rankingList.innerHTML = '<div class="dm-empty"><i class="fas fa-trophy"></i>Add criteria and colleges to compute rankings.</div>';
                } else {
                    rankingList.innerHTML = rankings.map((entry, index) => {
                        const pct = maxNorm > 0 ? ((entry.normalizedScore / 10) * 100).toFixed(1) : 0;
                        return `
                        <div class="dm-rank-card" data-rank="${index + 1}">
                            <div class="dm-rank-header">
                                <div class="dm-rank-badge">${index < 3 ? ['<i class=\"fas fa-crown\"></i>', '<i class=\"fas fa-medal\"></i>', '<i class=\"fas fa-award\"></i>'][index] : '#' + (index + 1)}</div>
                                <span class="dm-rank-name">${escapeHtml(entry.name)}</span>
                            </div>
                            <div class="dm-rank-score-row">
                                <span class="dm-rank-score-label">Weighted Score</span>
                                <span class="dm-rank-score-value">${entry.normalizedScore.toFixed(2)}</span>
                            </div>
                            <div class="dm-rank-bar-wrap"><div class="dm-rank-bar" style="width:${pct}%"></div></div>
                        </div>`;
                    }).join('');
                }
            }

            /* ------ Hero top pick ------ */
            if (hero && heroName && heroScore && heroBar) {
                if (rankings.length) {
                    const top = rankings[0];
                    heroName.textContent = top.name;
                    heroScore.textContent = `Weighted: ${top.normalizedScore.toFixed(2)} / 10`;
                    const barPct = maxNorm > 0 ? ((top.normalizedScore / 10) * 100).toFixed(1) : 0;
                    heroBar.style.width = barPct + '%';
                    hero.style.display = '';
                } else {
                    hero.style.display = 'none';
                }
            }
        }

        function renderCollegeAppSummary() {
            const completionEl = document.getElementById('collegeAppCompletionValue');
            const upcomingEl = document.getElementById('collegeAppUpcomingValue');
            const scholarshipEl = document.getElementById('collegeAppScholarshipValue');
            const trackerRows = getCollegeAppRows('collegeTracker');
            const completedStatuses = new Set(['submitted', 'accepted', 'waitlisted', 'rejected']);
            const completeCount = trackerRows.filter(row => completedStatuses.has(String(row.status || ''))).length;
            const completionPct = trackerRows.length ? Math.round((completeCount / trackerRows.length) * 100) : 0;
            if (completionEl) completionEl.textContent = `${completionPct}%`;

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const upcomingCutoff = new Date(now);
            upcomingCutoff.setDate(upcomingCutoff.getDate() + 30);
            const trackerUpcoming = trackerRows.filter(row => {
                const due = parseComparableDate(row.deadline);
                return due && due >= now && due <= upcomingCutoff;
            }).length;
            const scholarshipUpcoming = getCollegeAppRows('scholarships').filter(row => {
                const due = parseComparableDate(row.deadline);
                return due && due >= now && due <= upcomingCutoff;
            }).length;
            if (upcomingEl) upcomingEl.textContent = String(trackerUpcoming + scholarshipUpcoming);

            const pendingAmount = getCollegeAppRows('scholarships')
                .filter(row => String(row.status || '') === 'won' || String(row.status || '') === 'submitted' || String(row.status || '') === 'applying')
                .reduce((sum, row) => sum + Math.max(0, normalizeFiniteNumber(row.amount, 0)), 0);
            if (scholarshipEl) scholarshipEl.textContent = `$${Math.round(pendingAmount).toLocaleString()}`;
        }

        function renderCollegeAppWorkspace() {
            const root = document.getElementById('view-collegeapp');
            if (!root) return;
            collegeAppWorkspace = normalizeCollegeAppWorkspace(collegeAppWorkspace);
            renderCollegeAppSummary();
            renderCollegeAppTrackerRows();
            renderCollegeAppEssayRows();
            renderCollegeAppScoreRows();
            renderCollegeAppAwardRows();
            renderCollegeAppScholarshipRows();
            renderCollegeAppDecisionMatrix();
        }

        function initCollegeAppWorkspaceUI() {
            const root = document.getElementById('view-collegeapp');
            if (!root) return;
            if (root.dataset.bound === 'true') {
                renderCollegeAppWorkspace();
                return;
            }
            root.dataset.bound = 'true';

            // --- Sub-page navigation ---
            function collegeappShowDashboard() {
                const dashboard = document.getElementById('collegeappDashboard');
                root.querySelectorAll('.collegeapp-subpage').forEach(sp => sp.style.display = 'none');
                if (dashboard) dashboard.style.display = '';
            }

            function collegeappShowPage(pageKey) {
                const dashboard = document.getElementById('collegeappDashboard');
                const page = document.getElementById('collegeappPage-' + pageKey);
                if (!page) return;
                if (dashboard) dashboard.style.display = 'none';
                root.querySelectorAll('.collegeapp-subpage').forEach(sp => sp.style.display = 'none');
                page.style.display = '';
            }

            // Quick-add buttons on the dashboard should also navigate to the relevant page
            const quickAddPageMap = {
                collegeAppQuickAddTrackerBtn: 'tracker',
                collegeAppQuickAddEssayBtn: 'essays',
                collegeAppQuickAddScholarshipBtn: 'scholarships'
            };

            root.addEventListener('click', (event) => {
                // Nav grid buttons
                const navBtn = event.target.closest('[data-collegeapp-page]');
                if (navBtn) {
                    collegeappShowPage(navBtn.dataset.collegeappPage);
                    return;
                }

                // Back buttons
                const backBtn = event.target.closest('[data-collegeapp-back]');
                if (backBtn) {
                    collegeappShowDashboard();
                    return;
                }

                const addButton = event.target.closest('#collegeAppAddTrackerBtn, #collegeAppAddEssayBtn, #collegeAppAddScoreBtn, #collegeAppAddAwardBtn, #collegeAppAddScholarshipBtn, #collegeAppAddCriterionBtn, #collegeAppAddDecisionCollegeBtn, #collegeAppQuickAddTrackerBtn, #collegeAppQuickAddEssayBtn, #collegeAppQuickAddScholarshipBtn');
                if (addButton) {
                    const map = {
                        collegeAppAddTrackerBtn: 'collegeTracker',
                        collegeAppQuickAddTrackerBtn: 'collegeTracker',
                        collegeAppAddEssayBtn: 'essayOrganizer',
                        collegeAppQuickAddEssayBtn: 'essayOrganizer',
                        collegeAppAddScoreBtn: 'scoreTracker',
                        collegeAppAddAwardBtn: 'awardsHonors',
                        collegeAppAddScholarshipBtn: 'scholarships',
                        collegeAppQuickAddScholarshipBtn: 'scholarships',
                        collegeAppAddCriterionBtn: 'decisionCriteria',
                        collegeAppAddDecisionCollegeBtn: 'decisionColleges'
                    };
                    const key = map[addButton.id];
                    if (key) addCollegeAppRow(key);
                    // If it's a quick-add from the dashboard, navigate to the sub-page
                    const targetPage = quickAddPageMap[addButton.id];
                    if (targetPage) collegeappShowPage(targetPage);
                    return;
                }

                const deleteButton = event.target.closest('.collegeapp-delete-row-btn');
                if (deleteButton) {
                    removeCollegeAppRow(deleteButton.dataset.collegeappCollection, deleteButton.dataset.collegeappRowId);
                }
            });

            root.addEventListener('change', (event) => {
                const scoreInput = event.target.closest('[data-collegeapp-score-criterion]');
                if (scoreInput) {
                    updateCollegeAppDecisionScore(scoreInput);
                    return;
                }
                const fieldEl = event.target.closest('[data-collegeapp-field]');
                if (fieldEl) {
                    updateCollegeAppField(fieldEl);
                }
            });

            // Ensure dashboard is visible on init
            collegeappShowDashboard();

            renderCollegeAppWorkspace();
        }
        // ------------------ end College App Workspace ------------------

        // -------------------- Life Workspace --------------------
        function getLifeRows(collectionKey) {
            if (!lifeWorkspace || typeof lifeWorkspace !== 'object') {
                lifeWorkspace = getDefaultLifeWorkspace();
            }
            if (!Array.isArray(lifeWorkspace[collectionKey])) {
                lifeWorkspace[collectionKey] = [];
            }
            return lifeWorkspace[collectionKey];
        }

        function addLifeRow(collectionKey) {
            openAddItemModal(collectionKey, 'life');
        }

        function removeLifeRow(collectionKey, rowId) {
            const rows = getLifeRows(collectionKey);
            const nextRows = rows.filter(item => String(item.id) !== String(rowId));
            if (nextRows.length === rows.length) return;
            lifeWorkspace[collectionKey] = nextRows;
            if (collectionKey === 'habits') {
                const completionMap = lifeWorkspace.habitCompletions && typeof lifeWorkspace.habitCompletions === 'object'
                    ? lifeWorkspace.habitCompletions
                    : {};
                Object.keys(completionMap).forEach(day => {
                    const nextIds = (completionMap[day] || []).filter(id => String(id) !== String(rowId));
                    if (nextIds.length) completionMap[day] = nextIds;
                    else delete completionMap[day];
                });
                lifeWorkspace.habitCompletions = completionMap;
            }
            persistAppData();
            renderLifeWorkspace();
        }

        function updateLifeField(target) {
            if (!target || !target.dataset) return;
            const collection = target.dataset.lifeCollection;
            const rowId = target.dataset.lifeRowId;
            const field = target.dataset.lifeField;
            if (!collection || !rowId || !field) return;
            const row = getLifeRows(collection).find(item => String(item.id) === String(rowId));
            if (!row) return;
            let value = target.type === 'checkbox' ? !!target.checked : target.value;
            if (field === 'progress') value = Math.max(0, Math.min(100, normalizeFiniteNumber(value, 0)));
            if (field === 'targetPerWeek') value = Math.max(1, Math.min(14, Math.floor(normalizeFiniteNumber(value, 7))));
            if (field === 'hoursInvested' || field === 'durationMinutes' || field === 'amount') value = Math.max(0, normalizeFiniteNumber(value, 0));
            if (field === 'pagesRead' || field === 'totalPages') value = Math.max(0, Math.floor(normalizeFiniteNumber(value, 0)));
            if (field === 'rating') value = Math.max(0, Math.min(5, normalizeFiniteNumber(value, 0)));
            row[field] = value;
            persistAppData();
            renderLifeWorkspace();
        }

        function toggleLifeHabitForToday(habitId, completed) {
            if (!lifeWorkspace.habitCompletions || typeof lifeWorkspace.habitCompletions !== 'object') {
                lifeWorkspace.habitCompletions = {};
            }
            const key = today();
            const current = Array.isArray(lifeWorkspace.habitCompletions[key]) ? [...lifeWorkspace.habitCompletions[key]] : [];
            const set = new Set(current.map(id => String(id)));
            if (completed) set.add(String(habitId));
            else set.delete(String(habitId));
            const next = Array.from(set);
            if (next.length) lifeWorkspace.habitCompletions[key] = next;
            else delete lifeWorkspace.habitCompletions[key];
            persistAppData();
            renderLifeWorkspace();
        }

        function getLifeHabitStreak(habitId) {
            const completionMap = lifeWorkspace.habitCompletions && typeof lifeWorkspace.habitCompletions === 'object'
                ? lifeWorkspace.habitCompletions
                : {};
            let streak = 0;
            let cursor = new Date();
            cursor.setHours(0, 0, 0, 0);
            while (true) {
                const key = dateKey(cursor);
                const ids = Array.isArray(completionMap[key]) ? completionMap[key].map(id => String(id)) : [];
                if (!ids.includes(String(habitId))) break;
                streak += 1;
                cursor.setDate(cursor.getDate() - 1);
            }
            return streak;
        }

        function getLifeHabitConsistencyPercent() {
            const habits = getLifeRows('habits');
            if (!habits.length) return 0;
            const completionMap = lifeWorkspace.habitCompletions && typeof lifeWorkspace.habitCompletions === 'object'
                ? lifeWorkspace.habitCompletions
                : {};
            let completed = 0;
            for (let i = 0; i < 7; i += 1) {
                const key = offsetDateKey(-i);
                completed += Array.isArray(completionMap[key]) ? completionMap[key].length : 0;
            }
            const possible = habits.length * 7;
            return possible > 0 ? Math.round((completed / possible) * 100) : 0;
        }

        function renderLifeGoalRows() {
            const body = document.getElementById('lifeGoalsTableBody');
            if (!body) return;
            const rows = getLifeRows('goals');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="9">No SMART goals yet. Add your first goal with measurable progress.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="title" value="${escapeHtml(String(row.title || ''))}" placeholder="Goal"></td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="specific" placeholder="Specific">${escapeHtml(String(row.specific || ''))}</textarea></td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="measurable" placeholder="Measurable">${escapeHtml(String(row.measurable || ''))}</textarea></td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="achievable" placeholder="Achievable">${escapeHtml(String(row.achievable || ''))}</textarea></td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="relevant" placeholder="Relevant">${escapeHtml(String(row.relevant || ''))}</textarea></td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="timeBound" placeholder="Time-bound">${escapeHtml(String(row.timeBound || ''))}</textarea></td>
                    <td><input type="date" class="college-input" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="targetDate" value="${escapeHtml(String(row.targetDate || ''))}"></td>
                    <td><input type="number" min="0" max="100" class="college-input" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="progress" value="${escapeHtml(String(row.progress || 0))}"></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="goals" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete goal"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderLifeHabitRows() {
            const body = document.getElementById('lifeHabitsTableBody');
            if (!body) return;
            const rows = getLifeRows('habits');
            const todayKey = today();
            const todayCompletions = lifeWorkspace.habitCompletions && Array.isArray(lifeWorkspace.habitCompletions[todayKey])
                ? lifeWorkspace.habitCompletions[todayKey].map(id => String(id))
                : [];
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No habits yet. Add habits and mark daily completion to build streaks.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-life-collection="habits" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="name" value="${escapeHtml(String(row.name || ''))}" placeholder="Habit"></td>
                    <td><input class="college-input" data-life-collection="habits" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="category" value="${escapeHtml(String(row.category || ''))}" placeholder="Category"></td>
                    <td><input type="number" min="1" max="14" class="college-input" data-life-collection="habits" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="targetPerWeek" value="${escapeHtml(String(row.targetPerWeek || 7))}"></td>
                    <td class="college-cell-center"><input type="checkbox" data-life-habit-row-id="${escapeHtml(String(row.id))}" ${todayCompletions.includes(String(row.id)) ? 'checked' : ''}></td>
                    <td>${getLifeHabitStreak(row.id)} days</td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="habits" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete habit"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderLifeSkillRows() {
            const body = document.getElementById('lifeSkillsTableBody');
            if (!body) return;
            const rows = getLifeRows('skills');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No skills tracked yet. Add skills you want to grow this year.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-life-collection="skills" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="name" value="${escapeHtml(String(row.name || ''))}" placeholder="Skill"></td>
                    <td>
                        <select class="college-select" data-life-collection="skills" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="level">
                            <option value="beginner" ${row.level === 'beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="intermediate" ${row.level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="advanced" ${row.level === 'advanced' ? 'selected' : ''}>Advanced</option>
                        </select>
                    </td>
                    <td><input type="number" min="0" class="college-input" data-life-collection="skills" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="hoursInvested" value="${escapeHtml(String(row.hoursInvested || 0))}"></td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="skills" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="nextMilestone" placeholder="Next milestone">${escapeHtml(String(row.nextMilestone || ''))}</textarea></td>
                    <td>
                        <select class="college-select" data-life-collection="skills" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="status">
                            <option value="active" ${row.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="paused" ${row.status === 'paused' ? 'selected' : ''}>Paused</option>
                            <option value="completed" ${row.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="skills" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete skill"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderLifeFitnessRows() {
            const body = document.getElementById('lifeFitnessTableBody');
            if (!body) return;
            const rows = getLifeRows('fitness');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="6">No fitness logs yet. Add workouts and activity sessions.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input type="date" class="college-input" data-life-collection="fitness" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="date" value="${escapeHtml(String(row.date || ''))}"></td>
                    <td><input class="college-input" data-life-collection="fitness" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="activity" value="${escapeHtml(String(row.activity || ''))}" placeholder="Activity"></td>
                    <td><input type="number" min="0" class="college-input" data-life-collection="fitness" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="durationMinutes" value="${escapeHtml(String(row.durationMinutes || 0))}"></td>
                    <td>
                        <select class="college-select" data-life-collection="fitness" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="intensity">
                            <option value="light" ${row.intensity === 'light' ? 'selected' : ''}>Light</option>
                            <option value="moderate" ${row.intensity === 'moderate' ? 'selected' : ''}>Moderate</option>
                            <option value="high" ${row.intensity === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </td>
                    <td><textarea class="college-textarea" rows="1" data-life-collection="fitness" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="notes" placeholder="Notes">${escapeHtml(String(row.notes || ''))}</textarea></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="fitness" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete fitness row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderLifeBookRows() {
            const body = document.getElementById('lifeBooksTableBody');
            if (!body) return;
            const rows = getLifeRows('books');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="7">No books tracked yet. Build your reading stack here.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input class="college-input" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="title" value="${escapeHtml(String(row.title || ''))}" placeholder="Title"></td>
                    <td><input class="college-input" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="author" value="${escapeHtml(String(row.author || ''))}" placeholder="Author"></td>
                    <td>
                        <select class="college-select" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="status">
                            <option value="reading" ${row.status === 'reading' ? 'selected' : ''}>Reading</option>
                            <option value="planned" ${row.status === 'planned' ? 'selected' : ''}>Planned</option>
                            <option value="completed" ${row.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td><input type="number" min="0" class="college-input" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="pagesRead" value="${escapeHtml(String(row.pagesRead || 0))}"></td>
                    <td><input type="number" min="0" class="college-input" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="totalPages" value="${escapeHtml(String(row.totalPages || 0))}"></td>
                    <td><input type="number" min="0" max="5" step="0.5" class="college-input" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="rating" value="${escapeHtml(String(row.rating || 0))}"></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="books" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete book row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderLifeSpendingRows() {
            const body = document.getElementById('lifeSpendingTableBody');
            if (!body) return;
            const rows = getLifeRows('spending');
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="5">No spending entries yet. Add transactions to track monthly spend.</td></tr>';
                renderSpendingBreakdown([]);
                return;
            }
            // Sort by date descending (newest first)
            const sorted = rows.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
            body.innerHTML = sorted.map(row => {
                const amt = Math.max(0, normalizeFiniteNumber(row.amount, 0));
                return `
                <tr>
                    <td><input type="date" class="college-input" data-life-collection="spending" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="date" value="${escapeHtml(String(row.date || ''))}"></td>
                    <td><input class="college-input" data-life-collection="spending" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="category" value="${escapeHtml(String(row.category || ''))}" placeholder="Category"></td>
                    <td class="spending-col-right"><input type="number" min="0" step="0.01" class="college-input" style="text-align:right" data-life-collection="spending" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="amount" value="${amt.toFixed(2)}"></td>
                    <td><input class="college-input" data-life-collection="spending" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="note" value="${escapeHtml(String(row.note || ''))}" placeholder="Note"></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="spending" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete spending row"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            }).join('');
            renderSpendingBreakdown(sorted);
        }

        function renderSpendingBreakdown(allRows) {
            const breakdownBody = document.getElementById('spendingBreakdownBody');
            const breakdownFoot = document.getElementById('spendingBreakdownFoot');
            const periodLabel = document.getElementById('spendingBreakdownPeriod');
            const statMonth = document.getElementById('spendingStatMonth');
            const statCount = document.getElementById('spendingStatCount');
            const statAvg = document.getElementById('spendingStatAvg');
            const statTopCat = document.getElementById('spendingStatTopCat');

            const now = new Date();
            const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
            const monthRows = (allRows || []).filter(row => String(row.date || '').startsWith(monthPrefix));

            // Compute stats
            const total = monthRows.reduce((s, r) => s + Math.max(0, normalizeFiniteNumber(r.amount, 0)), 0);
            const count = monthRows.length;
            const avg = count ? total / count : 0;

            // By category
            const byCategory = {};
            monthRows.forEach(row => {
                const cat = String(row.category || 'Uncategorized');
                byCategory[cat] = (byCategory[cat] || 0) + Math.max(0, normalizeFiniteNumber(row.amount, 0));
            });
            const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
            const topCat = catEntries.length ? catEntries[0][0] : '\u2014';

            // Stat cards
            if (statMonth) statMonth.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (statCount) statCount.textContent = String(count);
            if (statAvg) statAvg.textContent = `$${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (statTopCat) statTopCat.textContent = topCat;
            if (periodLabel) periodLabel.textContent = `\u2014 ${monthName}`;

            // Breakdown table
            if (breakdownBody) {
                if (!catEntries.length) {
                    breakdownBody.innerHTML = '<tr class="college-empty-row"><td colspan="4">No transactions this month.</td></tr>';
                } else {
                    breakdownBody.innerHTML = catEntries.map(([cat, val]) => {
                        const pct = total ? ((val / total) * 100) : 0;
                        return `<tr>
                            <td><strong>${escapeHtml(cat)}</strong></td>
                            <td class="spending-col-right">$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td class="spending-col-right">${pct.toFixed(1)}%</td>
                            <td><div class="spending-cat-bar-wrap"><div class="spending-cat-bar" style="width:${pct.toFixed(1)}%"></div></div></td>
                        </tr>`;
                    }).join('');
                }
            }
            if (breakdownFoot) {
                if (catEntries.length) {
                    breakdownFoot.innerHTML = `<tr>
                        <td><strong>Total</strong></td>
                        <td class="spending-col-right"><strong>$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                        <td class="spending-col-right">100%</td>
                        <td></td>
                    </tr>`;
                } else {
                    breakdownFoot.innerHTML = '';
                }
            }
        }

        function renderLifeJournalRows() {
            const body = document.getElementById('lifeJournalTableBody');
            if (!body) return;
            const rows = getLifeRows('journals').slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
            if (!rows.length) {
                body.innerHTML = '<tr class="college-empty-row"><td colspan="5">No journal entries yet. Use Quick Create to add today\'s entry.</td></tr>';
                return;
            }
            body.innerHTML = rows.map(row => `
                <tr>
                    <td><input type="date" class="college-input" data-life-collection="journals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="date" value="${escapeHtml(String(row.date || ''))}"></td>
                    <td><input class="college-input" data-life-collection="journals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="title" value="${escapeHtml(String(row.title || ''))}" placeholder="Title"></td>
                    <td><input class="college-input" data-life-collection="journals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="mood" value="${escapeHtml(String(row.mood || ''))}" placeholder="Mood"></td>
                    <td><textarea class="college-textarea" rows="2" data-life-collection="journals" data-life-row-id="${escapeHtml(String(row.id))}" data-life-field="content" placeholder="Entry">${escapeHtml(String(row.content || ''))}</textarea></td>
                    <td class="college-row-actions"><button type="button" class="icon-btn life-delete-row-btn" data-life-collection="journals" data-life-row-id="${escapeHtml(String(row.id))}" aria-label="Delete journal row"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        function renderLifeSpendingSummary() {
            const summaryEl = document.getElementById('lifeSpendingSummary');
            const monthlyValueEl = document.getElementById('lifeMonthlySpendValue');
            if (!summaryEl && !monthlyValueEl) return;
            const now = new Date();
            const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const monthRows = getLifeRows('spending').filter(row => String(row.date || '').startsWith(monthPrefix));
            const total = monthRows.reduce((sum, row) => sum + Math.max(0, normalizeFiniteNumber(row.amount, 0)), 0);
            const byCategory = {};
            monthRows.forEach(row => {
                const category = String(row.category || 'Uncategorized');
                byCategory[category] = (byCategory[category] || 0) + Math.max(0, normalizeFiniteNumber(row.amount, 0));
            });
            if (monthlyValueEl) monthlyValueEl.textContent = `$${total.toFixed(2)}`;
            if (summaryEl) {
                const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
                if (!entries.length) {
                    summaryEl.innerHTML = '<div class="empty-state"><div class="empty-title">No spending this month</div><div class="empty-subtitle">Add entries to generate category summaries.</div></div>';
                } else {
                    summaryEl.innerHTML = entries.map(([category, value]) => `
                        <div class="life-spending-summary-item">
                            <span>${escapeHtml(category)}</span>
                            <strong>$${value.toFixed(2)}</strong>
                        </div>
                    `).join('');
                }
            }
        }

        function quickCreateTodayJournal() {
            const todayDate = today();
            const existing = getLifeRows('journals').find(row => String(row.date || '') === todayDate);
            if (existing) {
                showToast('Today\'s journal already exists.');
                return;
            }
            getLifeRows('journals').unshift(createLifeJournalRow({
                date: todayDate,
                title: `Journal ${todayDate}`,
                mood: 'Neutral',
                content: 'Highlights:\nWins:\nWhat I learned:\nTomorrow focus:'
            }));
            persistAppData();
            renderLifeWorkspace();
            showToast('Today\'s journal created.');
        }

        function renderLifeSummary() {
            const habitConsistencyEl = document.getElementById('lifeHabitConsistencyValue');
            const goalsProgressEl = document.getElementById('lifeGoalsProgressValue');
            if (habitConsistencyEl) habitConsistencyEl.textContent = `${getLifeHabitConsistencyPercent()}%`;
            const goals = getLifeRows('goals');
            const avgGoalProgress = goals.length
                ? Math.round(goals.reduce((sum, row) => sum + Math.max(0, Math.min(100, normalizeFiniteNumber(row.progress, 0))), 0) / goals.length)
                : 0;
            if (goalsProgressEl) goalsProgressEl.textContent = `${avgGoalProgress}%`;
            renderLifeSpendingSummary();
        }

        function renderLifeWorkspace() {
            const root = document.getElementById('view-life');
            if (!root) return;
            lifeWorkspace = normalizeLifeWorkspace(lifeWorkspace);
            renderLifeGoalRows();
            renderLifeHabitRows();
            renderLifeSkillRows();
            renderLifeFitnessRows();
            renderLifeBookRows();
            renderLifeSpendingRows();
            renderLifeJournalRows();
            renderLifeSummary();
        }

        function initLifeWorkspaceUI() {
            const root = document.getElementById('view-life');
            if (!root) return;
            if (root.dataset.bound === 'true') {
                renderLifeWorkspace();
                return;
            }
            root.dataset.bound = 'true';

            // --- Sub-page navigation ---
            function lifeShowDashboard() {
                const dashboard = document.getElementById('lifeDashboard');
                root.querySelectorAll('.life-subpage').forEach(sp => sp.style.display = 'none');
                if (dashboard) dashboard.style.display = '';
            }

            function lifeShowPage(pageKey) {
                const dashboard = document.getElementById('lifeDashboard');
                const page = document.getElementById('lifePage-' + pageKey);
                if (!page) return;
                if (dashboard) dashboard.style.display = 'none';
                root.querySelectorAll('.life-subpage').forEach(sp => sp.style.display = 'none');
                page.style.display = '';
            }

            // Quick-add buttons on the dashboard should also navigate to the relevant page
            const lifeQuickAddPageMap = {
                lifeQuickAddGoalBtn: 'goals',
                lifeQuickAddHabitBtn: 'habits',
                lifeQuickJournalTopBtn: 'journal'
            };

            root.addEventListener('click', (event) => {
                // Nav grid buttons
                const navBtn = event.target.closest('[data-life-page]');
                if (navBtn) {
                    lifeShowPage(navBtn.dataset.lifePage);
                    return;
                }

                // Back buttons
                const backBtn = event.target.closest('[data-life-back]');
                if (backBtn) {
                    lifeShowDashboard();
                    return;
                }

                const addButton = event.target.closest('#lifeAddGoalBtn, #lifeAddHabitBtn, #lifeAddSkillBtn, #lifeAddFitnessBtn, #lifeAddBookBtn, #lifeAddSpendingBtn, #lifeQuickAddGoalBtn, #lifeQuickAddHabitBtn');
                if (addButton) {
                    const map = {
                        lifeAddGoalBtn: 'goals',
                        lifeQuickAddGoalBtn: 'goals',
                        lifeAddHabitBtn: 'habits',
                        lifeQuickAddHabitBtn: 'habits',
                        lifeAddSkillBtn: 'skills',
                        lifeAddFitnessBtn: 'fitness',
                        lifeAddBookBtn: 'books',
                        lifeAddSpendingBtn: 'spending'
                    };
                    const key = map[addButton.id];
                    if (key) addLifeRow(key);
                    // If it's a quick-add from the dashboard, navigate to the sub-page
                    const targetPage = lifeQuickAddPageMap[addButton.id];
                    if (targetPage) lifeShowPage(targetPage);
                    return;
                }

                const deleteBtn = event.target.closest('.life-delete-row-btn');
                if (deleteBtn) {
                    removeLifeRow(deleteBtn.dataset.lifeCollection, deleteBtn.dataset.lifeRowId);
                    return;
                }

                const quickJournalBtn = event.target.closest('#lifeQuickJournalBtn, #lifeQuickJournalTopBtn');
                if (quickJournalBtn) {
                    quickCreateTodayJournal();
                    // Navigate to journal page if triggered from dashboard
                    if (quickJournalBtn.id === 'lifeQuickJournalTopBtn') lifeShowPage('journal');
                }
            });

            root.addEventListener('change', (event) => {
                const habitCheckbox = event.target.closest('[data-life-habit-row-id]');
                if (habitCheckbox) {
                    toggleLifeHabitForToday(habitCheckbox.dataset.lifeHabitRowId, !!habitCheckbox.checked);
                    return;
                }
                const fieldEl = event.target.closest('[data-life-field]');
                if (fieldEl) {
                    updateLifeField(fieldEl);
                }
            });

            // Ensure dashboard is visible on init
            lifeShowDashboard();

            renderLifeWorkspace();
        }
        // ------------------ end Life Workspace ------------------

        // -------------------- Focus Timer (single duration H:M:S) --------------------
        const FOCUS_KEY = 'noteflow_focus_timer';
        const DEFAULT_TIMER_RINGTONE = 'classic';
        const DEFAULT_TIMER_VOLUME = 0.6;
        const TIMER_RINGTONE_PRESETS = Object.freeze({
            classic: [
                { freq: 880, start: 0.0, duration: 0.28, type: 'sine', gain: 1.0 },
                { freq: 1174, start: 0.16, duration: 0.28, type: 'sine', gain: 0.95 }
            ],
            digital: [
                { freq: 740, start: 0.0, duration: 0.12, type: 'square', gain: 0.8 },
                { freq: 740, start: 0.18, duration: 0.12, type: 'square', gain: 0.8 },
                { freq: 988, start: 0.36, duration: 0.18, type: 'square', gain: 0.9 }
            ],
            soft: [
                { freq: 523, start: 0.0, duration: 0.42, type: 'triangle', gain: 0.56 },
                { freq: 659, start: 0.27, duration: 0.36, type: 'triangle', gain: 0.5 }
            ],
            zen: [
                { freq: 392, start: 0.0, duration: 0.48, type: 'sine', gain: 0.52 },
                { freq: 523, start: 0.2, duration: 0.44, type: 'sine', gain: 0.48 },
                { freq: 659, start: 0.42, duration: 0.38, type: 'sine', gain: 0.44 }
            ],
            sonar: [
                { freq: 440, start: 0.0, duration: 0.18, type: 'sine', gain: 0.75 },
                { freq: 440, start: 0.26, duration: 0.18, type: 'sine', gain: 0.67 },
                { freq: 330, start: 0.56, duration: 0.26, type: 'sine', gain: 0.58 }
            ],
            arcade: [
                { freq: 784, start: 0.0, duration: 0.12, type: 'square', gain: 0.86 },
                { freq: 988, start: 0.14, duration: 0.12, type: 'square', gain: 0.86 },
                { freq: 1318, start: 0.28, duration: 0.18, type: 'square', gain: 0.88 }
            ],
            crystal: [
                { freq: 1046, start: 0.0, duration: 0.2, type: 'triangle', gain: 0.62 },
                { freq: 1396, start: 0.16, duration: 0.22, type: 'triangle', gain: 0.58 },
                { freq: 1567, start: 0.34, duration: 0.26, type: 'triangle', gain: 0.54 }
            ]
        });
        let focusTimer = {
            durationSeconds: 25 * 60,
            remaining: 25 * 60,
            running: false,
            intervalId: null,
            endsAtMs: null,
            ringtone: DEFAULT_TIMER_RINGTONE,
            volume: DEFAULT_TIMER_VOLUME
        };
        let timerChimeAudioCtx = null;
        let timerDoneAlarmIntervalId = null;
        let timerWheelAnimTimeoutId = null;
        let focusTimerVisibilityBound = false;

        function normalizeTimerRingtone(value) {
            const key = String(value || '').trim().toLowerCase();
            if (Object.prototype.hasOwnProperty.call(TIMER_RINGTONE_PRESETS, key)) {
                return key;
            }
            return DEFAULT_TIMER_RINGTONE;
        }

        function normalizeTimerVolume(value) {
            const num = Number(value);
            if (!Number.isFinite(num)) return DEFAULT_TIMER_VOLUME;
            return Math.max(0, Math.min(1, num));
        }

        function primeTimerAudio() {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                if (!timerChimeAudioCtx) timerChimeAudioCtx = new AC();
                if (timerChimeAudioCtx.state === 'suspended') {
                    timerChimeAudioCtx.resume();
                }
            } catch (e) {
                // Audio init is non-critical.
            }
        }

        function playTimerDoneChime() {
            try {
                primeTimerAudio();
                if (!timerChimeAudioCtx) return;
                const now = timerChimeAudioCtx.currentTime;
                const ringtone = normalizeTimerRingtone(focusTimer.ringtone);
                const volume = normalizeTimerVolume(focusTimer.volume);
                if (volume <= 0) return;

                const steps = TIMER_RINGTONE_PRESETS[ringtone] || TIMER_RINGTONE_PRESETS[DEFAULT_TIMER_RINGTONE];
                steps.forEach((step) => {
                    const startAt = now + (Number(step.start) || 0);
                    const duration = Math.max(0.08, Number(step.duration) || 0.2);
                    const peakGain = Math.max(0.0002, (Number(step.gain) || 0.6) * volume * 0.12);
                    const osc = timerChimeAudioCtx.createOscillator();
                    const gain = timerChimeAudioCtx.createGain();
                    osc.type = step.type || 'sine';
                    osc.frequency.setValueAtTime(Number(step.freq) || 880, startAt);
                    gain.gain.setValueAtTime(0.0001, startAt);
                    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.018);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
                    osc.connect(gain);
                    gain.connect(timerChimeAudioCtx.destination);
                    osc.start(startAt);
                    osc.stop(startAt + duration + 0.02);
                });
            } catch (e) {
                // Ignore audio errors so timer behavior is unaffected.
            }
        }

        function stopTimerDoneAlarm() {
            if (timerDoneAlarmIntervalId) {
                clearInterval(timerDoneAlarmIntervalId);
                timerDoneAlarmIntervalId = null;
            }
        }

        function startTimerDoneAlarm() {
            stopTimerDoneAlarm();
            playTimerDoneChime();
            timerDoneAlarmIntervalId = setInterval(() => {
                playTimerDoneChime();
            }, 1800);
        }

        function hideTimerDonePopup() {
            const popup = document.getElementById('timerDonePopup');
            if (!popup) return;
            popup.classList.remove('active');
            stopTimerDoneAlarm();
        }

        function showTimerDonePopup() {
            const popup = document.getElementById('timerDonePopup');
            if (!popup) return;
            popup.classList.add('active');
            startTimerDoneAlarm();
        }

        function completeTimer() {
            pauseTimer();
            focusTimer.remaining = 0;
            saveFocusState();
            updateTimerUI();
            showTimerDonePopup();

        }

        function formatTime(sec) {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
            const s = (sec % 60).toString().padStart(2, '0');
            return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
        }

        function splitTimerChars(value) {
            return String(value || '00:00').split('');
        }

        function buildTimerCharsMarkup(chars) {
            return chars.map((ch) => {
                if (ch === ':') return '<span class="timer-wheel-sep">:</span>';
                return `<span class="timer-wheel-segment" style="width:1ch"><span class="timer-wheel-static">${ch}</span></span>`;
            }).join('');
        }

        function setTimerDisplayStatic(value) {
            const display = document.getElementById('timerDisplay');
            if (!display) return;
            const chars = splitTimerChars(value);
            display.innerHTML = buildTimerCharsMarkup(chars);
            display.dataset.value = value;
        }

        function renderWheelTimerDisplay(nextValue) {
            const display = document.getElementById('timerDisplay');
            if (!display) return;

            const currentValue = display.dataset.value || nextValue;
            if (currentValue === nextValue) {
                if (!display.dataset.value) setTimerDisplayStatic(nextValue);
                return;
            }

            const prevChars = splitTimerChars(currentValue);
            const nextChars = splitTimerChars(nextValue);
            if (prevChars.length !== nextChars.length) {
                setTimerDisplayStatic(nextValue);
                return;
            }

            let hasChangedChar = false;
            const markup = nextChars.map((nextCh, index) => {
                const prevCh = prevChars[index];
                if (nextCh === ':') return '<span class="timer-wheel-sep">:</span>';
                if (prevCh !== nextCh) {
                    hasChangedChar = true;
                    return `<span class="timer-wheel-segment timer-wheel-segment-animate" style="width:1ch"><span class="timer-wheel-face timer-wheel-prev">${prevCh}</span><span class="timer-wheel-face timer-wheel-next">${nextCh}</span></span>`;
                }
                return `<span class="timer-wheel-segment" style="width:1ch"><span class="timer-wheel-static">${nextCh}</span></span>`;
            }).join('');

            if (!hasChangedChar) {
                setTimerDisplayStatic(nextValue);
                return;
            }

            display.innerHTML = markup;
            display.dataset.value = nextValue;

            if (timerWheelAnimTimeoutId) clearTimeout(timerWheelAnimTimeoutId);
            timerWheelAnimTimeoutId = setTimeout(() => {
                setTimerDisplayStatic(nextValue);
                timerWheelAnimTimeoutId = null;
            }, 280);
        }

        function saveFocusState() {
            const stateToSave = {
                durationSeconds: focusTimer.durationSeconds,
                remaining: focusTimer.remaining,
                running: focusTimer.running,
                endsAtMs: focusTimer.running && typeof focusTimer.endsAtMs === 'number'
                    ? focusTimer.endsAtMs
                    : null,
                ringtone: normalizeTimerRingtone(focusTimer.ringtone),
                volume: normalizeTimerVolume(focusTimer.volume)
            };
            if (appSettings) {
                appSettings.focusTimer = stateToSave;
                persistAppData();
            } else {
                localStorage.setItem(FOCUS_KEY, JSON.stringify(stateToSave));
            }
        }

        function loadFocusState() {
            try {
                if (appSettings && appSettings.focusTimer) {
                    const obj = appSettings.focusTimer;
                    focusTimer.durationSeconds = typeof obj.durationSeconds === 'number' ? obj.durationSeconds : focusTimer.durationSeconds;
                    focusTimer.remaining = typeof obj.remaining === 'number' ? obj.remaining : focusTimer.durationSeconds;
                    const storedEndsAt = typeof obj.endsAtMs === 'number' ? obj.endsAtMs : null;
                    if (obj.running && storedEndsAt) {
                        focusTimer.remaining = Math.max(0, Math.ceil((storedEndsAt - Date.now()) / 1000));
                    }
                    // Safety: keep timer paused after startup and user can resume manually.
                    focusTimer.running = false;
                    focusTimer.endsAtMs = null;
                    focusTimer.ringtone = normalizeTimerRingtone(obj.ringtone);
                    focusTimer.volume = normalizeTimerVolume(obj.volume);
                    return;
                }
                const stored = localStorage.getItem(FOCUS_KEY);
                if (stored) {
                    const obj = JSON.parse(stored);
                    focusTimer.durationSeconds = typeof obj.durationSeconds === 'number' ? obj.durationSeconds : focusTimer.durationSeconds;
                    focusTimer.remaining = typeof obj.remaining === 'number' ? obj.remaining : focusTimer.durationSeconds;
                    const storedEndsAt = typeof obj.endsAtMs === 'number' ? obj.endsAtMs : null;
                    if (obj.running && storedEndsAt) {
                        focusTimer.remaining = Math.max(0, Math.ceil((storedEndsAt - Date.now()) / 1000));
                    }
                    focusTimer.running = false;
                    focusTimer.endsAtMs = null;
                    focusTimer.ringtone = normalizeTimerRingtone(obj.ringtone);
                    focusTimer.volume = normalizeTimerVolume(obj.volume);
                } else {
                    focusTimer.remaining = focusTimer.durationSeconds;
                    focusTimer.running = false;
                    focusTimer.endsAtMs = null;
                    focusTimer.ringtone = DEFAULT_TIMER_RINGTONE;
                    focusTimer.volume = DEFAULT_TIMER_VOLUME;
                }
            } catch (e) {
                focusTimer.remaining = focusTimer.durationSeconds;
                focusTimer.running = false;
                focusTimer.endsAtMs = null;
                focusTimer.ringtone = DEFAULT_TIMER_RINGTONE;
                focusTimer.volume = DEFAULT_TIMER_VOLUME;
            }
        }

        function updateTimerUI() {
            const display = document.getElementById('timerDisplay');
            const modeEl = document.getElementById('timerMode');
            const progressBar = document.getElementById('timerProgress');
            if (!display || !modeEl || !progressBar) return;

            renderWheelTimerDisplay(formatTime(focusTimer.remaining));
            modeEl.textContent = 'Timer';

            const total = Math.max(1, focusTimer.durationSeconds);
            const perc = Math.max(0, Math.min(100, ((total - focusTimer.remaining) / total) * 100));
            progressBar.style.width = perc + '%';

            // buttons
            document.getElementById('timerStartBtn').style.display = focusTimer.running ? 'none' : 'inline-block';
            document.getElementById('timerPauseBtn').style.display = focusTimer.running ? 'inline-block' : 'none';
        }

        function syncRunningTimerFromClock() {
            if (!focusTimer.running || typeof focusTimer.endsAtMs !== 'number') return false;
            const nextRemaining = Math.max(0, Math.ceil((focusTimer.endsAtMs - Date.now()) / 1000));
            const changed = nextRemaining !== focusTimer.remaining;
            focusTimer.remaining = nextRemaining;
            return changed;
        }

        function tickTimer() {
            if (!focusTimer.running) return;
            const changed = syncRunningTimerFromClock();
            if (focusTimer.remaining <= 0) {
                completeTimer();
                return;
            }
            if (changed) {
                updateTimerUI();
            }
        }

        function startTimer() {
            if (focusTimer.running) return;
            primeTimerAudio();
            hideTimerDonePopup();
            if (focusTimer.intervalId) {
                clearInterval(focusTimer.intervalId);
                focusTimer.intervalId = null;
            }
            if (focusTimer.remaining <= 0) {
                focusTimer.remaining = Math.max(1, focusTimer.durationSeconds);
            }
            focusTimer.running = true;
            focusTimer.endsAtMs = Date.now() + (Math.max(0, focusTimer.remaining) * 1000);
            focusTimer.intervalId = setInterval(tickTimer, 250);
            saveFocusState();
            updateTimerUI();
        }

        function pauseTimer() {
            if (focusTimer.running) {
                syncRunningTimerFromClock();
            }
            focusTimer.running = false;
            focusTimer.endsAtMs = null;
            if (focusTimer.intervalId) {
                clearInterval(focusTimer.intervalId);
                focusTimer.intervalId = null;
            }
            stopTimerDoneAlarm();
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
            hideTimerDonePopup();
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

        function syncTimerAudioControls() {
            const ringtoneSelect = document.getElementById('timerRingtoneSelect');
            const volumeInput = document.getElementById('timerVolumeInput');
            const volumeValue = document.getElementById('timerVolumeValue');
            const ringtone = normalizeTimerRingtone(focusTimer.ringtone);
            const volume = Math.round(normalizeTimerVolume(focusTimer.volume) * 100);

            if (ringtoneSelect) ringtoneSelect.value = ringtone;
            if (volumeInput) volumeInput.value = String(volume);
            if (volumeValue) volumeValue.textContent = `${volume}%`;
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
            const ringtoneSelect = document.getElementById('timerRingtoneSelect');
            const volumeInput = document.getElementById('timerVolumeInput');
            const volumeValue = document.getElementById('timerVolumeValue');

            // initialize H:M:S inputs from durationSeconds
            const h = Math.floor(focusTimer.durationSeconds / 3600);
            const m = Math.floor((focusTimer.durationSeconds % 3600) / 60);
            const s = focusTimer.durationSeconds % 60;
            if (hoursInput) hoursInput.value = h;
            if (minutesInput) minutesInput.value = m;
            if (secondsInput) secondsInput.value = s;
            syncTimerAudioControls();
            const display = document.getElementById('timerDisplay');
            if (display) setTimerDisplayStatic(formatTime(focusTimer.remaining));

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

            if (ringtoneSelect) {
                ringtoneSelect.addEventListener('change', () => {
                    focusTimer.ringtone = normalizeTimerRingtone(ringtoneSelect.value);
                    saveFocusState();
                });
            }

            if (volumeInput) {
                const handleVolumeInput = () => {
                    const sliderValue = Number(volumeInput.value || 0);
                    focusTimer.volume = normalizeTimerVolume(sliderValue / 100);
                    if (volumeValue) {
                        volumeValue.textContent = `${Math.round(normalizeTimerVolume(focusTimer.volume) * 100)}%`;
                    }
                    saveFocusState();
                };
                volumeInput.addEventListener('input', handleVolumeInput);
                volumeInput.addEventListener('change', handleVolumeInput);
            }

            if (!focusTimerVisibilityBound) {
                focusTimerVisibilityBound = true;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState !== 'visible') return;
                    tickTimer();
                });
                window.addEventListener('focus', () => {
                    tickTimer();
                });
            }

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
            renderCollegeTracker();
            renderAcademicWorkspace();
            renderCollegeAppWorkspace();
            renderLifeWorkspace();
            // Initialize focus timer UI
            initFocusTimer();
            initLinkTooltip();
            initSlashCommands();
            initResizableMedia();
            initIconButtonAriaLabels();
            
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

            function getSelectedIndentableBlocks() {
                const selection = window.getSelection();
                if (!selection || !selection.rangeCount) return [];
                const range = selection.getRangeAt(0);
                const blockSelector = 'p, div, h1, h2, h3, h4, h5, h6';
                const blockSet = new Set();

                editor.querySelectorAll(blockSelector).forEach(block => {
                    if (!range.intersectsNode(block)) return;
                    if (block.closest('li, blockquote, pre, table, .media-wrapper, .checklist-item')) return;
                    blockSet.add(block);
                });

                if (blockSet.size > 0) return Array.from(blockSet);

                const node = selection.anchorNode;
                if (!node) return [];
                const baseElement = node.nodeType === 3 ? node.parentElement : node;
                if (!baseElement) return [];
                const fallbackBlock = baseElement.closest(blockSelector);
                if (!fallbackBlock) return [];
                if (!editor.contains(fallbackBlock)) return [];
                if (fallbackBlock.closest('li, blockquote, pre, table, .media-wrapper, .checklist-item')) return [];
                return [fallbackBlock];
            }

            function applyParagraphIndent(outdent = false) {
                let blocks = getSelectedIndentableBlocks();
                if (blocks.length === 0 && !outdent) {
                    try {
                        document.execCommand('formatBlock', false, 'p');
                    } catch (err) {
                        /* no-op */
                    }
                    blocks = getSelectedIndentableBlocks();
                }
                if (blocks.length === 0) return false;

                const indentStepPx = 36;
                const maxIndentPx = 288;

                blocks.forEach(block => {
                    const currentIndent = parseFloat(block.style.marginLeft || '0') || 0;
                    const nextIndent = outdent
                        ? Math.max(0, currentIndent - indentStepPx)
                        : Math.min(maxIndentPx, currentIndent + indentStepPx);

                    if (nextIndent === 0) {
                        block.style.marginLeft = '';
                    } else {
                        block.style.marginLeft = `${nextIndent}px`;
                    }
                    block.style.textIndent = '';
                });

                return true;
            }
            
            // Handle Enter key to break out of blockquotes and pre blocks
            editor.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();

                    const selection = window.getSelection();
                    if (!selection.rangeCount) return;
                    const node = selection.anchorNode;
                    const element = node.nodeType === 3 ? node.parentElement : node;
                    const inStructuredBlock = element && element.closest && element.closest('li, blockquote');
                    const inPreBlock = element && element.closest && element.closest('pre');

                    // For lists/quotes, use native indent/outdent behavior.
                    if (inStructuredBlock) {
                        try {
                            document.execCommand(e.shiftKey ? 'outdent' : 'indent', false, null);
                        } catch (err) {
                            // Fallback to plain spaces when command is unavailable.
                            if (!e.shiftKey) {
                                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                            }
                        }
                    } else if (inPreBlock) {
                        if (!e.shiftKey) {
                            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                        }
                    } else {
                        const applied = applyParagraphIndent(e.shiftKey);
                        if (!applied && !e.shiftKey) {
                            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                        }
                    }

                    updateWordCount();
                    debouncedSave();
                    return;
                }

                if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount && selection.isCollapsed) {
                        const blocks = getSelectedIndentableBlocks();
                        if (blocks.length === 1) {
                            const block = blocks[0];
                            const currentIndent = parseFloat(block.style.marginLeft || '0') || 0;
                            if (currentIndent > 0) {
                                const range = selection.getRangeAt(0);
                                const preCaretRange = range.cloneRange();
                                preCaretRange.selectNodeContents(block);
                                preCaretRange.setEnd(range.endContainer, range.endOffset);
                                const textBeforeCaret = preCaretRange.toString().replace(/[\u200B\u00A0]/g, '');

                                if (textBeforeCaret.length === 0) {
                                    e.preventDefault();
                                    applyParagraphIndent(true);
                                    updateWordCount();
                                    debouncedSave();
                                    return;
                                }
                            }
                        }
                    }
                }

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
        function toggleSidebarLegacy() {
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
            if (isCompactViewport()) {
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
                if (isCompactViewport() && sidebarEl && storage) {
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
                chatBtn.style.bottom = isCompactViewport() ? '80px' : '90px';
            }

            // Wire adjustment on load and resize so it adapts dynamically
            document.addEventListener('DOMContentLoaded', function() {
                adjustChatbotPosition();
                window.addEventListener('resize', adjustChatbotPosition);
            });
        
        function syncSidebarVisibilityState() {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar) return;
            const isCollapsed = sidebar.classList.contains('collapsed');
            sidebar.setAttribute('aria-hidden', isCollapsed ? 'true' : 'false');
            if (isCollapsed) {
                sidebar.style.setProperty('display', 'none', 'important');
                sidebar.setAttribute('inert', '');
            } else {
                sidebar.style.setProperty('display', 'flex', 'important');
                sidebar.removeAttribute('inert');
            }
        }

        function loadSidebarState() {
            const storedCollapsed = appSettings ? appSettings.sidebarCollapsed : false;
            const isCompact = isCompactViewport();
            const isCollapsed = isCompact ? true : !!storedCollapsed;
            const storageOptions = document.getElementById('storageOptions');
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('sidebarToggle');
            const overlay = document.getElementById('sidebarOverlay');
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
            if (overlay && isCompact) {
                overlay.classList.remove('active');
            }
            syncSidebarVisibilityState();
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

        function normalizeExternalUrl(value) {
            const raw = String(value || '').trim();
            if (!raw) return null;
            const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
            try {
                // Validate URL structure
                const parsed = new URL(normalized);
                return parsed.href;
            } catch (e) {
                return null;
            }
        }

        const iconButtonLabelHints = [
            ["scrollToolbar(-200)", 'Scroll toolbar left'],
            ["scrollToolbar(200)", 'Scroll toolbar right'],
            ["formatText('bold')", 'Bold'],
            ["formatText('italic')", 'Italic'],
            ["formatText('strikeThrough')", 'Strikethrough'],
            ["formatText('underline')", 'Underline'],
            ["formatText('insertUnorderedList')", 'Bullet list'],
            ["formatText('insertOrderedList')", 'Numbered list'],
            ["formatBlock('h1')", 'Heading 1'],
            ["formatBlock('h2')", 'Heading 2'],
            ["formatBlock('h3')", 'Heading 3'],
            ["formatBlock('blockquote')", 'Block quote'],
            ["formatBlock('pre')", 'Code block'],
            ['insertLink()', 'Insert link'],
            ['clearFormatting()', 'Clear formatting'],
            ['insertTable()', 'Insert table'],
            ['insertImage()', 'Insert image'],
            ['insertVideo()', 'Insert video'],
            ['insertAudio()', 'Insert audio'],
            ['insertEmbed()', 'Embed web content'],
            ['insertChecklist()', 'Insert checklist'],
            ['insertCollapsible()', 'Insert collapsible section'],
            ['insertPageLink()', 'Link to page'],
            ['toggleThemePanel()', 'Toggle theme panel'],
            ['toggleSidebar()', 'Toggle sidebar'],
            ['showAddTagInput()', 'Add tag'],
            ['deleteTodo(', 'Delete to-do']
        ];
        let iconButtonAriaBound = false;

        function isIconOnlyButton(button) {
            const clone = button.cloneNode(true);
            clone.querySelectorAll('i, svg, img').forEach(node => node.remove());
            const text = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
            return text === '';
        }

        function inferIconButtonAriaLabel(button) {
            const title = String(button.getAttribute('title') || '').trim();
            if (title) return title;

            const onclickAttr = String(button.getAttribute('onclick') || '');
            for (const [needle, label] of iconButtonLabelHints) {
                if (onclickAttr.includes(needle)) return label;
            }

            const icon = button.querySelector('i');
            const className = String(icon ? icon.className : '');
            if (className.includes('fa-bars')) return 'Toggle sidebar';
            if (className.includes('fa-palette')) return 'Toggle theme panel';
            if (className.includes('fa-cog')) return 'Settings';
            if (className.includes('fa-ellipsis')) return 'More actions';
            return '';
        }

        function applyIconButtonAriaLabels(root) {
            const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
            scope.querySelectorAll('button:not([aria-label])').forEach(button => {
                if (!isIconOnlyButton(button)) return;
                const label = inferIconButtonAriaLabel(button);
                if (!label) return;
                button.setAttribute('aria-label', label);
            });
        }

        function initIconButtonAriaLabels() {
            if (iconButtonAriaBound) return;
            iconButtonAriaBound = true;
            applyIconButtonAriaLabels(document);
            // Re-apply on view switches without using a broad DOM observer.
            window.addEventListener('noteflow:view-changed', () => {
                applyIconButtonAriaLabels(document);
            });
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
                    // "Due Today" should only include items due on this exact date.
                    // Undated one-off tasks stay visible in All Tasks.
                    if (!task.dueDate) return false;
                    return dateKeyStr === task.dueDate;
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
            if (task.scheduleType === 'weekly') return `Weekly - ${task.weeklyDays?.map(d => DAY_NAMES[d]).join(', ') || 'custom'}`;
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

        function normalizeDifficultyValue(difficulty) {
            const d = String(difficulty || '').toLowerCase();
            if (d === 'hard' || d === 'high') return 'hard';
            if (d === 'easy' || d === 'low') return 'easy';
            if (d === 'medium' || d === 'med') return 'medium';
            return 'medium';
        }

        function getTaskOrderStrategy() {
            if (!appSettings) return 'urgent_first';
            return appSettings.taskOrderStrategy === 'easy_first' ? 'easy_first' : 'urgent_first';
        }

        function getPriorityWeight(priority) {
            const normalized = normalizePriorityValue(priority);
            if (normalized === 'high') return 3;
            if (normalized === 'medium') return 2;
            return 1;
        }

        function getDifficultyWeight(difficulty) {
            const normalized = normalizeDifficultyValue(difficulty);
            if (normalized === 'easy') return 1;
            if (normalized === 'medium') return 2;
            return 3;
        }

        function getDateSortValue(value) {
            if (!value) return Infinity;
            const parsed = new Date(value);
            if (isNaN(parsed.getTime())) return Infinity;
            return parsed.getTime();
        }

        function compareTasksForDisplay(a, b) {
            const strategy = getTaskOrderStrategy();
            const pa = getPriorityWeight(a.priority);
            const pb = getPriorityWeight(b.priority);
            const da = getDifficultyWeight(a.difficulty);
            const db = getDifficultyWeight(b.difficulty);

            if (strategy === 'easy_first') {
                if (da !== db) return da - db; // easier first
                if (pa !== pb) return pb - pa; // then urgency
            } else {
                if (pa !== pb) return pb - pa; // urgency first
                if (da !== db) return da - db; // then easier
            }

            const dueA = getDateSortValue(a.dueDate);
            const dueB = getDateSortValue(b.dueDate);
            if (dueA !== dueB) return dueA - dueB;

            const createdA = getDateSortValue(a.createdAt);
            const createdB = getDateSortValue(b.createdAt);
            if (createdA !== createdB) return createdA - createdB;

            return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
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

        function inferHomeworkDifficulty(rawTask) {
            if (!rawTask) return 'medium';
            const explicit = rawTask.difficulty || rawTask.difficultyLevel || rawTask.effort;
            if (explicit) return normalizeDifficultyValue(explicit);
            return 'medium';
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
                    difficulty: normalizeDifficultyValue(item.difficulty || inferHomeworkDifficulty(item)),
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
                    difficulty: normalizeDifficultyValue(item.difficulty || inferHomeworkDifficulty(item)),
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

        function getHabitDayState(dateKeyStr) {
            if (!habitDayStates[dateKeyStr]) {
                habitDayStates[dateKeyStr] = { completedHabitIds: [] };
            }
            const state = habitDayStates[dateKeyStr];
            if (!Array.isArray(state.completedHabitIds)) state.completedHabitIds = [];
            return state;
        }

        function isHabitCompletedOn(habitId, dateKeyStr) {
            const state = habitDayStates[dateKeyStr];
            return !!(state && Array.isArray(state.completedHabitIds) && state.completedHabitIds.includes(habitId));
        }

        function getHabitCurrentStreak(habitId) {
            let streak = 0;
            const probe = new Date();
            for (let i = 0; i < 730; i += 1) {
                const key = dateKey(probe);
                if (!isHabitCompletedOn(habitId, key)) break;
                streak += 1;
                probe.setDate(probe.getDate() - 1);
            }
            return streak;
        }

        function getHabitWeeklyCount(habitId) {
            let count = 0;
            const probe = new Date();
            for (let i = 0; i < 7; i += 1) {
                const key = dateKey(probe);
                if (isHabitCompletedOn(habitId, key)) count += 1;
                probe.setDate(probe.getDate() - 1);
            }
            return count;
        }

        function renderHabitTracker() {
            const listEl = document.getElementById('habitList');
            const emptyEl = document.getElementById('habitEmpty');
            const countEl = document.getElementById('habitTodayCount');
            if (!listEl || !emptyEl || !countEl) return;

            const activeHabits = (Array.isArray(habits) ? habits : []).filter(habit => habit && habit.isActive !== false);
            const todayKey = today();
            const dayState = getHabitDayState(todayKey);
            const completedToday = Array.isArray(dayState.completedHabitIds) ? dayState.completedHabitIds : [];
            const activeHabitIdSet = new Set(activeHabits.map(habit => habit.id));
            const completedActiveHabitIds = completedToday.filter(id => activeHabitIdSet.has(id));

            countEl.textContent = `${completedActiveHabitIds.length} done`;
            maybeCelebrateHabitsCompletion(todayKey, activeHabits.length, completedActiveHabitIds);

            if (!activeHabits.length) {
                listEl.innerHTML = '';
                emptyEl.style.display = 'block';
                return;
            }

            emptyEl.style.display = 'none';
            listEl.innerHTML = activeHabits.map(habit => {
                const done = completedToday.includes(habit.id);
                const streak = getHabitCurrentStreak(habit.id);
                const weekly = getHabitWeeklyCount(habit.id);
                return `
                    <div class="task-card ${done ? 'completed' : ''}">
                        <div class="task-main">
                            <div class="task-title">${escapeHtml(habit.name || 'Untitled Habit')}</div>
                            <div class="task-meta">
                                <span>${weekly}/7 this week</span>
                                <span>&bull;</span>
                                <span>${streak} day streak</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="neumo-btn" onclick="toggleHabitComplete('${habit.id}')">${done ? 'Undo' : 'Done'}</button>
                            <button class="neumo-btn" onclick="if(confirm('Delete this habit?')) deleteHabit('${habit.id}')">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function addHabitFromInput() {
            const input = document.getElementById('habitNameInput');
            if (!input) return;
            const name = String(input.value || '').trim();
            if (!name) {
                showToast('Habit name required');
                return;
            }

            habits.unshift({
                id: generateId(),
                name,
                isActive: true,
                createdAt: new Date().toISOString()
            });
            input.value = '';
            persistAppData();
            renderHabitTracker();
            try { populateProgressDashboard(); } catch (e) { /* non-critical */ }
            showToast('Habit added');
        }

        function toggleHabitComplete(habitId) {
            const todayKey = today();
            const dayState = getHabitDayState(todayKey);
            const idx = dayState.completedHabitIds.indexOf(habitId);
            if (idx === -1) dayState.completedHabitIds.push(habitId);
            else dayState.completedHabitIds.splice(idx, 1);
            persistAppData();
            renderHabitTracker();
            try { populateProgressDashboard(); } catch (e) { /* non-critical */ }
        }

        function deleteHabit(habitId) {
            habits = habits.filter(habit => habit.id !== habitId);
            Object.values(habitDayStates).forEach(state => {
                if (state && Array.isArray(state.completedHabitIds)) {
                    state.completedHabitIds = state.completedHabitIds.filter(id => id !== habitId);
                }
            });
            persistAppData();
            renderHabitTracker();
            try { populateProgressDashboard(); } catch (e) { /* non-critical */ }
            showToast('Habit deleted');
        }

        function syncHomeworkTasksIntoTaskStore() {
            const snapshot = getHomeworkSnapshotForSync();
            const desiredMap = new Map(snapshot.map(item => [`hw_${item.source}_${item.sourceId}`, item]));
            const existingHomeworkTasks = tasks.filter(task => task.origin === 'homework');
            const existingTaskMap = new Map(tasks.map(task => [task.id, task]));
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
                const existing = existingTaskMap.get(id);
                const nextData = {
                    title: item.title,
                    notes: 'Synced from Homework',
                    scheduleType: 'once',
                    weeklyDays: [],
                    category: 'school',
                    priority: normalizePriorityValue(item.priority),
                    difficulty: normalizeDifficultyValue(item.difficulty),
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

        function updateHomeworkTaskInStorage(task, updates = {}) {
            if (!task || task.origin !== 'homework') return false;
            const source = task.homeworkSource || 'v2';
            const sourceId = String(task.homeworkSourceId || '');
            if (!sourceId) return false;

            const normalizedPriority = normalizePriorityValue(updates.priority || task.priority);
            const normalizedDifficulty = normalizeDifficultyValue(updates.difficulty || task.difficulty);
            const normalizedDueDate = updates.dueDate || null;
            let changed = false;

            if (source === 'v2') {
                const list = readLocalArraySafe('hwTasks:v2');
                const idx = list.findIndex(item => String(item.id) === sourceId);
                if (idx !== -1) {
                    list[idx].priority = normalizedPriority;
                    list[idx].difficulty = normalizedDifficulty;
                    list[idx].due = normalizedDueDate || '';
                    writeLocalArraySafe('hwTasks:v2', list);
                    changed = true;
                }
            } else if (source === 'v1') {
                const list = readLocalArraySafe('homeworkTasks:v1');
                const idx = list.findIndex(item => String(item.id) === sourceId);
                if (idx !== -1) {
                    list[idx].priority = normalizedPriority;
                    list[idx].difficulty = normalizedDifficulty;
                    list[idx].duedate = normalizedDueDate || '';
                    list[idx].due = normalizedDueDate || '';
                    writeLocalArraySafe('homeworkTasks:v1', list);
                    changed = true;
                }
            }

            if (changed) {
                try { window.dispatchEvent(new CustomEvent('homework:updated')); } catch (e) { /* no-op */ }
            }
            return changed;
        }

        function openHomeworkTaskModal(source = 'v2', sourceId = '') {
            const resolvedSource = source === 'v1' ? 'v1' : 'v2';
            const resolvedSourceId = String(sourceId || '').trim();
            if (!resolvedSourceId) return false;

            syncHomeworkTasksIntoTaskStore();
            const homeworkTaskId = `hw_${resolvedSource}_${resolvedSourceId}`;
            const task = tasks.find(item => item && item.id === homeworkTaskId && item.origin === 'homework');
            if (!task) {
                showToast('Could not open homework task');
                return false;
            }

            openTaskModal(homeworkTaskId);
            return true;
        }
        window.openHomeworkTaskModal = openHomeworkTaskModal;

        function renderTaskCard(task, options = {}) {
            const todayKey = today();
            const dayState = dayStates[todayKey];
            const committed = !!(dayState && Array.isArray(dayState.committedTaskIds) && dayState.committedTaskIds.includes(task.id));
            const completedToday = !!(dayState && Array.isArray(dayState.completedTaskIds) && dayState.completedTaskIds.includes(task.id));
            const normalizedPriority = normalizePriorityValue(task.priority);
            const normalizedDifficulty = normalizeDifficultyValue(task.difficulty);
            const noteTitle = task.noteId ? (pages.find(p => p.id === task.noteId)?.title || '') : '';
            const metaParts = [getScheduleLabel(task)];
            if (noteTitle) metaParts.push(noteTitle.split('::').pop());
            if (task.category && task.category !== 'none') metaParts.push(task.category);
            if (task.origin === 'homework') metaParts.push('Homework');
            metaParts.push(`Difficulty: ${normalizedDifficulty.charAt(0).toUpperCase()}${normalizedDifficulty.slice(1)}`);
            if (task.referenceUrl) metaParts.push('Docs linked');
            const priorityDot = `<span class="priority-dot priority-${normalizedPriority}" title="Urgency: ${escapeHtml(normalizedPriority)}"></span>`;
            const allowEdit = !!options.showEdit;

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
                        <div class="task-meta">${escapeHtml(metaParts.join(' · '))}</div>
                    </div>
                    <div class="task-actions">
                        ${task.referenceUrl ? `<button class="neumo-btn" onclick="openTaskReference('${task.id}')" title="Open reference">Doc</button>` : ''}
                        ${options.showCommit ? `<button class="neumo-btn" onclick="toggleCommit('${task.id}')">${committed ? 'Uncommit' : 'Commit'}</button>` : ''}
                        ${options.showComplete ? `<button class="neumo-btn" onclick="toggleComplete('${task.id}')">${completedToday ? 'Undo' : 'Done'}</button>` : ''}
                        ${allowEdit ? `<button class="neumo-btn" onclick="openTaskModal('${task.id}')">Edit</button>` : ''}
                        ${options.showDelete ? `<button class="neumo-btn" onclick="if(confirm('Delete this task?')) deleteTask('${task.id}')">Delete</button>` : ''}
                    </div>
                </div>
            `;
        }

        function openTaskReference(taskId) {
            const task = (Array.isArray(tasks) ? tasks : []).find(item => item.id === taskId);
            if (!task || !task.referenceUrl) return;
            const safeUrl = normalizeExternalUrl(task.referenceUrl);
            if (!safeUrl) {
                showToast('Reference link is invalid');
                return;
            }
            try {
                window.open(safeUrl, '_blank', 'noopener,noreferrer');
            } catch (e) {
                showToast('Unable to open reference link');
            }
        }

        function resetCelebrationStateForDay(dayKeyStr) {
            if (completionCelebrationState.dayKey === dayKeyStr) return;
            completionCelebrationState.dayKey = dayKeyStr;
            completionCelebrationState.tasksAllDone = null;
            completionCelebrationState.habitsAllDone = null;
        }

        function runMiniCelebration(kind, message) {
            const todayView = document.getElementById('view-today');
            if (!todayView || !todayView.classList.contains('active')) {
                showToast(message);
                return;
            }
            if (appSettings && appSettings.motionEnabled === false) {
                showToast(message);
                return;
            }
            const header = document.querySelector('#view-today .view-header');
            const headerRect = header ? header.getBoundingClientRect() : null;
            const x = headerRect ? (headerRect.left + (headerRect.width / 2)) : (window.innerWidth / 2);
            const y = headerRect ? Math.max(72, headerRect.top + 12) : 96;
            const palette = kind === 'habits'
                ? ['#22c55e', '#34d399', '#10b981', '#86efac', '#facc15']
                : ['#f59e0b', '#fb7185', '#f97316', '#facc15', '#60a5fa'];

            const burst = document.createElement('div');
            burst.className = 'mini-celebration-burst';
            burst.style.left = `${Math.round(x)}px`;
            burst.style.top = `${Math.round(y)}px`;
            burst.innerHTML = `<div class="mini-celebration-pill">${escapeHtml(message)}</div>`;

            const particleCount = 18;
            for (let i = 0; i < particleCount; i += 1) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const distance = 46 + Math.floor(Math.random() * 38);
                const dx = Math.round(Math.cos(angle) * distance);
                const dy = Math.round(Math.sin(angle) * distance) + 10;
                const delay = Math.floor(Math.random() * 120);
                const color = palette[i % palette.length];
                const rot = `${Math.round(120 + Math.random() * 280)}deg`;
                const particle = document.createElement('span');
                particle.className = 'mini-celebration-spark';
                particle.style.setProperty('--dx', `${dx}px`);
                particle.style.setProperty('--dy', `${dy}px`);
                particle.style.setProperty('--delay', `${delay}ms`);
                particle.style.setProperty('--rot', rot);
                particle.style.setProperty('--spark-color', color);
                burst.appendChild(particle);
            }

            document.body.appendChild(burst);
            setTimeout(() => burst.remove(), 1300);
        }

        function maybeCelebrateTasksCompletion(dayKeyStr, relevantTaskIds, completedIds) {
            resetCelebrationStateForDay(dayKeyStr);
            const completedSet = new Set(completedIds || []);
            const totalTasks = relevantTaskIds instanceof Set ? relevantTaskIds.size : 0;
            const allDone = totalTasks > 0 && Array.from(relevantTaskIds).every(id => completedSet.has(id));
            const previous = completionCelebrationState.tasksAllDone;
            completionCelebrationState.tasksAllDone = allDone;
            if (previous === false && allDone) {
                runMiniCelebration('tasks', 'All tasks done today!');
            }
        }

        function maybeCelebrateHabitsCompletion(dayKeyStr, totalHabits, completedHabitIds) {
            resetCelebrationStateForDay(dayKeyStr);
            const completedSet = new Set(completedHabitIds || []);
            const allDone = totalHabits > 0 && totalHabits === completedSet.size;
            const previous = completionCelebrationState.habitsAllDone;
            completionCelebrationState.habitsAllDone = allDone;
            if (previous === false && allDone) {
                runMiniCelebration('habits', 'All habits checked today!');
            }
        }

        function renderTodayView() {
            const todayKey = today();
            refreshFreezeWeek();
            updateGlobalStreak();

            const committedIds = (dayStates[todayKey] && dayStates[todayKey].committedTaskIds) || [];
            const completedIds = (dayStates[todayKey] && dayStates[todayKey].completedTaskIds) || [];
            const committedTasks = filterTasksBySearch(tasks.filter(task => committedIds.includes(task.id))).sort(compareTasksForDisplay);
            const dueTodayTasks = filterTasksBySearch(tasks.filter(task => isTaskDueOn(task, todayKey) && !completedIds.includes(task.id))).sort(compareTasksForDisplay);
            const upcomingDueTasks = dueTodayTasks.length ? [] : filterTasksBySearch(tasks.filter(task => {
                if (!task || !task.isActive) return false;
                if (completedIds.includes(task.id)) return false;
                if (String(task.scheduleType || 'once') !== 'once') return false;
                if (!task.dueDate) return false;
                return task.dueDate > todayKey;
            })).sort(compareTasksForDisplay).slice(0, 4);
            const dueTasks = dueTodayTasks.length ? dueTodayTasks : upcomingDueTasks;
            const completedTasks = filterTasksBySearch(tasks.filter(task => completedIds.includes(task.id))).sort(compareTasksForDisplay);
            const todayWeekday = parseDate(todayKey).getDay();
            const relevantTaskIds = new Set();
            committedIds.forEach(id => {
                if (tasks.some(task => task && task.id === id)) relevantTaskIds.add(id);
            });
            tasks.forEach(task => {
                if (!task) return;
                const schedule = String(task.scheduleType || 'once');
                if (schedule === 'once') {
                    if (task.dueDate === todayKey) relevantTaskIds.add(task.id);
                    return;
                }
                if (!task.isActive) return;
                if (schedule === 'daily') {
                    relevantTaskIds.add(task.id);
                    return;
                }
                if (schedule === 'weekly' && Array.isArray(task.weeklyDays) && task.weeklyDays.includes(todayWeekday)) {
                    relevantTaskIds.add(task.id);
                }
            });

            const committedList = document.getElementById('today-committed-list');
            const dueList = document.getElementById('today-due-list');
            const completedList = document.getElementById('today-completed-list');
            const committedEmpty = document.getElementById('today-committed-empty');
            const dueEmpty = document.getElementById('today-due-empty');
            const completedEmpty = document.getElementById('today-completed-empty');

            if (committedList) {
                committedList.innerHTML = committedTasks.map(task => renderTaskCard(task, { showCommit: true, showComplete: true, showEdit: true, showDelete: true })).join('');
                if (committedEmpty) committedEmpty.style.display = committedTasks.length ? 'none' : 'block';
            }

            if (dueList) {
                dueList.innerHTML = dueTasks.map(task => renderTaskCard(task, { showCommit: true, showComplete: true, showEdit: true, showDelete: true })).join('');
                if (dueEmpty) dueEmpty.style.display = dueTasks.length ? 'none' : 'block';
            }

            if (completedList) {
                completedList.innerHTML = completedTasks.map(task => renderTaskCard(task, { showComplete: true, showEdit: true, showDelete: true })).join('');
                if (completedEmpty) completedEmpty.style.display = completedTasks.length ? 'none' : 'block';
            }

            // Populate 'All Tasks' fallback panel (shows all non-completed tasks regardless of due date)
            const allList = document.getElementById('today-all-list');
            const allEmpty = document.getElementById('today-all-empty');
            const allCount = document.getElementById('allCount');
            if (allList) {
                const allTasks = filterTasksBySearch(tasks.filter(task => !completedIds.includes(task.id))).sort(compareTasksForDisplay);
                allList.innerHTML = allTasks.map(task => renderTaskCard(task, { showCommit: true, showComplete: true, showEdit: true, showDelete: true })).join('');
                if (allEmpty) allEmpty.style.display = allTasks.length ? 'none' : 'block';
                if (allCount) allCount.textContent = `${allTasks.length}`;
            }

            const commitCount = document.getElementById('commitCount');
            if (commitCount) commitCount.textContent = `(${committedTasks.length})`;

            const dueCount = document.getElementById('dueCount');
            if (dueCount) {
                if (dueTodayTasks.length > 0) dueCount.textContent = `${dueTodayTasks.length} due`;
                else if (upcomingDueTasks.length > 0) dueCount.textContent = `0 due · ${upcomingDueTasks.length} upcoming`;
                else dueCount.textContent = '0 due';
            }

            const completedCount = document.getElementById('completedCount');
            if (completedCount) completedCount.textContent = `${completedTasks.length} done`;

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
            maybeCelebrateTasksCompletion(todayKey, relevantTaskIds, completedIds);
            renderHabitTracker();
        }

        function renderProgressView() {
            // Legacy progress containers were removed from markup.
            // Dashboard rendering is handled by populateProgressDashboard().
        }

        function renderTaskViews() {
            syncHomeworkTasksIntoTaskStore();
            renderTodayView();
            renderProgressView();
            try { populateProgressDashboard(); } catch (e) { /* non-critical */ }
            // Quick tasks removed; no sidebar todo rendering required.
        }

        // (debug helper removed)

        let editingTaskId = null;

        function setTaskModalHomeworkMode(isHomeworkTask) {
            const idsToDisableForHomework = [
                'taskTitleInput',
                'taskNotesInput',
                'taskScheduleInput',
                'taskCategoryInput',
                'taskNoteInput'
            ];
            idsToDisableForHomework.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.disabled = !!isHomeworkTask;
            });
            const weeklyContainer = document.getElementById('taskWeeklyDays');
            if (weeklyContainer) {
                weeklyContainer.style.display = isHomeworkTask ? 'none' : weeklyContainer.style.display;
                weeklyContainer.style.opacity = isHomeworkTask ? '0.55' : '1';
                weeklyContainer.style.pointerEvents = isHomeworkTask ? 'none' : '';
            }
        }

        function openTaskModal(taskId = null, preset = {}) {
            const modal = document.getElementById('taskModal');
            if (!modal) return;

            editingTaskId = taskId;
            const task = taskId ? tasks.find(t => t.id === taskId) : null;
            const isHomeworkTask = !!(task && task.origin === 'homework');

            document.getElementById('taskModalTitle').textContent = task ? 'Edit Task' : 'Add Task';
            document.getElementById('taskTitleInput').value = task?.title || preset.title || '';
            document.getElementById('taskNotesInput').value = task?.notes || preset.notes || '';
            document.getElementById('taskScheduleInput').value = task?.scheduleType || preset.scheduleType || 'once';
            document.getElementById('taskDueDateInput').value = task?.dueDate || preset.dueDate || '';
            document.getElementById('taskCategoryInput').value = task?.category || preset.category || 'none';
            document.getElementById('taskPriorityInput').value = task?.priority || preset.priority || 'medium';
            const taskDifficultyInput = document.getElementById('taskDifficultyInput');
            if (taskDifficultyInput) {
                taskDifficultyInput.value = normalizeDifficultyValue(task?.difficulty || preset.difficulty || 'medium');
            }
            const taskReferenceInput = document.getElementById('taskReferenceInput');
            if (taskReferenceInput) {
                taskReferenceInput.value = task?.referenceUrl || preset.referenceUrl || '';
            }

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

            setTaskModalHomeworkMode(isHomeworkTask);

            modal.classList.add('active');
        }

        function closeTaskModal() {
            const modal = document.getElementById('taskModal');
            if (modal) modal.classList.remove('active');
            setTaskModalHomeworkMode(false);
            editingTaskId = null;
        }

        function saveTaskFromModal() {
            const title = document.getElementById('taskTitleInput').value.trim();
            const existingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;
            const isHomeworkTask = !!(existingTask && existingTask.origin === 'homework');
            const shouldFocusTodayAfterSave = !editingTaskId;
            if (!isHomeworkTask && !title) {
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
                difficulty: normalizeDifficultyValue(document.getElementById('taskDifficultyInput') ? document.getElementById('taskDifficultyInput').value : 'medium'),
                estimate: 0,
                dueDate: document.getElementById('taskDueDateInput').value || null,
                noteId: document.getElementById('taskNoteInput').value || null,
                referenceUrl: normalizeExternalUrl(document.getElementById('taskReferenceInput') ? document.getElementById('taskReferenceInput').value : '')
            };

            if (editingTaskId) {
                const task = existingTask;
                if (task && task.origin === 'homework') {
                    const updated = updateHomeworkTaskInStorage(task, {
                        priority: taskData.priority,
                        difficulty: taskData.difficulty,
                        dueDate: taskData.dueDate
                    });
                    if (!updated) {
                        showToast('Could not update homework task');
                        return;
                    }
                } else if (task) {
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
            // Only auto-jump to Today when creating a new task.
            if (shouldFocusTodayAfterSave) {
                try { setActiveView('today'); } catch (e) { /* non-critical */ }
            }
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
                difficulty: 'medium',
                referenceUrl: null,
                origin: 'note'
            };

            tasks.unshift(newTask);
            taskOrder.unshift(newTask.id);
            persistAppData();
            renderTaskViews();
            input.value = '';
            showToast('Linked task added');
        }

        function isOptionalFeatureView(view) {
            return OPTIONAL_FEATURE_VIEWS.includes(view);
        }

        function isViewEnabled(view) {
            if (!view) return false;
            if (view === 'settings') return true;
            if (!isOptionalFeatureView(view)) return true;
            const enabledViews = normalizeEnabledViews(appSettings && appSettings.enabledViews);
            return enabledViews[view] !== false;
        }

        function getEnabledOptionalFeatureCount(enabledViews) {
            const normalized = normalizeEnabledViews(enabledViews);
            return OPTIONAL_FEATURE_VIEWS.reduce((count, view) => {
                return count + (normalized[view] ? 1 : 0);
            }, 0);
        }

        function getFallbackView(preferredView) {
            const queue = [preferredView, activeView, ...FEATURE_VIEW_FALLBACK_ORDER];
            const seen = new Set();
            for (const candidate of queue) {
                if (!candidate || seen.has(candidate)) continue;
                seen.add(candidate);
                if (isViewEnabled(candidate)) return candidate;
            }
            return 'settings';
        }

        function syncFeatureSelectionControls() {
            const enabledViews = normalizeEnabledViews(appSettings && appSettings.enabledViews);
            document.querySelectorAll('.feature-toggle-input[data-feature-view]').forEach(toggle => {
                const view = toggle.dataset.featureView;
                if (!isOptionalFeatureView(view)) return;
                const checked = enabledViews[view] !== false;
                toggle.checked = checked;
                const item = toggle.closest('.feature-toggle-item');
                if (item) item.dataset.checked = checked ? 'true' : 'false';
            });
        }

        function applyFeatureTabVisibility() {
            const enabledViews = normalizeEnabledViews(appSettings && appSettings.enabledViews);
            if (appSettings) appSettings.enabledViews = enabledViews;

            document.querySelectorAll('.view-tab').forEach(tab => {
                const view = tab.dataset.view;
                const visible = isViewEnabled(view);
                tab.hidden = !visible;
                tab.setAttribute('aria-hidden', visible ? 'false' : 'true');
                if (!visible) tab.classList.remove('active');
            });

            document.querySelectorAll('.view').forEach(section => {
                const id = section.id || '';
                const view = id.startsWith('view-') ? id.slice(5) : '';
                if (!isOptionalFeatureView(view)) return;
                if (!isViewEnabled(view)) {
                    section.classList.remove('active');
                    section.style.display = 'none';
                }
            });

            syncFeatureSelectionControls();
        }

        function isFeatureSetupPending() {
            return !!(appSettings && appSettings.featureSelectionCompleted !== true);
        }

        function showFeatureSetupOverlay() {
            const overlay = document.getElementById('featureSetupOverlay');
            if (!overlay || !isFeatureSetupPending()) return;
            syncFeatureSelectionControls();
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('feature-setup-open');
        }

        function hideFeatureSetupOverlay() {
            const overlay = document.getElementById('featureSetupOverlay');
            if (!overlay) return;
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('feature-setup-open');
        }

        function setFeatureViewEnabled(view, enabled, options = {}) {
            if (!isOptionalFeatureView(view) || !appSettings) return false;
            const shouldMarkSetupComplete = options.markSetupComplete !== false;
            const shouldSyncActiveView = options.syncActiveView !== false;
            appSettings.enabledViews = normalizeEnabledViews(appSettings.enabledViews);

            const nextEnabled = !!enabled;
            const currentEnabled = appSettings.enabledViews[view] !== false;
            if (!nextEnabled && currentEnabled && getEnabledOptionalFeatureCount(appSettings.enabledViews) <= 1) {
                showToast('Keep at least one feature tab enabled.');
                syncFeatureSelectionControls();
                return false;
            }

            appSettings.enabledViews[view] = nextEnabled;
            if (shouldMarkSetupComplete) {
                appSettings.featureSelectionCompleted = true;
            }

            applyFeatureTabVisibility();
            if (shouldSyncActiveView) {
                const nextView = isViewEnabled(activeView)
                    ? activeView
                    : getFallbackView(activeView || view);
                setActiveView(nextView);
            }
            persistAppData();
            return true;
        }

        function completeFeatureSetup() {
            if (!appSettings) return;
            appSettings.enabledViews = normalizeEnabledViews(appSettings.enabledViews);
            if (getEnabledOptionalFeatureCount(appSettings.enabledViews) <= 0) {
                appSettings.enabledViews.notes = true;
                showToast('Select at least one feature tab. Notes was enabled for you.');
            }
            appSettings.featureSelectionCompleted = true;
            applyFeatureTabVisibility();
            hideFeatureSetupOverlay();
            setActiveView(getFallbackView('notes'));
            persistAppData();
        }

        function setActiveView(view) {
            const requestedView = typeof view === 'string' && view ? view : 'today';
            const resolvedView = isViewEnabled(requestedView)
                ? requestedView
                : getFallbackView('notes');
            activeView = resolvedView;
            if (appData) {
                if (!appData.ui) appData.ui = { ...getDefaultAppData().ui };
                appData.ui.lastActiveView = resolvedView;
                persistAppData();
            }
            document.querySelectorAll('.view').forEach(section => {
                const sectionView = section.id && section.id.startsWith('view-')
                    ? section.id.slice(5)
                    : '';
                const isActive = section.id === `view-${resolvedView}` && isViewEnabled(sectionView);
                section.classList.toggle('active', isActive);
                // Keep inline display in sync with active state.
                // Some auxiliary scripts set inline display styles, which can otherwise
                // leave the selected view hidden even when it has the active class.
                section.style.display = isActive ? '' : 'none';
            });
            document.querySelectorAll('.view-tab').forEach(tab => {
                const tabView = tab.dataset.view;
                const isActive = tabView === resolvedView && isViewEnabled(tabView);
                tab.classList.toggle('active', isActive);
            });
            document.body.dataset.view = resolvedView;
            try {
                window.dispatchEvent(new CustomEvent('noteflow:view-changed', { detail: { view: resolvedView } }));
            } catch (e) { /* non-critical */ }
            // Update mobile tab toggle label and collapse the expanded list for a cleaner UX
            try {
                const toggle = document.querySelector('.view-tabs-toggle');
                const tabs = document.querySelector('.view-tabs');
                if (toggle) {
                    const active = document.querySelector('.view-tab.active:not([hidden])')
                        || document.querySelector('.view-tab:not([hidden])');
                    if (active) toggle.querySelector('.view-tabs-current').textContent = active.textContent.trim();
                    // collapse the expanded tabs after selection
                    if (tabs && tabs.classList.contains('expanded')) {
                        tabs.classList.remove('expanded');
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }
            } catch (e) { /* non-critical */ }
            // Refresh dashboard when user opens Progress view
            if (resolvedView === 'progress') {
                try { populateProgressDashboard(); } catch (e) { console.warn('populateProgressDashboard failed on view change', e); }
            }
            // Render timeline when switching to Timeline view
            if (resolvedView === 'timeline') {
                try { renderTimeline(); applyTimeMode(); } catch (e) { console.warn('renderTimeline failed on view change', e); }
            }
            if (resolvedView === 'college') {
                try { renderCollegeTracker(); } catch (e) { console.warn('renderCollegeTracker failed on view change', e); }
            }
            if (resolvedView === 'today') {
                try { renderAcademicWorkspace(); } catch (e) { console.warn('renderAcademicWorkspace failed on Today view change', e); }
            }
            if (resolvedView === 'collegeapp') {
                try { renderCollegeAppWorkspace(); } catch (e) { console.warn('renderCollegeAppWorkspace failed on view change', e); }
            }
            if (resolvedView === 'life') {
                try { renderLifeWorkspace(); } catch (e) { console.warn('renderLifeWorkspace failed on view change', e); }
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
            const quickAppsToggle = document.getElementById('quickAppsToggle');
            if (quickAppsToggle) {
                quickAppsToggle.checked = !!(appSettings && appSettings.quickAppLaunchersEnabled);
            }
            applyQuickAppLaunchersVisibility();
            const taskOrderStrategySelect = document.getElementById('taskOrderStrategySelect');
            if (taskOrderStrategySelect) {
                taskOrderStrategySelect.value = getTaskOrderStrategy();
            }
            syncFeatureSelectionControls();
            const calendarSettings = normalizeGoogleCalendarSettings(appSettings && appSettings.googleCalendar ? appSettings.googleCalendar : null);
            if (appSettings) appSettings.googleCalendar = calendarSettings;
            const calendarIdInput = document.getElementById('googleCalendarIdInput');
            const intervalSelect = document.getElementById('googleCalendarIntervalSelect');
            const autoToggle = document.getElementById('googleCalendarAutoSyncToggle');
            if (calendarIdInput) calendarIdInput.value = calendarSettings.calendarId || 'primary';
            if (intervalSelect) intervalSelect.value = String(calendarSettings.syncIntervalMinutes || 5);
            if (autoToggle) autoToggle.checked = calendarSettings.autoSync !== false;
            updateGoogleCalendarSyncStatusLabel();
            syncTutorialSettingsControls();
        }

        function applyQuickAppLaunchersVisibility() {
            const launchers = document.getElementById('quickAppLaunchers');
            if (!launchers) return;
            const enabled = !!(appSettings && appSettings.quickAppLaunchersEnabled);
            launchers.style.display = enabled ? 'inline-flex' : 'none';
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
                statusEl.textContent = 'Take a full product walkthrough covering feature tabs, academic tools, college workflows, life trackers, timer audio controls, pages, tasks, timeline, notes, settings, calendar sync, homework, backups, and assistant tools.';
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
                { title: 'Welcome to NoteFlow Atelier', body: 'This walkthrough covers every major app feature. Use Next/Back to navigate and Run Action when a step needs prompts or permissions.' },
                { selector: '.view-tabs', before: () => setActiveView('today'), title: 'Main Views', body: 'Switch between Today, Timeline, Notes, College App, Life, College, Settings, and Homework.', action: () => setActiveView('today') },
                { selector: '#tabCollege', before: () => setActiveView('college'), title: 'College Tab', body: 'The College workspace mirrors a full admissions tracker with dedicated sheets.' },
                { selector: '#tabHomework', before: () => setActiveView('homework'), title: 'Homework Tab', body: 'Homework is a full workspace view and syncs into your task system.' },
                { selector: '#sidebarToggle', before: () => setActiveView('notes'), title: 'Sidebar Toggle', body: 'Open/close the sidebar from this button.', action: () => ensureSidebarExpandedForTutorial() },
                { selector: '#globalSearch', before: () => setActiveView('today'), title: 'Global Search', body: 'Search notes and tasks from one place.', action: () => { setTutorialFieldValue('globalSearch', 'help'); filterPages(); } },
                { selector: '#searchInput', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Sidebar Search', body: 'Sidebar search syncs with global search and filters the page tree.', action: () => { setTutorialFieldValue('searchInput', 'welcome'); filterPages(); } },
                { selector: '#sidebarTagsFilter', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Tag Filter', body: 'Filter the page tree by tags directly from the sidebar.' },
                { selector: '#pagesList', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Page Tree', body: 'Manage hierarchy, favorites, duplicate, rename, delete, and drag/drop.', action: () => { setTutorialFieldValue('searchInput', ''); setTutorialFieldValue('globalSearch', ''); filterPages(); } },
                { selector: '#newPageModal', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Create Pages', body: 'Create new pages and choose a template.', action: () => { createNewPage(); setTutorialFieldValue('newPageName', 'Tutorial Project'); setTutorialFieldValue('newPageTemplate', 'project', 'change'); } },
                { selector: '#templatePreviewPanel', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); createNewPage(); }, title: 'Template Preview', body: 'Preview template structure before creating the page.' },
                { selector: '#templateTaskOptions', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); createNewPage(); }, title: 'Template Task Seeds', body: 'Templates can pre-generate starter tasks when enabled.' },
                { selector: '#newPageName', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Hierarchy With ::', body: 'Use `::` in names to nest pages automatically.', action: () => { createNewPage(); setTutorialFieldValue('newPageName', 'Projects::Website::Launch'); setTutorialFieldValue('newPageTemplate', 'meeting', 'change'); } },
                { selector: '#renamePageModal', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Rename Pages', body: 'Renaming a parent updates child paths.', action: () => { const page = ensureTutorialPageLoaded(); if (!page) return; showRenameModal(page.id); setTutorialFieldValue('renamePageName', `${page.title}::Renamed Example`); } },
                { selector: '.page-item .page-item-icons', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Quick Page Actions', body: 'Favorite, duplicate, rename, and delete are on each page row.' },
                { selector: '.page-item', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Collapse Branches', body: 'Parent branches can be collapsed for cleaner navigation.', action: () => { const parent = pages.find(page => pages.some(child => child.id !== page.id && child.title.startsWith(`${page.title}::`))); if (parent) toggleCollapse(parent.id); } },
                { selector: '#emojiPicker', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Page Icons', body: 'Open emoji picker to customize page icons.', action: () => { const page = ensureTutorialPageLoaded(); if (page) openEmojiPicker(page.id); } },
                { selector: '#breadcrumbs', before: () => { setActiveView('notes'); ensureSidebarExpandedForTutorial(); }, title: 'Breadcrumbs', body: 'Breadcrumbs show nested path and let you jump quickly.', action: () => ensureTutorialNestedPageLoaded() },
                { selector: '#pageTitle', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Inline Title Editing', body: 'Edit current page title directly.', action: () => { const titleInput = document.getElementById('pageTitle'); if (titleInput) { titleInput.focus(); titleInput.select(); } } },
                { selector: '#tagsContainer', before: () => { setActiveView('notes'); ensureTutorialPageLoaded(); }, title: 'Tags', body: 'Use tags to label pages and filter from sidebar.' },
                { selector: '#focusTimer', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Focus Timer', body: 'Timer includes presets, custom H:M:S, start/pause/reset.' },
                { selector: '#timerSettings', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Timer Settings', body: 'Open timer settings to customize durations, ringtone, and alarm volume.', action: () => { const container = document.getElementById('focusTimer'); if (container && !container.classList.contains('expanded')) toggleTimerSettings(); } },
                { selector: '#timerRingtoneSelect', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); const container = document.getElementById('focusTimer'); if (container && !container.classList.contains('expanded')) toggleTimerSettings(); }, title: 'Timer Ringtone', body: 'Choose the alarm sound you want for finished focus sessions.' },
                { selector: '#timerVolumeInput', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); const container = document.getElementById('focusTimer'); if (container && !container.classList.contains('expanded')) toggleTimerSettings(); }, title: 'Timer Alarm Volume', body: 'Set how loud the timer alarm plays when a session ends.' },
                { selector: '.timer-presets', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Timer Presets', body: 'Quick switch to 15m/25m/50m.', action: () => { const container = document.getElementById('focusTimer'); if (container && !container.classList.contains('expanded')) toggleTimerSettings(); setTimerPreset(50); } },
                { selector: '#timerStartBtn', before: () => { setActiveView('today'); ensureSidebarExpandedForTutorial(); }, title: 'Timer Start/Pause', body: 'Start countdown and pause safely.', action: () => { startTimer(); setTimeout(() => pauseTimer(), 900); } },
                { selector: '#timerDonePopup', before: () => setActiveView('today'), title: 'Timer Done Popup', body: 'When focus ends, a larger popup appears and the alarm keeps ringing until you stop it.' },
                { selector: '#quickAppLaunchers', before: () => setActiveView('today'), title: 'Quick App Launchers', body: 'Launch Spotify and ChatGPT quickly from the top tabs area.' },
                { selector: '.quick-app-btn.spotify', before: () => setActiveView('today'), title: 'Spotify Launcher', body: 'Opens Spotify in your configured quick-launch mode.', actionLabel: 'Open Spotify', autoAction: false, action: () => openQuickLaunchTarget('spotify') },
                { selector: '.quick-app-btn.chatgpt', before: () => setActiveView('today'), title: 'ChatGPT Launcher', body: 'Opens ChatGPT in your configured quick-launch mode.', actionLabel: 'Open ChatGPT', autoAction: false, action: () => openQuickLaunchTarget('chatgpt') },
                { selector: '#view-today .summary-grid', before: () => setActiveView('today'), title: 'Today Dashboard Summary', body: 'Track streak, commit days, weekly completions, and freezes at a glance.' },
                { selector: '#today-committed-list', before: () => setActiveView('today'), title: 'Committed Tasks', body: 'Your focus list for today.' },
                { selector: '#today-due-list', before: () => setActiveView('today'), title: 'Due Today', body: 'Tasks due on the selected day appear here.' },
                { selector: '#today-completed-list', before: () => setActiveView('today'), title: 'Completed Tasks', body: 'Review and undo completions from today.' },
                { selector: '#habitList', before: () => setActiveView('today'), title: 'Habit Tracker', body: 'Add habits and mark daily completions to build streaks.' },
                { selector: '#habitNameInput', before: () => setActiveView('today'), title: 'Habit Input', body: 'Create habits from the Today dashboard.' },
                { selector: '#sparklineWeekly', before: () => setActiveView('today'), title: 'Weekly Completions Card', body: 'Sparkline and weekly completion totals.' },
                { selector: '#monthlyHeatmap', before: () => setActiveView('today'), title: 'Monthly Heatmap', body: 'See 30-day activity density.' },
                { selector: '#categoryDonut', before: () => setActiveView('today'), title: 'Category Breakdown', body: 'Visual split of task categories and progress.' },
                { selector: '#streakCurrent', before: () => setActiveView('today'), title: 'Streak Stats', body: 'Current, best, and longest streak values.' },
                { selector: '#allTasksDrawer', before: () => setActiveView('today'), title: 'All Tasks Drawer', body: 'Open full list access from Today.', action: () => { const drawer = document.getElementById('allTasksDrawer'); if (drawer) drawer.setAttribute('aria-hidden', 'false'); } },
                { selector: '#taskModal', before: () => setActiveView('today'), title: 'Task Modal', body: 'Set task title, notes, recurrence, due date, category, note link, urgency, and difficulty.', action: () => { const page = ensureTutorialPageLoaded(); openTaskModal(null, { title: 'Tutorial Task Example', notes: 'Demo task from tutorial.', scheduleType: 'once', category: 'work', priority: 'high', difficulty: 'medium', noteId: page ? page.id : null }); } },
                { selector: '#taskWeeklyDays', before: () => setActiveView('today'), title: 'Weekly Recurrence', body: 'Weekly schedule reveals weekday selectors.', action: () => { openTaskModal(null, { title: 'Weekly Demo Task' }); setTutorialFieldValue('taskScheduleInput', 'weekly', 'change'); document.querySelectorAll('#taskWeeklyDays input[type=\"checkbox\"]').forEach(box => { box.checked = box.value === '1' || box.value === '3' || box.value === '5'; }); } },
                { selector: '#taskNoteInput', before: () => setActiveView('today'), title: 'Attach Task to Note', body: 'Link tasks to notes, set urgency, and choose difficulty.', action: () => { const page = ensureTutorialPageLoaded(); openTaskModal(null, { title: 'Linked Task Demo' }); if (page) setTutorialFieldValue('taskNoteInput', page.id, 'change'); setTutorialFieldValue('taskPriorityInput', 'high', 'change'); setTutorialFieldValue('taskDifficultyInput', 'easy', 'change'); } },
                { selector: '#taskReferenceInput', before: () => setActiveView('today'), title: 'Task Reference Links', body: 'Attach Google Docs or external references directly to tasks.', action: () => { openTaskModal(null, { title: 'Task with Docs Reference' }); setTutorialFieldValue('taskReferenceInput', 'https://docs.google.com/document/d/your-doc-id'); } },
                { selector: '#view-timeline', before: () => setActiveView('timeline'), title: 'Timeline View', body: 'Plan your day in time blocks with live status.', action: () => { setActiveView('timeline'); renderTimeline(); } },
                { selector: '#timelineDateInput', before: () => setActiveView('timeline'), title: 'Timeline Date Filter', body: 'View and manage schedule by specific date.', action: () => setTutorialFieldValue('timelineDateInput', dateKey(new Date()), 'change') },
                { selector: '#timelineViewModeSelect', before: () => setActiveView('timeline'), title: 'Timeline Modes', body: 'Switch between Day, Week, Month, and Year calendar views.', action: () => { setTutorialFieldValue('timelineViewModeSelect', 'month', 'change'); } },
                { selector: '#timelineCalendarView', before: () => setActiveView('timeline'), title: 'Calendar Grid', body: 'The calendar grid updates to match your selected timeline mode.' },
                { selector: '#blockModal', before: () => setActiveView('timeline'), title: 'Add Time Block', body: 'Set name, time range, category, color, and recurrence.', action: () => { openBlockModal(null); setTutorialFieldValue('blockNameInput', 'Deep Work'); setTutorialFieldValue('blockStartInput', '09:00', 'change'); setTutorialFieldValue('blockEndInput', '10:30', 'change'); setTutorialFieldValue('blockCategoryInput', 'work', 'change'); setTutorialFieldValue('blockRecurrenceInput', 'weekdays', 'change'); } },
                { selector: '#blockDateInput', before: () => setActiveView('timeline'), title: 'One-Time Block Date', body: 'Set exact dates for one-time blocks and imported events.', action: () => { openBlockModal(null); setTutorialFieldValue('blockRecurrenceInput', 'none', 'change'); setTutorialFieldValue('blockDateInput', dateKey(new Date()), 'change'); } },
                { selector: '#blockReferenceInput', before: () => setActiveView('timeline'), title: 'Block Reference Links', body: 'Attach reference URLs to timeline blocks.', action: () => { openBlockModal(null); setTutorialFieldValue('blockReferenceInput', 'https://docs.google.com/document/d/your-doc-id'); } },
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
                { selector: '#view-settings', before: () => setActiveView('settings'), title: 'Settings View', body: 'Central place for appearance, calendar sync, data controls, backup, and tutorial controls.' },
                { selector: '#view-settings [data-theme=\"dark\"]', before: () => setActiveView('settings'), title: 'Settings Appearance', body: 'Quick light/dark theme switches are available here.', action: () => { const darkBtn = document.querySelector('#view-settings [data-theme=\"dark\"]'); if (darkBtn) darkBtn.click(); const lightBtn = document.querySelector('#view-settings [data-theme=\"light\"]'); if (lightBtn) lightBtn.click(); } },
                { selector: '#motionToggle', before: () => setActiveView('settings'), title: 'Reduce Motion', body: 'Disable motion for a calmer UI experience.', action: () => { const el = document.getElementById('motionToggle'); if (el) { el.checked = !el.checked; el.dispatchEvent(new Event('change', { bubbles: true })); } } },
                { selector: '#quickAppsToggle', before: () => setActiveView('settings'), title: 'Quick App Toggle', body: 'Enable or disable Spotify/ChatGPT launcher buttons.', action: () => { const el = document.getElementById('quickAppsToggle'); if (el) { el.checked = !el.checked; el.dispatchEvent(new Event('change', { bubbles: true })); } } },
                { selector: '#taskOrderStrategySelect', before: () => setActiveView('settings'), title: 'Task Ordering Strategy', body: 'Choose urgency-first or easy-first sorting.', action: () => setTutorialFieldValue('taskOrderStrategySelect', 'easy_first', 'change') },
                { selector: '#featureToggleListSettings', before: () => setActiveView('settings'), title: 'Feature Tabs', body: 'Pick which workspace tabs are visible. Settings always stays available.' },
                { selector: '#featureToggleListSettings .feature-toggle-card', before: () => setActiveView('settings'), title: 'Feature Toggle Cards', body: 'Each card controls one tab, and the app keeps at least one workspace tab enabled.' },
                { selector: '#exportWorkspaceBtn', before: () => setActiveView('settings'), title: 'Workspace Export', body: 'Export full workspace data as JSON.' },
                { selector: '#importWorkspaceBtn', before: () => setActiveView('settings'), title: 'Workspace Import', body: 'Import workspace backups or supported documents.' },
                { selector: '#importDropModal', before: () => setActiveView('settings'), title: 'Import Dropzone', body: 'Drag-and-drop import modal for docs and data.', action: () => openImportDropModal() },
                { selector: '#exportCalendarIcsBtn', before: () => setActiveView('settings'), title: 'Calendar Export (.ics)', body: 'Export tasks and timeline blocks as an ICS calendar file.' },
                { selector: '#importCalendarIcsBtn', before: () => setActiveView('settings'), title: 'Calendar Import (.ics)', body: 'Sync calendar events into timeline blocks by date.' },
                { selector: '#clearCalendarImportsBtn', before: () => setActiveView('settings'), title: 'Clear Imported Calendar Data', body: 'Remove imported calendar blocks and legacy calendar tasks if needed.' },
                { selector: '#driveSettingsModal', before: () => setActiveView('settings'), title: 'Google Drive Settings', body: 'Configure your own Drive credentials for backup.', action: () => openDriveSettings() },
                { selector: '#driveClientId', before: () => setActiveView('settings'), title: 'Drive Client ID', body: 'Google OAuth client ID used for Drive authentication.', action: () => openDriveSettings() },
                { selector: '#driveApiKey', before: () => setActiveView('settings'), title: 'Drive API Key', body: 'Google API key used for Drive operations.', action: () => openDriveSettings() },
                { selector: '#driveSettingsModal .btn-primary', before: () => setActiveView('settings'), title: 'Save Drive Credentials', body: 'Save Drive settings locally for this workspace.', action: () => openDriveSettings() },
                { selector: '#storageOptions', before: () => setActiveView('today'), title: 'Bottom Save Bar', body: 'Fast access to local save, export/import, and Drive sync.' },
                { selector: '#saveLocalBtn', before: () => setActiveView('today'), title: 'Save Locally', body: 'Instantly writes your workspace to browser storage and updates the saved timestamp.' },
                { selector: '#exportFileBtn', before: () => setActiveView('today'), title: 'Bottom Export', body: 'Export workspace backup from the bottom bar.' },
                { selector: '#importFileBtn', before: () => setActiveView('today'), title: 'Bottom Import', body: 'Import workspace/docs from the bottom bar.' },
                { selector: '#saveDriveBtn', before: () => setActiveView('today'), title: 'Save to Drive', body: 'Upload workspace backup to your Google Drive.' },

                /* --- College App Dashboard --- */
                { selector: '#collegeappDashboard', before: () => setActiveView('collegeapp'), title: 'College App Dashboard', body: 'The College App opens to a dashboard with at-a-glance summary cards and a navigation grid. Click any button to open the corresponding sub-page.' },
                { selector: '.collegeapp-nav-grid', before: () => setActiveView('collegeapp'), title: 'College App Nav Grid', body: 'Six buttons let you jump to College Tracker, Essay Organizer, Score Tracker, Awards, Scholarships, or Decision Matrix.', action: () => { const btn = document.querySelector('[data-collegeapp-page="tracker"]'); if (btn) btn.click(); } },
                { selector: '.collegeapp-back-btn', before: () => { setActiveView('collegeapp'); const btn = document.querySelector('[data-collegeapp-page="tracker"]'); if (btn) btn.click(); }, title: 'Sub-page Back Button', body: 'Each sub-page has a back button that returns you to the College App dashboard.', action: () => { const back = document.querySelector('[data-collegeapp-back]'); if (back) back.click(); } },

                /* --- Life Dashboard --- */
                { selector: '#lifeDashboard', before: () => setActiveView('life'), title: 'Life Dashboard', body: 'The Life tab opens to a dashboard with seven tracker categories: Goals, Habits, Skills, Fitness, Books, Spending, and Journal.' },
                { selector: '.life-nav-grid', before: () => setActiveView('life'), title: 'Life Nav Grid', body: 'Navigate to any life tracker from the button grid. Each sub-page has its own table and controls.', action: () => { const btn = document.querySelector('[data-life-page="spending"]'); if (btn) btn.click(); } },
                { selector: '#lifePage-spending .spending-stats-row', before: () => { setActiveView('life'); const btn = document.querySelector('[data-life-page="spending"]'); if (btn) btn.click(); }, title: 'Spending Stats', body: 'The spending tracker shows monthly totals, transaction count, average per transaction, and top category at a glance.' },
                { selector: '.life-back-btn', before: () => { setActiveView('life'); const btn = document.querySelector('[data-life-page="spending"]'); if (btn) btn.click(); }, title: 'Life Back Button', body: 'Return to the Life dashboard from any sub-page using the back button.', action: () => { const back = document.querySelector('[data-life-back]'); if (back) back.click(); } },

                /* --- Add-Item Modal --- */
                { selector: '#addItemModal', before: () => setActiveView('collegeapp'), title: 'Add-Item Modal', body: 'Adding items in College App or Life opens a modal that collects all details — name, dates, status, and more — before creating the row.', action: () => { const btn = document.getElementById('collegeAppQuickAddTrackerBtn'); if (btn) btn.click(); } },

                { selector: '#view-college', before: () => setActiveView('college'), title: 'College Tracker View', body: 'Track schools, requirements, deadlines, essays, and prompt planning in one workspace.' },
                { selector: '.college-sheet-tabs', before: () => setActiveView('college'), title: 'College Sheets', body: 'Switch between Research, Checklist, Deadlines, Essay Plan, and Essay Prompts.' },
                { selector: '#collegeAddRowBtn', before: () => setActiveView('college'), title: 'Add College Rows', body: 'Use Add Row to append records to the currently active college sheet.', action: () => { setActiveView('college'); const btn = document.getElementById('collegeAddRowBtn'); if (btn) btn.click(); } },
                { selector: '[data-college-tab=\"deadlines\"]', before: () => setActiveView('college'), title: 'Deadline Planning', body: 'Use the Deadlines sheet to manage submit windows and decision dates.', action: () => { setActiveView('college'); const tab = document.querySelector('[data-college-tab=\"deadlines\"]'); if (tab) tab.click(); } },
                { selector: '#collegeClearSheetBtn', before: () => setActiveView('college'), title: 'Sheet Reset', body: 'Clear Sheet removes all rows from the active sheet after confirmation.' },

                { selector: '#view-homework', before: () => setActiveView('homework'), title: 'Homework View', body: 'Dedicated assignment planner that syncs into tasks.' },
                { selector: '#hwMainArea', before: () => setActiveView('homework'), title: 'Homework Workspace', body: 'Manage classes, misc tracks, assignments, and notes in one table.' },
                { selector: '#hwAddClassBtn', before: () => setActiveView('homework'), title: 'Add Class', body: 'Add class columns for subject-specific planning.' },
                { selector: '#hwAddMiscBtn', before: () => setActiveView('homework'), title: 'Add Misc', body: 'Add extracurricular or personal workload tracks.' },
                { selector: '#hwExportBtn', before: () => setActiveView('homework'), title: 'Homework Export', body: 'Export homework data separately when needed.' },
                { selector: '#hwImportFile', before: () => setActiveView('homework'), title: 'Homework Import', body: 'Import homework JSON back into the organizer.' },
                { selector: '#hwResetBtn', before: () => setActiveView('homework'), title: 'Homework Setup Reset', body: 'Re-open setup if you want to reconfigure categories.' },
                { selector: '#hwDataTable', before: () => setActiveView('homework'), title: 'Homework Table', body: 'Track assignments, due dates, priority, and completion.' },
                { selector: '#chatbotBtn', before: () => setActiveView('notes'), title: 'Flow Assistant', body: 'Open assistant from this floating button.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); } },
                { selector: '#chatbotInfo', before: () => setActiveView('notes'), title: 'Assistant Info', body: 'See API-key setup and privacy details.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); openChatInfo(); } },
                { selector: '#chatFullBtn', before: () => setActiveView('notes'), title: 'Assistant Fullscreen', body: 'Expand chat for longer sessions.', action: () => { const panel = document.getElementById('chatbotPanel'); if (!panel || panel.style.display !== 'flex') toggleChat(); const fullBtn = document.getElementById('chatFullBtn'); if (fullBtn && !panel.classList.contains('fullscreen')) fullBtn.click(); } },
                { selector: '#chatSettingsShell', before: () => setActiveView('notes'), title: 'Assistant Settings Panel', body: 'Expand provider/model/API-key controls only when you need them.', action: () => { const panel = document.getElementById('chatbotPanel'); const shell = document.getElementById('chatSettingsShell'); if (!panel || panel.style.display !== 'flex') toggleChat(); if (shell) shell.open = true; } },
                { selector: '#chatProviderSelect', before: () => setActiveView('notes'), title: 'Assistant Provider + Model', body: 'Choose AI provider, model, and save API keys locally for Flow Assistant.', action: () => { const panel = document.getElementById('chatbotPanel'); const shell = document.getElementById('chatSettingsShell'); if (!panel || panel.style.display !== 'flex') toggleChat(); if (shell) shell.open = true; } },
                { selector: '#startTutorialBtn', before: () => setActiveView('settings'), title: 'Redo Tutorial', body: 'Run this walkthrough again from settings whenever you want.' },
                { title: 'Tutorial Complete', body: 'You covered the full NoteFlow Atelier feature set: navigation, feature-tab setup, pages, templates, task systems, timeline scheduling, College App dashboard and sub-page navigation, Life dashboard with spending stats, the add-item modal, college tracking, notes editor and embeds, theming, timer audio controls, calendar sync, homework, backup/import/export, quick app launchers, and Flow Assistant.' }
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
                const active = viewTabs.querySelector('.view-tab.active:not([hidden])');
                const initialTab = active || viewTabs.querySelector('.view-tab:not([hidden])');
                if (initialTab) viewToggle.querySelector('.view-tabs-current').textContent = initialTab.textContent.trim();

                viewToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const expanded = viewTabs.classList.toggle('expanded');
                    viewToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                    // if expanded, move focus into the first tab for keyboard users
                    if (expanded) {
                        const first = viewTabs.querySelector('.view-tab:not([hidden])');
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

            const newPageTemplateSelect = document.getElementById('newPageTemplate');
            if (newPageTemplateSelect && newPageTemplateSelect.dataset.bound !== 'true') {
                newPageTemplateSelect.dataset.bound = 'true';
                newPageTemplateSelect.addEventListener('change', () => {
                    updateTemplatePreview(newPageTemplateSelect.value);
                });
                updateTemplatePreview(newPageTemplateSelect.value || 'blank');
            }

            const newPageTaskToggle = document.getElementById('newPageCreateTasks');
            if (newPageTaskToggle && newPageTaskToggle.dataset.bound !== 'true') {
                newPageTaskToggle.dataset.bound = 'true';
                newPageTaskToggle.addEventListener('change', () => {
                    if (newPageTaskToggle.checked) {
                        newPageTaskToggle.dataset.userToggled = 'true';
                    } else {
                        delete newPageTaskToggle.dataset.userToggled;
                    }
                });
            }

            const newPageNameInput = document.getElementById('newPageName');
            if (newPageNameInput && newPageNameInput.dataset.bound !== 'true') {
                newPageNameInput.dataset.bound = 'true';
                newPageNameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmNewPage();
                    }
                });
            }

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
            const quickAppsToggle = document.getElementById('quickAppsToggle');
            if (quickAppsToggle) {
                quickAppsToggle.addEventListener('change', () => {
                    if (appSettings) {
                        appSettings.quickAppLaunchersEnabled = !!quickAppsToggle.checked;
                        persistAppData();
                    }
                    applyQuickAppLaunchersVisibility();
                });
            }

            document.querySelectorAll('.feature-toggle-input[data-feature-view]').forEach(toggle => {
                if (toggle.dataset.bound === 'true') return;
                toggle.dataset.bound = 'true';
                toggle.addEventListener('change', () => {
                    const view = toggle.dataset.featureView;
                    const isOnboardingToggle = !!toggle.closest('#featureSetupOverlay');
                    const changed = setFeatureViewEnabled(view, toggle.checked, {
                        markSetupComplete: !isOnboardingToggle,
                        syncActiveView: !isOnboardingToggle
                    });
                    if (!changed) {
                        syncFeatureSelectionControls();
                    }
                });
            });

            const featureSetupContinueBtn = document.getElementById('featureSetupContinueBtn');
            if (featureSetupContinueBtn && featureSetupContinueBtn.dataset.bound !== 'true') {
                featureSetupContinueBtn.dataset.bound = 'true';
                featureSetupContinueBtn.addEventListener('click', () => {
                    completeFeatureSetup();
                });
            }

            const timeFormatSelect = document.getElementById('timeFormatSelect');
            const showSecondsSelect = document.getElementById('showSecondsSelect');
            const taskOrderStrategySelect = document.getElementById('taskOrderStrategySelect');
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
            if (taskOrderStrategySelect && appSettings) {
                taskOrderStrategySelect.value = getTaskOrderStrategy();
                taskOrderStrategySelect.addEventListener('change', () => {
                    appSettings.taskOrderStrategy = taskOrderStrategySelect.value === 'easy_first'
                        ? 'easy_first'
                        : 'urgent_first';
                    persistAppData();
                    renderTaskViews();
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

            initCollegeTrackerUI();
            initAcademicWorkspaceUI();
            initCollegeAppWorkspaceUI();
            initLifeWorkspaceUI();
            initTutorialBindings();
            const tutorialBtn = document.getElementById('startTutorialBtn');
            if (tutorialBtn && tutorialBtn.dataset.bound !== 'true') {
                tutorialBtn.dataset.bound = 'true';
                tutorialBtn.addEventListener('click', () => startInteractiveTutorial(true));
            }

            applyFeatureTabVisibility();
            syncSettingsControls();
            let requestedView = '';
            try {
                requestedView = String(new URLSearchParams(window.location.search).get('view') || '').trim().toLowerCase();
            } catch (error) {
                requestedView = '';
            }
            const initialView = requestedView ? getFallbackView(requestedView) : getFallbackView(activeView);
            setActiveView(initialView);
            if (isFeatureSetupPending()) {
                showFeatureSetupOverlay();
            } else {
                hideFeatureSetupOverlay();
            }
        }

        function setApplyMode(mode, event) {
            themeApplyMode = mode;
            if (appSettings) {
                appSettings.themeApplyMode = mode;
                persistAppData();
            }
            
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');
            
            const selector = document.getElementById('pageSelector');
            if (selector) selector.classList.toggle('active', mode === 'custom');
            if (mode === 'custom') updatePageSelectorList();
        }

        function updatePageSelectorList() {
            const list = document.getElementById('pageSelectorList');
            if (!list) return;
            list.innerHTML = '';
            
            pages.forEach((page, index) => {
                const checkbox = document.createElement('div');
                checkbox.className = 'page-checkbox';

                const input = document.createElement('input');
                input.type = 'checkbox';
                const checkboxId = `theme-page-${index}`;
                input.id = checkboxId;
                input.checked = selectedPagesForTheme.includes(page.id);

                const label = document.createElement('label');
                label.htmlFor = checkboxId;
                label.style.cursor = 'pointer';
                label.style.flex = '1';
                label.textContent = String(page.title || 'Untitled');

                input.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedPagesForTheme.push(page.id);
                    } else {
                        selectedPagesForTheme = selectedPagesForTheme.filter(id => id !== page.id);
                    }
                });

                checkbox.appendChild(input);
                checkbox.appendChild(label);
                
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
                const currentPage = pages.find(p => p.id === currentPageId);
                if (currentPage) resetPage(currentPage);
            } else if (themeApplyMode === 'custom') {
                selectedPagesForTheme.forEach(pageId => {
                    const pg = pages.find(p => p.id === pageId);
                    if (pg) resetPage(pg);
                });
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
            const fontFamilyEl = document.getElementById('fontFamilySelect');
            const fontSizeEl = document.getElementById('fontSizeSelect');
            const lineHeightEl = document.getElementById('lineHeightSelect');
            if (!fontFamilyEl || !fontSizeEl || !lineHeightEl) return;
            const fontFamily = fontFamilyEl.value;
            const fontSize = fontSizeEl.value;
            const lineHeight = lineHeightEl.value;
            
            const editor = document.getElementById('editor');
            if (editor) {
                editor.style.fontFamily = fontFamily;
                editor.style.fontSize = fontSize;
                editor.style.lineHeight = lineHeight;
            }
            
            // Save settings
            saveFontSettings();
            showToast('Font settings applied!');
        }

        function saveFontSettings() {
            const fontFamilyEl = document.getElementById('fontFamilySelect');
            const fontSizeEl = document.getElementById('fontSizeSelect');
            const lineHeightEl = document.getElementById('lineHeightSelect');
            const settings = {
                fontFamily: fontFamilyEl ? fontFamilyEl.value : '',
                fontSize: fontSizeEl ? fontSizeEl.value : '',
                lineHeight: lineHeightEl ? lineHeightEl.value : ''
            };
            if (appSettings) {
                appSettings.font = settings;
                persistAppData();
            }
        }

        function loadFontSettings() {
            const settings = appSettings && appSettings.font ? appSettings.font : {};
            
            const fontFamilySelect = document.getElementById('fontFamilySelect');
            const fontSizeSelect = document.getElementById('fontSizeSelect');
            const lineHeightSelect = document.getElementById('lineHeightSelect');
            const fontFamilySelectToolbar = document.getElementById('fontFamilySelectToolbar');
            const fontSizeSelectToolbar = document.getElementById('fontSizeSelectToolbar');
            const lineHeightSelectToolbar = document.getElementById('lineHeightSelectToolbar');
            
            if (settings.fontFamily) {
                if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
                if (fontFamilySelectToolbar) fontFamilySelectToolbar.value = settings.fontFamily;
            }
            if (settings.fontSize) {
                if (fontSizeSelect) fontSizeSelect.value = settings.fontSize;
                if (fontSizeSelectToolbar) fontSizeSelectToolbar.value = settings.fontSize;
            }
            if (settings.lineHeight) {
                if (lineHeightSelect) lineHeightSelect.value = settings.lineHeight;
                if (lineHeightSelectToolbar) lineHeightSelectToolbar.value = settings.lineHeight;
            }
            
            // Apply settings
            const editor = document.getElementById('editor');
            if (editor) {
                if (settings.fontFamily) editor.style.fontFamily = settings.fontFamily;
                if (settings.fontSize) editor.style.fontSize = settings.fontSize;
                if (settings.lineHeight) editor.style.lineHeight = settings.lineHeight;
            }
        }

        // Animation Settings Functions
        function toggleAnimations() {
            const toggle = document.getElementById('animationsToggle');
            if (!toggle) return;
            const enabled = toggle.checked;
            if (appSettings) {
                appSettings.motionEnabled = enabled;
                persistAppData();
            }
            applyMotionSetting();
        }

        function loadAnimationSettings() {
            const enabled = appSettings ? appSettings.motionEnabled !== false : true;
            const toggle = document.getElementById('animationsToggle');
            if (toggle) toggle.checked = enabled;
            const toolbarToggle = document.getElementById('animationsToggleToolbar');
            if (toolbarToggle) toolbarToggle.checked = enabled;
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
            const fontFamilySelect = document.getElementById('fontFamilySelect');
            const fontSizeSelect = document.getElementById('fontSizeSelect');
            const lineHeightSelect = document.getElementById('lineHeightSelect');
            const animationsToggle = document.getElementById('animationsToggle');
            const fontFamilySelectToolbar = document.getElementById('fontFamilySelectToolbar');
            const fontSizeSelectToolbar = document.getElementById('fontSizeSelectToolbar');
            const lineHeightSelectToolbar = document.getElementById('lineHeightSelectToolbar');
            const animationsToggleToolbar = document.getElementById('animationsToggleToolbar');
            
            if (fontFamilySelect && fontFamilySelectToolbar) fontFamilySelectToolbar.value = fontFamilySelect.value;
            if (fontSizeSelect && fontSizeSelectToolbar) fontSizeSelectToolbar.value = fontSizeSelect.value;
            if (lineHeightSelect && lineHeightSelectToolbar) lineHeightSelectToolbar.value = lineHeightSelect.value;
            if (animationsToggle && animationsToggleToolbar) animationsToggleToolbar.checked = animationsToggle.checked;
        }

        function applyFontSettingsFromToolbar() {
            const fontFamilyEl = document.getElementById('fontFamilySelectToolbar');
            const fontSizeEl = document.getElementById('fontSizeSelectToolbar');
            const lineHeightEl = document.getElementById('lineHeightSelectToolbar');
            if (!fontFamilyEl || !fontSizeEl || !lineHeightEl) return;
            const fontFamily = fontFamilyEl.value;
            const fontSize = fontSizeEl.value;
            const lineHeight = lineHeightEl.value;
            
            const editor = document.getElementById('editor');
            if (editor) {
                editor.style.fontFamily = fontFamily;
                editor.style.fontSize = fontSize;
                editor.style.lineHeight = lineHeight;
            }
            
            // Sync with theme panel
            const fontFamilySelect = document.getElementById('fontFamilySelect');
            const fontSizeSelect = document.getElementById('fontSizeSelect');
            const lineHeightSelect = document.getElementById('lineHeightSelect');
            if (fontFamilySelect) fontFamilySelect.value = fontFamily;
            if (fontSizeSelect) fontSizeSelect.value = fontSize;
            if (lineHeightSelect) lineHeightSelect.value = lineHeight;
            
            // Save settings
            saveFontSettings();
        }

        function toggleAnimationsFromToolbar() {
            const toolbarToggle = document.getElementById('animationsToggleToolbar');
            if (!toolbarToggle) return;
            const enabled = toolbarToggle.checked;
            const mainToggle = document.getElementById('animationsToggle');
            if (mainToggle) mainToggle.checked = enabled;
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
  <li>Supports Groq, OpenAI, Anthropic, Gemini, and OpenRouter keys stored locally in your browser</li>
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
                content: '<h2>Welcome to NoteFlow!</h2><p>This is your personal workspace where you can:</p><ul><li>Create and organize pages in a hierarchy</li><li>Collapse and expand nested pages</li><li>Rename pages directly from the sidebar</li><li>Apply custom themes</li><li>Save your work locally or to Google Drive</li></ul><p>Check out the <b>Help & Docs</b> page for more details!</p>',
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

        function openQuickLaunchTarget(target) {
            const normalized = String(target || '').toLowerCase();
            const launchUrl = normalized === 'chatgpt' ? 'https://chatgpt.com/' : 'https://open.spotify.com/';
            const launchName = normalized === 'chatgpt' ? 'noteflow_chatgpt' : 'noteflow_spotify';

            if (tryOpenQuickAppPopup(launchUrl, launchName)) {
                return;
            }

            window.open(launchUrl, '_blank', 'noopener,noreferrer');
            showToast('Popup blocked. Opened in a new tab.');
        }

        function tryOpenQuickAppPopup(url, name) {
            const width = 1200;
            const height = 820;
            const left = Math.max(0, Math.round((window.screen.width - width) / 2));
            const top = Math.max(0, Math.round((window.screen.height - height) / 2));
            // Do not include noopener/noreferrer in popup feature string; some browsers
            // return null even when the popup opens, which causes duplicate fallback tabs.
            const features = `width=${width},height=${height},left=${left},top=${top}`;
            let popupRef = null;
            try {
                popupRef = window.open(url, name, features);
            } catch (e) {
                popupRef = null;
            }
            if (popupRef && !popupRef.closed) {
                try { popupRef.focus(); } catch (e) { /* non-critical */ }
                return true;
            }
            return false;
        }

        // Page Management
        function createNewPage() {
            const modal = document.getElementById('newPageModal');
            if (!modal) return;
            modal.classList.add('active');
            const templateSelect = document.getElementById('newPageTemplate');
            const selectedTemplate = templateSelect ? templateSelect.value : 'blank';
            updateTemplatePreview(selectedTemplate);
            document.getElementById('newPageName').focus();
        }

        function confirmNewPage() {
            const nameInput = document.getElementById('newPageName');
            const templateSelect = document.getElementById('newPageTemplate');
            const templateId = templateSelect ? templateSelect.value : 'blank';
            const template = resolvePageTemplate(templateId);
            let name = nameInput ? nameInput.value.trim() : '';

            if (!name) {
                if (template.id === 'blank') {
                    showToast('Please enter a page name');
                    if (nameInput) nameInput.focus();
                    return;
                }
                name = getUniqueGeneratedPageTitle(template.suggestedTitle || template.name);
                if (nameInput) nameInput.value = name;
            }

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
            const starterTaskCount = createStarterTasksFromTemplate(template, newPage.id);
            savePagesToLocal();
            renderPagesList();
            loadPage(newPage.id);
            setActiveView('notes');
            closeModal('newPageModal');
            renderTaskViews();
            if (starterTaskCount > 0) {
                showToast(`Page created with ${starterTaskCount} starter task${starterTaskCount === 1 ? '' : 's'}!`);
            } else {
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
                document.getElementById('editor').innerHTML = sanitizeEditorHtml(page.content);
                
                loadPageTheme(pageId);
                renderBreadcrumbs(page);
                renderTagsContainer();
                
                document.querySelectorAll('.page-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.pageId === pageId);
                });
                
                updateWordCount();
                setActiveView('notes');
                
                // On mobile, close the sidebar after selecting a page for better UX
                if (isCompactViewport()) {
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
                    html += `<span class="breadcrumb-item"><span class="breadcrumb-link" onclick="loadPage('${parentPage.id}')">${escapeHtml(parts[i])}</span></span>`;
                } else {
                    html += `<span class="breadcrumb-item"><span class="breadcrumb-current">${escapeHtml(parts[i])}</span></span>`;
                }
            }
            
            // Add current page (last part)
            html += '<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>';
            html += `<span class="breadcrumb-item"><span class="breadcrumb-current">${escapeHtml(parts[parts.length - 1])}</span></span>`;
            
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
        function formatTemplateDate(date = new Date(), options = {}) {
            return new Intl.DateTimeFormat('en-US', options).format(date);
        }

        function getTemplateIsoDate(offsetDays = 0) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + offsetDays);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        function getTemplateWeekRangeLabel() {
            const todayDate = new Date();
            const day = todayDate.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const start = new Date(todayDate);
            start.setDate(todayDate.getDate() + diffToMonday);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${formatTemplateDate(start, { month: 'short', day: 'numeric' })} - ${formatTemplateDate(end, { month: 'short', day: 'numeric' })}`;
        }

        function getUniqueGeneratedPageTitle(baseTitle) {
            const normalizedBase = String(baseTitle || 'New Page').trim() || 'New Page';
            const existing = new Set(pages.map(page => String(page.title || '').toLowerCase()));
            if (!existing.has(normalizedBase.toLowerCase())) return normalizedBase;

            let counter = 2;
            let candidate = `${normalizedBase} (${counter})`;
            while (existing.has(candidate.toLowerCase())) {
                counter += 1;
                candidate = `${normalizedBase} (${counter})`;
            }
            return candidate;
        }

        const pageTemplates = {
            blank: {
                name: 'Blank Page',
                icon: PAGE_ICONS.DOC,
                description: 'Start with a clean page and build your own structure.',
                sections: ['No starter blocks'],
                suggestedTitle: () => 'New Page',
                starterTasks: [],
                content: () => ''
            },
            meeting: {
                name: 'Meeting Notes',
                icon: PAGE_ICONS.CALENDAR,
                description: 'Capture agenda, key decisions, and follow-ups in one place.',
                sections: ['Attendees', 'Agenda', 'Discussion', 'Decisions', 'Action items'],
                suggestedTitle: () => `Meeting - ${formatTemplateDate()}`,
                starterTasks: [
                    { title: 'Send meeting recap', dueOffsetDays: 0, priority: 'high', difficulty: 'easy', category: 'work' },
                    { title: 'Schedule follow-up', dueOffsetDays: 2, priority: 'medium', difficulty: 'easy', category: 'work' }
                ],
                content: () => `<h2>Meeting Notes</h2>
<p><strong>Date:</strong> ${formatTemplateDate()}</p>
<p><strong>Attendees:</strong> </p>
<h3>Agenda</h3>
<ul><li>Topic 1</li><li>Topic 2</li><li>Topic 3</li></ul>
<h3>Discussion</h3>
<p><br></p>
<h3>Decisions</h3>
<ul><li></li></ul>
<h3>Action Items</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Owner - Task</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Owner - Task</span></div>
<h3>Next Steps</h3>
<p><br></p>`
            },
            project: {
                name: 'Project Plan',
                icon: PAGE_ICONS.ROCKET,
                description: 'Plan goals, milestones, risks, and delivery actions.',
                sections: ['Overview', 'Goals', 'Milestones', 'Risks', 'Next actions'],
                suggestedTitle: () => 'Project - Name',
                starterTasks: [
                    { title: 'Define project scope', dueOffsetDays: 1, priority: 'high', difficulty: 'medium', category: 'work' },
                    { title: 'Create milestone timeline', dueOffsetDays: 2, priority: 'high', difficulty: 'medium', category: 'work' },
                    { title: 'Identify top project risks', dueOffsetDays: 3, priority: 'medium', difficulty: 'medium', category: 'work' }
                ],
                content: () => `<h2>Project: Name</h2>
<h3>Overview</h3>
<p>Brief description of the project...</p>
<h3>Goals</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 1</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 2</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 3</span></div>
<h3>Milestones</h3>
<table><thead><tr><th>Milestone</th><th>Owner</th><th>Date</th><th>Status</th></tr></thead><tbody>
<tr><td>Planning complete</td><td></td><td></td><td>\u{1F7E1} In progress</td></tr>
<tr><td>Build complete</td><td></td><td></td><td>\u26AA Not started</td></tr>
<tr><td>Launch</td><td></td><td></td><td>\u26AA Not started</td></tr></tbody></table>
<h3>Risks & Mitigation</h3>
<ul><li></li></ul>
<h3>Resources</h3>
<ul><li></li></ul>
<h3>Notes</h3>
<p><br></p>`
            },
            todo: {
                name: 'To-Do List',
                icon: PAGE_ICONS.CHECK,
                description: 'Prioritized list with high-impact tasks surfaced first.',
                sections: ['High priority', 'Medium priority', 'Low priority', 'Done'],
                suggestedTitle: () => `Tasks - ${formatTemplateDate()}`,
                starterTasks: [
                    { title: 'Complete top-priority task', dueOffsetDays: 0, priority: 'high', difficulty: 'medium', category: 'none' },
                    { title: 'Review backlog and reprioritize', dueOffsetDays: 1, priority: 'medium', difficulty: 'easy', category: 'none' }
                ],
                content: () => `<h2>To-Do List</h2>
<h3>\u{1F534} High Priority</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 1</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 2</span></div>
<h3>\u{1F7E1} Medium Priority</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 3</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 4</span></div>
<h3>\u{1F7E2} Low Priority</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Task 5</span></div>
<h3>\u2705 Completed</h3>
<div class="checklist-item"><input type="checkbox" checked><span contenteditable="true">Completed task example</span></div>`
            },
            journal: {
                name: 'Daily Journal',
                icon: PAGE_ICONS.JOURNAL,
                description: 'Reflect daily with prompts for intention and review.',
                sections: ['Intentions', 'Notes', 'Gratitude', 'Reflection'],
                suggestedTitle: () => `Journal - ${formatTemplateDate()}`,
                starterTasks: [
                    { title: 'Write evening reflection', dueOffsetDays: 0, priority: 'medium', difficulty: 'easy', category: 'personal' }
                ],
                content: () => `<h2>\u{1F4D4} ${formatTemplateDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
<h3>\u{1F305} Morning Intentions</h3>
<p>What do I want to accomplish today?</p>
<h3>\u{1F4DD} Notes & Thoughts</h3>
<p><br></p>
<h3>\u{1F64F} Gratitude</h3>
<ul><li>Today I am grateful for...</li><li></li><li></li></ul>
<h3>\u{1F319} Evening Reflection</h3>
<p>What went well today? What could be improved?</p>`
            },
            weekly: {
                name: 'Weekly Review',
                icon: PAGE_ICONS.CHART,
                description: 'Review progress, wins, blockers, and next-week goals.',
                sections: ['Goals', 'Wins', 'Challenges', 'Next week'],
                suggestedTitle: () => `Weekly Review - ${getTemplateWeekRangeLabel()}`,
                starterTasks: [
                    { title: 'Plan top 3 goals for next week', dueOffsetDays: 1, priority: 'high', difficulty: 'medium', category: 'work' },
                    { title: 'Archive completed notes for the week', dueOffsetDays: 1, priority: 'low', difficulty: 'easy', category: 'none' }
                ],
                content: () => `<h2>\u{1F4CA} Week of ${getTemplateWeekRangeLabel()}</h2>
<h3>\u{1F3AF} This Week's Goals</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 1</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 2</span></div>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Goal 3</span></div>
<h3>\u{1F4C5} Day-by-Day Notes</h3>
<p><strong>Monday:</strong> </p>
<p><strong>Tuesday:</strong> </p>
<p><strong>Wednesday:</strong> </p>
<p><strong>Thursday:</strong> </p>
<p><strong>Friday:</strong> </p>
<h3>\u{1F3C6} Wins</h3>
<ul><li></li></ul>
<h3>\u{1F4C8} Challenges</h3>
<ul><li></li></ul>
<h3>\u{1F4A1} Next Week</h3>
<p><br></p>`
            },
            notes: {
                name: 'Study Notes',
                icon: PAGE_ICONS.BOOKS,
                description: 'Structured learning notes with concept, examples, and recap.',
                sections: ['Key concepts', 'Examples', 'Questions', 'Summary'],
                suggestedTitle: () => 'Study - Topic',
                starterTasks: [
                    { title: 'Create 5-question self-test', dueOffsetDays: 2, priority: 'medium', difficulty: 'medium', category: 'learning' }
                ],
                content: () => `<h2>\u{1F4DA} Subject / Topic</h2>
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
            },
            sprint: {
                name: 'Sprint Planner',
                icon: PAGE_ICONS.ROCKET,
                description: 'Plan a sprint with backlog, owners, and daily checkpoints.',
                sections: ['Sprint goal', 'Backlog', 'Daily checkpoint', 'Blockers'],
                suggestedTitle: () => `Sprint - ${getTemplateWeekRangeLabel()}`,
                starterTasks: [
                    { title: 'Finalize sprint scope', dueOffsetDays: 0, priority: 'high', difficulty: 'medium', category: 'work' },
                    { title: 'Run mid-sprint health check', dueOffsetDays: 3, priority: 'medium', difficulty: 'easy', category: 'work' },
                    { title: 'Prepare sprint retrospective notes', dueOffsetDays: 6, priority: 'medium', difficulty: 'medium', category: 'work' }
                ],
                content: () => `<h2>Sprint Planner</h2>
<p><strong>Sprint Window:</strong> ${getTemplateWeekRangeLabel()}</p>
<h3>Sprint Goal</h3>
<p></p>
<h3>Priority Backlog</h3>
<table><thead><tr><th>Task</th><th>Owner</th><th>Estimate</th><th>Status</th></tr></thead><tbody>
<tr><td></td><td></td><td></td><td>\u26AA Not started</td></tr>
<tr><td></td><td></td><td></td><td>\u26AA Not started</td></tr></tbody></table>
<h3>Daily Checkpoints</h3>
<p><strong>Standup Notes:</strong> </p>
<h3>Blockers</h3>
<ul><li></li></ul>
<h3>Retrospective Notes</h3>
<p><br></p>`
            },
            client: {
                name: 'Client Brief',
                icon: PAGE_ICONS.NOTE,
                description: 'Capture scope, stakeholders, deliverables, and approvals.',
                sections: ['Context', 'Deliverables', 'Timeline', 'Approvals'],
                suggestedTitle: () => 'Client Brief - Name',
                starterTasks: [
                    { title: 'Confirm scope with client', dueOffsetDays: 1, priority: 'high', difficulty: 'easy', category: 'work' },
                    { title: 'Share first draft deliverable', dueOffsetDays: 3, priority: 'medium', difficulty: 'medium', category: 'work' }
                ],
                content: () => `<h2>Client Brief</h2>
<p><strong>Client:</strong> </p>
<p><strong>Prepared on:</strong> ${formatTemplateDate()}</p>
<h3>Project Context</h3>
<p></p>
<h3>Goals & Success Metrics</h3>
<ul><li></li></ul>
<h3>Deliverables</h3>
<table><thead><tr><th>Deliverable</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>
<tr><td></td><td></td><td></td><td>\u26AA Not started</td></tr></tbody></table>
<h3>Dependencies & Risks</h3>
<ul><li></li></ul>
<h3>Approval Notes</h3>
<p><br></p>`
            },
            decision: {
                name: 'Decision Log',
                icon: PAGE_ICONS.SCROLL,
                description: 'Record key decisions with options, rationale, and outcomes.',
                sections: ['Context', 'Options', 'Decision', 'Follow-up'],
                suggestedTitle: () => `Decision Log - ${formatTemplateDate()}`,
                starterTasks: [
                    { title: 'Review decision impact after 1 week', dueOffsetDays: 7, priority: 'medium', difficulty: 'easy', category: 'work' }
                ],
                content: () => `<h2>Decision Log</h2>
<p><strong>Date:</strong> ${formatTemplateDate()}</p>
<h3>Decision Context</h3>
<p></p>
<h3>Options Considered</h3>
<table><thead><tr><th>Option</th><th>Pros</th><th>Cons</th></tr></thead><tbody>
<tr><td>Option A</td><td></td><td></td></tr>
<tr><td>Option B</td><td></td><td></td></tr></tbody></table>
<h3>Selected Decision</h3>
<p></p>
<h3>Rationale</h3>
<p></p>
<h3>Follow-up Checks</h3>
<div class="checklist-item"><input type="checkbox"><span contenteditable="true">Validate outcome after one week</span></div>`
            }
        };

        function resolvePageTemplate(templateId) {
            const fallback = pageTemplates.blank;
            const key = pageTemplates[templateId] ? templateId : 'blank';
            const template = pageTemplates[key] || fallback;
            const resolvedName = String(template.name || fallback.name || 'Template');
            const resolvedIcon = normalizePageIcon(template.icon) || fallback.icon || PAGE_ICONS.DOC;
            const resolvedDescription = String(template.description || fallback.description || '');
            const resolvedSections = Array.isArray(template.sections) ? template.sections.filter(Boolean).map(item => String(item)) : [];
            const resolvedStarterTasks = Array.isArray(template.starterTasks)
                ? template.starterTasks.map(task => ({ ...task }))
                : [];
            const suggestedTitle = typeof template.suggestedTitle === 'function'
                ? template.suggestedTitle()
                : (template.suggestedTitle || resolvedName);
            const resolvedContent = typeof template.content === 'function'
                ? template.content()
                : String(template.content || '');

            return {
                id: key,
                name: resolvedName,
                icon: resolvedIcon,
                description: resolvedDescription,
                sections: resolvedSections,
                suggestedTitle: String(suggestedTitle || resolvedName),
                starterTasks: resolvedStarterTasks,
                content: resolvedContent
            };
        }

        function buildStarterTaskFromTemplate(taskConfig, noteId) {
            if (!taskConfig) return null;
            const title = String(taskConfig.title || '').trim();
            if (!title) return null;

            const scheduleTypeRaw = String(taskConfig.scheduleType || 'once').toLowerCase();
            const scheduleType = scheduleTypeRaw === 'daily' || scheduleTypeRaw === 'weekly' ? scheduleTypeRaw : 'once';
            let weeklyDays = Array.isArray(taskConfig.weeklyDays)
                ? taskConfig.weeklyDays.map(day => Number(day)).filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
                : [];
            if (scheduleType === 'weekly' && weeklyDays.length === 0) {
                weeklyDays = [new Date().getDay()];
            }

            const offset = Number(taskConfig.dueOffsetDays);
            const dueDate = Number.isFinite(offset)
                ? getTemplateIsoDate(offset)
                : (typeof taskConfig.dueDate === 'string' && taskConfig.dueDate.trim() ? taskConfig.dueDate : null);

            return {
                id: generateId(),
                title,
                notes: String(taskConfig.notes || ''),
                scheduleType,
                weeklyDays,
                category: String(taskConfig.category || 'none'),
                priority: normalizePriorityValue(taskConfig.priority),
                difficulty: normalizeDifficultyValue(taskConfig.difficulty),
                estimate: 0,
                createdAt: new Date().toISOString(),
                isActive: true,
                noteId: noteId || null,
                dueDate,
                origin: noteId ? 'note' : 'streak'
            };
        }

        function createStarterTasksFromTemplate(template, noteId, options = {}) {
            const starterTasks = template && Array.isArray(template.starterTasks) ? template.starterTasks : [];
            if (starterTasks.length === 0) return 0;

            const toggle = document.getElementById('newPageCreateTasks');
            const shouldCreate = options.forceCreate === true || !!(toggle && toggle.checked);
            if (!shouldCreate) return 0;

            let createdCount = 0;
            starterTasks.forEach(taskConfig => {
                const newTask = buildStarterTaskFromTemplate(taskConfig, noteId);
                if (!newTask) return;
                tasks.unshift(newTask);
                taskOrder.unshift(newTask.id);
                createdCount += 1;
            });
            return createdCount;
        }

        function updateTemplatePreview(templateId) {
            const template = resolvePageTemplate(templateId);
            const iconEl = document.getElementById('templatePreviewIcon');
            const nameEl = document.getElementById('templatePreviewName');
            const descEl = document.getElementById('templatePreviewDescription');
            const sectionsEl = document.getElementById('templatePreviewSections');
            const taskRowEl = document.getElementById('templateTaskOptions');
            const taskSummaryEl = document.getElementById('templateTaskSummary');
            const taskToggleEl = document.getElementById('newPageCreateTasks');
            const suggestedNameBtn = document.getElementById('templateUseNameBtn');
            const nameInput = document.getElementById('newPageName');

            if (iconEl) iconEl.textContent = template.icon || PAGE_ICONS.DOC;
            if (nameEl) nameEl.textContent = template.name;
            if (descEl) descEl.textContent = template.description || '';

            if (sectionsEl) {
                const sectionList = template.sections.length ? template.sections : ['No starter blocks'];
                sectionsEl.innerHTML = '';
                sectionList.slice(0, 8).forEach(section => {
                    const chip = document.createElement('span');
                    chip.className = 'template-preview-tag';
                    chip.textContent = section;
                    sectionsEl.appendChild(chip);
                });
            }

            const taskCount = template.starterTasks.length;
            if (taskSummaryEl) {
                taskSummaryEl.textContent = taskCount > 0
                    ? `${taskCount} starter task${taskCount === 1 ? '' : 's'} will be linked to this page.`
                    : 'No linked tasks for this template.';
            }
            if (taskToggleEl) {
                if (taskCount > 0) {
                    taskToggleEl.disabled = false;
                    if (!taskToggleEl.dataset.userToggled) taskToggleEl.checked = true;
                } else {
                    taskToggleEl.checked = false;
                    taskToggleEl.disabled = true;
                    delete taskToggleEl.dataset.userToggled;
                }
            }
            if (taskRowEl) {
                taskRowEl.classList.toggle('disabled', taskCount === 0);
            }
            if (suggestedNameBtn) {
                const canSuggest = template.id !== 'blank';
                suggestedNameBtn.disabled = !canSuggest;
                suggestedNameBtn.style.opacity = canSuggest ? '1' : '0.55';
            }
            if (nameInput && !nameInput.value.trim()) {
                nameInput.placeholder = template.id === 'blank'
                    ? 'Enter page name (use :: for hierarchy)...'
                    : `Suggested: ${template.suggestedTitle}`;
            }
        }

        function applyTemplateSuggestedName() {
            const select = document.getElementById('newPageTemplate');
            const template = resolvePageTemplate(select ? select.value : 'blank');
            if (template.id === 'blank') return;

            const input = document.getElementById('newPageName');
            if (!input) return;
            const suggested = getUniqueGeneratedPageTitle(template.suggestedTitle || template.name);
            input.value = suggested;
            input.focus();
            input.setSelectionRange(suggested.length, suggested.length);
        }

        // Hierarchical Sidebar Rendering
        function renderPagesList() {
            const pagesList = document.getElementById('pagesList');
            pagesList.innerHTML = '';
            const activeSearchQuery = getSearchQuery();
            const forceExpandForSearch = new Set();
            if (activeSearchQuery !== '') {
                const query = activeSearchQuery;
                const pageIdByTitle = new Map(pages.map(page => [String(page.title || ''), page.id]));
                pages.forEach(page => {
                    const title = String(page.title || '').toLowerCase();
                    const contentText = page.content ? String(page.content).replace(/<[^>]*>/g, '').toLowerCase() : '';
                    if (!(title.includes(query) || contentText.includes(query))) return;

                    const parts = String(page.title || '').split('::').map(part => part.trim()).filter(Boolean);
                    let path = '';
                    for (let i = 0; i < parts.length - 1; i += 1) {
                        path = path ? `${path}::${parts[i]}` : parts[i];
                        const ancestorId = pageIdByTitle.get(path);
                        if (ancestorId) forceExpandForSearch.add(ancestorId);
                    }
                });
            }
            searchForceExpanded = activeSearchQuery !== '' && forceExpandForSearch.size > 0;
            // No sort: use the order in the pages array
            const pageMap = new Map(pages.map(p => [p.id, p]));
            const pageByTitle = new Map(pages.map(page => [String(page.title || ''), page]));
            const childrenMap = new Map();
            // Build parent-child relationships
            pages.forEach(page => {
                const parts = page.title.split('::');
                if (parts.length > 1) {
                    const parentTitle = parts.slice(0, -1).join('::');
                    const parent = pageByTitle.get(parentTitle);
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
                if (hasChildren) {
                    const collapseIcon = document.createElement('i');
                    collapseIcon.className = `fas ${page.collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`;
                    collapseIcon.style.width = '14px';
                    collapseIcon.style.textAlign = 'center';
                    collapseIcon.style.cursor = 'pointer';
                    collapseIcon.addEventListener('click', (event) => {
                        event.stopPropagation();
                        toggleCollapse(page.id);
                    });
                    pageItem.appendChild(collapseIcon);
                }

                const iconDisplay = normalizePageIcon(page.icon) || PAGE_ICONS.DOC;
                const pageIcon = document.createElement('span');
                pageIcon.className = 'page-icon';
                pageIcon.title = 'Click to change icon';
                pageIcon.textContent = iconDisplay;
                pageIcon.addEventListener('click', (event) => {
                    event.stopPropagation();
                    openEmojiPicker(page.id);
                });
                pageItem.appendChild(pageIcon);

                const titleEl = document.createElement('span');
                titleEl.className = 'page-title-text';
                titleEl.textContent = displayTitle;
                pageItem.appendChild(titleEl);

                if (page.starred) {
                    const starIndicator = document.createElement('i');
                    starIndicator.className = 'fas fa-star page-star-indicator';
                    starIndicator.title = 'Favorite';
                    pageItem.appendChild(starIndicator);
                }

                if (page.theme && page.theme !== 'default') {
                    const themeIndicator = document.createElement('div');
                    themeIndicator.className = 'page-theme-indicator';
                    themeIndicator.title = 'Custom theme applied';
                    themeIndicator.style.background = themeColor;
                    pageItem.appendChild(themeIndicator);
                }

                const iconsWrap = document.createElement('div');
                iconsWrap.className = 'page-item-icons';

                const makeActionIcon = (className, title, onClick) => {
                    const icon = document.createElement('i');
                    icon.className = className;
                    icon.title = title;
                    icon.addEventListener('click', (event) => {
                        event.stopPropagation();
                        onClick();
                    });
                    return icon;
                };

                iconsWrap.appendChild(makeActionIcon(
                    `fas ${page.starred ? 'fa-star starred' : 'fa-star'}`,
                    page.starred ? 'Remove from favorites' : 'Add to favorites',
                    () => toggleStar(page.id)
                ));
                iconsWrap.appendChild(makeActionIcon('fas fa-copy', 'Duplicate', () => duplicatePage(page.id)));
                iconsWrap.appendChild(makeActionIcon('fas fa-pencil-alt', 'Rename', () => showRenameModal(page.id)));
                iconsWrap.appendChild(makeActionIcon('fas fa-trash', 'Delete', () => deletePage(page.id)));
                pageItem.appendChild(iconsWrap);
                pagesList.appendChild(pageItem);
                if (hasChildren && (!page.collapsed || forceExpandForSearch.has(page.id))) {
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
            pages = normalizePagesCollection(appData && appData.pages);

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
                        icon: PAGE_ICONS.FOLDER,
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

        async function saveToLocal() {
            updateSaveStatus('saving');
            savePage();
            savePagesToLocal();
            try {
                await flushAppSaveNow();
                const stamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                updateSaveStatus('saved', `Saved ${stamp}`);
                showToast('Saved locally to this browser.');
            } catch (e) {
                console.error('Manual local save failed', e);
                updateSaveStatus('saved', 'Save failed');
                showToast('Local save failed. Try again.');
            }
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
                habitTracker: { habits, dayStates: habitDayStates },
                collegeTracker,
                academicWorkspace,
                collegeAppWorkspace,
                lifeWorkspace,
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

        const ICS_DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const ICS_DAY_TO_INDEX = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

        function formatIcsDate(dateObj) {
            const d = new Date(dateObj);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}${m}${day}`;
        }

        function formatIcsDateTimeUtc(dateObj) {
            const d = new Date(dateObj);
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            const hh = String(d.getUTCHours()).padStart(2, '0');
            const mm = String(d.getUTCMinutes()).padStart(2, '0');
            const ss = String(d.getUTCSeconds()).padStart(2, '0');
            return `${y}${m}${day}T${hh}${mm}${ss}Z`;
        }

        function escapeIcsText(value) {
            return String(value || '')
                .replace(/\\/g, '\\\\')
                .replace(/\r?\n/g, '\\n')
                .replace(/,/g, '\\,')
                .replace(/;/g, '\\;');
        }

        function decodeIcsText(value) {
            return String(value || '')
                .replace(/\\n/gi, '\n')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .replace(/\\\\/g, '\\');
        }

        function parseByDayFromRrule(rrule) {
            const match = String(rrule || '').toUpperCase().match(/BYDAY=([A-Z0-9,+-]+)/);
            if (!match || !match[1]) return [];
            return match[1]
                .split(',')
                .map(token => token.trim().replace(/^[+-]?\d+/, ''))
                .map(token => ICS_DAY_TO_INDEX[token])
                .filter(idx => Number.isInteger(idx));
        }

        function parseIcsDateToKey(raw) {
            const value = String(raw || '').trim();
            if (!value) return null;
            if (/^\d{8}$/.test(value)) {
                return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
            }
            const utcMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$/);
            if (utcMatch) {
                const dt = new Date(Date.UTC(
                    Number(utcMatch[1]),
                    Number(utcMatch[2]) - 1,
                    Number(utcMatch[3]),
                    Number(utcMatch[4]),
                    Number(utcMatch[5]),
                    Number(utcMatch[6] || '0')
                ));
                if (isNaN(dt)) return null;
                return dateKey(dt);
            }

            const localMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
            if (localMatch) {
                const dt = new Date(
                    Number(localMatch[1]),
                    Number(localMatch[2]) - 1,
                    Number(localMatch[3]),
                    Number(localMatch[4]),
                    Number(localMatch[5]),
                    Number(localMatch[6] || '0')
                );
                if (isNaN(dt)) return null;
                return dateKey(dt);
            }

            return null;
        }

        function toTimeString(hours, minutes) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        function minutesToTimeString(totalMinutes) {
            const clamped = Math.max(0, Math.min(23 * 60 + 59, Number(totalMinutes) || 0));
            const hours = Math.floor(clamped / 60);
            const minutes = clamped % 60;
            return toTimeString(hours, minutes);
        }

        function parseIcsDateTimeInfo(raw) {
            const value = String(raw || '').trim();
            if (!value) return null;
            if (/^\d{8}$/.test(value)) {
                const d = parseIcsDateToKey(value);
                return d ? { dateKey: d, isAllDay: true, time: null } : null;
            }

            const zMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$/);
            if (zMatch) {
                const dt = new Date(Date.UTC(
                    Number(zMatch[1]),
                    Number(zMatch[2]) - 1,
                    Number(zMatch[3]),
                    Number(zMatch[4]),
                    Number(zMatch[5]),
                    Number(zMatch[6] || '0')
                ));
                if (isNaN(dt)) return null;
                return {
                    dateKey: dateKey(dt),
                    isAllDay: false,
                    time: toTimeString(dt.getHours(), dt.getMinutes())
                };
            }

            const localMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
            if (localMatch) {
                return {
                    dateKey: `${localMatch[1]}-${localMatch[2]}-${localMatch[3]}`,
                    isAllDay: false,
                    time: `${localMatch[4]}:${localMatch[5]}`
                };
            }

            return null;
        }

        function parseUntilFromRrule(rrule) {
            const match = String(rrule || '').toUpperCase().match(/UNTIL=([0-9TZ]+)/);
            if (!match || !match[1]) return null;
            return parseIcsDateToKey(match[1]);
        }

        function extractGoogleDocsUrl(...values) {
            for (const value of values) {
                const text = decodeIcsText(value || '');
                const match = text.match(/https?:\/\/docs\.google\.com\/[^\s)]+/i);
                if (match && match[0]) return match[0];
            }
            return null;
        }

        function simpleHash(value) {
            let hash = 0;
            const text = String(value || '');
            for (let i = 0; i < text.length; i += 1) {
                hash = ((hash << 5) - hash) + text.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash);
        }

        function buildCalendarSourceUid(evt) {
            const uidRaw = decodeIcsText(evt.UID || '').trim();
            const recurrenceId = String(evt['RECURRENCE-ID'] || '').trim();
            if (uidRaw && recurrenceId) return `${uidRaw}__${recurrenceId}`;
            if (uidRaw) return uidRaw;
            const base = [
                decodeIcsText(evt.SUMMARY || '').trim(),
                String(evt.DTSTART || '').trim(),
                String(evt.DTEND || '').trim(),
                String(evt['RECURRENCE-ID'] || '').trim(),
                String(evt.RRULE || '').trim()
            ].join('|');
            return `derived-${simpleHash(base)}`;
        }

        function parseIcsEvents(icsText) {
            const rawLines = String(icsText || '')
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .split('\n');
            const lines = [];
            rawLines.forEach(line => {
                if (/^[ \t]/.test(line) && lines.length > 0) {
                    lines[lines.length - 1] += line.slice(1);
                } else {
                    lines.push(line);
                }
            });

            const events = [];
            let current = null;
            lines.forEach(line => {
                const clean = String(line || '').trim();
                if (!clean) return;
                if (clean === 'BEGIN:VEVENT') {
                    current = {};
                    return;
                }
                if (clean === 'END:VEVENT') {
                    if (current) events.push(current);
                    current = null;
                    return;
                }
                if (!current) return;

                const idx = clean.indexOf(':');
                if (idx === -1) return;
                const rawKey = clean.slice(0, idx);
                const rawValue = clean.slice(idx + 1);
                const keyParts = rawKey.split(';');
                const key = String(keyParts.shift() || '').toUpperCase();
                if (!key) return;
                current[key] = rawValue;
                if (keyParts.length) current[`${key}_PARAMS`] = keyParts;
            });

            return events;
        }

        function exportCalendarIcs() {
            savePage();
            const now = new Date();
            const dtStamp = formatIcsDateTimeUtc(now);
            const lines = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//NoteFlow Atelier//Calendar Sync//EN',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH',
                'X-WR-CALNAME:NoteFlow Atelier'
            ];

            const activeTasks = safeGetTasks().filter(task => task && task.isActive !== false);
            activeTasks.forEach(task => {
                const summary = escapeIcsText(`Task: ${task.title || 'Untitled Task'}`);
                const description = escapeIcsText(task.notes || '');
                const uid = `task-${String(task.id || generateId())}@noteflow-atelier`;
                lines.push('BEGIN:VEVENT');
                lines.push(`UID:${uid}`);
                lines.push(`DTSTAMP:${dtStamp}`);
                lines.push(`SUMMARY:${summary}`);
                if (description) lines.push(`DESCRIPTION:${description}`);

                if (task.scheduleType === 'daily') {
                    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(now)}`);
                    lines.push('RRULE:FREQ=DAILY');
                } else if (task.scheduleType === 'weekly') {
                    const byDay = (Array.isArray(task.weeklyDays) ? task.weeklyDays : [])
                        .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
                        .map(day => ICS_DAY_CODES[day]);
                    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(now)}`);
                    lines.push(`RRULE:FREQ=WEEKLY${byDay.length ? `;BYDAY=${byDay.join(',')}` : ''}`);
                } else if (task.dueDate) {
                    const start = parseDate(task.dueDate);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 1);
                    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(start)}`);
                    lines.push(`DTEND;VALUE=DATE:${formatIcsDate(end)}`);
                } else {
                    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(now)}`);
                }

                lines.push('END:VEVENT');
            });

            const blockList = Array.isArray(timeBlocks) ? timeBlocks : [];
            blockList.forEach(block => {
                const startMinutes = parseTimeToMinutes(block && block.start);
                const endMinutes = parseTimeToMinutes(block && block.end);
                if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return;
                const eventDate = normalizeBlockDate(block.date) || dateKey(new Date());
                const baseDate = parseDate(eventDate);
                const start = new Date(baseDate);
                start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
                const end = new Date(baseDate);
                end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

                const uid = `block-${String(block.id || generateBlockId())}@noteflow-atelier`;
                lines.push('BEGIN:VEVENT');
                lines.push(`UID:${uid}`);
                lines.push(`DTSTAMP:${dtStamp}`);
                lines.push(`SUMMARY:${escapeIcsText(`Block: ${block.name || 'Untitled Block'}`)}`);
                lines.push(`DTSTART:${formatIcsDateTimeUtc(start)}`);
                lines.push(`DTEND:${formatIcsDateTimeUtc(end)}`);
                if (block.referenceUrl) {
                    lines.push(`DESCRIPTION:${escapeIcsText(`Reference: ${block.referenceUrl}`)}`);
                }

                const recurrence = String(block.recurrence || 'none').toLowerCase();
                if (recurrence === 'daily') {
                    lines.push('RRULE:FREQ=DAILY');
                } else if (recurrence === 'weekdays') {
                    lines.push('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
                } else if (recurrence === 'weekly') {
                    const byDay = (Array.isArray(block.weeklyDays) && block.weeklyDays.length)
                        ? block.weeklyDays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6).map(day => ICS_DAY_CODES[day])
                        : [ICS_DAY_CODES[parseDate(eventDate).getDay()]];
                    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay.join(',')}`);
                }

                lines.push('END:VEVENT');
            });

            lines.push('END:VCALENDAR');

            const blob = new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `noteflow_calendar_${dateKey(new Date())}.ics`;
            link.click();
            URL.revokeObjectURL(url);
            showToast('Calendar exported (.ics)');
        }

        function triggerCalendarIcsImport() {
            const input = document.getElementById('calendarIcsInput');
            if (!input) return;
            input.value = '';
            input.click();
        }

        function clearCalendarImports() {
            const allBlocks = Array.isArray(timeBlocks) ? timeBlocks : [];
            const importedBlocks = allBlocks.filter(block => {
                if (!block) return false;
                return block.source === 'calendar_ics'
                    || block.source === 'calendar_google'
                    || String(block.id || '').startsWith('ics_');
            });

            const allTasks = Array.isArray(tasks) ? tasks : [];
            const legacyCalendarTasks = allTasks.filter(task => task && task.origin === 'calendar');

            const blockCount = importedBlocks.length;
            const taskCount = legacyCalendarTasks.length;
            if (!blockCount && !taskCount) {
                showToast('No imported calendar data found');
                return;
            }

            const summary = [];
            if (blockCount) summary.push(`${blockCount} imported block${blockCount === 1 ? '' : 's'}`);
            if (taskCount) summary.push(`${taskCount} legacy task${taskCount === 1 ? '' : 's'}`);
            const confirmMsg = `Remove ${summary.join(' and ')}? This cannot be undone.`;
            if (!window.confirm(confirmMsg)) return;

            if (blockCount) {
                const importedIds = new Set(importedBlocks.map(block => block.id));
                timeBlocks = allBlocks.filter(block => !importedIds.has(block && block.id));
            }

            if (taskCount) {
                const legacyIds = new Set(legacyCalendarTasks.map(task => task.id));
                tasks = allTasks.filter(task => !legacyIds.has(task.id));
                taskOrder = (Array.isArray(taskOrder) ? taskOrder : []).filter(id => !legacyIds.has(id));
                legacyIds.forEach(id => {
                    delete taskStreaks[id];
                    removeTaskReferencesFromDayStates(id);
                });
            }

            saveTimeBlocks();
            persistAppData();
            renderTaskViews();
            renderTimeline();
            updateGoogleCalendarSyncStatusLabel();
            try { populateProgressDashboard(); } catch (e) { /* non-critical */ }
            showToast(`Removed ${summary.join(' and ')}`);
        }

        async function handleCalendarIcsSelected(event) {
            const input = event && event.target ? event.target : null;
            const file = input && input.files ? input.files[0] : null;
            if (!file) return;

            try {
                const text = await readFileAsText(file);
                const events = parseIcsEvents(text);
                if (!events.length) {
                    showToast('No events found in ICS file');
                    return;
                }

                // Cleanup old behavior where ICS imports created tasks.
                const legacyCalendarTasks = (Array.isArray(tasks) ? tasks : []).filter(task => task && task.origin === 'calendar');
                if (legacyCalendarTasks.length) {
                    const legacyIds = new Set(legacyCalendarTasks.map(task => task.id));
                    tasks = tasks.filter(task => !legacyIds.has(task.id));
                    taskOrder = taskOrder.filter(id => !legacyIds.has(id));
                    legacyIds.forEach(id => {
                        delete taskStreaks[id];
                        removeTaskReferencesFromDayStates(id);
                    });
                }

                const existingByUid = new Map(
                    (Array.isArray(timeBlocks) ? timeBlocks : [])
                        .filter(block => block && block.source === 'calendar_ics' && block.sourceUid)
                        .map(block => [block.sourceUid, block])
                );

                let createdCount = 0;
                let updatedCount = 0;
                const importedSourceUids = new Set();
                events.forEach((evt, idx) => {
                    const summary = decodeIcsText(evt.SUMMARY || `Calendar Event ${idx + 1}`).trim();
                    const description = decodeIcsText(evt.DESCRIPTION || '').trim();
                    const location = decodeIcsText(evt.LOCATION || '').trim();
                    const startInfo = parseIcsDateTimeInfo(evt.DTSTART);
                    if (!summary || !startInfo || !startInfo.dateKey) return;

                    const rrule = String(evt.RRULE || '').toUpperCase();
                    let recurrence = 'none';
                    let weeklyDays = [];
                    const recurrenceUntil = parseUntilFromRrule(rrule);
                    if (rrule.includes('FREQ=DAILY')) {
                        recurrence = 'daily';
                    } else if (rrule.includes('FREQ=WEEKLY')) {
                        weeklyDays = parseByDayFromRrule(rrule);
                        const weekdaysPattern = [1, 2, 3, 4, 5];
                        const isWeekdays = weekdaysPattern.every(day => weeklyDays.includes(day)) && weeklyDays.length === weekdaysPattern.length;
                        if (isWeekdays) {
                            recurrence = 'weekdays';
                        } else {
                            recurrence = 'weekly';
                            if (!weeklyDays.length) weeklyDays = [parseDate(startInfo.dateKey).getDay()];
                        }
                    }

                    const endInfo = parseIcsDateTimeInfo(evt.DTEND);
                    let startTime = startInfo.time || '09:00';
                    let endTime = endInfo && endInfo.time ? endInfo.time : null;
                    const startMins = parseTimeToMinutes(startTime);
                    let endMins = parseTimeToMinutes(endTime);
                    if (!Number.isFinite(endMins) || endMins <= startMins) {
                        endMins = Math.min((startMins || 0) + 60, 23 * 60 + 59);
                    }
                    endTime = minutesToTimeString(endMins);

                    const sourceUid = buildCalendarSourceUid(evt);
                    importedSourceUids.add(sourceUid);
                    const referenceUrl = extractGoogleDocsUrl(evt.URL, evt.DESCRIPTION, evt.LOCATION);
                    const nextBlock = {
                        name: summary,
                        start: startTime,
                        end: endTime,
                        category: 'work',
                        color: '#4f8cff',
                        recurrence: 'none',
                        importedRecurrence: recurrence,
                        preserveRecurrence: false,
                        date: startInfo.dateKey,
                        recurrenceUntil: recurrenceUntil || null,
                        weeklyDays: [],
                        notes: [description, location].filter(Boolean).join(' | ') || null,
                        referenceUrl: referenceUrl || null,
                        source: 'calendar_ics',
                        sourceUid,
                        updatedAt: Date.now()
                    };

                    const existing = existingByUid.get(sourceUid);
                    if (existing) {
                        Object.assign(existing, nextBlock);
                        updatedCount += 1;
                    } else {
                        timeBlocks.push({
                            id: `ics_${simpleHash(sourceUid)}_${Math.random().toString(36).slice(2, 6)}`,
                            ...nextBlock,
                            createdAt: Date.now()
                        });
                        createdCount += 1;
                    }
                });

                const beforeSyncCount = Array.isArray(timeBlocks) ? timeBlocks.length : 0;
                timeBlocks = (Array.isArray(timeBlocks) ? timeBlocks : []).filter(block => {
                    if (!block || block.source !== 'calendar_ics') return true;
                    if (!block.sourceUid) return false; // remove legacy orphaned imports
                    return importedSourceUids.has(block.sourceUid);
                });
                const removedCount = Math.max(0, beforeSyncCount - timeBlocks.length);

                if (!createdCount && !updatedCount && !removedCount) {
                    showToast('No importable events found');
                    return;
                }

                timeBlocks.sort((a, b) => {
                    const aStart = parseTimeToMinutes(a.start) || 0;
                    const bStart = parseTimeToMinutes(b.start) || 0;
                    return aStart - bStart;
                });
                saveTimeBlocks();
                persistAppData();
                renderTaskViews();
                renderTimeline();
                try { populateProgressDashboard(); } catch (e) { /* non-critical */ }
                showToast(`Calendar synced: ${createdCount} added, ${updatedCount} updated, ${removedCount} removed`);
            } catch (err) {
                console.error('ICS import failed', err);
                showToast('Calendar import failed');
            } finally {
                if (input) input.value = '';
            }
        }

        const IMPORT_ACCEPT = [
            '.json', '.txt', '.md', '.markdown', '.html', '.htm', '.csv', '.tsv', '.rtf',
            '.pdf', '.docx', '.doc', '.odt', '.xlsx', '.xls', '.pptx', '.epub',
            '.xml', '.yaml', '.yml', '.log'
        ].join(',');

        const EXTERNAL_SCRIPT_CACHE = {};
        let importDropBindingsReady = false;

        function openImportDropModal() {
            const modal = document.getElementById('importDropModal');
            if (!modal) return;
            modal.classList.add('active');
            try { document.body.classList.add('modal-open'); } catch (e) { /* non-critical */ }
        }

        function closeImportDropModal() {
            const modal = document.getElementById('importDropModal');
            if (!modal) return;
            modal.classList.remove('active');
            const dropZone = document.getElementById('importDropZone');
            if (dropZone) dropZone.classList.remove('drag-over');
            try { document.body.classList.remove('modal-open'); } catch (e) { /* non-critical */ }
        }

        function triggerImportFilePicker() {
            const input = document.getElementById('fileInput');
            if (!input) return;
            input.accept = IMPORT_ACCEPT;
            input.click();
        }

        function bindImportDropModal() {
            if (importDropBindingsReady) return;
            importDropBindingsReady = true;

            const modal = document.getElementById('importDropModal');
            const dropZone = document.getElementById('importDropZone');
            const browseBtn = document.getElementById('importDropBrowseBtn');
            const closeBtn = document.getElementById('importDropCloseBtn');
            if (!modal || !dropZone) return;

            if (browseBtn) browseBtn.addEventListener('click', triggerImportFilePicker);
            if (closeBtn) closeBtn.addEventListener('click', closeImportDropModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeImportDropModal();
            });

            const preventDefaults = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, preventDefaults);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'));
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'));
            });

            dropZone.addEventListener('click', triggerImportFilePicker);

            dropZone.addEventListener('drop', async (e) => {
                const files = e.dataTransfer && e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
                if (!files.length) return;
                closeImportDropModal();
                if (files.length > 1) {
                    showToast('Imported first file only');
                }
                await handleImportedFile(files[0]);
            });

            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (!modal.classList.contains('active')) return;
                closeImportDropModal();
            });
        }

        function importFromFile() {
            bindImportDropModal();
            openImportDropModal();
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

        function createImportedPage(title, contentHtml, icon = PAGE_ICONS.IMPORT) {
            ensureHierarchyParentsForTitle(title);
            const page = {
                id: generateId(),
                title,
                content: contentHtml,
                icon: normalizePageIcon(icon),
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
                    icon: PAGE_ICONS.FOLDER,
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
            const workspace = data && data.workspace && typeof data.workspace === 'object' ? data.workspace : null;
            const defaults = getDefaultAppData();
            const importedPages = data.pages || (workspace && workspace.pages) || [];
            const importedTasks = data.tasks || (workspace && workspace.tasks) || null;
            const importedTaskOrder = data.taskOrder || (workspace && workspace.taskOrder) || null;
            const importedStreaks = data.streaks || (workspace && workspace.streaks) || null;
            const importedHabitTracker = data.habitTracker || (workspace && workspace.habitTracker) || null;
            const importedCollegeTracker = data.collegeTracker || (workspace && workspace.collegeTracker) || null;
            const importedAcademicWorkspace = data.academicWorkspace || (workspace && workspace.academicWorkspace) || null;
            const importedCollegeAppWorkspace = data.collegeAppWorkspace || (workspace && workspace.collegeAppWorkspace) || null;
            const importedLifeWorkspace = data.lifeWorkspace || (workspace && workspace.lifeWorkspace) || null;
            const importedSettings = data.settings || (workspace && workspace.settings) || null;
            const importedUi = data.ui || (workspace && workspace.ui) || null;
            const importedTimeBlocks = data.timeBlocks || (workspace && workspace.timeBlocks) || null;

            pages = normalizePagesCollection(importedPages);

            const taskSource = Array.isArray(importedTasks) ? importedTasks : defaults.tasks;
            tasks = taskSource.reduce((acc, rawTask) => {
                if (!rawTask || typeof rawTask !== 'object') return acc;
                const task = rawTask;
                acc.push({
                    ...task,
                    id: String(task.id || generateId()),
                    title: String(task.title || 'Untitled Task'),
                    notes: String(task.notes || ''),
                    priority: normalizePriorityValue(task.priority),
                    difficulty: normalizeDifficultyValue(task.difficulty)
                });
                return acc;
            }, []);

            const taskIds = new Set(tasks.map(task => String(task.id || '')));
            taskOrder = [];
            if (Array.isArray(importedTaskOrder)) {
                importedTaskOrder.forEach(rawId => {
                    const id = String(rawId || '').trim();
                    if (!id || !taskIds.has(id) || taskOrder.includes(id)) return;
                    taskOrder.push(id);
                });
            }
            tasks.forEach(task => {
                const id = String(task.id || '').trim();
                if (id && !taskOrder.includes(id)) taskOrder.push(id);
            });

            const streakSource = importedStreaks && typeof importedStreaks === 'object' ? importedStreaks : defaults.streaks;
            dayStates = streakSource.dayStates && typeof streakSource.dayStates === 'object' ? streakSource.dayStates : {};
            taskStreaks = streakSource.taskStreaks && typeof streakSource.taskStreaks === 'object' ? streakSource.taskStreaks : {};
            streakState = {
                ...getDefaultStreaks().streakState,
                ...(streakSource.streakState && typeof streakSource.streakState === 'object' ? streakSource.streakState : {})
            };

            const habitSource = importedHabitTracker && typeof importedHabitTracker === 'object'
                ? importedHabitTracker
                : defaults.habitTracker;
            habits = Array.isArray(habitSource.habits) ? habitSource.habits : [];
            habitDayStates = habitSource.dayStates && typeof habitSource.dayStates === 'object' ? habitSource.dayStates : {};

            collegeTracker = normalizeCollegeTracker(importedCollegeTracker);
            academicWorkspace = normalizeAcademicWorkspace(importedAcademicWorkspace);
            collegeAppWorkspace = normalizeCollegeAppWorkspace(importedCollegeAppWorkspace);
            lifeWorkspace = normalizeLifeWorkspace(importedLifeWorkspace);

            const importedSettingsSource = importedSettings && typeof importedSettings === 'object' ? importedSettings : {};
            const settingsDefaults = defaults.settings;
            appSettings = { ...settingsDefaults, ...importedSettingsSource };
            appSettings.font = { ...settingsDefaults.font, ...(importedSettingsSource.font || {}) };
            appSettings.drive = { ...settingsDefaults.drive, ...(importedSettingsSource.drive || {}) };
            appSettings.googleCalendar = normalizeGoogleCalendarSettings({
                ...settingsDefaults.googleCalendar,
                ...(importedSettingsSource.googleCalendar || {})
            });
            appSettings.focusTimer = { ...settingsDefaults.focusTimer, ...(importedSettingsSource.focusTimer || {}) };
            appSettings.enabledViews = normalizeEnabledViews(importedSettingsSource.enabledViews || appSettings.enabledViews);
            if (!Object.prototype.hasOwnProperty.call(importedSettingsSource, 'featureSelectionCompleted')) {
                appSettings.featureSelectionCompleted = true;
            }

            if (data.globalTheme && !importedSettings) {
                globalTheme = data.globalTheme;
            }
            const uiDefaults = defaults.ui;
            const importedUiSource = importedUi && typeof importedUi === 'object' ? importedUi : {};
            appData.ui = { ...uiDefaults, ...importedUiSource };

            timeBlocks = Array.isArray(importedTimeBlocks) ? importedTimeBlocks : [];
            saveTimeBlocks();

            savePagesToLocal();
            loadThemeSettings();
            renderPagesList();
            if (pages.length > 0) loadPage(pages[0].id);
            renderTaskViews();
            renderCollegeTracker();
            renderAcademicWorkspace();
            renderCollegeAppWorkspace();
            renderLifeWorkspace();
            applyFeatureTabVisibility();
            syncSettingsControls();
            setActiveView(getFallbackView(appData.ui.lastActiveView || activeView));
            if (isFeatureSetupPending()) {
                showFeatureSetupOverlay();
            } else {
                hideFeatureSetupOverlay();
            }
            persistAppData();
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
            let icon = PAGE_ICONS.IMPORT;

            if (['txt', 'log', 'yaml', 'yml', 'xml'].includes(ext)) {
                const text = await readFileAsText(file);
                contentHtml = normalizeTextToHtml(text);
            } else if (['md', 'markdown'].includes(ext)) {
                const text = await readFileAsText(file);
                contentHtml = renderMarkdown(text);
                icon = PAGE_ICONS.NOTE;
            } else if (['html', 'htm'].includes(ext)) {
                contentHtml = await readFileAsText(file);
                icon = PAGE_ICONS.GLOBE;
            } else if (ext === 'csv') {
                const text = await readFileAsText(file);
                contentHtml = parseDelimitedTextToTableHtml(text, ',');
                icon = PAGE_ICONS.CHART;
            } else if (ext === 'tsv') {
                const text = await readFileAsText(file);
                contentHtml = parseDelimitedTextToTableHtml(text, '\t');
                icon = PAGE_ICONS.CHART;
            } else if (ext === 'rtf') {
                const text = await readFileAsText(file);
                contentHtml = normalizeTextToHtml(parseRtfToText(text));
                icon = PAGE_ICONS.DOC;
            } else if (ext === 'pdf') {
                contentHtml = await importPdfFile(file);
                icon = PAGE_ICONS.PDF;
            } else if (ext === 'docx') {
                contentHtml = await importDocxFile(file);
                icon = PAGE_ICONS.DOC;
            } else if (['xlsx', 'xls'].includes(ext)) {
                contentHtml = await importSpreadsheetFile(file);
                icon = PAGE_ICONS.GRAPH;
            } else if (ext === 'pptx') {
                contentHtml = await importZipXmlBasedFile(file, 'pptx');
                icon = PAGE_ICONS.VIDEO;
            } else if (ext === 'odt') {
                contentHtml = await importZipXmlBasedFile(file, 'odt');
                icon = PAGE_ICONS.BOOK_RED;
            } else if (ext === 'epub') {
                contentHtml = await importZipXmlBasedFile(file, 'epub');
                icon = PAGE_ICONS.BOOKS;
            } else if (ext === 'json') {
                const text = await readFileAsText(file);
                try {
                    const parsed = JSON.parse(text);
                    contentHtml = `<pre><code>${escapeHtml(JSON.stringify(parsed, null, 2))}</code></pre>`;
                } catch (err) {
                    contentHtml = `<pre><code>${escapeHtml(text)}</code></pre>`;
                }
                icon = PAGE_ICONS.SCROLL;
            } else if (ext === 'doc') {
                icon = PAGE_ICONS.DOC;
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

        async function handleImportedFile(file) {
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
            }
        }

        const importInput = document.getElementById('fileInput');
        if (importInput) {
            importInput.addEventListener('change', async function(e) {
                const file = e.target.files && e.target.files[0];
                closeImportDropModal();
                await handleImportedFile(file);
                e.target.value = '';
            });
        }

        // Google Drive + Calendar Functions
        let googleApiInitPromise = null;

        function getGoogleCalendarSettings() {
            if (!appSettings) appSettings = getDefaultAppData().settings;
            appSettings.googleCalendar = normalizeGoogleCalendarSettings(appSettings.googleCalendar);
            return appSettings.googleCalendar;
        }

        function updateGoogleCalendarSyncStatusLabel(overrideText = '') {
            const statusEl = document.getElementById('googleCalendarSyncStatus');
            if (!statusEl) return;
            if (overrideText) {
                statusEl.textContent = String(overrideText);
                return;
            }
            const settings = getGoogleCalendarSettings();
            if (!settings.enabled) {
                statusEl.textContent = 'Not linked. Add Google credentials in Drive Settings, then link your calendar.';
                return;
            }
            if (!settings.lastSyncedAt) {
                statusEl.textContent = `Linked to "${settings.calendarId || 'primary'}". Not synced yet.`;
                return;
            }
            const stamp = new Date(settings.lastSyncedAt);
            const safeStamp = isNaN(stamp) ? settings.lastSyncedAt : stamp.toLocaleString();
            const mode = settings.autoSync ? `Auto-sync every ${settings.syncIntervalMinutes} min` : 'Manual sync only';
            statusEl.textContent = `Linked to "${settings.calendarId || 'primary'}". Last sync: ${safeStamp}. ${mode}.`;
        }

        function saveGoogleCalendarControlSettings() {
            const current = getGoogleCalendarSettings();
            const calendarIdInput = document.getElementById('googleCalendarIdInput');
            const intervalSelect = document.getElementById('googleCalendarIntervalSelect');
            const autoToggle = document.getElementById('googleCalendarAutoSyncToggle');
            const next = normalizeGoogleCalendarSettings({
                ...current,
                calendarId: calendarIdInput ? calendarIdInput.value : current.calendarId,
                syncIntervalMinutes: intervalSelect ? intervalSelect.value : current.syncIntervalMinutes,
                autoSync: autoToggle ? !!autoToggle.checked : current.autoSync
            });
            appSettings.googleCalendar = next;
            persistAppData();
            if (next.enabled) scheduleGoogleCalendarAutoSync();
            updateGoogleCalendarSyncStatusLabel();
            return next;
        }

        function clearGoogleCalendarSyncTimer() {
            if (!googleCalendarSyncTimer) return;
            clearInterval(googleCalendarSyncTimer);
            googleCalendarSyncTimer = null;
        }

        function scheduleGoogleCalendarAutoSync() {
            clearGoogleCalendarSyncTimer();
            const settings = getGoogleCalendarSettings();
            if (!settings.enabled || settings.autoSync === false) return;
            const intervalMinutes = Math.max(1, Math.min(60, Number(settings.syncIntervalMinutes || 5)));
            googleCalendarSyncTimer = setInterval(() => {
                syncGoogleCalendarNow(false);
            }, intervalMinutes * 60 * 1000);
        }

        function updateSigninStatus(isSignedIn) {
            isGoogleSignedIn = !!isSignedIn;
            updateGoogleCalendarSyncStatusLabel();
        }

        function initGoogleDrive() {
            if (appSettings && appSettings.drive) {
                CLIENT_ID = appSettings.drive.clientId || '';
                API_KEY = appSettings.drive.apiKey || '';
            }
            if (CLIENT_ID && API_KEY) {
                loadGapi().then(() => {
                    const calendarSettings = getGoogleCalendarSettings();
                    if (calendarSettings.enabled) {
                        scheduleGoogleCalendarAutoSync();
                        syncGoogleCalendarNow(false);
                    } else {
                        updateGoogleCalendarSyncStatusLabel();
                    }
                }).catch((error) => {
                    console.error('Google API init failed', error);
                    updateGoogleCalendarSyncStatusLabel('Google API unavailable. Check credentials and network.');
                });
            } else {
                updateGoogleCalendarSyncStatusLabel();
            }
        }

        function loadGapi() {
            if (!CLIENT_ID || !API_KEY) {
                return Promise.reject(new Error('Google credentials are missing.'));
            }
            if (typeof gapi === 'undefined') {
                return Promise.reject(new Error('Google API script is not loaded.'));
            }
            if (googleApiInitPromise) return googleApiInitPromise;

            googleApiInitPromise = new Promise((resolve, reject) => {
                try {
                    gapi.load('client:auth2', () => {
                        gapi.client.init({
                            apiKey: API_KEY,
                            clientId: CLIENT_ID,
                            discoveryDocs: DISCOVERY_DOCS,
                            scope: SCOPES
                        }).then(() => {
                            const authInstance = gapi.auth2.getAuthInstance();
                            if (authInstance) {
                                authInstance.isSignedIn.listen(updateSigninStatus);
                                updateSigninStatus(authInstance.isSignedIn.get());
                            }
                            resolve();
                        }).catch((error) => {
                            googleApiInitPromise = null;
                            reject(error);
                        });
                    });
                } catch (error) {
                    googleApiInitPromise = null;
                    reject(error);
                }
            });

            return googleApiInitPromise;
        }

        async function ensureGoogleSignedInForScope(requiredScope) {
            await loadGapi();
            if (!gapi.auth2 || !gapi.auth2.getAuthInstance) {
                throw new Error('Google authentication client is unavailable.');
            }
            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance.isSignedIn.get()) {
                await authInstance.signIn({ scope: SCOPES, prompt: 'consent select_account' });
            }
            const user = authInstance.currentUser.get();
            if (requiredScope && user && typeof user.hasGrantedScopes === 'function' && !user.hasGrantedScopes(requiredScope)) {
                await user.grant({ scope: requiredScope });
            }
            updateSigninStatus(authInstance.isSignedIn.get());
            return user;
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

        async function saveToGoogleDrive() {
            if (!CLIENT_ID || !API_KEY) {
                document.getElementById('driveSettingsModal').classList.add('active');
                if (appSettings && appSettings.drive) {
                    document.getElementById('driveClientId').value = appSettings.drive.clientId || '';
                    document.getElementById('driveApiKey').value = appSettings.drive.apiKey || '';
                }
                return;
            }

            try {
                await ensureGoogleSignedInForScope(DRIVE_SCOPE);
                await uploadToDrive();
            } catch (error) {
                console.error('Drive sync failed', error);
                showToast(`Error saving to Drive: ${error.message || 'Unknown error'}`);
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
                googleApiInitPromise = null;
                
                closeModal('driveSettingsModal');
                loadGapi().then(() => {
                    showToast('Google settings saved and connected.');
                    const calendarSettings = getGoogleCalendarSettings();
                    if (calendarSettings.enabled) {
                        scheduleGoogleCalendarAutoSync();
                        syncGoogleCalendarNow(false);
                    }
                    updateGoogleCalendarSyncStatusLabel();
                }).catch((error) => {
                    console.error('Google init failed after saving settings', error);
                    showToast('Settings saved, but Google connection failed. Check credentials.');
                });
            } else {
                showToast('Please enter both Client ID and API Key');
            }
        }

        async function uploadToDrive() {
            savePage();
            const fileContent = JSON.stringify({
                version: APP_SCHEMA_VERSION,
                exportedAt: new Date().toISOString(),
                pages,
                tasks,
                taskOrder,
                streaks: { dayStates, taskStreaks, streakState },
                collegeTracker,
                academicWorkspace,
                collegeAppWorkspace,
                lifeWorkspace,
                settings: appSettings,
                ui: appData ? appData.ui : {}
            });
            const file = new Blob([fileContent], {type: 'application/json'});
            
            const metadata = {
                name: `noteflow_backup_${new Date().toISOString().split('T')[0]}.json`,
                mimeType: 'application/json'
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', file);
            
            const token = gapi && gapi.auth && gapi.auth.getToken ? gapi.auth.getToken() : null;
            const accessToken = token && token.access_token ? token.access_token : '';
            if (!accessToken) {
                throw new Error('Missing Google access token.');
            }

            const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
                body: form
            });
            const payload = await res.json();
            if (!res.ok || payload.error) {
                const msg = payload && payload.error && payload.error.message ? payload.error.message : `HTTP ${res.status}`;
                throw new Error(msg);
            }
            showToast('Saved to Google Drive!');
        }

        function clearGoogleCalendarImportedBlocks(calendarId = '', shouldRender = true) {
            const allBlocks = Array.isArray(timeBlocks) ? timeBlocks : [];
            const targetCalendarId = String(calendarId || '').trim();
            const nextBlocks = allBlocks.filter(block => {
                if (!block || block.source !== 'calendar_google') return true;
                if (!targetCalendarId) return false;
                return String(block.googleCalendarId || '') !== targetCalendarId;
            });
            const removedCount = allBlocks.length - nextBlocks.length;
            if (removedCount <= 0) return 0;
            timeBlocks = nextBlocks;
            saveTimeBlocks();
            if (shouldRender) renderTimeline();
            return removedCount;
        }

        function formatGoogleCalendarTime(dateObj) {
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        function buildGoogleCalendarBlockFromEvent(event, calendarId) {
            if (!event || event.status === 'cancelled') return null;
            const startInfo = event.start || {};
            const endInfo = event.end || {};
            const hasDateTime = !!startInfo.dateTime;
            const startDate = hasDateTime
                ? new Date(startInfo.dateTime)
                : (startInfo.date ? parseDate(startInfo.date) : null);
            if (!startDate || isNaN(startDate)) return null;
            const endDate = hasDateTime
                ? new Date(endInfo.dateTime || startInfo.dateTime)
                : (endInfo.date ? parseDate(endInfo.date) : null);

            const start = hasDateTime ? formatGoogleCalendarTime(startDate) : '09:00';
            let end = hasDateTime && endDate && !isNaN(endDate)
                ? formatGoogleCalendarTime(endDate)
                : '10:00';
            if (end <= start) {
                const startMinutes = parseTimeToMinutes(start);
                end = minutesToTimeString(Math.min(startMinutes + 60, (23 * 60) + 59));
            }

            const sourceKey = [
                String(event.id || ''),
                String(startInfo.dateTime || startInfo.date || ''),
                String(calendarId || 'primary')
            ].join('|');
            const sourceUid = `google_${simpleHash(sourceKey)}`;

            return {
                id: sourceUid,
                name: String(event.summary || 'Untitled event'),
                start,
                end,
                category: 'default',
                color: '#4285F4',
                recurrence: 'none',
                preserveRecurrence: false,
                date: dateKey(startDate),
                referenceUrl: normalizeExternalUrl(event.htmlLink || ''),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                source: 'calendar_google',
                sourceUid,
                googleCalendarId: String(calendarId || 'primary'),
                googleEventId: String(event.id || ''),
                sourceReadOnly: true
            };
        }

        function onGoogleCalendarAutoSyncToggle() {
            const settings = saveGoogleCalendarControlSettings();
            if (settings.enabled) {
                scheduleGoogleCalendarAutoSync();
            }
        }

        async function connectGoogleCalendar() {
            const settings = saveGoogleCalendarControlSettings();
            appSettings.googleCalendar = normalizeGoogleCalendarSettings({ ...settings, enabled: true });
            persistAppData();
            updateGoogleCalendarSyncStatusLabel();
            await syncGoogleCalendarNow(true);
        }

        function disconnectGoogleCalendar() {
            const settings = getGoogleCalendarSettings();
            settings.enabled = false;
            settings.lastSyncedAt = null;
            appSettings.googleCalendar = settings;
            persistAppData();
            clearGoogleCalendarSyncTimer();
            updateGoogleCalendarSyncStatusLabel('Google Calendar unlinked. Existing imported events remain until cleared.');
            showToast('Google Calendar unlinked');
        }

        async function syncGoogleCalendarNow(showUserFeedback = false) {
            const settings = saveGoogleCalendarControlSettings();
            if (!settings.enabled) {
                if (showUserFeedback) {
                    showToast('Link Google Calendar first.');
                }
                updateGoogleCalendarSyncStatusLabel();
                return;
            }
            if (!CLIENT_ID || !API_KEY) {
                showToast('Set Google Client ID + API Key in Drive Settings first.');
                openDriveSettings();
                return;
            }
            if (googleCalendarSyncInFlight) {
                if (showUserFeedback) showToast('Calendar sync already in progress.');
                return;
            }

            googleCalendarSyncInFlight = true;
            updateGoogleCalendarSyncStatusLabel('Syncing Google Calendar...');
            try {
                await ensureGoogleSignedInForScope(CALENDAR_SCOPE);
                if (!gapi.client || !gapi.client.calendar || !gapi.client.calendar.events) {
                    throw new Error('Calendar API client is unavailable.');
                }

                const calendarId = String(settings.calendarId || 'primary').trim() || 'primary';
                const now = new Date();
                const end = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
                const response = await gapi.client.calendar.events.list({
                    calendarId,
                    timeMin: now.toISOString(),
                    timeMax: end.toISOString(),
                    showDeleted: false,
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: 2500
                });
                const items = response && response.result && Array.isArray(response.result.items)
                    ? response.result.items
                    : [];
                const importedBlocks = items
                    .map(evt => buildGoogleCalendarBlockFromEvent(evt, calendarId))
                    .filter(Boolean);

                clearGoogleCalendarImportedBlocks(calendarId, false);
                timeBlocks = (Array.isArray(timeBlocks) ? timeBlocks : []).concat(importedBlocks);
                timeBlocks.sort((a, b) => {
                    const dayA = normalizeBlockDate(a && a.date) || '';
                    const dayB = normalizeBlockDate(b && b.date) || '';
                    if (dayA !== dayB) return dayA.localeCompare(dayB);
                    return parseTimeToMinutes(a && a.start) - parseTimeToMinutes(b && b.start);
                });
                saveTimeBlocks();

                appSettings.googleCalendar = normalizeGoogleCalendarSettings({
                    ...settings,
                    enabled: true,
                    calendarId,
                    lastSyncedAt: new Date().toISOString()
                });
                persistAppData();
                renderTimeline();
                scheduleGoogleCalendarAutoSync();
                updateGoogleCalendarSyncStatusLabel();
                if (showUserFeedback) {
                    showToast(`Google Calendar synced (${importedBlocks.length} events).`);
                }
            } catch (error) {
                console.error('Google Calendar sync failed', error);
                updateGoogleCalendarSyncStatusLabel(`Sync failed: ${error.message || 'Unknown error'}`);
                if (showUserFeedback) {
                    showToast(`Google Calendar sync failed: ${error.message || 'Unknown error'}`);
                }
            } finally {
                googleCalendarSyncInFlight = false;
            }
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
            'Common': ['??', '??', '??', '??', '??', '???', '???', '???', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '??', '??', '?', '??', '??', '?', '??', '??', '??', '?', '??', '??', '???', '??', '???', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??'],
            'Objects': ['??', '??', '???', '??', '??', '??', '??', '???', '???', '??', '??', '??', '???', '??', '??', '??', '??', '???', '??', '???', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '???', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
            'Hearts': ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?????', '?????', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
            'Nature': ['??', '?', '??', '??', '??', '??', '??', '???', '?', '??', '???', '???', '???', '??', '???', '?', '???', '??', '??', '?', '???', '??', '???', '??', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???'],
            'Food': ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '??', '??', '??', '??', '??'],
            'Activities': ['?', '??', '??', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
            'Travel': ['??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '??', '??', '???', '??', '?', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '?', '??', '??', '??', '??', '??', '??', '???', '??', '???', '???', '???', '???'],
            'Symbols': ['?', '??', '?', '??', '??', '??', '??', '??', '??', '??', '???', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '?', '??', '??', '?', '?', '??', '??', '??', '??', '??', '??', '?', '?', '??', '?', '??', '?', '??', '?', '?', '?', '??', '??', '??', '??'],
            'Celebration': ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
            'People': ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
            'Hands': ['??', '??', '??', '?', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '?', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
            'Animals': ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '???', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??']
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
                if (winW <= COMPACT_LAYOUT_MAX_WIDTH) {
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
            const searchInput = document.getElementById('emojiSearch');
            if (searchInput) searchInput.value = '';
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
                const q = emojiSearchQuery.trim().toLowerCase();

                // Curated keyword aliases for common icon intent.
                const searchTerms = {
                    heart: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
                    star: ['?', '??', '?', '??'],
                    fire: ['??'],
                    check: ['?', '??', '??'],
                    warning: ['??', '??', '?'],
                    book: ['??', '??', '??', '??', '??', '??'],
                    folder: ['??', '??', '???', '???', '???'],
                    work: ['??', '??', '??', '??', '??'],
                    home: ['??', '??', '??'],
                    idea: ['??', '??', '??'],
                    time: ['?', '?', '??', '??', '???'],
                    music: ['??', '??', '??', '??', '??', '??', '??'],
                    game: ['??', '???', '??', '??'],
                    photo: ['??', '??', '??', '??'],
                    tech: ['??', '???', '??', '???', '??'],
                    food: ['??', '??', '??', '??', '??', '?', '??', '??'],
                    fruit: ['??', '??', '??', '??', '??', '??'],
                    sport: ['?', '??', '??', '?', '??', '??', '??'],
                    travel: ['??', '??', '??', '??', '??', '??', '???'],
                    money: ['??', '??', '??', '??', '??'],
                    party: ['??', '??', '??', '??', '??', '??'],
                    smile: ['??', '??', '??', '??', '??'],
                    sad: ['??', '??', '??', '??'],
                    hand: ['??', '??', '??', '??', '??', '??', '??'],
                    dog: ['??', '??', '??'],
                    cat: ['??', '??'],
                    animal: ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??'],
                    plant: ['??', '??', '??', '??', '??', '??', '??', '??', '??'],
                    weather: ['??', '???', '?', '???', '??', '??', '?', '??'],
                    rocket: ['??', '??'],
                    car: ['??', '??', '???'],
                    train: ['??', '??', '??'],
                    lock: ['??', '??', '??'],
                    tool: ['??', '??', '??', '??']
                };

                // If query matches a category name, include that full category.
                const matchedByCategory = Object.entries(emojiCategories)
                    .filter(([category]) => category.toLowerCase().includes(q))
                    .flatMap(([, list]) => list);

                // Match curated aliases.
                const matchedByAlias = Object.entries(searchTerms)
                    .filter(([term]) => term.includes(q) || q.includes(term))
                    .flatMap(([, list]) => list);

                // Allow searching by directly typing/pasting an emoji glyph.
                const matchedByGlyph = emojis.filter(emoji => emoji.includes(q));

                const candidateSet = new Set([...matchedByCategory, ...matchedByAlias, ...matchedByGlyph]);
                emojis = emojis.filter(emoji => candidateSet.has(emoji));
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
            const inputUrl = prompt('Enter URL:');
            if (!inputUrl) return;
            const safeUrl = normalizeExternalUrl(inputUrl);
            if (!safeUrl) {
                showToast('Please enter a valid http(s) URL.');
                return;
            }
            document.execCommand('createLink', false, safeUrl);
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const node = selection.anchorNode;
                const element = node.nodeType === 3 ? node.parentElement : node;
                const link = element.closest('a');
                if (link) showLinkTooltip(link);
            }
            document.getElementById('editor').focus();
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
            const safeUrl = normalizeExternalUrl(url);
            if (!safeUrl) {
                return '';
            }
            let embedUrl = '';
            
            // YouTube
            const youtubeMatch = safeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (youtubeMatch) {
                embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                return `
                    <div style="border-radius: 8px; overflow: hidden; position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${escapeHtml(embedUrl)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                    </div>
                `;
            }
            
            // Vimeo
            const vimeoMatch = safeUrl.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
                embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                return `
                    <div style="border-radius: 8px; overflow: hidden; position: relative; padding-bottom: 56.25%; height: 0;">
                        <iframe src="${escapeHtml(embedUrl)}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                    </div>
                `;
            }
            
            // Direct video URL
            return `
                <div style="border-radius: 8px; overflow: hidden;">
                    <video controls style="width: 100%; max-width: 720px; display: block;">
                        <source src="${escapeHtml(safeUrl)}">
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
            const safeUrl = normalizeExternalUrl(url);
            if (!safeUrl) return '';
            // Spotify track/album/playlist
            const spotifyMatch = safeUrl.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
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
            if (safeUrl.includes('soundcloud.com')) {
                return `
                    <div style="border-radius: 8px; overflow: hidden;">
                        <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(safeUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
                    </div>
                `;
            }
            
            // Direct audio URL
            return `
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                    <audio controls style="width: 100%;">
                        <source src="${escapeHtml(safeUrl)}">
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
            if (!embedHtml) {
                showToast('Please enter a valid http(s) URL.');
                return;
            }
            insertHtmlAtCursor(createMediaWrapper(embedHtml, 'embed'));
            showToast('Content embedded!');
        }
        
        function getWebEmbedHtml(url) {
            const safeUrl = normalizeExternalUrl(url);
            if (!safeUrl) return '';
            let parsed;
            try {
                parsed = new URL(safeUrl);
            } catch (error) {
                return '';
            }
            if (!/^https?:$/i.test(parsed.protocol)) return '';
            const host = parsed.hostname.toLowerCase();

            // Google Docs/Sheets/Slides
            if (host === 'docs.google.com') {
                const embedUrl = safeUrl.replace('/edit', '/preview').replace('/view', '/preview');
                return `
                    <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                        <iframe src="${escapeHtml(embedUrl)}" style="width: 100%; height: 500px; border: none;"></iframe>
                    </div>
                `;
            }
            
            // Figma
            if (host.endsWith('figma.com')) {
                const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(safeUrl)}`;
                return `
                    <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                        <iframe src="${escapeHtml(embedUrl)}" style="width: 100%; height: 450px; border: none;" allowfullscreen></iframe>
                    </div>
                `;
            }
            
            // CodePen
            const codepenMatch = safeUrl.match(/codepen\.io\/([^\/]+)\/pen\/([^\/\?]+)/);
            if (codepenMatch) {
                return `
                    <div style="border-radius: 8px; overflow: hidden;">
                        <iframe height="400" style="width: 100%;" scrolling="no" src="https://codepen.io/${codepenMatch[1]}/embed/${codepenMatch[2]}?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>
                    </div>
                `;
            }
            
            // Twitter/X and Gist fall back to safe outbound links to avoid runtime script injection.
            if (host === 'twitter.com' || host === 'x.com' || host === 'gist.github.com') {
                return `
                    <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                        <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Open external content</a>
                    </div>
                `;
            }
            
            // Generic iframe embed
            return `
                <div style="border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
                    <iframe src="${escapeHtml(safeUrl)}" style="width: 100%; height: 400px; border: none;" sandbox="allow-scripts allow-same-origin allow-popups" referrerpolicy="no-referrer"></iframe>
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
            
            if (isCompactViewport() && overlay) {
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
            syncSidebarVisibilityState();
            if (typeof syncToolbarLayoutWithSidebar === 'function') syncToolbarLayoutWithSidebar();
            if (typeof positionToolbarTimeControls === 'function') positionToolbarTimeControls();
            if (typeof adjustChatbotPosition === 'function') adjustChatbotPosition();
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            if (modalId === 'newPageModal') {
                const nameInput = document.getElementById('newPageName');
                const templateSelect = document.getElementById('newPageTemplate');
                const createTasksToggle = document.getElementById('newPageCreateTasks');
                if (nameInput) {
                    nameInput.value = '';
                    nameInput.placeholder = 'Enter page name (use :: for hierarchy)...';
                }
                if (templateSelect) {
                    templateSelect.value = 'blank';
                }
                if (createTasksToggle) {
                    createTasksToggle.checked = false;
                    createTasksToggle.disabled = true;
                    delete createTasksToggle.dataset.userToggled;
                }
                updateTemplatePreview('blank');
            }
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
            const renderedPageIds = new Set(Array.from(pageItems).map(item => item.dataset.pageId));
            
            if (query === '') {
                // If search temporarily expanded branches, rebuild once to restore
                // the user's normal collapsed tree state.
                if (searchForceExpanded) {
                    searchForceExpanded = false;
                    renderPagesList();
                    return;
                }
                // Show all pages when search is empty
                pageItems.forEach(item => {
                    item.style.display = 'flex';
                    item.style.background = '';
                });
                return;
            }

            // If matching nested pages are currently hidden by collapsed branches,
            // rebuild the sidebar tree in search-expanded mode so every page is indexed.
            const hasMissingRenderedMatch = pages.some(page => {
                const title = String(page.title || '').toLowerCase();
                const contentText = page.content ? String(page.content).replace(/<[^>]*>/g, '').toLowerCase() : '';
                return (title.includes(query) || contentText.includes(query)) && !renderedPageIds.has(page.id);
            });
            if (hasMissingRenderedMatch) {
                renderPagesList();
                return;
            }
            
            pageItems.forEach(item => {
                const pageId = item.dataset.pageId;
                const page = pages.find(p => p.id === pageId);
                if (!page) {
                    item.style.display = 'none';
                    item.style.background = '';
                    return;
                }
                
                const title = page.title.toLowerCase();
                // Strip HTML tags for content search
                const contentText = page.content ? page.content.replace(/<[^>]*>/g, '').toLowerCase() : '';
                
                if (title.includes(query) || contentText.includes(query)) {
                    item.style.display = 'flex';
                    item.style.background = '';
                } else {
                    item.style.display = 'none';
                    item.style.background = '';
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

        function updateSaveStatus(status, savedText = 'Saved') {
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
                const safeSavedText = String(savedText || 'Saved');
                if (el) el.innerHTML = `<i class="fas fa-check-circle"></i> ${safeSavedText}`;
                if (taskbarEl) {
                    taskbarEl.innerHTML = `<i class="fas fa-check-circle"></i><span>${safeSavedText}</span>`;
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
                const nextUrlInput = prompt('Edit URL:', currentLinkElement.href);
                if (!nextUrlInput) return;
                const safeUrl = normalizeExternalUrl(nextUrlInput);
                if (!safeUrl) {
                    showToast('Please enter a valid http(s) URL.');
                    return;
                }
                currentLinkElement.href = safeUrl;
                document.getElementById('linkTooltipUrl').href = safeUrl;
                document.getElementById('linkTooltipUrl').textContent = safeUrl;
                savePage(); // Save changes
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
            initTimeline();
            renderTaskViews();
            try { populateProgressDashboard(); } catch (e) { console.warn('populateProgressDashboard failed after init', e); }
            maybeStartInteractiveTutorial();
        });

        window.addEventListener('beforeunload', savePage);

        document.addEventListener('click', (e) => {
            const themePanel = document.getElementById('themePanel');
            const themeSwitcher = document.querySelector('.theme-switcher-btn');
            if (themePanel && themeSwitcher && themePanel.classList.contains('active') && !themePanel.contains(e.target) && !themeSwitcher.contains(e.target)) {
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
                    <strong>Note:</strong> Type your callout text here...
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
                try {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                makeMediaResizable(node);
                            }
                        });
                    });
                } finally {
                    // Discard mutations caused by wrapping/handles we just inserted
                    observer.takeRecords();
                }
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
    const chatProviderSelect = document.getElementById('chatProviderSelect');
    const chatModelSelect = document.getElementById('chatModelSelect');
    const chatCustomModelInput = document.getElementById('chatCustomModelInput');
    const refreshChatModelsBtn = document.getElementById('refreshChatModelsBtn');
    const saveChatKeysBtn = document.getElementById('saveChatKeysBtn');
    const chatSettingsShell = document.getElementById('chatSettingsShell');
    const chatSettingsCurrent = document.getElementById('chatSettingsCurrent');
    const groqApiKeyInput = document.getElementById('groqApiKeyInput');
    const openaiApiKeyInput = document.getElementById('openaiApiKeyInput');
    const anthropicApiKeyInput = document.getElementById('anthropicApiKeyInput');
    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const openrouterApiKeyInput = document.getElementById('openrouterApiKeyInput');
        const chatInfoBtn = document.getElementById('chatInfoBtn');
        const chatInfo = document.getElementById('chatbotInfo');
        const CHAT_PROVIDER_STORAGE_KEY = 'chat_provider';
        const CHAT_MODEL_MAP_KEY = 'chat_model_by_provider';
        const CHAT_CUSTOM_MODEL_MAP_KEY = 'chat_custom_model_by_provider';

        function readSensitiveValue(key) {
            try {
                const sessionValue = String(sessionStorage.getItem(key) || '').trim();
                if (sessionValue) return sessionValue;
            } catch (e) { /* no-op */ }

            try {
                const legacyValue = String(localStorage.getItem(key) || '').trim();
                if (legacyValue) {
                    try { sessionStorage.setItem(key, legacyValue); } catch (err) { /* no-op */ }
                    try { localStorage.removeItem(key); } catch (err) { /* no-op */ }
                    return legacyValue;
                }
            } catch (e) { /* no-op */ }

            return '';
        }

        function writeSensitiveValue(key, value) {
            const next = String(value || '').trim();
            try {
                if (next) sessionStorage.setItem(key, next);
                else sessionStorage.removeItem(key);
            } catch (e) { /* no-op */ }
            try { localStorage.removeItem(key); } catch (e) { /* no-op */ }
        }

        const CHAT_PROVIDER_CONFIG = {
            groq: {
                label: 'Groq',
                keyStorage: 'groq_api_key',
                defaultModel: 'llama-3.1-8b-instant',
                modelsEndpoint: 'https://api.groq.com/openai/v1/models',
                chatEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
                type: 'openai_compatible',
                models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b']
            },
            openai: {
                label: 'OpenAI',
                keyStorage: 'openai_api_key',
                defaultModel: 'gpt-4o-mini',
                modelsEndpoint: 'https://api.openai.com/v1/models',
                chatEndpoint: 'https://api.openai.com/v1/chat/completions',
                type: 'openai_compatible',
                models: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1']
            },
            anthropic: {
                label: 'Anthropic',
                keyStorage: 'anthropic_api_key',
                defaultModel: 'claude-3-5-haiku-latest',
                modelsEndpoint: 'https://api.anthropic.com/v1/models',
                chatEndpoint: 'https://api.anthropic.com/v1/messages',
                type: 'anthropic',
                models: ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest']
            },
            gemini: {
                label: 'Google Gemini',
                keyStorage: 'gemini_api_key',
                defaultModel: 'gemini-2.0-flash',
                modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                chatEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                type: 'gemini',
                models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro']
            },
            openrouter: {
                label: 'OpenRouter',
                keyStorage: 'openrouter_api_key',
                defaultModel: 'openai/gpt-4o-mini',
                modelsEndpoint: 'https://openrouter.ai/api/v1/models',
                chatEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
                type: 'openai_compatible',
                models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.5-flash']
            }
        };

        function readJsonLocalStorage(key, fallback = {}) {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || '');
                if (parsed && typeof parsed === 'object') return parsed;
            } catch (e) { /* no-op */ }
            return fallback;
        }

        function getCurrentChatProvider() {
            const selected = chatProviderSelect ? String(chatProviderSelect.value || '').trim() : '';
            if (selected && CHAT_PROVIDER_CONFIG[selected]) return selected;
            const stored = String(localStorage.getItem(CHAT_PROVIDER_STORAGE_KEY) || '').trim();
            if (stored && CHAT_PROVIDER_CONFIG[stored]) return stored;
            return 'groq';
        }

        function setCurrentChatProvider(provider) {
            const next = CHAT_PROVIDER_CONFIG[provider] ? provider : 'groq';
            localStorage.setItem(CHAT_PROVIDER_STORAGE_KEY, next);
            if (chatProviderSelect) chatProviderSelect.value = next;
        }

        function getProviderApiKey(provider) {
            const config = CHAT_PROVIDER_CONFIG[provider];
            if (!config) return '';
            return readSensitiveValue(config.keyStorage);
        }

        function populateKeyInputsFromStorage() {
            if (groqApiKeyInput) groqApiKeyInput.value = getProviderApiKey('groq');
            if (openaiApiKeyInput) openaiApiKeyInput.value = getProviderApiKey('openai');
            if (anthropicApiKeyInput) anthropicApiKeyInput.value = getProviderApiKey('anthropic');
            if (geminiApiKeyInput) geminiApiKeyInput.value = getProviderApiKey('gemini');
            if (openrouterApiKeyInput) openrouterApiKeyInput.value = getProviderApiKey('openrouter');
        }

        function saveAllApiKeys() {
            const keyMap = {
                groq: groqApiKeyInput ? groqApiKeyInput.value.trim() : '',
                openai: openaiApiKeyInput ? openaiApiKeyInput.value.trim() : '',
                anthropic: anthropicApiKeyInput ? anthropicApiKeyInput.value.trim() : '',
                gemini: geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '',
                openrouter: openrouterApiKeyInput ? openrouterApiKeyInput.value.trim() : ''
            };
            Object.keys(keyMap).forEach(provider => {
                const config = CHAT_PROVIDER_CONFIG[provider];
                if (!config) return;
                writeSensitiveValue(config.keyStorage, keyMap[provider]);
            });
            showToast('API keys saved for this session');
            const activeProvider = getCurrentChatProvider();
            if (chatSettingsShell && getProviderApiKey(activeProvider)) chatSettingsShell.open = false;
        }

        function getModelMap() {
            return readJsonLocalStorage(CHAT_MODEL_MAP_KEY, {});
        }

        function setModelForProvider(provider, model) {
            const map = getModelMap();
            map[provider] = String(model || '').trim();
            localStorage.setItem(CHAT_MODEL_MAP_KEY, JSON.stringify(map));
        }

        function getCustomModelMap() {
            return readJsonLocalStorage(CHAT_CUSTOM_MODEL_MAP_KEY, {});
        }

        function setCustomModelForProvider(provider, model) {
            const map = getCustomModelMap();
            const value = String(model || '').trim();
            if (value) map[provider] = value;
            else delete map[provider];
            localStorage.setItem(CHAT_CUSTOM_MODEL_MAP_KEY, JSON.stringify(map));
        }

        function getSelectedCustomModel(provider) {
            const map = getCustomModelMap();
            return String(map[provider] || '').trim();
        }

        function getCachedModels(provider) {
            const config = CHAT_PROVIDER_CONFIG[provider];
            if (!config) return [];
            const cacheKey = `chat_models_cache_${provider}`;
            let list = [];
            try {
                const parsed = JSON.parse(localStorage.getItem(cacheKey) || '[]');
                if (Array.isArray(parsed)) list = parsed;
            } catch (e) { /* no-op */ }
            const merged = [...(config.models || []), ...list]
                .map(model => String(model || '').trim())
                .filter(Boolean);
            return Array.from(new Set(merged));
        }

        function cacheModels(provider, models) {
            const unique = Array.from(new Set((Array.isArray(models) ? models : [])
                .map(model => String(model || '').trim())
                .filter(Boolean)));
            localStorage.setItem(`chat_models_cache_${provider}`, JSON.stringify(unique));
        }

        function getSelectedModelForProvider(provider) {
            const custom = getSelectedCustomModel(provider);
            if (custom) return custom;
            const map = getModelMap();
            const saved = String(map[provider] || '').trim();
            if (saved) return saved;
            return CHAT_PROVIDER_CONFIG[provider]?.defaultModel || '';
        }

        function updateChatInputPlaceholder() {
            if (!chatInput) return;
            const provider = getCurrentChatProvider();
            const label = CHAT_PROVIDER_CONFIG[provider]?.label || 'selected provider';
            chatInput.placeholder = `Ask Flow... (${label})`;
        }

        function renderModelOptions(provider) {
            if (!chatModelSelect) return;
            const models = getCachedModels(provider);
            const selected = getSelectedModelForProvider(provider);
            if (!models.length) {
                chatModelSelect.innerHTML = '<option value="">No models found</option>';
                return;
            }
            chatModelSelect.innerHTML = models.map(model => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`).join('');
            if (models.includes(selected)) {
                chatModelSelect.value = selected;
            } else {
                const fallback = CHAT_PROVIDER_CONFIG[provider]?.defaultModel || models[0];
                chatModelSelect.value = models.includes(fallback) ? fallback : models[0];
                setModelForProvider(provider, chatModelSelect.value);
            }
        }

        function syncProviderUi(provider) {
            setCurrentChatProvider(provider);
            renderModelOptions(provider);
            if (chatCustomModelInput) chatCustomModelInput.value = getSelectedCustomModel(provider);
            updateChatInputPlaceholder();
            if (chatSettingsCurrent) chatSettingsCurrent.textContent = CHAT_PROVIDER_CONFIG[provider]?.label || provider;
        }

        function normalizeModelIdFromGeminiName(value) {
            const raw = String(value || '').trim();
            return raw.startsWith('models/') ? raw.slice('models/'.length) : raw;
        }

        async function fetchProviderModels(provider, apiKey) {
            const config = CHAT_PROVIDER_CONFIG[provider];
            if (!config || !apiKey) return [];
            if (provider === 'gemini') {
                const url = `${config.modelsEndpoint}?key=${encodeURIComponent(apiKey)}&pageSize=200`;
                const resp = await fetch(url, { method: 'GET' });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
                return (Array.isArray(data.models) ? data.models : [])
                    .filter(model => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
                    .map(model => normalizeModelIdFromGeminiName(model.name))
                    .filter(Boolean);
            }

            if (provider === 'anthropic') {
                const resp = await fetch(config.modelsEndpoint, {
                    method: 'GET',
                    headers: {
                        'anthropic-version': '2023-06-01',
                        'x-api-key': apiKey
                    }
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
                return (Array.isArray(data.data) ? data.data : []).map(model => String(model?.id || '').trim()).filter(Boolean);
            }

            const headers = { Authorization: `Bearer ${apiKey}` };
            if (provider === 'openrouter') {
                headers['HTTP-Referer'] = window.location.origin || 'http://localhost';
                headers['X-Title'] = 'NoteFlow Atelier';
            }
            const resp = await fetch(config.modelsEndpoint, { method: 'GET', headers });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error?.message || `HTTP ${resp.status}`);
            const all = (Array.isArray(data.data) ? data.data : []).map(model => String(model?.id || '').trim()).filter(Boolean);
            if (provider === 'openai') {
                return all.filter(model => /gpt|o\d|omni|mini|nano/i.test(model));
            }
            return all;
        }

        async function refreshModelsForCurrentProvider() {
            const provider = getCurrentChatProvider();
            const apiKey = getProviderApiKey(provider);
            if (!apiKey) {
                showToast(`Save a ${CHAT_PROVIDER_CONFIG[provider].label} API key first`);
                if (chatSettingsShell) chatSettingsShell.open = true;
                return;
            }
            if (refreshChatModelsBtn) {
                refreshChatModelsBtn.disabled = true;
                refreshChatModelsBtn.classList.add('is-loading');
            }
            try {
                const fetched = await fetchProviderModels(provider, apiKey);
                if (fetched.length) {
                    cacheModels(provider, fetched);
                    renderModelOptions(provider);
                    showToast(`Loaded ${fetched.length} models for ${CHAT_PROVIDER_CONFIG[provider].label}`);
                } else {
                    showToast(`No models returned by ${CHAT_PROVIDER_CONFIG[provider].label}`);
                }
            } catch (error) {
                showToast(`Model refresh failed: ${error.message}`);
            } finally {
                if (refreshChatModelsBtn) {
                    refreshChatModelsBtn.disabled = false;
                    refreshChatModelsBtn.classList.remove('is-loading');
                }
            }
        }

        function toggleChat() {
            if (!chatbotPanel || !chatInput) return;
            const visible = chatbotPanel.style.display === 'flex';
            chatbotPanel.style.display = visible ? 'none' : 'flex';
            chatbotPanel.setAttribute('aria-hidden', visible ? 'true' : 'false');
            if (!visible) {
                const activeProvider = getCurrentChatProvider();
                populateKeyInputsFromStorage();
                syncProviderUi(activeProvider);
                if (chatSettingsShell) chatSettingsShell.open = !getProviderApiKey(activeProvider);
                setTimeout(()=> chatInput.focus(), 120);
            }
        }

        function openChatInfo() {
            if (!chatInfo) return;
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
            if (!chatInfo) return;
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

        function sanitizeEditorHtml(unsafeHtml) {
            const template = document.createElement('template');
            template.innerHTML = String(unsafeHtml || '');

            template.content.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach(node => node.remove());

            const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);

            nodes.forEach(node => {
                Array.from(node.attributes).forEach(attr => {
                    const name = String(attr.name || '').toLowerCase();
                    const value = String(attr.value || '');
                    if (name.startsWith('on')) {
                        node.removeAttribute(attr.name);
                        return;
                    }
                    if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^\s*javascript:/i.test(value)) {
                        node.removeAttribute(attr.name);
                        return;
                    }
                    if (name === 'srcdoc') {
                        node.removeAttribute(attr.name);
                    }
                });
            });

            return template.innerHTML;
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
        let convo = [];

        function saveConvo() {
            try { sessionStorage.setItem('chat_history', JSON.stringify(convo)); } catch(e){}
            try { localStorage.removeItem('chat_history'); } catch(e){}
        }

        function loadConvo() {
            try {
                const fromSession = sessionStorage.getItem('chat_history');
                if (fromSession) {
                    convo = JSON.parse(fromSession || '[]');
                    return;
                }
                const legacy = localStorage.getItem('chat_history');
                if (legacy) {
                    convo = JSON.parse(legacy || '[]');
                    try { sessionStorage.setItem('chat_history', JSON.stringify(convo)); } catch (err) { /* no-op */ }
                    try { localStorage.removeItem('chat_history'); } catch (err) { /* no-op */ }
                    return;
                }
                convo = [];
            } catch(e){ convo = []; }
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

        function extractOpenAiCompatibleMessage(obj) {
            if (!obj) return null;
            if (obj.error) {
                if (typeof obj.error === 'string') return obj.error;
                if (obj.error.message) return obj.error.message;
            }
            if (obj.message) return obj.message;
            const choice = Array.isArray(obj.choices) ? obj.choices[0] : null;
            if (!choice) return null;
            const content = choice.message?.content;
            if (typeof content === 'string') return content;
            if (Array.isArray(content)) {
                return content
                    .map(part => (typeof part === 'string' ? part : (part && part.text ? part.text : '')))
                    .filter(Boolean)
                    .join('\n')
                    .trim();
            }
            if (typeof choice.text === 'string') return choice.text;
            return null;
        }

        function extractAnthropicMessage(obj) {
            if (!obj) return null;
            if (obj.error?.message) return obj.error.message;
            const content = Array.isArray(obj.content) ? obj.content : [];
            const text = content
                .filter(part => part && part.type === 'text')
                .map(part => String(part.text || '').trim())
                .filter(Boolean)
                .join('\n');
            return text || null;
        }

        function extractGeminiMessage(obj) {
            if (!obj) return null;
            if (obj.error?.message) return obj.error.message;
            const candidates = Array.isArray(obj.candidates) ? obj.candidates : [];
            const parts = candidates[0]?.content?.parts || [];
            const text = parts
                .map(part => String(part?.text || '').trim())
                .filter(Boolean)
                .join('\n');
            return text || null;
        }

        function getActiveModelForProvider(provider) {
            const customValue = chatCustomModelInput ? String(chatCustomModelInput.value || '').trim() : '';
            if (customValue) return customValue;
            const selected = chatModelSelect ? String(chatModelSelect.value || '').trim() : '';
            if (selected) return selected;
            return getSelectedModelForProvider(provider);
        }

        async function sendChat() {
            if (!chatInput || !messagesEl) return;
            const text = chatInput.value.trim();
            if (!text) return;
            appendMessage('user', text);
            chatInput.value = '';
            // maintain conversation history
            convo.push({ role: 'user', content: text });
            saveConvo();
            const provider = getCurrentChatProvider();
            const providerConfig = CHAT_PROVIDER_CONFIG[provider];
            const apiKey = getProviderApiKey(provider);
            const selectedModel = getActiveModelForProvider(provider);
            if (!apiKey) {
                appendMessage('assistant', `Please save your ${providerConfig.label} API key in the settings panel first.`);
                return;
            }
            if (!selectedModel) {
                appendMessage('assistant', 'Please choose a model first.');
                return;
            }

            appendMessage('assistant', 'Thinking...');
            // Call Groq REST endpoint (non-streaming simple call)
            try {
                // Chats are not continuous to save tokens: send only the latest user message as context
                let requestMessages = [{ role: 'user', content: text }];
                setModelForProvider(provider, selectedModel);

                let endpoint = providerConfig.chatEndpoint;
                let headers = { 'Content-Type': 'application/json' };
                let body = {};

                if (providerConfig.type === 'openai_compatible') {
                    headers.Authorization = `Bearer ${apiKey}`;
                    if (provider === 'openrouter') {
                        headers['HTTP-Referer'] = window.location.origin || 'http://localhost';
                        headers['X-Title'] = 'NoteFlow Atelier';
                    }
                    body = {
                        model: selectedModel,
                        messages: requestMessages,
                        temperature: 1
                    };
                } else if (providerConfig.type === 'anthropic') {
                    headers['x-api-key'] = apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    body = {
                        model: selectedModel,
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: text }]
                    };
                } else if (providerConfig.type === 'gemini') {
                    endpoint = providerConfig.chatEndpoint.replace('{model}', encodeURIComponent(selectedModel));
                    endpoint += `?key=${encodeURIComponent(apiKey)}`;
                    body = {
                        contents: [{ role: 'user', parts: [{ text }] }],
                        generationConfig: {
                            temperature: 1,
                            maxOutputTokens: 1024
                        }
                    };
                }

                const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

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
                let extracted = null;
                if (providerConfig.type === 'openai_compatible') extracted = extractOpenAiCompatibleMessage(data);
                else if (providerConfig.type === 'anthropic') extracted = extractAnthropicMessage(data);
                else if (providerConfig.type === 'gemini') extracted = extractGeminiMessage(data);
                if (!extracted && data && data.__raw_text) extracted = data.__raw_text;
                if (!extracted && data && data.error && data.error.message) extracted = data.error.message;
                if (!extracted && data) {
                    try { extracted = JSON.stringify(data); } catch (e) { extracted = String(data); }
                }
                let assistantText = !resp.ok
                    ? `HTTP ${resp.status} - ${extracted || '(no details)'}`
                    : (extracted || '(no response)');

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
                    msg += ' -- this usually means a network issue, blocked API key, or provider CORS policy from browser context.';
                }
                appendMessage('assistant', msg);
            }
        }

        // fullscreen toggle
        function toggleFullscreen() {
            const isFull = chatbotPanel.classList.toggle('fullscreen');
            if (isFull) {
                chatFullBtn.textContent = 'Exit';
            } else {
                chatFullBtn.textContent = 'Full';
            }
            // ensure messages area scrolls to bottom
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        if (chatbotBtn) chatbotBtn.addEventListener('click', toggleChat);
        if (chatSendBtn) chatSendBtn.addEventListener('click', sendChat);
        if (saveChatKeysBtn) saveChatKeysBtn.addEventListener('click', saveAllApiKeys);
        if (chatInfoBtn) chatInfoBtn.addEventListener('click', openChatInfo);
        if (chatCloseBtn) chatCloseBtn.addEventListener('click', () => { if (chatbotPanel.classList.contains('fullscreen')) chatbotPanel.classList.remove('fullscreen'); toggleChat(); });
        if (chatFullBtn) chatFullBtn.addEventListener('click', toggleFullscreen);
        if (chatInput) chatInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });
        if (chatProviderSelect) {
            chatProviderSelect.addEventListener('change', () => {
                const provider = getCurrentChatProvider();
                syncProviderUi(provider);
                if (chatSettingsShell && !getProviderApiKey(provider)) chatSettingsShell.open = true;
            });
        }
        if (chatModelSelect) {
            chatModelSelect.addEventListener('change', () => {
                const provider = getCurrentChatProvider();
                const model = String(chatModelSelect.value || '').trim();
                if (model) setModelForProvider(provider, model);
            });
        }
        if (chatCustomModelInput) {
            chatCustomModelInput.addEventListener('change', () => {
                const provider = getCurrentChatProvider();
                setCustomModelForProvider(provider, chatCustomModelInput.value || '');
            });
            chatCustomModelInput.addEventListener('keypress', (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const provider = getCurrentChatProvider();
                setCustomModelForProvider(provider, chatCustomModelInput.value || '');
                showToast('Custom model saved');
            });
        }
        if (refreshChatModelsBtn) {
            refreshChatModelsBtn.addEventListener('click', refreshModelsForCurrentProvider);
        }
        [groqApiKeyInput, openaiApiKeyInput, anthropicApiKeyInput, geminiApiKeyInput, openrouterApiKeyInput]
            .filter(Boolean)
            .forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    saveAllApiKeys();
                });
            });

        // Initialize
        populateKeyInputsFromStorage();
        syncProviderUi(getCurrentChatProvider());
        // load and render conversation history
        loadConvo();
        if (convo && convo.length) {
            convo.forEach(m => appendMessage(m.role, m.content));
        }

// ===============================================================================
// TIMELINE / TIME-BLOCKING (TimeTile integration)
// ===============================================================================

let timeBlocks = [];
let editingBlockId = null;
let timeMode = null; // null = auto
let timelineViewDateKey = null;
let timelineViewMode = 'day';
let timelineLastKnownTodayKey = dateKey(new Date());

function getTimelineViewDate() {
    const key = timelineViewDateKey || dateKey(new Date());
    return parseDate(key);
}

function normalizeTimelineViewMode(value) {
    const mode = String(value || '').toLowerCase();
    if (mode === 'week' || mode === 'month' || mode === 'year') return mode;
    return 'day';
}

function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + Number(days || 0));
    return d;
}

function getStartOfWeek(dateObj) {
    const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function getBlocksForDate(dateObj) {
    return (Array.isArray(timeBlocks) ? timeBlocks : [])
        .filter(block => doesTimeBlockOccurOnDate(block, dateObj))
        .map(block => {
            const startMins = parseTimeToMinutes(block.start);
            const endMins = parseTimeToMinutes(block.end);
            if (!Number.isFinite(startMins) || !Number.isFinite(endMins)) return null;
            return { block, startMins, endMins };
        })
        .filter(Boolean)
        .sort((a, b) => a.startMins - b.startMins)
        .map(item => item.block);
}

function getTimelineHeading(mode, viewDate) {
    if (mode === 'week') {
        const start = getStartOfWeek(viewDate);
        const end = addDays(start, 6);
        return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (mode === 'month') {
        return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (mode === 'year') {
        return viewDate.toLocaleDateString('en-US', { year: 'numeric' });
    }
    const isToday = dateKey(viewDate) === dateKey(new Date());
    return isToday
        ? 'Your Day at a Glance'
        : `Schedule for ${viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

function isSameDate(a, b) {
    if (!(a instanceof Date) || !(b instanceof Date)) return false;
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function normalizeBlockDate(value) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    const d = new Date(value);
    if (isNaN(d)) return null;
    return dateKey(d);
}

function syncTimelineDateToCurrentDay(force = false) {
    const todayKey = dateKey(new Date());
    if (todayKey === timelineLastKnownTodayKey && !force) return false;
    const shouldFollowToday = force || !timelineViewDateKey || timelineViewDateKey === timelineLastKnownTodayKey;
    timelineLastKnownTodayKey = todayKey;
    if (!shouldFollowToday || timelineViewDateKey === todayKey) return false;
    timelineViewDateKey = todayKey;
    if (appSettings) {
        appSettings.timelineViewDate = timelineViewDateKey;
        appSettings.timelineViewMode = timelineViewMode;
        persistAppData();
    }
    return true;
}

function doesTimeBlockOccurOnDate(block, targetDate) {
    if (!block || !targetDate) return false;
    const recurrence = String(block.recurrence || 'none').toLowerCase();
    const targetKey = dateKey(targetDate);
    let explicitDate = normalizeBlockDate(block.date);
    if (!explicitDate && block.source === 'calendar_ics') {
        // Backward compatibility for old imports that missed "date".
        explicitDate = normalizeBlockDate(block.createdAt) || normalizeBlockDate(block.updatedAt);
    }
    const recurrenceUntil = normalizeBlockDate(block.recurrenceUntil);

    if (explicitDate && targetKey < explicitDate) return false;
    if (recurrenceUntil && targetKey > recurrenceUntil) return false;

    // Calendar imports default to fixed-date events.
    // Recurrence is honored only when preserveRecurrence is explicitly enabled.
    if (block.source === 'calendar_ics' && block.preserveRecurrence !== true) {
        return explicitDate ? explicitDate === targetKey : false;
    }

    if (recurrence === 'daily') return true;
    if (recurrence === 'weekdays') return targetDate.getDay() >= 1 && targetDate.getDay() <= 5;
    if (recurrence === 'weekly') {
        if (Array.isArray(block.weeklyDays) && block.weeklyDays.length > 0) {
            return block.weeklyDays.includes(targetDate.getDay());
        }
        if (explicitDate) return parseDate(explicitDate).getDay() === targetDate.getDay();
        const created = block.createdAt ? new Date(block.createdAt) : null;
        const anchorDay = created && !isNaN(created) ? created.getDay() : targetDate.getDay();
        return targetDate.getDay() === anchorDay;
    }

    // one-time / none
    if (explicitDate) return explicitDate === targetKey;
    if (block.source === 'calendar_ics') return false;
    return true; // legacy manual blocks without date continue to show
}

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

function shiftTimelineAnchor(mode, direction) {
    const step = Number(direction || 0);
    if (!Number.isFinite(step) || step === 0) return;
    const next = getTimelineViewDate();
    if (mode === 'year') next.setFullYear(next.getFullYear() + step);
    else if (mode === 'month') next.setMonth(next.getMonth() + step);
    else if (mode === 'week') next.setDate(next.getDate() + (step * 7));
    else next.setDate(next.getDate() + step);
    timelineViewDateKey = dateKey(next);
    if (appSettings) {
        appSettings.timelineViewDate = timelineViewDateKey;
        appSettings.timelineViewMode = timelineViewMode;
        persistAppData();
    }
    renderTimeline();
}

function buildTimelineDayCell(dateObj, blocks, options = {}) {
    const inCurrentPeriod = options.inCurrentPeriod !== false;
    const count = blocks.length;
    const dayNum = dateObj.getDate();
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const key = dateKey(dateObj);
    const todayKey = dateKey(new Date());
    const eventPreview = blocks.slice(0, 3).map(block => {
        const name = escapeHtml(String(block.name || 'Untitled'));
        return `<div class="timeline-calendar-event">${escapeHtml(block.start || '--:--')} ${name}</div>`;
    }).join('');
    const more = count > 3 ? `<div class="timeline-calendar-more">+${count - 3} more</div>` : '';
    const classes = [
        'timeline-calendar-cell',
        inCurrentPeriod ? '' : 'outside',
        key === todayKey ? 'today' : '',
        key === timelineViewDateKey ? 'selected' : ''
    ].filter(Boolean).join(' ');

    return `
        <button type="button" class="${classes}" data-date="${key}">
            <div class="timeline-calendar-dayhead">
                <span class="timeline-calendar-daynum">${dayNum}</span>
                <span class="timeline-calendar-weekday">${weekday}</span>
            </div>
            <div class="timeline-calendar-count">${count} event${count === 1 ? '' : 's'}</div>
            <div class="timeline-calendar-events">${eventPreview || '<div class="timeline-calendar-empty">No events</div>'}${more}</div>
        </button>
    `;
}

function countBlocksInMonth(year, monthIndex) {
    const days = new Date(year, monthIndex + 1, 0).getDate();
    let total = 0;
    for (let d = 1; d <= days; d += 1) {
        const dateObj = new Date(year, monthIndex, d);
        total += getBlocksForDate(dateObj).length;
    }
    return total;
}

function bindTimelineCalendarInteractions(container, mode) {
    if (!container) return;
    container.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const direction = Number(btn.getAttribute('data-nav') || '0');
            shiftTimelineAnchor(mode, direction);
        });
    });
    container.querySelectorAll('[data-date]').forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedDate = normalizeBlockDate(btn.getAttribute('data-date'));
            if (!selectedDate) return;
            timelineViewDateKey = selectedDate;
            timelineViewMode = mode === 'year' ? 'month' : 'day';
            const modeSelect = document.getElementById('timelineViewModeSelect');
            if (modeSelect) modeSelect.value = timelineViewMode;
            if (appSettings) {
                appSettings.timelineViewDate = timelineViewDateKey;
                appSettings.timelineViewMode = timelineViewMode;
                persistAppData();
            }
            renderTimeline();
        });
    });
}

function renderTimelineCalendarOverview(mode, viewDate, container) {
    if (!container) return;
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (mode === 'week') {
        const start = getStartOfWeek(viewDate);
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        const rangeLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${addDays(start, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        container.innerHTML = `
            <div class="timeline-calendar-toolbar">
                <div class="timeline-calendar-title">Weekly Overview: ${rangeLabel}</div>
                <div class="timeline-calendar-nav">
                    <button type="button" class="neumo-btn timeline-mini-btn" data-nav="-1">Prev Week</button>
                    <button type="button" class="neumo-btn timeline-mini-btn" data-nav="1">Next Week</button>
                </div>
            </div>
            <div class="timeline-weekday-row">${weekdayLabels.map(name => `<div>${name}</div>`).join('')}</div>
            <div class="timeline-calendar-grid week">
                ${days.map(day => buildTimelineDayCell(day, getBlocksForDate(day))).join('')}
            </div>
            <div class="timeline-calendar-hint">Tip: click a day card to jump to detailed Day view.</div>
        `;
        bindTimelineCalendarInteractions(container, mode);
        return;
    }

    if (mode === 'month') {
        const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
        const firstGridDate = addDays(monthStart, -monthStart.getDay());
        const cells = Array.from({ length: 42 }, (_, idx) => addDays(firstGridDate, idx));
        container.innerHTML = `
            <div class="timeline-calendar-toolbar">
                <div class="timeline-calendar-title">${viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <div class="timeline-calendar-nav">
                    <button type="button" class="neumo-btn timeline-mini-btn" data-nav="-1">Prev Month</button>
                    <button type="button" class="neumo-btn timeline-mini-btn" data-nav="1">Next Month</button>
                </div>
            </div>
            <div class="timeline-weekday-row">${weekdayLabels.map(name => `<div>${name}</div>`).join('')}</div>
            <div class="timeline-calendar-grid month">
                ${cells.map(day => buildTimelineDayCell(day, getBlocksForDate(day), {
                    inCurrentPeriod: day >= monthStart && day <= monthEnd
                })).join('')}
            </div>
            <div class="timeline-calendar-hint">Tip: click a date to open detailed Day view.</div>
        `;
        bindTimelineCalendarInteractions(container, mode);
        return;
    }

    const year = viewDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, m) => {
        const firstDate = new Date(year, m, 1);
        const total = countBlocksInMonth(year, m);
        return `
            <button type="button" class="timeline-year-card" data-date="${dateKey(firstDate)}">
                <div class="timeline-year-month">${firstDate.toLocaleDateString('en-US', { month: 'long' })}</div>
                <div class="timeline-year-count">${total} event${total === 1 ? '' : 's'}</div>
            </button>
        `;
    }).join('');
    container.innerHTML = `
        <div class="timeline-calendar-toolbar">
            <div class="timeline-calendar-title">${year} Overview</div>
            <div class="timeline-calendar-nav">
                <button type="button" class="neumo-btn timeline-mini-btn" data-nav="-1">Prev Year</button>
                <button type="button" class="neumo-btn timeline-mini-btn" data-nav="1">Next Year</button>
            </div>
        </div>
        <div class="timeline-year-grid">${months}</div>
        <div class="timeline-calendar-hint">Tip: click a month card to open Month view.</div>
    `;
    bindTimelineCalendarInteractions(container, mode);
}

function renderTimelineDayView(scaleEl, blocksEl, viewDate) {
    if (!scaleEl || !blocksEl) return;
    scaleEl.innerHTML = '';
    blocksEl.innerHTML = '';

    const containerHeight = 600;
    const pxPerHour = containerHeight / 24;
    // Keep horizontal hour lines aligned to the actual timeline width.
    const gridSpan = Math.max(0, Math.round(blocksEl.clientWidth || 0));
    scaleEl.style.setProperty('--timeline-grid-span', `${gridSpan}px`);
    requestAnimationFrame(() => {
        const settledWidth = Math.max(0, Math.round(blocksEl.clientWidth || 0));
        if (settledWidth !== gridSpan) {
            scaleEl.style.setProperty('--timeline-grid-span', `${settledWidth}px`);
        }
    });
    for (let h = 0; h < 24; h += 2) {
        const marker = document.createElement('div');
        marker.className = 'hour-marker';
        marker.style.top = (h * pxPerHour) + 'px';
        marker.textContent = String(h).padStart(2, '0') + ':00';
        scaleEl.appendChild(marker);
    }

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const isViewingToday = dateKey(viewDate) === dateKey(new Date());
    let currentBlock = null;
    const GAP = 12;

    const blocksData = getBlocksForDate(viewDate).map(block => {
        const startMins = parseTimeToMinutes(block.start);
        const endMins = parseTimeToMinutes(block.end);
        if (!Number.isFinite(startMins) || !Number.isFinite(endMins)) return null;
        const duration = Math.max(30, endMins - startMins);
        return {
            block,
            startMins,
            endMins,
            top: (startMins / 60) * pxPerHour,
            height: Math.max(30, (duration / 60) * pxPerHour)
        };
    }).filter(Boolean);

    const placed = [];
    blocksData.forEach(data => {
        const { block, startMins } = data;
        if (isViewingToday && nowMins >= data.startMins && nowMins < data.endMins) currentBlock = block;
        let desiredTop = data.top;
        let desiredBottom = desiredTop + data.height;
        let attempts = 0;
        while (placed.some(p => !(desiredBottom <= p.top || desiredTop >= p.bottom)) && attempts < 100) {
            desiredTop += GAP;
            desiredBottom = desiredTop + data.height;
            attempts++;
        }
        const el = document.createElement('div');
        el.className = 'timeline-block' + (currentBlock === block ? ' current' : '');
        el.style.top = `${desiredTop}px`;
        el.style.height = `${data.height}px`;
        el.style.borderLeftColor = block.color || 'var(--accent)';
        el.style.zIndex = String(2000 - startMins);
        el.innerHTML = `
            <div class="block-name">${block.name || 'Untitled'}</div>
            <div class="block-time">${block.start} &rarr; ${block.end}</div>
        `;
        el.addEventListener('click', () => openBlockModal(block));
        blocksEl.appendChild(el);
        placed.push({ top: desiredTop, bottom: desiredBottom });
    });

    if (isViewingToday) {
        const nowLine = document.createElement('div');
        nowLine.className = 'now-indicator';
        nowLine.style.top = `${(nowMins / 60) * pxPerHour}px`;
        nowLine.setAttribute('data-now-label', 'NOW');
        blocksEl.appendChild(nowLine);
    }

    const infoBlock = currentBlock || (!isViewingToday && blocksData.length ? blocksData[0].block : null);
    updateCurrentBlockCard(infoBlock, isViewingToday);
}

// Render timeline
function renderTimeline() {
    const scaleEl = document.getElementById('timelineScale');
    const blocksEl = document.getElementById('timelineBlocks');
    const headingEl = document.getElementById('timelineHeading');
    const dateInput = document.getElementById('timelineDateInput');
    const modeSelect = document.getElementById('timelineViewModeSelect');
    const timelineContainer = document.querySelector('#view-timeline .timeline-container');
    const calendarView = document.getElementById('timelineCalendarView');
    const currentCard = document.getElementById('currentBlockCard');
    if (!scaleEl || !blocksEl) return;

    syncTimelineDateToCurrentDay();
    const viewDate = getTimelineViewDate();
    const viewKey = dateKey(viewDate);
    timelineViewMode = normalizeTimelineViewMode(timelineViewMode || (appSettings && appSettings.timelineViewMode) || 'day');

    if (dateInput) dateInput.value = viewKey;
    if (modeSelect) modeSelect.value = timelineViewMode;
    if (headingEl) headingEl.textContent = getTimelineHeading(timelineViewMode, viewDate);

    if (timelineViewMode === 'day') {
        if (timelineContainer) timelineContainer.style.display = 'grid';
        if (calendarView) {
            calendarView.style.display = 'none';
            calendarView.innerHTML = '';
        }
        if (currentCard) currentCard.style.display = 'block';
        renderTimelineDayView(scaleEl, blocksEl, viewDate);
        return;
    }

    scaleEl.innerHTML = '';
    blocksEl.innerHTML = '';
    if (timelineContainer) timelineContainer.style.display = 'none';
    if (calendarView) {
        calendarView.style.display = 'grid';
        renderTimelineCalendarOverview(timelineViewMode, viewDate, calendarView);
    }
    if (currentCard) currentCard.style.display = 'none';
}

function updateCurrentBlockCard(block, isViewingToday = true) {
    const infoEl = document.getElementById('currentBlockInfo');
    const progressEl = document.getElementById('blockProgressFill');
    const countdownEl = document.getElementById('blockCountdown');

    if (!block) {
        if (infoEl) infoEl.textContent = isViewingToday ? 'No active block right now' : 'No block selected for this date/time';
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
        const safeName = escapeHtml(String(block.name || 'Untitled'));
        const safeTime = `${block.start} -> ${block.end}`;
        const refUrl = normalizeExternalUrl(block.referenceUrl);
        const docsLinkHtml = refUrl
            ? `<br><a href="${escapeHtml(refUrl)}" target="_blank" rel="noopener noreferrer">Open reference</a>`
            : '';
        infoEl.innerHTML = `<strong style="font-size:18px;">${safeName}</strong><br><span style="color:var(--text-secondary)">${safeTime}</span>${docsLinkHtml}`;
    }
    if (!isViewingToday) {
        if (progressEl) progressEl.style.width = '0%';
        if (countdownEl) countdownEl.textContent = 'Scheduled';
        return;
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
    const recurrenceValue = block
        ? ((block.source === 'calendar_ics' && block.preserveRecurrence !== true) ? 'none' : (block.recurrence || 'none'))
        : 'none';
    document.getElementById('blockRecurrenceInput').value = recurrenceValue;
    const dateInput = document.getElementById('blockDateInput');
    if (dateInput) dateInput.value = block ? (normalizeBlockDate(block.date) || '') : dateKey(getTimelineViewDate());
    const refInput = document.getElementById('blockReferenceInput');
    if (refInput) refInput.value = block ? (block.referenceUrl || '') : '';

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
    let start = document.getElementById('blockStartInput').value;
    let end = document.getElementById('blockEndInput').value;
    const category = document.getElementById('blockCategoryInput').value;
    const color = document.getElementById('blockColorInput').value;
    const recurrence = document.getElementById('blockRecurrenceInput').value;
    const dateInput = document.getElementById('blockDateInput');
    const explicitDate = dateInput ? normalizeBlockDate(dateInput.value) : null;
    const referenceUrlInput = document.getElementById('blockReferenceInput');
    const referenceUrl = normalizeExternalUrl(referenceUrlInput ? referenceUrlInput.value : '');
    const startMins = parseTimeToMinutes(start);
    let endMins = parseTimeToMinutes(end);
    if (!Number.isFinite(startMins) || !Number.isFinite(endMins)) {
        showToast('Valid start/end times are required');
        return;
    }
    if (endMins <= startMins) {
        endMins = Math.min(startMins + 30, 23 * 60 + 59);
        end = minutesToTimeString(endMins);
    }

    if (editingBlockId) {
        // Update existing
        const idx = timeBlocks.findIndex(b => b.id === editingBlockId);
        if (idx !== -1) {
            const existing = timeBlocks[idx] || {};
            const isCalendarImport = existing.source === 'calendar_ics';
            const preserveRecurrence = isCalendarImport ? recurrence !== 'none' : !!existing.preserveRecurrence;
            const nextRecurrence = (isCalendarImport && !preserveRecurrence) ? 'none' : recurrence;
            const baseDate = explicitDate || normalizeBlockDate(timeBlocks[idx].date) || dateKey(getTimelineViewDate());
            timeBlocks[idx] = {
                ...timeBlocks[idx],
                name,
                start,
                end,
                category,
                color,
                recurrence: nextRecurrence,
                preserveRecurrence,
                date: baseDate,
                referenceUrl,
                updatedAt: Date.now()
            };
        }
    } else {
        // Create new
        const baseDate = explicitDate || dateKey(getTimelineViewDate());
        timeBlocks.push({
            id: generateBlockId(),
            name,
            start,
            end,
            category,
            color,
            recurrence,
            date: baseDate,
            referenceUrl,
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
    timelineViewMode = normalizeTimelineViewMode(appSettings && appSettings.timelineViewMode);
    timelineViewDateKey = normalizeBlockDate(appSettings && appSettings.timelineViewDate) || dateKey(new Date());
    timelineLastKnownTodayKey = timelineViewDateKey;
    syncTimelineDateToCurrentDay(true);
    applyTimeMode();
    initTimeModeSelector();
    const modeSelect = document.getElementById('timelineViewModeSelect');
    if (modeSelect) {
        modeSelect.value = timelineViewMode;
        modeSelect.addEventListener('change', (event) => {
            timelineViewMode = normalizeTimelineViewMode(event.target && event.target.value);
            if (appSettings) {
                appSettings.timelineViewMode = timelineViewMode;
                persistAppData();
            }
            renderTimeline();
        });
    }
    const dateInput = document.getElementById('timelineDateInput');
    if (dateInput) {
        dateInput.value = timelineViewDateKey;
        dateInput.addEventListener('change', (event) => {
            const nextKey = normalizeBlockDate(event.target && event.target.value);
            timelineViewDateKey = nextKey || dateKey(new Date());
            if (appSettings) {
                appSettings.timelineViewDate = timelineViewDateKey;
                appSettings.timelineViewMode = timelineViewMode;
                persistAppData();
            }
            renderTimeline();
        });
    }
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
        syncTimelineDateToCurrentDay();
        if (activeView === 'timeline') {
            renderTimeline();
            applyTimeMode();
        }
    }, 60000);
}




