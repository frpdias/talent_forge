import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Cálculo de score ────────────────────────────────────────────────────────

function calcScoreTestes(disc: any, color: any, pi: any): number {
  let score = 0;
  if (disc) score += 40;           // DISC completo
  else if (color) score += 0;
  if (color) score += 30;          // Color completo
  if (pi) score += 30;             // PI completo
  return Math.min(100, score);
}

function calcScoreExperiencia(experienceYears: number, educationLevel: string): number {
  // Pontos por anos: 4 pts/ano, máx 60
  const expPoints = Math.min(60, experienceYears * 4);

  // Pontos por grau académico (máx 40)
  const grauMap: Record<string, number> = {
    doutorado: 40, mestrado: 35, mba: 32,
    pos_graduacao: 28, graduacao: 22,
    tecnico: 14, ensino_medio: 8, ensino_fundamental: 4,
  };
  const eduPoints = grauMap[educationLevel] ?? 10;

  return Math.min(100, expPoints + eduPoints);
}

function calcScoreRecrutador(rating: number): number {
  // rating 0–10 → 0–100
  return Math.min(100, (rating / 10) * 100);
}

function calcScoreTotal(testes: number, experiencia: number, recrutador: number): number {
  return Math.round(testes * 0.4 + experiencia * 0.35 + recrutador * 0.25);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: candidateId } = await params;

    // 1. Autenticação
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

    // 2. Verificar membership
    const { data: member } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (!member) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 3. Body
    const body = await request.json().catch(() => ({}));
    const recruiterRating: number = Math.max(0, Math.min(10, Number(body.recruiter_rating ?? 7)));
    const recruiterNote: string = body.recruiter_note ?? '';

    // 4. Buscar candidato
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id, full_name, email, user_id, current_title, location, tags')
      .eq('id', candidateId)
      .maybeSingle();
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 });
    }

    // 5. Buscar notas do recrutador
    const { data: notes } = await supabase
      .from('candidate_notes')
      .select('note, created_at')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. Buscar profile + education + experience
    let profile: any = null;
    let educations: any[] = [];
    let experiences: any[] = [];

    if (candidate.user_id) {
      const { data: p } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', candidate.user_id)
        .maybeSingle();
      profile = p;
    }
    if (!profile && candidate.email) {
      const { data: p } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('email', candidate.email)
        .maybeSingle();
      profile = p;
    }

    if (profile?.id) {
      const [eduRes, expRes] = await Promise.all([
        supabase
          .from('candidate_education')
          .select('degree_level, course_name, institution, start_year, end_year, is_current')
          .eq('candidate_profile_id', profile.id)
          .order('start_year', { ascending: false }),
        supabase
          .from('candidate_experience')
          .select('company_name, job_title, start_date, end_date, is_current, description')
          .eq('candidate_profile_id', profile.id)
          .order('start_date', { ascending: false }),
      ]);
      educations = eduRes.data ?? [];
      experiences = expRes.data ?? [];
    }

    // Calcula anos de experiência
    let experienceYears = 0;
    if (experiences.length > 0) {
      const starts = experiences.map((e) => e.start_date ? new Date(e.start_date) : null).filter(Boolean) as Date[];
      const ends = experiences.map((e) => (!e.end_date || e.is_current) ? new Date() : new Date(e.end_date));
      if (starts.length > 0) {
        const minStart = new Date(Math.min(...starts.map((d) => d.getTime())));
        const maxEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
        const months = (maxEnd.getFullYear() - minStart.getFullYear()) * 12 + (maxEnd.getMonth() - minStart.getMonth());
        experienceYears = Math.max(0, Math.floor(months / 12));
      }
    }

    // Nível de educação mais alto
    const grauOrder = ['doutorado', 'mestrado', 'mba', 'pos_graduacao', 'graduacao', 'tecnico', 'ensino_medio', 'ensino_fundamental'];
    const topEdu = educations.find((e) => grauOrder.includes(e.degree_level))?.degree_level ?? 'ensino_medio';

    // 7. Buscar assessments
    const userIds = [candidate.user_id].filter(Boolean) as string[];
    let discResult: any = null;
    let colorResult: any = null;
    let piResult: any = null;

    if (userIds.length > 0) {
      const [discRes, colorRes, piRes] = await Promise.all([
        supabase
          .from('assessments')
          .select('id, traits')
          .in('candidate_user_id', userIds)
          .eq('assessment_type', 'disc')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('color_assessments')
          .select('primary_color, secondary_color, scores')
          .in('candidate_user_id', userIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('pi_assessments')
          .select('scores_natural, scores_adapted')
          .in('candidate_user_id', userIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (discRes.data?.traits?.disc) {
        const d = discRes.data.traits.disc;
        discResult = {
          D: d.D ?? d.dominance_score ?? 0,
          I: d.I ?? d.influence_score ?? 0,
          S: d.S ?? d.steadiness_score ?? 0,
          C: d.C ?? d.conscientiousness_score ?? 0,
          profile: d.primary ?? d.primary_profile ?? '',
        };
      }
      if (colorRes.data) {
        colorResult = colorRes.data;
      }
      if (piRes.data) {
        piResult = { natural: piRes.data.scores_natural, adapted: piRes.data.scores_adapted };
      }
    }

    // 8. Calcular scores
    const scoreTestes = calcScoreTestes(discResult, colorResult, piResult);
    const scoreExperiencia = calcScoreExperiencia(experienceYears, topEdu);
    const scoreRecrutador = calcScoreRecrutador(recruiterRating);
    const scoreTotal = calcScoreTotal(scoreTestes, scoreExperiencia, scoreRecrutador);

    // 9. Montar snapshot
    const inputSnapshot = {
      candidate: { full_name: candidate.full_name, email: candidate.email, current_title: candidate.current_title, location: candidate.location },
      profile: profile ? { city: profile.city, state: profile.state, area_of_expertise: profile.area_of_expertise, seniority_level: profile.seniority_level } : null,
      educations,
      experiences,
      experienceYears,
      disc: discResult,
      color: colorResult,
      pi: piResult,
      notes: (notes ?? []).map((n: any) => n.note),
      recruiterRating,
      recruiterNote,
      scores: { total: scoreTotal, testes: scoreTestes, experiencia: scoreExperiencia, recrutador: scoreRecrutador },
    };

    // 10. Gerar parecer com IA
    let aiReview = '';
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey });

      const discSummary = discResult
        ? `DISC: D=${discResult.D}%, I=${discResult.I}%, S=${discResult.S}%, C=${discResult.C}% (Perfil: ${discResult.profile})`
        : 'Não realizado';
      const colorSummary = colorResult
        ? `Cor primária: ${colorResult.primary_color}, secundária: ${colorResult.secondary_color}`
        : 'Não realizado';
      const piSummary = piResult
        ? `Natural: ${JSON.stringify(piResult.natural)}`
        : 'Não realizado';
      const grauMap: Record<string, string> = {
        doutorado: 'Doutorado', mestrado: 'Mestrado', mba: 'MBA',
        pos_graduacao: 'Pós-Graduação', graduacao: 'Graduação',
        tecnico: 'Técnico', ensino_medio: 'Ensino Médio', ensino_fundamental: 'Ensino Fundamental',
      };
      const topEduLabel = grauMap[topEdu] ?? topEdu;
      const expSummary = experiences.map((e: any) =>
        `- ${e.job_title} @ ${e.company_name}${e.is_current ? ' (atual)' : ''}`
      ).join('\n') || 'Sem experiências cadastradas';

      const eduSummary = educations.map((e: any) =>
        `- ${grauMap[e.degree_level] ?? e.degree_level} em ${e.course_name} — ${e.institution}`
      ).join('\n') || 'Sem formação cadastrada';

      const notesSummary = (notes ?? []).length > 0
        ? (notes ?? []).map((n: any) => `• ${n.note}`).join('\n')
        : 'Sem anotações do recrutador';

      const prompt = `Você é um consultor sênior de Recursos Humanos. Analise o perfil do candidato abaixo e elabore um **Parecer Técnico** completo em português brasileiro, com linguagem formal e objetiva.

## Candidato
Nome: ${candidate.full_name}
Cargo desejado: ${candidate.current_title ?? 'Não informado'}
Localização: ${candidate.location ?? 'Não informada'}

## Formação Acadêmica
${eduSummary}

## Experiência Profissional (${experienceYears} anos total)
${expSummary}

## Resultados Comportamentais
${discSummary}
Avaliação de Cores: ${colorSummary}
Predictive Index (PI): ${piSummary}

## Anotações do Recrutador
${notesSummary}
Nota do recrutador: ${recruiterRating}/10
${recruiterNote ? `Observação: ${recruiterNote}` : ''}

## Score Calculado
- Total: ${scoreTotal}/100
- Testes comportamentais: ${scoreTestes}/100
- Experiência e formação: ${scoreExperiencia}/100
- Avaliação do recrutador: ${scoreRecrutador}/100

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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      });

      aiReview = completion.choices[0]?.message?.content ?? '';
    } else {
      aiReview = `## Parecer Técnico — Gerado sem IA\n\n**Atenção:** OPENAI_API_KEY não configurada. Configure a variável de ambiente para habilitar a geração automática de pareceres.\n\n**Score calculado:** ${scoreTotal}/100\n- Testes: ${scoreTestes}/100\n- Experiência: ${scoreExperiencia}/100\n- Avaliação do recrutador: ${scoreRecrutador}/100`;
    }

    // 11. Persistir
    const { data: review, error: insertError } = await supabase
      .from('candidate_technical_reviews')
      .insert({
        candidate_id: candidateId,
        org_id: orgId,
        generated_by: user.id,
        score_total: scoreTotal,
        score_testes: scoreTestes,
        score_experiencia: scoreExperiencia,
        score_recrutador: scoreRecrutador,
        recruiter_rating: recruiterRating,
        recruiter_note: recruiterNote || null,
        ai_review: aiReview,
        ai_model: openaiKey ? 'gpt-4o' : 'none',
        input_snapshot: inputSnapshot,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[technical-review] Insert error:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      id: review.id,
      score_total: scoreTotal,
      score_testes: scoreTestes,
      score_experiencia: scoreExperiencia,
      score_recrutador: scoreRecrutador,
      ai_review: aiReview,
      created_at: review.created_at,
    });
  } catch (err: any) {
    console.error('[technical-review] Unexpected error:', err);
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}

// Buscar último parecer do candidato
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: candidateId } = await params;
    const authHeader = request.headers.get('authorization');
    const orgId = request.headers.get('x-org-id');
    if (!authHeader || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    const { data: reviews } = await supabase
      .from('candidate_technical_reviews')
      .select('id, score_total, score_testes, score_experiencia, score_recrutador, ai_review, recruiter_rating, recruiter_note, ai_model, created_at')
      .eq('candidate_id', candidateId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 });
  }
}
