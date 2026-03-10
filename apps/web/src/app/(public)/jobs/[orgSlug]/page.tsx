'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Briefcase, ArrowRight, Building2, Search, Instagram, Linkedin, MessageCircle, ChevronRight, X, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PublicJob {
  id: string;
  title: string;
  description: string;
  description_html: string | null;
  location: string | null;
  employment_type: string | null;
  benefits: string | null;
  requirements: string | null;
  application_deadline: string | null;
  created_at: string;
  org_name: string;
  org_slug: string;
  org_industry: string | null;
  org_logo_url: string | null;
  career_page_headline: string | null;
  career_page_logo_url: string | null;
  career_page_color: string | null;
  career_page_secondary_color: string | null;
  career_page_banner_url: string | null;
  career_page_about: string | null;
  career_page_whatsapp_url: string | null;
  career_page_instagram_url: string | null;
  career_page_linkedin_url: string | null;
  career_page_show_contact: boolean;
}

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  contract: 'PJ / Contrato',
  internship: 'Estágio',
};

const EMPLOYMENT_TYPE_COLOR: Record<string, string> = {
  full_time: '#EEF2FF::#4F46E5',
  part_time: '#F0FDF4::#16A34A',
  contract: '#FFF7ED::#EA580C',
  internship: '#FFF1F2::#E11D48',
};

function EmploymentBadge({ type }: { type: string }) {
  const colors = EMPLOYMENT_TYPE_COLOR[type];
  if (!colors) return null;
  const [bg, text] = colors.split('::');
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}>
      {EMPLOYMENT_TYPE_LABEL[type] || type}
    </span>
  );
}

export default function CareerPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const supabase = createClient();

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [org, setOrg] = useState<Pick<PublicJob,
    'org_name' | 'career_page_headline' | 'career_page_logo_url' | 'org_logo_url' | 'career_page_color' |
    'career_page_secondary_color' | 'career_page_banner_url' | 'career_page_about' |
    'career_page_whatsapp_url' | 'career_page_instagram_url' | 'career_page_linkedin_url' |
    'career_page_show_contact' | 'org_industry'
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadJobs();
  }, [orgSlug]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_jobs_by_org', { p_org_slug: orgSlug });
      if (error) throw error;
      if (!data || data.length === 0) {
        setNotFound(true);
        return;
      }
      setJobs(data as PublicJob[]);
      const first = data[0] as PublicJob;
      setOrg({
        org_name: first.org_name,
        career_page_headline: first.career_page_headline,
        career_page_logo_url: first.career_page_logo_url,
        org_logo_url: first.org_logo_url,
        career_page_color: first.career_page_color,
        career_page_secondary_color: first.career_page_secondary_color,
        career_page_banner_url: first.career_page_banner_url,
        career_page_about: first.career_page_about,
        career_page_whatsapp_url: first.career_page_whatsapp_url,
        career_page_instagram_url: first.career_page_instagram_url,
        career_page_linkedin_url: first.career_page_linkedin_url,
        career_page_show_contact: first.career_page_show_contact,
        org_industry: first.org_industry,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/register?redirect=/jobs/${orgSlug}/${selectedJob.id}`);
        return;
      }
      router.push(`/candidate/jobs?apply=${selectedJob.id}`);
    } finally {
      setApplying(false);
    }
  };

  const primaryColor = org?.career_page_color || '#141042';
  const secondaryColor = org?.career_page_secondary_color || '#10B981';
  const logoUrl = org?.career_page_logo_url || org?.org_logo_url || null;

  const filtered = jobs.filter(j =>
    !search.trim() ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F8F6' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 border-t-[#141042] animate-spin" />
          <p className="text-sm text-gray-400 tracking-wide">Carregando vagas...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6]">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Página não encontrada</h1>
          <p className="text-gray-500 leading-relaxed">Esta empresa não possui uma página de carreiras pública ou não há vagas abertas no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: primaryColor }}>
        {/* Banner como fundo com overlay */}
        {org?.career_page_banner_url && (
          <>
            <img
              src={org.career_page_banner_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: `${primaryColor}e6` }} />
          </>
        )}

        {/* Detalhe decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: secondaryColor, transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: secondaryColor, transform: 'translate(-30%, 30%)' }} />

        <style>{`
          @keyframes rotateBorder {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to   { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>

        <div className="relative max-w-5xl mx-auto px-6 py-12 sm:py-16">

          {/* Linha: logo à esquerda + badge à direita */}
          <div className="flex items-center justify-between mb-8">
            {/* Logo com animated gradient border */}
            {logoUrl ? (
              <div className="relative inline-flex rounded-2xl overflow-hidden p-0.5">
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '250%', height: '250%',
                  background: `conic-gradient(from 0deg, transparent 0%, ${secondaryColor} 20%, transparent 40%, ${secondaryColor}99 60%, transparent 80%)`,
                  animation: 'rotateBorder 3s linear infinite',
                }} />
                <div className="relative z-10 rounded-[14px] w-48 h-28 overflow-hidden backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <img
                    src={logoUrl}
                    alt={org?.org_name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
            ) : (
              <div className="relative inline-flex rounded-2xl overflow-hidden p-0.5">
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '250%', height: '250%',
                  background: `conic-gradient(from 0deg, transparent 0%, ${secondaryColor} 20%, transparent 40%, ${secondaryColor}99 60%, transparent 80%)`,
                  animation: 'rotateBorder 3s linear infinite',
                }} />
                <div className="relative z-10 rounded-[14px] w-24 h-24 flex items-center justify-center backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <Building2 className="w-12 h-12 text-white" />
                </div>
              </div>
            )}

            {/* Badge de vagas */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20"
              style={{ background: `${secondaryColor}33`, color: 'white' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: secondaryColor }} />
              {filtered.length} {filtered.length === 1 ? 'vaga aberta' : 'vagas abertas'}
            </span>
          </div>

          {/* Texto principal */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            {org?.career_page_headline || (
              <>
                Sua próxima oportunidade<br className="hidden sm:block" />
                <span className="text-white/80"> profissional está aqui na </span>
                <span style={{ color: secondaryColor }}>{org?.org_name}</span>
              </>
            )}
          </h1>

          {org?.org_industry && (
            <p className="text-white/60 uppercase tracking-widest font-medium text-sm">
              {org.org_industry}
            </p>
          )}
        </div>
      </div>

      {/* ── SOBRE A EMPRESA ──────────────────────────────────────── */}
      {org?.career_page_about && (
        <div className="max-w-5xl mx-auto px-6 pt-12">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-start gap-5">
              <div className="w-1 rounded-full shrink-0 h-full self-stretch min-h-16"
                style={{ background: secondaryColor }} />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: secondaryColor }}>
                  Sobre a empresa
                </h2>
                <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                  {org.org_name}
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {org.career_page_about}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VAGAS ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Cabeçalho da seção + busca */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Oportunidades</h2>
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>Vagas abertas</p>
          </div>

          <div className="relative sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cargo ou localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 text-gray-800 placeholder:text-gray-400 shadow-sm"
              style={{ '--tw-ring-color': `${primaryColor}40` } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Lista de vagas */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Nenhuma vaga encontrada</p>
            <p className="text-sm text-gray-400">Tente outro termo de busca.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <button
                key={job.id}
                onClick={() => { setSelectedJob(job); setApplied(false); }}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group overflow-hidden"
              >
                {/* Linha de destaque top com cor da marca */}
                <div className="h-0.5 w-0 group-hover:w-full transition-all duration-300 rounded-full"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }} />

                <div className="px-6 py-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Título */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2.5 group-hover:text-(--primary) transition-colors"
                      style={{ '--primary': primaryColor } as React.CSSProperties}>
                      {job.title}
                    </h3>

                    {/* Metadados */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {job.employment_type && (
                        <EmploymentBadge type={job.employment_type} />
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.application_deadline && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          Até {new Date(job.application_deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Resumo da descrição */}
                    {job.description && (
                      <p className="mt-2.5 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {(job.description_html
                          ? job.description_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                          : job.description
                        ).substring(0, 150)}
                      </p>
                    )}

                    {/* Tags extras */}
                    <div className="flex items-center gap-2 mt-2.5">
                      {job.benefits && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Benefícios
                        </span>
                      )}
                      {job.requirements && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          Requisitos listados
                        </span>
                      )}
                      <span className="text-xs text-gray-300 ml-auto">
                        {Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000) === 0
                          ? 'Publicada hoje'
                          : `Publicada há ${Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000)}d`}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                      style={{ background: primaryColor }}>
                      Candidatar-se
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors sm:hidden">
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL SLIDE-OVER ──────────────────────────────────────── */}
      {selectedJob && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          />

          {/* Modal centralizado */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">

            {/* Header do painel */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100"
              style={{ background: primaryColor }}>
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: `${secondaryColor}` }}>
                  {selectedJob.org_name}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {selectedJob.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {selectedJob.employment_type && (
                    <EmploymentBadge type={selectedJob.employment_type} />
                  )}
                  {selectedJob.location && (
                    <span className="flex items-center gap-1.5 text-sm text-white/70">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedJob.location}
                    </span>
                  )}
                  {selectedJob.application_deadline && (
                    <span className="flex items-center gap-1.5 text-sm text-white/60">
                      <Clock className="w-3.5 h-3.5" />
                      Até {new Date(selectedJob.application_deadline).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Descrição */}
              {(selectedJob.description_html || selectedJob.description) && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: secondaryColor }}>
                    Sobre a vaga
                  </h3>
                  {selectedJob.description_html ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedJob.description_html }}
                    />
                  ) : (
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedJob.description}
                    </p>
                  )}
                </section>
              )}

              {/* Requisitos */}
              {selectedJob.requirements && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: secondaryColor }}>
                    Requisitos
                  </h3>
                  <div className="space-y-2">
                    {selectedJob.requirements.split('\n').filter(Boolean).map((req, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: primaryColor }} />
                        <p className="text-sm text-gray-600 leading-relaxed">{req.replace(/^[-•*]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Benefícios */}
              {selectedJob.benefits && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: secondaryColor }}>
                    Benefícios
                  </h3>
                  <div className="space-y-2">
                    {selectedJob.benefits.split('\n').filter(Boolean).map((ben, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: secondaryColor }} />
                        <p className="text-sm text-gray-600 leading-relaxed">{ben.replace(/^[-•*]\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* Rodapé fixo com CTA */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              {applied ? (
                <div className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Candidatura enviada com sucesso!
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {applying ? 'Redirecionando...' : 'Candidatar-se a esta vaga'}
                </button>
              )}
            </div>

          </div>
          </div>
        </>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Branding */}
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt={org?.org_name} className="h-7 object-contain opacity-60" />
            )}
            {!logoUrl && (
              <span className="text-sm font-semibold text-gray-500">{org?.org_name}</span>
            )}
          </div>

          {/* Redes sociais */}
          {org?.career_page_show_contact && (
            <div className="flex items-center gap-2">
              {org.career_page_whatsapp_url && (
                <a href={org.career_page_whatsapp_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E7FBF0] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
                  aria-label="WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {org.career_page_instagram_url && (
                <a href={org.career_page_instagram_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FFF0F5] text-[#E1306C] hover:bg-[#E1306C] hover:text-white transition-all"
                  aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {org.career_page_linkedin_url && (
                <a href={org.career_page_linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EBF5FB] text-[#0077B5] hover:bg-[#0077B5] hover:text-white transition-all"
                  aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Powered by */}
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <span className="font-bold" style={{ color: primaryColor }}>TALENT</span><span className="font-bold text-[#F97316]">FORGE</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
