import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getServiceSupabase } from '@/lib/api/auth';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name');

  if (error) return NextResponse.json({ error: 'Erro ao buscar organizações' }, { status: 500 });

  return NextResponse.json({ organizations: data ?? [] });
}
