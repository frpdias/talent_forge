import { z } from 'zod';
import { supabase, validateOrg } from '../lib/supabase.js';

// ─────────────────────────────────────────────
// SCHEMAS DE INPUT
// ─────────────────────────────────────────────

export const GetRecruitmentMetricsInput = z.object({
  org_id: z.string().uuid(),
  period_days: z
    .number()
    .int()
    .min(7)
    .max(365)
    .default(30)
    .describe('Período em dias (7 a 365)'),
});

export const GetEmployeeListInput = z.object({
  org_id: z.string().uuid(),
  team_id: z.string().uuid().optional(),
  department: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const PredictRetentionRiskInput = z.object({
  org_id: z.string().uuid(),
  employee_id: z.string().uuid().optional().describe('Se omitido, retorna top 10 em risco'),
});

// ─────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────

export async function getRecruitmentMetrics(
  input: z.infer<typeof GetRecruitmentMetricsInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  const since = new Date();
  since.setDate(since.getDate() - input.period_days);
  const sinceIso = since.toISOString();

  // Vagas abertas/fechadas no período
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at')
    .eq('org_id', input.org_id)
    .gte('created_at', sinceIso);

  // Candidatos adicionados no período
  const { data: newCandidates } = await supabase
    .from('candidates')
    .select('id, created_at')
    .eq('owner_org_id', input.org_id)
    .gte('created_at', sinceIso);

  // Candidaturas no período
  // Conforme DA: applications não tem org_id — acessa via job_id → jobs.org_id
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      applied_at,
      updated_at,
      jobs!inner (org_id)
    `)
    .eq('jobs.org_id', input.org_id)
    .gte('applied_at', sinceIso);

  const appList = (applications ?? []) as Array<{
    id: string;
    status: string;
    applied_at: string;
    updated_at: string;
  }>;

  const hired = appList.filter((a) => a.status === 'hired');
  const rejected = appList.filter((a) => a.status === 'rejected');
  const inProcess = appList.filter((a) => a.status === 'in_process');

  // Tempo médio de contratação (para os contratados)
  const avgTimeToHire =
    hired.length > 0
      ? hired.reduce((sum, a) => {
          const days =
            (new Date(a.updated_at).getTime() - new Date(a.applied_at).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / hired.length
      : null;

  const conversionRate =
    appList.length > 0
      ? ((hired.length / appList.length) * 100).toFixed(1)
      : '0';

  return {
    period: `Últimos ${input.period_days} dias`,
    jobs: {
      total_created: (jobs ?? []).length,
      open: (jobs ?? []).filter((j) => j.status === 'open').length,
      closed: (jobs ?? []).filter((j) => j.status === 'closed').length,
    },
    candidates: {
      new: (newCandidates ?? []).length,
    },
    applications: {
      total: appList.length,
      in_process: inProcess.length,
      hired: hired.length,
      rejected: rejected.length,
      conversion_rate_pct: conversionRate,
    },
    time_to_hire: {
      avg_days: avgTimeToHire ? avgTimeToHire.toFixed(1) : null,
      unit: 'dias',
    },
  };
}

export async function getEmployeeList(
  input: z.infer<typeof GetEmployeeListInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  let query = supabase
    .from('employees')
    .select(`
      id,
      full_name,
      email,
      position,
      department,
      hierarchy_level,
      status,
      created_at
    `)
    .eq('org_id', input.org_id)
    .limit(input.limit);

  if (input.department) {
    query = query.ilike('department', `%${input.department}%`);
  }

  if (input.team_id) {
    // Filtra via team_members
    const { data: memberIds } = await supabase
      .from('team_members')
      .select('employee_id')
      .eq('team_id', input.team_id);

    const ids = (memberIds ?? []).map((m) => m.employee_id);
    if (ids.length === 0) return { total: 0, employees: [] };
    query = query.in('id', ids);
  }

  const { data, error } = await query.order('full_name');

  if (error) throw new Error(`Erro ao buscar colaboradores: ${error.message}`);

  return {
    total: data?.length ?? 0,
    employees: data ?? [],
  };
}

export async function predictRetentionRisk(
  input: z.infer<typeof PredictRetentionRiskInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  // Busca scores integrados existentes (calculados pelo módulo PHP/AI)
  // Conforme DA: php_integrated_scores agrega TFCI + NR1 + COPC
  const query = supabase
    .from('php_integrated_scores')
    .select('*')
    .eq('org_id', input.org_id)
    .order('calculated_at', { ascending: false });

  const { data: scores, error } = input.employee_id
    ? await query.eq('employee_id', input.employee_id).limit(1)
    : await query.limit(10);

  if (error) throw new Error(`Erro ao buscar scores: ${error.message}`);

  // Se não há scores calculados ainda, usa heurística via NR-1
  if (!scores || scores.length === 0) {
    const { data: nr1 } = await supabase
      .from('nr1_risk_assessments')
      .select('id, overall_risk_level, created_at, org_id')
      .eq('org_id', input.org_id)
      .eq('overall_risk_level', 'high')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      method: 'heuristica_nr1',
      message:
        'Scores de retenção ainda não calculados. Usando dados NR-1 como proxy de risco.',
      high_risk_assessments: nr1 ?? [],
      recommendation:
        nr1 && nr1.length > 0
          ? `${nr1.length} avaliações NR-1 com risco alto identificadas. Recomenda-se ação imediata.`
          : 'Nenhum risco crítico identificado nos dados NR-1.',
    };
  }

  return {
    method: 'php_integrated_scores',
    employees_at_risk: scores,
    total: scores.length,
    recommendation: `${scores.length} colaborador(es) com dados de risco disponíveis para análise.`,
  };
}
