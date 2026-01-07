import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Item } from '@/types';

interface ItemState {
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => Item;
  updateItem: (id: string, data: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  getItemById: (id: string) => Item | undefined;

  // Business-specific operations
  getItemsByBusiness: (businessId: string) => Item[];
  adjustStock: (id: string, quantity: number, type: 'add' | 'subtract') => void;
  
  // Dashboard statistics
  getStockValue: (businessId: string) => number;
  getLowStockItems: (businessId: string) => Item[];

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: (itemData) => {
        const newItem: Item = {
          ...itemData,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));

        return newItem;
      },

      updateItem: (id: string, data: Partial<Item>) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        }));
      },

      deleteItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      getItemById: (id: string) => {
        return get().items.find((item) => item.id === id);
      },

      getItemsByBusiness: (businessId: string) => {
        return get().items.filter((item) => item.businessId === businessId);
      },

      adjustStock: (id: string, quantity: number, type: 'add' | 'subtract') => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const currentStock = Number(item.currentStock) || 0;
              const newStock = type === 'add' ? currentStock + quantity : currentStock - quantity;
              return { ...item, currentStock: Math.max(0, newStock) };
            }
            return item;
          }),
        }));
      },

      getStockValue: (businessId: string) => {
        const businessItems = get().items.filter((item) => item.businessId === businessId);
        return businessItems.reduce((total, item) => {
          return total + (item.currentStock * item.purchasePrice);
        }, 0);
      },

      getLowStockItems: (businessId: string) => {
        const businessItems = get().items.filter((item) => item.businessId === businessId);
        return businessItems.filter((item) => item.currentStock <= item.lowStockAlert);
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'item-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
