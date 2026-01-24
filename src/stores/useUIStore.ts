// ============================================
// UI STORE - Capittal CRM Cierre
// ============================================

import { create } from "zustand";

interface UIStore {
  // Sidebar
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  // Drawer
  isDrawerOpen: boolean;
  drawerContent: React.ReactNode | null;
  openDrawer: (content: React.ReactNode) => void;
  closeDrawer: () => void;

  // Global Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // AI Task Dialog (global)
  isAITaskDialogOpen: boolean;
  openAITaskDialog: () => void;
  closeAITaskDialog: () => void;
  toggleAITaskDialog: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Sidebar
  sidebarWidth: 240,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  // Drawer
  isDrawerOpen: false,
  drawerContent: null,
  openDrawer: (content) => set({ isDrawerOpen: true, drawerContent: content }),
  closeDrawer: () => set({ isDrawerOpen: false, drawerContent: null }),

  // Global Search
  globalSearchQuery: "",
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

  // Command Palette
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  // AI Task Dialog
  isAITaskDialogOpen: false,
  openAITaskDialog: () => set({ isAITaskDialogOpen: true }),
  closeAITaskDialog: () => set({ isAITaskDialogOpen: false }),
  toggleAITaskDialog: () => set((state) => ({ isAITaskDialogOpen: !state.isAITaskDialogOpen })),
}));
