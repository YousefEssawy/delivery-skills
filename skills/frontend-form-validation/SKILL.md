---
name: frontend-form-validation
description: "Audit and harden forms in an Angular or React frontend: map every form's inputs (required or optional, existing rules), infer validation for unvalidated inputs from the field type and name (email, phone, name, password, with locale-aware defaults for the product's markets), optionally compare against a separate .NET (FluentValidation) backend to catch frontend-backend mismatches, report by severity in the user's language, then apply fixes in the project's own style after approval. Use WHENEVER the user wants to review, audit or harden frontend forms or their validation: 'audit my forms', 'review form validation', 'which inputs have no validation', 'compare frontend and backend validation', 'راجع الفورمز', 'افحص الفاليديشن', 'قارن فاليديشن الفرونت والباك'. Angular (Reactive and Template-driven) and React (RHF, Formik, Zod or Yup, controlled). Not for the backend itself (use dotnet-backend-validation)."
---

# Frontend Form Validation

Runs a **full audit of the forms** in an **Angular** or **React** project: lists every form, records
for each input whether it is required or optional and which validation rules it has, infers suitable
validation for inputs that have none, compares (when available) against a **separate .NET backend** to
find frontend↔backend mismatches, and presents a **detailed report** of the weak points ranked by
severity. Only after the user approves does it **apply** the changes, in the project's own style.

## Principles (read before you start)

- **Discover, don't assume.** The project may use Reactive Forms, Template-driven forms, RHF, Formik, a
  Zod/Yup schema, or plain controlled `useState`. Find the actual approach in the code first, then work
  with it.
- **Format rules can be proposed with confidence; required/optional is a business decision.** Making
  an optional input required changes business logic — **propose it and ask**, never change it on your
  own.
- **Report first, apply after approval.** The skill has **two phases**; by default it stops after the
  report.
- **Never cut silently.** If you sampled (did not check every form), **say so explicitly** in the
  report.
- **The most important risk in a full-stack audit**: a field validated on the frontend only and **not**
  on the backend = a **security gap** (client validation is trivially bypassed). The reverse (validated
  on the backend only, not on the frontend) = a **UX gap**. Both must appear in the report.

## The two phases

- **Phase 1 — Audit & Report** (read-only, the default): inventory + inference + backend comparison +
  report + the question "what should I apply?".
- **Phase 2 — Apply** (writes, only after approval): apply what was approved, in the project's style,
  smallest safe batch first.

**Choosing a phase**: any "review / check / audit / what is missing / compare" request → start
**Phase 1**. As soon as the user approves suggestions → run **Phase 2** on the approved ones only. If
the request is explicitly "fix the validation in form X" → run a quick Phase 1 on that form, then offer
the apply.

---

## Step 0 — Discover the project (always first)

Before anything else, understand the project. The goal: know the framework, the form approach, **and
the existing patterns**, so you reuse them instead of reworking.

1. **Framework**: `package.json` →
   - `@angular/core` → **Angular**. Read `references/angular.md`.
   - `react` → **React**. Read `references/react.md`.
   - Both present (monorepo) → handle them in turn.
2. **Form approach** (important — this is what adapts): detect it with the grep table in the framework
   file. Projects sometimes mix (for example RHF + zodResolver) — then the source of truth is the
   schema, not the `register` call.
3. **Existing patterns** (to avoid rework): look for and record
   - custom validators / shared validation directives or utils (Angular: functions returning
     `ValidationErrors|null`; React: helpers or shared zod/yup schemas);
   - the error-message convention: i18n keys (for example `errors.required`) or inline text? Follow
     what the project does;
   - any predefined regex / constants (phone, national ID, postal code …) — reuse them as they are;
   - the **locales and markets the product targets** (supported languages, country selectors, phone
     prefixes, currency) — they decide which locale defaults in `references/inference.md` apply.
4. **The forms themselves** (not only what is inside a `<form>` tag): rely on the **control bindings**,
   not the tag:
   - Angular: `[formGroup]` / `formControlName` / `[(ngModel)]` / `#x="ngModel"`.
   - React: `useForm` / `register(` / `<Formik` / `<Field` / `useState` + `value=` + `onChange=`.

```bash
# framework
cat package.json | grep -E '"@angular/core"|"react"|"react-hook-form"|"formik"|"zod"|"yup"'
# form entry points (Angular)
grep -rln "formControlName\|\[formGroup\]\|ngModel" --include=*.html --include=*.ts src/ 2>/dev/null
# form entry points (React)
grep -rln "useForm\|register(\|<Formik\|useFormik\|validationSchema" --include=*.tsx --include=*.jsx src/ 2>/dev/null
# existing patterns
grep -rln "ValidationErrors\|zod\|yup\|i18n\|translate(" src/ 2>/dev/null | head
```

> If the project is large, scan smartly (focus on the form / feature folders) and say in the report
> that you did.

---

## Step 1 — Inventory every form and every field

For each form you found, record per field: **name, type (inferred), required/optional, existing
validation rules, and where they come from** (schema, inline, or attribute). Details are in the
framework file.

- **required/optional**: from `Validators.required` / the `required` attribute / `.required()` /
  `.nonempty()` in the schema / `register(... {required})`. If it is not clearly set → mark it
  **"unspecified — confirm"**.
- If there is a schema (Zod/Yup): the schema is the **source of truth**, not the JSX.

---

## Step 2 — Inference engine

For each field **missing validation**, infer its semantic type from the input `type` + the field /
control name + the label / placeholder, and propose suitable rules. The full table + the regex library
+ the **locale defaults** (for example the Egypt block: Egyptian mobile, national ID, Arabic/Latin
names) are in `references/inference.md`.

Quick summary:

| Type | Detection signals | Proposed rules (principle) |
|---|---|---|
| Email | `type=email`, name~`email/mail` | required(?) + the built-in email validator + maxLength + trim |
| Phone | name~`phone/mobile/tel` | required(?) + the target market's format (e.g. Egypt `^01[0125]\d{8}$`, or E.164) |
| Person name | name~`name/firstName` | required(?) + min/max length + letters in the product's scripts |
| Password | `type=password` | required + minLength(8) + complexity; confirm = match |
| Money | name~`price/amount/salary` | numeric + `>=0` + decimal scale + max |
| Date / DOB | `type=date`, name~`date/dob` | valid date + (DOB not in the future / minimum age) |
| Free text | default | required(?) + a sensible maxLength + trim |

> Golden rule for formats like email: **use the framework's built-in validator** (`Validators.email` /
> `.email()`), not a hand-written regex.

---

## Step 3 — Compare with the backend (optional — .NET in a separate repo)

If the user wants the comparison, ask for the **path to the .NET backend repository**. Then read
`references/backend-dotnet.md` — it explains how to:
1. find the `AbstractValidator<T>` classes and request models in that repo;
2. link each frontend form to its DTO (through the endpoint URL in the API service);
3. produce a **mismatch matrix** per field: ✅ consistent / 🔴 frontend-only (security gap) / 🔴
   backend-only (UX gap) / 🟡 different rules / ⚪ present on one side only.

> If the backend itself needs fixing, do not do it here — hand it to the **`dotnet-backend-validation`**
> skill.

---

## Step 4 — The report

Write the report **in the user's language**, as markdown tables by default. If the user writes Arabic
and the **`arabic-tech-explainer`** skill is installed, you may render it as an RTL widget through that
skill instead (optional, not required). The mandatory structure and a widget example are in
`references/report-template.md`. It must contain:

1. **Summary**: number of forms / fields / fields with validation / gaps / mismatches + overall risk.
2. **A table per form**: field · type (inferred) · required/optional · frontend rules · backend rules ·
   status · suggested rule.
3. **Weak points ranked by severity**: High (auth / money / PII / dates without validation, and any
   frontend-only rule) → Medium (search / filter, divergent rules) → Low.
4. **Frontend ↔ backend mismatches** (if the backend was checked).
5. **What is done well** (positives — not only gaps).
6. **Suggestions + an explicit question**: "Which suggestions should I apply?" — and wait for approval.

---

## Phase 2 — Apply (only after approval)

Apply **only what was approved**, with the project's approach (do not introduce a new library):
- **Angular Reactive**: add to the control's validators array + message markup + `aria` wiring.
  (Details in `references/angular.md`.)
- **Angular Template-driven**: validation attributes + an error block bound to the template ref.
- **React schema-driven**: edit the **schema** (Zod/Yup) — it is the source of truth.
- **React RHF inline**: options inside `register(...)`.
- **React controlled**: validation logic in the handler + a message. (Details in `references/react.md`.)

**Apply rules**:
- Smallest safe batch first; report every file changed.
- Reuse the patterns / regex / i18n keys you found in Step 0. New message keys go into every locale
  file (the `i18n-locale-sync` skill checks parity if it is installed).
- **Never flip required↔optional** unless the user confirms (it is business logic).
- If available: `lint` / `build` must pass cleanly after the change.

---

## Definition of done

- All forms (or the ones you chose, with the reason stated) are inventoried, and every field has: type
  + required/optional + rules + their source.
- Every field missing validation has a **suggestion** based on its type (with the locale defaults that
  apply to the product).
- If the backend was checked: a mismatch matrix that shows the security gaps and UX gaps clearly.
- The report was presented in the user's language, ranked by severity.
- Phase 2 applied only what was approved, in the project's style, without touching required/optional
  logic without permission.

## Reference files

- `references/angular.md` — detecting, reading and writing Reactive + Template-driven validation.
- `references/react.md` — detecting, reading and writing RHF / Formik / Zod·Yup / controlled validation.
- `references/inference.md` — the full inference table + regex library + locale defaults.
- `references/backend-dotnet.md` — reading FluentValidation from a separate .NET repo + DTO↔form
  matching + mismatch detection.
- `references/report-template.md` — the mandatory report structure + a markdown example + the optional
  RTL widget example for `arabic-tech-explainer`.
