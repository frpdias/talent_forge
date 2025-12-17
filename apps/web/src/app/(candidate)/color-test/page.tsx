'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
import { Activity, LogOut, Sparkles } from 'lucide-react';
import { colorApi } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        {loading ? 'Carregando teste das cores...' : 'Salvando resposta...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Card className="bg-white/5 border-white/10 p-6 text-center">
          <CardTitle className="text-white mb-2">Erro</CardTitle>
          <p className="text-slate-200">{error}</p>
        </Card>
      </div>
    );
  }

  if (!currentQuestion && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Carregando perguntas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-purple-500 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Teste das Cores (100 perguntas)
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Mapa de Cores Predominantes</h1>
            <p className="text-slate-200/80">
              Escolha a alternativa que mais representa seu comportamento em cada situação. Linguagem corporativa,
              orientada a ritmo, decisão, comunicação e propósito.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">

            <Button
              variant="ghost"
              onClick={() => router.push('/candidate')}
              className="border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
            {/* Botão Voltar removido pois navegação manual não é mais necessária */}
            <Progress value={progress} className="mt-3 h-2 bg-white/10" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-300">Perguntas</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{currentIndex + 1}</span>
              <span className="text-slate-400 text-sm">de {questions.length}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
              <Activity className="h-4 w-4 text-emerald-300" />
              Responda de forma instintiva
            </div>
          </div>
        </div>

        {result ? (
          <Card className="border border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Relatório do Teste das Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/70">Cor predominante</p>
                    <p className="text-2xl font-bold">{colorProfiles[result.primary].label}</p>
                    <p className="text-sm text-white/80">
                      Secundária: {colorProfiles[result.secondary].label}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handlePrint}
                      className="bg-white text-slate-900 hover:bg-white/90"
                    >
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handlePrint}
                      className="border-white/60 text-white hover:border-white hover:bg-white/10"
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
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/90 shadow-sm"
                    title={colorProfiles[code].description}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{colorProfiles[code].label}</p>
                      <span className="text-sm text-white/70">
                        {result.scores[code]} / {questions.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-white/70"
                        style={{ width: `${Math.min((result.scores[code] / questions.length) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-white/80">{colorProfiles[code].description}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={resetTest} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Refazer teste
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/candidate')}
                  className="border-white/40 text-white hover:border-white hover:bg-white/10"
                >
                  Voltar ao dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-white/10 bg-white/5 backdrop-blur">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl font-semibold text-white">Pergunta {currentIndex + 1}</CardTitle>
              <p className="text-base text-slate-200">{currentQuestion.prompt}</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {currentQuestion.options.map(({ code, text }) => {
                const selected = answers[currentQuestion.id] === code;
                const colorBg =
                  code === 'azul'
                    ? 'from-blue-500/60 to-blue-600/80'
                    : code === 'rosa'
                      ? 'from-rose-400/60 to-rose-500/80'
                      : code === 'amarelo'
                        ? 'from-amber-400/60 to-amber-500/80'
                        : code === 'verde'
                          ? 'from-emerald-400/60 to-emerald-500/80'
                          : 'from-slate-200/60 to-slate-300/80';
                const borderColor =
                  code === 'azul'
                    ? 'border-blue-300/50'
                    : code === 'rosa'
                      ? 'border-rose-300/50'
                      : code === 'amarelo'
                        ? 'border-amber-300/50'
                        : code === 'verde'
                          ? 'border-emerald-300/50'
                          : 'border-slate-300/60';
                return (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    className={`group relative overflow-hidden rounded-2xl border px-4 py-5 text-left transition duration-200 ${
                      selected
                        ? `${borderColor} bg-white/10`
                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-20 ${
                        selected ? 'opacity-30' : ''
                      } bg-gradient-to-br ${colorBg}`}
                    />
                    <div className="relative">
                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed drop-shadow-sm">
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
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 shadow-2xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-200">
                  {totalAnswered} de {questions.length} respondidas • Tempo estimado restante: ~
                  {Math.max(1, Math.ceil((questions.length - totalAnswered) * 0.3))} min
                </div>
                <div className="flex gap-3">
                  {totalAnswered >= questions.length && (
                    <Button
                      onClick={() => finalizeTest()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
    </div>
  );
}
