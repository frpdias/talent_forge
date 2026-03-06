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
 * Lista os times de uma organização com contagem dinâmica de membros.
 *
 * A contagem de membros é calculada a partir dos employees ativos cujo
 * `department` corresponde ao `name` do time. Isso garante que a contagem
 * esteja sempre atualizada, independentemente de quando o time foi criado.
 *
 * Conforme Arquitetura Canônica:
 * - teams.org_id → organizations.id
 * - employees.organization_id → organizations.id (note: campo diferente)
 * - Relação implícita: teams.name ↔ employees.department
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

    // 1. Busca todos os times da org
    let query = supabase
      .from('teams')
      .select('id, org_id, name, description, manager_id, member_count, created_at, updated_at')
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

    // 2. Busca contagem real de employees por departamento (fonte de verdade)
    const { data: activeEmployees } = await supabase
      .from('employees')
      .select('department')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    const deptCountMap: Record<string, number> = {};
    (activeEmployees || []).forEach((e: any) => {
      const dept = (e.department || '').trim();
      if (dept) deptCountMap[dept] = (deptCountMap[dept] || 0) + 1;
    });

    // 3. Normaliza contagem: usa o count real de employees do departamento
    const teams = (data || []).map((team: any) => {
      const deptCount = deptCountMap[team.name] || 0;
      const storedCount = team.member_count ?? 0;
      const realCount = Math.max(deptCount, storedCount);

      // Auto-corrige member_count no banco se divergiu
      if (realCount !== storedCount) {
        supabase.from('teams').update({ member_count: realCount }).eq('id', team.id).then();
      }

      return { ...team, member_count: realCount };
    });

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
