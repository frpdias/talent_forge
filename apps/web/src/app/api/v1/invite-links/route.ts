import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

/**
 * POST /api/v1/invite-links
 * Cria um link de convite para candidato.
 * Headers: Authorization: Bearer <JWT>, x-org-id: <UUID>
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Verificar que o usuário é membro com permissão
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership || !['owner', 'admin', 'manager', 'recruiter'].includes(membership.role)) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('candidate_invite_links')
      .insert({
        org_id: orgId,
        created_by: user.id,
        token,
        expires_at: expiresAt,
        max_uses: 1,
      })
      .select('id, org_id, token, expires_at, max_uses, uses_count, is_active')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      orgId: data.org_id,
      token: data.token,
      expiresAt: data.expires_at,
      maxUses: data.max_uses,
      usesCount: data.uses_count,
      isActive: data.is_active,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
