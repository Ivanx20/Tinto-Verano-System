import { create } from 'zustand';

type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type AuthState = {
  user?: User;
  accessToken?: string;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (user: User, accessToken?: string) => void;
  setAccessToken: (accessToken?: string) => void;
  logoutLocal: () => void;
  setBootstrapping: (value: boolean) => void;
  hasPermission: (permission: string) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  accessToken: undefined,
  isAuthenticated: false,
  isBootstrapping: true,
  setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logoutLocal: () => set({ user: undefined, accessToken: undefined, isAuthenticated: false }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
  hasPermission: (permission) => Boolean(get().user?.permissions.includes(permission))
}));
