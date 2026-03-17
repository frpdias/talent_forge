'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Server,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  RotateCcw,
  Shield,
} from 'lucide-react';

interface Template {
  id: string;
  label: string;
  description: string;
  subject: string;
  icon: React.ReactNode;
  color: { bg: string; icon: string; badge: string; badgeText: string };
  category: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'confirmacao_cadastro', label: 'Confirmação de Cadastro',
    description: 'Email com link de confirmação ao criar conta.',
    subject: '✅ Confirme seu cadastro no TalentForge',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', badgeText: 'Auth' },
    category: 'Autenticação',
  },
  {
    id: 'boas_vindas_candidato', label: 'Boas-vindas — Candidato',
    description: 'Boas-vindas após confirmação da conta do candidato.',
    subject: '🎉 Bem-vindo ao TalentForge!',
    icon: <UserCheck className="h-4 w-4" />,
    color: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', badgeText: 'Onboarding' },
    category: 'Onboarding',
  },
  {
    id: 'boas_vindas_recrutador', label: 'Boas-vindas — Recrutador',
    description: 'Boas-vindas para novo recrutador do sistema.',
    subject: '🚀 Sua conta de recrutador está pronta!',
    icon: <Sparkles className="h-4 w-4" />,
    color: { bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', badgeText: 'Onboarding' },
    category: 'Onboarding',
  },
  {
    id: 'redefinir_senha', label: 'Redefinição de Senha',
    description: 'Link para redefinição de senha do usuário.',
    subject: '🔐 Redefinição de senha — TalentForge',
    icon: <RefreshCw className="h-4 w-4" />,
    color: { bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-100 text-red-700', badgeText: 'Segurança' },
    category: 'Segurança',
  },
  {
    id: 'aviso_entrevista', label: 'Convite para Entrevista',
    description: 'Candidato chamado para entrevista com o RH.',
    subject: '📅 Você foi convidado(a) para uma entrevista!',
    icon: <CalendarCheck className="h-4 w-4" />,
    color: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
  {
    id: 'candidatura_em_documentacao', label: 'Fase de Documentação',
    description: 'Candidato movido para etapa de documentos.',
    subject: '📂 Você avançou para a fase de documentação',
    icon: <FileCheck className="h-4 w-4" />,
    color: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
  {
    id: 'candidatura_aprovada', label: 'Candidatura Aprovada',
    description: 'Candidato selecionado e marcado como contratado.',
    subject: '🏆 Parabéns! Você foi selecionado(a)!',
    icon: <Trophy className="h-4 w-4" />,
    color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
  {
    id: 'candidatura_reprovada', label: 'Candidatura Reprovada',
    description: 'Candidato reprovado no processo seletivo.',
    subject: 'Atualização sobre sua candidatura',
    icon: <XCircle className="h-4 w-4" />,
    color: { bg: 'bg-gray-50', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-600', badgeText: 'Pipeline' },
    category: 'Pipeline',
  },
];

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

interface SmtpState {
  loading: boolean;
  ok: boolean | null;
  latency?: number;
  host?: string;
  port?: number;
  user?: string;
  sender?: string;
  provider?: string;
  error?: string;
  checkedAt?: string;
}

interface LogEntry {
  id: string;
  templateLabel: string;
  to: string;
  status: 'success' | 'error';
  error?: string;
  ts: string;
}

export default function EmailTestPage() {
  const [recipient, setRecipient] = useState('');
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [smtp, setSmtp] = useState<SmtpState>({ loading: false, ok: null });
  const [log, setLog] = useState<LogEntry[]>([]);

  const checkSmtp = useCallback(async () => {
    setSmtp((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch('/api/admin/smtp-status');
      const data = await res.json();
      setSmtp({ loading: false, ...data });
    } catch {
      setSmtp({ loading: false, ok: false, error: 'Falha ao contatar a API', checkedAt: new Date().toISOString() });
    }
  }, []);

  useEffect(() => { checkSmtp(); }, [checkSmtp]);

  async function sendTest(templateId: string) {
    const templateLabel = TEMPLATES.find((t) => t.id === templateId)?.label ?? templateId;
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
      setMessages((m) => ({ ...m, [templateId]: `→ ${data.to}` }));
      setLog((l) => [
        { id: crypto.randomUUID(), templateLabel, to: data.to, status: 'success', ts: new Date().toLocaleTimeString('pt-BR') },
        ...l.slice(0, 19),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setStatuses((s) => ({ ...s, [templateId]: 'error' }));
      setMessages((m) => ({ ...m, [templateId]: msg }));
      setLog((l) => [
        { id: crypto.randomUUID(), templateLabel, to: recipient || 'padrão', status: 'error', error: msg, ts: new Date().toLocaleTimeString('pt-BR') },
        ...l.slice(0, 19),
      ]);
    }
    setTimeout(() => setStatuses((s) => ({ ...s, [templateId]: 'idle' })), 4000);
  }

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  const latencyColor = smtp.latency
    ? smtp.latency < 500 ? 'text-emerald-600' : smtp.latency < 1500 ? 'text-amber-600' : 'text-red-600'
    : '';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#E5E5DC] bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(20,16,66,0.06)] flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-[#141042]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#141042] leading-tight">Teste de Emails</h1>
              <p className="text-xs text-[#94A3B8]">Dispare templates e monitore a conexão SMTP em tempo real</p>
            </div>
          </div>
          {/* SMTP quick badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            smtp.loading ? 'bg-[#FAFAF8] border-[#E5E5DC] text-[#94A3B8]'
            : smtp.ok === true ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : smtp.ok === false ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-[#FAFAF8] border-[#E5E5DC] text-[#94A3B8]'
          }`}>
            {smtp.loading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : smtp.ok === true ? <Wifi className="h-3 w-3" />
              : <WifiOff className="h-3 w-3" />}
            SMTP {smtp.loading ? 'verificando…' : smtp.ok === true ? 'online' : smtp.ok === false ? 'offline' : '—'}
            {smtp.latency && !smtp.loading && (
              <span className={`ml-1 font-normal ${latencyColor}`}>{smtp.latency}ms</span>
            )}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — templates */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-w-0">

          {/* Recipient */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-800 shrink-0">Destinatário:</span>
            <div className="relative flex-1 max-w-xs">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
              <input
                type="email"
                autoComplete="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="email@destino.com (padrão: Fartech)"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-[#141042] placeholder-[#bbb] focus:outline-none focus:border-amber-400"
              />
            </div>
            {recipient && (
              <button onClick={() => setRecipient('')} className="text-xs text-amber-600 hover:text-amber-800 underline shrink-0">
                Limpar
              </button>
            )}
          </div>

          {/* Template categories */}
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2">{category}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {TEMPLATES.filter((t) => t.category === category).map((template) => {
                  const status = statuses[template.id] || 'idle';
                  const msg = messages[template.id];
                  const isPreview = previewing === template.id;

                  return (
                    <div
                      key={template.id}
                      className="bg-white border border-[#E5E5DC] rounded-xl p-3.5 hover:border-[#141042]/20 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-7 h-7 rounded-lg ${template.color.bg} flex items-center justify-center shrink-0 ${template.color.icon}`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#141042] truncate">{template.label}</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${template.color.badge}`}>
                              {template.color.badgeText}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{template.description}</p>
                        </div>
                      </div>

                      <p className="text-[11px] font-mono text-[#666] bg-[#FAFAF8] border border-[#E5E5DC] rounded px-2 py-1 truncate mb-2.5">
                        {template.subject}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => sendTest(template.id)}
                          disabled={status === 'sending'}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                            status === 'success' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : status === 'error' ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-[#141042] text-white hover:bg-[#1e1860]'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {status === 'sending' ? <><Loader2 className="h-3 w-3 animate-spin" />Enviando</>
                           : status === 'success' ? <><CheckCircle2 className="h-3 w-3" />Enviado!</>
                           : status === 'error' ? <><XCircle className="h-3 w-3" />Erro</>
                           : <><Send className="h-3 w-3" />Enviar</>}
                        </button>

                        <button
                          onClick={() => setPreviewing(isPreview ? null : template.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#E5E5DC] bg-white hover:bg-[#FAFAF8] text-[#666] transition-colors shrink-0"
                        >
                          <Eye className="h-3 w-3" />
                          {isPreview ? 'Fechar' : 'Preview'}
                        </button>

                        {msg && (
                          <span className={`text-[11px] truncate ${status === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                            {msg}
                          </span>
                        )}
                      </div>

                      {isPreview && (
                        <div className="mt-2.5 border border-[#E5E5DC] rounded-lg overflow-hidden">
                          <div className="bg-[#FAFAF8] px-3 py-1 border-b border-[#E5E5DC] flex items-center gap-1.5">
                            <Eye className="h-3 w-3 text-[#94A3B8]" />
                            <span className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-wider">Preview HTML</span>
                          </div>
                          <iframe
                            srcDoc={getPreviewHtml(template.id)}
                            className="w-full border-0"
                            style={{ height: 260 }}
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
        </div>

        {/* RIGHT — sticky monitor */}
        <div className="w-72 shrink-0 border-l border-[#E5E5DC] bg-[#FAFAF8] flex flex-col overflow-y-auto">

          {/* SMTP Monitor */}
          <div className="p-4 border-b border-[#E5E5DC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#141042]" />
                <span className="text-[10px] font-bold text-[#141042] uppercase tracking-wider">Monitor SMTP</span>
              </div>
              <button
                onClick={checkSmtp}
                disabled={smtp.loading}
                title="Verificar agora"
                className="p-1 rounded-md hover:bg-[#E5E5DC] transition-colors disabled:opacity-40"
              >
                <RotateCcw className={`h-3 w-3 text-[#666] ${smtp.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border mb-3 ${
              smtp.loading ? 'bg-white border-[#E5E5DC]'
              : smtp.ok === true ? 'bg-emerald-50 border-emerald-200'
              : smtp.ok === false ? 'bg-red-50 border-red-200'
              : 'bg-white border-[#E5E5DC]'
            }`}>
              <div className="flex items-center gap-2">
                {smtp.loading
                  ? <Loader2 className="h-4 w-4 animate-spin text-[#94A3B8]" />
                  : smtp.ok === true
                  ? (
                    <div className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      </span>
                    </div>
                  )
                  : smtp.ok === false
                  ? <XCircle className="h-4 w-4 text-red-500" />
                  : <div className="h-4 w-4 rounded-full bg-[#E5E5DC]" />}
                <span className={`text-xs font-semibold ${
                  smtp.ok === true ? 'text-emerald-700'
                  : smtp.ok === false ? 'text-red-700'
                  : 'text-[#94A3B8]'
                }`}>
                  {smtp.loading ? 'Verificando…'
                   : smtp.ok === true ? 'Conexão OK'
                   : smtp.ok === false ? 'Sem conexão'
                   : 'Não verificado'}
                </span>
              </div>
              {smtp.latency && !smtp.loading && (
                <span className={`text-xs font-bold ${latencyColor}`}>{smtp.latency}ms</span>
              )}
            </div>

            {smtp.ok === false && smtp.error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                <p className="text-[11px] text-red-600 break-all leading-snug">{smtp.error}</p>
              </div>
            )}

            {/* Config */}
            <div className="space-y-1.5">
              {[
                { icon: <Server className="h-3 w-3" />, label: 'Host', value: smtp.host || '—' },
                { icon: <Zap className="h-3 w-3" />, label: 'Porta', value: smtp.port ? String(smtp.port) : '—' },
                { icon: <Shield className="h-3 w-3" />, label: 'Usuário', value: smtp.user || '—' },
                { icon: <Mail className="h-3 w-3" />, label: 'From', value: smtp.sender || '—' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-[#E5E5DC]">
                  <span className="text-[#94A3B8] shrink-0">{item.icon}</span>
                  <span className="text-[10px] text-[#94A3B8] w-12 shrink-0">{item.label}</span>
                  <span className="text-[11px] font-medium text-[#141042] truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {smtp.checkedAt && (
              <div className="flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3 text-[#C9C9C0]" />
                <span className="text-[10px] text-[#C9C9C0]">
                  {new Date(smtp.checkedAt).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          {/* Activity log */}
          <div className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3.5 w-3.5 text-[#141042]" />
              <span className="text-[10px] font-bold text-[#141042] uppercase tracking-wider">Log da Sessão</span>
              {log.length > 0 && (
                <span className="ml-auto text-[10px] text-[#94A3B8] bg-[#E5E5DC] rounded-full px-1.5 py-0.5 leading-none">
                  {log.length}
                </span>
              )}
            </div>

            {log.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-8 h-8 rounded-full bg-[#E5E5DC] flex items-center justify-center mb-2">
                  <Send className="h-3.5 w-3.5 text-[#94A3B8]" />
                </div>
                <p className="text-xs text-[#94A3B8]">Nenhum email enviado</p>
                <p className="text-[10px] text-[#C9C9C0] mt-0.5">Os disparos aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {log.map((entry) => (
                  <div
                    key={entry.id}
                    className={`px-2.5 py-2 rounded-lg border ${
                      entry.status === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-red-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {entry.status === 'success'
                        ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        : <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                      <span className="text-[11px] font-medium text-[#141042] truncate">{entry.templateLabel}</span>
                      <span className="ml-auto text-[10px] text-[#94A3B8] shrink-0">{entry.ts}</span>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] truncate pl-4">
                      {entry.status === 'success' ? `→ ${entry.to}` : entry.error}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getPreviewHtml(templateId: string): string {
  const previews: Record<string, string> = {
    confirmacao_cadastro: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">Confirme seu cadastro</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Para ativar sua conta, clique no botão abaixo:</p><a href="#" style="display:inline-block;background:#10B981;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Confirmar email</a></div></div></div>`,
    boas_vindas_candidato: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">Bem-vindo(a)! 🎉</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Sua conta foi criada. Explore as vagas disponíveis.</p><a href="#" style="display:inline-block;background:#141042;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Ver vagas</a></div></div></div>`,
    boas_vindas_recrutador: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">Conta de recrutador pronta! 🚀</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Publique vagas e acompanhe o pipeline.</p><a href="#" style="display:inline-block;background:#3B82F6;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Acessar painel</a></div></div></div>`,
    redefinir_senha: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">Redefinição de senha</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Link válido por 24h. Clique abaixo:</p><a href="#" style="display:inline-block;background:#EF4444;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Redefinir senha</a></div></div></div>`,
    aviso_entrevista: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">📅 Convite para entrevista</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Sua candidatura avançou para Entrevista com o RH.</p><a href="#" style="display:inline-block;background:#F97316;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Confirmar presença</a></div></div></div>`,
    candidatura_em_documentacao: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">🎉 Você avançou no processo!</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Envie os documentos para prosseguir.</p><a href="#" style="display:inline-block;background:#7C3AED;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Enviar documentos</a></div></div></div>`,
    candidatura_aprovada: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:14px;margin-bottom:14px;"><span style="font-size:22px;">🏆</span><strong style="color:#065F46;display:block;margin-top:4px;font-size:15px;">Você foi contratado(a)!</strong></div><p style="color:#444;line-height:1.6;font-size:14px;margin:0;">Em breve entraremos em contato.</p></div></div></div>`,
    candidatura_reprovada: `<div style="font-family:sans-serif;padding:16px;background:#f5f5f5;"><div style="max-width:480px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;"><div style="background:#141042;padding:20px 28px;"><h1 style="color:#fff;margin:0;font-size:18px;">TalentForge</h1></div><div style="padding:24px 28px;"><h2 style="color:#141042;margin:0 0 12px;">Atualização sobre sua candidatura</h2><p style="color:#444;line-height:1.6;font-size:14px;margin:0 0 16px;">Agradecemos seu interesse. Seguiremos com outros candidatos.</p><a href="#" style="display:inline-block;background:#141042;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Ver outras vagas</a></div></div></div>`,
  };
  return previews[templateId] ?? '<p style="font-family:sans-serif;padding:20px;color:#999;">Preview não disponível</p>';
}
