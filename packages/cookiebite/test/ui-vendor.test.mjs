// packages/cookiebite/test/ui-vendor.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typecheckReport } from '../lib/typecheck.mjs';

const fixture = (name) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', name);

test('typecheck accepts Card from @/components/ui/card', () => {
  const diagnostics = typecheckReport(fixture('ui-card-ok.tsx'));
  assert.deepEqual(diagnostics, []);
});

test('typecheck rejects unknown Card prop', () => {
  const diagnostics = typecheckReport(fixture('ui-card-bad.tsx'));
  assert.ok(diagnostics.length > 0);
  assert.match(diagnostics.join('\n'), /bogusProp/);
});
