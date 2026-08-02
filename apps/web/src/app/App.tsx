import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PermissionRoute } from '@/routes/PermissionRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PosPage } from '@/pages/PosPage';
import { TablesPage } from '@/pages/TablesPage';
import { KitchenDisplayPage } from '@/pages/KitchenDisplayPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { InventoryMovementsPage } from '@/pages/InventoryMovementsPage';
import { CashRegisterPage } from '@/pages/CashRegisterPage';
import { SalesPage } from '@/pages/SalesPage';
import { SaleDetailPage } from '@/pages/SaleDetailPage';
import { AccountsReceivablePage } from '@/pages/AccountsReceivablePage';
import { AccountsPayablePage } from '@/pages/AccountsPayablePage';
import { ReservationsPage } from '@/pages/ReservationsPage';
import { PromotionsPage } from '@/pages/PromotionsPage';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPermissionsPage } from '@/pages/RolesPermissionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<PermissionRoute anyOf={['dashboard.view']}><DashboardPage /></PermissionRoute>} />
            <Route path="pos" element={<PermissionRoute anyOf={['sale.create']}><PosPage /></PermissionRoute>} />
            <Route path="mesas" element={<PermissionRoute anyOf={['sale.create']}><TablesPage /></PermissionRoute>} />
            <Route path="cocina" element={<PermissionRoute anyOf={['sale.create']}><KitchenDisplayPage /></PermissionRoute>} />
            <Route path="productos" element={<PermissionRoute anyOf={['sale.create', 'product.create', 'product.update', 'product.delete']}><ProductsPage /></PermissionRoute>} />
            <Route path="categorias" element={<PermissionRoute anyOf={['product.create', 'product.update']}><CategoriesPage /></PermissionRoute>} />
            <Route path="clientes" element={<PermissionRoute anyOf={['sale.create']}><CustomersPage /></PermissionRoute>} />
            <Route path="proveedores" element={<PermissionRoute anyOf={['purchase.create']}><SuppliersPage /></PermissionRoute>} />
            <Route path="inventario" element={<PermissionRoute anyOf={['inventory.adjust']}><InventoryPage /></PermissionRoute>} />
            <Route path="movimientos-inventario" element={<PermissionRoute anyOf={['inventory.adjust']}><InventoryMovementsPage /></PermissionRoute>} />
            <Route path="compras" element={<PermissionRoute anyOf={['purchase.create']}><PurchasesPage /></PermissionRoute>} />
            <Route path="caja" element={<PermissionRoute anyOf={['cash.open', 'cash.close']}><CashRegisterPage /></PermissionRoute>} />
            <Route path="ventas" element={<PermissionRoute anyOf={['sale.create', 'sale.cancel']}><SalesPage /></PermissionRoute>} />
            <Route path="ventas/:id" element={<PermissionRoute anyOf={['sale.create', 'sale.cancel']}><SaleDetailPage /></PermissionRoute>} />
            <Route path="cuentas-por-cobrar" element={<PermissionRoute anyOf={['accounts_receivable.view']}><AccountsReceivablePage /></PermissionRoute>} />
            <Route path="cuentas-por-pagar" element={<PermissionRoute anyOf={['accounts_payable.view']}><AccountsPayablePage /></PermissionRoute>} />
            <Route path="reservas" element={<PermissionRoute anyOf={['sale.create']}><ReservationsPage /></PermissionRoute>} />
            <Route path="promociones" element={<PermissionRoute anyOf={['settings.manage', 'discount.apply']}><PromotionsPage /></PermissionRoute>} />
            <Route path="reportes" element={<PermissionRoute anyOf={['reports.view']}><ReportsPage /></PermissionRoute>} />
            <Route path="usuarios" element={<PermissionRoute anyOf={['user.create']}><UsersPage /></PermissionRoute>} />
            <Route path="roles" element={<PermissionRoute anyOf={['user.create']}><RolesPermissionsPage /></PermissionRoute>} />
            <Route path="configuracion" element={<PermissionRoute anyOf={['settings.manage']}><SettingsPage /></PermissionRoute>} />
            <Route path="auditoria" element={<PermissionRoute anyOf={['audit.view']}><AuditLogsPage /></PermissionRoute>} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
