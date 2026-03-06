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

    // Busca membros do time via team_members (apenas employees com auth user_id)
    const { data: members } = await supabase
      .from('team_members')
      .select('id, team_id, user_id, role_in_team, joined_at')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    // Busca dados de employee para cada membro via employees.user_id
    const memberUserIds = (members || []).map((m: any) => m.user_id).filter(Boolean);
    const employeeMap: Record<string, any> = {};
    if (memberUserIds.length > 0) {
      const { data: emps } = await supabase
        .from('employees')
        .select('id, full_name, position, department, manager_id, user_id')
        .in('user_id', memberUserIds);
      (emps || []).forEach((e: any) => { employeeMap[e.user_id] = e; });
    }

    // Busca TODOS os employees do departamento correspondente ao nome do time
    // (para times criados automaticamente por "Criar por Área")
    const { data: deptEmployees } = await supabase
      .from('employees')
      .select('id, full_name, position, department, manager_id, user_id')
      .eq('organization_id', orgId)
      .eq('department', team.name)
      .eq('status', 'active');

    // --- ORDENAÇÃO HIERÁRQUICA (organograma: maior → menor) ---
    // Constrói árvore a partir de manager_id e percorre em pre-order (DFS)
    const deptList = deptEmployees || [];
    const deptIdSet = new Set(deptList.map((e: any) => e.id));
    const childrenMap: Record<string, any[]> = {};
    const roots: any[] = [];

    for (const emp of deptList) {
      // Se manager_id não está no dept OU é null → é raiz do dept
      if (!emp.manager_id || !deptIdSet.has(emp.manager_id)) {
        roots.push(emp);
      } else {
        if (!childrenMap[emp.manager_id]) childrenMap[emp.manager_id] = [];
        childrenMap[emp.manager_id].push(emp);
      }
    }

    // Ordena raízes e filhos por position (Diretor > Gerente > Coordenador > Analista > demais)
    const positionPriority = (pos: string | null): number => {
      if (!pos) return 99;
      const p = pos.toLowerCase();
      if (p.includes('diretor') || p.includes('ceo') || p.includes('presidente') || p.includes('vp')) return 1;
      if (p.includes('gerente') || p.includes('superintendente')) return 2;
      if (p.includes('coordenador') || p.includes('supervisor')) return 3;
      if (p.includes('líder') || p.includes('lider') || p.includes('especialista')) return 4;
      if (p.includes('analista') || p.includes('consultor')) return 5;
      if (p.includes('assistente') || p.includes('auxiliar')) return 6;
      if (p.includes('estagiári') || p.includes('estagiario') || p.includes('aprendiz')) return 7;
      return 8;
    };

    const sortByPosition = (a: any, b: any) => {
      const pa = positionPriority(a.position);
      const pb = positionPriority(b.position);
      if (pa !== pb) return pa - pb;
      return (a.full_name || '').localeCompare(b.full_name || '');
    };

    roots.sort(sortByPosition);
    Object.values(childrenMap).forEach((children) => children.sort(sortByPosition));

    // Pre-order DFS para obter lista ordenada hierarquicamente
    const hierarchicalList: { emp: any; depth: number }[] = [];
    const walkTree = (node: any, depth: number) => {
      hierarchicalList.push({ emp: node, depth });
      const children = childrenMap[node.id] || [];
      for (const child of children) {
        walkTree(child, depth + 1);
      }
    };
    for (const root of roots) {
      walkTree(root, 0);
    }

    // Merge: employees do departamento (ordenados hierarquicamente) + membros manuais
    const seenIds = new Set<string>();
    const normalizedMembers: any[] = [];

    // Primeiro: employees do departamento na ordem hierárquica
    for (const { emp, depth } of hierarchicalList) {
      seenIds.add(emp.user_id || emp.id);
      const tmRecord = (members || []).find((m: any) => m.user_id === emp.user_id);
      normalizedMembers.push({
        id: tmRecord?.id || emp.id,
        team_id: teamId,
        user_id: emp.user_id,
        role_in_team: tmRecord?.role_in_team || 'member',
        joined_at: tmRecord?.joined_at || team.created_at,
        employee: { ...emp, hierarchy_depth: depth },
      });
    }

    // Depois: membros de team_members que NÃO são do departamento (adicionados manualmente)
    for (const m of (members || [])) {
      if (seenIds.has(m.user_id)) continue;
      seenIds.add(m.user_id);
      normalizedMembers.push({
        id: m.id,
        team_id: m.team_id,
        user_id: m.user_id,
        role_in_team: m.role_in_team,
        joined_at: m.joined_at,
        employee: employeeMap[m.user_id] || null,
      });
    }

    // Atualizar member_count se divergiu
    const actualCount = normalizedMembers.length;
    if (actualCount !== team.member_count) {
      await supabase.from('teams').update({ member_count: actualCount }).eq('id', teamId);
      team.member_count = actualCount;
    }

    // Busca dados do gestor via employees.user_id (manager_id = auth.users.id)
    let manager = null;
    if (team.manager_id) {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('user_id', team.manager_id)
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
