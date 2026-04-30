import { NextRequest, NextResponse } from 'next/server';
import { validateOmnichannelRequest, checkPermission } from '@/lib/api/omnichannel-auth';
import { getServiceSupabase } from '@/lib/api/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const auth = await validateOmnichannelRequest(request);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!checkPermission(auth.context.role, 'GET /candidatos/busca')) {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  }

  const nomeOuId = new URL(request.url).searchParams.get('nome_ou_id');
  if (!nomeOuId) {
    return NextResponse.json({ error: 'Parâmetro nome_ou_id é obrigatório' }, { status: 400 });
  }

  const { orgId } = auth.context;
  const supabase = getServiceSupabase();

  let query = supabase
    .from('candidates')
    .select(`
      id, full_name, email, phone, current_title,
      applications(id, status, job_id, jobs(id, title, status))
    `)
    .eq('owner_org_id', orgId)
    .limit(10);

  if (UUID_REGEX.test(nomeOuId)) {
    query = query.eq('id', nomeOuId);
  } else {
    query = query.ilike('full_name', `%${nomeOuId}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erro ao buscar candidatos' }, { status: 500 });

  return NextResponse.json({ candidatos: data ?? [], total: (data ?? []).length });
}
