import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * POST /api/v1/php/teams/:id/members
 * Adiciona um employee ao time
 * Body: { user_id: employeeId, role_in_team?: 'member'|'lead'|'coordinator' }
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId } = await params;
    const body = await request.json();
    const { user_id: employeeId, role_in_team = 'member' } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'user_id (employee) é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Valida que o time existe e pertence à org
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Valida que o employee existe, pertence à org e tem conta Supabase
    const { data: employee } = await supabase
      .from('employees')
      .select('id, user_id')
      .eq('id', employeeId)
      .eq('organization_id', orgId)
      .single();

    if (!employee) {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }

    if (!employee.user_id) {
      return NextResponse.json(
        { error: 'Este funcionário não possui conta de acesso configurada e não pode ser adicionado ao time' },
        { status: 422 }
      );
    }

    // Insere usando auth user_id (schema canônico: team_members.user_id → auth.users)
    const { data, error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: employee.user_id, role_in_team })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Funcionário já está neste time' }, { status: 409 });
      }
      console.error('[team/members] POST error:', error);
      return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
    }

    // Atualiza member_count
    try {
      await supabase.rpc('update_team_member_count', { p_team_id: teamId });
    } catch {
      // Fallback manual se a função não existir
      const { count } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId);
      if (count !== null) {
        await supabase.from('teams').update({ member_count: count }).eq('id', teamId);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
