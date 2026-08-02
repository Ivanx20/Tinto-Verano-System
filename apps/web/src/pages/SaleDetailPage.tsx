import { useParams } from 'react-router-dom';
import { GenericModulePage } from './GenericModulePage';

export function SaleDetailPage() {
  const { id } = useParams();
  return <GenericModulePage title={`Detalle de venta #${id ?? ''}`} endpoint={`/sales/${id ?? ''}`} description="Detalle completo de venta, pagos y comprobantes." />;
}
