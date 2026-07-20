/**
 * Post-assemble content gate — placeholder residue (warning) and secret-like
 * strings (build fail). Scans visible body text from `#root` when present.
 */

/** @typedef {{ rule: string, match: string, index: number }} ContentViolation */

const PLACEHOLDER_RE =
  /lorem ipsum|TODO|FIXME|placeholder|샘플 데이터|여기에 입력|\bXXX\b/gi;

/** @type {{ rule: string, re: RegExp }[]} */
const SECRET_RULES = [
  { rule: 'secret-aws-akia', re: /AKIA[0-9A-Z]{16}/g },
  { rule: 'secret-github-pat', re: /ghp_[A-Za-z0-9]{36}/g },
  { rule: 'secret-sk', re: /sk-[A-Za-z0-9]{20,}/g },
  { rule: 'secret-jwt', re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  {
    rule: 'secret-private-key',
    re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
];

/**
 * Prefer SSR markup inside `#root` so font data URIs / client bundle noise
 * do not trip JWT-like base64. Fall back to full HTML.
 * @param {string} html
 */
export function extractBodyText(html) {
  const root = html.match(
    /<div id="root">([\s\S]*?)<\/div>\s*<script\b/i,
  );
  const slice = root ? root[1] : html;
  return slice.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/**
 * @param {string} match
 */
export function redactMatch(match) {
  if (!match) return '…';
  if (match.length <= 6) return `${match[0] ?? ''}…`;
  return `${match.slice(0, 6)}…`;
}

/**
 * @param {string} html
 * @returns {{ violations: ContentViolation[] }}
 */
export function contentGate(html) {
  const text = extractBodyText(html);
  /** @type {ContentViolation[]} */
  const violations = [];

  for (const { rule, re } of SECRET_RULES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      violations.push({ rule, match: m[0], index: m.index });
    }
  }

  PLACEHOLDER_RE.lastIndex = 0;
  let pm;
  while ((pm = PLACEHOLDER_RE.exec(text)) !== null) {
    violations.push({
      rule: 'placeholder-residue',
      match: pm[0],
      index: pm.index,
    });
  }

  violations.sort((a, b) => a.index - b.index);
  return { violations };
}

/**
 * @param {ContentViolation[]} violations
 */
export function isSecretViolation(v) {
  return v.rule.startsWith('secret-');
}
