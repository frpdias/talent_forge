import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';

/**
 * GET /api/v1/php/nr1/assessments
 * Lista avaliações NR-1 da organização
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id é obrigatório' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('assessment_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar NR-1:', error);
      return NextResponse.json({ error: 'Erro ao buscar avaliações NR-1' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/php/nr1/assessments
 * Cria nova avaliação NR-1
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    if (!(await validateOrgMembership(supabase, user.id, orgId))) {
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
      .insert({
        org_id: orgId,
        assessed_by: user.id,
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
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar NR-1:', error);
      return NextResponse.json({ error: 'Erro ao criar avaliação NR-1' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
