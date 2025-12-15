'use client';

import { Briefcase, FileText, Bookmark, Eye, Clock, MapPin, Building2, Star, ArrowUpRight, Brain, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { colorApi } from '@/lib/api';

const stats = [
  { label: 'Candidaturas', value: '12', icon: FileText },
  { label: 'Salvas', value: '8', icon: Bookmark },
  { label: 'Visualizações', value: '156', icon: Eye },
  { label: 'Entrevistas', value: '3', icon: Briefcase },
];

const recommendedJobs = [
  {
    id: 1,
    title: 'Desenvolvedor Full Stack',
    company: 'TechCorp',
    location: 'São Paulo, SP',
    type: 'Remoto',
    salary: 'R$ 12.000 - R$ 18.000',
    tags: ['React', 'Node.js', 'TypeScript'],
    match: 95,
    posted: '2 dias atrás',
  },
  {
    id: 2,
    title: 'Frontend Developer Senior',
    company: 'StartupX',
    location: 'Rio de Janeiro, RJ',
    type: 'Híbrido',
    salary: 'R$ 15.000 - R$ 20.000',
    tags: ['Vue.js', 'TypeScript', 'Tailwind'],
    match: 88,
    posted: '3 dias atrás',
  },
  {
    id: 3,
    title: 'Tech Lead',
    company: 'MegaTech',
    location: 'Belo Horizonte, MG',
    type: 'Presencial',
    salary: 'R$ 20.000 - R$ 28.000',
    tags: ['Liderança', 'Arquitetura', 'AWS'],
    match: 82,
    posted: '1 semana atrás',
  },
];

const applications = [
  { job: 'Desenvolvedor Backend', company: 'DataCorp', status: 'Em análise', date: '15 Jan', statusColor: 'amber' },
  { job: 'Full Stack Developer', company: 'TechLab', status: 'Entrevista agendada', date: '12 Jan', statusColor: 'green' },
  { job: 'DevOps Engineer', company: 'CloudTech', status: 'Em análise', date: '10 Jan', statusColor: 'amber' },
];

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
        // Busca o DISC mais recente do usuário logado
        const { data: latestAssessment, error: latestError } = await supabase
          .from('assessments')
          .select('id')
          .eq('candidate_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestError) {
          console.error('Erro ao buscar assessment DISC:', latestError.message);
          setDiscError(latestError.message);
        }

        if (latestAssessment?.id) {
          const { data: disc, error: discFetchError } = await supabase
            .from('disc_assessments')
            .select('*')
            .eq('assessment_id', latestAssessment.id)
            .maybeSingle();

          if (disc) {
            setDiscResult(disc as unknown as DiscResult);
          } else if (discFetchError) {
            console.error('Erro ao buscar disc_assessments:', discFetchError.message);
            setDiscError(discFetchError.message);
          }
        }
        setDiscLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadColor = async () => {
      try {
        setColorLoading(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const latest = await colorApi.latest(session.access_token);
        setColorResult(latest);
      } catch (err: any) {
        console.error('Erro ao carregar perfil de cores:', err?.message || err);
        setColorError(err?.message || 'Erro ao carregar perfil de cores');
      } finally {
        setColorLoading(false);
      }
    };
    loadColor();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-16 lg:pb-0">
      {/* DISC Test Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow" onClick={() => router.push('/disc')}>
        <div className="absolute right-0 top-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-6 h-6 text-white" />
              <h3 className="text-lg sm:text-xl font-semibold text-white">Teste de Personalidade</h3>
            </div>
            <p className="text-white/80 text-sm sm:text-base mb-4">
              Descubra seu perfil profissional e destaque-se para recrutadores
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-end">
            <button
              className="flex-1 basis-0 min-w-[140px] text-center bg-white text-purple-600 px-6 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors text-sm sm:text-base"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/disc');
              }}
            >
              DISC
            </button>
            <button
              className="flex-1 basis-0 min-w-[140px] text-center bg-white/90 text-[#141042] px-6 py-2.5 rounded-lg font-medium hover:bg-white transition-colors text-sm sm:text-base border border-white/40"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/color-test');
              }}
            >
              Cores
            </button>
            <button
              className="flex-1 basis-0 min-w-[140px] text-center bg-white/90 text-[#141042] px-6 py-2.5 rounded-lg font-medium hover:bg-white transition-colors text-sm sm:text-base border border-white/40"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/pi-test');
              }}
            >
              PI
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-[#141042] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-1 sm:mb-2">
            Olá, {displayName}! 👋
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            Você tem <span className="text-[#D9D9C6] font-medium">3 novas vagas</span> compatíveis com seu perfil.
          </p>
        </div>
      </div>

      {/* DISC resumo */}
      <div className="relative overflow-visible rounded-2xl border border-[#E5E5DC] bg-white/90 p-4 sm:p-6 lg:p-7 shadow-[0_12px_40px_-28px_rgba(20,16,66,0.5)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-10 h-40 w-40 rounded-full bg-purple-200/50 blur-3xl" />
          <div className="absolute -bottom-16 -right-8 h-32 w-32 rounded-full bg-blue-200/50 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {(() => {
                const colors = getDiscColors(discResult?.primary_profile);
                return (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} ${colors.text} flex items-center justify-center shadow-inner text-2xl font-extrabold`}>
                    {discResult ? discResult.primary_profile : <Sparkles className="w-6 h-6" />}
                  </div>
                );
              })()}
              <div>
                <p className="text-xs uppercase tracking-wide text-purple-700/80 font-semibold">Perfil DISC</p>
              </div>
            </div>
            <button
              className="text-xs sm:text-sm font-semibold text-purple-700 hover:underline"
              onClick={() => router.push('/disc')}
            >
              Ver/Refazer teste
            </button>
          </div>

          {discLoading && (
            <p className="text-sm text-[#666]">Carregando seu perfil...</p>
          )}
          {!discLoading && discError && (
            <p className="text-sm text-red-600">Erro ao carregar perfil: {discError}</p>
          )}

          {!discLoading && discResult && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-1">
                {[
                  { label: 'Dominância', score: discResult.dominance_score, color: 'from-red-500/70 to-red-600/90', code: 'D', summary: discProfileSummary['D'] },
                  { label: 'Influência', score: discResult.influence_score, color: 'from-amber-400/80 to-amber-500/90', code: 'I', summary: discProfileSummary['I'] },
                  { label: 'Estabilidade', score: discResult.steadiness_score, color: 'from-green-500/70 to-green-600/90', code: 'S', summary: discProfileSummary['S'] },
                  { label: 'Consciência', score: discResult.conscientiousness_score, color: 'from-blue-500/70 to-blue-600/90', code: 'C', summary: discProfileSummary['C'] },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="relative group p-3 rounded-xl bg-[#F7F7F2] border border-[#EFEFE7]"
                    title={`${item.label}: ${item.summary || ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-[#444]">{item.label}</p>
                      <span className="text-xs text-[#666]">{item.score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                        style={{ width: `${Math.min(item.score, 100)}%` }}
                      />
                    </div>
                    {discProfileSummary[item.code] && (
                      <div className="pointer-events-none absolute z-10 left-0 right-0 -top-3 transform -translate-y-full opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition">
                        <div className="rounded-lg bg-white text-gray-900 text-xs p-3 shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900 mb-1">{item.label}</p>
                          <p className="text-gray-700 leading-snug">{discProfileSummary[item.code]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#2E2E2E] leading-relaxed mt-3">
                {discResult.description ||
                  'Você é equilibrado(a) e traz uma combinação de características únicas para o trabalho.'}
              </p>
            </>
          )}

          {!discLoading && !discResult && (
            <p className="text-sm text-[#666]">
              Ainda não encontramos seu perfil DISC. Faça o teste para gerar seu resumo comportamental.
            </p>
          )}
        </div>
      </div>

      {/* Perfil Cores */}
      <div className="relative overflow-visible rounded-2xl border border-[#E5E5DC] bg-white/90 p-4 sm:p-6 lg:p-7 shadow-[0_12px_40px_-28px_rgba(20,16,66,0.5)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="absolute -bottom-16 -right-8 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 to-blue-300 text-[#141042] flex items-center justify-center shadow-inner text-2xl font-extrabold">
                🎯
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-purple-700/80 font-semibold">Perfil Cores</p>
              </div>
            </div>
            <button
              className="text-xs sm:text-sm font-semibold text-purple-700 hover:underline"
              onClick={() => router.push('/color-test')}
            >
              Ver/Refazer teste
            </button>
          </div>

          {colorLoading && <p className="text-sm text-[#666]">Carregando seu perfil...</p>}
          {!colorLoading && colorError && (
            <p className="text-sm text-red-600">Erro ao carregar perfil de cores: {colorError}</p>
          )}

          {!colorLoading && colorResult && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-1">
                {([
                  { code: 'azul', label: 'Azul', colorClasses: 'from-blue-500/70 to-blue-600/90', summary: colorSummary['azul'] },
                  { code: 'rosa', label: 'Rosa', colorClasses: 'from-rose-400/80 to-rose-500/90', summary: colorSummary['rosa'] },
                  { code: 'amarelo', label: 'Amarelo', colorClasses: 'from-amber-400/80 to-amber-500/90', summary: colorSummary['amarelo'] },
                  { code: 'verde', label: 'Verde', colorClasses: 'from-emerald-400/80 to-emerald-500/90', summary: colorSummary['verde'] },
                  { code: 'branco', label: 'Branco', colorClasses: 'from-slate-300/80 to-slate-400/90', summary: colorSummary['branco'] },
                ] as const).map((item) => {
                  const val = (colorResult.scores || {})[item.code] || 0;
                  return (
                    <div
                      key={item.code}
                      className="relative group p-3 rounded-xl bg-[#F7F7F2] border border-[#EFEFE7]"
                      title={`${item.label}: ${item.summary}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-[#444]">{item.label}</p>
                        <span className="text-xs text-[#666]">{val}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.colorClasses}`}
                          style={{ width: `${Math.min(val, 80)}%` }}
                        />
                      </div>
                      {item.summary && (
                        <div className="pointer-events-none absolute z-10 left-0 right-0 -top-3 transform -translate-y-full opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition">
                          <div className="rounded-lg bg-white text-gray-900 text-xs p-3 shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900 mb-1">{item.label}</p>
                            <p className="text-gray-700 leading-snug">{item.summary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-[#2E2E2E] leading-relaxed mt-3">
                Cor primária:{' '}
                <strong title={colorSummary[colorResult.primary_color as string] || ''}>
                  {colorResult.primary_color || '-'}
                </strong>{' '}
                • Secundária:{' '}
                <strong title={colorSummary[colorResult.secondary_color as string] || ''}>
                  {colorResult.secondary_color || '-'}
                </strong>
              </p>
            </>
          )}

          {!colorLoading && !colorResult && !colorError && (
            <p className="text-sm text-[#666]">
              Ainda não encontramos seu perfil de cores. Faça o teste para gerar seu mapa de cores predominantes.
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#141042]/5 rounded-lg sm:rounded-xl flex items-center justify-center">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#141042]" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-[#141042]">{stat.value}</p>
            <p className="text-[#666666] text-xs sm:text-sm">{stat.label}</p>
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
          
          {recommendedJobs.map((job) => (
            <div key={job.id} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#141042]/20 hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D9D9C6] rounded-lg sm:rounded-xl flex items-center justify-center text-[#453931] font-bold text-base sm:text-lg shrink-0">
                    {job.company[0]}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[#141042] font-semibold text-sm sm:text-base truncate">{job.title}</h4>
                    <p className="text-[#666666] text-xs sm:text-sm">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-green-50 px-2 sm:px-3 py-1 rounded-full shrink-0 ml-2">
                  <Star className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 text-[10px] sm:text-xs font-medium">{job.match}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#666666] mb-3 sm:mb-4">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span>{job.type}</span>
                </span>
                <span className="hidden sm:flex items-center space-x-1">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{job.posted}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {job.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-[#F5F5F0] text-[#666666] text-[10px] sm:text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[#141042] font-medium text-xs sm:text-sm">{job.salary}</span>
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
              {applications.map((app, i) => (
                <div key={i} className="p-3 sm:p-4 hover:bg-[#FAFAF8] cursor-pointer transition-colors first:rounded-t-xl sm:first:rounded-t-2xl last:rounded-b-xl sm:last:rounded-b-2xl">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h4 className="text-[#141042] font-medium text-xs sm:text-sm truncate pr-2">{app.job}</h4>
                    <span className="text-[#999] text-[10px] sm:text-xs shrink-0">{app.date}</span>
                  </div>
                  <p className="text-[#666666] text-[10px] sm:text-xs mb-1.5 sm:mb-2">{app.company}</p>
                  <span className={`inline-block px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-lg ${
                    app.statusColor === 'green' 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h4 className="text-[#141042] font-semibold text-sm sm:text-base mb-3 sm:mb-4">Completar Perfil</h4>
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-[#666666]">Progresso</span>
                <span className="text-[#141042] font-medium">65%</span>
              </div>
              <div className="w-full bg-[#E5E5DC] rounded-full h-1.5 sm:h-2">
                <div className="bg-[#141042] h-1.5 sm:h-2 rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-amber-600 text-[10px] sm:text-xs">!</span>
                </div>
                <span className="text-[#666666]">Adicionar experiência</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-amber-600 text-[10px] sm:text-xs">!</span>
                </div>
                <span className="text-[#666666]">Upload do currículo</span>
              </div>
            </div>
            <button className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 bg-[#F5F5F0] hover:bg-[#E5E5DC] text-[#141042] font-medium rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm">
              Completar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
