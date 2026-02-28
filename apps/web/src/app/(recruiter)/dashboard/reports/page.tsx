'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  KPICards,
  RecruitmentFunnel,
  TimeToHireChart,
  SourceEffectiveness,
  ReportExport,
} from '@/components';
import { useOrgStore } from '@/lib/store';
import { reportsApi } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: '#1F4ED8',
  Site: '#141042',
  Indicação: '#F97316',
  Indeed: '#8B5CF6',
  'Não informado': '#94A3B8',
};

function getSourceColor(name: string, index: number): string {
  if (SOURCE_COLORS[name]) return SOURCE_COLORS[name];
  const palette = ['#1F4ED8', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#94A3B8'];
  return palette[index % palette.length];
}

const STATUS_LABELS: Record<string, string> = {
  applied: 'Candidatura',
  in_process: 'Em Processo',
  hired: 'Contratado',
  rejected: 'Rejeitado',
};

const reportColumns = [
  { header: 'Candidato', dataKey: 'name' },
  { header: 'Vaga', dataKey: 'job' },
  { header: 'Status', dataKey: 'stage' },
  { header: 'Data', dataKey: 'date' },
];

type KPIItem = {
  id: string;
  label: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: 'users' | 'briefcase' | 'target' | 'clock';
};

const DEFAULT_KPIS: KPIItem[] = [
  { id: '1', label: 'Candidatos Ativos', value: 0, change: 0, changeType: 'increase', icon: 'users' },
  { id: '2', label: 'Vagas Abertas', value: 0, change: 0, changeType: 'increase', icon: 'briefcase' },
  { id: '3', label: 'Taxa de Conversão', value: '—', change: 0, changeType: 'increase', icon: 'target' },
  { id: '4', label: 'Tempo Médio', value: '—', change: 0, changeType: 'decrease', icon: 'clock' },
];

export default function ReportsPage() {
  const { currentOrg } = useOrgStore();
  const supabase = useMemo(() => createClient(), []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [kpisData, setKpisData] = useState<KPIItem[]>(DEFAULT_KPIS);
  const [funnelData, setFunnelData] = useState<{ stage: string; candidates: number; conversion: number }[]>([]);
  const [timeToHireData, setTimeToHireData] = useState<{ month: string; days: number; target: number }[]>([]);
  const [sourceData, setSourceData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [reportData, setReportData] = useState<{ name: string; job: string; stage: string; date: string }[]>([]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void loadReportsData(); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, dateRange.start, dateRange.end]);

  const resolveOrgId = async (): Promise<string | null> => {
    if (currentOrg?.id) return currentOrg.id;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return null;
    const { data: orgMembership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle();
    return orgMembership?.org_id || null;
  };

  const loadTimeToHireFromSupabase = async (orgId: string): Promise<{ month: string; days: number; target: number }[]> => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const { data: apps } = await supabase
      .from('applications')
      .select('created_at, updated_at, jobs!inner(org_id)')
      .eq('jobs.org_id', orgId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .in('status', ['hired', 'rejected']);

    const monthMap = new Map<string, { sum: number; count: number }>();
    for (const app of (apps || []) as any[]) {
      const created = new Date(app.created_at);
      const updated = new Date(app.updated_at || app.created_at);
      const days = Math.max(0, Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (!monthMap.has(key)) monthMap.set(key, { sum: 0, count: 0 });
      const entry = monthMap.get(key)!;
      entry.sum += days;
      entry.count += 1;
    }

    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = monthMap.get(key);
      return {
        month: MONTH_LABELS[d.getMonth()],
        days: entry ? Math.round(entry.sum / entry.count) : 0,
        target: 20,
      };
    });
  };

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const orgId = await resolveOrgId();
      if (!orgId) { setLoading(false); return; }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const [dashboardResult, pipelineResult, timeToHireResult] = await Promise.allSettled([
        token ? reportsApi.dashboard(token, orgId) : Promise.reject(new Error('no token')),
        token ? reportsApi.pipelines(token, orgId) : Promise.reject(new Error('no token')),
        loadTimeToHireFromSupabase(orgId),
      ]);

      // Time to hire (always from Supabase — reliable)
      if (timeToHireResult.status === 'fulfilled') {
        setTimeToHireData(timeToHireResult.value);
      }

      if (dashboardResult.status === 'fulfilled') {
        const dash = (dashboardResult.value as any)?.data ?? (dashboardResult.value as any);
        const stats = dash?.stats || {};

        // Sources with design system colors
        const sources = ((dash?.sources || []) as { name: string; value: number }[]).map((s, i) => ({
          ...s,
          color: getSourceColor(s.name, i),
        }));
        if (sources.length > 0) setSourceData(sources);

        // Recent activity → table
        const activity = ((dash?.recentActivity || []) as any[]).map((a) => ({
          name: a.candidateName || 'Candidato',
          job: a.jobTitle || 'Vaga',
          stage: STATUS_LABELS[a.status] || a.status || '—',
          date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('pt-BR') : '—',
        }));
        setReportData(activity);

        // Pipeline data for KPIs and funnel
        if (pipelineResult.status === 'fulfilled') {
          const raw = (pipelineResult.value as any)?.data ?? (pipelineResult.value as any);
          const pipelines: any[] = Array.isArray(raw) ? raw : [raw].filter(Boolean);

          const avgDays = pipelines.length > 0
            ? Math.round(pipelines.reduce((s, p) => s + (p.averageDaysInPipeline || 0), 0) / pipelines.length)
            : 0;
          const avgHireRate = pipelines.length > 0
            ? Math.round(pipelines.reduce((s, p) => s + (p.hireRate || 0), 0) / pipelines.length)
            : 0;

          setKpisData([
            { id: '1', label: 'Candidatos Ativos', value: stats.totalCandidates ?? 0, change: 0, changeType: 'increase', icon: 'users' },
            { id: '2', label: 'Vagas Abertas', value: stats.openJobs ?? 0, change: 0, changeType: 'increase', icon: 'briefcase' },
            { id: '3', label: 'Taxa de Conversão', value: `${avgHireRate}%`, change: 0, changeType: 'increase', icon: 'target' },
            { id: '4', label: 'Tempo Médio', value: `${avgDays} dias`, change: 0, changeType: 'decrease', icon: 'clock' },
          ]);

          // Aggregate funnel stages across all jobs
          const stageMap = new Map<string, number>();
          const totalApps = pipelines.reduce((s, p) => s + (p.totalApplications || 0), 0);
          for (const pipeline of pipelines) {
            for (const stage of (pipeline.stages || [])) {
              stageMap.set(stage.stageName, (stageMap.get(stage.stageName) || 0) + stage.count);
            }
          }
          const funnel = Array.from(stageMap.entries()).map(([stage, candidates]) => ({
            stage,
            candidates,
            conversion: totalApps > 0 ? Math.round((candidates / totalApps) * 100) : 0,
          }));
          if (funnel.length > 0) setFunnelData(funnel);
        } else {
          // KPIs without pipeline data
          setKpisData([
            { id: '1', label: 'Candidatos Ativos', value: stats.totalCandidates ?? 0, change: 0, changeType: 'increase', icon: 'users' },
            { id: '2', label: 'Vagas Abertas', value: stats.openJobs ?? 0, change: 0, changeType: 'increase', icon: 'briefcase' },
            { id: '3', label: 'Taxa de Conversão', value: '—', change: 0, changeType: 'increase', icon: 'target' },
            { id: '4', label: 'Tempo Médio', value: '—', change: 0, changeType: 'decrease', icon: 'clock' },
          ]);
        }
      } else {
        // Full Supabase fallback for KPIs
        const [jobsResult, candidatesResult] = await Promise.all([
          supabase.from('jobs').select('id, status', { count: 'exact', head: false }).eq('org_id', orgId),
          supabase.from('candidates').select('id', { count: 'exact', head: true }).eq('owner_org_id', orgId),
        ]);
        const openJobs = ((jobsResult.data || []) as any[]).filter(
          (j) => j.status === 'open' || j.status === 'on_hold'
        ).length;
        setKpisData([
          { id: '1', label: 'Candidatos Ativos', value: candidatesResult.count ?? 0, change: 0, changeType: 'increase', icon: 'users' },
          { id: '2', label: 'Vagas Abertas', value: openJobs, change: 0, changeType: 'increase', icon: 'briefcase' },
          { id: '3', label: 'Taxa de Conversão', value: '—', change: 0, changeType: 'increase', icon: 'target' },
          { id: '4', label: 'Tempo Médio', value: '—', change: 0, changeType: 'decrease', icon: 'clock' },
        ]);
      }
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#141042]">
            <span className="text-[#1F4ED8] font-semibold">TALENT</span>
            {' '}
            <span className="text-[#F97316] font-bold">REPORTS</span>
          </h1>
          <p className="text-[#666666] mt-1">
            Análises e relatórios detalhados do processo de recrutamento
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm text-[#141042] bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
            <span className="text-[#666666]">até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm text-[#141042] bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>

          <ReportExport
            title="Relatório de Candidatos"
            columns={reportColumns}
            data={reportData}
            fileName="relatorio_candidatos"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#141042] animate-spin" />
            <p className="text-[#666666]">Carregando relatórios...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <KPICards kpis={kpisData} />

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {funnelData.length > 0 ? (
              <RecruitmentFunnel data={funnelData} />
            ) : (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 flex flex-col items-center justify-center min-h-95">
                <p className="text-[#666666] text-sm">Sem dados de funil disponíveis</p>
                <p className="text-[#999999] text-xs mt-1">Crie vagas com etapas de pipeline para visualizar</p>
              </div>
            )}
            <TimeToHireChart data={timeToHireData} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sourceData.length > 0 ? (
              <SourceEffectiveness data={sourceData} />
            ) : (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 flex flex-col items-center justify-center min-h-95">
                <p className="text-[#666666] text-sm">Sem dados de origem disponíveis</p>
                <p className="text-[#999999] text-xs mt-1">Informe a origem dos candidatos ao cadastrá-los</p>
              </div>
            )}

            {/* General Stats */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
              <h3 className="text-lg font-semibold text-[#141042] mb-4">
                Estatísticas Gerais
              </h3>
              <div className="space-y-4">
                {kpisData.map((kpi) => (
                  <div key={kpi.id} className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-lg">
                    <span className="text-sm font-medium text-[#141042]">{kpi.label}</span>
                    <span className="text-2xl font-bold text-[#1F4ED8]">{kpi.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              Atividade Recente
            </h3>

            {reportData.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[#666666] text-sm">Nenhuma atividade recente encontrada</p>
                <p className="text-[#999999] text-xs mt-1">As candidaturas aparecerão aqui conforme forem registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E5DC]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">Candidato</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">Vaga</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#141042]">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, index) => (
                      <tr key={index} className="border-b border-[#E5E5DC]/60 hover:bg-[#FAFAF8]">
                        <td className="py-3 px-4 text-sm text-[#141042] font-medium">{row.name}</td>
                        <td className="py-3 px-4 text-sm text-[#666666]">{row.job}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs font-medium bg-[rgba(20,16,66,0.08)] text-[#141042] rounded-full">
                            {row.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#94A3B8]">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
