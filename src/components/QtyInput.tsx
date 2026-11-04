'use client';
import { useI18n } from '@/lib/i18n';
import { inputCls } from './ui';
import { round3 } from '@/lib/units';

export function QtyInput({ unit, value, onChange, label = 'Quantity' }: { unit: string; value: number; onChange: (v: number) => void; label?: string }) {
  const { t } = useI18n();
  if (unit !== 'kg') {
    return <input aria-label={label} className={`${inputCls} num`} type="number" min="0" step="1" value={value}
      onChange={(e) => onChange(Math.max(Math.floor(+e.target.value || 0), 0))} />;
  }
  const v = round3(value);
  const kg = Math.floor(v);
  const g = Math.round((v - kg) * 1000);
  const set = (k: number, gr: number) => onChange(round3(Math.max(k, 0) + Math.max(gr, 0) / 1000));
  return (
    <div className="flex items-center gap-1.5">
      <input aria-label={`${label} kg`} className={`${inputCls} num !w-20`} type="number" min="0" step="1" value={kg} onChange={(e) => set(Math.floor(+e.target.value || 0), g)} />
      <span className="text-sm text-ink-muted">{t('u.kg')}</span>
      <input aria-label={`${label} grams`} className={`${inputCls} num !w-20`} type="number" min="0" step="1" value={g} onChange={(e) => set(kg, Math.floor(+e.target.value || 0))} />
      <span className="text-sm text-ink-muted">{t('u.g')}</span>
    </div>
  );
}
