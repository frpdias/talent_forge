'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Briefcase,
  Users,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

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

export default function DashboardPage() {
  const { currentOrg } = useOrgStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg?.id) {
      loadDashboardData();
    }
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

  const statCards = [
    {
      title: 'Vagas Ativas',
      value: stats?.activeJobs || 0,
      total: stats?.totalJobs || 0,
      icon: Briefcase,
      color: 'bg-blue-500',
      href: '/jobs',
    },
    {
      title: 'Candidatos',
      value: stats?.totalCandidates || 0,
      icon: Users,
      color: 'bg-green-500',
      href: '/candidates',
    },
    {
      title: 'Aplicações',
      value: stats?.pendingApplications || 0,
      total: stats?.totalApplications || 0,
      label: 'pendentes',
      icon: ClipboardList,
      color: 'bg-yellow-500',
      href: '/pipeline',
    },
    {
      title: 'Avaliações',
      value: stats?.completedAssessments || 0,
      label: 'concluídas',
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/reports',
    },
  ];

  return (
    <div className="min-h-screen pb-16 lg:pb-0">
      <Header
        title="Dashboard"
        subtitle={`Bem-vindo ao ${currentOrg?.name || 'TalentForge'}`}
        actions={
          <Link href="/jobs/new" className="hidden sm:block">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Vaga</span>
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                        {loading ? '...' : stat.value}
                        {stat.total !== undefined && (
                          <span className="text-xs sm:text-sm font-normal text-gray-400">
                            /{stat.total}
                          </span>
                        )}
                      </p>
                      {stat.label && (
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{stat.label}</p>
                      )}
                    </div>
                    <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color} shrink-0`}>
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Atividade Recente</h2>
            </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">Carregando...</div>
              ) : recentActivity.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
                  Nenhuma atividade recente
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 sm:mt-0 shrink-0" />
                      <p className="flex-1 text-xs sm:text-sm text-gray-700 line-clamp-2 sm:line-clamp-1">
                        {activity.description}
                      </p>
                      <span className="text-[10px] sm:text-xs text-gray-400 shrink-0">
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Ações Rápidas</h2>
            </div>
            <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              <Link href="/jobs/new" className="block">
                <Button variant="outline" className="w-full justify-between text-xs sm:text-sm py-2 sm:py-2.5">
                  <span>Criar Nova Vaga</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
              <Link href="/candidates/new" className="block">
                <Button variant="outline" className="w-full justify-between text-xs sm:text-sm py-2 sm:py-2.5">
                  <span>Adicionar Candidato</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
              <Link href="/reports" className="block">
                <Button variant="outline" className="w-full justify-between text-xs sm:text-sm py-2 sm:py-2.5">
                  <span>Ver Relatórios</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
