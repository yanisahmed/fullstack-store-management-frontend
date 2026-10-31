export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

/** 2.5 kg -> "2 kg 500 g", 0.25 -> "250 g", 12 pcs -> "12 pcs" */
export function formatQty(q: number, unit: string) {
  const n = round3(q);
  if (unit !== 'kg') return `${n} ${unit}`;
  const kg = Math.floor(n);
  const g = Math.round((n - kg) * 1000);
  if (kg && g) return `${kg} kg ${g} g`;
  return kg ? `${kg} kg` : `${g} g`;
}
