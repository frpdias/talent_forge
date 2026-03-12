import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';

/**
 * GET /api/v1/php/nr1/assessments/:id
 * Detalhes de uma avaliação NR-1
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });
    }

    if (!(await validateOrgMembership(supabase, user.id, data.org_id))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PUT /api/v1/php/nr1/assessments/:id
 * Atualiza uma avaliação NR-1
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Fetch record first to validate org membership
    const { data: existing, error: fetchError } = await supabase
      .from('nr1_risk_assessments')
      .select('org_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });
    }

    if (!(await validateOrgMembership(supabase, user.id, existing.org_id))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const body = await request.json();
    const {
      team_id,
      user_id,
      assessment_date,
      workload_pace_risk,
      goal_pressure_risk,
      role_clarity_risk,
      autonomy_control_risk,
      leadership_support_risk,
      peer_collaboration_risk,
      recognition_justice_risk,
      communication_change_risk,
      conflict_harassment_risk,
      recovery_boundaries_risk,
      notes,
    } = body;

    const { data, error } = await supabase
      .from('nr1_risk_assessments')
      .update({
        team_id,
        user_id,
        assessment_date,
        workload_pace_risk,
        goal_pressure_risk,
        role_clarity_risk,
        autonomy_control_risk,
        leadership_support_risk,
        peer_collaboration_risk,
        recognition_justice_risk,
        communication_change_risk,
        conflict_harassment_risk,
        recovery_boundaries_risk,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/php/nr1/assessments/:id
 * Remove uma avaliação NR-1
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Fetch record first to validate org membership
    const { data: existing, error: fetchError } = await supabase
      .from('nr1_risk_assessments')
      .select('org_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });
    }

    if (!(await validateOrgMembership(supabase, user.id, existing.org_id))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { error } = await supabase
      .from('nr1_risk_assessments')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Erro ao excluir avaliação' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
