import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/v1/invite-links/[token]
 * Valida um token de convite e retorna info da org.
 * Rota pública — não exige autenticação.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('candidate_invite_links')
      .select('id, org_id, token, expires_at, max_uses, uses_count, is_active, organizations(id, name)')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });
    }

    if (!data.is_active) {
      return NextResponse.json({ valid: false, reason: 'inactive' });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    const maxUses = data.max_uses ?? 1;
    if (data.uses_count >= maxUses) {
      return NextResponse.json({ valid: false, reason: 'max_uses' });
    }

    const org = Array.isArray(data.organizations)
      ? data.organizations[0]
      : data.organizations;

    return NextResponse.json({
      valid: true,
      orgId: data.org_id,
      orgName: (org as any)?.name || null,
      expiresAt: data.expires_at,
      maxUses: data.max_uses,
      usesCount: data.uses_count,
      token: data.token,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
