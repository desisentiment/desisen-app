import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';
import { toast } from '../hooks/use-toast';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

// Query Keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

// Fetch invoices
export const useInvoices = (businessId: string) => {
  return useQuery({
    queryKey: invoiceKeys.list({ businessId }),
    queryFn: async (): Promise<InvoiceRow[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!businessId,
  });
};

// Fetch invoices by type
export const useInvoicesByType = (businessId: string, type: Database['public']['Enums']['invoice_type']) => {
  return useQuery({
    queryKey: invoiceKeys.list({ businessId, type }),
    queryFn: async (): Promise<InvoiceRow[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessId)
        .eq('type', type)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invoices by type: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!businessId && !!type,
  });
};

// Fetch single invoice
export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async (): Promise<InvoiceRow> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        throw new Error(`Failed to fetch invoice: ${error.message}`);
      }

      return data;
    },
    enabled: !!id,
  });
};

// Create invoice
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: InvoiceInsert): Promise<InvoiceRow> => {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create invoice: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast({
        title: "Success",
        description: "Invoice created successfully",
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

// Update invoice
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...invoiceData }: InvoiceUpdate & { id: string }): Promise<InvoiceRow> => {
      const { data, error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update invoice: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
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

// Soft delete invoice (mark as deleted)
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('invoices')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete invoice: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
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

// Restore deleted invoice
export const useRestoreInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('invoices')
        .update({ is_deleted: false })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to restore invoice: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      toast({
        title: "Success",
        description: "Invoice restored successfully",
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