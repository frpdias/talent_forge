
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  ClipboardList,
  TrendingUp,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
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
  bgColor: string;
  iconColor: string;
}

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
      title: 'Vagas',
      value: stats?.activeJobs ?? 0,
      total: stats?.totalJobs ?? 0,
      icon: Briefcase,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Candidato',
      value: stats?.totalCandidates ?? 0,
      icon: Users,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Aplicações Pendentes',
      value: stats?.pendingApplications ?? 0,
      total: stats?.totalApplications ?? 0,
      icon: ClipboardList,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Avaliações Concluídas',
      value: stats?.completedAssessments ?? 0,
      icon: TrendingUp,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="w-full min-h-full">
      {/* Header Section */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-8 border-b border-gray-100">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm uppercase tracking-wide text-blue-600 font-semibold">Organização</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight wrap-break-word">
              {currentOrg?.name || 'Dashboard do Recrutador'}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl leading-relaxed wrap-break-word">
              Acompanhe vagas, candidatos e atividades em um único lugar com dados sempre atualizados.
            </p>
          </div>
          <div className="w-full 2xl:w-auto 2xl:min-w-100">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1 sm:min-w-70">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-base text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-gray-400 font-medium">
                  ⌘K
                </span>
              </div>
              <Link href="/jobs/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-base sm:text-lg px-6 py-3 h-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Vaga
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-gray-50 hover:shadow-lg transition-all duration-300 w-full overflow-hidden border border-gray-200 h-[94px]">
              <CardContent className="p-3 h-full flex items-center gap-3">
                <div className={`p-2 rounded-md shrink-0 ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="text-[11px] font-medium text-gray-500 leading-tight truncate">{stat.title}</h3>
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-[18px] font-bold text-gray-900 truncate leading-none">{loading ? '…' : stat.value}</span>
                    {!loading && stat.total !== undefined && (
                      <span className="text-[11px] text-gray-400 font-medium">/ {stat.total}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Activity Card */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 wrap-break-word">Atividade Recente</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1 wrap-break-word">Últimas movimentações de vagas e candidatos</p>
          </div>
          <Link href="/reports" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Ver Relatórios
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-base text-gray-500">Carregando atividades...</div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base text-gray-600 font-semibold mb-2">Nenhuma atividade ainda</p>
            <p className="text-sm text-gray-500">
              As atividades aparecerão aqui quando houver movimentação
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden"
              >
                <p className="text-sm sm:text-base text-gray-800 leading-relaxed wrap-break-word min-w-0 flex-1">{activity.description}</p>
                <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{formatDate(activity.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/jobs/new" className="block">
            <Card className="bg-gray-50 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-200 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-900 wrap-break-word min-w-0 flex-1">Criar Nova Vaga</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/candidates/new" className="block">
            <Card className="bg-gray-50 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-green-200 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-green-100 rounded-xl shrink-0">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-900 wrap-break-word min-w-0 flex-1">Adicionar Candidato</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports" className="block">
            <Card className="bg-gray-50 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-purple-200 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-purple-100 rounded-xl shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-900 wrap-break-word min-w-0 flex-1">Ver Relatórios</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
