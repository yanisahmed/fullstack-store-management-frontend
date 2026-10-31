'use client';
import { ButtonHTMLAttributes, ReactNode, useEffect } from 'react';

export const money = (n: number) => '৳' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);
export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const inputCls = 'w-full rounded-md border border-ink-line bg-white px-3 py-2 text-sm placeholder:text-ink-muted/60 focus:border-brand';

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  ghost: 'border border-ink-line bg-white text-ink hover:bg-paper',
  danger: 'bg-bad text-white hover:opacity-90',
  quiet: 'text-brand hover:bg-brand-tint',
};
export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button {...p} className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-ink-line bg-white ${className}`}>{children}</div>
);

export function Notice({ kind = 'error', children }: { kind?: 'error' | 'info' | 'success' | 'warn'; children: ReactNode }) {
  const c = { error: 'bg-bad-tint text-bad', info: 'bg-brand-tint text-brand-dark', success: 'bg-ok-tint text-ok', warn: 'bg-marigold-tint text-marigold' }[kind];
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-md px-3.5 py-2.5 text-sm ${c}`}>{children}</div>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 pt-16" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full rounded-lg bg-white p-5 shadow-xl ${wide ? 'max-w-3xl' : 'max-w-md'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded px-2 text-xl leading-none text-ink-muted hover:bg-paper">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="px-4 py-10 text-center text-sm text-ink-muted">{children}</div>;
export const Loading = () => <div className="px-4 py-10 text-center text-sm text-ink-muted">Loading…</div>;

export const Badge = ({ kind = 'neutral', children }: { kind?: 'neutral' | 'warn' | 'ok' | 'bad'; children: ReactNode }) => {
  const c = { neutral: 'bg-paper text-ink-muted', warn: 'bg-marigold-tint text-marigold', ok: 'bg-ok-tint text-ok', bad: 'bg-bad-tint text-bad' }[kind];
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
};

// Ruled, ledger-style table
export const Table = ({ head, children }: { head: ReactNode[]; children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-ink text-left text-ink-muted">
          {head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2.5 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody className="[&>tr]:border-b [&>tr]:border-ink-line [&_td]:px-4 [&_td]:py-2.5">{children}</tbody>
    </table>
  </div>
);
