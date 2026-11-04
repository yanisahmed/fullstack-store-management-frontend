'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { buildQuery } from '@/lib/dateFilter';
import { useI18n } from '@/lib/i18n';
import { Customer } from '@/lib/types';
import { ImageUpload } from './ImageUpload';
import { Button, Field, inputCls, Modal, Notice } from './ui';

/** Add or edit a customer. Checks the phone number against existing customers as you type. */
export function CustomerModal({ customer, onClose, onSaved }: { customer: Customer | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: customer?.name ?? '', phone: customer?.phone ?? '', address: customer?.address ?? '', note: customer?.note ?? '' });
  const [imageToken, setImageToken] = useState<string | null>(customer?.imageToken ?? null);
  const [imgChanged, setImgChanged] = useState(false);
  const [dup, setDup] = useState<{ id: string; name: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (f.phone.replace(/\D/g, '').length < 7) { setDup(null); setChecking(false); return; }
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const r = await api<{ phone: { id: string; name: string } | null }>(`/customers/check?${buildQuery({ phone: f.phone, exclude: customer?._id })}`);
        if (!cancelled) setDup(r.phone);
      } catch { if (!cancelled) setDup(null); }
      if (!cancelled) setChecking(false);
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [f.phone, customer?._id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const photo = imgChanged ? { imageToken } : {}; // null removes the photo
    const body = { name: f.name, phone: f.phone || undefined, address: f.address || undefined, note: f.note || undefined, ...photo };
    try {
      // when editing, send empty strings so a cleared field really is cleared
      await api(customer ? `/customers/${customer._id}` : '/customers', { method: customer ? 'PATCH' : 'POST', body: customer ? { name: f.name, phone: f.phone, address: f.address, note: f.note, ...photo } : body });
      onSaved();
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  }

  return (
    <Modal title={customer ? t('cu.editTitle') : t('cu.addTitle')} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <span className="mb-1 block text-sm font-medium text-ink-soft">{t('img.photo')}</span>
          <ImageUpload kind="customer" token={imageToken} name={f.name} onChange={(tk) => { setImageToken(tk); setImgChanged(true); }} onError={setError} />
        </div>
        <Field label={t('c.name')}><input className={inputCls} required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('c.phone')} hint={checking ? t('cu.checking') : t('cu.phoneHint')}>
          <input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" />
        </Field>
        {dup && (
          <Notice kind="warn">
            {t('err.DUPLICATE_PHONE', { name: dup.name })}{' '}
            <Link href={`/customers/${dup.id}`} className="font-semibold underline">{t('dup.view')}</Link>
          </Notice>
        )}
        <Field label={t('c.address')}><input className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label={t('c.noteOpt')}><input className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t('c.cancel')}</Button>
          <Button disabled={busy || checking || !!dup}>{t('cu.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
