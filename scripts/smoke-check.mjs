import fs from 'node:fs';

const failures = [];

function assert(condition, message) {
    if (!condition) failures.push(message);
}

function readFile(path) {
    return fs.readFileSync(path, 'utf8');
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasId(html, id) {
    const pattern = new RegExp(`id=["']${escapeRegex(id)}["']`, 'i');
    return pattern.test(html);
}

function extractSelectOptions(html, selectId) {
    const selectPattern = new RegExp(
        `<select[^>]*id=["']${escapeRegex(selectId)}["'][^>]*>([\\s\\S]*?)<\\/select>`,
        'i'
    );
    const match = html.match(selectPattern);
    if (!match) return null;

    const values = [];
    const optionPattern = /<option[^>]*value=["']([^"']+)["'][^>]*>/gi;
    let optionMatch = optionPattern.exec(match[1]);
    while (optionMatch) {
        values.push(String(optionMatch[1]).toLowerCase());
        optionMatch = optionPattern.exec(match[1]);
    }
    return values;
}

function hasText(content, text) {
    return content.includes(text);
}

const html = readFile('NoteflowAtelier.html');
const appJs = readFile('app.js');
const styles = readFile('styles.css');
const businessJs = readFile('business-workspace.js');

const requiredIds = [
    'searchInput',
    'globalSearch',
    'sidebarSearchFeedback',
    'toolbarScrollLeft',
    'toolbarScrollRight',
    'timerSettings',
    'notesExportFormatSelect',
    'exportModalFormatSelect'
];
requiredIds.forEach(id => assert(hasId(html, id), `Missing expected DOM id: ${id}`));

const expectedExportFormats = ['json', 'docx', 'pdf', 'html', 'md', 'txt', 'rtf', 'doc'];
const settingsFormats = extractSelectOptions(html, 'notesExportFormatSelect');
const modalFormats = extractSelectOptions(html, 'exportModalFormatSelect');

assert(Array.isArray(settingsFormats), 'Could not read #notesExportFormatSelect options');
assert(Array.isArray(modalFormats), 'Could not read #exportModalFormatSelect options');

if (Array.isArray(settingsFormats) && Array.isArray(modalFormats)) {
    expectedExportFormats.forEach(format => {
        assert(settingsFormats.includes(format), `Settings export select missing format: ${format}`);
        assert(modalFormats.includes(format), `Export modal missing format: ${format}`);
    });

    settingsFormats.forEach(format => {
        assert(modalFormats.includes(format), `Settings export format not present in modal: ${format}`);
    });

    modalFormats.forEach(format => {
        assert(settingsFormats.includes(format), `Modal export format not present in settings: ${format}`);
    });
}

assert(
    hasText(appJs, "normalizeSettingChoice(dataSource.defaultExportFormat, ['json', 'docx', 'pdf', 'html', 'md', 'txt', 'rtf', 'doc']"),
    'defaultExportFormat normalization allowlist is missing expected formats'
);
assert(hasText(appJs, 'function updateScrollButtons()'), 'Toolbar overflow helper missing: updateScrollButtons');
assert(hasText(appJs, 'function ensureInlineValidationHint(inputEl)'), 'Inline validation helper missing');
assert(hasText(styles, '.business-chart-empty'), 'Business chart empty-state style missing');
assert(
    hasText(styles, '.sidebar .focus-timer.expanded .timer-settings'),
    'Timer settings overflow containment style missing'
);
assert(
    hasText(businessJs, 'No income or expense entries yet.') && hasText(businessJs, 'No invoice data yet.'),
    'Business chart empty-state copy missing'
);

if (failures.length) {
    console.error('Smoke checks failed:');
    failures.forEach((failure, index) => {
        console.error(`${index + 1}. ${failure}`);
    });
    process.exit(1);
}

console.log('Smoke checks passed.');
