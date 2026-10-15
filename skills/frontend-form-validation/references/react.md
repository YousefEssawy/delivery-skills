# React — detecting, reading, and writing validation (adaptive)

React has no single way to do forms. **Detect the approach in this order** (higher = stronger source of
truth):

1. Is there a **schema (Zod / Yup)**? → the schema is the source of truth, even when used inside
   RHF / Formik.
2. **React Hook Form** wiring?
3. **Formik**?
4. **Controlled / native** (last, lowest confidence)?

```bash
grep -rln "from 'zod'\|from \"zod\"\|from 'yup'\|from \"yup\"" --include=*.ts --include=*.tsx src/
grep -rln "useForm\|register(\|zodResolver\|yupResolver\|formState" --include=*.tsx --include=*.jsx src/
grep -rln "useFormik\|<Formik\|validationSchema\|<Field\|<ErrorMessage" --include=*.tsx --include=*.jsx src/
```

---

## (1) Schema — Zod / Yup
If there is `zodResolver(schema)` or `validationSchema={schema}`, all the rules are in the schema.

**Zod**
```ts
const schema = z.object({
  email:  z.string().email().max(254),
  phone:  z.string().regex(/^01[0125]\d{8}$/),   // example: Egyptian mobile
  name:   z.string().min(2).max(50),
  age:    z.number().int().min(18).max(120).optional(),
});
```
| In the schema | Meaning |
|---|---|
| `.optional()` / `.nullish()` | **optional** |
| otherwise / `.nonempty()` / `z.string().min(1)` | required |
| `.email()` `.url()` `.regex()` `.min()` `.max()` `.int()` | format / length / range |
| `.refine()` / `.superRefine()` | cross‑field / custom |

Note: `z.string()` accepts an empty string; a "required" text field needs `.min(1)` (or `.nonempty()`).

**Yup**: same idea — explicit `.required()`, `.optional()`, `.email()`, `.min()/.max()`,
`.matches(re)`, `.test()` for custom rules.

**Writing (Phase 2)**: edit **the schema** itself (not the JSX):
```ts
// before
phone: z.string(),
// after
phone: z.string().regex(/^01[0125]\d{8}$/, 'errors.phoneInvalid'),
```

---

## (2) React Hook Form (rules inside register)
If there is **no resolver / schema**, the rules live in `register`:
```tsx
<input {...register('email', {
  required: 'errors.required',
  pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'errors.email' },
  maxLength: 254,
})} />
{errors.email && <span>{errors.email.message}</span>}
```
| In register | Meaning |
|---|---|
| `required` | required |
| `minLength` / `maxLength` / `min` / `max` | length / range |
| `pattern` | regex |
| `validate: fn` | custom |
| the field is registered with no rules | **optional / no validation** |

**Writing**: add to the field's options object:
```tsx
{...register('phone', { required: 'errors.required',
  pattern: { value: /^01[0125]\d{8}$/, message: 'errors.phoneInvalid' } })}
```
> If the form has a schema, **do not write in register** — write in the schema.

---

## (3) Formik
```tsx
const formik = useFormik({
  initialValues: { email: '' },
  validationSchema: Yup.object({ email: Yup.string().email().required() }),
  // or: validate: (values) => { ... return errors }
});
<input name="email" value={formik.values.email} onChange={formik.handleChange} />
{formik.touched.email && formik.errors.email}
```
- If there is a `validationSchema` (usually Yup) → read / write the schema (see the Yup section above).
- If there is a `validate` function → the rules are inside it; add the condition + the message to the
  errors object.

---

## (4) Controlled / native (lowest confidence)
The hardest case: `useState` per field + `onChange`, with validation either manual in a handler or as
native attributes.
```tsx
const [email, setEmail] = useState('');
<input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
```
- Read: the native attrs (`required`, `type`, `pattern`, `minLength`) + any manual check in
  `handleSubmit` / `onChange`.
- **Mark the confidence "medium / low"** in the report — static detection is not 100% reliable here.
- **Writing**: add validation logic in the handler with state for the message (do not introduce a new
  library). Use the project's message convention (an i18n key, or its language's text):
  ```tsx
  const [errors, setErrors] = useState<Record<string,string>>({});
  const validate = () => {
    const e: Record<string,string> = {};
    if (!/^01[0125]\d{8}$/.test(phone)) e.phone = t('errors.phoneInvalid');
    setErrors(e); return Object.keys(e).length === 0;
  };
  ```
  If the form has many inputs with no validation at all, **suggest** moving to RHF / Zod instead of
  patching by hand — but that is a suggestion, not something to do without permission.

---

## Common React traps
- **schema + register together**: the schema is what runs; any rule in register is noise / misleading
  — say so.
- `<Controller>` (for UI libraries like MUI) — the rules are in its `rules` prop or in the schema.
- A field in the schema but **not rendered**, or rendered but **not in the schema** = a weak point.
- Manual validation that only runs on submit does not prevent bad state — note the timing.
