import { NextRequest, NextResponse } from 'next/server';
import { validateOmnichannelRequest, checkPermission } from '@/lib/api/omnichannel-auth';
import { getServiceSupabase } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const auth = await validateOmnichannelRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!checkPermission(auth.context.role, 'GET /relatorios/funil')) {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  }

  const { orgId } = auth.context;
  const vagaId = new URL(request.url).searchParams.get('vaga_id');
  const supabase = getServiceSupabase();

  let query = supabase
    .from('applications')
    .select('status, pipeline_stages(name, position), jobs!inner(org_id)')
    .eq('jobs.org_id', orgId);

  if (vagaId) query = query.eq('job_id', vagaId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erro ao buscar funil' }, { status: 500 });

  const stageCounts: Record<string, number> = {};
  for (const app of data ?? []) {
    const key = (app.pipeline_stages as { name: string } | null)?.name ?? app.status;
    stageCounts[key] = (stageCounts[key] ?? 0) + 1;
  }

  const por_etapa = Object.entries(stageCounts)
    .map(([etapa, count]) => ({ etapa, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ total: (data ?? []).length, por_etapa });
}
