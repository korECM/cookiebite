// verifier/line-break.mjs — pure helpers for awkward Korean line-end detection.
// DOM measurement lives in dom.js; this module is unit-testable without a browser.

/**
 * Group measured words into visual lines by `top` (px), with a small tolerance.
 * @param {{ word: string, top: number }[]} words
 * @param {number} [tolerance=2]
 * @returns {{ word: string, top: number }[][]}
 */
export function groupWordsByLine(words, tolerance = 2) {
  if (!words.length) return [];
  const lines = [];
  let current = [words[0]];
  let lineTop = words[0].top;
  for (let i = 1; i < words.length; i += 1) {
    const w = words[i];
    if (Math.abs(w.top - lineTop) <= tolerance) {
      current.push(w);
    } else {
      lines.push(current);
      current = [w];
      lineTop = w.top;
    }
  }
  lines.push(current);
  return lines;
}

/** Final word of a non-last line that ends in a connective / conjunction. */
export const AWKWARD_LINE_END = /([가-힣]+[와과의]|및|또는|혹은)$/;

/**
 * @param {{ word: string, top: number }[]} words
 * @returns {{ lineEndWord: string, lineIndex: number }[]}
 */
export function findAwkwardLineBreaks(words) {
  const lines = groupWordsByLine(words);
  const out = [];
  for (let i = 0; i < lines.length - 1; i += 1) {
    const line = lines[i];
    const last = line[line.length - 1];
    if (last && AWKWARD_LINE_END.test(last.word)) {
      out.push({ lineEndWord: last.word, lineIndex: i });
    }
  }
  return out;
}
