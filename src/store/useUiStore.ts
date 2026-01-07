import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UiState {
  // Sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Bottom navigation state
  isBottomNavVisible: boolean;
  toggleBottomNav: () => void;
  setBottomNavVisible: (visible: boolean) => void;

  // Theme state
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Mobile view state
  isMobileView: boolean;
  setMobileView: (isMobile: boolean) => void;

  // Search state
  isSearchOpen: boolean;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;

  // Toast/Notification state
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      // Sidebar state
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      // Bottom navigation state
      isBottomNavVisible: true,
      toggleBottomNav: () =>
        set((state) => ({ isBottomNavVisible: !state.isBottomNavVisible })),
      setBottomNavVisible: (visible) => set({ isBottomNavVisible: visible }),

      // Theme state
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Mobile view state
      isMobileView: false,
      setMobileView: (isMobile) => set({ isMobileView: isMobile }),

      // Search state
      isSearchOpen: false,
      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      // Toast/Notification state
      toasts: [],
      addToast: (toast: Omit<ToastItem, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: ToastItem = { ...toast, id };
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after 3 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 3000);
      },
      removeToast: (id: string) =>
        set((state) => ({
          toasts: state.toasts.filter((t: ToastItem) => t.id !== id),
        })),
      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        isBottomNavVisible: state.isBottomNavVisible,
        theme: state.theme,
      }),
    }
  )
);
