import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateOrgMembership } from '@/lib/api/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/php/teams/:id/available-members
 * Retorna employees ativos da org que ainda não estão no time
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId } = await params;
    const supabase = getSupabase();

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    // Busca o time para saber seu nome (usado como referência de departamento)
    const { data: team } = await supabase
      .from('teams')
      .select('name, org_id')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // user_ids já no time (team_members.user_id = auth.users.id)
    const { data: currentMembers } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const memberAuthIds = (currentMembers || []).map((m: any) => m.user_id).filter(Boolean);

    // Employees da org que NÃO estão no departamento correspondente ao time
    // E NÃO já estão em team_members
    // (employees do departamento já aparecem como membros do time automaticamente)
    let query = supabase
      .from('employees')
      .select('id, full_name, position, department, manager_id, user_id')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .neq('department', team.name) // excluir employees do departamento do time
      .order('full_name', { ascending: true });

    if (memberAuthIds.length > 0) {
      query = query.not('user_id', 'in', `(${memberAuthIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[available-members] GET error:', error);
      return NextResponse.json({ error: 'Erro ao buscar funcionários disponíveis' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
