import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const setSession = useAuthStore((s) => s.setSession);
  const logoutLocal = useAuthStore((s) => s.logoutLocal);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    if (!isBootstrapping) return;

    let active = true;

    async function bootstrapSession() {
      try {
        const { data } = await api.post('/auth/refresh');
        if (!active) return;
        setSession(data.data.user, data.data.accessToken);
      } catch {
        if (!active) return;
        logoutLocal();
      } finally {
        if (active) setBootstrapping(false);
      }
    }

    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [isBootstrapping, logoutLocal, setBootstrapping, setSession]);

  if (isBootstrapping) {
    return <div className="grid min-h-screen place-items-center text-sm text-zinc-500">Restaurando sesión...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
