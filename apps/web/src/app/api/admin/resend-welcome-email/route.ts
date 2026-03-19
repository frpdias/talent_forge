import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

function generateSecurePassword(): string {
  return crypto.randomBytes(16).toString('base64url').slice(0, 12);
}

/**
 * Envia e-mail de credenciais redefinidas via SMTP (Brevo relay).
 * Usa nodemailer com BREVO_SMTP_* env vars.
 */
async function sendWelcomeEmail(params: {
  email: string;
  fullName: string;
  password: string;
  userType: string;
}): Promise<{ sent: boolean; error?: string; messageId?: string }> {
  const smtpHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587');
  const smtpUser = process.env.BREVO_SMTP_USER;
  const smtpPass = process.env.BREVO_SMTP_PASS;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@talentforge.com.br';
  const senderName = process.env.BREVO_SENDER_NAME || 'TalentForge';
  const replyToEmail = process.env.BREVO_REPLY_TO || senderEmail;

  if (!smtpUser || !smtpPass) {
    return { sent: false, error: 'BREVO_SMTP_USER ou BREVO_SMTP_PASS não configurados' };
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
        <tr>
          <td style="background:#141042;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">TalentForge</h1>
            <p style="margin:4px 0 0;color:#a5b4fc;font-size:13px;">Plataforma de Recrutamento e Gestão de Talentos</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;color:#141042;font-size:20px;">Suas novas credenciais de acesso 🔐</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;">Olá, <strong>${params.fullName}</strong>! Suas credenciais foram redefinidas por um administrador. Abaixo estão seus novos dados de acesso como <strong>${userTypeLabel[params.userType] || params.userType}</strong>.</p>
            <div style="background:#f8f8f6;border:1px solid #e0e0d8;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;color:#141042;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Credenciais de acesso</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="padding:6px 0;color:#666;font-size:14px;width:80px;">E-mail:</td>
                  <td style="padding:6px 0;color:#141042;font-size:14px;font-weight:600;">${params.email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#666;font-size:14px;">Nova senha:</td>
                  <td style="padding:6px 0;">
                    <span style="background:#141042;color:#ffffff;font-family:monospace;font-size:15px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:1px;">${params.password}</span>
                  </td>
                </tr>
              </table>
            </div>
            <p style="margin:0 0 8px;color:#555;font-size:14px;">⚡ Recomendamos que você <strong>altere sua senha</strong> após o acesso nas configurações da conta.</p>
            <div style="margin:24px 0;">
              <a href="https://talentforge.com.br/login" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">Acessar o TalentForge →</a>
            </div>
            <p style="margin:0;color:#999;font-size:12px;">Se você não solicitou esta redefinição, por favor contate o administrador.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f6;padding:16px 32px;border-top:1px solid #e0e0d8;">
            <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} TalentForge · Fartech Soluções em Tecnologia · talentforge.com.br</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      replyTo: replyToEmail,
      to: params.email,
      subject: 'TalentForge — novas credenciais de acesso',
      html: htmlContent,
      text: `Olá, ${params.fullName}!\n\nSuas credenciais foram redefinidas no TalentForge.\n\nCredenciais:\nE-mail: ${params.email}\nNova senha: ${params.password}\n\nAcesse: https://talentforge.com.br/login\n\nRecomendamos alterar sua senha após o acesso.\n\nEquipe TalentForge`,
    });

    console.log('✅ E-mail enviado via SMTP:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ SMTP error:', err.message);
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

    const body = await request.json();
    const { userId, email, fullName, userType } = body;

    if (!userId || !email || !fullName || !userType) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, email, fullName, userType' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Gera nova senha e atualiza no Auth
    const newPassword = generateSecurePassword();
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao redefinir senha: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Envia o e-mail com as novas credenciais
    const emailResult = await sendWelcomeEmail({ email, fullName, password: newPassword, userType });

    if (!emailResult.sent) {
      console.warn('⚠️ E-mail de reenvio não enviado:', emailResult.error);
      return NextResponse.json({
        success: true,
        emailSent: false,
        tempPassword: newPassword,
        error: emailResult.error,
      });
    }

    console.log('✅ E-mail de credenciais reenviado para:', email);
    return NextResponse.json({ success: true, emailSent: true });
  } catch (error: any) {
    console.error('❌ Erro no endpoint resend-welcome-email:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
