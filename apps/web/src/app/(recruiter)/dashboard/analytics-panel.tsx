'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import {
  Loader2, TrendingUp, Briefcase, Users, CheckCircle,
  AlertTriangle, ArrowUpRight, RotateCcw,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:   '#141042',
  secondary: '#10B981',
  accent:    '#3B82F6',
  warning:   '#F97316',
  danger:    '#EF4444',
  purple:    '#A855F7',
  indigo:    '#6366F1',
  sky:       '#0EA5E9',
  muted:     '#6B7280',
  border:    '#E5E7EB',
  bg:        '#F1F5F9',
};

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
  interview:        C.indigo,
  technical:        C.warning,
  in_documentation: C.sky,
  hired:            C.secondary,
  rejected:         C.danger,
};

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Types ─────────────────────────────────────────────────────────────────────
interface PipelineItem { status: string; label: string; count: number; pct: number; color: string }
interface TrendItem    { month: string; candidaturas: number; contratacoes: number }
interface JobItem      { title: string; count: number }
interface StalledItem  { label: string; count: number; avg_days: number; color: string }
interface KPI          { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; bg: string }

interface AnalyticsPanelProps { orgId: string }

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-sm min-w-36">
      {label && <div className="font-semibold text-[#111] mb-2 pb-1 border-b border-gray-100">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-[#6B7280]">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.color ?? p.fill }} />
            {p.name}
          </span>
          <span className="font-semibold text-[#111]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.payload.color }} />
        <span className="font-semibold text-[#111]">{p.payload.label}</span>
      </div>
      <div className="mt-1 text-[#6B7280]">{p.value} candidatos · <strong className="text-[#111]">{p.payload.pct}%</strong></div>
    </div>
  );
}

function BarEndLabel({ x, y, width, height, value }: any) {
  if (!value) return null;
  return (
    <text x={(x as number) + (width as number) + 6} y={(y as number) + (height as number) / 2 + 4}
          fill={C.muted} fontSize={11} fontWeight={500}>
      {value}
    </text>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AnalyticsPanel({ orgId }: AnalyticsPanelProps) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pipeline, setPipeline]   = useState<PipelineItem[]>([]);
  const [trend, setTrend]         = useState<TrendItem[]>([]);
  const [jobs, setJobs]           = useState<JobItem[]>([]);
  const [stalled, setStalled]     = useState<StalledItem[]>([]);
  const [kpis, setKpis]           = useState<KPI[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => { if (orgId) void load(); }, [orgId]);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: jobsData, error: jeErr } = await supabase
        .from('jobs').select('id, title, status').eq('org_id', orgId);
      if (jeErr) throw jeErr;

      const allJobs    = jobsData ?? [];
      const jobIds     = allJobs.map(j => j.id as string);
      const activeJobs = allJobs.filter(j => ['open','active','on_hold'].includes((j.status as string) ?? ''));

      const { data: appsData } = jobIds.length
        ? await supabase.from('applications')
            .select('id, status, created_at, updated_at, job_id')
            .in('job_id', jobIds)
        : { data: [] };

      const apps = (appsData ?? []) as Array<{
        id: string; status: string; created_at: string; updated_at: string; job_id: string
      }>;
      const total = apps.length;

      // ── Pipeline ──────────────────────────────────────────────
      const statusCounts: Record<string, number> = {};
      for (const a of apps) {
        const s = a.status ?? 'applied';
        statusCounts[s] = (statusCounts[s] ?? 0) + 1;
      }
      const FUNNEL_ORDER = ['applied','in_review','interview','technical','in_documentation','hired'];
      const pipelineData: PipelineItem[] = FUNNEL_ORDER
        .filter(s => statusCounts[s])
        .map(s => ({
          status: s, label: STATUS_LABEL[s] ?? s,
          count: statusCounts[s],
          pct: total ? Math.round((statusCounts[s] / total) * 100) : 0,
          color: STATUS_COLOR[s] ?? C.accent,
        }));
      setPipeline(pipelineData);

      // ── Trend 6 meses ─────────────────────────────────────────
      const sixAgo = new Date();
      sixAgo.setMonth(sixAgo.getMonth() - 6);
      const monthMap: Record<string, { candidaturas: number; contratacoes: number; order: number }> = {};
      for (const a of apps) {
        if (new Date(a.created_at) < sixAgo) continue;
        const d = new Date(a.created_at);
        const key = `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        const order = d.getFullYear() * 12 + d.getMonth();
        if (!monthMap[key]) monthMap[key] = { candidaturas: 0, contratacoes: 0, order };
        monthMap[key].candidaturas++;
        if (a.status === 'hired') monthMap[key].contratacoes++;
      }
      setTrend(
        Object.entries(monthMap)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([month, v]) => ({ month, candidaturas: v.candidaturas, contratacoes: v.contratacoes }))
      );

      // ── Vagas ativas ──────────────────────────────────────────
      const appsByJob: Record<string, number> = {};
      for (const a of apps) appsByJob[a.job_id] = (appsByJob[a.job_id] ?? 0) + 1;
      const jobsBar: JobItem[] = activeJobs
        .map(j => ({ title: ((j.title as string) ?? '').slice(0, 28), count: appsByJob[j.id as string] ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);
      setJobs(jobsBar);

      // ── Candidatos parados ────────────────────────────────────
      const cutoff = new Date(Date.now() - 3 * 86_400_000);
      const activeSet = new Set(['applied','in_review','interview','technical','in_documentation']);
      const stalledMap: Record<string, { count: number; days: number[] }> = {};
      for (const a of apps) {
        if (!activeSet.has(a.status) || new Date(a.updated_at) >= cutoff) continue;
        if (!stalledMap[a.status]) stalledMap[a.status] = { count: 0, days: [] };
        stalledMap[a.status].count++;
        stalledMap[a.status].days.push(Math.floor((Date.now() - new Date(a.updated_at).getTime()) / 86_400_000));
      }
      setStalled(
        Object.entries(stalledMap).map(([s, v]) => ({
          label: STATUS_LABEL[s] ?? s,
          count: v.count,
          avg_days: Math.round(v.days.reduce((a, b) => a + b, 0) / v.days.length),
          color: STATUS_COLOR[s] ?? C.warning,
        }))
      );

      // ── KPIs ──────────────────────────────────────────────────
      const hired = statusCounts['hired'] ?? 0;
      const appliedC = statusCounts['applied'] ?? 0;
      const base = appliedC + hired;
      const convRate = base ? Math.round((hired / base) * 100) : 0;
      const totalStalled = Object.values(stalledMap).reduce((s, v) => s + v.count, 0);

      setKpis([
        {
          label: 'Total no Pipeline', value: total,
          sub: `${activeJobs.length} vagas ativas`,
          icon: <Users className="w-5 h-5" />, color: C.accent, bg: '#EFF6FF',
        },
        {
          label: 'Contratados', value: hired,
          sub: 'histórico geral',
          icon: <CheckCircle className="w-5 h-5" />, color: C.secondary, bg: '#ECFDF5',
        },
        {
          label: 'Taxa de Conversão', value: `${convRate}%`,
          sub: base ? `${hired} de ${base} finalistas` : 'sem dados',
          icon: <TrendingUp className="w-5 h-5" />, color: C.purple, bg: '#FAF5FF',
        },
        {
          label: 'Candidatos Parados', value: totalStalled,
          sub: 'sem movimento há +3 dias',
          icon: <AlertTriangle className="w-5 h-5" />, color: C.warning, bg: '#FFF7ED',
        },
      ]);

      setUpdatedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setLoadError((e as Error)?.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#F1F5F9]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#141042]" />
        <div className="text-center">
          <div className="text-sm font-medium text-[#374151]">Carregando analytics</div>
          <div className="text-xs text-[#9CA3AF] mt-0.5">conectando ao banco de dados…</div>
        </div>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="flex-1 flex items-center justify-center bg-[#F1F5F9]">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-sm font-medium text-[#111]">{loadError}</div>
        <button onClick={() => void load()}
                className="mt-3 text-xs text-[#3B82F6] hover:underline flex items-center gap-1 mx-auto">
          <RotateCcw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    </div>
  );

  const totalPipeline = pipeline.reduce((s, p) => s + p.count, 0);
  const maxStalled    = stalled[0]?.count ?? 1;

  return (
    <div className="flex-1 overflow-auto bg-[#F1F5F9]">
      <div className="p-5 space-y-4">

        {/* ── KPI Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map(k => (
            <div key={k.label}
                 className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
                 style={{ borderLeft: `4px solid ${k.color}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: k.bg, color: k.color }}>
                  {k.icon}
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
              <div className="text-3xl font-black tracking-tight text-[#0F172A]">{k.value}</div>
              <div className="text-xs font-semibold text-[#374151] mt-1">{k.label}</div>
              {k.sub && <div className="text-[11px] text-[#9CA3AF] mt-0.5">{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Funil + Dist. pizza ────────────────────────── */}
        <div className="grid grid-cols-5 gap-3">

          <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#0F172A]">Funil de Recrutamento</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{totalPipeline} candidatos no total</p>
            </div>
            {pipeline.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={pipeline} layout="vertical"
                          margin={{ left: 0, right: 52, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label"
                         tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                         width={108} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="count" name="Candidatos" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {pipeline.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    <LabelList content={<BarEndLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Distribuição</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">por etapa atual</p>
            </div>
            {pipeline.length === 0 ? <EmptyChart /> : (
              <>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={pipeline} dataKey="count" nameKey="label"
                         cx="50%" cy="50%" innerRadius={42} outerRadius={70}
                         paddingAngle={2}>
                      {pipeline.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-3">
                  {pipeline.map(p => (
                    <div key={p.status} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#374151]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                        {p.label}
                      </span>
                      <span className="font-semibold text-[#111]">{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Trend (área) + Vagas ───────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#0F172A]">Evolução Mensal</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">candidaturas vs contratações — últimos 6 meses</p>
            </div>
            {trend.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ left: -10, right: 10, top: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="gCand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.accent}    stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.accent}    stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gHired" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.secondary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.secondary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="candidaturas" name="Candidaturas"
                        stroke={C.accent} strokeWidth={2.5} fill="url(#gCand)"
                        dot={{ r: 4, fill: C.accent, stroke: 'white', strokeWidth: 2 }}
                        activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="contratacoes" name="Contratações"
                        stroke={C.secondary} strokeWidth={2.5} fill="url(#gHired)"
                        dot={{ r: 4, fill: C.secondary, stroke: 'white', strokeWidth: 2 }}
                        activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#0F172A]">Candidatos por Vaga</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">vagas abertas — top {jobs.length}</p>
            </div>
            {jobs.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={jobs} layout="vertical"
                          margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="title"
                         tick={{ fontSize: 11, fill: '#374151' }}
                         width={116} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v} candidatos`, 'Total']} />
                  <Bar dataKey="count" name="Candidatos" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {jobs.map((_, i) => (
                      <Cell key={i} fill={`hsl(${215 + i * 12}, 72%, ${60 - i * 4}%)`} />
                    ))}
                    <LabelList content={<BarEndLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Candidatos parados ─────────────────────────── */}
        {stalled.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Candidatos Parados</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">sem movimentação há mais de 3 dias</p>
              </div>
              <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">
                {stalled.reduce((s, x) => s + x.count, 0)} candidatos
              </span>
            </div>
            <div className="grid gap-2">
              {stalled.map(s => (
                <div key={s.label}
                     className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-sm font-medium text-[#374151] w-36 shrink-0">{s.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                         style={{ width: `${Math.min((s.count / maxStalled) * 100, 100)}%`, background: s.color }} />
                  </div>
                  <span className="font-bold text-[#0F172A] w-6 text-right shrink-0">{s.count}</span>
                  <span className="text-[11px] text-[#9CA3AF] bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shrink-0">
                    ø {s.avg_days}d parado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 pb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-[#9CA3AF]">Dados em tempo real · atualizado às {updatedAt}</span>
        </div>

      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200">
      <span className="text-sm text-[#9CA3AF]">Sem dados para exibir</span>
    </div>
  );
}

