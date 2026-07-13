import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BuildError } from './render.mjs';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function newCommand(args) {
  const [target] = args;
  if (!target) throw new BuildError('사용법: cookiebite new <report.tsx>');
  if (existsSync(target)) throw new BuildError(`${target}: 이미 있습니다. 덮어쓰지 않습니다.`);
  copyFileSync(path.join(pkgRoot, 'templates/starter.tsx'), target);
  process.stdout.write(`${target}\n다음: cookiebite build ${target}\n`);
}
