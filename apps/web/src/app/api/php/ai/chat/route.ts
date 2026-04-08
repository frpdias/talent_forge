import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase, validateOrgMembership } from '@/lib/api/auth';
import { callLLM, type OrgPlan } from '@/lib/llm-router';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_id, message, conversation_id } = body;

    if (!org_id || !message) {
      return NextResponse.json(
        { error: 'org_id e message são obrigatórios' },
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

    // Org plan (determina provedor de IA)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('plan, name')
      .eq('id', org_id)
      .maybeSingle();
    const orgPlan: OrgPlan = (orgData?.plan as OrgPlan) ?? 'free';

    // Contexto PHP completo para o sistema
    const [
      { data: scores },
      { data: tfciData },
      { data: nr1Data },
      { data: copcCatalog },
      { data: copcEntries },
      { data: copcScores },
    ] = await Promise.all([
      supabase
        .from('php_integrated_scores')
        .select('overall_score, tfci_score, nr1_score, copc_score, created_at')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('tfci_cycles')
        .select('cycle_name, status, overall_score')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('nr1_risk_assessments')
        .select('risk_level, overall_risk_score')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(3),
      // Indicadores COPC cadastrados para a org (ou templates globais)
      supabase
        .from('copc_metrics_catalog')
        .select('id, category, metric_name, metric_code, unit, department, target_value, higher_is_better, is_active')
        .or(`org_id.eq.${org_id},org_id.is.null`)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(40),
      // Últimos lançamentos de valores para indicadores COPC
      supabase
        .from('copc_metric_entries')
        .select('catalog_metric_id, department, metric_date, value, notes')
        .eq('org_id', org_id)
        .order('metric_date', { ascending: false })
        .limit(30),
      // Scores dinâmicos por área
      supabase
        .from('v_copc_dynamic_scores')
        .select('department, metric_date, quality_score, efficiency_score, effectiveness_score, cx_score, people_score, overall_score')
        .eq('org_id', org_id)
        .order('metric_date', { ascending: false })
        .limit(10),
    ]);

    // Monta sumário de quadrante de performance por indicador
    const copcPerformanceGrid = copcCatalog?.map((metric) => {
      const entries = copcEntries?.filter((e) => e.catalog_metric_id === metric.id) ?? [];
      const lastEntry = entries[0];
      let quadrant: string | null = null;
      if (lastEntry && metric.target_value != null) {
        const pct = (lastEntry.value / metric.target_value) * 100;
        // Quadrante: Destaque (≥110%), No Alvo (90-110%), Atenção (70-90%), Crítico (<70%)
        quadrant = pct >= 110 ? 'Destaque' : pct >= 90 ? 'No Alvo' : pct >= 70 ? 'Atenção' : 'Crítico';
      }
      return {
        indicador: metric.metric_name,
        codigo: metric.metric_code,
        categoria: metric.category,
        area: metric.department ?? 'Geral',
        unidade: metric.unit,
        meta: metric.target_value,
        ultimo_valor: lastEntry?.value ?? null,
        data: lastEntry?.metric_date ?? null,
        quadrante: quadrant,
        sem_dados: entries.length === 0,
      };
    }) ?? [];

    const contextSummary = JSON.stringify({
      organizacao: orgData?.name,
      scores_integrados: scores,
      ciclos_tfci: tfciData,
      riscos_nr1: nr1Data,
      copc_indicadores_cadastrados: copcCatalog?.length ?? 0,
      copc_quadrante_performance: copcPerformanceGrid,
      copc_scores_por_area: copcScores,
    });

    // Histórico de conversa
    const convId = conversation_id ?? `conv_${Date.now()}`;
    const { data: existingConv } = await supabase
      .from('php_ai_conversations')
      .select('messages')
      .eq('conversation_id', convId)
      .eq('org_id', org_id)
      .maybeSingle();

    const history: Array<{ role: string; content: string }> =
      (existingConv?.messages as Array<{ role: string; content: string }>) ?? [];

    const messages = [
      {
        role: 'system' as const,
        content: `Você é o Assistente de IA do módulo PHP (People, Health & Performance) do TalentForge.
Você TEM ACESSO aos dados reais da organização abaixo. Use-os para fornecer análises concretas, nunca diga que não tem acesso.

=== DADOS DA ORGANIZAÇÃO ===
${contextSummary}

=== SOBRE O MÓDULO COPC ===
O TalentForge implementa a metodologia COPC Adaptada com 5 categorias:
- Qualidade (35%): precisão, rework, conformidade
- Eficiência (20%): aderência, AHT, custo
- Efetividade (20%): FCR, entrega no prazo, metas
- Customer Experience (15%): CSAT, NPS
- Pessoas (10%): absenteísmo, engajamento

O campo "copc_quadrante_performance" acima mostra TODOS os indicadores cadastrados com seus quadrantes:
- Destaque (≥110% da meta), No Alvo (90-110%), Atenção (70-90%), Crítico (<70%)
- "sem_dados: true" = indicador sem lançamento ainda

Quando o usuário perguntar sobre cadastrar indicadores ou lançar valores, explique que pode ser feito em:
/php/copc → aba "Catálogo" para gerenciar indicadores
/php/copc → aba "Lançamentos" para registrar valores

Responda em português do Brasil de forma objetiva, analítica e acionável. Use os dados reais acima.`,
      },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const result = await callLLM({ orgPlan, messages, maxTokens: 800, temperature: 0.7 });

    // Atualiza histórico
    const updatedMessages = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: result.text },
    ];

    if (existingConv) {
      await supabase
        .from('php_ai_conversations')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('org_id', org_id);
    } else {
      await supabase.from('php_ai_conversations').insert({
        org_id,
        user_id: user.id,
        conversation_id: convId,
        messages: updatedMessages,
      });
    }

    // Rastreia uso
    const inputTokens = Math.round(
      messages.map((m) => m.content.length / 4).reduce((a, b) => a + b, 0),
    );
    const outputTokens = Math.round(result.text.length / 4);
    await supabase.from('php_ai_usage').insert({
      org_id,
      feature: 'chat',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: parseFloat(
        (inputTokens * 0.000005 + outputTokens * 0.000015).toFixed(6),
      ),
    });

    // Extrai ações sugeridas (linhas numeradas ou com marcadores)
    const suggested_actions = result.text
      .split('\n')
      .filter((l) => /^\d+\.|^[-*•]/.test(l.trim()))
      .slice(0, 3)
      .map((l) => l.replace(/^[\d.)]\.|^[-*•]\s*/, '').trim())
      .filter(Boolean);

    return NextResponse.json({
      response: result.text,
      conversation_id: convId,
      suggested_actions,
    });
  } catch (error) {
    console.error('[/api/php/ai/chat]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
