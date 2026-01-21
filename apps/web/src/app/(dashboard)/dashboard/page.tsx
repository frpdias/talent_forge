
'use client';

import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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
  description: string;
  createdAt: string;
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

  useEffect(() => {
    if (!currentOrg?.id) {
      return;
    }
    void loadDashboardData();
  }, [currentOrg?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.reports.getDashboard();
      if (response.data) {
        setStats((response.data as any).stats);
        setRecentActivity((response.data as any).recentActivity || []);
      }
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
      <div className="bg-white border-b border-[var(--border)]">
        <div className="pl-0 pr-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--tf-accent)] uppercase tracking-wider mb-1">
                Visão Geral
              </p>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                {currentOrg?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
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
                      <p className="text-sm font-medium text-[var(--foreground-muted)]">
                        {stat.title}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-[var(--foreground)]">
                          {loading ? '—' : stat.value}
                        </span>
                        {!loading && stat.total !== undefined && (
                          <span className="text-sm text-[var(--tf-gray-400)]">
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
                    <div className="w-6 h-6 border-2 border-[var(--tf-accent)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-[var(--tf-gray-100)] rounded-full flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="w-6 h-6 text-[var(--tf-gray-400)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Nenhuma atividade ainda
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      As atividades aparecerão aqui conforme você usa a plataforma
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--divider)]">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--tf-gray-50)] transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'application' ? 'bg-blue-500' :
                          activity.type === 'assessment' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        <p className="flex-1 text-sm text-[var(--foreground)]">
                          {activity.description}
                        </p>
                        <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    ))}
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
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--tf-accent)] hover:bg-[var(--tf-accent-subtle)] transition-all group">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Criar Nova Vaga
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Publique uma nova oportunidade
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/candidates/new" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Adicionar Candidato
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Cadastre um novo talento
                      </p>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/reports" className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-violet-500 hover:bg-violet-50 transition-all group">
                    <div className="p-2 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                      <TrendingUp className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Ver Relatórios
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Analise suas métricas
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Tip Card */}
            <Card className="bg-gradient-to-br from-[var(--tf-primary)] to-[var(--tf-primary-hover)] border-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Dica do dia
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed">
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
