#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { maybeNotifyUpdate } from '../lib/update-check.mjs';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));

const USAGE = `사용법:
  cookiebite new <report.tsx>              타입드 스타터 리포트 생성
  cookiebite build <report.tsx> [-o out]   typecheck, lint 후 단일 HTML로 빌드
  cookiebite verify <report.html> [--runs N] [--manual-ok] [-o out.json]
  cookiebite --version`;

async function run() {
  const [command, ...args] = process.argv.slice(2);
  if (command === '--version' || command === '-v') {
    process.stdout.write(`${pkg.version}\n`);
    return;
  }
  if (command === 'build') {
    const { buildCommand } = await import('../lib/build.mjs');
    await buildCommand(args);
    return;
  }
  if (command === 'new') {
    const { newCommand } = await import('../lib/new.mjs');
    await newCommand(args);
    return;
  }
  if (command === 'verify') {
    const { verifyCommand } = await import('../lib/verify.mjs');
    await verifyCommand(args);
    return;
  }
  process.stderr.write(`${USAGE}\n`);
  process.exitCode = 1;
}

async function main() {
  // Fire-and-forget: start early, await after command so the notice follows output.
  // verify exit codes (process.exitCode) are left as-is.
  const notice = maybeNotifyUpdate();
  try {
    await run();
  } finally {
    await notice;
  }
}

main().catch((error) => {
  // BuildError are authored failures — message only.
  // Compare by name (not instanceof) so a bundled copy of the class still matches.
  const expected = error?.name === 'BuildError';
  process.stderr.write(`${expected ? error.message : (error.stack || error.message)}\n`);
  process.exitCode = 1;
});
