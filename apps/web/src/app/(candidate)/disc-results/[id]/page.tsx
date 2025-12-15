'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

interface DISCResult {
  dominance_score: number;
  influence_score: number;
  steadiness_score: number;
  conscientiousness_score: number;
  primary_profile: string;
  secondary_profile: string;
  description: string;
  strengths: string[];
  challenges: string[];
  work_style: string;
  communication_style: string;
}

export default function DISCResultsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [result, setResult] = useState<DISCResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const loadResults = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Get assessment
      const { data: assessment } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (!assessment || assessment.candidate_user_id !== user.id) {
        router.push('/candidate');
        return;
      }

      // Get DISC results
      const { data: discResult } = await supabase
        .from('disc_assessments')
        .select('*')
        .eq('assessment_id', assessmentId)
        .single();

      if (discResult) {
        setResult(discResult);
      }

      setLoading(false);
    };

    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando seus resultados...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Não foi possível carregar seus resultados</p>
            <Button onClick={() => router.push('/candidate')} className="w-full text-white bg-blue-600 hover:bg-blue-700">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getProfileColor = (profile: string) => {
    const colors: Record<string, string> = {
      D: 'from-red-500 to-red-600',
      I: 'from-yellow-500 to-yellow-600',
      S: 'from-green-500 to-green-600',
      C: 'from-blue-500 to-blue-600',
    };
    return colors[profile] || 'from-gray-500 to-gray-600';
  };

const getProfileName = (profile: string) => {
  const names: Record<string, string> = {
    D: 'Dominante (D)',
    I: 'Influência (I)',
    S: 'Estabilidade (S)',
    C: 'Consciência (C)',
  };
  return names[profile] || profile;
};

const discProfileSummary: Record<string, string> = {
  D: 'Foco em resultados, decisão rápida e assertividade.',
  I: 'Comunicação intensa, influência e energia para mobilizar pessoas.',
  S: 'Estabilidade, consistência e suporte ao time em ritmo orgânico.',
  C: 'Rigor, precisão, qualidade e orientação a processos bem definidos.',
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seus Resultados DISC</h1>
          <p className="text-gray-600">Seu perfil de comportamento e personalidade</p>
        </div>

        {/* Primary Profile Card */}
        <Card className="mb-6 border bg-white text-gray-900">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">{getProfileName(result.primary_profile)}</CardTitle>
            <p className="text-gray-800 mt-2">{result.description}</p>
          </CardHeader>
        </Card>

        {/* Score Distribution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Distribuição de Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Dominância (D)', score: result.dominance_score, color: 'bg-red-500', code: 'D' },
                { label: 'Influência (I)', score: result.influence_score, color: 'bg-yellow-500', code: 'I' },
                { label: 'Estabilidade (S)', score: result.steadiness_score, color: 'bg-green-500', code: 'S' },
                { label: 'Consciência (C)', score: result.conscientiousness_score, color: 'bg-blue-500', code: 'C' },
              ].map(({ label, score, color, code }) => (
                <div key={label}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900" title={discProfileSummary[code]}>
                      {label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{score}%</span>
                  </div>
                  <Progress value={score} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Pontos Fortes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 font-bold mr-3">✓</span>
                    <span className="text-gray-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Áreas de Desenvolvimento</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-600 font-bold mr-3">!</span>
                    <span className="text-gray-800">{challenge}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Work Style & Communication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Estilo de Trabalho</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{result.work_style}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Estilo de Comunicação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{result.communication_style}</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Profile */}
        {result.secondary_profile && (
            <Card className="mb-6 bg-white text-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Perfil Secundário: {getProfileName(result.secondary_profile)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">
                  Além de sua tendência principal {getProfileName(result.primary_profile).toLowerCase()}, você também apresenta características do perfil {getProfileName(result.secondary_profile).toLowerCase()}, o que o(a) torna uma pessoa versátil e adaptável.
                </p>
              </CardContent>
            </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={() => router.push('/candidate')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </Button>
          <Button 
            onClick={() => window.print()}
            variant="outline"
            className="flex-1"
          >
            Baixar Relatório
          </Button>
        </div>
      </div>
    </div>
  );
}
