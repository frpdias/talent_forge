import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GET /api/v1/team/members
 * Retorna membros da organização do usuário logado com seus perfis.
 * Usa service role para bypassar RLS de user_profiles (que bloqueia leitura cross-user).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Descobre o org_id do usuário logado
    // Sem filtro de status pois registros criados via organizations.service.ts
    // não definem status (fica NULL) e seriam excluídos pelo filtro 'active'.
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .neq('status', 'inactive')
      .maybeSingle();

    if (!membership?.org_id) {
      return NextResponse.json([]);
    }

    // 2. Lista todos os membros não-inativos da org
    const { data: orgMembers, error: membersError } = await supabase
      .from('org_members')
      .select('user_id, role, created_at')
      .eq('org_id', membership.org_id)
      .neq('status', 'inactive')
      .order('created_at', { ascending: false });

    if (membersError) throw membersError;
    if (!orgMembers || orgMembers.length === 0) return NextResponse.json([]);

    const userIds = orgMembers.map((m: any) => m.user_id).filter(Boolean);

    // 3. Busca perfis via service role (bypassa RLS que só permite ver o próprio perfil)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, user_type')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    const profileMap = Object.fromEntries(
      (profiles || []).map((p: any) => [p.id, p])
    );

    const members = orgMembers.map((m: any) => ({
      id: m.user_id,
      full_name: profileMap[m.user_id]?.full_name || '',
      email: profileMap[m.user_id]?.email || '',
      user_type: profileMap[m.user_id]?.user_type || m.role,
      created_at: m.created_at,
    }));

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('[team/members] GET error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
