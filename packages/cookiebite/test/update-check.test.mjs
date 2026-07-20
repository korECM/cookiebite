// test/update-check.test.mjs — unit tests; never hit the real network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  compareSemver,
  maybeNotifyUpdate,
} from '../lib/update-check.mjs';

function tempCache() {
  const dir = mkdtempSync(join(tmpdir(), 'cb-upd-'));
  return join(dir, 'update-check.json');
}

function fakeFetch(version, { ok = true, reject = false } = {}) {
  return async () => {
    if (reject) throw new Error('network down');
    return {
      ok,
      async json() {
        return { version };
      },
    };
  };
}

test('compareSemver: segment order', () => {
  assert.equal(compareSemver('0.5.0', '0.4.0'), 1);
  assert.equal(compareSemver('0.4.0', '0.4.0'), 0);
  assert.equal(compareSemver('0.3.9', '0.4.0'), -1);
  assert.equal(compareSemver('1.0.0', '0.9.9'), 1);
});

test('cache-hit within 24h skips fetch', async () => {
  const cachePath = tempCache();
  const now = 1_700_000_000_000;
  writeFileSync(
    cachePath,
    JSON.stringify({ checkedAt: now - 1000, latest: '9.9.9' }),
  );
  let fetched = 0;
  const lines = [];
  await maybeNotifyUpdate({
    env: {},
    localVersion: '0.4.0',
    cachePath,
    now,
    fetchImpl: async () => {
      fetched += 1;
      throw new Error('should not fetch');
    },
    write: (m) => lines.push(m),
  });
  assert.equal(fetched, 0);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /cookiebite 9\.9\.9 사용 가능 \(현재 0\.4\.0\)/);
});

test('newer version prints one stderr line; same/older stays silent', async () => {
  const cachePath = tempCache();
  const lines = [];
  await maybeNotifyUpdate({
    env: {},
    localVersion: '0.4.0',
    cachePath,
    now: Date.now(),
    fetchImpl: fakeFetch('0.5.0'),
    write: (m) => lines.push(m),
  });
  assert.equal(lines.length, 1);
  assert.match(
    lines[0],
    /cookiebite 0\.5\.0 사용 가능 \(현재 0\.4\.0\) — bunx는 자동으로 최신을 쓰고, 고정 설치는 pnpm add -g cookiebite@latest\n/,
  );
  const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
  assert.equal(cached.latest, '0.5.0');

  const silent = [];
  await maybeNotifyUpdate({
    env: {},
    localVersion: '0.5.0',
    cachePath: tempCache(),
    now: Date.now(),
    fetchImpl: fakeFetch('0.5.0'),
    write: (m) => silent.push(m),
  });
  assert.equal(silent.length, 0);

  const older = [];
  await maybeNotifyUpdate({
    env: {},
    localVersion: '1.0.0',
    cachePath: tempCache(),
    now: Date.now(),
    fetchImpl: fakeFetch('0.9.0'),
    write: (m) => older.push(m),
  });
  assert.equal(older.length, 0);
});

test('COOKIEBITE_NO_UPDATE_CHECK suppresses entirely', async () => {
  let fetched = 0;
  const lines = [];
  await maybeNotifyUpdate({
    env: { COOKIEBITE_NO_UPDATE_CHECK: '1' },
    localVersion: '0.4.0',
    cachePath: tempCache(),
    fetchImpl: async () => {
      fetched += 1;
      return fakeFetch('9.0.0')();
    },
    write: (m) => lines.push(m),
  });
  assert.equal(fetched, 0);
  assert.equal(lines.length, 0);
});

test('CI suppresses entirely', async () => {
  let fetched = 0;
  const lines = [];
  await maybeNotifyUpdate({
    env: { CI: 'true' },
    localVersion: '0.4.0',
    cachePath: tempCache(),
    fetchImpl: async () => {
      fetched += 1;
      return fakeFetch('9.0.0')();
    },
    write: (m) => lines.push(m),
  });
  assert.equal(fetched, 0);
  assert.equal(lines.length, 0);
});

test('rejecting fetch is silent', async () => {
  const lines = [];
  await maybeNotifyUpdate({
    env: {},
    localVersion: '0.4.0',
    cachePath: tempCache(),
    now: Date.now(),
    fetchImpl: fakeFetch('9.0.0', { reject: true }),
    write: (m) => lines.push(m),
  });
  assert.equal(lines.length, 0);
});

test('non-ok response is silent', async () => {
  const lines = [];
  await maybeNotifyUpdate({
    env: {},
    localVersion: '0.4.0',
    cachePath: tempCache(),
    now: Date.now(),
    fetchImpl: fakeFetch('9.0.0', { ok: false }),
    write: (m) => lines.push(m),
  });
  assert.equal(lines.length, 0);
});
