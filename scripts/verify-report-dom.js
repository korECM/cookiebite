// verify-report-dom.js — runs INSIDE the page (via agent-browser eval) and returns
// one viewport's measurements as JSON for build-verification-report.mjs to classify.
// Deterministic geometry/contrast/keyboard/chart/capability evidence only; meaning
// judgments are left to manualReview.
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
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return parseRgb(bg);
      node = node.parentElement;
    }
    return parseRgb(getComputedStyle(document.body).backgroundColor);
  }

  const CB = window.CB;
  const mode = (CB && CB.theme && CB.theme.mode) ? CB.theme.mode() : 'light';
  const view = { width: window.innerWidth, theme: mode };

  view.overflow = document.documentElement.scrollWidth > window.innerWidth + 1
    ? document.documentElement.scrollWidth : false;

  view.charts = [...document.querySelectorAll('[role="img"]')].map((host) => {
    const rect = host.getBoundingClientRect();
    return {
      id: host.id ? `#${host.id}` : '[role=img]',
      hasAria: !!(host.getAttribute('aria-label') || host.getAttribute('aria-labelledby')),
      hasDataAlt: !!host.querySelector('table'),
      degenerate: rect.width < 2 || rect.height < 2,
      baselineTruncated: host.hasAttribute('data-cb-baseline-truncated'),
    };
  });

  view.contrast = [...document.querySelectorAll('p, li, h1, h2, h3, td, th, a, figcaption, small')]
    .slice(0, 80)
    .map((el) => {
      const cs = getComputedStyle(el);
      if (!el.textContent.trim() || cs.visibility === 'hidden' || cs.display === 'none') return null;
      const ratio = contrast(parseRgb(cs.color), effectiveBg(el));
      return { selector: el.tagName.toLowerCase(), ratio, required: 4.5, kind: 'text' };
    })
    .filter((c) => c && c.ratio < 4.5); // only report failures; keeps the payload small

  view.keyboard = [...document.querySelectorAll('button, a[href], [tabindex], summary')]
    .map((el) => ({ selector: el.id ? `#${el.id}` : el.tagName.toLowerCase(), reachable: el.tabIndex >= 0 && !el.disabled }));

  view.surfaces = document.querySelectorAll('[class*="card"], [style*="box-shadow"], section > div[style*="background"]').length;
  view.shadows = [...document.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el).boxShadow;
    return s && s !== 'none';
  }).length;
  view.icons = document.querySelectorAll('svg, [class*="icon"]').length;
  view.controls = document.querySelectorAll('button, input, select, [role="button"]').length;
  view.docLength = document.body.textContent.replace(/\s+/g, ' ').trim().length;
  view.hasNav = !!document.querySelector('nav, [role="navigation"], a[href^="#"]');

  view.calledAtRuntime = (CB && CB.calls)
    ? [...new Set(CB.calls.filter((c) => c.type === 'call').map((c) => c.capability))]
    : [];

  return JSON.stringify(view);
}());
