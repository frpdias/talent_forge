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
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * GET /api/v1/organizations/[id]/channels
 * Lista canais de publicação configurados para a organização
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: orgId } = await params;
    const supabase = getSupabase();

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('job_publication_channels')
      .select('id, channel_code, display_name, is_active, config, last_sync_at, created_at, updated_at')
      .eq('org_id', orgId)
      .order('channel_code');

    // Credenciais NUNCA são devolvidas ao cliente
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/v1/organizations/[id]/channels
 * Configura (ou atualiza) um canal de publicação para a organização
 * Body: { channel_code, display_name, credentials, config }
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
    const { channel_code, display_name, credentials, config } = body;

    if (!channel_code || !display_name) {
      return NextResponse.json({ error: 'channel_code e display_name são obrigatórios' }, { status: 400 });
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

    const { data, error } = await supabase
      .from('job_publication_channels')
      .upsert({
        org_id: orgId,
        channel_code,
        display_name,
        credentials: credentials || {},
        config: config || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,channel_code' })
      .select('id, channel_code, display_name, is_active, config, created_at, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/organizations/[id]/channels
 * Ativa/desativa canal ou atualiza config (por channel_code no body)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id: orgId } = await params;
    const body = await request.json();
    const { channel_id, is_active, config, display_name } = body;

    if (!channel_id) {
      return NextResponse.json({ error: 'channel_id é obrigatório' }, { status: 400 });
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

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) updates.is_active = is_active;
    if (config !== undefined) updates.config = config;
    if (display_name !== undefined) updates.display_name = display_name;

    const { data, error } = await supabase
      .from('job_publication_channels')
      .update(updates)
      .eq('id', channel_id)
      .eq('org_id', orgId)
      .select('id, channel_code, display_name, is_active, config, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
