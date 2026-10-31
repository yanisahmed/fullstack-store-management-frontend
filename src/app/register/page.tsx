'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Field, inputCls, Notice } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ storeName: '', name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await register({ ...f, phone: f.phone || undefined }); router.replace('/dashboard'); } catch (err) { setError((err as Error).message); }
    setBusy(false);
  }
  return (
    <AuthShell title="Create your shop" sub="14 days free. No payment needed to start." footer={<>Already registered? <Link href="/login" className="font-medium text-brand">Sign in</Link></>}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Shop name"><input className={inputCls} required value={f.storeName} onChange={set('storeName')} /></Field>
        <Field label="Your name"><input className={inputCls} required value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><input className={inputCls} type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone (optional)"><input className={inputCls} value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Password" hint="At least 8 characters"><input className={inputCls} type="password" minLength={8} required value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Button className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Create shop'}</Button>
      </form>
    </AuthShell>
  );
}
