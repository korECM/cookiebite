// assemble-report.mjs — turn a core (freeform) report into a self-contained file
// carrying ONLY the dependencies its COOKIEBITE:USE marker declares.
//
// Steps (DESIGN.md §5): parse the marker, compile the theme seed to literal CSS,
// reject unknown capabilities and direct undeclared calls, inline theme CSS →
// external resources → core CSS → core JS → selected modules, emit a dependency
// summary, and write atomically (temp file renamed only on full success).
//
// Usage: node scripts/assemble-report.mjs <input.html> -o <out.html>
import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { CookiebiteTheme } = require(path.join(root, 'assets/theme-compiler.js'));
const MANIFEST = JSON.parse(readFileSync(path.join(root, 'assets/capabilities/manifest.json'), 'utf8'));

const CALL_TO_CAPABILITY = Object.fromEntries(
  Object.entries(MANIFEST.capabilities).map(([name, def]) => [def.call, name]),
);

class AssemblyError extends Error {}

function parseArgs(argv) {
  let input = null;
  let out = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '-o' || argv[i] === '--out') { out = argv[i + 1]; i += 1; }
    else if (argv[i] === '-h' || argv[i] === '--help') return { help: true };
    else if (!input) input = argv[i];
  }
  return { input, out };
}

function readSlice(html, id, message) {
  const match = html.match(new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)</script>`, 'i'));
  if (!match) throw new AssemblyError(message);
  return match[1];
}

// The marker is the capability source of truth: `<!-- COOKIEBITE:USE a b -->`.
function readMarker(html) {
  const match = html.match(/<!--\s*COOKIEBITE:USE\b([^>]*?)-->/i);
  if (!match) return null;
  return match[1].trim().split(/\s+/).filter(Boolean);
}

function assemble(html) {
  const declared = readMarker(html);
  if (declared === null) throw new AssemblyError('no COOKIEBITE:USE marker — this is a legacy compatibility report, not a core report');
  if (declared.includes('compat') && declared.length > 1) {
    throw new AssemblyError("'compat' cannot be combined with a modular capability");
  }
  const warnings = [];

  // Validate declared names against the manifest.
  const unknown = declared.filter((c) => c !== 'compat' && !MANIFEST.capabilities[c]);
  if (unknown.length) throw new AssemblyError(`unknown capabilit${unknown.length > 1 ? 'ies' : 'y'}: ${unknown.join(', ')}`);

  // Compile the theme seed to literal tokens.
  const themeDoc = JSON.parse(readSlice(html, 'cookiebite-theme', 'missing #cookiebite-theme JSON block'));
  const compiled = CookiebiteTheme.compile(themeDoc);

  // Scan authored scripts for CB.<call>(...) usage — but not the core/module code
  // itself. Strip inlined asset scripts first by only scanning REPORT-SCRIPT-ish
  // author blocks: any <script> without a src and without a cookiebite id.
  const authorCode = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*id=["']cookiebite-)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]).join('\n');
  const usedCapabilities = new Set();
  for (const [call, capability] of Object.entries(CALL_TO_CAPABILITY)) {
    if (new RegExp(`\\bCB\\.${call}\\s*\\(`).test(authorCode)) usedCapabilities.add(capability);
  }
  const undeclaredUse = [...usedCapabilities].filter((c) => !declared.includes(c));
  if (undeclaredUse.length) {
    throw new AssemblyError(
      `report calls ${undeclaredUse.map((c) => `CB.${MANIFEST.capabilities[c].call}`).join(', ')} but the COOKIEBITE:USE marker omits ${undeclaredUse.join(', ')}`,
    );
  }
  for (const capability of declared) {
    if (capability !== 'compat' && !usedCapabilities.has(capability)) {
      warnings.push(`declared capability '${capability}' is never called`);
    }
  }

  const modules = declared.filter((c) => c !== 'compat');
  const externalResources = [...new Set(modules.flatMap((c) => MANIFEST.capabilities[c].resources))];

  // Read the local asset sources we inline.
  const coreCss = readFile('assets/core/cookiebite-core.css');
  const coreJs = readFile('assets/core/cookiebite-core.js');
  const themeCompiler = readFile('assets/theme-compiler.js');

  const RESOURCE_TAGS = {
    echarts: '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>',
  };

  let output = html;

  // 1. theme CSS — inject a resolved <style> right after the theme JSON block.
  const themeCss = `<style id="cookiebite-theme-css">\n${compiled.css}\n</style>`;
  const fontLinks = (compiled.resources.fontStylesheets || [])
    .map((url) => `<link rel="stylesheet" href="${url}">`).join('\n  ');
  output = output.replace(
    /(<script[^>]*id=["']cookiebite-theme["'][^>]*>[\s\S]*?<\/script>)/i,
    `$1\n  ${[fontLinks, themeCss].filter(Boolean).join('\n  ')}`,
  );

  // 2. external resources + 3. core CSS — replace the core CSS <link>.
  const externalTags = externalResources.map((r) => RESOURCE_TAGS[r]).filter(Boolean).join('\n  ');
  const coreCssTag = `<style id="cookiebite-core-css">\n${coreCss}\n</style>`;
  output = replaceOne(
    output,
    /<link\b[^>]*href=["'][^"']*cookiebite-core\.css["'][^>]*>/i,
    [externalTags, coreCssTag].filter(Boolean).join('\n  '),
    'missing core CSS <link>',
  );

  // 4. core JS — the compiler must be present for the runtime to compile the seed,
  // so inline it before core JS.
  const coreJsTag = `<script id="cookiebite-theme-compiler">\n${sanitize(themeCompiler)}\n</script>\n  <script id="cookiebite-core-js">\n${sanitize(coreJs)}\n</script>`;
  output = replaceOne(
    output,
    /<script\b[^>]*src=["'][^"']*cookiebite-core\.js["'][^>]*>\s*<\/script>/i,
    coreJsTag,
    'missing core JS <script>',
  );

  // 5. selected modules — fill the MODULES slot with inlined declared modules.
  const moduleTags = modules
    .map((c) => `<script id="cookiebite-module-${c}">\n${sanitize(readFile(MANIFEST.capabilities[c].module))}\n</script>`)
    .join('\n  ');
  output = output.replace(
    /(<!--\s*COOKIEBITE:MODULES\s*-->)[\s\S]*?(<!--\s*\/COOKIEBITE:MODULES\s*-->)/i,
    (_m, open, close) => `${open}\n  ${moduleTags}\n  ${close}`,
  );

  // 6. dependency summary — one JSON block before </body>.
  const summary = {
    schemaVersion: 1,
    mode: declared.includes('compat') ? 'compat' : 'core',
    declared,
    includedModules: modules,
    externalResources,
    versions: externalResources.includes('echarts') ? { echarts: '5.5.1' } : {},
  };
  // The summary lives in <head> so the core runtime, which boots as soon as the
  // theme JSON is parsed, can read includedModules before any capability call.
  const summaryTag = `<script type="application/json" id="cookiebite-dependency-summary">\n${JSON.stringify(summary, null, 2)}\n</script>`;
  output = output.replace(/<\/head>/i, `  ${summaryTag}\n</head>`);

  return { output, warnings, summary };
}

function sanitize(js) { return js.replace(/<\/script>/gi, '<\\/script>'); }

function replaceOne(html, pattern, replacement, missingMessage) {
  if (!pattern.test(html)) throw new AssemblyError(missingMessage);
  return html.replace(pattern, () => replacement);
}

function readFile(relative) { return readFileSync(path.join(root, relative), 'utf8'); }

// --- CLI ---
const args = parseArgs(process.argv.slice(2));
if (args.help || !args.input) {
  process.stderr.write('usage: node scripts/assemble-report.mjs <input.html> -o <out.html>\n');
  process.exit(args.help ? 0 : 1);
}
const out = args.out || `${args.input.replace(/\.html?$/, '')}.assembled.html`;
try {
  const html = readFileSync(args.input, 'utf8');
  const { output, warnings, summary } = assemble(html);
  const tmp = `${out}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, output);
    renameSync(tmp, out);
  } catch (writeError) {
    try { unlinkSync(tmp); } catch { /* nothing to clean */ }
    throw writeError;
  }
  for (const warning of warnings) process.stderr.write(`warning: ${warning}\n`);
  process.stderr.write(`assembled ${summary.mode} report -> ${out}\n`);
  process.stderr.write(`  modules: ${summary.includedModules.join(', ') || '(none)'}  resources: ${summary.externalResources.join(', ') || '(none)'}\n`);
} catch (error) {
  if (error instanceof AssemblyError) { process.stderr.write(`error: ${error.message}\n`); process.exit(2); }
  throw error;
}
