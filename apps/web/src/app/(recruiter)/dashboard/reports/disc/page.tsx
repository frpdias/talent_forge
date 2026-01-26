'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface DISCStats {
  profile: string;
  count: number;
  percentage: number;
  averageScore: number;
}

interface TeamDynamics {
  profile: string;
  count: number;
  strengths: string[];
}

export default function DISCReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DISCStats[]>([]);
  const [totalAssessments, setTotalAssessments] = useState(0);
  const [teamDynamics, setTeamDynamics] = useState<TeamDynamics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get all DISC results
      const { data: discResults } = await supabase
        .from('disc_assessments')
        .select(`
          primary_profile,
          dominance_score,
          influence_score,
          steadiness_score,
          conscientiousness_score,
          assessment_id,
          assessments!inner(status, candidate_id)
        `)
        .eq('assessments.status', 'completed');

      if (discResults && discResults.length > 0) {
        setTotalAssessments(discResults.length);

        // Calculate stats by profile
        const profileStats: Record<string, { count: number; scores: number[] }> = {
          D: { count: 0, scores: [] },
          I: { count: 0, scores: [] },
          S: { count: 0, scores: [] },
          C: { count: 0, scores: [] },
        };

        discResults.forEach((result) => {
          const profile = result.primary_profile as keyof typeof profileStats;
          profileStats[profile].count++;
          profileStats[profile].scores.push(
            (result.dominance_score +
              result.influence_score +
              result.steadiness_score +
              result.conscientiousness_score) /
              4
          );
        });

        // Convert to stats array
        const statsArray: DISCStats[] = [];
        Object.entries(profileStats).forEach(([profile, data]) => {
          if (data.count > 0) {
            const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
            statsArray.push({
              profile,
              count: data.count,
              percentage: Math.round((data.count / discResults.length) * 100),
              averageScore: Math.round(averageScore),
            });
          }
        });

        // Sort by count descending
        statsArray.sort((a, b) => b.count - a.count);
        setStats(statsArray);

        // Team dynamics
        const dynamics: TeamDynamics[] = [
          {
            profile: 'D',
            count: profileStats.D.count,
            strengths: ['Liderança', 'Tomada de decisão', 'Foco em resultados'],
          },
          {
            profile: 'I',
            count: profileStats.I.count,
            strengths: ['Comunicação', 'Inspiração', 'Networking'],
          },
          {
            profile: 'S',
            count: profileStats.S.count,
            strengths: ['Cooperação', 'Confiabilidade', 'Paciência'],
          },
          {
            profile: 'C',
            count: profileStats.C.count,
            strengths: ['Qualidade', 'Análise', 'Atenção aos detalhes'],
          },
        ];

        setTeamDynamics(dynamics.filter(d => d.count > 0));
      }

      setLoading(false);
    };

    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProfileColor = (profile: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      D: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
      I: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      S: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      C: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    };
    return colors[profile] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  };

  const getProfileName = (profile: string) => {
    const names: Record<string, string> = {
      D: 'Dominância',
      I: 'Influência',
      S: 'Estabilidade',
      C: 'Consciência',
    };
    return names[profile] || profile;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios DISC</h1>
        <p className="text-gray-600">Análise dos perfis de personalidade dos seus candidatos</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totalAssessments}</p>
          </CardContent>
        </Card>

        {stats.map((stat) => (
          <Card key={stat.profile}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {getProfileName(stat.profile)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
              <p className="text-xs text-gray-600">{stat.percentage}% do total</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Distribuição de Perfis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => {
              const colors = getProfileColor(stat.profile);
              return (
                <div key={stat.profile}>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${colors.bg} ${colors.text}`}>
                        {stat.profile}
                      </div>
                      <span className="font-medium text-gray-900">
                        {getProfileName(stat.profile)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {stat.count} pessoas ({stat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${colors.bg}`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Dynamics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {teamDynamics.map((dynamic) => {
          const colors = getProfileColor(dynamic.profile);
          return (
            <Card key={dynamic.profile} className={`border-2 ${colors.border}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  <span className={colors.text}>{getProfileName(dynamic.profile)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {dynamic.count} membro{dynamic.count !== 1 ? 's' : ''} com este perfil
                </p>
                <div>
                  <p className="font-semibold text-gray-900 mb-2 text-sm">Contribuições principais:</p>
                  <ul className="space-y-1">
                    {dynamic.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className={colors.text}>•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Insights da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.length > 0 && (
              <>
                <p className="text-gray-700">
                  <span className="font-semibold">Maior grupo:</span> {stats[0].count} pessoas com
                  perfil {getProfileName(stats[0].profile)} ({stats[0].percentage}%)
                </p>
                {stats.length > 1 && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Diversidade:</span> Sua equipe possui{' '}
                    <span className="font-bold">{stats.length}</span> perfis DISC diferentes, o que
                    indica uma boa diversidade de estilos de trabalho e comunicação.
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-semibold">Recomendação:</span> Aproveite a diversidade de
                  perfis para criar equipes equilibradas que combinem liderança, comunicação,
                  estabilidade e atenção aos detalhes.
                </p>
              </>
            )}
            {stats.length === 0 && (
              <p className="text-gray-600">Nenhuma avaliação DISC concluída ainda.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
        Imprimir Relatório
      </Button>
    </div>
  );
}
