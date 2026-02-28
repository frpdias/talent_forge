'use client';

import { TrendingUp, TrendingDown, Users, Briefcase, Target, Clock } from 'lucide-react';

interface KPI {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: 'users' | 'briefcase' | 'target' | 'clock';
}

interface KPICardsProps {
  kpis: KPI[];
}

const iconMap = {
  users: Users,
  briefcase: Briefcase,
  target: Target,
  clock: Clock,
};

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon];
        const isPositive = kpi.changeType === 'increase';
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <div
            key={kpi.id}
            className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#3B82F6]/10 rounded-lg">
                <Icon className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(kpi.change)}%</span>
              </div>
            </div>

            <h3 className="text-sm text-[#666666] mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-[#141042]">{kpi.value}</p>
          </div>
        );
      })}
    </div>
  );
}
