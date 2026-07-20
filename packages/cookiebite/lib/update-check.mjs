// lib/update-check.mjs — fire-and-forget npm latest notice (never blocks CLI).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_LOCAL_VERSION = JSON.parse(
  readFileSync(join(pkgRoot, 'package.json'), 'utf8'),
).version;

const REGISTRY_URL = 'https://registry.npmjs.org/cookiebite/latest';
const DAY_MS = 24 * 60 * 60 * 1000;

function defaultCachePath() {
  return join(homedir(), '.cache', 'cookiebite', 'update-check.json');
}

/** Simple dotted-numeric compare. >0 if a newer than b. */
export function compareSemver(a, b) {
  const pa = String(a)
    .replace(/^v/i, '')
    .split('.')
    .map((n) => {
      const v = Number.parseInt(n, 10);
      return Number.isFinite(v) ? v : 0;
    });
  const pb = String(b)
    .replace(/^v/i, '')
    .split('.')
    .map((n) => {
      const v = Number.parseInt(n, 10);
      return Number.isFinite(v) ? v : 0;
    });
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}

function readCache(cachePath) {
  try {
    const raw = readFileSync(cachePath, 'utf8');
    const data = JSON.parse(raw);
    if (
      typeof data?.checkedAt !== 'number' ||
      typeof data?.latest !== 'string' ||
      !data.latest
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(cachePath, checkedAt, latest) {
  try {
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(
      cachePath,
      `${JSON.stringify({ checkedAt, latest })}\n`,
      'utf8',
    );
  } catch {
    // cache is best-effort
  }
}

/**
 * After command output: if a newer cookiebite exists on npm, print one stderr line.
 * Skips when COOKIEBITE_NO_UPDATE_CHECK or CI is set. Never throws; never blocks success.
 *
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   env?: NodeJS.ProcessEnv,
 *   localVersion?: string,
 *   cachePath?: string,
 *   now?: number,
 *   write?: (msg: string) => void,
 * }} [opts]
 */
export async function maybeNotifyUpdate(opts = {}) {
  const env = opts.env ?? process.env;
  if (env.COOKIEBITE_NO_UPDATE_CHECK || env.CI) return;

  const localVersion = opts.localVersion ?? DEFAULT_LOCAL_VERSION;
  const cachePath = opts.cachePath ?? defaultCachePath();
  const now = opts.now ?? Date.now();
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const write =
    opts.write ?? ((msg) => process.stderr.write(msg));

  let latest;
  const cached = readCache(cachePath);
  if (cached && now - cached.checkedAt < DAY_MS) {
    latest = cached.latest;
  } else {
    try {
      const res = await fetchImpl(REGISTRY_URL, {
        signal: AbortSignal.timeout(1500),
      });
      if (!res || !res.ok) return;
      const body = await res.json();
      if (typeof body?.version !== 'string' || !body.version) return;
      latest = body.version;
      writeCache(cachePath, now, latest);
    } catch {
      return;
    }
  }

  if (!latest || compareSemver(latest, localVersion) <= 0) return;

  write(
    `cookiebite ${latest} 사용 가능 (현재 ${localVersion}) — bunx는 자동으로 최신을 쓰고, 고정 설치는 pnpm add -g cookiebite@latest\n`,
  );
}
