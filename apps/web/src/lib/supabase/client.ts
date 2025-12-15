import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance para evitar múltiplas instâncias do GoTrueClient
let client: SupabaseClient<any>;

export function createClient(): SupabaseClient<any> {
  if (client) {
    return client;
  }

  client = createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
