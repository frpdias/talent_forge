'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { Loader2, TrendingUp, Briefcase, Users, CheckCircle } from 'lucide-react';

// ── Design system ─────────────────────────────────────────────────────────────
const C = {
  primary:   '#141042',
  secondary: '#10B981',
  accent:    '#3B82F6',
  warning:   '#F97316',
  danger:    '#EF4444',
  purple:    '#A855F7',
  muted:     '#6B7280',
  border:    '#E5E7EB',
  bg:        '#F0F2F5',
};

// Status → label legível
const STATUS_LABEL: Record<string, string> = {
  applied:          'Triagem',
  in_review:        'Em Análise',
  interview:        'Entrevista',
  technical:        'Técnica',
  in_documentation: 'Documentação',
  hired:            'Contratado',
  rejected:         'Reprovado',
};

const STATUS_COLOR: Record<string, string> = {
  applied:          C.accent,
  in_review:        C.purple,
  interview:        '#6366F1',
  technical:        C.warning,
  in_documentation: '#0EA5E9',
  hired:            C.secondary,
  rejected:         C.danger,
};

// Meses em pt-BR
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

interface AnalyticsPanelProps {
  orgId: string;
}

interface PipelineItem { status: string; label: string; count: number; color: string }
interface TrendItem    { month: string; candidaturas: number; contratacoes: number }
interface JobItem      { title: string; count: number }
interface StalledItem  { status: string; label: string; count: number; avg_days: number }

interface KPI {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export default function AnalyticsPanel({ orgId }: AnalyticsPanelProps) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading]       = useState(true);
  const [pipeline, setPipeline]     = useState<PipelineItem[]>([]);
  const [trend, setTrend]           = useState<TrendItem[]>([]);
  const [jobs, setJobs]             = useState<JobItem[]>([]);
  const [stalled, setStalled]       = useState<StalledItem[]>([]);
  const [kpis, setKpis]             = useState<KPI[]>([]);
  const [updatedAt, setUpdatedAt]   = useState('');

  useEffect(() => {
    if (!orgId) return;
    void load();
  }, [orgId]);

  async function load() {
    setLoading(true);
    try {
      // 1) vagas da org
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, status')
        .eq('org_id', orgId);

      const allJobs   = jobsData ?? [];
      const jobIds    = allJobs.map(j => j.id);
      const activeJobs = allJobs.filter(j => ['open','active','on_hold'].includes(j.status ?? ''));

      // 2) applications
      const { data: appsData } = jobIds.length
        ? await supabase.from('applications').select('id, status, created_at, updated_at, job_id').in('job_id', jobIds)
        : { data: [] };

      const apps = appsData ?? [];

      // ── Pipeline por status ──────────────────────────────────────
      const statusCounts: Record<string, number> = {};
      for (const a of apps) {
        const s = a.status ?? 'applied';
        statusCounts[s] = (statusCounts[s] ?? 0) + 1;
      }

      const STATUS_ORDER = ['applied','in_review','interview','technical','in_documentation','hired','rejected'];
      const pipelineData: PipelineItem[] = STATUS_ORDER
        .filter(s => statusCounts[s])
        .map(s => ({
          status: s,
          label:  STATUS_LABEL[s] ?? s,
          count:  statusCounts[s],
          color:  STATUS_COLOR[s] ?? C.accent,
        }));
      setPipeline(pipelineData);

      // ── Trend últimos 6 meses ────────────────────────────────────
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentApps = apps.filter(a => new Date(a.created_at) >= sixMonthsAgo);

      const monthMap: Record<string, { candidaturas: number; contratacoes: number }> = {};
      for (const a of recentApps) {
        const d = new Date(a.created_at);
        const key = `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        if (!monthMap[key]) monthMap[key] = { candidaturas: 0, contratacoes: 0 };
        monthMap[key].candidaturas++;
        if (a.status === 'hired') monthMap[key].contratacoes++;
      }
      // ordena por data
      const trendData: TrendItem[] = Object.entries(monthMap)
        .sort(([a], [b]) => {
          const parse = (s: string) => { const [m, y] = s.split('/'); return Number(y) * 12 + MONTHS_PT.indexOf(m); };
          return parse(a) - parse(b);
        })
        .map(([month, v]) => ({ month, ...v }));
      setTrend(trendData);

      // ── Vagas ativas por candidatos ──────────────────────────────
      const appsByJob: Record<string, number> = {};
      for (const a of apps) { appsByJob[a.job_id] = (appsByJob[a.job_id] ?? 0) + 1; }
      const jobsBar: JobItem[] = activeJobs
        .map(j => ({ title: (j.title ?? '').slice(0, 32), count: appsByJob[j.id] ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setJobs(jobsBar);

      // ── Candidatos parados (>3 dias sem movimentação) ────────────
      const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const activeStatuses = new Set(['applied','in_review','interview','technical','in_documentation']);
      const stalledApps = apps.filter(a => activeStatuses.has(a.status ?? '') && new Date(a.updated_at) < cutoff);

      const stalledMap: Record<string, { count: number; days: number[] }> = {};
      for (const a of stalledApps) {
        const s = a.status ?? 'applied';
        if (!stalledMap[s]) stalledMap[s] = { count: 0, days: [] };
        stalledMap[s].count++;
        stalledMap[s].days.push(Math.floor((Date.now() - new Date(a.updated_at).getTime()) / 86400000));
      }
      const stalledData: StalledItem[] = Object.entries(stalledMap).map(([s, v]) => ({
        status: s,
        label:  STATUS_LABEL[s] ?? s,
        count:  v.count,
        avg_days: Math.round(v.days.reduce((a, b) => a + b, 0) / v.days.length),
      }));
      setStalled(stalledData);

      // ── KPIs ─────────────────────────────────────────────────────
      const totalApps   = apps.length;
      const contratados = apps.filter(a => a.status === 'hired').length;
      setKpis([
        { label: 'No Pipeline',     value: totalApps,        color: C.accent,    icon: <Users    className="w-5 h-5" /> },
        { label: 'Vagas Ativas',    value: activeJobs.length, color: C.secondary, icon: <Briefcase className="w-5 h-5" /> },
        { label: 'Contratados',     value: contratados,      color: C.purple,    icon: <CheckCircle className="w-5 h-5" /> },
        { label: 'Vagas Paradas',   value: stalledApps.length, color: C.warning, icon: <TrendingUp className="w-5 h-5" /> },
      ]);

      setUpdatedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F0F2F5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#141042]" />
          <span className="text-sm text-[#6B7280]">Carregando analytics…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F0F2F5] p-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
               style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${k.color}18`, color: k.color }}>
              {k.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-[#111]">{k.value}</div>
              <div className="text-xs text-[#6B7280]">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Linha 1: Pipeline + Trend */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Pipeline por Status */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
            Pipeline por Etapa
          </h3>
          {pipeline.length === 0
            ? <EmptyState />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pipeline} layout="vertical" margin={{ left: 80, right: 40, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#374151' }} width={80} />
                  <Tooltip formatter={(v) => [`${v} candidatos`, 'Total']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipeline.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Trend */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
            Candidaturas vs Contratações (6 meses)
          </h3>
          {trend.length === 0
            ? <EmptyState />
            : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend} margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="candidaturas" name="Candidaturas"
                        stroke={C.accent} strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="contratacoes" name="Contratações"
                        stroke={C.secondary} strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Linha 2: Vagas + Parados */}
      <div className="grid grid-cols-2 gap-4">
        {/* Vagas ativas */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
            Candidatos por Vaga Ativa
          </h3>
          {jobs.length === 0
            ? <EmptyState />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={jobs} layout="vertical" margin={{ left: 120, right: 40, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 11, fill: '#374151' }} width={120} />
                  <Tooltip formatter={(v) => [`${v} candidatos`, 'Total']} />
                  <Bar dataKey="count" fill={C.accent} radius={[0, 4, 4, 0]}>
                    {jobs.map((_, i) => (
                      <Cell key={i} fill={`hsl(${220 + i * 15}, 80%, ${55 - i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Candidatos parados */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-4">
            Candidatos Parados (&gt;3 dias)
          </h3>
          {stalled.length === 0
            ? <div className="flex h-55 items-center justify-center"><EmptyState label="Nenhum candidato parado 🎉" /></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stalled} layout="vertical" margin={{ left: 100, right: 60, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#374151' }} width={100} />
                  <Tooltip formatter={(v, name) => [
                    name === 'count' ? `${v} candidatos` : `${v} dias`,
                    name === 'count' ? 'Parados' : 'Média dias',
                  ]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Parados" fill={C.warning} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="avg_days" name="Média dias" fill={C.danger} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-right text-[11px] text-[#9CA3AF]">
        Atualizado às {updatedAt} · dados reais ✓
      </div>
    </div>
  );
}

function EmptyState({ label = 'Sem dados disponíveis' }: { label?: string }) {
  return (
    <div className="flex h-50 items-center justify-center text-sm text-[#9CA3AF]">
      {label}
    </div>
  );
}
