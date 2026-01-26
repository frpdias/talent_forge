'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Briefcase,
  Users,
  ClipboardList,
  TrendingUp,
  Plus,
  Clock,
  ArrowRight,
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
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      href: '/jobs',
    },
    {
      title: 'Total de Candidatos',
      value: stats?.totalCandidates || 0,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      href: '/candidates',
    },
    {
      title: 'Aplicações Pendentes',
      value: stats?.pendingApplications || 0,
      total: stats?.totalApplications || 0,
      icon: ClipboardList,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      href: '/pipeline',
    },
    {
      title: 'Avaliações Concluídas',
      value: stats?.completedAssessments || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      href: '/reports',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header
        title="Dashboard"
        subtitle={`Bem-vindo! Acompanhe suas métricas de recrutamento`}
        actions={
          <Link href="/jobs/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? '...' : stat.value}
                      {stat.total !== undefined && (
                        <span className="text-lg font-normal text-gray-400 ml-1">
                          / {stat.total}
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Atividade Recente</h2>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">Carregando...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <p className="flex-1 text-sm text-gray-700">{activity.description}</p>
                    <span className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/jobs/new">
            <Button variant="outline" className="w-full justify-between">
              <span>Criar Nova Vaga</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/candidates/new">
            <Button variant="outline" className="w-full justify-between">
              <span>Adicionar Candidato</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full justify-between">
              <span>Ver Relatórios</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
