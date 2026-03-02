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
 * GET /api/v1/organizations/:id
 * Busca uma organização por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    const orgId = request.headers.get('x-org-id');

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    // Validar acesso: usuário deve ser membro da org requisitada
    // OU a org deve ser filha de uma org da qual o usuário é membro
    const parentId = (data as any).parent_org_id;
    const checkOrgId = orgId || parentId || id;

    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', checkOrgId)
      .eq('user_id', user.id)
      .maybeSingle();

    // Permitir acesso se membro da org, da org pai, ou da própria org solicitada
    const hasMembershipViaParent = parentId && membership;
    const hasMembershipDirect = !parentId && membership;
    const { data: directMembership } = !hasMembershipViaParent && !hasMembershipDirect
      ? await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      : { data: membership };

    if (!membership && !directMembership) {
      return NextResponse.json({ error: 'Sem permissão para esta organização' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/organizations/:id
 * Atualiza uma organização
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    // Verificar que o usuário tem acesso (é membro ou membro da org pai)
    const { data: org } = await supabase
      .from('organizations')
      .select('id, parent_org_id')
      .eq('id', id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    // Verificar acesso: membro direto ou membro da org pai
    const checkOrgId = org.parent_org_id || org.id;
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', checkOrgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Campos permitidos
    const updateData: Record<string, unknown> = {};
    const allowed = ['name', 'cnpj', 'email', 'phone', 'website', 'address', 'city', 'state', 'industry', 'size'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updateData[key] = body[key] || null;
      }
    }

    const { data: updated, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar organização:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/organizations/:id
 * Remove uma organização
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    // Verificar que o usuário tem acesso à org pai
    const { data: org } = await supabase
      .from('organizations')
      .select('id, parent_org_id')
      .eq('id', id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const checkOrgId = org.parent_org_id || org.id;
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', checkOrgId)
      .eq('user_id', user.id)
      .in('role', ['admin'])
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Apenas admins podem excluir organizações' }, { status: 403 });
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir organização:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro interno:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
