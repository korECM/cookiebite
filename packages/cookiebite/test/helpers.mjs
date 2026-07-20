// packages/cookiebite/test/helpers.mjs
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/cookiebite.mjs');

export function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    encoding: 'utf8',
    ...options,
    // CLI tests must stay deterministic / offline — never race the npm registry.
    env: {
      ...process.env,
      COOKIEBITE_NO_UPDATE_CHECK: '1',
      ...options.env,
    },
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}
