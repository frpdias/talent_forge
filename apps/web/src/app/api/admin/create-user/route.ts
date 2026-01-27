import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

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

    if (userType === 'recruiter') {
      const orgNameBase = company || fullName || email;
      const orgName = `${orgNameBase} - ${authData.user.id.slice(0, 8)}`;

      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
          name: orgName,
          org_type: 'headhunter',
          status: 'active',
          email,
          phone: phone || null,
          website: company ? null : null,
        })
        .select()
        .single();

      if (orgError) {
        console.error('❌ Erro ao criar organização do recrutador:', orgError);
        // Retornar erro para evitar recruiter sem organização
        return NextResponse.json(
          { 
            error: 'Erro ao criar organização do recrutador',
            details: orgError.message 
          },
          { status: 500 }
        );
      }

      if (!org?.id) {
        console.error('❌ Organização não foi criada para o recrutador');
        return NextResponse.json(
          { error: 'Organização não foi criada' },
          { status: 500 }
        );
      }

      const { error: memberError } = await supabaseAdmin
        .from('org_members')
        .insert({
          org_id: org.id,
          user_id: authData.user.id,
          role: 'admin',
          status: 'active',
        });

      if (memberError) {
        console.error('❌ Erro ao vincular recrutador à organização:', memberError);
        // Retornar erro crítico
        return NextResponse.json(
          { 
            error: 'Erro ao vincular recrutador à organização',
            details: memberError.message,
            warning: 'Usuário criado mas sem organização - necessário correção manual'
          },
          { status: 500 }
        );
      }

      console.log('✅ Organização criada e recruiter vinculado:', {
        org_id: org.id,
        org_name: org.name,
        user_id: authData.user.id
      });
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
