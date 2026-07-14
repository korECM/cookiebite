// packages/cookiebite/lib/lint.mjs
// Named colors are case-insensitive; a trailing '-' (white-space, red-500) is
// not a color value so the named-color arm uses a negative lookahead.
const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(|\b(?:red|blue|green|white|black|gr[ae]y|orange|yellow|purple|pink|brown|cyan|magenta|teal|navy|maroon|olive|silver|gold)\b(?!-)/i;

// Length × length products (e.g. calc(var(--x) * 4px)) collapse spacing to 0
// in the browser — reject them in authored style / style-block values.
// One nesting level covers var(...); [^)]* alone stops at the first ')'.
const INVALID_LENGTH_PRODUCT = /calc\((?:[^()]|\([^()]*\))*\*\s*\d+px/;

const SAFE_VALUE = /^(?:none|currentColor|inherit|transparent|url\(|var\()/i;

export function lintTokens(markup) {
  const violations = [];
  const scan = (source, value) => {
    const hit = value.match(COLOR_LITERAL);
    if (hit) violations.push({ source, literal: hit[0], context: value.trim().slice(0, 120) });
    if ((source === 'style' || source === 'style-block') && INVALID_LENGTH_PRODUCT.test(value)) {
      const calcHit = value.match(INVALID_LENGTH_PRODUCT);
      violations.push({ source, literal: calcHit[0], context: value.trim().slice(0, 120) });
    }
  };
  for (const [, dq, sq] of markup.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) scan('style', dq ?? sq);
  for (const [, attr, dq, sq] of markup.matchAll(/\b(fill|stroke|stop-color|flood-color|color)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const value = dq ?? sq;
    if (!SAFE_VALUE.test(value)) scan(attr.toLowerCase(), value);
  }
  for (const [, css] of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) scan('style-block', css);
  return violations;
}
