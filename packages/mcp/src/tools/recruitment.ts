import { z } from 'zod';
import { supabase, validateOrg } from '../lib/supabase.js';

// ─────────────────────────────────────────────
// SCHEMAS DE INPUT (Zod — validação canônica)
// ─────────────────────────────────────────────

export const SearchCandidatesInput = z.object({
  org_id: z.string().uuid('org_id deve ser um UUID válido'),
  query: z.string().optional().describe('Texto livre: nome, skills, localização'),
  tags: z.array(z.string()).optional().describe('Tags para filtrar'),
  location: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const GetPipelineStatusInput = z.object({
  org_id: z.string().uuid(),
  job_id: z.string().uuid('job_id deve ser um UUID válido'),
});

export const MoveCandidateInput = z.object({
  org_id: z.string().uuid(),
  application_id: z.string().uuid(),
  stage_id: z.string().uuid('stage_id deve ser um UUID válido'),
  notes: z.string().optional().describe('Nota sobre a movimentação'),
});

export const GetCandidateProfileInput = z.object({
  org_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
});

// ─────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────

export async function searchCandidates(
  input: z.infer<typeof SearchCandidatesInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  let query = supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      email,
      phone,
      location,
      tags,
      created_at,
      assessments (
        id,
        assessment_kind,
        normalized_score,
        traits
      )
    `)
    .eq('owner_org_id', input.org_id)
    .limit(input.limit);

  if (input.query) {
    query = query.ilike('full_name', `%${input.query}%`);
  }

  if (input.location) {
    query = query.ilike('location', `%${input.location}%`);
  }

  if (input.tags && input.tags.length > 0) {
    query = query.overlaps('tags', input.tags);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Erro ao buscar candidatos: ${error.message}`);

  return {
    total: data?.length ?? 0,
    candidates: data ?? [],
  };
}

export async function getPipelineStatus(
  input: z.infer<typeof GetPipelineStatusInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  // Busca a vaga (valida que pertence à org — path: jobs.org_id)
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, status, org_id')
    .eq('id', input.job_id)
    .eq('org_id', input.org_id)
    .maybeSingle();

  if (jobError || !job) {
    throw new Error(`Vaga ${input.job_id} não encontrada nesta organização`);
  }

  // Busca estágios com candidatos
  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select(`
      id,
      name,
      order_index,
      applications (
        id,
        status,
        applied_at,
        candidates (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('job_id', input.job_id)
    .order('order_index');

  if (stagesError) {
    throw new Error(`Erro ao buscar pipeline: ${stagesError.message}`);
  }

  const pipeline = (stages ?? []).map((stage) => ({
    stage_id: stage.id,
    stage_name: stage.name,
    order: stage.order_index,
    candidate_count: (stage.applications as unknown[])?.length ?? 0,
    candidates: (stage.applications as Array<{
      id: string;
      status: string;
      applied_at: string;
      candidates: { id: string; full_name: string; email: string };
    }>)?.map((app) => ({
      application_id: app.id,
      status: app.status,
      applied_at: app.applied_at,
      candidate: app.candidates,
    })) ?? [],
  }));

  return {
    job: {
      id: job.id,
      title: job.title,
      status: job.status,
    },
    pipeline,
    total_candidates: pipeline.reduce((sum, s) => sum + s.candidate_count, 0),
  };
}

export async function moveCandidate(
  input: z.infer<typeof MoveCandidateInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  // Valida que a application pertence à org (via job_id → org_id)
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select(`
      id,
      current_stage_id,
      jobs!inner (org_id)
    `)
    .eq('id', input.application_id)
    .maybeSingle();

  if (appError || !app) {
    throw new Error(`Candidatura ${input.application_id} não encontrada`);
  }

  const jobOrgId = (app.jobs as unknown as { org_id: string })?.org_id;
  if (jobOrgId !== input.org_id) {
    throw new Error('Candidatura não pertence a esta organização');
  }

  const previousStageId = app.current_stage_id;

  // Move a candidatura
  const { error: updateError } = await supabase
    .from('applications')
    .update({
      current_stage_id: input.stage_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.application_id);

  if (updateError) {
    throw new Error(`Erro ao mover candidatura: ${updateError.message}`);
  }

  // Registra evento de movimentação (conforme DA: application_events é audit trail)
  await supabase.from('application_events').insert({
    application_id: input.application_id,
    from_stage_id: previousStageId,
    to_stage_id: input.stage_id,
    notes: input.notes ?? 'Movido via TalentForge MCP',
  });

  return {
    success: true,
    application_id: input.application_id,
    moved_to_stage: input.stage_id,
  };
}

export async function getCandidateProfile(
  input: z.infer<typeof GetCandidateProfileInput>
) {
  if (!(await validateOrg(input.org_id))) {
    throw new Error(`Organização ${input.org_id} não encontrada ou inativa`);
  }

  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      email,
      phone,
      location,
      tags,
      created_at,
      candidate_notes (
        id,
        note,
        created_at
      ),
      assessments (
        id,
        assessment_kind,
        normalized_score,
        traits,
        created_at
      ),
      applications (
        id,
        status,
        applied_at,
        jobs (
          id,
          title,
          status
        )
      )
    `)
    .eq('id', input.candidate_id)
    .eq('owner_org_id', input.org_id)
    .maybeSingle();

  if (error || !candidate) {
    throw new Error(`Candidato ${input.candidate_id} não encontrado nesta organização`);
  }

  return candidate;
}
