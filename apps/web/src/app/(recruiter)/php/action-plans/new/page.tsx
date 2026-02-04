'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type TriggeredBy = 'tfci' | 'nr1' | 'copc' | 'manual' | 'ai';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export default function NewActionPlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    triggered_by: 'manual' as TriggeredBy,
    risk_level: 'medium' as RiskLevel,
    root_cause: '',
    priority: 3,
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get user and org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: member } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!member?.org_id) throw new Error('Organização não encontrada');

      // Create action plan
      const { data, error: insertError } = await supabase
        .from('php_action_plans')
        .insert({
          org_id: member.org_id,
          title: form.title,
          description: form.description || null,
          triggered_by: form.triggered_by,
          risk_level: form.risk_level,
          root_cause: form.root_cause || null,
          priority: form.priority,
          due_date: form.due_date || null,
          status: 'open',
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/php/action-plans/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar plano de ação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/php/action-plans"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1F4ED8] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Planos de Ação
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Novo Plano de Ação</h1>
          <p className="text-gray-600 mt-1">
            Crie um plano para resolver problemas identificados no módulo PHP
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              placeholder="Ex: Reduzir risco de burnout na equipe de vendas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              placeholder="Descreva o problema e o objetivo do plano..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem *
              </label>
              <select
                required
                value={form.triggered_by}
                onChange={e => setForm({ ...form, triggered_by: e.target.value as TriggeredBy })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              >
                <option value="manual">Manual</option>
                <option value="tfci">TFCI (Comportamental)</option>
                <option value="nr1">NR-1 (Saúde)</option>
                <option value="copc">COPC (Performance)</option>
                <option value="ai">Sugestão IA</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nível de Risco *
              </label>
              <select
                required
                value={form.risk_level}
                onChange={e => setForm({ ...form, risk_level: e.target.value as RiskLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              >
                <option value="low">Baixo</option>
                <option value="medium">Médio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade (1-5) *
              </label>
              <select
                required
                value={form.priority}
                onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              >
                <option value="1">1 - Máxima</option>
                <option value="2">2 - Alta</option>
                <option value="3">3 - Média</option>
                <option value="4">4 - Baixa</option>
                <option value="5">5 - Mínima</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Causa Raiz
            </label>
            <textarea
              rows={2}
              value={form.root_cause}
              onChange={e => setForm({ ...form, root_cause: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
              placeholder="Qual é a causa raiz do problema identificado?"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link
              href="/php/action-plans"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || !form.title}
              className="flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1e40af] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
