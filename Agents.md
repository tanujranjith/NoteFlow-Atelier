\# AGENTS.md



\## Project mission



This repository is a production-like local-first productivity application called NoteFlow Atelier. The codebase has accumulated multiple development styles and AI-generated changes over time. Your job is to improve code quality, architecture clarity, UX consistency, and stability \*\*without breaking existing product functionality\*\*.



This is a \*\*stabilization and cleanup repo\*\*, not a greenfield build.



\## Primary rule



\*\*Do not destroy, regress, or silently change working product behavior.\*\*



Every change must preserve existing functionality unless one of the following is true:



1\. A behavior is clearly broken.

2\. A behavior is clearly misleading or inconsistent.

3\. A change is required to fix a validated issue from the audit list.

4\. A small UI wording or layout adjustment is necessary to make the product more coherent.



If a fix risks changing behavior in a meaningful way, take the safest path:

\- make the smallest possible patch,

\- isolate the change,

\- document the risk,

\- and avoid broad rewrites.



\## What success looks like



A successful change:

\- keeps the site working,

\- preserves current product capabilities,

\- fixes real issues,

\- reduces fragility,

\- improves maintainability,

\- and leaves the repo more truthful and easier to reason about.



A failed change:

\- breaks UI flows,

\- removes product capabilities,

\- changes behavior unnecessarily,

\- introduces architectural churn for no reason,

\- or performs a flashy refactor that makes the code harder to trust.



\## Non-negotiable guardrails



1\. \*\*Preserve all current product functionality.\*\*

&#x20;  - Do not remove features.

&#x20;  - Do not simplify by deleting logic unless it is provably dead.

&#x20;  - Do not replace working flows with placeholders or partial rewrites.



2\. \*\*Make the smallest correct change.\*\*

&#x20;  - Prefer surgical fixes over sweeping rewrites.

&#x20;  - Prefer extraction over reinvention.

&#x20;  - Prefer adapting the current architecture over introducing a new framework.



3\. \*\*Do not perform speculative redesigns.\*\*

&#x20;  - This is not a product reimagining task.

&#x20;  - Do not invent new UX paradigms unless explicitly asked.

&#x20;  - Do not add major new features while fixing architecture.



4\. \*\*Do not rewrite the app shell unless absolutely necessary.\*\*

&#x20;  - Large HTML/JS files may be decomposed gradually.

&#x20;  - If extracting logic, preserve exact behavior and DOM contracts.



5\. \*\*Do not change persistence recklessly.\*\*

&#x20;  - Be extremely conservative with IndexedDB, localStorage, save timing, migrations, and hydration logic.

&#x20;  - Avoid data-loss risk.

&#x20;  - If persistence changes are needed, keep them backward-compatible.



6\. \*\*Do not delete files unless verified safe.\*\*

&#x20;  - If a file looks stale, confirm it is unused before removing it.

&#x20;  - If uncertain, move it to an archive/deprecated folder rather than deleting it.



7\. \*\*Do not silently change product language or labels.\*\*

&#x20;  - If terminology must be unified, update all affected surfaces consistently.

&#x20;  - Document the change.



8\. \*\*Do not break CSS or responsive behavior while cleaning up structure.\*\*

&#x20;  - Visual regressions count as failures.

&#x20;  - Keep theme behavior intact.



9\. \*\*Do not replace logic with TODOs.\*\*

&#x20;  - No fake fixes.

&#x20;  - No partial stubs presented as complete solutions.



10\. \*\*Do not prioritize elegance over reliability.\*\*

&#x20;   - Stable, boring, predictable fixes are preferred.



\## Required working style



When working in this repo, always follow this sequence:



\### 1. Inspect first

Before editing:

\- inspect relevant files,

\- trace how the feature actually works,

\- identify dependencies,

\- and map the issue to the real code path.



Do not assume architecture from filenames alone.



\### 2. Make a plan

Before making changes, produce a short plan:

\- what issue is being fixed,

\- what files are involved,

\- what behavior must remain unchanged,

\- what could regress if done poorly.



\### 3. Change in small batches

Group edits into small logical batches. Avoid giant multi-system edits unless the task truly requires them.



\### 4. Validate after each batch

After each meaningful batch:

\- run tests if present,

\- run lint if present,

\- run build if present,

\- run static checks if useful,

\- search for broken references if names changed.



If no tests exist, do lightweight verification:

\- inspect affected call sites,

\- search for selectors/IDs/strings,

\- check for unmatched references,

\- confirm event bindings and state flow.



\### 5. Report precisely

At the end, report:

\- what changed,

\- which files changed,

\- what issues were fixed,

\- what was deferred,

\- and what should be manually QA tested.



\## Repo priorities



\### Highest priority

These are the fixes that matter most and should be handled first, carefully:



1\. Fix real bugs that break trust.

&#x20;  - Example: fields that appear filled but fail validation.

&#x20;  - Example: search UI that does not communicate results properly.

&#x20;  - Example: settings that apply inconsistently.



2\. Eliminate silent failure paths.

&#x20;  - Replace swallowed errors with safe logging and user feedback where appropriate.



3\. Reduce data-loss risk.

&#x20;  - Save flushing, persistence consistency, and safe hydration behavior come before cosmetic cleanup.



4\. Remove user-facing inconsistency that makes the product feel broken.

&#x20;  - Terminology mismatches.

&#x20;  - “Legacy” labels in live UI.

&#x20;  - misleading controls or dead-feeling affordances.



5\. Reduce architecture risk carefully.

&#x20;  - Break up monoliths only when behavior can be preserved.

&#x20;  - Extract modules with explicit interfaces.

&#x20;  - Avoid introducing regressions during decomposition.



\### Medium priority

\- CSS organization cleanup.

\- Modal consolidation.

\- Linting and formatting setup.

\- Better validation states.

\- Accessibility improvements.

\- Responsive consistency.



\### Lower priority

\- visual hierarchy polish,

\- onboarding improvements,

\- discoverability enhancements,

\- secondary navigation refinements,

\- export feedback polish,

\- keyboard shortcut additions.



\## Authoritative issue list



Use this issue list as the main source of truth for stabilization work:



1\. `app.js` is too monolithic.

2\. `NoteflowAtelier.html` is overloaded.

3\. README, package.json, runtime flow, and real architecture do not align.

4\. Global state is duplicated across `appData` and hydrated globals.

5\. Persistence is inconsistent, especially IndexedDB vs localStorage usage.

6\. Silent `catch` blocks hide failures.

7\. Debounced saves may risk data loss on close.

8\. Sensitive credentials may be stored too casually.

9\. Stale/dead/temp files clutter the repo.

10\. Unused or misleading dependencies exist.

11\. Build tooling does not match runtime reality.

12\. Separation of concerns is weak across HTML/CSS/JS.

13\. Giant `innerHTML` and template-string rendering is fragile.

14\. CSS is too large, patch-layered, and inconsistent.

15\. Feature modules rely too much on globals.

16\. Modal logic is duplicated.

17\. Naming/style consistency is weak.

18\. Tooling guardrails are weak or missing.

19\. Accessibility gaps exist.

20\. Responsive behavior is inconsistent.

21\. Search UX lacks clear result feedback.

22\. Search expansion may overlap content.

23\. AP Study units field fails validation despite appearing filled.

24\. Validation feedback is weak.

25\. User-facing “Legacy” labels should be removed.

26\. “Add Event” vs “Add Time Block” wording is inconsistent.

27\. “Plan My Day” starts from day-start instead of now.

28\. Toolbar overflow UX is confusing.

29\. Settings apply-model is inconsistent.

30\. Navigation patterns across modules are inconsistent.

31\. Heading hierarchy is visually weak.

32\. Business charts need proper empty states.

33\. Sidebar note actions are not discoverable enough.

34\. Timer settings expansion harms layout.

35\. Focus mode lacks a shortcut.

36\. Export feedback is too silent.

37\. AP Study repeats “Set exam time” too many times.

38\. Onboarding and empty-state guidance need improvement.



\## How to handle refactors



Refactors are allowed only if they satisfy all of the following:

\- they preserve behavior,

\- they reduce complexity,

\- they improve maintainability,

\- they are scoped,

\- and they are verifiable.



Preferred refactor pattern:

1\. extract small helpers,

2\. keep old behavior intact,

3\. preserve public function names or call contracts where practical,

4\. verify selectors, event listeners, persistence hooks, and render flow still work.



Avoid:

\- full rewrites,

\- large framework migrations,

\- changing data contracts without migration planning,

\- introducing new abstractions that are bigger than the problem.



\## How to handle UI changes



UI changes must be conservative.



Allowed:

\- fixing broken validation,

\- clarifying terminology,

\- removing misleading labels,

\- improving accessible labeling,

\- fixing overflow or clipping,

\- reducing layout breakage,

\- adding clear feedback.



Not allowed:

\- redesigning the whole interface,

\- changing the visual identity significantly,

\- replacing workflows unless the existing workflow is broken,

\- moving controls around in a way that harms user muscle memory without strong reason.



\## How to handle persistence and state



Treat persistence and state as high-risk zones.



Rules:

\- identify the source of truth before editing,

\- do not duplicate state unless absolutely necessary,

\- do not introduce race conditions,

\- do not change save timing without understanding current behavior,

\- keep migrations backward-compatible,

\- preserve existing user data whenever possible.



If unsure:

\- do less,

\- not more.



\## How to handle stale files



If a file appears unused:

1\. search references,

2\. inspect import paths and script includes,

3\. confirm it is not dynamically loaded,

4\. only then remove or archive it.



If certainty is below high confidence:

\- move it to an archive/deprecated folder,

\- do not hard-delete it.



\## Validation expectations



Before finalizing any changes:

\- run available tests,

\- run lint if available,

\- run build if available,

\- inspect affected flows,

\- search for broken selectors/imports/string references,

\- verify no obvious functionality was removed.



If automated validation is weak or absent, explicitly say so and list exact manual QA checks needed.



\## Final response format



At the end of any coding pass, report in this structure:



\### A. Findings

\- short diagnosis

\- what parts of the repo are most fragile



\### B. Plan executed

\- batch 1

\- batch 2

\- batch 3



\### C. Files changed

For each file:

\- path

\- what changed

\- why



\### D. Validation

\- commands run

\- result

\- what remains unverified



\### E. Issue status

For each issue:

\- Resolved

\- Partially resolved

\- Deferred

\- Not reproducible



\### F. Regression risks

\- possible risk areas

\- manual QA checklist



\## Decision rule when uncertain



If there is any tension between:

\- cleaner code,

\- faster implementation,

\- and preserving functionality,



always choose \*\*preserving functionality\*\*.

