'use client';

import { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  AlertTriangle,
  UserCheck,
  FileCheck,
  Trophy,
  CalendarCheck,
  RefreshCw,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

interface Template {
  id: string;
  label: string;
  description: string;
  subject: string;
  icon: React.ReactNode;
  color: {
    bg: string;
    icon: string;
    badge: string;
    badgeText: string;
  };
  category: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'confirmacao_cadastro',
    label: 'Confirmação de Cadastro',
    description: 'Email enviado ao criar conta, com link de confirmação.',
    subject: '✅ Confirme seu cadastro no TalentForge',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', badgeText: 'Autenticação' },
    category: 'Autenticação',
  },
  {
    id: 'boas_vindas_candidato',
    label: 'Boas-vindas — Candidato',
    description: 'Email de boas-vindas após confirmação da conta pelo candidato.',
    subject: '🎉 Bem-vindo ao TalentForge!',
    icon: <UserCheck className="h-5 w-5" />,
    color: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', badgeText: 'Onboarding' },
    category: 'Onboarding',
  },
  {
    id: 'boas_vindas_recrutador',
    label: 'Boas-vindas — Recrutador',
    description: 'Email de boas-vindas para novo recrutador do sistema.',
    subject: '🚀 Sua conta de recrutador está pronta!',
    icon: <Sparkles className="h-5 w-5" />,
    color: { bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', badgeText: 'Onboarding' },
    category: 'Onboarding',
  },
  {
    id: 'redefinir_senha',
    label: 'Redefinição de Senha',
    description: 'Email com link para o usuário redefinir sua senha.',
    subject: '🔐 Redefinição de senha — TalentForge',
    icon: <RefreshCw className="h-5 w-5" />,
    color: { bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-100 text-red-700', badgeText: 'Segurança' },
    category: 'Segurança',
  },
  {
    id: 'aviso_entrevista',
    label: 'Convite para Entrevista',
    description: 'Notifica o candidato que foi chamado para uma entrevista.',
    subject: '📅 Você foi convidado(a) para uma entrevista!',
    icon: <CalendarCheck className="h-5 w-5" />,
    color: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
  {
    id: 'candidatura_em_documentacao',
    label: 'Fase de Documentação',
    description: 'Candidato foi movido para etapa de envio de documentos.',
    subject: '📂 Você avançou para a fase de documentação',
    icon: <FileCheck className="h-5 w-5" />,
    color: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
  {
    id: 'candidatura_aprovada',
    label: 'Candidatura Aprovada (Contratado)',
    description: 'Candidato foi selecionado e marcado como contratado.',
    subject: '🏆 Parabéns! Você foi selecionado(a)!',
    icon: <Trophy className="h-5 w-5" />,
    color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
  {
    id: 'candidatura_reprovada',
    label: 'Candidatura Reprovada',
    description: 'Candidato foi reprovado no processo seletivo.',
    subject: 'Atualização sobre sua candidatura',
    icon: <XCircle className="h-5 w-5" />,
    color: { bg: 'bg-gray-50', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-600', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
];

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

export default function EmailTestPage() {
  const [recipient, setRecipient] = useState('');
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [previewing, setPreviewing] = useState<string | null>(null);

  async function sendTest(templateId: string) {
    setStatuses((s) => ({ ...s, [templateId]: 'sending' }));
    setMessages((m) => ({ ...m, [templateId]: '' }));
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, recipient: recipient.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');
      setStatuses((s) => ({ ...s, [templateId]: 'success' }));
      setMessages((m) => ({ ...m, [templateId]: `Enviado para ${data.to}` }));
    } catch (err: unknown) {
      setStatuses((s) => ({ ...s, [templateId]: 'error' }));
      setMessages((m) => ({ ...m, [templateId]: err instanceof Error ? err.message : 'Erro desconhecido' }));
    }
    setTimeout(() => setStatuses((s) => ({ ...s, [templateId]: 'idle' })), 4000);
  }

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[rgba(20,16,66,0.06)] flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-[#141042]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#141042]">Teste de Emails</h1>
            <p className="text-sm text-[#94A3B8]">Envie emails de teste para validar templates e configuração SMTP</p>
          </div>
        </div>
      </div>

      {/* Recipient input */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 mb-2">Destinatário dos emails de teste</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
              <input
                type="email"
                autoComplete="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="seu@email.com (padrão: Fartech)"
                className="w-full pl-9 pr-4 py-2 bg-white border border-amber-200 rounded-lg text-sm text-[#141042] placeholder-[#999] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
              />
            </div>
            {recipient && (
              <button
                onClick={() => setRecipient('')}
                className="text-xs text-amber-600 hover:text-amber-800 underline"
              >
                Limpar
              </button>
            )}
          </div>
          <p className="text-xs text-amber-600 mt-1.5">
            Se em branco, o email será enviado para o endereço configurado no servidor (noreply@talentforge.com.br).
          </p>
        </div>
      </div>

      {/* Templates by category */}
      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{category}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.filter((t) => t.category === category).map((template) => {
              const status = statuses[template.id] || 'idle';
              const msg = messages[template.id];
              const isPreview = previewing === template.id;

              return (
                <div
                  key={template.id}
                  className="bg-white border border-[#E5E5DC] rounded-xl p-4 hover:border-[#141042]/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${template.color.bg} flex items-center justify-center shrink-0 ${template.color.icon}`}>
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[#141042] truncate">{template.label}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${template.color.badge}`}>
                          {template.color.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mb-1">{template.description}</p>
                      <p className="text-xs text-[#666] font-mono bg-[#FAFAF8] border border-[#E5E5DC] rounded px-2 py-1 truncate">
                        {template.subject}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => sendTest(template.id)}
                      disabled={status === 'sending'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        status === 'success'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : status === 'error'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-[#141042] text-white hover:bg-[#1e1860]'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {status === 'sending' ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                      ) : status === 'success' ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Enviado!</>
                      ) : status === 'error' ? (
                        <><XCircle className="h-3.5 w-3.5" /> Erro</>
                      ) : (
                        <><Send className="h-3.5 w-3.5" /> Enviar teste</>
                      )}
                    </button>

                    <button
                      onClick={() => setPreviewing(isPreview ? null : template.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E5E5DC] bg-white hover:bg-[#FAFAF8] text-[#666] transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {isPreview ? 'Fechar' : 'Preview'}
                    </button>

                    {msg && (
                      <span className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-emerald-600'} truncate`}>
                        {msg}
                      </span>
                    )}
                  </div>

                  {/* HTML Preview inline */}
                  {isPreview && (
                    <div className="mt-3 border border-[#E5E5DC] rounded-lg overflow-hidden">
                      <div className="bg-[#FAFAF8] px-3 py-1.5 border-b border-[#E5E5DC] flex items-center gap-2">
                        <Eye className="h-3 w-3 text-[#94A3B8]" />
                        <span className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">Preview do HTML</span>
                      </div>
                      <iframe
                        srcDoc={getPreviewHtml(template.id)}
                        className="w-full border-0"
                        style={{ height: 320 }}
                        title={`Preview: ${template.label}`}
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* SMTP Status */}
      <div className="mt-8 border border-[#E5E5DC] rounded-xl p-4 bg-[#FAFAF8]">
        <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Configuração SMTP atual</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Host', value: 'smtp-relay.brevo.com' },
            { label: 'Porta', value: '587' },
            { label: 'Remetente', value: 'noreply@talentforge.com.br' },
            { label: 'Provedor', value: 'Brevo (Sendinblue)' },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-[#E5E5DC] rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-0.5">{item.label}</p>
              <p className="text-xs font-medium text-[#141042] truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Minimal preview HTML (sem secrets, apenas visual)
function getPreviewHtml(templateId: string): string {
  const previews: Record<string, string> = {
    confirmacao_cadastro: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">Confirme seu cadastro</h2><p style="color:#444;line-height:1.6;">Para ativar sua conta, clique no botão abaixo:</p><a href="#" style="display:inline-block;background:#10B981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Confirmar email</a></div></div></div>`,
    boas_vindas_candidato: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">Bem-vindo(a)! 🎉</h2><p style="color:#444;line-height:1.6;">Sua conta foi criada. Explore as vagas disponíveis.</p><a href="#" style="display:inline-block;background:#141042;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ver vagas</a></div></div></div>`,
    boas_vindas_recrutador: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">Sua conta de recrutador está pronta! 🚀</h2><p style="color:#444;line-height:1.6;">Publique vagas, gerencie candidatos e acompanhe o pipeline.</p><a href="#" style="display:inline-block;background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Acessar painel</a></div></div></div>`,
    redefinir_senha: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">Redefinição de senha</h2><p style="color:#444;line-height:1.6;">Clique abaixo para criar uma nova senha. Link válido por 24h.</p><a href="#" style="display:inline-block;background:#EF4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Redefinir senha</a></div></div></div>`,
    aviso_entrevista: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">📅 Convite para entrevista</h2><p style="color:#444;line-height:1.6;">Sua candidatura avançou para Entrevista com o RH.</p><a href="#" style="display:inline-block;background:#F97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Confirmar presença</a></div></div></div>`,
    candidatura_em_documentacao: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">🎉 Você avançou no processo!</h2><p style="color:#444;line-height:1.6;">Sua candidatura foi aprovada. Envie os documentos para continuar.</p><a href="#" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Enviar documentos</a></div></div></div>`,
    candidatura_aprovada: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:16px;margin-bottom:16px;"><span style="font-size:24px;">🏆</span><strong style="color:#065F46;display:block;margin-top:4px;">Você foi contratado(a)!</strong></div><p style="color:#444;line-height:1.6;">Parabéns! Em breve entraremos em contato.</p></div></div></div>`,
    candidatura_reprovada: `<div style="font-family:sans-serif;padding:20px;background:#f5f5f5;"><div style="max-width:500px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:#141042;padding:24px 32px;"><h1 style="color:#fff;margin:0;font-size:20px;">TalentForge</h1></div><div style="padding:32px;"><h2 style="color:#141042;margin-top:0;">Atualização sobre sua candidatura</h2><p style="color:#444;line-height:1.6;">Agradecemos seu interesse. Seguiremos com outros candidatos neste momento.</p><a href="#" style="display:inline-block;background:#141042;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Ver outras vagas</a></div></div></div>`,
  };
  return previews[templateId] || '<p style="font-family:sans-serif;padding:20px;color:#999;">Preview não disponível</p>';
}
