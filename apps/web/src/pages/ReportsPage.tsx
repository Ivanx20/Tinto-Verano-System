import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';

export function ReportsPage() {
  const { data } = useQuery({ queryKey: ['reports'], queryFn: async () => (await api.get('/reports/dashboard')).data.data });
  const chart = data?.topProducts ?? [];
  return (
    <div className="space-y-6">
      <div>
        <Badge tone="wine">Business Intelligence</Badge>
        <h2 className="mt-3 text-3xl font-black text-wine-900 dark:text-cream">Reportes gerenciales</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Ventas, rentabilidad, producto más vendido, caja, inventario y obligaciones.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle subtitle="Ranking por cantidad">Productos más vendidos</CardTitle>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#8a1020" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle subtitle="Exportables a futuro: PDF, Excel y correo">Catálogo de reportes</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Ventas diarias', 'Ventas mensuales', 'Ventas por cajero', 'Ventas por mesero', 'Utilidad por producto', 'Inventario bajo', 'Cierre de caja', 'Cuentas por cobrar', 'Cuentas por pagar', 'Compras por proveedor'].map((item) => <div key={item} className="rounded-2xl bg-wine-50 p-4 font-bold dark:bg-white/5">{item}</div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
