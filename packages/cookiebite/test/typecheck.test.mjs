// packages/cookiebite/test/typecheck.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { typecheckReport } from '../lib/typecheck.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('typecheck can resolve @types/react from pkgRoot via createRequire', () => {
  const pkgRequire = createRequire(path.join(pkgRoot, 'package.json'));
  const typesDir = path.dirname(pkgRequire.resolve('@types/react/package.json'));
  assert.equal(existsSync(path.join(typesDir, 'index.d.ts')), true);
  assert.equal(existsSync(path.join(typesDir, 'jsx-runtime.d.ts')), true);
});

test('typecheckReport accepts a valid report (jsx-runtime types found)', () => {
  const diagnostics = typecheckReport(fixture('ok.tsx'));
  assert.deepEqual(diagnostics, []);
});

test('typecheckReport rejects a prop type error naming the prop', () => {
  const diagnostics = typecheckReport(fixture('bad-type.tsx'));
  assert.ok(diagnostics.length > 0);
  assert.match(diagnostics.join('\n'), /title/);
});
