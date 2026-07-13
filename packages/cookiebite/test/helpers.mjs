// packages/cookiebite/test/helpers.mjs
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bin = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/cookiebite.mjs');

export function runCli(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [bin, ...args], { encoding: 'utf8', ...options });
    return { code: 0, stdout, stderr: '' };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}
