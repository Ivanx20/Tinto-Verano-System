import { GenericModulePage } from './GenericModulePage';

export function InventoryMovementsPage() {
  return <GenericModulePage title="Movimientos de inventario" endpoint="/inventory/movements" description="Entradas, salidas, ajustes y trazabilidad kardex." />;
}
