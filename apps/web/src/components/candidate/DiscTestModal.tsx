'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';

type DISCOption = 'D' | 'I' | 'S' | 'C';

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
  selected: DISCOption;
}

interface DISCScores {
  D: number; I: number; S: number; C: number;
  primary: string; secondary: string;
}

const OPTION_STYLE: Record<DISCOption, { color: string; border: string; dot: string; label: string }> = {
  D: { color: 'from-red-500/10 to-red-500/20',     border: 'border-red-200',     dot: 'bg-red-400',     label: 'Dominância' },
  I: { color: 'from-amber-500/10 to-amber-500/20', border: 'border-amber-200',   dot: 'bg-amber-400',   label: 'Influência' },
  S: { color: 'from-emerald-500/10 to-emerald-500/20', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Estabilidade' },
  C: { color: 'from-blue-500/10 to-blue-500/20',   border: 'border-blue-200',    dot: 'bg-blue-400',    label: 'Conformidade' },
};

const DISC_DESC: Record<string, string> = {
  D: 'Líder natural, focado em resultados e direto. Gosta de desafios e controle.',
  I: 'Entusiasta e sociável, com forte capacidade de influência. Motiva os outros.',
  S: 'Estável e confiável, prefere harmonia e cooperação. Ótimo apoiador de equipe.',
  C: 'Detalhista e orientado à qualidade. Prefere ambientes estruturados e lógicos.',
};

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

interface Props {
  onClose: (updated?: boolean) => void;
}

export default function DiscTestModal({ onClose }: Props) {
  const supabase = createClient();

  const [questions, setQuestions] = useState<DISCQuestion[]>([]);
  const [sequence, setSequence] = useState<DISCQuestion[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [assessmentId, setAssessmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DISCScores | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: qData, error: qErr } = await supabase
          .from('disc_questions')
          .select('*')
          .order('question_number', { ascending: true });
        if (qErr) throw qErr;
        setQuestions(qData ?? []);

        // Resolver candidate_id
        const { data: candList } = await supabase
          .from('candidates')
          .select('id')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1);

        let candidateId = candList?.[0]?.id;
        if (!candidateId) {
          const { data: newCand, error: cErr } = await supabase
            .from('candidates')
            .insert({ owner_org_id: DEFAULT_ORG_ID, full_name: user.user_metadata?.full_name || user.email, email: user.email, created_by: user.id })
            .select('id')
            .maybeSingle();
          if (cErr) throw cErr;
          candidateId = newCand?.id;
        }
        if (!candidateId) throw new Error('Não foi possível resolver cadastro do candidato.');

        await supabase.from('assessments').insert({
          candidate_id: candidateId,
          candidate_user_id: user.id,
          assessment_type: 'disc',
          status: 'in_progress',
          title: 'Teste DISC',
        });

        const { data: latest } = await supabase
          .from('assessments')
          .select('id')
          .eq('candidate_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!latest) throw new Error('Não foi possível recuperar a avaliação.');
        setAssessmentId(latest.id);
      } catch (err: any) {
        setError(err?.message || 'Erro ao iniciar DISC.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!questions.length) return;
    const sorted = [...questions].sort((a, b) => a.question_number - b.question_number);
    const first = sorted.slice(0, 24);
    const second = [...sorted.slice(24)].sort(() => Math.random() - 0.5);
    setSequence([...first, ...second]);
  }, [questions]);

  const currentQ = sequence[currentIdx];
  const progress = sequence.length ? Math.round(((currentIdx + 1) / sequence.length) * 100) : 0;
  const currentResponse = responses.find((r) => r.questionId === currentQ?.id);

  const handleSelect = (option: DISCOption) => {
    if (!currentQ) return;
    setResponses((prev) => {
      const exists = prev.find((r) => r.questionId === currentQ.id);
      if (exists) return prev.map((r) => r.questionId === currentQ.id ? { ...r, selected: option } : r);
      return [...prev, { questionId: currentQ.id, selected: option }];
    });
  };

  const handleSubmit = async () => {
    if (!assessmentId || responses.length !== sequence.length) return;
    setSubmitting(true);
    try {
      for (const r of responses) {
        const { error: rErr } = await supabase
          .from('disc_responses')
          .upsert({ assessment_id: assessmentId, question_id: r.questionId, selected_option: r.selected });
        if (rErr) throw rErr;
      }

      const scores = calcScores(responses, sequence.length);

      const { error: dErr } = await supabase.from('disc_assessments').upsert({
        assessment_id: assessmentId,
        dominance_score: scores.D,
        influence_score: scores.I,
        steadiness_score: scores.S,
        conscientiousness_score: scores.C,
        primary_profile: scores.primary,
        secondary_profile: scores.secondary,
        description: DISC_DESC[scores.primary],
        strengths: getDISCStrengths(scores.primary),
        challenges: getDISCChallenges(scores.primary),
        work_style: getWorkStyle(scores.primary),
        communication_style: getCommunicationStyle(scores.primary),
      });
      if (dErr) throw dErr;

      await supabase
        .from('assessments')
        .update({ normalized_score: Math.max(scores.D, scores.I, scores.S, scores.C), traits: { disc: scores }, status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', assessmentId);

      setResult(scores);
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar DISC.');
    } finally {
      setSubmitting(false);
    }
  };

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
              <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">Avaliação DISC</p>
              {!result && sequence.length > 0 && (
                <p className="text-[11px] text-white/50">{responses.length} de {sequence.length} respondidas</p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (!result && !error) {
                if (!window.confirm('Tem certeza que deseja abandonar o teste? Seu progresso será perdido.')) return;
              }
              onClose(!!result);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Barra de progresso */}
        {!result && sequence.length > 0 && (
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full">
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#141042]" />
            <p className="mt-3 text-sm text-[#666]">Carregando avaliação...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => onClose(false)} className="mt-3 text-xs text-red-600 underline">Fechar</button>
          </div>
        )}

        {/* Pergunta */}
        {!loading && !error && !result && currentQ && (
          <>
            <div className="w-full mb-6">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-1">
                Pergunta {currentIdx + 1} de {sequence.length}
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] leading-snug">
                {currentQ.description}
              </h2>
              <p className="text-sm text-[#999] mt-2">Selecione a alternativa mais próxima do seu comportamento natural.</p>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['D', 'I', 'S', 'C'] as DISCOption[]).map((opt) => {
                const text = currentQ[`option_${opt.toLowerCase()}` as keyof DISCQuestion] as string;
                const style = OPTION_STYLE[opt];
                const selected = currentResponse?.selected === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`group relative overflow-hidden rounded-xl border px-6 py-5 text-left transition-all duration-200 ${
                      selected ? `${style.border} bg-[#F7F7F2] scale-[0.98]` : 'border-[#E5E5DC] bg-white hover:border-[#141042]/30 hover:-translate-y-0.5'
                    } shadow-[0_1px_4px_rgba(20,16,66,0.06)]`}
                  >
                    <div className={`absolute inset-0 bg-linear-to-br ${style.color} opacity-0 group-hover:opacity-100 ${selected ? 'opacity-100' : ''} transition-opacity`} />
                    <div className="relative flex items-start gap-2">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                      <p className="text-sm sm:text-base text-[#141042] leading-relaxed">{text}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navegação */}
            <div className="w-full mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl border border-[#E5E5DC] text-sm text-[#141042] hover:bg-[#F5F5F0] disabled:opacity-30 transition-colors"
              >
                ← Anterior
              </button>

              <span className="text-xs text-[#999]">{responses.length} / {sequence.length} respondidas</span>

              {currentIdx < sequence.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  disabled={!currentResponse}
                  className="px-4 py-2 rounded-xl bg-[#141042] text-white text-sm font-medium hover:bg-[#1f1a66] disabled:opacity-30 transition-colors"
                >
                  Próxima →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={responses.length !== sequence.length || submitting}
                  className="px-4 py-2 rounded-xl bg-[#10B981] text-white text-sm font-medium hover:bg-[#059669] disabled:opacity-40 transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Finalizar ✓'}
                </button>
              )}
            </div>
          </>
        )}

        {/* Resultado */}
        {result && (
          <div className="w-full space-y-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-1">Resultado</p>
              <h2 className="text-2xl font-bold text-[#141042]">Perfil {result.primary}</h2>
              <p className="text-sm text-[#666] mt-1">{DISC_DESC[result.primary]}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['D', 'I', 'S', 'C'] as DISCOption[]).map((opt) => {
                const style = OPTION_STYLE[opt];
                const score = result[opt];
                const isPrimary = result.primary === opt;
                return (
                  <div key={opt} className={`bg-white border rounded-xl p-4 shadow-[0_1px_4px_rgba(20,16,66,0.06)] ${isPrimary ? style.border : 'border-[#E5E5DC]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <p className="text-xs font-semibold text-[#141042]">{opt} — {style.label}</p>
                      </div>
                      <span className="text-xs text-[#999]">{score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                      <div className={`h-full rounded-full ${style.dot}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#F7F7F2] border border-[#E5E5DC] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-2">Perfil Secundário: {result.secondary}</p>
              <p className="text-sm text-[#666]">{DISC_DESC[result.secondary]}</p>
            </div>

            <button
              onClick={() => onClose(true)}
              className="w-full bg-[#141042] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#1f1a66] transition-colors"
            >
              Ver resultado no dashboard
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function calcScores(responses: UserResponse[], totalQ: number): DISCScores {
  const raw = { D: 0, I: 0, S: 0, C: 0 };
  responses.forEach((r) => { raw[r.selected]++; });
  const t = totalQ || responses.length;
  const norm = {
    D: Math.round((raw.D / t) * 100),
    I: Math.round((raw.I / t) * 100),
    S: Math.round((raw.S / t) * 100),
    C: Math.round((raw.C / t) * 100),
  };
  let primary = 'D', primaryScore = norm.D;
  (['I', 'S', 'C'] as DISCOption[]).forEach((k) => { if (norm[k] > primaryScore) { primary = k; primaryScore = norm[k]; } });
  let secondary = 'D', secondaryScore = -1;
  (['D', 'I', 'S', 'C'] as DISCOption[]).forEach((k) => { if (k !== primary && norm[k] > secondaryScore) { secondary = k; secondaryScore = norm[k]; } });
  return { ...norm, primary, secondary };
}

function getDISCStrengths(p: string): string[] {
  return ({ D: ['Liderança', 'Decisão rápida', 'Confiança', 'Foco em resultados'], I: ['Comunicação', 'Inspiração', 'Networking', 'Criatividade'], S: ['Lealdade', 'Paciência', 'Cooperação', 'Confiabilidade'], C: ['Atenção aos detalhes', 'Análise crítica', 'Qualidade', 'Precisão'] } as Record<string, string[]>)[p] || [];
}
function getDISCChallenges(p: string): string[] {
  return ({ D: ['Pode ser impaciente', 'Ignora detalhes', 'Parece insensível', 'Dificuldade em delegar'], I: ['Pode ser impulsivo', 'Falta de foco', 'Excesso de otimismo', 'Dificuldade com detalhes'], S: ['Pode ser passivo', 'Dificuldade com mudanças', 'Falta de iniciativa', 'Pouca assertividade'], C: ['Pode ser perfeccionista', 'Paralisia por análise', 'Muito crítico', 'Resistência à mudança'] } as Record<string, string[]>)[p] || [];
}
function getWorkStyle(p: string): string {
  return ({ D: 'Trabalha melhor com autonomia, desafios e metas claras.', I: 'Trabalha melhor em ambientes colaborativos com variedade e reconhecimento.', S: 'Trabalha melhor com processos consistentes e equipes estáveis.', C: 'Trabalha melhor com dados, estrutura e procedimentos bem definidos.' } as Record<string, string>)[p] || '';
}
function getCommunicationStyle(p: string): string {
  return ({ D: 'Direto, objetivo, focado em resultados', I: 'Entusiasmado, expressivo, focado em relacionamentos', S: 'Calmo, ouvinte, focado em cooperação', C: 'Lógico, preciso, focado em fatos' } as Record<string, string>)[p] || '';
}
