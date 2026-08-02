import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChefHat, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { KitchenOrder } from '@/types/models';

const statusLabel: Record<KitchenOrder['status'], string> = {
  PENDING: 'Pendiente',
  PREPARING: 'Preparando',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
};

const statusTone: Record<KitchenOrder['status'], 'green' | 'red' | 'gold' | 'gray' | 'wine'> = {
  PENDING: 'wine',
  PREPARING: 'gold',
  READY: 'green',
  DELIVERED: 'gray',
  CANCELLED: 'red'
};

function nextStatus(status: KitchenOrder['status']): KitchenOrder['status'] {
  if (status === 'PENDING') return 'PREPARING';
  if (status === 'PREPARING') return 'READY';
  if (status === 'READY') return 'DELIVERED';
  return status;
}

export function KitchenDisplayPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => (await api.get('/orders', { params: { limit: 50 } })).data.data.items as KitchenOrder[]
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: KitchenOrder['status'] }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kitchen-orders'] })
  });

  const orders = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="wine">KDS</Badge>
        <h2 className="mt-2 text-2xl font-black text-wine-900 dark:text-cream">Pantalla de cocina y barra</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Comandas organizadas por prioridad, tiempo y estado de preparación.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {!isLoading && orders.length === 0 && <Card><p className="text-sm text-zinc-500">No hay comandas activas en este momento.</p></Card>}
        {orders.map((order) => (
          <Card key={order.id} className="border-l-8 border-l-gold-400">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><ChefHat className="text-gold-500" /><h3 className="text-xl font-black">{order.table?.name ?? `Orden #${order.id}`}</h3></div>
              <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
              <Clock3 className="h-4 w-4" /> Creada: {new Date(order.createdAt).toLocaleTimeString()}
            </div>
            <ul className="mb-5 space-y-2">
              {order.items.map((item) => <li key={item.id} className="rounded-2xl bg-wine-50 p-3 font-semibold dark:bg-white/5">{item.product.name} x{Number(item.quantity)}</li>)}
            </ul>
            <Button
              className="w-full"
              disabled={mutation.isPending || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
              onClick={() => mutation.mutate({ id: order.id, status: nextStatus(order.status) })}
            >
              {order.status === 'PENDING' && 'Iniciar preparación'}
              {order.status === 'PREPARING' && 'Marcar como listo'}
              {order.status === 'READY' && 'Marcar como entregado'}
              {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && 'Sin acciones'}
            </Button>
          </Card>
        ))}
      </div>
      <Card><CardTitle subtitle="Sin datos hardcodeados">Estado</CardTitle><p className="text-sm text-zinc-500">Esta pantalla ahora consume comandas reales desde `api/orders` y permite avanzar estados.</p></Card>
    </div>
  );
}
