import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

const TEMPLATES: Record<string, { subject: string; html: (to: string) => string }> = {
  confirmacao_cadastro: {
    subject: '✅ Confirme seu cadastro no TalentForge',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Confirme seu cadastro</h2>
          <p style="color:#444;line-height:1.6;">Olá! Para ativar sua conta no TalentForge, clique no botão abaixo:</p>
          <a href="#" style="display:inline-block;background:#10B981;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Confirmar email
          </a>
          <p style="color:#999;font-size:13px;margin-top:32px;">Se você não criou uma conta, ignore este email.</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  boas_vindas_candidato: {
    subject: '🎉 Bem-vindo ao TalentForge!',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Bem-vindo(a) ao TalentForge! 🎉</h2>
          <p style="color:#444;line-height:1.6;">Sua conta foi criada com sucesso. Agora você pode explorar vagas e candidatar-se às oportunidades das melhores empresas.</p>
          <a href="#" style="display:inline-block;background:#141042;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Ver vagas disponíveis
          </a>
          <p style="color:#999;font-size:13px;margin-top:32px;">Qualquer dúvida, entre em contato conosco.</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  boas_vindas_recrutador: {
    subject: '🚀 Sua conta de recrutador está pronta!',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Sua conta de recrutador está pronta! 🚀</h2>
          <p style="color:#444;line-height:1.6;">Bem-vindo(a) ao painel de recrutamento. Você já pode publicar vagas, gerenciar candidatos e acompanhar o pipeline de seleção.</p>
          <a href="#" style="display:inline-block;background:#3B82F6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Acessar painel
          </a>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  redefinir_senha: {
    subject: '🔐 Redefinição de senha — TalentForge',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Redefinição de senha</h2>
          <p style="color:#444;line-height:1.6;">Recebemos uma solicitação para redefinir a senha da conta associada a este email. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="#" style="display:inline-block;background:#EF4444;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Redefinir senha
          </a>
          <p style="color:#999;font-size:13px;margin-top:8px;">Este link expira em <strong>24 horas</strong>. Se você não solicitou a redefinição, ignore este email.</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  candidatura_em_documentacao: {
    subject: '📂 Parabéns! Você avançou para a fase de documentação',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">🎉 Você avançou no processo seletivo!</h2>
          <p style="color:#444;line-height:1.6;">Sua candidatura para a vaga <strong>Analista de RH</strong> foi aprovada e você está na fase de <span style="color:#7C3AED;font-weight:600;">Documentação</span>.</p>
          <p style="color:#444;line-height:1.6;">Por favor, acesse o portal e envie os documentos solicitados para prosseguir com a contratação.</p>
          <a href="#" style="display:inline-block;background:#7C3AED;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Enviar documentos
          </a>
          <p style="color:#999;font-size:13px;margin-top:8px;">Envie os documentos o quanto antes para não atrasar sua contratação.</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  candidatura_aprovada: {
    subject: '🏆 Parabéns! Você foi selecionado(a)!',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <span style="font-size:28px;">🏆</span>
            <strong style="color:#065F46;font-size:18px;display:block;margin-top:4px;">Você foi contratado(a)!</strong>
          </div>
          <p style="color:#444;line-height:1.6;">Parabéns! Sua candidatura para a vaga <strong>Analista de RH</strong> foi aprovada. Em breve nossa equipe entrará em contato com os próximos passos.</p>
          <a href="#" style="display:inline-block;background:#10B981;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Ver detalhes da contratação
          </a>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  candidatura_reprovada: {
    subject: 'Atualização sobre sua candidatura — TalentForge',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Atualização sobre sua candidatura</h2>
          <p style="color:#444;line-height:1.6;">Agradecemos seu interesse na vaga <strong>Analista de RH</strong>. Após análise cuidadosa, seguiremos com outros candidatos neste momento.</p>
          <p style="color:#444;line-height:1.6;">Seu perfil ficará salvo em nossa plataforma e você poderá se candidatar a novas oportunidades.</p>
          <a href="#" style="display:inline-block;background:#141042;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Ver outras vagas
          </a>
          <p style="color:#999;font-size:13px;margin-top:8px;">Obrigado por seu interesse em fazer parte da nossa equipe!</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  aviso_entrevista: {
    subject: '📅 Você foi convidado(a) para uma entrevista!',
    html: (to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">📅 Convite para entrevista</h2>
          <p style="color:#444;line-height:1.6;">Sua candidatura para a vaga <strong>Analista de RH</strong> avançou para a etapa de <strong>Entrevista com o RH</strong>.</p>
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;color:#9A3412;font-weight:600;">📍 Informações da entrevista</p>
            <p style="margin:8px 0 0;color:#7C2D12;font-size:14px;">Data e horário: a confirmar pela equipe de RH</p>
          </div>
          <a href="#" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Confirmar presença
          </a>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Verificar se é admin
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();
    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { templateId, recipient } = await req.json();
    const template = TEMPLATES[templateId];
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 400 });
    }

    const to = recipient || process.env.BREVO_SENDER_EMAIL || 'noreply@talentforge.com.br';

    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.BREVO_SENDER_NAME || 'TalentForge'}" <${process.env.BREVO_SENDER_EMAIL || 'noreply@talentforge.com.br'}>`,
      to,
      subject: `[TESTE] ${template.subject}`,
      html: template.html(to),
    });

    return NextResponse.json({ ok: true, to, subject: template.subject });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
