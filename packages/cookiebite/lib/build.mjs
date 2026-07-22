// packages/cookiebite/lib/build.mjs
import { existsSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assembleDocument } from './assemble.mjs';
import { buildClientBundle } from './client-bundle.mjs';
import {
  contentGate,
  isSecretViolation,
  redactMatch,
} from './content-gate.mjs';
import { lintSources } from './lint.mjs';
import { BuildError, renderReport } from './render.mjs';
import { compileTheme } from './theme-compile.mjs';
import { typecheckReport } from './typecheck.mjs';
import { compileTwSources } from './tw-compile.mjs';

/** DataTable / table density — warn when SSR markup exceeds this many `<tr`. */
export const TABLE_ROW_WARN_THRESHOLD = 300;

/**
 * Count `<tr` openings in SSR markup (header + body + footer rows).
 * @param {string} markup
 */
export function countTableRows(markup) {
  const matches = markup.match(/<tr\b/gi);
  return matches ? matches.length : 0;
}

/** ResultBlock keeps its full result in the bundle for CSV — warn when big. */
export const EMBEDDED_ROW_WARN_THRESHOLD = 1000;

/**
 * Largest `data-rows` a ResultBlock declares. The SSR `<tr>` count misses this:
 * a block folds its table to 50 rows while still shipping every row to the
 * client so the CSV export can stay the full original.
 * @param {string} markup
 */
export function maxEmbeddedRows(markup) {
  let max = 0;
  const re = /data-rows="(\d+)"/g;
  let match;
  while ((match = re.exec(markup)) !== null) {
    max = Math.max(max, Number(match[1]));
  }
  return max;
}

/** neutral 프리셋과 동일 — `__theme` 없거나 seed 일부만 있을 때 병합. */
const DEFAULT_SEED = {
  font: 'Inter, -apple-system, system-ui, sans-serif',
  background: '#FCFCFD',
  text: '#18181B',
  accent: '#4F46E5',
  spaceUnit: 4,
  measure: '68ch',
  radius: 12,
  surface: 'border',
};

function parseArgs(args) {
  const positional = [];
  let out;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '-o' || args[i] === '--out') {
      if (args[i + 1] === undefined) throw new BuildError('사용법: cookiebite build <report.tsx> [-o out.html]');
      out = args[i + 1];
      i += 1;
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length !== 1) throw new BuildError('사용법: cookiebite build <report.tsx> [-o out.html]');
  const report = positional[0];
  if (!report.endsWith('.tsx')) throw new BuildError(`${report}: .tsx 파일만 빌드할 수 있습니다`);
  return { report, out: out ?? report.replace(/\.tsx$/, '.html') };
}

function collectFilesRecursive(dir, out) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursive(full, out);
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(full);
  }
}

/** 사용자 TSX + reportDir 아래 components/, lib/ shadowing 파일 */
function authoredFiles(tsxPath) {
  const abs = path.resolve(tsxPath);
  const reportDir = path.dirname(abs);
  const files = [abs];
  collectFilesRecursive(path.join(reportDir, 'components'), files);
  collectFilesRecursive(path.join(reportDir, 'lib'), files);
  return files;
}

function resolveBuildTheme(theme) {
  if (!theme?.seed) return { seed: { ...DEFAULT_SEED } };
  return {
    ...theme,
    seed: { ...DEFAULT_SEED, ...theme.seed },
  };
}

function titleFromMarkup(markup) {
  const m = markup.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return 'Report';
  return m[1].replace(/<[^>]+>/g, '').trim() || 'Report';
}

export async function buildCommand(args) {
  const { report, out } = parseArgs(args);

  const diagnostics = typecheckReport(report);
  if (diagnostics.length > 0) {
    throw new BuildError(`typecheck 실패 (${diagnostics.length}건):\n${diagnostics.join('\n')}`);
  }

  const { violations } = lintSources({ files: authoredFiles(report) });
  if (violations.length > 0) {
    const lines = violations.map(
      (v) => `  ${v.file}:${v.line} [${v.rule}] ${v.snippet}`,
    );
    throw new BuildError(
      `색 리터럴 ${violations.length}건 — 테마 토큰/시맨틱 클래스만 허용합니다:\n${lines.join('\n')}`,
    );
  }

  const { markup, theme: rawTheme } = await renderReport(report);
  const theme = resolveBuildTheme(rawTheme);

  let themeCss;
  try {
    ({ css: themeCss } = compileTheme(theme));
  } catch (error) {
    throw new BuildError(error?.message ?? String(error));
  }

  const twCss = await compileTwSources({ tsxPath: report });
  const { js: clientJs } = await buildClientBundle(report);
  const title = titleFromMarkup(markup);

  const html = assembleDocument({
    markup,
    themeCss,
    twCss,
    clientJs,
    title,
    theme,
    lang: 'ko',
  });

  const rowCount = countTableRows(markup);
  if (rowCount > TABLE_ROW_WARN_THRESHOLD) {
    process.stderr.write(
      `content-gate: 표 행 ${rowCount}개 — ${TABLE_ROW_WARN_THRESHOLD}행을 넘습니다. ` +
        `원본을 그대로 넣지 말고 사전 집계(pre-aggregation)한 뒤 DataTable에 넣으세요.\n`,
    );
  }

  const embeddedRows = maxEmbeddedRows(markup);
  if (embeddedRows > EMBEDDED_ROW_WARN_THRESHOLD) {
    process.stderr.write(
      `content-gate: ResultBlock에 ${embeddedRows}행이 박제됐습니다 — ` +
        `${EMBEDDED_ROW_WARN_THRESHOLD}행을 넘습니다. 리포트는 원본 덤프가 아니라 ` +
        `주장의 근거이므로, 집계하거나 상위 N행으로 줄이세요.\n`,
    );
  }

  const { violations: contentViolations } = contentGate(html);
  const placeholders = contentViolations.filter((v) => v.rule === 'placeholder-residue');
  const secrets = contentViolations.filter(isSecretViolation);
  if (placeholders.length > 0) {
    const lines = placeholders.map(
      (v) => `  [${v.rule}] ${redactMatch(v.match)} @${v.index}`,
    );
    process.stderr.write(
      `content-gate: placeholder 잔재 ${placeholders.length}건 (비치명):\n${lines.join('\n')}\n`,
    );
  }
  if (secrets.length > 0) {
    const lines = secrets.map(
      (v) => `  [${v.rule}] ${redactMatch(v.match)} @${v.index}`,
    );
    throw new BuildError(
      `content-gate: 시크릿 유사 문자열 ${secrets.length}건 — 리포트에 넣을 수 없습니다:\n${lines.join('\n')}`,
    );
  }

  const tmp = `${out}.tmp`;
  writeFileSync(tmp, html);
  renameSync(tmp, out); // 원자적 교체: 부분 산출물이 배포되는 사고를 막는다
  process.stdout.write(`${out}\n`);
}
