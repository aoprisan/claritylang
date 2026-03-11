import { Position } from "../parser/ast.js";

// ─── Diagnostic Severity ───

export type Severity = "error" | "warning";

// ─── Diagnostic ───

export interface Diagnostic {
  message: string;
  position: Position;
  severity: Severity;
  suggestion?: string;
}

// ─── Formatting ───

/**
 * Format a diagnostic with source context, caret, and optional suggestion.
 *
 * Example output:
 *
 *   error[3:10]: Unknown variable 'nme'
 *     |
 *   3 |   return nme
 *     |          ^^^
 *     = did you mean 'name'?
 */
export function formatDiagnostic(
  source: string,
  diagnostic: Diagnostic,
): string {
  const { message, position, severity, suggestion } = diagnostic;
  const lines = source.split("\n");
  const lineIndex = position.line - 1;

  const header = `${severity}[${position.line}:${position.column}]: ${message}`;

  if (lineIndex < 0 || lineIndex >= lines.length) {
    return header;
  }

  const sourceLine = lines[lineIndex];
  const lineNum = String(position.line);
  const gutter = " ".repeat(lineNum.length);

  // Build the caret line: point at the column, extend over the word
  const wordLength = getWordLengthAt(sourceLine, position.column - 1);
  const padding = " ".repeat(Math.max(0, position.column - 1));
  const carets = "^".repeat(Math.max(1, wordLength));

  const parts = [
    header,
    `${gutter} |`,
    `${lineNum} | ${sourceLine}`,
    `${gutter} | ${padding}${carets}`,
  ];

  if (suggestion) {
    parts.push(`${gutter} = did you mean '${suggestion}'?`);
  }

  return parts.join("\n");
}

/**
 * Format multiple diagnostics separated by blank lines.
 */
export function formatDiagnostics(
  source: string,
  diagnostics: Diagnostic[],
): string {
  return diagnostics
    .map((d) => formatDiagnostic(source, d))
    .join("\n\n");
}

// ─── "Did you mean?" suggestions ───

/**
 * Find the closest match for `name` among `candidates` using
 * Levenshtein distance. Returns the best match if the distance
 * is within a reasonable threshold, or undefined otherwise.
 */
export function suggest(
  name: string,
  candidates: string[],
): string | undefined {
  if (candidates.length === 0) return undefined;

  let best: string | undefined;
  let bestDist = Infinity;

  for (const candidate of candidates) {
    const dist = levenshtein(name, candidate);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }

  // Allow up to ~40% of the longer string's length, minimum 2
  const maxDist = Math.max(2, Math.ceil(Math.max(name.length, (best ?? "").length) * 0.4));
  if (bestDist <= maxDist && best !== name) {
    return best;
  }

  return undefined;
}

// ─── Helpers ───

/**
 * Get the length of the word (identifier/keyword/literal) at `col` in `line`.
 */
function getWordLengthAt(line: string, col: number): number {
  if (col < 0 || col >= line.length) return 1;

  // If it's a word character, extend to the end of the word
  if (/\w/.test(line[col])) {
    let end = col;
    while (end < line.length && /\w/.test(line[end])) end++;
    return end - col;
  }

  // For operators or other single chars
  return 1;
}

/**
 * Standard Levenshtein distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use single-row optimization
  const row = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        row[j] + 1,       // deletion
        row[j - 1] + 1,   // insertion
        prev + cost,       // substitution
      );
      prev = row[j];
      row[j] = val;
    }
  }

  return row[n];
}
