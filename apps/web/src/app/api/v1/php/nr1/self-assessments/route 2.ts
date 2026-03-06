import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

const DIMENSION_KEYS = [
  'workload_pace_risk',
  'goal_pressure_risk',
  'role_clarity_risk',
  'autonomy_control_risk',
  'leadership_support_risk',
  'peer_collaboration_risk',
  'recognition_justice_risk',
  'communication_change_risk',
  'conflict_harassment_risk',
  'recovery_boundaries_risk',
] as const;

/**
 * POST /api/v1/php/nr1/self-assessments
 * Colaborador submete autoavaliação NR-1
 * Body: { org_id, employee_id, invitation_id?, organizational_assessment_id?,
 *         workload_pace_risk, ..., comments?, self_score, self_risk_level }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      org_id,
      employee_id,
      invitation_id,
      comments,
      self_score,
      self_risk_level,
    } = body;

    if (!org_id || !employee_id) {
      return NextResponse.json({ error: 'org_id e employee_id são obrigatórios' }, { status: 400 });
    }

    // Validate all 10 dimensions (scale 1-5)
    for (const key of DIMENSION_KEYS) {
      const val = body[key];
      if (val === undefined || val === null || val < 1 || val > 5) {
        return NextResponse.json(
          { error: `${key} é obrigatório e deve estar entre 1 e 5` },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabase();

    // Resolve organizational_assessment_id from invitation if provided
    let campaignId = body.organizational_assessment_id || null;
    if (invitation_id && !campaignId) {
      const { data: inv } = await supabase
        .from('nr1_assessment_invitations')
        .select('organizational_assessment_id')
        .eq('id', invitation_id)
        .single();
      if (inv) campaignId = inv.organizational_assessment_id;
    }

    // Calcular score se não fornecido
    const dimensions: Record<string, number> = {};
    for (const key of DIMENSION_KEYS) {
      dimensions[key] = Number(body[key]);
    }
    const sum = Object.values(dimensions).reduce((a, b) => a + b, 0);
    const calculatedScore = self_score || (sum / 10).toFixed(2);
    const calculatedRisk = self_risk_level ||
      (parseFloat(String(calculatedScore)) >= 4.5 ? 'low' :
        parseFloat(String(calculatedScore)) >= 3.5 ? 'medium' :
          parseFloat(String(calculatedScore)) >= 2.5 ? 'high' : 'critical');

    // Insert self-assessment
    const { data: selfAssessment, error: insertError } = await supabase
      .from('nr1_self_assessments')
      .insert({
        org_id,
        employee_id,
        organizational_assessment_id: campaignId,
        ...dimensions,
        self_score: parseFloat(String(calculatedScore)),
        self_risk_level: calculatedRisk,
        comments: comments || null,
        status: 'completed',
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar self-assessment:', insertError);
      return NextResponse.json({ error: `Erro ao salvar: ${insertError.message}` }, { status: 500 });
    }

    // Update invitation status to completed
    if (invitation_id) {
      await supabase
        .from('nr1_assessment_invitations')
        .update({
          status: 'completed',
          responded_at: new Date().toISOString(),
          self_assessment_id: selfAssessment.id,
        })
        .eq('id', invitation_id);
    }

    // Update campaign total_responded
    if (campaignId) {
      const { count } = await supabase
        .from('nr1_self_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('organizational_assessment_id', campaignId)
        .eq('status', 'completed');

      await supabase
        .from('nr1_risk_assessments')
        .update({ total_responded: count || 0 })
        .eq('id', campaignId);
    }

    return NextResponse.json(selfAssessment, { status: 201 });
  } catch (error: any) {
    console.error('Erro no self-assessment:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET /api/v1/php/nr1/self-assessments
 * Lista self-assessments da organização
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id') || request.headers.get('x-org-id');
    const campaignId = searchParams.get('campaign_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();
    let query = supabase
      .from('nr1_self_assessments')
      .select(`
        *,
        employee:employees!employee_id(full_name, position, department)
      `)
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .order('responded_at', { ascending: false });

    if (campaignId) {
      query = query.eq('organizational_assessment_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar self-assessments:', error);
      return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
