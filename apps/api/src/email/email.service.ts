import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export interface InterviewEmailData {
  candidateName: string;
  jobTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  type: 'video' | 'presencial' | 'phone';
  location?: string;
  meetLink?: string;
  organizerName: string;
  orgName: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  private get appUrl(): string {
    return this.config.get<string>('APP_URL', 'https://web-eight-rho-84.vercel.app');
  }

  /**
   * ① Convite de candidato — disparado ao criar invite link
   */
  async sendCandidateInvite(
    to: string,
    orgName: string,
    token: string,
  ): Promise<void> {
    const inviteUrl = `${this.appUrl}/candidato/registro?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Você foi convidado para participar do processo seletivo — ${orgName}`,
        template: 'invite-candidate',
        context: {
          orgName,
          inviteUrl,
          expiresIn: '48 horas',
        },
      });
      this.logger.log(`Convite enviado para ${to}`);
    } catch (err) {
      this.logger.error(`Falha ao enviar convite para ${to}`, err);
    }
  }

  /**
   * ② Entrevista agendada — disparado ao criar entrevista
   */
  async sendInterviewScheduled(
    to: string,
    data: InterviewEmailData,
  ): Promise<void> {
    const typeLabel: Record<string, string> = {
      video: 'Videoconferência',
      presencial: 'Presencial',
      phone: 'Telefone',
    };

    const scheduledFormatted = new Date(data.scheduledAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    try {
      await this.mailerService.sendMail({
        to,
        subject: `Entrevista agendada: ${data.jobTitle} — ${data.orgName}`,
        template: 'interview-scheduled',
        context: {
          ...data,
          scheduledFormatted,
          typeLabel: typeLabel[data.type] ?? data.type,
          hasMeetLink: !!data.meetLink,
          hasLocation: !!data.location,
        },
      });
      this.logger.log(`Confirmação de entrevista enviada para ${to}`);
    } catch (err) {
      this.logger.error(`Falha ao enviar entrevista para ${to}`, err);
    }
  }

  /**
   * ③ Link de assessment — disparado ao criar qualquer assessment
   */
  async sendAssessmentLink(
    to: string,
    candidateName: string,
    assessmentType: string,
    link: string,
    expiresIn = '7 dias',
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Seu link de avaliação ${assessmentType} está pronto`,
        template: 'assessment-link',
        context: {
          candidateName,
          assessmentType,
          link,
          expiresIn,
        },
      });
      this.logger.log(`Link de assessment enviado para ${to}`);
    } catch (err) {
      this.logger.error(`Falha ao enviar assessment para ${to}`, err);
    }
  }

  /**
   * ④ Boas-vindas ao novo usuário criado pelo admin
   */
  async sendWelcomeUser(
    to: string,
    name: string,
    role: string,
    tempPassword: string,
  ): Promise<void> {
    const loginUrl = `${this.appUrl}/login`;
    const roleLabel: Record<string, string> = {
      admin: 'Administrador',
      recruiter: 'Recrutador',
      candidate: 'Candidato',
    };
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Bem-vindo ao TalentForge — Seus dados de acesso',
        template: 'welcome-user',
        context: {
          name,
          role: roleLabel[role] ?? role,
          loginUrl,
          tempPassword,
          email: to,
        },
      });
      this.logger.log(`Boas-vindas enviado para ${to}`);
    } catch (err) {
      this.logger.error(`Falha ao enviar boas-vindas para ${to}`, err);
    }
  }

  /**
   * ⑤ Alerta crítico NR-1 — disparado pelo PHP Module
   */
  async sendNr1CriticalAlert(
    to: string,
    employeeName: string,
    orgName: string,
    assessmentUrl: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: `⚠️ Alerta NR-1: Alto risco psicossocial detectado — ${orgName}`,
        template: 'php-nr1-alert',
        context: {
          employeeName,
          orgName,
          assessmentUrl,
        },
      });
      this.logger.log(`Alerta NR-1 enviado para ${to}`);
    } catch (err) {
      this.logger.error(`Falha ao enviar alerta NR-1 para ${to}`, err);
    }
  }

  /**
   * ⑥ Teste de configuração SMTP — disparado pelo painel admin/settings
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: '✅ Configuração SMTP Brevo funcionando — TalentForge',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #141042;">TalentForge</h2>
            <p>Este é um e-mail de teste da sua configuração SMTP via <strong>Brevo</strong>.</p>
            <p style="color: #10B981;"><strong>✅ Tudo funcionando corretamente!</strong></p>
            <hr style="border-color: #E5E5DC;">
            <p style="color: #888; font-size: 12px;">Enviado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          </div>
        `,
      });
      this.logger.log(`E-mail de teste enviado para ${to}`);
      return { success: true, message: `E-mail de teste enviado com sucesso para ${to} via Brevo` };
    } catch (err) {
      this.logger.error(`Falha no teste de e-mail para ${to}`, err);
      return { success: false, message: (err as Error).message };
    }
  }
}
