---
name: arabic-tech-explainer
description: Explain technical English content in Egyptian Arabic (or another Arabic variety the user asks for) with English technical terms kept, rendered as a clean right-to-left widget where every English term, number, formula and code snippet is bidi-isolated so mixed Arabic and English text never scrambles. Use WHENEVER the user pastes English technical material (ML/AI write-ups, papers, design docs, analyses, math) and asks to "explain this in arabic", "اشرح ده بالعربي", or says a previous Arabic answer looked scrambled or unclear because of mixed RTL and English ("can't understand", "rtl arabic with english", "the output not clear"). Also use for follow-up explanations in the same style. The output is a visualize:show_widget rendering, not plain chat prose, because plain markdown is what scrambles bidirectional text.
---

# Arabic Technical Explainer

Explain English technical content for an Arabic-speaking engineer who wants the **explanation** in Arabic (Egyptian Arabic by default) but the **technical terms** kept in English. The hard part is not translation — it's typography. Mixed Arabic (RTL) and English/numbers/code (LTR) scrambles badly in normal chat markdown: term order flips, numbers jump to the wrong side of a sentence, tables and formulas break. This skill solves that by rendering into an RTL widget where every Latin-script run is bidi-isolated.

## Why a widget and not chat prose

Plain markdown in the chat is the thing that breaks. When you write Egyptian Arabic with inline English like "الـ AUC طلع 0.7029"، the browser's bidirectional algorithm frequently reorders the English token and the number relative to the surrounding Arabic, so the reader sees them in the wrong place. Readers hit exactly this and complain that the answer is unreadable — that is the core reason this skill exists. Do **not** answer these requests in chat prose. Render a `visualize:show_widget` with `dir="rtl"` and isolate every Latin run. If the visualizer is unavailable, fall back to chat prose but wrap each English/number run so it stays put (see Fallback below).

## The workflow

1. **Read the source carefully.** Understand the actual technical content — the argument, the numbers, the causal logic — before translating. A good explanation in this style is faithful to the reasoning, not a word-for-word translation. Preserve the author's honest hedges ("this is small but real", "not yet — confounded") rather than flattening them.

2. **Silently load the mockup module.** Call `visualize:read_me` with `modules: ["mockup"]` before the first `show_widget` of a session. Do not narrate this call — just do it, then render. (You only need to load it once per session.)

3. **Decide the dialect/term split.** Narration, connective tissue, and explanation go in **Egyptian Arabic** (عامية مصرية) by default, not Modern Standard Arabic — this is conversational explanation, not a formal report. If the user writes in another dialect (Gulf, Levantine, Maghrebi...) or asks for Modern Standard Arabic, use that instead; the typography rules below are the same for every variety. Technical terms, library names, metric names, math symbols, numbers, code, and file names stay in **English**, exactly as written in the source. Never translate a technical term into Arabic (don't turn "embeddings" into "تضمينات"). When introducing an English term inside Arabic prose, prefix it with the Arabic article "الـ" where it reads naturally: "الـ embeddings", "الـ AUC".

4. **Render the widget** following the structure and styling rules below.

5. **After the widget, add a short prose follow-up in chat** (this part can be normal chat text): a one or two line takeaway, and — when you have something substantive — your own honest technical commentary on the content (caveats, things the source glossed over, what you'd check). The user values being pushed back on, not just transcribed. Keep this brief; the widget carries the explanation.

## Widget structure

Wrap everything in a single RTL container and use these building blocks as the content needs them (not every section every time):

- **Lead line** — one sentence framing what this chunk is about, in the chosen Arabic variety.
- **Section headings** (`<h3>`) — short, in the chosen Arabic variety, numbered with Arabic-Indic or Western numerals as fits.
- **Prose paragraphs** — the explanation. Arabic with isolated English terms.
- **Tables** — for comparisons, metric breakdowns, before/after. Right-aligned cells; numeric columns use the mono + isolated style.
- **Code / formula blocks** — LTR, left-aligned, monospace, isolated as a whole.
- **Callout boxes** — neutral (`.box`), success/positive (`.hi`), or warning/caution (`.warn`) for the source's caveats and "be careful about" notes.

Keep it scannable. This reader is an engineer skimming for the argument and the numbers — favor short paragraphs, tables over walls of text, and put the source's honest caveats in visually distinct callouts so they don't get lost.

## The non-negotiable typography rules

These are what make the output readable. Read `references/rtl_widget_template.md` for the full copy-paste template with the exact CSS — use it as the starting point every time rather than reinventing the styles.

1. **Container is `dir="rtl"`** with `text-align:right`.
2. **Every Latin-script run is bidi-isolated.** Wrap inline English terms in `<bdi class="en">...</bdi>` and give `.en { unicode-bidi:isolate; }`. This is the single most important rule — it's what stops the scrambling. A bare English word sitting in Arabic prose without isolation is a bug.
3. **Numbers and metric values** that sit inside Arabic prose also get isolated — either inside a `<bdi>` or via the `.kv` (key-value) mono chip style. "AUC 0.7029" must not reorder.
4. **Code and formula blocks are `direction:ltr; text-align:left; unicode-bidi:isolate; white-space:pre`** so the math/code reads left-to-right with its own internal order intact, regardless of the RTL page.
5. **Table numeric cells** use a mono, centered, isolated class so columns of numbers line up and don't flip.
6. **Use CSS variables for all colors** (`var(--color-text-primary)`, `var(--color-background-secondary)`, etc.) and load an Arabic-friendly font (IBM Plex Sans Arabic) so the Arabic renders cleanly. Never hardcode hex colors.
7. **Title/identifier** for the widget is snake_case and descriptive of the specific content (e.g. `granularity_confound_arabic_explainer`), so multiple explainers in one conversation stay distinguishable.

## What good looks like

- Reads like a sharp colleague explaining the paper to you over coffee in their own Arabic, not like a stiff translation.
- Every English term is exactly the term from the source, sitting cleanly in its place — no scrambling, no reordering.
- The technical reasoning survives: blends, gates, confounds, ceilings, causal traps are explained correctly, with the source's hedges intact.
- Tables and formulas are crisp and correctly oriented.
- The follow-up chat message adds genuine value (a caveat or check), not just "hope that helps".

## Fallback when the visualizer is unavailable

If `visualize:show_widget` can't be used, answer in chat but still defend against scrambling: keep technical terms in English, and where a number or term would reorder, you can wrap it. Warn the user that chat rendering of mixed RTL/LTR is inherently fragile and offer the widget if the tool becomes available. Optionally offer to produce a Word/PDF file (useful when the explanation is a deliverable to share), in which case use the docx/pdf skills and set the document direction to RTL.

## Reference files

- `references/rtl_widget_template.md` — the full copy-paste HTML/CSS template with the exact isolation classes, table styles, callout boxes, and code-block styling. Start from this every time.
