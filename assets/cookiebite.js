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
          // F02 — accent-AS-TEXT token. A preset can ship a darker, AA-safe --accent-text for
          // text use (KPI hero numbers, outline-button labels) while keeping the brighter
          // --accent for FILLS. Falls back to --accent when the preset omits it, so a report
          // without --accent-text is byte-identical to today. Consumed via text-accent-text.
          'accent-text': 'var(--accent-text, var(--accent))',
          // F39 — on-accent SMALL-text ink. White (--accent-on) clears AA on LARGE
          // titles/fills, but a bright accent (persimmon/raycast) can fail the 4.5
          // small-text floor; a preset ships --accent-on-text (a dark ink) for chips
          // and <14px on-accent text. Falls back to --accent-on, so presets whose
          // white already passes are byte-identical. Consumed via text-accent-on-text.
          'accent-on-text': 'var(--accent-on-text, var(--accent-on))',
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
          '60': '60px', '64': '64px', '72': '72px', '80': '80px', '96': '96px', '112': '112px',
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
  /* F01a: a bad REPORT_LOCALE.number (an invalid 'number' string, e.g. a typo) makes the
     Intl.NumberFormat constructor THROW a RangeError, which would otherwise abort the entire
     COOKIEBITE namespace init and leave the runtime unloaded. Guard it: on failure fall back
     to a safe default formatter ('en-US'; and if even that is unavailable, a no-grouping
     identity) so the rest of the runtime still loads. */
  var nf;
  try {
    nf = new Intl.NumberFormat(L.number);
  } catch (e) {
    try { nf = new Intl.NumberFormat('en-US'); }
    catch (e2) { nf = { format: function (n) { return String(n); } }; }
  }
  var money = function (n) { return L.symbol + nf.format(n); };
  var moneyShort = function (n) {
    // band on the MAGNITUDE then re-apply the sign, so negatives short-form too.
    // round to the band's 1-decimal precision BEFORE selecting the band, so a value
    // just under a boundary (999,999 -> '1.0M', 99,999,999 -> '1.0억') rolls up into
    // the next band instead of reading '1000K' / '10000만'.
    // non-finite (Infinity/-Infinity/NaN) has no short form — fall back to nf.format so
    // it never renders 'InfinityB' / 'Infinity억'.
    if (!isFinite(n)) return nf.format(n);
    var sign = n < 0 ? '-' : '';
    var a = Math.abs(n);
    var band = function (div, unit) { return sign + (Math.round(a / div * 10) / 10).toFixed(1).replace(/\.0$/, '') + unit; };
    if (L.bigUnits) {
      // F42: the 만/억 (myriad) banding is shared by ko, ja AND zh — only the glyphs
      // differ (ko 만/억, ja 万/億, zh 万/亿). bigUnits:'ja'|'zh' (or a {man,eok} object)
      // swaps the labels; bigUnits:true keeps the historical Korean glyphs byte-for-byte.
      var U = L.bigUnits === 'ja' ? { man: '万', eok: '億' }
        : L.bigUnits === 'zh' ? { man: '万', eok: '亿' }
        : (L.bigUnits && typeof L.bigUnits === 'object') ? { man: L.bigUnits.man || '만', eok: L.bigUnits.eok || '억' }
        : { man: '만', eok: '억' };
      if (Math.round(a / 1e4) >= 1e4) return band(1e8, U.eok); // 만-band would round to >=10000만 -> roll to 억
      // 만 keeps the same 1-decimal band treatment as every other unit (15000 -> '1.5만', not '2만')
      return a >= 1e8 ? band(1e8, U.eok) : a >= 1e4 ? band(1e4, U.man) : nf.format(n);
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

  /* ---- F42 i18n string table (replaces the scattered /^ko/i string forks) ----
     Keyed by a 2-letter locale prefix; ko/en ship built-in (their strings are
     BYTE-IDENTICAL to the prior inline forks, so existing ko/en reports are
     unchanged). window.REPORT_LOCALE.strings is a per-report override map merged
     on top. CB.locale() resolves the active prefix from REPORT_LOCALE.number
     (e.g. 'ko-KR' -> 'ko'); unknown locales fall back to 'en'. CB.t(key, fallback)
     looks the key up; a missing key returns the fallback (or the key itself), so a
     half-translated override never blanks a label. */
  var I18N = {
    en: {
      noData: 'No data',
      viewTable: 'View as table', viewChart: 'View as chart',
      savePng: 'Save PNG', exportCsv: 'Export CSV',
      sevCritical: 'Critical', sevHigh: 'High', sevMedium: 'Medium', sevLow: 'Low', all: 'All',
      insightAction: 'Action', insightWatch: 'Watch', insightNote: 'Note', keyTakeaways: 'Key takeaways',
      recommended: 'Recommended', total: 'Total', overall: 'Overall ', vsPrev: ' vs prev',
      stepCol: 'Step', valueCol: 'Value', dateCol: 'Date',
      pathCol: 'Path', sourceCol: 'Source', targetCol: 'Target',
      taskCol: 'Task', startCol: 'Start', endCol: 'End', today: 'Today',
      stDone: 'done', stCurrent: 'current', stPending: 'pending',
      sectionNav: 'Section navigation', onThisPage: 'On this page', onThisPageDots: 'On this page…',
      ofWord: ' of ',
      themeToggle: 'Toggle light/dark', print: 'Print / Save as PDF',
      search: 'Search report', noMatches: 'No matches',
      copied: 'Copied ✓', copyLink: 'Copy link to this section',
      density: 'Toggle density', auditTitle: 'Audit',
      details: 'Details', copyMarkdown: 'Copy as Markdown',
      mermaidFail: 'Diagram failed to render — check the Mermaid definition.',
      coNote: 'NOTE', coTip: 'TIP', coWarning: 'WARNING', coDanger: 'DANGER', coExample: 'EXAMPLE',
      figAbbr: 'Fig.',
      notesHeading: 'Notes', backToText: 'Back to text', minRead: ' min read', contents: 'Contents',
      medianWord: 'median', otherWord: 'Other',
    },
    ko: {
      noData: '데이터 없음',
      viewTable: '표로 보기', viewChart: '차트로 보기',
      savePng: 'PNG 저장', exportCsv: 'CSV 내보내기',
      sevCritical: '심각', sevHigh: '높음', sevMedium: '보통', sevLow: '낮음', all: '전체',
      insightAction: '조치', insightWatch: '주의', insightNote: '메모', keyTakeaways: '핵심 요약',
      recommended: '추천', total: '합계', overall: '전체 전환율 ', vsPrev: ' 직전 대비',
      stepCol: '단계', valueCol: '값', dateCol: '날짜',
      pathCol: '경로', sourceCol: '출발', targetCol: '도착',
      taskCol: '작업', startCol: '시작', endCol: '종료', today: '오늘',
      stDone: '완료', stCurrent: '진행 중', stPending: '예정',
      sectionNav: '섹션 이동', onThisPage: '이 페이지에서', onThisPageDots: '이 페이지에서…',
      ofWord: ' / ',
      themeToggle: '라이트/다크 전환', print: '인쇄 / PDF 저장',
      search: '리포트 검색', noMatches: '일치 항목 없음',
      copied: 'Copied ✓', copyLink: '이 섹션 링크 복사',
      density: '밀도 전환', auditTitle: '점검',
      details: '상세', copyMarkdown: 'Markdown 복사',
      mermaidFail: '다이어그램 렌더 실패 — Mermaid 정의를 확인하세요.',
      coNote: '참고', coTip: '팁', coWarning: '주의', coDanger: '위험', coExample: '예시',
      figAbbr: '그림',
      notesHeading: '주석', backToText: '본문으로', minRead: '분 분량', contents: '목차',
      medianWord: '중앙값', otherWord: '기타',
    },
    /* ja ships ONLY the cells that differ from en where trivial; missing keys fall
       back to en via the t() resolver, so a ja report degrades gracefully. */
    ja: {
      noData: 'データなし',
      viewTable: '表で見る', viewChart: 'グラフで見る',
      all: 'すべて', total: '合計', recommended: '推奨',
      onThisPage: 'このページ内', onThisPageDots: 'このページ内…', sectionNav: 'セクション移動',
      notesHeading: '注', backToText: '本文へ戻る', minRead: '分で読めます', contents: '目次',
      medianWord: '中央値', otherWord: 'その他',
    },
    /* es/de/fr/zh: full key set translated; any omitted key falls back to en via t().
       These activate ONLY when REPORT_LOCALE.number resolves to the matching prefix, so
       ko/en/ja output stays byte-identical for existing reports. 'copied' keeps the
       universal 'Copied ✓' glyph form to match the shared flash. */
    es: {
      noData: 'Sin datos',
      viewTable: 'Ver como tabla', viewChart: 'Ver como gráfico',
      savePng: 'Guardar PNG', exportCsv: 'Exportar CSV',
      sevCritical: 'Crítico', sevHigh: 'Alto', sevMedium: 'Medio', sevLow: 'Bajo', all: 'Todo',
      insightAction: 'Acción', insightWatch: 'Atención', insightNote: 'Nota', keyTakeaways: 'Conclusiones clave',
      recommended: 'Recomendado', total: 'Total', overall: 'General ', vsPrev: ' vs ant.',
      stepCol: 'Paso', valueCol: 'Valor', dateCol: 'Fecha',
      pathCol: 'Ruta', sourceCol: 'Origen', targetCol: 'Destino',
      taskCol: 'Tarea', startCol: 'Inicio', endCol: 'Fin', today: 'Hoy',
      stDone: 'hecho', stCurrent: 'en curso', stPending: 'pendiente',
      sectionNav: 'Navegación de secciones', onThisPage: 'En esta página', onThisPageDots: 'En esta página…',
      ofWord: ' de ',
      themeToggle: 'Cambiar claro/oscuro', print: 'Imprimir / Guardar como PDF',
      search: 'Buscar en el informe', noMatches: 'Sin coincidencias',
      copied: 'Copied ✓', copyLink: 'Copiar enlace a esta sección',
      density: 'Cambiar densidad', auditTitle: 'Auditoría',
      details: 'Detalles', copyMarkdown: 'Copiar como Markdown',
      mermaidFail: 'No se pudo renderizar el diagrama — revisa la definición de Mermaid.',
      coNote: 'NOTA', coTip: 'CONSEJO', coWarning: 'AVISO', coDanger: 'PELIGRO', coExample: 'EJEMPLO',
      figAbbr: 'Fig.',
      notesHeading: 'Notas', backToText: 'Volver al texto', minRead: ' min de lectura', contents: 'Contenido',
      medianWord: 'mediana', otherWord: 'Otros',
    },
    de: {
      noData: 'Keine Daten',
      viewTable: 'Als Tabelle anzeigen', viewChart: 'Als Diagramm anzeigen',
      savePng: 'PNG speichern', exportCsv: 'CSV exportieren',
      sevCritical: 'Kritisch', sevHigh: 'Hoch', sevMedium: 'Mittel', sevLow: 'Niedrig', all: 'Alle',
      insightAction: 'Aktion', insightWatch: 'Beobachten', insightNote: 'Notiz', keyTakeaways: 'Kernaussagen',
      recommended: 'Empfohlen', total: 'Gesamt', overall: 'Insgesamt ', vsPrev: ' vs. vorher',
      stepCol: 'Schritt', valueCol: 'Wert', dateCol: 'Datum',
      pathCol: 'Pfad', sourceCol: 'Quelle', targetCol: 'Ziel',
      taskCol: 'Aufgabe', startCol: 'Start', endCol: 'Ende', today: 'Heute',
      stDone: 'fertig', stCurrent: 'laufend', stPending: 'ausstehend',
      sectionNav: 'Abschnittsnavigation', onThisPage: 'Auf dieser Seite', onThisPageDots: 'Auf dieser Seite…',
      ofWord: ' von ',
      themeToggle: 'Hell/Dunkel umschalten', print: 'Drucken / Als PDF speichern',
      search: 'Bericht durchsuchen', noMatches: 'Keine Treffer',
      copied: 'Copied ✓', copyLink: 'Link zu diesem Abschnitt kopieren',
      density: 'Dichte umschalten', auditTitle: 'Prüfung',
      details: 'Details', copyMarkdown: 'Als Markdown kopieren',
      mermaidFail: 'Diagramm konnte nicht gerendert werden — Mermaid-Definition prüfen.',
      coNote: 'HINWEIS', coTip: 'TIPP', coWarning: 'WARNUNG', coDanger: 'GEFAHR', coExample: 'BEISPIEL',
      figAbbr: 'Abb.',
      notesHeading: 'Anmerkungen', backToText: 'Zurück zum Text', minRead: ' Min. Lesezeit', contents: 'Inhalt',
      medianWord: 'Median', otherWord: 'Sonstige',
    },
    fr: {
      noData: 'Aucune donnée',
      viewTable: 'Voir en tableau', viewChart: 'Voir en graphique',
      savePng: 'Enregistrer le PNG', exportCsv: 'Exporter en CSV',
      sevCritical: 'Critique', sevHigh: 'Élevé', sevMedium: 'Moyen', sevLow: 'Faible', all: 'Tout',
      insightAction: 'Action', insightWatch: 'À surveiller', insightNote: 'Note', keyTakeaways: 'Points clés',
      recommended: 'Recommandé', total: 'Total', overall: 'Global ', vsPrev: ' vs préc.',
      stepCol: 'Étape', valueCol: 'Valeur', dateCol: 'Date',
      pathCol: 'Chemin', sourceCol: 'Source', targetCol: 'Cible',
      taskCol: 'Tâche', startCol: 'Début', endCol: 'Fin', today: "Aujourd'hui",
      stDone: 'terminé', stCurrent: 'en cours', stPending: 'à venir',
      sectionNav: 'Navigation des sections', onThisPage: 'Sur cette page', onThisPageDots: 'Sur cette page…',
      ofWord: ' sur ',
      themeToggle: 'Basculer clair/sombre', print: 'Imprimer / Enregistrer en PDF',
      search: 'Rechercher dans le rapport', noMatches: 'Aucun résultat',
      copied: 'Copied ✓', copyLink: 'Copier le lien vers cette section',
      density: 'Basculer la densité', auditTitle: 'Audit',
      details: 'Détails', copyMarkdown: 'Copier en Markdown',
      mermaidFail: 'Échec du rendu du diagramme — vérifiez la définition Mermaid.',
      coNote: 'NOTE', coTip: 'ASTUCE', coWarning: 'AVERTISSEMENT', coDanger: 'DANGER', coExample: 'EXEMPLE',
      figAbbr: 'Fig.',
      notesHeading: 'Notes', backToText: 'Retour au texte', minRead: ' min de lecture', contents: 'Sommaire',
      medianWord: 'médiane', otherWord: 'Autre',
    },
    zh: {
      noData: '无数据',
      viewTable: '以表格查看', viewChart: '以图表查看',
      savePng: '保存 PNG', exportCsv: '导出 CSV',
      sevCritical: '严重', sevHigh: '高', sevMedium: '中', sevLow: '低', all: '全部',
      insightAction: '行动', insightWatch: '关注', insightNote: '备注', keyTakeaways: '关键要点',
      recommended: '推荐', total: '合计', overall: '总体 ', vsPrev: ' 较上期',
      stepCol: '步骤', valueCol: '值', dateCol: '日期',
      pathCol: '路径', sourceCol: '来源', targetCol: '目标',
      taskCol: '任务', startCol: '开始', endCol: '结束', today: '今天',
      stDone: '完成', stCurrent: '进行中', stPending: '待办',
      sectionNav: '章节导航', onThisPage: '本页内容', onThisPageDots: '本页内容…',
      ofWord: ' / ',
      themeToggle: '切换浅色/深色', print: '打印 / 另存为 PDF',
      search: '搜索报告', noMatches: '无匹配项',
      copied: 'Copied ✓', copyLink: '复制此章节链接',
      density: '切换密度', auditTitle: '审查',
      details: '详情', copyMarkdown: '复制为 Markdown',
      mermaidFail: '图表渲染失败 — 请检查 Mermaid 定义。',
      coNote: '注意', coTip: '提示', coWarning: '警告', coDanger: '危险', coExample: '示例',
      figAbbr: '图',
      notesHeading: '注释', backToText: '返回正文', minRead: ' 分钟阅读', contents: '目录',
      medianWord: '中位数', otherWord: '其他',
    },
  };
  // active locale prefix (ko/en/ja/…); REPORT_LOCALE.number drives it, unknown -> en
  function localePrefix() {
    var n = (window.REPORT_LOCALE && window.REPORT_LOCALE.number) || 'en';
    var p = String(n).slice(0, 2).toLowerCase();
    return I18N[p] ? p : 'en';
  }
  CB.locale = localePrefix;
  CB.i18n = I18N; // exposed so an author can add a locale or inspect the table
  // t(key, fallback): override map > active-locale cell > en cell > fallback > key.
  function t(key, fallback) {
    var ov = (window.REPORT_LOCALE && window.REPORT_LOCALE.strings) || null;
    if (ov && ov[key] != null) return ov[key];
    var p = localePrefix();
    if (I18N[p] && I18N[p][key] != null) return I18N[p][key];
    if (I18N.en[key] != null) return I18N.en[key];
    return fallback != null ? fallback : key;
  }
  CB.t = t;

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
  // resolve the live accent to [r,g,b] (handles #RGB/#RRGGBB and rgb()/rgba()/named via
  // the cssColor probe). Shared by categoricalColors/ramp so the palette modes all read
  // the SAME accent and re-theme for free on a dark toggle.
  function accentRgb() {
    var raw = CB.theme.ACCENT || '#E8552D', r, g, b;
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw)) {
      var h = raw.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      var m = (cssColor('--accent', '#E8552D') || '').match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; } else { r = 232; g = 85; b = 45; }
    }
    return [r, g, b];
  }

  // Parse ANY color string (#RGB/#RRGGBB, rgb()/rgba(), hsl()/hsla()) to [r,g,b].
  // Returns null when it can't parse (caller falls back). Shared by the on-color ink picker
  // (F13 funnel labels, F17 solid-fill badges) which need a slice/fill luminance.
  function colorToRgb(str) {
    str = String(str == null ? '' : str).trim();
    var h, m;
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(str)) {
      h = str.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) return [+m[1], +m[2], +m[3]];
    m = str.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
    if (m) return hslToRgb(+m[1], +m[2] / 100, +m[3] / 100);
    return null;
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
    var hue = function (p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [Math.round(hue(p, q, h + 1 / 3) * 255), Math.round(hue(p, q, h) * 255), Math.round(hue(p, q, h - 1 / 3) * 255)];
  }
  // relative luminance (WCAG) of an [r,g,b] triple.
  function rgbLuminance(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // Pick the legible ink for text sitting ON `fill`: compare the WCAG contrast of the light
  // ink (onDark) vs the dark ink (onLight) against the fill and return whichever is HIGHER.
  // (A fixed luminance threshold misfires on saturated mid-tones — a 72%-light saturated
  // orange still favors dark ink.) Unparseable fill -> onDark (today's white default). Shared
  // by F13 (funnel slice labels) and F17 (solid semantic/accent badges).
  function lumContrast(a, b) { var hi = Math.max(a, b), lo = Math.min(a, b); return (hi + 0.05) / (lo + 0.05); }
  function inkOn(fill, onDark, onLight) {
    var rgb = colorToRgb(fill);
    if (!rgb) return onDark;
    var lf = rgbLuminance(rgb);
    var cd = lumContrast(lf, rgbLuminance(colorToRgb(onDark) || [255, 255, 255]));
    var cl = lumContrast(lf, rgbLuminance(colorToRgb(onLight) || [24, 24, 27]));
    return cl > cd ? onLight : onDark;
  }

  // resolve the palette mode for a call: opts.mode override > window.PALETTE_MODE > default.
  // 'analogous' is the historical default (bit-for-bit today's output); unknown values fall
  // back to 'analogous' so a typo never produces a rainbow.
  function resolvePaletteMode(opts) {
    var m = (opts && opts.mode) || window.PALETTE_MODE || 'analogous';
    return (m === 'mono' || m === 'categorical' || m === 'sequential') ? m : 'analogous';
  }

  /* CB.categoricalColors(n, opts?) -> [color×n] for PEER series. Honors the active
     palette mode (window.PALETTE_MODE or opts.mode):
       'analogous'   (default) — EXACTLY today's bounded-arc output, byte-for-byte.
       'mono'        — one hue; series separate by Lightness/Saturation only (quietest).
       'categorical' — wider, evenly-spaced hues with S/L locked near the accent (many peers).
       'sequential'  — perceptually-even light->dark on the accent hue (ordered peers).
     All re-read the live accent so a dark toggle re-themes for free. n<=1 -> just the accent. */
  CB.categoricalColors = function (n, opts) {
    n = n || 1;
    var rgb = accentRgb(), r = rgb[0], g = rgb[1], b = rgb[2];
    if (n <= 1) return [CB.theme.ACCENT || '#E8552D'];
    var hsl = rgbToHsl(r, g, b), baseH = hsl[0];
    var mode = resolvePaletteMode(opts);

    if (mode === 'mono') {
      // single accent hue; peers separate by a bounded L sweep (dark .. light) with a
      // gentle S taper so adjacent series stay distinguishable without rotating hue.
      var mh = Math.round(baseH), ms = Math.max(0.40, hsl[1]);
      var mo = [];
      for (var mi = 0; mi < n; mi++) {
        var mf = i01(mi, n);
        var ml = 0.40 + (0.70 - 0.40) * mf;
        var msi = Math.max(0.30, ms - 0.12 * mf);
        mo.push('hsl(' + mh + ',' + Math.round(msi * 100) + '%,' + Math.round(ml * 100) + '%)');
      }
      return mo;
    }
    if (mode === 'sequential') {
      // ordered peers: same hue, perceptually-even light->dark (delegates to ramp's band
      // but reversed so index 0 is the LIGHTEST start of an ordered run).
      return CB.ramp(n, { mode: 'sequential' });
    }
    if (mode === 'categorical') {
      // many distinct peers: evenly-spaced hues across a WIDE arc (240°) with S/L pinned
      // near the accent so the family still reads as one palette, just broader.
      var cs = Math.max(0.45, Math.min(0.7, hsl[1]));
      var cl = Math.min(0.60, Math.max(0.44, hsl[2]));
      var co = [];
      for (var ci = 0; ci < n; ci++) {
        var ch = ((baseH + 240 * i01(ci, n)) % 360 + 360) % 360;
        co.push('hsl(' + Math.round(ch) + ',' + Math.round(cs * 100) + '%,' + Math.round(cl * 100) + '%)');
      }
      return co;
    }

    // 'analogous' (default) — index 0 sits ON the accent hue (the PRIMARY series stays the
    // accent). The whole set must read as ONE accent family, never a spectrum, so we keep the
    // hue arc TIGHT and WARM (never sliding into lime/green) and make LIGHTNESS the primary
    // separator instead of hue. At the Persimmon accent (~18°) even a 60° arc reached
    // yellow-green; capping at ~36° keeps the far end at amber/gold (still the orange family).
    //   n<=2 -> ~10°    n===3 -> ~22°    n>=4 -> ~36° total
    var SPAN = n <= 2 ? 10 : n === 3 ? 22 : 36;
    var s0 = Math.max(0.48, Math.min(0.72, hsl[1]));
    var l0 = Math.min(0.52, Math.max(0.44, hsl[2]));
    var out = [];
    for (var i = 0; i < n; i++) {
      var f = i / (n - 1); // 0 (accent) .. 1 (far end)
      var h = ((baseH + SPAN * f) % 360 + 360) % 360;
      // gentle saturation taper so far peers settle toward the family rather than a pure hue.
      var s = Math.max(0.42, s0 - 0.16 * f);
      // LIGHTNESS does the separating: a controlled deep->light sweep (capped at .64 so white
      // labels on the lightest segment still read). i=0 stays near the accent's own lightness.
      var l = Math.max(0.40, Math.min(0.64, l0 - 0.04 + 0.22 * f));
      out.push('hsl(' + Math.round(h) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%)');
    }
    return out;
  };
  // even fraction 0..1 across n items (n>1 guaranteed by callers).
  function i01(i, n) { return n <= 1 ? 0 : i / (n - 1); }

  /* CB.ramp(n) -> [color×n]: n shades of ONE accent hue, light -> dark, for
     SEQUENTIAL/ordered data (funnel steps, a stacked area of one metric across
     segments, a heatmap visualMap). categoricalColors is for PEER series (sweeps
     hue); ramp keeps the SAME hue and ramps lightness only, so an ordered series
     reads as "more vs less", not "different things". Re-reads the live accent so
     it follows dark re-theme. n<=1 returns just the accent. */
  function accentHsl() {
    var rgb = accentRgb();
    return rgbToHsl(rgb[0], rgb[1], rgb[2]);
  }
  /* CB.ramp(n, opts?) -> [color×n]: shades of ONE accent hue for SEQUENTIAL/ordered data.
     ramp is single-hue by nature, so the palette mode only nudges the lightness curve:
       default ('analogous'/absent) — EXACTLY today's dark->light band, byte-for-byte.
       'sequential' — perceptually-even light->dark (REVERSED: i=0 lightest start of a run).
       'mono'/'categorical' — fall back to the default band (ramp has no hue to sweep). */
  CB.ramp = function (n, opts) {
    n = n || 1;
    if (n <= 1) return [CB.theme.ACCENT || '#E8552D'];
    var hsl = accentHsl(), baseH = Math.round(hsl[0]), s = Math.round(Math.max(0.42, hsl[1]) * 100);
    var mode = resolvePaletteMode(opts);
    var out = [], i, l;
    if (mode === 'sequential') {
      // perceptually-even light -> dark for an ordered series read top-to-bottom: i=0 is
      // the LIGHTEST (low value) and later steps darken (high value). Slightly wider band
      // than the default so the low end reads as "near empty".
      var SL_LIGHT = 0.80, SL_DARK = 0.34;
      for (i = 0; i < n; i++) {
        l = SL_LIGHT + (SL_DARK - SL_LIGHT) * (i / (n - 1));
        out.push('hsl(' + baseH + ',' + s + '%,' + Math.round(l * 100) + '%)');
      }
      return out;
    }
    // default — ramp lightness across a bounded band (dark ~38% -> light ~72%) on the
    // accent's own hue+sat. i=0 is the DARKEST (heaviest emphasis — funnel top, peak
    // density); later steps lighten. Bounded so neither end blows out to black/white.
    var L_DARK = 0.38, L_LIGHT = 0.72;
    for (i = 0; i < n; i++) {
      l = L_DARK + (L_LIGHT - L_DARK) * (i / (n - 1));
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
  // F01b: disconnect a registry entry's ResizeObserver (CB.chart's narrow-width RO) so a
  // re-render or disposal doesn't leak observers across renders. No-op if the entry never
  // attached one (responsive:false, or no ResizeObserver support).
  function disconnectRO(entry) {
    var ro = entry && entry.ro;
    if (ro && ro.disconnect) { try { ro.disconnect(); } catch (e) {} }
  }

  function pruneCharts() {
    for (var i = charts.length - 1; i >= 0; i--) {
      var inst = charts[i] && charts[i].instance;
      var dom = inst && inst.getDom && inst.getDom();
      if (!dom || !document.contains(dom)) {
        disconnectRO(charts[i]);
        try { if (inst && inst.dispose) inst.dispose(); } catch (e) {}
        charts.splice(i, 1);
      }
    }
  }

  // CB.disposeIn(scope) — dispose+unregister any chart whose DOM lives inside `scope`,
  // called BEFORE a helper replaces scope.innerHTML so re-running CB.chart/kpis/hydrate
  // on the same target doesn't leak the previous echarts instance into charts[].
  // F01b: also disconnect the chart's narrow-width ResizeObserver so it doesn't leak.
  CB.disposeIn = function (scope) {
    if (!scope) return;
    for (var i = charts.length - 1; i >= 0; i--) {
      var inst = charts[i] && charts[i].instance;
      var dom = inst && inst.getDom && inst.getDom();
      if (dom && (scope === dom || (scope.contains && scope.contains(dom)))) {
        disconnectRO(charts[i]);
        try { if (inst && inst.dispose) inst.dispose(); } catch (e) {}
        charts.splice(i, 1);
      }
    }
  };

  // registerChart(instance, renderFn, ro?) — ro is CB.chart's narrow-width ResizeObserver,
  // tracked on the entry so disposeIn/pruneCharts can disconnect it (F01b).
  CB.registerChart = function (instance, renderFn, ro) {
    charts.push({ instance: instance, renderFn: renderFn || null, ro: ro || null });
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

  /* ---- icons ----
     Optional `scope` element scopes the redraw to one subtree (lucide.createIcons
     accepts { root }) so a helper re-rendering one section doesn't re-scan the whole
     document. Falls back to the global no-arg call when scope is omitted or unsupported. */
  CB.refreshIcons = function (scope) {
    if (!window.lucide) return;
    if (scope && scope.nodeType === 1) {
      try { window.lucide.createIcons({ root: scope }); return; } catch (e) { /* fall through to global */ }
    }
    window.lucide.createIcons();
  };

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
    var text = msg != null ? msg : t('noData');
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
    var title = opts.title != null ? opts.title : t('keyTakeaways', 'Key takeaways');
    var body;
    if (Array.isArray(pointsOrHtml)) {
      // tone-dotted bullets: a colored disc (reusing the tone dot vocabulary) + escaped text
      body = '<ul class="space-y-8">' + pointsOrHtml.map(function (p) {
        var dotTone = (p && typeof p === 'object' && p.tone) ? p.tone : 'neutral';
        var dot = TONE_DOT[dotTone] || 'bg-accent';
        // { html } is TRUSTED author HTML (renders verbatim so inline bold/links/<a>
        // survive); { text } (or a plain string) is ESCAPED. html wins when both present.
        var inner = (p && typeof p === 'object' && p.html != null)
          ? p.html
          : esc((p && typeof p === 'object') ? p.text : p);
        return '<li class="flex gap-8 text-body-14">' +
          '<span class="mt-6 w-8 h-8 rounded-full shrink-0 ' + dot + '"></span>' +
          '<span>' + inner + '</span></li>';
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
    // strip any grid-col classes a PRIOR render of this host applied, so a re-render with a
    // different item count doesn't stack two conflicting grid-cols utility sets on the host.
    var priorCols = Object.keys(COLS_MAP).reduce(function (acc, k) {
      COLS_MAP[k].split(' ').forEach(function (c) { acc[c] = 1; });
      return acc;
    }, {});
    host.className = host.className.split(/\s+/).filter(function (c) { return c && !priorCols[c]; }).join(' ');
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
      // F22 — a ZERO-PADDED numeric string ('007', '08') is an identifier-style value
      // (ticket #, code) where the leading zeros are meaningful; coercing to Number drops
      // them. Skip the coercion for /^0\d/ (no decimal point) so it renders verbatim.
      if (typeof val === 'string' && /^-?[\d.]+$/.test(val.trim()) && isFinite(Number(val)) && !/^0\d/.test(val.trim())) val = Number(val);

      var numHtml;
      if (typeof val === 'string') {
        // a STRING value renders VERBATIM (no CountUp) — for status/severity cards
        // ("Healthy", "P1") that aren't numbers. The number<->string fork only
        // changes the inner figure; delta/spark/card wrapper below are shared.
        var verbatim = esc(pre) + esc(val);
        // text-accent-text (F02): paints the hero figure in the accent-as-text token, which
        // falls back to --accent when a preset ships no darker AA-safe --accent-text.
        numHtml = it.unit
          ? '<span class="text-headline-36 font-bold nums leading-none whitespace-nowrap text-accent-text">' + verbatim +
            '<span class="text-title-20 text-secondary font-semibold">' + esc(it.unit) + '</span>' +
            (suf ? '<span class="text-title-20 text-secondary font-semibold">' + esc(suf) + '</span>' : '') + '</span>'
          : '<span class="text-headline-36 font-bold nums whitespace-nowrap text-accent-text">' + verbatim + esc(suf) + '</span>';
      } else {
        // decimals: explicit item/opts wins; else INFER from how the literal value is
        // written (8.4 -> 1 decimal) so a count-up keeps the authored precision and
        // renders '8.4' not '8.40'. Numbers can't carry trailing zeros, so the textual
        // form of the literal is the best available signal.
        var inferDec = function (v) {
          var s = String(v); var dot = s.indexOf('.');
          if (dot < 0) return 0;
          // CAP at 6: a binary float-error tail (0.1+0.2 -> '0.30000000000000004', 17 digits)
          // must NOT become data-decimals="17" and animate a 17-digit fraction. 6 is plenty
          // of authored precision; anything beyond is float noise, not intent.
          return Math.min(6, s.length - dot - 1);
        };
        var dec = it.decimals != null ? it.decimals : (opts.decimals != null ? opts.decimals : inferDec(val));
        var cuAttrs = 'data-countup="' + val + '"';
        if (!animate || it.decimals != null || opts.decimals != null || dec) cuAttrs += ' data-decimals="' + dec + '"';
        if (it.unit) {
          // long figures: keep number big, unit small, never wrap. A suffix (when
          // also set) trails the unit in the same small style so unit + suffix coexist.
          // text-accent-text (F02): accent-as-text on the figure; the unit/suffix sub-spans
          // keep text-secondary so only the number takes the accent.
          numHtml = '<span class="text-headline-36 font-bold nums leading-none whitespace-nowrap text-accent-text">' +
            esc(pre) + '<span ' + cuAttrs + '>0</span>' +
            '<span class="text-title-20 text-secondary font-semibold">' + esc(it.unit) + '</span>' +
            (suf ? '<span class="text-title-20 text-secondary font-semibold">' + esc(suf) + '</span>' : '') +
            '</span>';
        } else {
          // whitespace-nowrap so a prefix/suffix (e.g. "16 / 16", "₩4,120") never wraps mid-figure
          numHtml = '<span class="text-headline-36 font-bold nums whitespace-nowrap text-accent-text" ' + cuAttrs +
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

      // data-spark JSON sits in a SINGLE-quoted attribute, so esc() it: a value
      // containing ' (would close the attr) becomes &#39;, and " / < / > / & are
      // neutralized too. hydrate() HTML-decodes the attribute before JSON.parse, so the
      // payload round-trips intact.
      var spark = it.spark
        ? '<div class="h-32 mt-12" data-spark=\'' + esc(JSON.stringify(it.spark)) + '\'></div>'
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
  var SEV_RANK = { critical: 0, warning: 1, info: 2, neutral: 3 };
  // severity labels follow the report locale via the F42 i18n table; opts.kind:'insights'
  // swaps the incident-flavored severity ladder for a neutral business vocabulary. Built
  // live from t() so a window.REPORT_LOCALE.strings override (sevHigh/insightWatch/…)
  // propagates. opts.sevLabels overrides the badge set, opts.chipLabels the chip set (incl.
  // the 'all' key). A per-item f.label wins over all.
  function baseLabels(opts) {
    if (opts && opts.kind === 'insights') {
      return { critical: t('insightAction'), warning: t('insightWatch'), info: t('insightNote'), neutral: t('insightNote') };
    }
    return { critical: t('sevCritical'), warning: t('sevHigh'), info: t('sevMedium'), neutral: t('sevLow') };
  }
  function sevLabelSet(opts) {
    return Object.assign({}, baseLabels(opts), (opts && opts.sevLabels) || {});
  }
  function chipLabelSet(opts) {
    var base = Object.assign({ all: t('all') }, baseLabels(opts));
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
      // normalize to a known tone ONCE, up front, so the badge color, badge label, the
      // per-item filter value, and the chip set all agree for an unknown/custom tone.
      var sevTone = SEV_RANK[f.tone] != null ? f.tone : 'neutral';
      var t = tone(sevTone);
      // F04b — a 'success' tone (positive finding) has no severity rung, so it normalizes to
      // 'neutral' for FILTER purposes; but per the documented contract its badge reads 'Note'
      // (locale-aware via insightNote), not 'Low'. Keep its green tone visuals so a positive
      // finding still reads positive. An explicit per-item f.label still wins.
      var isSuccess = f.tone === 'success';
      if (isSuccess) t = tone('success');
      var badgeLabel = f.label || (isSuccess ? CB.t('insightNote') : sevLabels[sevTone]) || 'Note';
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
    // esc() the literal so a value containing " / < / > can't break out of the
    // double-quoted attribute (browser HTML-decodes &quot; back to " INSIDE the JS
    // single-quoted string before Alpine parses it — safe + correct). A trailing
    // backslash is neutralized by escaping the closing-quote sequence below.
    var sqChip = function (s) { return esc("'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"); };
    var chipDefs = '[' + chips.map(function (tn) {
      // an explicit chipLabels override wins; else fall back to the SAME sevLabels map the
      // badges use so a sevLabels override propagates to the chips (no badge/chip desync);
      // finally the tone key itself.
      var label = chipLabels[tn] != null ? chipLabels[tn] : (sevLabels[tn] != null ? sevLabels[tn] : tn);
      return '{tone:' + sqChip(tn) + ',label:' + sqChip(label) + '}';
    }).join(',') + ']';

    var filterRow = withFilter
      // flex-wrap so a 5-10 chip row (PSP/status/region…) wraps at phone width instead
      // of running off the right edge and making the WHOLE page horizontally scroll.
      ? '<div class="flex flex-wrap gap-6 mb-12 text-caption-12">' +
        '<template x-for="c in ' + chipDefs + '" :key="c.tone">' +
        '<button @click="sev=c.tone" :aria-pressed="sev===c.tone" :class="sev===c.tone ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
        'class="px-10 py-4 rounded-small" x-text="c.label"></button></template></div>'
      : '';

    var inner = filterRow + '<ul class="space-y-8">' + lis + '</ul>';
    host.innerHTML = withFilter
      ? '<div x-data="{ sev:\'all\' }">' + inner + '</div>'
      : inner;

    // without Alpine the x-show/x-for filter never runs — but every finding <li>
    // renders WITHOUT x-cloak, so the full list stays readable (only the severity
    // chips are inert). Warn (once, only when chips were emitted) so the author can
    // load Alpine for live filtering — same pattern as cardGrid/chart.
    if (withFilter && !window.Alpine) console.warn('[cookiebite] COOKIEBITE.findings: Alpine.js is absent — severity filter chips are inert (the full findings list still renders). Load Alpine for live filtering.');

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
  // Timeline marker glyphs use Heroicons v2 (solid) inlined as SVG — a crisp, FILLED set
  // that reads better than a stroke icon inside a tinted disc, with no extra CDN dependency.
  // fill:currentColor so each glyph takes the disc's tone color; one per tone.
  var TONE_SVG = {
    info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.04-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/></svg>',
    success: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"/></svg>',
    warning: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/></svg>',
    critical: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"/></svg>',
    neutral: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>',
  };
  function toneSvg(toneName) { return TONE_SVG[toneName] || TONE_SVG.neutral; }

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
      var tColor = (toneName === 'neutral') ? cssColor('--c-secondary', '#52525B') : toneColor(toneName);
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
        // badge — a SOFT tone-tinted disc (Notion-style) with the icon in the strong tone
        // color, ring-punched off the page. color-mix on the live tone var -> dark-aware; on a
        // dark surface the tint lands dark and the tone-colored glyph still reads.
        '<span class="absolute left-0 top-2 w-28 h-28 rounded-full ring-4 ring-bg flex items-center justify-center" ' +
        'style="background:color-mix(in srgb,' + tColor + ' 16%, var(--c-surface));color:' + tColor + '">' +
        // a custom/kind icon stays Lucide; the default tone steps use the filled Heroicons glyph
        ((it.icon || KIND_DEFAULT_ICON[it.kind]) ? iconTag(icon, 'w-15 h-15') : toneSvg(toneName)) + '</span>' +
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
  // ELK is a far better graph-layout engine than the built-in dagre for anything with
  // cycles or several edges between the same nodes — it dramatically reduces the crossing
  // edges + colliding edge-labels that make dense state/flowcharts unreadable. Loaded
  // lazily and registered if it imports cleanly; we fall back to dagre silently otherwise.
  var MERMAID_ELK_URL = 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0.1.7/dist/mermaid-layout-elk.esm.min.mjs';

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
    // F14 — a LITERAL backslash-n inside a label renders verbatim; the obvious instinct
    // is that it's a line break. The two-char sequence \n has no other meaning in mermaid
    // source, so convert it to mermaid's <br/> line-break. (htmlLabels:true is on, so
    // <br/> works in flowchart/state node + edge labels and sequence notes.)
    if (typeof definition === 'string') definition = definition.replace(/\\n/g, '<br/>');
    host.setAttribute('role', 'img');
    if (opts.aria) host.setAttribute('aria-label', opts.aria);
    var loader = (window.__cbMermaid = window.__cbMermaid || import(MERMAID_URL).then(function (m) {
      var mermaid = m.default;
      // try to register the ELK layout engine; keep dagre if it can't load (offline, blocked CDN).
      return import(MERMAID_ELK_URL).then(function (elk) {
        try { mermaid.registerLayoutLoaders(elk.default); window.__cbMermaidElk = true; } catch (e) { /* dagre fallback */ }
        return mermaid;
      }).catch(function () { return mermaid; });
    }));

    function render(mermaid) {
      // Spacing + curve defaults that reduce overlap: roomier ranks/nodes, smooth edges,
      // HTML edge labels (so the label background actually paints over crossing edges),
      // and wrapping so long labels don't collide. ELK (when registered) routes far better.
      mermaid.initialize({
        startOnLoad: false, securityLevel: 'loose', theme: 'base', themeVariables: mermaidThemeVars(),
        // suppressErrorRendering stops Mermaid from appending its own raw "Syntax error" SVG to
        // document.body on a parse failure (it leaked to the page bottom outside any card) — we
        // contain the error inside the host instead (parse-first + the .catch below).
        suppressErrorRendering: true,
        layout: window.__cbMermaidElk ? 'elk' : 'dagre',
        elk: { mergeEdges: false, nodePlacementStrategy: 'BRANDES_KOEPF' },
        flowchart: { nodeSpacing: 55, rankSpacing: 70, curve: 'basis', htmlLabels: true, padding: 14, useMaxWidth: true, wrappingWidth: 220 },
        state: { nodeSpacing: 55, rankSpacing: 70, useMaxWidth: true },
        sequence: { useMaxWidth: true, wrap: true, boxMargin: 8 },
        er: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
      });
      var id = 'cbmmd' + (mmdSeq++);
      // parse FIRST so a syntax error (a reserved char like ';' in a label/Note is the common
      // one) is caught cleanly and shown IN the host, instead of leaving the card blank.
      return Promise.resolve(mermaid.parse ? mermaid.parse(definition) : true).then(function () {
        return mermaid.render(id, definition);
      }).then(function (res) {
        host.innerHTML = res.svg;
        // host scrolls horizontally as a FALLBACK so a very wide diagram is still fully
        // reachable when scaled-to-fit isn't enough.
        host.style.overflowX = 'auto';
        var svg = host.querySelector('svg');
        if (svg) {
          // Scale to a READABLE size: fill the container width (so a compact ELK/dagre
          // layout isn't a tiny unreadable thumbnail) but cap the width so a 3-node diagram
          // doesn't stretch comically across a wide column, and center it. A diagram whose
          // INTRINSIC width already exceeds the cap fills 100% and shrinks to fit; the host's
          // overflow-x scroll is the last resort for a genuinely huge one. height:auto keeps
          // the aspect ratio. (ELK's routing keeps labels uncollided at any scale, so unlike
          // the old dagre-only path, filling the width no longer means "huge colliding labels".)
          var intrinsic = parseFloat(svg.getAttribute('width')) || 0;
          var CAP = 760; // px — comfortable max for a section-level diagram
          svg.removeAttribute('width');
          svg.style.width = '100%';
          svg.style.height = 'auto';
          svg.style.display = 'block';
          svg.style.margin = '0 auto';
          // cap the upscale of a small diagram; a naturally-wide one fills 100% (then scrolls).
          svg.style.maxWidth = (intrinsic > CAP) ? '100%' : CAP + 'px';
          if (host.scrollWidth > host.clientWidth + 1) {
            host.classList.add('cb-mermaid-scroll');
            host.style.cursor = 'ew-resize';
          } else {
            host.classList.remove('cb-mermaid-scroll');
            host.style.cursor = '';
          }
        }
        if (res.bindFunctions) res.bindFunctions(host);
      }).catch(function (e) {
        // contain a parse/render failure IN the host (also covers the dark re-render path),
        // so the card shows a readable message instead of going blank with a stray body SVG.
        console.warn('[cookiebite] COOKIEBITE.mermaid failed', e);
        host.innerHTML = opts.onError || '<pre class="text-caption-12 text-critical p-12 rounded-small bg-disabled-bg overflow-auto whitespace-pre-wrap">' + esc(t('mermaidFail')) + '</pre>';
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
      else host.innerHTML = '<pre class="text-caption-12 text-critical p-12 rounded-small bg-disabled-bg overflow-auto">' + esc(t('mermaidFail')) + '</pre>';
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

    // empty: a quiet "no data" line instead of an empty Grid.js shell (header-only,
    // no rows). Grid.js refuses to render into a non-empty container, so this returns
    // null WITHOUT building a grid (mirrors funnel/heatmap returning null when empty).
    if (!(config.rows || []).length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null; }

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

    // pills inside Grid.js need their lucide icons drawn after render; any CB.cellSpark
    // data-spark cells get wired by CB.hydrate (guarded per-element so re-renders on
    // sort/page only wire the freshly-drawn cells).
    grid.config.store.subscribe(function () { CB.refreshIcons(); CB.hydrate(host); });

    // opt-in CSV export: Grid.js already holds the raw rows, so serialize columns +
    // config.rows to a CSV the reader can pull into a spreadsheet (interactions.md §13's
    // "always end an editable artifact with a way out"). A pill/status cell ({label,…})
    // serializes to its label; a quote/comma/newline is RFC-4180 quote-escaped.
    if (config.csv) {
      var headerNames = (config.columns || []).map(function (col) { return typeof col === 'string' ? col : (col.name || ''); });
      var csvCell = function (v) {
        if (v && typeof v === 'object' && v.label != null) v = v.label;
        // remember whether the ORIGINAL value was a real number so we never quote-prefix it
        var wasNumber = typeof v === 'number';
        var s = v == null ? '' : String(v);
        // F01d — CSV formula-injection guard: a cell that BEGINS with = + - @ (or a tab/CR,
        // which some apps treat as a cell-start) can be executed as a formula when opened in
        // Excel/Sheets. Prefix a single quote so the spreadsheet treats it as literal text.
        // Skip genuine numbers (typeof number) so '-5' / numeric values stay intact.
        if (!wasNumber && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      var toCsv = function () {
        var lines = [headerNames.map(csvCell).join(',')];
        rows.forEach(function (r) { lines.push((Array.isArray(r) ? r : [r]).map(csvCell).join(',')); });
        return lines.join('\r\n');
      };
      var bar = document.createElement('div');
      bar.className = 'flex justify-end mb-8';
      // F20 — the bar is a SIBLING in host.parentNode, not inside host.innerHTML, so a
      // re-render of the table leaves the OLD bar behind (duplicate Export-CSV rows pile
      // up). Give it a stable id and remove any prior one before inserting.
      if (host.id) {
        bar.id = host.id + '-csvbar';
        var prevBar = document.getElementById(bar.id);
        if (prevBar && prevBar.parentNode) prevBar.parentNode.removeChild(prevBar);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-caption-12 text-secondary hover:text-primary';
      btn.textContent = t('exportCsv');
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

  // all-zero/all-empty detection for the chart empty-state. Returns true ONLY when the
  // option carries inline series, EVERY series has a non-empty data array, and EVERY
  // datum across them is empty/zero. A datum can be a number, [x,y] pair, or {value}
  // object — we pull the magnitude out of each shape. Anything we can't read as a number
  // (a string category, a missing value) is treated as a real value so we DON'T blank a
  // legitimately-populated chart. Charts without inline series (dataset-driven, gauges)
  // return false and render normally.
  function chartSeriesAllZero(option) {
    if (!isPlainObject(option)) return false;
    var series = option.series;
    if (isPlainObject(series)) series = [series];
    if (!Array.isArray(series) || !series.length) return false;
    var datumZero = function (d) {
      if (d == null) return true;
      if (typeof d === 'number') return d === 0;
      if (Array.isArray(d)) { var v = d[d.length - 1]; return typeof v === 'number' ? v === 0 : false; }
      if (typeof d === 'object') return d.value == null || (typeof d.value === 'number' && d.value === 0) || (Array.isArray(d.value) && d.value.every(function (x) { return typeof x === 'number' ? x === 0 : false; }));
      return false; // a string/unknown datum is a real value
    };
    var sawData = false;
    for (var i = 0; i < series.length; i++) {
      var data = series[i] && series[i].data;
      if (!Array.isArray(data) || !data.length) return false; // a series with no inline data -> can't judge, render
      sawData = true;
      for (var j = 0; j < data.length; j++) { if (!datumZero(data[j])) return false; }
    }
    return sawData;
  }

  var chartSeq = 0;

  /* view-toggle labels: author overrides win, else locale default.
     Korean when REPORT_LOCALE.number starts with 'ko', English otherwise.
     Returns { table: show-table label, chart: show-chart label }. */
  function toggleLabels(cfg) {
    cfg = cfg || {};
    return {
      table: cfg.tableLabel != null ? cfg.tableLabel : t('viewTable'),
      chart: cfg.chartLabel != null ? cfg.chartLabel : t('viewChart'),
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

    // all-empty / all-zero series -> the SAME quiet placeholder a collection helper
    // shows, instead of a blank axis canvas the reader can't tell from a broken chart.
    // Only fires when EVERY series has data AND every datum is empty/zero (a chart with
    // any real value, or one driven by dataset/no inline series, renders normally).
    if (chartSeriesAllZero(config.option) && config.emptyOnZero !== false) {
      host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null;
    }

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
    // double-quoted x-text attribute and blank the label. esc() the literal so a label
    // containing " / < / > can't break out of the double-quoted attribute (the browser
    // HTML-decodes &quot; back to " inside the JS single-quoted string before Alpine
    // parses it — safe + correct). Backslashes are doubled so a trailing \ can't escape.
    var sqLabel = function (s) { return esc("'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"); };
    var toggleBtnInner = hasTable
      ? '<button @click="table=!table" :aria-pressed="table" data-cb-table-toggle="' + cid + '" ' +
        'class="text-caption-12 text-secondary hover:text-primary" x-text="table ? ' +
        sqLabel(tl.chart) + ' : ' + sqLabel(tl.table) + '"></button>'
      : '';
    // opt-in PNG export: a small button next to the view-toggle. cid is unique so it
    // wires to THIS chart's instance via CB.exportPNG (registered below).
    var pngLabel = t('savePng');
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

    // F05 — when Alpine is absent the x-show/x-cloak toggle never runs, so the
    // auto data-table stays display:none forever (a11y dead end). Wire a VANILLA
    // fallback that mirrors CB.dataTableToggle: a plain button flips inline display
    // on the chart wrapper and the table wrapper. (With Alpine present, Alpine owns
    // the x-show binding and this branch is skipped.)
    if (hasTable && !window.Alpine) {
      var vToggleBtn = host.querySelector('[data-cb-table-toggle="' + cid + '"]');
      // the chart wrapper is the [x-show="!table"] div; the table is [x-show="table"]
      var chartWrap = host.querySelector('[x-show="!table"]');
      var tableWrap = host.querySelector('[x-show="table"]');
      if (vToggleBtn && chartWrap && tableWrap) {
        // the table div carries x-cloak; the CSS rule [x-cloak]{display:none !important}
        // would beat our inline display when we try to SHOW it, so drop the attribute
        // now that a vanilla toggle owns its visibility.
        tableWrap.removeAttribute('x-cloak');
        chartWrap.style.display = '';
        tableWrap.style.display = 'none';
        var tlV = toggleLabels(config);
        vToggleBtn.textContent = tlV.table;
        vToggleBtn.setAttribute('aria-pressed', 'false');
        var showingTableV = false;
        vToggleBtn.addEventListener('click', function () {
          showingTableV = !showingTableV;
          chartWrap.style.display = showingTableV ? 'none' : '';
          tableWrap.style.display = showingTableV ? '' : 'none';
          vToggleBtn.textContent = showingTableV ? tlV.chart : tlV.table;
          vToggleBtn.setAttribute('aria-pressed', showingTableV ? 'true' : 'false');
        });
      }
    }

    var el = host.querySelector('#' + cid);
    var inst = window.echarts.init(el);
    // track the LATEST author-applied option so a dark re-theme re-merges THAT over
    // the freshly-read baseChart — not the original. A reader-filtered chart (series
    // swapped via chart.__cbUpdate) then keeps its filtered state across the toggle
    // instead of snapping back to the initial series.
    var lastOption = config.option || {};
    inst.setOption(themeZoom(deepMerge(CB.baseChart, lastOption)), true);
    // chart.__cbUpdate(option): apply a new author option AND remember it, so the
    // next dark re-theme preserves it. Use this instead of raw setOption for updates
    // that should survive a theme toggle (e.g. reader filters/zoom on the data).
    inst.__cbUpdate = function (opt, notMerge) {
      // MERGE the (often PARTIAL) update over the stored full option — so a caller can pass
      // just { series:[…] } (the CB.connectFilter / filter-chip pattern) and the axes / grid /
      // dataZoom persist, and the next dark re-theme still has the COMPLETE option. (Arrays
      // like series/dataZoom replace wholesale inside deepMerge, so swapping series data works.)
      lastOption = deepMerge(lastOption, opt || {});
      inst.setOption(themeZoom(deepMerge(CB.baseChart, lastOption)), notMerge !== false);
      return inst;
    };

    // F06 — theme the dataZoom SLIDER from the live tokens (baseChart can't: a slider lives in
    // the author's own dataZoom array, which REPLACES baseChart's on merge, so ECharts' default
    // blue slider showed through and stayed blue in dark). Fill only the colors the author left
    // unset, on every (re-)render, so it follows the dark toggle. inside-zoom needs no styling.
    function themeZoom(opt) {
      var dz = opt && opt.dataZoom; if (!dz) return opt;
      (Array.isArray(dz) ? dz : [dz]).forEach(function (z) {
        if (!z || z.type !== 'slider') return;
        if (z.fillerColor == null) z.fillerColor = accentRgba(0.15);
        if (z.borderColor == null) z.borderColor = CB.theme.C_LINE;
        if (z.handleStyle == null) z.handleStyle = { color: CB.theme.ACCENT, borderColor: CB.theme.ACCENT };
        if (z.moveHandleStyle == null) z.moveHandleStyle = { color: CB.theme.ACCENT };
        if (z.textStyle == null) z.textStyle = { color: CB.theme.C_SECONDARY };
        if (z.dataBackground == null) z.dataBackground = { lineStyle: { color: CB.theme.C_LINE }, areaStyle: { color: CB.theme.C_LINE } };
        if (z.selectedDataBackground == null) z.selectedDataBackground = { lineStyle: { color: CB.theme.ACCENT }, areaStyle: { color: accentRgba(0.25) } };
      });
      return opt;
    }

    // register for dark re-theme: re-merge the LAST author option over fresh baseChart
    var renderFn = config.render
      ? config.render
      : function (chart) { chart.setOption(themeZoom(deepMerge(CB.baseChart, lastOption)), true); };

    // F19 — narrow-width legibility. At phone widths a chart's axisName/grid eat the plot
    // area and a dual-axis chart's RIGHT axisName collides with the data. When the
    // container is < ~640px, apply a CONSERVATIVE overlay (a NON-merge setOption is never
    // used — this is a shallow merge so the author's series/data are untouched): shrink
    // axisName + axisLabel fonts a notch, tighten the grid, and blank the right yAxis name
    // on a dual-axis chart. Guarded so it only ever touches axis chrome, and only toggles
    // on an actual threshold CROSS (so a wide chart is never altered). opts.responsive:false
    // opts out. Skipped entirely when ResizeObserver is unavailable (older engines).
    var ro = null; // F01b: tracked on the registry entry so disposeIn/pruneCharts can disconnect it
    if (config.responsive !== false && typeof ResizeObserver === 'function') {
      var narrow = null; // null = unknown, then true/false; only re-apply on a change
      var applyNarrow = function (isNarrow) {
        // read the author's yAxis to detect a dual-axis (array of 2) chart
        var yAxis = lastOption && lastOption.yAxis;
        var dual = Array.isArray(yAxis) && yAxis.length > 1;
        var nameFs = isNarrow ? 10 : 12;
        var labelFs = isNarrow ? 10 : 12;
        // narrow tightens the grid; widening RESTORES the author/base grid (so a chart
        // that crossed below and back is unchanged from its original layout).
        var wideGrid = (lastOption && lastOption.grid) || (CB.baseChart && CB.baseChart.grid) || { left: 8, right: 16, top: 24, bottom: 8, containLabel: true };
        var overlay = {
          grid: isNarrow ? { left: 4, right: 8, top: 18, bottom: 4, containLabel: true } : wideGrid,
          xAxis: { nameTextStyle: { fontSize: nameFs }, axisLabel: { fontSize: labelFs } },
        };
        // yAxis overlay must MATCH the author's shape (single object vs 2-element array)
        // so the merge lands on the right axis. On a dual-axis narrow chart, drop the
        // RIGHT axis name (index 1) so it can't collide with the plotted data.
        if (dual) {
          overlay.yAxis = [
            { nameTextStyle: { fontSize: nameFs }, axisLabel: { fontSize: labelFs } },
            { name: isNarrow ? '' : (yAxis[1] && yAxis[1].name) || '', nameTextStyle: { fontSize: nameFs }, axisLabel: { fontSize: labelFs } },
          ];
        } else {
          overlay.yAxis = { nameTextStyle: { fontSize: nameFs }, axisLabel: { fontSize: labelFs } };
        }
        try { inst.setOption(overlay); } catch (e) {}
      };
      ro = new ResizeObserver(function (entries) {
        var w = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : el.clientWidth;
        if (!w) return; // 0-width (hidden tab) — don't judge
        var isNarrow = w < 640;
        if (isNarrow === narrow) return; // only re-apply on a threshold cross
        narrow = isNarrow;
        applyNarrow(isNarrow);
      });
      try { ro.observe(el); } catch (e) {}
    }

    // register AFTER the RO is built so the entry carries it (F01b: disposeIn can disconnect)
    CB.registerChart(inst, renderFn, ro);

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
    // a 0-valued TOP step makes every conversion % a divide-by-zero — we skip just those
    // %s (steps still render with their raw values), but warn so the author notices the
    // funnel can't compute conversion from a zero baseline.
    if (!top) console.warn('[cookiebite] COOKIEBITE.funnel: the top step value is 0 — conversion % is disabled (cannot divide by a zero baseline). Step values still render.');

    // option re-reads CB.ramp/CB.baseChart live so a dark toggle re-themes the ramp.
    function option() {
      var colors = CB.ramp(steps.length);
      // step-to-step % carries a 'vs prev' qualifier so it's not confused with the
      // OVERALL conversion shown in the subtitle below.
      var vsPrev = t('vsPrev');
      var accentOn = cssColor('--accent-on', '#fff');
      var darkInk = cssColor('--c-primary', '#18181B');
      // F13 — at narrow widths the inside label spills past the trapezoid (sliced by
      // the slanted edges onto white). Below ~420px shrink the label font and DROP the
      // '· N% vs prev' qualifier (it stays in the tooltip + data-table). Desktop unchanged.
      var narrow = (el.clientWidth || host.clientWidth || 600) < 420;
      var data = steps.map(function (s, i) {
        // step-to-step conversion vs the PREVIOUS step, shown on its OWN line (below the step
        // name) so a long label reads cleanly instead of a cramped one-liner.
        var prev = i === 0 ? null : (steps[i - 1].value || 0);
        var pct = prev ? Math.round((s.value / prev) * 1000) / 10 : null;
        // per-slice label ink by the FILL luminance: the ramp lightens toward the bottom, so
        // white-on-(light slice) fails. Pick dark ink once the fill is light enough.
        var ink = inkOn(colors[i], accentOn, darkInk);
        return { value: s.value, name: s.label, itemStyle: { color: colors[i] }, label: { color: ink },
          pctText: (!narrow && pct != null) ? (pct + '%' + vsPrev) : '' };
      });
      var overall = top ? Math.round((steps[steps.length - 1].value / top) * 1000) / 10 : null;
      return {
        textStyle: { fontFamily: CB.theme.FONT },
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        // overall conversion as a subtitle so the headline number is always visible
        title: overall != null ? {
          text: t('overall') + overall + '%',
          left: 'center', bottom: 0, textStyle: { color: CB.theme.C_SECONDARY, fontSize: 12, fontWeight: 'normal', fontFamily: CB.theme.FONT },
        } : undefined,
        series: [{
          type: 'funnel', top: 12, bottom: 28, left: '8%', right: '8%',
          minSize: '24%', sort: 'descending', gap: 2,
          // INSIDE labels never clip at narrow widths (the outside-label footgun). Two lines:
          // the step NAME (semibold), then the step-to-step % muted below it — the rich blocks
          // inherit the per-slice ink (label.color) so both lines stay readable on every slice.
          label: {
            show: true, position: 'inside', color: cssColor('--accent-on', '#fff'), fontFamily: CB.theme.FONT,
            formatter: function (p) {
              var pt = p.data && p.data.pctText;
              return pt ? ('{nm|' + p.name + '}\n{pc|' + pt + '}') : ('{nm|' + p.name + '}');
            },
            rich: {
              nm: { fontSize: narrow ? 12 : 14, fontWeight: 600, fontFamily: CB.theme.FONT, lineHeight: narrow ? 16 : 21 },
              pc: { fontSize: 11, opacity: 0.82, fontFamily: CB.theme.FONT, lineHeight: 15 },
            },
          },
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
      columns: [config.stepHeader || t('stepCol'), config.valueHeader || t('valueCol'), '%'],
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

  /* gaugeRing(config) -> the '<div class="flex flex-col items-center">…</div>' ring HTML
     (or '' when value/max is empty/invalid). Extracted from CB.gauge so CB.gaugeGrid can
     drop the SAME conic-gradient ring into each cell — pure CSS vars, so every cell is
     dark-aware with no JS re-theme. Output is byte-identical to the prior inline CB.gauge. */
  function gaugeRing(config) {
    var max = config.max != null ? config.max : 100;
    var raw = config.value;
    if (raw == null || !isFinite(Number(raw)) || !(max > 0)) return '';

    var value = Number(raw);
    var frac = Math.max(0, Math.min(1, value / max)); // clamp into 0..1
    var deg = Math.round(frac * 360);
    var fill = (config.tone && GAUGE_FILL[config.tone]) || 'var(--accent)';
    // the ring: a conic-gradient fill on a track, masked to a ring by an inner surface
    // disc. All colors are CSS vars -> follows dark re-theme with no JS registration.
    var size = config.size || 160;
    var thickness = config.thickness || 16;

    // center figure: value (+ unit). A %-style gauge shows the value as-authored.
    // opts.showMax appends a faint '/max' affordance so the reader sees the denominator
    // (18 /24, 67 /100) — off by default to preserve the existing bare-value rendering.
    var unit = config.unit != null ? config.unit : '';
    var maxAff = config.showMax
      ? '<span class="text-title-20 text-secondary font-semibold"> /' + esc(CB.nf.format(max)) + esc(unit) + '</span>'
      : '';
    var center = '<div class="absolute inset-0 flex flex-col items-center justify-center">' +
      '<span class="text-title-28 font-bold nums leading-none">' + esc(CB.nf.format(value)) + esc(unit) + maxAff + '</span>' +
      (config.sub ? '<span class="text-caption-12 text-secondary mt-2">' + esc(config.sub) + '</span>' : '') +
      '</div>';

    // optional target tick: a short radial mark at the target fraction, drawn as a
    // rotated thin bar pinned to the top of the ring.
    var tick = '';
    if (config.target != null && isFinite(Number(config.target)) && max > 0) {
      var tdeg = Math.round(Math.max(0, Math.min(1, Number(config.target) / max)) * 360);
      // a neat radial tick that sits WITHIN the ring band (was a 2px dark bar poking past both
      // edges, which read as a stray slash). 3px rounded, in --c-primary, spanning just the band.
      tick = '<div class="absolute left-1/2 top-0 origin-bottom" ' +
        'style="height:' + (size / 2) + 'px;transform:translateX(-50%) rotate(' + tdeg + 'deg);">' +
        '<span class="block rounded-full" style="width:3px;height:' + thickness + 'px;background:var(--c-primary);opacity:.75;"></span></div>';
    }

    var labelHtml = config.label
      ? '<p class="text-body-14 text-secondary mt-12 text-center">' + esc(config.label) + '</p>'
      : '';

    // role=img + aria-label so the ring is announced as a single value, not silent decoration
    var aria = config.ariaLabel || ((config.label ? config.label + ': ' : '') + CB.nf.format(value) + unit + (config.target != null ? ' (target ' + CB.nf.format(Number(config.target)) + unit + ')' : ''));

    return '<div class="flex flex-col items-center">' +
      '<div role="img" aria-label="' + esc(aria) + '" class="relative" style="width:' + size + 'px;height:' + size + 'px;">' +
      // track + conic fill
      '<div class="absolute inset-0 rounded-full" style="background:conic-gradient(' + fill + ' ' + deg + 'deg, var(--c-disabled-bg) ' + deg + 'deg);"></div>' +
      // inner disc punches the center out, leaving a ring of `thickness`
      '<div class="absolute rounded-full bg-surface" style="inset:' + thickness + 'px;"></div>' +
      tick + center +
      '</div>' + labelHtml +
      '</div>';
  }

  CB.gauge = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var max = config.max != null ? config.max : 100;
    var raw = config.value;

    // empty/invalid: a quiet "no data" line instead of an empty ring
    if (raw == null || !isFinite(Number(raw)) || !(max > 0)) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    host.innerHTML = gaugeRing(config);

    CB.refreshIcons();
  };

  /* ==========================================================================
     COOKIEBITE.gaugeGrid(target, items, opts?) — a responsive grid of conic-gradient
     gauge rings, one per metric, each vs ITS OWN target/max (SLA board, quota row).
     Reuses gaugeRing() per cell, so every ring is pure CSS vars -> dark-aware with no
     JS re-theme. cols auto-picks by item count like CB.kpis (4+ -> 1-2-4); opts.cols
     overrides. Each item: { label, value, max?, target?, tone?, unit? }. Empty -> a
     quiet "no data" line. Emits .cb-gaugegrid for the css agent to style.
       items: [{ label, value, max?, target?, tone?, unit? }]   opts: { cols? }
     ========================================================================== */
  CB.gaugeGrid = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    items = items || [];

    CB.disposeIn(host); // re-run on the same target: drop nothing chart-y, but stay consistent

    if (!items.length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    // explicit opts.cols wins; else auto-pick by item count (same map as CB.kpis)
    var colsKey = opts.cols && COLS_MAP[opts.cols] ? opts.cols : autoCols(items.length);

    var cells = items.map(function (it) {
      it = it || {};
      // per-cell: render the SHARED ring; an empty/invalid value degrades to a quiet line
      var ring = gaugeRing({
        value: it.value, max: it.max, target: it.target, tone: it.tone,
        unit: it.unit, label: it.label, sub: it.sub, showMax: it.showMax,
        size: it.size, thickness: it.thickness, ariaLabel: it.ariaLabel,
      });
      var inner = ring || ('<div class="text-center text-body-14 text-secondary py-24">' +
        esc(it.label ? it.label + ': ' : '') + esc(t('noData')) + '</div>');
      return '<div class="cb-gaugegrid-cell">' + inner + '</div>';
    }).join('');

    host.innerHTML = '<div class="cb-gaugegrid ' + COLS_MAP[colsKey] + '">' + cells + '</div>';
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

    // calendar RANGE. An explicit config.range (or from/to) is passed straight to the
    // calendar; otherwise default to the MONTH span the data actually covers (sorted, so
    // an unsorted data array can't reverse start>end and render nothing). A few weeks of
    // data should NOT draw a full Jan–Dec grid — so the auto-range is the min..max
    // 'YYYY-MM' the dates span, which ECharts expands to whole months.
    var range;
    if (config.range != null) {
      range = config.range;
    } else if (config.from != null || config.to != null) {
      range = [config.from, config.to];
    } else {
      // min/max from a SORTED copy of the dates (lexical sort works on YYYY-MM-DD), then
      // narrow to the month span so a short window doesn't draw the whole year.
      var sorted = data.map(function (d) { return d.date; }).sort();
      var lo = sorted[0], hi = sorted[sorted.length - 1];
      range = [lo.slice(0, 7), hi.slice(0, 7)];
    }
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
      columns: [config.dateHeader || t('dateCol'), config.valueHeader || t('valueCol')],
      rows: data.map(function (d) { return [d.date, CB.nf.format(d.value)]; }),
    });

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     SHARED — narrowObserver(el, onChange): the same ResizeObserver narrow-cross
     pattern CB.chart uses (F19), factored out for the heavy dedicated charts below
     (treemap depth-cap, sankey orient flip, gantt scroll). Fires onChange(isNarrow)
     ONLY on a threshold cross (never on every resize), no-ops at 0-width (hidden
     tab), and returns the observer so disposeIn/pruneCharts can disconnect it via
     the registry entry. Returns null when ResizeObserver is unavailable.
     ========================================================================== */
  function narrowObserver(el, onChange, threshold) {
    if (typeof ResizeObserver !== 'function') return null;
    var bp = threshold || 560, state = null; // null=unknown, then true/false
    var ro = new ResizeObserver(function (entries) {
      var w = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : el.clientWidth;
      if (!w) return; // 0-width (hidden tab) — don't judge
      var isNarrow = w < bp;
      if (isNarrow === state) return; // only re-apply on a threshold cross
      state = isNarrow;
      try { onChange(isNarrow); } catch (e) {}
    });
    try { ro.observe(el); } catch (e) {}
    return ro;
  }

  /* ==========================================================================
     C14 — COOKIEBITE.treemap(target, { nodes | tree, caption?, ariaLabel?, drilldown?, max? })
     Themed ECharts treemap for part-of-whole / hierarchy (cost by team→service,
     storage by bucket, traffic by source→page). STRICT single accent hue: every
     tile's color is value→lightness via CB.ramp (biggest = darkest, smallest =
     lightest) — never a rainbow. 2px --c-bg gutters between tiles; leaf labels
     auto-hide when the tile is too small (ECharts upperLabel/label sizing) so they
     never overprint; breadcrumb on drilldown; depth-capped to 1 level on narrow.
       nodes: [{ name, value, parent? }] (flat, parent refs by name) OR
       tree:  { name, value?, children:[…] } (nested) — pass either as `nodes`/`tree`.
       drilldown:true enables zoom-in (nodeClick) + breadcrumb; default static.
       max caps how many depth levels render (default 3; narrow forces 1).
     data-table = path (a › b › leaf) + value rows. Registers for dark re-theme.
     ========================================================================== */
  var treemapSeq = 0;

  // normalize flat [{name,value,parent}] OR nested {name,children} into ECharts
  // treemap `data` (array of {name,value,children}). Flat: build by parent-name.
  function treemapData(config) {
    // accept a NESTED object via `tree`, OR the same nested object mistakenly passed as
    // `nodes` (defensive: a non-array `nodes` must never throw .filter and blank the report).
    var tree = config.tree || (config.nodes && !Array.isArray(config.nodes) ? config.nodes : null);
    if (tree && tree.children) return tree.children.slice();
    if (tree) return [tree];
    var flat = (Array.isArray(config.nodes) ? config.nodes : []).filter(function (n) { return n && n.name; });
    // a flat node with `children` is already nested — pass through untouched.
    if (flat.length && flat[0].children) return flat;
    // build nodes keyed by ARRAY INDEX so two flat nodes sharing a name both survive.
    // parent is resolved by id (if present) else by name; a name map only assists that
    // lookup and warns on collision rather than silently overwriting.
    var nodes = flat.map(function (n) { return { name: n.name, value: n.value, children: [] }; });
    var byId = {}, byName = {}, roots = [];
    flat.forEach(function (n, i) {
      if (n.id != null) byId[n.id] = nodes[i];
      if (Object.prototype.hasOwnProperty.call(byName, n.name)) console.warn('[cookiebite] COOKIEBITE.treemap: duplicate node name "' + n.name + '" — parent-by-name is ambiguous; add an `id`/`parent` id to disambiguate.');
      else byName[n.name] = nodes[i];
    });
    flat.forEach(function (n, i) {
      var node = nodes[i];
      var parent = (n.parent != null && byId[n.parent]) || (n.parent != null && byName[n.parent]) || null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    });
    // drop empty children arrays so leaves are clean leaves (value-colored); and DROP a
    // branch node's own value so ECharts sums it from the children — otherwise a parent
    // authored with value:0 (or a wrong total) renders as a 0-size tile and the whole
    // branch disappears (a common footgun: a parent that only groups its children).
    (function strip(arr) {
      arr.forEach(function (n) {
        if (n.children && n.children.length) { delete n.value; strip(n.children); }
        else delete n.children;
      });
    })(roots);
    return roots;
  }

  // flatten the tree into [path[], value] leaf rows for the data-table (deepest
  // nodes only — the path column shows a › b › leaf so the hierarchy is legible).
  function treemapRows(data) {
    var out = [];
    (function walk(arr, trail) {
      arr.forEach(function (n) {
        var path = trail.concat(n.name);
        if (n.children && n.children.length) walk(n.children, path);
        else if (n.value != null) out.push([path.join(' › '), CB.nf.format(n.value)]);
      });
    })(data, []);
    return out;
  }

  CB.treemap = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.treemap needs echarts.'); return null; }
    config = config || {};
    var data = treemapData(config);
    var aria = config.ariaLabel || 'treemap';
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.treemap: pass ariaLabel describing the hierarchy — it becomes the screen-reader label and the data-table caption.');

    CB.disposeIn(host);

    if (!data.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null; }

    var height = config.height || 360;
    var cid = 'cbTree' + (++treemapSeq);
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

    // value→lightness ramp: collect every leaf+branch value, map the LARGEST to the
    // darkest accent shade. We bucket values across the ramp so big tiles read heavy.
    function colorMap() {
      var vals = [];
      (function collect(arr) {
        arr.forEach(function (n) {
          if (n.value != null) vals.push(n.value);
          if (n.children) collect(n.children);
        });
      })(data);
      var max = vals.reduce(function (m, v) { return Math.max(m, v); }, 0) || 1;
      var steps = CB.ramp(7); // dark→light band; index 0 darkest
      return function (v) {
        // bigger value -> lower index -> darker shade (invert the 0..1 fraction)
        var f = max > 0 ? (v || 0) / max : 0;
        var idx = Math.round((1 - f) * (steps.length - 1));
        return steps[Math.max(0, Math.min(steps.length - 1, idx))];
      };
    }

    // recursively stamp itemStyle.color (value→lightness) so EVERY tile is one hue.
    function paint(arr, pick) {
      return arr.map(function (n) {
        var node = { name: n.name, value: n.value };
        if (n.value != null) node.itemStyle = { color: pick(n.value) };
        if (n.children && n.children.length) node.children = paint(n.children, pick);
        return node;
      });
    }

    // depth cap: 1 on narrow (drilldown to explore), config.max (default 3) on wide.
    var maxDepth = 3;
    function option(narrow) {
      var pick = colorMap();
      var depth = narrow ? 1 : (config.max != null ? config.max : maxDepth);
      var gutter = cssColor('--c-bg', '#FFFFFF');
      return {
        textStyle: { fontFamily: CB.theme.FONT },
        tooltip: {
          formatter: function (p) { return p.name + ': ' + CB.nf.format(p.value); },
        },
        series: [{
          type: 'treemap',
          roam: false,
          // drilldown: nodeClick zooms; static treemaps disable it. breadcrumb only
          // shows when drilldown is on (otherwise it's dead chrome).
          nodeClick: config.drilldown ? 'zoomToNode' : false,
          breadcrumb: config.drilldown
            ? { show: true, height: 22, bottom: 0, itemStyle: { color: cssColor('--c-disabled-bg', '#F4F4F5'), borderColor: CB.theme.C_LINE, textStyle: { color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT } } }
            : { show: false },
          leafDepth: depth,
          // 2px --c-bg gutters between tiles (gapWidth) + same-color borders so tiles
          // read as cleanly separated cards, not a solid block.
          itemStyle: { gapWidth: 2, borderColor: gutter, borderWidth: 0 },
          // leaf labels auto-hide when the tile is too small (minHeight/minWidth via
          // ECharts label `overflow` + ensuring a too-small tile drops its label).
          label: {
            show: true, color: cssColor('--accent-on', '#fff'), fontFamily: CB.theme.FONT,
            overflow: 'truncate', ellipsis: '…',
            formatter: function (p) { return p.name; },
          },
          upperLabel: { show: depth > 1, height: 20, color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT },
          // per-level: parent levels get a faint gutter, leaves the value ramp. The
          // levels array keeps the 2px gutter consistent at every depth.
          levels: [
            { itemStyle: { gapWidth: 2, borderColor: gutter, borderWidth: 2 } },
            { itemStyle: { gapWidth: 2, borderColor: gutter, borderWidth: 2 } },
            { itemStyle: { gapWidth: 1, borderColor: gutter, borderWidth: 1 } },
          ],
          data: paint(data, pick),
        }],
      };
    }

    var curNarrow = el.clientWidth && el.clientWidth < 560;
    inst.setOption(option(curNarrow), true);
    // narrow: re-cap depth to 1 (explore via drilldown) on a threshold cross
    var ro = narrowObserver(el, function (isNarrow) {
      curNarrow = isNarrow;
      inst.setOption(option(isNarrow), true);
      inst.resize();
    });
    // register for dark re-theme (re-reads ramp/tokens live, preserves narrow state);
    // ro tracked on the entry so disposeIn/pruneCharts can disconnect it.
    CB.registerChart(inst, function (chart) { chart.setOption(option(curNarrow), true); }, ro);

    // data-table: path + value rows
    CB.dataTableToggle(el, {
      ariaLabel: aria,
      columns: [config.pathHeader || t('pathCol', 'Path'), config.valueHeader || t('valueCol')],
      rows: treemapRows(data),
    });

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     C15 — COOKIEBITE.sankey(target, { nodes, links, caption?, ariaLabel?, nodeAlign?, orient? })
     Themed ECharts sankey for flow (signup→activation→paid, traffic source→page→exit,
     budget allocation). Single-hue: links use accentRgba with a left→right ramp
     GRADIENT (source-tint → target-tint) so heavier flows read intense; nodes are slim
     --accent bars. Labels auto-position outside-edge (left for sources, right for sinks)
     and truncate-with-tooltip so they never overlap. On narrow, flips to vertical orient
     (orient:'vertical') so the columns stack instead of crushing.
       nodes: [{ name }]. links: [{ source, target, value }] (names reference nodes).
       nodeAlign: 'justify'|'left'|'right' (default 'justify'). orient override.
     data-table = source → target → value rows. Registers for dark re-theme.
     ========================================================================== */
  var sankeySeq = 0;

  CB.sankey = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.sankey needs echarts.'); return null; }
    config = config || {};
    var nodes = (config.nodes || []).filter(function (n) { return n && n.name; });
    var links = (config.links || []).filter(function (l) { return l && l.source != null && l.target != null && l.value != null; });
    var aria = config.ariaLabel || 'flow diagram';
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.sankey: pass ariaLabel describing the flow — it becomes the screen-reader label and the data-table caption.');

    CB.disposeIn(host);

    if (!nodes.length || !links.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null; }

    var height = config.height || 360;
    var cid = 'cbSankey' + (++sankeySeq);
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

    function option(narrow) {
      var orient = config.orient || (narrow ? 'vertical' : 'horizontal');
      var accent = CB.theme.ACCENT || '#E8552D';
      // single-hue link gradient: a left→right (source-tint → target-tint) ramp on the
      // accent so weight reads as intensity, not a different color. ECharts lineStyle
      // 'gradient' tints by the two endpoint node colors — here both are the accent,
      // so we shade via opacity (lighter source, denser target).
      return {
        textStyle: { fontFamily: CB.theme.FONT },
        tooltip: {
          trigger: 'item',
          formatter: function (p) {
            if (p.dataType === 'edge') return p.data.source + ' → ' + p.data.target + ': ' + CB.nf.format(p.data.value);
            return p.name;
          },
        },
        series: [{
          type: 'sankey', orient: orient,
          left: 8, right: 8, top: 12, bottom: 12,
          nodeAlign: config.nodeAlign || 'justify',
          nodeWidth: 12, nodeGap: 10,
          // slim --accent node bars
          itemStyle: { color: accent, borderColor: accent },
          // labels outside-edge + truncated-with-tooltip so long Korean labels never
          // overlap; vertical orient drops them to top/bottom.
          label: {
            color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT,
            position: orient === 'vertical' ? 'top' : 'right',
            overflow: 'truncate', width: orient === 'vertical' ? 64 : 110, ellipsis: '…',
          },
          // link gradient: source-tint → target-tint on ONE hue (opacity ramp).
          lineStyle: {
            color: 'gradient', opacity: 0.45,
            curveness: 0.5,
          },
          emphasis: { focus: 'adjacency', lineStyle: { opacity: 0.7 } },
          // tint each node so the gradient endpoints carry a source→target intensity
          data: nodes.map(function (n, i) {
            return { name: n.name, itemStyle: { color: accentRgba(0.55 + 0.45 * i01(i, nodes.length)) } };
          }),
          links: links.map(function (l) { return { source: l.source, target: l.target, value: l.value }; }),
        }],
      };
    }

    var curNarrow = el.clientWidth && el.clientWidth < 560;
    inst.setOption(option(curNarrow), true);
    var ro = narrowObserver(el, function (isNarrow) {
      curNarrow = isNarrow;
      inst.setOption(option(isNarrow), true);
      inst.resize();
    });
    CB.registerChart(inst, function (chart) { chart.setOption(option(curNarrow), true); }, ro);

    // data-table: source → target → value rows
    CB.dataTableToggle(el, {
      ariaLabel: aria,
      columns: [config.sourceHeader || t('sourceCol', 'Source'), config.targetHeader || t('targetCol', 'Target'), config.valueHeader || t('valueCol')],
      rows: links.map(function (l) { return [l.source, l.target, CB.nf.format(l.value)]; }),
    });

    CB.refreshIcons();
    return inst;
  };

  /* ==========================================================================
     C22 — COOKIEBITE.gantt(target, { tasks, today?, caption?, ariaLabel? })
     A custom-series Gantt: horizontal task bars on a date/time axis grouped by lane.
     Bars are --accent with a darker --accent-strong inner progress-fill portion and
     rounded caps; a thin --c-critical 'today' line is labelled at top; lane bands
     alternate --c-surface / --c-disabled-bg behind the rows. On narrow the date axis
     stays scrollable INSIDE the container (the chart canvas widens, the wrapper scrolls)
     so it never trips page horizontalOverflow.
       tasks: [{ label, start, end, lane?, progress?(0..1), tone? }] (start/end parse
       via Date). today: a date for the marker (default now). lane groups rows.
     data-table = task / start / end / % rows. Registers for dark re-theme.
     ========================================================================== */
  var ganttSeq = 0;

  CB.gantt = function (target, config) {
    var host = resolveTarget(target);
    if (!host || !window.echarts) { if (!window.echarts) console.warn('[cookiebite] COOKIEBITE.gantt needs echarts.'); return null; }
    config = config || {};
    var tasks = (config.tasks || []).filter(function (x) { return x && x.label && x.start != null && x.end != null; });
    var aria = config.ariaLabel || 'project schedule';
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.gantt: pass ariaLabel describing the schedule — it becomes the screen-reader label and the data-table caption.');

    CB.disposeIn(host);

    if (!tasks.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return null; }

    // lanes in first-seen order; each task gets a y-category index = its lane.
    var lanes = [];
    tasks.forEach(function (x) { var ln = x.lane || ''; if (lanes.indexOf(ln) < 0) lanes.push(ln); });
    var laneLabel = function (ln) { return ln || t('taskCol', 'Task'); };

    var rowH = config.rowHeight || 30;
    var chartH = Math.max(config.height || 0, lanes.length * rowH + 80);
    var cid = 'cbGantt' + (++ganttSeq);
    var captionText = config.captionHtml != null ? config.captionHtml : (config.caption != null ? esc(config.caption) : '');
    var caption = (config.captionHtml != null || config.caption != null)
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + captionText + '</p>'
      : '';

    // date axis scrollable INSIDE the container on narrow: the inner div carries a
    // min-width so the wrapper (overflow-x:auto) scrolls instead of the page. minPx is
    // a per-task width budget so a long schedule widens rather than crushes.
    var minPx = Math.max(480, tasks.length * 36);
    host.innerHTML = caption +
      '<div class="bg-surface border border-line-weak rounded-medium shadow-sm p-20">' +
      '<div style="overflow-x:auto">' +
      '<div id="' + cid + '" role="img" aria-label="' + esc(aria) + '" style="height:' + chartH + 'px;min-width:' + minPx + 'px"></div>' +
      '</div></div>';

    var el = host.querySelector('#' + cid);
    var inst = window.echarts.init(el);
    var toMs = function (v) { var d = new Date(v); return isFinite(d.getTime()) ? d.getTime() : null; };
    var today = config.today != null ? toMs(config.today) : Date.now();

    // custom renderItem: a rounded base bar (--accent) + an inner progress-fill
    // portion (--accent-strong) clipped to the bar height. api.value(0)=laneIndex,
    // (1)=startMs, (2)=endMs, (3)=progress.
    function renderItem(params, api) {
      var laneIndex = api.value(0);
      var start = api.coord([api.value(1), laneIndex]);
      var end = api.coord([api.value(2), laneIndex]);
      var h = api.size([0, 1])[1] * 0.55;
      var x = start[0], w = Math.max(2, end[0] - start[0]), y = start[1] - h / 2;
      var prog = Math.max(0, Math.min(1, api.value(3) || 0));
      var accent = CB.theme.ACCENT || '#E8552D';
      var strong = CB.theme.ACCENT_STRONG || accent;
      var children = [{
        type: 'rect',
        shape: { x: x, y: y, width: w, height: h, r: Math.min(6, h / 2) },
        style: { fill: accent },
      }];
      if (prog > 0) {
        children.push({
          type: 'rect',
          shape: { x: x, y: y, width: w * prog, height: h, r: Math.min(6, h / 2) },
          style: { fill: strong },
        });
      }
      return { type: 'group', children: children };
    }

    function option() {
      var data = tasks.map(function (x) {
        var li = lanes.indexOf(x.lane || '');
        return { value: [li, toMs(x.start), toMs(x.end), x.progress || 0], name: x.label };
      });
      // lane bands: alternating --c-surface / --c-disabled-bg horizontal stripes drawn
      // as a markArea behind the bars (one band per lane row).
      var bandA = cssColor('--c-surface', '#FFFFFF'), bandB = cssColor('--c-disabled-bg', '#F4F4F5');
      var bands = lanes.map(function (_, i) {
        return [{ yAxis: i - 0.5, itemStyle: { color: i % 2 ? bandB : bandA } }, { yAxis: i + 0.5 }];
      });
      return {
        textStyle: { fontFamily: CB.theme.FONT },
        tooltip: {
          formatter: function (p) {
            var v = p.value;
            var pct = Math.round((v[3] || 0) * 100);
            return p.name + '<br/>' + new Date(v[1]).toLocaleDateString() + ' → ' + new Date(v[2]).toLocaleDateString() + (pct ? '<br/>' + pct + '%' : '');
          },
        },
        grid: { left: 8, right: 16, top: 28, bottom: 16, containLabel: true },
        xAxis: {
          type: 'time',
          axisLine: { lineStyle: { color: CB.theme.C_LINE } }, axisTick: { show: false },
          axisLabel: { color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT, hideOverlap: true },
          splitLine: { lineStyle: { color: CB.theme.C_LINE } },
        },
        yAxis: {
          type: 'category', inverse: true,
          data: lanes.map(laneLabel),
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT },
          splitLine: { show: false },
        },
        series: [{
          type: 'custom', renderItem: renderItem,
          // encode keeps tooltip/axisPointer aligned to the x time range
          encode: { x: [1, 2], y: 0 },
          data: data,
          // lane bands behind + a thin --c-critical 'today' line labelled at top
          markArea: { silent: true, data: bands },
          markLine: today != null ? {
            silent: true, symbol: 'none',
            lineStyle: { color: cssColor('--c-critical', '#D7373F'), width: 1, type: 'solid' },
            label: { show: true, position: 'insideEndTop', color: cssColor('--c-critical', '#D7373F'), fontFamily: CB.theme.FONT, formatter: t('today', 'Today') },
            data: [{ xAxis: today }],
          } : undefined,
        }],
      };
    }

    inst.setOption(option(), true);
    CB.registerChart(inst, function (chart) { chart.setOption(option(), true); });

    // data-table: task / start / end / % rows
    CB.dataTableToggle(el, {
      ariaLabel: aria,
      columns: [config.taskHeader || t('taskCol', 'Task'), config.startHeader || t('startCol', 'Start'), config.endHeader || t('endCol', 'End'), '%'],
      rows: tasks.map(function (x) {
        return [x.label, String(x.start), String(x.end), Math.round((x.progress || 0) * 100) + '%'];
      }),
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
    var recLabel = t('recommended');

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
      // F12 — render the badge in a FIXED-HEIGHT zone present in EVERY column (empty
      // when not recommended) so the <h3>+<dl> below start at the same y across columns.
      // The recommended column no longer pushes its rows down ~1 line.
      var badge = '<div class="h-20 mb-4">' + (opt.recommended
        ? '<span class="text-caption-12 text-accent-strong font-semibold">' + esc(recLabel) + '</span>'
        : '') + '</div>';
      // one <dt>/<dd> per row, same order in every column so they line up
      var dl = rows.map(function (label, i) {
        var cell = values[i];
        var dd = (cell && typeof cell === 'object' && cell.label != null)
          ? CB.pill(cell.label, { tone: cell.tone, icon: cell.icon })
          : esc(cell == null ? '' : cell);
        return '<div><dt class="text-secondary">' + esc(label) + '</dt><dd>' + dd + '</dd></div>';
      }).join('');
      return '<div class="bg-surface border border-line-weak rounded-medium p-20' + ring + '">' +
        badge + '<h3 class="text-title-20 font-bold">' + esc(opt.name) + '</h3>' +
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

    // single-quoted JS literals inside the double-quoted Alpine attrs (mirrors CB.findings).
    // esc() the literal so a tag containing " / < / > / & can't break out of the
    // double-quoted attribute (browser HTML-decodes &quot; back to " INSIDE the JS
    // single-quoted string before Alpine parses it). Backslashes doubled first so a
    // trailing \ can't escape the closing quote.
    var sq = function (s) { return esc("'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"); };

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
    var allLabel = t('all');
    // F21 — :aria-pressed conveys selected state to AT (background color alone isn't
    // enough), matching the chart/table toggles. 'all' is pressed when no facet is active.
    var chips = '<button @click="active=[]" :aria-pressed="active.length===0" :class="active.length===0 ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
      'class="px-10 py-4 rounded-small">' + esc(allLabel) + '</button>' +
      allTags.map(function (tg) {
        return '<button @click="toggle(' + sq(tg) + ')" :aria-pressed="active.includes(' + sq(tg) + ')" :class="active.includes(' + sq(tg) + ') ? \'bg-accent text-accent-on\' : \'bg-disabled-bg text-secondary\'" ' +
          'class="px-10 py-4 rounded-small">' + esc(tg) + '</button>';
      }).join('');
    var chipRow = '<div class="flex flex-wrap gap-6 mb-12 text-caption-12">' + chips + '</div>';

    // live "showing N of M" count, recomputed by Alpine from the active facets.
    // SINGLE-quoted nested array literal (NOT JSON.stringify) — double quotes would
    // terminate the double-quoted x-text attr and blank the count (same footgun as findings).
    var ofWord = t('ofWord');
    var tagMatrix = '[' + items.map(function (it) {
      return '[' + (it.tags || []).map(sq).join(',') + ']';
    }).join(',') + ']';
    // F19 — without Alpine the x-text never runs and the count renders EMPTY. Seed the
    // element with a STATIC "M of M" fallback as real text content so it's never blank;
    // Alpine (when present) overwrites it live on the first tick.
    var staticCount = esc(items.length + (ofWord + items.length));
    var count = '<p class="text-caption-12 text-secondary mb-12" x-text="(active.length===0 ? ' + items.length + ' : ' +
      tagMatrix + '.filter(tags => active.every(t => tags.includes(t))).length) + ' + sq(ofWord + items.length) + '">' + staticCount + '</p>';

    var grid = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">' + cards + '</div>';
    host.innerHTML = caption +
      '<div x-data="{ active: [], toggle(t){ const i=this.active.indexOf(t); i<0 ? this.active.push(t) : this.active.splice(i,1); } }">' +
      chipRow + count + grid + '</div>';

    // F19 — chips are dead without Alpine; warn so the author loads it (the static count
    // fallback above still keeps the element from rendering blank).
    if (!window.Alpine) console.warn('[cookiebite] COOKIEBITE.cardGrid: Alpine.js is absent — facet chips are inert and the count is static. Load Alpine for live filtering.');

    CB.refreshIcons();
  };

  /* ==========================================================================
     F35 — COOKIEBITE.shapes: PURE ECharts-option BUILDERS. Each returns a plain
     option object the author still passes to CB.chart (so it stays fully overridable
     via deepMerge — NOT a closed {kind} enum). Every builder reads CB.baseChart tokens
     / CB.theme so it lands on-theme AND dark-aware once routed through CB.chart's
     register-for-re-theme path. Usage:
       CB.chart('#c', { ariaLabel:'…', option: CB.shapes.waterfall({...}), table:{…} });
     The author owns ariaLabel + the data-table (CB.chart builds both); shapes only
     shape the option.
     ========================================================================== */
  CB.shapes = {};

  // semantic negative color (read live so dark re-theme flips it). Falls back to the
  // critical token, then a safe red.
  function negColor() { return cssColor('--c-critical', '#D7373F'); }

  /* CB.shapes.waterfall({ categories, deltas, total? }) -> option
     The transparent-base stacking trick: a hidden 'base' bar lifts each visible bar to
     its running cumulative, so + deltas grow up from the prior total and − deltas drop
     down. Accent for +, the semantic critical/neutral for −. An optional final 'total'
     bar (total:true, or a label string) resets to 0 to show the end balance.
       categories: string[] (one per delta, plus the total bar if requested)
       deltas: number[] (signed; + up, − down)
       total: true | string — append a from-zero total bar (string overrides its label) */
  CB.shapes.waterfall = function (cfg) {
    cfg = cfg || {};
    var cats = (cfg.categories || []).slice();
    var deltas = (cfg.deltas || []).slice();
    var accent = CB.theme.ACCENT || '#E8552D';
    var neg = negColor();
    var base = [], vis = [], colors = [], run = 0;
    for (var i = 0; i < deltas.length; i++) {
      var d = deltas[i] || 0;
      base.push(d >= 0 ? run : run + d);   // bottom of the floating bar
      vis.push(Math.abs(d));
      colors.push(d >= 0 ? accent : neg);
      run += d;
    }
    var wantTotal = cfg.total === true || typeof cfg.total === 'string';
    if (wantTotal) {
      if (typeof cfg.total === 'string') cats = cats.concat(cfg.total);
      else if (cats.length === deltas.length) cats = cats.concat(t('total'));
      base.push(0); vis.push(run); colors.push(CB.theme.ACCENT_STRONG || accent);
    }
    return {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          // ps[0] is the transparent base; ps[1] the visible bar. Show the magnitude.
          var p = ps[ps.length - 1];
          return p.name + ': ' + CB.nf.format(p.value);
        },
      },
      xAxis: { type: 'category', data: cats },
      yAxis: { type: 'value' },
      series: [
        { name: 'base', type: 'bar', stack: 'wf', itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } }, data: base, silent: true, tooltip: { show: false } },
        { name: 'delta', type: 'bar', stack: 'wf', data: vis.map(function (v, k) { return { value: v, itemStyle: { color: colors[k] } }; }) },
      ],
    };
  };

  /* CB.shapes.bullet({ value, target, ranges?, label?, max? }) -> option
     A KPI-vs-target horizontal bullet: a thin accent value bar over graded neutral
     qualitative bands, with a target tick. ranges are cumulative band tops (e.g.
     [60,80,100]); the accent bar is `value`, the tick is `target`.
       value, target: numbers. ranges: number[] band tops (default [max]). label: y
       category name. max: axis top (default the largest of value/target/ranges). */
  CB.shapes.bullet = function (cfg) {
    cfg = cfg || {};
    var value = +cfg.value || 0, target = +cfg.target || 0;
    var ranges = (cfg.ranges && cfg.ranges.length) ? cfg.ranges.slice().sort(function (a, b) { return a - b; }) : null;
    var max = cfg.max != null ? cfg.max : Math.max(value, target, ranges ? ranges[ranges.length - 1] : 0) || 1;
    if (!ranges) ranges = [max];
    var label = cfg.label || '';
    var accent = CB.theme.ACCENT || '#E8552D';
    // qualitative bands: a faint accent ramp (light low zone -> slightly stronger high
    // zone), stacked to their cumulative tops so the value bar reads against on-theme zones.
    var prev = 0, bands = ranges.map(function (top, i) {
      var seg = Math.max(0, top - prev); prev = top;
      return { value: seg, itemStyle: { color: accentRgba(0.06 + 0.05 * i) } };
    });
    return {
      grid: { left: 8, right: 16, top: 12, bottom: 8, containLabel: true },
      tooltip: { trigger: 'item', formatter: function () { return (label ? label + ': ' : '') + CB.nf.format(value) + ' / ' + CB.nf.format(target); } },
      xAxis: { type: 'value', max: max },
      yAxis: { type: 'category', data: [label] },
      series: [].concat(
        bands.map(function (b) { return { type: 'bar', stack: 'bullet', barWidth: '60%', data: [b], silent: true, tooltip: { show: false } }; }),
        [{ // the value bar, drawn thinner ON TOP of the bands
          type: 'bar', barWidth: '24%', barGap: '-60%', z: 3,
          data: [{ value: value, itemStyle: { color: accent } }],
        },
        { // target tick: a markLine at x=target
          type: 'bar', barWidth: 0, data: [0], z: 4, silent: true, tooltip: { show: false },
          markLine: {
            symbol: 'none', label: { show: false },
            lineStyle: { color: cssColor('--c-primary', '#18181B'), width: 2, type: 'solid' },
            data: [{ xAxis: target }],
          },
        }]
      ),
    };
  };

  /* CB.shapes.sparkline({ data, area? }) -> option
     An axis-less single-series line for inline/table cells. No grid chrome, accent
     stroke, optional faint accent area fill. data: number[] (or [x,y] pairs). */
  CB.shapes.sparkline = function (cfg) {
    cfg = cfg || {};
    var data = cfg.data || [];
    var single = data.length <= 1;
    var series = {
      type: 'line', data: data, smooth: !single,
      symbol: single ? 'circle' : 'none', symbolSize: single ? 6 : 4, showSymbol: single,
      lineStyle: { width: 2, color: CB.theme.ACCENT },
      itemStyle: { color: CB.theme.ACCENT },
    };
    if (cfg.area !== false) series.areaStyle = { color: accentRgba(0.10) };
    return {
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: 'category', show: false, data: data.map(function (_, i) { return i; }) },
      yAxis: { type: 'value', show: false, scale: true },
      series: [series],
    };
  };

  /* CB.shapes.scatter({ points:[{x,y,size?,label?,group?}] }) -> option
     A scatter; becomes a BUBBLE chart when any point carries `size` (size -> symbolSize
     via a sqrt scale so AREA ~ value). points read on-theme accent by default.
     F04c — when any point carries a category key (`group`, or its aliases `tone`/`color`),
     points are split into one series PER category, each painted a distinct on-theme color via
     CB.categoricalColors, and a legend is emitted. With no category key the output is byte-for
     -byte the historical single-accent series. */
  CB.shapes.scatter = function (cfg) {
    cfg = cfg || {};
    var pts = cfg.points || [];
    var hasSize = pts.some(function (p) { return p && p.size != null; });
    var sizes = pts.map(function (p) { return +((p && p.size) || 0); });
    var maxSize = sizes.reduce(function (m, s) { return Math.max(m, s); }, 0) || 1;
    var accent = CB.theme.ACCENT || '#E8552D';
    var symbolSize = hasSize
      ? function (d) { return 8 + 36 * Math.sqrt((d[2] || 0) / maxSize); } // area-proportional
      : 12;
    var tooltip = {
      trigger: 'item',
      formatter: function (p) {
        var d = p.data || [];
        var nm = d[3] ? d[3] + '<br/>' : '';
        return nm + 'x: ' + CB.nf.format(d[0]) + ', y: ' + CB.nf.format(d[1]) + (hasSize ? ', ' + CB.nf.format(d[2]) : '');
      },
    };
    var datum = function (p) { return [(p && p.x), (p && p.y), (p && p.size != null ? p.size : 0), (p && p.label) || '']; };

    // categorical mode: a per-point group/tone/color splits points into colored series + legend
    var groupKey = function (p) { return p && (p.group != null ? p.group : (p.tone != null ? p.tone : (p.color != null ? p.color : null))); };
    var hasGroups = pts.some(function (p) { return groupKey(p) != null; });
    if (hasGroups) {
      var order = [];                 // category names in first-seen order (stable legend)
      var buckets = {};
      pts.forEach(function (p) {
        var g = groupKey(p);
        var key = g == null ? '' : String(g); // ungrouped points fall into one '' bucket
        if (!buckets[key]) { buckets[key] = []; order.push(key); }
        buckets[key].push(datum(p));
      });
      var colors = CB.categoricalColors(order.length || 1);
      return {
        tooltip: tooltip,
        legend: { data: order, textStyle: { color: CB.theme.C_SECONDARY }, top: 0 },
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: order.map(function (key, i) {
          var c = colors[i % colors.length];
          return {
            name: key, type: 'scatter', data: buckets[key], symbolSize: symbolSize,
            itemStyle: { color: c, borderColor: c, borderWidth: 1 },
          };
        }),
      };
    }

    // default (no groups): the historical single-accent series, unchanged
    return {
      tooltip: tooltip,
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      series: [{
        type: 'scatter',
        // [x, y, size, label] — size+label ride along for the tooltip/symbolSize fn
        data: pts.map(datum),
        symbolSize: symbolSize,
        itemStyle: { color: accentRgba(0.7), borderColor: accent, borderWidth: 1 },
      }],
    };
  };

  /* CB.shapes.radar({ indicators:[{name,max}], series:[{name,values}] }) -> option
     A radar/spider chart. indicators define the axes; each series is one polygon. Uses
     CB.categoricalColors for multi-series so they stay one accent family, not a rainbow. */
  CB.shapes.radar = function (cfg) {
    cfg = cfg || {};
    var indicators = cfg.indicators || [];
    var series = cfg.series || [];
    var colors = CB.categoricalColors(series.length || 1);
    return {
      tooltip: { trigger: 'item' },
      legend: series.length > 1 ? { data: series.map(function (s) { return s.name; }), textStyle: { color: CB.theme.C_SECONDARY } } : undefined,
      radar: {
        indicator: indicators.map(function (ind) { return { name: ind.name, max: ind.max }; }),
        axisName: { color: CB.theme.C_SECONDARY },
        splitLine: { lineStyle: { color: CB.theme.C_LINE } },
        axisLine: { lineStyle: { color: CB.theme.C_LINE } },
        splitArea: { areaStyle: { color: ['transparent', accentRgba(0.03)] } },
      },
      series: [{
        type: 'radar',
        data: series.map(function (s, i) {
          return {
            name: s.name, value: s.values,
            lineStyle: { color: colors[i] }, itemStyle: { color: colors[i] },
            areaStyle: { color: colors[i], opacity: series.length > 1 ? 0.12 : 0.18 },
          };
        }),
      }],
    };
  };

  /* ==========================================================================
     CHART-SHAPE additions (C01/C02/C03/C04/C12/C13/C24) — same contract as the
     shapes above: pure option builders the author passes to CB.chart, which owns
     dark re-theme + the data-table + aria. Colors are resolved at BUILD time via
     CB.theme / cssColor / CB.ramp / CB.categoricalColors / accentRgba — NEVER
     var(--*) on canvas — and because the result flows through CB.chart they
     re-resolve on a dark toggle. Horizontal + label-safe defaults so Korean
     labels never clip; one accent hue + neutral connectors, never a rainbow.
     ========================================================================== */

  // semantic tone token -> resolved color (read live so dark re-theme flips it).
  // 'neutral' has no semantic color; callers decide its fallback (usually --c-secondary).
  var SEMANTIC_TOKEN = {
    critical: '--c-critical', danger: '--c-critical',
    warning: '--c-cautionary', cautionary: '--c-cautionary',
    success: '--c-positive', positive: '--c-positive',
    info: '--c-informative', informative: '--c-informative',
  };
  function toneColor(tone, fallback) {
    var v = SEMANTIC_TOKEN[tone];
    return v ? cssColor(v, fallback || CB.theme.C_SECONDARY || '#52525B') : (fallback || CB.theme.C_SECONDARY || '#52525B');
  }

  /* C01 — CB.shapes.dumbbell({ rows:[{label,from,to}], series?, showDelta?, sortBy? }) -> option
     Horizontal dumbbell (connected-dot) chart for FROM→TO change per row. A neutral
     connector line (--c-line-weak) joins a HOLLOW from-dot (accentRgba(.12) fill,
     accentRgba(.55) stroke) to a SOLID to-dot (the accent). Never categorical — one
     accent hue carries the "now" state; the connector stays neutral so the eye reads
     direction, not category.
       rows: [{label, from, to}]. series: [fromName, toName] for the legend (default
         ['from','to']). showDelta: true -> a right-edge tabular-nums Δ label per row,
         toned via the semantic token ONLY when it crosses `threshold` (else
         --c-secondary). sortBy: 'delta' | 'to' | null — reorder rows (desc).
       threshold: number (default 0) — the sign/crossing line for the Δ tone.
     Table: pass { columns:[labelHdr, fromName, toName, 'Δ'], rows: rows.map(r=>[r.label,r.from,r.to,r.to-r.from]) }. */
  CB.shapes.dumbbell = function (cfg) {
    cfg = cfg || {};
    var rows = (cfg.rows || []).slice();
    var ser = cfg.series || ['from', 'to'];
    var thr = cfg.threshold != null ? +cfg.threshold : 0;
    if (cfg.sortBy === 'delta') rows.sort(function (a, b) { return ((b.to - b.from) - (a.to - a.from)); });
    else if (cfg.sortBy === 'to') rows.sort(function (a, b) { return (b.to - a.to); });
    var accent = CB.theme.ACCENT || '#E8552D';
    var connector = CB.theme.C_LINE || '#E4E4E7';
    var cats = rows.map(function (r) { return r.label; });
    // connector: a thin line series per row drawn as a 2-point custom — simplest is a
    // 'lines'-free approach using two bar-less scatter points joined by markLine. We
    // model each row as a horizontal line via a custom series of [from,to] on the row.
    return {
      legend: { data: ser, textStyle: { color: CB.theme.C_SECONDARY }, top: 0 },
      // extra right pad so the Δ label (position right of the to-dot) never clips.
      grid: { left: 8, right: cfg.showDelta ? 64 : 24, top: 28, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: function (p) {
          var r = rows[p.dataIndex == null ? p.data[1] : p.dataIndex] || rows[p.dataIndex];
          if (!r) return '';
          return r.label + '<br/>' + ser[0] + ': ' + CB.nf.format(r.from) + '<br/>' + ser[1] + ': ' + CB.nf.format(r.to) +
            '<br/>Δ ' + (r.to - r.from >= 0 ? '+' : '') + CB.nf.format(r.to - r.from);
        },
      },
      xAxis: { type: 'value', scale: true },
      yAxis: { type: 'category', data: cats, axisTick: { show: false } },
      series: [
        { // connectors — one custom-rendered line per row, neutral
          type: 'custom', silent: true, z: 1,
          renderItem: function (params, api) {
            var i = api.value(2);
            var p1 = api.coord([api.value(0), i]);
            var p2 = api.coord([api.value(1), i]);
            return { type: 'line', shape: { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }, style: { stroke: connector, lineWidth: 2 } };
          },
          // encode [from, to, rowIndex] per row
          data: rows.map(function (r, i) { return [r.from, r.to, i]; }),
          encode: { x: [0, 1], y: 2 },
        },
        { // FROM dot — hollow
          name: ser[0], type: 'scatter', symbolSize: 10, z: 2,
          itemStyle: { color: accentRgba(0.12), borderColor: accentRgba(0.55), borderWidth: 1.5 },
          data: rows.map(function (r, i) { return [r.from, i]; }),
        },
        { // TO dot — solid accent (+ optional Δ label hung off the to-dot)
          name: ser[1], type: 'scatter', symbolSize: 10, z: 3,
          itemStyle: { color: accent },
          label: cfg.showDelta ? {
            show: true, position: 'right', distance: 10,
            fontFamily: CB.theme.FONT, fontSize: 12, fontWeight: 600,
            formatter: function (p) { var d = rows[p.dataIndex].to - rows[p.dataIndex].from; return (d >= 0 ? '+' : '') + CB.nf.format(d); },
            // tone only when the delta CROSSES the threshold; else neutral secondary.
            color: function (p) {
              var r = rows[p.dataIndex], d = r.to - r.from;
              var crossed = (r.from - thr) * (r.to - thr) < 0 || (r.to === thr && r.from !== thr);
              if (!crossed) return CB.theme.C_SECONDARY;
              return d >= 0 ? toneColor('positive') : toneColor('critical');
            },
          } : { show: false },
          data: rows.map(function (r, i) { return [r.to, i]; }),
        },
      ],
    };
  };

  /* C02 — CB.shapes.stackedBar({ categories, series, mode?, horizontal?, peer? }) -> option
     Horizontal-default stacked bar. peer:false (default) -> CB.ramp(series.length):
     ORDERED tiers of one accent hue (low→high reads as "more vs less"). peer:true ->
     CB.categoricalColors(series.length): independent peers sweep the bounded accent arc.
     mode:'percent' normalizes each category to 100%. Inside % labels auto-hide when a
     segment's share < ~8% (avoids label collisions on thin slivers). 1px --c-bg gutters
     separate stacks; legend on.
       categories: string[]. series: [{name, data:number[]}] (data aligned to categories).
       mode: 'stack' (default) | 'percent'. horizontal: true (default). peer: false (default).
     Table: pass { columns:['', ...series names], rows: categories.map((c,i)=>[c, ...series.map(s=>s.data[i])]) }. */
  CB.shapes.stackedBar = function (cfg) {
    cfg = cfg || {};
    var cats = cfg.categories || [];
    var series = cfg.series || [];
    var horizontal = cfg.horizontal !== false;
    var percent = cfg.mode === 'percent';
    var colors = cfg.peer ? CB.categoricalColors(series.length || 1) : CB.ramp(series.length || 1);
    var gutter = cssColor('--c-bg', '#fff');
    // per-category totals for percent normalization + share-based label hiding.
    var totals = cats.map(function (_, i) {
      return series.reduce(function (sum, s) { return sum + (+(s.data[i] || 0)); }, 0) || 1;
    });
    var es = series.map(function (s, si) {
      return {
        name: s.name, type: 'bar', stack: 'sb',
        itemStyle: { color: colors[si], borderColor: gutter, borderWidth: 1 },
        data: s.data.map(function (v, i) {
          v = +(v || 0);
          return percent ? +(v / totals[i] * 100).toFixed(2) : v;
        }),
        label: {
          show: true, position: 'inside', fontFamily: CB.theme.FONT, fontSize: 11,
          color: cssColor('--accent-on', '#fff'),
          // hide the inside label when this segment's share < ~8% (too thin to fit).
          formatter: function (p) {
            var raw = +(s.data[p.dataIndex] || 0);
            var share = raw / totals[p.dataIndex];
            if (share < 0.08) return '';
            return percent ? Math.round(share * 100) + '%' : CB.nf.format(raw);
          },
        },
      };
    });
    var valAxis = { type: 'value', max: percent ? 100 : null, axisLabel: percent ? { formatter: '{value}%' } : {} };
    var catAxis = { type: 'category', data: cats, axisTick: { show: false } };
    return {
      legend: { data: series.map(function (s) { return s.name; }), textStyle: { color: CB.theme.C_SECONDARY }, top: 0 },
      grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          var head = (ps[0] && ps[0].axisValue) || '';
          var body = ps.map(function (p) {
            var raw = +(series[p.seriesIndex].data[p.dataIndex] || 0);
            return p.marker + p.seriesName + ': ' + CB.nf.format(raw) + (percent ? ' (' + Math.round(raw / totals[p.dataIndex] * 100) + '%)' : '');
          }).join('<br/>');
          return head + '<br/>' + body;
        },
      },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series: es,
    };
  };

  /* C03 — CB.shapes.histogram({ values, bins?, showMean? }) -> option
     Vertical frequency histogram. Auto-bins via Freedman–Diaconis (IQR-based bin
     WIDTH), falling back to Sturges' rule for small/degenerate n. Bars are the accent
     with 1px --c-bg separators and a faint accentRgba(.10) area echo behind them.
     showMean -> a dashed --c-secondary markLine at the mean (label position 'start' so
     it never clips). Bin labels are terse locale-formatted ranges.
       values: number[]. bins: 'auto' (default) | number (explicit bin count).
       showMean: true (default) — draw the mean markLine.
     Table: pass { columns:['bin','count'], rows: <built from the same binning> } — or
     simplest, the author tables the raw values; the chart's aria already states the shape. */
  CB.shapes.histogram = function (cfg) {
    cfg = cfg || {};
    var vals = (cfg.values || []).filter(function (v) { return typeof v === 'number' && isFinite(v); }).slice().sort(function (a, b) { return a - b; });
    var n = vals.length;
    var accent = CB.theme.ACCENT || '#E8552D';
    if (!n) return { xAxis: { type: 'category', data: [] }, yAxis: { type: 'value' }, series: [] };
    var min = vals[0], max = vals[n - 1], range = max - min;
    // bin count: explicit, else Freedman–Diaconis (fallback Sturges).
    var binCount;
    if (typeof cfg.bins === 'number' && cfg.bins > 0) {
      binCount = Math.round(cfg.bins);
    } else {
      var q = function (p) { var idx = (n - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx); return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo); };
      var iqr = q(0.75) - q(0.25);
      var fdWidth = iqr > 0 ? 2 * iqr / Math.cbrt(n) : 0;
      if (fdWidth > 0 && range > 0) binCount = Math.max(1, Math.min(60, Math.ceil(range / fdWidth)));
      else binCount = Math.max(1, Math.ceil(Math.log2(n) + 1)); // Sturges fallback
    }
    var width = range > 0 ? range / binCount : 1;
    var counts = new Array(binCount).fill(0), labels = [];
    for (var i = 0; i < n; i++) {
      var bi = range > 0 ? Math.min(binCount - 1, Math.floor((vals[i] - min) / width)) : 0;
      counts[bi]++;
    }
    for (var b = 0; b < binCount; b++) {
      var lo = min + b * width, hi = lo + width;
      labels.push(CB.nf.format(+lo.toFixed(2)) + '–' + CB.nf.format(+hi.toFixed(2)));
    }
    var mean = vals.reduce(function (s, v) { return s + v; }, 0) / n;
    var meanBin = range > 0 ? Math.min(binCount - 1, (mean - min) / width) : 0; // fractional x for the line
    var series = [{
      type: 'bar', barCategoryGap: '0%',
      itemStyle: { color: accent, borderColor: cssColor('--c-bg', '#fff'), borderWidth: 1 },
      data: counts,
      // faint area echo: a translucent fill behind the bars via a backing area series is
      // overkill; instead tint each bar's emphasis softly. The bars themselves carry the
      // accent; the echo is the subtle accentRgba background of the grid (markArea below).
      markArea: {
        silent: true,
        itemStyle: { color: accentRgba(0.10) },
        data: [[{ xAxis: 0 }, { xAxis: binCount - 1 }]],
      },
    }];
    if (cfg.showMean !== false) {
      series[0].markLine = {
        symbol: 'none', silent: true,
        lineStyle: { color: CB.theme.C_SECONDARY, type: 'dashed', width: 1 },
        label: { show: true, position: 'start', color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT, formatter: function () { return CB.t ? (CB.t('mean', 'mean') + ' ' + CB.nf.format(+mean.toFixed(2))) : ('mean ' + CB.nf.format(+mean.toFixed(2))); } },
        data: [{ xAxis: meanBin }],
      };
    }
    return {
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: function (ps) { var p = ps[0]; return p.axisValue + '<br/>' + CB.nf.format(p.value); } },
      xAxis: { type: 'category', data: labels, axisLabel: { color: CB.theme.C_SECONDARY, hideOverlap: true } },
      yAxis: { type: 'value' },
      series: series,
    };
  };

  /* C12 — CB.shapes.rangeDot({ rows:[{label,low,high,value,band?}], unit? }) -> option
     Horizontal min–max range with a current-value dot per row. Each row is a rounded
     accentRgba(.10) capsule track from low→high; an optional inner p25–p75 band (one
     CB.ramp step darker) sits inside; the current value is a solid accent dot. Single-hue
     ramp — never categorical.
       rows: [{label, low, high, value, band?:[q1,q3]}]. unit: string for tooltips.
     Table: pass { columns:[labelHdr,'low','high','value'], rows: rows.map(r=>[r.label,r.low,r.high,r.value]) }. */
  CB.shapes.rangeDot = function (cfg) {
    cfg = cfg || {};
    var rows = cfg.rows || [];
    var unit = cfg.unit || '';
    var accent = CB.theme.ACCENT || '#E8552D';
    var ramp = CB.ramp(3); // step 0 darkest .. used for the inner band tint
    var bandColor = ramp[1] || accent;
    var cats = rows.map(function (r) { return r.label; });
    return {
      grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: function (p) {
          var r = rows[typeof p.dataIndex === 'number' ? p.dataIndex : 0];
          if (!r) return '';
          var bandTxt = r.band ? '<br/>p25–p75: ' + CB.nf.format(r.band[0]) + '–' + CB.nf.format(r.band[1]) : '';
          return r.label + '<br/>' + CB.nf.format(r.low) + '–' + CB.nf.format(r.high) + unit + '<br/>● ' + CB.nf.format(r.value) + unit + bandTxt;
        },
      },
      xAxis: { type: 'value', scale: true },
      yAxis: { type: 'category', data: cats, axisTick: { show: false } },
      series: [
        { // min–max capsule track (rounded caps) — custom render per row
          type: 'custom', silent: true, z: 1,
          renderItem: function (params, api) {
            var i = api.value(0);
            var p1 = api.coord([api.value(1), i]);
            var p2 = api.coord([api.value(2), i]);
            var h = 12;
            return { type: 'rect', shape: { x: p1[0], y: p1[1] - h / 2, width: Math.max(1, p2[0] - p1[0]), height: h, r: h / 2 }, style: { fill: accentRgba(0.10) } };
          },
          data: rows.map(function (r, i) { return [i, r.low, r.high]; }),
          encode: { x: [1, 2], y: 0 },
        },
        { // optional inner p25–p75 band — one ramp step darker
          type: 'custom', silent: true, z: 2,
          renderItem: function (params, api) {
            var idx = api.value(0), r = rows[idx];
            if (!r || !r.band) return null;
            var p1 = api.coord([r.band[0], idx]);
            var p2 = api.coord([r.band[1], idx]);
            var h = 12;
            return { type: 'rect', shape: { x: p1[0], y: p1[1] - h / 2, width: Math.max(1, p2[0] - p1[0]), height: h, r: 3 }, style: { fill: bandColor, opacity: 0.45 } };
          },
          data: rows.map(function (r, i) { return [i]; }),
          encode: { x: [], y: 0 },
        },
        { // current value — solid accent dot
          type: 'scatter', symbolSize: 11, z: 3,
          itemStyle: { color: accent },
          data: rows.map(function (r, i) { return [r.value, i]; }),
        },
      ],
    };
  };

  /* C13 — CB.shapes.lollipop({ rows:[{label,value,tone?}], baseline?, sort?, horizontal? }) -> option
     Lollipop: a thin --c-line-weak stem to a ~10px end-dot (accent, or the row's tone
     token). Horizontal default; whitespace separates rows. An optional baseline turns it
     into a DEVIATION chart (stems start at baseline; dots above/below it). The value
     label is always present.
       rows: [{label, value, tone?}]. baseline: number — deviation origin (default 0 when
       baseline passed; otherwise stems start at the axis min). sort: 'desc'|'asc'|null.
       horizontal: true (default).
     Table: pass { columns:[labelHdr,'value'], rows: rows.map(r=>[r.label,r.value]) }. */
  CB.shapes.lollipop = function (cfg) {
    cfg = cfg || {};
    var rows = (cfg.rows || []).slice();
    if (cfg.sort === 'desc') rows.sort(function (a, b) { return b.value - a.value; });
    else if (cfg.sort === 'asc') rows.sort(function (a, b) { return a.value - b.value; });
    var horizontal = cfg.horizontal !== false;
    var accent = CB.theme.ACCENT || '#E8552D';
    var stemColor = CB.theme.C_LINE || '#E4E4E7';
    var hasBaseline = cfg.baseline != null;
    var baseline = hasBaseline ? +cfg.baseline : 0;
    var cats = rows.map(function (r) { return r.label; });
    var dotColor = function (r) { return r.tone ? toneColor(r.tone, accent) : accent; };
    var catAxis = { type: 'category', data: cats, axisTick: { show: false } };
    var valAxis = { type: 'value', scale: true };
    return {
      grid: { left: 8, right: 28, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: function (p) {
          var r = rows[typeof p.dataIndex === 'number' ? p.dataIndex : 0];
          return r ? r.label + ': ' + CB.nf.format(r.value) : '';
        },
      },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series: [
        { // stems — from baseline (or axis origin) to the value
          type: 'custom', silent: true, z: 1,
          renderItem: function (params, api) {
            var i = api.value(0), v = api.value(1);
            var from = horizontal ? api.coord([baseline, i]) : api.coord([i, baseline]);
            var to = horizontal ? api.coord([v, i]) : api.coord([i, v]);
            return { type: 'line', shape: { x1: from[0], y1: from[1], x2: to[0], y2: to[1] }, style: { stroke: stemColor, lineWidth: 2 } };
          },
          data: rows.map(function (r, i) { return [i, r.value]; }),
          encode: horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 },
        },
        { // end-dots + always-on value label
          type: 'scatter', symbolSize: 11, z: 2,
          itemStyle: { color: function (p) { return dotColor(rows[p.dataIndex]); } },
          label: {
            show: true, position: horizontal ? 'right' : 'top', distance: 8,
            color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT, fontSize: 12,
            formatter: function (p) { return CB.nf.format(rows[p.dataIndex].value); },
          },
          data: rows.map(function (r, i) { return horizontal ? [r.value, i] : [i, r.value]; }),
          markLine: hasBaseline ? {
            symbol: 'none', silent: true,
            lineStyle: { color: stemColor, type: 'dashed', width: 1 },
            data: [horizontal ? { xAxis: baseline } : { yAxis: baseline }],
          } : undefined,
        },
      ],
    };
  };

  /* C24 — CB.shapes.slope({ items:[{label,from,to}], left?, right?, mode?, highlight? }) -> option
     Two-axis slope / bump chart. Every item is a line from the LEFT axis value to the
     RIGHT axis value; most are muted (--c-line-weak), highlighted items are solid accent.
     End labels are tabular-nums with leader dots. mode:'rank' reorders/positions by rank
     (1 at top) instead of raw value — a bump chart.
       items: [{label, from, to}]. left/right: axis captions (default 'before'/'after').
       mode: 'value' (default) | 'rank'. highlight: [labels] — emphasize these items.
     Table: pass { columns:[labelHdr, leftCap, rightCap], rows: items.map(i=>[i.label,i.from,i.to]) }. */
  CB.shapes.slope = function (cfg) {
    cfg = cfg || {};
    var items = (cfg.items || []).slice();
    var leftCap = cfg.left || 'before';
    var rightCap = cfg.right || 'after';
    var isRank = cfg.mode === 'rank';
    var hi = {};
    (cfg.highlight || []).forEach(function (l) { hi[l] = true; });
    var accent = CB.theme.ACCENT || '#E8552D';
    var muted = CB.theme.C_LINE || '#E4E4E7';
    // for rank mode, convert raw values to positions (1 = best/top). Higher value = better
    // rank here; ECharts y is inverted below so rank 1 sits at the top.
    var yFrom, yTo;
    if (isRank) {
      var byFrom = items.slice().sort(function (a, b) { return b.from - a.from; });
      var byTo = items.slice().sort(function (a, b) { return b.to - a.to; });
      yFrom = {}; yTo = {};
      byFrom.forEach(function (it, i) { yFrom[it.label] = i + 1; });
      byTo.forEach(function (it, i) { yTo[it.label] = i + 1; });
    }
    var lineSeries = items.map(function (it) {
      var on = hi[it.label];
      var fy = isRank ? yFrom[it.label] : it.from;
      var ty = isRank ? yTo[it.label] : it.to;
      return {
        type: 'line', name: it.label, symbol: 'circle', symbolSize: on ? 7 : 5, z: on ? 3 : 1,
        lineStyle: { color: on ? accent : muted, width: on ? 2.5 : 1 },
        itemStyle: { color: on ? accent : muted },
        // end labels: left endpoint shows label+value on the left, right endpoint on the right.
        label: {
          show: true, fontFamily: CB.theme.FONT, fontSize: 12,
          color: on ? accent : CB.theme.C_SECONDARY, fontWeight: on ? 600 : 'normal',
          formatter: function (p) {
            if (p.dataIndex === 0) return it.label + '  ' + CB.nf.format(it.from);
            return CB.nf.format(it.to) + '  ' + it.label;
          },
          position: function (p) { return p.dataIndex === 0 ? 'left' : 'right'; },
        },
        labelLayout: { hideOverlap: true },
        data: [[0, fy], [1, ty]],
        emphasis: { focus: 'series' },
      };
    });
    return {
      // generous left/right pad for the leader-dot end labels.
      grid: { left: 90, right: 90, top: 24, bottom: 24, containLabel: false },
      tooltip: { trigger: 'item', formatter: function (p) { return p.seriesName + ': ' + (p.dataIndex === 0 ? '' : '') + CB.nf.format(p.data[1]); } },
      xAxis: {
        type: 'category', data: [leftCap, rightCap], boundaryGap: false,
        position: 'top', axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: CB.theme.C_SECONDARY, fontFamily: CB.theme.FONT, fontWeight: 600 },
      },
      // rank mode: invert so rank 1 (smallest position) sits at the TOP.
      yAxis: { type: 'value', show: false, inverse: isRank, scale: !isRank },
      series: lineSeries,
    };
  };

  /* ---- shared distribution math (boxplot/densityArea) ----------------------
     fiveNum(values) -> [min,q1,med,q3,max] via linear interpolation (same quantile
     rule the histogram uses). outliersOf(values, q1, q3) -> values beyond the 1.5·IQR
     fences. Both operate on a sorted COPY so the caller's array is never mutated. */
  function sortedNums(values) {
    return (values || []).filter(function (v) { return typeof v === 'number' && isFinite(v); }).slice().sort(function (a, b) { return a - b; });
  }
  function quantile(sorted, p) {
    var n = sorted.length; if (!n) return 0;
    var idx = (n - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }
  function fiveNum(values) {
    var s = sortedNums(values), n = s.length;
    if (!n) return [0, 0, 0, 0, 0];
    return [s[0], quantile(s, 0.25), quantile(s, 0.5), quantile(s, 0.75), s[n - 1]];
  }

  /* C25 — CB.shapes.boxplot({ groups, horizontal?, showOutliers? }) -> option
     One box per group from the five-number summary. Box fill accentRgba(.12); the box
     outline + median line are CB.theme.ACCENT (ECharts boxplot shares ONE itemStyle for
     box/median/whisker, so the median reads as the dominant accent stroke and the whiskers
     inherit the same hue at 1.5px). Outliers are small HOLLOW --c-secondary dots. Each
     group is { label, values:number[] } (the five-number summary
     is computed) OR { label, five:[min,q1,med,q3,max], outliers?:number[] } (precomputed).
     Horizontal is the DEFAULT when >4 groups OR any label is long (Korean-label-safe);
     pass horizontal:false to force vertical, horizontal:true to force horizontal.
       groups: [{label, values}] | [{label, five, outliers?}]. showOutliers: true (default).
     Table HINT: build rows from the five-number summary per group, e.g.
       { columns:[labelHdr,'min','q1','median','q3','max'],
         rows: groups.map(g => { var f = (g.five || CB.shapes.fiveNum(g.values)); return [g.label].concat(f.map(CB.nf.format)); }) }
     (CB.shapes.fiveNum is exposed for exactly this.) */
  CB.shapes.fiveNum = fiveNum;
  CB.shapes.boxplot = function (cfg) {
    cfg = cfg || {};
    var groups = (cfg.groups || []).slice();
    var accent = CB.theme.ACCENT || '#E8552D';
    var secondary = CB.theme.C_SECONDARY || '#52525B';
    // derive the five-number summary + outliers per group (precomputed `five` wins).
    var boxes = [], cats = [], outPts = [];
    groups.forEach(function (g, gi) {
      cats.push(g.label);
      var f, outs;
      if (g.five && g.five.length === 5) {
        f = g.five.slice();
        outs = g.outliers || [];
      } else {
        var s = sortedNums(g.values);
        f = fiveNum(s);
        // 1.5·IQR fence outliers; clamp whiskers to the non-outlier extent.
        var iqr = f[3] - f[1], loF = f[1] - 1.5 * iqr, hiF = f[3] + 1.5 * iqr;
        outs = [];
        var whiskLo = f[2], whiskHi = f[2];
        s.forEach(function (v) {
          if (v < loF || v > hiF) outs.push(v);
          else { if (v < whiskLo) whiskLo = v; if (v > whiskHi) whiskHi = v; }
        });
        f[0] = whiskLo; f[4] = whiskHi;
      }
      boxes.push(f);
      if (cfg.showOutliers !== false) outs.forEach(function (v) { outPts.push([gi, v]); });
    });
    // horizontal default: >4 groups OR a long label (Korean labels clip vertically).
    var longLabel = cats.some(function (c) { return c != null && String(c).length > 6; });
    var horizontal = cfg.horizontal != null ? !!cfg.horizontal : (groups.length > 4 || longLabel);
    var catAxis = { type: 'category', data: cats, axisTick: { show: false }, axisLabel: { color: secondary, fontFamily: CB.theme.FONT } };
    var valAxis = { type: 'value', scale: true, axisLabel: { color: secondary, fontFamily: CB.theme.FONT } };
    // ECharts boxplot scatter outliers need [groupIndex, value]; flip the pair when horizontal.
    var outData = outPts.map(function (p) { return horizontal ? [p[1], p[0]] : p; });
    return {
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'item',
        formatter: function (p) {
          if (p.seriesType === 'boxplot') {
            var d = p.data; // [idx, min, q1, med, q3, max]
            return cats[d[0]] + '<br/>' +
              'max ' + CB.nf.format(d[5]) + '<br/>q3 ' + CB.nf.format(d[4]) + '<br/>' +
              t('medianWord', 'median') + ' ' + CB.nf.format(d[3]) + '<br/>q1 ' + CB.nf.format(d[2]) +
              '<br/>min ' + CB.nf.format(d[1]);
          }
          var vi = horizontal ? p.value[0] : p.value[1];
          return CB.nf.format(vi);
        },
      },
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? catAxis : valAxis,
      series: [{
        type: 'boxplot',
        itemStyle: { color: accentRgba(0.12), borderColor: accent, borderWidth: 1.5 },
        // median line is drawn by ECharts using the box border color; force a solid accent
        // median via emphasis-independent boxStyle — borderColor already = accent.
        data: boxes.map(function (f, i) { return [i, f[0], f[1], f[2], f[3], f[4]]; }),
      }].concat(outData.length ? [{
        type: 'scatter', symbolSize: 6, symbol: 'circle',
        itemStyle: { color: 'transparent', borderColor: secondary, borderWidth: 1 },
        data: outData,
      }] : []),
    };
  };

  /* C26 — CB.shapes.densityArea({ values | groups, bandwidth?, ridgeline?, showMedian? }) -> option
     Kernel-density estimate. SINGLE distribution (values:number[]): one accent-stroke curve
     over an accentRgba(.12) fill, with a median tick. MULTIPLE groups (groups:[{label,values}])
     + ridgeline:true: a vertical stack of slightly-overlapping ridges, each a CB.ramp tone,
     baseline-labelled. Gaussian kernel; bandwidth 'auto' = Silverman's rule of thumb.
       values: number[] (single) OR groups: [{label, values}] (+ ridgeline:true to stack).
       bandwidth: 'auto' (default) | number. showMedian: true (default, single only).
     Table: pass your own raw values; the aria already states the shape. */
  function kde(sorted, bw, gridN) {
    var n = sorted.length; if (!n) return { xs: [], ys: [] };
    var min = sorted[0], max = sorted[n - 1], span = max - min || 1;
    var lo = min - span * 0.05, hi = max + span * 0.05;
    var xs = [], ys = [], i, g;
    for (g = 0; g < gridN; g++) {
      var x = lo + (hi - lo) * g / (gridN - 1), sum = 0;
      for (i = 0; i < n; i++) {
        var u = (x - sorted[i]) / bw;
        sum += Math.exp(-0.5 * u * u);
      }
      xs.push(x); ys.push(sum / (n * bw * Math.sqrt(2 * Math.PI)));
    }
    return { xs: xs, ys: ys };
  }
  function silverman(sorted) {
    var n = sorted.length; if (n < 2) return 1;
    var mean = sorted.reduce(function (s, v) { return s + v; }, 0) / n;
    var sd = Math.sqrt(sorted.reduce(function (s, v) { return s + (v - mean) * (v - mean); }, 0) / n);
    var iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
    var sigma = Math.min(sd, iqr / 1.349) || sd || 1;
    return 1.06 * sigma * Math.pow(n, -0.2) || 1;
  }
  CB.shapes.densityArea = function (cfg) {
    cfg = cfg || {};
    var accent = CB.theme.ACCENT || '#E8552D';
    var secondary = CB.theme.C_SECONDARY || '#52525B';
    var gridN = 64;
    var isRidge = cfg.ridgeline && cfg.groups && cfg.groups.length;
    if (isRidge) {
      // ridgeline: one ramp tone per group, stacked top→bottom with slight overlap.
      var groups = cfg.groups.slice();
      var tones = CB.ramp(groups.length);
      var curves = groups.map(function (grp) {
        var s = sortedNums(grp.values);
        var bw = typeof cfg.bandwidth === 'number' ? cfg.bandwidth : silverman(s);
        return { label: grp.label, k: kde(s, bw, gridN) };
      });
      // shared x-domain so the ridges line up; peak height per ridge normalized.
      var allX = curves.reduce(function (a, c) { return a.concat(c.k.xs); }, []);
      var xMin = Math.min.apply(null, allX), xMax = Math.max.apply(null, allX);
      var peak = curves.reduce(function (m, c) { return Math.max(m, Math.max.apply(null, c.k.ys.concat([0]))); }, 0) || 1;
      var lift = 0.7; // each ridge's baseline step; <1 makes them overlap.
      var series = curves.map(function (c, gi) {
        var base = (curves.length - 1 - gi) * lift; // first group on top
        var color = tones[gi] || accent;
        return {
          type: 'line', name: c.label, smooth: true, symbol: 'none', z: gi + 1,
          lineStyle: { color: color, width: 1.2 },
          areaStyle: { color: color, opacity: 0.65, origin: base },
          data: c.k.xs.map(function (x, i) { return [x, base + c.k.ys[i] / peak]; }),
        };
      });
      return {
        grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, formatter: function (ps) { return ps.length ? (CB.nf.format(+(+ps[0].axisValue).toFixed(2))) : ''; } },
        xAxis: { type: 'value', min: xMin, max: xMax, scale: true, axisLabel: { color: secondary, fontFamily: CB.theme.FONT } },
        yAxis: {
          type: 'value', min: 0, max: (curves.length - 1) * lift + 1.1,
          // baseline labels at each ridge origin (group names down the left margin).
          axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
          axisLabel: {
            color: secondary, fontFamily: CB.theme.FONT,
            formatter: function (v) {
              var gi = curves.length - 1 - Math.round(v / lift);
              return (Math.abs(v / lift - Math.round(v / lift)) < 0.01 && curves[gi]) ? curves[gi].label : '';
            },
          },
        },
        series: series,
      };
    }
    // single distribution: one accent curve over a faint fill + median tick.
    var s = sortedNums(cfg.values);
    var bw = typeof cfg.bandwidth === 'number' ? cfg.bandwidth : silverman(s);
    var k = kde(s, bw, gridN);
    var med = quantile(s, 0.5);
    var series = [{
      type: 'line', smooth: true, symbol: 'none',
      lineStyle: { color: accent, width: 2 },
      areaStyle: { color: accentRgba(0.12) },
      data: k.xs.map(function (x, i) { return [x, k.ys[i]]; }),
    }];
    if (cfg.showMedian !== false && s.length) {
      series[0].markLine = {
        symbol: 'none', silent: true,
        lineStyle: { color: secondary, type: 'dashed', width: 1 },
        label: { show: true, position: 'end', color: secondary, fontFamily: CB.theme.FONT, fontSize: 11, formatter: t('medianWord', 'median') },
        data: [{ xAxis: med }],
      };
    }
    return {
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, formatter: function (ps) { return ps.length ? CB.nf.format(+(+ps[0].axisValue).toFixed(2)) : ''; } },
      xAxis: { type: 'value', scale: true, axisLabel: { color: secondary, fontFamily: CB.theme.FONT } },
      yAxis: { type: 'value', show: false },
      series: series,
    };
  };

  /* C30 — CB.shapes.marimekko({ columns, legend?, narrow? }) -> option
     Marimekko / Mekko: stacked 100% columns whose WIDTHS encode each column's total weight.
     Within-column segments are CB.ramp tones (single hue, ordered); only the LARGEST block
     per column carries an inline % label; --c-bg gutters separate columns. On NARROW it
     falls back to a plain stacked 100% bar (equal-width categories) — flagged via the
     returned option's `__mekkoFallback` marker so CB.chart's narrow path can swap. Authors
     usually just pass narrow:true to force the fallback in a tight column.
       columns: [{label, weight, segments:[{name,value}]}]. legend: true (default).
     Table: pass { columns:['column','weight'].concat(segNames),
       rows: columns.map(c => [c.label, c.weight].concat(<segment values>)) }. */
  CB.shapes.marimekko = function (cfg) {
    cfg = cfg || {};
    var cols = (cfg.columns || []).slice();
    var secondary = CB.theme.C_SECONDARY || '#52525B';
    var gutter = cssColor('--c-bg', '#FFFFFF');
    // distinct segment names, in first-seen order, drive the ramp + legend.
    var segNames = [];
    cols.forEach(function (c) { (c.segments || []).forEach(function (s) { if (segNames.indexOf(s.name) < 0) segNames.push(s.name); }); });
    var tones = CB.ramp(segNames.length);
    var colorOf = {}; segNames.forEach(function (nm, i) { colorOf[nm] = tones[i] || tones[tones.length - 1]; });
    var totalWeight = cols.reduce(function (s, c) { return s + (c.weight || 0); }, 0) || 1;

    // NARROW fallback: plain stacked-100% bar (equal-width categories, ignore weight).
    if (cfg.narrow) {
      var fbSeries = segNames.map(function (nm) {
        return {
          type: 'bar', stack: 'pct', name: nm,
          itemStyle: { color: colorOf[nm], borderColor: gutter, borderWidth: 1 },
          data: cols.map(function (c) {
            var tot = (c.segments || []).reduce(function (s, x) { return s + (x.value || 0); }, 0) || 1;
            var seg = (c.segments || []).filter(function (x) { return x.name === nm; })[0];
            return seg ? Math.round(seg.value / tot * 1000) / 10 : 0;
          }),
        };
      });
      var fb = {
        __mekkoFallback: true,
        grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
        legend: cfg.legend === false ? { show: false } : { bottom: 0, textStyle: { color: secondary, fontFamily: CB.theme.FONT } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'category', data: cols.map(function (c) { return c.label; }), axisLabel: { color: secondary, fontFamily: CB.theme.FONT, interval: 0 } },
        yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', color: secondary, fontFamily: CB.theme.FONT } },
        series: fbSeries,
      };
      return fb;
    }

    // wide Mekko: custom render. x runs 0..1 (cumulative weight fraction); within each
    // column y stacks the segments 0..1 (share of the column total). The largest block
    // per column gets the only % label so the canvas never reads busy.
    var xCursor = 0, layout = [];
    cols.forEach(function (c) {
      var w = (c.weight || 0) / totalWeight;
      var x0 = xCursor; xCursor += w;
      var tot = (c.segments || []).reduce(function (s, x) { return s + (x.value || 0); }, 0) || 1;
      var yCursor = 0, segs = [], maxShare = 0;
      (c.segments || []).forEach(function (s) {
        var share = (s.value || 0) / tot, y0 = yCursor; yCursor += share;
        if (share > maxShare) maxShare = share;
        segs.push({ name: s.name, x0: x0, x1: x0 + w, y0: y0, y1: y0 + share, share: share, label: c.label });
      });
      segs.forEach(function (sg) { sg.isMax = sg.share === maxShare; });
      layout.push.apply(layout, segs);
    });
    return {
      grid: { left: 8, right: 16, top: 24, bottom: cfg.legend === false ? 24 : 36, containLabel: true },
      legend: cfg.legend === false ? { show: false } : {
        bottom: 0, data: segNames,
        textStyle: { color: secondary, fontFamily: CB.theme.FONT },
        // legend swatches need colors; emit a hidden carrier per name so ECharts colors them.
      },
      tooltip: {
        trigger: 'item',
        formatter: function (p) {
          var d = p.data; if (!d) return '';
          return d.label + '<br/>' + d.name + ': ' + Math.round(d.share * 1000) / 10 + '%';
        },
      },
      // axes hidden: the column label sits under each block; x is weight, y is share.
      xAxis: { type: 'value', min: 0, max: 1, show: false },
      yAxis: { type: 'value', min: 0, max: 1, show: false, inverse: true },
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var d = layout[params.dataIndex];
          var p0 = api.coord([d.x0, d.y0]);
          var p1 = api.coord([d.x1, d.y1]);
          var children = [{
            type: 'rect',
            shape: { x: Math.min(p0[0], p1[0]) + 1, y: Math.min(p0[1], p1[1]), width: Math.max(1, Math.abs(p1[0] - p0[0]) - 2), height: Math.abs(p1[1] - p0[1]) },
            style: { fill: colorOf[d.name] },
          }];
          // only the largest block per column shows an inline % label.
          if (d.isMax && Math.abs(p1[0] - p0[0]) > 28 && Math.abs(p1[1] - p0[1]) > 16) {
            children.push({
              type: 'text',
              style: {
                text: Math.round(d.share * 100) + '%',
                x: (p0[0] + p1[0]) / 2, y: (p0[1] + p1[1]) / 2,
                textAlign: 'center', textVerticalAlign: 'middle',
                fill: cssColor('--accent-on', '#fff'), fontFamily: CB.theme.FONT, fontSize: 12,
              },
            });
          }
          return { type: 'group', children: children };
        },
        data: layout,
      }, {
        // x-axis column labels (centered under each weighted column).
        type: 'custom',
        renderItem: function (params, api) {
          var c = cols[params.dataIndex]; if (!c) return null;
          var acc = 0; for (var i = 0; i < params.dataIndex; i++) acc += (cols[i].weight || 0) / totalWeight;
          var w = (c.weight || 0) / totalWeight;
          var mid = api.coord([acc + w / 2, 1]);
          return { type: 'text', style: { text: c.label, x: mid[0], y: mid[1] + 6, textAlign: 'center', textVerticalAlign: 'top', fill: secondary, fontFamily: CB.theme.FONT, fontSize: 12 } };
        },
        data: cols.map(function (c, i) { return i; }),
        silent: true,
      }].concat(cfg.legend === false ? [] : segNames.map(function (nm) {
        // hidden carrier line series ONLY so the legend renders a colored swatch per name.
        return { type: 'line', name: nm, data: [], itemStyle: { color: colorOf[nm] }, lineStyle: { color: colorOf[nm] } };
      })),
    };
  };

  /* ==========================================================================
     C04 — CB.threshold(option, { value, label, tone?, band? }) -> option
     A PURE option-merge TRANSFORMER (NOT a CB.shapes.* builder): take an author's
     ECharts option and return it with a themed reference markLine at `value` (label
     position 'start' so it never clips the right edge) and, when band:[lo,hi] is given,
     a tinted markArea between lo and hi. STACKABLE — call it twice to add two lines.
     Colors are resolved via cssColor / CB.theme at BUILD time (never var(--*) on canvas);
     because the result still flows through CB.chart, it re-resolves on a dark toggle.
       option: an author option (e.g. from CB.shapes.* or hand-rolled).
       value: number — where the line sits (on the value axis).
       label: string — shown in a tiny tone-tinted rounded chip at the axis edge.
       tone: 'neutral' (default) | 'critical'|'danger'|'warning'|'success'|'info'|… —
         neutral -> a dashed --c-line line; else the semantic token at FULL for the line
         and ~8% for the band.
       band: [lo, hi] — a tinted markArea (the same tone family).
       axis: 'x' | 'y' (default 'y' — a horizontal rule across a value-y chart; use 'x'
         for a vertical rule on a value-x / horizontal chart).
     Because it merges onto a single carrier series, the author still passes the result to
     CB.chart with their own table/ariaLabel. */
  CB.threshold = function (option, opts) {
    option = option || {};
    opts = opts || {};
    var tone = opts.tone || 'neutral';
    var neutral = tone === 'neutral';
    var axis = opts.axis === 'x' ? 'x' : 'y';
    var lineColor = neutral ? cssColor('--c-line', '#E4E4E7') : toneColor(tone);
    var chipBg = neutral ? cssColor('--c-disabled-bg', '#F4F4F5') : accentTone(tone, 0.14);
    var chipFg = neutral ? (CB.theme.C_SECONDARY || '#52525B') : toneColor(tone);
    // carrier series: a hidden, silent line series that hosts the markLine/markArea so we
    // never disturb the author's real series. Multiple calls each append their own carrier.
    option.series = (option.series || []).slice();
    var markLine = {
      symbol: 'none', silent: true,
      lineStyle: { color: lineColor, width: neutral ? 1 : 1.5, type: neutral ? 'dashed' : 'solid' },
      label: {
        show: opts.label != null, position: 'start',
        formatter: opts.label != null ? String(opts.label) : '',
        color: chipFg, backgroundColor: chipBg, fontFamily: CB.theme.FONT, fontSize: 11, fontWeight: 600,
        padding: [2, 6], borderRadius: 4,
      },
      data: [axis === 'y' ? { yAxis: opts.value } : { xAxis: opts.value }],
    };
    var carrier = { type: 'line', data: [], silent: true, markLine: markLine, tooltip: { show: false }, legendHoverLink: false };
    if (option.legend && option.legend.data) carrier.name = '__threshold__';
    if (opts.band && opts.band.length === 2) {
      var bandColor = neutral ? cssColor('--c-line', '#E4E4E7') : accentTone(tone, 0.08);
      carrier.markArea = {
        silent: true,
        itemStyle: { color: neutral ? accentTone(null, 0.06, cssColor('--c-line', '#E4E4E7')) : bandColor },
        data: [[
          axis === 'y' ? { yAxis: opts.band[0] } : { xAxis: opts.band[0] },
          axis === 'y' ? { yAxis: opts.band[1] } : { xAxis: opts.band[1] },
        ]],
      };
    }
    option.series.push(carrier);
    return option;
  };

  // tone-tinted rgba helper for C04 chips/bands: resolve the tone token and apply alpha.
  // (Distinct from accentRgba, which is accent-only.) tone null -> use `raw` as the base.
  function accentTone(tone, alpha, raw) {
    var hex = raw || (tone ? toneColor(tone) : CB.theme.ACCENT);
    var m;
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) {
      var h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + alpha + ')';
    }
    m = (hex || '').match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) return 'rgba(' + Math.round(+m[1]) + ',' + Math.round(+m[2]) + ',' + Math.round(+m[3]) + ',' + alpha + ')';
    return 'rgba(0,0,0,' + alpha + ')';
  }

  /* ==========================================================================
     F39 — COOKIEBITE.bigNumber(target, { value, label, delta?, caption?, spark? })
     ONE oversized hero number (CountUp), with an optional delta badge, sparkline, and
     a takeaway caption. Reuses the kpis internals (data-countup wiring via hydrate,
     CB.deltaBadge, data-spark). For the single most important figure in a report.
       value: number | numeric-string (CountUp) | non-numeric string (verbatim).
       label: small caption above. delta: { dir, tone, text } (-> CB.deltaBadge).
       caption: a takeaway line below. spark: number[] (-> a sparkline under the figure).
       prefix/suffix/unit/decimals mirror CB.kpis. align: 'center' (default) | 'left'.
     ========================================================================== */
  CB.bigNumber = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};

    CB.disposeIn(host); // re-run on the same target: drop a prior spark instance

    // empty/invalid value -> the shared quiet placeholder
    if (config.value == null || config.value === '') { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    var align = config.align === 'left' ? 'items-start text-left' : 'items-center text-center';
    var label = config.label ? '<p class="text-body-14 text-secondary">' + esc(config.label) + '</p>' : '';

    var pre = config.prefix != null ? config.prefix : '';
    var suf = config.suffix != null ? config.suffix : '';
    var val = config.value;
    // F22 — a ZERO-PADDED numeric string ('007', '08') keeps its leading zeros (they're
    // meaningful: ticket #, code), so skip the Number coercion for /^0\d/ (no decimal).
    if (typeof val === 'string' && /^-?[\d.]+$/.test(val.trim()) && isFinite(Number(val)) && !/^0\d/.test(val.trim())) val = Number(val);

    var unitSpan = config.unit ? '<span class="text-title-24 text-secondary font-semibold">' + esc(config.unit) + '</span>' : '';
    var numHtml;
    if (typeof val === 'string') {
      // text-accent-text (F02): the hero figure consumes the accent-as-text token (falls back
      // to --accent); unit/suffix sub-spans keep text-secondary so only the number is accented.
      numHtml = '<span class="text-headline-48 font-bold nums leading-none whitespace-nowrap text-accent-text">' + esc(pre) + esc(val) + unitSpan +
        (suf ? '<span class="text-title-24 text-secondary font-semibold">' + esc(suf) + '</span>' : '') + '</span>';
    } else {
      var inferDec = function (v) { var s = String(v); var dot = s.indexOf('.'); return dot < 0 ? 0 : s.length - dot - 1; };
      var dec = config.decimals != null ? config.decimals : inferDec(val);
      var cuAttrs = 'data-countup="' + val + '"' + (dec ? ' data-decimals="' + dec + '"' : '');
      numHtml = '<span class="text-headline-48 font-bold nums leading-none whitespace-nowrap text-accent-text">' + esc(pre) +
        '<span ' + cuAttrs + (suf && !config.unit ? ' data-suffix="' + esc(suf) + '"' : '') + '>0</span>' + unitSpan +
        (config.unit && suf ? '<span class="text-title-24 text-secondary font-semibold">' + esc(suf) + '</span>' : '') + '</span>';
    }

    var deltaHtml = config.delta
      ? CB.deltaBadge(config.delta.text, { dir: config.delta.dir, tone: config.delta.tone, className: 'mb-8' })
      : '';
    var spark = config.spark
      ? '<div class="h-40 mt-12 w-full max-w-[280px]" data-spark=\'' + esc(JSON.stringify(config.spark)) + '\'></div>'
      : '';
    var caption = config.caption
      ? '<p class="text-body-14 text-secondary mt-12 prose-measure">' + esc(config.caption) + '</p>'
      : '';

    host.innerHTML =
      '<div class="flex flex-col ' + align + '">' + label +
      '<div class="flex items-end gap-12 mt-4">' + numHtml + deltaHtml + '</div>' +
      spark + caption + '</div>';

    CB.refreshIcons();
    CB.hydrate(host);
  };

  /* ==========================================================================
     F39 — COOKIEBITE.steps(target, items[{label, status, detail?}], opts?)
     A connected progress stepper. status: 'done' | 'current' | 'pending', mapped
     through the tone contract (done->success, current->accent, pending->neutral).
     Horizontal on desktop, vertical (stacked) below sm. detail -> a small caption.
       opts.emptyText overrides the empty placeholder.
     ========================================================================== */
  var STEP_TONE = { done: 'success', current: 'info', pending: 'neutral' };

  CB.steps = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    items = items || [];
    opts = opts || {};

    if (!items.length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    var n = items.length;
    var nodes = items.map(function (it, i) {
      var status = it.status || 'pending';
      var toneName = STEP_TONE[status] || 'neutral';
      var dot = TONE_DOT[toneName] || TONE_DOT.neutral;
      // done -> check, current -> accent dot (filled), pending -> hollow.
      var icon = status === 'done' ? iconTag('check', 'w-14 h-14')
        : status === 'current' ? iconTag('circle-dot', 'w-14 h-14') : '';
      var ring = status === 'current' ? ' ring-4 ring-accent-weak' : '';
      // current is the EMPHASIS node -> accent fill (the project's one-accent thesis);
      // done -> the success tone dot; pending -> a hollow neutral chip.
      var badgeBg = status === 'pending' ? 'bg-disabled-bg border border-line-weak'
        : status === 'current' ? 'bg-accent' : dot;
      // F17: pick the glyph ink by the badge-fill luminance (white fails on a bright accent/
      // tone fill) so the check/dot always reads. Pending has no icon, so no ink needed.
      var iconInk = status === 'done' ? toneColor(toneName)
        : status === 'current' ? cssColor('--accent', '#FA4D02') : null;
      var iconStyle = iconInk ? ' style="color:' + inkOn(iconInk, '#fff', cssColor('--c-primary', '#18181B')) + '"' : '';
      var aria = status === 'done' ? t('stDone') : status === 'current' ? t('stCurrent') : t('stPending');
      // connector: a 2px rail to the NEXT node (hidden on the last). Horizontal on
      // sm+, the marker stacks above on mobile so it reads as a vertical list.
      var connector = i < n - 1
        ? '<span class="hidden sm:block absolute top-[13px] left-1/2 w-full h-2 ' + (status === 'done' ? dot : 'bg-line-weak') + '" style="z-index:0"></span>'
        : '';
      var detail = it.detail ? '<p class="text-caption-12 text-secondary mt-2">' + esc(it.detail) + '</p>' : '';
      return '<li class="relative flex sm:flex-col sm:items-center sm:text-center gap-12 sm:gap-8 flex-1 min-w-0">' +
        connector +
        '<span class="relative z-10 w-28 h-28 rounded-full shrink-0 ' + badgeBg + ring + ' flex items-center justify-center shadow-sm"' + iconStyle + '>' +
        icon + '<span class="sr-only">' + esc(aria) + '</span></span>' +
        '<div class="min-w-0"><p class="text-body-14 font-semibold ' + (status === 'pending' ? 'text-secondary' : '') + '">' + esc(it.label) + '</p>' + detail + '</div>' +
        '</li>';
    }).join('');

    host.innerHTML = '<ol class="flex flex-col sm:flex-row gap-16 sm:gap-8">' + nodes + '</ol>';
    CB.refreshIcons();
  };

  /* ==========================================================================
     F40 — COOKIEBITE.leaderboard(target, items[{label, value, deltaRank?, tone?}], opts?)
     Numbered rows with value-proportional accent inline bars, right-aligned
     tabular-nums values, and an optional rank-change indicator (deltaRank: +n moved
     up, −n moved down). Built-in empty-state.
       opts.format: (v) -> string for the value (default CB.nf.format).
       opts.max: bar denominator (default the largest value). opts.emptyText override.
     ========================================================================== */
  CB.leaderboard = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    items = items || [];
    opts = opts || {};

    if (!items.length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    var fmt = typeof opts.format === 'function' ? opts.format : function (v) { return typeof v === 'number' ? CB.nf.format(v) : v; };
    var max = opts.max != null ? opts.max : items.reduce(function (m, it) { var v = +it.value; return isFinite(v) ? Math.max(m, v) : m; }, 0) || 1;

    var rows = items.map(function (it, i) {
      var v = +it.value;
      var frac = isFinite(v) && max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
      var barColor = (it.tone && GAUGE_FILL[it.tone]) || 'var(--accent)';
      // rank-change indicator: +n up (positive tone), −n down (critical), 0/absent none
      var dr = it.deltaRank;
      var rankBadge = '';
      if (dr != null && dr !== 0 && isFinite(+dr)) {
        var up = +dr > 0;
        rankBadge = '<span class="inline-flex items-center gap-2 text-caption-12 font-semibold ' + (up ? 'text-positive' : 'text-critical') + '">' +
          iconTag(up ? 'arrow-up' : 'arrow-down', 'w-12 h-12') + Math.abs(+dr) + '</span>';
      } else if (dr === 0) {
        rankBadge = '<span class="text-caption-12 text-secondary">—</span>';
      }
      return '<li class="flex items-center gap-12 py-8">' +
        '<span class="w-20 text-right text-caption-12 font-semibold text-secondary nums shrink-0">' + (i + 1) + '</span>' +
        '<div class="min-w-0 flex-1">' +
        '<div class="flex items-baseline gap-8"><span class="text-body-14 font-medium truncate">' + esc(it.label) + '</span>' +
        (rankBadge ? '<span class="shrink-0">' + rankBadge + '</span>' : '') + '</div>' +
        // value-proportional accent bar under the label
        '<div class="mt-4 h-6 rounded-full bg-disabled-bg overflow-hidden"><div class="h-full rounded-full" style="width:' + (frac * 100).toFixed(1) + '%;background:' + barColor + ';"></div></div>' +
        '</div>' +
        '<span class="text-body-14 font-semibold nums tabular-nums text-right shrink-0">' + esc(fmt(it.value)) + '</span>' +
        '</li>';
    }).join('');

    host.innerHTML = '<ol class="divide-y divide-line-weak">' + rows + '</ol>';
    CB.refreshIcons();
  };

  /* ==========================================================================
     F40 — opt-in CB.table column cell formatters. Each returns a Grid.js formatter
     fn (a function(cell) -> gridjs.html(...)) you attach to a column's `formatter`:
       columns: [ 'Name',
                  { name:'Trend', formatter: CB.cellBar({ max: 100 }) },
                  { name:'Heat',  formatter: CB.cellHeat({ max: 100 }) },
                  { name:'7d',    formatter: CB.cellSpark() } ]
     They render value-proportional bars / accent-tint heat chips / inline sparklines.
     cellSpark emits a data-spark element (same axis-less accent spark as CB.kpis /
     CB.shapes.sparkline) that CB.table's post-render hydrate wires — CB.table calls
     CB.hydrate on every store update, so sparks survive sort/page re-renders.
     ========================================================================== */
  CB.cellBar = function (opts) {
    opts = opts || {};
    return function (cell) {
      var v = +cell;
      if (!isFinite(v)) return cell;
      var max = opts.max != null ? opts.max : 100;
      var frac = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
      var fmt = typeof opts.format === 'function' ? opts.format : function (x) { return CB.nf.format(x); };
      return window.gridjs.html(
        '<div class="flex items-center gap-8"><div class="flex-1 h-6 rounded-full bg-disabled-bg overflow-hidden min-w-[40px]">' +
        '<div class="h-full rounded-full" style="width:' + (frac * 100).toFixed(1) + '%;background:var(--accent);"></div></div>' +
        '<span class="nums tabular-nums text-caption-12 shrink-0">' + esc(fmt(v)) + '</span></div>'
      );
    };
  };

  CB.cellHeat = function (opts) {
    opts = opts || {};
    return function (cell) {
      var v = +cell;
      if (!isFinite(v)) return cell;
      var max = opts.max != null ? opts.max : 100;
      var frac = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
      var fmt = typeof opts.format === 'function' ? opts.format : function (x) { return CB.nf.format(x); };
      // accent-tint chip: opacity scales with magnitude (faint -> full accent). Emit a
      // color-mix on var(--accent) (NOT a baked accentRgba) so the chip re-tints for free on a
      // dark toggle — the Grid.js cell HTML is static once rendered and never re-themes via JS.
      var pct = Math.round((0.10 + 0.5 * frac) * 100);
      return window.gridjs.html(
        '<span class="inline-flex items-center justify-end px-8 py-2 rounded-xxs nums tabular-nums text-caption-12 font-medium" ' +
        'style="background:color-mix(in srgb, var(--accent) ' + pct + '%, transparent);">' + esc(fmt(v)) + '</span>'
      );
    };
  };

  CB.cellSpark = function (opts) {
    opts = opts || {};
    return function (cell) {
      // cell is expected to be a number[] (the series for this row). A non-array passes
      // through verbatim. The data-spark element is wired by CB.hydrate post-render.
      if (!Array.isArray(cell)) return cell;
      var w = opts.width || 80, h = opts.height || 24;
      return window.gridjs.html(
        '<div style="width:' + w + 'px;height:' + h + 'px;display:inline-block" data-spark=\'' + esc(JSON.stringify(cell)) + '\'></div>'
      );
    };
  };

  /* CB.cellMoney({ currency?, symbol?, decimals? }) -> function(cell) -> gridjs.html
     Renders a numeric cell as locale-grouped currency (symbol + thousands grouping),
     right-aligned with tabular-nums. The underlying NUMERIC cell is untouched, so the
     column still SORTS numerically (Grid.js sorts the raw data, not the rendered HTML).
       symbol   — currency glyph to prepend (default L.symbol, e.g. '$'/'₩').
       currency — ISO code; when set, Intl currency formatting drives both glyph + grouping
                  (overrides `symbol`). decimals defaults to 2 in this mode.
       decimals — fraction digits for the grouped number (default 0 in symbol mode). */
  CB.cellMoney = function (opts) {
    opts = opts || {};
    var useIntl = opts.currency != null;
    var fmt;
    if (useIntl) {
      var dec = opts.decimals != null ? opts.decimals : 2;
      try {
        var cf = new Intl.NumberFormat(L.number, { style: 'currency', currency: opts.currency, minimumFractionDigits: dec, maximumFractionDigits: dec });
        fmt = function (v) { return cf.format(v); };
      } catch (e) { useIntl = false; }
    }
    if (!useIntl) {
      var sym = opts.symbol != null ? opts.symbol : L.symbol;
      var nfm;
      if (opts.decimals != null) {
        try { nfm = new Intl.NumberFormat(L.number, { minimumFractionDigits: opts.decimals, maximumFractionDigits: opts.decimals }); }
        catch (e2) { nfm = CB.nf; }
      } else { nfm = CB.nf; }
      fmt = function (v) { return sym + nfm.format(v); };
    }
    return function (cell) {
      var v = +cell;
      if (cell == null || cell === '' || !isFinite(v)) return cell;
      // numeric cell stays numeric (Grid.js sorts the raw data); only the RENDER is money.
      return window.gridjs.html(
        '<span class="nums tabular-nums" style="display:block;text-align:right;">' + esc(fmt(v)) + '</span>'
      );
    };
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

    CB.disposeIn(host); // re-run on the same target: dispose charts from the prior panels before innerHTML wipes them

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

  /* ==========================================================================
     COOKIEBITE.connectFilter(buttonsSelector, onChange, opts?) — wire a chip row of
     filter buttons (real <button>s carrying a data-value inside buttonsSelector) to
     onChange(value, btn). Manages active state (aria-pressed + an accent 'is-active'
     class), default-selects the first chip (or opts.initial), and fires onChange on
     click. This removes the window-global footgun: the author captures their CB.chart
     instance(s) in a CLOSURE and calls inst.__cbUpdate(...) inside onChange — no globals.
     Keyboard-accessible because the chips are native buttons. Returns { select(value) }.
       opts: { initial?, fire? } — fire:false suppresses the initial onChange call.
     ========================================================================== */
  CB.connectFilter = function (buttonsSelector, onChange, opts) {
    var root = resolveTarget(buttonsSelector);
    if (!root) return { select: function () {} };
    opts = opts || {};
    // the chip set: every [data-value] button inside the row (or the row's own buttons)
    var btns = [].slice.call(root.querySelectorAll('button[data-value]'));
    if (!btns.length && root.tagName === 'BUTTON' && root.hasAttribute('data-value')) btns = [root];
    if (!btns.length) return { select: function () {} };

    function valueOf(b) { return b.getAttribute('data-value'); }
    function setActive(btn) {
      btns.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('is-active', on);
      });
    }
    function activate(btn, fire) {
      if (!btn) return;
      setActive(btn);
      if (fire !== false && typeof onChange === 'function') onChange(valueOf(btn), btn);
    }
    btns.forEach(function (b) {
      if (b.type !== 'submit') b.type = 'button'; // never let a chip submit a form
      b.addEventListener('click', function () { activate(b, true); });
    });

    // default selection: opts.initial matches a data-value, else the first chip
    var initial = btns[0];
    if (opts.initial != null) {
      for (var i = 0; i < btns.length; i++) { if (valueOf(btns[i]) === String(opts.initial)) { initial = btns[i]; break; } }
    }
    activate(initial, opts.fire !== false);

    return {
      select: function (value) {
        for (var i = 0; i < btns.length; i++) { if (valueOf(btns[i]) === String(value)) { activate(btns[i], true); return; } }
      },
    };
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
      btnEl.textContent = t('copied');
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
     F44 — COOKIEBITE.diff(target, { lines, filename?, lang? })
     Codifies the components.md "Diff view" markup so an author stops hand-escaping
     +/− code. lines: [{ type:'add'|'del'|'ctx', text }]. Renders a monospaced block
     with a +/− gutter, per-side line numbers (old/new, like GitHub), and tone-tinted
     add/del rows. `text` is ESCAPED (it's code, never trusted HTML). filename -> a
     small header chip; lang -> shown next to the filename (no syntax highlight — kept
     dependency-free, the gutter/tint is the signal).
     ========================================================================== */
  CB.diff = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var lines = config.lines || [];

    if (!lines.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    // per-side running line numbers: a context line advances BOTH, an add advances only
    // the new side, a del only the old side (standard unified-diff numbering).
    var oldN = config.startOld != null ? config.startOld : 1;
    var newN = config.startNew != null ? config.startNew : 1;
    var rowTone = { add: { bg: 'bg-positive/10', sign: '+', txt: 'text-positive' }, del: { bg: 'bg-critical/10', sign: '−', txt: 'text-critical' }, ctx: { bg: '', sign: '', txt: 'text-secondary' } };
    var body = lines.map(function (ln) {
      var type = (ln && ln.type) || 'ctx';
      var rt = rowTone[type] || rowTone.ctx;
      var ol = '', nl = '';
      if (type === 'add') { nl = newN++; }
      else if (type === 'del') { ol = oldN++; }
      else { ol = oldN++; nl = newN++; }
      return '<tr class="' + rt.bg + '">' +
        '<td class="select-none text-right pr-8 pl-12 text-caption-12 ' + rt.txt + ' opacity-60 w-[1%] whitespace-nowrap">' + ol + '</td>' +
        '<td class="select-none text-right pr-8 text-caption-12 ' + rt.txt + ' opacity-60 w-[1%] whitespace-nowrap">' + nl + '</td>' +
        '<td class="select-none text-center px-4 ' + rt.txt + ' font-semibold w-[1%]">' + rt.sign + '</td>' +
        '<td class="cb-diff-code pr-12 whitespace-pre ' + (type === 'ctx' ? '' : rt.txt) + '">' + esc(ln && ln.text != null ? ln.text : '') + '</td>' +
        '</tr>';
    }).join('');

    var head = '';
    if (config.filename || config.lang) {
      head = '<div class="flex items-center gap-8 px-12 py-8 border-b border-line-weak bg-disabled-bg text-caption-12 text-secondary">' +
        iconTag('file-diff', 'w-12 h-12') +
        (config.filename ? '<span class="font-mono font-medium text-primary">' + esc(config.filename) + '</span>' : '') +
        (config.lang ? '<span class="ml-auto">' + esc(config.lang) + '</span>' : '') +
        '</div>';
    }
    host.innerHTML =
      '<div class="rounded-medium border border-line-weak bg-surface overflow-hidden">' + head +
      '<div class="cb-diff-scroll overflow-x-auto"><table class="w-full text-caption-12 font-mono leading-relaxed border-collapse">' +
      '<tbody>' + body + '</tbody></table></div></div>';
    CB.refreshIcons();
  };

  /* ==========================================================================
     COOKIEBITE.code / COOKIEBITE.codeTabs — syntax-highlighted source blocks
     A filename-chipped, line-numbered code card. Highlighting is themed via the
     `.hljs` token layer in cookiebite.css (keywords=accent, strings=positive,
     numbers=informative, comments=disabled) so it stays on-brand + dark-aware — it
     is NOT highlight.js's default rainbow. Works only when the highlight.js CDN tag
     is present in HEAD-LIBS; degrades to clean plain monospace otherwise (never errors).
     ========================================================================== */
  function highlightCodeEl(codeEl, lang) {
    if (!codeEl || !window.hljs) return;
    try {
      if (lang && window.hljs.getLanguage && window.hljs.getLanguage(lang)) {
        codeEl.innerHTML = window.hljs.highlight(codeEl.textContent, { language: lang, ignoreIllegals: true }).value;
      } else if (window.hljs.highlightElement) {
        window.hljs.highlightElement(codeEl);
      }
      codeEl.classList.add('hljs');
    } catch (e) { /* leave plain on any highlighter error */ }
  }
  // highlight every hand-authored `<pre><code class="language-x">` (and [data-cb-code]) once hljs is present.
  CB.highlightAll = function (scope) {
    var root = scope ? resolveTarget(scope) : document;
    if (!root || !window.hljs) return;
    [].forEach.call(root.querySelectorAll('pre code[class*="language-"]:not(.cb-hl), [data-cb-code]:not(.cb-hl)'), function (el) {
      var m = (el.className.match(/language-([\w-]+)/) || [])[1] || el.getAttribute('data-lang') || '';
      highlightCodeEl(el, m);
      el.classList.add('cb-hl');
    });
  };

  CB.code = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var code = config.code != null ? String(config.code) : '';
    var lang = config.lang || '';
    var showNums = config.lineNumbers !== false;
    var lineCount = code.replace(/\n$/, '').split('\n').length;
    var gutter = showNums
      ? '<td class="cb-code__gutter select-none text-right align-top pl-12 pr-12"><pre class="m-0">' +
        Array.apply(null, { length: lineCount }).map(function (_, i) { return i + 1; }).join('\n') + '</pre></td>'
      : '';
    var head = (config.filename || lang)
      ? '<div class="cb-code__head flex items-center gap-8 px-12 py-8 border-b border-line-weak bg-disabled-bg text-caption-12 text-secondary">' +
        iconTag('code', 'w-12 h-12') +
        (config.filename ? '<span class="font-mono font-medium text-primary">' + esc(config.filename) + '</span>' : '') +
        (lang ? '<span class="font-mono ' + (config.filename ? 'ml-auto opacity-70' : '') + '">' + esc(lang) + '</span>' : '') +
        '</div>'
      : '';
    host.innerHTML =
      '<div class="cb-code rounded-medium border border-line-weak bg-surface overflow-hidden">' + head +
      '<div class="cb-code__scroll overflow-x-auto"><table class="cb-code__table border-collapse w-full"><tbody><tr>' + gutter +
      '<td class="cb-code__body align-top"><pre class="m-0"><code class="' + (lang ? 'language-' + esc(lang) + ' ' : '') + '">' + esc(code) + '</code></pre></td>' +
      '</tr></tbody></table></div></div>';
    highlightCodeEl(host.querySelector('code'), lang);
    CB.refreshIcons();
    return host;
  };

  CB.codeTabs = function (target, panels, opts) {
    var host = resolveTarget(target);
    if (!host || !CB.tabs) return;
    CB.tabs(host, (panels || []).map(function (p) {
      return { label: p.label, render: function (panelEl) { CB.code(panelEl, p); } };
    }), opts);
    return host;
  };

  /* ==========================================================================
     F44 — COOKIEBITE.pseudocode(target, codeOrLines, opts?)
     Codifies the components.md annotated-code / pseudocode markup. codeOrLines is
     either a STRING (split on \n) or an ARRAY of lines; a line may be a plain string
     OR { text, note?, tone? } where `note` renders as a muted right-aligned inline
     annotation and `tone` tints the line. All text is ESCAPED. Line numbers in a
     non-selectable gutter (opts.numbers:false to drop them). opts.title -> header chip.
     ========================================================================== */
  CB.pseudocode = function (target, codeOrLines, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    opts = opts || {};
    var lines = Array.isArray(codeOrLines)
      ? codeOrLines
      : String(codeOrLines == null ? '' : codeOrLines).split('\n');

    if (!lines.length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    var showNums = opts.numbers !== false;
    var lineTone = { info: 'text-informative', success: 'text-positive', warning: 'text-cautionary', critical: 'text-critical', accent: 'text-accent-strong' };
    var body = lines.map(function (ln, i) {
      var obj = ln && typeof ln === 'object' ? ln : { text: ln };
      var txtCls = (obj.tone && lineTone[obj.tone]) ? ' ' + lineTone[obj.tone] : '';
      var note = obj.note
        ? '<span class="text-secondary opacity-80 italic ml-12 font-sans">' + esc(obj.note) + '</span>'
        : '';
      return '<tr>' +
        (showNums ? '<td class="select-none text-right pr-12 pl-12 text-caption-12 text-secondary opacity-50 w-[1%] whitespace-nowrap">' + (i + 1) + '</td>' : '') +
        '<td class="pr-12' + (showNums ? '' : ' pl-12') + ' whitespace-pre-wrap' + txtCls + '">' +
        esc(obj.text != null ? obj.text : '') + note + '</td></tr>';
    }).join('');

    var head = opts.title
      ? '<div class="flex items-center gap-8 px-12 py-8 border-b border-line-weak bg-disabled-bg text-caption-12 text-secondary">' +
        iconTag('code', 'w-12 h-12') + '<span class="font-medium text-primary">' + esc(opts.title) + '</span></div>'
      : '';
    host.innerHTML =
      '<div class="rounded-medium border border-line-weak bg-surface overflow-hidden">' + head +
      '<div class="overflow-x-auto"><table class="w-full text-caption-12 font-mono leading-relaxed border-collapse">' +
      '<tbody>' + body + '</tbody></table></div></div>';
    CB.refreshIcons();
  };

  /* ==========================================================================
     F44 — COOKIEBITE.matrix(target, { rows, cols, data, caption?, ariaLabel?, max? })
     A GENERIC rows×cols×value grid-heatmap (cohort/retention/confusion matrices) —
     CB.heatmap stays calendar-only. data is a 2D array (data[r][c]); cells tint via a
     SINGLE-HUE accent ramp (CB.ramp resolved to per-cell opacity off max). Row/col
     headers from `rows`/`cols`. caption -> muted line above; ariaLabel -> table caption
     + role. max overrides the auto color-scale top. A null/undefined cell renders blank
     (a confusion matrix's empty corner). Pure DOM table — dark-aware, print-friendly,
     no chart lib, no 0×0-in-hidden-tab footgun.
     ========================================================================== */
  CB.matrix = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var rows = config.rows || [];
    var cols = config.cols || [];
    var data = config.data || [];
    var aria = config.ariaLabel || 'data matrix';
    if (config.ariaLabel == null) console.warn('[cookiebite] COOKIEBITE.matrix: pass ariaLabel describing the matrix — it becomes the screen-reader caption.');

    if (!rows.length || !cols.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    // color scale top: explicit max, else the largest finite cell.
    var maxVal = config.max;
    if (maxVal == null) {
      maxVal = 0;
      data.forEach(function (r) { (r || []).forEach(function (v) { var n = +v; if (isFinite(n)) maxVal = Math.max(maxVal, n); }); });
      if (!maxVal) maxVal = 1;
    }
    var fmt = typeof config.format === 'function' ? config.format : function (v) { return typeof v === 'number' ? CB.nf.format(v) : v; };

    var captionText = config.captionHtml != null ? config.captionHtml : (config.caption != null ? esc(config.caption) : '');
    var caption = (config.captionHtml != null || config.caption != null)
      ? '<p class="text-body-14 text-secondary mb-12 prose-measure">' + captionText + '</p>'
      : '';

    var thead = '<thead><tr><th class="p-8"></th>' + cols.map(function (c) {
      return '<th class="p-8 text-caption-12 font-medium text-secondary text-center whitespace-nowrap">' + esc(c) + '</th>';
    }).join('') + '</tr></thead>';

    var tbody = '<tbody>' + rows.map(function (rowLabel, ri) {
      var cells = cols.map(function (c, ci) {
        var v = (data[ri] || [])[ci];
        if (v == null || v === '') return '<td class="p-8 text-center text-secondary opacity-40">—</td>';
        var n = +v;
        // per-cell accent opacity off the magnitude (faint low -> full accent high) — the
        // SINGLE-HUE ramp the project mandates, applied as alpha so dark re-theme follows.
        var frac = isFinite(n) && maxVal > 0 ? Math.max(0, Math.min(1, n / maxVal)) : 0;
        // color-mix on var(--accent) (NOT a baked accentRgba) so the cell tint flips for free on
        // a dark toggle — the matrix is static innerHTML and isn't re-rendered by rethemeCharts.
        var bg = isFinite(n) ? 'background:color-mix(in srgb, var(--accent) ' + Math.round((0.08 + 0.62 * frac) * 100) + '%, transparent);' : '';
        // text flips to accent-on once the tint is dark enough to need contrast
        var txt = frac > 0.55 ? ' text-accent-on' : '';
        return '<td class="p-8 text-center text-caption-12 nums tabular-nums' + txt + '" style="' + bg + '">' + esc(fmt(v)) + '</td>';
      }).join('');
      return '<tr><th scope="row" class="p-8 text-caption-12 font-medium text-secondary text-right whitespace-nowrap">' + esc(rowLabel) + '</th>' + cells + '</tr>';
    }).join('') + '</tbody>';

    host.innerHTML = caption +
      '<div class="overflow-x-auto rounded-medium border border-line-weak bg-surface p-12">' +
      '<table class="border-collapse" role="table" aria-label="' + esc(aria) + '">' +
      '<caption class="sr-only">' + esc(aria) + '</caption>' + thead + tbody + '</table></div>';
    CB.refreshIcons();
  };

  /* ==========================================================================
     F44 — COOKIEBITE.actionItems(target, items, opts?)
     items: [{ title, owner?, due?, priority?, body? }]. Renders an action-item list
     with a priority pill (priority -> tone via PRIORITY_TONE: p0/high->critical,
     p1/med->warning, p2/low->neutral), an owner/due meta line, an optional collapsible
     body (<details>, so it print-expands for free), and a "Copy as Markdown" button that
     serializes the list via the shared CB.copy flash. All fields ESCAPED; body is
     trusted HTML (parallels callout). opts.copy:false drops the copy button.
     ========================================================================== */
  var PRIORITY_TONE = {
    p0: 'critical', p1: 'warning', p2: 'neutral', p3: 'neutral',
    high: 'critical', med: 'warning', medium: 'warning', low: 'neutral',
    critical: 'critical', urgent: 'critical',
  };
  var aiSeq = 0;
  CB.actionItems = function (target, items, opts) {
    var host = resolveTarget(target);
    if (!host) return;
    items = items || [];
    opts = opts || {};
    if (!host.id) host.id = 'cbAI' + (++aiSeq);

    if (!items.length) { host.innerHTML = emptyState(opts.emptyText); CB.refreshIcons(); return; }

    var rows = items.map(function (it) {
      var prTone = it.priority ? (PRIORITY_TONE[String(it.priority).toLowerCase()] || 'neutral') : null;
      var prPill = it.priority ? CB.pill(it.priority, { tone: prTone, icon: null }) : '';
      var metaBits = [];
      if (it.owner) metaBits.push(iconTag('user', 'w-12 h-12') + esc(it.owner));
      if (it.due) metaBits.push(iconTag('calendar', 'w-12 h-12') + esc(it.due));
      var meta = metaBits.length
        ? '<p class="flex flex-wrap items-center gap-x-12 gap-y-2 text-caption-12 text-secondary mt-2">' +
          metaBits.map(function (b) { return '<span class="inline-flex items-center gap-2">' + b + '</span>'; }).join('') + '</p>'
        : '';
      // collapsible body via native <details> — print-expands through the @media print
      // [open]/details rule for free, no JS state to wire.
      var body = it.body
        ? '<details class="mt-8"><summary class="text-caption-12 text-accent-strong cursor-pointer select-none">' +
          esc(opts.detailsLabel || t('details')) + '</summary>' +
          '<div class="text-body-14 text-secondary mt-6">' + it.body + '</div></details>'
        : '';
      return '<li class="flex gap-12 rounded-medium border border-line-weak bg-surface p-16">' +
        (prPill ? '<div class="shrink-0">' + prPill + '</div>' : '') +
        '<div class="min-w-0 flex-1"><p class="text-body-14 font-semibold">' + esc(it.title) + '</p>' + meta + body + '</div></li>';
    }).join('');

    // copy-as-markdown: a checkbox-list serialization with owner/due/priority inline.
    var copyBtn = '';
    if (opts.copy !== false) {
      copyBtn = '<div class="flex justify-end mb-8"><button type="button" data-cb-ai-copy="' + host.id +
        '" class="text-caption-12 text-secondary hover:text-primary inline-flex items-center gap-4">' +
        iconTag('clipboard', 'w-12 h-12') + esc(opts.copyLabel || t('copyMarkdown')) + '</button></div>';
    }

    host.innerHTML = copyBtn + '<ul class="space-y-8">' + rows + '</ul>';

    if (opts.copy !== false) {
      var toMd = function () {
        return items.map(function (it) {
          var tail = [];
          if (it.owner) tail.push('@' + it.owner);
          if (it.due) tail.push('due ' + it.due);
          if (it.priority) tail.push('[' + it.priority + ']');
          return '- [ ] ' + (it.title || '') + (tail.length ? ' (' + tail.join(', ') + ')' : '');
        }).join('\n');
      };
      var cbtn = host.querySelector('[data-cb-ai-copy="' + host.id + '"]');
      if (cbtn) cbtn.addEventListener('click', function () { CB.copy(toMd(), cbtn); });
    }
    CB.refreshIcons();
  };

  /* ==========================================================================
     F38 — COOKIEBITE.search(opts?) — sticky report search that filters/dims
     [data-searchable] regions (author opt-in) whose text doesn't match, and
     scroll-highlights matches (vanilla mark.js-style, no dependency). Pairs with the
     TOC. Each top-level [data-searchable] element (or its [data-search-item] children,
     if present) is shown/dimmed per query; a count + clear button live in the field.
     opts.placeholder / opts.sticky(false) / opts.minChars override. Off unless called.
     ========================================================================== */
  CB.search = function (opts) {
    opts = opts || {};
    if (document.getElementById('cbSearch')) return; // idempotent
    var scopes = [].slice.call(document.querySelectorAll('[data-searchable]'));
    if (!scopes.length) { console.warn('[cookiebite] COOKIEBITE.search: no [data-searchable] regions found — mark sections opt-in with data-searchable.'); return; }
    var minChars = opts.minChars != null ? opts.minChars : 2;

    // each searchable UNIT: a [data-search-item] child if any exist under a scope, else
    // the scope itself. Caches the original textContent (lowercased) for matching.
    var units = [];
    scopes.forEach(function (sc) {
      var items = [].slice.call(sc.querySelectorAll('[data-search-item]'));
      var els = items.length ? items : [sc];
      els.forEach(function (el) { units.push({ el: el, text: (el.textContent || '').toLowerCase() }); });
    });

    var bar = document.createElement('div');
    bar.id = 'cbSearch';
    bar.className = (opts.sticky === false ? '' : 'sticky top-0 z-40 ') + 'bg-bg/90 backdrop-blur border-b border-line-weak py-8';
    bar.innerHTML =
      '<div class="relative max-w-[1400px] mx-auto px-16">' +
      '<label class="sr-only" for="cbSearchInput">' + esc(t('search')) + '</label>' +
      iconTag('search', 'w-16 h-16 absolute left-28 top-1/2 -translate-y-1/2 text-secondary pointer-events-none') +
      '<input id="cbSearchInput" type="search" autocomplete="off" placeholder="' + esc(opts.placeholder || t('search')) + '" ' +
      'class="w-full bg-surface border border-line-weak rounded-small text-body-14 pl-36 pr-80 py-8" />' +
      '<span id="cbSearchCount" class="absolute right-28 top-1/2 -translate-y-1/2 text-caption-12 text-secondary" aria-live="polite"></span>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);

    var input = bar.querySelector('#cbSearchInput');
    var countEl = bar.querySelector('#cbSearchCount');

    // highlight wrap/unwrap: wrap matched substrings in a <mark> inside an element's
    // TEXT nodes only (never re-wrapping markup), and unwrap on clear. Conservative —
    // skips nodes already inside a <mark> and inside script/style.
    function clearMarks(el) {
      var marks = [].slice.call(el.querySelectorAll('mark[data-cb-mark]'));
      marks.forEach(function (m) {
        var parent = m.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
    }
    function addMarks(el, q) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode;
          if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || (p.closest && p.closest('mark[data-cb-mark]'))) return NodeFilter.FILTER_REJECT;
          return n.nodeValue.toLowerCase().indexOf(q) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      var hits = []; while (walker.nextNode()) hits.push(walker.currentNode);
      hits.forEach(function (node) {
        var lower = node.nodeValue.toLowerCase(), idx = lower.indexOf(q);
        if (idx < 0) return;
        var range = node.splitText(idx);
        range.splitText(q.length);
        var mark = document.createElement('mark');
        mark.setAttribute('data-cb-mark', '1');
        mark.className = 'cb-mark';
        mark.textContent = range.nodeValue;
        range.parentNode.replaceChild(mark, range);
      });
    }

    var apply = function () {
      var q = input.value.trim().toLowerCase();
      units.forEach(function (u) { clearMarks(u.el); });
      if (q.length < minChars) {
        units.forEach(function (u) { u.el.classList.remove('cb-search-hide'); });
        countEl.textContent = '';
        return;
      }
      var matched = 0, firstHit = null;
      units.forEach(function (u) {
        var hit = u.text.indexOf(q) >= 0;
        u.el.classList.toggle('cb-search-hide', !hit);
        if (hit) {
          matched++;
          addMarks(u.el, q);
          if (!firstHit) firstHit = u.el;
        }
      });
      countEl.textContent = matched ? String(matched) : t('noMatches');
      if (firstHit && opts.scroll !== false) {
        firstHit.scrollIntoView({ behavior: CB.MOTION_OK ? 'smooth' : 'auto', block: 'center' });
      }
    };
    // debounce so each keystroke doesn't re-walk the whole DOM
    var deb = 0;
    input.addEventListener('input', function () {
      if (deb) clearTimeout(deb);
      deb = setTimeout(apply, 140);
    });
    // Escape clears
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; apply(); } });
    return bar;
  };

  /* ==========================================================================
     F45 — COOKIEBITE.densityToggle(opts?) injects a quiet chrome button that flips
     html[data-density='compact'] (the CSS compact layer lives in cookiebite.css).
     Off by default; opt-in. Persists in localStorage('report-density'). Sits next to
     the theme/print chrome (top-right stack).
     ========================================================================== */
  // 3-way density cycle: compact -> comfortable -> spacious -> compact ...
  // 'comfortable' is today's look (the --density-scale:1 default), so it's the absent
  // state — we DELETE the attr for it rather than writing it, keeping a no-toggle report
  // byte-identical. Persisted to localStorage('report-density').
  var DENSITY_CYCLE = ['compact', 'comfortable', 'spacious'];
  CB.densityToggle = function () {
    if (document.getElementById('cbDensityToggle')) return document.getElementById('cbDensityToggle');
    var saved = null;
    try { saved = localStorage.getItem('report-density'); } catch (e) {}
    // restore a saved choice; 'comfortable'/absent leaves the attr off (the default look).
    function setDensity(val) {
      if (val === 'compact' || val === 'spacious') document.documentElement.dataset.density = val;
      else delete document.documentElement.dataset.density; // comfortable === default
    }
    if (saved) setDensity(saved);
    var btn = document.createElement('button');
    btn.id = 'cbDensityToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', t('density'));
    // stack under the theme toggle (top:64 leaves the 16+40 theme button clear)
    btn.className = 'fixed top-64 right-16 z-50 inline-flex items-center justify-center w-40 h-40 rounded-full bg-surface border border-line-weak shadow-sm text-secondary hover:text-primary transition print:hidden';
    btn.innerHTML = '<i data-lucide="rows-3" class="w-20 h-20"></i>';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
      var cur = document.documentElement.dataset.density || 'comfortable';
      var idx = DENSITY_CYCLE.indexOf(cur);
      var next = DENSITY_CYCLE[(idx + 1) % DENSITY_CYCLE.length];
      setDensity(next);
      try { localStorage.setItem('report-density', next); } catch (e) {}
      // charts may need a resize after the row-height shift
      pruneCharts();
      charts.forEach(function (c) { if (c.instance) { try { c.instance.resize(); } catch (e) {} } });
    });
    CB.refreshIcons();
    return btn;
  };

  /* ==========================================================================
     F45 — COOKIEBITE.permalinks(opts?) injects a quiet hover '#' anchor on each
     section[id] heading that copies the section URL (origin+path+#id) via the shared
     CB.copy flash. Off by default; opt-in. opts.scope narrows the root; opts.selector
     overrides the heading selector (default the first h2/h3 inside each section[id]).
     ========================================================================== */
  CB.permalinks = function (opts) {
    opts = opts || {};
    var root = opts.scope ? resolveTarget(opts.scope) : document;
    if (!root) return;
    var sections = [].slice.call(root.querySelectorAll('section[id]'));
    sections.forEach(function (sec) {
      var heading = sec.querySelector(opts.selector || 'h1,h2,h3,h4');
      if (!heading || heading.querySelector('[data-cb-permalink]')) return;
      heading.classList.add('cb-permalink-h');
      var a = document.createElement('a');
      a.setAttribute('data-cb-permalink', '1');
      a.href = '#' + sec.id;
      a.setAttribute('aria-label', t('copyLink'));
      a.className = 'cb-permalink text-secondary hover:text-accent-strong no-underline select-none';
      a.textContent = '#';
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var url = location.origin + location.pathname + '#' + sec.id;
        history.replaceState(null, '', '#' + sec.id);
        // copy via the shared clipboard helper (no btnEl -> no text swap), then flash a
        // checkmark on the anchor itself (its only content is '#', so restore that).
        CB.copy(url);
        a.textContent = '✓';
        setTimeout(function () { a.textContent = '#'; }, 1200);
      });
      heading.appendChild(a);
    });
    return sections.length;
  };

  /* ==========================================================================
     F37 — COOKIEBITE.printButton() injects a quiet 'Print / Save as PDF' chrome
     button (near the theme toggle). Forces the LIGHT layer, expands every <details>
     and reveals all tab panels, then calls window.print() (the @media print block in
     cookiebite.css handles the rest). Injectable like the dark toggle; skipped when
     window.REPORT_NO_PRINT is truthy. After printing, the prior theme/expansion is
     restored so the on-screen report is unchanged.
     ========================================================================== */
  CB.print = function () {
    // 1) remember + force light so the PDF prints on the light layer even from a dark page
    var prevTheme = document.documentElement.dataset.theme || '';
    if (prevTheme === 'dark') applyTheme('light');
    // 2) reveal every native <details> (remember which were closed to restore after)
    var reopened = [].slice.call(document.querySelectorAll('details:not([open])'));
    reopened.forEach(function (d) { d.open = true; });
    // 3) reveal all tab panels (CB.tabs hides inactive panels with [hidden]); remember them
    var hiddenPanels = [].slice.call(document.querySelectorAll('[role="tabpanel"][hidden]'));
    hiddenPanels.forEach(function (p) { p.hidden = false; });
    // give the layout a frame to settle (charts may resize) before the print dialog
    var restore = function () {
      reopened.forEach(function (d) { d.open = false; });
      hiddenPanels.forEach(function (p) { p.hidden = true; });
      if (prevTheme === 'dark') applyTheme('dark');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    requestAnimationFrame(function () { window.print(); });
  };

  function ensurePrintButton() {
    if (window.REPORT_NO_PRINT) return;
    if (document.getElementById('cbPrintButton')) return;
    var btn = document.createElement('button');
    btn.id = 'cbPrintButton';
    btn.type = 'button';
    btn.setAttribute('aria-label', t('print'));
    btn.title = t('print');
    // sit to the LEFT of the fixed theme toggle (theme is right-16 w-40 -> clear it by 56)
    btn.className = 'fixed top-16 right-64 z-50 inline-flex items-center justify-center w-40 h-40 rounded-full bg-surface border border-line-weak shadow-sm text-secondary hover:text-primary transition print:hidden';
    btn.innerHTML = '<i data-lucide="printer" class="w-20 h-20"></i>';
    document.body.appendChild(btn);
    btn.addEventListener('click', CB.print);
    CB.refreshIcons(btn);
    return btn;
  }

  /* ==========================================================================
     COOKIEBITE.copyReport(opts?) — inject a quiet chrome button (near the theme toggle,
     .cb-copyreport) that serializes the WHOLE report to markdown via CB.sectionToMarkdown
     over each main section[id] (or opts.selector) and copies it via CB.copy with the
     'Copied ✓' flash. Opt-in; skipped when window.REPORT_NO_COPY is truthy. Sits to the
     LEFT of the Print button (theme right-16, print right-64 -> copy clears at right-112).
       opts: { label?, selector? }
     ========================================================================== */
  CB.copyReport = function (opts) {
    if (window.REPORT_NO_COPY) return;
    if (document.getElementById('cbCopyReport')) return document.getElementById('cbCopyReport');
    opts = opts || {};
    var label = opts.label != null ? opts.label : t('copyMarkdown');

    // serialize each main section[id] (or opts.selector) and join into one markdown doc
    function toMarkdown() {
      var sel = opts.selector || 'main section[id]';
      var sections = [].slice.call(document.querySelectorAll(sel));
      // fall back to the whole document body when no section[id] exists (flat reports)
      if (!sections.length) return CB.sectionToMarkdown('body');
      return sections.map(function (s) { return CB.sectionToMarkdown(s); })
        .filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    var btn = document.createElement('button');
    btn.id = 'cbCopyReport';
    btn.type = 'button';
    btn.className = 'cb-copyreport fixed top-16 right-112 z-50 inline-flex items-center justify-center w-40 h-40 rounded-full bg-surface border border-line-weak shadow-sm text-secondary hover:text-primary transition print:hidden';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = '<i data-lucide="clipboard-copy" class="w-20 h-20"></i>';
    document.body.appendChild(btn);
    // flash on the icon button: CB.copy swaps textContent, but this button's content is an
    // icon — so flash the title/aria + a brief check glyph instead of clobbering the icon.
    var iconHtml = btn.innerHTML;
    btn.addEventListener('click', function () {
      CB.copy(toMarkdown());
      btn.innerHTML = '<i data-lucide="check" class="w-20 h-20"></i>';
      CB.refreshIcons(btn);
      setTimeout(function () { btn.innerHTML = iconHtml; CB.refreshIcons(btn); }, 1200);
    });
    CB.refreshIcons(btn);
    return btn;
  };

  /* ==========================================================================
     F43 — COOKIEBITE.audit() — opt-in dev-only DOM audit. Off by default; run via
     console (COOKIEBITE.audit()) or auto when the URL carries ?audit=1. Scans the
     rendered DOM and console.warns + shows an on-page badge for:
       - charts/canvases with no aria-label AND no sibling data-table toggle
       - tone-colored spans (text-critical/cautionary/positive/informative) with no
         icon and no text (color-only meaning)
       - <img> missing alt
       - token color pairs below WCAG AA contrast (primary/secondary/accent on bg/surface)
     Returns the findings array. Never runs unless explicitly invoked.
     ========================================================================== */
  // relative luminance + contrast ratio from an 'rgb(r,g,b)' string (via cssColor probe)
  function luminance(rgb) {
    var m = (rgb || '').match(/(\d+(?:\.\d+)?)/g);
    if (!m || m.length < 3) return null;
    var c = [+m[0], +m[1], +m[2]].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrastRatio(a, b) {
    var la = luminance(a), lb = luminance(b);
    if (la == null || lb == null) return null;
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  CB.audit = function () {
    var findings = [];
    var add = function (kind, msg, el) { findings.push({ kind: kind, msg: msg, el: el || null }); console.warn('[cookiebite audit] ' + kind + ': ' + msg, el || ''); };

    // charts/canvases without aria-label or a sibling data-table toggle
    [].slice.call(document.querySelectorAll('canvas, [role="img"], .echarts-for-react')).forEach(function (el) {
      var labelled = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
      // a sibling toggle/table within the same card counts as the data-table alternative
      var card = el.closest ? (el.closest('.bg-surface') || el.parentElement) : el.parentElement;
      var hasTable = card && (card.querySelector('table') || card.querySelector('[aria-pressed]'));
      if (!labelled && !hasTable) add('chart-a11y', 'chart/canvas has no aria-label and no data-table alternative', el);
    });

    // tone-colored spans with no icon and no text (color-only signal)
    [].slice.call(document.querySelectorAll('[class*="text-critical"],[class*="text-cautionary"],[class*="text-positive"],[class*="text-informative"]')).forEach(function (el) {
      var hasIcon = el.querySelector && (el.querySelector('[data-lucide]') || el.querySelector('svg'));
      var hasText = (el.textContent || '').trim().length > 0;
      if (!hasIcon && !hasText) add('color-only', 'tone-colored element conveys meaning by color alone (no icon, no text)', el);
    });

    // images missing alt
    [].slice.call(document.querySelectorAll('img:not([alt])')).forEach(function (el) {
      add('img-alt', 'image missing alt attribute', el);
    });

    // token contrast pairs (primary/secondary/accent-strong over bg/surface) below AA
    var bg = cssColor('--c-bg', '#fff'), surface = cssColor('--c-surface', '#fff');
    var pairs = [
      ['--c-primary', bg, 4.5, 'primary on bg'], ['--c-secondary', bg, 4.5, 'secondary on bg'],
      ['--c-primary', surface, 4.5, 'primary on surface'], ['--c-secondary', surface, 4.5, 'secondary on surface'],
      ['--accent-strong', surface, 3, 'accent-strong on surface'],
    ];
    pairs.forEach(function (p) {
      var fg = cssColor(p[0], '#000');
      var ratio = contrastRatio(fg, p[1]);
      if (ratio != null && ratio < p[2]) add('contrast', p[3] + ' contrast ' + ratio.toFixed(2) + ':1 below ' + p[2] + ':1', null);
    });

    // on-page badge summarizing the count (replaces any prior badge)
    var badge = document.getElementById('cbAuditBadge');
    if (badge) badge.remove();
    badge = document.createElement('div');
    badge.id = 'cbAuditBadge';
    var clean = findings.length === 0;
    // F17 — pick the ink by the FILL luminance (a bright/amber positive token fails white-on AA);
    // keep the solid tone fill, only swap the text color so the count always meets contrast.
    var badgeFill = toneColor(clean ? 'positive' : 'critical');
    badge.style.color = inkOn(badgeFill, '#fff', cssColor('--c-primary', '#18181B'));
    badge.className = 'fixed bottom-16 left-16 z-50 px-12 py-8 rounded-small shadow-md text-caption-12 font-semibold ' +
      (clean ? 'bg-positive' : 'bg-critical');
    badge.textContent = t('auditTitle') + ': ' + (clean ? '0' : findings.length);
    badge.title = findings.map(function (f) { return f.kind + ' — ' + f.msg; }).join('\n');
    document.body.appendChild(badge);
    return findings;
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
    var opts = links.map(function (a) {
      var href = a.getAttribute('href') || '';
      return '<option value="' + esc(href) + '">' + esc((a.textContent || '').trim()) + '</option>';
    }).join('');
    if (!opts) return null;
    var nav = document.createElement('nav');
    nav.id = 'cbMobileNav';
    nav.setAttribute('aria-label', t('sectionNav'));
    // sticky strip, only below lg (the TOC's breakpoint); pr-56 leaves room for the
    // fixed top-right theme toggle so they never overlap.
    nav.className = 'lg:hidden sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-line-weak py-8 pr-56';
    nav.innerHTML =
      '<label class="sr-only" for="cbMobileNavSel">' + esc(t('onThisPage')) + '</label>' +
      '<select id="cbMobileNavSel" class="w-full bg-surface border border-line-weak rounded-small text-body-14 text-secondary px-12 py-8">' +
      '<option value="" disabled>' + esc(t('onThisPageDots')) + '</option>' +
      opts + '</select>';
    var main = document.querySelector('main');
    if (!main || !main.parentNode) return null;
    // main's parent is the flex-row-reverse row (TOC + main); inserting the nav BEFORE
    // main would make it a flex CHILD of that row and squeeze main to a sliver at narrow
    // widths. Insert it BEFORE the flex row itself (the grandparent) so it spans full
    // width above the row. Fall back to the old in-row placement if the grandparent is
    // missing. (lg:hidden still keeps it below lg only; sticky top-0 keeps the offset.)
    var row = main.parentNode;
    if (row.parentNode) row.parentNode.insertBefore(nav, row);
    else row.insertBefore(nav, main);
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
    btn.setAttribute('aria-label', t('themeToggle'));
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

  /* ==========================================================================
     THEME-KNOB runtime — CB.applyLook(look?).
     Reads window.REPORT_LOOK (or the arg) and projects each field onto either an
     html data-* attribute (the CSS recipe lives in cookiebite.css) or an inline
     :root CSS var. EVERY field is optional; an absent field touches NOTHING, so a
     report with no REPORT_LOOK is byte-identical to today. Call once at init BEFORE
     charts render so the first paint already reflects the look.
     ========================================================================== */
  // named semantic 4-tuples: [critical, cautionary, positive, informative] for light,
  // plus a `dark` variant nudged brighter (mirrors the CSS dark layer's intent) so the
  // four tokens stay legible on a dark surface. 'classic' is special-cased to touch
  // NOTHING (the CSS :root + dark layer already own it — keeps today byte-identical).
  var SEMANTIC_PRESETS = {
    muted: {
      light: ['#C0454A', '#C98A12', '#4A8C58', '#3B7BB5'],
      dark: ['#D9777B', '#D6A848', '#76B383', '#76A8D6'],
    },
    vivid: {
      light: ['#E11D27', '#F59E0B', '#16A34A', '#0070F3'],
      dark: ['#FF5A60', '#FFC53D', '#3FCD63', '#4DA3FF'],
    },
    'colorblind-safe': {
      // Okabe–Ito-derived: vermillion / orange / bluish-green / blue — distinguishable
      // for the common deutan/protan/tritan types.
      light: ['#D55E00', '#E69F00', '#009E73', '#0072B2'],
      dark: ['#FF7A33', '#FFC04D', '#33C99B', '#4FA3D9'],
    },
  };
  var SEMANTIC_VARS = ['--c-critical', '--c-cautionary', '--c-positive', '--c-informative'];

  // (re-)apply whichever semantic preset is active, picking the light or dark tuple by
  // the live theme. Called from applyLook AND from applyTheme so the dark nudge follows
  // a toggle. classic/absent clears any inline overrides so the CSS layers win again.
  var _activeSemanticPreset = null;
  function applySemanticPreset(name) {
    var root = document.documentElement.style;
    if (name != null) _activeSemanticPreset = name; // remember author's choice across toggles
    var preset = _activeSemanticPreset && SEMANTIC_PRESETS[_activeSemanticPreset];
    if (!preset) {
      // classic / unknown / unset — remove any inline overrides so :root + dark layer own it.
      SEMANTIC_VARS.forEach(function (v) { root.removeProperty(v); });
      return;
    }
    var dark = document.documentElement.dataset.theme === 'dark';
    var tuple = (dark && preset.dark) ? preset.dark : preset.light;
    SEMANTIC_VARS.forEach(function (v, i) { root.setProperty(v, tuple[i]); });
  }

  CB.applyLook = function (look) {
    var L = look || window.REPORT_LOOK || {};
    var html = document.documentElement;
    var root = html.style;
    function setAttr(name, val) { if (val != null) html.setAttribute('data-' + name, val); }
    function setVar(name, val) { if (val != null) root.setProperty(name, val); }

    // --- data-* knobs (CSS owns the recipe) ---
    setAttr('density', L.density);       // compact | comfortable | spacious
    setAttr('elevation', L.elevation);   // flat | soft | sharp | bordered
    setAttr('surface', L.surface);       // card | flat | outlined
    setAttr('bg', L.bg);                 // plain | wash | pattern
    setAttr('header', L.header);         // standard | banded | bordered

    // --- inline :root vars ---
    // radius scale: number OR named ('sharp'/'subtle'/'default'/'round').
    if (L.radiusScale != null) {
      var RS = { sharp: 0, subtle: 0.6, 'default': 1, round: 1.4 };
      var rs = typeof L.radiusScale === 'number' ? L.radiusScale : RS[L.radiusScale];
      if (rs != null) setVar('--radius-scale', String(rs));
    }
    setVar('--border-w', L.borderW);            // e.g. '.5px' | '1px' | '1.5px'
    setVar('--border-style', L.borderStyle);    // 'solid' | 'dashed'

    // headingFont — CANON: an OBJECT { family, url?, fallback? }. Tolerate a bare string for
    // back-compat (older theme.json shipped just the family). When the object carries a url,
    // inject the <link> here so a paste-applied look is self-contained (no separate author tag).
    if (L.headingFont != null) {
      var hf = L.headingFont;
      if (typeof hf === 'string') {
        setVar('--font-heading', hf);
      } else if (typeof hf === 'object' && hf.family) {
        setVar('--font-heading', hf.fallback ? hf.family + ',' + hf.fallback : hf.family);
        if (hf.url && !document.querySelector('link[href="' + hf.url + '"]')) {
          var lk = document.createElement('link');
          lk.rel = 'stylesheet'; lk.href = hf.url;
          document.head.appendChild(lk);
        }
      }
    }
    // measureProse / measurePage — CANON: UNIT-BEARING strings ('58ch','1200px'). Tolerate a
    // bare NUMBER from an older theme.json by appending the natural unit (ch for prose, px page).
    var unit = function (v, u) { return typeof v === 'number' ? v + u : v; };
    setVar('--measure-prose', unit(L.measureProse, 'ch'));  // e.g. '68ch'
    setVar('--measure-page', unit(L.measurePage, 'px'));    // e.g. '1400px'

    // dark tint: 'neutral' is today's EXACT look, so DON'T set the attr/var for it
    // (leave the CSS default). warm/cool/accent (or any color) write --dark-tint + the attr.
    if (L.darkTint != null && L.darkTint !== 'neutral') {
      var TINT = { warm: '#3a2a18', cool: '#16202e', accent: cssColor('--accent', '#FA4D02') };
      var tint = TINT[L.darkTint] || L.darkTint; // named nudge or a raw color
      html.setAttribute('data-dark-tint', L.darkTint === 'accent' ? 'accent' : L.darkTint);
      setVar('--dark-tint', tint);
    }

    // palette mode -> window.PALETTE_MODE (categoricalColors/ramp read it live).
    if (L.paletteMode != null) window.PALETTE_MODE = L.paletteMode;

    // semantic preset (named 4-tuple). 'classic'/absent clears inline overrides.
    applySemanticPreset(L.semanticPreset != null ? L.semanticPreset : 'classic');

    return CB;
  };

  function applyTheme(mode) {
    document.documentElement.dataset.theme = mode; // '' (light) handled as light
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var i = btn.querySelector('i');
      if (i) i.setAttribute('data-lucide', mode === 'dark' ? 'sun' : 'moon');
    }
    if (window.lucide) window.lucide.createIcons();
    applySemanticPreset();    // re-pick light/dark tuple for the active semantic preset
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
  // FIRST-OCCURRENCE-PER-ROOT (F48): each term is linked at most once PER [data-glossary]
  // root (the inner `break`), not once per whole document — so the same term is reachable
  // again in a later section. A term already wrapped in an earlier pass is skipped via the
  // `.gloss` ancestor check. (No per-scope flag is added; this default is the intended one.)
  function linkGlossary(map, scope) {
    if (!map || typeof map !== 'object') return;
    var terms = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    // F04a — scope contract: an explicit scope narrows to one root; when scope is OMITTED the
    // documented default is the whole DOCUMENT. Prefer the author's [data-glossary] regions
    // when present (a report that tagged regions still gets per-region first-occurrence), but
    // fall back to document.body so an UNTAGGED report links too instead of silently no-op'ing.
    // The .gloss-ancestor skip below keeps either path idempotent (re-runs don't double-link).
    var roots;
    if (scope) {
      roots = [resolveTarget(scope)].filter(Boolean);
    } else {
      roots = [].slice.call(document.querySelectorAll('[data-glossary]'));
      if (!roots.length && document.body) roots = [document.body];
    }
    // ASCII-word terms ('API', 'JWT') need a WORD BOUNDARY so they don't link inside a
    // larger word ('API' inside 'rapid'/'scraping'); CJK terms (no word boundaries in
    // the script) stay on plain substring match. A term counts as ASCII-word when it
    // both starts and ends with [A-Za-z0-9_].
    var isWord = function (ch) { return ch != null && /[A-Za-z0-9_]/.test(ch); };
    roots.forEach(function (root) {
      terms.forEach(function (term) {
        var asciiWord = /^[A-Za-z0-9_].*[A-Za-z0-9_]$/.test(term) || /^[A-Za-z0-9_]$/.test(term);
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
        for (var n = 0; n < nodes.length; n++) {
          var node = nodes[n];
          var p = node.parentElement;
          // skip detached nodes (DOM mutated mid-iteration), already-linked terms,
          // and headings (h1–h4) — linking a term inside a title looks broken.
          if (!p || p.closest('.gloss') || p.closest('h1,h2,h3,h4')) continue;
          // for an ASCII-word term, find the first occurrence whose surrounding chars are
          // non-word (true word boundary); for CJK leave plain substring behavior.
          var i;
          if (asciiWord) {
            var from = 0, hit = -1;
            while ((hit = node.nodeValue.indexOf(term, from)) >= 0) {
              if (!isWord(node.nodeValue[hit - 1]) && !isWord(node.nodeValue[hit + term.length])) break;
              from = hit + 1;
            }
            i = hit;
          } else {
            i = node.nodeValue.indexOf(term);
          }
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
      // include 'click' so .gloss is tap-to-reveal on touch (interactions.md §11)
      window.tippy('.gloss', { theme: 'report', maxWidth: 300, allowHTML: false, trigger: 'mouseenter focus click' });
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
      // no parse-time glossary, but author may have hand-authored .gloss spans.
      // include 'click' so .gloss is tap-to-reveal on touch (interactions.md §11)
      window.tippy('.gloss', { theme: 'report', maxWidth: 300, allowHTML: false, trigger: 'mouseenter focus click' });
    }
  }

  /* ==========================================================================
     EDITORIAL / INLINE / ANNOTATION helpers (C05–C19). String-returning helpers
     compose into innerHTML; target-rendering helpers render into a host
     (resolveTarget + disposeIn). Markup emits the SHARED contract classes
     (.cb-lead/.cb-callout/.cb-figure/…) so the CSS agent's styles apply; the
     runtime never hard-codes the editorial look here.
     ========================================================================== */

  /* C05 — COOKIEBITE.trendChip(value, { dir?, tone?, period?, spark? }) -> string
     Inline trend chip: up/down/flat Lucide glyph + delta + optional ~40×14 inline
     SVG polyline sparkline (stroke = live --accent, last point a 2px accent dot).
     dir auto-derived from the sign of `value` unless overridden; tone defaults to
     a direction-implied tone (up=success, down=critical, flat=neutral) but any
     tone key wins. period renders as trailing text-disabled context. Never
     color-alone: the glyph + the sign in the value carry direction without color.
     aria-label states direction + value (+ period). */
  CB.trendChip = function (value, opts) {
    opts = opts || {};
    // derive direction from the numeric sign of `value` unless explicitly set.
    var num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.\-+]/g, ''));
    var dir = opts.dir || (isFinite(num) ? (num > 0 ? 'up' : num < 0 ? 'down' : 'flat') : 'flat');
    var glyph = dir === 'up' ? 'trending-up' : dir === 'down' ? 'trending-down' : 'minus';
    var dirWord = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'flat';
    // tone: explicit wins; else direction implies one (semantics, not just color).
    var toneName = opts.tone || (dir === 'up' ? 'success' : dir === 'down' ? 'critical' : 'neutral');
    var tn = tone(toneName);
    var text = String(value == null ? '' : value);

    var spark = '';
    if (Array.isArray(opts.spark) && opts.spark.length > 1) {
      // build a ~40×14 polyline from the data, normalized to the box; stroke reads
      // the LIVE accent (re-resolved at call time, not a baked var(--*)).
      var d = opts.spark.map(Number).filter(isFinite);
      if (d.length > 1) {
        var w = 40, h = 14, pad = 2;
        var min = Math.min.apply(null, d), max = Math.max.apply(null, d);
        var span = (max - min) || 1;
        var stepX = (w - pad * 2) / (d.length - 1);
        var pts = d.map(function (v, i) {
          var x = pad + i * stepX;
          var y = pad + (h - pad * 2) * (1 - (v - min) / span);
          return (Math.round(x * 10) / 10) + ',' + (Math.round(y * 10) / 10);
        });
        var lastXY = pts[pts.length - 1].split(',');
        var accent = CB.css('--accent') || CB.theme.ACCENT || '#E8552D';
        spark = '<svg class="cb-trendchip__spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h +
          '" aria-hidden="true" focusable="false" style="vertical-align:middle">' +
          '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + esc(accent) +
          '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<circle cx="' + esc(lastXY[0]) + '" cy="' + esc(lastXY[1]) + '" r="2" fill="' + esc(accent) + '"/></svg>';
      }
    }

    var period = opts.period ? '<span class="cb-trendchip__period text-disabled">' + esc(opts.period) + '</span>' : '';
    var aria = dirWord + ' ' + text + (opts.period ? ' ' + opts.period : '');
    return '<span class="cb-trendchip ' + tn.text + '" role="img" aria-label="' + esc(aria) + '">' +
      iconTag(glyph, 'cb-trendchip__icon w-12 h-12') +
      '<span class="cb-trendchip__val nums">' + esc(text) + '</span>' +
      spark + period + '</span>';
  };

  /* C06 — COOKIEBITE.lead(htmlOrText, { measure?, dropcap? }) -> string
     A standfirst / leading paragraph (.cb-lead). CSS owns the size/leading look.
     `htmlOrText` is TRUSTED author HTML (so inline bold/links compose), matching
     the callout/takeaway trusted-body convention. measure:false opts the
     paragraph out of the prose measure (full bleed via .cb-bleed); dropcap adds
     the .cb-lead--dropcap modifier for an initial drop-cap. */
  CB.lead = function (htmlOrText, opts) {
    opts = opts || {};
    var cls = 'cb-lead';
    if (opts.dropcap) cls += ' cb-lead--dropcap';
    if (opts.measure === false) cls += ' cb-bleed';
    return '<p class="' + cls + '">' + (htmlOrText == null ? '' : htmlOrText) + '</p>';
  };

  /* C07 — callouts family: COOKIEBITE.note/tip/warning/danger/example(html, {title?})
     and COOKIEBITE.quote(html, {cite?}) -> string. Each emits .cb-callout with a
     .cb-callout--<variant> modifier (or .cb-quote), a locale-aware text kicker
     (NOTE/TIP/주의/위험/예시 via CB.t) + a tone Lucide icon + the trusted body.
     Reuses the pill/callout tone→icon vocabulary. The original CB.callout (above)
     is untouched and keeps working. */
  // variant -> { tone (drives icon+color from the shared TONE map), kicker i18n key, icon override? }
  var CALLOUT_VARIANTS = {
    note:    { tone: 'info',     key: 'coNote',    fallback: 'NOTE',    icon: 'info' },
    tip:     { tone: 'success',  key: 'coTip',     fallback: 'TIP',     icon: 'lightbulb' },
    warning: { tone: 'warning',  key: 'coWarning', fallback: 'WARNING', icon: 'alert-triangle' },
    danger:  { tone: 'critical', key: 'coDanger',  fallback: 'DANGER',  icon: 'octagon-x' },
    example: { tone: 'neutral',  key: 'coExample', fallback: 'EXAMPLE', icon: 'code' },
  };
  function calloutVariant(variant, html, opts) {
    opts = opts || {};
    var v = CALLOUT_VARIANTS[variant] || CALLOUT_VARIANTS.note;
    var tn = tone(v.tone);
    var kicker = opts.title != null ? opts.title : t(v.key, v.fallback);
    var ic = iconTag(v.icon, 'cb-callout__icon w-16 h-16 ' + tn.text);
    return '<div class="cb-callout cb-callout--' + variant + ' ' + tn.tint + ' ' + tn.text + '" role="note">' +
      '<div class="cb-callout__kicker">' + ic +
      '<span class="cb-callout__label ' + tn.text + '">' + esc(kicker) + '</span></div>' +
      '<div class="cb-callout__body text-primary">' + (html == null ? '' : html) + '</div></div>';
  }
  CB.note = function (html, opts) { return calloutVariant('note', html, opts); };
  CB.tip = function (html, opts) { return calloutVariant('tip', html, opts); };
  CB.warning = function (html, opts) { return calloutVariant('warning', html, opts); };
  CB.danger = function (html, opts) { return calloutVariant('danger', html, opts); };
  CB.example = function (html, opts) { return calloutVariant('example', html, opts); };

  /* COOKIEBITE.quote(html, { cite? }) -> string — a real <blockquote> styled .cb-quote
     (a callout-family member, distinct from the large .cb-pullquote). cite renders
     as a trailing <cite>. body is trusted HTML; cite is escaped. */
  CB.quote = function (html, opts) {
    opts = opts || {};
    var cite = opts.cite ? '<cite class="cb-quote__cite text-secondary">' + esc(opts.cite) + '</cite>' : '';
    return '<blockquote class="cb-callout cb-quote">' +
      '<div class="cb-quote__body">' + (html == null ? '' : html) + '</div>' + cite + '</blockquote>';
  };

  /* C09 — COOKIEBITE.figure(target, { number?:'auto'|n|false, title, note?, source? })
     Wraps the host node IN PLACE inside a <figure class="cb-figure"> with an
     optional 'Fig. N' eyebrow (a CSS counter on the .cb-figure root when
     number==='auto'; a literal label when number is a number) and a
     <figcaption class="cb-figcaption"> carrying title + note/source tiers. Pairs
     with a chart's existing aria/data-table (the chart host stays the figure's
     content). Idempotent: a host already wrapped in a .cb-figure is re-captioned,
     not double-wrapped. */
  CB.figure = function (target, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    var number = config.number == null ? 'auto' : config.number;

    // resolve an existing wrapper (re-run) or build a new <figure> around the host.
    var fig = host.closest ? host.closest('.cb-figure') : null;
    if (!fig) {
      fig = document.createElement('figure');
      fig.className = 'cb-figure';
      host.parentNode.insertBefore(fig, host);
      fig.appendChild(host);
    }
    // remove a prior caption/eyebrow from a re-run so we don't stack duplicates.
    var old = fig.querySelector(':scope > figcaption.cb-figcaption');
    if (old) old.parentNode.removeChild(old);
    var oldEye = fig.querySelector(':scope > .cb-figure__eyebrow');
    if (oldEye) oldEye.parentNode.removeChild(oldEye);

    // eyebrow: 'auto' -> CSS-counter driven (data-attr toggles the counter); a
    // number -> a literal 'Fig. N'; false -> no eyebrow.
    var eyebrow = '';
    if (number === 'auto') {
      fig.setAttribute('data-cb-autonum', '');
      eyebrow = '<figcaption class="cb-figure__eyebrow text-secondary" aria-hidden="true"></figcaption>';
    } else if (typeof number === 'number') {
      fig.removeAttribute('data-cb-autonum');
      eyebrow = '<figcaption class="cb-figure__eyebrow text-secondary" aria-hidden="true">' +
        esc(t('figAbbr', 'Fig.')) + ' ' + esc(String(number)) + '</figcaption>';
    } else {
      fig.removeAttribute('data-cb-autonum');
    }

    var tiers = '';
    if (config.title != null) tiers += '<span class="cb-figcaption__title text-primary">' + esc(config.title) + '</span>';
    if (config.note != null) tiers += '<span class="cb-figcaption__note text-secondary">' + esc(config.note) + '</span>';
    if (config.source != null) tiers += '<span class="cb-figcaption__source text-disabled">' + esc(config.source) + '</span>';
    var caption = '<figcaption class="cb-figcaption">' + tiers + '</figcaption>';

    // eyebrow goes BEFORE the content (top of figure); figcaption AFTER it (bottom).
    if (eyebrow) fig.insertAdjacentHTML('afterbegin', eyebrow);
    fig.insertAdjacentHTML('beforeend', caption);
    CB.refreshIcons(fig);
    return fig;
  };

  /* C10 — COOKIEBITE.statusDot(tone, label, { pulse?, size? }) -> string
     A filled tone dot + a REQUIRED text label (never color-alone). pulse adds the
     .cb-statusdot--pulse modifier (CSS owns the single slow ring, gated on
     prefers-reduced-motion). size sets the dot diameter via a CSS var so the same
     helper scales (default ~8px from CSS). The dot color is a color-mix tone owned
     by CSS via the modifier class; size is the only inline knob. */
  CB.statusDot = function (toneName, label, opts) {
    opts = opts || {};
    var safeTone = TONE[toneName] ? toneName : 'neutral';
    var cls = 'cb-statusdot cb-statusdot--' + safeTone + (opts.pulse ? ' cb-statusdot--pulse' : '');
    var sizeVar = opts.size ? ' style="--cb-statusdot-size:' + esc(String(opts.size).replace(/[^0-9a-z.%]/gi, '')) + 'px"' : '';
    return '<span class="' + cls + '"' + sizeVar + '>' +
      '<span class="cb-statusdot__dot" aria-hidden="true"></span>' +
      '<span class="cb-statusdot__label">' + esc(label == null ? '' : label) + '</span></span>';
  };

  /* C11 — COOKIEBITE.whatChanged(target, items, { title? })
     A 'value diff' block (.cb-whatchanged): each row = label / old (struck,
     --c-disabled) → new (--c-primary) / a Δ badge (via CB.deltaBadge), with an
     aligned arrow column. Numerics use tabular-nums; rows stack below sm. items:
     [{ label, from, to, tone?, delta? }] — delta is the badge text (auto-built from
     a numeric from→to when omitted); tone colors the Δ badge + arrow. */
  CB.whatChanged = function (target, items, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    items = items || [];
    CB.disposeIn(host);

    if (!items.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    // Wave A: the title is a BLOCK HEADER above the rows (previously it landed inside the
    // grid and shared the first row). It sits OUTSIDE .cb-whatchanged so the rows group on
    // their own content width instead of the title stretching a grid track.
    var title = config.title != null
      ? '<p class="cb-whatchanged__title text-caption-12 font-semibold uppercase tracking-wide text-secondary">' + esc(config.title) + '</p>'
      : '';

    var rows = items.map(function (it) {
      it = it || {};
      var toneName = it.tone || 'neutral';
      // auto-derive the Δ badge from numeric from→to when no explicit delta given.
      var deltaText = it.delta;
      var dir = null;
      var fromN = parseFloat(it.from), toN = parseFloat(it.to);
      if (isFinite(fromN) && isFinite(toN)) {
        var diff = toN - fromN;
        dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        if (deltaText == null) deltaText = (diff > 0 ? '+' : '') + (Math.round(diff * 100) / 100);
      }
      var badge = deltaText != null
        ? CB.deltaBadge(String(deltaText), { dir: dir || undefined, tone: toneName })
        : '';
      // F12 — a critical/warning row with STRING from/to has no numeric delta badge to carry
      // its tone, so it read identical to a neutral row. Render a small tone-colored dot before
      // the label whenever the row is toned, so the severity is visible without a numeric delta.
      var toneDot = (toneName && toneName !== 'neutral' && TONE_DOT[toneName])
        ? '<span class="inline-block w-8 h-8 rounded-full shrink-0 mr-6 align-middle ' + TONE_DOT[toneName] + '" aria-hidden="true"></span>'
        : '';
      return '<div class="cb-whatchanged__row">' +
        '<span class="cb-whatchanged__label text-secondary">' + toneDot + esc(it.label == null ? '' : it.label) + '</span>' +
        '<span class="cb-whatchanged__from text-disabled nums"><s>' + esc(it.from == null ? '' : it.from) + '</s></span>' +
        '<span class="cb-whatchanged__arrow text-disabled" aria-hidden="true">' + iconTag('arrow-right', 'w-12 h-12') + '</span>' +
        '<span class="cb-whatchanged__to text-primary nums">' + esc(it.to == null ? '' : it.to) + '</span>' +
        '<span class="cb-whatchanged__delta">' + badge + '</span></div>';
    }).join('');

    host.innerHTML = '<div class="cb-whatchanged-block">' + title + '<div class="cb-whatchanged">' + rows + '</div></div>';
    CB.refreshIcons(host);
  };

  /* C16 — COOKIEBITE.epigraph(html, { cite? }) and COOKIEBITE.pullquote(html) -> string
     Real <blockquote>/<cite>. epigraph = a small italic opening quotation
     (.cb-epigraph); pullquote = a large quotation with a hanging accent quote
     glyph (.cb-pullquote, glyph aria-hidden). Bodies are trusted HTML; cite escaped. */
  CB.epigraph = function (html, opts) {
    opts = opts || {};
    var cite = opts.cite ? '<cite class="cb-epigraph__cite text-secondary">' + esc(opts.cite) + '</cite>' : '';
    return '<blockquote class="cb-epigraph">' +
      '<p class="cb-epigraph__body">' + (html == null ? '' : html) + '</p>' + cite + '</blockquote>';
  };
  CB.pullquote = function (html) {
    // Notion-style: a clean accent left-rule + large text. No decorative quote glyph
    // (the body font rendered “ poorly and it doubled with the CSS mark).
    return '<blockquote class="cb-pullquote">' +
      '<p class="cb-pullquote__body">' + (html == null ? '' : html) + '</p></blockquote>';
  };

  /* C17 — COOKIEBITE.kicker(text, { tone? }) -> string
     An eyebrow line (.cb-kicker) meant to sit directly above an <h2>. tone colors
     the eyebrow via the shared tone text class (default accent-strong look from
     CSS). The companion run-in opening phrase uses the .cb-leadin class — apply it
     to the FIRST inline <span>/<b> of an opening paragraph for a small-caps run-in:
       <p><span class="cb-leadin">In short,</span> the rest of the sentence…</p>
     (.cb-leadin is documented here; the runtime emits no element for it.) */
  CB.kicker = function (text, opts) {
    opts = opts || {};
    var toneCls = opts.tone && TONE[opts.tone] ? ' ' + tone(opts.tone).text : '';
    return '<p class="cb-kicker' + toneCls + '">' + esc(text == null ? '' : text) + '</p>';
  };

  /* C18 — COOKIEBITE.legend(target, items, { swatch?, interactive?, chart? })
     A standalone legend (.cb-legend). Colors default to CB.categoricalColors(n) and
     re-read the LIVE accent (registered via CB.onThemeChange so a dark toggle
     recolors swatches). swatch: 'square'|'line'|'dot' (matches a series' mark).
     Optional right-aligned tabular-nums value per row. interactive:true renders
     each row as a real <button aria-pressed> that toggles the matching series on a
     registered ECharts chart (passed as `chart`: a selector/instance) via
     dispatchAction('legendToggleSelect'). items: [{label,color?,value?,note?}]. */
  CB.legend = function (target, items, config) {
    var host = resolveTarget(target);
    if (!host) return;
    config = config || {};
    items = items || [];
    var swatch = config.swatch || 'square';
    var interactive = !!config.interactive;
    // resolve the chart instance (for interactive toggling) from a selector/instance.
    var chartInst = null;
    if (config.chart) {
      if (config.chart.dispatchAction) chartInst = config.chart;
      else {
        var cEl = resolveTarget(config.chart);
        // a CB.chart host wraps the canvas in an inner #cbChartN div; find the echarts dom.
        if (cEl && window.echarts) {
          var canvasEl = cEl.matches && cEl.matches('[id^="cbChart"]') ? cEl : (cEl.querySelector ? cEl.querySelector('[id^="cbChart"]') : null);
          if (canvasEl) chartInst = window.echarts.getInstanceByDom(canvasEl);
        }
      }
    }

    if (!items.length) { host.innerHTML = emptyState(config.emptyText); CB.refreshIcons(); return; }

    // render() rebuilds rows so a theme toggle can recolor the default swatches.
    function swatchMarkup(color) {
      var style = 'style="--cb-swatch-color:' + esc(color) + '"';
      return '<span class="cb-legend__swatch cb-legend__swatch--' + swatch + '" ' + style + ' aria-hidden="true"></span>';
    }
    function render() {
      var colors = CB.categoricalColors(items.length);
      var rowsHtml = items.map(function (it, i) {
        it = it || {};
        var color = it.color || colors[i] || CB.theme.ACCENT;
        var sw = swatchMarkup(color);
        var label = '<span class="cb-legend__label">' + esc(it.label == null ? '' : it.label) + '</span>';
        var note = it.note != null ? '<span class="cb-legend__note text-disabled">' + esc(it.note) + '</span>' : '';
        var value = it.value != null ? '<span class="cb-legend__value nums text-secondary">' + esc(it.value) + '</span>' : '';
        var inner = sw + label + note + value;
        if (interactive) {
          return '<button type="button" class="cb-legend__row cb-legend__row--btn" aria-pressed="true" ' +
            'data-cb-legend-series="' + esc(it.label == null ? '' : it.label) + '">' + inner + '</button>';
        }
        return '<div class="cb-legend__row">' + inner + '</div>';
      }).join('');
      host.innerHTML = '<div class="cb-legend">' + rowsHtml + '</div>';
      CB.refreshIcons(host);
    }
    // stash the LATEST render on the host so the one registered callback always calls the
    // current closure (a re-run with new items rebinds this without re-registering).
    host._cbLegendRender = render;
    render();
    // re-read accent/categorical colors on a dark/light toggle. Guard with a per-host flag
    // (like CB.mermaid) so re-running CB.legend on the same host never stacks duplicate
    // closures in themeCbs — register ONCE, then just rebind host._cbLegendRender above.
    if (!host.dataset.cbLegendThemed) {
      host.dataset.cbLegendThemed = '1';
      CB.onThemeChange(function () { if (document.contains(host) && host._cbLegendRender) host._cbLegendRender(); });
    }

    // interactive: wire each button to toggle the matching chart series.
    if (interactive && chartInst) {
      host.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-cb-legend-series]') : null;
        if (!btn) return;
        var name = btn.getAttribute('data-cb-legend-series');
        var pressed = btn.getAttribute('aria-pressed') !== 'false';
        btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
        try { chartInst.dispatchAction({ type: 'legendToggleSelect', name: name }); } catch (err) {}
      });
    }
  };

  /* C19 — COOKIEBITE.annotate(chartSel, points)
     A post-init annotation layer on a REGISTERED chart: themed markPoints (an
     accent teardrop pin + a label in a --c-surface rounded plate with a hairline
     leader). Colors are token-resolved at apply time AND re-applied via the
     chart's registered renderFn so a dark toggle re-themes them. Each annotation's
     text is appended to the chart's data-table alt (a sibling table or an sr-only
     list) so the note isn't canvas-only. Labels are confined on narrow widths.
     points: [{ coord:[x,y], text, tone?, symbolSize? }]. */
  CB.annotate = function (chartSel, points) {
    points = points || [];
    if (!window.echarts || !points.length) return;
    var el = resolveTarget(chartSel);
    if (!el) return;
    // resolve the actual echarts dom (a CB.chart host wraps it in #cbChartN).
    var dom = (el.matches && el.matches('[id^="cbChart"]')) ? el
      : (el.querySelector ? el.querySelector('[id^="cbChart"]') : null) || el;
    var inst = window.echarts.getInstanceByDom(dom);
    if (!inst) { console.warn('[cookiebite] COOKIEBITE.annotate: no registered chart found at the selector.'); return; }

    // find this instance's registry entry so we can WRAP its renderFn — re-applying
    // the annotation markPoints (with freshly-read tokens) after every dark re-theme.
    var entry = null;
    for (var i = 0; i < charts.length; i++) { if (charts[i].instance === inst) { entry = charts[i]; break; } }

    var narrow = dom.getBoundingClientRect().width < 480;

    function applyAnnotations(chart) {
      var surface = CB.css('--c-surface') || '#fff';
      var line = CB.theme.C_LINE || CB.css('--c-line') || '#E4E4E7';
      var primary = CB.css('--c-primary') || '#18181B';
      var data = points.map(function (p) {
        p = p || {};
        var pinColor = annTone(p.tone);
        return {
          coord: p.coord,
          value: p.text,
          symbol: 'pin',
          symbolSize: p.symbolSize || 42,
          itemStyle: { color: pinColor, borderColor: pinColor },
          label: {
            show: true,
            formatter: p.text == null ? '' : String(p.text),
            color: primary,
            backgroundColor: surface,
            borderColor: line,
            borderWidth: 1,
            borderRadius: 6,
            padding: [3, 6],
            fontFamily: CB.theme.FONT,
            fontSize: narrow ? 10 : 12,
            // confine the label box on narrow charts so it can't run off-canvas.
            width: narrow ? 90 : undefined,
            overflow: narrow ? 'break' : undefined,
            position: 'top',
            distance: 8,
          },
          // hairline leader from the pin to the plotted point.
          lineStyle: { color: line, width: 1 },
        };
      });
      // overlay a dedicated empty scatter series carrying the markPoints so we don't
      // clobber the author's series. A single-element series array merges by INDEX
      // into series[0], so rebuild the FULL series list: keep every author series
      // (stripped of any prior cbAnnotate entry) and append ours last.
      var opt = chart.getOption() || {};
      var keep = (opt.series || []).filter(function (s) { return s && s.id !== 'cbAnnotate'; });
      keep.push({ id: 'cbAnnotate', type: 'scatter', data: [], markPoint: { data: data, silent: false } });
      chart.setOption({ series: keep }, { replaceMerge: ['series'] });
    }

    // tone -> token color for the pin (accent default; semantic tones token-resolved).
    function annTone(toneName) {
      if (!toneName || toneName === 'accent') return CB.theme.ACCENT || CB.css('--accent') || '#E8552D';
      var map = { critical: '--c-critical', warning: '--c-cautionary', success: '--c-positive', info: '--c-informative', neutral: '--c-secondary' };
      return CB.css(map[toneName] || '--accent') || CB.theme.ACCENT || '#E8552D';
    }

    applyAnnotations(inst);

    // re-apply on dark toggle by wrapping the registered renderFn (so the pins keep
    // their themed plate after the base re-theme runs).
    if (entry) {
      var prev = entry.renderFn;
      entry.renderFn = function (chart) {
        if (typeof prev === 'function') prev(chart); else chart.setOption(CB.baseChart);
        applyAnnotations(chart);
      };
    }

    // append each annotation text to the chart's data-table alt so it isn't canvas-only.
    // prefer a sibling data-table (from CB.chart/dataTableToggle); else attach an sr-only list.
    var card = el.closest ? el.closest('.bg-surface') : null;
    var scope = card || (el.parentNode || el);
    var existingNotes = scope.querySelector ? scope.querySelector('[data-cb-annnotes]') : null;
    if (!existingNotes) {
      existingNotes = document.createElement('ul');
      existingNotes.setAttribute('data-cb-annnotes', '');
      existingNotes.className = 'sr-only';
      scope.appendChild(existingNotes);
    } else {
      existingNotes.innerHTML = ''; // re-run: rebuild the note list
    }
    existingNotes.innerHTML = points.map(function (p) {
      return '<li>' + esc((p && p.text) || '') + '</li>';
    }).join('');
  };

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
     C20 — COOKIEBITE.toc(target, { numbered?, nested?, progress?, heading? })
     Build the sidebar TOC from main section[id] + their h2/h3 and wire the SAME
     IntersectionObserver active-state initToc() uses. Emits .cb-toc (styled by the
     shared CSS). Section numbers (1, 1.1) render in tabular-nums when numbered; two-
     level nesting when nested; a thin accent-weak per-section progress fill behind the
     active item when progress. Active item = text-accent-strong + a 2px accent left-bar
     (the .cb-toc__link.is-active class the CSS targets). Collapses with the existing
     `hidden lg:block` rail at narrow. NO-OP when the author hand-authored #toc with
     links already (so a bespoke TOC is never clobbered) unless force:true.
       target: where to render (usually the sticky rail). numbered:true (default),
       nested:true (default), progress:true (default), heading: a label (default t('contents')).
     ========================================================================== */
  CB.toc = function (target, opts) {
    var host = resolveTarget(target);
    if (!host) return null;
    opts = opts || {};
    // don't clobber a hand-authored TOC that already has links (progressive enhancement).
    var existing = document.getElementById('toc');
    if (!opts.force && existing && existing.querySelector('a')) return existing;
    var numbered = opts.numbered !== false, nested = opts.nested !== false, progress = opts.progress !== false;
    var sections = [].slice.call(document.querySelectorAll('main section[id]'));
    if (!sections.length) return null;
    CB.disposeIn(host);

    var topN = 0, items = [];
    sections.forEach(function (sec) {
      var h2 = sec.querySelector('h2'); if (!h2) return;
      topN++;
      var num = numbered ? String(topN) : '';
      items.push({ id: sec.id, text: (h2.textContent || '').trim(), num: num, sub: false });
      if (nested) {
        // h3s INSIDE this section that carry their own id become sub-entries.
        var subN = 0;
        [].slice.call(sec.querySelectorAll('h3')).forEach(function (h3) {
          var sid = h3.id || (h3.closest('[id]') && h3.closest('[id]') !== sec ? h3.closest('[id]').id : null);
          if (!sid || sid === sec.id) return;
          subN++;
          items.push({ id: sid, text: (h3.textContent || '').trim(), num: numbered ? topN + '.' + subN : '', sub: true });
        });
      }
    });
    if (!items.length) return null;

    var heading = opts.heading != null ? opts.heading : t('contents', 'Contents');
    var lis = items.map(function (it) {
      var numHtml = it.num ? '<span class="cb-toc__num nums">' + esc(it.num) + '</span>' : '';
      return '<li class="cb-toc__item' + (it.sub ? ' cb-toc__item--sub' : '') + '">' +
        '<a class="cb-toc__link" href="#' + esc(it.id) + '">' + numHtml +
        '<span class="cb-toc__text">' + esc(it.text) + '</span>' +
        (progress ? '<span class="cb-toc__fill" aria-hidden="true"></span>' : '') +
        '</a></li>';
    }).join('');

    // render into the canonical #toc element so initToc()'s observer & the existing mobile
    // nav wire it. Reuse an empty hand-authored #toc when present (no duplicate id); else
    // make `host` itself the #toc (or a child nav if host can't take the id cleanly).
    var wrap;
    if (existing) { wrap = existing; }
    else if (host.id === 'toc' || !document.getElementById('toc')) { wrap = host; host.id = 'toc'; }
    else { wrap = host; }
    wrap.className = ((wrap === host ? (host.className + ' ') : '') + 'cb-toc' + (numbered ? ' cb-toc--numbered' : '') + (nested ? ' cb-toc--nested' : '') + (progress ? ' cb-toc--progress' : '')).trim();
    if (!wrap.id) wrap.id = 'toc';
    wrap.setAttribute('aria-label', t('sectionNav', 'Section navigation'));
    wrap.innerHTML =
      (heading ? '<p class="cb-toc__heading text-caption-12 text-secondary">' + esc(heading) + '</p>' : '') +
      '<ul class="cb-toc__list">' + lis + '</ul>';
    if (wrap !== host) { host.innerHTML = ''; host.appendChild(wrap); }

    // wire the SAME active-state observer initToc uses (re-run it now that links exist).
    initToc();
    return wrap;
  };

  /* ==========================================================================
     C21 — COOKIEBITE.readingProgress({ height?, target? }) and COOKIEBITE.readTime(...)
     readingProgress: a 2px var(--accent) scroll-progress bar (.cb-readingbar) pinned at
     the top, driven by transform:scaleX, gated on MOTION_OK (reduced-motion → no bar),
     aria-hidden. readTime: a caption-12 eyebrow (.cb-readtime) with a clock glyph; CJK-
     aware (counts CHARS for ko/ja per REPORT_LOCALE, WORDS for Latin).
     ========================================================================== */
  CB.readingProgress = function (opts) {
    opts = opts || {};
    if (!CB.MOTION_OK) return null; // reduced-motion: a moving bar is exactly what they opted out of
    if (document.querySelector('.cb-readingbar')) return null;
    var h = opts.height || 2;
    var scopeSel = opts.target || 'main';
    var bar = document.createElement('div');
    bar.className = 'cb-readingbar';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.height = h + 'px';
    // transform-origin left so scaleX grows L→R; start collapsed.
    bar.style.transform = 'scaleX(0)';
    document.body.appendChild(bar);
    var raf = 0;
    function update() {
      raf = 0;
      var scope = document.querySelector(scopeSel) || document.documentElement;
      var rect = scope.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var scrolled = -rect.top;
      var p = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return bar;
  };
  CB.readTime = function (target, opts) {
    var host = resolveTarget(target);
    if (!host) return null;
    opts = opts || {};
    var wpm = opts.wpm || 220;
    var scope = document.querySelector(opts.scope || 'main') || document.body;
    var text = (scope.textContent || '').trim();
    var prefix = CB.locale();
    var minutes;
    if (prefix === 'ko' || prefix === 'ja') {
      // CJK: count han/kana/hangul CHARS; ~500 chars/min is a common reading-speed proxy.
      var cjk = (text.match(/[　-ヿ㐀-鿿가-힯]/g) || []).length;
      var cpm = opts.cpm || 500;
      minutes = Math.max(1, Math.round(cjk / cpm));
    } else {
      var words = text.split(/\s+/).filter(Boolean).length;
      minutes = Math.max(1, Math.round(words / wpm));
    }
    var el = document.createElement('p');
    el.className = 'cb-readtime text-caption-12 text-secondary';
    el.innerHTML = iconTag('clock', 'w-12 h-12') +
      '<span>' + esc(minutes + t('minRead', ' min read')) + '</span>';
    host.appendChild(el);
    CB.refreshIcons(el);
    return el;
  };

  /* ==========================================================================
     C27 — COOKIEBITE.fn(noteHtml) -> string  and  COOKIEBITE.endnotes(target, opts)
     fn() returns a <sup class="cb-fnref"><a> reference AND registers the note; ref↔note
     ids are matched by CONSTRUCTION (cbfn-ref-N ↔ cbfn-note-N) so the author never pairs
     ids manually. endnotes() renders every registered note: style:'list' (default) prints
     an ordered .cb-endnotes list with back-links; style:'sidenote' wraps each in a
     .cb-sidenote that the CSS floats into the margin on wide and collapses to inline at
     narrow. Emits .cb-fnref / .cb-endnotes / .cb-sidenote.
     ========================================================================== */
  var fnNotes = []; // { html } in registration order; index+1 is the visible number.
  CB.fn = function (noteHtml) {
    var n = fnNotes.push({ html: noteHtml == null ? '' : String(noteHtml) }); // 1-based
    var refId = 'cbfn-ref-' + n, noteId = 'cbfn-note-' + n;
    return '<sup class="cb-fnref" id="' + refId + '">' +
      '<a href="#' + noteId + '" aria-describedby="' + noteId + '">' + n + '</a></sup>';
  };
  CB.endnotes = function (target, opts) {
    var host = resolveTarget(target);
    if (!host || !fnNotes.length) return null;
    opts = opts || {};
    var style = opts.style === 'sidenote' ? 'sidenote' : 'list';
    var heading = opts.heading != null ? opts.heading : t('notesHeading', 'Notes');
    var back = t('backToText', 'Back to text');
    if (style === 'sidenote') {
      // sidenote: each note floats into the margin on wide (CSS), inline at narrow.
      var snHtml = fnNotes.map(function (note, i) {
        var n = i + 1;
        return '<aside class="cb-sidenote" id="cbfn-note-' + n + '">' +
          '<sup class="cb-sidenote__num">' + n + '</sup> ' + note.html + '</aside>';
      }).join('');
      var snWrap = document.createElement('div');
      snWrap.className = 'cb-endnotes cb-endnotes--sidenote';
      snWrap.innerHTML = snHtml;
      host.appendChild(snWrap);
      CB.refreshIcons(snWrap);
      return snWrap;
    }
    var lis = fnNotes.map(function (note, i) {
      var n = i + 1;
      return '<li class="cb-endnotes__item" id="cbfn-note-' + n + '">' +
        '<span class="cb-endnotes__body">' + note.html + '</span> ' +
        '<a class="cb-endnotes__back" href="#cbfn-ref-' + n + '" aria-label="' + esc(back) + '">↩</a></li>';
    }).join('');
    var nav = document.createElement('section');
    nav.className = 'cb-endnotes cb-endnotes--list';
    nav.innerHTML =
      (heading ? '<h2 class="cb-endnotes__heading text-title-20 font-semibold">' + esc(heading) + '</h2>' : '') +
      '<ol class="cb-endnotes__list nums">' + lis + '</ol>';
    host.appendChild(nav);
    return nav;
  };

  /* ==========================================================================
     C29 — COOKIEBITE.scrollReveal(scope?, { stagger?, y? })
     ONE IntersectionObserver fading + lifting [data-reveal] elements as they enter
     (opacity + transform ONLY — no layout shift), a 60ms sibling stagger, and triggers
     CountUp inside [data-count-on-enter] the first time each is seen. Gated on MOTION_OK:
     reduced-motion → start visible & numbers final (no animation). First paint is content-
     visible (the CSS keeps [data-reveal] readable until JS upgrades it — progressive
     enhancement). Returns the observer (or null when there's nothing to reveal).
     ========================================================================== */
  CB.scrollReveal = function (scope, opts) {
    opts = opts || {};
    var root = (typeof scope === 'string' ? document.querySelector(scope) : scope) || document;
    var els = [].slice.call(root.querySelectorAll('[data-reveal]'));
    var counters = [].slice.call(root.querySelectorAll('[data-count-on-enter]'));
    if (!els.length && !counters.length) return null;
    var stagger = opts.stagger != null ? opts.stagger : 60;
    var lift = opts.y != null ? opts.y : 8;

    // reduced-motion (or no IO support): show everything, run counters to final, done.
    function finalizeCounter(el) {
      if (el.__cbCounted) return; el.__cbCounted = true;
      if (window.countUp && window.countUp.CountUp) {
        var end = parseFloat(el.getAttribute('data-count-on-enter'));
        if (isFinite(end)) {
          var dec = parseInt(el.getAttribute('data-decimals') || '0', 10) || 0;
          var c = new window.countUp.CountUp(el, end, { duration: CB.MOTION_OK ? 1.4 : 0, decimalPlaces: dec, separator: ',' });
          if (!c.error) c.start(); else el.textContent = CB.nf.format(end);
        }
      }
    }
    if (!CB.MOTION_OK || typeof IntersectionObserver !== 'function') {
      els.forEach(function (el) { el.setAttribute('data-reveal', 'in'); });
      counters.forEach(finalizeCounter);
      return null;
    }

    // stage: hide via the data-state the CSS animates; stagger siblings sharing a parent.
    els.forEach(function (el) { if (el.getAttribute('data-reveal') !== 'in') el.setAttribute('data-reveal', 'out'); el.style.setProperty('--cb-reveal-y', lift + 'px'); });
    var seenOrder = 0;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var delay = (seenOrder++ % 8) * stagger; // cap the stagger so a big batch doesn't crawl
        el.style.transitionDelay = delay + 'ms';
        el.setAttribute('data-reveal', 'in');
        if (el.hasAttribute('data-count-on-enter')) finalizeCounter(el);
        el.querySelectorAll && el.querySelectorAll('[data-count-on-enter]').forEach(finalizeCounter);
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { obs.observe(el); });
    // standalone counters (not themselves [data-reveal]) get their own observation.
    counters.forEach(function (el) { if (!el.hasAttribute('data-reveal')) obs.observe(el); });
    return obs;
  };

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
    CB.applyLook();         // THEME-KNOB: project window.REPORT_LOOK onto html data-*/:root vars
    readThemeVars();        // re-read in case applyLook changed accent-derived/semantic tokens
    CB.hydrate(document);   // wire any [data-countup]/[data-spark] authored in raw HTML
    CB.highlightAll();      // syntax-highlight hand-authored <pre><code class="language-*"> (if highlight.js loaded)
    initToc();
    initTheme();
    initGlossary();
    initCredit();
    ensurePrintButton();    // F37: inject the Print/Save-as-PDF chrome button (opt-out: window.REPORT_NO_PRINT)
    // F43: opt-in audit auto-run when the URL carries ?audit=1 (off otherwise)
    try { if (/[?&]audit=1\b/.test(location.search)) CB.audit(); } catch (e) {}
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
