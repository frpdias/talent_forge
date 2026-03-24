'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ITQuestion {
  id: string;
  categoria: string;
  pergunta: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
}

interface Props {
  token: string;
  nivel: string;
  onClose: (completed?: boolean) => void;
}

const NIVEL_LABEL: Record<string, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
const OPTION_COLORS: Record<string, { active: string; border: string; dot: string }> = {
  A: { active: 'bg-blue-50 border-blue-400',    border: 'border-gray-200 hover:border-blue-300',   dot: 'bg-blue-400' },
  B: { active: 'bg-emerald-50 border-emerald-400', border: 'border-gray-200 hover:border-emerald-300', dot: 'bg-emerald-400' },
  C: { active: 'bg-amber-50 border-amber-400',   border: 'border-gray-200 hover:border-amber-300',   dot: 'bg-amber-400' },
  D: { active: 'bg-violet-50 border-violet-400', border: 'border-gray-200 hover:border-violet-300', dot: 'bg-violet-400' },
};

export default function ItTestModal({ token, nivel, onClose }: Props) {
  const [questions, setQuestions] = useState<ITQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { question_id: 'A'|'B'|'C'|'D' }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; correct_answers: number; total_questions: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/it-test/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Erro ao carregar questões.');
          return;
        }

        if (data.already_completed) {
          setResult({ score: data.score, correct_answers: 0, total_questions: 0 });
          return;
        }

        setQuestions(data.questions ?? []);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar questões.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [token]);

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;
  const progress = totalQ ? Math.round(((currentIdx + 1) / totalQ) * 100) : 0;
  const answered = Object.keys(answers).length;
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const handleSelect = (option: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  const handleNext = () => {
    if (currentIdx < totalQ - 1) setCurrentIdx((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  };

  const handleSubmitAttempt = () => {
    const unanswered = totalQ - answered;
    if (unanswered > 0) {
      setShowConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
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
      setResult({ score: data.score, correct_answers: data.correct_answers, total_questions: data.total_questions });
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar respostas.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionText = (q: ITQuestion, opt: typeof OPTION_KEYS[number]) => {
    if (opt === 'A') return q.alternativa_a;
    if (opt === 'B') return q.alternativa_b;
    if (opt === 'C') return q.alternativa_c;
    return q.alternativa_d;
  };

  const scoreColor = result
    ? result.score >= 70 ? 'text-emerald-600' : result.score >= 50 ? 'text-amber-600' : 'text-red-500'
    : 'text-[#141042]';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
      style={{ background: '#FAFAF8' }}
      role="dialog"
      aria-modal="true"
    >
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex flex-col" style={{ background: '#141042' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
              alt="Talent Forge"
              className="h-7 w-auto opacity-90"
            />
            <div className="border-l border-white/20 pl-3">
              <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                Teste de Informática · {NIVEL_LABEL[nivel] ?? nivel}
              </p>
              {!result && totalQ > 0 && (
                <p className="text-[11px] text-white/60 mt-0.5">
                  Questão {currentIdx + 1} de {totalQ}
                </p>
              )}
            </div>
          </div>

          {!result && (
            <button
              onClick={() => onClose(false)}
              className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
            >
              Sair
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        {!result && totalQ > 0 && (
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-2xl mx-auto w-full">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 mt-16">
            <div className="w-8 h-8 rounded-full border-4 border-[#141042]/20 border-t-[#141042] animate-spin" />
            <p className="text-sm text-[#666]">Carregando questões...</p>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <div className="mt-16 text-center space-y-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={() => onClose(false)} className="text-sm text-[#3B82F6] underline">Fechar</button>
          </div>
        )}

        {/* Resultado */}
        {result && !loading && (
          <div className="w-full mt-8 flex flex-col items-center gap-6">
            <div className="bg-white border border-[#E5E5DC] rounded-2xl p-8 shadow-sm text-center w-full max-w-md">
              <div className="text-6xl mb-4">
                {result.score >= 70 ? '🎉' : result.score >= 50 ? '👍' : '📚'}
              </div>
              <h2 className="text-xl font-bold text-[#141042] mb-1">Teste concluído!</h2>
              <p className="text-sm text-[#666] mb-6">Nível {NIVEL_LABEL[nivel] ?? nivel}</p>

              <div className={`text-5xl font-bold mb-2 ${scoreColor}`}>
                {result.score.toFixed(0)}%
              </div>

              {result.total_questions > 0 && (
                <p className="text-sm text-[#888] mb-6">
                  {result.correct_answers} de {result.total_questions} corretas
                </p>
              )}

              <div className="text-sm text-[#555] leading-relaxed bg-[#F5F5F0] rounded-xl p-4">
                {result.score >= 70
                  ? 'Ótimo resultado! Seu conhecimento em informática está acima da média.'
                  : result.score >= 50
                  ? 'Resultado razoável. Continue praticando para melhorar seu desempenho.'
                  : 'Há oportunidade de crescimento. Estude os fundamentos de informática para o próximo nível.'}
              </div>
            </div>

            <button
              onClick={() => onClose(true)}
              className="bg-[#141042] hover:bg-[#1a1660] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Questões */}
        {!loading && !error && !result && currentQ && (
          <div className="w-full space-y-6">
            {/* Categoria */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80 bg-[#141042] px-3 py-1 rounded-full">
                {currentQ.categoria}
              </span>
              <span className="text-xs text-[#999]">
                {answered}/{totalQ} respondidas
              </span>
            </div>

            {/* Pergunta */}
            <div className="bg-white border border-[#E5E5DC] rounded-2xl p-6 shadow-sm">
              <p className="text-base sm:text-lg font-medium text-[#141042] leading-relaxed">
                {currentQ.pergunta}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-3">
              {OPTION_KEYS.map((opt) => {
                const isSelected = currentAnswer === opt;
                const colors = OPTION_COLORS[opt];
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                      isSelected ? colors.active : `bg-white ${colors.border}`
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                      isSelected ? colors.dot : 'bg-gray-200 text-gray-500'
                    }`}>
                      {opt}
                    </div>
                    <span className="text-sm text-[#333] leading-snug">
                      {getOptionText(currentQ, opt)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navegação */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-5 py-2.5 rounded-xl border border-[#E5E5DC] text-sm font-medium text-[#555] hover:bg-[#F5F5F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>

              {/* Paleta de navegação rápida */}
              <div className="hidden sm:flex items-center gap-1 flex-wrap justify-center max-w-xs">
                {questions.slice(0, 20).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                      i === currentIdx
                        ? 'bg-[#141042] text-white'
                        : answers[q.id]
                        ? 'bg-[#10B981] text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                {questions.length > 20 && (
                  <span className="text-xs text-[#999]">+{questions.length - 20}</span>
                )}
              </div>

              {currentIdx < totalQ - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-[#141042] text-white text-sm font-semibold hover:bg-[#1a1660] transition-colors"
                >
                  Próxima →
                </button>
              ) : (
                <button
                  onClick={handleSubmitAttempt}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-semibold hover:bg-[#0ea271] disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Finalizar'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de confirmação de envio com perguntas em branco ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <div className="text-3xl">⚠️</div>
            <h3 className="font-bold text-[#141042]">Questões não respondidas</h3>
            <p className="text-sm text-[#666]">
              Você deixou {totalQ - answered} questão(ões) sem resposta. Deseja finalizar mesmo assim?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E5DC] text-sm font-medium text-[#555] hover:bg-[#F5F5F0] transition-colors"
              >
                Revisar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#10B981] text-white text-sm font-semibold hover:bg-[#0ea271] transition-colors"
              >
                Finalizar assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
