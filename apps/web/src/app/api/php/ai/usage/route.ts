import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id é obrigatório' }, { status: 400 });
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const isMember = await validateOrgMembership(supabase, user.id, orgId);
    if (!isMember) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: usageData } = await supabase
      .from('php_ai_usage')
      .select('feature, input_tokens, output_tokens, cost_usd')
      .eq('org_id', orgId);

    const totalTokens =
      usageData?.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0) ?? 0;
    const totalCost =
      usageData?.reduce((sum, r) => sum + Number(r.cost_usd), 0) ?? 0;
    const requestsCount = usageData?.length ?? 0;

    const byFeature: Record<string, { tokens: number; cost: number; count: number }> = {};
    usageData?.forEach((row) => {
      if (!byFeature[row.feature]) {
        byFeature[row.feature] = { tokens: 0, cost: 0, count: 0 };
      }
      byFeature[row.feature].tokens += row.input_tokens + row.output_tokens;
      byFeature[row.feature].cost += Number(row.cost_usd);
      byFeature[row.feature].count += 1;
    });

    return NextResponse.json({
      total_tokens: totalTokens,
      total_cost_usd: parseFloat(totalCost.toFixed(4)),
      requests_count: requestsCount,
      by_feature: byFeature,
    });
  } catch (error) {
    console.error('[/api/php/ai/usage]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
