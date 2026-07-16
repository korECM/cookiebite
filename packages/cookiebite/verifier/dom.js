// verifier/dom.js — runs INSIDE the page (via agent-browser eval) and returns
// one viewport's measurements as JSON for verifier/classify.mjs.
// v3: charts are [data-slot=chart] Recharts SVGs; theme is .dark on <html>.
(function measureViewport() {
  function parseRgb(value) {
    const nums = (value.match(/[\d.]+/g) || []).map(Number);
    return nums.length >= 3 ? [nums[0], nums[1], nums[2]] : [255, 255, 255];
  }
  function luminance(rgb) {
    const channel = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
  }
  function contrast(fg, bg) {
    const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  }
  function effectiveBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const nums = (bg.match(/[\d.]+/g) || []).map(Number);
        // TW opacity utilities (bg-primary/10) resolve to rgba(r,g,b,a) where
        // r,g,b are the opaque token — ignoring a would treat a 10% wash as
        // solid primary and false-fail text contrast. Skip translucent layers.
        const alpha = nums.length >= 4 ? nums[3] : 1;
        if (alpha >= 0.99) return [nums[0], nums[1], nums[2]];
      }
      node = node.parentElement;
    }
    return parseRgb(getComputedStyle(document.body).backgroundColor);
  }
  // Table/code scroll wrappers intentionally clip; don't flag their inner text.
  function hasScrollXAncestor(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  }

  const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const view = { width: window.innerWidth, theme: mode };

  view.overflow = document.documentElement.scrollWidth > window.innerWidth + 1
    ? document.documentElement.scrollWidth : false;

  // Per-[data-slot=chart] Recharts SVG presence + shape count.
  view.charts = [...document.querySelectorAll('[data-slot=chart]')].map((host) => {
    const svg = host.querySelector('.recharts-wrapper svg') || host.querySelector('svg');
    const shapes = svg ? svg.querySelectorAll('path, rect, circle') : [];
    const chartId = host.getAttribute('data-chart');
    return {
      id: chartId ? `[data-chart=${chartId}]` : '[data-slot=chart]',
      hasSvg: !!svg,
      shapeCount: shapes.length,
      empty: !svg || shapes.length === 0,
    };
  });

  // Text clips — skip scroll-wrapper noise.
  view.clips = [];
  [...document.querySelectorAll('body *')].forEach((el) => {
    if (view.clips.length >= 20) return;
    if (el.scrollWidth <= el.clientWidth + 4 || el.clientWidth <= 1) return;
    if (/\bsr-only\b/.test(el.className || '')) return;
    if (hasScrollXAncestor(el)) return;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) return;
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis') {
      view.clips.push({
        selector: el.tagName.toLowerCase(),
        measured: `${el.scrollWidth}>${el.clientWidth}`,
        reason: 'text is clipped by overflow',
      });
    }
  });

  view.contrast = [...document.querySelectorAll('p, li, h1, h2, h3, td, th, a, figcaption, small')]
    .slice(0, 80)
    .map((el) => {
      const cs = getComputedStyle(el);
      if (!el.textContent.trim() || cs.visibility === 'hidden' || cs.display === 'none') return null;
      const ratio = contrast(parseRgb(cs.color), effectiveBg(el));
      return { selector: el.tagName.toLowerCase(), ratio, required: 4.5, kind: 'text' };
    })
    .filter((c) => c && c.ratio < 4.5);

  // tabindex="-1" is intentional (e.g. Recharts internals) — not a defect.
  view.keyboard = [...document.querySelectorAll(
    'button, a[href], summary, [tabindex]:not([tabindex="-1"])',
  )]
    .map((el) => ({
      selector: el.id ? `#${el.id}` : el.tagName.toLowerCase(),
      reachable: el.tabIndex >= 0 && !el.disabled,
    }));

  view.surfaces = document.querySelectorAll('[data-slot="card"]').length;
  view.shadows = [...document.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el).boxShadow;
    return s && s !== 'none';
  }).length;
  view.icons = document.querySelectorAll('svg, [class*="icon"]').length;
  view.controls = document.querySelectorAll('button, input, select, [role="button"]').length;
  view.docLength = document.body.textContent.replace(/\s+/g, ' ').trim().length;
  view.hasNav = !!document.querySelector('nav, [role="navigation"], a[href^="#"]');

  // Container crowding — text touching the content-box edge of a card or
  // strip cell ([data-cb-cell]), or short phrases wrapping ≥3 lines in a card.
  function containerLeafSelector(el) {
    const parts = [];
    let node = el;
    for (let depth = 0; node && depth < 6; depth += 1) {
      let part = node.tagName.toLowerCase();
      const slot = node.getAttribute && node.getAttribute('data-slot');
      const cell = node.getAttribute && node.getAttribute('data-cb-cell');
      if (slot) part += `[data-slot=${slot}]`;
      if (cell) part += `[data-cb-cell=${cell}]`;
      parts.unshift(part);
      if (slot === 'card' || cell) break;
      node = node.parentElement;
    }
    return parts.join('>');
  }
  function isVisibleTextLeaf(el) {
    if (el.children && el.children.length > 0) return false;
    const text = (el.textContent || '').trim();
    if (!text) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    return true;
  }

  view.crowdedText = [];
  view.excessiveWrap = [];
  function collectContainerCrowding(container, { wrap } = { wrap: false }) {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const padRight = parseFloat(getComputedStyle(container).paddingRight) || 0;
    const contentRight = rect.right - padRight;
    [...container.querySelectorAll('*')].forEach((el) => {
      if (!isVisibleTextLeaf(el)) return;
      const text = el.textContent.trim();
      const elRect = el.getBoundingClientRect();
      const selector = containerLeafSelector(el);
      // 표는 셀 패딩이 간격을 소유 — container 경계 기준 crowding 측정 대상이 아님.
      const inTable = el.closest('[data-slot=table-container]') !== null;
      if (!inTable && elRect.right > contentRight - 2) {
        view.crowdedText.push({
          ruleId: 'crowded-text',
          selector,
          measured: { gapPx: contentRight - elRect.right },
        });
      }
      if (wrap && text.length <= 16) {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
        const lines = Math.round(elRect.height / lineHeight);
        if (lines >= 3) {
          view.excessiveWrap.push({
            ruleId: 'excessive-wrap',
            selector,
            measured: { lines, chars: text.length },
          });
        }
      }
    });
  }
  [...document.querySelectorAll('[data-slot=card]')].forEach((card) => {
    collectContainerCrowding(card, { wrap: true });
  });
  [...document.querySelectorAll('[data-cb-cell]')].forEach((cell) => {
    collectContainerCrowding(cell, { wrap: false });
  });

  return JSON.stringify(view);
}());
