import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClientBundle } from '../lib/client-bundle.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('buildClientBundle includes hydrateRoot and hydration flag; NODE_ENV defined away', async () => {
  const { js } = await buildClientBundle(fixture('hydration-card.tsx'));
  assert.match(js, /hydrateRoot/);
  assert.match(js, /__COOKIEBITE_HYDRATED__/);
  assert.match(js, /__COOKIEBITE_HYDRATION_ERROR__/);
  assert.match(js, /__COOKIEBITE_HYDRATION_WARNINGS__/);
  assert.match(js, /onRecoverableError/);
  assert.doesNotMatch(js, /process\.env\.NODE_ENV/);
});

test('buildClientBundle rejects unknown @/ alias with supported prefixes', async () => {
  await assert.rejects(
    () => buildClientBundle(fixture('unknown-alias.tsx')),
    /@\/components\/ui\/\*|@\/lib\/\*|Supported prefixes/i,
  );
});
