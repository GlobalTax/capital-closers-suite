import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SidebarConfig {
  topLevelOrder: string[];
  groupOrder: string[];
  groupItemsOrder: Record<string, string[]>;
  quickAccess: string[]; // IDs of items marked as quick access favorites
}

interface AppState {
  // User preferences
  sidebarCollapsed: boolean;
  tablePageSize: number;
  theme: 'light' | 'dark' | 'system';
  
  // Sidebar configuration
  sidebarConfig: SidebarConfig;
  
  // Global filters
  globalSearch: string;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTablePageSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalSearch: (query: string) => void;
  setSidebarConfig: (config: Partial<SidebarConfig>) => void;
  resetSidebarConfig: () => void;
}

const defaultSidebarConfig: SidebarConfig = {
  topLevelOrder: ['dashboard', 'tareas', 'mis-horas', 'gestion-leads'],
  groupOrder: ['mandatos', 'servicios', 'gestion', 'plataformas', 'admin-dashboard', 'super-admin'],
  groupItemsOrder: {},
  quickAccess: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      tablePageSize: 10,
      theme: 'system',
      globalSearch: '',
      sidebarConfig: defaultSidebarConfig,
      
      // Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTablePageSize: (size) => set({ tablePageSize: size }),
      setTheme: (theme) => set({ theme }),
      setGlobalSearch: (query) => set({ globalSearch: query }),
      setSidebarConfig: (config) => set((state) => ({
        sidebarConfig: { ...state.sidebarConfig, ...config }
      })),
      resetSidebarConfig: () => set({ sidebarConfig: defaultSidebarConfig }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        tablePageSize: state.tablePageSize,
        theme: state.theme,
        sidebarConfig: state.sidebarConfig,
      }),
    }
  )
);
