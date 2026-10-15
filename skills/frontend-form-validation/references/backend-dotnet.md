# Backend Comparison — .NET (FluentValidation) في ريبو منفصل

المقارنة اختيارية. لو المستخدم عايزها: **اطلب path للريبو بتاع الـ .NET backend**، وبعدها اشتغل بالخطوات دي. (لو مدّاش path، اعرض المقارنة كـ "متاحة" وكمّل التقرير frontend‑only.)

## Step 1 — لاقي الـ validators والـ DTOs في ريبو الباك
نفس convention الـ Clean Architecture بتاعة المستخدم (راجع skill: `dotnet-backend-validation`):
```bash
BE=/path/to/backend-repo
grep -rln "AbstractValidator<" --include=*.cs "$BE"          # غالبًا *.Bll/Validators/**
ls -R "$BE"/**/Dal/Models/Requests 2>/dev/null               # الـ request models
grep -rn "\[FromBody\]" --include=*.cs "$BE" | head          # ربط الـ endpoint بالـ DTO
```
لكل `AbstractValidator<TRequest>` اقرا الـ `RuleFor(x => x.Field)...` واستخرج القواعد:

| FluentValidation | المعنى |
|---|---|
| `.NotEmpty()` / `.NotNull()` | required |
| `.EmailAddress()` | email |
| `.MinimumLength(n)` / `.MaximumLength(n)` | طول |
| `.GreaterThanOrEqualTo(n)` / `.InclusiveBetween(a,b)` | مدى |
| `.Matches("regex")` | regex |
| `.NotEqual(x => x.Other)` / custom `.Must(...)` | cross‑field/custom |

## Step 2 — اربط كل frontend form بالـ DTO بتاعه
الـ frontend بيقول لك الـ endpoint عن طريق الـ API service/calls:
```bash
grep -rn "http.post\|httpClient.post\|axios.post\|fetch(" --include=*.ts --include=*.tsx src/ | grep -i "api"
```
- خُد الـ endpoint URL (مثلاً `POST /api/users`) → دوّر على الـ controller action اللي عليه الـ route ده في الباك → الـ `[FromBody] TRequest` بتاعها → الـ validator بتاع `TRequest`.
- لو الربط مش واضح (مفيش endpoint صريح)، طابق بالاسم (form `UserCreate` ↔ `CreateUserRequest`) **وقول إن الربط بالاسم مش بالـ route**.

## Step 3 — الـ mismatch matrix (لكل field)
قارن قاعدة الـ frontend بقاعدة الباك واطلّع status:

| Status | المعنى | الخطورة |
|---|---|---|
| ✅ **Consistent** | الاتنين بيتحققوا بنفس المعنى | — |
| 🔴 **Frontend‑only** | متحقق frontend، **مش** في الباك | **High — security gap** (الـ client بيتباي‑باس) |
| 🔴 **Backend‑only** | متحقق في الباك، **مش** frontend | **Medium‑High — UX gap** (المستخدم بياخد 400) |
| 🟡 **Divergent** | الاتنين بيتحققوا بس **بقواعد مختلفة** (مثلاً maxLength 50 vs 100) | Medium — inconsistency |
| ⚪ **One side only** | الـ field نفسه موجود ناحية واحدة | راجع (DTO drift) |

### تفسير الخطورة (مهم للتقرير)
- **Frontend‑only = الأخطر**: الـ client validation للـ UX بس؛ أي حد يبعت request مباشر يعدّي. القاعدة دي **لازم** تكون موجودة في الباك. (التطبيق في الباك → `dotnet-backend-validation`.)
- **Backend‑only = UX سيّئ**: التطبيق آمن بس المستخدم بيكتشف الغلط بعد الـ round‑trip. الحل: نضيف نفس القاعدة في الـ frontend (Phase 2 بتاعتنا).
- **Divergent**: حدّد مين الأصح (عادة الباك هو الـ authority للحدود) ووحّد.

## ملاحظات
- **متعدّلش الباك من هنا.** أي إصلاح في الباك → حوّل لـ `dotnet-backend-validation`. الـ skill دي بتظبّط الـ **frontend** بس.
- لو الباك مش .NET (Node/Java/إلخ) — نفس المنطق: لاقي طبقة الـ validation، استخرج القواعد، اعمل الـ matrix؛ بس استخراج القواعد هيختلف حسب الـ framework.
- لو معندكش access للريبو وقت التشغيل، استنتج توقّعات الباك من الـ DTO shapes/الـ error responses بس **وعلّمها كاستنتاج مش تأكيد**.
