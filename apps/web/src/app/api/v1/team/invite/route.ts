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
 * POST /api/v1/team/invite
 * Convida um usuário existente para a organização.
 * Headers: Authorization: Bearer <JWT>, x-org-id: <UUID>
 * Body: { email: string, role: string }
 *
 * Fluxo:
 *  1. Valida que o solicitante é admin/manager da org
 *  2. Busca o usuário pelo email em user_profiles
 *  3. Verifica se já é membro ativo
 *  4. Insere em org_members (ou reativa se estava inativo)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'x-org-id é obrigatório' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Valida sessão
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Solicitante deve ser admin ou manager da org
    const { data: requesterMembership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .neq('status', 'inactive')
      .maybeSingle();

    if (
      !requesterMembership ||
      !['owner', 'admin', 'manager'].includes(requesterMembership.role)
    ) {
      return NextResponse.json(
        { error: 'Sem permissão para convidar membros nesta organização' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body as { email: string; role: string };

    if (!email || !role) {
      return NextResponse.json({ error: 'email e role são obrigatórios' }, { status: 400 });
    }

    const allowedRoles = ['admin', 'manager', 'recruiter', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
    }

    // Busca usuário pelo email
    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('id, full_name, user_type')
      .eq('email', email)
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json(
        {
          error:
            'Usuário não encontrado. O usuário precisa criar uma conta no TalentForge antes de ser adicionado à equipe.',
        },
        { status: 404 }
      );
    }

    // Verifica se já é membro ativo
    const { data: existingMember } = await supabase
      .from('org_members')
      .select('id, status')
      .eq('org_id', orgId)
      .eq('user_id', targetProfile.id)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status !== 'inactive') {
        return NextResponse.json(
          { error: 'Este usuário já é membro ativo da organização.' },
          { status: 409 }
        );
      }

      // Reativa membro inativo
      await supabase
        .from('org_members')
        .update({ status: 'active', role })
        .eq('id', existingMember.id);
    } else {
      // Adiciona novo membro
      const { error: insertError } = await supabase.from('org_members').insert({
        org_id: orgId,
        user_id: targetProfile.id,
        role,
        status: 'active',
      });

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      member: {
        id: targetProfile.id,
        full_name: targetProfile.full_name,
        email,
        role,
      },
    });
  } catch (error: any) {
    console.error('[team/invite] POST error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
