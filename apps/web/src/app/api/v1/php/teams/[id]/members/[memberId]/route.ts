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

type Params = { params: Promise<{ id: string; memberId: string }> };

/**
 * DELETE /api/v1/php/teams/:id/members/:memberId
 * Remove um membro do time. memberId = team_members.id (UUID)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId, memberId } = await params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId);

    if (error) {
      return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
    }

    // Atualiza member_count
    const { count } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId);

    if (count !== null) {
      await supabase.from('teams').update({ member_count: count }).eq('id', teamId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/php/teams/:id/members/:memberId/role
 * Atualiza o papel de um membro no time
 * Query: ?role=member|lead|coordinator
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const orgId = request.headers.get('x-org-id');
    if (!orgId) return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });

    const { id: teamId, memberId } = await params;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role || !['member', 'lead', 'coordinator'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido. Use: member, lead ou coordinator' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('team_members')
      .update({ role_in_team: role })
      .eq('id', memberId)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar papel' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
