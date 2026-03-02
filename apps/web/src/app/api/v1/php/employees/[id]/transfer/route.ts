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
 * POST /api/v1/php/employees/:id/transfer
 * Transfere um employee para outro departamento (= time) e/ou muda seu gestor.
 *
 * Body:
 * - department?: string   — novo departamento (= teams.name)
 * - manager_id?: string   — novo gestor (employees.id)
 *
 * A relação implícita teams.name ↔ employees.department faz com que mudar
 * o department do employee equivalha a movê-lo de time.
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: employeeId } = await params;
    const body = await request.json();
    const { department, manager_id } = body;

    if (!department && !manager_id && manager_id !== null) {
      return NextResponse.json(
        { error: 'Informe ao menos department ou manager_id' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Valida que o employee existe e pertence à org
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, department, manager_id, organization_id')
      .eq('id', employeeId)
      .eq('organization_id', orgId)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const changes: string[] = [];

    // Atualizar departamento (= mover de time)
    if (department !== undefined && department !== employee.department) {
      // Valida que o time/departamento alvo existe na org
      const { data: targetTeam } = await supabase
        .from('teams')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('name', department)
        .single();

      if (!targetTeam) {
        return NextResponse.json(
          { error: `Time/departamento "${department}" não existe nesta organização` },
          { status: 404 }
        );
      }

      updates.department = department;
      changes.push(`departamento: ${employee.department} → ${department}`);
    }

    // Atualizar gestor
    if (manager_id !== undefined && manager_id !== employee.manager_id) {
      if (manager_id !== null) {
        // Valida que o gestor existe na org
        const { data: manager } = await supabase
          .from('employees')
          .select('id, full_name')
          .eq('id', manager_id)
          .eq('organization_id', orgId)
          .single();

        if (!manager) {
          return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 });
        }

        // Previne referência circular (não pode ser gestor de si mesmo)
        if (manager_id === employeeId) {
          return NextResponse.json(
            { error: 'Um funcionário não pode ser gestor de si mesmo' },
            { status: 400 }
          );
        }
      }

      updates.manager_id = manager_id;
      changes.push(`gestor atualizado`);
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'Nenhuma alteração necessária', employee });
    }

    // Aplica o update
    const { data: updated, error: updateError } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', employeeId)
      .select('id, full_name, department, manager_id, position, status')
      .single();

    if (updateError) {
      console.error('[employees/transfer] Erro:', updateError);
      return NextResponse.json({ error: 'Erro ao transferir funcionário' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      changes,
      employee: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
