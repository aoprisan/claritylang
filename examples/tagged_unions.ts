// --- Litholang Prelude ---
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

type Shape = { kind: "Circle"; radius: number } | { kind: "Rectangle"; width: number; height: number } | { kind: "Point" };
function Circle(radius: number): Shape { return { kind: "Circle", radius }; }
function Rectangle(width: number, height: number): Shape { return { kind: "Rectangle", width, height }; }
function Point(): Shape { return { kind: "Point" }; }

function area(s: Shape): number {
  if (s.kind === "Circle") {
    const r = s;
    ((r * r) * 3.14159);
  } else if (s.kind === "Rectangle") {
    const dims = s;
    dims;
  } else if (true) {
    const Point = s;
    0;
  }
}

function classify_status(status: string): string {
  if ((status === "active" || status === "pending")) {
    "open";
  } else if ((status === "closed" || status === "archived")) {
    "done";
  } else if (true) {
    "unknown";
  }
}

function first_ten(): number[] {
  return range(1, 10);
}

function countdown(n: number): number {
  const result = n;
  while ((result > 0)) {
    const result = (result - 1);
  }
  return result;
}
