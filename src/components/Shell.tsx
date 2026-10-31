'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ModuleName } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';
import { fmtDate } from './ui';

interface NavItem { href: string; label: string; module?: ModuleName; roles?: ('admin' | 'superuser')[] }
const STORE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sales/new', label: 'New sale', module: 'sales' },
  { href: '/sales', label: 'Sales history', module: 'sales' },
  { href: '/products', label: 'Products', module: 'products' },
  { href: '/customers', label: 'Customers', module: 'customers' },
  { href: '/notifications', label: 'Notifications', module: 'notifications' },
  { href: '/users', label: 'Team', roles: ['admin'] },
  { href: '/billing', label: 'Plan & billing', roles: ['admin'] },
];
const ADMIN_NAV: NavItem[] = [
  { href: '/admin/stores', label: 'Stores' },
  { href: '/admin/plans', label: 'Plans' },
];

export function Shell({ children }: { children: ReactNode }) {
  const { user, store, logout, isRole, hasModule, expired } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const superuser = isRole('superuser');
  const unread = useFetch<{ unreadCount: number }>(hasModule('notifications') && !superuser ? '/notifications?unread=true' : null);
  const nav = (superuser ? ADMIN_NAV : STORE_NAV).filter((n) => !n.roles || isRole(...n.roles));
  const active = (h: string) => (h === '/sales' ? path === '/sales' : path === h || path.startsWith(h + '/'));

  const sub = store?.subscription;
  const banner = !superuser && store && (expired
    ? { kind: 'bad', text: 'Your subscription has expired. Renew to keep using products, sales and customers.' }
    : sub?.status === 'trial' ? { kind: 'warn', text: `Free trial ends on ${fmtDate(sub.expiresAt)}.` } : null);

  const links = (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Main">
      {nav.map((n) => {
        const locked = n.module && !hasModule(n.module);
        return (
          <Link key={n.href} href={locked ? '/billing' : n.href} onClick={() => setOpen(false)}
            className={`flex items-center justify-between rounded-md border-l-[3px] px-3 py-2 text-sm ${active(n.href) && !locked ? 'border-[#F5B84A] bg-white/10 font-medium text-white' : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'} ${locked ? 'opacity-50' : ''}`}>
            <span>{n.label}</span>
            {locked ? <span className="text-xs">Locked</span> : n.module === 'notifications' && !!unread.data?.unreadCount && <span className="num rounded-full bg-[#F5B84A] px-1.5 text-xs font-semibold text-ink">{unread.data.unreadCount}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="hidden bg-ink lg:block">
        <div className="px-6 pb-2 pt-5"><div className="font-semibold text-white">{store?.name ?? 'Store Manager'}</div><div className="text-xs text-white/50">{superuser ? 'Platform admin' : user?.roles.join(', ')}</div></div>
        {links}
        <button onClick={logout} className="mx-6 mt-4 text-sm text-white/60 hover:text-white">Sign out</button>
      </aside>

      <header className="flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <span className="font-semibold">{store?.name ?? 'Store Manager'}</span>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="rounded border border-white/30 px-3 py-1 text-sm">Menu</button>
      </header>
      {open && <div className="bg-ink lg:hidden">{links}<button onClick={logout} className="mx-6 mb-4 text-sm text-white/60">Sign out</button></div>}

      <main className="min-w-0 p-4 sm:p-8">
        {banner && <div className={`mb-6 rounded-md px-4 py-2.5 text-sm ${banner.kind === 'bad' ? 'bg-bad-tint text-bad' : 'bg-marigold-tint text-marigold'}`}>{banner.text} {isRole('admin') && <Link href="/billing" className="font-semibold underline">View plans</Link>}</div>}
        {children}
      </main>
    </div>
  );
}
