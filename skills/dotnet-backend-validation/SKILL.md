---
name: dotnet-backend-validation
description: "Add FluentValidation request validators using the auto-validation pattern AND audit any .NET backend for request models that are missing validation. Use when the user wants to create/add a validator, validate a request model, wire up validation in a new project, or scan/check a backend for inputs with no validation. Triggers — 'add validation', 'create a validator', 'validate this request', 'set up validation', 'validation audit', 'what is missing validation', وبالعربي — 'اعمل فاليديشن', 'اعمل فاليديتور', 'اظبط الفاليديشن', 'افحص/شيك الحاجات اللي ملهاش فاليديشن', 'انهي ريكوست محتاج فاليديشن'. Scope — ASP.NET Core backends (Clean Architecture: *.Api.Web + *.Bll + *.Dal). مش للـ frontend ولا non-.NET."
---

# .NET Backend Validation

بتضيف FluentValidation request validators بالـ **auto-validation pattern**، وكمان بتفحص أي .NET backend عشان تلاقي الـ request models اللي ملهاش validation.

الـ skill ليها **وضعين**:

- **Mode A — إضافة validator**: عندك request model معيّن وعايز تعملّه validator.
- **Mode B — فحص المشروع**: عايز تعرف إيه الـ request models اللي ملهاش validation أصلاً.

**قاعدة الاختيار**: لو الطلب فيه "scan / check / افحص / إيه الناقص" → نفّذ **Mode B الأول**، وبعد ما تعرض النواقص نفّذ **Mode A** على اللي اتختار. لو الطلب على request model محدد → روح على **Mode A** على طول.

> **ملاحظة عن الإصدارات**: متحطّش أرقام نسخ ثابتة لأي package. استخدم دايمًا **آخر نسخة مستقرة (latest stable)** وقت التنفيذ.

---

## Step 0 — اكتشف المشروع الأول (دايمًا)

قبل أي حاجة، افهم شكل المشروع — متفترضش:

1. **لاقي الـ solution** (`*.sln` / `*.slnx`) والمشاريع:
   - الـ API: `*.Api.Web` أو اللي فيه `Startup.cs` / `Program.cs`
   - الـ business: `*.Bll`
   - الـ data: `*.Dal`
   - استنتج البادئة `{Project}` من أسماء المشاريع.
2. **لاقي الـ request models**: غالبًا تحت `*.Dal/Models/Requests/**` — وكمان أنواع الـ `[FromBody]` في الكنترولرز. **انتبه**: فيه ملفات فيها أكتر من request class.
3. **لاقي الـ validators الموجودة**: `grep` على `AbstractValidator<` (غالبًا في `*.Bll/Validators/**`).
4. **اتأكد إن auto-validation متوصّلة**: `grep` على:
   - `AddFluentValidationAutoValidation`
   - `AddValidatorsFromAssemblyContaining`
   - `SuppressModelStateInvalidFilter`
   - ووجود package `FluentValidation.AspNetCore`.
   لو أي حاجة من دول ناقصة → **نفّذ [Bootstrap](#bootstrap--بس-لو-auto-validation-لسه-مش-متوصّلة)** قبل ما تكمّل.

أمثلة سريعة للاكتشاف:

```bash
# المشاريع
find . -name "*.sln" -o -name "*.slnx"
# الـ request models
ls -R **/Dal/Models/Requests 2>/dev/null
# الـ validators الموجودة
grep -rl "AbstractValidator<" --include="*.cs" .
# wiring الـ auto-validation
grep -rn "AddFluentValidationAutoValidation\|AddValidatorsFromAssemblyContaining\|SuppressModelStateInvalidFilter" --include="*.cs" .
```

---

## Convention — الستاندرد اللي بنطبّقه

- **validator واحد لكل request model**: `AbstractValidator<TRequest>` في `{Project}.Bll/Validators/{Domain}/`.
- الـ validators بتتسجّل **أوتوماتيك** بـ `AddValidatorsFromAssemblyContaining<T>()` — **من غير** تسجيل يدوي لكل واحد.
- الكنترولر بيرجّع **400** بـ:
  ```csharp
  if (!ModelState.IsValid) return BadRequest(ModelState);
  ```
  (شغّالة بسبب `SuppressModelStateInvalidFilter = true`).
- رسائل الـ validator = **i18n keys**، تتضاف في **كل ملفات اللغة** (`en` + `ar` + أي لغة تانية). لو المشروع مش بيستخدم i18n keys، استخدم **رسائل واضحة بالإنجليزي** زي اللي المشروع ماشي عليه.
- كل validator جديد ياخد **validator unit test** (FluentValidation `TestValidate`) — بستايل NUnit (شوف skill: `dotnet-backend-testing`).

---

## Bootstrap — بس لو auto-validation لسه مش متوصّلة

اعمل ده **بس** لو Step 0 لقى إن الـ wiring ناقص:

1. ضيف package `FluentValidation.AspNetCore` (**آخر نسخة مستقرة**) في المشروع اللي فيه الـ config helper (غالبًا `*.Dal` أو `*.Bll`).
   - لو فيه `FluentValidation` متحطوط لوحده (bare)، **شيله** عشان تتجنّب تعارض الإصدارات، وسيب package الـ `AspNetCore` يجيب نسخة متوافقة.
2. ضيف الـ helper ده:
   ```csharp
   public static IServiceCollection AddFluentValidationConfig<T>(this IServiceCollection services)
   {
       services.AddFluentValidationAutoValidation();
       services.AddValidatorsFromAssemblyContaining<T>();
       ValidatorOptions.Global.DefaultRuleLevelCascadeMode  = CascadeMode.Stop;
       ValidatorOptions.Global.DefaultClassLevelCascadeMode = CascadeMode.Stop;
       return services;
   }
   ```
3. في `Startup` / `Program`:
   ```csharp
   services.AddFluentValidationConfig<SomeValidator>();
   services.Configure<ApiBehaviorOptions>(o => o.SuppressModelStateInvalidFilter = true);
   ```
4. لو الـ host بيستخدم **Autofac** (`AutofacServiceProviderFactory`) — التسجيلات دي بتتنقل للـ container أوتوماتيك، **من غير** أي wiring زيادة.

---

## Mode A — إضافة validator

1. **لاقي الـ request model** المستهدف.
2. اعمل `{Project}.Bll/Validators/{Domain}/{Model}Validator.cs`:
   ```csharp
   using FluentValidation;
   using {Project}.Dal.Models.Requests.{Domain};

   namespace {Project}.Bll.Validators.{Domain};

   public class {Model}Validator : AbstractValidator<{Model}>
   {
       public {Model}Validator()
       {
           RuleFor(x => x.Field).NotEmpty().WithMessage("FieldRequired");
           // lengths, ranges, EmailAddress, cross-field NotEqual(x => x.Other), ...
       }
   }
   ```
3. **استنتج القواعد من الموديل**:

   | اللي في الموديل | القاعدة |
   |---|---|
   | required / non-null | `NotEmpty()` |
   | طول النص | `MinimumLength(n)` / `MaximumLength(n)` |
   | إيميل | `EmailAddress()` |
   | مدى رقمي | `GreaterThanOrEqualTo(n)` / `InclusiveBetween(a, b)` |
   | "لازم يختلف عن field تاني" | `NotEqual(x => x.Other)` |

4. ضيف الـ **message keys** في **كل ملفات اللغة** (`en` + `ar` …).
5. ضيف **validator test** (`TestValidate`).
6. `dotnet build` (**zero warnings**) + `dotnet test` (**أخضر**).

---

## Mode B — فحص المشروع للناقص في الفاليديشن

1. **اجمع الـ request models** — أنواع الـ `[FromBody]` في الكنترولرز + الـ request classes تحت فولدر الـ requests. (افتكر: الملفات ممكن تكون **متعددة الكلاسات**.)
2. **اجمع الـ validators** — كل `AbstractValidator<X>`؛ سجّل النوع `X` اللي متغطّى.
3. **الفرق** — أي request model مالوش validator مطابق = **نقص**.
4. **الأولوية**:
   - **High**: bodies بتاعة write endpoints (`insert` / `update` / `create` / `change` / `assign` / `block` / `delete`)، وأي بيانات بيكتبها المستخدم (auth, money, dates, emails).
   - **Medium**: bodies بتاعة `search` / `filter`.
   - **Low**: الـ shapes الداخلية.
5. **اطلّع جدول**:

   | Model | Controller + endpoint | Suggested rules | Priority |
   |---|---|---|---|

   > لو عملت **sampling** بدل مسح كامل، **قول كده صراحة** — ممنوع القطع الصامت.
6. اعرض تنفيذ أعلى النواقص عن طريق **Mode A** (validator + test + i18n لكل واحد)، **أصغر دفعة آمنة الأول**.

---

## Definition of done لكل validator

- ✅ `AbstractValidator<T>` في `{Project}.Bll/Validators/{Domain}/`.
- ✅ message keys في **كل** ملفات اللغة.
- ✅ validator unit test (`TestValidate`) **أخضر**.
- ✅ `dotnet build` **zero warnings**؛ `dotnet test` **أخضر**.
- ✅ **الموديل المستهدف بس** هو اللي اتأثّر (auto-validation بتمسّ بس الموديلات اللي ليها validator).
