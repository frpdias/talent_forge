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

/**
 * GET /api/v1/php/teams
 * Lista os times de uma organização com contagem real de membros
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const supabase = getSupabase();

    let query = supabase
      .from('teams')
      .select(`
        id, org_id, name, description, manager_id, member_count, created_at, updated_at,
        team_members(count)
      `)
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[teams] GET error:', error);
      return NextResponse.json({ error: 'Erro ao buscar times' }, { status: 500 });
    }

    // Normaliza contagem real de membros
    const teams = (data || []).map((team: any) => ({
      ...team,
      member_count: team.team_members?.[0]?.count ?? team.member_count ?? 0,
      team_members: undefined,
    }));

    return NextResponse.json({ data: teams, total: teams.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/teams
 * Cria um novo time
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const body = await request.json();
    const { name, description, manager_id, organization_id } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome do time é obrigatório' }, { status: 400 });
    }

    const effectiveOrgId = organization_id || orgId;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('teams')
      .insert({
        org_id: effectiveOrgId,
        name: name.trim(),
        description: description?.trim() || null,
        manager_id: manager_id || null,
        member_count: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe um time com este nome nesta organização' }, { status: 409 });
      }
      console.error('[teams] POST error:', error);
      return NextResponse.json({ error: 'Erro ao criar time' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
