import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // User preferences
  sidebarCollapsed: boolean;
  tablePageSize: number;
  theme: 'light' | 'dark' | 'system';
  
  // Global filters
  globalSearch: string;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTablePageSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalSearch: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      tablePageSize: 10,
      theme: 'system',
      globalSearch: '',
      
      // Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTablePageSize: (size) => set({ tablePageSize: size }),
      setTheme: (theme) => set({ theme }),
      setGlobalSearch: (query) => set({ globalSearch: query }),
    }),
    {
      name: 'app-storage', // LocalStorage key
      partialize: (state) => ({
        // Solo persistir preferencias de usuario
        sidebarCollapsed: state.sidebarCollapsed,
        tablePageSize: state.tablePageSize,
        theme: state.theme,
      }),
    }
  )
);
