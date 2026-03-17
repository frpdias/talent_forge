import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/register
 *
 * Cria usuário via service_role com email_confirm: true (sem necessidade de SMTP).
 * Depois assina com signInWithPassword e retorna a sessão ao cliente.
 *
 * Motivo: Supabase free SMTP tem limite de 3 e-mails/hora e falha em produção.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, userType } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Cria usuário já confirmado — sem envio de e-mail
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        user_type: userType ?? 'candidate',
      },
    });

    if (createError) {
      // Trata caso de e-mail já cadastrado de forma amigável
      if (
        createError.message.toLowerCase().includes('already registered') ||
        createError.message.toLowerCase().includes('already been registered') ||
        createError.message.toLowerCase().includes('duplicate')
      ) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado. Tente fazer login.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!createData.user) {
      return NextResponse.json({ error: 'Usuário não foi criado.' }, { status: 500 });
    }

    // Autentica imediatamente para retornar sessão ao cliente
    const supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError || !signInData.session) {
      // Usuário criado mas sem sessão — redireciona para login
      return NextResponse.json({ created: true, session: null });
    }

    return NextResponse.json({
      created: true,
      session: signInData.session,
      userType: userType ?? 'candidate',
    });
  } catch (err: any) {
    console.error('[api/auth/register] Unexpected error:', err);
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 });
  }
}
