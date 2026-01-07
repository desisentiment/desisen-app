import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { toast } from '../hooks/use-toast';

type ItemRow = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
type ItemUpdate = Database['public']['Tables']['items']['Update'];

// Query Keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

// Fetch items
export const useItems = (businessId: string) => {
  return useQuery({
    queryKey: itemKeys.list({ businessId }),
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', businessId)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch items: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!businessId,
  });
};

// Fetch single item
export const useItem = (id: string) => {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async (): Promise<ItemRow> => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch item: ${error.message}`);
      }

      return data;
    },
    enabled: !!id,
  });
};

// Create item
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemData: ItemInsert): Promise<ItemRow> => {
      const { data, error } = await supabase
        .from('items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create item: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      toast({
        title: "Success",
        description: "Item created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Update item
export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...itemData }: ItemUpdate & { id: string }): Promise<ItemRow> => {
      const { data, error } = await supabase
        .from('items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update item: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete item: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};