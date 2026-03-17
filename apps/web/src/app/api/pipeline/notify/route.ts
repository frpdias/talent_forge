import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

// Mapeia status do pipeline para o email a ser enviado
const STATUS_EMAIL_MAP: Record<string, { subject: string; html: (name: string, job: string, to: string) => string }> = {
  interview_hr: {
    subject: '📅 Você foi convidado(a) para uma entrevista com o RH!',
    html: (name, job, to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Olá, ${name}! 📅</h2>
          <p style="color:#444;line-height:1.6;">Sua candidatura para a vaga <strong>${job}</strong> avançou para a etapa de <strong style="color:#EA580C;">Entrevista com o RH</strong>.</p>
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;color:#9A3412;font-weight:600;">📍 Informações da entrevista</p>
            <p style="margin:8px 0 0;color:#7C2D12;font-size:14px;">A equipe de RH entrará em contato com data, horário e formato da entrevista.</p>
          </div>
          <a href="#" style="display:inline-block;background:#F97316;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Confirmar presença
          </a>
          <p style="color:#999;font-size:13px;margin-top:8px;">Fique atento ao seu e-mail e telefone.</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  interview_manager: {
    subject: '📅 Você foi convidado(a) para uma entrevista com o Gestor!',
    html: (name, job, to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Parabéns, ${name}! 🌟</h2>
          <p style="color:#444;line-height:1.6;">Você passou da entrevista com o RH e agora avançou para a <strong style="color:#0D9488;">Entrevista com o Gestor</strong> na vaga <strong>${job}</strong>.</p>
          <div style="background:#F0FDFA;border:1px solid #99F6E4;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;color:#134E4A;font-weight:600;">🎯 Próxima etapa</p>
            <p style="margin:8px 0 0;color:#115E59;font-size:14px;">A equipe entrará em contato brevemente com os detalhes da entrevista com o gestor da área.</p>
          </div>
          <a href="#" style="display:inline-block;background:#0D9488;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Ver detalhes
          </a>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  in_documentation: {
    subject: '📂 Parabéns! Você avançou para a fase de documentação',
    html: (name, job, to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">🎉 Você avançou no processo seletivo, ${name}!</h2>
          <p style="color:#444;line-height:1.6;">Sua candidatura para a vaga <strong>${job}</strong> foi aprovada e você está na fase de <span style="color:#7C3AED;font-weight:600;">Documentação</span>.</p>
          <p style="color:#444;line-height:1.6;">Por favor, acesse o portal e envie os documentos solicitados para prosseguir com a contratação.</p>
          <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:0;color:#5B21B6;font-weight:600;">📋 Documentos solicitados</p>
            <p style="margin:8px 0 0;color:#6D28D9;font-size:14px;">Acesse o portal para ver a lista detalhada de documentos necessários.</p>
          </div>
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
  hired: {
    subject: '🏆 Parabéns! Você foi selecionado(a) para a vaga!',
    html: (name, job, to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <span style="font-size:36px;">🏆</span>
            <strong style="color:#065F46;font-size:20px;display:block;margin-top:8px;">Você foi contratado(a)!</strong>
          </div>
          <p style="color:#444;line-height:1.6;">Olá, <strong>${name}</strong>! Parabéns pela sua aprovação na vaga de <strong>${job}</strong>.</p>
          <p style="color:#444;line-height:1.6;">Em breve nossa equipe entrará em contato com os próximos passos, data de início e demais informações necessárias.</p>
          <a href="#" style="display:inline-block;background:#10B981;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Ver detalhes da contratação
          </a>
          <p style="color:#999;font-size:13px;margin-top:8px;">Bem-vindo(a) ao time! 🎉</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
  rejected: {
    subject: 'Atualização sobre sua candidatura — TalentForge',
    html: (name, job, to) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:#141042;padding:32px 40px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;">TalentForge</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #E5E5DC;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#141042;margin-top:0;">Olá, ${name}</h2>
          <p style="color:#444;line-height:1.6;">Agradecemos seu interesse na vaga de <strong>${job}</strong> e o tempo dedicado ao nosso processo seletivo.</p>
          <p style="color:#444;line-height:1.6;">Após uma análise cuidadosa dos perfis, seguiremos com outros candidatos neste momento. Seu perfil ficará salvo em nossa plataforma para oportunidades futuras.</p>
          <a href="#" style="display:inline-block;background:#141042;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Ver outras vagas
          </a>
          <p style="color:#999;font-size:13px;margin-top:8px;">Obrigado pela sua participação e boa sorte em sua trajetória profissional!</p>
          <hr style="border:none;border-top:1px solid #E5E5DC;margin:24px 0;"/>
          <p style="color:#ccc;font-size:12px;margin:0;">📧 Enviado para: ${to} · TalentForge © 2026</p>
        </div>
      </div>
    `,
  },
};

// Statuses que NÃO geram email (movimentação interna)
const SILENT_STATUSES = new Set(['applied', 'in_process']);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { candidateEmail, candidateName, jobTitle, newStatus } = await req.json();

    if (!candidateEmail || !newStatus) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 });
    }

    // Status sem email — retorna ok silenciosamente
    if (SILENT_STATUSES.has(newStatus)) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'Status sem notificação por email' });
    }

    const template = STATUS_EMAIL_MAP[newStatus];
    if (!template) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'Nenhum template mapeado para este status' });
    }

    const name = candidateName || 'Candidato(a)';
    const job = jobTitle || 'Vaga';

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
      to: candidateEmail,
      subject: template.subject,
      html: template.html(name, job, candidateEmail),
    });

    return NextResponse.json({ ok: true, to: candidateEmail, subject: template.subject });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    // Retorna 200 para não quebrar o fluxo — erro de email não deve impedir a mudança de status
    return NextResponse.json({ ok: false, error: message });
  }
}
