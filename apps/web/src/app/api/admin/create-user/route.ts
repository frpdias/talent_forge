import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Gera uma senha aleatória segura de 12 caracteres URL-safe.
 * Ex: "aB3x9Kp2mQwZ"
 */
function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString('base64url').slice(0, 12);
}

/**
 * Envia e-mail de boas-vindas via Brevo Transactional Email API.
 * Usa BREVO_SMTP_PASS como API key (o mesmo valor configurado no NestJS/email.module).
 */
async function sendWelcomeEmail(params: {
  email: string;
  fullName: string;
  password: string;
  userType: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.BREVO_SMTP_PASS;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@talentforge.com.br';
  const senderName = process.env.BREVO_SENDER_NAME || 'TalentForge';

  if (!apiKey) {
    return { sent: false, error: 'BREVO_SMTP_PASS não configurada' };
  }

  const userTypeLabel: Record<string, string> = {
    admin: 'Administrador',
    recruiter: 'Recrutador',
    candidate: 'Candidato',
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#141042;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">TalentForge</h1>
            <p style="margin:4px 0 0;color:#a5b4fc;font-size:13px;">Plataforma de Recrutamento e Gestão de Talentos</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#141042;font-size:20px;">Bem-vindo(a), ${params.fullName}! 👋</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;">Sua conta foi criada com sucesso no TalentForge como <strong>${userTypeLabel[params.userType] || params.userType}</strong>.</p>

            <!-- Credentials box -->
            <div style="background:#f8f8f6;border:1px solid #e0e0d8;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;color:#141042;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Suas credenciais de acesso</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="padding:6px 0;color:#666;font-size:14px;width:80px;">E-mail:</td>
                  <td style="padding:6px 0;color:#141042;font-size:14px;font-weight:600;">${params.email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#666;font-size:14px;">Senha:</td>
                  <td style="padding:6px 0;">
                    <span style="background:#141042;color:#ffffff;font-family:monospace;font-size:15px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:1px;">${params.password}</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="margin:0 0 8px;color:#555;font-size:14px;">⚡ Recomendamos que você <strong>altere sua senha</strong> após o primeiro acesso nas configurações da conta.</p>

            <div style="margin:24px 0;">
              <a href="https://web-eight-rho-84.vercel.app/login" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Acessar o TalentForge →</a>
            </div>

            <p style="margin:0;color:#999;font-size:12px;">Se você não esperava este e-mail entre em contato com o administrador do sistema.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f6;padding:16px 32px;border-top:1px solid #e0e0d8;">
            <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} TalentForge — Este é um e-mail automático, não responda.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: params.email, name: params.fullName }],
        subject: `Bem-vindo ao TalentForge — suas credenciais de acesso`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { sent: false, error: `Brevo API ${res.status}: ${errBody}` };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err.message };
  }
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (authUser.user_metadata?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

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
    const { email, fullName, userType, phone, company, position } = body;

    // Gerar senha aleatória segura (admin não informa mais a senha)
    const password = generateSecurePassword();

    // Validações básicas
    if (!email || !fullName || !userType) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, fullName, userType' },
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
    }

    // Enviar e-mail de boas-vindas com as credenciais geradas
    const emailResult = await sendWelcomeEmail({
      email,
      fullName,
      password,
      userType,
    });

    if (!emailResult.sent) {
      console.warn('⚠️ E-mail de boas-vindas não enviado:', emailResult.error);
    } else {
      console.log('✅ E-mail de boas-vindas enviado para:', email);
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
      userType,
      emailSent: emailResult.sent,
      // Retorna senha temporária APENAS se o e-mail não foi enviado,
      // para que o admin possa compartilhá-la manualmente.
      ...(emailResult.sent ? {} : { tempPassword: password }),
    });
  } catch (error: any) {
    console.error('❌ Erro no endpoint create-user:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao criar usuário' },
      { status: 500 }
    );
  }
}
