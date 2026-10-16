# RTL Arabic-with-English Widget Template

This is the canonical starting point for an `arabic-tech-explainer` widget. Copy it, then replace the content sections with the translated explanation. The CSS classes below are what keep mixed Arabic/English text from scrambling — do not drop the `unicode-bidi:isolate` rules.

## Setup before rendering

Call `visualize:read_me` with `modules: ["mockup"]` once per session (silently), then call `visualize:show_widget` with:
- a descriptive snake_case `title`
- 1–3 short `loading_messages` in the same Arabic variety as the explanation (keep them boring/neutral if the content is sensitive)
- the `widget_code` below, with content swapped in

## The template

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap">
<div dir="rtl" style="font-family:'IBM Plex Sans Arabic', var(--font-sans); line-height:1.9; font-size:16px; color:var(--color-text-primary); padding:1rem 0; text-align:right;">
<h2 class="sr-only">[one-line description of what this explains, in Arabic]</h2>

<style>
/* Callout boxes */
.box{background:var(--color-background-secondary); border-radius:var(--border-radius-lg); padding:14px 18px; margin:14px 0;}
.hi{background:var(--color-background-success); border-radius:var(--border-radius-lg); padding:14px 18px; margin:14px 0;}
.warn{background:var(--color-background-warning); border-radius:var(--border-radius-lg); padding:14px 18px; margin:14px 0;}

/* Code / formula block: LTR, left-aligned, isolated so internal order survives the RTL page */
.code{direction:ltr; text-align:left; font-family:var(--font-mono); font-size:14px; background:var(--color-background-primary); border:0.5px solid var(--color-border-tertiary); border-radius:var(--border-radius-md); padding:12px 14px; margin:12px 0; overflow-x:auto; white-space:pre; unicode-bidi:isolate; line-height:1.6;}

/* THE critical rule: every inline English/Latin run is isolated */
.en{unicode-bidi:isolate;}

/* Inline mono "chip" for metric values / params, also isolated */
.kv{font-family:var(--font-mono); unicode-bidi:isolate; background:var(--color-background-secondary); padding:1px 6px; border-radius:4px; font-size:14px;}

/* Tables: right-aligned text, isolated+centered numeric cells */
table{width:100%; border-collapse:collapse; margin:12px 0; font-size:15px;}
th,td{border:0.5px solid var(--color-border-tertiary); padding:8px 12px; text-align:right; vertical-align:top;}
th{background:var(--color-background-secondary); font-weight:500;}
td.num,th.num{font-family:var(--font-mono); unicode-bidi:isolate; text-align:center; font-size:14px;}
td.c{text-align:center; font-size:16px;}

h3{font-size:16px; font-weight:500; margin:22px 0 6px;}
.lead{font-weight:500; font-size:14px; color:var(--color-text-secondary); margin:14px 0 2px;}
</style>

<!-- ===== CONTENT STARTS ===== -->

<h3>عنوان القسم بالعربي</h3>
<p>شرح بالعامية المصرية، والمصطلح زي <bdi class="en">embeddings</bdi> يفضل إنجليزي، والرقم زي <span class="kv">0.7029</span> معزول كمان.</p>

<!-- A formula or code block -->
<div class="code">P = sigmoid( w_bkt·logit(BKT) + w_ability·logit(ability) + bias )</div>

<!-- A comparison table -->
<table>
<tr><th>الـ Model</th><th class="num">AUC</th><th>بيمسك إيه</th></tr>
<tr><td><bdi class="en">Ability floor</bdi></td><td class="num">0.7029</td><td>قدرة الطالب بشكل عام</td></tr>
<tr><td><bdi class="en">Extracted BKT+A</bdi></td><td class="num">0.7429</td><td>+ ضعف في skill معيّن</td></tr>
</table>

<!-- A warning/caveat callout (use for the source's honest hedges) -->
<div class="warn">
<p style="margin:0; color:var(--color-text-warning);"><strong>خلي بالك:</strong> النقطة اللي المصدر حذّر منها، بالعربي والمصطلح <bdi class="en">confound</bdi> إنجليزي.</p>
</div>

<!-- A positive/takeaway callout -->
<div class="hi">
<p style="margin:0; color:var(--color-text-success);">الخلاصة المهمة في القسم ده.</p>
</div>

<!-- ===== CONTENT ENDS ===== -->

</div>
```

## Rules recap (why each piece exists)

- `dir="rtl"` + `text-align:right` — the page flows the natural Arabic direction.
- `.en { unicode-bidi:isolate }` on every `<bdi>` — **this is the fix for scrambling.** Each English token becomes its own isolated bidi run, so the surrounding Arabic can't drag it out of place. If you see scrambling, you forgot an isolation wrapper.
- `.kv` chips — for metric values and parameter names inline in prose, both styled and isolated in one move.
- `.code` block — `direction:ltr` + `white-space:pre` + `isolate` so a formula like `(correct+1)/(answered+2)` keeps its left-to-right order on an RTL page.
- `td.num` — numeric table columns stay mono, centered, and isolated so they line up and don't flip.
- CSS variables only for color (`--color-text-primary`, `--color-background-secondary`, `--color-background-success`, `--color-background-warning`, `--color-text-success`, `--color-text-warning`, `--color-border-tertiary`, `--border-radius-lg`, etc.) — never hardcode hex, so it adapts to light/dark.
- IBM Plex Sans Arabic — clean Arabic glyphs; falls back to `var(--font-sans)`.

## Optional extra building blocks

**Progress / step strip** (e.g. "passed 3 of 12 gates"):
```html
<style>
.prog{display:flex; gap:6px; margin:12px 0;}
.cell{flex:1; height:30px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:12px; unicode-bidi:isolate;}
.done{background:var(--color-background-success); color:var(--color-text-success); font-weight:600;}
.todo{background:var(--color-background-secondary); color:var(--color-text-tertiary);}
</style>
<div class="prog">
<div class="cell done">1</div><div class="cell done">2</div><div class="cell todo">3</div>
</div>
```

**Two-column side-by-side** (e.g. contrasting two concepts):
```html
<style>
.two{display:flex; gap:10px; margin:12px 0; flex-wrap:wrap;}
.col{flex:1; min-width:200px; background:var(--color-background-secondary); border-radius:var(--border-radius-lg); padding:14px 16px;}
.col h4{margin:0 0 6px; font-size:14px; font-weight:600;}
</style>
<div class="two">
<div class="col"><h4>المفهوم الأول</h4><p>شرحه</p></div>
<div class="col"><h4>المفهوم التاني</h4><p>شرحه</p></div>
</div>
```
