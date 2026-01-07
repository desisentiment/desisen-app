import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseQuery, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseQuery';
import { showToast, showDatabaseError } from '@/components/ErrorToast';
import { Party, Item } from '@/types';

// Query Keys
export const unifiedKeys = {
  parties: ['parties'] as const,
  items: ['items'] as const,
  invoices: ['invoices'] as const,
  
  partiesList: (businessId: string) => [...unifiedKeys.parties, 'list', businessId] as const,
  itemsList: (businessId: string) => [...unifiedKeys.items, 'list', businessId] as const,
  invoicesList: (businessId: string) => [...unifiedKeys.invoices, 'list', businessId] as const,
};

// ========== PARTIES ==========
export const useUnifiedParties = (businessId: string) => {
  return useQuery({
    queryKey: unifiedKeys.partiesList(businessId),
    queryFn: async (): Promise<Party[]> => {
      try {
        // First try to get from Supabase
        const data = await supabaseQuery<Party>({
          table: 'parties',
          businessId,
          orderBy: { column: 'created_at', ascending: false }
        });
        
        if (data.length > 0) {
          return data;
        }
        
        // Fallback to localStorage if Supabase is empty
        const localData = localStorage.getItem(`parties-${businessId}`);
        if (localData) {
          const parties = JSON.parse(localData);
          showToast.info('Using local data - database sync pending');
          return parties;
        }
        
        return [];
      } catch (error) {
        // Fallback to localStorage on error
        console.warn('Supabase failed, using localStorage:', error);
        const localData = localStorage.getItem(`parties-${businessId}`);
        if (localData) {
          const parties = JSON.parse(localData);
          showToast.warning('Using local data - connection issues');
          return parties;
        }
        showDatabaseError(error, 'loading parties');
        return [];
      }
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUnifiedCreateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partyData: Omit<Party, 'id' | 'created_at'>) => {
      try {
        // Try Supabase first
        const result = await supabaseInsert({
          table: 'parties',
          data: partyData,
          businessId: partyData.business_id,
        });
        return result;
      } catch (error) {
        // Fallback to localStorage
        console.warn('Supabase insert failed, using localStorage:', error);
        
        const newParty: Party = {
          ...partyData,
          id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
        };
        
        const existingData = localStorage.getItem(`parties-${partyData.business_id}`);
        const parties = existingData ? JSON.parse(existingData) : [];
        parties.push(newParty);
        localStorage.setItem(`parties-${partyData.business_id}`, JSON.stringify(parties));
        
        showToast.warning('Saved locally - will sync when connection is restored');
        return newParty;
      }
    },
    onSuccess: (mutationParams: { businessId: string }) => {
      queryClient.invalidateQueries({ queryKey: unifiedKeys.partiesList(mutationParams.businessId) });
      showToast.success('Party created successfully!');
    },
    onError: (error) => {
      showDatabaseError(error, 'creating party');
    },
  });
};

export const useUnifiedUpdateParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, businessId }: { id: string; data: Partial<Party>; businessId: string }) => {
      try {
        const result = await supabaseUpdate({
          table: 'parties',
          id,
          data,
          businessId,
        });
        return result;
      } catch (error) {
        // Fallback to localStorage
        console.warn('Supabase update failed, using localStorage:', error);
        
        const existingData = localStorage.getItem(`parties-${businessId}`);
        const parties = existingData ? JSON.parse(existingData) : [];
        const updatedParties = parties.map((p: Party) => 
          p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
        );
        localStorage.setItem(`parties-${businessId}`, JSON.stringify(updatedParties));
        
        const updatedParty = updatedParties.find((p: Party) => p.id === id);
        showToast.warning('Updated locally - will sync when connection is restored');
        return updatedParty;
      }
    },
    onSuccess: (params: { businessId: string }) => {
      queryClient.invalidateQueries({ queryKey: unifiedKeys.partiesList(params.businessId) });
      showToast.success('Party updated successfully!');
    },
    onError: (error) => {
      showDatabaseError(error, 'updating party');
    },
  });
};

export const useUnifiedDeleteParty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      try {
        await supabaseDelete({
          table: 'parties',
          id,
          businessId,
        });
        return true;
      } catch (error) {
        // Fallback to localStorage
        console.warn('Supabase delete failed, using localStorage:', error);
        
        const existingData = localStorage.getItem(`parties-${businessId}`);
        const parties = existingData ? JSON.parse(existingData) : [];
        const filteredParties = parties.filter((p: Party) => p.id !== id);
        localStorage.setItem(`parties-${businessId}`, JSON.stringify(filteredParties));
        
        showToast.warning('Deleted locally - will sync when connection is restored');
        return true;
      }
    },
    onSuccess: (mutationParams) => {
      queryClient.invalidateQueries({ queryKey: unifiedKeys.partiesList(mutationParams.businessId) });
      showToast.success('Party deleted successfully!');
    },
    onError: (error) => {
      showDatabaseError(error, 'deleting party');
    },
  });
};

// ========== ITEMS ==========
export const useUnifiedItems = (businessId: string) => {
  return useQuery({
    queryKey: unifiedKeys.itemsList(businessId),
    queryFn: async (): Promise<Item[]> => {
      try {
        const data = await supabaseQuery<Item>({
          table: 'items',
          businessId,
          orderBy: { column: 'created_at', ascending: false }
        });
        
        if (data.length > 0) {
          return data;
        }
        
        // Fallback to localStorage if Supabase is empty
        const localData = localStorage.getItem(`items-${businessId}`);
        if (localData) {
          const items = JSON.parse(localData);
          showToast.info('Using local data - database sync pending');
          return items;
        }
        
        return [];
      } catch (error) {
        // Fallback to localStorage on error
        console.warn('Supabase failed, using localStorage:', error);
        const localData = localStorage.getItem(`items-${businessId}`);
        if (localData) {
          const items = JSON.parse(localData);
          showToast.warning('Using local data - connection issues');
          return items;
        }
        showDatabaseError(error, 'loading items');
        return [];
      }
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUnifiedCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: Omit<Item, 'id' | 'created_at'>) => {
      try {
        const result = await supabaseInsert({
          table: 'items',
          data: { ...itemData, business_id: itemData.businessId },
          businessId: itemData.businessId,
        });
        return result;
      } catch (error) {
        // Fallback to localStorage
        console.warn('Supabase insert failed, using localStorage:', error);
        
        const newItem: Item = {
          ...itemData,
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };
        
        const existingData = localStorage.getItem(`items-${itemData.businessId}`);
        const items = existingData ? JSON.parse(existingData) : [];
        items.push(newItem);
        localStorage.setItem(`items-${itemData.businessId}`, JSON.stringify(items));
        
        showToast.warning('Saved locally - will sync when connection is restored');
        return newItem;
      }
    },
    onSuccess: (mutationParams) => {
      queryClient.invalidateQueries({ queryKey: unifiedKeys.itemsList(mutationParams.businessId) });
      showToast.success('Item created successfully!');
    },
    onError: (error) => {
      showDatabaseError(error, 'creating item');
    },
  });
};

export const useUnifiedUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, businessId }: { id: string; data: Partial<Item>; businessId: string }) => {
      try {
        const result = await supabaseUpdate({
          table: 'items',
          id,
          data,
          businessId,
        });
        return result;
      } catch (error) {
        // Fallback to localStorage
        console.warn('Supabase update failed, using localStorage:', error);
        
        const existingData = localStorage.getItem(`items-${businessId}`);
        const items = existingData ? JSON.parse(existingData) : [];
        const updatedItems = items.map((i: Item) => 
          i.id === id ? { ...i, ...data, updatedAt: new Date() } : i
        );
        localStorage.setItem(`items-${businessId}`, JSON.stringify(updatedItems));
        
        const updatedItem = updatedItems.find((i: Item) => i.id === id);
        showToast.warning('Updated locally - will sync when connection is restored');
        return updatedItem;
      }
    },
    onSuccess: (mutationParams) => {
      queryClient.invalidateQueries({ queryKey: unifiedKeys.itemsList(mutationParams.businessId) });
      showToast.success('Item updated successfully!');
    },
    onError: (error) => {
      showDatabaseError(error, 'updating item');
    },
  });
};

export const useUnifiedDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      try {
        await supabaseDelete({
          table: 'items',
          id,
          businessId,
        });
        return true;
      } catch (error) {
        // Fallback to localStorage
        console.warn('Supabase delete failed, using localStorage:', error);
        
        const existingData = localStorage.getItem(`items-${businessId}`);
        const items = existingData ? JSON.parse(existingData) : [];
        const filteredItems = items.filter((i: Item) => i.id !== id);
        localStorage.setItem(`items-${businessId}`, JSON.stringify(filteredItems));
        
        showToast.warning('Deleted locally - will sync when connection is restored');
        return true;
      }
    },
    onSuccess: (mutationParams) => {
      queryClient.invalidateQueries({ queryKey: unifiedKeys.itemsList(mutationParams.businessId) });
      showToast.success('Item deleted successfully!');
    },
    onError: (error) => {
      showDatabaseError(error, 'deleting item');
    },
  });
};

// Helper functions to get specific data
export const useUnifiedCustomers = (businessId: string) => {
  const parties = useUnifiedParties(businessId);
  return parties?.data?.filter((party: Party) => party.type === 'customer') || [];
};

export const useUnifiedSuppliers = (businessId: string) => {
  const parties = useUnifiedParties(businessId);
  return parties?.data?.filter((party: Party) => party.type === 'supplier') || [];
};

// Dropdown data helpers
export const usePartyDropdownData = (businessId: string) => {
  const customers = useUnifiedCustomers(businessId);
  const suppliers = useUnifiedSuppliers(businessId);
  
  const customerOptions = customers.map((customer: Party) => ({
    label: customer.name,
    value: customer.id,
    phone: customer.phone,
    city: customer.city,
  }));
  
  const supplierOptions = suppliers.map((supplier: Party) => ({
    label: supplier.name,
    value: supplier.id,
    phone: supplier.phone,
    city: supplier.city,
  }));
  
  return {
    customerOptions,
    supplierOptions,
    allOptions: [...customerOptions, ...supplierOptions],
  };
};

export const useItemDropdownData = (businessId: string) => {
  const items = useUnifiedItems(businessId);
  
  const itemOptions = items.data?.map((item: Item) => ({
    label: item.name,
    value: item.id,
    price: item.salePrice,
    unit: item.unit,
    stock: item.currentStock,
  })) || [];
  
  return { itemOptions };
};
