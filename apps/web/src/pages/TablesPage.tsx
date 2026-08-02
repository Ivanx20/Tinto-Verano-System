import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Armchair, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { api, getList } from '@/lib/api';
import type { Customer, Order, Product, RestaurantTable } from '@/types/models';

const statusLabel: Record<RestaurantTable['status'], string> = {
  FREE: 'Libre',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  CLEANING: 'Limpieza',
  BILL_REQUESTED: 'Cuenta solicitada'
};

const statusTone: Record<RestaurantTable['status'], 'green' | 'red' | 'gold' | 'gray' | 'wine'> = {
  FREE: 'green',
  OCCUPIED: 'red',
  RESERVED: 'gold',
  CLEANING: 'gray',
  BILL_REQUESTED: 'wine'
};

export function TablesPage() {
  const qc = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<Array<{ productId: number; quantity: number; name: string }>>([]);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('CASH');
  const [checkoutCustomerId, setCheckoutCustomerId] = useState<string>('');
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutServiceFee, setCheckoutServiceFee] = useState(0);
  const [mixedPayments, setMixedPayments] = useState<Array<{ method: string; amount: number }>>([{ method: 'CASH', amount: 0 }]);

  const { data } = useQuery({ queryKey: ['tables'], queryFn: () => getList<RestaurantTable>('/tables') });
  const productsQuery = useQuery({ queryKey: ['table-order-products'], queryFn: () => getList<Product>('/products') });
  const customersQuery = useQuery({ queryKey: ['table-order-customers'], queryFn: () => getList<Customer>('/customers') });
  const readyOrdersQuery = useQuery({
    queryKey: ['ready-orders-for-billing'],
    queryFn: () => getList<Order>('/orders?status=READY&limit=200')
  });
  const readyOrders = readyOrdersQuery.data?.items ?? [];

  const availableProducts = useMemo(() => (productsQuery.data?.items ?? []).filter((product) => product.isAvailable), [productsQuery.data?.items]);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RestaurantTable['status'] }) => api.patch(`/tables/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] })
  });

  const takeOrderMutation = useMutation({
    mutationFn: () =>
      api.post('/orders/take', {
        tableId: selectedTable?.id,
        notes: notes.trim() || null,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      }),
    onSuccess: () => {
      setSelectedTable(null);
      setNotes('');
      setCart([]);
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: (orderId: number) =>
      api.post(`/orders/${orderId}/checkout`, {
        paymentMethod: checkoutPaymentMethod,
        customerId: checkoutCustomerId ? Number(checkoutCustomerId) : null,
        discount: checkoutDiscount,
        serviceFee: checkoutServiceFee,
        payments: checkoutPaymentMethod === 'MIXED' ? mixedPayments : undefined
      }),
    onSuccess: () => {
      setSelectedOrder(null);
      setCheckoutPaymentMethod('CASH');
      setCheckoutCustomerId('');
      setCheckoutDiscount(0);
      setCheckoutServiceFee(0);
      setMixedPayments([{ method: 'CASH', amount: 0 }]);
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['kitchen-orders'] });
      qc.invalidateQueries({ queryKey: ['ready-orders-for-billing'] });
      qc.invalidateQueries({ queryKey: ['sales'] });
    }
  });

  function addItem(product: Product) {
    setCart((current) => {
      const exists = current.find((item) => item.productId === product.id);
      if (exists) return current.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { productId: product.id, quantity: 1, name: product.name }];
    });
  }

  function removeItem(productId: number) {
    setCart((current) => current.flatMap((item) => (item.productId === productId ? (item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []) : [item])));
  }

  const checkoutSummary = (() => {
    if (!selectedOrder?.items?.length) return { subtotal: 0, taxable: 0, tax: 0, total: 0 };
    const subtotal = selectedOrder.items.reduce((sum, item) => sum + Number(item.product.price) * Number(item.quantity), 0);
    const taxable = Math.max(0, subtotal - checkoutDiscount);
    const tax = taxable * 0.15;
    const total = taxable + checkoutServiceFee + tax;
    return { subtotal, taxable, tax, total };
  })();

  const mixedTotal = useMemo(
    () => mixedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [mixedPayments]
  );

  return (
    <div className="space-y-6">
      <div>
        <Badge tone="wine">Salón</Badge>
        <h2 className="mt-2 text-2xl font-black text-wine-900 dark:text-cream">Mapa de mesas</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Control visual de ocupación, reservas, limpieza y solicitud de cuenta.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {(data?.items ?? []).map((table) => {
          const readyOrder = readyOrders.find((order) => Number(order.tableId) === table.id && order.status === 'READY');
          return (
            <Card key={table.id} className="relative overflow-hidden">
            <Sparkles className="absolute right-3 top-3 h-4 w-4 text-gold-400" />
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-wine-800 text-gold-300"><Armchair className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-black text-wine-900 dark:text-cream">{table.name}</h3>
                <p className="text-xs text-zinc-500">Capacidad: {table.capacity}</p>
              </div>
            </div>
            <Badge tone={statusTone[table.status]}>{statusLabel[table.status]}</Badge>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" className="py-2 text-xs" onClick={() => mutation.mutate({ id: table.id, status: 'OCCUPIED' })}>Ocupar</Button>
              <Button variant="secondary" className="py-2 text-xs" onClick={() => mutation.mutate({ id: table.id, status: 'FREE' })}>Liberar</Button>
              <Button variant="secondary" className="py-2 text-xs" onClick={() => mutation.mutate({ id: table.id, status: 'BILL_REQUESTED' })}>Cuenta</Button>
              <Button variant="secondary" className="py-2 text-xs" onClick={() => mutation.mutate({ id: table.id, status: 'CLEANING' })}>Limpieza</Button>
              <Button
                className="col-span-2 py-2 text-xs"
                onClick={() => {
                  setSelectedTable(table);
                  setNotes('');
                  setCart([]);
                }}
              >
                Tomar pedido
              </Button>
              <Button
                className="col-span-2 py-2 text-xs"
                disabled={!readyOrder || checkoutMutation.isPending}
                onClick={() => {
                  if (!readyOrder) return;
                  setSelectedOrder(readyOrder);
                  setCheckoutPaymentMethod('CASH');
                  setCheckoutCustomerId('');
                  setCheckoutDiscount(0);
                  setCheckoutServiceFee(0);
                  setMixedPayments([{ method: 'CASH', amount: 0 }]);
                }}
              >
                {readyOrder ? 'Facturar mesa' : 'Sin comanda lista'}
              </Button>
            </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(selectedTable)}
        title={`Comanda ${selectedTable?.name ?? ''}`}
        onClose={() => setSelectedTable(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedTable(null)}>
              Cancelar
            </Button>
            <Button disabled={!cart.length || takeOrderMutation.isPending} onClick={() => takeOrderMutation.mutate()}>
              {takeOrderMutation.isPending ? 'Guardando...' : 'Guardar comanda'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input placeholder="Notas para cocina/barra" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            {availableProducts.map((product) => (
              <button key={product.id} type="button" className="rounded-lg border border-wine-100 p-2 text-left hover:bg-wine-50 dark:border-white/10 dark:hover:bg-white/10" onClick={() => addItem(product)}>
                <p className="text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-zinc-500">${Number(product.price).toFixed(2)}</p>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-lg bg-wine-50 p-2 dark:bg-white/10">
                <p className="text-sm font-medium">{item.name}</p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" className="h-7 w-7 p-0" onClick={() => removeItem(item.productId)}>
                    -
                  </Button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <Button variant="secondary" className="h-7 w-7 p-0" onClick={() => setCart((current) => current.map((entry) => (entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry)))}>
                    +
                  </Button>
                </div>
              </div>
            ))}
            {!cart.length && <p className="text-xs text-zinc-500">Selecciona productos para esta mesa.</p>}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedOrder)}
        title={`Facturar comanda #${selectedOrder?.id ?? ''}`}
        onClose={() => setSelectedOrder(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !selectedOrder ||
                checkoutMutation.isPending ||
                (checkoutPaymentMethod === 'CREDIT' && !checkoutCustomerId) ||
                (checkoutPaymentMethod === 'MIXED' && Math.abs(mixedTotal - checkoutSummary.total) > 0.01)
              }
              onClick={() => selectedOrder && checkoutMutation.mutate(selectedOrder.id)}
            >
              {checkoutMutation.isPending ? 'Facturando...' : 'Confirmar facturación'}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-zinc-500">
            Método de pago
            <Select
              className="mt-1"
              value={checkoutPaymentMethod}
              onChange={setCheckoutPaymentMethod}
              options={[
                { value: 'CASH', label: 'Efectivo' },
                { value: 'CREDIT_CARD', label: 'Tarjeta crédito' },
                { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
                { value: 'TRANSFER', label: 'Transferencia' },
                { value: 'DEPOSIT', label: 'Depósito' },
                { value: 'MIXED', label: 'Pago mixto' },
                { value: 'CREDIT', label: 'Crédito' },
                { value: 'COURTESY', label: 'Cortesía' }
              ]}
            />
          </label>
          <label className="text-xs font-semibold text-zinc-500">
            Cliente (obligatorio para crédito)
            <Select
              className="mt-1"
              value={checkoutCustomerId}
              onChange={setCheckoutCustomerId}
              options={[
                { value: '', label: 'Consumidor final' },
                ...(customersQuery.data?.items ?? []).map((customer) => ({ value: String(customer.id), label: customer.name }))
              ]}
            />
          </label>
          <label className="text-xs font-semibold text-zinc-500">
            Descuento
            <Input className="mt-1" type="number" min={0} step="0.01" value={checkoutDiscount} onChange={(e) => setCheckoutDiscount(Number(e.target.value || 0))} />
          </label>
          <label className="text-xs font-semibold text-zinc-500">
            Servicio
            <Input className="mt-1" type="number" min={0} step="0.01" value={checkoutServiceFee} onChange={(e) => setCheckoutServiceFee(Number(e.target.value || 0))} />
          </label>
        </div>
        <div className="mt-4 rounded-lg bg-wine-50 p-3 text-sm dark:bg-white/10">
          <div className="flex justify-between"><span>Subtotal</span><b>${checkoutSummary.subtotal.toFixed(2)}</b></div>
          <div className="flex justify-between"><span>Descuento</span><b>${checkoutDiscount.toFixed(2)}</b></div>
          <div className="flex justify-between"><span>Servicio</span><b>${checkoutServiceFee.toFixed(2)}</b></div>
          <div className="flex justify-between"><span>IVA</span><b>${checkoutSummary.tax.toFixed(2)}</b></div>
          <div className="mt-1 flex justify-between text-base"><span className="font-bold">Total</span><b>${checkoutSummary.total.toFixed(2)}</b></div>
        </div>
        {checkoutPaymentMethod === 'MIXED' && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-500">Pagos mixtos</p>
            {mixedPayments.map((payment, idx) => (
              <div key={`${idx}-${payment.method}`} className="grid grid-cols-[1fr_120px_auto] gap-2">
                <Select
                  value={payment.method}
                  onChange={(value) => setMixedPayments((current) => current.map((entry, entryIdx) => (entryIdx === idx ? { ...entry, method: value } : entry)))}
                  options={[
                    { value: 'CASH', label: 'Efectivo' },
                    { value: 'CREDIT_CARD', label: 'Tarjeta crédito' },
                    { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
                    { value: 'TRANSFER', label: 'Transferencia' },
                    { value: 'DEPOSIT', label: 'Depósito' }
                  ]}
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={payment.amount}
                  onChange={(e) => setMixedPayments((current) => current.map((entry, entryIdx) => (entryIdx === idx ? { ...entry, amount: Number(e.target.value || 0) } : entry)))}
                />
                <Button
                  variant="secondary"
                  onClick={() => setMixedPayments((current) => (current.length === 1 ? current : current.filter((_, entryIdx) => entryIdx !== idx)))}
                >
                  -
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => setMixedPayments((current) => [...current, { method: 'CASH', amount: 0 }])}>
              + Agregar método
            </Button>
            <p className={`text-xs font-semibold ${Math.abs(mixedTotal - checkoutSummary.total) <= 0.01 ? 'text-emerald-600' : 'text-red-600'}`}>
              Pagos: ${mixedTotal.toFixed(2)} / Total: ${checkoutSummary.total.toFixed(2)}
            </p>
          </div>
        )}
        {checkoutPaymentMethod === 'CREDIT' && !checkoutCustomerId && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">Selecciona cliente para facturar a crédito.</p>}
      </Modal>
    </div>
  );
}
