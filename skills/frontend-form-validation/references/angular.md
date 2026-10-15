# Angular — اكتشاف، قراءة، وكتابة الفاليديشن

Angular ليها **approach‑ين** للفورمز. اكتشف الموجود الأول.

## اكتشاف الـ approach

| Approach | إشارات (grep) |
|---|---|
| **Reactive Forms** | `FormGroup` · `FormBuilder` / `fb.group(` · `new FormControl(` · `formControlName=` · `[formGroup]=` |
| **Template‑driven** | `[(ngModel)]` · `#x="ngModel"` · `<form #f="ngForm">` · validation attrs (`required`, `minlength`, `pattern`) |

```bash
grep -rln "FormGroup\|FormBuilder\|formControlName\|new FormControl" --include=*.ts src/
grep -rln "ngModel\|ngForm" --include=*.html --include=*.ts src/
```

ممكن المشروع يخلط الاتنين في صفحات مختلفة — اتعامل مع كل form بالـ approach بتاعه.

---

## Reactive Forms

### القراءة (الحصر)
1. لاقي تعريف الفورم في الـ component `.ts`: `this.fb.group({ ... })` أو `new FormGroup({ ... })`.
2. لكل control، اقرا الـ **validators array**:
   ```ts
   email: ['', [Validators.required, Validators.email]],
   age:   [null, [Validators.min(18), Validators.max(120)]],
   name:  ['', { validators: [Validators.required], updateOn: 'blur' }],
   ```
3. اربط الـ control name بالـ template (`formControlName="email"`) عشان تجيب الـ input `type` والـ `placeholder`/`label` للاستنتاج.
4. **cross‑field validators** بتتحط على مستوى الـ group (الـ argument التاني لـ `group(...)`)، مثلاً `passwordMatch`.

### الـ mapping (validator → معناه)
| Validator | المعنى |
|---|---|
| `Validators.required` / `requiredTrue` | required (الأخيرة لـ checkbox لازم true) |
| `Validators.email` | email format |
| `Validators.minLength(n)` / `maxLength(n)` | طول النص |
| `Validators.min(n)` / `max(n)` | مدى رقمي |
| `Validators.pattern(re)` | regex |
| function بترجّع `ValidationErrors\|null` | **custom validator** — سجّله كـ pattern موجود وأعد استخدامه |
| `[Validators.x]` غايب | الـ control **optional** |

### required vs optional
- فيه `Validators.required` → **required**.
- مفيش → **optional**. (لو ناقص بس الـ business واضح إنه required من الـ label `*` أو من الباك → علّمه "غير محدّد — أكّد".)

### الكتابة (Phase 2)
ضيف للـ validators array بتاع الـ control المعتمد بس:
```ts
// قبل
phone: [''],
// بعد (EG mobile)
phone: ['', [Validators.required, Validators.pattern(/^01[0125]\d{8}$/)]],
```
- **custom/cross‑field** (مثال password confirm) على مستوى الـ group:
  ```ts
  this.fb.group({ password: ['', [Validators.required, Validators.minLength(8)]],
                  confirm:  ['', [Validators.required]] },
                { validators: [this.matchValidator('password','confirm')] });
  ```
- لو محتاج unicode (أسماء عربي) استخدم `RegExp` بـ `u` flag (مش string literal):
  ```ts
  Validators.pattern(/^[\p{L}\p{M} .'\-]+$/u)
  ```
- **markup للرسالة** (اتبع convention المشروع — i18n key لو موجود):
  ```html
  <mat-error *ngIf="form.get('phone')?.hasError('pattern')">
    {{ 'errors.phoneInvalid' | translate }}
  </mat-error>
  ```
- **a11y**: اربط `aria-invalid` + `aria-describedby` بعنصر الخطأ لو المشروع بيعمل كده.
- أعد استخدام أي **shared validators** لقيتها في Step 0 بدل ما تكتب من الأول.

---

## Template‑driven

### القراءة
الـ validation كله **attributes على الـ input**:
```html
<input name="email" [(ngModel)]="model.email" required email #email="ngModel"
       minlength="3" maxlength="50" pattern="...">
```
- `required` → required. باقي الـ attrs زي الـ Reactive بس كـ HTML.
- الأخطاء بتتعرض بـ `email.errors?.['required']` على الـ template ref.

### الكتابة (Phase 2)
ضيف الـ attributes الناقصة + error block متربط بالـ ref:
```html
<input name="phone" [(ngModel)]="model.phone" required
       pattern="^01[0125][0-9]{8}$" #phone="ngModel">
<div *ngIf="phone.invalid && phone.touched">
  <small *ngIf="phone.errors?.['pattern']">{{ 'errors.phoneInvalid' | translate }}</small>
</div>
```
> ملاحظة: في الـ HTML attribute مش بنقدر نستخدم `\d` كـ JS regex token بشكل مضمون عبر المتصفحات — استخدم `[0-9]`.

---

## فخاخ شائعة في Angular
- فورم بدون `<form>` tag لسه فورم (الاعتماد على `[formGroup]`/`ngModel`).
- `FormArray` (قوائم ديناميكية) — كل عنصر له validators؛ افحص الـ factory اللي بيعمل الـ controls.
- `updateOn: 'blur'/'submit'` بيغيّر **توقيت** الـ validation مش وجوده.
- custom validator مكتوب بس **مش متضاف** للـ control = مش شغّال (نقطة ضعف لازم تطلع).
