import { useQuery } from '@tanstack/react-query';
import { Activity, BadgeDollarSign, Boxes, CreditCard, ReceiptText, Table2, TrendingUp, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

const fallback = {
  metrics: { todaySales: 0, monthSales: 0, totalOrders: 0, averageTicket: 0, occupiedTables: 0, lowStock: 0, receivableBalance: 0, payableBalance: 0 },
  topProducts: [],
  salesChart: []
};

export function DashboardPage() {
  const { data = fallback, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/reports/dashboard')).data.data
  });

  const metrics = [
    { label: 'Ventas de hoy', value: `$${Number(data.metrics.todaySales).toFixed(2)}`, icon: BadgeDollarSign },
    { label: 'Ventas del mes', value: `$${Number(data.metrics.monthSales).toFixed(2)}`, icon: TrendingUp },
    { label: 'Órdenes', value: data.metrics.totalOrders, icon: ReceiptText },
    { label: 'Ticket promedio', value: `$${Number(data.metrics.averageTicket).toFixed(2)}`, icon: CreditCard },
    { label: 'Mesas ocupadas', value: data.metrics.occupiedTables, icon: Table2 },
    { label: 'Stock bajo', value: data.metrics.lowStock, icon: Boxes },
    { label: 'Por cobrar', value: `$${Number(data.metrics.receivableBalance).toFixed(2)}`, icon: WalletCards },
    { label: 'Por pagar', value: `$${Number(data.metrics.payableBalance).toFixed(2)}`, icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge tone="wine">Panel gerencial</Badge>
          <h2 className="mt-3 text-3xl font-black text-wine-900 dark:text-cream">Resumen operativo</h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Ventas, mesas, inventario, caja y obligaciones en una sola vista.</p>
        </div>
        <p className="text-sm text-zinc-500">{isLoading ? 'Cargando...' : 'Datos en tiempo real'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-wine-900 dark:text-cream">{item.value}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-300/20 text-gold-500"><Icon /></div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <Card>
          <CardTitle subtitle="Comportamiento mensual">Ventas recientes</CardTitle>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesChart}>
                <defs><linearGradient id="sales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d6a044" stopOpacity={0.8}/><stop offset="95%" stopColor="#d6a044" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#8a1020" fill="url(#sales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle subtitle="Ranking de demanda">Productos más vendidos</CardTitle>
          <div className="space-y-3">
            {data.topProducts.map((p: any, idx: number) => (
              <div key={p.productId} className="flex items-center justify-between rounded-2xl bg-wine-50 p-4 dark:bg-white/5">
                <div>
                  <p className="font-bold text-wine-900 dark:text-cream">{idx + 1}. {p.name}</p>
                  <p className="text-sm text-zinc-500">Cantidad: {p.quantity}</p>
                </div>
                <Badge tone="gold">${Number(p.total).toFixed(2)}</Badge>
              </div>
            ))}
            {!data.topProducts.length && <p className="text-sm text-zinc-500">Sin ventas registradas todavía.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
