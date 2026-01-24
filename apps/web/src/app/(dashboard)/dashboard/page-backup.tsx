'use client';
/*

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
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  FileText,
  UserPlus,
  Eye,
  Target,
  Activity,
  Zap,
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
*/

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
      trend: '+12%',
      trendUp: true,
      href: '/jobs',
    },
    {
      title: 'Total de Candidatos',
      value: stats?.totalCandidates || 0,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+8%',
      trendUp: true,
      href: '/candidates',
    },
    {
      title: 'Aplicações Pendentes',
      value: stats?.pendingApplications || 0,
      total: stats?.totalApplications || 0,
      label: 'de ' + (stats?.totalApplications || 0) + ' total',
      icon: ClipboardList,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      trend: '+5',
      trendUp: true,
      href: '/pipeline',
    },
    {
      title: 'Avaliações Concluídas',
      value: stats?.completedAssessments || 0,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+15%',
      trendUp: true,
      href: '/reports',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pb-16 lg:pb-0">
      <Header
        title="Dashboard"
        subtitle={`Bem-vindo de volta! Acompanhe suas métricas de recrutamento em ${currentOrg?.name || 'tempo real'}`}
        actions={
          <Link href="/jobs/new">
            <Button className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30">
              <Plus className="h-4 w-4 mr-2" />
              <span>Nova Vaga</span>
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-linear-to-r from-blue-600 to-indigo-600 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">Olá, Recrutador! 👋</h2>
                <p className="text-blue-100 text-sm">
                  Você tem {stats?.pendingApplications || 0} aplicações pendentes e {stats?.activeJobs || 0} vagas ativas
                </p>
              </div>
              <div className="hidden lg:flex gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 text-white mx-auto mb-1" />
                  <p className="text-white text-xs">Hoje</p>
                  <p className="text-white font-bold">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Activity className="h-6 w-6 text-white mx-auto mb-1" />
                  <p className="text-white text-xs">Status</p>
                  <p className="text-white font-bold">Ativo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 shadow-lg overflow-hidden relative">
                <div className={`absolute inset-0 bg-linear-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    {stat.trend && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${stat.trendUp ? '' : 'rotate-180'}`} />
                        {stat.trend}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <>
                          {stat.value}
                          {stat.total !== undefined && (
                            <span className="text-lg font-normal text-gray-400 ml-1">
                              / {stat.total}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                    {stat.label && (
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity - Full Width */}
        <Card className="border-0 shadow-lg">
            <div className="p-6 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Atividade Recente</h2>
                    <p className="text-xs text-gray-500">Últimas atualizações do sistema</p>
                  </div>
                </div>
                <Link href="/pipeline">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    Ver Tudo
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Carregando atividades...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-semibold mb-1">Nenhuma atividade ainda</p>
                  <p className="text-gray-500 text-sm">As atividades aparecerão aqui quando houver movimentação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentActivity.slice(0, 8).map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="p-5 hover:bg-linear-to-r hover:from-blue-50 hover:to-transparent transition-all group flex items-center gap-5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          {activity.type === 'application' && <FileText className="h-6 w-6 text-white" />}
                          {activity.type === 'assessment' && <CheckCircle className="h-6 w-6 text-white" />}
                          {activity.type === 'stage_change' && <Zap className="h-6 w-6 text-white" />}
                        </div>
                        {index < recentActivity.length - 1 && (
                          <div className="absolute top-12 left-6 w-0.5 h-10 bg-linear-to-b from-gray-200 to-transparent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-semibold mb-1 group-hover:text-blue-600 transition-colors">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(activity.createdAt)}
                          </span>
                          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-medium">
                            {activity.type === 'application' && '📝 Aplicação'}
                            {activity.type === 'assessment' && '✅ Avaliação'}
                            {activity.type === 'stage_change' && '⚡ Mudança de Etapa'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom Row: Quick Actions & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <div className="p-6 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Ações Rápidas</h2>
                    <p className="text-xs text-gray-500">Acesso rápido</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <Link href="/jobs/new">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Criar Nova Vaga
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/candidates/new">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Adicionar Candidato
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/pipeline">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Pipeline
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all group"
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Ver Relatórios
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg">
              <div className="p-6 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Performance</h2>
                    <p className="text-xs text-gray-500">Métricas do mês</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Taxa de Conversão</span>
                      <span className="text-sm font-bold text-green-600">75%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-linear-to-r from-green-500 to-green-600 h-2 rounded-full" 
                        style={{width: '75%'}}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Tempo Médio</span>
                      <span className="text-sm font-bold text-blue-600">18 dias</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-linear-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                        style={{width: '60%'}}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Satisfação</span>
                      <span className="text-sm font-bold text-purple-600">4.8/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-linear-to-r from-purple-500 to-purple-600 h-2 rounded-full" 
                        style={{width: '96%'}}
                      />
                    </div>
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
