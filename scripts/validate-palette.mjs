import { pathToFileURL } from 'node:url';

var DEFAULT_SURFACE = { light: '#FFFFFF', dark: '#17181C' };
var BANDS = { light: [0.43, 0.77], dark: [0.48, 0.67] };

function clamp(value, low, high) { return Math.min(high, Math.max(low, value)); }
function radians(degrees) { return degrees * Math.PI / 180; }
function degrees(radiansValue) { return radiansValue * 180 / Math.PI; }
function fixed(value, places) { return Number(value).toFixed(places); }
function linearChannel(value) {
  value /= 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}
function gammaChannel(value) {
  value = clamp(value, 0, 1);
  value = value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return value * 255;
}

export function parseColor(str) {
  var input = String(str).trim();
  var hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    var value = hex[1].length === 3 ? hex[1].replace(/(.)/g, '$1$1') : hex[1];
    return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
  }

  var fn = input.match(/^(rgb|hsl)\(\s*(.*?)\s*\)$/i);
  if (!fn) throw new Error('Unparseable color "' + input + '"');
  var parts = fn[2].includes(',') ? fn[2].split(/\s*,\s*/) : fn[2].trim().split(/\s+/);
  if (parts.length !== 3) throw new Error('Unparseable color "' + input + '"');

  if (fn[1].toLowerCase() === 'rgb') {
    var rgb = parts.map(Number);
    if (rgb.some(function (v) { return !Number.isFinite(v) || v < 0 || v > 255; })) {
      throw new Error('Unparseable color "' + input + '"');
    }
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
  }

  var hueText = parts[0].replace(/deg$/i, '');
  var h = Number(hueText);
  var sat = parts[1].match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))%$/);
  var light = parts[2].match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))%$/);
  if (!Number.isFinite(h) || !sat || !light) throw new Error('Unparseable color "' + input + '"');
  var s = Number(sat[1]) / 100;
  var l = Number(light[1]) / 100;
  if (s < 0 || s > 1 || l < 0 || l > 1) throw new Error('Unparseable color "' + input + '"');
  h = ((h % 360) + 360) % 360;
  var chroma = (1 - Math.abs(2 * l - 1)) * s;
  var x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  var sector = Math.floor(h / 60);
  var raw = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][sector];
  var m = l - chroma / 2;
  return { r: (raw[0] + m) * 255, g: (raw[1] + m) * 255, b: (raw[2] + m) * 255 };
}

function asRgb(color) { return typeof color === 'string' ? parseColor(color) : color; }
function toHex(rgb) {
  return '#' + ['r', 'g', 'b'].map(function (key) {
    return Math.round(clamp(rgb[key], 0, 255)).toString(16).padStart(2, '0');
  }).join('').toUpperCase();
}

export function toOklch(color) {
  var rgb = asRgb(color);
  var r = linearChannel(rgb.r), g = linearChannel(rgb.g), b = linearChannel(rgb.b);
  // Björn Ottosson's published linear-sRGB -> OKLab transform.
  var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  var ll = Math.cbrt(l), mm = Math.cbrt(m), ss = Math.cbrt(s);
  var L = 0.2104542553 * ll + 0.7936177850 * mm - 0.0040720468 * ss;
  var a = 1.9779984951 * ll - 2.4285922050 * mm + 0.4505937099 * ss;
  var bb = 0.0259040371 * ll + 0.7827717662 * mm - 0.8086757660 * ss;
  var C = Math.hypot(a, bb);
  var h = C < 1e-12 ? 0 : (degrees(Math.atan2(bb, a)) + 360) % 360;
  return { l: L, c: C, h: h };
}

function luminance(color) {
  var rgb = asRgb(color);
  return 0.2126 * linearChannel(rgb.r) + 0.7152 * linearChannel(rgb.g) + 0.0722 * linearChannel(rgb.b);
}

export function contrast(a, b) {
  var first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function simulateCVD(color, type) {
  var matrices = {
    // Machado, Oliveira & Fernandes (2009), severity 1.0 matrices.
    protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  };
  if (type !== 'protanopia' && type !== 'deuteranopia') throw new Error('Unknown CVD type "' + type + '"');
  var rgb = asRgb(color);
  var linear = [linearChannel(rgb.r), linearChannel(rgb.g), linearChannel(rgb.b)];
  var out = matrices[type].map(function (row) {
    return row[0] * linear[0] + row[1] * linear[1] + row[2] * linear[2];
  });
  return { r: gammaChannel(out[0]), g: gammaChannel(out[1]), b: gammaChannel(out[2]) };
}

function toLab(color) {
  var rgb = asRgb(color);
  var r = linearChannel(rgb.r), g = linearChannel(rgb.g), b = linearChannel(rgb.b);
  var x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  var y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  var z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  var f = function (v) { return v > 216 / 24389 ? Math.cbrt(v) : (24389 / 27 * v + 16) / 116; };
  var fx = f(x), fy = f(y), fz = f(z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function deltaE2000(lab1, lab2) {
  var L1 = lab1.l, a1 = lab1.a, b1 = lab1.b, L2 = lab2.l, a2 = lab2.a, b2 = lab2.b;
  var C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cbar = (C1 + C2) / 2;
  var Cbar7 = Math.pow(Cbar, 7);
  var G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));
  var ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  var Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  var hp = function (a, b) { var h = degrees(Math.atan2(b, a)); return h < 0 ? h + 360 : h; };
  var hp1 = Cp1 === 0 ? 0 : hp(ap1, b1), hp2 = Cp2 === 0 ? 0 : hp(ap2, b2);
  var dLp = L2 - L1, dCp = Cp2 - Cp1, dhp;
  if (Cp1 * Cp2 === 0) dhp = 0;
  else if (Math.abs(hp2 - hp1) <= 180) dhp = hp2 - hp1;
  else dhp = hp2 <= hp1 ? hp2 - hp1 + 360 : hp2 - hp1 - 360;
  var dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(radians(dhp / 2));
  var Lbar = (L1 + L2) / 2, Cpbar = (Cp1 + Cp2) / 2, hpbar;
  if (Cp1 * Cp2 === 0) hpbar = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) <= 180) hpbar = (hp1 + hp2) / 2;
  else hpbar = hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2;
  var T = 1 - 0.17 * Math.cos(radians(hpbar - 30)) + 0.24 * Math.cos(radians(2 * hpbar))
    + 0.32 * Math.cos(radians(3 * hpbar + 6)) - 0.20 * Math.cos(radians(4 * hpbar - 63));
  var dTheta = 30 * Math.exp(-Math.pow((hpbar - 275) / 25, 2));
  var Cpbar7 = Math.pow(Cpbar, 7);
  var Rc = 2 * Math.sqrt(Cpbar7 / (Cpbar7 + Math.pow(25, 7)));
  var Sl = 1 + 0.015 * Math.pow(Lbar - 50, 2) / Math.sqrt(20 + Math.pow(Lbar - 50, 2));
  var Sc = 1 + 0.045 * Cpbar, Sh = 1 + 0.015 * Cpbar * T;
  var Rt = -Math.sin(radians(2 * dTheta)) * Rc;
  var dl = dLp / Sl, dc = dCp / Sc, dh = dHp / Sh;
  return Math.sqrt(dl * dl + dc * dc + dh * dh + Rt * dc * dh);
}

function verdictFor(value, pass, warn) { return value >= pass ? 'PASS' : value >= warn ? 'WARN' : 'FAIL'; }
function worstVerdict(items) {
  return items.includes('FAIL') ? 'FAIL' : items.includes('WARN') ? 'WARN' : 'PASS';
}
function check(id, verdict, detail, worst) {
  var result = { id: id, verdict: verdict, detail: detail };
  if (worst) result.worst = worst;
  return result;
}
function circularDistance(a, b) { var distance = Math.abs(a - b) % 360; return Math.min(distance, 360 - distance); }

export function validatePalette(colors, opts = {}) {
  if (!Array.isArray(colors) || colors.length === 0) throw new Error('Palette must contain at least one color');
  var mode = opts.mode || 'light';
  if (mode !== 'light' && mode !== 'dark') throw new Error('Mode must be light or dark');
  var pairMode = opts.pairs || 'adjacent';
  if (pairMode !== 'adjacent' && pairMode !== 'all') throw new Error('Pairs must be adjacent or all');
  var surfaceRgb = asRgb(opts.surface || DEFAULT_SURFACE[mode]);
  var surface = toHex(surfaceRgb);
  var entries = colors.map(function (input) {
    var rgb = parseColor(input);
    return { input: String(input).trim(), hex: toHex(rgb), rgb: rgb, oklch: toOklch(rgb), contrast: contrast(rgb, surfaceRgb) };
  });
  var checks = [];

  if (opts.ordinal) {
    var diffs = entries.slice(1).map(function (entry, i) { return entry.oklch.l - entries[i].oklch.l; });
    var monotone = diffs.length === 0 || diffs.every(function (v) { return v > 0; }) || diffs.every(function (v) { return v < 0; });
    checks.push(check('monotone-lightness', monotone ? 'PASS' : 'FAIL',
      diffs.length ? 'direction ' + (diffs[0] > 0 ? 'rising' : 'falling') + '; ΔL ' + diffs.map(function (v) { return fixed(v, 3); }).join(', ') : 'single step; monotone by definition'));

    var absDiffs = diffs.map(Math.abs);
    if (absDiffs.length === 0) checks.push(check('adjacent-delta-l', 'PASS', 'skipped for a single step'));
    else {
      var minDelta = Math.min.apply(null, absDiffs), deltaSlot = absDiffs.indexOf(minDelta);
      checks.push(check('adjacent-delta-l', verdictFor(minDelta, 0.06, 0.04),
        'minimum |ΔL| ' + fixed(minDelta, 3) + ' at slots ' + (deltaSlot + 1) + '-' + (deltaSlot + 2)));
    }

    var maxHue = 0, hueSlots = [1, 1];
    for (var hi = 0; hi < entries.length; hi++) for (var hj = hi + 1; hj < entries.length; hj++) {
      var spread = circularDistance(entries[hi].oklch.h, entries[hj].oklch.h);
      if (spread > maxHue) { maxHue = spread; hueSlots = [hi + 1, hj + 1]; }
    }
    checks.push(check('single-hue-family', maxHue <= 30 ? 'PASS' : maxHue <= 50 ? 'WARN' : 'FAIL',
      'maximum hue spread ' + fixed(maxHue, 1) + '° at slots ' + hueSlots.join('-')));

    var surfaceL = toOklch(surfaceRgb).l, closest = 0;
    entries.forEach(function (entry, i) {
      if (Math.abs(entry.oklch.l - surfaceL) < Math.abs(entries[closest].oklch.l - surfaceL)) closest = i;
    });
    var endContrast = entries[closest].contrast;
    checks.push(check('light-end-contrast', verdictFor(endContrast, 2, 1.7),
      'slot ' + (closest + 1) + ' is closest to the surface at ' + fixed(endContrast, 2) + ':1'));
  } else {
    var band = BANDS[mode];
    var deviations = entries.map(function (entry) {
      return entry.oklch.l < band[0] ? band[0] - entry.oklch.l : entry.oklch.l > band[1] ? entry.oklch.l - band[1] : 0;
    });
    var lightStates = deviations.map(function (v) { return v === 0 ? 'PASS' : v <= 0.04 ? 'WARN' : 'FAIL'; });
    var lightWorst = deviations.indexOf(Math.max.apply(null, deviations));
    checks.push(check('lightness-band', worstVerdict(lightStates), 'target ' + fixed(band[0], 2) + '-' + fixed(band[1], 2)
      + '; worst slot ' + (lightWorst + 1) + ' L=' + fixed(entries[lightWorst].oklch.l, 3)));

    if (entries.length === 1) checks.push(check('chroma-floor', 'PASS', 'skipped for a single color'));
    else {
      var chromas = entries.map(function (entry) { return entry.oklch.c; });
      var minChroma = Math.min.apply(null, chromas), chromaSlot = chromas.indexOf(minChroma);
      var chromaVerdict = verdictFor(minChroma, 0.10, 0.07);
      var chromaNote = chromaVerdict === 'WARN' ? '; reads as gray, weak identity' : '';
      checks.push(check('chroma-floor', chromaVerdict, 'minimum C ' + fixed(minChroma, 3) + ' at slot ' + (chromaSlot + 1) + chromaNote));
    }

    var pairs = [];
    for (var i = 0; i < entries.length; i++) for (var j = i + 1; j < entries.length; j++) {
      if (pairMode === 'all' || j === i + 1) pairs.push([i, j]);
    }
    if (pairs.length === 0) checks.push(check('cvd-separation', 'PASS', 'skipped for a single color'));
    else {
      var worst = { slots: [1, 2], cvdType: 'protanopia', deltaE: Infinity };
      pairs.forEach(function (pair) {
        ['protanopia', 'deuteranopia'].forEach(function (type) {
          var delta = deltaE2000(toLab(simulateCVD(entries[pair[0]].rgb, type)), toLab(simulateCVD(entries[pair[1]].rgb, type)));
          if (delta < worst.deltaE) worst = { slots: [pair[0] + 1, pair[1] + 1], cvdType: type, deltaE: delta };
        });
      });
      var cvdVerdict = verdictFor(worst.deltaE, 12, 8);
      var cvdNote = cvdVerdict === 'WARN' ? '; floor band — legal only with secondary encoding: direct labels, legend, or the data-table view' : '';
      checks.push(check('cvd-separation', cvdVerdict, 'worst slots ' + worst.slots.join('-') + ' under ' + worst.cvdType
        + ': ΔE00 ' + fixed(worst.deltaE, 2) + cvdNote, worst));
    }

    var ratios = entries.map(function (entry) { return entry.contrast; });
    var minRatio = Math.min.apply(null, ratios), ratioSlot = ratios.indexOf(minRatio);
    var contrastVerdict = verdictFor(minRatio, 3, 2);
    var contrastNote = contrastVerdict === 'WARN' ? '; needs a relief channel: visible labels or table view' : '';
    checks.push(check('surface-contrast', contrastVerdict, 'minimum ' + fixed(minRatio, 2) + ':1 at slot ' + (ratioSlot + 1) + contrastNote));
  }

  var verdict = worstVerdict(checks.map(function (item) { return item.verdict; }));
  return {
    mode: mode, surface: surface, ordinal: Boolean(opts.ordinal),
    colors: entries.map(function (entry) { return { input: entry.input, hex: entry.hex, oklch: entry.oklch, contrast: entry.contrast }; }),
    checks: checks, verdict: verdict,
  };
}

function splitPalette(input) {
  var colors = [], start = 0, depth = 0;
  for (var i = 0; i < input.length; i++) {
    if (input[i] === '(') depth++;
    else if (input[i] === ')') depth--;
    else if (input[i] === ',' && depth === 0) { colors.push(input.slice(start, i).trim()); start = i + 1; }
  }
  colors.push(input.slice(start).trim());
  if (colors.some(function (color) { return !color; })) throw new Error('Palette contains an empty color token');
  return colors;
}

function printHuman(result) {
  var width = Math.max(5, ...result.colors.map(function (color) { return color.input.length; }));
  console.log('SLOT  ' + 'INPUT'.padEnd(width) + '  HEX      L      C      H       CONTRAST');
  result.colors.forEach(function (color, i) {
    console.log(String(i + 1).padEnd(5) + ' ' + color.input.padEnd(width) + '  ' + color.hex + '  '
      + fixed(color.oklch.l, 3).padStart(5) + '  ' + fixed(color.oklch.c, 3).padStart(5) + '  '
      + fixed(color.oklch.h, 1).padStart(6) + '°  ' + (fixed(color.contrast, 2) + ':1').padStart(8));
  });
  console.log('');
  result.checks.forEach(function (item) { console.log(item.verdict.padEnd(4) + '  ' + item.id + ': ' + item.detail); });
  var exit = result.verdict === 'FAIL' ? 1 : 0;
  console.log('OVERALL ' + result.verdict + ' — exit ' + exit + (exit ? ': at least one hard FAIL' : ': no hard FAIL; WARNs allowed'));
}

function usage() {
  return 'Usage: node scripts/validate-palette.mjs "<color>,<color>,..." [flags]\n'
    + 'Flags: --mode light|dark  --surface <color>  --pairs adjacent|all\n'
    + '       --ordinal  --json  --self-test';
}

function assertNear(label, actual, expected, tolerance) {
  if (Math.abs(actual - expected) > tolerance) throw new Error(label + ': expected ' + expected + ', got ' + actual);
}

function runSelfTest() {
  var pairs = [
    [{ l: 50, a: 2.6772, b: -79.7751 }, { l: 50, a: 0, b: -82.7485 }, 2.0425],
    [{ l: 50, a: 3.1571, b: -77.2803 }, { l: 50, a: 0, b: -82.7485 }, 2.8615],
    [{ l: 50, a: 2.8361, b: -74.0200 }, { l: 50, a: 0, b: -82.7485 }, 3.4412],
  ];
  pairs.forEach(function (pair, i) { assertNear('Sharma pair ' + (i + 1), deltaE2000(pair[0], pair[1]), pair[2], 0.05); });
  assertNear('WCAG contrast', contrast('#767676', '#FFFFFF'), 4.54, 0.02);
  assertNear('OKLab white L', toOklch(parseColor('#fff')).l, 1, 0.0001);
  if (toHex(parseColor('hsl(0 100% 50%)')) !== '#FF0000') throw new Error('HSL parse round-trip did not resolve to #FF0000');
  var modeError = '';
  try { validatePalette(['#fff'], { mode: 'toString' }); } catch (error) { modeError = error.message; }
  if (modeError !== 'Mode must be light or dark') throw new Error('Inherited mode name was not rejected');
  var cvdError = '';
  try { simulateCVD(parseColor('#fff'), 'toString'); } catch (error) { cvdError = error.message; }
  if (cvdError !== 'Unknown CVD type "toString"') throw new Error('Inherited CVD type name was not rejected');
  console.log('SELF-TEST PASS (3 Sharma pairs, contrast 4.54, OKLab white L=1.0, HSL, enum guards)');
}

function main(argv) {
  if (argv.includes('--self-test')) {
    try { runSelfTest(); return 0; } catch (error) { console.error('SELF-TEST FAIL: ' + error.message); return 1; }
  }
  if (!argv.length || argv[0].startsWith('--')) { console.error(usage()); return 2; }
  var palette = argv.shift(), opts = {}, json = false;
  try {
    while (argv.length) {
      var flag = argv.shift();
      if (flag === '--ordinal') opts.ordinal = true;
      else if (flag === '--json') json = true;
      else if (flag === '--mode' || flag === '--surface' || flag === '--pairs') {
        if (!argv.length) throw new Error(flag + ' requires a value');
        opts[flag.slice(2)] = argv.shift();
      } else throw new Error('Unknown flag "' + flag + '"');
    }
    var result = validatePalette(splitPalette(palette), opts);
    if (json) console.log(JSON.stringify(result, null, 2)); else printHuman(result);
    return result.verdict === 'FAIL' ? 1 : 0;
  } catch (error) {
    console.error('Error: ' + error.message + '\n' + usage());
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
