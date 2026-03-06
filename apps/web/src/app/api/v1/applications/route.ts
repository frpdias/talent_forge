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
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

function mapApplication(app: any) {
  const stage = Array.isArray(app.pipeline_stages)
    ? app.pipeline_stages[0]
    : app.pipeline_stages;
  const candidate = Array.isArray(app.candidates)
    ? app.candidates[0]
    : app.candidates;
  const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;

  return {
    id: app.id,
    jobId: app.job_id,
    candidateId: app.candidate_id,
    currentStageId: app.current_stage_id,
    status: app.status,
    score: app.score,
    createdBy: app.created_by,
    createdAt: app.created_at,
    updatedAt: app.updated_at,
    candidate: candidate
      ? {
          id: candidate.id,
          fullName: candidate.full_name,
          email: candidate.email,
          currentTitle: candidate.current_title,
        }
      : null,
    job: job ? { id: job.id, title: job.title } : null,
    currentStage: stage
      ? { id: stage.id, name: stage.name, position: stage.position }
      : null,
  };
}

/**
 * GET /api/v1/applications
 * Lista candidaturas da organização. Segurança: jobs!inner filtra por org_id.
 * ⚠️ applications NÃO tem org_id direto — acesso sempre via jobs.org_id
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const stageId = searchParams.get('stageId');

    const supabase = getSupabase();

    let query = supabase
      .from('applications')
      .select(`
        id, job_id, candidate_id, current_stage_id, status, score, created_by, created_at, updated_at,
        candidates (id, full_name, email, current_title),
        jobs!inner (id, title, org_id),
        pipeline_stages (id, name, position)
      `)
      .eq('jobs.org_id', orgId)
      .order('updated_at', { ascending: false });

    if (jobId) query = query.eq('job_id', jobId);
    if (status) query = query.eq('status', status);
    if (stageId) query = query.eq('current_stage_id', stageId);

    const { data, error } = await query;

    if (error) {
      console.error('[applications] GET error:', error);
      return NextResponse.json({ error: 'Erro ao buscar candidaturas' }, { status: 500 });
    }

    return NextResponse.json((data || []).map(mapApplication));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/applications
 * Cria nova candidatura. Verifica que job e candidato pertencem à org.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const body = await request.json();
    const { jobId, candidateId } = body;

    if (!jobId || !candidateId) {
      return NextResponse.json({ error: 'jobId e candidateId são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verifica que a vaga pertence à org
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('org_id', orgId)
      .single();

    if (!job) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });

    // Verifica que o candidato pertence à org
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', candidateId)
      .eq('owner_org_id', orgId)
      .single();

    if (!candidate) return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 });

    // Verifica duplicidade
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single();

    if (existing) return NextResponse.json({ error: 'Candidato já candidatou a esta vaga' }, { status: 409 });

    // Primeira fase do pipeline (se houver)
    const { data: firstStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('job_id', jobId)
      .order('position', { ascending: true })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        current_stage_id: firstStage?.id || null,
        status: 'applied',
        created_by: user.id,
      })
      .select(`
        id, job_id, candidate_id, current_stage_id, status, score, created_by, created_at, updated_at,
        candidates (id, full_name, email, current_title),
        jobs!inner (id, title, org_id),
        pipeline_stages (id, name, position)
      `)
      .single();

    if (error) {
      console.error('[applications] POST error:', error);
      return NextResponse.json({ error: 'Erro ao criar candidatura' }, { status: 500 });
    }

    // Registra evento inicial
    await supabase.from('application_events').insert({
      application_id: data.id,
      to_stage_id: firstStage?.id || null,
      status: 'applied',
      actor_id: user.id,
    });

    return NextResponse.json(mapApplication(data), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
