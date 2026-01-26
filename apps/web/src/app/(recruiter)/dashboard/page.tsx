
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
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
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
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    ring: 'ring-blue-100',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    ring: 'ring-emerald-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    ring: 'ring-amber-100',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    ring: 'ring-violet-100',
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

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="bg-white border-b border-border">
        <div className="pl-0 pr-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium text-tf-accent uppercase tracking-wider mb-1">
                Visão Geral
              </p>
              <h1 className="text-2xl font-semibold text-foreground">
                {currentOrg?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-foreground-muted mt-1">
                Acompanhe suas métricas de recrutamento em tempo real
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="md">
                <Clock className="w-4 h-4" />
                Último mês
              </Button>
              <Link href="/dashboard/jobs/new">
                <Button variant="primary" size="md" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Nova Vaga
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pl-0 pr-6 py-6 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const colors = colorClasses[stat.color];
            return (
              <Card key={stat.title} hover className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground-muted">
                        {stat.title}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-foreground">
                          {loading ? '—' : stat.value}
                        </span>
                        {!loading && stat.total !== undefined && (
                          <span className="text-sm text-gray-400">
                            / {stat.total}
                          </span>
                        )}
                      </div>
                      {stat.trend && !loading && (
                        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                          stat.trend.positive ? 'text-emerald-600' : 'text-red-600'
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
                    <div className={`p-2.5 rounded-lg ${colors.bg} ring-1 ${colors.ring}`}>
                      <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Gargalos por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bottleneckStages.length === 0 ? (
                <p className="text-sm text-foreground-muted">Sem dados suficientes.</p>
              ) : (
                bottleneckStages.map((stage) => (
                  <div key={stage.label} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{stage.label}</span>
                    <Badge>{stage.count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidatos Parados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stalledApplications.length === 0 ? (
                <p className="text-sm text-foreground-muted">Nenhum candidato parado.</p>
              ) : (
                stalledApplications.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.candidateName}</p>
                      <p className="text-xs text-foreground-muted">{item.jobTitle}</p>
                    </div>
                    <Badge variant="warning">{item.days} dias</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-foreground-muted">Sem alertas no momento.</p>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={`${alert.title}-${idx}`} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-foreground-muted mt-1">{alert.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Atividade Recente</CardTitle>
                <Link href="/dashboard/reports">
                  <Button variant="ghost" size="sm">
                    Ver tudo
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-tf-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Nenhuma atividade ainda
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">
                      As atividades aparecerão aqui conforme você usa a plataforma
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-(--divider)">
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
                          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'application' ? 'bg-blue-500' :
                            activity.type === 'assessment' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {title}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              por {candidateLabel}{jobLabel}
                            </p>
                          </div>
                          <span className="text-xs text-foreground-muted whitespace-nowrap">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/jobs/new" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-tf-accent hover:bg-tf-accent-subtle transition-all group">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Criar Nova Vaga
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Publique uma nova oportunidade
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/candidates/new" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Adicionar Candidato
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Cadastre um novo talento
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/reports" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-violet-500 hover:bg-violet-50 transition-all group">
                    <div className="p-2 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Ver Relatórios
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Analise suas métricas
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vagas Ativas</CardTitle>
                <Link href="/dashboard/jobs" className="text-xs text-tf-accent hover:underline">
                  Ver todas
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-tf-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activeJobs.length === 0 ? (
                  <div className="rounded-lg border border-border bg-gray-50 p-3 text-xs text-foreground-muted">
                    Nenhuma vaga ativa encontrada.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {job.title || 'Vaga sem título'}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {job.created_at ? formatDate(job.created_at) : 'Recente'} · {job.status === 'open' ? 'Ativa' : 'Em pausa'}
                          </p>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-foreground-muted" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tip Card */}
            <Card className="border border-border bg-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#F5F5F0] rounded-lg">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
