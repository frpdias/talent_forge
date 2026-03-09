'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, X, BarChart3, Calculator,
  DollarSign, Factory, ClipboardList, Phone, Monitor,
  Users, Briefcase, Wallet, Megaphone, Settings, Cpu,
  type LucideIcon,
} from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { getAuthToken } from '@/lib/supabase/client';

/* ─── Types ───────────────────────────────────────────────────────── */
interface CatalogMetric {
  id: string;
  category: string;
  metric_name: string;
  metric_code: string;
  weight: number;
  unit: string;
  department: string | null;
  description: string | null;
  min_value: number;
  max_value: number;
  higher_is_better: boolean;
  target_value: number | null;
  display_order: number;
}

interface MetricEntry {
  id: string;
  catalog_metric_id: string;
  department: string;
  metric_date: string;
  value: number;
  notes: string | null;
  catalog?: CatalogMetric;
}

interface DeptScore {
  department: string;
  quality_score: number | null;
  efficiency_score: number | null;
  effectiveness_score: number | null;
  cx_score: number | null;
  people_score: number | null;
  overall_score: number;
  total_entries: number;
  metric_date: string;
}

/* ─── Department icon + color mapping (Design System) ─────── */
interface DeptStyle {
  icon: LucideIcon;
  bg: string;
  text: string;
}

const DEPT_STYLES: Record<string, DeptStyle> = {
  Vendas:             { icon: DollarSign,    bg: 'bg-emerald-100', text: 'text-emerald-600' },
  Produção:           { icon: Factory,       bg: 'bg-orange-100',  text: 'text-orange-600' },
  Administrativo:     { icon: ClipboardList, bg: 'bg-blue-100',    text: 'text-blue-600' },
  Administração:      { icon: ClipboardList, bg: 'bg-blue-100',    text: 'text-blue-600' },
  Atendimento:        { icon: Phone,         bg: 'bg-violet-100',  text: 'text-violet-600' },
  TI:                 { icon: Monitor,       bg: 'bg-indigo-100',  text: 'text-indigo-600' },
  'Recursos Humanos': { icon: Users,         bg: 'bg-rose-100',    text: 'text-rose-600' },
  RH:                 { icon: Users,         bg: 'bg-rose-100',    text: 'text-rose-600' },
  Comercial:          { icon: Briefcase,     bg: 'bg-sky-100',     text: 'text-sky-600' },
  Financeiro:         { icon: Wallet,        bg: 'bg-teal-100',    text: 'text-teal-600' },
  Marketing:          { icon: Megaphone,     bg: 'bg-amber-100',   text: 'text-amber-600' },
  Operações:          { icon: Settings,      bg: 'bg-slate-100',   text: 'text-slate-600' },
  Tecnologia:         { icon: Cpu,           bg: 'bg-purple-100',  text: 'text-purple-600' },
};

const DEFAULT_STYLE: DeptStyle = { icon: BarChart3, bg: 'bg-[#141042]/10', text: 'text-[#141042]' };

const getDeptStyle = (dept: string): DeptStyle => DEPT_STYLES[dept] || DEFAULT_STYLE;

const DeptIconBox = ({ dept }: { dept: string }) => {
  const { icon: Icon, bg, text } = getDeptStyle(dept);
  return (
    <div className={`p-2 ${bg} rounded-lg shrink-0`}>
      <Icon className={`w-5 h-5 ${text}`} />
    </div>
  );
};

const DeptIconInline = ({ dept, size = 'w-4 h-4' }: { dept: string; size?: string }) => {
  const { icon: Icon, text } = getDeptStyle(dept);
  return <Icon className={`${size} ${text}`} />;
};

const CATEGORY_LABELS: Record<string, string> = {
  quality: 'Qualidade',
  efficiency: 'Eficiência',
  effectiveness: 'Efetividade',
  cx: 'Experiência',
  people: 'Pessoas',
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  quality: 35,
  efficiency: 20,
  effectiveness: 20,
  cx: 15,
  people: 10,
};

const CATEGORY_COLORS: Record<string, string> = {
  quality: 'bg-blue-50 text-blue-700 border-blue-200',
  efficiency: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  effectiveness: 'bg-violet-50 text-violet-700 border-violet-200',
  cx: 'bg-amber-50 text-amber-700 border-amber-200',
  people: 'bg-rose-50 text-rose-700 border-rose-200',
};

/* ─── Page ────────────────────────────────────────────────────────── */
export default function CopcAreasPage() {
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const orgId = phpContextOrgId || currentOrg?.id;

  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [catalogDepts, setCatalogDepts] = useState<Set<string>>(new Set());
  const [catalog, setCatalog] = useState<CatalogMetric[]>([]);
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [deptScores, setDeptScores] = useState<Record<string, DeptScore>>({});

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* ─── Data Loading ─────────────────────────────────────────────── */
  const loadCatalog = useCallback(async () => {
    if (!orgId) return;
    const token = await getAuthToken() ?? '';
    const deptParam = activeDept ? `&department=${encodeURIComponent(activeDept)}` : '';
    const res = await fetch(`/api/v1/php/copc/catalog?org_id=${orgId}${deptParam}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
    });
    if (res.ok) {
      const data = await res.json();
      setCatalog(data.metrics || []);
      if (data.departments?.length) setDepartments(data.departments);
      if (data.catalog_departments) setCatalogDepts(new Set(data.catalog_departments));
    }
  }, [orgId, activeDept]);

  const loadEntries = useCallback(async () => {
    if (!orgId) return;
    const token = await getAuthToken() ?? '';
    const deptParam = activeDept ? `&department=${encodeURIComponent(activeDept)}` : '';
    const res = await fetch(`/api/v1/php/copc/entries?org_id=${orgId}${deptParam}&limit=100`, {
      headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
    });
    if (res.ok) {
      const data = await res.json();
      setEntries(data || []);
    }
  }, [orgId, activeDept]);

  const loadScores = useCallback(async () => {
    if (!orgId) return;
    const token = await getAuthToken() ?? '';
    const deptParam = activeDept ? `?department=${encodeURIComponent(activeDept)}` : '';
    const res = await fetch(`/api/v1/php/copc/scores/${orgId}${deptParam}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-org-id': orgId },
    });
    if (res.ok) {
      const data = await res.json();
      setDeptScores(data.by_department || {});
      if (!activeDept && data.departments?.length) {
        setDepartments(prev => {
          const merged = [...new Set([...prev, ...data.departments])];
          return merged.sort();
        });
      }
    }
  }, [orgId, activeDept]);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([loadCatalog(), loadEntries(), loadScores()])
      .finally(() => setLoading(false));
  }, [orgId, activeDept, loadCatalog, loadEntries, loadScores]);

  /* ─── Form Helpers ─────────────────────────────────────────────── */
  const deptCatalog = catalog.filter(m =>
    activeDept ? m.department === activeDept || m.department === null : true
  );

  const byCategory = deptCatalog.reduce<Record<string, CatalogMetric[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  const handleSave = async () => {
    if (!orgId || !activeDept) return;
    setSaving(true);
    setSaveMsg(null);

    const entriesToSave = Object.entries(formValues)
      .filter(([, v]) => v !== '' && !isNaN(Number(v)))
      .map(([catalogId, value]) => ({
        catalog_metric_id: catalogId,
        department: activeDept,
        metric_date: formDate,
        value: Number(value),
      }));

    if (entriesToSave.length === 0) {
      setSaveMsg({ type: 'err', text: 'Preencha pelo menos um indicador.' });
      setSaving(false);
      return;
    }

    try {
      const token = await getAuthToken() ?? '';
      const res = await fetch('/api/v1/php/copc/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': orgId,
        },
        body: JSON.stringify(entriesToSave),
      });

      if (res.ok) {
        const data = await res.json();
        const count = data.length || entriesToSave.length;
        setSaveMsg({ type: 'ok', text: `${count} indicador(es) salvo(s) com sucesso!` });
        setFormValues({});
        setShowForm(false);
        // Reload
        await Promise.all([loadEntries(), loadScores()]);
      } else {
        const err = await res.json();
        setSaveMsg({ type: 'err', text: err.error || 'Erro ao salvar' });
      }
    } catch {
      setSaveMsg({ type: 'err', text: 'Erro de rede' });
    }
    setSaving(false);
  };

  /* ─── Score helpers ────────────────────────────────────────────── */
  const scoreColor = (s: number | null): string => {
    if (s === null) return 'text-[#999999]';
    if (s >= 80) return 'text-[#10B981]';
    if (s >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const scoreBg = (s: number): string => {
    if (s >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (s >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  /* ─── Render ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042] mx-auto" />
          <p className="mt-4 text-[#666666]">Carregando KPIs por área...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 md:py-8 px-0 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/php/copc" className="flex items-center gap-1.5 text-[#666666] hover:text-[#141042] transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                COPC Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-[#141042]">KPIs por Área</h1>
            <p className="text-[#666666] mt-1">
              Indicadores dinâmicos adaptados para cada departamento
            </p>
          </div>
          {activeDept && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1D1A5A] transition-all shadow-sm shrink-0"
            >
              {showForm ? (
                <><X className="w-4 h-4" /> Fechar</>
              ) : (
                <><Plus className="w-5 h-5" /> Registrar Indicadores</>
              )}
            </button>
          )}
        </div>

        {/* Department Selector */}
        <div className="mb-6">
          <p className="text-xs text-[#999999] mb-2">
            Departamentos carregados da estrutura da organização
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveDept(null)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                !activeDept
                  ? 'bg-[#141042] text-white border-[#141042]'
                  : 'bg-white text-[#666666] border-[#E5E5DC] hover:border-[#141042] hover:text-[#141042]'
              }`}
            >
              Todas as Áreas
            </button>
            {departments.map(dept => {
              const hasTemplates = catalogDepts.has(dept);
              const { icon: DIcon, text: dtc } = getDeptStyle(dept);
              const isActive = activeDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#141042] text-white border-[#141042]'
                      : 'bg-white text-[#666666] border-[#E5E5DC] hover:border-[#141042] hover:text-[#141042]'
                  }`}
                >
                  <DIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : dtc}`} />
                  {dept}
                  {!hasTemplates && (
                    <span className="ml-1.5 text-[10px] opacity-60" title="Sem KPIs específicos — usando genéricos">
                      (genérico)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success/Error Message */}
        {saveMsg && (
          <div className={`mb-6 p-4 rounded-xl border ${
            saveMsg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {saveMsg.text}
          </div>
        )}

        {/* ─── Overview Cards (all departments) ──────────────────── */}
        {!activeDept && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {departments.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-xl border border-[#E5E5DC]">
                <BarChart3 className="w-12 h-12 text-[#999999] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#141042] mb-2">
                  Nenhum departamento encontrado
                </h3>
                <p className="text-[#666666] text-sm mb-4">
                  Cadastre funcionários com departamento na tabela de colaboradores,
                  ou aplique a migration do catálogo dinâmico para usar os templates.
                </p>
                <p className="text-xs text-[#999999]">
                  Os departamentos são carregados automaticamente da estrutura de colaboradores da organização.
                </p>
              </div>
            ) : (
              departments.map(dept => {
                const score = deptScores[dept];
                const { icon: DIcon, bg: dbg, text: dtc } = getDeptStyle(dept);
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDept(dept)}
                    className="text-left p-6 bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 ${dbg} rounded-lg shrink-0`}>
                        <DIcon className={`w-5 h-5 ${dtc}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-[#141042]">{dept}</h3>
                    </div>
                    {score ? (
                      <>
                        <p className={`text-4xl font-bold mb-3 ${scoreColor(score.overall_score)}`}>
                          {score.overall_score?.toFixed(1) ?? '—'}
                        </p>
                        <div className="grid grid-cols-5 gap-1 text-xs">
                          {(['quality', 'efficiency', 'effectiveness', 'cx', 'people'] as const).map(cat => {
                            const key = `${cat}_score` as keyof DeptScore;
                            const val = score[key] as number | null;
                            return (
                              <div key={cat} className="text-center">
                                <p className="text-[#999999] truncate">{CATEGORY_LABELS[cat]?.substring(0, 4)}</p>
                                <p className={`font-semibold ${scoreColor(val)}`}>{val?.toFixed(0) ?? '—'}</p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-[#999999] mt-3">{score.total_entries} registros</p>
                      </>
                    ) : (
                      <p className="text-[#999999] text-sm">Sem dados registrados</p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ─── Active Department Detail ──────────────────────────── */}
        {activeDept && (
          <>
            {/* Department Score Header */}
            {deptScores[activeDept] && (
              <div className={`mb-6 p-6 rounded-xl border-2 ${scoreBg(deptScores[activeDept].overall_score)}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <DeptIconInline dept={activeDept} />
                      COPC Score — {activeDept}
                    </div>
                    <p className="text-5xl font-bold">
                      {deptScores[activeDept].overall_score?.toFixed(1)}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    {(['quality', 'efficiency', 'effectiveness', 'cx', 'people'] as const).map(cat => {
                      const key = `${cat}_score` as keyof DeptScore;
                      const val = deptScores[activeDept][key] as number | null;
                      return (
                        <div key={cat} className="text-center">
                          <p className="text-xs opacity-70">{CATEGORY_LABELS[cat]}</p>
                          <p className={`text-xl font-bold ${scoreColor(val)}`}>{val?.toFixed(0) ?? '—'}</p>
                          <p className="text-[10px] opacity-50">{CATEGORY_WEIGHTS[cat]}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Data Entry Form ─────────────────────────────────── */}
            {showForm && (
              <div className="mb-8 bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06)] overflow-hidden">
                <div className="p-6 border-b border-[#E5E5DC] flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#141042]">
                    Registrar Indicadores — {activeDept}
                  </h2>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:border-[#141042] outline-none"
                  />
                </div>
                <div className="p-6 space-y-6">
                  {Object.entries(byCategory).map(([cat, metrics]) => (
                    <div key={cat}>
                      <h3 className={`text-sm font-semibold px-3 py-1.5 rounded-md border inline-block mb-3 ${CATEGORY_COLORS[cat] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {CATEGORY_LABELS[cat] || cat} ({CATEGORY_WEIGHTS[cat]}%)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {metrics
                          .sort((a, b) => a.display_order - b.display_order)
                          .map(m => (
                          <div key={m.id} className="group">
                            <label className="block text-sm font-medium text-[#141042] mb-1">
                              {m.metric_name}
                              <span className="ml-2 text-xs text-[#999999] font-normal">
                                ({m.unit}{m.higher_is_better ? ' ↑' : ' ↓'})
                              </span>
                            </label>
                            {m.description && (
                              <p className="text-xs text-[#999999] mb-1.5">{m.description}</p>
                            )}
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min={m.min_value}
                                max={m.max_value}
                                placeholder={m.target_value !== null ? `Meta: ${m.target_value}` : `${m.min_value} – ${m.max_value}`}
                                value={formValues[m.id] ?? ''}
                                onChange={e => setFormValues(prev => ({ ...prev, [m.id]: e.target.value }))}
                                className="w-full px-3 py-2 pr-12 border border-[#E5E5DC] rounded-lg text-sm focus:border-[#141042] outline-none transition-colors"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999999]">
                                {m.unit}
                              </span>
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-[#999999]">
                              <span>Mín: {m.min_value}</span>
                              {m.target_value !== null && <span className="text-[#141042]">Meta: {m.target_value}</span>}
                              <span>Máx: {m.max_value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Submit */}
                  <div className="flex justify-end pt-4 border-t border-[#E5E5DC]">
                    <button
                      onClick={() => { setShowForm(false); setFormValues({}); }}
                      className="px-5 py-2.5 text-[#666666] font-medium border border-[#E5E5DC] rounded-lg hover:bg-[#FAFAF8] hover:border-[#999999] mr-3 text-sm transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2.5 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1D1A5A] disabled:opacity-50 text-sm transition-all shadow-sm"
                    >
                      {saving ? 'Salvando...' : 'Salvar Indicadores'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Catalog & Recent Entries ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Catalog KPIs */}
              <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06)] overflow-hidden">
                <div className="p-5 border-b border-[#E5E5DC]">
                  <h2 className="text-lg font-semibold text-[#141042]">
                    KPIs — {activeDept}
                  </h2>
                  <p className="text-xs text-[#999999] mt-0.5">
                    {deptCatalog.length} indicadores configurados
                  </p>
                </div>
                <div className="divide-y divide-[#E5E5DC] max-h-120 overflow-y-auto">
                  {Object.entries(byCategory).map(([cat, metrics]) => (
                    <div key={cat} className="p-4">
                      <p className={`text-xs font-semibold px-2 py-1 rounded inline-block mb-2 ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORY_LABELS[cat]} ({CATEGORY_WEIGHTS[cat]}%)
                      </p>
                      <div className="space-y-2">
                        {metrics
                          .sort((a, b) => a.display_order - b.display_order)
                          .map(m => (
                          <div key={m.id} className="flex items-center justify-between text-sm py-1">
                            <div>
                              <span className="text-[#141042] font-medium">{m.metric_name}</span>
                              <span className="text-xs text-[#999999] ml-2">
                                {m.higher_is_better ? '↑' : '↓'} {m.unit}
                              </span>
                            </div>
                            <span className="text-xs text-[#666666] bg-[#FAFAF8] px-2 py-0.5 rounded">
                              peso: {m.weight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {deptCatalog.length === 0 && (
                    <div className="p-8 text-center text-[#999999] text-sm">
                      Nenhum KPI configurado para esta área.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Entries */}
              <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06)] overflow-hidden">
                <div className="p-5 border-b border-[#E5E5DC]">
                  <h2 className="text-lg font-semibold text-[#141042]">
                    Registros Recentes
                  </h2>
                  <p className="text-xs text-[#999999] mt-0.5">
                    {entries.length} registro(s)
                  </p>
                </div>
                <div className="max-h-120 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAFAF8] sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-[#666666] uppercase">Data</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-[#666666] uppercase">Indicador</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-[#666666] uppercase">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5DC]">
                      {entries.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-[#999999]">
                            Nenhum registro.{' '}
                            <button
                              onClick={() => setShowForm(true)}
                              className="text-[#141042] hover:underline"
                            >
                              Registrar indicadores →
                            </button>
                          </td>
                        </tr>
                      ) : (
                        entries.map(e => (
                          <tr key={e.id} className="hover:bg-[#FAFAF8]">
                            <td className="px-4 py-2.5 text-[#666666] whitespace-nowrap">
                              {new Date(e.metric_date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-2.5 text-[#141042]">
                              {e.catalog?.metric_name || '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-[#141042]">
                              {e.value}
                              <span className="text-xs text-[#999999] ml-1">
                                {e.catalog?.unit || ''}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Category Explanation */}
            <div className="bg-[#FAFAF8] rounded-xl border border-[#E5E5DC] p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#141042] mb-3">
                <Calculator className="w-4 h-4 text-[#666666]" />
                Como o Score COPC é calculado para {activeDept}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <div key={key} className={`p-3 rounded-lg border ${CATEGORY_COLORS[key]}`}>
                    <p className="font-semibold mb-1">{label}</p>
                    <p className="opacity-80">Peso: {CATEGORY_WEIGHTS[key]}%</p>
                    <p className="opacity-70 mt-1">
                      {(byCategory[key] || []).length} KPIs definidos
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#999999] mt-3">
                Cada indicador é normalizado de 0 a 100, levando em conta min/max e se maior é melhor.
                A média ponderada de cada categoria gera o score final.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
