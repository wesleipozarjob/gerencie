import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase do usuário
export const DEFAULT_SUPABASE_URL = 'https://kmobwowcxegheknlosgx.supabase.co';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('gerencie_supabase_url');
  const localKey = localStorage.getItem('gerencie_supabase_key');

  const supabaseUrl = envUrl || localUrl || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = envKey || localKey || '';

  return { 
    supabaseUrl: supabaseUrl.trim(), 
    supabaseAnonKey: supabaseAnonKey.trim(), 
    isConfigured: Boolean(supabaseAnonKey && supabaseAnonKey.trim().length > 15) 
  };
};

let clientInstance = null;

export const getSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();
  
  if (!isConfigured) {
    return null;
  }

  try {
    if (!clientInstance) {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return clientInstance;
  } catch (err) {
    console.error('Erro ao inicializar Supabase client:', err);
    return null;
  }
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};
