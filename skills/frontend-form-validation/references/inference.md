# Inference engine — inferring the right validation

Goal: for every field **missing validation**, infer its type and propose rules. Sources for inference:
the input `type` + the field / control **name** + the `label` / `placeholder` (lowercase them and strip
`_` / `-` / camelCase before matching). Field names and labels may be in any of the product's languages
— the table lists English signals plus Arabic examples; add the product's other languages.

> **Core rule**: the **format** can be proposed with confidence. **required/optional** is a business
> decision — propose and ask, never assume.

## Full inference table

| Semantic | Signals (type / name~) | Proposed rules |
|---|---|---|
| **Email** | `type=email`; `email`,`mail`,`e-mail` | the built‑in email validator + `maxLength(254)` + trim |
| **Local mobile** | `type=tel`; `phone`,`mobile`,`tel`,`موبايل`,`تليفون` | the target market's format (see [Locale defaults](#locale-defaults)), e.g. Egypt `^01[0125]\d{8}$` (11 digits) |
| **Intl phone** | the word `international` / a country-code field, or a multi-country product | E.164: `^\+?[1-9]\d{7,14}$` |
| **Person name** | `name`,`firstName`,`lastName`,`fullName`,`الاسم` | `min(2)`,`max(50)`, letters in the product's scripts (`NAME_RE`) |
| **Username** | `username`,`userName`,`login` | `min(3)`,`max(30)`, `^[a-zA-Z0-9._-]+$` |
| **Password** | `type=password`; `password`,`pwd` | `min(8)`,`max(128)` + complexity (`PWD_RE`) |
| **Confirm pwd** | `confirm`,`repeat`,`re-?password` | required + **match** the password field |
| **National ID** | `nationalId`,`ssn`,`الرقم القومي` | the target country's format, e.g. Egypt `^[23]\d{13}$` (14 digits) — basic |
| **Age** | `type=number`; `age`,`السن` | integer, `min(18 or 0)`, `max(120)` |
| **Money / price** | `price`,`amount`,`salary`,`cost`,`السعر` | numeric, `>=0`, decimal scale per currency (usually 2), a sensible max |
| **Quantity** | `qty`,`quantity`,`count`,`الكمية` | integer, `>=1` |
| **Date** | `type=date`; `date`,`التاريخ` | valid date + (min / max depending on context) |
| **DOB** | `dob`,`birth`,`تاريخ الميلاد` | valid date + **not in the future** + minimum age |
| **URL** | `type=url`; `url`,`website`,`link` | the built‑in url validator |
| **OTP / code** | `otp`,`code`,`pin`,`verification` | exactly N digits: `^\d{N}$` |
| **IBAN** | `iban` | basic shape + (optional mod‑97) `^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$` |
| **Postal / zip** | `zip`,`postal` | per country |
| **Free text** | everything else / `description`,`notes` | required(?) + a sensible `maxLength` (255/500/1000 by context) + trim |
| **Checkbox/terms** | `agree`,`terms`,`accept` | must be true (Angular: `requiredTrue`; Zod: `.literal(true)`) |

## Regex library (JS)

```js
INTL_PHONE = /^\+?[1-9]\d{7,14}$/;             // E.164
NAME_RE   = /^[\p{L}\p{M} .'\-]+$/u;            // letters of any script + marks + spaces (needs the u flag)
USERNAME  = /^[a-zA-Z0-9._-]+$/;
PWD_RE    = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,128}$/;
IBAN_RE   = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

// Egypt block (use when the product targets Egypt)
EG_MOBILE = /^01[0125]\d{8}$/;                 // 010/011/012/015 + 8 digits
EG_NID    = /^[23]\d{13}$/;                     // 14 digits, first digit = century
```

Practical notes:
- **email / url**: prefer the built‑in validator (`Validators.email`, zod `.email()`, yup `.email()`)
  over a hand-written regex.
- **NAME_RE / PWD_RE** need a `RegExp` with the `u` / other flags — in Angular use a RegExp object, not
  a string.
- **NAME_RE** accepts letters of every script. If the product only accepts some scripts (for example
  Arabic + Latin), narrow it with script classes such as `\p{Script=Arabic}` and `\p{Script=Latin}`.
- **EG_NID** is a basic check (14 digits + century digit). The full check (birth date + governorate +
  checksum) is optional — offer it as "optional hardening".
- Inside an HTML `pattern` attribute, write digit classes as `[0-9]`, for example
  `^01[0125][0-9]{8}$`.

## Locale defaults

Pick the defaults from the locales and markets found in Step 0, not from a fixed country:

- **Phone**: one target country → that country's mobile format; several countries or unknown → E.164
  (`INTL_PHONE`), ideally with a country selector.
- **Names**: allow every script the product's users write in (not Latin only).
- **National ID / postal code**: only when the product targets a specific country; use that country's
  format.
- **Currency**: decimal scale per currency (most use 2).

**Egypt block** (apply when the product targets Egypt):
- mobile = the Egyptian format (`EG_MOBILE`);
- names allow **Arabic + Latin**;
- national ID = the Egyptian format (`EG_NID`, 14 digits);
- currency EGP, decimal scale = 2.

For another market, add its block in the same shape (mobile, national ID, postal code, currency), and
ask when the market is not clear.

> Always present these defaults as **editable suggestions**, and ask when the target market is unclear.

## When the inference is uncertain
- Type not clear from the name / type → propose "free text" + a safe `maxLength`, and mark it **low
  confidence**.
- Required or optional not clear → **don't guess**; write "unspecified — confirm" and ask (check the
  backend if available, since it is the clearest signal).
- A field with a rule on the backend but none on the frontend → the direct suggestion = mirror the
  backend rule (consistency).
