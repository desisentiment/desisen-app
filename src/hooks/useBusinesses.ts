import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { toast } from '../hooks/use-toast';

type BusinessRow = Database['public']['Tables']['businesses']['Row'];
type BusinessInsert = Database['public']['Tables']['businesses']['Insert'];
type BusinessUpdate = Database['public']['Tables']['businesses']['Update'];

// Query Keys
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...businessKeys.lists(), { filters }] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (id: string) => [...businessKeys.details(), id] as const,
};

// Fetch businesses for current user
export const useBusinesses = (userId: string) => {
  return useQuery({
    queryKey: businessKeys.list({ userId }),
    queryFn: async (): Promise<BusinessRow[]> => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch businesses: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!userId,
  });
};

// Fetch single business
export const useBusiness = (id: string) => {
  return useQuery({
    queryKey: businessKeys.detail(id),
    queryFn: async (): Promise<BusinessRow> => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch business: ${error.message}`);
      }

      return data;
    },
    enabled: !!id,
  });
};

// Create business
export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessData: BusinessInsert): Promise<BusinessRow> => {
      const { data, error } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create business: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      toast({
        title: "Success",
        description: "Business created successfully",
      });
      return data;
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

// Update business
export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...businessData }: BusinessUpdate & { id: string }): Promise<BusinessRow> => {
      const { data, error } = await supabase
        .from('businesses')
        .update(businessData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update business: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      toast({
        title: "Success",
        description: "Business updated successfully",
      });
      return data;
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

// Delete business
export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete business: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      toast({
        title: "Success",
        description: "Business deleted successfully",
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