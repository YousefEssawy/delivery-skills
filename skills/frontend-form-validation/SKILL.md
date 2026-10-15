---
name: frontend-form-validation
description: "Audit and harden forms in an Angular or React frontend — map every form's inputs (required/optional + existing validation rules), infer validation for un-validated inputs from the field type/name (email, phone, name, password …, Egyptian locale defaults), optionally compare against a SEPARATE .NET (FluentValidation) backend to catch frontend↔backend mismatches, and produce a severity-ranked RTL-Arabic report via the arabic-tech-explainer skill — THEN apply fixes in the project's own style after the user approves. Use WHENEVER the user wants to review / audit / harden frontend forms or their validation. Triggers — English: 'audit my forms', 'review form validation', 'which inputs have no validation'. وبالعربي: 'راجع الفورمز', 'افحص الفاليديشن', 'الانبوت ده محتاج فاليديشن ايه', 'قارن فاليديشن الفرونت والباك'. Scope — Angular (Reactive + Template-driven) و React (RHF / Formik / Zod·Yup / controlled)، بتتكيّف مع approach المشروع. مش للـ backend نفسه (استخدم dotnet-backend-validation) ولا لفريمورك تاني."
---

# Frontend Form Validation

بتعمل **أوديت كامل للـ forms** في مشروع **Angular** أو **React**: تحصر كل form، تطلّع لكل input هو required ولا optional وعليه أنهي validation rules، تستنتج الفاليديشن المناسب للـ inputs اللي ملهاش حاجة، وتقارن (لو متاح) مع **.NET backend منفصل** عشان تلاقي الـ frontend↔backend mismatches، وتعرض **تقرير مفصّل** بنقاط الضعف مرتّبة بالـ severity. وبعد موافقة المستخدم بس، **تطبّق** التعديلات بنفس ستايل المشروع.

## الفلسفة (اقراها قبل ما تبدأ)

- **اكتشف، متفترضش.** المشروع ممكن يكون Reactive Forms أو Template-driven أو RHF أو Formik أو schema بـ Zod/Yup أو مجرد controlled `useState`. اكتشف الـ approach الفعلي من الكود الأول، وبعدها اشتغل بيه.
- **الـ format rules ممكن تقترحها بثقة؛ بس الـ required/optional قرار business.** خلّي input optional يبقى required = تغيير في منطق الـ business — **اقترحه واسأل**، متغيّروش لوحدك.
- **التقرير الأول، التطبيق بعد الموافقة.** الـ skill ليها **مرحلتين**، الـ default إنها توقف بعد التقرير.
- **ممنوع القطع الصامت.** لو عملت sampling (مفحصتش كل الفورمز) — **قول كده صراحة** في التقرير.
- **نقطة الخطر الأهم في full-stack audit**: field متحقّق منه في الـ frontend بس **مش** في الباك = **security gap** (الـ client validation بيتباي-باس بسهولة). والعكس (متحقق في الباك بس مش frontend) = **UX gap**. الاتنين لازم يطلعوا في التقرير.

## المرحلتين

- **Phase 1 — Audit & Report** (read-only، الـ default): حصر + استنتاج + مقارنة بالباك + تقرير RTL + سؤال "نطبّق إيه؟".
- **Phase 2 — Apply** (write، بعد الموافقة بس): تطبّق المعتمد بنفس ستايل المشروع، أصغر دفعة آمنة الأول.

**قاعدة الاختيار**: أي طلب "راجع / افحص / أوديت / إيه الناقص / قارن" → ابدأ **Phase 1**. أول ما المستخدم يوافق على اقتراحات → نفّذ **Phase 2** على اللي اتعتمد بس. لو الطلب صريح "ظبّط الفاليديشن في الفورم الفلاني" → اعمل Phase 1 سريعة على الفورم ده ثم اعرض الـ apply.

---

## Step 0 — اكتشاف المشروع (دايمًا الأول)

قبل أي حاجة، افهم شكل المشروع. الهدف: تعرف الفريمورك، الـ form approach، **والـ patterns الموجودة** عشان نعيد استخدامها بدل ما نعمل rework.

1. **الفريمورك**: `package.json` →
   - `@angular/core` → **Angular**. اقرا `references/angular.md`.
   - `react` → **React**. اقرا `references/react.md`.
   - الاتنين موجودين (monorepo) → اعملهم بالترتيب.
2. **الـ form approach** (مهم — ده اللي بيتكيّف): اكتشفه بالـ grep حسب الجدول في ملف الفريمورك. ساعات المشروع بيخلط (مثلاً RHF + zodResolver) — الـ source of truth ساعتها هو الـ schema مش الـ register.
3. **الـ patterns الموجودة** (عشان نتجنب الـ rework): دوّر على وسجّل:
   - custom validators / shared validation directives أو utils (Angular: functions بترجّع `ValidationErrors|null`؛ React: helpers أو shared zod/yup schemas).
   - convention رسائل الأخطاء: i18n keys (مثلاً `errors.required`) ولا نصوص inline؟ اتبع اللي المشروع ماشي عليه.
   - أي regex/constants متعرّفة مسبقًا (EG phone، national id، إلخ) — استخدمها زي ما هي.
4. **الفورمز نفسها** (مش بس اللي جوه `<form>`): اعتمد على الـ **control bindings** مش التاج:
   - Angular: `[formGroup]` / `formControlName` / `[(ngModel)]` / `#x="ngModel"`.
   - React: `useForm` / `register(` / `<Formik` / `<Field` / `useState` + `value=`+`onChange=`.

```bash
# الفريمورك
cat package.json | grep -E '"@angular/core"|"react"|"react-hook-form"|"formik"|"zod"|"yup"'
# نقاط دخول الفورمز (Angular)
grep -rln "formControlName\|\[formGroup\]\|ngModel" --include=*.html --include=*.ts src/ 2>/dev/null
# نقاط دخول الفورمز (React)
grep -rln "useForm\|register(\|<Formik\|useFormik\|validationSchema" --include=*.tsx --include=*.jsx src/ 2>/dev/null
# الـ patterns الموجودة
grep -rln "ValidationErrors\|zod\|yup\|i18n\|translate(" src/ 2>/dev/null | head
```

> لو المشروع كبير، اعمل scan ذكي (focus على فولدرات الفورمز/الـ features) وقول في التقرير إنك عملت كده.

---

## Step 1 — حصر كل form وكل field

لكل form اكتشفته، طلّع لكل field: **الاسم، النوع (inferred)، required/optional، الـ validation rules الموجودة، ومصدرها** (الـ schema ولا inline ولا attribute). التفاصيل في ملف الفريمورك.

- **required/optional**: من وجود `Validators.required` / `required` attribute / `.required()`/`.nonempty()` في الـ schema / `register(... {required})`. لو مش متحدّد بوضوح → علّمه **"غير محدّد — أكّد"**.
- لو فيه schema (Zod/Yup): الـ schema هو الـ **source of truth**، مش الـ JSX.

---

## Step 2 — الاستنتاج (Inference engine)

لكل field عليه **fالاليديشن ناقص**، استنتج النوع الـ semantic من: الـ input `type` + اسم الـ field/control + الـ label/placeholder، واقترح الـ rules المناسبة. الجدول الكامل + الـ regex library + الـ **EG locale defaults** (الموبايل المصري، National ID، الأسماء عربي/لاتيني) في `references/inference.md`.

ملخص سريع:

| النوع | إشارات الاكتشاف | الـ rules المقترحة (المبدأ) |
|---|---|---|
| Email | `type=email`، name~`email/mail` | required(?) + الـ built-in email + maxLength + trim |
| EG phone | name~`phone/mobile/tel` | required(?) + `^01[0125]\d{8}$` |
| Person name | name~`name/firstName` | required(?) + min/max length + letters عربي/لاتيني |
| Password | `type=password` | required + minLength(8) + complexity؛ confirm = match |
| Money | name~`price/amount/salary` | numeric + `>=0` + decimal scale + max |
| Date / DOB | `type=date`، name~`date/dob` | valid date + (DOB مش في المستقبل / حد أدنى للعمر) |
| Free text | default | required(?) + maxLength معقول + trim |

> القاعدة الذهبية للـ format زي email: **استخدم الـ built-in بتاع الفريمورك** (`Validators.email` / `.email()`)، مش regex معمول بإيد.

---

## Step 3 — المقارنة بالباك (اختياري — .NET في ريبو منفصل)

لو المستخدم عايز المقارنة، اطلب منه **path للريبو بتاع الـ .NET backend**. بعدها اقرا `references/backend-dotnet.md` — بيشرح إزاي:
1. تلاقي الـ `AbstractValidator<T>` والـ request models في الريبو ده.
2. تربط كل frontend form بالـ DTO بتاعه (عن طريق الـ endpoint URL في الـ API service).
3. تطلّع **mismatch matrix** لكل field: ✅ متطابق / 🔴 frontend-only (security gap) / 🔴 backend-only (UX gap) / 🟡 rules مختلفة / ⚪ موجود ناحية واحدة.

> لو احتجت **تظبط الباك نفسه**، مش بتعمله هنا — حوّل لـ skill: **`dotnet-backend-validation`**.

---

## Step 4 — التقرير (عن طريق arabic-tech-explainer)

اعرض النتيجة كـ **RTL widget** عن طريق skill: **`arabic-tech-explainer`** (شيل الـ `mockup` module واستخدم الـ template بتاعه — متعملش CSS من الأول). الستراكتشر الإلزامي للتقرير + مثال widget في `references/report-template.md`. لازم يحتوي على:

1. **ملخص**: عدد الفورمز / الـ fields / اللي عليها validation / الـ gaps / الـ mismatches + risk عام.
2. **جدول لكل form**: field · type (inferred) · required/optional · frontend rules · backend rules · status · suggested rule.
3. **نقاط الضعف مرتّبة severity**: High (auth/money/PII/dates من غير validation، وأي frontend-only rule) ← Medium (search/filter، rules مختلفة) ← Low.
4. **frontend ↔ backend mismatch** (لو الباك متفحص).
5. **اللي معمول كويس** (positive — مش بس النواقص).
6. **الاقتراحات + سؤال صريح**: "تحب أطبّق أنهي اقتراحات؟" — وانتظر الموافقة.

---

## Phase 2 — Apply (بعد الموافقة بس)

طبّق **المعتمد بس**، بنفس approach المشروع (متدخّلش library جديدة):
- **Angular Reactive**: ضيف للـ validators array بتاعة الـ control + markup للرسالة + اربط بـ `aria`. (تفاصيل في `references/angular.md`.)
- **Angular Template-driven**: validation attributes + error block متربط بالـ template ref.
- **React schema-driven**: عدّل الـ **schema** (Zod/Yup) — هو الـ source of truth.
- **React RHF inline**: options جوه `register(...)`.
- **React controlled**: validation logic في الـ handler + رسالة. (تفاصيل في `references/react.md`.)

**قواعد التطبيق**:
- أصغر دفعة آمنة الأول؛ بلّغ بكل ملف اتغيّر.
- أعد استخدام الـ patterns/الـ regex/الـ i18n keys اللي لقيتها في Step 0.
- **متغيّرش required↔optional** غير لما المستخدم يأكّد (ده business logic).
- لو متاح: `lint` / `build` بعد التعديل لازم يعدّي نضيف.

---

## Definition of done

- ✅ كل الفورمز (أو اللي اخترتها مع ذكر السبب) اتحصرت، وكل field عليه: type + required/optional + rules + مصدرها.
- ✅ كل field ناقص validation ليه **اقتراح** مبني على نوعه (مع EG defaults حيث ينطبق).
- ✅ لو الباك متفحص: mismatch matrix فيها الـ security gaps والـ UX gaps بوضوح.
- ✅ التقرير اتعرض كـ RTL widget عن طريق arabic-tech-explainer، ومرتّب severity.
- ✅ Phase 2 طبّقت المعتمد بس، بستايل المشروع، من غير ما تلمس منطق required/optional من غير إذن.

## Reference files

- `references/angular.md` — اكتشاف وقراءة وكتابة Reactive + Template-driven.
- `references/react.md` — اكتشاف وقراءة وكتابة RHF / Formik / Zod·Yup / controlled.
- `references/inference.md` — جدول الاستنتاج الكامل + regex library + EG locale defaults.
- `references/backend-dotnet.md` — قراءة FluentValidation من ريبو .NET منفصل + DTO↔form matching + mismatch detection.
- `references/report-template.md` — الستراكتشر الإلزامي للتقرير + مثال widget للـ arabic-tech-explainer.
