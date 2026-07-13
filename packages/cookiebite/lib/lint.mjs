// packages/cookiebite/lib/lint.mjs
const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(|\b(?:red|blue|green|white|black|gr[ae]y|orange|yellow|purple|pink|brown|cyan|magenta|teal|navy|maroon|olive|silver|gold)\b/;

const SAFE_VALUE = /^(?:none|currentColor|inherit|transparent|url\(|var\()/;

export function lintTokens(markup) {
  const violations = [];
  const scan = (source, value) => {
    const hit = value.match(COLOR_LITERAL);
    if (hit) violations.push({ source, literal: hit[0], context: value.trim().slice(0, 120) });
  };
  for (const [, dq, sq] of markup.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) scan('style', dq ?? sq);
  for (const [, attr, dq, sq] of markup.matchAll(/\b(fill|stroke|stop-color|flood-color|color)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const value = dq ?? sq;
    if (!SAFE_VALUE.test(value)) scan(attr.toLowerCase(), value);
  }
  for (const [, css] of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) scan('style-block', css);
  return violations;
}
