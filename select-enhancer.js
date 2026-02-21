(function () {
    'use strict';

    const ENHANCED_MARK = 'nfSelectEnhanced';
    const components = new WeakMap();
    let openComponent = null;
    let domObserver = null;
    let valuePatched = false;

    function shouldEnhance(select) {
        if (!(select instanceof HTMLSelectElement)) return false;
        if (select.closest('#chatbotPanel')) return false;
        if (select.dataset.nativeSelect === 'true' || select.classList.contains('no-custom-select')) return false;
        if (select.multiple) return false;
        if (Number(select.size || 0) > 1) return false;
        return true;
    }

    function copySizingStyles(select, wrapper) {
        const props = [
            'width', 'minWidth', 'maxWidth',
            'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf'
        ];
        props.forEach((prop) => {
            if (select.style[prop]) {
                wrapper.style[prop] = select.style[prop];
            }
        });
    }

    function closeOpenSelect() {
        if (!openComponent) return;
        const component = openComponent;
        openComponent = null;
        component.wrapper.classList.remove('open');
        component.trigger.setAttribute('aria-expanded', 'false');
    }

    function getSelectedOption(select) {
        const selectedIndex = select.selectedIndex >= 0 ? select.selectedIndex : 0;
        return select.options[selectedIndex] || null;
    }

    function updateTriggerLabel(component) {
        const option = getSelectedOption(component.select);
        component.label.textContent = option ? option.textContent : '';
    }

    function buildMenu(component) {
        const select = component.select;
        const menu = component.menu;
        menu.innerHTML = '';

        let lastGroup = null;
        const options = Array.from(select.options);
        options.forEach((option, index) => {
            const group = option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : null;
            if (group && group !== lastGroup) {
                const groupLabel = document.createElement('div');
                groupLabel.className = 'nf-select-group';
                groupLabel.textContent = group;
                menu.appendChild(groupLabel);
                lastGroup = group;
            }

            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'nf-select-option';
            item.textContent = option.textContent;
            item.setAttribute('role', 'option');
            item.setAttribute('data-index', String(index));
            item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
            if (option.selected) item.classList.add('is-selected');
            if (option.disabled) {
                item.classList.add('is-disabled');
                item.disabled = true;
                item.setAttribute('aria-disabled', 'true');
            }

            item.addEventListener('click', function () {
                if (option.disabled) return;
                if (select.selectedIndex !== index) {
                    select.selectedIndex = index;
                    select.dispatchEvent(new Event('input', { bubbles: true }));
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    updateTriggerLabel(component);
                }
                closeOpenSelect();
                component.trigger.focus();
            });

            menu.appendChild(item);
        });
    }

    function syncComponent(component, rebuildMenu) {
        if (rebuildMenu) buildMenu(component);
        updateTriggerLabel(component);
        component.trigger.disabled = component.select.disabled;
        component.wrapper.classList.toggle('is-disabled', component.select.disabled);
    }

    function getEnabledOptions(component) {
        return Array.from(component.menu.querySelectorAll('.nf-select-option:not(.is-disabled)'));
    }

    function focusOption(component, direction) {
        const options = getEnabledOptions(component);
        if (!options.length) return;

        const current = document.activeElement;
        let index = options.indexOf(current);
        if (index < 0) {
            index = options.findIndex((item) => item.classList.contains('is-selected'));
        }
        if (index < 0) index = 0;
        index += direction;
        if (index < 0) index = options.length - 1;
        if (index >= options.length) index = 0;
        options[index].focus();
    }

    function openSelect(component, focusSelected) {
        if (component.select.disabled) return;
        if (openComponent && openComponent !== component) closeOpenSelect();
        syncComponent(component, true);
        component.wrapper.classList.add('open');
        component.trigger.setAttribute('aria-expanded', 'true');
        openComponent = component;

        if (focusSelected) {
            const selected = component.menu.querySelector('.nf-select-option.is-selected:not(.is-disabled)');
            const fallback = component.menu.querySelector('.nf-select-option:not(.is-disabled)');
            const target = selected || fallback;
            if (target) target.focus();
        }
    }

    function setupSizingClasses(select, wrapper) {
        if (
            select.classList.contains('modal-input') ||
            select.classList.contains('neumo-input') ||
            select.closest('.modal-body') ||
            select.closest('.theme-panel')
        ) {
            wrapper.classList.add('nf-select--full');
        }
        if (select.closest('.filter-group') || select.closest('.todo-option-group')) {
            wrapper.classList.add('nf-select--flex');
        }
        if (select.closest('.font-input-item')) {
            wrapper.style.minWidth = '140px';
        }
        if (
            select.closest('.hw-task-control') ||
            select.closest('.hw-inline-add') ||
            select.closest('#toolbarTimeControls')
        ) {
            wrapper.classList.add('nf-select--compact');
        }
    }

    function enhanceSelect(select) {
        if (!shouldEnhance(select)) return null;
        if (select.dataset[ENHANCED_MARK] === 'true') {
            const existing = components.get(select);
            if (existing) syncComponent(existing, true);
            return existing || null;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'nf-select';
        setupSizingClasses(select, wrapper);
        copySizingStyles(select, wrapper);
        if (!wrapper.style.width && wrapper.classList.contains('nf-select--full')) {
            wrapper.style.width = '100%';
        }

        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        select.classList.add('nf-select-native');
        select.dataset[ENHANCED_MARK] = 'true';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'nf-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        if (select.id) trigger.setAttribute('aria-controls', select.id + '-menu');

        const label = document.createElement('span');
        label.className = 'nf-select-label';
        trigger.appendChild(label);

        const chevron = document.createElement('span');
        chevron.className = 'nf-select-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        trigger.appendChild(chevron);

        const menu = document.createElement('div');
        menu.className = 'nf-select-menu';
        menu.setAttribute('role', 'listbox');
        if (select.id) menu.id = select.id + '-menu';

        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);

        const component = {
            select,
            wrapper,
            trigger,
            label,
            menu,
            selectObserver: null
        };

        components.set(select, component);
        syncComponent(component, true);

        trigger.addEventListener('click', function () {
            if (wrapper.classList.contains('open')) {
                closeOpenSelect();
                return;
            }
            openSelect(component, false);
        });

        trigger.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!wrapper.classList.contains('open')) openSelect(component, true);
                else focusOption(component, 1);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!wrapper.classList.contains('open')) openSelect(component, true);
                else focusOption(component, -1);
                return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (wrapper.classList.contains('open')) closeOpenSelect();
                else openSelect(component, true);
                return;
            }
            if (event.key === 'Escape' && wrapper.classList.contains('open')) {
                event.preventDefault();
                closeOpenSelect();
            }
        });

        menu.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                focusOption(component, 1);
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                focusOption(component, -1);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                closeOpenSelect();
                trigger.focus();
                return;
            }
            if (event.key === 'Tab') {
                closeOpenSelect();
            }
        });

        select.addEventListener('change', function () {
            syncComponent(component, false);
        });
        select.addEventListener('input', function () {
            syncComponent(component, false);
        });

        const selectObserver = new MutationObserver(function () {
            syncComponent(component, true);
        });
        selectObserver.observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'label', 'selected']
        });
        component.selectObserver = selectObserver;

        return component;
    }

    function getSelectsFromRoot(root) {
        if (!root) return [];
        if (root instanceof HTMLSelectElement) return [root];
        if (!(root instanceof Element) && root !== document) return [];

        const scope = root === document ? document : root;
        const list = Array.from(scope.querySelectorAll('select'));
        if (root instanceof Element && root.matches('select')) list.unshift(root);
        return list;
    }

    function refreshCustomSelects(root) {
        const selects = getSelectsFromRoot(root || document);
        selects.forEach((select) => {
            const component = enhanceSelect(select);
            if (component) syncComponent(component, true);
        });
    }

    function observeDom() {
        if (domObserver || !document.body) return;
        domObserver = new MutationObserver(function (mutations) {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    refreshCustomSelects(node);
                });
            });
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    }

    function patchSelectSetters() {
        if (valuePatched || typeof HTMLSelectElement === 'undefined') return;
        valuePatched = true;

        try {
            const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            if (valueDescriptor && valueDescriptor.configurable && typeof valueDescriptor.set === 'function') {
                Object.defineProperty(HTMLSelectElement.prototype, 'value', {
                    configurable: true,
                    enumerable: valueDescriptor.enumerable,
                    get: function () {
                        return valueDescriptor.get.call(this);
                    },
                    set: function (next) {
                        valueDescriptor.set.call(this, next);
                        const component = components.get(this);
                        if (component) {
                            window.requestAnimationFrame(function () {
                                syncComponent(component, true);
                            });
                        }
                    }
                });
            }

            const indexDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
            if (indexDescriptor && indexDescriptor.configurable && typeof indexDescriptor.set === 'function') {
                Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
                    configurable: true,
                    enumerable: indexDescriptor.enumerable,
                    get: function () {
                        return indexDescriptor.get.call(this);
                    },
                    set: function (next) {
                        indexDescriptor.set.call(this, next);
                        const component = components.get(this);
                        if (component) {
                            window.requestAnimationFrame(function () {
                                syncComponent(component, true);
                            });
                        }
                    }
                });
            }
        } catch (error) {
            // If prototype patching is blocked, change/input and mutation observers still keep sync.
        }
    }

    function initCustomSelects() {
        patchSelectSetters();
        refreshCustomSelects(document);
        observeDom();

        document.addEventListener('pointerdown', function (event) {
            if (!openComponent) return;
            if (!openComponent.wrapper.contains(event.target)) {
                closeOpenSelect();
            }
        }, true);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && openComponent) {
                const trigger = openComponent.trigger;
                closeOpenSelect();
                trigger.focus();
            }
        });

        window.addEventListener('resize', closeOpenSelect);
    }

    window.refreshCustomSelects = refreshCustomSelects;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomSelects, { once: true });
    } else {
        initCustomSelects();
    }
})();
