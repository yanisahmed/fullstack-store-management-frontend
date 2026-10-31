'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button, Card, Empty, Field, inputCls, Loading, Modal, money, Notice, PageHeader, Table } from '@/components/ui';
import { api } from '@/lib/api';
import { Customer } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function Customers() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useFetch<Customer[]>(`/customers?q=${encodeURIComponent(dq)}${dueOnly ? '&hasDue=true' : ''}`);
  const [adding, setAdding] = useState(false);
  const totalDue = data?.reduce((s, c) => s + c.dueBalance, 0) ?? 0;

  return (
    <>
      <PageHeader title="Customers" sub={data ? `${money(totalDue)} outstanding across ${data.filter((c) => c.dueBalance > 0).length} customers` : undefined} action={<Button onClick={() => setAdding(true)}>Add customer</Button>} />
      {error && <Notice>{error}</Notice>}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} /> With dues only</label>
      </div>
      <Card>
        {loading ? <Loading /> : !data?.length ? <Empty>No customers found. Add one to sell on credit and track what they owe.</Empty> : (
          <Table head={['Name', 'Phone', 'Due']}>
            {data.map((c) => (
              <tr key={c._id}>
                <td><Link href={`/customers/${c._id}`} className="font-medium text-brand">{c.name}</Link></td>
                <td className="num text-ink-muted">{c.phone || '-'}</td>
                <td className={`num ${c.dueBalance > 0 ? 'font-medium text-marigold' : 'text-ink-muted'}`}>{money(c.dueBalance)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {adding && <AddCustomer onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
    </>
  );
}

function AddCustomer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', phone: '', address: '' });
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    try { await api('/customers', { method: 'POST', body: { name: f.name, phone: f.phone || undefined, address: f.address || undefined } }); onSaved(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <Modal title="Add customer" onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className={inputCls} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Phone" hint="Needed to send dues on WhatsApp"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXXXXXXXX" /></Field>
        <Field label="Address"><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button>Save customer</Button></div>
      </form>
    </Modal>
  );
}
