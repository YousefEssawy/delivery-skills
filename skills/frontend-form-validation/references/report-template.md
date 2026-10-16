# Report template

Write the report **in the user's language**. The default is plain markdown in chat (structure and
example below). **Optional:** if the user writes Arabic and the `arabic-tech-explainer` skill is
installed, render the same structure as an RTL widget through that skill (see
[Optional: RTL widget](#optional-rtl-widget-via-arabic-tech-explainer)).

## Mandatory structure (in order)
1. **Summary** — number of forms · number of fields · how many fields have validation · number of
   gaps · number of mismatches · **overall risk** (Low / Medium / High). Plus a line if you sampled.
2. **A table per form** — columns: `Field` · `Type (inferred)` · `Required/Optional` ·
   `Frontend rules` · `Backend rules` · `Status` · `Suggested rule`.
3. **Weak points ranked by severity** — High → Medium → Low, each with a short reason (why it is
   High).
4. **Frontend ↔ Backend mismatches** — if the backend was checked; focus on the 🔴 security gaps and
   the 🔴 UX gaps.
5. **What is done well** — positives, not only gaps.
6. **Suggestions + an explicit question** — "Which suggestions should I apply?", then wait for
   approval (Phase 2).

## Markdown example (default)

```markdown
## Forms audit — Users module
3 forms · 14 fields · 9 with validation · 5 gaps · 2 mismatches · overall risk: **High**

### Login form
| Field | Type | Req/Opt | Frontend | Backend | Status | Suggested |
|---|---|---|---|---|---|---|
| email | Email | Required | required | NotEmpty, EmailAddress | 🟡 | add email format |
| password | Password | Required | — none | NotEmpty, MinimumLength(8) | 🔴 | required, minLength(8) |

### Weak points
- **High** — `password` in Login has no frontend validation while the backend requires
  `MinimumLength(8)`: UX gap.

### Done well
- `email` is required on both sides.

**Which suggestions should I apply?** Tell me the numbers / forms and I will apply only those.
```

## Optional: RTL widget via arabic-tech-explainer

Use this path only when the user writes Arabic and `arabic-tech-explainer` is installed. **Do not write
the CSS from scratch** — load the `mockup` module (`visualize:read_me` modules:["mockup"]) and start
from the template in `arabic-tech-explainer/references/rtl_widget_template.md`. The structure above
still applies.

### Typography rules (the same as arabic-tech-explainer)
- Container `dir="rtl"` and `text-align:right`.
- **Every English run / number inside Arabic text is isolated** with `<bdi class="en">…</bdi>` and
  `.en{unicode-bidi:isolate}`. This is the most important rule — it prevents scrambling.
- Code / regex blocks: `direction:ltr; text-align:left; unicode-bidi:isolate; white-space:pre;
  font-mono`.
- Number cells in tables: mono + isolated so they do not reorder.
- **All colours are CSS variables** (`var(--color-text-primary)` …) — **no** hard-coded hex. Use an
  Arabic font (IBM Plex Sans Arabic).
- The widget `title` is snake_case and specific (for example `forms_audit_report_users_module`).

### Widget example (shorten / extend to fit the data)
```html
<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',sans-serif;text-align:right;
  color:var(--color-text-primary);background:var(--color-background-primary);
  padding:20px;border-radius:12px;line-height:1.9">

  <h2 style="margin:0 0 4px">تقرير أوديت الفورمز — <bdi class="en">Users module</bdi></h2>
  <p style="margin:0 0 16px;color:var(--color-text-secondary)">
    اتفحص <bdi class="en">3</bdi> forms · <bdi class="en">14</bdi> fields ·
    عليها validation <bdi class="en">9</bdi> · gaps <bdi class="en">5</bdi> ·
    mismatches <bdi class="en">2</bdi>
  </p>

  <!-- كروت الملخص -->
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
    <div style="flex:1;min-width:120px;background:var(--color-background-secondary);
      border:1px solid var(--color-border-primary);border-radius:10px;padding:12px">
      <div style="color:var(--color-text-secondary);font-size:.85em">Risk عام</div>
      <div style="font-weight:700;color:var(--color-danger,#c0392b)">High</div>
    </div>
    <!-- كرر للكروت التانية -->
  </div>

  <!-- جدول الفورم -->
  <h3>Login form</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <thead><tr style="background:var(--color-background-secondary)">
      <th style="padding:8px;text-align:right">Field</th>
      <th style="padding:8px;text-align:right">Type</th>
      <th style="padding:8px;text-align:right">Req/Opt</th>
      <th style="padding:8px;text-align:right">Frontend</th>
      <th style="padding:8px;text-align:right">Backend</th>
      <th style="padding:8px;text-align:center">Status</th>
      <th style="padding:8px;text-align:right">Suggested</th>
    </tr></thead>
    <tbody>
      <tr style="border-top:1px solid var(--color-border-primary)">
        <td style="padding:8px"><bdi class="en">email</bdi></td>
        <td style="padding:8px">Email</td>
        <td style="padding:8px">Required</td>
        <td style="padding:8px"><bdi class="en">required</bdi></td>
        <td style="padding:8px"><bdi class="en">NotEmpty, EmailAddress</bdi></td>
        <td style="padding:8px;text-align:center;color:var(--color-warning,#b8860b)">🟡</td>
        <td style="padding:8px">ضيف <bdi class="en">email</bdi> format</td>
      </tr>
      <tr style="border-top:1px solid var(--color-border-primary)">
        <td style="padding:8px"><bdi class="en">password</bdi></td>
        <td style="padding:8px">Password</td>
        <td style="padding:8px">Required</td>
        <td style="padding:8px;color:var(--color-danger,#c0392b)">— لا يوجد</td>
        <td style="padding:8px"><bdi class="en">NotEmpty, MinimumLength(8)</bdi></td>
        <td style="padding:8px;text-align:center;color:var(--color-danger,#c0392b)">🔴</td>
        <td style="padding:8px"><bdi class="en">required, minLength(8)</bdi></td>
      </tr>
    </tbody>
  </table>

  <!-- نقاط الضعف -->
  <h3>نقاط الضعف (مرتّبة)</h3>
  <div style="border-right:4px solid var(--color-danger,#c0392b);
    background:var(--color-background-secondary);padding:10px 12px;border-radius:8px;margin-bottom:8px">
    <b>High —</b> <bdi class="en">password</bdi> في الـ Login مفيهوش أي validation frontend
    بينما الباك بيطلب <bdi class="en">MinimumLength(8)</bdi> = UX gap + خطر.
  </div>

  <!-- regex block (LTR معزول) -->
  <pre style="direction:ltr;text-align:left;unicode-bidi:isolate;white-space:pre;
    font-family:ui-monospace,monospace;background:var(--color-background-secondary);
    padding:10px;border-radius:8px;overflow:auto">phone: /^01[0125]\d{8}$/</pre>

  <!-- السؤال -->
  <p style="margin-top:14px"><b>تحب أطبّق أنهي اقتراحات؟</b> قولّي الأرقام/الفورمز وأنا أنفّذ المعتمد بس.</p>
</div>
```

## After the report
Write a one- or two-line takeaway + your explicit question about what to apply. If something is
worrying (a security gap), call it out clearly. **Do not apply anything before the user chooses.**
