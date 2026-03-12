import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getCallerAndOrg(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const orgId = request.headers.get('x-org-id');
  if (!authHeader || !orgId) return null;

  const supabase = getAdminClient();
  const { data: { user } } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .neq('status', 'inactive')
    .maybeSingle();

  return { user, orgId, role: membership?.role ?? null, supabase };
}

/**
 * PATCH /api/v1/team/members/[memberId]
 * Atualiza a função (role) de um membro na organização.
 * Headers: Authorization: Bearer <JWT>, x-org-id: <UUID>
 * Body: { role: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const ctx = await getCallerAndOrg(request);
    if (!ctx) {
      return NextResponse.json({ error: 'Não autenticado ou sem x-org-id' }, { status: 401 });
    }

    const { orgId, role: callerRole, supabase } = ctx;
    const { memberId } = await params;

    if (!callerRole || !['owner', 'admin', 'manager'].includes(callerRole)) {
      return NextResponse.json({ error: 'Sem permissão para editar membros' }, { status: 403 });
    }

    const body = await request.json();
    const { role: newRole } = body as { role: string };

    const allowedRoles = ['admin', 'manager', 'recruiter', 'viewer'];
    if (!newRole || !allowedRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('org_members')
      .update({ role: newRole })
      .eq('org_id', orgId)
      .eq('user_id', memberId);

    if (error) throw error;

    // Sincroniza user_profiles.user_type para os roles mapeáveis
    const profileType =
      newRole === 'admin' ? 'admin'
      : newRole === 'manager' ? 'recruiter'
      : newRole === 'recruiter' ? 'recruiter'
      : null;

    if (profileType) {
      await supabase
        .from('user_profiles')
        .update({ user_type: profileType })
        .eq('id', memberId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[team/members/[memberId]] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/team/members/[memberId]
 * Remove (inativa) um membro da organização.
 * Headers: Authorization: Bearer <JWT>, x-org-id: <UUID>
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const ctx = await getCallerAndOrg(request);
    if (!ctx) {
      return NextResponse.json({ error: 'Não autenticado ou sem x-org-id' }, { status: 401 });
    }

    const { user, orgId, role: callerRole, supabase } = ctx;
    const { memberId } = await params;

    if (!callerRole || !['owner', 'admin', 'manager'].includes(callerRole)) {
      return NextResponse.json({ error: 'Sem permissão para remover membros' }, { status: 403 });
    }

    // Impede auto-remoção
    if (user.id === memberId) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 });
    }

    const { error } = await supabase
      .from('org_members')
      .update({ status: 'inactive' })
      .eq('org_id', orgId)
      .eq('user_id', memberId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[team/members/[memberId]] DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
