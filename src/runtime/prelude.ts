/**
 * Litholang runtime prelude.
 *
 * Provides core built-in functions that are always available in Litho programs.
 * The emitter prepends this code when any prelude function is referenced.
 */

export const PRELUDE_FUNCTIONS = new Set([
  "print",
  "to_text",
  "to_number",
  "length",
  "range",
  "ok",
  "err",
  "some",
  "panic",
  "split",
  "join",
  "trim",
  "starts_with",
  "ends_with",
  "replace_text",
  "to_upper",
  "to_lower",
  "or_else",
  "unwrap_or",
  "now",
  "format_date",
  "add_duration",
  "diff_dates",
]);

export const PRELUDE_CODE = `// --- Litholang Prelude ---
function print(...args: unknown[]): void {
  console.log(...args);
}

function to_text(value: unknown): string {
  return String(value);
}

function to_number(value: unknown): number {
  return Number(value);
}

function length(value: string | unknown[]): number {
  return value.length;
}

function range(start: number, end?: number): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const result: number[] = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
}

function panic(message: string): never {
  throw new Error(message);
}

function split(text: string, delimiter: string): string[] {
  return text.split(delimiter);
}

function join(items: string[], delimiter: string): string {
  return items.join(delimiter);
}

function trim(text: string): string {
  return text.trim();
}

function starts_with(text: string, prefix: string): boolean {
  return text.startsWith(prefix);
}

function ends_with(text: string, suffix: string): boolean {
  return text.endsWith(suffix);
}

function replace_text(text: string, search: string, replacement: string): string {
  return text.replaceAll(search, replacement);
}

function to_upper(text: string): string {
  return text.toUpperCase();
}

function to_lower(text: string): string {
  return text.toLowerCase();
}

function or_else<T>(value: T | null, fallback: T): T {
  return value !== null ? value : fallback;
}

function unwrap_or<T, E>(result: { ok: true; value: T } | { ok: false; error: E }, fallback: T): T {
  return result.ok ? result.value : fallback;
}

function now(): Date {
  return new Date();
}

function format_date(date: Date, format: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return format
    .replace("YYYY", String(date.getFullYear()))
    .replace("MM", pad(date.getMonth() + 1))
    .replace("DD", pad(date.getDate()))
    .replace("HH", pad(date.getHours()))
    .replace("mm", pad(date.getMinutes()))
    .replace("ss", pad(date.getSeconds()));
}

function add_duration(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

function diff_dates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}
`;
