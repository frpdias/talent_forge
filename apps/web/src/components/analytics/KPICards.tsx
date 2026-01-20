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
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(kpi.change)}%</span>
              </div>
            </div>

            <h3 className="text-sm text-gray-600 mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        );
      })}
    </div>
  );
}
