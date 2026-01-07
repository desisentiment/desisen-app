import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Party } from '@/types';

// Local storage key
const PARTIES_STORAGE_KEY = 'parties-data';

// Query Keys
export const partyKeys = {
  all: ['parties'] as const,
  lists: () => [...partyKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...partyKeys.lists(), { filters }] as const,
  details: () => [...partyKeys.all, 'detail'] as const,
  detail: (id: string) => [...partyKeys.details(), id] as const,
};

// Helper functions for local storage
const getPartiesFromStorage = (): Party[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PARTIES_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const savePartiesToStorage = (parties: Party[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(parties));
};

const generateId = (): string => {
  return `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Fetch parties
export const useParties = (businessId: string) => {
  return useQuery({
    queryKey: partyKeys.list({ businessId }),
    queryFn: async (): Promise<Party[]> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const parties = getPartiesFromStorage();
      return parties.filter(party => party.business_id === businessId);
    },
    enabled: !!businessId,
  });
};

// Fetch single party
export const useParty = (id: string) => {
  return useQuery({
    queryKey: partyKeys.detail(id),
    queryFn: async (): Promise<Party | null> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const parties = getPartiesFromStorage();
      return parties.find(party => party.id === id) || null;
    },
    enabled: !!id,
  });
};

// Create party
export const useCreateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partyData: Omit<Party, 'id' | 'created_at'>): Promise<Party> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newParty: Party = {
        ...partyData,
        id: generateId(),
        created_at: new Date().toISOString(),
      };

      const parties = getPartiesFromStorage();
      const updatedParties = [...parties, newParty];
      savePartiesToStorage(updatedParties);

      return newParty;
    },
    onSuccess: () => {
      // Invalidate parties queries
      queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
    onError: (error: Error) => {
      console.error('Failed to create party:', error);
    },
  });
};

// Update party
export const useUpdateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...partyData }: Partial<Party> & { id: string }): Promise<Party> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const parties = getPartiesFromStorage();
      const updatedParties = parties.map(party =>
        party.id === id ? { ...party, ...partyData } : party
      );
      
      const updatedParty = updatedParties.find(party => party.id === id);
      if (!updatedParty) {
        throw new Error('Party not found');
      }
      
      savePartiesToStorage(updatedParties);
      return updatedParty;
    },
    onSuccess: (data) => {
      // Invalidate specific party query
      queryClient.invalidateQueries({ queryKey: partyKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
    onError: (error: Error) => {
      console.error('Failed to update party:', error);
    },
  });
};

// Delete party
export const useDeleteParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const parties = getPartiesFromStorage();
      const updatedParties = parties.filter(party => party.id !== id);
      savePartiesToStorage(updatedParties);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
    onError: (error: Error) => {
      console.error('Failed to delete party:', error);
    },
  });
};