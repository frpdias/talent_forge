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
 * POST /api/v1/php/teams/auto-create
 *
 * Cria times automaticamente a partir da estrutura organizacional (employees).
 * Agrupa por `department` e define o gestor como o employee cujo `id` aparece
 * como `manager_id` de outros dentro do mesmo departamento.
 *
 * Conexão com o 360° (TFCI): os times criados aqui ficam imediatamente
 * disponíveis para vinculação em `tfci_assessments.team_id` e
 * `nr1_risk_assessments.team_id`, permitindo análise por grupo de trabalho.
 *
 * Retorna: { created: Team[], skipped: string[], errors: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const supabase = getSupabase();

    // 1. Buscar todos os funcionários ativos da org
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, department, position, manager_id, user_id, status')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (empError) {
      console.error('[auto-create] Erro ao buscar employees:', empError);
      return NextResponse.json({ error: 'Erro ao buscar funcionários' }, { status: 500 });
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json({ error: 'Nenhum funcionário ativo encontrado para esta organização' }, { status: 400 });
    }

    // 2. Agrupar por departamento (ignorar employees sem departamento)
    const byDepartment = new Map<string, typeof employees>();
    for (const emp of employees) {
      const dept = emp.department?.trim();
      if (!dept) continue;
      if (!byDepartment.has(dept)) byDepartment.set(dept, []);
      byDepartment.get(dept)!.push(emp);
    }

    if (byDepartment.size === 0) {
      return NextResponse.json({
        error: 'Nenhum funcionário possui departamento cadastrado. Preencha o campo "departamento" nos cadastros.',
      }, { status: 400 });
    }

    // 3. Buscar times já existentes para evitar duplicatas
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('name')
      .eq('org_id', orgId);

    const existingNames = new Set((existingTeams || []).map((t: any) => t.name.toLowerCase()));

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    // 4. Para cada departamento, criar o time
    for (const [department, members] of byDepartment.entries()) {
      if (existingNames.has(department.toLowerCase())) {
        skipped.push(`${department} (já existe)`);
        continue;
      }

      // Identificar o gestor:
      // Estratégia: employee cujo `id` aparece como `manager_id` de outros no grupo.
      // Se empate ou nenhum, usa o de mais alto cargo (sem manager_id dentro do dept).
      const memberIds = new Set(members.map((m) => m.id));
      const managerCandidates = members.filter((m) =>
        members.some((other) => other.manager_id === m.id)
      );

      let managerUserId: string | null = null;
      if (managerCandidates.length > 0) {
        // Prefere o que tem user_id (conta de acesso)
        const withUserId = managerCandidates.find((m) => m.user_id);
        managerUserId = (withUserId || managerCandidates[0]).user_id || null;
      } else {
        // Fallback: primeiro employee sem manager_id apontando para dentro do dept, com user_id
        const topLevel = members.find((m) => !memberIds.has(m.manager_id as string) && m.user_id);
        managerUserId = topLevel?.user_id || members.find((m) => m.user_id)?.user_id || null;
      }

      // Criar o time
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          org_id: orgId,
          name: department,
          description: `Time de ${department} — criado automaticamente a partir da estrutura organizacional`,
          manager_id: managerUserId,
          member_count: 0,
        })
        .select('id, name')
        .single();

      if (teamError) {
        console.error(`[auto-create] Erro ao criar time "${department}":`, teamError);
        errors.push(`${department}: ${teamError.message}`);
        continue;
      }

      // Adicionar membros com user_id ao time
      const membersWithUserId = members.filter((m) => m.user_id);
      if (membersWithUserId.length > 0) {
        const teamMemberRows = membersWithUserId.map((m) => ({
          team_id: team.id,
          user_id: m.user_id,
          role_in_team: m.user_id === managerUserId ? 'lead' : 'member',
        }));

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(teamMemberRows);

        if (membersError) {
          console.warn(`[auto-create] Aviso: erro ao adicionar membros no time "${department}":`, membersError.message);
        }

        // Atualizar member_count
        await supabase
          .from('teams')
          .update({ member_count: membersWithUserId.length })
          .eq('id', team.id);
      }

      created.push(`${department} (${membersWithUserId.length} membro(s))`);
    }

    return NextResponse.json({
      message: `${created.length} time(s) criado(s) com sucesso`,
      created,
      skipped,
      errors,
    }, { status: 201 });
  } catch (err: any) {
    console.error('[auto-create] Erro interno:', err);
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
