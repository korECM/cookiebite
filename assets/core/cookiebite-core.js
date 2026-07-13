(function exposeCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CookiebiteCore = api;
    api.boot(root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCoreModule() {
  const MANIFEST = {
    schemaVersion: 1,
    capabilities: {
      chart: { call: 'chart', module: 'assets/capabilities/chart.js', resources: ['echarts'], actions: ['update', 'resize', 'dispose'] },
      table: { call: 'sortable', module: 'assets/capabilities/table.js', resources: [], actions: ['sort', 'dispose'] },
      glossary: { call: 'glossary', module: 'assets/capabilities/glossary.js', resources: [], actions: ['open', 'close', 'dispose'] },
      motion: { call: 'motion', module: 'assets/capabilities/motion.js', resources: [], actions: ['play', 'cancel', 'dispose'] },
      export: { call: 'export', module: 'assets/capabilities/export.js', resources: [], actions: ['run', 'dispose'] },
    },
  };

  class CoreError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CookiebiteError';
    }
  }

  const TOKEN_TO_SEMANTIC = {
    '--cb-background': 'background', '--cb-surface': 'surface', '--cb-surface-raised': 'surfaceRaised',
    '--cb-text': 'text', '--cb-text-muted': 'textMuted', '--cb-divider': 'divider',
    '--cb-accent': 'accent', '--cb-accent-strong': 'accentStrong', '--cb-on-accent': 'onAccent',
    '--cb-focus': 'focus', '--cb-radius': 'radius', '--cb-font': 'font', '--cb-measure': 'measure',
  };

  function toSemantic(tokens) {
    const semantic = {};
    for (const [token, name] of Object.entries(TOKEN_TO_SEMANTIC)) {
      if (tokens[token] != null) semantic[name] = tokens[token];
    }
    return semantic;
  }

  function createCore(options) {
    const compiled = options.theme;
    const locale = options.locale || {};
    const included = new Set(options.included || []);
    const registry = {};
    const calls = [];
    const subscribers = new Set();
    let mode = 'light';

    const themeApi = {
      current() {
        const active = (mode === 'dark' && compiled.dark)
          ? { ...compiled, tokens: compiled.dark.tokens, css: compiled.dark.css }
          : compiled;
        return { ...active, semantic: toSemantic(active.tokens) };
      },
      mode() { return mode; },
      set(next) {
        if (next !== 'light' && next !== 'dark') throw new CoreError("theme mode must be 'light' or 'dark'");
        if (next === 'dark' && !compiled.dark) throw new CoreError('this theme does not declare a dark mode');
        if (next === mode) return;
        mode = next;
        for (const fn of subscribers) fn(mode);
      },
      onChange(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    };

    const localeTag = locale.number || 'en-US';
    const numberFormat = new Intl.NumberFormat(localeTag);
    const currencyFormat = new Intl.NumberFormat(localeTag, { style: 'currency', currency: locale.currency || 'USD' });
    const dateFormat = new Intl.DateTimeFormat(localeTag);
    const format = {
      number(value) { return numberFormat.format(value); },
      currency(value) { return currencyFormat.format(value); },
      date(value) { return dateFormat.format(value instanceof Date ? value : new Date(value)); },
    };

    function recordAction(capability, action) { calls.push({ capability, action, type: 'action' }); }
    const context = { theme: themeApi, format, recordAction };

    function invoke(capability, args) {
      calls.push({ capability, type: 'call' });
      if (!included.has(capability)) {
        throw new CoreError(
          `capability '${capability}' is not enabled. Add it to the COOKIEBITE:USE marker (e.g. <!-- COOKIEBITE:USE ${capability} -->).`,
        );
      }
      const impl = registry[capability];
      if (!impl) throw new CoreError(`capability '${capability}' module is not loaded.`);
      // Authors may pass a CSS selector for the host element; resolve it in the browser.
      let resolved = args;
      if (typeof args[0] === 'string' && typeof globalThis.document !== 'undefined' && globalThis.document.querySelector) {
        const element = globalThis.document.querySelector(args[0]);
        if (!element) throw new CoreError(`capability '${capability}': no element matches selector '${args[0]}'`);
        resolved = [element, ...args.slice(1)];
      }
      return impl(...resolved, context);
    }

    const cb = { theme: themeApi, format, calls };
    for (const [capability, def] of Object.entries(MANIFEST.capabilities)) {
      cb[def.call] = (...args) => invoke(capability, args);
    }
    cb.register = function register(capability, impl) {
      if (!MANIFEST.capabilities[capability]) throw new CoreError(`unknown capability '${capability}'`);
      registry[capability] = impl;
    };
    return cb;
  }

  function boot(root) {
    const start = () => {
      const doc = root.document;
      const themeNode = doc.getElementById('cookiebite-theme');
      const summaryNode = doc.getElementById('cookiebite-dependency-summary');
      const document = themeNode ? JSON.parse(themeNode.textContent) : { schemaVersion: 1, seed: {} };
      const summary = summaryNode ? JSON.parse(summaryNode.textContent) : { includedModules: [] };
      const compiled = root.CookiebiteTheme.compile(document);
      root.CB = createCore({ theme: compiled, locale: document.locale, included: summary.includedModules || [] });
      root.dispatchEvent(new root.Event('cookiebite:core-ready'));
    };
    // Per the assembly contract, core JS loads after the theme JSON (and before
    // the authored scripts that call CB). If the theme node is already parsed,
    // boot now so authored scripts find CB ready; otherwise wait for the DOM.
    if (root.document.getElementById('cookiebite-theme') || root.document.readyState !== 'loading') {
      start();
    } else {
      root.document.addEventListener('DOMContentLoaded', start);
    }
  }

  return { createCore, MANIFEST, boot, CoreError };
}));
