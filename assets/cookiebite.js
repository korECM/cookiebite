/* ============================================================================
   cookiebite.js — hosted runtime: invariant boilerplate + COOKIEBITE.* fast-path
   helpers + exposed escape-hatch primitives. 0 model tokens.

   PHILOSOPHY (frozen): a HELPER LIBRARY + EXPOSED PRIMITIVES, never a closed
   framework. The fast path (kpis/findings/timeline/table/chart/pill/callout)
   emits the SAME markup the references teach, so a hand-author can paste the
   identical raw HTML and get identical behavior. Anything bespoke drops to raw
   HTML + exposed primitives (tokens via CSS vars, baseChart, css, accentRgba,
   number helpers, registerChart). Both share the same tokens.

   TWO PHASES in ONE file:
     PHASE A — runs synchronously the instant this tag is parsed, BEFORE the
       Tailwind Play CDN <script> below it. Assigns window.tailwind.config so
       cdn.tailwindcss.com reads it on load. (head ordering: step 6 then step 7.)
     PHASE B — defines the COOKIEBITE namespace + window.* backward-compat
       aliases, reads theme vars once, and registers ONE DOMContentLoaded
       auto-init (lucide, hydrate, TOC observer, theme toggle, glossary, resize).
       Safe on DOMContentLoaded because echarts/alpine(defer)/lucide/tippy are
       parsed by then (load order guarantees it).
   ============================================================================ */
(function () {
  'use strict';

  /* ==========================================================================
     PHASE A — Tailwind config (MUST precede the Tailwind CDN tag).
     Verbatim from assets/template.html (the historical lines 76-95).
     ========================================================================== */
  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        colors: {
          bg: 'var(--c-bg)', surface: 'var(--c-surface)', primary: 'var(--c-primary)', secondary: 'var(--c-secondary)',
          'text-disabled': 'var(--c-disabled)', placeholder: 'var(--c-placeholder)',
          line: 'var(--c-line)', 'line-weak': 'var(--c-line-weak)', 'disabled-bg': 'var(--c-disabled-bg)',
          critical: 'var(--c-critical)', cautionary: 'var(--c-cautionary)', positive: 'var(--c-positive)', informative: 'var(--c-informative)',
          accent: 'var(--accent)', 'accent-strong': 'var(--accent-strong)',
          'accent-weak': 'var(--accent-weak)', 'accent-on': 'var(--accent-on)',
        },
        borderColor: { DEFAULT: 'var(--c-line-weak)' },
        borderRadius: { xxs: '4px', xs: '8px', small: '12px', medium: '16px', large: '24px', xlarge: '32px' },
        boxShadow: {
          xs: '0 1px 2px rgba(0,0,0,0.5)', sm: '0 2px 8px rgba(0,0,0,0.15)',
          md: '0 8px 20px rgba(0,0,0,0.12)', lg: '0 7px 30px rgba(0,0,0,0.2)',
        },
        // px-valued scale: key N renders exactly N px. Keys are filled DENSELY
        // across the icon/spacing range on purpose — this is `extend`, so any GAP
        // falls back to Tailwind's default REM scale (e.g. w-14 -> 3.5rem -> 56px),
        // which silently blows up icon sizes. Icons should use w-16/w-20/w-24
        // (16/20/24px); do NOT reach for std-Tailwind w-4/w-5/w-6 expecting
        // 16/20/24px — here w-4 = 4px, w-6 = 6px (tiny). See craft.md "Icons".
        spacing: {
          '1': '1px', '2': '2px', '3': '3px', '4': '4px', '5': '5px', '6': '6px', '7': '7px',
          '8': '8px', '9': '9px', '10': '10px', '11': '11px', '12': '12px', '14': '14px',
          '16': '16px', '18': '18px', '20': '20px', '24': '24px', '28': '28px', '32': '32px',
          '36': '36px', '40': '40px', '44': '44px', '48': '48px', '52': '52px', '56': '56px',
          '60': '60px', '64': '64px', '72': '72px', '80': '80px', '96': '96px',
        },
        fontSize: {
          'caption-12': ['12px', '16px'], 'body-14': ['14px', '20px'], 'body-16': ['16px', '24px'],
          'body-18': ['18px', '26px'], 'title-20': ['20px', '28px'], 'title-24': ['24px', '30px'],
          // headline steps fluid-scale so a long H1 doesn't overflow on phones (headline-48-no-fluid-scale)
          'title-28': ['28px', '36px'], 'headline-36': ['clamp(26px, 5.5vw, 36px)', '1.18'], 'headline-48': ['clamp(30px, 7vw, 48px)', '1.12'],
        },
      },
    },
  };

  /* ==========================================================================
     PHASE B — COOKIEBITE namespace.
     ========================================================================== */
  var CB = (window.COOKIEBITE = window.COOKIEBITE || {});

  /* ---- locale-aware number helpers (driven by window.REPORT_LOCALE) ----
     REPORT_LOCALE is set synchronously in <head> BEFORE this file (head step 4c). */
  var L = window.REPORT_LOCALE || { number: 'en-US', currency: 'USD', symbol: '$', bigUnits: false };
  var nf = new Intl.NumberFormat(L.number);
  var money = function (n) { return L.symbol + nf.format(n); };
  var moneyShort = function (n) {
    // band on the MAGNITUDE then re-apply the sign, so negatives short-form too.
    // round to the band's 1-decimal precision BEFORE selecting the band, so a value
    // just under a boundary (999,999 -> '1.0M', 99,999,999 -> '1.0억') rolls up into
    // the next band instead of reading '1000K' / '10000만'.
    var sign = n < 0 ? '-' : '';
    var a = Math.abs(n);
    var band = function (div, unit) { return sign + (Math.round(a / div * 10) / 10).toFixed(1).replace(/\.0$/, '') + unit; };
    if (L.bigUnits) {
      if (Math.round(a / 1e4) >= 1e4) return band(1e8, '억'); // 만-band would round to >=10000만 -> roll to 억
      return a >= 1e8 ? band(1e8, '억') : a >= 1e4 ? sign + Math.round(a / 1e4) + '만' : nf.format(n);
    }
    if (Math.round(a / 1e6 * 10) / 10 >= 1000) return band(1e9, 'B'); // M-band would round to >=1000M -> roll to B
    if (Math.round(a / 1e3 * 10) / 10 >= 1000) return band(1e6, 'M'); // K-band would round to >=1000K -> roll to M
    return a >= 1e9 ? band(1e9, 'B') : a >= 1e6 ? band(1e6, 'M') : a >= 1e3 ? band(1e3, 'K') : nf.format(n);
  };
  CB.nf = nf;
  CB.money = money;
  CB.moneyShort = moneyShort;
  /* SKILL.md historically named won/wonShort, which never existed. Provide them
     as aliases of money/moneyShort so old docs/snippets keep working. */
  CB.won = money;
  CB.wonShort = moneyShort;

  /* ---- shared ECharts theme (accent + neutral grid + report font) ----
     Canvas charts don't follow CSS vars, so we read tokens into JS and re-read
     them on a dark/light toggle (readThemeVars). Accent is unchanged across
     modes; only the neutral grid/axis/text colors flip. */
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
  CB.css = css;

  /* module-level theme constants — rebuilt by readThemeVars on every toggle */
  CB.theme = { ACCENT: '', ACCENT_STRONG: '', C_LINE: '', C_SECONDARY: '', C_NEUTRAL: '', FONT: '' };
  CB.baseChart = {};

  function readThemeVars() {
    var t = CB.theme;
    t.ACCENT = css('--accent');
    t.ACCENT_STRONG = css('--accent-strong');
    t.C_LINE = css('--c-line-weak') || '#E4E4E7';
    t.C_SECONDARY = css('--c-secondary') || '#52525B';
    t.C_NEUTRAL = css('--c-disabled') || '#A1A1AA';
    t.FONT = css('--font-family') || 'Inter, sans-serif';
    CB.baseChart = {
      color: [t.ACCENT, t.ACCENT_STRONG, t.C_NEUTRAL, t.C_SECONDARY],
      textStyle: { fontFamily: t.FONT },
      animation: CB.MOTION_OK,
      legend: { textStyle: { color: t.C_SECONDARY } },
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      // hideOverlap drops colliding category labels (long Korean product names / URLs)
      // instead of letting them overprint; authors needing all labels pass axisLabel.rotate.
      xAxis: { axisLine: { lineStyle: { color: t.C_LINE } }, axisTick: { show: false }, axisLabel: { color: t.C_SECONDARY, hideOverlap: true } },
      yAxis: { splitLine: { lineStyle: { color: t.C_LINE } }, axisLabel: { color: t.C_SECONDARY } },
    };
    syncThemeAliases();
  }
  CB.readThemeVars = readThemeVars;

  /* CB.categoricalColors(n) -> [color×n]: n on-theme colors from ONE accent family,
     for multi-series charts that need more than the 4 baseChart entries. The skill's
     thesis is "one accent, never the library's rainbow", so the palette is a BOUNDED
     hue arc (±~50° around the accent) with modulated lightness — 4-6 series stay
     recognizably one family instead of rotating the full 360° wheel. Derives via HSL
     around the accent's hue (resolved to rgb so non-hex accents work too). n<=1
     returns just the accent. Leaves baseChart's default 4-entry palette untouched. */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s, l];
  }
  CB.categoricalColors = function (n) {
    n = n || 1;
    var raw = CB.theme.ACCENT || '#E8552D', r, g, b;
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
      var h = raw.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      var m = (cssColor('--accent', '#E8552D') || '').match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; } else { r = 232; g = 85; b = 45; }
    }
    if (n <= 1) return [CB.theme.ACCENT || raw];
    var hsl = rgbToHsl(r, g, b), baseH = hsl[0], s = Math.max(0.45, hsl[1]), l0 = Math.min(0.62, Math.max(0.42, hsl[2]));
    // bounded arc: sweep hue across a ±50° span centered on the accent, and ramp
    // lightness across the same span, so the series read as one accent family
    // (NOT a rainbow). For n=1 the single entry sits exactly on the accent hue.
    var ARC = 50; // total half-spread in degrees
    var out = [];
    for (var i = 0; i < n; i++) {
      var f = n === 1 ? 0 : (i / (n - 1)) - 0.5; // -0.5 .. +0.5 across the arc
      var h = ((baseH + ARC * 2 * f) % 360 + 360) % 360;
      var l = Math.min(0.66, Math.max(0.40, l0 + 0.10 * f)); // gentle L ramp, bounded
      out.push('hsl(' + Math.round(h) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%)');
    }
    return out;
  };

  /* CB.ramp(n) -> [color×n]: n shades of ONE accent hue, light -> dark, for
     SEQUENTIAL/ordered data (funnel steps, a stacked area of one metric across
     segments, a heatmap visualMap). categoricalColors is for PEER series (sweeps
     hue); ramp keeps the SAME hue and ramps lightness only, so an ordered series
     reads as "more vs less", not "different things". Re-reads the live accent so
     it follows dark re-theme. n<=1 returns just the accent. */
  function accentHsl() {
    var raw = CB.theme.ACCENT || '#E8552D', r, g, b;
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
      var h = raw.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      var m = (cssColor('--accent', '#E8552D') || '').match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; } else { r = 232; g = 85; b = 45; }
    }
    return rgbToHsl(r, g, b);
  }
  CB.ramp = function (n) {
    n = n || 1;
    if (n <= 1) return [CB.theme.ACCENT || '#E8552D'];
    var hsl = accentHsl(), baseH = Math.round(hsl[0]), s = Math.round(Math.max(0.42, hsl[1]) * 100);
    // ramp lightness across a bounded band (dark ~38% -> light ~72%) on the accent's
    // own hue+sat. i=0 is the DARKEST (heaviest emphasis — funnel top, peak density);
    // later steps lighten. Bounded so neither end blows out to black/white.
    var L_DARK = 0.38, L_LIGHT = 0.72, out = [];
    for (var i = 0; i < n; i++) {
      var l = L_DARK + (L_LIGHT - L_DARK) * (i / (n - 1));
      out.push('hsl(' + baseH + ',' + s + '%,' + Math.round(l * 100) + '%)');
    }
    return out;
  };

  /* accent as rgba (handles #RGB and #RRGGBB) — sparkline fills, gradient stops.
     Non-hex accents (rgb()/named/color-mix) resolve through the cssColor probe so
     we never emit rgba(NaN,...). */
  var accentRgba = function (a) {
    var raw = CB.theme.ACCENT || '';
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
      var h = raw.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }
    // not a #hex value — resolve via the throwaway probe (cssColor is a hoisted
    // function declaration, callable here at runtime) and parse rgb()/rgba().
    var c = cssColor('--accent', '#E8552D');
    var m = (c || '').match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) {
      return 'rgba(' + Math.round(+m[1]) + ',' + Math.round(+m[2]) + ',' + Math.round(+m[3]) + ',' + a + ')';
    }
    return c || 'rgba(0,0,0,' + a + ')';
  };
  CB.accentRgba = accentRgba;

  /* reduced-motion gate, exposed for bespoke motion */
  CB.MOTION_OK = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ==========================================================================
     window.* backward-compat aliases.
     Existing example reports (and any regenerated against the runtime) reach
     css/readThemeVars/baseChart/accentRgba/ACCENT/… on window. Keep them live.
     ========================================================================== */
  function syncThemeAliases() {
    var t = CB.theme;
    window.ACCENT = t.ACCENT; window.ACCENT_STRONG = t.ACCENT_STRONG;
    window.C_LINE = t.C_LINE; window.C_SECONDARY = t.C_SECONDARY; window.C_NEUTRAL = t.C_NEUTRAL;
    window.FONT = t.FONT; window.baseChart = CB.baseChart;
  }
  window.css = css;
  window.readThemeVars = readThemeVars;
  window.accentRgba = accentRgba;
  window.nf = nf;
  window.money = money;
  window.moneyShort = moneyShort;

  readThemeVars(); // initial read (also primes window.* aliases)

  /* ==========================================================================
     Chart re-theme registry — preserves the "canvas re-reads CSS vars on toggle
     and re-render" contract for ARBITRARY hand-written charts (and Mermaid).
     Generalizes the track()/charts[] + readThemeVars+re-render pattern the
     example reports already hand-roll.
     ========================================================================== */
  var charts = [];          // [{ instance, renderFn }]
  var themeCbs = [];        // bare onThemeChange callbacks

  // prune registry entries whose DOM left the document (re-render replaced innerHTML
  // and orphaned the old echarts instance) — dispose them so canvases/ResizeObservers
  // are released and the registry self-heals instead of growing unbounded.
  function pruneCharts() {
    for (var i = charts.length - 1; i >= 0; i--) {
      var inst = charts[i] && charts[i].instance;
      var dom = inst && inst.getDom && inst.getDom();
      if (!dom || !document.contains(dom)) {
        try { if (inst && inst.dispose) inst.dispose(); } catch (e) {}
        charts.splice(i, 1);
      }
    }
  }

  // CB.disposeIn(scope) — dispose+unregister any chart whose DOM lives inside `scope`,
  // called BEFORE a helper replaces scope.innerHTML so re-running CB.chart/kpis/hydrate
  // on the same target doesn't leak the previous echarts instance into charts[].
  CB.disposeIn = function (scope) {
    if (!scope) return;
    for (var i = charts.length - 1; i >= 0; i--) {
      var inst = charts[i] && charts[i].instance;
      var dom = inst && inst.getDom && inst.getDom();
      if (dom && (scope === dom || (scope.contains && scope.contains(dom)))) {
        try { if (inst && inst.dispose) inst.dispose(); } catch (e) {}
        charts.splice(i, 1);
      }
    }
  };

  CB.registerChart = function (instance, renderFn) {
    charts.push({ instance: instance, renderFn: renderFn || null });
    return instance;
  };
  CB.onThemeChange = function (cb) { if (typeof cb === 'function') themeCbs.push(cb); };

  function rethemeCharts() {
    pruneCharts(); // drop stale/detached instances first so we don't re-theme dead canvases
    charts.forEach(function (c) {
      if (!c.instance) return;
      try {
        if (typeof c.renderFn === 'function') c.renderFn(c.instance);
        else c.instance.setOption(CB.baseChart); // fallback: re-apply themed base
        c.instance.resize();
      } catch (e) { /* one bad chart must not break the toggle */ }
    });
  }

  /* ---- icons ---- */
  CB.refreshIcons = function () { if (window.lucide) window.lucide.createIcons(); };

  /* ==========================================================================
     tone primitive (components.md). The micro-helper every other component
     reuses. Returns STRINGS so they compose into any hand-written markup.
     tone -> {text class, tint bg, default icon}. amber uses /15, others /10.
     ========================================================================== */
  var TONE = {
    neutral: { text: 'text-secondary', tint: 'bg-disabled-bg', icon: 'minus' },
    info: { text: 'text-informative', tint: 'bg-informative/10', icon: 'info' },
    success: { text: 'text-positive', tint: 'bg-positive/10', icon: 'check' },
    warning: { text: 'text-cautionary', tint: 'bg-cautionary/15', icon: 'alert-triangle' },
    critical: { text: 'text-critical', tint: 'bg-critical/10', icon: 'octagon-x' },
  };
  function tone(name) { return TONE[name] || TONE.neutral; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function iconTag(name, cls) {
    return '<i data-lucide="' + esc(name) + '" class="' + (cls || 'w-12 h-12') + '"></i>';
  }

  /* shared empty-state affordance reused by kpis/findings/timeline/compare: a muted,
     centered "no data" line so a legitimately-empty section reads as "nothing to show"
     instead of a broken-looking blank box. Locale-aware; overridable via opts.emptyText. */
  function emptyState(msg) {
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var text = msg != null ? msg : (ko ? '데이터 없음' : 'No data');
    return '<div class="col-span-full text-center text-body-14 text-secondary py-24">' + esc(text) + '</div>';
  }

  /* ==========================================================================
     FAST-PATH HELPER 1/11 — COOKIEBITE.pill / COOKIEBITE.callout (one block: both
     are string-returning tone composites). pill -> inline tone chip; callout ->
     left-accent-bar boxed insight.
     ========================================================================== */
  /* COOKIEBITE.pill(label, {tone, icon?}) -> string */
  CB.pill = function (label, opts) {
    opts = opts || {};
    var t = tone(opts.tone);
    var icon = opts.icon === null ? '' : (opts.icon || t.icon);
    var ic = icon ? iconTag(icon, 'w-12 h-12') : '';
    return '<span class="inline-flex items-center gap-4 px-8 py-2 rounded-xxs ' + t.tint + ' ' + t.text +
      ' text-caption-12 font-medium">' + ic + esc(label) + '</span>';
  };

  /* COOKIEBITE.deltaBadge(text, {dir, tone, className?}) -> string
     The standalone stat-delta badge (▲ +12% / ▼ -3%): an arrow + tone-colored short
     token. Extracted from CB.kpis so the SAME canonical badge can drop into a Grid.js
     formatter, a compare cell, or inline prose without re-hand-rolling the arrow/tone.
     dir: 'up' | 'down' | (else flat '—' arrow). tone: any tone key (text color).
     min-w-0+truncate so a too-long phrase clips inside the badge (with a title tooltip)
     instead of overflowing. className adds layout context (CB.kpis passes 'mb-6'). */
  CB.deltaBadge = function (text, opts) {
    opts = opts || {};
    var dt = tone(opts.tone);
    var arrow = opts.dir === 'up' ? 'arrow-up-right' : opts.dir === 'down' ? 'arrow-down-right' : 'minus';
    return '<span class="inline-flex items-center gap-2 text-caption-12 font-semibold min-w-0 max-w-full ' +
      (opts.className ? esc(opts.className) + ' ' : '') + dt.text + '" title="' + esc(text) + '">' +
      iconTag(arrow, 'w-16 h-16 shrink-0') + ' <span class="truncate">' + esc(text) + '</span></span>';
  };

  /* COOKIEBITE.callout(html, {tone, icon?, title?}) -> string
     Left-accent-bar boxed insight. `html` is trusted author HTML (not escaped) so
     bold/links compose; `title` is escaped. */
  CB.callout = function (html, opts) {
    opts = opts || {};
    var t = tone(opts.tone);
    var icon = opts.icon === null ? '' : (opts.icon || t.icon);
    var borderTone = { neutral: 'border-line', info: 'border-informative', success: 'border-positive', warning: 'border-cautionary', critical: 'border-critical' }[opts.tone] || 'border-line';
    var ic = icon ? '<i data-lucide="' + esc(icon) + '" class="w-20 h-20 ' + t.text + ' shrink-0 mt-2"></i>' : '';
    var titleHtml = opts.title ? '<b>' + esc(opts.title) + '</b> ' : '';
    return '<div class="flex gap-12 rounded-medium ' + t.tint + ' border-l-4 ' + borderTone + ' p-16">' +
      ic + '<p class="text-body-14">' + titleHtml + html + '</p></div>';
  };

  /* COOKIEBITE.takeaway(pointsOrHtml, {title?}) -> string
     The prominent "Key takeaways / TL;DR" summary box prescribed for the 5-second rule —
     distinct from Callout (a one-liner) by being MULTI-POINT and summary-positioned (top
     of report). Accent-weak surface + accent-strong title so it reads as the headline.
     pointsOrHtml: an ARRAY of bullets — each a plain string OR { tone, text } for a
     tone-dotted point (2 wins + 1 risk) — OR a raw-HTML string (trusted, not escaped).
     title overrides the locale default ('Key takeaways' / '핵심 요약'). */
  CB.takeaway = function (pointsOrHtml, opts) {
    opts = opts || {};
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var title = opts.title != null ? opts.title : (ko ? '핵심 요약' : 'Key takeaways');
    var body;
    if (Array.isArray(pointsOrHtml)) {
      // tone-dotted bullets: a colored disc (reusing the tone dot vocabulary) + escaped text
      body = '<ul class="space-y-8">' + pointsOrHtml.map(function (p) {
        var txt = (p && typeof p === 'object') ? p.text : p;
        var dotTone = (p && typeof p === 'object' && p.tone) ? p.tone : 'neutral';
        var dot = TONE_DOT[dotTone] || 'bg-accent';
        return '<li class="flex gap-8 text-body-14">' +
          '<span class="mt-6 w-8 h-8 rounded-full shrink-0 ' + dot + '"></span>' +
          '<span>' + esc(txt) + '</span></li>';
      }).join('') + '</ul>';
    } else {
      // raw HTML escape hatch (trusted), for authors who need links/bold inline
      body = '<div class="text-body-14 space-y-8">' + (pointsOrHtml || '') + '</div>';
    }
    return '<div class="rounded-medium bg-accent-weak border border-line-weak p-20">' +
      '<p class="text-caption-12 font-semibold uppercase tracking-wide text-accent-strong mb-12">' + esc(title) + '</p>' +
      body + '</div>';
  };

  /* ==========================================================================
     hydrate — wire [data-countup] and [data-spark] within a scope.
     ANY hand-written element with those attrs gets wired (freedom: drop a
     custom card, add data-spark, done). Ported from template.html initCards().
     ========================================================================== */
  CB.hydrate = function (scope) {
    scope = scope || document;
    if (window.countUp && window.countUp.CountUp) {
      scope.querySelectorAll('[data-countup]').forEach(function (el) {
        if (el.dataset.cbDone) return; el.dataset.cbDone = '1';
        var end = parseFloat(el.dataset.countup);
        var decimals = el.dataset.decimals != null ? parseInt(el.dataset.decimals, 10) : (end % 1 ? 2 : 0);
        new window.countUp.CountUp(el, end, {
          duration: CB.MOTION_OK ? 1.4 : 0,
          decimalPlaces: decimals,
          prefix: el.dataset.prefix || '',
          suffix: el.dataset.suffix || '',
        }).start();
      });
    }
    if (window.echarts) {
      scope.querySelectorAll('[data-spark]').forEach(function (el) {
        if (el.dataset.cbDone) return; el.dataset.cbDone = '1';
        var data;
        try { data = JSON.parse(el.dataset.spark); } catch (e) { return; }
        var c = window.echarts.init(el);
        // a 1-point series with symbol:'none'+smooth draws nothing visible — force a
        // single end-dot so a lone data point still shows. multi-point keeps the clean
        // no-symbol line.
        var sparkSeries = function (d) {
          var single = d.length <= 1;
          return {
            type: 'line', data: d, smooth: !single, symbol: single ? 'circle' : 'none',
            symbolSize: single ? 6 : 4, showSymbol: single,
            lineStyle: { width: 2, color: CB.theme.ACCENT },
            itemStyle: { color: CB.theme.ACCENT },
            areaStyle: { color: accentRgba(0.10) },
          };
        };
        c.setOption({
          grid: { left: 0, right: 0, top: 2, bottom: 2 },
          xAxis: { type: 'category', show: false, data: data.map(function (_, i) { return i; }) },
          yAxis: { type: 'value', show: false, scale: true },
          series: [sparkSeries(data)],
        });
        // sparks re-theme + resize through the registry; renderFn re-reads accent
        CB.registerChart(c, (function (chart, d) {
          return function () {
            chart.setOption({ series: [sparkSeries(d)] });
          };
        })(c, data));
      });
    }
  };

  /* ==========================================================================
     FAST-PATH HELPER 2/11 — COOKIEBITE.kpis(target, items, opts?)
     Emits the SAME markup as the template KPI section. Hand-written cards with
     the same classes/attrs coexist.
     ========================================================================== */
  function resolveTarget(target) {
    return typeof target === 'string' ? document.querySelector(target) : target;
  }
  var COLS_MAP = {
    '1-2-4': 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-16',
    '1-2-3': 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-16',
    '1-2': 'grid grid-cols-1 sm:grid-cols-2 gap-16',
    '1-3': 'grid grid-cols-1 xl:grid-cols-3 gap-16',
    '1': 'grid grid-cols-1 gap-16',
  };
  // auto-pick the grid when opts.cols is omitted: a row of 4+ stays the canonical
  // 1-2-4 (so 4 items render exactly as before), 3 -> 1-2-3, 2 -> 1-2, 1 -> single.
  function autoCols(n) {
    return n >= 4 ? '1-2-4' : n === 3 ? '1-2-3' : n === 2 ? '1-2' : '1';
  }

  CB.kpis = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    var animate = opts.animate !== false;
    // explicit opts.cols wins; else auto-pick by item count (4+ -> the canonical 1-2-4)
    var colsKey = opts.cols && COLS_MAP[opts.cols] ? opts.cols : autoCols((items || []).length);
    host.className = (host.className ? host.className + ' ' : '') + COLS_MAP[colsKey];

    CB.disposeIn(host); // re-run on the same target: drop spark instances from the prior render

    // empty: render a quiet "no data" line instead of a bare grid container
    if (!(items || []).length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    host.innerHTML = (items || []).map(function (it) {
      // label (optionally a glossary term)
      var label = it.gloss
        ? '<span class="gloss" tabindex="0" role="button" data-tippy-content="' + esc(it.gloss) + '">' + esc(it.label) + '</span>'
        : esc(it.label);

      // big number
      var pre = it.prefix != null ? it.prefix : '';
      var suf = it.suffix != null ? it.suffix : '';
      // a NUMERIC string ('1234', '8.4') is almost always an upstream-formatted number
      // the author still wants animated — coerce so CountUp fires instead of silently
      // rendering the literal verbatim. Genuinely non-numeric strings ('Healthy', 'P1')
      // fall through to the verbatim branch below.
      var val = it.value;
      if (typeof val === 'string' && /^-?[\d.]+$/.test(val.trim()) && isFinite(Number(val))) val = Number(val);

      var numHtml;
      if (typeof val === 'string') {
        // a STRING value renders VERBATIM (no CountUp) — for status/severity cards
        // ("Healthy", "P1") that aren't numbers. The number<->string fork only
        // changes the inner figure; delta/spark/card wrapper below are shared.
        var verbatim = esc(pre) + esc(val);
        numHtml = it.unit
          ? '<span class="text-headline-36 font-bold nums leading-none whitespace-nowrap">' + verbatim +
            '<span class="text-title-20 text-secondary font-semibold">' + esc(it.unit) + '</span>' +
            (suf ? '<span class="text-title-20 text-secondary font-semibold">' + esc(suf) + '</span>' : '') + '</span>'
          : '<span class="text-headline-36 font-bold nums whitespace-nowrap">' + verbatim + esc(suf) + '</span>';
      } else {
        // decimals: explicit item/opts wins; else INFER from how the literal value is
        // written (8.4 -> 1 decimal) so a count-up keeps the authored precision and
        // renders '8.4' not '8.40'. Numbers can't carry trailing zeros, so the textual
        // form of the literal is the best available signal.
        var inferDec = function (v) {
          var s = String(v); var dot = s.indexOf('.');
          return dot < 0 ? 0 : s.length - dot - 1;
        };
        var dec = it.decimals != null ? it.decimals : (opts.decimals != null ? opts.decimals : inferDec(val));
        var cuAttrs = 'data-countup="' + val + '"';
        if (!animate || it.decimals != null || opts.decimals != null || dec) cuAttrs += ' data-decimals="' + dec + '"';
        if (it.unit) {
          // long figures: keep number big, unit small, never wrap. A suffix (when
          // also set) trails the unit in the same small style so unit + suffix coexist.
          numHtml = '<span class="text-headline-36 font-bold nums leading-none whitespace-nowrap">' +
            esc(pre) + '<span ' + cuAttrs + '>0</span>' +
            '<span class="text-title-20 text-secondary font-semibold">' + esc(it.unit) + '</span>' +
            (suf ? '<span class="text-title-20 text-secondary font-semibold">' + esc(suf) + '</span>' : '') +
            '</span>';
        } else {
          // whitespace-nowrap so a prefix/suffix (e.g. "16 / 16", "₩4,120") never wraps mid-figure
          numHtml = '<span class="text-headline-36 font-bold nums whitespace-nowrap" ' + cuAttrs +
            (pre ? ' data-prefix="' + esc(pre) + '"' : '') +
            (suf ? ' data-suffix="' + esc(suf) + '"' : '') + '>0</span>';
        }
      }

      // delta badge — THREE-WAY: a truthy {dir,tone,text} object renders the badge;
      // delta:null renders the '—' "no baseline" sentinel; delta OMITTED renders no
      // badge at all. (delta:0 is falsy → treated as omitted, NOT a zero baseline — pass
      // delta:null for an explicit baseline-less metric.) delta.text must be a SHORT
      // token ('+3.9s'); for a narrative caption ('vs 0 baseline') use it.note instead.
      var deltaHtml;
      if (it.delta) {
        // canonical badge via the shared CB.deltaBadge; mb-6 aligns it to the figure's baseline
        deltaHtml = CB.deltaBadge(it.delta.text, { dir: it.delta.dir, tone: it.delta.tone, className: 'mb-6' });
      } else if (it.delta === null) {
        // explicit null => show the "no baseline" sentinel
        deltaHtml = '<span class="mb-6 inline-flex items-center gap-2 text-caption-12 font-semibold text-secondary">—</span>';
      } else {
        // delta omitted entirely => no badge (avoids a row of stray — when no KPI has a baseline)
        deltaHtml = '';
      }

      var spark = it.spark
        ? '<div class="h-32 mt-12" data-spark=\'' + JSON.stringify(it.spark) + '\'></div>'
        : '';

      // note: the right home for baseline-free context ("vs 0 baseline", "provisional")
      // that doesn't fit a short delta token — a small caption line under the number.
      var note = it.note ? '<p class="text-caption-12 text-secondary mt-4">' + esc(it.note) + '</p>' : '';

      return '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
        '<p class="text-body-14 text-secondary">' + label + '</p>' +
        '<div class="flex items-end gap-8 mt-8">' + numHtml + deltaHtml + '</div>' +
        note + spark + '</div>';
    }).join('');

    CB.refreshIcons();
    CB.hydrate(host);
  };

  /* ==========================================================================
     FAST-PATH HELPER 3/11 — COOKIEBITE.findings(target, items, opts?)
     Emits the components.md "Severity-coded findings list" verbatim, incl. the
     optional Alpine severity-chip filter. tone doubles as severity.
     ========================================================================== */
  var SEV_LABEL = { critical: 'Critical', warning: 'High', info: 'Medium', neutral: 'Low' };
  var SEV_LABEL_KO = { critical: '심각', warning: '높음', info: '보통', neutral: '낮음' };
  // neutral/business vocabulary for opts.kind:'insights' — a dashboard's observations
  // list ("success up 0.3%p") reads wrong as 'Medium' severity. Same tone colors +
  // filter UI, just de-severitized chip/badge words.
  var INSIGHT_LABEL = { critical: 'Action', warning: 'Watch', info: 'Note', neutral: 'Note' };
  var INSIGHT_LABEL_KO = { critical: '조치', warning: '주의', info: '메모', neutral: '메모' };
  var SEV_RANK = { critical: 0, warning: 1, info: 2, neutral: 3 };
  // severity labels follow the report locale (Korean when REPORT_LOCALE.number
  // starts with 'ko'); opts.kind:'insights' swaps the incident-flavored severity
  // ladder for a neutral business vocabulary. opts.sevLabels overrides the badge set,
  // opts.chipLabels the chip set (incl. the 'all' key). A per-item f.label wins over all.
  function baseLabels(opts) {
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    if (opts && opts.kind === 'insights') return ko ? INSIGHT_LABEL_KO : INSIGHT_LABEL;
    return ko ? SEV_LABEL_KO : SEV_LABEL;
  }
  function sevLabelSet(opts) {
    return Object.assign({}, baseLabels(opts), (opts && opts.sevLabels) || {});
  }
  function chipLabelSet(opts) {
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var base = Object.assign({ all: ko ? '전체' : 'All' }, baseLabels(opts));
    return Object.assign(base, (opts && opts.chipLabels) || {});
  }

  CB.findings = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    var withFilter = opts.filter !== false;
    var withSort = opts.sort !== false;
    var sevLabels = sevLabelSet(opts);
    var chipLabels = chipLabelSet(opts);

    // empty: a quiet "no data" line instead of an empty bordered list
    if (!(items || []).length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    var list = (items || []).slice();
    var rank = function (t) { return SEV_RANK[t] == null ? 9 : SEV_RANK[t]; }; // critical=0 must not fall through ||
    if (withSort) list.sort(function (a, b) { return rank(a.tone) - rank(b.tone); });

    var lis = list.map(function (f) {
      var t = tone(f.tone);
      var badgeLabel = f.label || sevLabels[f.tone] || 'Note';
      // normalize to a known tone so the per-item filter value matches the chip set
      var sevTone = SEV_RANK[f.tone] != null ? f.tone : 'neutral';
      var show = withFilter ? ' x-show="sev===\'all\' || sev===\'' + sevTone + '\'"' : '';
      var where = f.where ? '<span class="font-mono">' + esc(f.where) + '</span>' : '';
      var note = f.note ? (where ? ' · ' : '') + esc(f.note) : '';
      var sub = (where || note)
        ? '<p class="text-caption-12 text-secondary mt-2">' + where + note + '</p>'
        : '';
      return '<li' + show + ' class="flex gap-12 rounded-medium border border-line-weak bg-surface p-16">' +
        '<span class="inline-flex items-center gap-4 px-8 py-2 h-fit rounded-xxs ' + t.tint + ' ' + t.text + ' text-caption-12 font-semibold shrink-0">' +
        iconTag(t.icon, 'w-12 h-12') + esc(badgeLabel) + '</span>' +
        '<div class="min-w-0"><p class="text-body-14 font-semibold">' + esc(f.title) + '</p>' + sub + '</div></li>';
    }).join('');

    // chips = ['all'] + tones actually present in items, ordered by SEV_RANK. This
    // is the UNION of tone values used in the per-item x-show above, so every
    // rendered finding stays reachable (a lone Low/neutral can't vanish on filter).
    var presentTones = [];
    list.forEach(function (f) {
      var tn = SEV_RANK[f.tone] != null ? f.tone : 'neutral';
      if (presentTones.indexOf(tn) < 0) presentTones.push(tn);
    });
    presentTones.sort(function (a, b) { return SEV_RANK[a] - SEV_RANK[b]; });
    var chips = ['all'].concat(presentTones);
    // each chip is { tone, label }: bind the filter to the tone value, show the
    // readable severity label (neutral -> 'Low') as the chip text.
    // single-quoted JS array literal — JSON.stringify would inject double quotes that
    // terminate the double-quoted x-for attribute (Alpine expr truncates, chips vanish).
    var sqChip = function (s) { return "'" + String(s).replace(/'/g, "\\'") + "'"; };
    var chipDefs = '[' + chips.map(function (tn) {
      var label = chipLabels[tn] || tn;
      return '{tone:' + sqChip(tn) + ',label:' + sqChip(label) + '}';
    }).join(',') + ']';

    var filterRow = withFilter
      // flex-wrap so a 5-10 chip row (PSP/status/region…) wraps at phone width instead
      // of running off the right edge and making the WHOLE page horizontally scroll.
      ? '<div class="flex flex-wrap gap-6 mb-12 text-caption-12">' +
        '<template x-for="c in ' + chipDefs + '" :key="c.tone">' +
        '<button @click="sev=c.tone" :class="sev===c.tone ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
        'class="px-10 py-4 rounded-small" x-text="c.label"></button></template></div>'
      : '';

    var inner = filterRow + '<ul class="space-y-8">' + lis + '</ul>';
    host.innerHTML = withFilter
      ? '<div x-data="{ sev:\'all\' }">' + inner + '</div>'
      : inner;

    CB.refreshIcons();
  };

  /* ==========================================================================
     FAST-PATH HELPER 4/11 — COOKIEBITE.timeline(target, items, opts?)
     Alpine x-for vertical timeline (incident-postmortem pattern). kind -> tone
     via an OPEN, overridable map (never a closed enum). Detail via x-collapse.
     ========================================================================== */
  // open, overridable kind->tone map. 'detect'/'diagnose'/'observe'/'investigate'
  // map to neutral/info so analysis steps in a postmortem don't render alarm-red as
  // 'cause' — a real timeline has neutral investigation milestones between failure
  // and fix. Authors still override via opts.toneMap.
  var DEFAULT_TONE_MAP = {
    start: 'info', cause: 'critical', action: 'warning', resolved: 'success',
    detect: 'info', diagnose: 'neutral', diagnostic: 'neutral', investigate: 'neutral', investigation: 'neutral', observe: 'neutral',
  };
  var TONE_DOT = { neutral: 'bg-secondary', info: 'bg-informative', success: 'bg-positive', warning: 'bg-cautionary', critical: 'bg-critical' };
  var TONE_DEFAULT_ICON = { neutral: 'circle', info: 'info', success: 'check', warning: 'alert-triangle', critical: 'octagon-x' };
  // per-kind icon defaults for investigation steps (search/activity read as analysis,
  // not failure). Falls through to the tone icon for any kind not listed here.
  var KIND_DEFAULT_ICON = { detect: 'activity', diagnose: 'search', diagnostic: 'search', investigate: 'search', investigation: 'search', observe: 'eye' };
  var tlSeq = 0;

  CB.timeline = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    if (!host.id) host.id = 'cbTl' + (++tlSeq); // stable scope for aria-controls ids
    var toneMap = Object.assign({}, DEFAULT_TONE_MAP, opts.toneMap || {});
    var collapse = opts.collapse !== false;

    // empty: a quiet "no data" line instead of an empty spine
    if (!(items || []).length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    var rows = (items || []).map(function (it, i) {
      var toneName = toneMap[it.kind] || (it.kind && tone(it.kind) !== TONE.neutral ? it.kind : 'neutral');
      var dot = TONE_DOT[toneName] || TONE_DOT.neutral;
      var icon = it.icon || KIND_DEFAULT_ICON[it.kind] || TONE_DEFAULT_ICON[toneName] || 'circle';
      var t = tone(toneName);
      var hasDetail = !!it.detail;
      var detailId = host.id + '-d' + i;
      var detailBlock = hasDetail
        ? (collapse
          ? '<div id="' + detailId + '" x-show="open' + i + '"' + ' x-collapse class="mt-6 text-body-14 text-secondary">' + esc(it.detail) + '</div>'
          : '<div class="mt-6 text-body-14 text-secondary">' + esc(it.detail) + '</div>')
        : '';
      var titleRow = hasDetail && collapse
        ? '<button @click="open' + i + '=!open' + i + '" :aria-expanded="open' + i + '" aria-controls="' + detailId + '" class="flex items-center gap-6 text-left">' +
          '<span class="text-body-16 font-semibold">' + esc(it.title) + '</span>' +
          '<span class="text-caption-12 text-secondary" x-text="open' + i + ' ? \'−\' : \'+\'"></span></button>'
        : '<p class="text-body-16 font-semibold">' + esc(it.title) + '</p>';
      var sub = it.sub ? '<p class="text-caption-12 text-secondary mt-2">' + esc(it.sub) + '</p>' : '';

      return '<li class="relative pl-40 pb-28 last:pb-0">' +
        // spine — 2px rail centered under the 28px badge (badge left:0 -> center x = 14px),
        // starting just below the badge so the disc reads as a node on the line
        '<span class="absolute left-[13px] top-32 bottom-0 w-2 rounded-full bg-line-weak"></span>' +
        // badge — tone-tinted disc with the step icon inside, ring-punched out of the page
        '<span class="absolute left-0 top-2 w-28 h-28 rounded-full ' + dot + ' ring-4 ring-bg shadow-sm flex items-center justify-center">' +
        iconTag(icon, 'w-14 h-14 text-white') + '</span>' +
        '<p class="text-caption-12 ' + t.text + ' font-semibold nums tracking-wide mb-2">' + esc(it.t) + '</p>' +
        titleRow + sub + detailBlock +
        '</li>';
    }).join('');

    // x-data carries one open<i> flag per collapsible row
    var openState = (items || []).map(function (it, i) { return it.detail && collapse ? ('open' + i + ':false') : null; })
      .filter(Boolean).join(', ');
    host.innerHTML = '<ul x-data="{ ' + openState + ' }" class="relative">' + rows + '</ul>';

    CB.refreshIcons();
  };

  /* ==========================================================================
     FAST-PATH HELPER 5/11 — COOKIEBITE.mermaid(target, definition, opts?)
     Text -> diagram (flowchart / sequence / state / ER / gantt), themed from the
     report's CSS vars and dark-aware FOR FREE. Lowers the friction that makes the
     model wall-of-text instead of drawing: no <script> tag, no init, no theming —
     just `COOKIEBITE.mermaid('#flow', 'flowchart LR\n A-->B')`.
       - dynamically imports Mermaid v11 (cached on window.__cbMermaid); the model
         does NOT add a CDN tag.
       - themeVariables are READ FROM CSS VARS at render time, so toggling dark
         re-renders with the dark palette (registered via onThemeChange).
       - opts.aria sets the container aria-label (a11y). opts.onError swaps the
         fallback. The file stays online-only (Mermaid is on CDN, like the charts).
     ========================================================================== */
  var mmdSeq = 0;
  var MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

  // Resolve a token to a CONCRETE rgb(...) via a throwaway probe element.
  // getComputedStyle on a custom property returns its raw declared value, so a
  // token defined as `color-mix(...)` (e.g. --accent-weak in the dark layer) comes
  // back as the literal "color-mix(...)" string — which Mermaid's color parser
  // (khroma) rejects with "Unsupported color format". Painting it onto an element
  // and reading .color forces the browser to resolve var()/color-mix to rgb.
  function cssColor(varName, fallback) {
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;color:var(' + varName + ',' + fallback + ')';
    document.body.appendChild(probe);
    var c = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    // color-mix() in srgb serializes as `color(srgb r g b / a)` (0–1 floats), which
    // khroma also can't parse — normalize to rgb()/rgba(). Plain rgb()/hex pass through.
    var m = (c || '').match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
    if (m) {
      var r = Math.round(+m[1] * 255), g = Math.round(+m[2] * 255), b = Math.round(+m[3] * 255);
      return m[4] != null ? 'rgba(' + r + ',' + g + ',' + b + ',' + m[4] + ')' : 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    return c || fallback;
  }

  function mermaidThemeVars() {
    // map report tokens -> Mermaid 'base' theme variables. accent drives node
    // fills/borders; neutrals drive text + edges. Resolved live so dark re-themes.
    var accent = cssColor('--accent', '#E8552D');
    var accentWeak = cssColor('--accent-weak', '#FCE9E2');
    var line = cssColor('--c-line', '#E4E4E7');
    var primary = cssColor('--c-primary', '#18181B');
    var secondary = cssColor('--c-secondary', '#52525B');
    var surface = cssColor('--c-surface', '#FFFFFF');
    var disabledBg = cssColor('--c-disabled-bg', '#F4F4F5');
    return {
      primaryColor: accentWeak, primaryBorderColor: accent, primaryTextColor: primary,
      secondaryColor: surface, secondaryBorderColor: line, secondaryTextColor: primary,
      tertiaryColor: surface, tertiaryBorderColor: line, tertiaryTextColor: secondary,
      lineColor: line, textColor: primary, mainBkg: accentWeak, nodeBorder: accent,
      clusterBkg: surface, clusterBorder: line, edgeLabelBackground: surface,
      // notes: neutral surface instead of Mermaid's default yellow, so they sit on-theme
      noteBkgColor: disabledBg, noteTextColor: primary, noteBorderColor: line,
      // sequence-diagram actors + signal labels
      actorBkg: accentWeak, actorBorder: accent, actorTextColor: primary, actorLineColor: line,
      signalColor: primary, signalTextColor: primary, labelBoxBkgColor: surface, labelTextColor: primary,
      fontFamily: css('--font-family') || 'Inter, sans-serif',
    };
  }

  CB.mermaid = function (target, definition, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    host.setAttribute('role', 'img');
    if (opts.aria) host.setAttribute('aria-label', opts.aria);
    var loader = (window.__cbMermaid = window.__cbMermaid || import(MERMAID_URL).then(function (m) { return m.default; }));

    function render(mermaid) {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'base', themeVariables: mermaidThemeVars() });
      var id = 'cbmmd' + (mmdSeq++);
      return mermaid.render(id, definition).then(function (res) {
        host.innerHTML = res.svg;
        // host scrolls horizontally so a wide LR flowchart on a phone scrolls instead of
        // shrinking every label to ~6px (the narrow-viewport illegibility footgun).
        host.style.overflowX = 'auto';
        var svg = host.querySelector('svg');
        if (svg) {
          // intrinsic px width Mermaid sized the diagram at (viewBox width when present)
          var vb = svg.viewBox && svg.viewBox.baseVal;
          var intrinsic = vb && vb.width ? vb.width : (parseFloat(svg.getAttribute('width')) || 0);
          svg.removeAttribute('width');
          svg.style.height = 'auto';
          // only scale-to-fit when the diagram actually fits the container; when it's
          // wider, keep its intrinsic width so it stays legible and the host scrolls.
          if (intrinsic && intrinsic > host.clientWidth) {
            svg.style.width = Math.round(intrinsic) + 'px';
            svg.style.maxWidth = 'none';
          } else {
            svg.style.maxWidth = '100%';
          }
        }
        if (res.bindFunctions) res.bindFunctions(host);
      });
    }

    loader.then(function (mermaid) {
      render(mermaid);
      // register the dark-toggle re-render ONCE per host — re-running CB.mermaid on the
      // same target (edited definition, tab reveal) must not stack N stale closures
      // that all redraw into this one container on every toggle.
      if (!host.dataset.cbMermaidThemed) {
        host.dataset.cbMermaidThemed = '1';
        CB.onThemeChange(function () { render(mermaid); }); // re-render with dark palette on toggle
      }
    }).catch(function (e) {
      console.warn('[cookiebite] COOKIEBITE.mermaid failed', e);
      if (opts.onError) host.innerHTML = opts.onError;
      else host.innerHTML = '<pre class="text-caption-12 text-critical p-12 rounded-small bg-disabled-bg overflow-auto">다이어그램 렌더 실패 — Mermaid 정의를 확인하세요.</pre>';
    });
    return host;
  };

  /* ==========================================================================
     FAST-PATH HELPER 6/11 — COOKIEBITE.table(target, config) -> gridInstance
     Grid.js with the interactions.md §4 footguns fixed BY CONSTRUCTION:
       - pagination {limit:15} only when rows>15 else false
       - search box only when rows>10 (a search field over a 5-row table is noise);
         pass search:true/false to override
       - numericCols: right-aligned header+cells + tabular-nums via scoped <style>
       - statusCol cells pass through COOKIEBITE.pill
     Requires Grid.js (model adds the 2 CDN tags); runtime does NOT bundle it.
     ========================================================================== */
  var tableSeq = 0;

  CB.table = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.gridjs) { if (!window.gridjs) console.warn('[cookiebite] COOKIEBITE.table needs Grid.js — add its CDN tags in the HEAD-LIBS slot.'); return null; }
    config = config || {};
    var gridjs = window.gridjs;

    // stable scope id for the right-align <style>
    if (!host.id) host.id = 'cbTable' + (++tableSeq);
    var sel = '#' + host.id;

    // numeric column right-align (header AND cells), 1-based nth-child
    if (config.numericCols && config.numericCols.length) {
      // comma-formatted STRING cells in a numericCol sort lexicographically (wrong)
      // — hint the author to pass raw Numbers + a formatter instead.
      var warnedNumeric = false;
      (config.rows || []).forEach(function (r) {
        if (warnedNumeric || !Array.isArray(r)) return;
        config.numericCols.forEach(function (c) {
          if (warnedNumeric) return;
          if (typeof r[c] === 'string' && /\d,\d/.test(r[c])) {
            console.warn('[cookiebite] COOKIEBITE.table: numericCols column ' + c + ' has comma-formatted string cells (e.g. "' + r[c] + '") — these sort lexicographically. Pass raw Numbers and a column formatter for correct sorting.');
            warnedNumeric = true;
          }
        });
      });

      var rules = config.numericCols.map(function (c) {
        var n = c + 1;
        return sel + ' .gridjs-th:nth-child(' + n + '),' + sel + ' .gridjs-td:nth-child(' + n + ')';
      }).join(',');
      // stable id per table so a re-render REPLACES the right-align rule instead of
      // appending a fresh <style> each time (which leaks a growing pile of dupes).
      var styleId = host.id + '-numalign';
      var styleEl = document.getElementById(styleId) || document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = rules + '{ text-align:right; font-variant-numeric:tabular-nums; }';
      if (!styleEl.parentNode) document.head.appendChild(styleEl);  // NOT host — Grid.js refuses to render into a non-empty container
    }

    // statusCol -> COOKIEBITE.pill via gridjs.html
    var numericSet = {};
    (config.numericCols || []).forEach(function (c) { numericSet[c] = true; });
    var columns = (config.columns || []).map(function (col, idx) {
      var base = typeof col === 'string' ? { name: col } : Object.assign({}, col);
      if (config.statusCol === idx && !base.formatter) {
        base.formatter = function (cell) {
          if (cell && typeof cell === 'object' && cell.label != null) {
            return gridjs.html(CB.pill(cell.label, { tone: cell.tone, icon: cell.icon }));
          }
          return gridjs.html(CB.pill(String(cell), { tone: 'neutral' }));
        };
      } else if (numericSet[idx] && !base.formatter) {
        // raw Number in a numericCol with no formatter -> thousands-group via CB.nf
        // (right-align is already applied via the scoped <style> above). Non-numbers
        // (already-formatted strings, null) pass through untouched.
        base.formatter = function (cell) {
          return typeof cell === 'number' ? CB.nf.format(cell) : cell;
        };
      }
      return base;
    });

    var rows = config.rows || [];
    var grid = new gridjs.Grid({
      columns: columns,
      data: rows,
      sort: true,
      // search auto-hides on small tables (a search box over ~5 rows is noise); explicit
      // config.search (true/false) always wins.
      search: config.search != null ? config.search : rows.length > 10,
      pagination: rows.length > 15 ? { limit: 15 } : false,
      className: { table: 'text-body-14' },
    });
    grid.render(host);

    // pills inside Grid.js need their lucide icons drawn after render
    grid.config.store.subscribe(function () { CB.refreshIcons(); });

    // opt-in CSV export: Grid.js already holds the raw rows, so serialize columns +
    // config.rows to a CSV the reader can pull into a spreadsheet (interactions.md §13's
    // "always end an editable artifact with a way out"). A pill/status cell ({label,…})
    // serializes to its label; a quote/comma/newline is RFC-4180 quote-escaped.
    if (config.csv) {
      var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
      var headerNames = (config.columns || []).map(function (col) { return typeof col === 'string' ? col : (col.name || ''); });
      var csvCell = function (v) {
        if (v && typeof v === 'object' && v.label != null) v = v.label;
        var s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      var toCsv = function () {
        var lines = [headerNames.map(csvCell).join(',')];
        rows.forEach(function (r) { lines.push((Array.isArray(r) ? r : [r]).map(csvCell).join(',')); });
        return lines.join('\r\n');
      };
      var bar = document.createElement('div');
      bar.className = 'flex justify-end mb-8';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-caption-12 text-secondary hover:text-primary';
      btn.textContent = ko ? 'CSV 내보내기' : 'Export CSV';
      btn.addEventListener('click', function () { CB.download((config.csvName || 'table') + '.csv', toCsv(), 'text/csv;charset=utf-8'); });
      bar.appendChild(btn);
      host.parentNode ? host.parentNode.insertBefore(bar, host) : host.insertBefore(bar, host.firstChild);
    }

    CB.refreshIcons();
    return grid;
  };

  /* ==========================================================================
     FAST-PATH HELPER 7/11 — COOKIEBITE.chart(target, config) -> echartsInstance
     WRAPPER ONLY (the fast/escape seam). Builds the §10 toggle+table+aria
     scaffold, merges a HAND-WRITTEN option over baseChart, registers for dark
     re-theme + resize. config.option is ALWAYS author-written. NEVER a {kind}.
     deep-merge plain objects, REPLACE arrays (series, dataZoom) wholesale.
     ========================================================================== */
  function isPlainObject(o) {
    return o && typeof o === 'object' && !Array.isArray(o);
  }
  // deep-merge plain objects; arrays REPLACE wholesale (series/dataZoom author-owned)
  function deepMerge(base, over) {
    if (!isPlainObject(base)) return over;
    if (!isPlainObject(over)) return over;
    var out = {};
    // clone base ARRAY values (e.g. baseChart.color) so the merged option never
    // shares a reference back into CB.baseChart — otherwise a chart mutating its
    // option array would corrupt the shared base across dark re-themes.
    Object.keys(base).forEach(function (k) { out[k] = Array.isArray(base[k]) ? base[k].slice() : base[k]; });
    Object.keys(over).forEach(function (k) {
      var bv = out[k], ov = over[k];
      out[k] = (isPlainObject(bv) && isPlainObject(ov)) ? deepMerge(bv, ov) : ov;
    });
    return out;
  }
  CB.deepMerge = deepMerge; // exposed: hand charts may reuse the same merge semantics

  var chartSeq = 0;

  /* view-toggle labels: author overrides win, else locale default.
     Korean when REPORT_LOCALE.number starts with 'ko', English otherwise.
     Returns { table: show-table label, chart: show-chart label }. */
  function toggleLabels(cfg) {
    cfg = cfg || {};
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var dTable = ko ? '표로 보기' : 'View as table';
    var dChart = ko ? '차트로 보기' : 'View as chart';
    return {
      table: cfg.tableLabel != null ? cfg.tableLabel : dTable,
      chart: cfg.chartLabel != null ? cfg.chartLabel : dChart,
    };
  }

  CB.chart = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.chart needs echarts.'); return null; }
    config = config || {};
    var height = config.height || 300;
    // ariaLabel becomes BOTH the SR label and the fallback data-table caption — the bare
    // word 'chart' is meaningless to a screen-reader user, so nudge the author instead of
    // shipping it silently.
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.chart: pass ariaLabel describing what the chart shows — it becomes the screen-reader label and the data-table caption.');
    var aria = config.ariaLabel || 'chart';
    var cid = 'cbChart' + (++chartSeq);

    CB.disposeIn(host); // re-run on the same target: dispose the prior chart instance

    // build the §10 view-toggle scaffold (matches the template trend section)
    var hasTable = !!(config.table && config.table.columns);
    // caption is ESCAPED by default; config.captionHtml is the opt-in trusted-HTML
    // path (parallel to callout's trusted note), for authors who need bold/links.
    var captionText = config.captionHtml != null ? config.captionHtml : (config.caption != null ? esc(config.caption) : '');
    var caption = (config.captionHtml != null || config.caption != null)
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + captionText + '</p>'
      : '';

    var tableHtml = '';
    if (hasTable) {
      var thead = '<thead class="text-secondary text-left"><tr>' + config.table.columns.map(function (c, i) {
        return '<th class="py-8 font-medium' + (i === 0 ? '' : ' text-right') + '">' + esc(c) + '</th>';
      }).join('') + '</tr></thead>';
      var tbody = '<tbody class="divide-y divide-line-weak">' + config.table.rows.map(function (r) {
        return '<tr>' + r.map(function (cell, i) {
          return '<td class="py-8' + (i === 0 ? '' : ' text-right') + '">' + esc(cell) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody>';
      tableHtml =
        '<div x-show="table" x-cloak><table class="w-full text-body-14 nums">' +
        '<caption class="sr-only">' + esc(aria) + '</caption>' + thead + tbody + '</table></div>';
    }

    var tl = toggleLabels(config);
    // single-quoted literals: JSON.stringify's double quotes would terminate the
    // double-quoted x-text attribute and blank the label.
    var sqLabel = function (s) { return "'" + String(s).replace(/'/g, "\\'") + "'"; };
    var toggleBtnInner = hasTable
      ? '<button @click="table=!table" :aria-pressed="table" ' +
        'class="text-caption-12 text-secondary hover:text-primary" x-text="table ? ' +
        sqLabel(tl.chart) + ' : ' + sqLabel(tl.table) + '"></button>'
      : '';
    // opt-in PNG export: a small button next to the view-toggle. cid is unique so it
    // wires to THIS chart's instance via CB.exportPNG (registered below).
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var pngLabel = ko ? 'PNG 저장' : 'Save PNG';
    var pngBtnInner = config.exportable
      ? '<button type="button" data-cb-png="' + cid + '" class="text-caption-12 text-secondary hover:text-primary">' + esc(pngLabel) + '</button>'
      : '';
    // share one justify-end bar between the toggle + PNG buttons (gap-12 between them)
    var barInner = toggleBtnInner + pngBtnInner;
    var toggleBtn = barInner ? '<div class="flex justify-end gap-12 mb-8">' + barInner + '</div>' : '';

    host.innerHTML = caption +
      '<div' + (hasTable ? ' x-data="{ table:false }"' : '') + '>' + toggleBtn +
      '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
      '<div ' + (hasTable ? 'x-show="!table"' : '') + '><div id="' + cid + '" role="img" aria-label="' + esc(aria) + '" style="height:' + height + 'px"></div></div>' +
      (hasTable ? tableHtml : '') +
      '</div></div>';

    if (config.exportable) {
      var pngBtn = host.querySelector('[data-cb-png="' + cid + '"]');
      if (pngBtn) pngBtn.addEventListener('click', function () { CB.exportPNG('#' + cid, (config.exportName || aria || 'chart') + '.png'); });
    }

    var el = host.querySelector('#' + cid);
    var inst = window.echarts.init(el);
    // track the LATEST author-applied option so a dark re-theme re-merges THAT over
    // the freshly-read baseChart — not the original. A reader-filtered chart (series
    // swapped via chart.__cbUpdate) then keeps its filtered state across the toggle
    // instead of snapping back to the initial series.
    var lastOption = config.option || {};
    inst.setOption(deepMerge(CB.baseChart, lastOption), true);
    // chart.__cbUpdate(option): apply a new author option AND remember it, so the
    // next dark re-theme preserves it. Use this instead of raw setOption for updates
    // that should survive a theme toggle (e.g. reader filters/zoom on the data).
    inst.__cbUpdate = function (opt, notMerge) {
      lastOption = opt || {};
      inst.setOption(deepMerge(CB.baseChart, lastOption), notMerge !== false);
      return inst;
    };

    // register for dark re-theme: re-merge the LAST author option over fresh baseChart
    var renderFn = config.render
      ? config.render
      : function (chart) { chart.setOption(deepMerge(CB.baseChart, lastOption), true); };
    CB.registerChart(inst, renderFn);

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     FAST-PATH HELPER 7a — COOKIEBITE.funnel(target, { steps, caption?, ariaLabel? })
     Themed ECharts funnel for conversion/drop-off (visitor->signup->paid, checkout
     step drop-off). The value-add the model keeps fumbling: a SINGLE-HUE accent ramp
     (CB.ramp, never a rainbow), auto step-to-step + overall conversion % labels, and
     INSIDE labels so they never clip at narrow widths (the no-funnel-helper footgun).
     Registers for dark re-theme; ships a data-table + aria fallback like CB.chart.
       steps: [{ label, value }] (descending). caption -> muted line above; ariaLabel
       -> SR label + data-table caption.
     ========================================================================== */
  var funnelSeq = 0;

  CB.funnel = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.funnel needs echarts.'); return null; }
    config = config || {};
    var steps = (config.steps || []).filter(function (s) { return s && s.value != null; });
    var aria = config.ariaLabel || 'conversion funnel';
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.funnel: pass ariaLabel describing the funnel — it becomes the screen-reader label and the data-table caption.');

    CB.disposeIn(host);

    // empty: a quiet "no data" line instead of a broken-looking empty chart
    if (!steps.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null; }

    var height = config.height || 320;
    var cid = 'cbFunnel' + (++funnelSeq);
    var captionText = config.captionHtml != null ? config.captionHtml : (config.caption != null ? esc(config.caption) : '');
    var caption = (config.captionHtml != null || config.caption != null)
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + captionText + '</p>'
      : '';

    host.innerHTML = caption +
      '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
      '<div id="' + cid + '" role="img" aria-label="' + esc(aria) + '" style="height:' + height + 'px"></div>' +
      '</div>';

    var el = host.querySelector('#' + cid);
    var inst = window.echarts.init(el);
    var top = steps[0].value || 0; // overall-conversion denominator (first/top step)

    // option re-reads CB.ramp/CB.baseChart live so a dark toggle re-themes the ramp.
    function option() {
      var colors = CB.ramp(steps.length);
      var data = steps.map(function (s, i) {
        // label shows the step name + step-to-step conversion vs the PREVIOUS step
        var prev = i === 0 ? null : (steps[i - 1].value || 0);
        var pct = prev ? Math.round((s.value / prev) * 1000) / 10 : null;
        var name = s.label + (pct != null ? ' · ' + pct + '%' : '');
        return { value: s.value, name: name, itemStyle: { color: colors[i] } };
      });
      var overall = top ? Math.round((steps[steps.length - 1].value / top) * 1000) / 10 : null;
      return {
        textStyle: { fontFamily: CB.theme.FONT },
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        // overall conversion as a subtitle so the headline number is always visible
        title: overall != null ? {
          text: (window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number) ? '전체 전환율 ' : 'Overall ') + overall + '%',
          left: 'center', bottom: 0, textStyle: { color: CB.theme.C_SECONDARY, fontSize: 12, fontWeight: 'normal', fontFamily: CB.theme.FONT },
        } : undefined,
        series: [{
          type: 'funnel', top: 12, bottom: 28, left: '8%', right: '8%',
          minSize: '24%', sort: 'descending', gap: 2,
          // INSIDE labels never clip at narrow widths (the outside-label footgun)
          label: { show: true, position: 'inside', color: cssColor('--accent-on', '#fff'), fontFamily: CB.theme.FONT },
          labelLine: { show: false },
          itemStyle: { borderColor: CB.theme.C_LINE, borderWidth: 1 },
          data: data,
        }],
      };
    }
    inst.setOption(option(), true);
    CB.registerChart(inst, function (chart) { chart.setOption(option(), true); });

    // a11y data-table alternative (vanilla toggle, same as a hand chart gets)
    CB.dataTableToggle(el, {
      ariaLabel: aria,
      columns: [config.stepHeader || (window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number) ? '단계' : 'Step'), config.valueHeader || (window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number) ? '값' : 'Value'), '%'],
      rows: steps.map(function (s, i) {
        var prev = i === 0 ? null : (steps[i - 1].value || 0);
        var pct = i === 0 ? '100%' : (prev ? (Math.round((s.value / prev) * 1000) / 10) + '%' : '—');
        return [s.label, CB.nf.format(s.value), pct];
      }),
    });

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     FAST-PATH HELPER 7b — COOKIEBITE.gauge(target, { value, max?, label?, unit?, target?, tone? })
     A bounded single metric (SLA 99.2% vs 99.9%, sprint 18/24, budget burn 67%, OKR
     progress) reads far better as a ring than a bare number — SKILL.md recommends it.
     This is a PURE CSS conic-gradient ring (NO chart lib): themes via var(--accent) so
     it is dark-aware with ZERO registration and immune to the 0×0-in-hidden-tab footgun
     that bites canvas gauges. Center value label; optional target tick; optional tone
     overrides the accent fill (status:'critical' etc).
       value/max -> fraction. label -> caption under the ring. unit -> appended to the
       center figure (e.g. '%'). target -> a tick mark at that value. tone -> semantic.
     ========================================================================== */
  var GAUGE_FILL = { neutral: 'var(--accent)', info: 'var(--c-informative)', success: 'var(--c-positive)', warning: 'var(--c-cautionary)', critical: 'var(--c-critical)' };

  CB.gauge = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var max = config.max != null ? config.max : 100;
    var raw = config.value;

    // empty/invalid: a quiet "no data" line instead of an empty ring
    if (raw == null || !isFinite(Number(raw)) || !(max > 0)) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    var value = Number(raw);
    var frac = Math.max(0, Math.min(1, value / max)); // clamp into 0..1
    var deg = Math.round(frac * 360);
    var fill = (config.tone && GAUGE_FILL[config.tone]) || 'var(--accent)';
    // the ring: a conic-gradient fill on a track, masked to a ring by an inner surface
    // disc. All colors are CSS vars -> follows dark re-theme with no JS registration.
    var size = config.size || 160;
    var thickness = config.thickness || 16;

    // center figure: value (+ unit). A %-style gauge shows the value as-authored.
    var unit = config.unit != null ? config.unit : '';
    var center = '<div class="absolute inset-0 flex flex-col items-center justify-center">' +
      '<span class="text-title-28 font-bold nums leading-none">' + esc(CB.nf.format(value)) + esc(unit) + '</span>' +
      (config.sub ? '<span class="text-caption-12 text-secondary mt-2">' + esc(config.sub) + '</span>' : '') +
      '</div>';

    // optional target tick: a short radial mark at the target fraction, drawn as a
    // rotated thin bar pinned to the top of the ring.
    var tick = '';
    if (config.target != null && isFinite(Number(config.target)) && max > 0) {
      var tdeg = Math.round(Math.max(0, Math.min(1, Number(config.target) / max)) * 360);
      tick = '<div class="absolute left-1/2 top-0 origin-bottom" ' +
        'style="height:' + (size / 2) + 'px;transform:translateX(-50%) rotate(' + tdeg + 'deg);">' +
        '<span class="block w-2 bg-primary rounded-full" style="height:' + (thickness + 4) + 'px;"></span></div>';
    }

    var labelHtml = config.label
      ? '<p class="text-body-14 text-secondary mt-12 text-center">' + esc(config.label) + '</p>'
      : '';

    // role=img + aria-label so the ring is announced as a single value, not silent decoration
    var aria = config.ariaLabel || ((config.label ? config.label + ': ' : '') + CB.nf.format(value) + unit + (config.target != null ? ' (target ' + CB.nf.format(Number(config.target)) + unit + ')' : ''));

    host.innerHTML =
      '<div class="flex flex-col items-center">' +
      '<div role="img" aria-label="' + esc(aria) + '" class="relative" style="width:' + size + 'px;height:' + size + 'px;">' +
      // track + conic fill
      '<div class="absolute inset-0 rounded-full" style="background:conic-gradient(' + fill + ' ' + deg + 'deg, var(--c-disabled-bg) ' + deg + 'deg);"></div>' +
      // inner disc punches the center out, leaving a ring of `thickness`
      '<div class="absolute rounded-full bg-surface" style="inset:' + thickness + 'px;"></div>' +
      tick + center +
      '</div>' + labelHtml +
      '</div>';

    CB.refreshIcons();
  };

  /* ==========================================================================
     FAST-PATH HELPER 7c — COOKIEBITE.heatmap(target, { data, caption?, ariaLabel?, max? })
     GitHub-style CALENDAR heatmap for daily-density data (commits/day, incidents/day,
     active users/day) — common in retros/postmortems where "when" matters. ECharts
     calendar + heatmap with a SINGLE-HUE accent visualMap ramp (low opacity -> accent),
     so it stays on-theme. Registers for dark; ships a data-table + aria fallback.
       data: [{ date:'YYYY-MM-DD', value }]. max overrides the auto visualMap top.
       caption -> muted line above; ariaLabel -> SR label + data-table caption.
     ========================================================================== */
  var heatmapSeq = 0;

  CB.heatmap = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.heatmap needs echarts.'); return null; }
    config = config || {};
    var data = (config.data || []).filter(function (d) { return d && d.date && d.value != null; });
    var aria = config.ariaLabel || 'activity calendar heatmap';
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.heatmap: pass ariaLabel describing the data — it becomes the screen-reader label and the data-table caption.');

    CB.disposeIn(host);

    // empty: a quiet "no data" line instead of a blank calendar
    if (!data.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null; }

    var height = config.height || 200;
    var cid = 'cbHeat' + (++heatmapSeq);
    var captionText = config.captionHtml != null ? config.captionHtml : (config.caption != null ? esc(config.caption) : '');
    var caption = (config.captionHtml != null || config.caption != null)
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + captionText + '</p>'
      : '';

    host.innerHTML = caption +
      '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
      '<div id="' + cid + '" role="img" aria-label="' + esc(aria) + '" style="height:' + height + 'px"></div>' +
      '</div>';

    // calendar RANGE: the year span the data covers (ECharts wants the year(s))
    var years = data.map(function (d) { return d.date.slice(0, 4); });
    var range = years[0] === years[years.length - 1] ? years[0] : [years[0], years[years.length - 1]];
    var maxVal = config.max != null ? config.max : data.reduce(function (m, d) { return Math.max(m, d.value); }, 0) || 1;

    var el = host.querySelector('#' + cid);
    var inst = window.echarts.init(el);

    // option re-reads accent live so a dark toggle re-themes the ramp + neutral cells.
    function option() {
      return {
        textStyle: { fontFamily: CB.theme.FONT },
        tooltip: { formatter: function (p) { return p.value[0] + ': ' + CB.nf.format(p.value[1]); } },
        // single-hue accent ramp: faint accent for low -> full accent for high
        visualMap: {
          min: 0, max: maxVal, calculable: true, orient: 'horizontal', left: 'center', bottom: 0,
          inRange: { color: [accentRgba(0.12), CB.theme.ACCENT] },
          textStyle: { color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT },
        },
        calendar: {
          top: 24, left: 24, right: 12, cellSize: ['auto', 14], range: range,
          itemStyle: { color: cssColor('--c-disabled-bg', '#F4F4F5'), borderColor: CB.theme.C_LINE, borderWidth: 1 },
          splitLine: { lineStyle: { color: CB.theme.C_LINE } },
          dayLabel: { color: CB.theme.C_SECONDARY }, monthLabel: { color: CB.theme.C_SECONDARY },
          yearLabel: { show: false },
        },
        series: [{
          type: 'heatmap', coordinateSystem: 'calendar',
          data: data.map(function (d) { return [d.date, d.value]; }),
        }],
      };
    }
    inst.setOption(option(), true);
    CB.registerChart(inst, function (chart) { chart.setOption(option(), true); });

    // a11y data-table alternative (vanilla toggle, same as a hand chart gets)
    CB.dataTableToggle(el, {
      ariaLabel: aria,
      columns: [config.dateHeader || (window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number) ? '날짜' : 'Date'), config.valueHeader || (window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number) ? '값' : 'Value')],
      rows: data.map(function (d) { return [d.date, CB.nf.format(d.value)]; }),
    });

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     FAST-PATH HELPER 8/11 — COOKIEBITE.dataTableToggle(chartTarget, { columns, rows, ariaLabel? })
     Gives a HAND-WRITTEN (escape-hatch) chart the same "표로 보기" data-table
     alternative that CB.chart builds automatically — satisfies the a11y rule
     "every chart needs a data-table alternative". Vanilla (no Alpine): inserts a
     toggle button above the chart and a hidden <table> after it, swapping them.
     ========================================================================== */
  CB.dataTableToggle = function (chartTarget, config) {
    var chartEl = resolveTarget(chartTarget);
    if (!chartEl || !config || !config.columns) return;
    var cols = config.columns, rows = config.rows || [];
    var aria = config.ariaLabel || chartEl.getAttribute('aria-label') || 'data table';
    var tl = toggleLabels(config);

    var bar = document.createElement('div');
    bar.className = 'flex justify-end mb-8';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'text-caption-12 text-secondary hover:text-primary';
    btn.textContent = tl.table;
    btn.setAttribute('aria-pressed', 'false');
    bar.appendChild(btn);

    var tableWrap = document.createElement('div');
    tableWrap.style.display = 'none';
    tableWrap.innerHTML = '<table class="w-full text-body-14 nums">' +
      '<caption class="sr-only">' + esc(aria) + '</caption>' +
      '<thead class="text-secondary text-left"><tr>' + cols.map(function (c, i) {
        return '<th class="py-8 font-medium' + (i === 0 ? '' : ' text-right') + '">' + esc(c) + '</th>';
      }).join('') + '</tr></thead>' +
      '<tbody class="divide-y divide-line-weak">' + rows.map(function (r) {
        return '<tr>' + r.map(function (cell, i) {
          return '<td class="py-8' + (i === 0 ? '' : ' text-right') + '">' + esc(cell) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';

    chartEl.parentNode.insertBefore(bar, chartEl);
    chartEl.parentNode.insertBefore(tableWrap, chartEl.nextSibling);

    var showingTable = false;
    btn.addEventListener('click', function () {
      showingTable = !showingTable;
      chartEl.style.display = showingTable ? 'none' : '';
      tableWrap.style.display = showingTable ? '' : 'none';
      btn.textContent = showingTable ? tl.chart : tl.table;
      btn.setAttribute('aria-pressed', showingTable ? 'true' : 'false');
    });
  };

  /* ==========================================================================
     FAST-PATH HELPER 9/11 — COOKIEBITE.compare(target, { rows, options, recommendation? })
     The decision/comparison report type (interactions.md §12). Two accepted shapes:
       (a) OPTION-MAJOR: rows = ['Cost','Speed'], options:[{name,values:[c0,c1]}] —
           each option carries its own column; values[i] lands on rows[i].
       (b) ROW-MAJOR (the intuitive shape): rows:[{label, cells:[c0,c1]}], options:
           [{name}] — a row owns its cells; cell j belongs to options[j]. Detected
           when rows[0] is an object with a `cells` array, then transposed to (a).
     A cell is a plain string OR { label, tone } (rendered via CB.pill). The
     recommended option's column gets an accent ring + a small badge. Collapses to
     stacked cards below sm. Optional `recommendation` renders as a CB.callout below.
     ========================================================================== */
  CB.compare = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var rows = config.rows || [];
    var options = config.options || [];
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var recLabel = ko ? '추천' : 'Recommended';

    // ROW-MAJOR shape: transpose rows:[{label, cells}] into the option-major form so
    // the rest of the helper is unchanged. cell j (or cell.text) -> options[j].values[i].
    if (rows.length && rows[0] && typeof rows[0] === 'object' && Array.isArray(rows[0].cells)) {
      options = options.map(function (opt, j) {
        return Object.assign({}, opt, {
          values: rows.map(function (r) {
            var c = (r.cells || [])[j];
            // accept { text, tone } (the natural row-major keys) as a synonym for the
            // pill cell { label, tone } — map text -> label so the tone still renders.
            if (c && typeof c === 'object' && c.text != null && c.label == null) {
              return Object.assign({}, c, { label: c.text });
            }
            return c;
          }),
        });
      });
      rows = rows.map(function (r) { return r.label; });
    } else {
      // option-major: warn on the classic mistake of a values column not matching the
      // row count (silently renders blank/extra <dd>s otherwise).
      options.forEach(function (opt) {
        if (opt && Array.isArray(opt.values) && rows.length && opt.values.length !== rows.length) {
          console.warn('[cookiebite] COOKIEBITE.compare: option "' + (opt.name || '?') + '" has ' + opt.values.length + ' values but there are ' + rows.length + ' rows — cells will misalign. Pass one value per row (or use the row-major rows:[{label,cells:[…]}] shape).');
        }
      });
    }

    // empty: a quiet "no data" line instead of empty cards
    if (!options.length || !rows.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    var cards = options.map(function (opt) {
      var values = opt.values || [];
      // recommended column: accent ring + badge (matches §12's ring-2 ring-accent)
      var ring = opt.recommended ? ' ring-2 ring-accent' : '';
      var badge = opt.recommended
        ? '<span class="text-caption-12 text-accent-strong font-semibold">' + esc(recLabel) + '</span>'
        : '';
      // one <dt>/<dd> per row, same order in every column so they line up
      var dl = rows.map(function (label, i) {
        var cell = values[i];
        var dd = (cell && typeof cell === 'object' && cell.label != null)
          ? CB.pill(cell.label, { tone: cell.tone, icon: cell.icon })
          : esc(cell == null ? '' : cell);
        return '<div><dt class="text-secondary">' + esc(label) + '</dt><dd>' + dd + '</dd></div>';
      }).join('');
      return '<div class="bg-surface border border-line-weak rounded-medium p-20' + ring + '">' +
        '<h3 class="text-title-20 font-bold">' + esc(opt.name) + '</h3>' + badge +
        '<dl class="mt-12 space-y-8 text-body-14">' + dl + '</dl></div>';
    }).join('');

    // columns = number of options; collapse to a single column below sm
    var n = options.length || 1;
    var grid = '<div class="grid grid-cols-1 sm:grid-cols-' + n + ' gap-16">' + cards + '</div>';
    var rec = config.recommendation
      ? '<div class="mt-16">' + CB.callout(config.recommendation, { tone: 'info', icon: null }) + '</div>'
      : '';
    host.innerHTML = grid + rec;

    CB.refreshIcons();
  };

  /* ==========================================================================
     FAST-PATH HELPER 9a — COOKIEBITE.cardGrid(target, { items, caption? })
     A faceted, filterable card grid (surveys filtered by segment, roadmaps by
     quarter/team, research by method). Builds a chip row from the UNION of all item
     tags; clicking chips AND-combines (a card shows only if it carries EVERY active
     tag), with a live "showing N of M" count. The chip row WRAPS (flex-wrap) so a
     wide facet set never runs off the right edge at phone width.
       items: [{ title, body?, tags?:[], meta? }]. tags drive the facet chips; body is
       trusted HTML; meta is a small muted line. Alpine-driven (x-data/x-show), so the
       filtering is live with no JS the author writes.
     ========================================================================== */
  CB.cardGrid = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var items = config.items || [];
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);

    var captionText = config.captionHtml != null ? config.captionHtml : (config.caption != null ? esc(config.caption) : '');
    var caption = (config.captionHtml != null || config.caption != null)
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + captionText + '</p>'
      : '';

    // empty: a quiet "no data" line instead of an empty grid
    if (!items.length) { host.innerHTML = caption + emptyState(config.emptyText); CB.refreshIcons(); return; }

    // union of tags, in first-seen order, for the facet chip row
    var allTags = [];
    items.forEach(function (it) {
      (it.tags || []).forEach(function (tg) { if (allTags.indexOf(tg) < 0) allTags.push(tg); });
    });

    // single-quoted JS literals inside the double-quoted Alpine attrs (mirrors CB.findings)
    var sq = function (s) { return "'" + String(s).replace(/'/g, "\\'") + "'"; };

    var cards = items.map(function (it) {
      var itemTags = it.tags || [];
      // x-show: every ACTIVE facet must be present in this card's tags (AND-combine)
      var tagsLit = '[' + itemTags.map(sq).join(',') + ']';
      var show = ' x-show="active.length===0 || active.every(t => ' + tagsLit + '.includes(t))"';
      var tagChips = itemTags.length
        ? '<div class="flex flex-wrap gap-4 mt-12">' + itemTags.map(function (tg) {
            return '<span class="px-8 py-2 rounded-xxs bg-disabled-bg text-secondary text-caption-12">' + esc(tg) + '</span>';
          }).join('') + '</div>'
        : '';
      var body = it.body ? '<div class="text-body-14 text-secondary mt-8">' + it.body + '</div>' : '';
      var meta = it.meta ? '<p class="text-caption-12 text-secondary mt-8">' + esc(it.meta) + '</p>' : '';
      return '<div' + show + ' class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
        '<p class="text-body-16 font-semibold">' + esc(it.title) + '</p>' + body + meta + tagChips + '</div>';
    }).join('');

    // facet chip row — flex-wrap so a wide facet set never overflows the page on mobile.
    // toggling a chip adds/removes it from `active`; 'all' clears the filter.
    var allLabel = ko ? '전체' : 'All';
    var chips = '<button @click="active=[]" :class="active.length===0 ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
      'class="px-10 py-4 rounded-small">' + esc(allLabel) + '</button>' +
      allTags.map(function (tg) {
        return '<button @click="toggle(' + sq(tg) + ')" :class="active.includes(' + sq(tg) + ') ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
          'class="px-10 py-4 rounded-small">' + esc(tg) + '</button>';
      }).join('');
    var chipRow = '<div class="flex flex-wrap gap-6 mb-12 text-caption-12">' + chips + '</div>';

    // live "showing N of M" count, recomputed by Alpine from the active facets.
    // SINGLE-quoted nested array literal (NOT JSON.stringify) — double quotes would
    // terminate the double-quoted x-text attr and blank the count (same footgun as findings).
    var ofWord = ko ? ' / ' : ' of ';
    var tagMatrix = '[' + items.map(function (it) {
      return '[' + (it.tags || []).map(sq).join(',') + ']';
    }).join(',') + ']';
    var count = '<p class="text-caption-12 text-secondary mb-12" x-text="(active.length===0 ? ' + items.length + ' : ' +
      tagMatrix + '.filter(tags => active.every(t => tags.includes(t))).length) + ' + sq(ofWord + items.length) + '"></p>';

    var grid = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">' + cards + '</div>';
    host.innerHTML = caption +
      '<div x-data="{ active: [], toggle(t){ const i=this.active.indexOf(t); i<0 ? this.active.push(t) : this.active.splice(i,1); } }">' +
      chipRow + count + grid + '</div>';

    CB.refreshIcons();
  };

  /* ==========================================================================
     FAST-PATH HELPER 10/11 — COOKIEBITE.tabs(target, items, opts?) (alias CB.reveal)
     Vanilla (NO Alpine) tab shell: a row of themed tab buttons + panels. Each item
     is { id?, label, render(panelEl) }; render() is called LAZILY on first show of
     its panel, and once the panel is visible the runtime fires requestAnimationFrame
     so any chart created inside it resize()s (reuses the same charts[] registry as
     CB.chart + runs CB.refreshIcons). First tab open by default; keyboard nav +
     aria-selected wired. Solves the empty-chart-at-0×0 footgun (interactions.md §6).
     ========================================================================== */
  var tabsSeq = 0;

  CB.tabs = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    items = items || [];
    opts = opts || {};
    var gid = 'cbTabs' + (++tabsSeq);

    // tab buttons + panels; aria roles wire the buttons to their panels
    var tablist = items.map(function (it, i) {
      var sel = i === 0;
      var tabId = gid + '-tab-' + i;
      var panelId = it.id || (gid + '-panel-' + i);
      return '<button type="button" role="tab" id="' + tabId + '" aria-controls="' + panelId + '" ' +
        'aria-selected="' + (sel ? 'true' : 'false') + '" tabindex="' + (sel ? '0' : '-1') + '" ' +
        'class="px-12 py-8 text-body-14 font-medium border-b-2 -mb-px transition-colors ' +
        (sel ? 'border-accent text-accent-strong' : 'border-transparent text-secondary hover:text-primary') + '">' +
        esc(it.label) + '</button>';
    }).join('');
    var panels = items.map(function (it, i) {
      var sel = i === 0;
      var tabId = gid + '-tab-' + i;
      var panelId = it.id || (gid + '-panel-' + i);
      return '<div role="tabpanel" id="' + panelId + '" aria-labelledby="' + tabId + '"' +
        (sel ? '' : ' hidden') + '></div>';
    }).join('');

    host.innerHTML =
      '<div role="tablist" class="flex gap-8 border-b border-line-weak mb-16">' + tablist + '</div>' +
      '<div>' + panels + '</div>';

    var btns = [].slice.call(host.querySelectorAll('[role="tab"]'));
    var panelEls = [].slice.call(host.querySelectorAll('[role="tabpanel"]'));
    var done = [];   // per-panel lazy-init guard

    function reveal(i) {
      var panel = panelEls[i];
      if (!panel) return;
      if (!done[i]) {
        done[i] = true;
        var it = items[i];
        try { if (typeof it.render === 'function') it.render(panel); } catch (e) { /* one bad panel must not break tabs */ }
      }
      // panel now visible: redraw icons + resize any chart created inside it next frame
      CB.refreshIcons();
      requestAnimationFrame(function () {
        charts.forEach(function (c) {
          var dom = c.instance && c.instance.getDom && c.instance.getDom();
          if (dom && panel.contains(dom)) {
            try { c.instance.resize(); } catch (e) {}
          }
        });
      });
    }

    function select(i) {
      btns.forEach(function (b, j) {
        var on = j === i;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        b.classList.toggle('border-accent', on);
        b.classList.toggle('text-accent-strong', on); // accent-as-TEXT -> strong for AA
        b.classList.toggle('border-transparent', !on);
        b.classList.toggle('text-secondary', !on);
      });
      panelEls.forEach(function (p, j) { p.hidden = j !== i; });
      reveal(i);
    }

    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (next < 0) return;
        next = (next + btns.length) % btns.length;
        e.preventDefault();
        btns[next].focus();
        select(next);
      });
    });

    reveal(0); // first tab open by default — lazy-init its panel now
    return host;
  };
  CB.reveal = CB.tabs; // alias (interactions.md §6 names both)

  /* ==========================================================================
     FAST-PATH HELPER 11/11 — COOKIEBITE.copyButton(target, label, builderFn, opts?)
     + COOKIEBITE.sectionToMarkdown(selector) (interactions.md §13). copyButton injects
     a themed <button> into target that calls CB.copy(builderFn(), btn) — inheriting the
     clipboard fallback + the shared 'Copied ✓' flash. opts.className overrides styling.
     sectionToMarkdown is a best-effort serializer (headings/paragraphs/lists/tables ->
     markdown) — the no-custom-builder companion to copyButton.
     ========================================================================== */
  CB.copyButton = function (target, label, builderFn, opts) {
    var host = resolveTarget(target);
    if (!host || typeof builderFn !== 'function') return null;
    opts = opts || {};
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = opts.className || 'px-12 py-8 rounded-small bg-accent text-accent-on text-body-14';
    btn.textContent = label;
    btn.addEventListener('click', function () { CB.copy(builderFn(), btn); });
    host.appendChild(btn);
    return btn;
  };

  CB.sectionToMarkdown = function (selector) {
    var root = resolveTarget(selector);
    if (!root) return '';
    var lines = [];
    // walk the section in document order, emitting markdown per block element
    var blocks = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,ul,ol,table');
    [].slice.call(blocks).forEach(function (el) {
      // skip a block nested inside another we'll already emit (a <p> inside a <td>)
      if (el.parentElement && el.parentElement.closest('table,ul,ol') && el.tagName !== 'TABLE') return;
      var tag = el.tagName.toLowerCase();
      var text = function (node) { return (node.textContent || '').replace(/\s+/g, ' ').trim(); };
      if (/^h[1-6]$/.test(tag)) {
        lines.push('\n' + new Array(+tag[1] + 1).join('#') + ' ' + text(el));
      } else if (tag === 'p') {
        var t = text(el); if (t) lines.push(t + '\n');
      } else if (tag === 'ul' || tag === 'ol') {
        [].slice.call(el.children).forEach(function (li, i) {
          if (li.tagName !== 'LI') return;
          var bullet = tag === 'ol' ? (i + 1) + '. ' : '- ';
          lines.push(bullet + text(li));
        });
        lines.push('');
      } else if (tag === 'table') {
        var rows = [].slice.call(el.querySelectorAll('tr'));
        rows.forEach(function (tr, ri) {
          var cells = [].slice.call(tr.querySelectorAll('th,td')).map(function (c) { return text(c); });
          if (!cells.length) return;
          lines.push('| ' + cells.join(' | ') + ' |');
          // header separator after the first row when it carries <th> cells
          if (ri === 0 && tr.querySelector('th')) {
            lines.push('| ' + cells.map(function () { return '---'; }).join(' | ') + ' |');
          }
        });
        lines.push('');
      }
    });
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  /* ==========================================================================
     escape-hatch primitives — clipboard / download (interactions.md §13).
     ========================================================================== */
  CB.copy = function (text, btnEl) {
    var flash = function () {
      if (!btnEl) return;
      var orig = btnEl.textContent;
      btnEl.textContent = 'Copied ✓';
      setTimeout(function () { btnEl.textContent = orig; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(flash, flash);
    }
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); flash();
  };
  CB.download = function (filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  /* COOKIEBITE.exportPNG(chartSelector, filename?) — download a registered chart as a
     PNG. Resolves the echarts instance whose DOM matches chartSelector (the chart's
     own #id or any ancestor passed to CB.chart) from the charts[] registry, then uses
     getDataURL with the current surface as the background so the PNG isn't transparent
     on a dark page. The artifact is meant to be Slacked/pasted into a deck — this is the
     one share format the readers most want. */
  CB.exportPNG = function (chartSelector, filename) {
    var el = resolveTarget(chartSelector);
    if (!el) return;
    var match = null;
    for (var i = 0; i < charts.length; i++) {
      var inst = charts[i] && charts[i].instance;
      var dom = inst && inst.getDom && inst.getDom();
      if (dom && (dom === el || el === dom || (el.contains && el.contains(dom)))) { match = inst; break; }
    }
    if (!match) { console.warn('[cookiebite] COOKIEBITE.exportPNG: no registered chart found for selector', chartSelector); return; }
    var url = match.getDataURL({ pixelRatio: 2, backgroundColor: cssColor('--c-surface', '#FFFFFF') });
    var a = document.createElement('a');
    a.href = url; a.download = filename || 'chart.png';
    document.body.appendChild(a); a.click(); a.remove();
  };

  /* ==========================================================================
     TOC active-section highlight (IntersectionObserver). Auto-wires whatever
     #toc a + main section[id] exist — the model only authors the <ul>.
     Ported verbatim from template.html initToc().
     ========================================================================== */
  function initToc() {
    var links = [].slice.call(document.querySelectorAll('#toc a'));
    if (!links.length) return;
    // respect prefers-reduced-motion: the css sets html{scroll-behavior:smooth}
    // unconditionally, so kill the animated TOC scroll here for users who opted out.
    if (!CB.MOTION_OK) document.documentElement.style.scrollBehavior = 'auto';

    // ---- mobile section nav: the sticky TOC is `hidden lg:block`, so below lg there is
    // NO wayfinding for a long report read on a phone. Build a compact "On this page"
    // <select> (shown only below lg) from the same TOC links; selecting jumps to the
    // section and the observer keeps it in sync with the scroll position.
    var mobileSelect = buildMobileSectionNav(links);

    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        // accent-as-TEXT on a light surface must use --accent-strong for AA contrast
        a.classList.toggle('text-accent-strong', on); a.classList.toggle('bg-accent-weak', on);
        a.classList.toggle('font-semibold', on); a.classList.toggle('text-secondary', !on);
      });
      if (mobileSelect && mobileSelect.value !== '#' + id) mobileSelect.value = '#' + id;
    };
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { obs.observe(s); });
  }

  // Build the compact below-lg "On this page" dropdown from the TOC links. Returns the
  // <select> (so initToc can keep its value synced to the active section) or null.
  function buildMobileSectionNav(links) {
    if (document.getElementById('cbMobileNav')) return null;
    var ko = window.REPORT_LOCALE && /^ko/i.test(window.REPORT_LOCALE.number);
    var opts = links.map(function (a) {
      var href = a.getAttribute('href') || '';
      return '<option value="' + esc(href) + '">' + esc((a.textContent || '').trim()) + '</option>';
    }).join('');
    if (!opts) return null;
    var nav = document.createElement('nav');
    nav.id = 'cbMobileNav';
    nav.setAttribute('aria-label', ko ? '섹션 이동' : 'Section navigation');
    // sticky strip, only below lg (the TOC's breakpoint); pr-56 leaves room for the
    // fixed top-right theme toggle so they never overlap.
    nav.className = 'lg:hidden sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-line-weak py-8 pr-56';
    nav.innerHTML =
      '<label class="sr-only" for="cbMobileNavSel">' + (ko ? '이 페이지에서' : 'On this page') + '</label>' +
      '<select id="cbMobileNavSel" class="w-full bg-surface border border-line-weak rounded-small text-body-14 text-secondary px-12 py-8">' +
      '<option value="" disabled>' + (ko ? '이 페이지에서…' : 'On this page…') + '</option>' +
      opts + '</select>';
    var main = document.querySelector('main');
    if (!main || !main.parentNode) return null;
    main.parentNode.insertBefore(nav, main);
    var sel = nav.querySelector('select');
    sel.addEventListener('change', function () {
      var t = sel.value && document.querySelector(sel.value);
      if (t) t.scrollIntoView({ behavior: CB.MOTION_OK ? 'smooth' : 'auto', block: 'start' });
    });
    return sel;
  }

  /* ==========================================================================
     light/dark toggle. cookiebite.js OWNS #themeToggle (injects if absent),
     the localStorage key 'report-theme', prefers-color-scheme first-load honor,
     and applyTheme(mode). applyTheme re-reads tokens, RE-THEMES EVERY REGISTERED
     CHART, runs onThemeChange callbacks, and fires 'cookiebite:theme'.
     It does NOT hardcode any renderTrend. verify-report.sh calls window.applyTheme.
     ========================================================================== */
  function ensureToggle() {
    var btn = document.getElementById('themeToggle');
    if (btn) return btn;
    btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', '라이트/다크 전환');
    btn.className = 'fixed top-16 right-16 z-50 inline-flex items-center justify-center w-40 h-40 rounded-full bg-surface border border-line-weak shadow-sm text-secondary hover:text-primary transition';
    btn.innerHTML = '<i data-lucide="moon" class="w-20 h-20"></i>';
    document.body.appendChild(btn);
    // On a phone the report column runs edge-to-edge, so the fixed top-right button would
    // float over the first content block (KPI numbers, first chart, a table header). Reserve
    // a clear top strip below sm so the toggle never covers content; desktop is untouched.
    if (!document.getElementById('cb-toggle-clearance')) {
      var st = document.createElement('style');
      st.id = 'cb-toggle-clearance';
      // target the report's outer wrapper (template: body > div.max-w-[1400px]) and a bare
      // <main> as a fallback, so the first content block clears the 16+40px toggle on phones.
      st.textContent = '@media (max-width:639px){body > div[class*="max-w-"], body > main{padding-top:64px}}';
      document.head.appendChild(st);
    }
    return btn;
  }

  function applyTheme(mode) {
    document.documentElement.dataset.theme = mode; // '' (light) handled as light
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var i = btn.querySelector('i');
      if (i) i.setAttribute('data-lucide', mode === 'dark' ? 'sun' : 'moon');
    }
    if (window.lucide) window.lucide.createIcons();
    readThemeVars();          // rebuild baseChart + theme constants from now-current vars
    rethemeCharts();          // re-theme EVERY registered chart (fast-path + escape-hatch)
    themeCbs.forEach(function (cb) { try { cb(mode); } catch (e) {} });
    try { window.dispatchEvent(new CustomEvent('cookiebite:theme', { detail: { mode: mode } })); } catch (e) {}
  }
  window.applyTheme = applyTheme;       // verify-report.sh + backward-compat
  CB.applyTheme = applyTheme;

  function initTheme() {
    ensureToggle();
    var saved = null;
    try { saved = localStorage.getItem('report-theme'); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // window.REPORT_THEME ('light'|'dark') locks the first-load mode, overriding OS preference
    // + any saved choice — set it in the THEME block for print/exec PDFs that must stay light.
    applyTheme(window.REPORT_THEME || saved || (prefersDark ? 'dark' : 'light'));
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('report-theme', next); } catch (e) {}
        applyTheme(next);
      });
    }
  }

  /* ==========================================================================
     glossary auto-linker (interactions.md §11). Runs only if window.GLOSSARY set.
     ========================================================================== */
  // wrap the first occurrence of each glossary term in [data-glossary] scopes.
  // `map` is the term->definition object; `scope` optionally narrows to one root.
  function linkGlossary(map, scope) {
    if (!map || typeof map !== 'object') return;
    var terms = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    var roots = scope
      ? [resolveTarget(scope)].filter(Boolean)
      : [].slice.call(document.querySelectorAll('[data-glossary]'));
    roots.forEach(function (root) {
      terms.forEach(function (term) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
        for (var n = 0; n < nodes.length; n++) {
          var node = nodes[n];
          var p = node.parentElement;
          // skip detached nodes (DOM mutated mid-iteration), already-linked terms,
          // and headings (h1–h4) — linking a term inside a title looks broken.
          if (!p || p.closest('.gloss') || p.closest('h1,h2,h3,h4')) continue;
          var i = node.nodeValue.indexOf(term);
          if (i < 0) continue;
          var span = document.createElement('span');
          span.className = 'gloss'; span.tabIndex = 0; span.setAttribute('role', 'button');
          span.dataset.tippyContent = map[term]; span.textContent = term;
          var after = node.splitText(i); after.nodeValue = after.nodeValue.slice(term.length);
          node.parentNode.insertBefore(span, after);
          break; // first occurrence only
        }
      });
    });
    if (window.tippy) {
      window.tippy('.gloss', { theme: 'report', maxWidth: 300, allowHTML: false, trigger: 'mouseenter focus' });
    }
  }

  // CB.glossary(map, scope?) — set/extend the glossary at RUNTIME (e.g. from a
  // DOMContentLoaded handler), mirroring the parse-time window.GLOSSARY path. Merges
  // into window.GLOSSARY so both sources coexist, then links within scope (or all
  // [data-glossary] regions).
  CB.glossary = function (map, scope) {
    window.GLOSSARY = Object.assign({}, window.GLOSSARY || {}, map || {});
    linkGlossary(map || window.GLOSSARY, scope);
  };

  function initGlossary() {
    if (window.GLOSSARY && typeof window.GLOSSARY === 'object') {
      linkGlossary(window.GLOSSARY);
    } else if (window.tippy) {
      // no parse-time glossary, but author may have hand-authored .gloss spans
      window.tippy('.gloss', { theme: 'report', maxWidth: 300, allowHTML: false, trigger: 'mouseenter focus' });
    }
  }

  /* ==========================================================================
     "Made with cookiebite" credit — auto-injected so every report carries a
     quiet, discoverable link back to the project (a reader who likes a page can
     find what made it). Appends one muted line to the report footer, or creates
     a minimal footer if the report has none. Idempotent; never duplicates.
     ========================================================================== */
  function initCredit() {
    if (document.querySelector('[data-cb-credit], a[href*="github.com/korECM/cookiebite"]')) return;
    var link =
      '<a data-cb-credit href="https://github.com/korECM/cookiebite" target="_blank" rel="noopener" ' +
      'class="text-caption-12 text-secondary hover:text-primary transition-colors">' +
      'Made with <span class="font-medium">cookiebite</span></a>';
    var footer = document.querySelector('main footer') || document.querySelector('footer');
    if (footer) {
      var line = document.createElement('div');
      line.className = 'mt-8';
      line.innerHTML = link;
      footer.appendChild(line);
    } else {
      var host = document.querySelector('main') || document.body;
      var f = document.createElement('footer');
      f.className = 'pt-24 mt-24 border-t border-line-weak';
      f.innerHTML = link;
      host.appendChild(f);
    }
  }

  /* ==========================================================================
     ONE auto-init on DOMContentLoaded. Safe: echarts/alpine(defer)/lucide/tippy
     are parsed by now (head load order guarantees it).
     ========================================================================== */
  // load-order self-check: the px spacing scale (w-12 -> 12px) only applies if the
  // Tailwind CDN scanned AFTER window.tailwind.config was set (i.e. cookiebite.js BEFORE
  // cdn.tailwindcss.com). If a w-12 probe resolves to ~48px (default rem scale) the order
  // was swapped — icons render 4x and layouts collapse, so surface a precise diagnostic.
  function checkLoadOrder() {
    var probe = document.createElement('div');
    probe.className = 'w-12';
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);
    if (w > 20) console.error('[cookiebite] custom spacing scale not applied (w-12 = ' + Math.round(w) + 'px, expected ~12px). Load cdn.tailwindcss.com BEFORE cookiebite.js so the Play CDN reads window.tailwind.config — icons/layout are broken until you do.');
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.lucide) window.lucide.createIcons();
    checkLoadOrder();
    CB.hydrate(document);   // wire any [data-countup]/[data-spark] authored in raw HTML
    initToc();
    initTheme();
    initGlossary();
    initCredit();
    // resize every registered chart instance (sparks, fast-path + escape-hatch charts).
    // coalesce a burst of resize events into ONE trailing rAF (same pattern CB.tabs
    // uses) so a continuous window drag / mobile URL-bar reflow doesn't fire a
    // layout+canvas redraw per chart per tick.
    var resizeRaf = 0;
    window.addEventListener('resize', function () {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(function () {
        resizeRaf = 0;
        pruneCharts(); // self-heal: drop instances orphaned by a re-render
        charts.forEach(function (c) { if (c.instance) { try { c.instance.resize(); } catch (e) {} } });
      });
    });
  });
})();
