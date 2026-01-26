'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/client';

interface Candidate {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  current_title: string;
  area_of_expertise: string;
  phone: string;
  city: string;
  state: string;
}

interface Assessment {
  id: string;
  assessment_type: string;
  status: string;
  completed_at: string;
  traits?: any;
}

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

export default function CandidateResultsPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [discResult, setDiscResult] = useState<DISCResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get candidate
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateData) {
        setCandidate(candidateData);
      }

      let resolvedCandidateUserId: string | null = candidateData?.user_id ?? null;
      if (!resolvedCandidateUserId && candidateData?.email) {
        const { data: profileByEmail } = await supabase
          .from('candidate_profiles')
          .select('user_id')
          .eq('email', candidateData.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        resolvedCandidateUserId = profileByEmail?.user_id ?? null;
      }

      const candidateIds = new Set<string>([candidateId]);
      if (candidateData?.email) {
        const { data: candidatesByEmail } = await supabase
          .from('candidates')
          .select('id')
          .ilike('email', candidateData.email)
          .limit(10);
        (candidatesByEmail || []).forEach((row) => candidateIds.add(row.id));
      }

      // Get assessments
      const { data: assessmentData } = await supabase
        .from('assessments')
        .select('*')
        .or(
          (() => {
            const ids = Array.from(candidateIds);
            const idFilter = ids.length > 0 ? `candidate_id.in.(${ids.join(',')})` : '';
            const userFilter = resolvedCandidateUserId ? `candidate_user_id.eq.${resolvedCandidateUserId}` : '';
            return [idFilter, userFilter].filter(Boolean).join(',');
          })()
        );

      if (assessmentData) {
        setAssessments(assessmentData);

        // Get DISC results if available
        const discAssessment = assessmentData
          .filter(a => a.assessment_type === 'disc' && a.status === 'completed')
          .sort((a, b) => {
            const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
            const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
            return bTime - aTime;
          })[0];

        if (discAssessment) {
          const { data: discData } = await supabase
            .from('disc_assessments')
            .select('*')
            .eq('assessment_id', discAssessment.id)
            .single();

          if (discData) {
            setDiscResult(discData as DISCResult);
          } else {
            const discTraits = (discAssessment as any)?.traits?.disc;
            if (discTraits) {
              setDiscResult({
                dominance_score: Number(discTraits.D ?? discTraits.dominance_score ?? 0),
                influence_score: Number(discTraits.I ?? discTraits.influence_score ?? 0),
                steadiness_score: Number(discTraits.S ?? discTraits.steadiness_score ?? 0),
                conscientiousness_score: Number(discTraits.C ?? discTraits.conscientiousness_score ?? 0),
                primary_profile: discTraits.primary ?? discTraits.primary_profile ?? '',
                secondary_profile: discTraits.secondary ?? discTraits.secondary_profile ?? '',
                description: discTraits.description ?? '',
                strengths: discTraits.strengths ?? [],
                challenges: discTraits.challenges ?? [],
                work_style: discTraits.work_style ?? '',
                communication_style: discTraits.communication_style ?? '',
              });
            }
          }
        }
      }

      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Candidato não encontrado</p>
            <Button onClick={() => router.back()} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{candidate.full_name}</h1>
          <p className="text-gray-600">{candidate.email}</p>
        </div>
      </div>

      {/* Candidate Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cargo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{candidate.current_title || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Área de Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{candidate.area_of_expertise || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {candidate.city || '-'}, {candidate.state || '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DISC Results */}
      {discResult ? (
        <>
          {/* Primary Profile */}
          <Card className="mb-6 border bg-white text-gray-900">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                {getProfileName(discResult.primary_profile)}
              </CardTitle>
              <p className="text-gray-800 mt-2">{discResult.description}</p>
            </CardHeader>
          </Card>

          {/* Score Distribution */}
          <Card className="mb-6 bg-white text-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-900">Distribuição de Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    label: 'Dominância (D)',
                    score: discResult.dominance_score,
                    color: 'bg-red-500',
                    code: 'D',
                  },
                  {
                    label: 'Influência (I)',
                    score: discResult.influence_score,
                    color: 'bg-yellow-500',
                    code: 'I',
                  },
                  {
                    label: 'Estabilidade (S)',
                    score: discResult.steadiness_score,
                    color: 'bg-green-500',
                    code: 'S',
                  },
                  {
                    label: 'Consciência (C)',
                    score: discResult.conscientiousness_score,
                    color: 'bg-blue-500',
                    code: 'C',
                  },
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

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Strengths */}
            <Card className="bg-white text-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Pontos Fortes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {discResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">✓</span>
                      <span className="text-gray-800">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Challenges */}
            <Card className="bg-white text-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Áreas de Desenvolvimento</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {discResult.challenges.map((challenge, index) => (
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
            <Card className="bg-white text-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Estilo de Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">{discResult.work_style}</p>
              </CardContent>
            </Card>

            <Card className="bg-white text-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Estilo de Comunicação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">{discResult.communication_style}</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Profile */}
          {discResult.secondary_profile && (
            <Card className="mb-6 bg-white text-gray-900">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  Perfil Secundário: {getProfileName(discResult.secondary_profile)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">
                  Além de sua tendência principal {getProfileName(
                    discResult.primary_profile
                  ).toLowerCase()}, este candidato também apresenta características do
                  perfil {getProfileName(discResult.secondary_profile).toLowerCase()}, o que o
                  torna uma pessoa versátil e adaptável.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Nenhuma avaliação DISC concluída ainda para este candidato
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assessments.length === 0 ? (
              <p className="text-gray-600">Nenhuma avaliação realizada</p>
            ) : (
              assessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{assessment.assessment_type.toUpperCase()}</p>
                      <p className="text-sm text-gray-600">
                        {assessment.completed_at
                          ? `Concluído em ${new Date(assessment.completed_at).toLocaleDateString('pt-BR')}`
                          : 'Em progresso'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      assessment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {assessment.status === 'completed' ? 'Concluído' : 'Em progresso'}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Baixar Relatório Completo
        </Button>
      </div>
    </div>
  );
}
