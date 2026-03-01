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
 * GET /api/v1/php/teams/:id
 * Retorna time com membros (joined a employees)
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId } = await params;
    const supabase = getSupabase();

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, org_id, name, description, manager_id, member_count, created_at, updated_at')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Busca membros com dados do employee
    const { data: members } = await supabase
      .from('team_members')
      .select(`
        id, team_id, user_id, role_in_team, joined_at,
        employees!team_members_employee_id_fkey(id, full_name, position, department, manager_id)
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    // Normaliza employee como campo 'employee'
    const normalizedMembers = (members || []).map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user_id,
      role_in_team: m.role_in_team,
      joined_at: m.joined_at,
      employee: m.employees || null,
    }));

    // Busca dados do gestor se existir
    let manager = null;
    if (team.manager_id) {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('id', team.manager_id)
        .single();
      manager = emp;
    }

    return NextResponse.json({ ...team, members: normalizedMembers, manager });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/php/teams/:id
 * Atualiza nome, descrição ou gestor do time
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.manager_id !== undefined) updates.manager_id = body.manager_id;

    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe um time com este nome' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Erro ao atualizar time' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/php/teams/:id
 * Remove o time e seus membros (cascade)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId } = await params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .eq('org_id', orgId);

    if (error) {
      return NextResponse.json({ error: 'Erro ao excluir time' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
