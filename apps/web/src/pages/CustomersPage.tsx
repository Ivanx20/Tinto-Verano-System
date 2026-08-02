import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/Table';
import { createRecord, deleteRecord, getList, updateRecord } from '@/lib/api';
import type { Customer } from '@/types/models';

export function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', identification: '', email: '', phone: '' });
  const { data } = useQuery({ queryKey: ['customers', search], queryFn: () => getList<Customer>('/customers', search) });
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        identification: form.identification.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        identificationType: 'CEDULA'
      };
      if (editing) return updateRecord('/customers', editing.id, payload);
      return createRecord('/customers', payload);
    },
    onSuccess: () => {
      setEditing(null);
      setForm({ name: '', identification: '', email: '', phone: '' });
      qc.invalidateQueries({ queryKey: ['customers'] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRecord('/customers', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] })
  });

  const columns = useMemo(() => [
    { key: 'name', header: 'Cliente' },
    { key: 'identification', header: 'Identificación' },
    { key: 'email', header: 'Correo' },
    { key: 'phone', header: 'Teléfono' }
  ], []);
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge tone="wine">CRM básico</Badge>
          <h2 className="mt-3 text-3xl font-black text-wine-900 dark:text-cream">Clientes</h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Historial de consumo, facturación, cuentas por cobrar y fidelización.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', identification: '', email: '', phone: '' });
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Button>
      </div>
      <Card>
        <CardTitle subtitle={editing ? 'Editando cliente' : 'Registrar cliente'}>{editing ? 'Editar cliente' : 'Nuevo cliente'}</CardTitle>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Identificación" value={form.identification} onChange={(e) => setForm((prev) => ({ ...prev, identification: e.target.value }))} />
          <Input placeholder="Correo" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
          <Input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
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
                setForm({ name: '', identification: '', email: '', phone: '' });
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </Card>
      <Card>
        <CardTitle subtitle="Consumidor final, RUC, cédula o pasaporte">Base de clientes</CardTitle>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
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
                    identification: row.identification ?? '',
                    email: row.email ?? '',
                    phone: row.phone ?? ''
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
