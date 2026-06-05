# Data and Backups

_How Sutra stores your workspace locally, and how the `.sutra` backup format
exports and restores it. For a verified, implementation-level audit of the
persistence and round-trip behavior, see the companion
[`sutra-save-systems-audit.md`](./sutra-save-systems-audit.md)._

---

## 1. Persistence architecture

Sutra keeps your workspace on your device in a small number of local stores.
Several store names are **legacy-named compatibility identifiers** — retained
unchanged across the rename to Sutra so existing installs keep working. The name
is only an identifier; the data is always local.

### Primary store — the workspace (IndexedDB)

- Your entire workspace is a single `appData` object held in **IndexedDB**.
- **Database:** `noteflow_atelier_db` · **store:** `workspace` · **key:** `root`.
- It is hydrated through one merge/normalize path on load and written through one
  debounced save path, with a synchronous flush on page-hide / unload so
  in-progress edits are not lost.

### Attachments — binary files (IndexedDB)

- Course-file **binaries** live in a separate IndexedDB database,
  `noteflow_attachments_db`, store `blobs`, keyed per file.
- Only the **bytes** live here. Each file's **metadata** lives in the workspace
  (`appData.courseWorkspace.files[]`).

### Homework — localStorage mirror

- Homework is the homework module's own source of truth in **localStorage**:
  `hwCourses:v2` and `hwTasks:v2` (with legacy `:v1` keys read for migration).
- It is **mirrored** into `appData.homeworkWorkspace` at save time and **restored
  to localStorage** on import, so it travels in backups while remaining the live
  source of truth at runtime.

### Other local data

- A curated allow-list of standalone **localStorage preferences** is embedded in
  exports (focus-timer state, streak settings, AI provider/model **choices**, the
  Assistant Activity log, and a couple of feature flags).
- **Secrets** (AI provider API keys) live in **`sessionStorage` only** — never in
  localStorage, never in IndexedDB, never exported.

---

## 2. The `.sutra` package

**`.sutra`** is the **default** backup format. Exporting produces a single file
named:

```
sutra_workspace_<YYYY-MM-DD>.sutra
```

It is a **ZIP package** with this structure:

```
manifest.json                     # identifies and describes the backup
workspace.json                    # the full serialized workspace payload
assets/                           # extracted binary/inline assets (deduped)
  <asset files>
metadata/
  export-summary.json             # human-readable summary of what was exported
  checksums.json                  # checksums for integrity verification
```

How assets are handled: inline `data:` assets in your workspace — inline note
images and **Document Background** images — are extracted out of the JSON into
the `assets/` folder (deduplicated by content), each with a **checksum**, and
referenced from `workspace.json`. Course-file binaries from the attachments
database are likewise carried in the package. On import the assets are rehydrated
back into the workspace. This keeps the JSON lean and gives every binary an
integrity check.

### Manifest fields

`manifest.json` identifies the package as Sutra's and records its format. The
identifying fields include:

```json
{
  "product": "Sutra",
  "format": "sutra-workspace",
  "formatVersion": 1,
  "legacyCompatible": true,
  "appName": "Sutra"
}
```

along with export metadata and a content summary (per-section counts plus asset
and warning counts) and the asset list with per-asset checksum information.

---

## 3. Export vs. import flows

### Export

From **Settings → Data** you can export either:

- **`.sutra`** — the packaged ZIP described above (default), or
- **JSON** — a single-file projection of the same workspace payload with assets
  inlined (no zip dependency).

Both export paths build the workspace payload **with secrets stripped**: API
keys and other secret-shaped fields are redacted, so credentials are never
written to a backup. Provider/model **choices** (not secrets) are included.

### Import

Importing a backup rebuilds every runtime collection from the file, restores the
course-file binaries into the attachments database, restores the homework
localStorage snapshot, re-applies your theme and preferences, **re-renders every
view**, and writes the result straight back to IndexedDB so the import is durable
across the next reload.

### Legacy `.atelier` import

Older **`.atelier`** backups still import. The import validator accepts **both**
the new `sutra-workspace` manifest **and** the legacy `noteflow_atelier_project`
manifest, and the import dispatcher routes **both** `.sutra` and `.atelier` files
to the **same package importer**. Old backups are never broken.

Plugins follow the same pattern: the new export extension is **`.sutra-plugin`**,
and legacy **`.atelier-plugin`** bundles still import.

---

## 4. Storage Health

> Public-beta hardening note: the app now treats this as **Storage Health**.
> It includes last confirmed save, approximate workspace/localStorage size,
> attachment counts and cached bytes, warnings, and backup state. If a save
> cannot be confirmed, Sutra shows a non-dismissible banner with Retry,
> Emergency `.sutra` Export, Technical Details, last-confirmed-save time, and
> attachment warnings. The live in-memory workspace is preserved; do not close
> the tab until a save recovers or an emergency backup downloads.

Full `.sutra` packaging uses the vendored local JSZip build in
`assets/vendor/jszip/`, so core backups do not require a CDN request. If a
required attachment blob is missing or cannot be warmed from IndexedDB, Sutra
refuses the `.sutra` export instead of creating a partial backup.

Sutra surfaces a small **Storage Health** readout (formerly "Local Data
Health") so you can see your backup posture at a glance:

- **Last Backup** — when you last exported your workspace.
- **Last Restore** — when you last imported a backup.

Use it as a reminder to take fresh `.sutra` backups periodically, since there is
no cloud copy.

---

## 5. Pre-import safety snapshot

Importing replaces your current workspace, so before applying an import Sutra
takes a **pre-import safety snapshot** of your existing data first. If an import
is not what you expected, this snapshot is your fallback — the import is not a
one-way door that discards your prior state with no recourse.

---

## 6. What travels vs. what's excluded

**Travels in a backup (`.sutra` and JSON):**

- All notes (content, structure, inline images, **Document Backgrounds**, locked-
  page lock data), spaces, pinned pages.
- Tasks, time blocks, homework (courses + assignments), Course Hub metadata
  **and file binaries**.
- Testing Hub, AP Study, Review, College, Academic, Life, Projects & Work data.
- Streaks, habits, cram sessions, focus templates, split-view contexts.
- Settings, themes and custom themes, onboarding state.
- Assistant **preferences** and **provider/model choices**; the **Assistant
  Activity** log (`sutra:activityLog:v1`, migrated from `flow:activityLog:v1`) —
  not a secret, so it travels.

**Excluded by design:**

- **AI provider API keys / secrets** — `sessionStorage` only; redacted from
  exports. Re-enter after import.
- **Conversation history** — session-local.
- **Regenerable caches** and ephemeral UI state (e.g. scroll position, the
  in-session unlocked-page set) — not exported; locked pages correctly require
  the PIN again after a reload.

---

## 7. Round-trip guarantees

Sutra's persistence and `.sutra`/`.atelier` portability are designed and verified
to round-trip a rich workspace. As documented in the
[save-systems audit](./sutra-save-systems-audit.md), a full destructive cycle —
**edit → refresh → reopen → clear in-memory state → export → wipe all storage →
import → refresh** — restores notes, inline images, tasks and their note links,
course files **and their binaries**, homework, and the rest of the workspace,
with cross-feature relationships (IDs and links) preserved. Static parity checks
guard against silent field drift, and a behavioral QA harness exercises the live
round-trip in a browser.

---

## 8. Recovery

- **Lost or corrupted workspace:** import your most recent `.sutra` (or JSON, or
  legacy `.atelier`) backup from Settings → Data.
- **Unexpected import:** fall back to the **pre-import safety snapshot** taken
  automatically before the import.
- **App misbehaving (CSS/plugins), data intact:** load in **Safe Mode**
  (`?sutraSafeMode=1`, legacy `?atelierSafeMode=1`, or hold **Shift** on load),
  which skips custom CSS and plugins and **never deletes** anything.
- **Fully offline:** both **JSON** and core **`.sutra`** backup paths are designed
  to work without third-party requests.
  Core `.sutra` backup uses the vendored JSZip library under
  `assets/vendor/jszip/`, so it should not require a third-party request.

---

## 9. Storage names quick reference

| Store | Type | Holds | Note |
|---|---|---|---|
| `noteflow_atelier_db` (store `workspace`, key `root`) | IndexedDB | The whole `appData` workspace | Legacy-named compatibility identifier |
| `noteflow_attachments_db` (store `blobs`) | IndexedDB | Course-file binaries | Legacy-named compatibility identifier |
| `hwCourses:v2`, `hwTasks:v2` | localStorage | Homework (source of truth) | Mirrored into `appData.homeworkWorkspace` |
| Curated preference keys | localStorage | Focus timer, streak settings, provider/model choices, Assistant Activity | Embedded in exports |
| API keys, chat history | sessionStorage | Secrets + conversation | Never persisted, never exported |

For the authoritative, line-referenced behavior and the verification scripts,
read [`sutra-save-systems-audit.md`](./sutra-save-systems-audit.md).
