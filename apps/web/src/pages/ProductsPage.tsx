import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/Table';
import { createRecord, deleteRecord, getList, updateRecord } from '@/lib/api';
import type { Product } from '@/types/models';

export function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', price: 0, cost: 0, productType: 'PLATO' });
  const { data } = useQuery({ queryKey: ['products', search], queryFn: () => getList<Product>('/products', search) });
  const rows = data?.items ?? [];
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        price: Number(form.price),
        cost: Number(form.cost),
        productType: form.productType,
        isAvailable: true
      };
      if (editing) return updateRecord('/products', editing.id, payload);
      return createRecord('/products', payload);
    },
    onSuccess: () => {
      setEditing(null);
      setForm({ name: '', sku: '', price: 0, cost: 0, productType: 'PLATO' });
      qc.invalidateQueries({ queryKey: ['products'] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRecord('/products', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  });

  const columns = useMemo(() => [
    { key: 'name', header: 'Producto' },
    { key: 'sku', header: 'SKU' },
    { key: 'productType', header: 'Tipo', render: (r: Product) => <Badge tone="wine">{r.productType}</Badge> },
    { key: 'price', header: 'Precio', render: (r: Product) => `$${Number(r.price).toFixed(2)}` },
    { key: 'isAvailable', header: 'Disponible', render: (r: Product) => <Badge tone={r.isAvailable ? 'green' : 'red'}>{r.isAvailable ? 'Sí' : 'No'}</Badge> }
  ], []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge tone="wine">Menú</Badge>
          <h2 className="mt-3 text-3xl font-black text-wine-900 dark:text-cream">Productos, platos y bebidas</h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Gestión del menú, precios, costos, categorías, disponibilidad y recetas.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', sku: '', price: 0, cost: 0, productType: 'PLATO' });
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </div>
      <Card className="relative z-30 overflow-visible">
        <CardTitle subtitle={editing ? 'Editando producto' : 'Registrar nuevo producto'}>{editing ? 'Editar producto' : 'Nuevo producto'}</CardTitle>
        <div className="grid gap-3 md:grid-cols-5">
          <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} />
          <Input type="number" min={0} step="0.01" placeholder="Precio" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value || 0) }))} />
          <Input type="number" min={0} step="0.01" placeholder="Costo" value={form.cost} onChange={(e) => setForm((prev) => ({ ...prev, cost: Number(e.target.value || 0) }))} />
          <Select
            value={form.productType}
            onChange={(next) => setForm((prev) => ({ ...prev, productType: next }))}
            options={[
              { value: 'PLATO', label: 'Plato' },
              { value: 'BEBIDA', label: 'Bebida' },
              { value: 'POSTRE', label: 'Postre' },
              { value: 'SERVICIO', label: 'Servicio' }
            ]}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button disabled={!form.name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
          </Button>
          {editing && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', sku: '', price: 0, cost: 0, productType: 'PLATO' });
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </Card>
      <Card className="relative z-10">
        <CardTitle subtitle="Búsqueda, paginación y acciones de mantenimiento">Catálogo</CardTitle>
        <DataTable
          columns={columns}
          data={rows}
          search={search}
          onSearch={setSearch}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="py-2"
                onClick={() => {
                  setEditing(row);
                  setForm({
                    name: row.name,
                    sku: row.sku ?? '',
                    price: Number(row.price),
                    cost: Number(row.cost),
                    productType: row.productType
                  });
                }}
              >
                Editar
              </Button>
              <Button variant="secondary" className="py-2 text-red-700" onClick={() => deleteMutation.mutate(row.id)}>
                Eliminar
              </Button>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
