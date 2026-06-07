# Sutra Public-Beta Release-Candidate Report

Date: 2026-06-07
Branch: `release/public-beta-hardening`

## Executive Summary

This branch hardens the Sutra Assistant transcript boundary, preserves sanitized
visible chat history across reload and backup restore, updates privacy/backup
documentation to match that behavior, and fixes a Windows path bug in the brand
asset release check.

The staged production artifact is ready for local limited-beta review, but this
is **not a fully verified broad public release**. The supplied Stage 2 audit
password file was empty, so correct-password validation of the provided
`sutra-audit-export-*.sutra` artifacts could not be completed.

## Security Verdict

- Passwordless Stage 1 audit found no recoverable plaintext or sentinel strings
  in the supplied `.sutra` artifacts.
- Stage 1 found a serious supplied-artifact issue: both provided exports were
  byte-identical, including salt, IV, and ciphertext.
- Stage 2 for the supplied artifacts is **not verified** because the local
  disposable password file was empty after Stage 1.
- Generated-fixture browser tests verify current production code produces
  randomized encrypted exports, rejects wrong passwords, rejects tampering
  without local state mutation, and keeps API keys out of storage and exports.

Direct stolen-file answer: **uncertain for the supplied artifacts** because the
correct password was unavailable and the pair was byte-identical. For the current
tested implementation, evidence supports password-protected AES-GCM envelopes
with no plaintext workspace recovery without the password.

## Changes Made

- Removed visible Assistant reasoning/`<think>` rendering.
- Added Assistant transcript sanitization for closed and unclosed reasoning tags
  and reasoning fences.
- Removed raw provider JSON fallback rendering so unsupported provider response
  shapes do not expose hidden fields.
- Prevented Assistant action buttons from falling back to unsanitized raw reply
  text.
- Persisted only sanitized visible Assistant chat history in workspace settings,
  capped to recent messages, while keeping provider API keys session-only.
- Updated backup/privacy/Assistant docs to distinguish sanitized visible chats
  from API keys and raw session mirrors.
- Removed a visible `docs/SUTRA_ASSISTANT.md` path from shipped app copy because
  docs are intentionally excluded from the deploy artifact.
- Fixed `scripts/sutra-brand-assets-check.mjs` Windows path handling by using
  `fileURLToPath()`.

## Evidence

Stage 1/2 artifacts were kept outside the repo under `../security-artifacts/` and
were not staged or committed.

Password-file handling:
- `../security-artifacts.sutra-audit-password.txt`: removed
- `../security-artifacts/.sutra-audit-password.txt`: absent
- Password printed or stored in repo: no

Automated checks:
- Local static/pre-beta suite: passed
  - syntax, smoke, round-trip, version history, rebrand, compatibility, CSP,
    persistence health, modal accessibility, network/CDN, encoding, responsive,
    brand assets, document backgrounds
- Full Chromium E2E: `62 passed`
- Targeted WebKit release smoke: `4 passed`
  - startup/no third-party/CSP
  - emergency `.sutra` export
  - corrupt `.sutra` import refusal
  - Assistant reasoning/storage/export sanitization
- Deploy artifact:
  - `build-deploy-artifact.mjs`: `.deploy/`, 70 files, 9.69 MB
  - `sutra-deploy-artifact-check.mjs`: passed
  - local staged live smoke: passed, no exposed `/tests`, `/scripts`,
    `package.json`, or `.github`, clean headless boot, no unexpected startup
    third-party requests
- Heavy workspace benchmark:
  - 1000 notes, 400 tasks
  - load 1462 ms, render 366 ms, serialize 4 ms, save 2385 ms
  - `.sutra` export 285 ms, import 3287 ms, JSON size 3.73 MB

## Known Limitations and Deferred Work

- Supplied `.sutra` Stage 2 correct-password restore could not be verified
  because the password file was empty.
- The two supplied `.sutra` files are byte-identical; rerun the disposable audit
  with a fresh non-empty password and independently generated export pair.
- Full WebKit matrix timed out locally after 30 minutes; the bounded WebKit
  release smoke passed.
- Firefox was not installed locally; adding it requires a network browser
  download.
- Live Google OAuth, physical iOS/Android file picker behavior, real production
  deployment smoke, social preview validation, and real post-deploy checks were
  not run because this branch was not deployed and no production secrets were
  used.
- Broader product-polish items from the master prompt that are not covered by
  this branch should remain deferred unless separately verified.

## Release Call

This branch is suitable for a **draft PR and limited local beta review** with the
evidence above. Broader public release remains blocked until the supplied
password-based `.sutra` audit is rerun successfully and the remaining manual and
cross-browser checks are completed.
