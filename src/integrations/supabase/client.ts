import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase: Missing environment variables', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Supabase URL and Anon Key are required. Please check your .env file.');
}

console.log('🔗 Supabase: Initializing client', { 
  url: supabaseUrl.replace(/https?:\/\/.*/, 'https://***'), // Hide full URL for security
  hasKey: !!supabaseAnonKey 
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'karobar360-frontend'
    }
  }
});

// Test connection
supabase.auth.getSession().then(({ error }: { error: any }) => {
  if (error) {
    console.error('❌ Supabase: Auth session check failed', error);
  } else {
    console.log('✅ Supabase: Client initialized successfully');
  }
}).catch((err: any) => {
  console.error('❌ Supabase: Client initialization error', err);
});

export default supabase;
