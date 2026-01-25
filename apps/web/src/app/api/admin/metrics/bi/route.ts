import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticação e permissão de admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Buscar dados das 6 views de BI
    const [
      executiveDashboard,
      recruitmentFunnel,
      recruiterPerformance,
      topCandidates,
      assessmentCompletion,
      avgTimeByStage
    ] = await Promise.all([
      // 1. Executive Dashboard (KPIs principais)
      supabase
        .from('v_executive_dashboard')
        .select('*')
        .limit(10),

      // 2. Recruitment Funnel (funil por vaga)
      supabase
        .from('v_recruitment_funnel')
        .select('*')
        .order('total_applications', { ascending: false })
        .limit(5),

      // 3. Recruiter Performance (top 5 recrutadores)
      supabase
        .from('v_recruiter_performance')
        .select('*')
        .order('hire_rate', { ascending: false })
        .limit(5),

      // 4. Top Candidates (candidatos mais ativos)
      supabase
        .from('v_top_candidates')
        .select('*')
        .order('total_applications', { ascending: false })
        .limit(5),

      // 5. Assessment Completion Rate
      supabase
        .from('v_assessment_completion_rate')
        .select('*')
        .order('completion_rate', { ascending: false })
        .limit(5),

      // 6. Avg Time by Stage
      supabase
        .from('v_avg_time_by_stage')
        .select('*')
        .order('avg_hours', { ascending: false })
        .limit(10)
    ]);

    // Calcular agregados globais
    const globalStats = {
      totalOrganizations: executiveDashboard.data?.length || 0,
      avgConversionRate: executiveDashboard.data && executiveDashboard.data.length > 0
        ? (executiveDashboard.data.reduce((acc: number, org: any) => 
            acc + (100 - (org.rejection_rate || 0)), 0) / executiveDashboard.data.length).toFixed(1)
        : '0.0',
      avgTimeToHire: executiveDashboard.data && executiveDashboard.data.length > 0
        ? (executiveDashboard.data.reduce((acc: number, org: any) => 
            acc + (org.avg_time_to_hire || 0), 0) / executiveDashboard.data.length).toFixed(1)
        : '0.0',
      totalAssessmentsCompleted: executiveDashboard.data
        ? executiveDashboard.data.reduce((acc: number, org: any) => 
            acc + (org.assessments_completed || 0), 0)
        : 0,
      avgSatisfactionScore: executiveDashboard.data && executiveDashboard.data.length > 0
        ? (executiveDashboard.data.reduce((acc: number, org: any) => 
            acc + (org.candidate_satisfaction_score || 0), 0) / executiveDashboard.data.length).toFixed(1)
        : '0.0'
    };

    return NextResponse.json({
      success: true,
      data: {
        globalStats,
        executiveDashboard: executiveDashboard.data || [],
        recruitmentFunnel: recruitmentFunnel.data || [],
        recruiterPerformance: recruiterPerformance.data || [],
        topCandidates: topCandidates.data || [],
        assessmentCompletion: assessmentCompletion.data || [],
        avgTimeByStage: avgTimeByStage.data || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar métricas de BI:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar métricas de Business Intelligence',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
