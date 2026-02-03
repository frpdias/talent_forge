/**
 * Cliente para chamadas autenticadas à API
 * Busca automaticamente token JWT e org_id do usuário logado
 */

import { createClient } from '@/lib/supabase/client';
import { getUserOrganization } from '@/lib/get-user-org';

/**
 * Busca headers de autenticação (JWT token + org_id)
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  
  // Buscar sessão atual
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar organização do usuário
  const { org_id } = await getUserOrganization(supabase);

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'x-org-id': org_id,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch autenticado - adiciona automaticamente token e org_id
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}
