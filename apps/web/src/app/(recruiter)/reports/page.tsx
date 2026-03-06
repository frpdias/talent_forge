'use client';

import { Header } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { SourceEffectiveness } from '@/components';
import { useEffect, useMemo, useState } from 'react';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  Users,
  Brain,
  Download,
  Briefcase,
  Target,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalAssessments: number;
  conversionRate: number;
  applicationsLast30d: number;
}

interface PipelineStage {
  id: string;
  name: string;
  position: number;
  count: number;
  percentage: number;
}

interface JobPipeline {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  stages: PipelineStage[];
  hiredCount: number;
}

interface SourceMetric {
  name: string;
  value: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const colorClasses = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  purple: { bg: 'bg-violet-50', icon: 'text-violet-600', ring: 'ring-violet-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
};

function StatCard({ title, value, icon: Icon, sub, color }: StatCardProps) {
  const colors = colorClasses[color];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#666666]">{title}</p>
            <p className="text-3xl font-bold text-[#141042] mt-2">{value}</p>
            {sub && (
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600 ml-1">{sub}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colors.bg} ring-8 ${colors.ring}`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const { currentOrg } = useOrgStore();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelines, setPipelines] = useState<JobPipeline[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<SourceMetric[]>([]);

  useEffect(() => {
    if (currentOrg?.id) {
      void loadReports(currentOrg.id);
    }
  }, [currentOrg?.id]);

  const loadReports = async (orgId: string) => {
    try {
      setLoading(true);

      // 1. Dashboard stats via v_org_metrics
      const { data: metricsRow } = await supabase
        .from('v_org_metrics')
        .select('total_jobs, active_jobs, total_candidates, total_applications, completed_assessments, conversion_rate, applications_last_30d')
        .eq('org_id', orgId)
        .maybeSingle();

      if (metricsRow) {
        setStats({
          totalJobs: metricsRow.total_jobs || 0,
          openJobs: metricsRow.active_jobs || 0,
          totalCandidates: metricsRow.total_candidates || 0,
          totalApplications: metricsRow.total_applications || 0,
          totalAssessments: metricsRow.completed_assessments || 0,
          conversionRate: metricsRow.conversion_rate || 0,
          applicationsLast30d: metricsRow.applications_last_30d || 0,
        });
      }

      // 2. Pipeline data — jobs + stages + application counts
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('org_id', orgId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map((j) => j.id);

        const { data: stages } = await supabase
          .from('pipeline_stages')
          .select('id, job_id, name, position')
          .in('job_id', jobIds)
          .order('position', { ascending: true });

        const { data: applications } = await supabase
          .from('applications')
          .select('job_id, current_stage_id, status')
          .in('job_id', jobIds);

        const appsByJob: Record<string, typeof applications> = {};
        (applications || []).forEach((app) => {
          if (!appsByJob[app.job_id]) appsByJob[app.job_id] = [];
          appsByJob[app.job_id]!.push(app);
        });

        const pipelineData: JobPipeline[] = jobs.map((job) => {
          const jobApps = appsByJob[job.id] || [];
          const total = jobApps.length;
          const jobStages = (stages || []).filter((s) => s.job_id === job.id);

          const stagesWithCount = jobStages.map((stage) => {
            const count = jobApps.filter((a) => a.current_stage_id === stage.id).length;
            return {
              id: stage.id,
              name: stage.name,
              position: stage.position,
              count,
              percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            };
          });

          const hiredCount = jobApps.filter((a) => a.status === 'hired').length;

          return {
            jobId: job.id,
            jobTitle: job.title,
            totalApplications: total,
            stages: stagesWithCount,
            hiredCount,
          };
        });

        setPipelines(pipelineData.filter((p) => p.totalApplications > 0));
      }

      // 3. Source effectiveness — from applications.source via jobs
      const { data: sourceRows } = await supabase
        .from('applications')
        .select('source, job_id!inner(org_id)')
        .eq('job_id.org_id' as any, orgId)
        .not('source', 'is', null);

      if (sourceRows && sourceRows.length > 0) {
        const sourceCounts: Record<string, number> = {};
        sourceRows.forEach((row: any) => {
          const s = row.source || 'Direto';
          sourceCounts[s] = (sourceCounts[s] || 0) + 1;
        });
        const metrics = Object.entries(sourceCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
        setSourceMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Relatórios"
        subtitle="Análises e métricas do processo de recrutamento"
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <div className="p-8 space-y-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#141042] mx-auto" />
            <p className="text-sm text-[#666666] mt-4">Carregando relatórios...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Candidatos"
                value={stats.totalCandidates}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Vagas Abertas"
                value={stats.openJobs}
                icon={Briefcase}
                color="green"
                sub={`${stats.totalJobs} total`}
              />
              <StatCard
                title="Candidaturas"
                value={stats.totalApplications}
                icon={Target}
                color="purple"
                sub={`${stats.applicationsLast30d} nos últimos 30 dias`}
              />
              <StatCard
                title="Avaliações"
                value={stats.totalAssessments}
                icon={Brain}
                color="amber"
                sub={stats.conversionRate > 0 ? `${stats.conversionRate}% conversão` : undefined}
              />
            </div>

            {/* Pipeline por vaga */}
            {pipelines.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#141042]">Funil por Vaga</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pipelines.map((pipeline) => (
                    <Card key={pipeline.jobId}>
                      <div className="p-5 border-b border-[#E5E5DC] bg-[#FAFAF8] rounded-t-xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[#141042]">
                              {pipeline.jobTitle}
                            </h3>
                            <p className="text-xs text-[#666666] mt-0.5">
                              {pipeline.totalApplications} candidaturas
                            </p>
                          </div>
                          {pipeline.hiredCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                              <Clock className="h-3 w-3" />
                              {pipeline.hiredCount} contratado{pipeline.hiredCount > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-5">
                        {pipeline.stages.length === 0 ? (
                          <p className="text-xs text-[#999999]">Sem etapas configuradas</p>
                        ) : (
                          <div className="space-y-3">
                            {pipeline.stages.map((stage) => (
                              <div key={stage.id}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-[#141042] truncate">
                                    {stage.name}
                                  </span>
                                  <span className="text-xs text-[#666666] ml-2 shrink-0">
                                    {stage.count} ({stage.percentage}%)
                                  </span>
                                </div>
                                <div className="h-1.5 bg-[#E5E5DC] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#141042] rounded-full transition-all duration-500"
                                    style={{ width: `${stage.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Source Effectiveness */}
            {sourceMetrics.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#141042]">Origem das Candidaturas</h2>
                <SourceEffectiveness
                  data={sourceMetrics.map((source, index) => ({
                    ...source,
                    color: ['#141042', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][index % 6],
                  }))}
                />
              </div>
            )}

            {/* Empty state */}
            {pipelines.length === 0 && sourceMetrics.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-[#E5E5DC] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#141042] mb-2">
                    Nenhum dado disponível
                  </h3>
                  <p className="text-sm text-[#666666]">
                    Quando houver candidaturas, os relatórios aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-[#E5E5DC] mx-auto mb-4" />
              <p className="text-sm text-[#666666]">Nenhuma organização selecionada.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
