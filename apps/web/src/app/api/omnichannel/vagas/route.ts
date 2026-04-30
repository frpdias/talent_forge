import { NextRequest, NextResponse } from 'next/server';
import { validateOmnichannelRequest, checkPermission } from '@/lib/api/omnichannel-auth';
import { getServiceSupabase } from '@/lib/api/auth';

const STATUS_MAP: Record<string, string> = {
  aberta: 'open',
  pausada: 'on_hold',
  encerrada: 'closed',
};

export async function GET(request: NextRequest) {
  const auth = await validateOmnichannelRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!checkPermission(auth.context.role, 'GET /vagas')) {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  }

  const { orgId } = auth.context;
  const { searchParams } = new URL(request.url);
  const area = searchParams.get('area');
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

  const supabase = getServiceSupabase();
  let query = supabase
    .from('jobs')
    .select('id, title, location, employment_type, seniority, status, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (area) query = query.ilike('title', `%${area}%`);
  if (status && STATUS_MAP[status]) query = query.eq('status', STATUS_MAP[status]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erro ao buscar vagas' }, { status: 500 });

  return NextResponse.json({ vagas: data ?? [], total: (data ?? []).length });
}
