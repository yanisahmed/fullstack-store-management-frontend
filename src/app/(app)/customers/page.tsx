'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CustomerModal } from '@/components/CustomerModal';
import { Thumb } from '@/components/Thumb';
import { Button, Card, Empty, inputCls, Loading, money, Notice, PageHeader, Table } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { Customer } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Customers() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setDq(q), 300); return () => clearTimeout(timer); }, [q]);
  const { data, loading, error, reload } = useFetch<Customer[]>(`/customers?q=${encodeURIComponent(dq)}${dueOnly ? '&hasDue=true' : ''}`);
  const [editing, setEditing] = useState<Customer | 'new' | null>(null);
  const totalDue = data?.reduce((s, c) => s + c.dueBalance, 0) ?? 0;

  return (
    <>
      <PageHeader title={t('cu.title')} sub={data ? t('cu.sub', { amt: money(totalDue), n: data.filter((c) => c.dueBalance > 0).length }) : undefined} action={<Button onClick={() => setEditing('new')}>{t('cu.add')}</Button>} />
      {error && <Notice>{error}</Notice>}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder={t('cu.search')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('cu.search')} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} /> {t('cu.dueOnly')}</label>
      </div>
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>{t('cu.none')}</Empty> : (
          <Table head={[t('c.name'), t('c.phone'), t('c.due'), '']}>
            {data.map((c) => (
              <tr key={c._id}>
                <td><Link href={`/customers/${c._id}`} className="flex items-center gap-3 font-medium text-brand"><Thumb token={c.imageToken} name={c.name} size={36} round />{c.name}</Link></td>
                <td className="num text-ink-muted">{c.phone || '-'}</td>
                <td className={`num ${c.dueBalance > 0 ? 'font-medium text-marigold' : 'text-ink-muted'}`}>{money(c.dueBalance)}</td>
                <td className="text-right"><Button variant="quiet" onClick={() => setEditing(c)}>{t('c.edit')}</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {editing && <CustomerModal customer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
