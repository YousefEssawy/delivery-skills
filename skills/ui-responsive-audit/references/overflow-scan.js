/*
 * Horizontal-overflow scanner.
 *
 * Paste this into the page via your browser tool's "run JavaScript" action (it is an IIFE that
 * returns a JSON string). Run it:
 *   - after loading each page,
 *   - after opening each dialog / drawer / popover,
 *   - after typing into fields or loading content that can grow,
 *   - and again after resizing the viewport SHORT (to force a vertical scrollbar).
 *
 * It answers three questions:
 *   1. Does the whole PAGE scroll horizontally?  (pageHasHScroll)
 *   2. Which elements overflow their own box and are NOT inside a deliberate horizontal scroller?
 *      (offenders — these are the real bugs; each comes with a CSS selector to fix)
 *   3. Which elements extend past the right edge of the viewport, or, for elements laid out RTL,
 *      past the left edge?  (pastViewport; each entry says which edge)
 *
 * Scope it to a subtree by passing a selector, e.g. run it against an open dialog:
 *   window.__overflowScan('[role=dialog], dialog[open], .mat-mdc-dialog-surface')
 * (add your app's own dialog selector if it uses a custom component)
 * With no argument it scans the whole document.
 *
 * A wide element inside an `overflow-x: auto/scroll` ancestor is INTENTIONAL horizontal scroll
 * (e.g. a data table) and is deliberately ignored — the bug is a scrollbar somewhere that was
 * never meant to have one.
 */
window.__overflowScan = function (rootSelector) {
  const roots = rootSelector
    ? Array.from(document.querySelectorAll(rootSelector))
    : [document.body];

  const vw = window.innerWidth;
  const de = document.documentElement;

  // Is a given element inside an ancestor that legitimately scrolls horizontally?
  const inHorizontalScroller = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
      p = p.parentElement;
    }
    return false;
  };

  const cssPath = (el) => {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 4) {
      let sel = node.tagName.toLowerCase();
      if (node.id) { sel += '#' + node.id; parts.unshift(sel); break; }
      const cls = (node.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) sel += '.' + cls.join('.');
      parts.unshift(sel);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  const offenders = [];
  const pastViewport = [];

  for (const root of roots) {
    const all = root.querySelectorAll('*');
    for (const el of all) {
      const cw = el.clientWidth;
      // element's own content is wider than its box → it overflows itself
      if (el.scrollWidth - cw > 1 && cw > 40 && !inHorizontalScroller(el)) {
        const cs = getComputedStyle(el);
        offenders.push({
          selector: cssPath(el),
          scrollWidth: el.scrollWidth,
          clientWidth: cw,
          overflowX: cs.overflowX,
          overflowY: cs.overflowY, // overflow-y:auto is the usual culprit that forces overflow-x:auto
        });
      }
      // element sticks out past the right edge (LTR overflow) or the left edge (RTL overflow)
      const r = el.getBoundingClientRect();
      if (r.width > 20 && r.width <= 3000 && !inHorizontalScroller(el)) {
        const pastRight = r.right - vw;
        // Past the left edge only matters in RTL; in LTR it is the usual off-canvas trick
        // (skip links at left:-9999px, closed drawers) and never makes the page scroll.
        const pastLeft = getComputedStyle(el).direction === 'rtl' ? -r.left : 0;
        if (pastRight > 1 || pastLeft > 1) {
          pastViewport.push({
            selector: cssPath(el),
            edge: pastRight > 1 ? 'right' : 'left',
            by: Math.round(Math.max(pastRight, pastLeft)),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
      }
    }
  }

  // De-duplicate by selector, keep the worst.
  const dedupe = (arr, key) => {
    const m = new Map();
    for (const o of arr) { const k = o.selector; if (!m.has(k) || o[key] > m.get(k)[key]) m.set(k, o); }
    return Array.from(m.values());
  };

  return JSON.stringify({
    viewport: { width: vw, height: window.innerHeight },
    pageHasHScroll: de.scrollWidth > de.clientWidth,
    pageScrollWidth: de.scrollWidth,
    pageClientWidth: de.clientWidth,
    offenders: dedupe(offenders, 'scrollWidth').slice(0, 15),
    pastViewport: dedupe(pastViewport, 'by').slice(0, 15),
  }, null, 1);
};

// Auto-run against the whole document when pasted, so a bare paste already returns a result.
window.__overflowScan();
