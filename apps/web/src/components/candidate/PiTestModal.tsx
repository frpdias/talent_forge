'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type Block = 'natural' | 'adaptado';
type Axis = 'direcao' | 'energia_social' | 'ritmo' | 'estrutura';
type Phase = 'natural-descritores' | 'adaptado-descritores' | 'natural-situacional' | 'adaptado-situacional' | 'resultado';

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

interface AxisScores {
  direcao: number;
  energia_social: number;
  ritmo: number;
  estrutura: number;
}

interface PiResult {
  scores_natural: AxisScores;
  scores_adapted: AxisScores;
  gaps: AxisScores;
}

const AXIS_META: Record<Axis, { label: string; color: string }> = {
  direcao:        { label: 'Direção',        color: 'bg-[#3B82F6]' },
  energia_social: { label: 'Energia Social', color: 'bg-[#F59E0B]' },
  ritmo:          { label: 'Ritmo',          color: 'bg-[#10B981]' },
  estrutura:      { label: 'Estrutura',      color: 'bg-[#8B5CF6]' },
};

const PHASE_ORDER: Phase[] = [
  'natural-descritores',
  'adaptado-descritores',
  'natural-situacional',
  'adaptado-situacional',
  'resultado',
];

const PHASE_LABELS: Record<Phase, string> = {
  'natural-descritores':  'Descrição Natural',
  'adaptado-descritores': 'Descrição Adaptada',
  'natural-situacional':  'Situacional Natural',
  'adaptado-situacional': 'Situacional Adaptada',
  'resultado':            'Resultado',
};

interface Props {
  onClose: (updated?: boolean) => void;
}

export default function PiTestModal({ onClose }: Props) {
  const supabase = createClient();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [phase, setPhase] = useState<Phase>('natural-descritores');
  const [descriptors, setDescriptors] = useState<Descriptor[]>([]);
  const [situational, setSituational] = useState<SituationalQuestion[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PiResult | null>(null);

  const [naturalDescs, setNaturalDescs] = useState<Set<string>>(new Set());
  const [adaptedDescs, setAdaptedDescs] = useState<Set<string>>(new Set());
  const [sIdx, setSIdx] = useState(0);
  const [naturalSitu, setNaturalSitu] = useState<Record<string, Axis>>({});
  const [adaptedSitu, setAdaptedSitu] = useState<Record<string, Axis>>({});

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: descData, error: dErr }, { data: situData, error: sErr }] = await Promise.all([
          supabase.from('pi_descriptors').select('*').eq('active', true).order('position', { ascending: true }),
          supabase.from('pi_situational_questions').select('*').eq('active', true).order('question_number', { ascending: true }),
        ]);
        if (dErr) throw dErr;
        if (sErr) throw sErr;

        const { data: assessment, error: aErr } = await supabase
          .from('pi_assessments')
          .insert({ candidate_user_id: user.id, status: 'in_progress' })
          .select('id')
          .single();
        if (aErr) throw aErr;

        setDescriptors(descData ?? []);
        setSituational(situData ?? []);
        setAssessmentId(assessment.id);
      } catch (err: any) {
        setError(err?.message || 'Erro ao iniciar PI.');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDescriptor = (id: string, block: Block) => {
    if (block === 'natural') {
      setNaturalDescs((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    } else {
      setAdaptedDescs((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    }
  };

  const saveDescriptors = async (block: Block) => {
    if (!assessmentId || saving) return;
    const selected = block === 'natural' ? naturalDescs : adaptedDescs;
    setSaving(true);
    try {
      const rows = Array.from(selected).map((descriptor_id) => ({
        assessment_id: assessmentId,
        descriptor_id,
        block,
      }));
      if (rows.length > 0) {
        const { error: rErr } = await supabase
          .from('pi_descriptor_responses')
          .upsert(rows, { onConflict: 'assessment_id,descriptor_id,block' });
        if (rErr) throw rErr;
      }
      advancePhase();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar descritores.');
    } finally {
      setSaving(false);
    }
  };

  const handleSituational = async (axis: Axis) => {
    if (!assessmentId || saving) return;
    const block: Block = phase === 'natural-situacional' ? 'natural' : 'adaptado';
    const q = situational[sIdx];
    if (!q) return;
    setSaving(true);

    const setter = block === 'natural' ? setNaturalSitu : setAdaptedSitu;
    setter((prev) => ({ ...prev, [q.id]: axis }));

    try {
      const { error: rErr } = await supabase
        .from('pi_situational_responses')
        .upsert(
          { assessment_id: assessmentId, question_id: q.id, block, selected_axis: axis },
          { onConflict: 'assessment_id,question_id,block' },
        );
      if (rErr) throw rErr;

      if (sIdx < situational.length - 1) {
        setSIdx((i) => i + 1);
      } else {
        setSIdx(0);
        advancePhase(block === 'natural' ? 'adaptado-situacional' : 'resultado');
        if (block === 'adaptado') {
          await finalizeTest({ ...adaptedSitu, [q.id]: axis });
          return;
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar resposta.');
    } finally {
      setSaving(false);
    }
  };

  const finalizeTest = async (lastAdaptedSitu: Record<string, Axis>) => {
    if (!assessmentId) return;
    try {
      setSaving(true);

      const zeroScores = (): AxisScores => ({ direcao: 0, energia_social: 0, ritmo: 0, estrutura: 0 });
      const scores_natural = zeroScores();
      const scores_adapted = zeroScores();

      descriptors.forEach((d) => {
        if (naturalDescs.has(d.id)) scores_natural[d.axis]++;
        if (adaptedDescs.has(d.id)) scores_adapted[d.axis]++;
      });

      Object.values(naturalSitu).forEach((ax) => { scores_natural[ax]++; });
      Object.values(lastAdaptedSitu).forEach((ax) => { scores_adapted[ax]++; });

      const gaps: AxisScores = {
        direcao:        Math.abs(scores_natural.direcao - scores_adapted.direcao),
        energia_social: Math.abs(scores_natural.energia_social - scores_adapted.energia_social),
        ritmo:          Math.abs(scores_natural.ritmo - scores_adapted.ritmo),
        estrutura:      Math.abs(scores_natural.estrutura - scores_adapted.estrutura),
      };

      const { error: uErr } = await supabase
        .from('pi_assessments')
        .update({ status: 'completed', completed_at: new Date().toISOString(), scores_natural, scores_adapted, gaps })
        .eq('id', assessmentId);
      if (uErr) throw uErr;

      setResult({ scores_natural, scores_adapted, gaps });
      setPhase('resultado');
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar PI.');
    } finally {
      setSaving(false);
    }
  };

  const advancePhase = (force?: Phase) => {
    if (force) { setPhase(force); return; }
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx < PHASE_ORDER.length - 1) setPhase(PHASE_ORDER[idx + 1]);
  };

  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const phasePct = Math.round((phaseIdx / (PHASE_ORDER.length - 1)) * 100);
  const currentBlock: Block = phase === 'natural-descritores' || phase === 'natural-situacional' ? 'natural' : 'adaptado';
  const selectedSet = currentBlock === 'natural' ? naturalDescs : adaptedDescs;

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
              <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">Predictive Index</p>
              <p className="text-[11px] text-white/50">{PHASE_LABELS[phase]}</p>
            </div>
          </div>

          {!loading && !saving && (
            <button
              onClick={() => {
                if (phase !== 'resultado' && !error) {
                  setShowExitConfirm(true);
                  return;
                }
                onClose(phase === 'resultado');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
              aria-label="Fechar"
            >
              ✕
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-[#10B981] transition-all duration-300"
            style={{ width: `${phasePct}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 sm:px-10 py-10 max-w-5xl mx-auto w-full">
        {loading && (
          <div className="text-center mt-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#141042]" />
            <p className="mt-3 text-sm text-[#666]">Carregando...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center max-w-sm mt-8">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => onClose(false)} className="mt-3 text-xs text-red-600 underline">Fechar</button>
          </div>
        )}

        {/* Fase: descritores */}
        {!loading && !error && (phase === 'natural-descritores' || phase === 'adaptado-descritores') && (
          <>
            <div className="w-full mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">
                {phase === 'natural-descritores'
                  ? 'Selecione as palavras que MELHOR descrevem você naturalmente.'
                  : 'Selecione as palavras que descrevem como você age NO TRABALHO.'}
              </h2>
              <p className="text-sm text-[#999] mt-2">{selectedSet.size} selecionadas</p>
            </div>

            <div className="w-full flex flex-wrap gap-2">
              {descriptors.map((d) => {
                const sel = selectedSet.has(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDescriptor(d.id, currentBlock)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 ${
                      sel
                        ? 'bg-[#141042] text-white border-[#141042]'
                        : 'bg-white text-[#141042] border-[#E5E5DC] hover:border-[#141042]/30'
                    }`}
                  >
                    {d.descriptor}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => saveDescriptors(currentBlock)}
              disabled={saving || selectedSet.size === 0}
              className="w-full mt-6 bg-[#141042] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#1f1a66] transition-colors disabled:opacity-40"
            >
              {saving ? 'Salvando...' : 'Próxima etapa →'}
            </button>
          </>
        )}

        {/* Fase: situacional */}
        {!loading && !error && (phase === 'natural-situacional' || phase === 'adaptado-situacional') && (() => {
          const q = situational[sIdx];
          if (!q) return null;
          const opts: { key: 'a' | 'b' | 'c' | 'd'; text: string; axis: Axis }[] = [
            { key: 'a', text: q.option_a, axis: q.option_a_axis },
            { key: 'b', text: q.option_b, axis: q.option_b_axis },
            { key: 'c', text: q.option_c, axis: q.option_c_axis },
            { key: 'd', text: q.option_d, axis: q.option_d_axis },
          ];
          return (
            <>
              <div className="w-full mb-6">
                <p className="text-xs text-[#999] mb-1">
                  {phase === 'natural-situacional' ? 'Natural' : 'Adaptado'} — {sIdx + 1}/{situational.length}
                </p>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#141042]">{q.prompt}</h2>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {opts.map(({ key, text, axis }) => (
                  <button
                    key={key}
                    onClick={() => handleSituational(axis)}
                    disabled={saving}
                    className="w-full text-left px-5 py-4 rounded-xl border border-[#E5E5DC] bg-white hover:border-[#141042]/30 hover:-translate-y-0.5 transition-all text-base text-[#141042] shadow-[0_1px_4px_rgba(20,16,66,0.06)]"
                  >
                    <span className="font-semibold mr-2 text-[#999]">{key.toUpperCase()}.</span>
                    {text}
                  </button>
                ))}
              </div>

              {saving && <p className="mt-4 text-xs text-[#999] animate-pulse">Salvando...</p>}
            </>
          );
        })()}

        {/* Resultado */}
        {phase === 'resultado' && result && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-1">Resultado</p>
              <h2 className="text-xl font-bold text-[#141042]">Perfil PI Concluído</h2>
              <p className="text-sm text-[#666] mt-1">Seus padrões comportamentais foram identificados.</p>
            </div>

            {(['natural', 'adaptado'] as Block[]).map((block) => {
              const scores = block === 'natural' ? result.scores_natural : result.scores_adapted;
              const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={block} className="bg-white border border-[#E5E5DC] rounded-xl p-4 shadow-[0_1px_4px_rgba(20,16,66,0.06)]">
                  <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-3">
                    {block === 'natural' ? 'Perfil Natural' : 'Perfil Adaptado'}
                  </p>
                  <div className="space-y-2">
                    {(Object.keys(AXIS_META) as Axis[]).map((ax) => {
                      const val = scores[ax];
                      const axPct = Math.round((val / total) * 100);
                      return (
                        <div key={ax}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[#141042]">{AXIS_META[ax].label}</span>
                            <span className="text-xs text-[#999]">{val} pts ({axPct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                            <div className={`h-full rounded-full ${AXIS_META[ax].color}`} style={{ width: `${axPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="bg-[#F7F7F2] border border-[#E5E5DC] rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-[#999] font-semibold mb-3">Gaps Natural × Adaptado</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(AXIS_META) as Axis[]).map((ax) => (
                  <div key={ax} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#E5E5DC]">
                    <span className="text-xs text-[#666]">{AXIS_META[ax].label}</span>
                    <span className="text-xs font-bold text-[#141042]">{result.gaps[ax]}</span>
                  </div>
                ))}
              </div>
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
