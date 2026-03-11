'use client';

import { useState } from 'react';
import { UserPlus, Mail, User, Lock, Building2, Phone, Calendar, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type UserType = 'admin' | 'recruiter' | 'candidate';

interface FormData {
  email: string;
  password: string;
  fullName: string;
  userType: UserType;
  phone: string;
  company: string;
  position: string;
}

export default function CreateUserPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: '',
    userType: 'recruiter',
    phone: '',
    company: '',
    position: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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

      setMessage({
        type: 'success',
        text: `Usuário ${formData.email} criado com sucesso! ID: ${data.userId}`,
      });

      // Limpar formulário
      setFormData({
        email: '',
        password: '',
        fullName: '',
        userType: 'recruiter',
        phone: '',
        company: '',
        position: '',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao criar usuário',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-[#141042]" />
          Criar Novo Usuário
        </h2>
        <p className="text-sm sm:text-base text-[#666666] mt-1">
          Cadastre novos usuários diretamente no sistema (Admin, Recrutadores, Candidatos)
        </p>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
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

          {/* Informações Básicas */}
          <div className="grid sm:grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#141042] mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Senha *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
              />
              <p className="text-xs text-[#666666] mt-1">Mínimo de 6 caracteres</p>
            </div>
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
                  password: '',
                  fullName: '',
                  userType: 'recruiter',
                  phone: '',
                  company: '',
                  position: '',
                });
                setMessage(null);
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
          <li>• Um email de confirmação será enviado automaticamente</li>
          <li>• A senha pode ser alterada pelo usuário após o primeiro login</li>
          <li>• O perfil será criado automaticamente em user_profiles</li>
        </ul>
      </div>
    </div>
  );
}
