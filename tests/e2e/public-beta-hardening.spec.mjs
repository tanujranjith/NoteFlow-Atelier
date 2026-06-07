import { expect, test } from '@playwright/test';

const thirdPartyPattern = /^https?:\/\/(?!127\.0\.0\.1|localhost)/i;
const BACKUP_PASSWORD = 'public beta encrypted backup';

async function completeOnboarding(page) {
  await page.evaluate(() => {
    try {
      if (typeof window.markStudentOnboardingCompleted === 'function') {
        window.markStudentOnboardingCompleted(true);
      } else if (typeof markStudentOnboardingCompleted === 'function') {
        markStudentOnboardingCompleted(true);
      }
    } catch (error) {}
    const overlay = document.getElementById('studentOnboardingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('display', 'none', 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    }
  });
  await expect(page.locator('#studentOnboardingOverlay')).toBeHidden();
}

async function openApp(page) {
  const requests = [];
  page.on('request', request => {
    const url = request.url();
    if (thirdPartyPattern.test(url)) requests.push(url);
  });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/Sutra.html');
  await page.waitForSelector('#storageOptions', { state: 'attached' });
  await completeOnboarding(page);
  await expect(page.locator('[data-sutra-component="brand-mark"]').first()).toBeVisible();
  return { requests, consoleErrors };
}

test('fresh startup makes no third-party requests and exposes CSP', async ({ page }) => {
  const { requests } = await openApp(page);
  expect(requests, 'unexpected third-party startup requests').toEqual([]);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain('https://api.openai.com');
  expect(csp).toContain('https://docs.google.com');
});

test('quota failure shows persistent banner and retry recovery clears it', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    const failingIndexedDb = {
      open() {
        throw new DOMException('Simulated quota exhaustion', 'QuotaExceededError');
      }
    };
    Object.defineProperty(window, 'indexedDB', { value: failingIndexedDb, configurable: true });
    try { await window.saveWorkspaceLocally(); } catch (error) {}
  });
  await expect(page.locator('#sutraSaveFailureBanner')).toBeVisible();
  await expect(page.locator('#sutraSaveFailureMessage')).toContainText('quota');

  await page.reload();
  await page.waitForSelector('#storageOptions', { state: 'attached' });
  await completeOnboarding(page);
  await expect(page.locator('#sutraSaveFailureBanner')).toBeVisible();
  await page.evaluate(() => window.SutraPersistenceHealth.retry());
  await expect(page.locator('#sutraSaveFailureBanner')).toBeHidden();
  await expect(page.locator('#taskbarSaveStatus')).toContainText(/Saved/i);
});

test('IndexedDB transaction failure is classified and preserves in-memory state', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: { open() { throw new DOMException('Simulated IndexedDB failure', 'InvalidStateError'); } }
    });
    try { await window.saveWorkspaceLocally(); } catch (error) {}
  });
  await expect(page.locator('#sutraSaveFailureBanner')).toBeVisible();
  await expect(page.locator('#sutraSaveFailureMessage')).toContainText(/indexeddb|transaction/i);
  const state = await page.evaluate(() => window.SutraPersistenceHealth.getState());
  expect(state.lastFailure.kind).toMatch(/indexeddb|transaction/);
});

test('last-saved transition updates taskbar and Storage Health', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.saveWorkspaceLocally());
  await expect(page.locator('#taskbarSaveStatus')).toContainText(/Saved/i);
  const state = await page.evaluate(() => window.SutraPersistenceHealth.getState());
  expect(state.lastConfirmedSaveAt).toBeTruthy();
  expect(state.lastSerializedBytes).toBeGreaterThan(0);
});

test('emergency .sutra export downloads when required blobs are present', async ({ page }) => {
  await openApp(page);
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(password => window.SutraPersistenceHealth.exportEmergencyBackup({ passphrase: password }), BACKUP_PASSWORD);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^sutra_emergency_workspace_.*\.sutra$/);
});

test('required missing attachment refuses emergency export and surfaces warning', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.__sutraPublicBetaTestHooks.injectMissingCourseAttachment());
  const result = await page.evaluate(password => window.SutraPersistenceHealth.exportEmergencyBackup({ passphrase: password }), BACKUP_PASSWORD);
  expect(result).toBe(false);
  await expect(page.locator('#sutraSaveFailureBanner')).toBeVisible();
  await expect(page.locator('#sutraSaveFailureMessage')).toContainText(/attachment/i);
});

test('corrupt .sutra import is refused without replacing workspace', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const before = window.serializeWorkspace({ mode: 'json', includeSensitiveSettings: false });
    const beforeCount = before.pages.length;
    const corrupt = new File(['not a zip'], 'corrupt.sutra', { type: 'application/octet-stream' });
    await window.importWorkspaceFile(corrupt);
    const after = window.serializeWorkspace({ mode: 'json', includeSensitiveSettings: false });
    return {
      beforeCount,
      afterCount: after.pages.length,
      sameFirstPage: before.pages[0] && after.pages[0] ? before.pages[0].id === after.pages[0].id : before.pages.length === after.pages.length
    };
  });
  expect(result.afterCount).toBe(result.beforeCount);
  expect(result.sameFirstPage).toBe(true);
});

test('wipe-and-restore JSON plus legacy .atelier import preserve workspace data', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    const now = new Date().toISOString();
    const base = window.serializeWorkspace({ mode: 'json', includeSensitiveSettings: false });
    const restoredTitle = `Restore QA ${Date.now()}`;
    const legacyTitle = `Legacy Atelier QA ${Date.now()}`;
    const restoredPayload = {
      ...base,
      pages: [{
        ...(base.pages[0] || {}),
        id: 'restore-qa-page',
        title: restoredTitle,
        content: '<p>Restored JSON workspace</p>',
        createdAt: now,
        updatedAt: now
      }]
    };
    const blankPayload = { ...base, pages: [], tasks: [], taskOrder: [] };
    window.deserializeWorkspace(blankPayload);
    window.deserializeWorkspace(restoredPayload);
    const afterRestore = window.serializeWorkspace({ mode: 'json', includeSensitiveSettings: false });

    const legacyPayload = {
      ...restoredPayload,
      pages: [{ ...restoredPayload.pages[0], id: 'legacy-atelier-qa-page', title: legacyTitle }]
    };
    const zip = new window.JSZip();
    zip.file('manifest.json', JSON.stringify({
      product: 'NoteFlow Atelier',
      appName: 'NoteFlow Atelier',
      format: 'noteflow_atelier_project',
      formatVersion: 1,
      schemaVersion: 1,
      assets: []
    }));
    zip.file('workspace.json', JSON.stringify(legacyPayload));
    const blob = await zip.generateAsync({ type: 'blob' });
    await window.importWorkspaceFile(new File([blob], 'legacy-import.atelier', { type: 'application/zip' }));
    const afterLegacy = window.serializeWorkspace({ mode: 'json', includeSensitiveSettings: false });
    return {
      restored: afterRestore.pages.some(page => page.title === restoredTitle),
      legacy: afterLegacy.pages.some(page => page.title === legacyTitle)
    };
  });
  expect(result.restored).toBe(true);
  expect(result.legacy).toBe(true);
});

test('export modal has dialog semantics, traps Tab, and Escape restores focus', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    const existing = document.getElementById('focusRestoreSentinel');
    if (existing) existing.remove();
    const button = document.createElement('button');
    button.id = 'focusRestoreSentinel';
    button.type = 'button';
    button.textContent = 'Focus restore sentinel';
    button.style.position = 'fixed';
    button.style.left = '8px';
    button.style.top = '8px';
    button.style.zIndex = '99999';
    document.body.appendChild(button);
  });
  const focusTarget = page.locator('#focusRestoreSentinel');
  await focusTarget.focus();
  await expect(focusTarget).toBeFocused();
  await page.evaluate(() => window.openExportOptionsModal());
  const modal = page.locator('#exportOptionsModal');
  await expect(modal).toHaveClass(/active/);
  await expect(modal.locator('[role="dialog"]').first()).toBeVisible();

  const firstFocused = await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.textContent || document.activeElement.tagName));
  expect(firstFocused).toBeTruthy();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const focusInside = await page.evaluate(() => !!document.activeElement.closest('#exportOptionsModal'));
  expect(focusInside).toBe(true);
  const listenerCount = await page.evaluate(() => window.SutraModalManager.getListenerCount());
  expect(listenerCount).toBe(1);

  await page.keyboard.press('Escape');
  await expect(modal).not.toHaveClass(/active/);
  await expect(focusTarget).toBeFocused();
});

test('reduced-motion startup still renders the workspace', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openApp(page);
  await expect(page.locator('.app-container')).toBeVisible();
  await expect(page.locator('#sutraStartupIntro')).toBeHidden({ timeout: 15_000 });
});

test('Assistant strips reasoning before rendering, storing, and exporting chat history', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('openai_api_key', 'sk-test-assistant-secret');
    localStorage.setItem('sutra_ai_send_ack_v1', '1');
    localStorage.setItem('chat_provider', 'openai');
    localStorage.setItem('chat_custom_model_by_provider', JSON.stringify({ openai: 'gpt-test-model' }));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(text) {
          window.__copiedAssistantText = String(text || '');
          return Promise.resolve();
        }
      }
    });
  });
  await page.route('https://api.openai.com/v1/chat/completions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: '<think>SECRET_REASONING_SHOULD_NOT_RENDER</think>\nFinal answer only.\n<thinking>UNCLOSED_REASONING_SHOULD_NOT_RENDER'
          }
        }]
      })
    });
  });

  await openApp(page);
  await page.evaluate(() => {
    const provider = document.getElementById('chatProviderSelect');
    const model = document.getElementById('chatCustomModelInput');
    if (provider) {
      provider.value = 'openai';
      provider.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (model) {
      model.value = 'gpt-test-model';
      model.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.evaluate(() => document.getElementById('chatbotBtn').click());
  await expect(page.locator('#chatbotPanel')).toBeVisible();
  await page.fill('#chatInput', 'Give me a short answer.');
  await page.evaluate(() => document.getElementById('chatSendBtn').click());

  await expect(page.locator('#chatbotMessages')).toContainText('Final answer only.');
  await expect(page.locator('#chatbotMessages')).not.toContainText('SECRET_REASONING_SHOULD_NOT_RENDER');
  await expect(page.locator('#chatbotMessages')).not.toContainText('UNCLOSED_REASONING_SHOULD_NOT_RENDER');
  await expect(page.locator('#chatbotMessages')).not.toContainText(/^Thinking$/);

  await page.evaluate(() => {
    const assistantMessages = document.querySelectorAll('#chatbotMessages .chatbot-msg.assistant');
    assistantMessages[assistantMessages.length - 1]?.querySelector('.flow-reply-copy')?.click();
  });
  const copied = await page.evaluate(() => window.__copiedAssistantText || '');
  expect(copied).toContain('Final answer only.');
  expect(copied).not.toContain('SECRET_REASONING_SHOULD_NOT_RENDER');
  expect(copied).not.toContain('UNCLOSED_REASONING_SHOULD_NOT_RENDER');

  await page.evaluate(() => window.saveWorkspaceLocally());
  const stored = await page.evaluate(() => {
    const exported = JSON.stringify(window.serializeWorkspace({ mode: 'json', includeSensitiveSettings: false }));
    return {
      sessionHistory: sessionStorage.getItem('chat_history') || '',
      workspaceHistory: JSON.stringify(window.serializeWorkspace().settings.assistantChatHistory || []),
      exported
    };
  });
  expect(stored.sessionHistory).toContain('Final answer only.');
  expect(stored.workspaceHistory).toContain('Final answer only.');
  expect(stored.sessionHistory).not.toContain('SECRET_REASONING_SHOULD_NOT_RENDER');
  expect(stored.workspaceHistory).not.toContain('SECRET_REASONING_SHOULD_NOT_RENDER');
  expect(stored.exported).not.toContain('SECRET_REASONING_SHOULD_NOT_RENDER');
  expect(stored.sessionHistory).not.toContain('UNCLOSED_REASONING_SHOULD_NOT_RENDER');
  expect(stored.workspaceHistory).not.toContain('UNCLOSED_REASONING_SHOULD_NOT_RENDER');
  expect(stored.exported).not.toContain('UNCLOSED_REASONING_SHOULD_NOT_RENDER');
  expect(stored.exported).not.toContain('sk-test-assistant-secret');

  await page.reload();
  await page.waitForSelector('#storageOptions', { state: 'attached' });
  await completeOnboarding(page);
  await page.evaluate(() => document.getElementById('chatbotBtn').click());
  await expect(page.locator('#chatbotPanel')).toBeVisible();
  await expect(page.locator('#chatbotMessages')).toContainText('Final answer only.');
  await expect(page.locator('#chatbotMessages')).not.toContainText('SECRET_REASONING_SHOULD_NOT_RENDER');
  await expect(page.locator('#chatbotMessages')).not.toContainText('UNCLOSED_REASONING_SHOULD_NOT_RENDER');
});
