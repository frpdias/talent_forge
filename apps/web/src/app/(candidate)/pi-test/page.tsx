'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, Target, ClipboardCheck, Activity, FileText, Printer } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { piApi } from '@/lib/api';

type Axis = 'direcao' | 'energia_social' | 'ritmo' | 'estrutura';
type Block = 'natural' | 'adaptado';

interface Descriptor {
  id: string;
  descriptor: string;
  axis: Axis;
  position: number;
}

interface SituationalQuestion {
  id: string;
  question_number: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_axis: Axis;
  option_b_axis: Axis;
  option_c_axis: Axis;
  option_d_axis: Axis;
}

type Phase =
  | 'natural-descritores'
  | 'adaptado-descritores'
  | 'natural-situacional'
  | 'adaptado-situacional'
  | 'resultado';

const axisMeta: Record<Axis, { label: string; left: string; right: string; color: string }> = {
  direcao: { label: 'Direção', left: 'Execução orientada', right: 'Influência / Controle', color: 'from-amber-400 to-amber-600' },
  energia_social: { label: 'Energia Social', left: 'Reservado', right: 'Expressivo', color: 'from-rose-400 to-rose-600' },
  ritmo: { label: 'Ritmo', left: 'Constância', right: 'Aceleração', color: 'from-emerald-400 to-emerald-600' },
  estrutura: { label: 'Estrutura', left: 'Flexível', right: 'Estruturado', color: 'from-blue-400 to-blue-600' },
};

export default function PiTestPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>('natural-descritores');

  const [descriptors, setDescriptors] = useState<Descriptor[]>([]);
  const [selectedDescriptors, setSelectedDescriptors] = useState<Record<Block, Set<string>>>({
    natural: new Set(),
    adaptado: new Set(),
  });

  const [questions, setQuestions] = useState<SituationalQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentBlock, setCurrentBlock] = useState<Block>('natural');
  const [situationalAnswers, setSituationalAnswers] = useState<Record<Block, Record<string, Axis>>>({
    natural: {},
    adaptado: {},
  });

  const [result, setResult] = useState<{
    scores_natural: Record<Axis, number>;
    scores_adapted: Record<Axis, number>;
    gaps: Record<Axis, number>;
  } | null>(null);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
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
        setToken(session.access_token);

        const [descData, qData, assessment] = await Promise.all([
          piApi.listDescriptors(session.access_token),
          piApi.listSituational(session.access_token),
          piApi.createAssessment(user.id, session.access_token),
        ]);

        const descriptorsList = (descData as any)?.items ?? descData;
        const questionsList = (qData as any)?.items ?? qData;
        const assessmentData = (assessment as any)?.data ?? assessment;
        const created = Array.isArray(assessmentData) ? assessmentData[0] : assessmentData;

        setDescriptors(Array.isArray(descriptorsList) ? descriptorsList : []);
        setQuestions(Array.isArray(questionsList) ? questionsList : []);
        setAssessmentId(created?.id);
      } catch (err: any) {
        console.error('Erro ao iniciar TF-PI:', err?.message || err);
        setError(err?.message || 'Erro ao iniciar TF-PI.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDescriptor = async (descriptorId: string, block: Block) => {
    if (!assessmentId || !token) return;
    setSelectedDescriptors((prev) => {
      const next = { ...prev, [block]: new Set(prev[block]) };
      if (next[block].has(descriptorId)) {
        next[block].delete(descriptorId);
      } else {
        next[block].add(descriptorId);
      }
      return next;
    });
    try {
      const isSelected = selectedDescriptors[block].has(descriptorId);
      await piApi.submitDescriptor(
        assessmentId,
        descriptorId,
        block,
        !isSelected,
        token,
      );
    } catch (err: any) {
      console.error('Erro ao salvar descritor:', err?.message || err);
      setError(err?.message || 'Erro ao salvar descritor.');
    }
  };

  const handleSituationalSelect = async (axis: Axis) => {
    if (!assessmentId || !token) return;
    const q = questions[currentIndex];
    if (!q) return;
    setSituationalAnswers((prev) => ({
      ...prev,
      [currentBlock]: { ...prev[currentBlock], [q.id]: axis },
    }));
    try {
      await piApi.submitSituational(
        assessmentId,
        q.id,
        axis,
        currentBlock,
        token,
      );
    } catch (err: any) {
      console.error('Erro ao salvar resposta:', err?.message || err);
      setError(err?.message || 'Erro ao salvar resposta.');
    }
  };

  const descriptorsDone = (block: Block) =>
    selectedDescriptors[block].size > 0;

  const situationalDone = (block: Block) =>
    Object.keys(situationalAnswers[block] || {}).length === questions.length;

  const nextPhase = () => {
    if (phase === 'natural-descritores') {
      setPhase('adaptado-descritores');
    } else if (phase === 'adaptado-descritores') {
      setPhase('natural-situacional');
      setCurrentBlock('natural');
      setCurrentIndex(0);
    } else if (phase === 'natural-situacional') {
      setPhase('adaptado-situacional');
      setCurrentBlock('adaptado');
      setCurrentIndex(0);
    }
  };

  const finalize = async () => {
    if (!assessmentId || !token) return;
    if (!situationalDone('adaptado')) {
      setError('Responda todas as questões situacionais antes de finalizar.');
      return;
    }
    try {
      const res = await piApi.finalize(assessmentId, token);
      setResult(res as any);
      setPhase('resultado');
    } catch (err: any) {
      console.error('Erro ao finalizar TF-PI:', err?.message || err);
      setError(err?.message || 'Erro ao finalizar TF-PI.');
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer =
    currentQuestion && situationalAnswers[currentBlock]?.[currentQuestion.id];
  const descriptorsList = Array.isArray(descriptors) ? descriptors : [];
  const questionsList = Array.isArray(questions) ? questions : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-[#141042]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
          <p className="mt-4 text-sm text-[#666666]">Carregando TF-PI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-4">
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-6 text-center max-w-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-[#141042]">Erro</h2>
          <p className="text-sm text-[#666666]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#141042]">
      <div className="relative max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#141042] border border-[#E5E5DC]">
            <Sparkles className="h-4 w-4 text-[#F97316]" />
            TF-PI — Drives Comportamentais & Sustentabilidade do Papel
          </div>
          <button
            className="text-sm text-[#666666] hover:text-[#141042] inline-flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>

        <div className="bg-white border border-[#E5E5DC] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-full bg-[#F5F5F0] text-[#141042] text-[11px] font-semibold">
              Bloco A — Perfil Natural
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F5F5F0] text-[#141042] text-[11px] font-semibold">
              Bloco B — Perfil Adaptado ao Papel
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F5F5F0] text-[#141042] text-[11px] font-semibold">
              Gap = esforço para sustentar o papel
            </span>
          </div>
          <p className="text-sm text-[#666666] leading-relaxed">
            O TF-PI mede quatro eixos contínuos (Direção, Energia Social, Ritmo, Estrutura) em dois momentos:
            seu estilo natural e o que o papel exige. Complete os dois blocos de descritores e, depois, as
            30 situações forçadas (duas rodadas: Natural e Adaptado).
          </p>
        </div>

        {phase === 'natural-descritores' || phase === 'adaptado-descritores' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#141042] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Lista de descritores — {phase === 'natural-descritores' ? 'Perfil Natural' : 'Perfil Adaptado ao Papel'}
              </h2>
              <span className="text-sm text-[#666666]">
                Marque todos que se aplicam {phase === 'natural-descritores' ? 'a você no dia a dia' : 'ao papel atual'}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {descriptorsList.map((d) => {
                const active = selectedDescriptors[
                  phase === 'natural-descritores' ? 'natural' : 'adaptado'
                ].has(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() =>
                      toggleDescriptor(
                        d.id,
                        phase === 'natural-descritores' ? 'natural' : 'adaptado',
                      )
                    }
                    className={`text-left rounded-xl border px-3 py-3 transition-all ${
                      active
                        ? 'bg-[#F5F5F0] text-[#141042] border-[#141042]/20'
                        : 'bg-white border-[#E5E5DC] text-[#141042] hover:border-[#141042]/40'
                    }`}
                  >
                    <p className="text-sm font-semibold">{d.descriptor}</p>
                    <p className="text-xs text-[#999999] mt-1">{axisMeta[d.axis].label}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                disabled={!descriptorsDone(phase === 'natural-descritores' ? 'natural' : 'adaptado')}
                onClick={nextPhase}
                className="inline-flex items-center gap-2 bg-[#141042] text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'natural-situacional' || phase === 'adaptado-situacional' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#141042] flex items-center gap-2">
                <Target className="w-5 h-5" />
                Situações forçadas — {phase === 'natural-situacional' ? 'Perfil Natural' : 'Perfil Adaptado ao Papel'}
              </h2>
              <span className="text-sm text-[#666666]">
                Questão {currentIndex + 1} / {questionsList.length}
              </span>
            </div>

            {currentQuestion && (
              <div className="bg-white border border-[#E5E5DC] rounded-2xl p-5 space-y-4 shadow-sm">
                <p className="text-lg font-semibold text-[#141042]">{currentQuestion.prompt}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { text: currentQuestion.option_a, axis: currentQuestion.option_a_axis },
                    { text: currentQuestion.option_b, axis: currentQuestion.option_b_axis },
                    { text: currentQuestion.option_c, axis: currentQuestion.option_c_axis },
                    { text: currentQuestion.option_d, axis: currentQuestion.option_d_axis },
                  ].map((opt, idx) => {
                    const selected = currentAnswer === opt.axis;
                    return (
                      <button
                        key={opt.text}
                        onClick={() => handleSituationalSelect(opt.axis)}
                        className={`text-left rounded-xl border px-4 py-3 transition-all ${
                          selected
                            ? 'bg-[#F5F5F0] text-[#141042] border-[#141042]/20'
                            : 'bg-white border-[#E5E5DC] text-[#141042] hover:border-[#141042]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#999999] mb-1">
                          <span className="w-5 h-5 rounded-full bg-[#F5F5F0] flex items-center justify-center">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {axisMeta[opt.axis].label}
                        </div>
                        <p className="text-sm leading-relaxed">{opt.text}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-2 text-[#666666] hover:text-[#141042] disabled:opacity-40"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-48 h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#F97316] to-[#1F4ED8]"
                        style={{
                          width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%`,
                        }}
                      />
                    </div>
                    {phase === 'natural-situacional' ? (
                      <button
                        onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                        className="inline-flex items-center gap-2 bg-[#1F4ED8] text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Próxima <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                          className="inline-flex items-center gap-2 bg-[#1F4ED8] text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Próxima <ArrowRight className="w-4 h-4" />
                        </button>
                        {situationalDone('adaptado') && (
                          <button
                            onClick={finalize}
                            className="inline-flex items-center gap-2 bg-[#141042] text-white px-4 py-2 rounded-lg font-semibold"
                          >
                            Finalizar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {phase === 'natural-situacional' && situationalDone('natural') && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setPhase('adaptado-situacional');
                        setCurrentBlock('adaptado');
                        setCurrentIndex(0);
                      }}
                      className="inline-flex items-center gap-2 bg-[#141042] text-white px-5 py-2 rounded-lg font-semibold"
                    >
                      Ir para Bloco Adaptado <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {phase === 'resultado' && result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#141042] flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Relatório TF-PI — Drives Comportamentais e Sustentabilidade
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 bg-[#141042] text-white px-4 py-2 rounded-lg font-semibold"
                >
                  <Printer className="w-4 h-4" /> Imprimir/PDF
                </button>
                <button
                  onClick={() => router.push('/candidate')}
                  className="inline-flex items-center gap-2 text-[#666666] hover:text-[#141042]"
                >
                  <FileText className="w-4 h-4" /> Voltar ao painel
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {(Object.keys(axisMeta) as Axis[]).map((axis) => (
                <div key={axis} className="bg-white border border-[#E5E5DC] rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#999999]">{axisMeta[axis].left}</p>
                      <p className="text-lg font-semibold text-[#141042]">{axisMeta[axis].label}</p>
                      <p className="text-sm text-[#999999]">{axisMeta[axis].right}</p>
                    </div>
                    <div className="text-right text-sm text-[#666666]">
                      <div>Natural: <span className="font-semibold text-[#141042]">{result.scores_natural[axis]}</span></div>
                      <div>Adaptado: <span className="font-semibold text-[#141042]">{result.scores_adapted[axis]}</span></div>
                      <div>Gap: <span className="font-semibold text-[#F97316]">{result.gaps[axis]}</span></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-[#999999]">Natural</div>
                    <div className="h-2 rounded-full bg-[#F5F5F0] overflow-hidden">
                      <div
                        className={`h-full bg-linear-to-r ${axisMeta[axis].color}`}
                        style={{ width: `${Math.min(result.scores_natural[axis], 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-[#999999]">Adaptado</div>
                    <div className="h-2 rounded-full bg-[#F5F5F0] overflow-hidden">
                      <div
                        className={`h-full bg-linear-to-r ${axisMeta[axis].color}`}
                        style={{ width: `${Math.min(result.scores_adapted[axis], 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-[#999999]">Gap / Esforço</div>
                    <div className="h-2 rounded-full bg-[#F5F5F0] overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#F97316] to-[#EF4444]"
                        style={{ width: `${Math.min(result.gaps[axis] * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 text-sm text-[#666666] space-y-2 shadow-sm">
              <p>
                Interpretação rápida: gaps de 0–10 sugerem papel sustentável; 11–25 exigem atenção e ajustes no contexto;
                26+ indicam esforço alto e risco de desgaste. Combine esta leitura com o Teste das Cores para entender
                como o cérebro organiza decisões (cores) versus como você está atuando sob demanda (drives).
              </p>
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
