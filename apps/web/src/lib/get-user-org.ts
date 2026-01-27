/**
 * Função auxiliar para buscar a organização do usuário autenticado
 * Retorna org_id ou lança erro com mensagem clara
 */
import { SupabaseClient } from '@supabase/supabase-js';

interface OrgMember {
  org_id: string;
  role: string;
  status: string;
}

export async function getUserOrganization(
  supabase: SupabaseClient
): Promise<OrgMember> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Usuário não autenticado');
  }

  // Buscar todas as organizações do usuário e pegar a primeira ativa
  const { data: members, error: memberError } = await supabase
    .from('org_members')
    .select('org_id, role, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (memberError) {
    console.error('Error fetching org_members:', memberError, 'for user:', user.id);
    throw new Error('Erro ao buscar organização do usuário');
  }

  if (!members || members.length === 0) {
    console.error('No active organization found for user:', user.id, user.email);
    throw new Error(
      'Organização não encontrada. Você precisa estar vinculado a uma organização. ' +
      'Entre em contato com o administrador do sistema.'
    );
  }

  // Se o usuário tem múltiplas organizações, retornar a primeira (mais recente)
  const member = members[0];

  if (members.length > 1) {
    console.log(`User ${user.id} has ${members.length} organizations. Using org_id: ${member.org_id}`);
  }

  return member;
}
