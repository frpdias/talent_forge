'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Briefcase, ArrowRight, Building2, Search, Instagram, Linkedin, MessageCircle, Globe } from 'lucide-react';
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

export default function CareerPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const supabase = createClient();

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [org, setOrg] = useState<Pick<PublicJob,
    'org_name' | 'career_page_headline' | 'career_page_logo_url' | 'career_page_color' |
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

  const primaryColor = org?.career_page_color || '#141042';
  const secondaryColor = org?.career_page_secondary_color || '#10B981';
  const logoUrl = org?.career_page_logo_url || null;

  const filtered = jobs.filter(j =>
    !search.trim() ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#141042] mb-2">Página não encontrada</h1>
          <p className="text-[#666666]">Esta empresa não possui uma página de carreiras pública ou não há vagas abertas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero */}
      <div style={{ background: primaryColor }} className="text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={org?.org_name}
              className="h-12 mb-6 object-contain"
            />
          )}
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {org?.career_page_headline || `Trabalhe na ${org?.org_name}`}
          </h1>
          {org?.org_industry && (
            <p className="text-white/70 text-sm mb-6">{org.org_industry}</p>
          )}
          <p className="text-white/80 text-lg">
            {filtered.length} {filtered.length === 1 ? 'vaga aberta' : 'vagas abertas'}
          </p>
        </div>
      </div>

      {/* Banner */}
      {org?.career_page_banner_url && (
        <div className="w-full max-h-64 overflow-hidden">
          <img
            src={org.career_page_banner_url}
            alt={`Banner ${org.org_name}`}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* About */}
      {org?.career_page_about && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
              Sobre a {org.org_name}
            </h2>
            <p className="text-[#444444] leading-relaxed whitespace-pre-wrap">
              {org.career_page_about}
            </p>
          </div>
        </div>
      )}

      {/* Search + Jobs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10"
        style={org?.career_page_about ? { paddingTop: '0' } : undefined}
      >
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
          <input
            type="text"
            placeholder="Buscar por cargo ou localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
          />
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-[#E5E5DC] mx-auto mb-4" />
            <p className="text-[#666666]">Nenhuma vaga encontrada para esta busca.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <button
                key={job.id}
                onClick={() => router.push(`/jobs/${orgSlug}/${job.id}`)}
                className="w-full text-left bg-white border border-[#E5E5DC] rounded-xl p-6 hover:shadow-md hover:border-[#141042]/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-[#141042] mb-2 group-hover:underline">
                      {job.title}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-[#666666]">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {EMPLOYMENT_TYPE_LABEL[job.employment_type] || job.employment_type}
                        </span>
                      )}
                      {job.application_deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Até {new Date(job.application_deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#999999] group-hover:text-[#141042] shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#E5E5DC] mt-16 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social links */}
          {org?.career_page_show_contact && (
            <div className="flex items-center gap-4">
              {org.career_page_whatsapp_url && (
                <a href={org.career_page_whatsapp_url} target="_blank" rel="noopener noreferrer"
                  className="text-[#25D366] hover:opacity-80 transition-opacity"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {org.career_page_instagram_url && (
                <a href={org.career_page_instagram_url} target="_blank" rel="noopener noreferrer"
                  className="text-[#E1306C] hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {org.career_page_linkedin_url && (
                <a href={org.career_page_linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="text-[#0077B5] hover:opacity-80 transition-opacity"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-[#999999]">
            Powered by <span className="font-semibold text-[#141042]">TALENT</span><span className="font-bold text-[#F97316]">FORGE</span>
          </p>
        </div>
      </div>
    </div>
  );
}
