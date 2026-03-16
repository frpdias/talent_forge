'use client';

import { useState } from 'react';
import { UserPlus, Mail, User, Lock, Building2, Phone, Save, AlertCircle, CheckCircle, HelpCircle, X, ArrowRight, Database, Shield, Briefcase, Copy, SendHorizonal, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type UserType = 'admin' | 'recruiter' | 'candidate';

interface FormData {
  email: string;
  fullName: string;
  userType: UserType;
  phone: string;
  company: string;
  position: string;
}

interface SuccessData {
  userId: string;
  email: string;
  userType: string;
  emailSent: boolean;
  tempPassword?: string;
  emailError?: string;
}

export default function CreateUserPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    userType: 'recruiter',
    phone: '',
    company: '',
    position: '',
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async () => {
    if (!successData) return;
    setResending(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/resend-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          userId: successData.userId,
          email: successData.email,
          fullName: successData.email,
          userType: successData.userType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessData(prev => prev ? {
        ...prev,
        emailSent: data.emailSent,
        tempPassword: data.tempPassword,
        emailError: data.emailError,
      } : prev);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao reenviar');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessData(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setSuccessData({
        userId: data.userId,
        email: data.email,
        userType: data.userType,
        emailSent: data.emailSent,
        tempPassword: data.tempPassword,
        emailError: data.emailError,
      });

      // Limpar formulário
      setFormData({
        email: '',
        fullName: '',
        userType: 'recruiter',
        phone: '',
        company: '',
        position: '',
      });
    } catch (error: any) {
      setErrorMsg(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">

      {/* Modal de Instruções */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header do modal */}
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-[#E5E5DC] rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#141042] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#141042]">Como cadastrar um Recrutador</h3>
                  <p className="text-xs text-[#666666]">Guia completo do fluxo de criação</p>
                </div>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-2 rounded-lg text-[#666666] hover:bg-[#FAFAF8] hover:text-[#141042] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Passo 1 */}
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#141042] text-white flex items-center justify-center text-sm font-bold">1</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#141042] mb-1">Preencha os campos obrigatórios</h4>
                  <p className="text-sm text-[#666666] mb-3">Selecione o tipo <strong>Recrutador</strong> e informe os dados abaixo:</p>
                  <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-[#141042] mt-0.5 shrink-0" />
                      <div><span className="font-medium text-[#141042]">Email *</span> — será o login do recrutador. Deve ser único no sistema.</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <SendHorizonal className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <div><span className="font-medium text-[#141042]">Senha</span> — gerada automaticamente e enviada por e-mail ao usuário.</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-[#141042] mt-0.5 shrink-0" />
                      <div><span className="font-medium text-[#141042]">Nome completo *</span> — usado no perfil e na exibição interna.</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-[#666666] mt-0.5 shrink-0" />
                      <div><span className="font-medium text-[#141042]">Empresa</span> — nome da organização. Usado para nomear a org criada automaticamente.</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-[#666666] mt-0.5 shrink-0" />
                      <div><span className="font-medium text-[#141042]">Telefone / Cargo</span> — opcionais, armazenados no perfil.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#141042] text-white flex items-center justify-center text-sm font-bold">2</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#141042] mb-1">O sistema cria automaticamente</h4>
                  <p className="text-sm text-[#666666] mb-3">Ao submeter o formulário, o backend executa em sequência:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                      <Database className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-blue-900">auth.users</span>
                        <span className="text-blue-700"> — conta de acesso com email já confirmado (<code className="bg-blue-100 px-1 rounded">email_confirm: true</code>)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm">
                      <User className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-purple-900">user_profiles</span>
                        <span className="text-purple-700"> — perfil com full_name, email, user_type=<code className="bg-purple-100 px-1 rounded">'recruiter'</code>, phone, company, position</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
                      <Building2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-green-900">organizations</span>
                        <span className="text-green-700"> — org criada com nome <code className="bg-green-100 px-1 rounded">"&lt;Empresa&gt; - &lt;id_curto&gt;"</code>, org_type=<code className="bg-green-100 px-1 rounded">'headhunter'</code>, status=<code className="bg-green-100 px-1 rounded">'active'</code></span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                      <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-amber-900">org_members</span>
                        <span className="text-amber-700"> — vínculo com role=<code className="bg-amber-100 px-1 rounded">'admin'</code> e status=<code className="bg-amber-100 px-1 rounded">'active'</code> (recrutador começa como admin da própria org)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-bold">3</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#141042] mb-1">Após a criação — próximos passos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-[#666666]">
                      <ArrowRight className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span>Acesse <strong className="text-[#141042]">Dashboard → Minhas Empresas → [nome da org]</strong> para ativar o módulo de Recrutamento via toggle no card da empresa.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[#666666]">
                      <ArrowRight className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span>Se o cliente também usar o módulo PHP, ative-o pelo mesmo card.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[#666666]">
                      <ArrowRight className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span>O recrutador já pode fazer login imediatamente — sem necessidade de confirmar email.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[#666666]">
                      <ArrowRight className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                      <span>Para adicionar outros usuários à mesma org, o próprio recrutador usa <strong className="text-[#141042]">Dashboard → Convidar Usuário</strong> para gerar um link de convite.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerta de erro crítico */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
                <p className="font-semibold text-red-800 mb-1">⚠️ Se a criação falhar</p>
                <p className="text-red-700">Se o usuário for criado no Auth mas a org/org_members falharem, o recrutador ficará sem organização. Nesse caso, crie a org manualmente no Supabase e insira o vínculo em <code className="bg-red-100 px-1 rounded">org_members</code> com role=<code className="bg-red-100 px-1 rounded">'admin'</code>.</p>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-[#E5E5DC] flex justify-end">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-5 py-2 bg-[#141042] text-white rounded-lg text-sm font-medium hover:bg-[#1a1557] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] flex items-center">
            <UserPlus className="w-6 h-6 mr-3 text-[#141042]" />
            Criar Novo Usuário
          </h2>
          <p className="text-sm sm:text-base text-[#666666] mt-1">
            Cadastre novos usuários diretamente no sistema (Admin, Recrutadores, Candidatos)
          </p>
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-[#E5E5DC] rounded-lg text-sm text-[#666666] hover:bg-[#FAFAF8] hover:text-[#141042] transition-colors shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
          Como cadastrar
        </button>
      </div>

      {/* Feedback de erro */}
      {errorMsg && (
        <div className="p-4 rounded-lg border flex items-start space-x-3 bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Feedback de sucesso */}
      {successData && (
        <div className="p-4 rounded-xl border bg-[#10B981]/10 border-[#10B981] space-y-3">
          <div className="flex items-center gap-2 text-[#10B981]">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">
              Usuário <span className="font-bold">{successData.email}</span> criado com sucesso!
            </p>
          </div>

          {successData.emailSent ? (
            <div className="flex items-start gap-2 text-sm text-[#047857]">
              <Mail className="w-4 h-4 shrink-0 mt-0.5" />
              <span>E-mail com as credenciais de acesso enviado para <strong>{successData.email}</strong>. O usuário pode fazer login imediatamente.</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-amber-800">⚠️ E-mail não enviado — compartilhe a senha manualmente:</p>
              {successData.emailError && (
                <p className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-1 font-mono break-all">{successData.emailError}</p>
              )}
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-amber-200 rounded px-3 py-1.5 text-sm font-mono font-bold text-[#141042] tracking-widest">
                  {successData.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(successData.tempPassword!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded text-xs font-medium text-amber-800 hover:bg-amber-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3B82F6] text-white rounded text-xs font-medium hover:bg-[#2563EB] disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  {resending
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <SendHorizonal className="w-3.5 h-3.5" />}
                  {resending ? 'Enviando...' : 'Tentar reenviar'}
                </button>
              </div>
              <p className="text-xs text-amber-700">Verifique se <code className="bg-amber-100 px-1 rounded">BREVO_SMTP_PASS</code> está configurada no Vercel e tente reenviar.</p>
            </div>
          )}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <div className="space-y-6">
          {/* Tipo de Usuário */}
          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-3">
              Tipo de Usuário *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['admin', 'recruiter', 'candidate'] as UserType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('userType', type)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.userType === type
                      ? 'border-[#141042] bg-[#141042]/5'
                      : 'border-[#E5E5DC] bg-white hover:border-[#141042]/30'
                  }`}
                >
                  <div className="font-semibold text-[#141042] capitalize mb-1">
                    {type === 'admin' && '👑 Admin'}
                    {type === 'recruiter' && '💼 Recrutador'}
                    {type === 'candidate' && '👤 Candidato'}
                  </div>
                  <div className="text-xs text-[#666666]">
                    {type === 'admin' && 'Acesso total ao sistema'}
                    {type === 'recruiter' && 'Gestão de vagas e candidatos'}
                    {type === 'candidate' && 'Busca de vagas e candidaturas'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="usuario@exemplo.com"
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
            <p className="text-xs text-[#666666] mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Uma senha segura será gerada automaticamente e enviada por e-mail ao usuário.
            </p>
          </div>

          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-semibold text-[#141042] mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Nome completo do usuário"
              className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
          </div>

          {/* Informações Adicionais */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#141042] mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
              />
            </div>

            {formData.userType === 'recruiter' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-[#141042] mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Nome da empresa"
                    className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#141042] mb-2">
                    Cargo/Posição
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="Ex: Recrutador Sênior, Headhunter, etc."
                    className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Informações sobre o tipo */}
          <div className="p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
            <h4 className="font-semibold text-[#141042] mb-2">
              ℹ️ Sobre o tipo "{formData.userType}"
            </h4>
            <ul className="text-sm text-[#666666] space-y-1">
              {formData.userType === 'admin' && (
                <>
                  <li>• Acesso completo ao painel administrativo</li>
                  <li>• Gerenciamento de usuários, tenants e configurações</li>
                  <li>• Visualização de logs de auditoria e eventos de segurança</li>
                </>
              )}
              {formData.userType === 'recruiter' && (
                <>
                  <li>• Acesso ao dashboard de recrutamento</li>
                  <li>• Criação e gestão de vagas</li>
                  <li>• Visualização e movimentação de candidatos no pipeline</li>
                  <li>• Acesso a relatórios e assessments</li>
                </>
              )}
              {formData.userType === 'candidate' && (
                <>
                  <li>• Acesso ao portal do candidato</li>
                  <li>• Busca e candidatura a vagas</li>
                  <li>• Gestão do perfil profissional</li>
                  <li>• Realização de assessments</li>
                </>
              )}
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: '',
                  fullName: '',
                  userType: 'recruiter',
                  phone: '',
                  company: '',
                  position: '',
                });
                setErrorMsg(null);
                setSuccessData(null);
              }}
              className="px-6 py-2 border border-[#E5E5DC] text-[#666666] rounded-lg hover:bg-[#FAFAF8] transition-colors"
            >
              Limpar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Criar Usuário</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Informações Importantes */}
      <div className="bg-[#3B82F6]/10 border border-[#3B82F6] rounded-lg p-4">
        <h4 className="font-semibold text-[#141042] mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-[#3B82F6]" />
          Informações Importantes
        </h4>
        <ul className="text-sm text-[#666666] space-y-1">
          <li>• O usuário será criado diretamente no Supabase Auth</li>
          <li>• Uma senha segura é gerada automaticamente (sem necessidade de informar)</li>
          <li>• A senha e as credenciais são enviadas por e-mail ao usuário via Brevo</li>
          <li>• A senha pode ser alterada pelo usuário após o primeiro login</li>
          <li>• O perfil será criado automaticamente em user_profiles</li>
        </ul>
      </div>
    </div>
  );
}
