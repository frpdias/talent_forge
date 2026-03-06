import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Conexão direta ao Supabase com service role
// Bypassa RLS para operações MCP autenticadas por API key
// Conforme DA: service role APENAS para operações aprovadas de sistema

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Valida que a org_id passada é válida antes de qualquer query
export async function validateOrg(orgId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, status')
    .eq('id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  return !error && data !== null;
}
