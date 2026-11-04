'use client';
import { DateFilterValue, PERIODS } from '@/lib/dateFilter';
import { Key, useI18n } from '@/lib/i18n';
import { inputCls } from './ui';

export function DateFilter({ value, onChange }: { value: DateFilterValue; onChange: (v: DateFilterValue) => void }) {
  const { t } = useI18n();
  const set = (patch: Partial<DateFilterValue>) => onChange({ ...value, ...patch });
  const lbl = 'mb-1 block text-xs font-medium text-ink-muted';
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label><span className={lbl}>{t('p.label')}</span>
        <select className={`${inputCls} !w-auto`} value={value.period} onChange={(e) => set({ period: e.target.value })}>
          {PERIODS.map((p) => <option key={p} value={p}>{t(`p.${p}` as Key)}</option>)}
        </select>
      </label>
      {value.period === 'month' && <label><span className={lbl}>{t('p.monthLbl')}</span><input className={`${inputCls} !w-auto`} type="month" value={value.month} onChange={(e) => set({ month: e.target.value })} /></label>}
      {value.period === 'year' && <label><span className={lbl}>{t('p.yearLbl')}</span><input className={`${inputCls} num !w-24`} type="number" min="2000" max="2100" value={value.year} onChange={(e) => set({ year: e.target.value })} /></label>}
      {value.period === 'custom' && (
        <>
          <label><span className={lbl}>{t('p.from')}</span><input className={`${inputCls} !w-auto`} type="date" value={value.from} max={value.to || undefined} onChange={(e) => set({ from: e.target.value })} /></label>
          <label><span className={lbl}>{t('p.to')}</span><input className={`${inputCls} !w-auto`} type="date" value={value.to} min={value.from || undefined} onChange={(e) => set({ to: e.target.value })} /></label>
        </>
      )}
    </div>
  );
}
