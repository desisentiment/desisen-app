import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Item } from '@/types';

interface FallbackItemState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
  loadItems: (businessId: string) => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'currentStock'>) => Promise<void>;
  updateItem: (id: string, data: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemById: (id: string) => Item | undefined;
  getItemsByBusiness: (businessId: string) => Item[];
  adjustStock: (id: string, quantity: number, type: 'add' | 'subtract') => Promise<void>;
  getLowStockItems: (businessId: string) => Item[];
  getStockValue: (businessId: string) => number;
}

export const useFallbackItemStore = create<FallbackItemState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      loadItems: async (businessId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Load items from localStorage for this business
          const storageKey = `items-${businessId}`;
          const storedItems = localStorage.getItem(storageKey);
          
          if (storedItems) {
            const items = JSON.parse(storedItems);
            set({ items, isLoading: false });
          } else {
            set({ items: [], isLoading: false });
          }
        } catch (error) {
          console.error('Error loading items:', error);
          set({ error: 'Failed to load items', isLoading: false });
        }
      },

      addItem: async (itemData) => {
        set({ isLoading: true, error: null });
        try {
          const newItem: Item = {
            id: `item-${Date.now()}`,
            businessId: itemData.businessId,
            name: itemData.name,
            sku: itemData.sku || '',
            unit: itemData.unit || 'Piece',
            category: itemData.category || 'Other',
            purchasePrice: itemData.purchasePrice || 0,
            salePrice: itemData.salePrice || 0,
            openingStock: itemData.openingStock || 0,
            currentStock: itemData.openingStock || 0, // Set current stock to opening stock
            lowStockAlert: itemData.lowStockAlert || 0,
            createdAt: new Date(),
          };

          // Save to localStorage
          const storageKey = `items-${itemData.businessId}`;
          const currentItems = get().items;
          const updatedItems = [newItem, ...currentItems];
          
          localStorage.setItem(storageKey, JSON.stringify(updatedItems));
          
          set((state) => ({
            items: updatedItems,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error adding item:', error);
          set({ error: 'Failed to add item', isLoading: false });
        }
      },

      updateItem: async (id: string, data: Partial<Item>) => {
        set({ isLoading: true, error: null });
        try {
          const currentItems = get().items;
          const updatedItems = currentItems.map(item =>
            item.id === id ? { ...item, ...data } : item
          );

          // Update localStorage
          const businessId = currentItems.find(item => item.id === id)?.businessId || 'default-business-id';
          const storageKey = `items-${businessId}`;
          
          localStorage.setItem(storageKey, JSON.stringify(updatedItems));
          
          set((state) => ({
            items: updatedItems,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error updating item:', error);
          set({ error: 'Failed to update item', isLoading: false });
        }
      },

      deleteItem: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const currentItems = get().items;
          const updatedItems = currentItems.filter(item => item.id !== id);

          // Update localStorage
          const businessId = currentItems.find(item => item.id === id)?.businessId || 'default-business-id';
          const storageKey = `items-${businessId}`;
          
          localStorage.setItem(storageKey, JSON.stringify(updatedItems));
          
          set((state) => ({
            items: updatedItems,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error deleting item:', error);
          set({ error: 'Failed to delete item', isLoading: false });
        }
      },

      getItemById: (id: string) => {
        return get().items.find((item) => item.id === id);
      },

      getItemsByBusiness: (businessId: string) => {
        const storageKey = `items-${businessId}`;
        const storedItems = localStorage.getItem(storageKey);
        return storedItems ? JSON.parse(storedItems) : [];
      },

      adjustStock: async (id: string, quantity: number, type: 'add' | 'subtract') => {
        set({ isLoading: true, error: null });
        try {
          const currentItems = get().items;
          const item = currentItems.find((i) => i.id === id);
          
          if (!item) throw new Error('Item not found');

          const newStock = type === 'add'
            ? item.currentStock + quantity
            : Math.max(0, item.currentStock - quantity);

          const updatedItems = currentItems.map(i =>
            i.id === id ? { ...i, currentStock: newStock } : i
          );

          // Update localStorage
          const businessId = item.businessId || 'default-business-id';
          const storageKey = `items-${businessId}`;
          
          localStorage.setItem(storageKey, JSON.stringify(updatedItems));
          
          set((state) => ({
            items: updatedItems,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error adjusting stock:', error);
          set({ error: 'Failed to adjust stock', isLoading: false });
        }
      },

      getLowStockItems: (businessId: string) => {
        try {
          const items = get().getItemsByBusiness(businessId);
          return items.filter(
            (item) => item.currentStock <= item.lowStockAlert
          ) || [];
        } catch (error) {
          console.error('Error in getLowStockItems:', error);
          return [];
        }
      },

      getStockValue: (businessId: string) => {
        try {
          const items = get().getItemsByBusiness(businessId);
          return items.reduce((total, item) => 
            total + ((item.currentStock || 0) * (item.purchasePrice || 0)), 0
          );
        } catch (error) {
          console.error('Error in getStockValue:', error);
          return 0;
        }
      },
    }),
    {
      name: 'fallback-item-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
