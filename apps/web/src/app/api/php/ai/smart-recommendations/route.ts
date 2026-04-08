import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';
import { callLLM, type OrgPlan } from '@/lib/llm-router';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, goal } = body;

    if (!org_id || !goal) {
      return NextResponse.json(
        { error: 'org_id e goal são obrigatórios' },
        { status: 400 },
      );
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

    const { data: orgData } = await supabase
      .from('organizations')
      .select('plan, name')
      .eq('id', org_id)
      .maybeSingle();
    const orgPlan: OrgPlan = (orgData?.plan as OrgPlan) ?? 'free';

    const [{ data: scores }, { data: nr1Data }] = await Promise.all([
      supabase
        .from('php_integrated_scores')
        .select('overall_score, tfci_score, nr1_score, copc_score')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('nr1_risk_assessments')
        .select('risk_level, overall_risk_score')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    const messages = [
      {
        role: 'system' as const,
        content: `Você é um consultor especialista em People, Health & Performance (PHP).
Gere EXATAMENTE 5 recomendações práticas e priorizadas para atingir o objetivo informado.
Responda exclusivamente em JSON válido com a estrutura:
{"recommendations":[{"title":"...","description":"...","impact":"alto|médio|baixo","timeframe":"...","success_indicators":["..."]}]}
Não inclua nenhum texto fora do JSON.`,
      },
      {
        role: 'user' as const,
        content: `Organização: ${orgData?.name ?? 'N/A'}
Objetivo: ${goal}
Scores atuais: ${JSON.stringify(scores?.[0] ?? {})}
Riscos NR-1 recentes: ${JSON.stringify(nr1Data?.[0] ?? {})}`,
      },
    ];

    const result = await callLLM({ orgPlan, messages, maxTokens: 1000, temperature: 0.6 });

    // Parseia a resposta JSON
    let recommendations: unknown[] = [];
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { recommendations?: unknown[] };
        recommendations = parsed.recommendations ?? [];
      }
    } catch {
      // Fallback: transforma linhas em recomendações básicas
      recommendations = result.text
        .split('\n')
        .filter((l) => l.trim().length > 20)
        .slice(0, 5)
        .map((l, i) => ({
          title: `Recomendação ${i + 1}`,
          description: l.replace(/^[\d.)\-*•]+\s*/, '').trim(),
          impact: 'médio',
          timeframe: '30 dias',
          success_indicators: [],
        }));
    }

    // Rastreia uso
    const inputTokens = Math.round(
      messages.map((m) => m.content.length / 4).reduce((a, b) => a + b, 0),
    );
    const outputTokens = Math.round(result.text.length / 4);
    await supabase.from('php_ai_usage').insert({
      org_id,
      feature: 'smart_recommendations',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: parseFloat(
        (inputTokens * 0.000005 + outputTokens * 0.000015).toFixed(6),
      ),
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('[/api/php/ai/smart-recommendations]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
