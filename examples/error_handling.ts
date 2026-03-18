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

function __propagateResult<T, E>(result: { ok: true; value: T } | { ok: false; error: E }): T {
  if (!result.ok) throw { __lithoPropagate: true, value: result };
  return result.value;
}

enum Priority {
  Critical,
  High,
  Medium,
  Low,
}

interface Task {
  id: string;
  title: string;
  priority: Priority;
  assignee: string | null;
  estimate: number;
}

function validate_task(title: string, estimate: number): { ok: true; value: Task } | { ok: false; error: string } {
  if (!((title != ""))) return { ok: false, error: "Title cannot be empty" };
  if (!((estimate > 0))) return { ok: false, error: "Estimate must be positive" };
  const task = { id: generate_id(), title: title, priority: Medium, assignee: null, estimate: estimate };
  return { ok: true, value: task };
}

function priority_label(p: Priority): string {
  if (true) {
    const Critical = p;
    return "CRITICAL";
  } else if (true) {
    const High = p;
    return "HIGH";
  } else if (true) {
    const Medium = p;
    return "MEDIUM";
  } else if (true) {
    const Low = p;
    return "LOW";
  }
}

function estimate_category(task: Task): string {
  if (true && (() => { const hours = task.estimate; return (hours >= 40); })()) {
    const hours = task.estimate;
    return "epic";
  } else if (true && (() => { const hours = task.estimate; return (hours >= 8); })()) {
    const hours = task.estimate;
    return "story";
  } else if (true && (() => { const hours = task.estimate; return (hours >= 1); })()) {
    const hours = task.estimate;
    return "task";
  } else if (true) {
    return "subtask";
  }
}

function find_assignee(task: Task): string {
  if (true && (() => { const name = task.assignee; return (name != ""); })()) {
    const name = task.assignee;
    return name;
  } else if (true) {
    return "unassigned";
  }
}

function create_task(title: string, estimate: number = 4): { ok: true; value: Task } | { ok: false; error: string } {
  if (!((title != ""))) return { ok: false, error: "Title is required" };
  const task = { id: generate_id(), title: title, priority: Medium, assignee: null, estimate: estimate };
  return { ok: true, value: task };
}

function assign_and_schedule(title: string, assignee: string): { ok: true; value: Task } | { ok: false; error: string } {
  try {
    const task = __propagateResult(create_task(title));
    const updated = { ...task, assignee: assignee };
    if (!((updated.estimate <= 80))) return { ok: false, error: "Task estimate exceeds sprint capacity" };
    return { ok: true, value: updated };
  } catch (__e: unknown) {
    if (__e && typeof __e === "object" && "__lithoPropagate" in __e) return (__e as { value: unknown }).value;
    throw __e;
  }
}

function max_concurrent(p: Priority): number {
  if (true) {
    const Critical = p;
    return 1;
  } else if (true) {
    const High = p;
    return 3;
  } else if (true) {
    const Medium = p;
    return 5;
  } else if (true) {
    const Low = p;
    return 10;
  }
}
