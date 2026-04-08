import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, months_ahead = 3 } = body;

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

    const { data: scores } = await supabase
      .from('php_integrated_scores')
      .select('overall_score, tfci_score, nr1_score, copc_score, created_at')
      .eq('org_id', org_id)
      .order('created_at', { ascending: true })
      .limit(12);

    if (!scores || scores.length === 0) {
      return NextResponse.json({
        forecasts_count: 0,
        forecasts: [],
        message: 'Dados insuficientes para previsão. Registre avaliações PHP primeiro.',
      });
    }

    const n = scores.length;
    const allAvg = scores.reduce((s, r) => s + (r.overall_score ?? 50), 0) / n;
    const recentScores = scores.slice(-3).map((r) => r.overall_score ?? 50);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    const trendDelta = n > 1 ? (recentAvg - allAvg) / n : 0;
    const trendDirection =
      trendDelta > 1 ? 'improving' : trendDelta < -1 ? 'declining' : 'stable';

    const lastScore = scores[scores.length - 1];

    const safeMonths = Math.min(Math.max(Number(months_ahead) || 3, 1), 12);

    const forecasts = Array.from({ length: safeMonths }, (_, i) => {
      const month = i + 1;
      const projected = Math.min(
        100,
        Math.max(0, recentAvg + trendDelta * month),
      );

      const date = new Date();
      date.setMonth(date.getMonth() + month);

      return {
        period: date.toISOString().slice(0, 7),
        projected_overall_score: Math.round(projected),
        trend: trendDirection,
        confidence:
          month === 1 ? 'high' : month === 2 ? 'medium' : 'low',
        areas: {
          tfci: Math.round(
            Math.min(100, Math.max(0, (lastScore?.tfci_score ?? 50) + trendDelta * month)),
          ),
          nr1: Math.round(
            Math.min(
              100,
              Math.max(0, (lastScore?.nr1_score ?? 50) + trendDelta * month * 0.8),
            ),
          ),
          copc: Math.round(
            Math.min(
              100,
              Math.max(0, (lastScore?.copc_score ?? 50) + trendDelta * month * 1.2),
            ),
          ),
        },
      };
    });

    return NextResponse.json({
      forecasts_count: forecasts.length,
      forecasts,
      current_average: Math.round(allAvg),
      recent_average: Math.round(recentAvg),
      trend_direction: trendDirection,
    });
  } catch (error) {
    console.error('[/api/php/ai/forecast-performance]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
