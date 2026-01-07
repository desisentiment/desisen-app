import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupabaseQueryOptions {
  table: string;
  filters?: Record<string, unknown>;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  businessId?: string;
  userId?: string;
}

export interface SupabaseMutationOptions {
  table: string;
  data: Record<string, unknown>;
  businessId?: string;
  userId?: string;
}

// Debug logging utility
const logQuery = (operation: string, options: SupabaseQueryOptions | SupabaseMutationOptions, error?: { message?: string } | string | unknown) => {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    table: options.table,
    businessId: options.businessId,
    userId: options.userId,
    filters: 'filters' in options ? options.filters : undefined,
    error: typeof error === 'string' ? error : error?.message || error,
  };

  if (error) {
    console.error('❌ Supabase Query Error:', logData);
    toast.error(`Database Error: ${typeof error === 'string' ? error : error?.message || 'Unknown error'}`);
  } else {
    console.log('🔍 Supabase Query:', logData);
  }
};

// Wrapper for SELECT queries
export async function supabaseQuery<T = Record<string, unknown>>(options: SupabaseQueryOptions): Promise<T[]> {
  try {
    let query = supabase.from(options.table).select(options.select || '*');

    // Apply business_id filter if provided
    if (options.businessId) {
      query = query.eq('business_id', options.businessId);
    }

    // Apply other filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    logQuery('SELECT', options, error);

    if (error) {
      throw error;
    }

    return (data as T[]) || [];
  } catch (error) {
    logQuery('SELECT', options, error);
    throw error;
  }
}

// Wrapper for INSERT mutations
export async function supabaseInsert(options: SupabaseMutationOptions) {
  try {
    // Auto-add business_id if provided
    const dataToInsert = {
      ...options.data,
      ...(options.businessId && { business_id: options.businessId }),
      ...(options.userId && { user_id: options.userId }),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(options.table)
      .insert(dataToInsert)
      .select()
      .single();

    logQuery('INSERT', options, error);

    if (error) {
      throw error;
    }

    toast.success('Data saved successfully!');
    return data;
  } catch (error) {
    logQuery('INSERT', options, error);
    throw error;
  }
}

// Wrapper for UPDATE mutations
export async function supabaseUpdate(options: { table: string; id: string; data: Record<string, unknown>; businessId?: string }) {
  try {
    const { data, error } = await supabase
      .from(options.table)
      .update({
        ...options.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.id)
      .eq('business_id', options.businessId || '');

    logQuery('UPDATE', options, error);

    if (error) {
      throw error;
    }

    toast.success('Data updated successfully!');
    return data;
  } catch (error) {
    logQuery('UPDATE', options, error);
    throw error;
  }
}

// Wrapper for DELETE mutations
export async function supabaseDelete(options: { table: string; id: string; businessId?: string }) {
  try {
    const { error } = await supabase
      .from(options.table)
      .delete()
      .eq('id', options.id)
      .eq('business_id', options.businessId || '');

    logQuery('DELETE', options, error);

    if (error) {
      throw error;
    }

    toast.success('Data deleted successfully!');
    return true;
  } catch (error) {
    logQuery('DELETE', options, error);
    throw error;
  }
}
