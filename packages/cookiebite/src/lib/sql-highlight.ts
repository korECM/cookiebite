// Minimal SQL tokenizer for the collapsed query panel. Not a parser — it only
// needs to tell keywords, literals, and comments apart well enough to read.

export type SqlTokenKind = 'keyword' | 'string' | 'number' | 'comment' | 'plain';

export interface SqlToken {
  kind: SqlTokenKind;
  text: string;
}

const KEYWORDS = new Set([
  'select', 'from', 'where', 'group', 'order', 'by', 'having', 'limit', 'offset',
  'join', 'left', 'right', 'inner', 'outer', 'full', 'cross', 'on', 'using',
  'and', 'or', 'not', 'in', 'is', 'null', 'like', 'between', 'exists',
  'as', 'distinct', 'case', 'when', 'then', 'else', 'end', 'with', 'union',
  'all', 'asc', 'desc', 'over', 'partition', 'qualify', 'unnest', 'cast',
  'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'replace',
  'table', 'view', 'if', 'interval', 'true', 'false',
]);

// Order matters: comments and strings win before a bare word can be scanned.
const PATTERN =
  /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^']|'')*'|"(?:[^"]|"")*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * Splits SQL into display tokens. Every character of the input is preserved, so
 * joining the token texts round-trips back to the original source.
 */
export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let cursor = 0;

  const pushPlain = (text: string) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === 'plain') last.text += text;
    else tokens.push({ kind: 'plain', text });
  };

  PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PATTERN.exec(sql)) !== null) {
    pushPlain(sql.slice(cursor, match.index));
    const [text, comment, string, number, word] = match;
    if (comment) tokens.push({ kind: 'comment', text });
    else if (string) tokens.push({ kind: 'string', text });
    else if (number) tokens.push({ kind: 'number', text });
    else if (word && KEYWORDS.has(word.toLowerCase())) {
      tokens.push({ kind: 'keyword', text });
    } else pushPlain(text);
    cursor = match.index + text.length;
  }
  pushPlain(sql.slice(cursor));

  return tokens;
}
