'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Monitor, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  categoria: string;
  pergunta: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
}

interface TestData {
  assignment_id: string;
  nivel: 'junior' | 'pleno' | 'senior';
  candidate_name: string;
  org_name: string;
  total_questions: number;
  questions: Question[];
}

interface CompletedData {
  already_completed: boolean;
  score: number;
  nivel: string;
  completed_at: string;
}

const NIVEL_LABELS: Record<string, string> = {
  junior: 'Júnior',
  pleno:  'Pleno',
  senior: 'Sênior',
};

const ALTERNATIVAS: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

const alternativaKey = (alt: 'A' | 'B' | 'C' | 'D'): keyof Question =>
  `alternativa_${alt.toLowerCase()}` as keyof Question;

export default function ItTestPage() {
  const params = useParams();
  const token  = params?.token as string;

  const [testData,       setTestData]       = useState<TestData | null>(null);
  const [completedData,  setCompletedData]  = useState<CompletedData | null>(null);
  const [answers,        setAnswers]        = useState<Record<string, string>>({});
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [result,         setResult]         = useState<{ score: number; correct: number; total: number; nivel: string } | null>(null);
  const [error,          setError]          = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/it-test/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.already_completed) {
          setCompletedData(data as CompletedData);
        } else if (data.error) {
          setError(data.error);
        } else {
          setTestData(data as TestData);
        }
      })
      .catch(() => setError('Erro ao carregar o teste. Tente novamente.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit() {
    if (!testData) return;
    const unanswered = testData.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const ok = window.confirm(
        `Você ainda tem ${unanswered.length} ${unanswered.length === 1 ? 'questão' : 'questões'} sem resposta. Deseja enviar mesmo assim?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/it-test/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao enviar respostas.');
        return;
      }
      setResult({
        score:   data.score,
        correct: data.correct_answers,
        total:   data.total_questions,
        nivel:   data.nivel,
      });
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Estados de carregamento / erro ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#141042] animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Carregando seu teste…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link inválido</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  // ── Já completou ────────────────────────────────────────────────────
  if (completedData) {
    return (
      <ScreenResult
        score={completedData.score}
        nivel={completedData.nivel}
        alreadyDone
      />
    );
  }

  // ── Resultado após submissão ─────────────────────────────────────────
  if (result) {
    return (
      <ScreenResult
        score={result.score}
        correct={result.correct}
        total={result.total}
        nivel={result.nivel}
      />
    );
  }

  if (!testData) return null;

  const question    = testData.questions[currentIndex];
  const isLast      = currentIndex === testData.questions.length - 1;
  const answered    = Object.keys(answers).length;
  const progress    = (answered / testData.total_questions) * 100;
  const hasAnswer   = !!answers[question.id];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#141042] text-white px-6 py-4 flex items-center gap-3">
        <Monitor className="w-6 h-6 text-[#10B981]" />
        <div>
          <p className="text-xs text-slate-300">Teste de Informática · {NIVEL_LABELS[testData.nivel]}</p>
          <p className="text-sm font-semibold">{testData.org_name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-300">Olá,</p>
          <p className="text-sm font-semibold truncate max-w-37.5">{testData.candidate_name}</p>
        </div>
      </header>

      {/* Progresso global */}
      <div className="bg-white border-b border-slate-100 px-6 py-2">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{answered} respondidas</span>
          <span>{testData.total_questions} questões total</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Índice + categoria */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full">
            {question.categoria}
          </span>
          <span className="text-xs text-slate-400">
            Questão {currentIndex + 1} de {testData.total_questions}
          </span>
        </div>

        {/* Pergunta */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5">
          <p className="text-slate-800 font-medium leading-relaxed text-base">
            {question.pergunta}
          </p>
        </div>

        {/* Alternativas */}
        <div className="space-y-3 mb-8">
          {ALTERNATIVAS.map(alt => {
            const text     = question[alternativaKey(alt)] as string;
            const selected = answers[question.id] === alt;

            return (
              <button
                key={alt}
                onClick={() => setAnswers(prev => ({ ...prev, [question.id]: alt }))}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-150 ${
                  selected
                    ? 'border-[#141042] bg-[#141042]/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                    selected
                      ? 'border-[#141042] bg-[#141042] text-white'
                      : 'border-slate-300 text-slate-500'
                  }`}
                >
                  {alt}
                </span>
                <span className={`text-sm leading-relaxed ${selected ? 'text-[#141042] font-medium' : 'text-slate-700'}`}>
                  {text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {submitting ? 'Enviando…' : 'Finalizar Teste'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => Math.min(testData.questions.length - 1, i + 1))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#141042] text-white hover:bg-[#1e1866] transition-colors"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Paleta de navegação rápida */}
        <div className="mt-8 bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500 mb-3 font-medium">Navegação rápida</p>
          <div className="flex flex-wrap gap-2">
            {testData.questions.map((q, idx) => {
              const done    = !!answers[q.id];
              const current = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    current
                      ? 'bg-[#141042] text-white shadow-sm'
                      : done
                      ? 'bg-[#10B981]/20 text-emerald-700 hover:bg-[#10B981]/30'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Tela de resultado ──────────────────────────────────────────────────
function ScreenResult({
  score,
  correct,
  total,
  nivel,
  alreadyDone = false,
}: {
  score: number;
  correct?: number;
  total?:   number;
  nivel:    string;
  alreadyDone?: boolean;
}) {
  const scoreNum  = Math.round(score);
  const isGood    = scoreNum >= 60;
  const isGreat   = scoreNum >= 80;

  const emoji  = isGreat ? '🎉' : isGood ? '✅' : '📝';
  const label  = isGreat ? 'Excelente resultado!' : isGood ? 'Bom resultado!' : 'Continue praticando!';
  const color  = isGreat ? 'text-emerald-600' : isGood ? 'text-blue-600' : 'text-amber-600';
  const bg     = isGreat ? 'bg-emerald-50'    : isGood ? 'bg-blue-50'    : 'bg-amber-50';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">{emoji}</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{label}</h1>
        <p className="text-slate-500 text-sm mb-6">
          Teste de Informática · Nível {NIVEL_LABELS[nivel] ?? nivel}
        </p>

        <div className={`${bg} rounded-2xl p-6 mb-6`}>
          <p className={`text-5xl font-extrabold ${color}`}>{scoreNum}%</p>
          {correct != null && total != null && (
            <p className="text-slate-500 text-sm mt-2">
              {correct} de {total} questões corretas
            </p>
          )}
        </div>

        {alreadyDone && (
          <p className="text-sm text-slate-400 mt-2">
            Você já completou este teste anteriormente.
          </p>
        )}

        <p className="text-xs text-slate-400 mt-4">
          Seu resultado foi registrado e enviado ao recrutador.
        </p>
      </div>
    </div>
  );
}
