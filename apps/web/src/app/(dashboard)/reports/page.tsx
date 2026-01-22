'use client';

import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Select } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useOrgStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { reportsApi, jobsApi } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Brain,
  Download,
  Briefcase,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalAssessments: number;
}

interface PipelineStageStats {
  stageName: string;
  count: number;
  percentage: number;
}

interface PipelineReport {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  stages: PipelineStageStats[];
  conversions: number[];
  statusDistribution: {
    applied: number;
    in_process: number;
    hired: number;
    rejected: number;
  };
  averageDaysInPipeline: number;
  hireRate: number;
}

interface AssessmentReport {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  medianScore: number;
  scoreDistribution: Array<{ range: string; count: number; percentage: number }>;
  traitAverages: {
    bigFive: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    disc: {
      dominance: number;
      influence: number;
      steadiness: number;
      conscientiousness: number;
    };
  } | null;
}

interface Job {
  id: string;
  title: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    ring: 'ring-blue-100',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    ring: 'ring-emerald-100',
  },
  purple: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    ring: 'ring-violet-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    ring: 'ring-amber-100',
  },
};

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.positive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ml-1 ${
                    trend.positive ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(trend.value)}%
                </span>
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
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineReports, setPipelineReports] = useState<PipelineReport[]>([]);
  const [assessmentReport, setAssessmentReport] = useState<AssessmentReport | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');

  useEffect(() => {
    if (currentOrg?.id && session?.access_token) {
      loadJobs();
      loadReports();
    }
  }, [currentOrg?.id, session?.access_token, selectedJob]);

  const loadJobs = async () => {
    try {
      const data = await jobsApi.list(session!.access_token, currentOrg!.id);
      setJobs((data as any).data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const [dashboardData, pipelineData, assessmentData] = await Promise.all([
        reportsApi.dashboard(session!.access_token, currentOrg!.id),
        reportsApi.pipelines(session!.access_token, currentOrg!.id, selectedJob || undefined),
        reportsApi.assessments(session!.access_token, currentOrg!.id, selectedJob || undefined),
      ]);

      setStats((dashboardData as any).data?.stats);
      
      // Handle pipeline data - can be single report or array
      const pipeline = (pipelineData as any).data;
      if (pipeline) {
        setPipelineReports(Array.isArray(pipeline) ? pipeline : [pipeline]);
      }
      
      setAssessmentReport((assessmentData as any).data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const bigFiveLabels: Record<string, string> = {
    openness: 'Abertura',
    conscientiousness: 'Conscienciosidade',
    extraversion: 'Extroversão',
    agreeableness: 'Amabilidade',
    neuroticism: 'Neuroticismo',
  };

  const discLabels: Record<string, string> = {
    dominance: 'Dominância',
    influence: 'Influência',
    steadiness: 'Estabilidade',
    conscientiousness: 'Conformidade',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="TALENT REPORTS"
        subtitle="Análises e relatórios detalhados do processo de recrutamento"
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <div className="p-8 space-y-8">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por vaga
            </label>
            <Select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              options={[
                { value: '', label: 'Todas as vagas' },
                ...jobs.map((job) => ({ value: job.id, label: job.title })),
              ]}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-sm text-gray-600 mt-4">Carregando relatórios...</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Candidatos Ativos"
                value={stats.totalCandidates}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Vagas Abertas"
                value={stats.openJobs}
                icon={Briefcase}
                color="green"
              />
              <StatCard
                title="Aplicações Totais"
                value={stats.totalApplications}
                icon={Target}
                color="purple"
              />
              <StatCard
                title="Avaliações Completas"
                value={stats.totalAssessments}
                icon={Brain}
                color="amber"
              />
            </div>

            {/* Pipeline Reports */}
            {pipelineReports.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Funil de Recrutamento</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tempo Médio de Contratação
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pipelineReports.slice(0, 2).map((report) => (
                    <Card key={report.jobId}>
                      <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {report.jobTitle}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {report.totalApplications} candidaturas
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{report.averageDaysInPipeline} dias</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Taxa de contratação: {report.hireRate}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {report.stages.map((stage, idx) => (
                            <div key={stage.stageName}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-gray-700 truncate">
                                  {stage.stageName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">
                                    {stage.count}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-900 min-w-10 text-right">
                                    {stage.percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                  style={{ width: `${stage.percentage}%` }}
                                />
                              </div>
                              {idx < report.conversions.length && (
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  Conversão: {report.conversions[idx]}%
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Report */}
            {assessmentReport && assessmentReport.totalAssessments > 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tempo Médio de Contratação
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {assessmentReport.completedAssessments} avaliações concluídas
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Big Five Traits */}
                  {assessmentReport.traitAverages?.bigFive && (
                    <Card>
                      <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-base font-semibold text-gray-900">
                          Perfil Big Five Médio
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Score médio: {assessmentReport.averageScore}
                        </p>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {Object.entries(assessmentReport.traitAverages.bigFive).map(
                            ([trait, score]) => (
                              <div key={trait}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {bigFiveLabels[trait] || trait}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {score}%
                                  </span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-linear-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* DISC Profile */}
                  {assessmentReport.traitAverages?.disc && (
                    <Card>
                      <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-base font-semibold text-gray-900">
                          Perfil DISC Médio
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Mediana: {assessmentReport.medianScore}
                        </p>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {Object.entries(assessmentReport.traitAverages.disc).map(
                            ([trait, score]) => (
                              <div key={trait}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {discLabels[trait] || trait}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {score}%
                                  </span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-linear-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Score Distribution */}
                {assessmentReport.scoreDistribution.length > 0 && (
                  <Card>
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-base font-semibold text-gray-900">
                        Distribuição de Scores
                      </h3>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-5 gap-4">
                        {assessmentReport.scoreDistribution.map((bucket) => (
                          <div key={bucket.range} className="text-center">
                            <div className="mb-2">
                              <div className="h-32 flex items-end justify-center">
                                <div
                                  className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t-lg"
                                  style={{
                                    height: `${Math.max(bucket.percentage, 5)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              {bucket.range}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {bucket.count} ({bucket.percentage}%)
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Empty State */}
            {pipelineReports.length === 0 && (!assessmentReport || assessmentReport.totalAssessments === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum dado disponível
                  </h3>
                  <p className="text-sm text-gray-600">
                    Quando você tiver candidatos e avaliações, os relatórios aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
