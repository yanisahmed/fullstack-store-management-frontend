'use client';
import Link from 'next/link';
import { Badge, Card, Empty, Loading, money, PageHeader, Table } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Customer, Paged, SaleRow, SalesSummary } from '@/lib/types';
import { formatQty } from '@/lib/units';
import { useFetch } from '@/lib/useFetch';

interface StockSummary { totals: { products: number; pcs: number; kg: number; costValue: number; retailValue: number }; outOfStock: number; lowStock: { _id: string; name: string; unit: 'pcs' | 'kg'; stock: number; lowStockThreshold: number }[] }

export default function Dashboard() {
  const { hasModule, store, user } = useAuth();
  const { t } = useI18n();
  const stock = useFetch<StockSummary>(hasModule('products') ? '/products/stock-summary' : null);
  const dues = useFetch<Customer[]>(hasModule('customers') ? '/customers?hasDue=true' : null);
  const sales = useFetch<Paged<SaleRow>>(hasModule('sales') ? '/sales?limit=6' : null);
  const today = useFetch<SalesSummary>(hasModule('sales') ? '/sales/summary?preset=today' : null);
  const month = useFetch<SalesSummary>(hasModule('sales') ? '/sales/summary?preset=this_month' : null);
  const totalDue = dues.data?.reduce((s, c) => s + c.dueBalance, 0) ?? 0;

  return (
    <>
      <PageHeader title={t('d.welcome', { name: user?.name.split(' ')[0] ?? '' })} sub={store?.name} />
      {!hasModule('products') && !hasModule('sales') && !hasModule('customers') && (
        <Card><Empty>{t('d.noModules')} <Link href="/billing" className="font-medium text-brand">{t('d.choosePlan')}</Link> {t('d.toStart')}</Empty></Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {today.data && <Stat label={t('d.today', { n: today.data.count })} value={money(today.data.total)} />}
        {month.data && <Stat label={t('d.month', { n: month.data.count })} value={money(month.data.total)} />}
        {month.data?.profit !== undefined && <Stat label={t('d.profitMonth')} value={money(month.data.profit)} />}
        {hasModule('customers') && dues.data && <Stat label={t('d.owe')} value={money(totalDue)} warn={totalDue > 0} />}
        {stock.data && <Stat label={t('d.products')} value={String(stock.data.totals.products)} />}
        {stock.data && <Stat label={t('d.inStock')} value={[stock.data.totals.pcs ? formatQty(stock.data.totals.pcs, 'pcs') : '', stock.data.totals.kg ? formatQty(stock.data.totals.kg, 'kg') : ''].filter(Boolean).join(' + ') || '0'} />}
        {stock.data && <Stat label={t('d.stockValue')} value={money(stock.data.totals.costValue)} />}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {hasModule('products') && (
          <Card>
            <h2 className="px-4 pt-4 font-semibold">{t('d.low')}</h2>
            {stock.loading ? <Loading /> : !stock.data?.lowStock.length ? <Empty>{t('d.allAbove')}</Empty> : (
              <Table head={[t('th.product'), t('d.left'), '']}>
                {stock.data.lowStock.slice(0, 8).map((p) => (
                  <tr key={p._id}><td>{p.name}</td><td className="num">{formatQty(p.stock, p.unit)}</td><td>{p.stock === 0 ? <Badge kind="bad">{t('d.out')}</Badge> : <Badge kind="warn">{t('d.lowBadge')}</Badge>}</td></tr>
                ))}
              </Table>
            )}
          </Card>
        )}
        {hasModule('customers') && (
          <Card>
            <h2 className="px-4 pt-4 font-semibold">{t('d.unpaid')}</h2>
            {dues.loading ? <Loading /> : !dues.data?.length ? <Empty>{t('d.nobody')}</Empty> : (
              <Table head={[t('th.customer'), t('c.due')]}>
                {[...dues.data].sort((a, b) => b.dueBalance - a.dueBalance).slice(0, 8).map((c) => (
                  <tr key={c._id}><td><Link href={`/customers/${c._id}`} className="font-medium text-brand">{c.name}</Link></td><td className="num font-medium text-marigold">{money(c.dueBalance)}</td></tr>
                ))}
              </Table>
            )}
          </Card>
        )}
        {hasModule('sales') && (
          <Card className="xl:col-span-2">
            <h2 className="px-4 pt-4 font-semibold">{t('d.recent')}</h2>
            {sales.loading ? <Loading /> : !sales.data?.items.length ? <Empty>{t('d.noSales')} <Link href="/sales/new" className="font-medium text-brand">{t('d.firstSale')}</Link></Empty> : (
              <Table head={[t('th.invoice'), t('th.customer'), t('c.total'), t('c.due')]}>
                {sales.data.items.map((s) => (
                  <tr key={s._id}><td className="num">{s.invoiceNo}</td><td>{s.customerId?.name ?? t('c.walkin')}</td><td className="num">{money(s.total)}</td><td className={`num ${s.dueAmount ? 'text-marigold' : 'text-ink-muted'}`}>{money(s.dueAmount)}</td></tr>
                ))}
              </Table>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card className={`p-4 ${warn ? 'border-marigold/40' : ''}`}>
      <div className="text-sm text-ink-muted">{label}</div>
      <div className={`num mt-1 text-2xl font-semibold ${warn ? 'text-marigold' : ''}`}>{value}</div>
    </Card>
  );
}
