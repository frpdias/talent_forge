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
 * POST /api/v1/invite-links/[token]/register
 * Registra um candidato a partir de um convite.
 * Rota pública — o candidato ainda não tem conta.
 *
 * Body: { fullName: string, email: string, password: string }
 *
 * Fluxo:
 * 1. Valida o token → obtém org_id e created_by (headhunter)
 * 2. Cria auth user (email_confirm: true) → trigger cria user_profiles automaticamente
 * 3. Cria candidates com owner_org_id = org do headhunter → isolamento garante que
 *    somente o headhunter dono do convite vê este candidato
 * 4. Incrementa uses_count e desativa o link se atingiu max_uses
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { fullName, email, password } = body as {
      fullName: string;
      email: string;
      password: string;
    };

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'fullName, email e password são obrigatórios' },
        { status: 400 },
      );
    }

    const supabase = getAdminClient();

    // 1. Busca e valida o token
    const { data: linkData, error: linkError } = await supabase
      .from('candidate_invite_links')
      .select('id, org_id, created_by, token, expires_at, max_uses, uses_count, is_active')
      .eq('token', token)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    if (!linkData.is_active) {
      return NextResponse.json({ error: 'Este convite não está mais ativo' }, { status: 400 });
    }

    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este convite expirou' }, { status: 400 });
    }

    const maxUses = linkData.max_uses ?? 1;
    if (linkData.uses_count >= maxUses) {
      return NextResponse.json({ error: 'Este convite já foi utilizado' }, { status: 400 });
    }

    // 2. Cria o auth user — o trigger on_auth_user_created cria user_profiles automaticamente
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        user_type: 'candidate',
        full_name: fullName.trim(),
      },
    });

    if (authError || !authData?.user) {
      const msg = authError?.message || 'Erro ao criar conta';
      // Erro de e-mail duplicado
      if (msg.includes('already been registered') || msg.includes('already exists')) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado. Faça login.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 3. Cria o candidato com owner_org_id = org do headhunter que gerou o convite
    //    Isso garante isolamento: só o headhunter dono do convite vê este candidato
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        owner_org_id: linkData.org_id,
        user_id: authData.user.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        created_by: linkData.created_by,
      })
      .select('id, owner_org_id, full_name, email, created_at')
      .single();

    if (candidateError) {
      // Rollback: remove o auth user criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: candidateError.message }, { status: 500 });
    }

    // 4. Incrementa uses_count e desativa se atingiu o limite
    const newCount = (linkData.uses_count || 0) + 1;
    const shouldDeactivate = newCount >= maxUses;
    await supabase
      .from('candidate_invite_links')
      .update({
        uses_count: newCount,
        is_active: shouldDeactivate ? false : true,
      })
      .eq('id', linkData.id);

    return NextResponse.json({
      id: candidate.id,
      userId: authData.user.id,
      orgId: candidate.owner_org_id,
      fullName: candidate.full_name,
      email: candidate.email,
      createdAt: candidate.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
