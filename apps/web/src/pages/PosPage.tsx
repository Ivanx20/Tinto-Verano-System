import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Receipt, Search, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api, getList } from '@/lib/api';
import type { Customer, Product } from '@/types/models';

type CartItem = Product & { quantity: number };
type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'CREDIT';

export function PosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [discount, setDiscount] = useState(0);
  const [serviceFeePercent, setServiceFeePercent] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = useState('');
  const { data } = useQuery({ queryKey: ['pos-products', search], queryFn: () => getList<Product>('/products', search) });
  const customersQuery = useQuery({ queryKey: ['pos-customers', customerSearch], queryFn: () => getList<Customer>('/customers', customerSearch) });
  const products = data?.items ?? [];
  const customers = customersQuery.data?.items ?? [];

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const serviceFee = discountedSubtotal * (serviceFeePercent / 100);
    const tax = discountedSubtotal * 0.15;
    return { subtotal, discountedSubtotal, serviceFee, tax, total: discountedSubtotal + serviceFee + tax };
  }, [cart, discount, serviceFeePercent]);

  const saleMutation = useMutation({
    mutationFn: () =>
      api.post('/sales', {
        customerId,
        saleType,
        discount: Number(discount.toFixed(2)),
        serviceFee: Number(totals.serviceFee.toFixed(2)),
        items: cart.map((item) => ({ productId: item.id, quantity: item.quantity, unitPrice: Number(item.price) })),
        payments: [{ method: paymentMethod, amount: Number(totals.total.toFixed(2)) }]
      }),
    onSuccess: () => {
      setCart([]);
      setDiscount(0);
      setCustomerId(undefined);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['sales'] });
    }
  });

  function add(product: Product) {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      if (exists) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function dec(id: number) {
    setCart((current) => current.flatMap((item) => item.id === id ? (item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []) : [item]));
  }

  function submitSale() {
    if (!cart.length) return;
    if (paymentMethod === 'CREDIT' && !customerId) return;
    saleMutation.mutate();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <div>
          <Badge tone="wine">POS</Badge>
          <h2 className="mt-3 text-3xl font-black text-wine-900 dark:text-cream">Punto de venta</h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Venta rápida, mesa, delivery, pago mixto, propina y comprobante.</p>
        </div>
        <Card>
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input className="h-10 pl-9" placeholder="Buscar plato, bebida o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-zinc-500">
              Tipo de venta
              <Select
                className="mt-1"
                value={saleType}
                onChange={(next) => setSaleType(next as 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY')}
                options={[
                  { value: 'DINE_IN', label: 'En mesa' },
                  { value: 'TAKEAWAY', label: 'Para llevar' },
                  { value: 'DELIVERY', label: 'Delivery' }
                ]}
              />
            </label>
            <label className="text-xs font-semibold text-zinc-500">
              Método de pago
              <Select
                className="mt-1"
                value={paymentMethod}
                onChange={(next) => setPaymentMethod(next as PaymentMethod)}
                options={[
                  { value: 'CASH', label: 'Efectivo' },
                  { value: 'CREDIT_CARD', label: 'Tarjeta crédito' },
                  { value: 'DEBIT_CARD', label: 'Tarjeta débito' },
                  { value: 'TRANSFER', label: 'Transferencia' },
                  { value: 'CREDIT', label: 'Crédito' }
                ]}
              />
            </label>
            <label className="text-xs font-semibold text-zinc-500">
              Descuento $
              <Input className="mt-1" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value || 0))} />
            </label>
            <label className="text-xs font-semibold text-zinc-500">
              Servicio %
              <Input className="mt-1" type="number" min={0} max={20} step="1" value={serviceFeePercent} onChange={(e) => setServiceFeePercent(Number(e.target.value || 0))} />
            </label>
          </div>
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input placeholder="Buscar cliente por nombre/correo..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
            <Select
              className="min-w-[220px]"
              value={customerId ? String(customerId) : ''}
              onChange={(next) => setCustomerId(next ? Number(next) : undefined)}
              options={[
                { value: '', label: 'Consumidor final' },
                ...customers.map((customer) => ({ value: String(customer.id), label: customer.name }))
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <button key={product.id} onClick={() => add(product)} className="group rounded-[2rem] border border-wine-100 bg-white/70 p-4 text-left transition hover:-translate-y-1 hover:border-gold-400 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 grid h-28 place-items-center rounded-3xl bg-gradient-to-br from-wine-800 to-wine-500 text-cream"><ShoppingCart className="h-10 w-10 text-gold-300" /></div>
                <h3 className="font-black text-wine-900 dark:text-cream">{product.name}</h3>
                <div className="mt-3 flex items-center justify-between"><Badge tone="gold">{product.productType}</Badge><p className="text-lg font-black text-wine-700 dark:text-gold-300">${Number(product.price).toFixed(2)}</p></div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <aside className="sticky top-24 h-fit">
        <Card>
          <CardTitle subtitle="Productos seleccionados">Cuenta actual</CardTitle>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-3xl bg-wine-50 p-4 dark:bg-white/5">
                <div>
                  <p className="font-bold text-wine-900 dark:text-cream">{item.name}</p>
                  <p className="text-sm text-zinc-500">${Number(item.price).toFixed(2)} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" className="h-9 w-9 p-0" onClick={() => dec(item.id)}><Minus className="h-4 w-4" /></Button>
                  <Button variant="secondary" className="h-9 w-9 p-0" onClick={() => add(item)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {!cart.length && <p className="rounded-3xl bg-wine-50 p-6 text-center text-sm text-zinc-500 dark:bg-white/5">Agrega productos para generar la venta.</p>}
          </div>
          <div className="my-5 space-y-2 border-t border-wine-100 pt-5 text-sm dark:border-white/10">
            <div className="flex justify-between"><span>Subtotal</span><b>${totals.subtotal.toFixed(2)}</b></div>
            <div className="flex justify-between"><span>Descuento</span><b>-${discount.toFixed(2)}</b></div>
            <div className="flex justify-between"><span>Servicio {serviceFeePercent}%</span><b>${totals.serviceFee.toFixed(2)}</b></div>
            <div className="flex justify-between"><span>IVA 15%</span><b>${totals.tax.toFixed(2)}</b></div>
            <div className="flex justify-between text-xl"><span className="font-black">Total</span><b>${totals.total.toFixed(2)}</b></div>
          </div>
          {paymentMethod === 'CREDIT' && !customerId && <p className="mb-3 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700">Para ventas a crédito debes seleccionar un cliente.</p>}
          <Button className="w-full" disabled={!cart.length || saleMutation.isPending || (paymentMethod === 'CREDIT' && !customerId)} onClick={submitSale}><Receipt className="h-4 w-4" /> {saleMutation.isPending ? 'Procesando...' : 'Cobrar y facturar'}</Button>
        </Card>
      </aside>
    </div>
  );
}
