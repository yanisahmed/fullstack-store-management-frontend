export type DateFilterValue = { period: string; month: string; year: string; from: string; to: string };

export const PERIODS: { value: string; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'month', label: 'Pick a month' },
  { value: 'year', label: 'Pick a year' },
  { value: 'custom', label: 'Custom dates' },
];

export function defaultDateFilter(period = 'all'): DateFilterValue {
  const n = new Date();
  return { period, month: `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`, year: String(n.getFullYear()), from: '', to: '' };
}

/** Query params the API understands (see apps/api/src/common/dateRange.ts) */
export function dateParams(v: DateFilterValue): Record<string, string> {
  switch (v.period) {
    case 'all': return {};
    case 'month': return v.month ? { month: v.month } : {};
    case 'year': return v.year ? { year: v.year } : {};
    case 'custom': return { ...(v.from && { from: v.from }), ...(v.to && { to: v.to }) };
    default: return { preset: v.period };
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, val] of Object.entries(params)) if (val !== undefined && val !== null && val !== '' && val !== false) q.set(k, String(val));
  return q.toString();
}
