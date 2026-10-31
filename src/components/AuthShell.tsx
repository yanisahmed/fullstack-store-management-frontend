import Link from 'next/link';
import { ReactNode } from 'react';

export function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <Link href="/" className="text-lg font-semibold">Store Manager</Link>
        <div>
          <p className="max-w-sm text-3xl font-semibold leading-snug">Know what is in stock and who still owes you.</p>
          <p className="mt-4 max-w-sm text-sm text-white/60">Sell, track inventory and send due reminders on WhatsApp from one place.</p>
        </div>
        <div className="num space-y-1.5 border-t border-white/15 pt-4 text-sm text-white/70">
          <div className="flex justify-between"><span>Rahim Traders</span><span className="text-[#F5B84A]">৳ 4,250 due</span></div>
          <div className="flex justify-between"><span>Karim Store</span><span>৳ 0</span></div>
        </div>
      </aside>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-muted">{sub}</p>
          {children}
          <p className="mt-6 text-sm text-ink-muted">{footer}</p>
        </div>
      </section>
    </main>
  );
}
