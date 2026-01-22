'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
import { Activity, LogOut, Sparkles } from 'lucide-react';
import { colorApi } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';

type ColorCode = 'azul' | 'rosa' | 'amarelo' | 'verde' | 'branco';

interface Option {
  code: ColorCode;
  text: string;
}

interface ColorResult {
  scores: Record<ColorCode, number>;
  primary: ColorCode;
  secondary: ColorCode;
  order: ColorCode[];
}

interface Question {
  id: string;
  prompt: string;
  options: Option[];
}

const colorProfiles: Record<ColorCode, { label: string; description: string }> = {
  azul: {
    label: 'Azul',
    description: 'Perfil analítico, metódico e orientado a detalhes. Valoriza precisão e qualidade.',
  },
  rosa: {
    label: 'Rosa',
    description: 'Perfil relacional, empático e colaborativo. Valoriza harmonia e conexões humanas.',
  },
  amarelo: {
    label: 'Amarelo',
    description: 'Perfil criativo, entusiasta e comunicativo. Valoriza inovação e reconhecimento.',
  },
  verde: {
    label: 'Verde',
    description: 'Perfil estável, paciente e confiável. Valoriza segurança e consistência.',
  },
  branco: {
    label: 'Branco',
    description: 'Perfil adaptável, diplomático e flexível. Valoriza equilíbrio e versatilidade.',
  },
};

export default function ColorTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ColorCode>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ColorResult | null>(null);
  const router = useRouter();
  const { signOut } = useAuth();
  const supabase = createClient();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        if (!user || !session?.access_token) {
          router.push('/login');
          return;
        }
        setUserId(user.id);
        setToken(session.access_token);

        // Perguntas
        const questionData = await colorApi.listQuestions(session.access_token);
        const questionItems = (questionData as any)?.items ?? questionData;
        const mapped: Question[] = (Array.isArray(questionItems) ? questionItems : []).map((q: any) => ({
          id: q.id,
          prompt: q.prompt,
          options: [
            { code: 'azul' as ColorCode, text: q.option_azul },
            { code: 'rosa' as ColorCode, text: q.option_rosa },
            { code: 'amarelo' as ColorCode, text: q.option_amarelo },
            { code: 'verde' as ColorCode, text: q.option_verde },
            { code: 'branco' as ColorCode, text: q.option_branco },
          ],
        }));
        setQuestions(mapped);

        // Assessment
        const assessment = await colorApi.createAssessment(user.id, session.access_token);
        const assessmentData = (assessment as any)?.data ?? assessment;
        const created = Array.isArray(assessmentData) ? assessmentData[0] : assessmentData;
        setAssessmentId(created?.id);
      } catch (err: any) {
        console.error('Erro ao iniciar teste das cores:', err?.message || err);
        setError(err?.message || 'Erro ao iniciar teste.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = questions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const progress = questions.length ? Math.round((totalAnswered / questions.length) * 100) : 0;

  const handleSelect = async (color: ColorCode) => {
    if (!currentQuestion || !assessmentId || !token || saving) return;
    setSaving(true);
    const newAnswers = { ...answers, [currentQuestion.id]: color };
    setAnswers(newAnswers);
    try {
      console.log('[ColorTest] Salvando resposta:', { assessmentId, questionId: currentQuestion.id, color });
      const resp = await colorApi.submitResponse(assessmentId, currentQuestion.id, color, token);
      console.log('[ColorTest] Resposta salva com sucesso:', resp);
      
      // Verifica se é a última pergunta
      if (currentIndex < questions.length - 1) {
        // Avança automaticamente para a próxima pergunta
        setCurrentIndex((prev) => prev + 1);
      } else {
        // É a última pergunta, finaliza o teste automaticamente
        console.log('[ColorTest] Última pergunta respondida, finalizando teste...');
        setSaving(false);
        await finalizeTest(newAnswers);
        return;
      }
    } catch (err: any) {
      console.error('Erro ao salvar resposta:', err?.message || err);
      setError(err?.message || 'Erro ao salvar resposta');
    } finally {
      setSaving(false);
    }
  };

  const finalizeTest = async (finalAnswers?: Record<string, ColorCode>) => {
    if (!assessmentId || !token) {
      console.error('[ColorTest] Não é possível finalizar: assessmentId ou token ausente');
      return;
    }
    const answersToCheck = finalAnswers || answers;
    console.log('[ColorTest] Verificando respostas:', { 
      totalRespostas: Object.keys(answersToCheck).length, 
      totalPerguntas: questions.length 
    });
    
    // Permitir finalização se tiver pelo menos 80% das respostas ou se for chamado pela última pergunta
    if (Object.keys(answersToCheck).length < questions.length * 0.8 && !finalAnswers) {
      alert(`Responda mais perguntas antes de finalizar. (${Object.keys(answersToCheck).length}/${questions.length})`);
      return;
    }
    try {
      setSaving(true);
      console.log('[ColorTest] Finalizando teste...', { assessmentId });
      const res = await colorApi.finalize(assessmentId, token);
      console.log('[ColorTest] Resultado da finalização:', res);
      const resData = (res as any)?.data ?? res;
      const scores = (resData as any)?.scores as Record<ColorCode, number> | undefined;
      if (!scores) {
        throw new Error('Resultado inválido ao finalizar o teste (scores ausentes)');
      }
      const order = (Object.keys(scores) as ColorCode[]).sort((a, b) => scores[b] - scores[a]);
      setResult({
        scores,
        primary: (resData as any).primary_color,
        secondary: (resData as any).secondary_color,
        order,
      });
    } catch (err: any) {
      console.error('Erro ao finalizar teste:', err?.message || err);
      setError(err?.message || 'Erro ao finalizar teste');
    } finally {
      setSaving(false);
    }
  };

  // Removido: goNext e goPrev (avanço automático)

  const resetTest = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (loading || saving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-[#141042]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
          <p className="mt-4 text-sm text-[#666666]">
            {loading ? 'Carregando teste das cores...' : 'Salvando resposta...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-4">
        <Card className="border border-[#E5E5DC] bg-white p-6 text-center shadow-sm">
          <CardTitle className="text-[#141042] mb-2">Erro</CardTitle>
          <p className="text-sm text-[#666666]">{error}</p>
        </Card>
      </div>
    );
  }

  if (!currentQuestion && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-[#666666]">
        Carregando perguntas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#141042]">
      <div className="relative max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#141042] border border-[#E5E5DC]">
              <Sparkles className="h-4 w-4 text-[#F97316]" />
              Teste das Cores (100 perguntas)
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141042]">Mapa de Cores Predominantes</h1>
            <p className="text-sm text-[#666666]">
              Escolha a alternativa que mais representa seu comportamento em cada situação. Linguagem corporativa,
              orientada a ritmo, decisão, comunicação e propósito.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">

            <Button
              variant="ghost"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="border border-[#E5E5DC] bg-white text-[#141042] hover:border-[#141042] hover:bg-[#F5F5F0] flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4 text-[#141042]" />
              Sair
            </Button>
            {/* Botão Voltar removido pois navegação manual não é mais necessária */}
            <Progress value={progress} className="mt-3 h-2 bg-[#F5F5F0]" />
          </div>
          <div className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#999999]">Perguntas</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#141042]">{currentIndex + 1}</span>
              <span className="text-[#999999] text-xs">de {questions.length}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#666666]">
              <Activity className="h-4 w-4 text-[#1F4ED8]" />
              Responda de forma instintiva
            </div>
          </div>
        </div>

        {result ? (
          <Card className="border border-[#E5E5DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#141042]">Relatório do Teste das Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#E5E5DC] bg-[#FAFAF8] p-4 text-[#141042]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#999999]">Cor predominante</p>
                    <p className="text-2xl font-bold">{colorProfiles[result.primary].label}</p>
                    <p className="text-sm text-[#666666]">
                      Secundária: {colorProfiles[result.secondary].label}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handlePrint}
                      className="bg-[#141042] text-white hover:bg-[#1f1a66]"
                    >
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handlePrint}
                      className="border-[#E5E5DC] text-[#141042] hover:border-[#141042] hover:bg-[#F5F5F0]"
                    >
                      Baixar PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.order.map((code) => (
                  <div
                    key={code}
                    className="rounded-xl border border-[#E5E5DC] bg-white p-4 text-[#141042] shadow-sm hover:border-[#141042]/40 transition-colors"
                    title={colorProfiles[code].description}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{colorProfiles[code].label}</p>
                      <span className="text-xs text-[#999999]">
                        {result.scores[code]} / {questions.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F5F5F0] overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-[#141042]"
                        style={{ width: `${Math.min((result.scores[code] / questions.length) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-[#666666]">{colorProfiles[code].description}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={resetTest} className="bg-[#141042] hover:bg-[#1f1a66] text-white">
                  Refazer teste
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/candidate')}
                  className="border-[#E5E5DC] text-[#141042] hover:border-[#141042] hover:bg-[#F5F5F0]"
                >
                  Voltar ao dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-[#E5E5DC] bg-white shadow-sm">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl font-semibold text-[#141042]">Pergunta {currentIndex + 1}</CardTitle>
              <p className="text-sm text-[#666666]">{currentQuestion.prompt}</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {currentQuestion.options.map(({ code, text }) => {
                const selected = answers[currentQuestion.id] === code;
                const colorBg =
                  code === 'azul'
                    ? 'from-blue-500/10 to-blue-500/20'
                    : code === 'rosa'
                      ? 'from-pink-500/10 to-pink-500/20'
                      : code === 'amarelo'
                        ? 'from-amber-500/10 to-amber-500/20'
                        : code === 'verde'
                          ? 'from-emerald-500/10 to-emerald-500/20'
                          : 'from-gray-400/10 to-gray-400/20';
                const borderColor =
                  code === 'azul'
                    ? 'border-blue-200'
                    : code === 'rosa'
                      ? 'border-pink-200'
                      : code === 'amarelo'
                        ? 'border-amber-200'
                        : code === 'verde'
                          ? 'border-emerald-200'
                          : 'border-gray-200';
                return (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    className={`group relative overflow-hidden rounded-2xl border px-4 py-5 text-left transition duration-200 ${
                      selected
                        ? `${borderColor} bg-[#F5F5F0]`
                        : 'border-[#E5E5DC] bg-white hover:border-[#141042]/40 hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                        selected ? 'opacity-100' : ''
                      } bg-linear-to-br ${colorBg}`}
                    />
                    <div className="relative">
                      <p className="text-xs sm:text-sm font-semibold text-[#141042] leading-relaxed">
                        {text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {!result && (
          <div className="sticky bottom-4">
            <div className="rounded-2xl border border-[#E5E5DC] bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-[#666666]">
                  {totalAnswered} de {questions.length} respondidas • Tempo estimado restante: ~
                  {Math.max(1, Math.ceil((questions.length - totalAnswered) * 0.3))} min
                </div>
                <div className="flex gap-3">
                  {totalAnswered >= questions.length && (
                    <Button
                      onClick={() => finalizeTest()}
                      className="bg-[#141042] hover:bg-[#1f1a66] text-white"
                      disabled={saving}
                    >
                      {saving ? 'Finalizando...' : 'Finalizar Teste'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-4 right-4 z-30">
        <img
          src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
          alt="Talent Forge"
          className="h-16 w-auto opacity-70"
        />
      </div>
    </div>
  );
}
