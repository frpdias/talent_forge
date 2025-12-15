'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, Sparkles, Shield, Target, ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DISCQuestion {
  id: string;
  question_number: number;
  description: string;
  option_d: string;
  option_i: string;
  option_s: string;
  option_c: string;
}

interface UserResponse {
  questionId: string;
  selected: 'D' | 'I' | 'S' | 'C';
}

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

export default function DISCAssessmentPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DISCQuestion[]>([]);
  const [questionSequence, setQuestionSequence] = useState<DISCQuestion[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    const initialize = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUserId(user.id);

        // Get DISC questions
        const { data: questionData, error: questionsError } = await supabase
          .from('disc_questions')
          .select('*')
          .order('question_number', { ascending: true });

        if (questionsError) {
          console.error('Erro ao carregar perguntas DISC:', questionsError.message);
          setLoadError(questionsError.message);
        } else if (questionData) {
          setQuestions(questionData);
        }

        // Buscar candidato existente pelo e-mail (evita usar candidate_profiles que tem FK diferente)
        const { data: candidateList, error: candidateError } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1);

        const candidate = Array.isArray(candidateList) ? candidateList[0] : null;

        if (candidateError || !candidate) {
          // Tentar criar um candidato mínimo para permitir o teste DISC
          const { data: newCandidate, error: createCandidateError } = await supabase
            .from('candidates')
            .insert({
              owner_org_id: DEFAULT_ORG_ID,
              full_name: user.user_metadata?.full_name || user.email,
              email: user.email,
              created_by: user.id,
            })
            .select('id')
            .maybeSingle();

          if (createCandidateError || !newCandidate) {
            const message =
              createCandidateError?.message ||
              'Nenhum registro de candidato encontrado e não foi possível criar um novo. Contate o suporte.';
            setLoadError(message);
            setLoading(false);
            alert(message);
            return;
          }

          candidateList?.push(newCandidate);
          // segue usando o novo candidato
        }

        const candidateId = (Array.isArray(candidateList) ? candidateList[0]?.id : null) || undefined;

        if (!candidateId) {
          const message = 'Não foi possível resolver o cadastro do candidato.';
          setLoadError(message);
          setLoading(false);
          alert(message);
          return;
        }

      // Criar assessment vinculado ao candidato e ao usuário atual
        // Criar assessment
        const { error: assessmentError } = await supabase
          .from('assessments')
          .insert({
            candidate_id: candidateId,
            candidate_user_id: user.id,
            assessment_type: 'disc',
            status: 'in_progress',
            title: 'Teste DISC'
          });

        if (assessmentError) {
          const message = `Erro ao criar avaliação: ${assessmentError.message}`;
          setLoadError(message);
          setLoading(false);
          alert(message);
          return;
        }

        // Recupera o assessment recém-criado
        const { data: latestAssessment, error: fetchError } = await supabase
          .from('assessments')
          .select('id')
          .eq('candidate_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError || !latestAssessment) {
          const message = fetchError?.message || 'Não foi possível recuperar a avaliação criada.';
          setLoadError(message);
          setLoading(false);
          alert(message);
          return;
        }

      setAssessmentId(latestAssessment.id);
      setLoading(false);
    } catch (err: any) {
      console.error('Erro ao inicializar DISC:', err);
      const message = err?.message || 'Erro inesperado ao iniciar a avaliação.';
        setLoadError(message);
        alert(message);
        setLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monta sequência de 48 perguntas (duas rodadas: 24 originais + 24 duplicadas/ordenadas, segunda rodada embaralhada)
  useEffect(() => {
    if (questions.length === 0) return;

    // Ordena por número da questão
    const sorted = [...questions].sort((a, b) => a.question_number - b.question_number);
    const firstBlock = sorted.slice(0, 24);
    const secondBlock = sorted.slice(24);

    // Embaralha segunda rodada e garante que não repete imediatamente a última da primeira
    const shuffledSecond = [...secondBlock].sort(() => Math.random() - 0.5);
    if (
      firstBlock.length > 0 &&
      shuffledSecond.length > 1 &&
      shuffledSecond[0].id === firstBlock[firstBlock.length - 1].id
    ) {
      [shuffledSecond[0], shuffledSecond[1]] = [shuffledSecond[1], shuffledSecond[0]];
    }

    setQuestionSequence([...firstBlock, ...shuffledSecond]);
  }, [questions]);

  const handleSelectOption = (option: 'D' | 'I' | 'S' | 'C') => {
    const current = questionSequence[currentQuestion];
    const questionId = current?.id;
    if (!questionId) return;

    const existingResponse = responses.find(r => r.questionId === questionId);

    if (existingResponse) {
      setResponses(responses.map(r =>
        r.questionId === questionId ? { ...r, selected: option } : r
      ));
    } else {
      setResponses([...responses, { questionId, selected: option }]);
    }
  };

  const handleExit = () => {
    router.push('/candidate');
  };

  const handleNext = () => {
    if (currentQuestion < questionSequence.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (loadError) {
      alert(loadError);
      return;
    }

    if (!assessmentId) {
      alert('Não foi possível criar a avaliação. Recarregue a página e tente novamente.');
      return;
    }

    if (responses.length !== questionSequence.length) {
      alert('Por favor, responda todas as perguntas antes de enviar');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      // Save responses
      for (const response of responses) {
        const { error: respError } = await supabase
          .from('disc_responses')
          .upsert({
            assessment_id: assessmentId,
            question_id: response.questionId,
            selected_option: response.selected,
          });

        if (respError) {
          throw respError;
        }
      }

      // Calculate scores
      const scores = calculateDISCScores(responses, questionSequence.length);

      // Save DISC results
      const { error: discError } = await supabase
        .from('disc_assessments')
        .upsert({
          assessment_id: assessmentId,
          dominance_score: scores.D,
          influence_score: scores.I,
          steadiness_score: scores.S,
          conscientiousness_score: scores.C,
          primary_profile: scores.primary,
          secondary_profile: scores.secondary,
          description: generateDISCDescription(scores.primary),
          strengths: getDISCStrengths(scores.primary),
          challenges: getDISCChallenges(scores.primary),
          work_style: getWorkStyle(scores.primary),
          communication_style: getCommunicationStyle(scores.primary),
        });

      if (discError) {
        throw discError;
      }

      // Update assessment (ajustado ao schema atual)
      const overallScore = Math.max(scores.D, scores.I, scores.S, scores.C);
      const traitsPayload = {
        disc: {
          D: scores.D,
          I: scores.I,
          S: scores.S,
          C: scores.C,
          primary: scores.primary,
          secondary: scores.secondary,
        },
      };

      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          normalized_score: overallScore,
          traits: traitsPayload,
        })
        .eq('id', assessmentId);

      if (updateError) {
        throw updateError;
      }

      router.push(`/disc-results/${assessmentId}`);
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      alert(`Erro ao salvar suas respostas: ${error?.message || 'tente novamente'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || questionSequence.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Não foi possível carregar as perguntas da avaliação</p>
            {loadError && (
              <p className="text-sm text-red-600 mt-2 break-words">
                Detalhes: {loadError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questionSequence[currentQuestion];
  const progress = ((currentQuestion + 1) / questionSequence.length) * 100;
  const currentResponse = responses.find(r => r.questionId === currentQ.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-purple-500 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Avaliação DISC
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Seu raio-x comportamental</h1>
            <p className="text-slate-200/80">
              Escolha a alternativa que mais representa seu estilo. Leva cerca de 5 minutos.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              onClick={handleExit}
              className="border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair do teste
            </Button>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-300">Progresso</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                  <span className="text-slate-400 text-sm">completo</span>
                </div>
                <Progress value={progress} className="mt-3 h-2 bg-white/10" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-300">Perguntas</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">
                    {currentQuestion + 1}
                  </span>
                  <span className="text-slate-400 text-sm">de {questions.length}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
                  <Activity className="h-4 w-4 text-emerald-300" />
                  Responda de forma instintiva
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question + options */}
        <Card className="border border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <Shield className="h-4 w-4 text-cyan-300" />
              Pergunta {currentQuestion + 1}
            </div>
            <CardTitle className="text-2xl font-semibold text-white">{currentQ.description}</CardTitle>
            <CardDescription className="text-base text-slate-200">
              Selecione a alternativa mais próxima do seu comportamento natural.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { option: 'D', text: currentQ.option_d, color: 'from-red-500/60 to-red-600/80', border: 'border-red-400/40' },
              { option: 'I', text: currentQ.option_i, color: 'from-amber-400/60 to-amber-500/80', border: 'border-amber-300/50' },
              { option: 'S', text: currentQ.option_s, color: 'from-emerald-400/60 to-emerald-500/80', border: 'border-emerald-300/50' },
              { option: 'C', text: currentQ.option_c, color: 'from-sky-400/60 to-sky-500/80', border: 'border-sky-300/50' },
            ].map(({ option, text, color, border }) => {
              const selected = currentResponse?.selected === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option as 'D' | 'I' | 'S' | 'C')}
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-5 text-left transition duration-200 ${selected ? `${border} bg-white/10` : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                >
                  <div className={`absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-20 ${selected ? 'opacity-30' : ''} bg-gradient-to-br ${color}`} />
                  <div className="relative">
                    <p className="text-sm font-semibold text-white leading-relaxed drop-shadow-sm">
                      {text}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Navigation sticky */}
        <div className="sticky bottom-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-200">
                {responses.length} de {questions.length} respondidas • Tempo estimado restante: ~{Math.max(1, Math.ceil((questions.length - responses.length) * 0.3))} min
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="border-white/30 text-white hover:border-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                {currentQuestion === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={responses.length !== questions.length || submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {submitting ? 'Enviando...' : 'Finalizar avaliação'}
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!currentResponse}
                  >
                    Próxima
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function calculateDISCScores(
  responses: UserResponse[],
  totalQuestions: number
): { D: number; I: number; S: number; C: number; primary: string; secondary: string } {
  const scores = { D: 0, I: 0, S: 0, C: 0 };

  responses.forEach(response => {
    const selected = response.selected as keyof typeof scores;
    scores[selected]++;
  });

  // Normalize scores
  const total = totalQuestions || responses.length;
  const normalized = {
    D: Math.round((scores.D / total) * 100),
    I: Math.round((scores.I / total) * 100),
    S: Math.round((scores.S / total) * 100),
    C: Math.round((scores.C / total) * 100),
  };

  // Get primary profile
  let primary = 'D';
  let primaryScore = normalized.D;
  if (normalized.I > primaryScore) { primary = 'I'; primaryScore = normalized.I; }
  if (normalized.S > primaryScore) { primary = 'S'; primaryScore = normalized.S; }
  if (normalized.C > primaryScore) { primary = 'C'; primaryScore = normalized.C; }

  // Get secondary profile
  let secondary = 'D';
  let secondaryScore = normalized.D;
  ['I', 'S', 'C'].forEach(profile => {
    const score = normalized[profile as keyof typeof normalized];
    if (profile !== primary && score > secondaryScore) {
      secondary = profile;
      secondaryScore = score;
    }
  });

  return { ...normalized, primary, secondary };
}

function generateDISCDescription(profile: string): string {
  const descriptions: Record<string, string> = {
    D: 'Você é um(a) líder natural, focado em resultados e direto. Você gosta de desafios e prefere controlar situações.',
    I: 'Você é entusiasmado(a) e sociável, com forte capacidade de influência. Você motiva os outros e busca relacionamentos significativos.',
    S: 'Você é estável e confiável, preferindo harmonia e cooperação. Você é um(a) ótimo(a) apoiador(a) de equipe.',
    C: 'Você é detalhista e orientado por qualidade, buscando excelência. Você prefere ambientes estruturados e lógicos.',
  };
  return descriptions[profile] || 'Perfil único baseado em suas respostas';
}

function getDISCStrengths(profile: string): string[] {
  const strengths: Record<string, string[]> = {
    D: ['Liderança', 'Tomada de decisão rápida', 'Confiança', 'Foco em resultados'],
    I: ['Comunicação', 'Inspiração', 'Networking', 'Criatividade'],
    S: ['Lealdade', 'Paciência', 'Cooperação', 'Confiabilidade'],
    C: ['Atenção aos detalhes', 'Análise crítica', 'Qualidade', 'Precisão'],
  };
  return strengths[profile] || [];
}

function getDISCChallenges(profile: string): string[] {
  const challenges: Record<string, string[]> = {
    D: ['Pode ser impaciente', 'Pode ignorar detalhes', 'Pode parecer insensível', 'Dificuldade em delegar'],
    I: ['Pode ser impulsivo', 'Falta de atenção aos detalhes', 'Dificuldade em manter foco', 'Excesso de otimismo'],
    S: ['Pode ser passivo(a)', 'Dificuldade em mudanças', 'Falta de iniciativa', 'Dificuldade em assertividade'],
    C: ['Pode ser perfeccionista', 'Dificuldade com a mudança', 'Pode ser crítico(a) demais', 'Paralisia por análise'],
  };
  return challenges[profile] || [];
}

function getWorkStyle(profile: string): string {
  const styles: Record<string, string> = {
    D: 'Você trabalha melhor quando tem autonomia, desafios e responsabilidades claras. Prefere resultados rápidos.',
    I: 'Você trabalha melhor em ambientes colaborativos, com muita interação. Precisa de variedade e reconhecimento.',
    S: 'Você trabalha melhor com processos consistentes, em equipes estáveis. Aprecia segurança e relacionamentos duradouros.',
    C: 'Você trabalha melhor com dados, estrutura e clareza. Prefere ambientes previsíveis e procedimentos bem definidos.',
  };
  return styles[profile] || '';
}

function getCommunicationStyle(profile: string): string {
  const styles: Record<string, string> = {
    D: 'Direto, objetivo, focado em resultados',
    I: 'Entusiasmado, expressivo, focado em relacionamentos',
    S: 'Calmo, ouvinte, focado em cooperação',
    C: 'Lógico, preciso, focado em fatos',
  };
  return styles[profile] || '';
}
