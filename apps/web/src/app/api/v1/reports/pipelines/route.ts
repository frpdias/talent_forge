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
 * GET /api/v1/reports/pipelines?jobId=<UUID>
 * Relatório de pipeline por vaga (ou todas as vagas da org)
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

    // Validar membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    let query = supabase
      .from('jobs')
      .select(
        `id, title, status, created_at,
         pipeline_stages (id, name, position),
         applications (id, current_stage_id, status, created_at, updated_at)`,
      )
      .eq('org_id', orgId);

    if (jobId) {
      query = query.eq('id', jobId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Erro ao buscar jobs para pipeline:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(jobId ? null : []);
    }

    const reports = (jobs as any[]).map((job) => {
      const stages = ((job.pipeline_stages as any[]) || []).sort(
        (a: any, b: any) => a.position - b.position,
      );
      const applications: any[] = job.applications || [];

      const stageStats = stages.map((stage: any) => {
        const stageApps = applications.filter(
          (app) => app.current_stage_id === stage.id,
        );
        return {
          stageId: stage.id,
          stageName: stage.name,
          position: stage.position,
          count: stageApps.length,
          percentage:
            applications.length > 0
              ? Math.round((stageApps.length / applications.length) * 100)
              : 0,
        };
      });

      const conversions = stageStats.slice(0, -1).map((stage: any, idx: number) => {
        const nextStage = stageStats[idx + 1];
        if (!nextStage || stage.count === 0) return 0;
        return Math.round((nextStage.count / stage.count) * 100);
      });

      const statusCounts = {
        applied: applications.filter((a) => a.status === 'applied').length,
        in_process: applications.filter((a) => a.status === 'in_process').length,
        hired: applications.filter((a) => a.status === 'hired').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
      };

      const avgDays =
        applications.length > 0
          ? Math.round(
              applications.reduce((sum, app) => {
                const created = new Date(app.created_at);
                const updated = new Date(app.updated_at);
                return (
                  sum +
                  (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
                );
              }, 0) / applications.length,
            )
          : 0;

      return {
        jobId: job.id,
        jobTitle: job.title,
        jobStatus: job.status,
        totalApplications: applications.length,
        stages: stageStats,
        conversions,
        statusDistribution: statusCounts,
        averageDaysInPipeline: avgDays,
        hireRate:
          applications.length > 0
            ? Math.round((statusCounts.hired / applications.length) * 100)
            : 0,
      };
    });

    return NextResponse.json(jobId ? reports[0] : reports);
  } catch (error: any) {
    console.error('Erro no reports/pipelines:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
