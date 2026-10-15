# Inference Engine — استنتاج الفاليديشن المناسب

الهدف: لكل field **ناقص validation**، نستنتج نوعه ونقترح الـ rules. مصادر الاستنتاج: الـ input `type` + **اسم** الـ field/control + الـ `label`/`placeholder` (lowercase + شيل `_`/`-`/camelCase قبل المطابقة).

> **قاعدة أساسية**: الـ **format** ممكن تقترحه بثقة. الـ **required/optional** قرار business — اقترح واسأل، متفترضش.

## جدول الاستنتاج الكامل

| Semantic | إشارات (type / name~) | الـ rules المقترحة |
|---|---|---|
| **Email** | `type=email`؛ `email`,`mail`,`e-mail` | الـ built‑in email + `maxLength(254)` + trim |
| **EG mobile** | `type=tel`؛ `phone`,`mobile`,`tel`,`موبايل`,`تليفون` | `^01[0125]\d{8}$` (11 رقم) |
| **Intl phone** | فيه كلمة `international`/كود دولة | E.164: `^\+?[1-9]\d{7,14}$` |
| **Person name** | `name`,`firstName`,`lastName`,`fullName`,`الاسم` | `min(2)`,`max(50)`، حروف عربي/لاتيني (`NAME_RE`) |
| **Username** | `username`,`userName`,`login` | `min(3)`,`max(30)`، `^[a-zA-Z0-9._-]+$` |
| **Password** | `type=password`؛ `password`,`pwd` | `min(8)`,`max(128)` + complexity (`PWD_RE`) |
| **Confirm pwd** | `confirm`,`repeat`,`re-?password` | required + **match** للـ password field |
| **National ID (EG)** | `nationalId`,`ssn`,`الرقم القومي` | `^[23]\d{13}$` (14 رقم) — basic |
| **Age** | `type=number`؛ `age`,`السن` | integer، `min(18 أو 0)`،`max(120)` |
| **Money / price** | `price`,`amount`,`salary`,`cost`,`السعر` | numeric، `>=0`، decimal scale=2، حد أقصى منطقي |
| **Quantity** | `qty`,`quantity`,`count`,`الكمية` | integer، `>=1` |
| **Date** | `type=date`؛ `date`,`التاريخ` | تاريخ صحيح + (حد أدنى/أقصى حسب السياق) |
| **DOB** | `dob`,`birth`,`تاريخ الميلاد` | تاريخ صحيح + **مش في المستقبل** + حد أدنى للعمر |
| **URL** | `type=url`؛ `url`,`website`,`link` | الـ built‑in url |
| **OTP / code** | `otp`,`code`,`pin`,`verification` | بالظبط N رقم: `^\d{N}$` |
| **IBAN** | `iban` | شكل أساسي + (مود‑97 اختياري) `^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$` |
| **Postal / zip** | `zip`,`postal` | حسب الدولة |
| **Free text** | الباقي / `description`,`notes` | required(?) + `maxLength` معقول (255/500/1000 حسب السياق) + trim |
| **Checkbox/terms** | `agree`,`terms`,`accept` | لازم true (Angular: `requiredTrue`؛ Zod: `.literal(true)`) |

## Regex library (نسخة JS)

```js
EG_MOBILE = /^01[0125]\d{8}$/;                 // 010/011/012/015 + 8 أرقام
INTL_PHONE = /^\+?[1-9]\d{7,14}$/;             // E.164
NAME_RE   = /^[\p{L}\p{M} .'\-]+$/u;            // عربي + لاتيني + مسافات (لازم u flag)
USERNAME  = /^[a-zA-Z0-9._-]+$/;
PWD_RE    = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,128}$/;
EG_NID    = /^[23]\d{13}$/;                     // 14 رقم، أول رقم = القرن
IBAN_RE   = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
```

ملاحظات تطبيقية:
- **email/url**: فضّل الـ built‑in (`Validators.email`, zod `.email()`, yup `.email()`) على regex بإيد.
- **NAME_RE / PWD_RE** محتاجين `RegExp` بـ `u`/flags — في Angular استخدم RegExp object مش string.
- **EG_NID** ده فحص أساسي (14 رقم + century digit). الفحص الكامل (تاريخ + محافظة + checksum) اختياري — اعرضه كـ "اختياري للتشديد".
- **EG_MOBILE** داخل HTML `pattern` attribute: استخدم `^01[0125][0-9]{8}$` (الـ `\d` مش مضمون في كل المتصفحات).

## EG locale defaults (تتطبّق افتراضيًا)
- الموبايل = الشكل المصري (فوق). لو المشروع دولي، اسأل وبدّل لـ `INTL_PHONE`.
- الأسماء بتسمح **عربي + لاتيني** (مش لاتيني بس).
- National ID = الشكل المصري (14 رقم). 
- العملة الافتراضية decimal scale = 2.

> دايمًا اعرض الـ defaults دي كـ **اقتراحات قابلة للتعديل**، واسأل لو السياق مش مصري/عربي.

## لما الاستنتاج مش مؤكّد
- النوع مش واضح من الاسم/النوع → اقترح "free text" + `maxLength` آمن، وعلّمها **منخفضة الثقة**.
- required ولا optional مش واضح → **متخمّنش**؛ اكتب "غير محدّد — أكّد" واسأل (راجع الباك لو متاح لأنه أوضح إشارة).
- field فيه قاعدة في الباك بس مفيش في الـ frontend → الاقتراح المباشر = اعكس قاعدة الباك (consistency).
