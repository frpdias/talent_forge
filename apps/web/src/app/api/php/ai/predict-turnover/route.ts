import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id é obrigatório' }, { status: 400 });
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const isMember = await validateOrgMembership(supabase, user.id, org_id);
    if (!isMember) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const [{ data: members }, { data: scores }, { data: nr1Data }] = await Promise.all([
      supabase
        .from('org_members')
        .select('id, user_id, role, created_at')
        .eq('org_id', org_id)
        .eq('status', 'active'),
      supabase
        .from('php_integrated_scores')
        .select('user_id, overall_score')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('nr1_risk_assessments')
        .select('user_id, risk_level')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (!members || members.length === 0) {
      return NextResponse.json({ predictions_count: 0, predictions: [] });
    }

    // Previsão heurística por membro
    const predictions = members.map((member) => {
      const memberScore = scores?.find((s) => s.user_id === member.user_id);
      const memberNr1 = nr1Data?.find((n) => n.user_id === member.user_id);

      let riskScore = 30;
      const factors: string[] = [];

      // Tempo na empresa
      const tenureMs = Date.now() - new Date(member.created_at).getTime();
      const tenureMonths = tenureMs / (1000 * 60 * 60 * 24 * 30);
      if (tenureMonths < 6) {
        riskScore += 20;
        factors.push('Tempo na empresa inferior a 6 meses');
      } else if (tenureMonths > 36) {
        riskScore -= 10;
        factors.push('Alta senioridade (mais de 3 anos)');
      }

      // Score PHP
      if (memberScore) {
        if (memberScore.overall_score < 40) {
          riskScore += 25;
          factors.push('Score PHP abaixo de 40 — baixo engajamento detectado');
        } else if (memberScore.overall_score > 70) {
          riskScore -= 15;
          factors.push('Score PHP elevado — alta satisfação');
        }
      } else {
        riskScore += 10;
        factors.push('Sem avaliação PHP registrada');
      }

      // Risco NR-1
      if (memberNr1?.risk_level === 'critical') {
        riskScore += 25;
        factors.push('Risco NR-1 crítico detectado');
      } else if (memberNr1?.risk_level === 'high') {
        riskScore += 15;
        factors.push('Risco NR-1 alto detectado');
      }

      riskScore = Math.min(100, Math.max(0, riskScore));

      return {
        member_id: member.id,
        user_id: member.user_id,
        risk_score: riskScore,
        risk_level:
          riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        factors,
      };
    });

    predictions.sort((a, b) => b.risk_score - a.risk_score);

    return NextResponse.json({
      predictions_count: predictions.length,
      predictions,
    });
  } catch (error) {
    console.error('[/api/php/ai/predict-turnover]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
