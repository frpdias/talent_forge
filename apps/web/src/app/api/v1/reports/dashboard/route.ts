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
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * GET /api/v1/reports/dashboard
 * Estatísticas do dashboard: vagas, candidatos, aplicações, avaliações, atividade recente
 * Headers: Authorization: Bearer <JWT>, x-org-id: <UUID>
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verificar que o usuário é membro da org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Sem permissão para esta organização' },
        { status: 403 },
      );
    }

    // Buscar contagens em paralelo
    const [jobsResult, candidatesResult, applicationsResult, assessmentsResult] =
      await Promise.all([
        supabase
          .from('jobs')
          .select('id, status', { count: 'exact', head: false })
          .eq('org_id', orgId),
        supabase
          .from('candidates')
          .select('id', { count: 'exact', head: true })
          .eq('owner_org_id', orgId),
        supabase
          .from('applications')
          .select('id, jobs!inner(org_id)', { count: 'exact', head: true })
          .eq('jobs.org_id', orgId),
        supabase
          .from('assessments')
          .select('id, candidates!inner(owner_org_id)', {
            count: 'exact',
            head: true,
          })
          .eq('candidates.owner_org_id', orgId),
      ]);

    const jobs = jobsResult.data || [];
    const totalJobs = jobsResult.count ?? jobs.length;
    const openJobs = jobs.filter(
      (j: any) => j.status === 'open' || j.status === 'on_hold',
    ).length;

    // Atividade recente: últimas 5 aplicações
    const { data: recentApplications } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        created_at,
        candidates (full_name),
        jobs!inner (title, org_id)
      `,
      )
      .eq('jobs.org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fontes de candidatos
    const { data: candidateSources } = await supabase
      .from('candidates')
      .select('source')
      .eq('owner_org_id', orgId);

    const sourceCounts = (candidateSources || []).reduce<Record<string, number>>(
      (acc: Record<string, number>, item: any) => {
        const name = (item?.source || 'Não informado').trim();
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      },
      {},
    );

    const sources = Object.entries(sourceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      data: {
        stats: {
          totalJobs,
          activeJobs: openJobs,
          openJobs,
          totalCandidates: candidatesResult.count ?? 0,
          totalApplications: applicationsResult.count ?? 0,
          totalAssessments: assessmentsResult.count ?? 0,
          pendingApplications: 0,
          completedAssessments: assessmentsResult.count ?? 0,
        },
        sources,
        recentActivity: (recentApplications || []).map((app: any) => ({
          id: app.id,
          type: 'application',
          candidateName: app.candidates?.full_name,
          jobTitle: app.jobs?.title,
          status: app.status,
          createdAt: app.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Erro no reports/dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
