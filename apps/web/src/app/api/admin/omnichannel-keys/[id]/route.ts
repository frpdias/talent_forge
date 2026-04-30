import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase } from '@/lib/api/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from('omnichannel_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Erro ao revogar token' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
