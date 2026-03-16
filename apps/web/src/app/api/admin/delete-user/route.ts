import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const token = authHeader.replace('Bearer ', '');

    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 2. Verificar se o usuário autenticado é admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type')
      .eq('id', authUser.id)
      .single();

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado — apenas admins' }, { status: 403 });
    }

    // 3. Ler body
    const body = await request.json().catch(() => null);
    const userId = body?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // 4. Impedir auto-exclusão
    if (userId === authUser.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });
    }

    // 5. Limpar referências FK antes de deletar (evita constraint violations)
    await supabaseAdmin.rpc('admin_cleanup_user_references', { p_user_id: userId });

    // 6. Excluir usuário do Supabase Auth (trigger remove user_profiles em cascata)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[delete-user] Erro ao excluir:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 7. Registrar em audit_logs — schema real: (actor_id, action, resource, metadata)
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: authUser.id,
        action: 'user.deleted',
        resource: 'user',
        metadata: {
          deleted_user_id: userId,
          deleted_by: authUser.id,
        },
      })
      .then(({ error }) => {
        if (error) console.error('[delete-user] Audit log error:', error.message);
      });

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[delete-user] Erro inesperado:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
