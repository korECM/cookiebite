// packages/cookiebite/lib/lint.mjs
import { readFileSync } from 'node:fs';

// Source lint: hex + color functions (named colors handled per-rule).
const COLOR_FN_OR_HEX =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(/i;

const NAMED_COLOR =
  /\b(?:red|blue|green|white|black|gr[ae]y|orange|yellow|purple|pink|brown|cyan|magenta|teal|navy|maroon|olive|silver|gold)\b(?!-)/i;

const BRACKET_SAFE = /^(?:none|currentColor|inherit|transparent|var\()/i;
const SVG_SAFE = /^(?:none|currentColor|transparent|var\(|url\()/i;

/**
 * Scan authored TSX/JS sources for raw color literals.
 *
 * Theme exception heuristic: skip object-literal spans whose binding or JSX prop
 * name is exactly `theme` or `__theme` (brace-matched). Seed/overrides hex is legal there.
 */
export function lintSources({ files }) {
  const violations = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const skip = themeSkipRanges(source);
    scanTwArbitrary(source, file, skip, violations);
    scanInlineStyles(source, file, skip, violations);
    scanSvgAttrs(source, file, skip, violations);
  }
  return { violations };
}

function isSkipped(skip, index) {
  for (const [a, b] of skip) {
    if (index >= a && index < b) return true;
  }
  return false;
}

function lineAt(source, index) {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

function snippetAt(source, index) {
  const start = source.lastIndexOf('\n', index - 1) + 1;
  let end = source.indexOf('\n', index);
  if (end < 0) end = source.length;
  return source.slice(start, end).trim().slice(0, 80);
}

function pushViolation(violations, { file, source, index, rule }) {
  violations.push({
    file,
    line: lineAt(source, index),
    snippet: snippetAt(source, index),
    rule,
  });
}

/**
 * Collect [start, end) ranges of object literals bound to theme / __theme.
 * Covers: `const theme = {…}`, `export const __theme = {…}`, `theme={{…}}`.
 */
function themeSkipRanges(source) {
  const ranges = [];
  const re =
    /(?:(?:export\s+)?(?:const|let|var)\s+(__theme|theme)\s*=\s*)|(?:\b(__theme|theme)\s*=\s*\{)/g;
  let m;
  while ((m = re.exec(source))) {
    const isJsxProp = m[2] != null;
    let braceAt;
    if (isJsxProp) {
      // `theme={` — object may be `theme={{…}}` or `theme={expr}`.
      braceAt = m.index + m[0].length - 1; // the `{` after `=`
      const inner = nextNonWs(source, braceAt + 1);
      if (inner < source.length && source[inner] === '{') {
        const end = matchBrace(source, inner);
        if (end > inner) ranges.push([inner, end + 1]);
      }
      // Non-object expr (theme={preset}) — nothing to skip.
    } else {
      braceAt = nextNonWs(source, m.index + m[0].length);
      if (braceAt < source.length && source[braceAt] === '{') {
        const end = matchBrace(source, braceAt);
        if (end > braceAt) ranges.push([braceAt, end + 1]);
      }
    }
  }
  return ranges;
}

function nextNonWs(source, from) {
  let i = from;
  while (i < source.length && /\s/.test(source[i])) i++;
  return i;
}

/** Brace-match from an opening `{`, respecting strings/comments/templates. */
function matchBrace(source, openIdx) {
  let depth = 0;
  let i = openIdx;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(source, i);
      continue;
    }
    if (c === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i);
      if (i < 0) return source.length - 1;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return openIdx;
}

function skipString(source, start) {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (quote === '`' && c === '$' && source[i + 1] === '{') {
      const end = matchBrace(source, i + 1);
      i = end + 1;
      continue;
    }
    if (c === quote) return i + 1;
    i++;
  }
  return source.length;
}

function scanTwArbitrary(source, file, skip, violations) {
  // TW arbitrary utility: prefix-[value] (supports variants like hover:bg-[#x]).
  const re = /(?:^|[\s"'`])((?:[\w-]+:)*[\w/-]+)-\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(source))) {
    const valueStart = m.index + m[0].lastIndexOf('[');
    if (isSkipped(skip, valueStart)) continue;
    const inner = m[2];
    if (BRACKET_SAFE.test(inner.trim())) continue;
    // content-[…] holds text, not paint — skip color literals there.
    const utility = m[1].split(':').pop();
    if (utility === 'content') continue;
    const hit = inner.match(COLOR_FN_OR_HEX) || inner.match(NAMED_COLOR);
    if (hit) {
      pushViolation(violations, { file, source, index: valueStart, rule: 'tw-arbitrary-color' });
    }
  }
}

function scanInlineStyles(source, file, skip, violations) {
  // style="..." / style='...'
  for (const m of source.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const value = m[1] ?? m[2];
    const valueStart = m.index + m[0].indexOf(value);
    if (isSkipped(skip, valueStart)) continue;
    scanStyleSpan(source, file, skip, violations, valueStart, value);
  }
  // style={…} — brace-match the expression
  const re = /\bstyle\s*=\s*\{/gi;
  let m;
  while ((m = re.exec(source))) {
    const open = m.index + m[0].length - 1;
    if (isSkipped(skip, open)) continue;
    const close = matchBrace(source, open);
    if (close <= open) continue;
    const span = source.slice(open, close + 1);
    scanStyleSpan(source, file, skip, violations, open, span);
  }
}

function scanStyleSpan(source, file, skip, violations, baseIndex, span) {
  // Skip allowed keywords / var() / transparent — flag remaining hex/fn literals.
  const re = new RegExp(COLOR_FN_OR_HEX.source, 'gi');
  let m;
  while ((m = re.exec(span))) {
    const abs = baseIndex + m.index;
    if (isSkipped(skip, abs)) continue;
    // Allow if the match sits inside a var(...) call start.
    if (isInsideVarCall(span, m.index)) continue;
    pushViolation(violations, { file, source, index: abs, rule: 'inline-style-color' });
  }
}

function isInsideVarCall(span, index) {
  // Cheap check: look backward for `var(` without a closing `)` before index.
  const before = span.slice(0, index);
  const lastVar = before.lastIndexOf('var(');
  if (lastVar < 0) return false;
  const afterVar = before.slice(lastVar);
  return !afterVar.includes(')');
}

function scanSvgAttrs(source, file, skip, violations) {
  // fill="..." / stroke='...' / fill={"..."} / stroke={'...'}
  const re =
    /(?:^|[\s{])(fill|stroke)\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|(?:\{\s*(?:"([^"]*)"|'([^']*)')\s*\}))/gi;
  let m;
  while ((m = re.exec(source))) {
    const value = m[2] ?? m[3] ?? m[4] ?? m[5];
    if (value == null) continue;
    const valueStart = m.index + m[0].indexOf(value);
    if (isSkipped(skip, valueStart)) continue;
    const trimmed = value.trim();
    if (SVG_SAFE.test(trimmed)) continue;
    if (COLOR_FN_OR_HEX.test(trimmed) || NAMED_COLOR.test(trimmed)) {
      pushViolation(violations, { file, source, index: valueStart, rule: 'svg-attr-color' });
    }
  }
}
