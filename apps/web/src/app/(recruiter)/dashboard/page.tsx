
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  ClipboardList,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle,
  type LucideIcon,
  Loader2,
} from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { reportsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  totalApplications: number;
  pendingApplications: number;
  completedAssessments: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'assessment' | 'stage_change';
  description?: string;
  candidateName?: string;
  jobTitle?: string;
  status?: string;
  createdAt: string;
}

interface ActiveJob {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
}

interface BottleneckStage {
  label: string;
  count: number;
}

interface StalledApplication {
  id: string;
  candidateName: string;
  jobTitle: string;
  days: number;
}

interface AlertItem {
  title: string;
  description: string;
  tone: 'warning' | 'danger' | 'info';
}

interface StatCardConfig {
  title: string;
  value: number;
  total?: number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color: 'blue' | 'green' | 'amber' | 'purple';
}

const colorClasses = {
  blue: {
    bg: 'bg-[#3B82F6]/10',
    icon: 'text-[#3B82F6]',
  },
  green: {
    bg: 'bg-[#10B981]/10',
    icon: 'text-[#10B981]',
  },
  amber: {
    bg: 'bg-[#F59E0B]/10',
    icon: 'text-[#F59E0B]',
  },
  purple: {
    bg: 'bg-[#8B5CF6]/10',
    icon: 'text-[#8B5CF6]',
  },
};

export default function DashboardPage() {
  const { currentOrg } = useOrgStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [bottleneckStages, setBottleneckStages] = useState<BottleneckStage[]>([]);
  const [stalledApplications, setStalledApplications] = useState<StalledApplication[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    void loadDashboardData();
    void loadActiveJobs();
  }, [currentOrg?.id]);

  const loadActiveJobs = async () => {
    try {
      setLoadingJobs(true);

      let orgId = currentOrg?.id || null;

      if (!orgId) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: orgMembership } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', userData.user.id)
            .limit(1)
            .maybeSingle();

          orgId = orgMembership?.org_id || null;
        }
      }

      if (!orgId) {
        setActiveJobs([]);
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, status, created_at')
        .eq('org_id', orgId)
        .in('status', ['open', 'on_hold'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Failed to load active jobs:', error);
        setActiveJobs([]);
        return;
      }

      setActiveJobs((data as ActiveJob[]) || []);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      let orgId = currentOrg?.id || null;
      if (!orgId) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: orgMembership } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', userData.user.id)
            .limit(1)
            .maybeSingle();

          orgId = orgMembership?.org_id || null;
        }
      }

      if (!orgId) {
        setStats({
          totalJobs: 0,
          activeJobs: 0,
          totalCandidates: 0,
          totalApplications: 0,
          pendingApplications: 0,
          completedAssessments: 0,
        });
        setRecentActivity([]);
        return;
      }

      const [jobsResult, candidatesResult] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, status', { count: 'exact', head: false })
          .eq('org_id', orgId),
        supabase
          .from('candidates')
          .select('id', { count: 'exact', head: false })
          .eq('owner_org_id', orgId),
      ]);

      const jobIds = (jobsResult.data || []).map((job: any) => job.id);
      const candidateIds = (candidatesResult.data || []).map((candidate: any) => candidate.id);

      const candidateIdsForAssessments = [...candidateIds];
      if (candidateIdsForAssessments.length === 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const fallbackCandidates = await supabase
            .from('candidates')
            .select('id', { count: 'exact', head: false })
            .eq('created_by', userData.user.id);
          candidateIdsForAssessments.push(
            ...(fallbackCandidates.data || []).map((candidate: any) => candidate.id)
          );
        }
      }

      const [applicationsResult, pendingApplicationsResult] = await Promise.all([
        jobIds.length > 0
          ? supabase
              .from('applications')
              .select('id', { count: 'exact', head: false })
              .in('job_id', jobIds)
          : Promise.resolve({ data: [], count: 0, error: null }),
        jobIds.length > 0
          ? supabase
              .from('applications')
              .select('id', { count: 'exact', head: false })
              .in('job_id', jobIds)
              .eq('status', 'applied')
          : Promise.resolve({ data: [], count: 0, error: null }),
      ]);

      let completedAssessments = 0;
      if (candidateIdsForAssessments.length > 0) {
        const completedResult = await supabase
          .from('assessments')
          .select('id', { count: 'exact', head: false })
          .in('candidate_id', candidateIdsForAssessments)
          .in('status', ['completed', 'reviewed']);

        if (completedResult.error) {
          const fallbackResult = await supabase
            .from('assessments')
            .select('id', { count: 'exact', head: false })
            .in('candidate_id', candidateIdsForAssessments);
          completedAssessments = fallbackResult.count ?? 0;
        } else {
          completedAssessments = completedResult.count ?? 0;
        }
      }

      const totalJobs = jobsResult.count ?? 0;
      const activeJobs = jobsResult.data
        ? jobsResult.data.filter((job: any) => job.status === 'open' || job.status === 'on_hold').length
        : 0;
      let totalCandidates = candidatesResult.count ?? 0;
      if (totalCandidates === 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const fallbackCandidates = await supabase
            .from('candidates')
            .select('id', { count: 'exact', head: false })
            .eq('created_by', userData.user.id);
          totalCandidates = fallbackCandidates.count ?? 0;
        }
      }
      const totalApplications = applicationsResult.count ?? 0;
      const pendingApplications = pendingApplicationsResult.count ?? 0;
      const statusLabel: Record<string, string> = {
        applied: 'Novas',
        in_process: 'Em Processo',
        hired: 'Contratado',
        rejected: 'Rejeitado',
      };

      if (jobIds.length > 0) {
        const { data: applicationsData } = await supabase
          .from('applications')
          .select('id, status, updated_at, created_at, job_id, candidates(full_name), jobs(title), pipeline_stages(name)')
          .in('job_id', jobIds);

        const stageCounts = new Map<string, number>();
        const stalled: StalledApplication[] = [];
        const appCountByJob = new Map<string, number>();
        const today = new Date();
        const thresholdDays = 7;

        (applicationsData || []).forEach((app: any) => {
          const label = app.pipeline_stages?.name || statusLabel[app.status] || app.status || 'Outros';
          stageCounts.set(label, (stageCounts.get(label) || 0) + 1);

          const updatedAt = app.updated_at || app.created_at;
          if (updatedAt) {
            const diffDays = Math.floor(
              (today.getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays >= thresholdDays) {
              stalled.push({
                id: app.id,
                candidateName: app.candidates?.full_name || 'Candidato',
                jobTitle: app.jobs?.title || 'Vaga',
                days: diffDays,
              });
            }
          }

          if (app.job_id) {
            appCountByJob.set(app.job_id, (appCountByJob.get(app.job_id) || 0) + 1);
          }
        });

        const sortedStages = Array.from(stageCounts.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setBottleneckStages(sortedStages);

        const sortedStalled = stalled
          .sort((a, b) => b.days - a.days)
          .slice(0, 5);
        setStalledApplications(sortedStalled);

        const alertsList: AlertItem[] = [];
        (jobsResult.data || []).forEach((job: any) => {
          const count = appCountByJob.get(job.id) || 0;
          if ((job.status === 'open' || job.status === 'on_hold') && count === 0) {
            alertsList.push({
              title: 'Vaga sem candidatos',
              description: `${job.title || 'Vaga'} sem candidaturas`,
              tone: 'warning',
            });
          }
        });

        if (sortedStalled.length > 0) {
          alertsList.push({
            title: 'Candidatos parados',
            description: `${sortedStalled.length} candidatos sem movimentação há ${thresholdDays}+ dias`,
            tone: 'danger',
          });
        }

        setAlerts(alertsList.slice(0, 4));
      } else {
        setBottleneckStages([]);
        setStalledApplications([]);
        setAlerts([]);
      }
      setStats({
        totalJobs,
        activeJobs,
        totalCandidates,
        totalApplications,
        pendingApplications,
        completedAssessments,
      });
      setRecentActivity([]);

      void (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;

          if (!token || !orgId) return;

          const response = await reportsApi.dashboard(token, orgId);
          const payload = (response as any)?.data ?? response;

          if (payload?.stats) {
            setStats(payload.stats);
            setRecentActivity(payload.recentActivity || []);
          }
        } catch (error) {
          console.error('Failed to load dashboard data (API):', error);
        }
      })();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCardConfig[] = [
    {
      title: 'Vagas Ativas',
      value: stats?.activeJobs ?? 0,
      total: stats?.totalJobs ?? 0,
      icon: Briefcase,
      trend: { value: 12, positive: true },
      color: 'blue',
    },
    {
      title: 'Candidatos',
      value: stats?.totalCandidates ?? 0,
      icon: Users,
      trend: { value: 8, positive: true },
      color: 'green',
    },
    {
      title: 'Aplicações Pendentes',
      value: stats?.pendingApplications ?? 0,
      total: stats?.totalApplications ?? 0,
      icon: ClipboardList,
      trend: { value: 3, positive: false },
      color: 'amber',
    },
    {
      title: 'Assessments',
      value: stats?.completedAssessments ?? 0,
      icon: TrendingUp,
      trend: { value: 24, positive: true },
      color: 'purple',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#141042] animate-spin" />
          <p className="text-[#666666]">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">
            {currentOrg?.name || 'Dashboard'}
          </h2>
          <p className="text-sm sm:text-base text-[#666666] mt-1">
            Acompanhe suas métricas de recrutamento em tempo real
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-[#E5E5DC] text-[#666666] rounded-lg hover:bg-[#FAFAF8] transition-colors">
            <Clock className="w-4 h-4" />
            <span>Último mês</span>
          </button>
          <Link href="/dashboard/jobs/new">
            <button className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Nova Vaga</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color];
          return (
            <div key={stat.title} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-[#666666]">
                    {stat.title}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-semibold text-[#141042]">
                      {stat.value}
                    </span>
                    {stat.total !== undefined && (
                      <span className="text-sm text-[#999]">
                        / {stat.total}
                      </span>
                    )}
                  </div>
                  {stat.trend && (
                    <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                      stat.trend.positive ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}>
                      {stat.trend.positive ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>{stat.trend.value}% vs mês anterior</span>
                    </div>
                  )}
                </div>
                <div className={`p-2.5 rounded-lg ${colors.bg}`}>
                  <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
          <h3 className="text-base font-semibold text-[#141042] mb-4">Gargalos por Etapa</h3>
          <div className="space-y-3">
            {bottleneckStages.length === 0 ? (
              <p className="text-sm text-[#666666]">Sem dados suficientes.</p>
            ) : (
              bottleneckStages.map((stage) => (
                <div key={stage.label} className="flex items-center justify-between">
                  <span className="text-sm text-[#141042]">{stage.label}</span>
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-[#FAFAF8] text-[#141042] rounded-full border border-[#E5E5DC]">
                    {stage.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
          <h3 className="text-base font-semibold text-[#141042] mb-4">Candidatos Parados</h3>
          <div className="space-y-3">
            {stalledApplications.length === 0 ? (
              <p className="text-sm text-[#666666]">Nenhum candidato parado.</p>
            ) : (
              stalledApplications.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#141042]">{item.candidateName}</p>
                    <p className="text-xs text-[#666666]">{item.jobTitle}</p>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] rounded-full">
                    {item.days} dias
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
          <h3 className="text-base font-semibold text-[#141042] mb-4">Alertas</h3>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-[#666666]">Sem alertas no momento.</p>
            ) : (
              alerts.map((alert, idx) => (
                <div key={`${alert.title}-${idx}`} className="rounded-lg border border-[#E5E5DC] bg-[#FAFAF8] p-3">
                  <p className="text-sm font-medium text-[#141042]">{alert.title}</p>
                  <p className="text-xs text-[#666666] mt-1">{alert.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

        {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#E5E5DC]">
              <h3 className="text-base font-semibold text-[#141042]">Atividade Recente</h3>
              <Link href="/dashboard/reports" className="text-sm text-[#141042] hover:underline flex items-center gap-1">
                Ver tudo
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#141042] animate-spin" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-[#FAFAF8] rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardList className="w-6 h-6 text-[#666666]" />
                  </div>
                  <p className="text-sm font-medium text-[#141042]">
                    Nenhuma atividade ainda
                  </p>
                  <p className="text-xs text-[#666666] mt-1">
                    As atividades aparecerão aqui conforme você usa a plataforma
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5DC]">
                  {recentActivity.slice(0, 5).map((activity) => {
                    const statusLabels: Record<string, string> = {
                      applied: 'Aplicada',
                      in_process: 'Em processo',
                      hired: 'Contratada',
                      rejected: 'Rejeitada',
                    };
                    const typeLabel =
                      activity.type === 'assessment'
                        ? 'Assessment'
                        : activity.type === 'stage_change'
                          ? 'Mudança de etapa'
                          : 'Candidatura';
                    const statusLabel = activity.status
                      ? statusLabels[activity.status] || activity.status
                      : null;
                    const title =
                      activity.description ||
                      `${typeLabel}${statusLabel ? ` ${statusLabel}` : ''}`;
                    const candidateLabel = activity.candidateName || 'Candidato';
                    const jobLabel = activity.jobTitle ? ` · ${activity.jobTitle}` : '';

                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF8] transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'application' ? 'bg-[#3B82F6]' :
                          activity.type === 'assessment' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#141042]">
                            {title}
                          </p>
                          <p className="text-xs text-[#666666]">
                            por {candidateLabel}{jobLabel}
                          </p>
                        </div>
                        <span className="text-xs text-[#666666] whitespace-nowrap">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
            <h3 className="text-base font-semibold text-[#141042] mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Link href="/dashboard/jobs/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E5DC] hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all group">
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg group-hover:bg-[#3B82F6]/20 transition-colors">
                    <Briefcase className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#141042]">
                      Criar Nova Vaga
                    </p>
                    <p className="text-xs text-[#666666]">
                      Publique uma nova oportunidade
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/candidates/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E5DC] hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all group">
                  <div className="p-2 bg-[#10B981]/10 rounded-lg group-hover:bg-[#10B981]/20 transition-colors">
                    <Users className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#141042]">
                      Adicionar Candidato
                    </p>
                    <p className="text-xs text-[#666666]">
                      Cadastre um novo talento
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/reports" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E5DC] hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-all group">
                  <div className="p-2 bg-[#8B5CF6]/10 rounded-lg group-hover:bg-[#8B5CF6]/20 transition-colors">
                    <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#141042]">
                      Ver Relatórios
                    </p>
                    <p className="text-xs text-[#666666]">
                      Analise suas métricas
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#141042]">Vagas Ativas</h3>
              <Link href="/dashboard/jobs" className="text-xs text-[#141042] hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="space-y-3">
              {loadingJobs ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-[#141042] animate-spin" />
                </div>
              ) : activeJobs.length === 0 ? (
                <div className="rounded-lg border border-[#E5E5DC] bg-[#FAFAF8] p-3 text-xs text-[#666666]">
                  Nenhuma vaga ativa encontrada.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-lg border border-[#E5E5DC] px-3 py-2 hover:bg-[#FAFAF8] transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#141042]">
                          {job.title || 'Vaga sem título'}
                        </p>
                        <p className="text-xs text-[#666666]">
                          {job.created_at ? formatDate(job.created_at) : 'Recente'} · {job.status === 'open' ? 'Ativa' : 'Em pausa'}
                        </p>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-[#666666]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tip Card */}
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FAFAF8] rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#141042]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#141042] mb-1">
                  Dica do dia
                </h4>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Utilize os assessments DISC para entender melhor o perfil comportamental dos candidatos e aumentar o fit cultural.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
