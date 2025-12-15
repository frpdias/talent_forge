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
} from 'lucide-react';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  totalApplications: number;
  avgTimeToHire: number;
  conversionRate: number;
}

interface PipelineReport {
  stageDistribution: Array<{ stage: string; count: number; percentage: number }>;
  conversionRates: Array<{ from: string; to: string; rate: number }>;
}

interface AssessmentReport {
  avgScores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  completionRate: number;
  avgFitScore: number;
}

interface Job {
  id: string;
  title: string;
}

export default function ReportsPage() {
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipelineReport, setPipelineReport] = useState<PipelineReport | null>(null);
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
      setPipelineReport((pipelineData as any).data);
      setAssessmentReport((assessmentData as any).data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const traitLabels: Record<string, string> = {
    openness: 'Abertura',
    conscientiousness: 'Conscienciosidade',
    extraversion: 'Extroversão',
    agreeableness: 'Amabilidade',
    neuroticism: 'Neuroticismo',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Relatórios"
        subtitle="Métricas e análises do seu processo seletivo"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <Select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            options={[
              { value: '', label: 'Todas as vagas' },
              ...jobs.map((job) => ({ value: job.id, label: job.title })),
            ]}
            className="w-64"
          />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total de Candidatos</p>
                    <p className="text-2xl font-bold">{stats.totalCandidates}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Taxa de Conversão</p>
                    <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fit Score Médio</p>
                    <p className="text-2xl font-bold">{assessmentReport?.avgFitScore || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <BarChart3 className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tempo Médio para Contratar</p>
                    <p className="text-2xl font-bold">{stats.avgTimeToHire} dias</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Distribution */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Distribuição do Pipeline</h3>
            </div>
            <CardContent className="p-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Carregando...
                </div>
              ) : pipelineReport?.stageDistribution.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nenhum dado disponível
                </div>
              ) : (
                <div className="space-y-4">
                  {pipelineReport?.stageDistribution.map((stage) => (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                        <span className="text-sm text-gray-500">
                          {stage.count} ({stage.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${stage.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment Traits */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Perfil Comportamental Médio</h3>
            </div>
            <CardContent className="p-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Carregando...
                </div>
              ) : !assessmentReport?.avgScores ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nenhuma avaliação concluída
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(assessmentReport.avgScores).map(([trait, score]) => (
                    <div key={trait}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {traitLabels[trait] || trait}
                        </span>
                        <span className="text-sm text-gray-500">{Math.round(score)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-purple-600 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        {pipelineReport?.conversionRates && pipelineReport.conversionRates.length > 0 && (
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Taxas de Conversão por Etapa</h3>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {pipelineReport.conversionRates.map((conversion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="default">{conversion.from}</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge variant="default">{conversion.to}</Badge>
                    <span className="text-sm font-medium text-green-600">
                      {conversion.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
