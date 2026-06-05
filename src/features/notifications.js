/* ==========================================================================
   Sutra Notification Center — local-first, no backend
   ==========================================================================
   Surfaces upcoming deadlines, events, and workspace alerts.
   State (read, dismissed, snoozed, prefs) persists in localStorage.
   Works under file:// and served origins alike.
   Designed for graceful degradation when workspace data is unavailable.
   ========================================================================== */

/* global window, document, SutraSafeStorage */

(function (global) {
    'use strict';

    // ---- Storage key -------------------------------------------------------
    var STORAGE_KEY = 'sutraNotifications:v1';
    var MAX_TOASTS = 4;
    var MAX_DISMISSED_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    // ---- Default preferences -----------------------------------------------
    var DEFAULT_PREFS = {
        enabled: true,
        browserNotificationsEnabled: false,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        dailyDigestEnabled: false,
        // Category toggles
        categories: {
            tasks: true,
            homework: true,
            timeline: true,
            apexam: true,
            college: true,
            review: false,
            business: true
        },
        // Lead-time thresholds (in hours)
        thresholds: {
            tasks:    [168, 72, 24, 0],     // 7d, 3d, 1d, today
            homework: [168, 72, 24, 0],
            timeline: [24, 1, 0.25],        // 24h, 1h, 15min
            apexam:   [720, 336, 168, 72, 24], // 30d, 14d, 7d, 3d, 1d
            college:  [720, 336, 168, 72, 24, 0],
            business: [168, 72, 24, 0]
        }
    };

    // ---- In-memory state ---------------------------------------------------
    var _state = {
        prefs: null,        // loaded from storage
        dismissed: {},      // notifKey -> dismissedAt timestamp
        snoozed: {},        // notifKey -> snoozeUntil timestamp
        read: {},           // notifKey -> true
        lastDigest: 0
    };

    var _notifications = [];    // current derived list
    var _panelOpen = false;
    var _filterMode = 'all';    // 'all' | 'unread'
    var _initialized = false;
    var _checkInterval = null;
    var _startupGraceDone = false;

    // ---- Storage helpers ---------------------------------------------------
    function _loadState() {
        try {
            var raw;
            if (typeof SutraSafeStorage !== 'undefined' && SutraSafeStorage.get) {
                raw = SutraSafeStorage.get(STORAGE_KEY);
            } else {
                raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            }
            if (raw && typeof raw === 'object') {
                _state.prefs = Object.assign({}, DEFAULT_PREFS, raw.prefs || {});
                _state.prefs.categories = Object.assign({}, DEFAULT_PREFS.categories, (_state.prefs.categories || {}));
                _state.prefs.thresholds = Object.assign({}, DEFAULT_PREFS.thresholds, (_state.prefs.thresholds || {}));
                _state.dismissed = raw.dismissed || {};
                _state.snoozed = raw.snoozed || {};
                _state.read = raw.read || {};
                _state.lastDigest = raw.lastDigest || 0;
            } else {
                _state.prefs = Object.assign({}, DEFAULT_PREFS);
            }
        } catch (e) {
            _state.prefs = Object.assign({}, DEFAULT_PREFS);
        }
    }

    function _saveState() {
        try {
            var payload = {
                prefs: _state.prefs,
                dismissed: _state.dismissed,
                snoozed: _state.snoozed,
                read: _state.read,
                lastDigest: _state.lastDigest
            };
            if (typeof SutraSafeStorage !== 'undefined' && SutraSafeStorage.set) {
                SutraSafeStorage.set(STORAGE_KEY, payload);
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            }
        } catch (e) { /* non-critical */ }
    }

    function _pruneOldDismissed() {
        var cutoff = Date.now() - MAX_DISMISSED_AGE_MS;
        Object.keys(_state.dismissed).forEach(function (k) {
            if (_state.dismissed[k] < cutoff) delete _state.dismissed[k];
        });
    }

    // ---- Priority helpers --------------------------------------------------
    function _getPriority(hoursUntilDue, source) {
        if (hoursUntilDue < 0) return 'overdue';
        if (hoursUntilDue < 1) return 'urgent';
        if (hoursUntilDue < 24) return 'important';
        if (hoursUntilDue < 72) return 'upcoming';
        return 'info';
    }

    function _priorityOrder(p) {
        var map = { overdue: 0, urgent: 1, important: 2, upcoming: 3, info: 4 };
        return map[p] !== undefined ? map[p] : 5;
    }

    function _sourceIcon(source) {
        var icons = {
            task: 'fa-check-square',
            homework: 'fa-book',
            timeline: 'fa-calendar',
            apexam: 'fa-graduation-cap',
            college: 'fa-university',
            review: 'fa-cards-blank',
            business: 'fa-briefcase'
        };
        return icons[source] || 'fa-bell';
    }

    // ---- Relative time label -----------------------------------------------
    function _relativeTime(due) {
        var ms = due - Date.now();
        var hours = ms / 3600000;
        if (ms < 0) {
            var agoH = Math.abs(hours);
            if (agoH < 1) return 'just overdue';
            if (agoH < 24) return Math.round(agoH) + 'h overdue';
            return Math.round(agoH / 24) + 'd overdue';
        }
        if (hours < 1) return Math.round(hours * 60) + 'min';
        if (hours < 24) return Math.round(hours) + 'h';
        var days = Math.round(hours / 24);
        if (days === 1) return 'tomorrow';
        if (days < 8) return days + ' days';
        return Math.round(days / 7) + ' weeks';
    }

    // ---- Quiet hours check -------------------------------------------------
    function _inQuietHours() {
        if (!_state.prefs.quietHoursEnabled) return false;
        try {
            var now = new Date();
            var h = now.getHours();
            var m = now.getMinutes();
            var current = h * 60 + m;
            var startParts = (_state.prefs.quietHoursStart || '22:00').split(':');
            var endParts = (_state.prefs.quietHoursEnd || '07:00').split(':');
            var start = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || 0);
            var end = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || 0);
            if (start <= end) return current >= start && current < end;
            return current >= start || current < end;  // overnight
        } catch (e) {
            return false;
        }
    }

    // ---- Derive notifications from workspace data --------------------------
    function _deriveNotifications() {
        var out = [];
        var now = Date.now();
        var prefs = _state.prefs;

        if (!prefs.enabled) return out;

        // Collect deadlines via the existing bridge
        var deadlines = [];
        try {
            if (global.flowAtelier && typeof global.flowAtelier.collectWorkspaceDeadlines === 'function') {
                deadlines = global.flowAtelier.collectWorkspaceDeadlines({ includeBusiness: true }) || [];
            } else if (typeof global.collectWorkspaceDeadlines === 'function') {
                deadlines = global.collectWorkspaceDeadlines({ includeBusiness: true }) || [];
            }
        } catch (e) { /* bridge not ready */ }

        deadlines.forEach(function (item) {
            var source = item.source || 'task';
            if (!prefs.categories[source]) return;

            var dueMs = item.due instanceof Date ? item.due.getTime() : new Date(item.due).getTime();
            if (isNaN(dueMs)) return;

            var hoursUntil = (dueMs - now) / 3600000;
            var thresholds = (prefs.thresholds[source] || [168, 72, 24, 0]);

            // Show the most-specific notification that applies.
            // Only one notification per item at any given time.
            var matchedThreshold = null;
            for (var i = 0; i < thresholds.length; i++) {
                var thr = thresholds[i];
                if (hoursUntil <= thr + 0.5 || item.overdue) {
                    matchedThreshold = thr;
                    break;
                }
            }
            if (matchedThreshold === null && !item.overdue) return;

            var suffix = item.overdue ? 'overdue' : ('thr-' + String(matchedThreshold));
            var key = item.id + ':' + suffix;

            // Check dismissed / snoozed
            if (_state.dismissed[key]) return;
            var snoozeUntil = _state.snoozed[key];
            if (snoozeUntil && now < snoozeUntil) return;

            var priority = _getPriority(hoursUntil, source);

            out.push({
                key: key,
                sourceKey: item.id,
                source: source,
                title: item.title || 'Upcoming item',
                subtitle: item.subtitle || '',
                due: new Date(dueMs),
                hoursUntil: hoursUntil,
                relativeTime: _relativeTime(new Date(dueMs)),
                priority: priority,
                icon: _sourceIcon(source),
                read: !!_state.read[key],
                overdue: !!item.overdue,
                sourceId: item.sourceId || '',
                sourceCourseId: item.sourceCourseId || ''
            });
        });

        // Sort: overdue first, then by due date
        out.sort(function (a, b) {
            var pa = _priorityOrder(a.priority);
            var pb = _priorityOrder(b.priority);
            if (pa !== pb) return pa - pb;
            return a.due - b.due;
        });

        return out;
    }

    // ---- Render the panel --------------------------------------------------
    function _getList() {
        return document.getElementById('notifList');
    }

    function _renderPanel() {
        var list = _getList();
        if (!list) return;

        var toShow = _filterMode === 'unread'
            ? _notifications.filter(function (n) { return !n.read; })
            : _notifications;

        if (toShow.length === 0) {
            list.innerHTML = '<div class="notif-empty">'
                + '<div class="notif-empty-icon"><i class="fas fa-bell" aria-hidden="true"></i></div>'
                + '<div class="notif-empty-title">All clear</div>'
                + '<div class="notif-empty-sub">No upcoming deadlines or alerts right now.</div>'
                + '</div>';
        } else {
            list.innerHTML = toShow.map(function (n) {
                return '<div class="notif-row' + (n.read ? ' read' : ' unread') + '" '
                    + 'data-key="' + _esc(n.key) + '" '
                    + 'data-source="' + _esc(n.source) + '" '
                    + 'data-source-id="' + _esc(n.sourceId) + '" '
                    + 'role="article" '
                    + 'tabindex="0" '
                    + 'aria-label="' + _esc(n.title) + ', ' + _esc(n.relativeTime) + '">'
                    + '<div class="notif-row-icon priority-' + _esc(n.priority) + '">'
                    + '<i class="fas ' + _esc(n.icon) + '" aria-hidden="true"></i></div>'
                    + '<div class="notif-row-body">'
                    + '<div class="notif-row-title">' + _esc(n.title) + '</div>'
                    + (n.subtitle ? '<div class="notif-row-subtitle">' + _esc(n.subtitle) + '</div>' : '')
                    + '<div class="notif-row-time">' + _esc(n.relativeTime) + '</div>'
                    + '</div>'
                    + '<div class="notif-row-actions">'
                    + '<button class="notif-action-btn" data-action="snooze" data-key="' + _esc(n.key) + '" '
                    + 'title="Snooze 1 hour" aria-label="Snooze ' + _esc(n.title) + ' for 1 hour">'
                    + '<i class="fas fa-clock" aria-hidden="true"></i></button>'
                    + '<button class="notif-action-btn" data-action="dismiss" data-key="' + _esc(n.key) + '" '
                    + 'title="Dismiss" aria-label="Dismiss ' + _esc(n.title) + '">'
                    + '<i class="fas fa-times" aria-hidden="true"></i></button>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }

        _updateBadge();
        _updateMarkAllBtn();
        _updatePanelCount();
    }

    function _esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function _updateBadge() {
        var bell = document.getElementById('notifBellBtn');
        if (!bell) return;
        var badge = bell.querySelector('.notif-bell-badge');
        if (!badge) return;
        var unread = _notifications.filter(function (n) { return !n.read; }).length;
        badge.textContent = unread > 99 ? '99+' : String(unread || '');
        badge.setAttribute('data-count', String(unread));
        var label = unread > 0
            ? 'Notifications (' + unread + ' unread)'
            : 'Notifications';
        bell.setAttribute('aria-label', label);
    }

    function _updateMarkAllBtn() {
        var btn = document.getElementById('notifMarkAllBtn');
        if (!btn) return;
        var hasUnread = _notifications.some(function (n) { return !n.read; });
        btn.style.display = hasUnread ? '' : 'none';
    }

    function _updatePanelCount() {
        var el = document.getElementById('notifPanelCount');
        if (!el) return;
        var unread = _notifications.filter(function (n) { return !n.read; }).length;
        el.textContent = unread > 0 ? String(unread) : '';
        el.setAttribute('data-count', String(unread));
    }

    // ---- Panel open / close ------------------------------------------------
    function openPanel() {
        var panel = document.getElementById('notifPanel');
        var overlay = document.getElementById('notifOverlay');
        var bell = document.getElementById('notifBellBtn');
        if (!panel) return;

        _panelOpen = true;
        _renderPanel();
        panel.classList.add('notif-panel--open');
        panel.removeAttribute('hidden');
        panel.setAttribute('aria-hidden', 'false');
        if (overlay) {
            overlay.classList.add('notif-overlay--visible');
        }
        if (bell) bell.setAttribute('aria-expanded', 'true');

        // Focus first focusable element
        setTimeout(function () {
            var first = panel.querySelector('button:not([disabled])');
            if (first) try { first.focus(); } catch (e) {}
        }, 60);
    }

    function closePanel() {
        var panel = document.getElementById('notifPanel');
        var overlay = document.getElementById('notifOverlay');
        var bell = document.getElementById('notifBellBtn');
        if (!panel) return;

        _panelOpen = false;
        panel.classList.remove('notif-panel--open');
        panel.setAttribute('aria-hidden', 'true');
        if (overlay) overlay.classList.remove('notif-overlay--visible');
        if (bell) {
            bell.setAttribute('aria-expanded', 'false');
            // Return focus to bell
            setTimeout(function () { try { bell.focus(); } catch (e) {} }, 60);
        }
    }

    function togglePanel() {
        if (_panelOpen) closePanel();
        else openPanel();
    }

    // ---- Actions -----------------------------------------------------------
    function markRead(key) {
        _state.read[key] = true;
        var notif = _notifications.find(function (n) { return n.key === key; });
        if (notif) notif.read = true;
        _saveState();
        _updateBadge();
        _updateMarkAllBtn();
        _updatePanelCount();
        // Update DOM row
        var row = document.querySelector('.notif-row[data-key="' + key + '"]');
        if (row) { row.classList.remove('unread'); row.classList.add('read'); }
    }

    function markAllRead() {
        _notifications.forEach(function (n) {
            _state.read[n.key] = true;
            n.read = true;
        });
        _saveState();
        _renderPanel();
    }

    function dismiss(key) {
        _state.dismissed[key] = Date.now();
        _notifications = _notifications.filter(function (n) { return n.key !== key; });
        _saveState();
        // Animate removal
        var row = document.querySelector('.notif-row[data-key="' + key + '"]');
        if (row) {
            row.classList.add('notif-row--removing');
            setTimeout(function () {
                _renderPanel();
            }, 220);
        } else {
            _renderPanel();
        }
    }

    function snooze(key, hours) {
        hours = hours || 1;
        _state.snoozed[key] = Date.now() + hours * 3600000;
        _notifications = _notifications.filter(function (n) { return n.key !== key; });
        _saveState();
        var row = document.querySelector('.notif-row[data-key="' + key + '"]');
        if (row) {
            row.classList.add('notif-row--removing');
            setTimeout(function () { _renderPanel(); }, 220);
        } else {
            _renderPanel();
        }
        showToast({
            title: 'Snoozed for ' + hours + ' hour' + (hours > 1 ? 's' : ''),
            icon: 'fa-clock',
            duration: 2500
        });
    }

    // ---- Open source item --------------------------------------------------
    function _openSourceItem(source, sourceId) {
        try {
            var fa = global.flowAtelier;
            if (!fa) return;
            var viewMap = {
                task: 'today',
                homework: 'homework',
                timeline: 'timeline',
                apexam: 'apstudy',
                college: 'collegeapp',
                review: 'review',
                business: 'business'
            };
            var view = viewMap[source] || 'today';
            if (fa.setActiveView) fa.setActiveView(view);
        } catch (e) { /* non-critical */ }
    }

    // ---- Toast queue -------------------------------------------------------
    var _toastQueue = [];
    var _toastVisible = [];

    function showToast(opts) {
        opts = opts || {};
        var container = document.getElementById('notifToastContainer');
        if (!container) return;

        var toast = document.createElement('div');
        toast.className = 'notif-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = '<div class="notif-toast-icon"><i class="fas ' + _esc(opts.icon || 'fa-bell') + '" aria-hidden="true"></i></div>'
            + '<div class="notif-toast-body">'
            + '<div class="notif-toast-title">' + _esc(opts.title || '') + '</div>'
            + (opts.subtitle ? '<div class="notif-toast-subtitle">' + _esc(opts.subtitle) + '</div>' : '')
            + '</div>'
            + '<button class="notif-toast-dismiss" aria-label="Dismiss notification">'
            + '<i class="fas fa-times" aria-hidden="true"></i></button>';

        // Remove if stack too large
        while (_toastVisible.length >= MAX_TOASTS) {
            var old = _toastVisible.shift();
            _hideToast(old);
        }

        container.appendChild(toast);
        _toastVisible.push(toast);

        var dismissBtn = toast.querySelector('.notif-toast-dismiss');
        if (dismissBtn) dismissBtn.addEventListener('click', function (e) { e.stopPropagation(); _hideToast(toast); });
        toast.addEventListener('click', function () {
            if (opts.onClick) opts.onClick();
            _hideToast(toast);
        });

        // Animate in
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                toast.classList.add('notif-toast--visible');
            });
        });

        // Auto-dismiss
        var duration = opts.duration || (opts.urgent ? 6000 : 4000);
        setTimeout(function () { _hideToast(toast); }, duration);
    }

    function _hideToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('notif-toast--hiding');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
            _toastVisible = _toastVisible.filter(function (t) { return t !== toast; });
        }, 200);
    }

    // ---- Refresh notifications ---------------------------------------------
    function refresh() {
        var prev = _notifications;
        _notifications = _deriveNotifications();

        if (_panelOpen) {
            _renderPanel();
        } else {
            _updateBadge();
        }

        // Show toasts for newly-urgent items (after startup grace period)
        if (_startupGraceDone && !_inQuietHours()) {
            _showNewUrgentToasts(prev, _notifications);
        }
    }

    function _showNewUrgentToasts(prev, current) {
        var prevKeys = new Set(prev.map(function (n) { return n.key; }));
        current.forEach(function (n) {
            if (!prevKeys.has(n.key) && (n.priority === 'urgent' || n.priority === 'overdue')) {
                showToast({
                    title: n.title,
                    subtitle: n.relativeTime,
                    icon: n.icon,
                    urgent: true,
                    onClick: function () {
                        markRead(n.key);
                        _openSourceItem(n.source, n.sourceId);
                        openPanel();
                    }
                });
            }
        });
    }

    // ---- Panel event wiring ------------------------------------------------
    function _wirePanel() {
        var panel = document.getElementById('notifPanel');
        var bell = document.getElementById('notifBellBtn');
        var overlay = document.getElementById('notifOverlay');
        var markAllBtn = document.getElementById('notifMarkAllBtn');
        var closeBtn = document.getElementById('notifCloseBtn');
        var settingsLink = document.getElementById('notifSettingsLink');
        var filterAll = document.getElementById('notifFilterAll');
        var filterUnread = document.getElementById('notifFilterUnread');

        if (bell) {
            bell.addEventListener('click', function (e) {
                e.stopPropagation();
                togglePanel();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', function () { closePanel(); });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function () { closePanel(); });
        }

        if (markAllBtn) {
            markAllBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                markAllRead();
            });
        }

        if (settingsLink) {
            settingsLink.addEventListener('click', function () {
                closePanel();
                try {
                    if (global.flowAtelier && global.flowAtelier.setActiveView) {
                        global.flowAtelier.setActiveView('settings');
                        setTimeout(function () {
                            var navBtn = document.querySelector('[data-settings-nav="notifications"]');
                            if (navBtn) navBtn.click();
                        }, 300);
                    }
                } catch (e) { /* non-critical */ }
            });
        }

        if (filterAll) {
            filterAll.addEventListener('click', function () {
                _filterMode = 'all';
                filterAll.classList.add('active');
                if (filterUnread) filterUnread.classList.remove('active');
                _renderPanel();
            });
        }

        if (filterUnread) {
            filterUnread.addEventListener('click', function () {
                _filterMode = 'unread';
                filterUnread.classList.add('active');
                if (filterAll) filterAll.classList.remove('active');
                _renderPanel();
            });
        }

        // Delegated click on notification rows
        if (panel) {
            panel.addEventListener('click', function (e) {
                var actionBtn = e.target.closest('[data-action]');
                if (actionBtn) {
                    e.stopPropagation();
                    var action = actionBtn.getAttribute('data-action');
                    var key = actionBtn.getAttribute('data-key');
                    if (action === 'dismiss') dismiss(key);
                    else if (action === 'snooze') snooze(key, 1);
                    return;
                }

                var row = e.target.closest('.notif-row');
                if (row) {
                    var k = row.getAttribute('data-key');
                    var source = row.getAttribute('data-source');
                    var sourceId = row.getAttribute('data-source-id');
                    if (k) markRead(k);
                    _openSourceItem(source, sourceId);
                    closePanel();
                }
            });

            // Keyboard handler
            panel.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') { e.preventDefault(); closePanel(); }
            });
        }

        // Global Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && _panelOpen) {
                e.preventDefault();
                closePanel();
            }
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (!_panelOpen) return;
            var panel2 = document.getElementById('notifPanel');
            var bell2 = document.getElementById('notifBellBtn');
            if (!panel2 || !bell2) return;
            if (!panel2.contains(e.target) && !bell2.contains(e.target)) {
                closePanel();
            }
        });
    }

    // ---- Tab visibility check ----------------------------------------------
    function _onVisibilityChange() {
        if (!document.hidden) refresh();
    }

    // ---- Public: browser notifications -------------------------------------
    function requestBrowserPermission(callback) {
        if (!('Notification' in global)) {
            if (callback) callback('unsupported');
            return;
        }
        if (Notification.permission === 'granted') {
            if (callback) callback('granted');
            return;
        }
        if (Notification.permission === 'denied') {
            if (callback) callback('denied');
            return;
        }
        Notification.requestPermission().then(function (perm) {
            if (callback) callback(perm);
        });
    }

    // ---- Preferences -------------------------------------------------------
    function getPreferences() {
        return Object.assign({}, _state.prefs);
    }

    function updatePreferences(delta) {
        if (!_state.prefs) _state.prefs = Object.assign({}, DEFAULT_PREFS);
        Object.assign(_state.prefs, delta);
        if (delta.categories) {
            _state.prefs.categories = Object.assign({}, DEFAULT_PREFS.categories, _state.prefs.categories, delta.categories);
        }
        _saveState();
        refresh();
        _renderNotificationSettingsUI();
    }

    // ---- Settings section UI -----------------------------------------------
    function _renderNotificationSettingsUI() {
        var root = document.getElementById('settings-notifications-dynamic');
        if (!root || !_state.prefs) return;
        var p = _state.prefs;

        root.innerHTML = '<div class="cc-row">'
            + '<div class="cc-row-label"><span class="cc-row-title">In-app notifications</span>'
            + '<span class="cc-row-sub">Show upcoming deadlines in the notification panel</span></div>'
            + '<label class="cc-switch" aria-label="Enable in-app notifications">'
            + '<input type="checkbox" id="notifPrefEnabled"' + (p.enabled ? ' checked' : '') + '>'
            + '<div class="cc-switch-track"><div class="cc-switch-thumb"></div></div></label></div>'

            + '<div class="cc-row">'
            + '<div class="cc-row-label"><span class="cc-row-title">Quiet hours</span>'
            + '<span class="cc-row-sub">Suppress toasts during these hours</span></div>'
            + '<label class="cc-switch" aria-label="Enable quiet hours">'
            + '<input type="checkbox" id="notifPrefQuiet"' + (p.quietHoursEnabled ? ' checked' : '') + '>'
            + '<div class="cc-switch-track"><div class="cc-switch-thumb"></div></div></label></div>'

            + '<div class="cc-row cc-row--indent" id="notifQuietHoursRow" style="' + (p.quietHoursEnabled ? '' : 'display:none') + '">'
            + '<div class="cc-row-label"><span class="cc-row-title">Quiet from</span></div>'
            + '<div style="display:flex;gap:8px;align-items:center">'
            + '<input type="time" class="modal-input" id="notifQuietStart" value="' + _esc(p.quietHoursStart || '22:00') + '" style="width:110px">'
            + '<span style="color:var(--text-muted);font-size:.8rem">to</span>'
            + '<input type="time" class="modal-input" id="notifQuietEnd" value="' + _esc(p.quietHoursEnd || '07:00') + '" style="width:110px">'
            + '</div></div>'

            + '<div class="cc-row">'
            + '<div class="cc-row-label"><span class="cc-row-title">Browser notifications</span>'
            + '<span class="cc-row-sub">Optional — only if you grant permission</span></div>'
            + '<button type="button" class="cc-btn cc-btn-quiet" id="notifBrowserPermBtn" style="font-size:.78rem">'
            + (_getBrowserPermLabel()) + '</button></div>'

            + '<div class="cc-row" style="border-top:1px solid var(--cc-divider);margin-top:8px;padding-top:14px">'
            + '<div class="cc-row-label"><span class="cc-row-title">Categories</span>'
            + '<span class="cc-row-sub">Choose which types of items trigger notifications</span></div></div>'

            + _renderCategoryToggles(p)

            + '<div class="cc-row" style="border-top:1px solid var(--cc-divider);margin-top:8px;padding-top:14px">'
            + '<div class="cc-row-label"><span class="cc-row-title">Test notification</span>'
            + '<span class="cc-row-sub">Preview a notification toast</span></div>'
            + '<button type="button" class="cc-btn cc-btn-quiet" id="notifTestBtn" style="font-size:.78rem">Send test</button></div>';

        // Wire events
        var enabledEl = document.getElementById('notifPrefEnabled');
        if (enabledEl) enabledEl.addEventListener('change', function () {
            updatePreferences({ enabled: this.checked });
        });

        var quietEl = document.getElementById('notifPrefQuiet');
        var quietRow = document.getElementById('notifQuietHoursRow');
        if (quietEl) quietEl.addEventListener('change', function () {
            updatePreferences({ quietHoursEnabled: this.checked });
            if (quietRow) quietRow.style.display = this.checked ? '' : 'none';
        });

        var quietStart = document.getElementById('notifQuietStart');
        if (quietStart) quietStart.addEventListener('change', function () {
            updatePreferences({ quietHoursStart: this.value });
        });

        var quietEnd = document.getElementById('notifQuietEnd');
        if (quietEnd) quietEnd.addEventListener('change', function () {
            updatePreferences({ quietHoursEnd: this.value });
        });

        var permBtn = document.getElementById('notifBrowserPermBtn');
        if (permBtn) permBtn.addEventListener('click', function () {
            requestBrowserPermission(function (perm) {
                permBtn.textContent = _getBrowserPermLabel(perm);
            });
        });

        var testBtn = document.getElementById('notifTestBtn');
        if (testBtn) testBtn.addEventListener('click', function () {
            showToast({
                title: 'Test notification',
                subtitle: 'Sutra notifications are working',
                icon: 'fa-bell',
                duration: 4000
            });
        });

        // Category toggles
        Object.keys(DEFAULT_PREFS.categories).forEach(function (cat) {
            var el = document.getElementById('notifCat-' + cat);
            if (el) el.addEventListener('change', function () {
                var cats = Object.assign({}, _state.prefs.categories);
                cats[cat] = this.checked;
                updatePreferences({ categories: cats });
            });
        });
    }

    function _getBrowserPermLabel(perm) {
        var p = perm || (('Notification' in global) ? Notification.permission : 'unsupported');
        if (p === 'unsupported') return 'Not supported';
        if (p === 'granted') return 'Enabled';
        if (p === 'denied') return 'Blocked (check browser)';
        return 'Enable browser alerts';
    }

    function _renderCategoryToggles(prefs) {
        var cats = {
            tasks: 'Tasks',
            homework: 'Homework',
            timeline: 'Timeline events',
            apexam: 'AP exams',
            college: 'College deadlines',
            review: 'Review due cards',
            business: 'Projects & work'
        };
        return Object.keys(cats).map(function (key) {
            var checked = prefs.categories && prefs.categories[key] !== false;
            return '<div class="cc-row cc-row--indent">'
                + '<div class="cc-row-label"><span class="cc-row-title">' + _esc(cats[key]) + '</span></div>'
                + '<label class="cc-switch" aria-label="' + _esc(cats[key]) + ' notifications">'
                + '<input type="checkbox" id="notifCat-' + _esc(key) + '"' + (checked ? ' checked' : '') + '>'
                + '<div class="cc-switch-track"><div class="cc-switch-thumb"></div></div></label></div>';
        }).join('');
    }

    // ---- Init --------------------------------------------------------------
    function init() {
        if (_initialized) return;
        _initialized = true;

        _loadState();
        _pruneOldDismissed();

        // Initial notification calculation
        refresh();

        // Wire up panel events
        _wirePanel();

        // Render settings UI if already on settings view
        _renderNotificationSettingsUI();

        // Listen for workspace state changes
        global.addEventListener('homework:updated', function () { setTimeout(refresh, 200); });

        // Tab visibility
        document.addEventListener('visibilitychange', _onVisibilityChange);

        // Check every minute
        _checkInterval = setInterval(function () {
            _pruneOldDismissed();
            refresh();
        }, 60000);

        // Grace period: don't show toasts for the first 4 seconds
        // so startup doesn't flood the user
        setTimeout(function () {
            _startupGraceDone = true;
        }, 4000);

        // Listen for settings view navigation to render settings section
        document.addEventListener('click', function (e) {
            var navBtn = e.target.closest('[data-settings-nav="notifications"]');
            if (navBtn) setTimeout(_renderNotificationSettingsUI, 80);
        });
    }

    // ---- Export for .sutra round-trip -------------------------------------------
    // The main app.js export/import hooks read window.SutraNotifications.exportState()
    // and call window.SutraNotifications.importState(state) during workspace backup.
    function exportState() {
        return {
            prefs: _state.prefs,
            dismissed: _state.dismissed,
            snoozed: _state.snoozed,
            read: _state.read,
            lastDigest: _state.lastDigest
        };
    }

    function importState(raw) {
        if (!raw || typeof raw !== 'object') return;
        if (raw.prefs) _state.prefs = Object.assign({}, DEFAULT_PREFS, raw.prefs);
        if (raw.dismissed) _state.dismissed = Object.assign({}, raw.dismissed);
        if (raw.snoozed) _state.snoozed = Object.assign({}, raw.snoozed);
        if (raw.read) _state.read = Object.assign({}, raw.read);
        if (raw.lastDigest) _state.lastDigest = raw.lastDigest;
        _saveState();
        refresh();
    }

    // ---- Public API --------------------------------------------------------
    global.SutraNotifications = {
        init: init,
        refresh: refresh,
        getNotifications: function () { return _notifications.slice(); },
        markRead: markRead,
        markAllRead: markAllRead,
        dismiss: dismiss,
        snooze: snooze,
        openPanel: openPanel,
        closePanel: closePanel,
        showToast: showToast,
        requestBrowserPermission: requestBrowserPermission,
        getPreferences: getPreferences,
        updatePreferences: updatePreferences,
        exportState: exportState,
        importState: importState,
        renderSettingsUI: _renderNotificationSettingsUI
    };

    // ---- Auto-init ---------------------------------------------------------
    function _autoInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(init, 200);
            });
        } else {
            setTimeout(init, 200);
        }
    }

    _autoInit();

}(typeof window !== 'undefined' ? window : this));
