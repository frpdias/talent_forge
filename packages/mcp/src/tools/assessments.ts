import { z } from 'zod';
import { supabase, validateOrg } from '../lib/supabase.js';

// ─────────────────────────────────────────────
// SCHEMAS DE INPUT
// ─────────────────────────────────────────────

export const AnalyzeDiscProfileInput = z.object({
  org_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
});

export const CompareCandidatesInput = z.object({
  org_id: z.string().uuid(),
  candidate_ids: z
    .array(z.string().uuid())
    .min(2, 'Mínimo 2 candidatos para comparação')
    .max(10, 'Máximo 10 candidatos por vez'),
  job_id: z.string().uuid().optional().describe('Se informado, compara com o perfil da vaga'),
});

export const GetTeamHealthInput = z.object({
  org_id: z.string().uuid(),
  team_id: z.string().uuid().optional().describe('Se omitido, retorna score geral da org'),
});

// ─────────────────────────────────────────────
// MAPA DISC — interpretação canônica
// ─────────────────────────────────────────────

const DISC_DESCRIPTIONS: Record<string, string> = {
  D: 'Dominância — orientado a resultados, decisivo, direto, gosta de desafios e autonomia',
  I: 'Influência — comunicativo, entusiasta, persuasivo, trabalha bem em equipe e relacionamentos',
  S: 'Estabilidade — paciente, consistente, leal, prefere ambientes previsíveis e colaboração',
  C: 'Conformidade — analítico, preciso, detalhista, segue regras e preza pela qualidade',
};

const DISC_STRENGTHS: Record<string, string[]> = {
  D: ['Liderança', 'Tomada de decisão rápida', 'Foco em resultados', 'Resiliência'],
  I: ['Comunicação', 'Motivação de equipes', 'Criatividade', 'Networking'],
  S: ['Confiabilidade', 'Trabalho em equipe', 'Mediação de conflitos', 'Consistência'],
  C: ['Qualidade', 'Análise de dados', 'Planejamento', 'Precisão técnica'],
};

const DISC_ATTENTION: Record<string, string[]> = {
  D: ['Pode ser impulsivo', 'Dificuldade em ouvir', 'Tendência a conflitos'],
  I: ['Pode ser desorganizado', 'Dificuldade com detalhes', 'Foco disperso'],
  S: ['Pode resistir a mudanças', 'Dificuldade em dizer não', 'Passividade excessiva'],
  C: ['Perfeccionismo paralisante', 'Lentidão para decidir', 'Rigidez'],
};

function interpretDiscScore(traits: Record<string, number>) {
  const sorted = Object.entries(traits).sort(([, a], [, b]) => b - a);
  const [primary, secondary] = sorted;

  return {
    primary_trait: primary?.[0] ?? 'N/A',
    primary_score: primary?.[1] ?? 0,
    secondary_trait: secondary?.[0] ?? 'N/A',
    secondary_score: secondary?.[1] ?? 0,
    profile_name: `${primary?.[0] ?? ''}${secondary?.[0] ?? ''}`,
    description: primary ? DISC_DESCRIPTIONS[primary[0]] : 'Perfil não identificado',
    strengths: primary ? DISC_STRENGTHS[primary[0]] : [],
    attention_points: primary ? DISC_ATTENTION[primary[0]] : [],
    all_scores: traits,
  };
}

// ─────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────

export async function analyzeDiscProfile(
  input: z.infer<typeof AnalyzeDiscProfileInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  // Busca candidato e confirma pertence à org
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('id, full_name, email')
    .eq('id', input.candidate_id)
    .eq('owner_org_id', input.org_id)
    .maybeSingle();

  if (candidateError || !candidate) {
    throw new Error(`Candidato ${input.candidate_id} não encontrado nesta organização`);
  }

  // Busca assessment DISC mais recente
  // Conforme DA: assessments conecta à org via job_id → jobs.org_id
  const { data: assessment, error } = await supabase
    .from('disc_assessments')
    .select(`
      id,
      d_score,
      i_score,
      s_score,
      c_score,
      primary_profile,
      secondary_profile,
      created_at,
      assessments!inner (
        candidate_id,
        normalized_score
      )
    `)
    .eq('assessments.candidate_id', input.candidate_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !assessment) {
    return {
      candidate: candidate,
      disc_assessment: null,
      message: 'Candidato ainda não realizou o assessment DISC',
    };
  }

  const traits = {
    D: assessment.d_score ?? 0,
    I: assessment.i_score ?? 0,
    S: assessment.s_score ?? 0,
    C: assessment.c_score ?? 0,
  };

  return {
    candidate,
    disc_assessment: {
      assessment_id: assessment.id,
      completed_at: assessment.created_at,
      interpretation: interpretDiscScore(traits),
      raw_profile: {
        primary: assessment.primary_profile,
        secondary: assessment.secondary_profile,
      },
    },
  };
}

export async function compareCandidates(
  input: z.infer<typeof CompareCandidatesInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  // Busca todos os candidatos da org de uma vez
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      email,
      location,
      tags,
      assessments (
        id,
        assessment_kind,
        normalized_score,
        traits,
        created_at
      )
    `)
    .eq('owner_org_id', input.org_id)
    .in('id', input.candidate_ids);

  if (error) throw new Error(`Erro ao buscar candidatos: ${error.message}`);

  // Monta comparativo com score geral
  const comparison = (candidates ?? []).map((c) => {
    const latestAssessment = (c.assessments as Array<{
      id: string;
      assessment_kind: string;
      normalized_score: number;
      traits: Record<string, number>;
      created_at: string;
    }>)?.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      candidate_id: c.id,
      full_name: c.full_name,
      email: c.email,
      location: c.location,
      tags: c.tags,
      assessment_score: latestAssessment?.normalized_score ?? null,
      assessment_kind: latestAssessment?.assessment_kind ?? null,
      disc_traits: latestAssessment?.traits
        ? interpretDiscScore(latestAssessment.traits as Record<string, number>)
        : null,
    };
  });

  // Ordena pelo score (maior primeiro)
  comparison.sort((a, b) => (b.assessment_score ?? 0) - (a.assessment_score ?? 0));

  return {
    total: comparison.length,
    ranked_candidates: comparison,
    recommendation: comparison[0]
      ? `Candidato mais bem avaliado: ${comparison[0].full_name} (score: ${comparison[0].assessment_score?.toFixed(1) ?? 'N/A'})`
      : 'Nenhum candidato com assessment completo encontrado',
  };
}

export async function getTeamHealth(
  input: z.infer<typeof GetTeamHealthInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  // Conforme DA: php_integrated_scores armazena score integrado TFCI+NR1+COPC
  const { data: scores, error } = await supabase
    .from('php_integrated_scores')
    .select('*')
    .eq('org_id', input.org_id)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Busca último ciclo TFCI
  const { data: tfciCycle } = await supabase
    .from('tfci_cycles')
    .select('id, name, status, created_at')
    .eq('org_id', input.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Busca última avaliação NR-1
  const { data: nr1Assessment } = await supabase
    .from('nr1_risk_assessments')
    .select('id, overall_risk_level, created_at')
    .eq('org_id', input.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar health score: ${error.message}`);

  return {
    org_id: input.org_id,
    integrated_score: scores ?? null,
    latest_tfci_cycle: tfciCycle ?? null,
    latest_nr1_assessment: nr1Assessment ?? null,
    summary: scores
      ? `Score integrado PHP: ${JSON.stringify(scores)}`
      : 'Módulo PHP ainda não possui dados suficientes para score integrado',
  };
}
