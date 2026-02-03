'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  X
} from 'lucide-react';
import Link from 'next/link';

interface ActionPlan {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  triggered_by: 'tfci' | 'nr1' | 'copc' | 'manual' | 'ai';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: number;
  due_date?: string;
  root_cause?: string;
  effectiveness_score?: number;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
  items?: ActionItem[];
}

interface ActionItem {
  id: string;
  action_plan_id: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  notes?: string;
  created_at: string;
}

const statusOptions = [
  { value: 'open', label: 'Aberto', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
];

const riskOptions = [
  { value: 'low', label: 'Baixo', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alto', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Crítico', color: 'bg-red-100 text-red-800' },
];

const sourceLabels: Record<string, string> = {
  tfci: 'TFCI',
  nr1: 'NR-1',
  copc: 'COPC',
  manual: 'Manual',
  ai: 'IA',
};

export default function ActionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function loadPlan() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('php_action_plans')
      .select('*, items:php_action_items(*)')
      .eq('id', planId)
      .single();

    if (error || !data) {
      setError('Plano de ação não encontrado');
    } else {
      setPlan(data);
    }
    setLoading(false);
  }

  async function updatePlan(updates: Partial<ActionPlan>) {
    if (!plan) return;
    setSaving(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Set completed_at if completing
    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('php_action_plans')
      .update(updateData)
      .eq('id', planId);

    if (error) {
      setError(error.message);
    } else {
      setPlan({ ...plan, ...updateData });
    }
    setSaving(false);
  }

  async function deletePlan() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('php_action_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      setError(error.message);
    } else {
      router.push('/php/action-plans');
    }
  }

  async function addItem() {
    if (!newItemDescription.trim() || !plan) return;
    setAddingItem(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('php_action_items')
      .insert({
        action_plan_id: planId,
        description: newItemDescription.trim(),
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setPlan({
        ...plan,
        items: [...(plan.items || []), data],
      });
      setNewItemDescription('');
    }
    setAddingItem(false);
  }

  async function updateItemStatus(itemId: string, status: string) {
    if (!plan) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('php_action_items')
      .update(updateData)
      .eq('id', itemId);

    if (!error) {
      setPlan({
        ...plan,
        items: plan.items?.map(item =>
          item.id === itemId ? { ...item, ...updateData } : item
        ),
      });
    }
  }

  async function deleteItem(itemId: string) {
    if (!plan) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('php_action_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      setPlan({
        ...plan,
        items: plan.items?.filter(item => item.id !== itemId),
      });
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">{error}</h2>
          <Link href="/php/action-plans" className="text-[#1F4ED8] hover:underline mt-4 inline-block">
            Voltar para Planos de Ação
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const isOverdue = plan.due_date && 
    plan.due_date < new Date().toISOString().split('T')[0] && 
    !['completed', 'cancelled'].includes(plan.status);

  const completedItems = plan.items?.filter(i => i.status === 'completed').length || 0;
  const totalItems = plan.items?.length || 0;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/php/action-plans"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1F4ED8] mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Planos de Ação
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                riskOptions.find(r => r.value === plan.risk_level)?.color
              }`}>
                {riskOptions.find(r => r.value === plan.risk_level)?.label}
              </span>
              <span className="text-xs text-gray-500">
                Origem: {sourceLabels[plan.triggered_by]}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3" />
                  Atrasado
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir plano"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Descrição</h3>
              <p className="text-gray-700">{plan.description || 'Sem descrição'}</p>
              
              {plan.root_cause && (
                <>
                  <h4 className="font-medium text-gray-900 mt-4 mb-2">Causa Raiz</h4>
                  <p className="text-gray-700">{plan.root_cause}</p>
                </>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Tarefas ({completedItems}/{totalItems})
                </h3>
                {totalItems > 0 && (
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(completedItems / totalItems) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Add Item */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newItemDescription}
                  onChange={e => setNewItemDescription(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder="Nova tarefa..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
                />
                <button
                  onClick={addItem}
                  disabled={!newItemDescription.trim() || addingItem}
                  className="flex items-center gap-1 px-3 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  {addingItem ? '...' : 'Adicionar'}
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {(plan.items || []).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma tarefa adicionada</p>
                ) : (
                  plan.items?.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <button
                        onClick={() => updateItemStatus(
                          item.id,
                          item.status === 'completed' ? 'open' : 'completed'
                        )}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {item.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 ${
                        item.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {item.description}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={plan.status}
                onChange={e => updatePlan({ status: e.target.value as any })}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8]"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
              <select
                value={plan.priority}
                onChange={e => updatePlan({ priority: parseInt(e.target.value) })}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8]"
              >
                <option value="1">1 - Máxima</option>
                <option value="2">2 - Alta</option>
                <option value="3">3 - Média</option>
                <option value="4">4 - Baixa</option>
                <option value="5">5 - Mínima</option>
              </select>
            </div>

            {/* Risk Level */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Risco</label>
              <select
                value={plan.risk_level}
                onChange={e => updatePlan({ risk_level: e.target.value as any })}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8]"
              >
                {riskOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Vencimento</label>
              <input
                type="date"
                value={plan.due_date || ''}
                onChange={e => updatePlan({ due_date: e.target.value || undefined })}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8]"
              />
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p>Criado em: {new Date(plan.created_at).toLocaleDateString('pt-BR')}</p>
              <p>Atualizado: {new Date(plan.updated_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Plano de Ação?</h3>
              <p className="text-gray-600 mb-4">
                Esta ação não pode ser desfeita. Todas as tarefas associadas também serão excluídas.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={deletePlan}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
