import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const orgId = request.headers.get('x-org-id');
  if (!orgId) return NextResponse.json({ error: 'x-org-id obrigatório' }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('omnichannel_api_keys')
    .select('id, label, api_key, created_at, revoked_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Erro ao buscar tokens' }, { status: 500 });

  const tokens = (data ?? []).map(({ api_key, ...rest }) => ({
    ...rest,
    api_key_prefix: api_key.substring(0, 8) + '...',
  }));

  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const orgId = request.headers.get('x-org-id');
  if (!orgId) return NextResponse.json({ error: 'x-org-id obrigatório' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const label = (body.label as string) || 'Token OmniChannel';

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('omnichannel_api_keys')
    .insert({ org_id: orgId, label })
    .select('id, api_key, label, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Erro ao criar token' }, { status: 500 });

  return NextResponse.json({ token: data }, { status: 201 });
}
