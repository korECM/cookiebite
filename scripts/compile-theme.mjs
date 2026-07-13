import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CookiebiteTheme } = require('../assets/theme-compiler.js');
const args = process.argv.slice(2);
const input = args[0] === '--stdin' ? readFileSync(0, 'utf8') : readFileSync(args[0], 'utf8');

process.stdout.write(`${CookiebiteTheme.compile(JSON.parse(input)).css}\n`);
