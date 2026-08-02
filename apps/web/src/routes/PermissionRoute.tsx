import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function PermissionRoute({ anyOf, children }: { anyOf: string[]; children: ReactNode }) {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);
  const allowed = anyOf.some((permission) => permissions.includes(permission));
  if (!allowed) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
