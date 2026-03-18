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

// --- Litholang Collections ---
function filter<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}

function map<T, U>(items: T[], fn: (item: T) => U): U[] {
  return items.map(fn);
}

function reduce<T, U>(items: T[], fn: (acc: U, item: T) => U, initial: U): U {
  return items.reduce(fn, initial);
}

function flat_map<T, U>(items: T[], fn: (item: T) => U[]): U[] {
  return items.flatMap(fn);
}

function take<T>(items: T[], n: number): T[] {
  return items.slice(0, n);
}

function skip<T>(items: T[], n: number): T[] {
  return items.slice(n);
}

function sort<T>(items: T[], key?: (item: T) => number | string, descending?: boolean): T[] {
  const copy = [...items];
  if (!key) return copy.sort();
  return copy.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
    return descending ? -cmp : cmp;
  });
}

function group<T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

function find<T>(items: T[], predicate: (item: T) => boolean): T | null {
  return items.find(predicate) ?? null;
}

function any_of<T>(items: T[], predicate: (item: T) => boolean): boolean {
  return items.some(predicate);
}

function all_of<T>(items: T[], predicate: (item: T) => boolean): boolean {
  return items.every(predicate);
}

function none_of<T>(items: T[], predicate: (item: T) => boolean): boolean {
  return !items.some(predicate);
}

function zip<T, U>(a: T[], b: U[]): [T, U][] {
  const len = Math.min(a.length, b.length);
  const result: [T, U][] = [];
  for (let i = 0; i < len; i++) {
    result.push([a[i], b[i]]);
  }
  return result;
}

function enumerate<T>(items: T[]): [number, T][] {
  return items.map((item, i) => [i, item]);
}

function first<T>(items: T[]): T | null {
  return items.length > 0 ? items[0] : null;
}

function last<T>(items: T[]): T | null {
  return items.length > 0 ? items[items.length - 1] : null;
}

function count<T>(items: T[]): number {
  return items.length;
}

function sum(items: number[]): number;
function sum<T>(items: T[], key: (item: T) => number): number;
function sum<T>(items: T[], key?: (item: T) => number): number {
  if (key) return items.reduce((acc, item) => acc + key(item), 0);
  return (items as unknown as number[]).reduce((acc, n) => acc + n, 0);
}

function collect<T>(items: Iterable<T>): T[] {
  return Array.from(items);
}

function reverse<T>(items: T[]): T[] {
  return [...items].reverse();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function min(items: number[]): number | null;
function min<T>(items: T[], key: (item: T) => number): T | null;
function min<T>(items: T[], key?: (item: T) => number): T | number | null {
  if (items.length === 0) return null;
  if (key) return items.reduce((best, item) => key(item) < key(best) ? item : best);
  return Math.min(...(items as unknown as number[]));
}

function max(items: number[]): number | null;
function max<T>(items: T[], key: (item: T) => number): T | null;
function max<T>(items: T[], key?: (item: T) => number): T | number | null {
  if (items.length === 0) return null;
  if (key) return items.reduce((best, item) => key(item) > key(best) ? item : best);
  return Math.max(...(items as unknown as number[]));
}

function __propagateResult<T, E>(result: { ok: true; value: T } | { ok: false; error: E }): T {
  if (!result.ok) throw { __lithoPropagate: true, value: result };
  return result.value;
}

interface Student {
  name: string;
  grade: number;
}

function min_max(items: number[]): [number, number] {
  const sorted = sort(items);
  const lo = first(sorted);
  const hi = last(sorted);
  return [lo, hi];
}

function format_range(bounds: [number, number]): string {
  if (true && true && (() => { const lo = bounds[0], const hi = bounds[1]; return (lo == hi); })()) {
    const lo = bounds[0];
    const hi = bounds[1];
    return ("exactly " + to_text(lo));
  } else if (true && true) {
    const lo = bounds[0];
    const hi = bounds[1];
    return ((to_text(lo) + " to ") + to_text(hi));
  }
}

function format_numbered(pair: [number, Student]): string {
  if (true && true) {
    const i = pair[0];
    const s = pair[1];
    return ((to_text((i + 1)) + ". ") + s.name);
  }
}

function numbered_names(students: Student[]): string[] {
  return collect(map(enumerate(students), (pair) => format_numbered(pair)));
}

function make_student(entry: [string, number]): Student {
  if (true && true) {
    const name = entry[0];
    const grade = entry[1];
    return { name: name, grade: grade };
  }
}

function pair_students(names: string[], grades: number[]): Student[] {
  return collect(map(zip(names, grades), (entry) => make_student(entry)));
}

function labeled_range(label: string, items: number[]): [string, [number, number]] {
  const bounds = min_max(items);
  return [label, bounds];
}

function describe_range(data: [string, [number, number]]): string {
  if (true && true && true) {
    const label = data[0];
    const lo = data[1][0];
    const hi = data[1][1];
    return ((((label + ": ") + to_text(lo)) + " to ") + to_text(hi));
  }
}

function divide(a: number, b: number): { ok: true; value: [number, number] } | { ok: false; error: string } {
  if (!((b != 0))) return { ok: false, error: "division by zero" };
  const quotient = (a / b);
  const remainder = (a % b);
  return { ok: true, value: [quotient, remainder] };
}

function format_division(a: number, b: number): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const result = __propagateResult(divide(a, b));
    if (true && true) {
      const q = result[0];
      const r = result[1];
      return { ok: true, value: ((to_text(q) + " remainder ") + to_text(r)) };
    }
  } catch (__e: unknown) {
    if (__e && typeof __e === "object" && "__lithoPropagate" in __e) return (__e as { value: unknown }).value;
    throw __e;
  }
}
