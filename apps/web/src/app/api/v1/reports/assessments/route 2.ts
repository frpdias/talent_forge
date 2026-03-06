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
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * GET /api/v1/reports/assessments?jobId=<UUID>
 * Relatório de avaliações da org (filtrado por vaga opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    let query = supabase
      .from('assessments')
      .select(
        `id, status, assessment_type, raw_score, normalized_score, traits, created_at,
         candidates!inner (id, owner_org_id),
         jobs (id, title)`,
      )
      .eq('candidates.owner_org_id', orgId)
      .eq('status', 'completed');

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data: assessments, error } = await query;

    if (error) {
      console.error('Erro ao buscar assessments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!assessments || assessments.length === 0) {
      return NextResponse.json({
        totalAssessments: 0,
        completedAssessments: 0,
        byType: {},
        recentAssessments: [],
        averageScore: 0,
        medianScore: 0,
        traitAverages: { bigFive: {}, disc: {} },
        scoreDistribution: [],
      });
    }

    const toNumber = (value: any): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const normalizeScore = (value: number): number => {
      if (value <= 1) return Math.round(value * 100);
      if (value > 100) return Math.min(100, Math.round(value));
      return Math.round(value);
    };

    const extractScore = (assessment: any): number | null => {
      const direct = toNumber(assessment.normalized_score);
      if (direct !== null) return normalizeScore(direct);
      const raw = toNumber(assessment.raw_score?.score ?? assessment.raw_score);
      if (raw !== null) return normalizeScore(raw);
      const traitsScore = toNumber(assessment.traits?.score);
      if (traitsScore !== null) return normalizeScore(traitsScore);
      return null;
    };

    const accumulateAverage = (
      bucket: Record<string, { sum: number; count: number }>,
      key: string,
      value: any,
    ) => {
      const numeric = toNumber(value);
      if (numeric === null) return;
      if (!bucket[key]) bucket[key] = { sum: 0, count: 0 };
      bucket[key].sum += numeric;
      bucket[key].count += 1;
    };

    const byType: Record<string, number> = {};
    const scores: number[] = [];
    const discBucket: Record<string, { sum: number; count: number }> = {};
    const bigFiveBucket: Record<string, { sum: number; count: number }> = {};

    for (const a of assessments as any[]) {
      const type = a.assessment_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      const score = extractScore(a);
      if (score !== null) scores.push(score);

      const traits = a.traits || {};
      const discTraits = traits.disc || traits;
      const bigFiveTraits = traits.big_five || traits.bigFive || traits;

      accumulateAverage(discBucket, 'dominance', discTraits.D ?? discTraits.dominance);
      accumulateAverage(discBucket, 'influence', discTraits.I ?? discTraits.influence);
      accumulateAverage(discBucket, 'steadiness', discTraits.S ?? discTraits.steadiness);
      accumulateAverage(discBucket, 'conscientiousness', discTraits.C ?? discTraits.conscientiousness);

      accumulateAverage(bigFiveBucket, 'openness', bigFiveTraits.openness);
      accumulateAverage(bigFiveBucket, 'conscientiousness', bigFiveTraits.conscientiousness);
      accumulateAverage(bigFiveBucket, 'extraversion', bigFiveTraits.extraversion);
      accumulateAverage(bigFiveBucket, 'agreeableness', bigFiveTraits.agreeableness);
      accumulateAverage(bigFiveBucket, 'neuroticism', bigFiveTraits.neuroticism);
    }

    const averageScore = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0;

    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianScore = scores.length
      ? sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid]
      : 0;

    const buildAverages = (bucket: Record<string, { sum: number; count: number }>) => {
      const result: Record<string, number> = {};
      for (const [key, val] of Object.entries(bucket)) {
        result[key] = val.count ? Math.round(val.sum / val.count) : 0;
      }
      return result;
    };

    const scoreDistribution = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ].map(({ label, min, max }) => {
      const count = scores.filter((v) => v >= min && v <= max).length;
      return {
        range: label,
        count,
        percentage: scores.length ? Math.round((count / scores.length) * 100) : 0,
      };
    });

    return NextResponse.json({
      totalAssessments: (assessments as any[]).length,
      completedAssessments: (assessments as any[]).filter((a: any) => a.status === 'completed').length,
      byType,
      recentAssessments: (assessments as any[]).slice(0, 10).map((a: any) => ({
        id: a.id,
        type: a.assessment_type,
        status: a.status,
        createdAt: a.created_at,
        job: a.jobs,
      })),
      averageScore,
      medianScore,
      traitAverages: {
        bigFive: buildAverages(bigFiveBucket),
        disc: buildAverages(discBucket),
      },
      scoreDistribution,
    });
  } catch (error: any) {
    console.error('Erro no reports/assessments:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
