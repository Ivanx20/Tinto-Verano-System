import { GenericModulePage } from './GenericModulePage';

export function AccountsPayablePage() {
  return <GenericModulePage title="Cuentas por pagar" endpoint="/accounts-payable" description="Deudas a proveedores, abonos y vencimientos." />;
}
