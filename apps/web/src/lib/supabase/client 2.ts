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

/**
 * Retorna um access_token sempre fresco.
 *
 * getSession() lê o cache local — pode retornar um token expirado se o
 * auto-refresh ainda não disparou (ex: aba em segundo plano).
 * getUser() valida o token com o servidor e dispara o refresh se necessário,
 * então getSession() após ele entrega o token atualizado.
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
