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

/** 문단으로 세는 하한. 이보다 짧은 `<p>`는 캡션·라벨로 보고 통계에서 뺀다. */
const PROSE_MIN_CHARS = 40;

/** 문단 길이 중앙값이 이 아래면 산문이 캡션으로 부서졌다고 본다. */
export const PROSE_MEDIAN_WARN_THRESHOLD = 80;

/**
 * SSR 마크업의 `<p>` 길이 분포.
 *
 * 저작 표면이 한 줄짜리 prop 슬롯(`lede`, `description`, `caption`, `evidence`)
 * 위주라 저자가 논증을 캡션에 흘려 쓰기 쉽다. 총량이 아니라 **분포**가 증상이다 —
 * 같은 글자 수가 22조각으로 흩어지면 어디서도 논지가 이어지지 않는다.
 *
 * @param {string} markup SSR 마크업
 * @returns {{ count: number, median: number, longest: number }}
 */
export function proseStats(markup) {
  const lengths = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(markup)) !== null) {
    const text = m[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;|&#\d+;/gi, ' ')
      // koGlue가 넣는 워드 조이너·NBSP는 글자 수로 세지 않는다
      .replace(/[⁠ ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length >= PROSE_MIN_CHARS) lengths.push(text.length);
  }
  if (lengths.length === 0) return { count: 0, median: 0, longest: 0 };
  lengths.sort((a, b) => a - b);
  const mid = Math.floor(lengths.length / 2);
  const median =
    lengths.length % 2 === 0 ? (lengths[mid - 1] + lengths[mid]) / 2 : lengths[mid];
  return { count: lengths.length, median, longest: lengths[lengths.length - 1] };
}
