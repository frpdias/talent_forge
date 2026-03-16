import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Prompt padrão do sistema — usado como fallback quando o recrutador não configurou o próprio
export const DEFAULT_REVIEW_PROMPT = `Você é um consultor sênior de Recursos Humanos. Analise o perfil do candidato abaixo e elabore um **Parecer Técnico** completo em português brasileiro, com linguagem formal e objetiva.

## Candidato
Nome: {{nome}}
Cargo desejado: {{cargo}}
Localização: {{localizacao}}

## Formação Acadêmica
{{formacao}}

## Experiência Profissional ({{anos_experiencia}} anos total)
{{experiencias}}

## Resultados Comportamentais
{{disc}}
Avaliação de Cores: {{cores}}
Predictive Index (PI): {{pi}}

## Anotações do Recrutador
{{anotacoes}}
Nota do recrutador: {{nota_recrutador}}/10
{{observacao_recrutador}}

## Score Calculado
- Total: {{score_total}}/100
- Testes comportamentais: {{score_testes}}/100
- Experiência e formação: {{score_experiencia}}/100
- Avaliação do recrutador: {{score_recrutador}}/100

---

Estruture o parecer EXATAMENTE nestes tópicos:

### 1. Resumo Executivo
Parágrafo conciso (3–4 linhas) sobre o perfil geral do candidato.

### 2. Pontos Fortes
Liste 3–5 pontos fortes identificados com base nos dados.

### 3. Pontos de Desenvolvimento
Liste 2–4 áreas que necessitam atenção ou desenvolvimento.

### 4. Análise Comportamental
Interprete os resultados dos testes (DISC, Cores, PI) e o que indicam sobre o candidato no ambiente de trabalho.

### 5. Recomendação Final
Conclusão objetiva: Recomendado / Recomendado com ressalvas / Não recomendado. Justifique em 2–3 linhas.`;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET — busca as configurações do recrutador
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-org-id');
    if (!authHeader || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from('recruiter_settings')
      .select('id, review_prompt, updated_at')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle();

    return NextResponse.json({
      review_prompt: settings?.review_prompt ?? null,
      default_prompt: DEFAULT_REVIEW_PROMPT,
      updated_at: settings?.updated_at ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}

// PUT — salva/atualiza as configurações do recrutador
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-org-id');
    if (!authHeader || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const reviewPrompt: string | null = body.review_prompt ?? null;

    const supabase = createAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('recruiter_settings')
      .upsert(
        {
          user_id: user.id,
          org_id: orgId,
          review_prompt: reviewPrompt && reviewPrompt.trim().length > 0 ? reviewPrompt.trim() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,org_id' },
      )
      .select('id, review_prompt, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}
