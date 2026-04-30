import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase } from '@/lib/api/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const orgId = request.headers.get('x-org-id');
  if (!orgId) return NextResponse.json({ error: 'x-org-id obrigatório' }, { status: 400 });

  const { id } = await params;
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from('omnichannel_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: 'Erro ao revogar token' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
