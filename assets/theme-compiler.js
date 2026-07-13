(function exposeThemeCompiler(root, factory) {
  const api = factory();
  root.CookiebiteTheme = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = { CookiebiteTheme: api };
}(typeof globalThis !== 'undefined' ? globalThis : this, function createThemeCompiler() {
  const REQUIRED_SEED_KEYS = ['font', 'background', 'text', 'accent', 'spaceUnit', 'measure', 'radius', 'surface'];
  const SEMANTIC_OVERRIDES = new Set(['textMuted', 'divider', 'accentStrong', 'surfaceRaised', 'focus']);
  const SURFACES = new Set(['border', 'tonal', 'shadow']);
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const UNSAFE = /[;{}<>]|javascript:/i;
  const UNSAFE_URL = /[<>"'`\s]|javascript:/i;

  class ThemeError extends Error {
    constructor(key, reason) {
      super(`invalid seed key '${key}': ${reason}`);
      this.name = 'ThemeError';
    }
  }

  function assert(condition, key, reason) {
    if (!condition) throw new ThemeError(key, reason);
  }

  function normalizeHex(value, key) {
    assert(typeof value === 'string' && HEX.test(value), key, 'must be an opaque six-digit hex color');
    return value.toUpperCase();
  }

  function assertSafeString(value, key) {
    assert(typeof value === 'string' && value.trim().length > 0 && !UNSAFE.test(value), key, 'contains unsafe CSS or HTML characters');
  }

  function parseHex(hex) {
    return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  }

  function toHex(rgb) {
    return `#${rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }

  function mix(first, second, amount) {
    const a = parseHex(first);
    const b = parseHex(second);
    return toHex(a.map((value, index) => value + ((b[index] - value) * amount)));
  }

  function luminance(hex) {
    const channels = parseHex(hex).map((value) => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrast(first, second) {
    const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (high + 0.05) / (low + 0.05);
  }

  function validateSeed(seed, key = 'seed') {
    assert(seed && typeof seed === 'object' && !Array.isArray(seed), key, 'must be an object');
    for (const required of REQUIRED_SEED_KEYS) assert(required in seed, `${key}.${required}`, 'is required');
    assertSafeString(seed.font, `${key}.font`);
    const colors = ['background', 'text', 'accent'].map((name) => normalizeHex(seed[name], `${key}.${name}`));
    assert(Number.isInteger(seed.spaceUnit) && seed.spaceUnit >= 2 && seed.spaceUnit <= 12, `${key}.spaceUnit`, 'must be an integer from 2 to 12');
    assert(typeof seed.measure === 'string' && /^([4-8][0-9]|90)ch$/.test(seed.measure), `${key}.measure`, 'must be an integer from 45ch to 90ch');
    assert(Number.isInteger(seed.radius) && seed.radius >= 0 && seed.radius <= 32, `${key}.radius`, 'must be an integer from 0 to 32');
    assert(SURFACES.has(seed.surface), `${key}.surface`, 'must be border, tonal, or shadow');
    assert(contrast(colors[0], colors[1]) >= 4.5, `${key}.text`, 'must contrast with background at 4.5:1 or greater');
    return { ...seed, background: colors[0], text: colors[1], accent: colors[2] };
  }

  function validateOverrides(overrides) {
    if (overrides === undefined) return {};
    assert(overrides && typeof overrides === 'object' && !Array.isArray(overrides), 'overrides', 'must be an object');
    const validated = {};
    for (const [key, value] of Object.entries(overrides)) {
      assert(SEMANTIC_OVERRIDES.has(key), `overrides.${key}`, 'is not a supported semantic override');
      validated[key] = normalizeHex(value, `overrides.${key}`);
    }
    return validated;
  }

  function validateResources(resources) {
    if (resources === undefined) return { fontStylesheets: [] };
    assert(resources && typeof resources === 'object' && !Array.isArray(resources), 'resources', 'must be an object');
    const stylesheets = resources.fontStylesheets === undefined ? [] : resources.fontStylesheets;
    assert(Array.isArray(stylesheets), 'resources.fontStylesheets', 'must be an array');
    for (const url of stylesheets) assert(typeof url === 'string' && /^https:\/\//.test(url) && !UNSAFE_URL.test(url), 'resources.fontStylesheets', 'must contain safe https URLs');
    return { fontStylesheets: [...stylesheets] };
  }

  function validate(document) {
    assert(document && typeof document === 'object' && !Array.isArray(document), 'document', 'must be an object');
    assert(document.schemaVersion === 1, 'schemaVersion', 'must equal 1');
    const seed = validateSeed(document.seed);
    let dark;
    if (document.dark !== undefined) {
      assert(document.dark && typeof document.dark === 'object' && !Array.isArray(document.dark), 'dark', 'must be an object');
      dark = validateSeed({ ...seed, ...document.dark }, 'dark');
    }
    return {
      schemaVersion: 1,
      seed,
      dark,
      status: document.status || {},
      resources: validateResources(document.resources),
      locale: document.locale || {},
      overrides: validateOverrides(document.overrides),
    };
  }

  function compileTokens(seed, overrides) {
    const surface = seed.surface === 'tonal' ? mix(seed.background, seed.accent, 0.04) : '#FFFFFF';
    const derivedFocus = mix(seed.accent, '#000000', 0.34);
    const focus = contrast(derivedFocus, seed.background) >= 3 ? derivedFocus : '#FFFFFF';
    const onAccent = contrast(seed.text, seed.accent) >= 4.5
      ? seed.text
      : (contrast('#FFFFFF', seed.accent) >= contrast('#000000', seed.accent) ? '#FFFFFF' : '#000000');
    const tokens = {
      '--cb-background': seed.background,
      '--cb-surface': surface,
      '--cb-surface-raised': surface,
      '--cb-text': seed.text,
      '--cb-text-muted': mix(seed.text, seed.background, 0.34),
      '--cb-divider': mix(seed.text, seed.background, 0.85),
      '--cb-accent': seed.accent,
      '--cb-accent-strong': mix(seed.accent, '#000000', 0.17),
      '--cb-on-accent': onAccent,
      '--cb-focus': focus,
      '--cb-space-unit': `${seed.spaceUnit}px`,
      '--cb-measure': seed.measure,
      '--cb-radius': `${seed.radius}px`,
      '--cb-font': seed.font,
      '--cb-rhythm': `${seed.spaceUnit * 7}px`,
    };
    const roleToToken = {
      textMuted: '--cb-text-muted',
      divider: '--cb-divider',
      accentStrong: '--cb-accent-strong',
      surfaceRaised: '--cb-surface-raised',
      focus: '--cb-focus',
    };
    for (const [role, color] of Object.entries(overrides)) tokens[roleToToken[role]] = color;
    assert(contrast(tokens['--cb-on-accent'], seed.accent) >= 4.5, 'accent', 'cannot produce accessible on-accent text');
    assert(contrast(tokens['--cb-focus'], tokens['--cb-background']) >= 3, 'accent', 'cannot produce a 3:1 focus color');
    return tokens;
  }

  function cssFor(tokens) {
    return `:root {\n${Object.entries(tokens).map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}`;
  }

  function compile(document) {
    const valid = validate(document);
    const tokens = compileTokens(valid.seed, valid.overrides);
    const compiled = {
      tokens,
      css: cssFor(tokens),
      resources: valid.resources,
      warnings: [],
      metadata: { schemaVersion: valid.schemaVersion, locale: valid.locale, surface: valid.seed.surface },
    };
    if (valid.dark) {
      const darkTokens = compileTokens(valid.dark, valid.overrides);
      compiled.dark = { tokens: darkTokens, css: cssFor(darkTokens) };
    }
    return compiled;
  }

  function escapeJsonForHtml(value) {
    return JSON.stringify(value).replace(/<\//g, '<\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }

  return { validate, compile, escapeJsonForHtml, contrast };
}));
