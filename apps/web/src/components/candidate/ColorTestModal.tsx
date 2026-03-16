'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type ColorCode = 'azul' | 'rosa' | 'amarelo' | 'verde' | 'branco';

interface Question {
  id: string;
  prompt: string;
  option_azul: string;
  option_rosa: string;
  option_amarelo: string;
  option_verde: string;
  option_branco: string;
}

interface ColorResult {
  scores: Record<ColorCode, number>;
  primary_color: ColorCode;
  secondary_color: ColorCode;
}

const COLORS: { code: ColorCode; label: string; bg: string; border: string; grad: string }[] = [
  { code: 'azul',    label: 'Azul',    bg: 'bg-blue-50',    border: 'border-blue-200',   grad: 'from-blue-500/10 to-blue-500/20' },
  { code: 'rosa',    label: 'Rosa',    bg: 'bg-pink-50',    border: 'border-pink-200',   grad: 'from-pink-500/10 to-pink-500/20' },
  { code: 'amarelo', label: 'Amarelo', bg: 'bg-amber-50',   border: 'border-amber-200',  grad: 'from-amber-500/10 to-amber-500/20' },
  { code: 'verde',   label: 'Verde',   bg: 'bg-emerald-50', border: 'border-emerald-200',grad: 'from-emerald-500/10 to-emerald-500/20' },
  { code: 'branco',  label: 'Branco',  bg: 'bg-gray-50',    border: 'border-gray-200',   grad: 'from-gray-400/10 to-gray-400/20' },
];

const COLOR_PROFILES: Record<ColorCode, string> = {
  azul:    'Analítico, metódico e orientado a detalhes. Valoriza precisão e qualidade.',
  rosa:    'Relacional, empático e colaborativo. Valoriza harmonia e conexões humanas.',
  amarelo: 'Criativo, entusiasta e comunicativo. Valoriza inovação e reconhecimento.',
  verde:   'Estável, paciente e confiável. Valoriza segurança e consistência.',
  branco:  'Adaptável, diplomático e flexível. Valoriza equilíbrio e versatilidade.',
};

interface Props {
  onClose: (updated?: boolean) => void;
}

export default function ColorTestModal({ onClose }: Props) {
  const supabase = createClient();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ColorCode>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ColorResult | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: qData, error: qErr } = await supabase
          .from('color_questions')
          .select('*')
          .eq('active', true)
          .order('question_number', { ascending: true });
        if (qErr) throw qErr;

        const { data: assessment, error: aErr } = await supabase
          .from('color_assessments')
          .insert({ candidate_user_id: user.id, status: 'in_progress' })
          .select('id')
          .single();
        if (aErr) throw aErr;

        setQuestions(qData ?? []);
        setAssessmentId(assessment.id);
      } catch (err: any) {
        setError(err?.message || 'Erro ao iniciar teste das cores.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (color: ColorCode) => {
    const q = questions[currentIndex];
    if (!q || !assessmentId || saving) return;
    setSaving(true);

    const newAnswers = { ...answers, [q.id]: color };
    setAnswers(newAnswers);

    try {
      const { error: rErr } = await supabase
        .from('color_responses')
        .upsert(
          { assessment_id: assessmentId, question_id: q.id, selected_color: color },
          { onConflict: 'assessment_id,question_id' },
        );
      if (rErr) throw rErr;

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        await finalizeTest(newAnswers);
        return;
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar resposta.');
    } finally {
      setSaving(false);
    }
  };

  const finalizeTest = async (finalAnswers: Record<string, ColorCode>) => {
    if (!assessmentId) return;
    try {
      setSaving(true);

      const scores: Record<ColorCode, number> = { azul: 0, rosa: 0, amarelo: 0, verde: 0, branco: 0 };
      Object.values(finalAnswers).forEach((c) => { scores[c] = (scores[c] ?? 0) + 1; });

      const order = (Object.keys(scores) as ColorCode[]).sort((a, b) => scores[b] - scores[a]);
      const primary_color = order[0];
      const secondary_color = order[1];

      const { error: uErr } = await supabase
        .from('color_assessments')
        .update({ status: 'completed', completed_at: new Date().toISOString(), primary_color, secondary_color, scores })
        .eq('id', assessmentId);
      if (uErr) throw uErr;

      setResult({ scores, primary_color, secondary_color });
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar teste.');
    } finally {
      setSaving(false);
    }
  };

  const totalAnswered = Object.keys(answers).length;
  const pct = questions.length ? Math.round((totalAnswered / questions.length) * 100) : 0;
  const currentQ = questions[currentIndex];

  return createPortal(
    <div className="fixed inset-0 z-9999 flex flex-col overflow-y-auto" style={{ background: '#FAFAF8' }} role="dialog" aria-modal="true">
      {/* Header — identidade da aplicação */}
      <div className="sticky top-0 z-10 flex flex-col" style={{ background: '#141042' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
              alt="Talent Forge"
              className="h-7 w-auto opacity-90"
            />
            <div className="border-l border-white/20 pl-3">
              <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">Teste das Cores</p>
              {!result && questions.length > 0 && (
                <p className="text-[11px] text-white/50">{totalAnswered} de {questions.length} respondidas</p>
              )}
            </div>
          </div>

          {(!loading && !saving) && (
            <button
              onClick={() => {
                if (!result) {
                  setShowExitConfirm(true);
                  return;
                }
                onClose(!!result);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
              aria-label="Fechar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        {!result && questions.length > 0 && (
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full">
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F59E0B]" />
            <p className="mt-3 text-sm text-[#666]">Carregando perguntas...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center max-w-sm">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => onClose(false)} className="mt-3 text-xs text-red-600 underline">Fechar</button>
          </div>
        )}

        {!loading && !error && !result && currentQ && (
          <>
            <div className="w-full mb-6">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-1">Pergunta {currentIndex + 1}</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] leading-snug">{currentQ.prompt}</h2>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLORS.map(({ code, grad, border }) => {
                const text = currentQ[`option_${code}` as keyof Question] as string;
                const selected = answers[currentQ.id] === code;
                return (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    disabled={saving}
                    className={`group relative overflow-hidden rounded-xl border px-6 py-5 text-left transition-all duration-200 ${
                      selected ? `${border} bg-[#F7F7F2] scale-[0.98]` : 'border-[#E5E5DC] bg-white hover:border-[#141042]/30 hover:-translate-y-0.5'
                    } shadow-[0_1px_4px_rgba(20,16,66,0.06)]`}
                  >
                    <div className={`absolute inset-0 bg-linear-to-br ${grad} opacity-0 group-hover:opacity-100 ${selected ? 'opacity-100' : ''} transition-opacity duration-200`} />
                    <div className="relative flex items-start gap-2">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        code === 'azul' ? 'bg-blue-400' :
                        code === 'rosa' ? 'bg-pink-400' :
                        code === 'amarelo' ? 'bg-amber-400' :
                        code === 'verde' ? 'bg-emerald-400' : 'bg-gray-400'
                      }`} />
                      <p className="text-sm sm:text-base text-[#141042] leading-relaxed">{text}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {saving && <p className="mt-4 text-xs text-[#999] animate-pulse">Salvando...</p>}
          </>
        )}

        {/* Resultado */}
        {result && (
          <div className="w-full space-y-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-1">Resultado</p>
              <h2 className="text-2xl font-bold text-[#141042]">
                {result.primary_color.charAt(0).toUpperCase() + result.primary_color.slice(1)}
              </h2>
              <p className="text-sm text-[#666]">
                Secundária: {result.secondary_color.charAt(0).toUpperCase() + result.secondary_color.slice(1)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {(Object.keys(result.scores) as ColorCode[])
                .sort((a, b) => result.scores[b] - result.scores[a])
                .map((code) => {
                  const colorInfo = COLORS.find((c) => c.code === code)!;
                  const scorePct = questions.length ? Math.round((result.scores[code] / questions.length) * 100) : 0;
                  return (
                    <div key={code} className="bg-white border border-[#E5E5DC] rounded-xl p-4 shadow-[0_1px_4px_rgba(20,16,66,0.06)]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-[#141042]">{colorInfo.label}</p>
                        <span className="text-xs text-[#999]">{result.scores[code]} pts ({scorePct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${
                            code === 'azul' ? 'bg-blue-400' :
                            code === 'rosa' ? 'bg-pink-400' :
                            code === 'amarelo' ? 'bg-amber-400' :
                            code === 'verde' ? 'bg-emerald-400' : 'bg-gray-400'
                          }`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#666]">{COLOR_PROFILES[code]}</p>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => onClose(true)}
              className="w-full mt-4 bg-[#141042] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#1f1a66] transition-colors"
            >
              Ver resultado no dashboard
            </button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showExitConfirm}
        title="Abandonar teste"
        message="Tem certeza que deseja abandonar o teste? Seu progresso será perdido."
        confirmLabel="Abandonar"
        onConfirm={() => { setShowExitConfirm(false); onClose(false); }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>,
    document.body,
  );
}
