export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

import { translate } from './i18n';

/** 2.5 kg -> "2 kg 500 g" (or "2 কেজি 500 গ্রাম"), 0.25 -> "250 g", 12 pcs -> "12 pcs" */
export function formatQty(q: number, unit: string) {
  const n = round3(q);
  if (unit !== 'kg') return `${n} ${translate('u.pcs')}`;
  const kg = Math.floor(n);
  const g = Math.round((n - kg) * 1000);
  const K = translate('u.kg'), G = translate('u.g');
  if (kg && g) return `${kg} ${K} ${g} ${G}`;
  return kg ? `${kg} ${K}` : `${g} ${G}`;
}
