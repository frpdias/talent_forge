'use client';

import { Briefcase, FileText, Clock, MapPin, Building2, ArrowUpRight, Brain, Sparkles, User, TrendingUp, Camera } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import ColorTestModal from '@/components/candidate/ColorTestModal';
import PiTestModal from '@/components/candidate/PiTestModal';
import DiscTestModal from '@/components/candidate/DiscTestModal';
import CropAvatarModal from '@/components/candidate/CropAvatarModal';

const AssessmentRadarChart = dynamic(
  () => import('@/components/candidate/AssessmentRadarChart'),
  { ssr: false }
);

interface RealJob {
  id: string;
  title: string;
  location?: string | null;
  employment_type?: string | null;
  seniority?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at?: string | null;
  department?: string | null;
  org_name?: string | null;
  match_score?: number | null;
}

interface RealApplication {
  id: string;
  status: string;
  created_at: string;
  jobs: { title: string; organizations: { name: string } | null } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  applied:          { label: 'Candidatado',        color: 'blue' },
  screening:        { label: 'Em triagem',          color: 'amber' },
  in_process:       { label: 'Em avaliação',        color: 'amber' },
  in_documentation: { label: 'Em documentação',     color: 'violet' },
  hired:            { label: 'Contratado',          color: 'green' },
  rejected:         { label: 'Não selecionado',     color: 'red' },
};

const formatSalaryRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'A combinar';
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
  if (min && max) return `${fmt(min)} — ${fmt(max)}`;
  if (min) return `A partir de ${fmt(min)}`;
  return `Até ${fmt(max!)}`;
};

const timeAgo = (date?: string | null) => {
  if (!date) return 'Recente';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  return `${Math.floor(days / 30)} meses atrás`;
};

type DiscResult = {
  primary_profile: string;
  secondary_profile: string | null;
  dominance_score: number;
  influence_score: number;
  steadiness_score: number;
  conscientiousness_score: number;
  description?: string | null;
};

export default function CandidateDashboard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Candidato');
  const [discResult, setDiscResult] = useState<DiscResult | null>(null);
  const [discLoading, setDiscLoading] = useState(false);
  const [discError, setDiscError] = useState<string | null>(null);
  const [colorResult, setColorResult] = useState<any>(null);
  const [colorLoading, setColorLoading] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);
  const [piResult, setPiResult] = useState<any>(null);
  const [piLoading, setPiLoading] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'disc' | 'colors' | 'pi' | null>(null);
  const [activeTestModal, setActiveTestModal] = useState<'disc' | 'color-test' | 'pi-test' | null>(null);

  // Dashboard — dados reais
  const [dashStats, setDashStats] = useState({ total: 0, active: 0, hired: 0, completion: 0 });
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [realJobs, setRealJobs] = useState<RealJob[]>([]);
  const [realApplications, setRealApplications] = useState<RealApplication[]>([]);
  const [completionItems, setCompletionItems] = useState<{ label: string; done: boolean }[]>([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const discProfileSummary: Record<string, string> = {
    D: 'Foco em resultados, decisão rápida e assertividade.',
    I: 'Comunicação intensa, influência e energia para mobilizar pessoas.',
    S: 'Estabilidade, consistência e suporte ao time em ritmo orgânico.',
    C: 'Rigor, precisão, qualidade e orientação a processos bem definidos.',
  };

  const colorSummary: Record<string, string> = {
    azul: 'Lógica, visão de longo prazo e comunicação estruturada.',
    rosa: 'Inovação, velocidade e desafio orientado a ideias.',
    amarelo: 'Conexão humana, empatia e alta expressividade.',
    verde: 'Continuidade, estabilidade e integração de contextos.',
    branco: 'Propósito, estrutura, pragmatismo e execução eficiente.',
  };

  const colorLabel: Record<string, string> = {
    azul: 'Azul',
    rosa: 'Rosa',
    amarelo: 'Amarelo',
    verde: 'Verde',
    branco: 'Branco',
  };

  const calculateDiscFromResponses = (responses: { selected_option: string }[]): DiscResult => {
    const scores = { D: 0, I: 0, S: 0, C: 0 } as Record<string, number>;

    responses.forEach((response) => {
      const selected = response.selected_option as keyof typeof scores;
      if (scores[selected] !== undefined) {
        scores[selected] += 1;
      }
    });

    const total = responses.length || 1;
    const normalized = {
      D: Math.round((scores.D / total) * 100),
      I: Math.round((scores.I / total) * 100),
      S: Math.round((scores.S / total) * 100),
      C: Math.round((scores.C / total) * 100),
    };

    let primary: keyof typeof normalized = 'D';
    let primaryScore = normalized.D;
    (['I', 'S', 'C'] as Array<keyof typeof normalized>).forEach((profile) => {
      if (normalized[profile] > primaryScore) {
        primary = profile;
        primaryScore = normalized[profile];
      }
    });

    let secondary: keyof typeof normalized = 'D';
    let secondaryScore = normalized.D;
    (['I', 'S', 'C'] as Array<keyof typeof normalized>).forEach((profile) => {
      if (profile !== primary && normalized[profile] > secondaryScore) {
        secondary = profile;
        secondaryScore = normalized[profile];
      }
    });

    return {
      primary_profile: primary,
      secondary_profile: secondary,
      dominance_score: normalized.D,
      influence_score: normalized.I,
      steadiness_score: normalized.S,
      conscientiousness_score: normalized.C,
      description: null,
    };
  };

  const getDiscColors = (profile?: string | null) => {
    switch (profile) {
      case 'D':
        return { bg: 'from-red-100 to-red-200', text: 'text-red-700' };
      case 'I':
        return { bg: 'from-amber-100 to-amber-200', text: 'text-amber-700' };
      case 'S':
        return { bg: 'from-green-100 to-green-200', text: 'text-green-700' };
      case 'C':
        return { bg: 'from-blue-100 to-blue-200', text: 'text-blue-700' };
      default:
        return { bg: 'from-purple-100 to-purple-200', text: 'text-purple-700' };
    }
  };

  const getDiscName = (profile?: string | null) => {
    switch (profile) {
      case 'D':
        return 'Dominante (D)';
      case 'I':
        return 'Influência (I)';
      case 'S':
        return 'Estabilidade (S)';
      case 'C':
        return 'Consciência (C)';
      default:
        return 'Perfil DISC';
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let resolvedName =
          (user.user_metadata as any)?.full_name ||
          (user.user_metadata as any)?.name ||
          '';

        if (!resolvedName) {
          const { data: profile } = await supabase
            .from('candidate_profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle();
          if (profile?.full_name) {
            resolvedName = profile.full_name;
          }
        }

        setDisplayName(resolvedName || user.email || 'Candidato');

        setDiscLoading(true);
        setDiscError(null);

        try {
          // get_my_disc_result: fallback por candidates.email (candidatos sem user_id)
          const { data: discRows, error: discRpcErr } = await supabase
            .rpc('get_my_disc_result');

          if (discRpcErr) {
            console.error('Erro ao buscar DISC:', discRpcErr.message);
            setDiscError(discRpcErr.message);
          }

          const row = (discRows as any[])?.[0] ?? null;

          if (row?.primary_profile) {
            setDiscResult({
              primary_profile: row.primary_profile ?? '',
              secondary_profile: row.secondary_profile ?? null,
              dominance_score: Number(row.dominance_score ?? 0),
              influence_score: Number(row.influence_score ?? 0),
              steadiness_score: Number(row.steadiness_score ?? 0),
              conscientiousness_score: Number(row.conscientiousness_score ?? 0),
              description: row.description ?? null,
            });
          } else {
            setDiscResult(null);
          }
        } catch (error: any) {
          console.error('Erro ao buscar assessment DISC:', error?.message || error);
          setDiscError(error?.message || 'Erro ao buscar assessment DISC');
        } finally {
          setDiscLoading(false);
        }
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadColor = async () => {
      try {
        setColorLoading(true);
        setColorError(null);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('[CandidateDash] User:', user?.id);
        console.log('[CandidateDash] Session:', !!session);
        
        if (!session?.access_token) {
          console.log('[CandidateDash] No access token');
          setColorError('Não autenticado');
          setColorLoading(false);
          return;
        }
        
        if (!user?.id) {
          console.log('[CandidateDash] No user id');
          setColorError('Usuário não identificado');
          setColorLoading(false);
          return;
        }
        
        // get_my_color_result: fallback por candidates.email
        const { data: colorRows, error: colorError } = await supabase
          .rpc('get_my_color_result');
        
        if (colorError) {
          console.error('[CandidateDash] Color error:', colorError);
          setColorError(colorError.message);
          setColorLoading(false);
          return;
        }
        
        const colorData = (colorRows as any[])?.[0] ?? null;
        if (colorData) {
          setColorResult(colorData);
        } else {
          setColorResult(null);
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil de cores:', err?.message || err);
        setColorError(err?.message || 'Erro ao carregar perfil de cores');
      } finally {
        setColorLoading(false);
      }
    };
    loadColor();
  }, []);

  useEffect(() => {
    const loadPI = async () => {
      try {
        setPiLoading(true);
        setPiError(null);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.id) {
          setPiError('Usuário não identificado');
          setPiLoading(false);
          return;
        }
        
        // get_my_pi_result: fallback por candidates.email
        const { data: piRows, error: piError } = await supabase
          .rpc('get_my_pi_result');
        
        if (piError) {
          console.error('[CandidateDash] PI error:', piError);
          setPiError(piError.message);
          setPiLoading(false);
          return;
        }
        
        const piData = (piRows as any[])?.[0] ?? null;
        if (piData) {
          setPiResult(piData);
        } else {
          setPiResult(null);
        }
      } catch (err: any) {
        console.error('Erro ao carregar PI:', err?.message || err);
        setPiError(err?.message || 'Erro ao carregar PI');
      } finally {
        setPiLoading(false);
      }
    };
    loadPI();
  }, []);

  // Carrega stats, vagas e candidaturas reais
  const loadDashboard = useCallback(async () => {
      setDashLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [
          { data: appsRpc },
          { data: jobsData },
          { data: profileData },
        ] = await Promise.all([
          // get_my_applications já tem fallback por email — funciona mesmo sem candidates.user_id preenchido
          supabase.rpc('get_my_applications'),
          supabase.rpc('get_matched_jobs'),
          supabase
            .from('candidate_profiles')
            .select('resume_url, current_title, phone, profile_completion_percentage')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        // Mapear para o shape RealApplication esperado pelo restante da página
        const apps: RealApplication[] = ((appsRpc as any[]) || []).slice(0, 5).map((a) => ({
          id: a.application_id,
          status: a.status,
          created_at: a.created_at,
          jobs: { title: a.job_title || 'Vaga', organizations: null },
        }));
        const jobs = (jobsData as RealJob[] | null) || [];
        const profile = profileData as any;

        const activeStatuses = ['applied', 'screening', 'in_process', 'in_documentation'];
        const active = apps.filter((a) => activeStatuses.includes(a.status)).length;
        const hired = apps.filter((a) => a.status === 'hired').length;
        const completion = profile?.profile_completion_percentage ?? 0;

        setDashStats({ total: apps.length, active, hired, completion });
        setOpenJobsCount(jobs.length);
        setRealJobs(jobs.slice(0, 3));
        setRealApplications(apps);

        // Busca avatar separado (coluna adicionada na migration 20260312)
        try {
          const { data: avatarData } = await supabase
            .from('candidate_profiles')
            .select('avatar_url')
            .eq('user_id', user.id)
            .maybeSingle();
          if ((avatarData as any)?.avatar_url) setAvatarUrl((avatarData as any).avatar_url);
        } catch { /* coluna pode ainda não existir */ }

        setCompletionItems([
          { label: 'Cargo atual preenchido',  done: !!profile?.current_title },
          { label: 'Currículo enviado',        done: !!profile?.resume_url },
          { label: 'Telefone de contato',      done: !!profile?.phone },
        ]);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setDashLoading(false);
      }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageToCrop(reader.result as string);
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropSave = async (blob: Blob) => {
    setImageToCrop(null);
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from('candidate-avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from('candidate-avatars')
        .getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase
        .from('candidate_profiles')
        .upsert({ user_id: user.id, avatar_url: publicUrl }, { onConflict: 'user_id' });
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-16 lg:pb-0">
      {imageToCrop && (
        <CropAvatarModal
          imageSrc={imageToCrop}
          onCancel={() => setImageToCrop(null)}
          onSave={handleCropSave}
        />
      )}
      {/* Welcome + Testes Banner */}
      <div className="bg-linear-to-r from-[#141042] to-[#3B82F6] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar upload */}
            <label className="relative cursor-pointer flex-shrink-0 group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Foto de perfil" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white/60" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            </label>
            <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white! mb-1">
              Olá, {displayName}!
            </h2>
            <p className="text-white! text-sm sm:text-base mb-3">
              {openJobsCount > 0
                ? <><span className="font-semibold">{openJobsCount} vaga{openJobsCount !== 1 ? 's' : ''}</span> abertas disponíveis para você.</>
                : 'Acompanhe suas candidaturas e explore novas vagas.'}
            </p>
            <div className="flex items-center gap-2 text-white/70! text-xs">
              <Brain className="w-4 h-4" />
              <span>Complete seu perfil comportamental e destaque-se para recrutadores</span>
            </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center lg:justify-end">
            <button
              className="flex-1 basis-0 min-w-28 text-center bg-white text-[#141042] px-5 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
              onClick={() => setActiveTestModal('disc')}
            >
              DISC
            </button>
            <button
              className="flex-1 basis-0 min-w-28 text-center bg-white/20 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-white/30 transition-colors text-sm border border-white/30"
              onClick={() => setActiveTestModal('color-test')}
            >
              Cores
            </button>
            <button
              className="flex-1 basis-0 min-w-28 text-center bg-white/20 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-white/30 transition-colors text-sm border border-white/30"
              onClick={() => setActiveTestModal('pi-test')}
            >
              PI
            </button>
          </div>
        </div>
      </div>

      {/* ══ Perfis Comportamentais — 3 cards lado a lado ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* ─── DISC ─── */}
        {(() => {
          const colors = getDiscColors(discResult?.primary_profile);
          const discDimLabel: Record<string, string> = { D: 'Dominância', I: 'Influência', S: 'Estabilidade', C: 'Consciência' };
          const predominant = discResult?.primary_profile ? discDimLabel[discResult.primary_profile] : null;
          return (
            <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${colors.bg} ${colors.text} flex items-center justify-center text-xl font-bold`}>
                  {discResult ? discResult.primary_profile : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#666666] font-semibold">Perfil DISC</p>
                  {predominant && <p className="text-sm font-semibold text-[#141042]">{predominant}</p>}
                </div>
              </div>
              <p className="text-[13px] text-[#555] leading-snug line-clamp-2 flex-1">
                {discLoading ? 'Carregando...' : discResult
                  ? (discResult.description || discProfileSummary[discResult.primary_profile] || 'Seu perfil comportamental está disponível.')
                  : 'Faça o teste para gerar seu resumo comportamental.'}
              </p>
              <div className="flex gap-2">
                {discResult && (
                  <button
                    onClick={() => setActiveModal('disc')}
                    className="flex-1 text-xs font-semibold text-[#141042] bg-[#F5F5F0] hover:bg-[#EAEAE0] py-2 px-3 rounded-lg transition-colors"
                  >
                    Ver detalhes
                  </button>
                )}
                <button
                  onClick={() => setActiveTestModal('disc')}
                  className="flex-1 text-xs font-medium text-[#3B82F6] border border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 py-2 px-3 rounded-lg transition-colors"
                >
                  {discResult ? 'Refazer' : 'Fazer teste'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* ─── Cores ─── */}
        {(() => {
          const dominant = colorResult
            ? (colorLabel[colorResult.primary_color as string] || colorResult.primary_color)
            : null;
          const secondary = colorResult
            ? (colorLabel[colorResult.secondary_color as string] || colorResult.secondary_color)
            : null;
          const tagline = colorResult
            ? colorSummary[colorResult.primary_color as string] || 'Seu mapa de cores predominantes está disponível.'
            : 'Faça o teste para gerar seu mapa de cores.';
          return (
            <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center text-xl">👔</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#666666] font-semibold">Perfil Cores</p>
                  {dominant && (
                    <p className="text-sm font-semibold text-[#141042]">
                      {dominant}{secondary ? <span className="font-normal text-[#666666]"> · {secondary}</span> : null}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-[#555] leading-snug line-clamp-2 flex-1">
                {colorLoading ? 'Carregando...' : tagline}
              </p>
              <div className="flex gap-2">
                {colorResult && (
                  <button
                    onClick={() => setActiveModal('colors')}
                    className="flex-1 text-xs font-semibold text-[#141042] bg-[#F5F5F0] hover:bg-[#EAEAE0] py-2 px-3 rounded-lg transition-colors"
                  >
                    Ver detalhes
                  </button>
                )}
                <button
                  onClick={() => setActiveTestModal('color-test')}
                  className="flex-1 text-xs font-medium text-[#3B82F6] border border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 py-2 px-3 rounded-lg transition-colors"
                >
                  {colorResult ? 'Refazer' : 'Fazer teste'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* ─── PI ─── */}
        {(() => {
          const piScores = piResult ? [
            { label: 'Direção',       val: piResult.scores_adapted?.direcao       ?? piResult.scores_natural?.direcao       ?? 0 },
            { label: 'Energia Social', val: piResult.scores_adapted?.energia_social ?? piResult.scores_natural?.energia_social ?? 0 },
            { label: 'Ritmo',         val: piResult.scores_adapted?.ritmo         ?? piResult.scores_natural?.ritmo         ?? 0 },
            { label: 'Estrutura',     val: piResult.scores_adapted?.estrutura     ?? piResult.scores_natural?.estrutura     ?? 0 },
          ] : [];
          const dominantPi = piScores.length ? piScores.reduce((a, b) => a.val >= b.val ? a : b) : null;
          return (
            <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center text-xl">📈</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#666666] font-semibold">Perfil PI</p>
                  {dominantPi && <p className="text-sm font-semibold text-[#141042]">{dominantPi.label}</p>}
                </div>
              </div>
              <p className="text-[13px] text-[#555] leading-snug line-clamp-2 flex-1">
                {piLoading ? 'Carregando...' : piResult
                  ? 'Análise preditiva do seu comportamento natural e adaptado no trabalho.'
                  : 'Faça o teste para gerar sua análise preditiva de comportamento.'}
              </p>
              <div className="flex gap-2">
                {piResult && (
                  <button
                    onClick={() => setActiveModal('pi')}
                    className="flex-1 text-xs font-semibold text-[#141042] bg-[#F5F5F0] hover:bg-[#EAEAE0] py-2 px-3 rounded-lg transition-colors"
                  >
                    Ver detalhes
                  </button>
                )}
                <button
                  onClick={() => setActiveTestModal('pi-test')}
                  className="flex-1 text-xs font-medium text-[#3B82F6] border border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 py-2 px-3 rounded-lg transition-colors"
                >
                  {piResult ? 'Refazer' : 'Fazer teste'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ══ Modal de detalhe dos perfis comportamentais ══ */}
      {activeModal && (() => {
        let title = '';
        let radarData: { subject: string; A: number; fullMark: number }[] = [];
        let accentColor = '#3B82F6';
        let primaryLabel = '';
        let secondaryLabel = '';
        let testPath = '/disc';
        const discDimLabel: Record<string, string> = { D: 'Dominância', I: 'Influência', S: 'Estabilidade', C: 'Consciência' };

        if (activeModal === 'disc' && discResult) {
          title = 'Perfil DISC';
          accentColor = '#3B82F6';
          testPath = '/disc';
          radarData = [
            { subject: 'D — Dominância',   A: discResult.dominance_score,         fullMark: 100 },
            { subject: 'I — Influência',    A: discResult.influence_score,         fullMark: 100 },
            { subject: 'S — Estabilidade',  A: discResult.steadiness_score,        fullMark: 100 },
            { subject: 'C — Consciência',   A: discResult.conscientiousness_score, fullMark: 100 },
          ];
          primaryLabel   = discDimLabel[discResult.primary_profile] || discResult.primary_profile;
          secondaryLabel = discResult.secondary_profile ? (discDimLabel[discResult.secondary_profile] || discResult.secondary_profile) : '';
        } else if (activeModal === 'colors' && colorResult) {
          title = 'Perfil Cores';
          accentColor = '#F59E0B';
          testPath = '/color-test';
          const scores = (colorResult.scores || {}) as Record<string, number>;
          radarData = [
            { subject: 'Azul',    A: scores.azul    || 0, fullMark: 80 },
            { subject: 'Rosa',    A: scores.rosa    || 0, fullMark: 80 },
            { subject: 'Amarelo', A: scores.amarelo || 0, fullMark: 80 },
            { subject: 'Verde',   A: scores.verde   || 0, fullMark: 80 },
            { subject: 'Branco',  A: scores.branco  || 0, fullMark: 80 },
          ];
          primaryLabel   = colorLabel[colorResult.primary_color   as string] || colorResult.primary_color   || '';
          secondaryLabel = colorLabel[colorResult.secondary_color as string] || colorResult.secondary_color || '';
        } else if (activeModal === 'pi' && piResult) {
          title = 'Perfil PI';
          accentColor = '#8B5CF6';
          testPath = '/pi-test';
          const sa = piResult.scores_adapted || {};
          const sn = piResult.scores_natural  || {};
          radarData = [
            { subject: 'Direção',        A: Math.round(((sa.direcao       ?? sn.direcao       ?? 0) + 10) / 20 * 100), fullMark: 100 },
            { subject: 'Energia Social', A: Math.round(((sa.energia_social ?? sn.energia_social ?? 0) + 10) / 20 * 100), fullMark: 100 },
            { subject: 'Ritmo',          A: Math.round(((sa.ritmo         ?? sn.ritmo         ?? 0) + 10) / 20 * 100), fullMark: 100 },
            { subject: 'Estrutura',      A: Math.round(((sa.estrutura     ?? sn.estrutura     ?? 0) + 10) / 20 * 100), fullMark: 100 },
          ];
          const domPi = radarData.reduce((a, b) => a.A >= b.A ? a : b);
          primaryLabel = domPi.subject;
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#666666] font-semibold">{title}</p>
                  {primaryLabel && (
                    <p className="text-xl font-semibold text-[#141042] mt-0.5">
                      {primaryLabel}
                      {secondaryLabel && (
                        <span className="text-sm font-normal text-[#666666] ml-2">· {secondaryLabel}</span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:bg-[#F5F5F0] transition-colors text-lg"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Radar Chart */}
              {radarData.length > 0 && (
                <div className="w-full h-56">
                  <AssessmentRadarChart
                    data={radarData}
                    title={title}
                    accentColor={accentColor}
                    showPercent={activeModal !== 'colors'}
                  />
                </div>
              )}

              {/* Lista de scores */}
              <div className="grid grid-cols-2 gap-2">
                {radarData.map((d) => (
                  <div key={d.subject} className="flex items-center justify-between bg-[#F7F7F2] rounded-lg px-3 py-2">
                    <span className="text-xs text-[#555] truncate mr-2">{d.subject.split(' — ')[0]}</span>
                    <span className="text-xs font-semibold text-[#141042]">
                      {d.A}{activeModal !== 'colors' ? '%' : ''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rodapé */}
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveTestModal(activeModal === 'disc' ? 'disc' : activeModal === 'colors' ? 'color-test' : 'pi-test');
                }}
                className="w-full text-sm font-medium text-[#3B82F6] border border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 py-2.5 rounded-xl transition-colors"
              >
                Refazer teste
              </button>
            </div>
          </div>
        );
      })()}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Candidaturas',    value: dashLoading ? '—' : String(dashStats.total),      icon: FileText,  color: 'bg-[#3B82F6]/10 text-[#3B82F6]' },
          { label: 'Em processo',     value: dashLoading ? '—' : String(dashStats.active),     icon: Briefcase, color: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
          { label: 'Vagas abertas',   value: dashLoading ? '—' : String(openJobsCount),         icon: Building2, color: 'bg-[#10B981]/10 text-[#10B981]' },
          { label: 'Perfil completo', value: dashLoading ? '—' : `${dashStats.completion}%`,   icon: User,      color: 'bg-[#8B5CF6]/10 text-[#8B5CF6]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-[#666666]">{stat.label}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-semibold text-[#141042]">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recommended Jobs */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-[#141042]">Vagas Recomendadas</h3>
            <a href="/candidate/jobs" className="text-[#141042] text-xs sm:text-sm font-medium hover:underline flex items-center">
              Ver todas <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </a>
          </div>
          
          {dashLoading && (
            <p className="text-sm text-[#666666] py-4">Carregando vagas...</p>
          )}
          {!dashLoading && realJobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#E5E5DC] bg-white p-6 text-center text-sm text-[#666666]">
              Nenhuma vaga disponível no momento.
            </div>
          )}
          {!dashLoading && realJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              onClick={() => router.push('/candidate/jobs')}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D9D9C6] rounded-lg sm:rounded-xl flex items-center justify-center text-[#453931] font-bold text-base sm:text-lg shrink-0">
                    {job.title?.[0] ?? 'V'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[#141042] font-semibold text-sm sm:text-base truncate">{job.title}</h4>
                    <p className="text-[#666666] text-xs sm:text-sm">{job.org_name ?? job.department ?? ''}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2 gap-1">
                  {job.match_score != null && (
                    <span
                      className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                        job.match_score >= 70
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : job.match_score >= 40
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          : 'bg-[#E5E5DC] text-[#666666]'
                      }`}
                    >
                      {job.match_score}% match
                    </span>
                  )}
                  <span className="text-[#999] text-[10px] sm:text-xs">{timeAgo(job.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#666666] mb-3 sm:mb-4">
                {job.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </span>
                )}
                {job.employment_type && (
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    <span>{job.employment_type}</span>
                  </span>
                )}
                {job.seniority && (
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    <span>{job.seniority}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                {job.seniority && (
                  <span className="px-2 py-1 bg-[#F5F5F0] text-[#666666] text-[10px] sm:text-xs rounded-lg capitalize">{job.seniority}</span>
                )}
                <span className="text-[#141042] font-medium text-xs sm:text-sm ml-auto">
                  {formatSalaryRange(job.salary_min, job.salary_max)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Applications */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-[#141042]">Minhas Candidaturas</h3>
              <a href="/candidate/applications" className="text-[#141042] text-xs sm:text-sm font-medium hover:underline flex items-center">
                Ver todas <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </a>
            </div>
            
            <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl divide-y divide-[#E5E5DC]">
              {dashLoading && (
                <p className="p-4 text-sm text-[#666666]">Carregando...</p>
              )}
              {!dashLoading && realApplications.length === 0 && (
                <p className="p-4 text-sm text-[#666666]">Nenhuma candidatura ainda.</p>
              )}
              {!dashLoading && realApplications.map((app) => {
                const s = STATUS_MAP[app.status] ?? { label: app.status, color: 'amber' };
                const colorCls = {
                  green:  'bg-green-50 text-green-600',
                  amber:  'bg-amber-50 text-amber-600',
                  blue:   'bg-blue-50 text-blue-600',
                  violet: 'bg-violet-50 text-violet-600',
                  red:    'bg-red-50 text-red-600',
                }[s.color] ?? 'bg-amber-50 text-amber-600';
                return (
                  <div key={app.id} className="p-3 sm:p-4 hover:bg-[#FAFAF8] cursor-pointer transition-colors first:rounded-t-xl sm:first:rounded-t-2xl last:rounded-b-xl sm:last:rounded-b-2xl">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <h4 className="text-[#141042] font-medium text-xs sm:text-sm truncate pr-2">
                        {app.jobs?.title ?? 'Vaga'}
                      </h4>
                      <span className="text-[#999] text-[10px] sm:text-xs shrink-0">{timeAgo(app.created_at)}</span>
                    </div>
                    <p className="text-[#666666] text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                      {(app.jobs?.organizations as any)?.name ?? ''}
                    </p>
                    <span className={`inline-block px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-lg ${colorCls}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
            <h4 className="text-[#141042] font-semibold text-sm sm:text-base mb-3 sm:mb-4">Completar Perfil</h4>
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-[#666666]">Progresso</span>
                <span className="text-[#141042] font-medium">
                  {dashLoading ? '—' : `${dashStats.completion}%`}
                </span>
              </div>
              <div className="w-full bg-[#E5E5DC] rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-[#141042] h-1.5 sm:h-2 rounded-full transition-all duration-500"
                  style={{ width: `${dashStats.completion}%` }}
                />
              </div>
            </div>
            {!dashLoading && (
              <div className="space-y-2 sm:space-y-3">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ${
                      item.done ? 'bg-green-50' : 'bg-amber-50'
                    }`}>
                      <span className={`text-[10px] sm:text-xs ${item.done ? 'text-green-600' : 'text-amber-600'}`}>
                        {item.done ? '✓' : '!'}
                      </span>
                    </div>
                    <span className={item.done ? 'text-[#666666] line-through' : 'text-[#666666]'}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 bg-[#F5F5F0] hover:bg-[#E5E5DC] text-[#141042] font-medium rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
            >
              Completar agora
            </button>
          </div>
        </div>
      </div>

      {/* Modais de teste — renderizados fora do fluxo principal */}
      {activeTestModal === 'disc' && (
        <DiscTestModal
          onClose={(updated) => {
            setActiveTestModal(null);
            if (updated) loadDashboard();
          }}
        />
      )}
      {activeTestModal === 'color-test' && (
        <ColorTestModal
          onClose={(updated) => {
            setActiveTestModal(null);
            if (updated) loadDashboard();
          }}
        />
      )}
      {activeTestModal === 'pi-test' && (
        <PiTestModal
          onClose={(updated) => {
            setActiveTestModal(null);
            if (updated) loadDashboard();
          }}
        />
      )}
    </div>
  );
}
