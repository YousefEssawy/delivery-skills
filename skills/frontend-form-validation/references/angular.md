# Angular — detecting, reading, and writing validation

Angular has **two approaches** to forms. Detect which one is in use first.

## Detecting the approach

| Approach | Signals (grep) |
|---|---|
| **Reactive Forms** | `FormGroup` · `FormBuilder` / `fb.group(` · `new FormControl(` · `formControlName=` · `[formGroup]=` |
| **Template‑driven** | `[(ngModel)]` · `#x="ngModel"` · `<form #f="ngForm">` · validation attrs (`required`, `minlength`, `pattern`) |

```bash
grep -rln "FormGroup\|FormBuilder\|formControlName\|new FormControl" --include=*.ts src/
grep -rln "ngModel\|ngForm" --include=*.html --include=*.ts src/
```

A project may mix both on different pages — handle each form with its own approach.

---

## Reactive Forms

### Reading (inventory)
1. Find the form definition in the component `.ts`: `this.fb.group({ ... })` or `new FormGroup({ ... })`.
2. For each control, read the **validators array**:
   ```ts
   email: ['', [Validators.required, Validators.email]],
   age:   [null, [Validators.min(18), Validators.max(120)]],
   name:  ['', { validators: [Validators.required], updateOn: 'blur' }],
   ```
3. Link the control name to the template (`formControlName="email"`) to get the input `type` and the
   `placeholder` / `label` for inference.
4. **Cross‑field validators** sit at group level (the second argument of `group(...)`), for example
   `passwordMatch`.

### Mapping (validator → meaning)
| Validator | Meaning |
|---|---|
| `Validators.required` / `requiredTrue` | required (the latter for a checkbox that must be true) |
| `Validators.email` | email format |
| `Validators.minLength(n)` / `maxLength(n)` | text length |
| `Validators.min(n)` / `max(n)` | numeric range |
| `Validators.pattern(re)` | regex |
| a function returning `ValidationErrors\|null` | **custom validator** — record it as an existing pattern and reuse it |
| no `[Validators.x]` | the control is **optional** |

### required vs optional
- Has `Validators.required` → **required**.
- Has none → **optional**. (If it is missing but the business clearly treats it as required — a `*`
  in the label, or the backend requires it → mark it "unspecified — confirm".)

### Writing (Phase 2)
Add to the validators array of the approved control only:
```ts
// before
phone: [''],
// after (example: Egyptian mobile; use the target market's format)
phone: ['', [Validators.required, Validators.pattern(/^01[0125]\d{8}$/)]],
```
- **custom / cross‑field** (for example password confirm) at group level:
  ```ts
  this.fb.group({ password: ['', [Validators.required, Validators.minLength(8)]],
                  confirm:  ['', [Validators.required]] },
                { validators: [this.matchValidator('password','confirm')] });
  ```
- If you need Unicode (for example Arabic or other non-Latin names), use a `RegExp` with the `u` flag
  (not a string literal):
  ```ts
  Validators.pattern(/^[\p{L}\p{M} .'\-]+$/u)
  ```
- **message markup** (follow the project's convention — an i18n key if there is one):
  ```html
  <mat-error *ngIf="form.get('phone')?.hasError('pattern')">
    {{ 'errors.phoneInvalid' | translate }}
  </mat-error>
  ```
  On Angular 17+ projects that use the built-in control flow, write `@if (...) { ... }` instead of
  `*ngIf`, matching the surrounding templates.
- **a11y**: wire `aria-invalid` + `aria-describedby` to the error element if the project does that.
- Reuse any **shared validators** you found in Step 0 instead of writing new ones.

---

## Template‑driven

### Reading
All validation is **attributes on the input**:
```html
<input name="email" [(ngModel)]="model.email" required email #email="ngModel"
       minlength="3" maxlength="50" pattern="...">
```
- `required` → required. The other attributes match the Reactive validators, as HTML.
- Errors are shown through `email.errors?.['required']` on the template ref.

### Writing (Phase 2)
Add the missing attributes + an error block bound to the ref:
```html
<input name="phone" [(ngModel)]="model.phone" required
       pattern="^01[0125][0-9]{8}$" #phone="ngModel">
<div *ngIf="phone.invalid && phone.touched">
  <small *ngIf="phone.errors?.['pattern']">{{ 'errors.phoneInvalid' | translate }}</small>
</div>
```
> Note: inside an HTML `pattern` attribute, write `[0-9]` rather than `\d`, so the pattern does not
> depend on how backslashes survive the template.

---

## Common Angular traps
- A form without a `<form>` tag is still a form (rely on `[formGroup]` / `ngModel`).
- `FormArray` (dynamic lists) — every item has validators; check the factory that builds the controls.
- `updateOn: 'blur'/'submit'` changes the **timing** of validation, not whether it exists.
- A custom validator that is written but **not attached** to the control = not running (a weak point
  that must be reported).
