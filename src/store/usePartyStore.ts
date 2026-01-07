import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Party } from '@/types';

interface PartyState {
  // All parties (customers and suppliers)
  parties: Party[];
  addParty: (party: Omit<Party, 'id' | 'created_at'>) => Party;
  updateParty: (id: string, data: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  // Party loading state
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Helpers
  getPartyById: (id: string) => Party | undefined;
  getCustomers: (businessId: string) => Party[];
  getSuppliers: (businessId: string) => Party[];
  getPartiesByBusiness: (businessId: string) => Party[];
  getAllParties: (businessId: string) => Party[];
  clearAllParties: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set, get) => ({
      // All parties
      parties: [],
      addParty: (partyData) => {
        const newParty: Party = {
          id: `party-${Date.now()}`,
          business_id: partyData.business_id,
          name: partyData.name,
          phone: partyData.phone,
          city: partyData.city,
          address: partyData.address,
          type: partyData.type,
          opening_balance: partyData.opening_balance,
          balance_type: partyData.balance_type,
          credit_limit: partyData.credit_limit,
          notes: partyData.notes,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          parties: [...state.parties, newParty],
        }));

        return newParty;
      },

      updateParty: (id: string, data: Partial<Party>) => {
        set((state) => ({
          parties: state.parties.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }));
      },

      deleteParty: (id: string) => {
        set((state) => ({
          parties: state.parties.filter((p) => p.id !== id),
        }));
      },

      // Party loading state
      isLoading: false,
      error: null,
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Helpers
      getPartyById: (id: string) => {
        return get().parties.find((p) => p.id === id);
      },

      getCustomers: (businessId: string) => {
        return get().parties.filter(
          (p) => p.business_id === businessId && p.type === 'customer'
        );
      },

      getSuppliers: (businessId: string) => {
        return get().parties.filter(
          (p) => p.business_id === businessId && p.type === 'supplier'
        );
      },

      getPartiesByBusiness: (businessId: string) => {
        return get().parties.filter((p) => p.business_id === businessId);
      },

      getAllParties: (businessId: string) => {
        return get().parties.filter((p) => p.business_id === businessId);
      },

      clearAllParties: () => {
        set({ parties: [] });
      },
    }),
    {
      name: 'party-storage',
      partialize: (state) => ({
        parties: state.parties,
      }),
    }
  )
);
