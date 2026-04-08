import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';
import { callLLM, type OrgPlan } from '@/lib/llm-router';

export const dynamic = 'force-dynamic';

const REPORT_INSTRUCTIONS: Record<string, string> = {
  summary: 'Gere um relatório executivo resumido (máx 500 palavras)',
  detailed: 'Gere um relatório detalhado e abrangente com análise aprofundada de cada pilar',
  executive: 'Gere um relatório para diretoria com KPIs estratégicos e recomendações prioritárias',
  comparison: 'Gere um relatório comparativo entre os últimos ciclos com evolução dos indicadores',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, report_type = 'summary', language = 'pt-BR' } = body;

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

    const { data: orgData } = await supabase
      .from('organizations')
      .select('plan, name')
      .eq('id', org_id)
      .maybeSingle();
    const orgPlan: OrgPlan = (orgData?.plan as OrgPlan) ?? 'free';

    const [{ data: scores }, { data: tfciCycles }, { data: nr1Risks }, { data: copcMetrics }] =
      await Promise.all([
        supabase
          .from('php_integrated_scores')
          .select('overall_score, tfci_score, nr1_score, copc_score, created_at')
          .eq('org_id', org_id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('tfci_cycles')
          .select('cycle_name, status, overall_score, created_at')
          .eq('org_id', org_id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('nr1_risk_assessments')
          .select('risk_level, overall_risk_score, created_at')
          .eq('org_id', org_id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('copc_metrics')
          .select('metric_name, value, target, created_at')
          .eq('org_id', org_id)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

    const reportInstruction =
      REPORT_INSTRUCTIONS[report_type] ?? REPORT_INSTRUCTIONS.summary;

    const messages = [
      {
        role: 'system' as const,
        content: `Você é um especialista em análise de People, Health & Performance (PHP).
Gere um relatório profissional em ${language} com: título, resumo executivo, análise por pilar (TFCI/NR-1/COPC), conclusões e recomendações.
Seja objetivo, baseie-se nos dados e forneça insights acionáveis.`,
      },
      {
        role: 'user' as const,
        content: `${reportInstruction} para ${orgData?.name ?? 'a organização'}:

Scores Integrados: ${JSON.stringify(scores?.slice(0, 3))}
Ciclos TFCI: ${JSON.stringify(tfciCycles)}
Avaliações NR-1: ${JSON.stringify(nr1Risks)}
Métricas COPC: ${JSON.stringify(copcMetrics?.slice(0, 5))}`,
      },
    ];

    const result = await callLLM({ orgPlan, messages, maxTokens: 1200, temperature: 0.5 });

    const title = `Relatório PHP ${report_type.charAt(0).toUpperCase() + report_type.slice(1)} — ${orgData?.name ?? 'Organização'}`;
    const generatedAt = new Date().toISOString();

    // Extrai recomendações do texto
    const recommendations = result.text
      .split('\n')
      .filter(
        (l) =>
          /recomend|ação|prioridade|implementar|melhorar|reduzir/i.test(l) &&
          l.trim().length > 20,
      )
      .slice(0, 5)
      .map((l) => l.replace(/^[\d.)\-*•]+\s*/, '').trim())
      .filter(Boolean);

    // Persiste o relatório
    await supabase.from('php_ai_reports').insert({
      org_id,
      generated_by: user.id,
      report_type,
      title,
      content: result.text,
      recommendations,
      metadata: { language, provider: result.provider, model: result.model },
    });

    // Rastreia uso
    const inputTokens = Math.round(
      messages.map((m) => m.content.length / 4).reduce((a, b) => a + b, 0),
    );
    const outputTokens = Math.round(result.text.length / 4);
    await supabase.from('php_ai_usage').insert({
      org_id,
      feature: `report_${report_type}`,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: parseFloat(
        (inputTokens * 0.000005 + outputTokens * 0.000015).toFixed(6),
      ),
    });

    return NextResponse.json({
      title,
      content: result.text,
      generated_at: generatedAt,
      recommendations,
    });
  } catch (error) {
    console.error('[/api/php/ai/report]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
