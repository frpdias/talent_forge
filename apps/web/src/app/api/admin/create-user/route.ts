import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, userType, phone, company, position } = body;

    // Validações básicas
    if (!email || !password || !fullName || !userType) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, password, fullName, userType' },
        { status: 400 }
      );
    }

    if (!['admin', 'recruiter', 'candidate'].includes(userType)) {
      return NextResponse.json(
        { error: 'userType inválido. Use: admin, recruiter ou candidate' },
        { status: 400 }
      );
    }

    // Criar usuário no Supabase Auth com service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        full_name: fullName,
        user_type: userType,
        phone: phone || '',
        company: company || '',
        position: position || '',
      },
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      return NextResponse.json(
        { error: authError.message || 'Erro ao criar usuário no Auth' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Usuário não foi criado' },
        { status: 400 }
      );
    }

    // Criar perfil em user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        user_type: userType,
        phone: phone || null,
        company: company || null,
        position: position || null,
      });

    if (profileError) {
      console.error('⚠️ Erro ao criar perfil (mas usuário Auth criado):', profileError);
      // Não falha a request - o perfil pode ser criado depois pelo trigger
    }

    console.log('✅ Usuário criado:', {
      id: authData.user.id,
      email,
      userType,
    });

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
      userType,
    });
  } catch (error: any) {
    console.error('❌ Erro no endpoint create-user:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao criar usuário' },
      { status: 500 }
    );
  }
}
