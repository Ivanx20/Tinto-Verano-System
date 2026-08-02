import { create } from 'zustand';

type UiState = {
  sidebarOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
};

const initialDark = localStorage.getItem('tv-dark') === 'true';
if (initialDark) document.documentElement.classList.add('dark');

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: true,
  darkMode: initialDark,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('tv-dark', String(next));
    document.documentElement.classList.toggle('dark', next);
    set({ darkMode: next });
  }
}));
