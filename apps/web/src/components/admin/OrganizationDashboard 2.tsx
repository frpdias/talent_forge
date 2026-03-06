'use client';

import { useState, useEffect } from 'react';
import {
  Users, Briefcase, FileText, TrendingUp, Database, HardDrive,
  Activity, CheckCircle, X, Clock, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

interface OrganizationMetrics {
  org_id: string;
  org_name: string;
  candidates?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
  }[];
  business: {
    active_users: number;
    total_users: number;
    active_jobs: number;
    closed_jobs: number;
    total_jobs: number;
    total_applications: number;
    total_hires: number;
    conversion_rate: number;
  };
  database: {
    breakdown: {
      candidates: number;
      applications: number;
      jobs: number;
      assessments: number;
      pipeline_events: number;
      org_members: number;
    };
    total_records: number;
    estimated_size_bytes: number;
    estimated_size_mb: string;
  };
  storage: {
    buckets: any[];
    total_files: number;
    total_size_bytes: number;
    total_size_mb: number;
    usage_percentage: number;
    limit_gb: number;
  };
  activity: {
    applications_last_30d: number;
    jobs_created_last_30d: number;
    hires_last_30d: number;
    last_activity_at: string;
  };
  health: {
    status: string;
    plan: string;
    created_at: string;
    alerts: any[];
  };
}

interface Props {
  companyId: string;
  companyName: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function OrganizationDashboard({ companyId, companyName, isExpanded, onToggle }: Props) {
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && !metrics) {
      loadMetrics();
    }
  }, [isExpanded, companyId]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/metrics`);
      if (!response.ok) {
        throw new Error('Erro ao carregar métricas');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    active: { label: 'Ativo', color: 'text-green-600 bg-green-50', icon: CheckCircle },
    inactive: { label: 'Inativo', color: 'text-gray-600 bg-gray-50', icon: X },
    pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-50', icon: Clock },
    suspended: { label: 'Suspenso', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  };

  const planConfig: Record<string, { label: string; color: string }> = {
    free: { label: 'Gratuito', color: 'text-gray-600 bg-gray-50' },
    starter: { label: 'Starter', color: 'text-blue-600 bg-blue-50' },
    professional: { label: 'Professional', color: 'text-purple-600 bg-purple-50' },
    premium: { label: 'Premium', color: 'text-amber-600 bg-amber-50' },
  };

  return (
    <div className="border-t border-[#E5E5DC]">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-[#141042]">
          {isExpanded ? 'Ocultar Dashboard' : 'Ver Métricas Detalhadas'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#666666]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#666666]" />
        )}
      </button>

      {/* Dashboard Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#141042]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {metrics && (
            <div className="space-y-6">
              {/* 1. Métricas de Negócio */}
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Visão Geral do Negócio
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <Users className="w-5 h-5 text-blue-600 mb-1" />
                    <div className="text-2xl font-bold text-blue-900">{metrics.business.active_users}</div>
                    <div className="text-xs text-blue-700">Usuários Ativos</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <Briefcase className="w-5 h-5 text-purple-600 mb-1" />
                    <div className="text-2xl font-bold text-purple-900">{metrics.business.active_jobs}</div>
                    <div className="text-xs text-purple-700">Vagas Abertas</div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <FileText className="w-5 h-5 text-green-600 mb-1" />
                    <div className="text-2xl font-bold text-green-900">{metrics.business.total_applications}</div>
                    <div className="text-xs text-green-700">Candidaturas</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 mb-1" />
                    <div className="text-2xl font-bold text-amber-900">{metrics.business.total_hires}</div>
                    <div className="text-xs text-amber-700">Contratações ({metrics.business.conversion_rate}%)</div>
                  </div>
                </div>
              </div>

              {/* 2. Ocupação de Banco */}
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-3 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Ocupação de Banco de Dados
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-[#666666]">Candidatos</div>
                      <div className="text-lg font-semibold text-[#141042]">{metrics.database.breakdown.candidates}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666666]">Candidaturas</div>
                      <div className="text-lg font-semibold text-[#141042]">{metrics.database.breakdown.applications}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666666]">Vagas</div>
                      <div className="text-lg font-semibold text-[#141042]">{metrics.database.breakdown.jobs}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666666]">Assessments</div>
                      <div className="text-lg font-semibold text-[#141042]">{metrics.database.breakdown.assessments}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666666]">Eventos Pipeline</div>
                      <div className="text-lg font-semibold text-[#141042]">{metrics.database.breakdown.pipeline_events}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666666]">Membros</div>
                      <div className="text-lg font-semibold text-[#141042]">{metrics.database.breakdown.org_members}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#666666]">Total de Registros</span>
                      <span className="text-sm font-semibold text-[#141042]">{metrics.database.total_records}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-[#666666]">Tamanho Estimado</span>
                      <span className="text-sm font-semibold text-[#141042]">{metrics.database.estimated_size_mb} MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Ocupação de Storage */}
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-3 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Ocupação de Storage
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-center text-sm text-[#666666]">
                    {metrics.storage.buckets.length === 0 ? (
                      <div className="py-4">
                        <HardDrive className="w-8 h-8 text-[#999] mx-auto mb-2" />
                        <p>Nenhum arquivo armazenado</p>
                        <p className="text-xs mt-1">Storage será contabilizado quando configurado</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-[#141042] mb-1">
                          {metrics.storage.total_size_mb} MB
                        </div>
                        <div className="text-xs text-[#666666]">
                          {metrics.storage.total_files} arquivos / {metrics.storage.limit_gb} GB limite
                        </div>
                        <div className="mt-3 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(metrics.storage.usage_percentage, 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Timeline de Atividade */}
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Atividade (Últimos 30 dias)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-[#E5E5DC] rounded-lg p-3">
                    <div className="text-xs text-[#666666]">Novas Candidaturas</div>
                    <div className="text-2xl font-bold text-[#141042]">{metrics.activity.applications_last_30d}</div>
                  </div>
                  <div className="bg-white border border-[#E5E5DC] rounded-lg p-3">
                    <div className="text-xs text-[#666666]">Vagas Criadas</div>
                    <div className="text-2xl font-bold text-[#141042]">{metrics.activity.jobs_created_last_30d}</div>
                  </div>
                  <div className="bg-white border border-[#E5E5DC] rounded-lg p-3">
                    <div className="text-xs text-[#666666]">Contratações</div>
                    <div className="text-2xl font-bold text-[#141042]">{metrics.activity.hires_last_30d}</div>
                  </div>
                  <div className="bg-white border border-[#E5E5DC] rounded-lg p-3">
                    <div className="text-xs text-[#666666]">Última Atividade</div>
                    <div className="text-sm font-semibold text-[#141042]">{formatTimeAgo(metrics.activity.last_activity_at)}</div>
                  </div>
                </div>
              </div>

              {/* 5. Health & Status */}
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-3">Status da Conta</h4>
                <div className="bg-white border border-[#E5E5DC] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#666666] mb-1">Status</div>
                      {(() => {
                        const status = statusConfig[metrics.health.status] || statusConfig.active;
                        const StatusIcon = status.icon;
                        return (
                          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-sm ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span>{status.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <div className="text-xs text-[#666666] mb-1">Plano</div>
                      {(() => {
                        const plan = planConfig[metrics.health.plan] || planConfig.free;
                        return (
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${plan.color}`}>
                            {plan.label}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-[#666666]">Conta Criada</div>
                      <div className="text-sm font-medium text-[#141042]">
                        {new Date(metrics.health.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    {metrics.health.alerts.length > 0 && (
                      <div className="col-span-2 mt-2">
                        <div className="text-xs text-[#666666] mb-2">Alertas</div>
                        {metrics.health.alerts.map((alert: any, idx: number) => (
                          <div key={idx} className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-800">
                            {alert.message}
                          </div>
                        ))}
                      </div>
                    )}
                    {metrics.health.alerts.length === 0 && (
                      <div className="col-span-2 text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Nenhum alerta ativo
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Candidatos por Empresa */}
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Candidatos
                </h4>
                <div className="bg-white border border-[#E5E5DC] rounded-lg overflow-hidden">
                  {metrics.candidates && metrics.candidates.length > 0 ? (
                    <div className="divide-y divide-[#E5E5DC]">
                      {metrics.candidates.map((candidate) => (
                        <div key={candidate.id} className="px-4 py-3">
                          <div className="text-sm font-medium text-[#141042]">
                            {candidate.full_name || 'Sem nome'}
                          </div>
                          <div className="text-xs text-[#666666]">
                            {candidate.email || 'Sem email'}
                          </div>
                          {candidate.phone && (
                            <div className="text-xs text-[#999]">{candidate.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-[#666666]">Nenhum candidato vinculado.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
