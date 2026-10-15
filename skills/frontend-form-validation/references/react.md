# React — اكتشاف، قراءة، وكتابة الفاليديشن (adaptive)

React مفيهاش طريقة واحدة. **اكتشف الـ approach بالترتيب ده** (الأعلى = الأقوى كـ source of truth):

1. **Schema (Zod / Yup)** موجود؟ → الـ schema هو الـ source of truth، حتى لو متستخدم جوه RHF/Formik.
2. **React Hook Form** wiring؟
3. **Formik**؟
4. **Controlled / native** (آخر حاجة، أقل ثقة)؟

```bash
grep -rln "from 'zod'\|from \"zod\"\|from 'yup'\|from \"yup\"" --include=*.ts --include=*.tsx src/
grep -rln "useForm\|register(\|zodResolver\|yupResolver\|formState" --include=*.tsx --include=*.jsx src/
grep -rln "useFormik\|<Formik\|validationSchema\|<Field\|<ErrorMessage" --include=*.tsx --include=*.jsx src/
```

---

## (1) Schema — Zod / Yup
لو فيه `zodResolver(schema)` أو `validationSchema={schema}`، الـ rules كلها في الـ schema.

**Zod**
```ts
const schema = z.object({
  email:  z.string().email().max(254),
  phone:  z.string().regex(/^01[0125]\d{8}$/),
  name:   z.string().min(2).max(50),
  age:    z.number().int().min(18).max(120).optional(),
});
```
| في الـ schema | المعنى |
|---|---|
| `.optional()` / `.nullish()` | **optional** |
| غير كده / `.nonempty()` / `z.string().min(1)` | required |
| `.email()` `.url()` `.regex()` `.min()` `.max()` `.int()` | format/طول/مدى |
| `.refine()` / `.superRefine()` | cross‑field / custom |

**Yup**: نفس الفكرة — `.required()` صريحة، `.optional()`, `.email()`, `.min()/.max()`, `.matches(re)`, `.test()` للـ custom.

**الكتابة (Phase 2)**: عدّل **الـ schema** نفسه (مش الـ JSX):
```ts
// قبل
phone: z.string(),
// بعد
phone: z.string().regex(/^01[0125]\d{8}$/, 'errors.phoneInvalid'),
```

---

## (2) React Hook Form (rules جوه register)
لو **مفيش resolver/schema**، الـ rules بتكون في `register`:
```tsx
<input {...register('email', {
  required: 'errors.required',
  pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'errors.email' },
  maxLength: 254,
})} />
{errors.email && <span>{errors.email.message}</span>}
```
| في register | المعنى |
|---|---|
| `required` | required |
| `minLength` / `maxLength` / `min` / `max` | طول/مدى |
| `pattern` | regex |
| `validate: fn` | custom |
| الـ field متعمله register من غير rules | **optional / من غير validation** |

**الكتابة**: ضيف للـ options object بتاع الـ field:
```tsx
{...register('phone', { required: 'errors.required',
  pattern: { value: /^01[0125]\d{8}$/, message: 'errors.phoneInvalid' } })}
```
> لو الفورم فيه schema، **متكتبش في register** — اكتب في الـ schema.

---

## (3) Formik
```tsx
const formik = useFormik({
  initialValues: { email: '' },
  validationSchema: Yup.object({ email: Yup.string().email().required() }),
  // أو: validate: (values) => { ... return errors }
});
<input name="email" value={formik.values.email} onChange={formik.handleChange} />
{formik.touched.email && formik.errors.email}
```
- لو فيه `validationSchema` (Yup عادة) → اقرا/اكتب في الـ schema (شوف قسم Yup فوق).
- لو فيه `validate` function → الـ rules جواها؛ ضيف الشرط + الرسالة في الـ errors object.

---

## (4) Controlled / native (أقل ثقة)
الحالة الأصعب: `useState` لكل field + `onChange`، والـ validation إما manual في handler أو attributes native.
```tsx
const [email, setEmail] = useState('');
<input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
```
- اقرا: الـ native attrs (`required`, `type`, `pattern`, `minLength`) + أي check يدوي في `handleSubmit`/`onChange`.
- **علّم الثقة "متوسطة/منخفضة"** في التقرير — الـ static detection هنا مش مضمون 100%.
- **الكتابة**: ضيف validation logic في الـ handler مع state للرسالة (متدخّلش library جديدة):
  ```tsx
  const [errors, setErrors] = useState<Record<string,string>>({});
  const validate = () => {
    const e: Record<string,string> = {};
    if (!/^01[0125]\d{8}$/.test(phone)) e.phone = 'رقم الموبايل غير صحيح';
    setErrors(e); return Object.keys(e).length === 0;
  };
  ```
  لو الفورم فيه inputs كتير من غير أي validation، **اقترح** على المستخدم إنه ينقل للـ RHF/Zod بدل ما نرقّع يدوي — بس ده اقتراح، مش تنفيذ من غير إذن.

---

## فخاخ شائعة في React
- **schema + register سوا**: الـ schema هو اللي بيشتغل؛ أي rule في register بيبقى noise/مضلّل — قول كده.
- `<Controller>` (للـ UI libraries زي MUI) — الـ rules في الـ `rules` prop بتاعته أو في الـ schema.
- field في الـ schema بس **مش متعمله render**، أو متعمله render بس **مش في الـ schema** = نقطة ضعف.
- التحقق اليدوي اللي بيحصل بس على submit مش بيمنع الـ state السيء — لاحظ التوقيت.
