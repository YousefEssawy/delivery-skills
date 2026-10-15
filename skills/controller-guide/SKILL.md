---
name: controller-guide
description: >-
  Audit, write, or review Web API controllers against a self-contained controller
  style guide. Use this skill WHENEVER the user wants to (1) audit / review / lint
  existing controllers for consistency, (2) write a new controller, or (3) check a
  controller against "the controller guide / controller style". Triggers — English:
  "audit my controllers", "review this controller", "is this controller on-standard",
  "write a new controller", "controller guide", "controller style". وبالعربي:
  "افحص الكنترولرز", "راجع الكنترولر ده", "اكتب كنترولر جديد", "شيك الكنترولر على المعيار",
  "controller guide". The rules live entirely inside this skill — it NEVER reads a
  project's CLAUDE.md, README, or any standards file to "learn the rules". It only
  reads the project's controller files (to audit them) plus a small sample (to
  calibrate project-specific names). Default action when invoked is AUDIT (read-only).
---

# Controller Guide

A self-contained skill for auditing, writing, and reviewing ASP.NET Core Web API
controllers against a bundled style guide.

## Core principle — self-contained (NON-NEGOTIABLE)

All rules come from **inside this skill**, from
`references/controller-code-style-guide.md`. That bundled file is the single source
of truth.

**Never** read the target project's `CLAUDE.md`, `README`, `.editorconfig`,
contribution guide, or any other standards/convention file in order to learn the
rules. The project is the **subject of inspection**, not the **source of rules**.

The only things this skill reads from the target project are:
1. The **controller files themselves** (`**/*Controller.cs`) — the things being audited.
2. A **small sample of controllers** — read once, only to calibrate the
   *project-specific concrete names* the guide tells you to swap (base controller
   type, route prefix shape, etc.). See "Calibration" below.

## First step every time

Read `references/controller-code-style-guide.md` (the bundled rules) before doing
anything else. Do not proceed from memory — the bundled file is authoritative and
may have been updated.

---

## Mode 1 — Audit (DEFAULT when invoked)

Use this mode unless the user explicitly asks to write or edit a controller.

1. **Load the rules.** Read `references/controller-code-style-guide.md`.
2. **Find the controllers.** Locate every controller in the target project
   (`**/*Controller.cs`).
3. **Calibrate the project (calibration).** Read a sample of existing controllers
   (3–5, prefer the largest/oldest) to infer the *project's own baseline* — the
   concrete names the guide says to swap rather than impose:
   - Base controller type name (the JWT-subject base).
   - Route prefix shape (e.g. role-segmented `api/admin/v{version}/…`).
   - Whether the project uses `[ProducesResponseType]` project-wide.
   - Dominant DELETE style (route-id vs body).
   - DI shape (e.g. is a logger consistently injected?).
   The project's **dominant** pattern is the consistency baseline. You measure
   violations against the guide's *universal* rules **and** against the project's
   own dominant pattern — you do NOT impose constants from another project.
4. **Evaluate each controller** against the checklist below and classify each item:
   ✅ compliant / 🟡 partial / ❌ violation.
5. **Produce a report** (use `references/audit-report-template.md` as the layout):
   - **Compliance matrix**: controller × rule (compliant / needs-change / n/a).
   - **What's already covered** — rules the project already follows correctly
     (do NOT ask to "fix" these).
   - **What needs changing** — file name + line + violated rule + suggested fix.
   - **Internal conflicts** — where two controllers disagree (e.g. action-named vs
     REST, or file-scoped vs block namespace).
   - **Priority** — consistency-breaking violations first, then cosmetics.
6. **Do NOT modify anything in audit mode.** End by asking the user whether to apply
   all / some / none of the suggested changes.

---

## Mode 2 — Write or edit a controller

Use this mode when the user asks to create or change a controller.

1. Read `references/controller-code-style-guide.md`.
2. Apply the rules directly, using the **calibrated** project constants (the
   project's actual base controller type and route-prefix shape — read one nearby
   controller if you haven't calibrated yet).
3. Show the code, then **build** to confirm it compiles
   (`dotnet build` on the relevant project).

---

## Checklist (audit items — derived from the bundled guide)

Universal rules (a controller is a finding if it breaks these):
- **Block namespace** (`namespace X { … }`), not file-scoped.
- Class named `Manage<Resource>Controller` (or the project's dominant role pattern).
- Inherits the project's base controller that exposes the JWT subject.
- **Action-named kebab-case routes**
  (`search` / `insert` / `update` / `details/{id}` / `delete/{id}` /
  `toggle-active/{id}`) — **not** REST-nested (`POST ""`, `PUT "{id}"`).
- **Explicit binding sources** on every parameter
  (`[FromBody]` / `[FromQuery]` / `[FromRoute]` / `[FromForm]`).
- `CancellationToken` placed consistently within the controller.
- Write endpoints **stamp the actor** from the JWT
  (`requestModel.CreatedById = TokenUserId;`).
- **No try/catch** in the controller — rely on the exception wrapper.
- **No manual validator calls** (model validation runs automatically on `[FromBody]`).
- Field naming `_camelCase` + `readonly`.
- One controller per file, grouped by feature/folder.
- DELETE via `delete/{id}` on the route (for new controllers).

Project-dependent (measure against the calibrated dominant pattern — do NOT force
them if the project consistently omits them):
- `[ProducesResponseType]` usage.
- Logger present in DI.

---

## Interface-sync note (general)

If a route change is made, flag that any separate API client needs syncing. Search
generally for an endpoints-constants file (e.g. `api-url.ts` / `endpoints.*` /
`*ApiClient*`) in the project or a sibling repo, and treat the change as complete
only once both sides match.

---

## Definition of Done

- **Self-contained**: all rules live in `references/`; zero reliance on standards
  files in the target project.
- **Audit mode**: a report that clearly separates "covered" from "needs change"
  with files and line numbers, modifying nothing.
- **Write mode**: conformant code + a successful build.
