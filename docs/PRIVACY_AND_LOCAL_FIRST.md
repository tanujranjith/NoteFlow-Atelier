# Privacy and Local-First

_Sutra is a private, local-first workspace for students. This document is the
plain statement of what that means: where your data lives, what never leaves
your device, and how to take it with you or wipe it completely._

`PRIVATE · LOCAL-FIRST · STUDENT-BUILT`

---

## 1. The local-first philosophy

Sutra is built so that **your workspace belongs to you and stays on your
device.** It is a **static web app** — it runs from static hosting or directly
from a local file, with:

- **no backend** of Sutra's own,
- **no required accounts** — there is nobody to sign up with,
- **no telemetry** — Sutra does not phone home or track usage,
- **no cloud sync** — nothing is silently copied to a server.

Your notes, tasks, homework, study data, and settings are read and written
locally. Sutra does not need a network connection to open your workspace or to
work in it.

---

## 2. What stays on your device

**Everything.** Your entire workspace — every note (including inline images and
**Document Background** images), task, time block, homework course and
assignment, Testing Hub and AP Study data, Review decks, College and Life and
Projects & Work data, streaks and habits, focus templates, themes, preferences,
and onboarding state — is stored locally in your browser. None of it is sent
anywhere by Sutra.

---

## 3. What is never exported

Some things are deliberately kept out of every backup file:

- **AI provider API keys / credentials / tokens.** These live in
  **`sessionStorage` only** (this browser session) and are **never written to
  long-term storage and never included in any export** — `.sutra` or JSON. When
  you export your workspace, the exporter actively **redacts** any nested
  secret-shaped field (keys, tokens, passwords) so credentials cannot ride along
  by accident.
- **Conversation history** with the Assistant is session-local and not exported.

Your provider and model **choices** (which are not secrets) do travel, so a
restored workspace keeps its setup and only needs the key re-entered.

---

## 4. Where your data lives

Sutra uses your browser's local storage facilities:

- **IndexedDB** holds the bulk of your workspace and your binary attachments.
- **localStorage** holds homework data and a small set of preferences.
- **sessionStorage** holds only session-scoped, never-persisted items —
  principally your AI API keys and chat history.

Some of these stores carry **legacy-named compatibility identifiers** — for
example the workspace database is named `noteflow_atelier_db` and the
attachments database `noteflow_attachments_db`. These names are **retained on
purpose so existing installs keep working** across the rename to Sutra; the name
is just an identifier and does not change where the data lives (still your
device). For the full layout, see [`DATA_AND_BACKUPS.md`](./DATA_AND_BACKUPS.md).

---

## 5. AI requests: browser → the provider you choose

Sutra Assistant can use a language model, but **Sutra runs no model servers of
its own.** When a reply needs a model, the request goes **directly from your
browser to the AI provider you have chosen** (OpenAI, Anthropic Claude, Google
Gemini, Groq, OpenRouter, or a Custom OpenAI-Compatible / Local endpoint). There
is no Sutra relay in the middle.

The local signal layer — **Sutra Intelligence** — that reads your workspace to
understand overdue work, workload, conflicts, weak areas, review backlog, and
next steps **runs entirely on your device and calls no server.** Only the
content you actually send in a message (bounded by your **Workspace Access**
setting) reaches the provider. See [`SUTRA_ASSISTANT.md`](./SUTRA_ASSISTANT.md)
for details and the always-visible privacy badge.

If you want even the AI side to stay on your own machine or network, point Sutra
at a **Local / Custom OpenAI-Compatible endpoint**.

---

## 6. Document Background images are local

A note's **Document Background** is stored as image data on the page itself
(an inline data URL), alongside your other content on your device. It is never
uploaded by Sutra and only leaves your device if **you** export a backup or a
note that includes it. A **locked page never reveals its background behind the
PIN screen.** See [`DOCUMENT_BACKGROUNDS.md`](./DOCUMENT_BACKGROUNDS.md).

---

## 7. Locked pages

Sutra can **PIN-lock individual pages.** A locked page requires the PIN to be
re-entered after a reload — the in-session "unlocked" state is intentionally
**not persisted** — and its content (including any Document Background) stays
gated behind the lock screen. The lock is part of the page's stored data and
travels in backups, so a restored page is still locked.

---

## 8. How to export and own your data

Because there is no cloud, **you** hold the master copy. From **Settings → Data**
you can export your whole workspace as a portable file:

- **`.sutra`** — the default backup format, a self-contained package of your
  workspace plus its assets (with checksums).
- **JSON** — a single-file projection with assets inlined.

Both round-trip your data so you can move between browsers or machines, or keep
offline copies. Legacy **`.atelier`** backups still import, so older archives are
never stranded. Full details — package structure, what travels, and recovery —
are in [`DATA_AND_BACKUPS.md`](./DATA_AND_BACKUPS.md).

Keep your backups somewhere you trust: a `.sutra`/JSON file contains your
workspace content (it does **not** contain your API keys, which are never
exported).

---

## 9. How to fully wipe your data

Because everything is local, wiping Sutra is a matter of clearing this site's
local storage:

1. **Export a backup first** (Settings → Data) if you might want your data back —
   once cleared, it is gone, as there is no server copy.
2. In your browser's site-data controls (for example DevTools → Application →
   **Clear storage**, or the browser's per-site "clear data" option), clear the
   storage for the Sutra page. This empties the IndexedDB databases
   (`noteflow_atelier_db`, `noteflow_attachments_db`) and the localStorage keys.
3. Reload. Sutra comes back **empty / at defaults**, as a fresh workspace.

Session-only items (API keys, chat history) also clear automatically when the
browser session ends.

> Tip: if Sutra ever misbehaves and you only want to disable custom CSS and
> plugins **without** deleting anything, use **Safe Mode** instead of wiping —
> add `?sutraSafeMode=1` to the URL (or hold **Shift** while loading). Safe Mode
> **never deletes** data, CSS, plugins, or your workspace.

---

## 10. Privacy at a glance

| Question | Answer |
|---|---|
| Is there a Sutra server storing my data? | No. Static app, no backend, no cloud sync. |
| Do I need an account? | No. |
| Does Sutra track me / send telemetry? | No. |
| Where does my workspace live? | Locally — IndexedDB + localStorage in your browser. |
| Do AI requests go through Sutra? | No. Browser → the provider you choose. Sutra runs no model servers. |
| Are my API keys saved or exported? | No. Session-only, never persisted, never exported (and actively redacted from exports). |
| Does the local Intelligence layer call a server? | No. It computes signals on-device. |
| Can I take my data with me? | Yes — export `.sutra` or JSON; legacy `.atelier` still imports. |
| Can I delete everything? | Yes — clear this site's storage; nothing remains on any server. |
