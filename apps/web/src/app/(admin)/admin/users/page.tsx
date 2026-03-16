'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, UserCheck, Briefcase, Mail, Calendar, Loader2, Shield, UserPlus, SendHorizonal, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  created_at: string;
  phone: string | null;
  location: string | null;
  email_verified: boolean;
  last_sign_in: string | null;
  organizations?: { id: string; name: string }[];
}

type TabType = 'all' | 'recruiter' | 'candidate' | 'admin';

interface ResendFeedback {
  userId: string;
  success: boolean;
  msg: string;
  tempPassword?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ResendFeedback | null>(null);

  async function handleResendEmail(user: User) {
    setSendingId(user.id);
    setFeedback(null);
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
          userId: user.id,
          email: user.email,
          fullName: user.full_name || user.email,
          userType: user.user_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback({
        userId: user.id,
        success: true,
        msg: data.emailSent
          ? `E-mail enviado para ${user.email}`
          : `E-mail não enviado — copie a senha temporária`,
        tempPassword: data.tempPassword,
      });
    } catch (err: any) {
      setFeedback({ userId: user.id, success: false, msg: err.message || 'Erro ao reenviar' });
    } finally {
      setSendingId(null);
      // Auto-limpa toast após 8s
      setTimeout(() => setFeedback(null), 8000);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || user.user_type === activeTab;
    return matchesSearch && matchesTab;
  });

  const counts = {
    all: users.length,
    recruiter: users.filter(u => u.user_type === 'recruiter').length,
    candidate: users.filter(u => u.user_type === 'candidate').length,
    admin: users.filter(u => u.user_type === 'admin').length,
  };

  const tabs: { key: TabType; label: string; icon: typeof Users }[] = [
    { key: 'all', label: 'Todos', icon: Users },
    { key: 'recruiter', label: 'Recrutadores', icon: Briefcase },
    { key: 'candidate', label: 'Candidatos', icon: UserCheck },
    { key: 'admin', label: 'Admins', icon: Shield },
  ];

  const userTypeConfig: Record<string, { label: string; color: string }> = {
    recruiter: { label: 'Recrutador', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    candidate: { label: 'Candidato', color: 'bg-green-50 text-green-700 border-green-200' },
    admin: { label: 'Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">

      {/* Toast de feedback */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm w-full shadow-xl rounded-xl border p-4 transition-all ${
          feedback.success ? 'bg-white border-[#10B981]' : 'bg-white border-[#EF4444]'
        }`}>
          <div className="flex items-start gap-3">
            {feedback.success
              ? <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#141042]">{feedback.msg}</p>
              {feedback.tempPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="bg-[#FAFAF8] border border-[#E5E5DC] rounded px-2 py-1 text-xs font-mono font-bold text-[#141042] tracking-widest">
                    {feedback.tempPassword}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(feedback.tempPassword!)}
                    className="text-xs text-[#3B82F6] hover:underline shrink-0"
                  >Copiar</button>
                </div>
              )}
            </div>
            <button onClick={() => setFeedback(null)} className="text-[#999] hover:text-[#141042] shrink-0">
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">Usuários</h2>
          <p className="text-sm text-[#666666]">Gerenciar todos os usuários da plataforma</p>
        </div>
        <Link
          href="/admin/create-user"
          className="flex items-center gap-2 px-4 py-2 bg-[#141042] text-white text-sm font-medium rounded-xl hover:bg-[#1a1660] transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Criar Usuário
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-[#141042]">{counts.all}</p>
          <p className="text-sm text-[#666666]">Total</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-blue-600">{counts.recruiter}</p>
          <p className="text-sm text-[#666666]">Recrutadores</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-green-600">{counts.candidate}</p>
          <p className="text-sm text-[#666666]">Candidatos</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <p className="text-2xl font-semibold text-purple-600">{counts.admin}</p>
          <p className="text-sm text-[#666666]">Admins</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[#141042] text-white'
                : 'bg-white border border-[#E5E5DC] text-[#666666] hover:bg-[#F5F5F0]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-white/20' : 'bg-[#F5F5F0]'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E5DC] bg-[#FAFAF8]">
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#141042]">Usuário</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#141042]">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#141042]">Tipo</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#141042]">Empresa</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#141042]">Cadastro</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#141042]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-[#141042] animate-spin mb-4" />
                      <p className="text-[#666666]">Carregando usuários...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-[#999] mx-auto mb-4" />
                    <p className="text-[#666666]">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const typeConfig = userTypeConfig[user.user_type] || { label: user.user_type, color: 'bg-gray-50 text-gray-700 border-gray-200' };
                  return (
                    <tr key={user.id} className="border-b border-[#E5E5DC] hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#141042] rounded-xl flex items-center justify-center text-white font-medium">
                            {(user.full_name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#141042]">
                              {user.full_name || 'Sem nome'}
                            </p>
                            {user.location && (
                              <p className="text-xs text-[#999]">{user.location}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-[#999]" />
                          <span className="text-sm text-[#666666]">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#666666]">
                          {user.organizations && user.organizations.length > 0
                            ? user.organizations.map((org) => org.name).join(', ')
                            : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-[#666666]">
                          <Calendar className="w-4 h-4 text-[#999]" />
                          <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleResendEmail(user)}
                          disabled={sendingId === user.id}
                          title="Gera nova senha e reenvia as credenciais por e-mail"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B82F6] border border-[#3B82F6]/30 rounded-lg hover:bg-[#3B82F6]/5 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {sendingId === user.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <SendHorizonal className="w-3.5 h-3.5" />}
                          {sendingId === user.id ? 'Enviando...' : 'Reenviar e-mail'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
