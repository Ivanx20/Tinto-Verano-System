import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Boxes, CalendarDays, ChefHat, CreditCard, Home, LogOut, Menu, Moon, Package, Receipt, Settings, ShieldCheck, ShoppingCart, Sun, Table2, Users, WalletCards } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import profileLogo from '@/assets/profile-logo.png';

const nav = [
  { to: '/', label: 'Dashboard', icon: Home, anyOf: ['dashboard.view'] },
  { to: '/pos', label: 'POS', icon: ShoppingCart, anyOf: ['sale.create'] },
  { to: '/mesas', label: 'Mesas', icon: Table2, anyOf: ['sale.create'] },
  { to: '/cocina', label: 'Cocina', icon: ChefHat, anyOf: ['sale.create'] },
  { to: '/productos', label: 'Productos', icon: Package, anyOf: ['sale.create', 'product.create', 'product.update', 'product.delete'] },
  { to: '/clientes', label: 'Clientes', icon: Users, anyOf: ['sale.create'] },
  { to: '/proveedores', label: 'Proveedores', icon: Boxes, anyOf: ['purchase.create'] },
  { to: '/inventario', label: 'Inventario', icon: Boxes, anyOf: ['inventory.adjust'] },
  { to: '/compras', label: 'Compras', icon: Receipt, anyOf: ['purchase.create'] },
  { to: '/caja', label: 'Caja', icon: WalletCards, anyOf: ['cash.open', 'cash.close'] },
  { to: '/ventas', label: 'Ventas', icon: CreditCard, anyOf: ['sale.create', 'sale.cancel'] },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, anyOf: ['reports.view'] },
  { to: '/reservas', label: 'Reservas', icon: CalendarDays, anyOf: ['sale.create'] },
  { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck, anyOf: ['user.create'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings, anyOf: ['settings.manage'] }
];

export function AppLayout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, darkMode, toggleDarkMode } = useUiStore();
  const { user, logoutLocal } = useAuthStore();
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const navigate = useNavigate();
  const navItems = nav.filter((item) => item.anyOf.some((permission) => permissions.includes(permission)));

  async function logout() {
    await api.post('/auth/logout').catch(() => undefined);
    logoutLocal();
    navigate('/login');
  }

  return (
    <div className="min-h-screen text-zinc-900 dark:text-cream">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-wine-900 text-cream shadow-2xl transition ${sidebarOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <img src={profileLogo} alt="Tinto Verano" className="h-12 w-12 rounded-full border border-gold-300 object-cover shadow-lg" />
              <div>
                <p className="text-lg font-black tracking-wide">Tinto Verano</p>
                <p className="text-xs uppercase tracking-[.35em] text-gold-300">Grill · Drinks</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-gold-300 text-wine-900 shadow-lg shadow-gold-400/20' : 'text-cream/80 hover:bg-white/10 hover:text-cream'}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
        <header className="sticky top-0 z-30 border-b border-wine-100/70 bg-cream/80 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-wine-900/70 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="p-3" onClick={toggleSidebar}><Menu className="h-5 w-5" /></Button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.3em] text-gold-500">Sistema</p>
                <h1 className="text-xl font-black text-wine-900 dark:text-cream">Administración integral</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" className="hidden sm:inline-flex" onClick={toggleDarkMode}>{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Modo</Button>
              <img src={profileLogo} alt="Perfil Tinto Verano" className="hidden h-9 w-9 rounded-full border border-wine-100 object-cover sm:block dark:border-white/10" />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-wine-900 dark:text-cream">{user?.name ?? 'Usuario'}</p>
                <p className="text-xs text-zinc-500">{user?.roles?.[0] ?? 'Rol'}</p>
              </div>
              <Button variant="ghost" className="p-3" onClick={logout}><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
