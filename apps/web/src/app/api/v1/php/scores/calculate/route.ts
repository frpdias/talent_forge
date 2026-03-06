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
 * POST /api/v1/php/scores/calculate
 *
 * Calcula e insere/atualiza php_integrated_scores para todos os usuários
 * de uma organização, agregando as avaliações dos 3 pilares:
 *   - TFCI (30%): média de overall_score das avaliações (escala 1-5 → 0-100)
 *   - NR-1 (40%): inversão do risco (escala 1-3 → score 0-100)
 *   - COPC (30%): overall_performance_score (já em 0-100)
 *
 * Pode opcionalmente receber { team_id } para calcular apenas um time.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const filterTeamId = body.team_id || null;

    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Buscar employees da org (opcionalmente filtrado por team/department)
    let empQuery = supabase
      .from('employees')
      .select('id, user_id, full_name, department')
      .eq('organization_id', orgId)
      .eq('status', 'active');

    if (filterTeamId) {
      // Buscar nome do time para filtrar por department
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', filterTeamId)
        .single();

      if (team?.name) {
        empQuery = empQuery.eq('department', team.name);
      }
    }

    const { data: employees, error: empError } = await empQuery;

    if (empError || !employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum funcionário encontrado', details: empError?.message },
        { status: 400 }
      );
    }

    // 2. Buscar todas avaliações TFCI dos últimos 90 dias
    const { data: tfciAssessments } = await supabase
      .from('tfci_assessments')
      .select('target_user_id, overall_score')
      .eq('org_id', orgId)
      .gte('submitted_at', threeMonthsAgo);

    // Agrupar TFCI por target_user_id → média de overall_score
    const tfciByUser = new Map<string, number[]>();
    (tfciAssessments || []).forEach((a) => {
      if (a.target_user_id && a.overall_score != null) {
        if (!tfciByUser.has(a.target_user_id)) tfciByUser.set(a.target_user_id, []);
        tfciByUser.get(a.target_user_id)!.push(Number(a.overall_score));
      }
    });

    // 3. Buscar avaliações NR-1 dos últimos 90 dias
    const { data: nr1Assessments } = await supabase
      .from('nr1_risk_assessments')
      .select('user_id, workload_pace_risk, goal_pressure_risk, role_clarity_risk, autonomy_control_risk, leadership_support_risk, peer_collaboration_risk, recognition_justice_risk, communication_change_risk, conflict_harassment_risk, recovery_boundaries_risk')
      .eq('org_id', orgId)
      .gte('assessment_date', threeMonthsAgo);

    // Agrupar NR-1 por user_id → média invertida das 10 dimensões
    const nr1ByUser = new Map<string, number>();
    (nr1Assessments || []).forEach((a) => {
      if (!a.user_id) return;
      const dims = [
        a.workload_pace_risk, a.goal_pressure_risk, a.role_clarity_risk,
        a.autonomy_control_risk, a.leadership_support_risk, a.peer_collaboration_risk,
        a.recognition_justice_risk, a.communication_change_risk, a.conflict_harassment_risk,
        a.recovery_boundaries_risk,
      ].filter((v) => v != null);

      if (dims.length > 0) {
        const avgRisk = dims.reduce((s, v) => s + v, 0) / dims.length;
        // Inverter: risco 1 (baixo) → 100, risco 3 (alto) → 0
        const score = ((3 - avgRisk) / 2) * 100;
        nr1ByUser.set(a.user_id, Math.max(0, Math.min(100, score)));
      }
    });

    // 4. Buscar métricas COPC dos últimos 90 dias
    const { data: copcMetrics } = await supabase
      .from('copc_metrics')
      .select('user_id, overall_performance_score')
      .eq('org_id', orgId)
      .gte('metric_date', threeMonthsAgo);

    // Agrupar COPC por user_id → média de overall_performance_score
    const copcByUser = new Map<string, number[]>();
    (copcMetrics || []).forEach((m) => {
      if (m.user_id && m.overall_performance_score != null) {
        if (!copcByUser.has(m.user_id)) copcByUser.set(m.user_id, []);
        copcByUser.get(m.user_id)!.push(Number(m.overall_performance_score));
      }
    });

    // 5. Calcular e upsert php_integrated_scores para cada employee
    const results: { employee_id: string; name: string; tfci: number | null; nr1: number | null; copc: number | null; status: string }[] = [];
    let upserted = 0;
    let skipped = 0;

    for (const emp of employees) {
      const userId = emp.user_id;

      // TFCI score (escala 1-5 → 0-100)
      const tfciScores = userId ? tfciByUser.get(userId) : undefined;
      const tfciScore = tfciScores && tfciScores.length > 0
        ? ((tfciScores.reduce((s, v) => s + v, 0) / tfciScores.length - 1) / 4) * 100
        : null;

      // NR-1 score (já em 0-100)
      const nr1Score = userId ? (nr1ByUser.get(userId) ?? null) : null;

      // COPC score (já em 0-100)
      const copcScores = userId ? copcByUser.get(userId) : undefined;
      const copcScore = copcScores && copcScores.length > 0
        ? copcScores.reduce((s, v) => s + v, 0) / copcScores.length
        : null;

      // Precisa de pelo menos 1 pilar para inserir
      if (tfciScore === null && nr1Score === null && copcScore === null) {
        skipped++;
        results.push({ employee_id: emp.id, name: emp.full_name, tfci: null, nr1: null, copc: null, status: 'skipped' });
        continue;
      }

      // Buscar team_id via department
      let teamId: string | null = null;
      if (emp.department) {
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .eq('org_id', orgId)
          .ilike('name', emp.department)
          .maybeSingle();
        teamId = team?.id || null;
      }

      // Buscar score anterior para determinar trend
      const { data: prevScore } = await supabase
        .from('php_integrated_scores')
        .select('php_score')
        .eq('org_id', orgId)
        .eq('user_id', userId || emp.id)
        .order('score_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calcular PHP score manualmente para o trend (table GENERATED faz o cálculo final)
      const effectiveTfci = tfciScore ?? 50;
      const effectiveNr1 = nr1Score ?? 50;
      const effectiveCopc = copcScore ?? 50;
      const phpScore = effectiveTfci * 0.30 + effectiveNr1 * 0.40 + effectiveCopc * 0.30;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (prevScore?.php_score != null) {
        const diff = phpScore - Number(prevScore.php_score);
        if (diff > 2) trend = 'up';
        else if (diff < -2) trend = 'down';
      }

      const { error: upsertError } = await supabase
        .from('php_integrated_scores')
        .upsert({
          org_id: orgId,
          user_id: userId || emp.id,
          team_id: teamId,
          score_date: today,
          tfci_score: tfciScore !== null ? Math.round(tfciScore * 100) / 100 : effectiveTfci,
          nr1_score: nr1Score !== null ? Math.round(nr1Score * 100) / 100 : effectiveNr1,
          copc_score: copcScore !== null ? Math.round(copcScore * 100) / 100 : effectiveCopc,
          trend_vs_previous: trend,
        }, {
          onConflict: 'org_id,user_id,score_date',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error(`[scores/calculate] Erro upsert ${emp.full_name}:`, upsertError);
        results.push({ employee_id: emp.id, name: emp.full_name, tfci: tfciScore, nr1: nr1Score, copc: copcScore, status: `error: ${upsertError.message}` });
      } else {
        upserted++;
        results.push({ employee_id: emp.id, name: emp.full_name, tfci: tfciScore, nr1: nr1Score, copc: copcScore, status: 'ok' });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_employees: employees.length,
        scores_calculated: upserted,
        skipped,
        date: today,
        period: '90 dias',
      },
      results,
    });
  } catch (error: any) {
    console.error('Erro no POST /api/v1/php/scores/calculate:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
