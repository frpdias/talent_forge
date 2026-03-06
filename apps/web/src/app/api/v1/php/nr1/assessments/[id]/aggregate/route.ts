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
 * Converte score positivo (1-5) para nível de risco (1-3)
 * Score alto (4-5) = risco baixo (1)
 * Score médio (3) = risco médio (2)
 * Score baixo (1-2) = risco alto (3)
 */
function scoreToRisk(avgScore: number): number {
  if (avgScore >= 4.0) return 1; // Baixo risco
  if (avgScore >= 3.0) return 2; // Médio risco
  return 3;                       // Alto risco
}

/**
 * POST /api/v1/php/nr1/assessments/[id]/aggregate
 * Agrega respostas dos colaboradores em scores de risco organizacional.
 * Calcula média por dimensão, converte 1-5 → 1-3 e atualiza a campanha.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Fetch all completed self-assessments for this campaign
    const { data: selfAssessments, error: saError } = await supabase
      .from('nr1_self_assessments')
      .select('*')
      .eq('organizational_assessment_id', campaignId)
      .eq('status', 'completed');

    if (saError) {
      return NextResponse.json({ error: `Erro ao buscar respostas: ${saError.message}` }, { status: 500 });
    }

    if (!selfAssessments || selfAssessments.length === 0) {
      return NextResponse.json({ error: 'Nenhuma resposta encontrada para agregar' }, { status: 400 });
    }

    const totalResponses = selfAssessments.length;

    // Calculate average per dimension
    const dimensionAverages: Record<string, number> = {};
    const dimensionRisks: Record<string, number> = {};

    for (const key of DIMENSION_KEYS) {
      const values = selfAssessments.map((sa: any) => Number(sa[key])).filter((v: number) => !isNaN(v));
      if (values.length > 0) {
        const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        dimensionAverages[key] = Math.round(avg * 100) / 100;
        dimensionRisks[key] = scoreToRisk(avg);
      } else {
        dimensionAverages[key] = 0;
        dimensionRisks[key] = 2; // default médio se sem dados
      }
    }

    // Calculate overall risk score (average of risk levels)
    const riskValues = Object.values(dimensionRisks);
    const overallRisk = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;
    const overallRiskLevel =
      overallRisk <= 1.5 ? 'baixo' :
        overallRisk <= 2.2 ? 'médio' : 'alto';

    // Update campaign with aggregated risks
    const { data: updated, error: updateError } = await supabase
      .from('nr1_risk_assessments')
      .update({
        ...dimensionRisks,
        total_responded: totalResponses,
        status: 'completed',
        overall_risk: overallRiskLevel,
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar campanha:', updateError);
      return NextResponse.json({ error: `Erro ao atualizar: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      campaign: updated,
      aggregation: {
        total_responses: totalResponses,
        dimension_averages: dimensionAverages,
        dimension_risks: dimensionRisks,
        overall_risk_score: Math.round(overallRisk * 100) / 100,
        overall_risk_level: overallRiskLevel,
      },
    });
  } catch (error: any) {
    console.error('Erro na agregação:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
