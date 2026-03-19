'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Users, Briefcase, Brain, CheckCircle, XCircle,
  Clock, Shield, Settings, ToggleLeft, ToggleRight, Loader2, AlertTriangle,
  Calendar, Activity
} from 'lucide-react';

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id: string | null;
  created_at: string;
  updated_at: string;
  users_count: number;
  jobs_count: number;
  php_active: boolean;
  members: { user_id: string; role: string; email: string; full_name: string | null }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Ativo', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  inactive: { label: 'Inativo', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  suspended: { label: 'Suspenso', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingPhp, setTogglingPhp] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTenant = useCallback(async () => {
    try {
      // Buscar dados do tenant via API de tenants
      const res = await fetch('/api/admin/tenants');
      const result = await res.json();

      if (!result.success) {
        setError('Erro ao carregar tenant');
        return;
      }

      const found = result.data?.find((t: TenantDetail) => t.id === tenantId);
      if (!found) {
        setError('Tenant não encontrado');
        return;
      }

      // Buscar membros
      const membersRes = await fetch(`/api/admin/tenants/${tenantId}/members`);
      let members: TenantDetail['members'] = [];
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        members = membersData.data || [];
      }

      setTenant({ ...found, members });
    } catch {
      setError('Erro ao carregar tenant');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const togglePhpModule = async () => {
    if (!tenant) return;
    setTogglingPhp(true);
    try {
      const method = tenant.php_active ? 'DELETE' : 'POST';
      const res = await fetch(`/api/admin/companies/${tenantId}/php-module`, { method });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao alterar módulo PHP');
        return;
      }

      setTenant(prev => prev ? { ...prev, php_active: !prev.php_active } : null);
      showSuccess(tenant.php_active ? 'Módulo PHP desativado' : 'Módulo PHP ativado com sucesso');
    } catch {
      setError('Erro ao alterar módulo PHP');
    } finally {
      setTogglingPhp(false);
    }
  };

  const toggleStatus = async () => {
    if (!tenant) return;
    setTogglingStatus(true);
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao alterar status');
        return;
      }

      setTenant(prev => prev ? { ...prev, status: newStatus } : null);
      showSuccess(`Tenant ${newStatus === 'active' ? 'ativado' : 'desativado'}`);
    } catch {
      setError('Erro ao alterar status');
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#141042] animate-spin" />
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <p className="text-[#666666]">{error}</p>
        <button
          onClick={() => router.push('/admin/tenants')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#141042] bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    );
  }

  if (!tenant) return null;

  const status = statusConfig[tenant.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && tenant && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/tenants')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#666666] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="h-6 w-px bg-[#E5E5DC]" />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#141042]/5 rounded-xl">
            <Building2 className="w-6 h-6 text-[#141042]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#141042]">{tenant.name}</h1>
            <p className="text-sm text-[#666666]">/{tenant.slug}</p>
          </div>
        </div>
        <div className="ml-auto">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${status.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="font-medium">{status.label}</span>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#3B82F6]" />
            <span className="text-xs text-[#666666]">Usuários</span>
          </div>
          <p className="text-2xl font-bold text-[#141042]">{tenant.users_count}</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-[#10B981]" />
            <span className="text-xs text-[#666666]">Vagas</span>
          </div>
          <p className="text-2xl font-bold text-[#141042]">{tenant.jobs_count}</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-[#8B5CF6]" />
            <span className="text-xs text-[#666666]">Módulo PHP</span>
          </div>
          <p className="text-2xl font-bold text-[#141042]">{tenant.php_active ? 'Ativo' : 'Inativo'}</p>
        </div>
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-xs text-[#666666]">Criado em</span>
          </div>
          <p className="text-lg font-bold text-[#141042]">{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Módulos */}
      <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#141042]" />
            <h2 className="text-lg font-semibold text-[#141042]">Módulos</h2>
          </div>
          <p className="text-sm text-[#666666] mt-1">Ative ou desative módulos para este tenant</p>
        </div>
        
        <div className="divide-y divide-[#E5E5DC]">
          {/* PHP Module */}
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tenant.php_active ? 'bg-[#8B5CF6]/10' : 'bg-gray-100'}`}>
                <Brain className={`w-6 h-6 ${tenant.php_active ? 'text-[#8B5CF6]' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-[#141042]">Módulo PHP — People, Health & Performance</h3>
                <p className="text-sm text-[#666666]">TFCI (30%) + NR-1 (40%) + COPC Adaptado (30%)</p>
                <p className="text-xs text-[#999] mt-1">Avaliação integrada de saúde ocupacional, clima e performance</p>
              </div>
            </div>
            <button
              onClick={togglePhpModule}
              disabled={togglingPhp}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                togglingPhp
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : tenant.php_active
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                    : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
              }`}
            >
              {togglingPhp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : tenant.php_active ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              {togglingPhp ? 'Processando...' : tenant.php_active ? 'Desativar' : 'Ativar'}
            </button>
          </div>

          {/* Módulo Recrutamento (sempre ativo) */}
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#10B981]/10">
                <Briefcase className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#141042]">Módulo Recrutamento</h3>
                <p className="text-sm text-[#666666]">Vagas, candidatos, pipeline, relatórios</p>
                <p className="text-xs text-[#999] mt-1">Módulo core — sempre ativo para todos os tenants</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Ativo
            </div>
          </div>

          {/* Módulo Gestão */}
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#3B82F6]/10">
                <Activity className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#141042]">Módulo Gestão</h3>
                <p className="text-sm text-[#666666]">Equipes, organograma, metas, resultados</p>
                <p className="text-xs text-[#999] mt-1">Módulo core — sempre ativo para todos os tenants</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Ativo
            </div>
          </div>
        </div>
      </div>

      {/* Status & Ações */}
      <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#141042]" />
            <h2 className="text-lg font-semibold text-[#141042]">Status & Ações</h2>
          </div>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#141042]">Status do Tenant</h3>
            <p className="text-sm text-[#666666]">
              {tenant.status === 'active'
                ? 'O tenant está ativo e operacional'
                : 'O tenant está desativado — usuários não conseguem acessar'}
            </p>
          </div>
          <button
            onClick={toggleStatus}
            disabled={togglingStatus}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              togglingStatus
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : tenant.status === 'active'
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  : 'bg-[#10B981] text-white hover:bg-[#059669]'
            }`}
          >
            {togglingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tenant.status === 'active' ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {togglingStatus ? 'Processando...' : tenant.status === 'active' ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>

      {/* Membros */}
      {tenant.members && tenant.members.length > 0 && (
        <div className="bg-white border border-[#E5E5DC] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#141042]" />
              <h2 className="text-lg font-semibold text-[#141042]">Membros ({tenant.members.length})</h2>
            </div>
          </div>
          <div className="divide-y divide-[#E5E5DC]">
            {tenant.members.map((member) => (
              <div key={member.user_id} className="px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#141042]/5 rounded-full flex items-center justify-center text-sm font-semibold text-[#141042]">
                    {(member.full_name || member.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#141042]">{member.full_name || member.email}</p>
                    {member.full_name && <p className="text-xs text-[#999]">{member.email}</p>}
                  </div>
                </div>
                <span className="text-xs font-medium text-[#666666] bg-[#FAFAF8] border border-[#E5E5DC] px-2.5 py-1 rounded-lg capitalize">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
