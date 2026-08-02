import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/Table';
import { createRecord, deleteRecord, getList, updateRecord } from '@/lib/api';

type FieldType = 'text' | 'number' | 'boolean';
type FieldDefinition = { key: string; label: string; type: FieldType };

const MODULE_FIELDS: Record<string, FieldDefinition[]> = {
  '/suppliers': [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'ruc', label: 'RUC', type: 'text' },
    { key: 'email', label: 'Correo', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'text' }
  ],
  '/categories': [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'color', label: 'Color', type: 'text' }
  ],
  '/inventory': [
    { key: 'warehouseId', label: 'Bodega ID', type: 'number' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'unit', label: 'Unidad', type: 'text' },
    { key: 'currentStock', label: 'Stock actual', type: 'number' },
    { key: 'minimumStock', label: 'Stock mínimo', type: 'number' },
    { key: 'averageCost', label: 'Costo promedio', type: 'number' }
  ],
  '/inventory/movements': [
    { key: 'inventoryItemId', label: 'Insumo ID', type: 'number' },
    { key: 'warehouseId', label: 'Bodega ID', type: 'number' },
    { key: 'type', label: 'Tipo', type: 'text' },
    { key: 'quantity', label: 'Cantidad', type: 'number' },
    { key: 'unitCost', label: 'Costo unitario', type: 'number' }
  ],
  '/purchases': [
    { key: 'supplierId', label: 'Proveedor ID', type: 'number' },
    { key: 'invoiceNumber', label: 'Factura', type: 'text' },
    { key: 'subtotal', label: 'Subtotal', type: 'number' },
    { key: 'tax', label: 'IVA', type: 'number' },
    { key: 'total', label: 'Total', type: 'number' }
  ],
  '/cash': [
    { key: 'openingAmount', label: 'Monto apertura', type: 'number' },
    { key: 'status', label: 'Estado', type: 'text' }
  ],
  '/sales': [{ key: 'notes', label: 'Notas', type: 'text' }],
  '/accounts-receivable': [
    { key: 'saleId', label: 'Venta ID', type: 'number' },
    { key: 'amount', label: 'Monto', type: 'number' },
    { key: 'paidAmount', label: 'Pagado', type: 'number' }
  ],
  '/accounts-payable': [
    { key: 'purchaseId', label: 'Compra ID', type: 'number' },
    { key: 'amount', label: 'Monto', type: 'number' },
    { key: 'paidAmount', label: 'Pagado', type: 'number' }
  ],
  '/reservations': [
    { key: 'customerName', label: 'Cliente', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'text' },
    { key: 'peopleCount', label: 'Personas', type: 'number' },
    { key: 'reservationAt', label: 'Fecha ISO', type: 'text' }
  ],
  '/promotions': [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'type', label: 'Tipo', type: 'text' },
    { key: 'value', label: 'Valor', type: 'number' }
  ],
  '/users': [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'email', label: 'Correo', type: 'text' },
    { key: 'password', label: 'Clave', type: 'text' }
  ],
  '/roles': [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' }
  ],
  '/settings': [
    { key: 'businessName', label: 'Negocio', type: 'text' },
    { key: 'address', label: 'Dirección', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'text' }
  ]
};

export function GenericModulePage({ title, endpoint, description }: { title: string; endpoint: string; description: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({ queryKey: [endpoint, search], queryFn: () => getList<any>(endpoint, search) });
  const rows = useMemo(() => data?.items ?? [], [data?.items]);
  const fields = MODULE_FIELDS[endpoint] ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = formData[field.key] ?? '';
        if (field.type === 'number') payload[field.key] = raw === '' ? 0 : Number(raw);
        else if (field.type === 'boolean') payload[field.key] = raw === 'true';
        else payload[field.key] = raw === '' ? null : raw;
      }

      if (editingId) return updateRecord(endpoint, editingId, payload);
      return createRecord(endpoint, payload);
    },
    onSuccess: () => {
      setOpenForm(false);
      setEditingId(null);
      setFormData({});
      qc.invalidateQueries({ queryKey: [endpoint] });
      qc.invalidateQueries({ queryKey: [endpoint, search] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteId) return;
      return deleteRecord(endpoint, deleteId);
    },
    onSuccess: () => {
      setOpenDelete(false);
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: [endpoint] });
      qc.invalidateQueries({ queryKey: [endpoint, search] });
    }
  });

  const columns = useMemo(() => {
    const first = rows[0] ?? {};
    const keys = Object.keys(first).filter((k) => !['deletedAt', 'updatedBy', 'createdBy', 'passwordHash', 'metadata'].includes(k)).slice(0, 6);
    return keys.length ? keys.map((key) => ({ key, header: key })) : [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Nombre' },
      { key: 'status', header: 'Estado' }
    ];
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge tone="wine">Módulo</Badge>
          <h2 className="mt-2 text-2xl font-black text-wine-900 dark:text-cream">{title}</h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData({});
            setOpenForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>
      <Card>
        <CardTitle subtitle={isLoading ? 'Cargando registros...' : `${rows.length} registros cargados`}>{title}</CardTitle>
        <DataTable
          columns={columns as any}
          data={rows}
          search={search}
          onSearch={setSearch}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                className="py-2"
                onClick={() => {
                  setEditingId(row.id);
                  const next: Record<string, string> = {};
                  for (const field of fields) next[field.key] = String(row[field.key] ?? '');
                  setFormData(next);
                  setOpenForm(true);
                }}
              >
                Editar
              </Button>
              <Button
                variant="secondary"
                className="py-2 text-red-700"
                onClick={() => {
                  setDeleteId(row.id);
                  setOpenDelete(true);
                }}
              >
                Eliminar
              </Button>
            </div>
          )}
        />
      </Card>

      <Modal
        open={openForm}
        title={editingId ? `Editar ${title}` : `Nuevo ${title}`}
        onClose={() => setOpenForm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button disabled={!fields.length || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {!fields.length ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">Este módulo no tiene formulario rápido configurado.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="text-xs font-semibold text-zinc-500">
                {field.label}
                <Input
                  className="mt-1"
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.key] ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={openDelete}
        title="Confirmar eliminación"
        onClose={() => setOpenDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-to-r from-red-700 to-red-500" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Esta acción realizará eliminación lógica del registro seleccionado.</p>
      </Modal>
    </div>
  );
}
