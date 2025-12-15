'use client';

import { Users, Building2, Briefcase, Activity, TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';

const stats = [
  { label: 'Total Usuários', value: '12,847', change: '+12%', trend: 'up', icon: Users },
  { label: 'Organizações', value: '1,234', change: '+8%', trend: 'up', icon: Building2 },
  { label: 'Vagas Ativas', value: '3,456', change: '+24%', trend: 'up', icon: Briefcase },
  { label: 'Uptime', value: '99.9%', change: '', trend: 'stable', icon: Activity },
];

const recentActivity = [
  { type: 'user', message: 'Novo usuário registrado: maria@email.com', time: '2 min atrás', status: 'success' },
  { type: 'org', message: 'Nova organização criada: TechCorp', time: '15 min atrás', status: 'success' },
  { type: 'alert', message: 'Pico de requisições detectado', time: '1h atrás', status: 'warning' },
  { type: 'user', message: 'Conta verificada: joao@empresa.com', time: '2h atrás', status: 'success' },
  { type: 'system', message: 'Backup automático concluído', time: '3h atrás', status: 'success' },
];

const topOrganizations = [
  { name: 'TechCorp', users: 234, jobs: 45, candidates: 1200 },
  { name: 'StartupX', users: 156, jobs: 32, candidates: 890 },
  { name: 'MegaHR', users: 89, jobs: 67, candidates: 2340 },
  { name: 'RecrutaTech', users: 78, jobs: 23, candidates: 567 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">Visão Geral</h2>
        <p className="text-sm sm:text-base text-[#666666]">Monitoramento da plataforma TalentForge</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#141042]/5 rounded-lg sm:rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#141042]" />
              </div>
              {stat.change && (
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-green-600">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
            <p className="text-xl sm:text-3xl font-semibold text-[#141042] mb-1">{stat.value}</p>
            <p className="text-[#666666] text-xs sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#141042]">Atividade Recente</h3>
            <button className="text-xs sm:text-sm text-[#141042] font-medium hover:underline flex items-center">
              Ver tudo <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start space-x-2 sm:space-x-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  activity.status === 'success' ? 'bg-green-50' : 'bg-amber-50'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#141042] text-xs sm:text-sm truncate">{activity.message}</p>
                  <p className="text-[#999] text-[10px] sm:text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Organizations */}
        <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#141042]">Top Organizações</h3>
            <button className="text-xs sm:text-sm text-[#141042] font-medium hover:underline flex items-center">
              Ver tudo <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {topOrganizations.map((org, i) => (
              <div key={org.name} className="flex items-center justify-between p-3 sm:p-4 bg-[#FAFAF8] rounded-lg sm:rounded-xl hover:bg-[#F5F5F0] transition-colors cursor-pointer">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <span className="text-[#999] text-xs sm:text-sm w-5 sm:w-6">#{i + 1}</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#D9D9C6] rounded-lg sm:rounded-xl flex items-center justify-center text-[#453931] font-semibold text-sm sm:text-base shrink-0">
                    {org.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#141042] font-medium text-sm sm:text-base truncate">{org.name}</p>
                    <p className="text-[#666666] text-[10px] sm:text-xs">{org.users} usuários</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[#141042] text-xs sm:text-sm font-medium">{org.jobs} vagas</p>
                  <p className="text-[#666666] text-[10px] sm:text-xs">{org.candidates} cand.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-[#141042] mb-4 sm:mb-6">Status do Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { name: 'API', status: 'online', latency: '45ms' },
            { name: 'Database', status: 'online', latency: '12ms' },
            { name: 'Auth', status: 'online', latency: '23ms' },
            { name: 'Storage', status: 'online', latency: '89ms' },
          ].map((service) => (
            <div key={service.name} className="bg-[#FAFAF8] rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[#141042] font-medium text-sm sm:text-base">{service.name}</span>
              </div>
              <p className="text-[#666666] text-xs sm:text-sm">Latência: {service.latency}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
