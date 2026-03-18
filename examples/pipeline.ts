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

interface Sale {
  date: Date;
  status: string;
  category: string;
  amount: number;
}

interface Report {
  date: Date;
  total_revenue: number;
  transaction_count: number;
  by_category: string[];
  generated_at: Timestamp;
}

function daily_report(date: Date): { ok: true; value: Report } | { ok: false; error: Error } {
  const completed = collect(filter(filter(db.sales, (__it) => (__it.date == date)), (__it) => (__it.status == "completed")));
  const by_category = sort(group(completed, (__it) => __it.category), (__it) => __it.total, descending);
  const total_revenue = sum(completed, (__it) => __it.amount);
  const count = completed.length;
  const report = { date: date, total_revenue: total_revenue, transaction_count: count, by_category: by_category, generated_at: now() };
  return { ok: true, value: report };
}

function format_line(entry: [number, Sale]): string {
  if (true && true) {
    const i = entry[0];
    const sale = entry[1];
    return ((((to_text((i + 1)) + ". ") + sale.category) + ": $") + to_text(sale.amount));
  }
}

function numbered_receipt(sales: Sale[]): string[] {
  return collect(map(enumerate(sales), (entry) => format_line(entry)));
}

function compare_days(today: Sale[], yesterday: Sale[]): [number, number][] {
  const today_amounts = collect(map(today, (__it) => __it.amount));
  const yesterday_amounts = collect(map(yesterday, (__it) => __it.amount));
  return collect(zip(today_amounts, yesterday_amounts));
}

function compute_delta(pair: [number, number]): number {
  if (true && true) {
    const today_amt = pair[0];
    const yesterday_amt = pair[1];
    return (today_amt - yesterday_amt);
  }
}

function revenue_deltas(pairs: [number, number][]): number[] {
  return collect(map(pairs, (p) => compute_delta(p)));
}
