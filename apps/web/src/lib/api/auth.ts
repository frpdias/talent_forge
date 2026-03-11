import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function getServiceSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * Verifica se o usuário autenticado é membro ativo da organização.
 * Sempre usa service role para garantir que a consulta não seja bloqueada por RLS.
 */
export async function validateOrgMembership(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('org_members')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .maybeSingle();
  return data !== null;
}
