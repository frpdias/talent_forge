import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, validateOrgMembership } from '@/lib/api/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GET /api/v1/php/employees/:id
 * Busca um funcionário por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }

    if (!(await validateOrgMembership(supabase, user.id, data.organization_id))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/php/employees/:id
 * Atualiza um funcionário
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    // Valida que o employee existe e que o user pertence à org dele
    const { data: existing } = await supabase
      .from('employees')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }

    if (!(await validateOrgMembership(supabase, user.id, existing.organization_id))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    // Campos permitidos
    const updateData: Record<string, unknown> = {};
    const allowed = [
      'full_name', 'cpf', 'email', 'phone', 'position', 'department',
      'hire_date', 'termination_date', 'status', 'manager_id',
      'hierarchy_level', 'birth_date', 'metadata',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/php/employees/:id
 * Remove um funcionário
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('employees')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }

    if (!(await validateOrgMembership(supabase, user.id, existing.organization_id))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir funcionário:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
