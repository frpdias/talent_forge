import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verificar se o usuário autenticado é admin
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type')
      .eq('id', authUser.id)
      .single();

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado — apenas admins' }, { status: 403 });
    }

    let userId: string;
    try {
      const body = await request.json();
      userId = body?.userId;
    } catch {
      return NextResponse.json({ error: 'Body inválido ou ausente' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Impedir que o admin se exclua
    if (userId === authUser.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });
    }

    // Excluir o usuário do Supabase Auth (cascata remove user_profiles via trigger)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[delete-user] Erro ao excluir usuário:', error.message, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Registrar em audit_logs (DA obrigatório: todas ações críticas)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: authUser.id,
        action: 'user.deleted',
        resource: 'user',
        metadata: {
          deleted_user_id: userId,
          deleted_by: authUser.id,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        },
      });
    } catch (auditError) {
      console.error('Erro ao registrar em audit_logs:', auditError);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[delete-user] Erro inesperado:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
