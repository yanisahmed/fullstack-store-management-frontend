export type DateFilterValue = { period: string; month: string; year: string; from: string; to: string };

export const PERIODS = ['all', 'today', 'yesterday', 'this_week', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'month', 'year', 'custom'] as const;

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
