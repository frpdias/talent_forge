'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, AlertTriangle, Clock, CheckCircle2, XCircle, Filter, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useCurrentOrg } from '@/lib/hooks/useCurrentOrg';

interface ActionPlan {
  id: string;
  title: string;
  description?: string;
  triggered_by: 'tfci' | 'nr1' | 'copc' | 'manual' | 'ai';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  due_date?: string;
  assigned_to?: string;
  created_at: string;
  items?: any[];
}

interface ActionPlanStats {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  by_risk_level: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  overdue_count: number;
}

const statusConfig = {
  open: { label: 'Aberto', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: BarChart3 },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const riskConfig = {
  low: { label: 'Baixo', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alto', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Crítico', color: 'bg-red-100 text-red-800' },
};

const sourceConfig = {
  tfci: { label: 'TFCI', color: 'bg-purple-100 text-purple-800' },
  nr1: { label: 'NR-1', color: 'bg-blue-100 text-blue-800' },
  copc: { label: 'COPC', color: 'bg-cyan-100 text-cyan-800' },
  manual: { label: 'Manual', color: 'bg-gray-100 text-gray-800' },
  ai: { label: 'IA', color: 'bg-indigo-100 text-indigo-800' },
};

export default function ActionPlansPage() {
  const { orgId, loading: orgLoading } = useCurrentOrg();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [stats, setStats] = useState<ActionPlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (orgId) {
      loadData(orgId);
    } else if (!orgLoading) {
      setLoading(false);
    }
  }, [orgId, orgLoading]);

  async function loadData(organizationId: string) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch action plans
    const { data: plansData } = await supabase
      .from('php_action_plans')
      .select('*, items:php_action_items(*)')
      .eq('org_id', organizationId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    setPlans(plansData || []);

    // Calculate stats
    const allPlans = plansData || [];
    const today = new Date().toISOString().split('T')[0];
    
    setStats({
      total: allPlans.length,
      by_status: {
        open: allPlans.filter(p => p.status === 'open').length,
        in_progress: allPlans.filter(p => p.status === 'in_progress').length,
        completed: allPlans.filter(p => p.status === 'completed').length,
        cancelled: allPlans.filter(p => p.status === 'cancelled').length,
      },
      by_risk_level: {
        low: allPlans.filter(p => p.risk_level === 'low').length,
        medium: allPlans.filter(p => p.risk_level === 'medium').length,
        high: allPlans.filter(p => p.risk_level === 'high').length,
        critical: allPlans.filter(p => p.risk_level === 'critical').length,
      },
      overdue_count: allPlans.filter(p => 
        p.due_date && 
        p.due_date < today && 
        !['completed', 'cancelled'].includes(p.status)
      ).length,
    });

    setLoading(false);
  }

  const filteredPlans = plans.filter(plan => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['open', 'in_progress'].includes(plan.status);
    if (filter === 'critical') return plan.risk_level === 'critical';
    if (filter === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      return plan.due_date && plan.due_date < today && !['completed', 'cancelled'].includes(plan.status);
    }
    return plan.status === filter;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planos de Ação</h1>
            <p className="text-gray-600 mt-1">
              Gerencie ações corretivas e preventivas do módulo PHP
            </p>
          </div>
          <Link
            href="/php/action-plans/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1e40af] transition-colors font-semibold"
          >
            <Plus className="w-4 h-4" />
            Novo Plano
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="text-sm text-gray-600 font-medium">Total</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="text-sm text-gray-600 font-medium">Ativos</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.by_status.open + stats.by_status.in_progress}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="text-sm text-gray-600 font-medium">Concluídos</div>
              <div className="text-2xl font-bold text-green-600">{stats.by_status.completed}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="text-sm text-gray-600 font-medium">Críticos</div>
              <div className="text-2xl font-bold text-red-600">{stats.by_risk_level.critical}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Atrasados
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.overdue_count}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Filtrar:</span>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Ativos' },
            { key: 'critical', label: 'Críticos' },
            { key: 'overdue', label: 'Atrasados' },
            { key: 'completed', label: 'Concluídos' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f.key
                  ? 'bg-[#1F4ED8] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Plans List */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {filteredPlans.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-2">
                <CheckCircle2 className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Nenhum plano encontrado</h3>
              <p className="text-gray-600 mt-1">
                {filter === 'all' 
                  ? 'Crie seu primeiro plano de ação clicando no botão acima.'
                  : 'Não há planos que correspondam ao filtro selecionado.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPlans.map(plan => {
                const StatusIcon = statusConfig[plan.status].icon;
                const isOverdue = plan.due_date && 
                  plan.due_date < new Date().toISOString().split('T')[0] && 
                  !['completed', 'cancelled'].includes(plan.status);

                return (
                  <Link
                    key={plan.id}
                    href={`/php/action-plans/${plan.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sourceConfig[plan.triggered_by].color}`}>
                            {sourceConfig[plan.triggered_by].label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${riskConfig[plan.risk_level].color}`}>
                            {riskConfig[plan.risk_level].label}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Atrasado
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate">{plan.title}</h3>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{plan.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Prioridade: {plan.priority}</span>
                          {plan.due_date && (
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              Vencimento: {new Date(plan.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {plan.items && plan.items.length > 0 && (
                            <span>{plan.items.length} item(s)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig[plan.status].color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[plan.status].label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
