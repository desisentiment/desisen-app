import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Business } from '@/types';
import { mockBusinesses } from '@/data/mockData';

interface BusinessState {
  // Current active business
  currentBusiness: Business | null;
  currentBusinessId: string | null;
  setCurrentBusiness: (business: Business | null) => void;

  // All businesses (for multi-business support)
  businesses: Business[];
  addBusiness: (business: Omit<Business, 'id' | 'createdAt'>) => Business;
  updateBusiness: (id: string, data: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;

  // Business loading state
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Helpers
  getBusinessById: (id: string) => Business | undefined;
  getCurrentBusiness: () => Business | null;
  getAllBusinesses: () => Business[];
  clearAllBusinesses: () => void;
  clearBusinessData: (businessId: string) => void;
  initialize: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => {
      // Initialize default business if none exists
      const initializeDefaultBusiness = () => {
        const state = get();
        if (state.businesses.length === 0 && !state.currentBusiness) {
          // Use mock business if available, otherwise create default
          const defaultBusiness = mockBusinesses.length > 0 ? mockBusinesses[0] : {
            id: 'default-business-id',
            name: 'Default Business',
            phone: '+92-300-0000000',
            address: 'Default Address',
            city: 'Karachi',
            currency: 'PKR',
            createdAt: new Date(),
          };
          
          set({
            businesses: [defaultBusiness],
            currentBusiness: defaultBusiness,
          });
        }
      };

      return {
        // Current active business
        currentBusiness: null,
        get currentBusinessId() {
          return get().currentBusiness?.id || null;
        },
        setCurrentBusiness: (business) => set({ currentBusiness: business }),

        // All businesses
        businesses: [],
        addBusiness: (businessData) => {
          const newBusiness: Business = {
            id: `business-${Date.now()}`,
            name: businessData.name,
            phone: businessData.phone,
            address: businessData.address,
            city: businessData.city,
            logoUrl: businessData.logoUrl,
            currency: businessData.currency,
            createdAt: new Date(),
          };

          set((state) => ({
            businesses: [...state.businesses, newBusiness],
            currentBusiness: newBusiness,
          }));

          return newBusiness;
        },

        updateBusiness: (id: string, data: Partial<Business>) => {
          set((state) => ({
            businesses: state.businesses.map((b) =>
              b.id === id ? { ...b, ...data } : b
            ),
            currentBusiness:
              state.currentBusiness?.id === id
                ? { ...state.currentBusiness, ...data }
                : state.currentBusiness,
          }));
        },

        deleteBusiness: (id: string) => {
          set((state) => ({
            businesses: state.businesses.filter((b) => b.id !== id),
            currentBusiness:
              state.currentBusiness?.id === id ? null : state.currentBusiness,
          }));
        },

        // Business loading state
        isLoading: false,
        error: null,
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Helpers
        getBusinessById: (id: string) => {
          return get().businesses.find((b) => b.id === id);
        },

        getCurrentBusiness: () => {
          const current = get().currentBusiness;
          if (!current) {
            initializeDefaultBusiness();
            return get().currentBusiness;
          }
          return current;
        },

        getAllBusinesses: () => {
          return get().businesses;
        },

        clearAllBusinesses: () => {
          set({ businesses: [], currentBusiness: null });
        },

        clearBusinessData: (businessId: string) => {
          set((state) => {
            if (state.currentBusiness?.id === businessId) {
              return { currentBusiness: null };
            }
            return state;
          });
        },
        
        // Initialize on store creation
        initialize: () => {
          initializeDefaultBusiness();
        },
      };
    },
    {
      name: 'business-storage',
      partialize: (state) => ({
        currentBusiness: state.currentBusiness,
        businesses: state.businesses,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize?.();
        }
      },
    }
  )
);
