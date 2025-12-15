'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Send, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  current_title: string;
  area_of_expertise: string;
}

interface Assessment {
  id: string;
  candidate_id: string;
  assessment_type: string;
  status: string;
  completed_at: string;
  candidate: Candidate;
}

interface DISCResult {
  primary_profile: string;
  dominance_score: number;
  influence_score: number;
  steadiness_score: number;
  conscientiousness_score: number;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [discResults, setDiscResults] = useState<Record<string, DISCResult>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Get candidates from recruiter's organization
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id);

      if (orgMembers && orgMembers.length > 0) {
        const orgId = orgMembers[0].org_id;

        // Get candidates
        const { data: candidateData } = await supabase
          .from('candidates')
          .select('id, full_name, email, current_title, area_of_expertise')
          .eq('owner_org_id', orgId);

        if (candidateData) {
          setCandidates(candidateData);
        }

        // Get assessments
        const { data: assessmentData } = await supabase
          .from('assessments')
          .select(`
            id,
            candidate_id,
            assessment_type,
            status,
            completed_at,
            candidates!inner(id, full_name, email, current_title, area_of_expertise)
          `)
          .in('candidate_id', candidateData?.map(c => c.id) || []);

        if (assessmentData) {
          // Get DISC results for completed assessments
          const discAssessmentIds = assessmentData
            .filter(a => a.assessment_type === 'disc' && a.status === 'completed')
            .map(a => a.id);

          if (discAssessmentIds.length > 0) {
            const { data: discData } = await supabase
              .from('disc_assessments')
              .select('assessment_id, primary_profile, dominance_score, influence_score, steadiness_score, conscientiousness_score')
              .in('assessment_id', discAssessmentIds);

            if (discData) {
              const resultsMap: Record<string, DISCResult> = {};
              discData.forEach(result => {
                resultsMap[result.assessment_id] = result as DISCResult;
              });
              setDiscResults(resultsMap);
            }
          }

          setAssessments(assessmentData);
        }
      }

      setLoading(false);
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAssessments = assessments.filter(a => {
    const candidate = candidates.find(c => c.id === a.candidate_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      candidate?.full_name.toLowerCase().includes(searchLower) ||
      candidate?.email.toLowerCase().includes(searchLower) ||
      a.assessment_type.includes(searchLower)
    );
  });

  const getProfileColor = (profile: string) => {
    const colors: Record<string, string> = {
      D: 'bg-red-100 text-red-800',
      I: 'bg-yellow-100 text-yellow-800',
      S: 'bg-green-100 text-green-800',
      C: 'bg-blue-100 text-blue-800',
    };
    return colors[profile] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessments dos Candidatos</h1>
        <p className="text-gray-600">Visualize e gerencie os testes de personalidade dos seus candidatos</p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nome, email ou tipo de teste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4 mr-2" />
          Enviar Convite
        </Button>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4">
        {filteredAssessments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum assessment encontrado'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssessments.map((assessment) => {
            const candidate = candidates.find(c => c.id === assessment.candidate_id);
            const discResult = discResults[assessment.id];

            return (
              <Card key={assessment.id} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{candidate?.full_name}</h3>
                      <p className="text-sm text-gray-600">{candidate?.email}</p>
                      <p className="text-sm text-gray-500">{candidate?.current_title}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                        {assessment.status === 'completed' ? 'Concluído' : 'Em progresso'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {assessment.assessment_type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* DISC Results if available */}
                  {discResult && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getProfileColor(discResult.primary_profile)}`}>
                          {discResult.primary_profile}
                        </div>
                        <div className="grid grid-cols-4 gap-4 flex-1">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{discResult.dominance_score}%</div>
                            <div className="text-xs text-gray-600">Dominância</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{discResult.influence_score}%</div>
                            <div className="text-xs text-gray-600">Influência</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{discResult.steadiness_score}%</div>
                            <div className="text-xs text-gray-600">Estabilidade</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{discResult.conscientiousness_score}%</div>
                            <div className="text-xs text-gray-600">Consciência</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/candidates/${candidate?.id}/results`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Relatório
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    {assessment.completed_at
                      ? `Concluído em ${new Date(assessment.completed_at).toLocaleDateString('pt-BR')}`
                      : 'Aguardando conclusão'}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
