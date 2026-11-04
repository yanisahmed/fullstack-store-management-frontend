'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Field, inputCls, Notice } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); router.replace('/'); } catch (err) { setError((err as Error).message); }
    setBusy(false);
  }
  return (
    <AuthShell title={t('auth.signIn')} sub={t('auth.signInSub')} footer={<>{t('auth.newShop')} <Link href="/register" className="font-medium text-brand">{t('auth.createAccount')}</Link></>}>
      {error && <Notice>{error}</Notice>}
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('c.email')}><input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
        <Field label={t('c.password')}><input className={inputCls} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
        <Button className="w-full" disabled={busy}>{busy ? t('auth.signingIn') : t('auth.signIn')}</Button>
      </form>
    </AuthShell>
  );
}
