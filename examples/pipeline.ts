export interface Report {
  date: Date;
  total_revenue: number;
  transaction_count: number;
  by_category: string[];
  generated_at: Timestamp;
}

export function daily_report(date: Date): { ok: true; value: Report } | { ok: false; error: Error } {
  const completed = collect(filter(db.sales, (s) => (s.date == date)));
  const by_category = group(completed, (s) => s.category);
  const total_revenue = sum(completed, (s) => s.amount);
  const count = completed.length;
  const report = { date: date, total_revenue: total_revenue, transaction_count: count, by_category: by_category, generated_at: now() };
  return { ok: true, value: report };
}
