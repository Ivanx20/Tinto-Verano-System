import { GenericModulePage } from './GenericModulePage';

export function AccountsReceivablePage() {
  return <GenericModulePage title="Cuentas por cobrar" endpoint="/accounts-receivable" description="Créditos de clientes, abonos y vencimientos." />;
}
