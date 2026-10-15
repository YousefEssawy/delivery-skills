# Report Template — التقرير كـ RTL widget

التقرير بيتعرض عن طريق skill: **`arabic-tech-explainer`**. **متعملش CSS من الأول** — حمّل الـ `mockup` module (`visualize:read_me` modules:["mockup"]) واستخدم الـ template في `arabic-tech-explainer/references/rtl_widget_template.md` كنقطة بداية. اللي تحت ده هو **الستراكتشر الإلزامي + مثال** تتكيّف بيه.

## قواعد التايبوجرافي (نفس قواعد arabic-tech-explainer)
- container `dir="rtl"` و `text-align:right`.
- **كل English/رقم جوه عربي يتعزل** بـ `<bdi class="en">…</bdi>` و `.en{unicode-bidi:isolate}`. ده أهم شيء — يمنع الـ scrambling.
- code/regex blocks: `direction:ltr; text-align:left; unicode-bidi:isolate; white-space:pre; font‑mono`.
- خلايا الأرقام في الجداول: mono + معزولة عشان متلخبطش.
- **كل الألوان CSS variables** (`var(--color-text-primary)` …) — **ممنوع** hex ثابت. وخط عربي (IBM Plex Sans Arabic).
- الـ widget `title` snake_case ومميّز (مثلاً `forms_audit_report_users_module`).

## الستراكتشر الإلزامي (بالترتيب)
1. **ملخص (Summary)** — كروت/سطور أرقام: عدد الفورمز · عدد الـ fields · كام field عليه validation · عدد الـ gaps · عدد الـ mismatches · **risk عام** (Low/Medium/High). + سطر لو عملت sampling.
2. **جدول لكل form** — أعمدة: `Field` · `Type (inferred)` · `Required/Optional` · `Frontend rules` · `Backend rules` · `Status` · `Suggested rule`.
3. **نقاط الضعف مرتّبة severity** — High ← Medium ← Low، كل واحدة بسبب قصير (ليه دي High).
4. **Frontend ↔ Backend mismatch** — لو الباك متفحص؛ ركّز على الـ 🔴 security gaps والـ 🔴 UX gaps.
5. **اللي معمول كويس** — positive، مش بس النواقص.
6. **اقتراحات + سؤال صريح** — "تحب أطبّق أنهي اقتراحات؟" ثم استنى الموافقة (Phase 2).

## مثال widget (اختصره/وسّعه حسب البيانات)
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

## بعد الـ widget (chat عادي)
اكتب سطر/اتنين takeaway + سؤالك الصريح عن اللي يتطبّق. لو فيه حاجة مقلقة (security gap)، نبّه عليها بوضوح. **متطبّقش حاجة قبل ما المستخدم يختار.**
