import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ChannelCredentials } from '@/lib/publisher/types';
import { testGupyCredentials } from '@/lib/publisher/gupy';
import { testVagasCredentials } from '@/lib/publisher/vagas';
import { testMetaCredentials } from '@/lib/publisher/meta';

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

/**
 * POST /api/v1/organizations/[id]/channels/test
 * Testa as credenciais de um canal sem publicar nada.
 * Body: { channel_code: string, credentials: ChannelCredentials }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: orgId } = await params;
    const body = await request.json();
    const { channel_code, credentials } = body as {
      channel_code: string;
      credentials: ChannelCredentials;
    };

    if (!channel_code || !credentials) {
      return NextResponse.json({ error: 'channel_code e credentials são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership || !['admin', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
    }

    let result: { ok: boolean; message: string };

    switch (channel_code) {
      case 'gupy':
        result = await testGupyCredentials(credentials);
        break;
      case 'vagas':
        result = await testVagasCredentials(credentials);
        break;
      case 'facebook':
      case 'instagram':
        result = await testMetaCredentials(credentials);
        break;
      default:
        result = { ok: false, message: `Canal '${channel_code}' ainda não suportado para teste` };
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
