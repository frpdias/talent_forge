'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';

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

const OPTIONS = ['A', 'B', 'C', 'D'] as const;

const OPTION_STYLE: Record<string, { selected: string; hover: string; dotBase: string; dotSelected: string }> = {
  A: { selected: 'bg-blue-50 border-blue-400 shadow-sm',    hover: 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/40',    dotBase: 'bg-gray-100 text-gray-400', dotSelected: 'bg-blue-500 text-white' },
  B: { selected: 'bg-emerald-50 border-emerald-400 shadow-sm', hover: 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/40', dotBase: 'bg-gray-100 text-gray-400', dotSelected: 'bg-emerald-500 text-white' },
  C: { selected: 'bg-amber-50 border-amber-400 shadow-sm',   hover: 'border-gray-200 hover:border-amber-200 hover:bg-amber-50/40',   dotBase: 'bg-gray-100 text-gray-400', dotSelected: 'bg-amber-500 text-white' },
  D: { selected: 'bg-violet-50 border-violet-400 shadow-sm', hover: 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/40', dotBase: 'bg-gray-100 text-gray-400', dotSelected: 'bg-violet-500 text-white' },
};

function getOptionText(q: ITQuestion, opt: typeof OPTIONS[number]) {
  const map = { A: q.alternativa_a, B: q.alternativa_b, C: q.alternativa_c, D: q.alternativa_d };
  return map[opt];
}

export default function ItTestModal({ token, nivel, onClose }: Props) {
  const [questions, setQuestions]     = useState<ITQuestion[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult]           = useState<{ score: number; correct_answers: number; total_questions: number } | null>(null);

  /* Escape key + body scroll lock */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !result) onClose(false);
  }, [result, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  /* Fetch questions */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res  = await fetch(`/api/it-test/${token}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Erro ao carregar questões.'); return; }
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
    })();
  }, [token]);

  const totalQ      = questions.length;
  const currentQ    = questions[currentIdx];
  const answered    = Object.keys(answers).length;
  const progress    = totalQ ? (answered / totalQ) * 100 : 0;
  const currentAns  = currentQ ? answers[currentQ.id] : undefined;

  const handleSelect = (opt: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
    /* auto-advance after 280 ms */
    setTimeout(() => {
      if (currentIdx < totalQ - 1) setCurrentIdx((i) => i + 1);
    }, 280);
  };

  const handleSubmitAttempt = () => {
    if (totalQ - answered > 0) setShowConfirm(true);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/it-test/${token}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao enviar respostas.'); return; }
      setResult({ score: data.score, correct_answers: data.correct_answers, total_questions: data.total_questions });
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar respostas.');
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = result
    ? result.score >= 70 ? 'text-emerald-600' : result.score >= 50 ? 'text-amber-500' : 'text-red-500'
    : '';

  return createPortal(
    /* ── Overlay ── */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(14,14,40,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !result) onClose(false); }}
      role="dialog"
      aria-modal="true"
    >
      {/* ── Panel ── */}
      <div
        className="relative flex flex-col bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{ maxWidth: 640, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: '#141042' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Monitor size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider leading-none">
                Teste de Informática
              </p>
              <p className="text-sm font-bold text-white mt-0.5">
                Nível {NIVEL_LABEL[nivel] ?? nivel}
              </p>
            </div>
          </div>
          {!result && (
            <button
              onClick={() => onClose(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Progress bar + stats ── */}
        {!result && totalQ > 0 && (
          <div className="shrink-0 px-5 pt-3 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>Questão <span className="font-semibold text-[#141042]">{currentIdx + 1}</span> de {totalQ}</span>
              <span><span className="font-semibold text-[#10B981]">{answered}</span> respondidas</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: '#10B981' }}
              />
            </div>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-8 h-8 rounded-full border-4 border-[#141042]/20 border-t-[#141042] animate-spin" />
              <p className="text-sm text-gray-400">Carregando questões...</p>
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className="py-12 text-center space-y-3">
              <p className="text-red-500 font-medium text-sm">{error}</p>
              <button onClick={() => onClose(false)} className="text-sm text-[#3B82F6] underline">Fechar</button>
            </div>
          )}

          {/* Resultado */}
          {result && !loading && (
            <div className="py-6 flex flex-col items-center gap-5">
              {/* Score circle */}
              <div
                className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-inner"
                style={{
                  borderColor: result.score >= 70 ? '#10B981' : result.score >= 50 ? '#F59E0B' : '#EF4444',
                  background:  result.score >= 70 ? '#F0FDF4'  : result.score >= 50 ? '#FFFBEB'  : '#FEF2F2',
                }}
              >
                <span className={`text-3xl font-bold ${scoreColor}`}>{result.score.toFixed(0)}%</span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">score</span>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-[#141042]">Teste concluído!</h2>
                {result.total_questions > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    {result.correct_answers} de {result.total_questions} questões corretas
                  </p>
                )}
              </div>

              <div className="w-full bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed text-center">
                {result.score >= 70
                  ? '🎉 Ótimo resultado! Seu conhecimento em informática está acima da média.'
                  : result.score >= 50
                  ? '👍 Resultado razoável. Continue praticando para melhorar seu desempenho.'
                  : '📚 Há espaço para crescimento. Estude os fundamentos para o próximo nível.'}
              </div>

              <button
                onClick={() => onClose(true)}
                className="mt-2 bg-[#141042] hover:bg-[#1a1660] text-white font-semibold px-8 py-2.5 rounded-xl transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Questões */}
          {!loading && !error && !result && currentQ && (
            <div className="space-y-4">
              {/* Categoria badge */}
              <span className="inline-flex text-xs font-semibold uppercase tracking-wider text-white bg-[#141042] px-3 py-1 rounded-full">
                {currentQ.categoria}
              </span>

              {/* Enunciado */}
              <p className="text-[15px] font-medium text-[#141042] leading-relaxed">
                {currentQ.pergunta}
              </p>

              {/* Alternativas */}
              <div className="space-y-2.5 pt-1">
                {OPTIONS.map((opt) => {
                  const isSelected = currentAns === opt;
                  const style = OPTION_STYLE[opt];
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                        isSelected ? style.selected : `bg-white border-gray-200 ${style.hover}`
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected ? style.dotSelected : style.dotBase
                      }`}>
                        {opt}
                      </div>
                      <span className="text-sm text-gray-700 leading-snug">
                        {getOptionText(currentQ, opt)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Paleta de navegação rápida */}
              <div className="flex items-center gap-1 flex-wrap pt-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    title={`Questão ${i + 1}`}
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
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && !result && totalQ > 0 && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} /> Anterior
            </button>

            {currentIdx < totalQ - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: '#141042' }}
              >
                Próxima <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmitAttempt}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                style={{ background: '#10B981' }}
              >
                {submitting ? 'Enviando...' : 'Finalizar ✓'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm dialog (questões em branco) ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="text-3xl">⚠️</div>
            <h3 className="font-bold text-[#141042]">Questões sem resposta</h3>
            <p className="text-sm text-gray-500">
              Você deixou <strong>{totalQ - answered}</strong> questão(ões) sem resposta. Deseja finalizar mesmo assim?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Revisar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: '#10B981' }}
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
