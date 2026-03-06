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
 * GET /api/v1/php/nr1/comparative-analysis/:orgId
 * Análise comparativa NR-1 (self-assessment vs organizacional)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Buscar self-assessments com resposta
    const { data: selfAssessments, error: selfError } = await supabase
      .from('nr1_self_assessments')
      .select('*')
      .eq('org_id', orgId)
      .not('responded_at', 'is', null)
      .order('responded_at', { ascending: false });

    if (selfError) {
      console.error('Erro ao buscar self-assessments:', selfError);
      return NextResponse.json({ error: 'Erro ao buscar dados comparativos' }, { status: 500 });
    }

    // Buscar avaliações organizacionais para comparação
    const { data: orgAssessments } = await supabase
      .from('nr1_risk_assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('assessment_date', { ascending: false })
      .limit(1);

    const orgAssessment = orgAssessments?.[0];

    // Montar comparações
    const comparisons = (selfAssessments || []).map((sa: any) => {
      const selfScore = sa.overall_risk_score || 0;
      const orgScore = orgAssessment
        ? (orgAssessment.workload_pace_risk + orgAssessment.goal_pressure_risk +
           orgAssessment.role_clarity_risk + orgAssessment.autonomy_control_risk +
           orgAssessment.leadership_support_risk + orgAssessment.peer_collaboration_risk +
           orgAssessment.recognition_justice_risk + orgAssessment.communication_change_risk +
           orgAssessment.conflict_harassment_risk + orgAssessment.recovery_boundaries_risk) / 10
        : 0;

      const gap = Math.abs(selfScore - orgScore);
      const gapSeverity = gap > 1.5 ? 'critical' : gap > 0.8 ? 'significant' : 'aligned';
      const perceptionBias = selfScore > orgScore ? 'pessimistic' : selfScore < orgScore ? 'optimistic' : 'aligned';

      return {
        self_assessment_id: sa.id,
        employee_id: sa.employee_id || sa.user_id,
        employee_name: sa.employee_name || 'Colaborador',
        employee_position: sa.employee_position || '',
        self_score: selfScore,
        self_risk_level: sa.overall_risk_level || 'low',
        organizational_score: orgScore,
        organizational_risk_level: orgAssessment?.overall_risk_level || 'low',
        perception_gap: gap,
        gap_severity: gapSeverity,
        perception_bias: perceptionBias,
        dimensions_comparison: sa.dimensions || {},
        employee_comments: sa.comments || '',
        organizational_action_plan: orgAssessment?.action_plan || '',
        responded_at: sa.responded_at,
        assessment_date: orgAssessment?.assessment_date || sa.created_at,
      };
    });

    // Estatísticas gerais
    const statistics = {
      total_comparisons: comparisons.length,
      critical_gaps: comparisons.filter((c: any) => c.gap_severity === 'critical').length,
      significant_gaps: comparisons.filter((c: any) => c.gap_severity === 'significant').length,
      aligned: comparisons.filter((c: any) => c.gap_severity === 'aligned').length,
      optimistic_bias_count: comparisons.filter((c: any) => c.perception_bias === 'optimistic').length,
      pessimistic_bias_count: comparisons.filter((c: any) => c.perception_bias === 'pessimistic').length,
      average_perception_gap: comparisons.length > 0
        ? (comparisons.reduce((sum: number, c: any) => sum + c.perception_gap, 0) / comparisons.length).toFixed(2)
        : '0.00',
    };

    // Insights automáticos
    const insights: string[] = [];
    if (statistics.critical_gaps > 0) {
      insights.push(`${statistics.critical_gaps} colaborador(es) apresentam percepção crítica divergente da avaliação organizacional.`);
    }
    if (statistics.optimistic_bias_count > statistics.pessimistic_bias_count) {
      insights.push('A maioria dos colaboradores tem percepção mais positiva do ambiente do que a avaliação organizacional indica.');
    }
    if (statistics.aligned > comparisons.length * 0.7) {
      insights.push('Boa convergência entre autopercepção e avaliação organizacional — ambiente psicológico consistente.');
    }

    return NextResponse.json({ comparisons, statistics, insights });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
