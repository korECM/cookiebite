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
          'title-28': ['28px', '36px'], 'headline-36': ['36px', '44px'], 'headline-48': ['48px', '56px'],
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
    return L.bigUnits
      ? (n >= 1e8 ? (n / 1e8).toFixed(1).replace(/\.0$/, '') + '억' : n >= 1e4 ? Math.round(n / 1e4) + '만' : nf.format(n))
      : (n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : nf.format(n));
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
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { axisLine: { lineStyle: { color: t.C_LINE } }, axisTick: { show: false }, axisLabel: { color: t.C_SECONDARY } },
      yAxis: { splitLine: { lineStyle: { color: t.C_LINE } }, axisLabel: { color: t.C_SECONDARY } },
    };
    syncThemeAliases();
  }
  CB.readThemeVars = readThemeVars;

  /* accent as rgba (handles #RGB and #RRGGBB) — sparkline fills, gradient stops */
  var accentRgba = function (a) {
    var h = CB.theme.ACCENT.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
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

  CB.registerChart = function (instance, renderFn) {
    charts.push({ instance: instance, renderFn: renderFn || null });
    return instance;
  };
  CB.onThemeChange = function (cb) { if (typeof cb === 'function') themeCbs.push(cb); };

  function rethemeCharts() {
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

  /* COOKIEBITE.pill(label, {tone, icon?}) -> string */
  CB.pill = function (label, opts) {
    opts = opts || {};
    var t = tone(opts.tone);
    var icon = opts.icon === null ? '' : (opts.icon || t.icon);
    var ic = icon ? iconTag(icon, 'w-12 h-12') : '';
    return '<span class="inline-flex items-center gap-4 px-8 py-2 rounded-xxs ' + t.tint + ' ' + t.text +
      ' text-caption-12 font-medium">' + ic + esc(label) + '</span>';
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
        c.setOption({
          grid: { left: 0, right: 0, top: 2, bottom: 2 },
          xAxis: { type: 'category', show: false, data: data.map(function (_, i) { return i; }) },
          yAxis: { type: 'value', show: false, scale: true },
          series: [{
            type: 'line', data: data, smooth: true, symbol: 'none',
            lineStyle: { width: 2, color: CB.theme.ACCENT },
            areaStyle: { color: accentRgba(0.10) },
          }],
        });
        // sparks re-theme + resize through the registry; renderFn re-reads accent
        CB.registerChart(c, (function (chart, d) {
          return function () {
            chart.setOption({
              series: [{ type: 'line', data: d, smooth: true, symbol: 'none', lineStyle: { width: 2, color: CB.theme.ACCENT }, areaStyle: { color: accentRgba(0.10) } }],
            });
          };
        })(c, data));
      });
    }
  };

  /* ==========================================================================
     FAST-PATH HELPER 1/6 — COOKIEBITE.kpis(target, items, opts?)
     Emits the SAME markup as the template KPI section. Hand-written cards with
     the same classes/attrs coexist.
     ========================================================================== */
  function resolveTarget(target) {
    return typeof target === 'string' ? document.querySelector(target) : target;
  }
  var COLS_MAP = {
    '1-2-4': 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-16',
    '1-2-3': 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-16',
    '1-3': 'grid grid-cols-1 xl:grid-cols-3 gap-16',
  };

  CB.kpis = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    var animate = opts.animate !== false;
    host.className = (host.className ? host.className + ' ' : '') + (COLS_MAP[opts.cols] || COLS_MAP['1-2-4']);

    host.innerHTML = (items || []).map(function (it) {
      // label (optionally a glossary term)
      var label = it.gloss
        ? '<span class="gloss" tabindex="0" role="button" data-tippy-content="' + esc(it.gloss) + '">' + esc(it.label) + '</span>'
        : esc(it.label);

      // big number
      var dec = it.decimals != null ? it.decimals : (it.value % 1 ? 2 : 0);
      var cuAttrs = 'data-countup="' + it.value + '"';
      if (!animate || it.decimals != null) cuAttrs += ' data-decimals="' + dec + '"';
      var pre = it.prefix != null ? it.prefix : '';
      var suf = it.suffix != null ? it.suffix : '';
      var numHtml;
      if (it.unit) {
        // long figures: keep number big, unit small, never wrap
        numHtml = '<span class="text-headline-36 font-bold nums leading-none whitespace-nowrap">' +
          esc(pre) + '<span ' + cuAttrs + '>0</span>' +
          '<span class="text-title-20 text-secondary font-semibold">' + esc(it.unit) + '</span></span>';
      } else {
        // whitespace-nowrap so a prefix/suffix (e.g. "16 / 16", "₩4,120") never wraps mid-figure
        numHtml = '<span class="text-headline-36 font-bold nums whitespace-nowrap" ' + cuAttrs +
          (pre ? ' data-prefix="' + esc(pre) + '"' : '') +
          (suf ? ' data-suffix="' + esc(suf) + '"' : '') + '>0</span>';
      }

      // delta badge — tone-colored, lucide arrow; null => '—' sentinel (never fake zero)
      var deltaHtml;
      if (it.delta) {
        var dt = tone(it.delta.tone);
        var arrow = it.delta.dir === 'up' ? 'arrow-up-right' : it.delta.dir === 'down' ? 'arrow-down-right' : 'minus';
        deltaHtml = '<span class="mb-6 inline-flex items-center gap-2 text-caption-12 font-semibold whitespace-nowrap ' + dt.text + '">' +
          iconTag(arrow, 'w-16 h-16') + ' ' + esc(it.delta.text) + '</span>';
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

      return '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
        '<p class="text-body-14 text-secondary">' + label + '</p>' +
        '<div class="flex items-end gap-8 mt-8">' + numHtml + deltaHtml + '</div>' +
        spark + '</div>';
    }).join('');

    CB.refreshIcons();
    CB.hydrate(host);
  };

  /* ==========================================================================
     FAST-PATH HELPER 2/6 — COOKIEBITE.findings(target, items, opts?)
     Emits the components.md "Severity-coded findings list" verbatim, incl. the
     optional Alpine severity-chip filter. tone doubles as severity.
     ========================================================================== */
  var SEV_LABEL = { critical: 'Critical', warning: 'High', info: 'Medium', neutral: 'Low' };
  var SEV_RANK = { critical: 0, warning: 1, info: 2, neutral: 3 };

  CB.findings = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    var withFilter = opts.filter !== false;
    var withSort = opts.sort !== false;

    var list = (items || []).slice();
    var rank = function (t) { return SEV_RANK[t] == null ? 9 : SEV_RANK[t]; }; // critical=0 must not fall through ||
    if (withSort) list.sort(function (a, b) { return rank(a.tone) - rank(b.tone); });

    var lis = list.map(function (f) {
      var t = tone(f.tone);
      var badgeLabel = f.label || SEV_LABEL[f.tone] || 'Note';
      var show = withFilter ? ' x-show="sev===\'all\' || sev===\'' + f.tone + '\'"' : '';
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

    var filterRow = withFilter
      ? '<div class="flex gap-6 mb-12 text-caption-12">' +
        '<template x-for="s in [\'all\',\'critical\',\'warning\',\'info\']">' +
        '<button @click="sev=s" :class="sev===s ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
        'class="px-10 py-4 rounded-small capitalize" x-text="s"></button></template></div>'
      : '';

    var inner = filterRow + '<ul class="space-y-8">' + lis + '</ul>';
    host.innerHTML = withFilter
      ? '<div x-data="{ sev:\'all\' }">' + inner + '</div>'
      : inner;

    CB.refreshIcons();
  };

  /* ==========================================================================
     FAST-PATH HELPER 3/6 — COOKIEBITE.timeline(target, items, opts?)
     Alpine x-for vertical timeline (incident-postmortem pattern). kind -> tone
     via an OPEN, overridable map (never a closed enum). Detail via x-collapse.
     ========================================================================== */
  var DEFAULT_TONE_MAP = { start: 'info', cause: 'critical', action: 'warning', resolved: 'success' };
  var TONE_DOT = { neutral: 'bg-secondary', info: 'bg-informative', success: 'bg-positive', warning: 'bg-cautionary', critical: 'bg-critical' };
  var TONE_DEFAULT_ICON = { neutral: 'circle', info: 'info', success: 'check', warning: 'alert-triangle', critical: 'octagon-x' };

  CB.timeline = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    var toneMap = Object.assign({}, DEFAULT_TONE_MAP, opts.toneMap || {});
    var collapse = opts.collapse !== false;

    var rows = (items || []).map(function (it, i) {
      var toneName = toneMap[it.kind] || (it.kind && tone(it.kind) !== TONE.neutral ? it.kind : 'neutral');
      var dot = TONE_DOT[toneName] || TONE_DOT.neutral;
      var icon = it.icon || TONE_DEFAULT_ICON[toneName] || 'circle';
      var t = tone(toneName);
      var hasDetail = !!it.detail;
      var detailBlock = hasDetail
        ? (collapse
          ? '<div x-show="open' + i + '"' + ' x-collapse class="mt-6 text-body-14 text-secondary">' + esc(it.detail) + '</div>'
          : '<div class="mt-6 text-body-14 text-secondary">' + esc(it.detail) + '</div>')
        : '';
      var titleRow = hasDetail && collapse
        ? '<button @click="open' + i + '=!open' + i + '" class="flex items-center gap-6 text-left">' +
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
     FAST-PATH HELPER — COOKIEBITE.mermaid(target, definition, opts?)
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
        // let the SVG scale to the container instead of its intrinsic width
        var svg = host.querySelector('svg');
        if (svg) { svg.removeAttribute('width'); svg.style.maxWidth = '100%'; svg.style.height = 'auto'; }
        if (res.bindFunctions) res.bindFunctions(host);
      });
    }

    loader.then(function (mermaid) {
      render(mermaid);
      CB.onThemeChange(function () { render(mermaid); }); // re-render with dark palette on toggle
    }).catch(function (e) {
      console.warn('[cookiebite] COOKIEBITE.mermaid failed', e);
      if (opts.onError) host.innerHTML = opts.onError;
      else host.innerHTML = '<pre class="text-caption-12 text-critical p-12 rounded-small bg-disabled-bg overflow-auto">다이어그램 렌더 실패 — Mermaid 정의를 확인하세요.</pre>';
    });
    return host;
  };

  /* ==========================================================================
     FAST-PATH HELPER 4/6 — COOKIEBITE.table(target, config) -> gridInstance
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
      var rules = config.numericCols.map(function (c) {
        var n = c + 1;
        return sel + ' .gridjs-th:nth-child(' + n + '),' + sel + ' .gridjs-td:nth-child(' + n + ')';
      }).join(',');
      var styleEl = document.createElement('style');
      styleEl.textContent = rules + '{ text-align:right; font-variant-numeric:tabular-nums; }';
      document.head.appendChild(styleEl);  // NOT host — Grid.js refuses to render into a non-empty container
    }

    // statusCol -> COOKIEBITE.pill via gridjs.html
    var columns = (config.columns || []).map(function (col, idx) {
      var base = typeof col === 'string' ? { name: col } : Object.assign({}, col);
      if (config.statusCol === idx && !base.formatter) {
        base.formatter = function (cell) {
          if (cell && typeof cell === 'object' && cell.label != null) {
            return gridjs.html(CB.pill(cell.label, { tone: cell.tone, icon: cell.icon }));
          }
          return gridjs.html(CB.pill(String(cell), { tone: 'neutral' }));
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
    CB.refreshIcons();
    return grid;
  };

  /* ==========================================================================
     FAST-PATH HELPER 5/6 — COOKIEBITE.chart(target, config) -> echartsInstance
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
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(over).forEach(function (k) {
      var bv = out[k], ov = over[k];
      out[k] = (isPlainObject(bv) && isPlainObject(ov)) ? deepMerge(bv, ov) : ov;
    });
    return out;
  }
  CB.deepMerge = deepMerge; // exposed: hand charts may reuse the same merge semantics

  var chartSeq = 0;

  CB.chart = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.chart needs echarts.'); return null; }
    config = config || {};
    var height = config.height || 300;
    var aria = config.ariaLabel || 'chart';
    var cid = 'cbChart' + (++chartSeq);

    // build the §10 view-toggle scaffold (matches the template trend section)
    var hasTable = !!(config.table && config.table.columns);
    var caption = config.caption
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + config.caption + '</p>'
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

    var toggleBtn = hasTable
      ? '<div class="flex justify-end mb-8"><button @click="table=!table" :aria-pressed="table" ' +
        'class="text-caption-12 text-secondary hover:text-primary" x-text="table ? \'차트로 보기\' : \'표로 보기\'"></button></div>'
      : '';

    host.innerHTML = caption +
      '<div' + (hasTable ? ' x-data="{ table:false }"' : '') + '>' + toggleBtn +
      '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
      '<div ' + (hasTable ? 'x-show="!table"' : '') + '><div id="' + cid + '" role="img" aria-label="' + esc(aria) + '" style="height:' + height + 'px"></div></div>' +
      (hasTable ? tableHtml : '') +
      '</div></div>';

    var el = host.querySelector('#' + cid);
    var inst = window.echarts.init(el);
    var option = deepMerge(CB.baseChart, config.option || {});
    inst.setOption(option, true);

    // register for dark re-theme: re-merge author option over the freshly-read baseChart
    var renderFn = config.render
      ? config.render
      : function (chart) { chart.setOption(deepMerge(CB.baseChart, config.option || {}), true); };
    CB.registerChart(inst, renderFn);

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     COOKIEBITE.dataTableToggle(chartTarget, { columns, rows, ariaLabel? })
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

    var bar = document.createElement('div');
    bar.className = 'flex justify-end mb-8';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'text-caption-12 text-secondary hover:text-primary';
    btn.textContent = '표로 보기';
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
      btn.textContent = showingTable ? '차트로 보기' : '표로 보기';
      btn.setAttribute('aria-pressed', showingTable ? 'true' : 'false');
    });
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

  /* ==========================================================================
     TOC active-section highlight (IntersectionObserver). Auto-wires whatever
     #toc a + main section[id] exist — the model only authors the <ul>.
     Ported verbatim from template.html initToc().
     ========================================================================== */
  function initToc() {
    var links = [].slice.call(document.querySelectorAll('#toc a'));
    if (!links.length) return;
    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('text-accent', on); a.classList.toggle('bg-accent-weak', on);
        a.classList.toggle('font-semibold', on); a.classList.toggle('text-secondary', !on);
      });
    };
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { obs.observe(s); });
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
  function initGlossary() {
    if (window.GLOSSARY && typeof window.GLOSSARY === 'object') {
      var terms = Object.keys(window.GLOSSARY).sort(function (a, b) { return b.length - a.length; });
      document.querySelectorAll('[data-glossary]').forEach(function (scope) {
        terms.forEach(function (term) {
          var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
          var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
          for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            if (node.parentElement.closest('.gloss')) continue;
            var i = node.nodeValue.indexOf(term);
            if (i < 0) continue;
            var span = document.createElement('span');
            span.className = 'gloss'; span.tabIndex = 0; span.setAttribute('role', 'button');
            span.dataset.tippyContent = window.GLOSSARY[term]; span.textContent = term;
            var after = node.splitText(i); after.nodeValue = after.nodeValue.slice(term.length);
            node.parentNode.insertBefore(span, after);
            break; // first occurrence only
          }
        });
      });
    }
    if (window.tippy) {
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
    if (document.querySelector('[data-cb-credit]')) return;
    var link =
      '<a data-cb-credit href="https://github.com/korECM/cookiebite" target="_blank" rel="noopener" ' +
      'class="text-caption-12 text-text-disabled hover:text-secondary transition-colors">' +
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
  document.addEventListener('DOMContentLoaded', function () {
    if (window.lucide) window.lucide.createIcons();
    CB.hydrate(document);   // wire any [data-countup]/[data-spark] authored in raw HTML
    initToc();
    initTheme();
    initGlossary();
    initCredit();
    // resize every registered chart instance (sparks, fast-path + escape-hatch charts)
    window.addEventListener('resize', function () {
      charts.forEach(function (c) { if (c.instance) { try { c.instance.resize(); } catch (e) {} } });
    });
  });
})();
