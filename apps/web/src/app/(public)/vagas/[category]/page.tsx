import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Clock, Briefcase, ArrowRight, ArrowLeft, Zap } from 'lucide-react';

// ─── Category / modality map ───────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, {
  label: string;
  industry: string | null;
  modality: string | null;
  description: string;
  keywords: string[];
}> = {
  tecnologia:    { label: 'Tecnologia',        industry: 'Tecnologia',         modality: null,       description: 'vagas na área de tecnologia e software', keywords: ['desenvolvedor', 'programador', 'TI', 'software'] },
  administrativo:{ label: 'Administrativo',    industry: 'Administrativo',     modality: null,       description: 'vagas administrativas e de escritório',  keywords: ['administrativo', 'assistente', 'recepcionista'] },
  saude:         { label: 'Saúde',             industry: 'Saúde',              modality: null,       description: 'vagas na área da saúde',                 keywords: ['saúde', 'enfermeiro', 'médico', 'farmácia'] },
  marketing:     { label: 'Marketing',         industry: 'Marketing',          modality: null,       description: 'vagas de marketing e comunicação',       keywords: ['marketing', 'social media', 'publicidade'] },
  educacao:      { label: 'Educação',          industry: 'Educação',           modality: null,       description: 'vagas na área de educação e ensino',     keywords: ['professor', 'educação', 'pedagogo', 'tutor'] },
  vendas:        { label: 'Vendas',            industry: 'Vendas',             modality: null,       description: 'vagas de vendas e comercial',            keywords: ['vendas', 'comercial', 'representante', 'SDR'] },
  rh:            { label: 'Recursos Humanos',  industry: 'Recursos Humanos',   modality: null,       description: 'vagas de RH e gestão de pessoas',        keywords: ['RH', 'recursos humanos', 'recrutamento', 'DHO'] },
  engenharia:    { label: 'Engenharia',        industry: 'Engenharia',         modality: null,       description: 'vagas de engenharia e projetos',         keywords: ['engenheiro', 'engenharia', 'projetos'] },
  varejo:        { label: 'Varejo',            industry: 'Varejo',             modality: null,       description: 'vagas no comércio e varejo',             keywords: ['varejo', 'atendente', 'operador de caixa'] },
  ti:            { label: 'TI',               industry: 'TI',                  modality: null,       description: 'vagas de TI e infraestrutura',           keywords: ['TI', 'suporte', 'helpdesk', 'infraestrutura'] },
  juridico:      { label: 'Jurídico',          industry: 'Jurídico',           modality: null,       description: 'vagas na área jurídica e advocacia',     keywords: ['advogado', 'jurídico', 'paralegal', 'direito'] },
  imoveis:       { label: 'Imóveis',           industry: 'Imóveis',            modality: null,       description: 'vagas no mercado imobiliário',           keywords: ['corretor', 'imóveis', 'imobiliária'] },
  remoto:        { label: 'Home Office',       industry: null,                  modality: 'remoto',   description: 'vagas 100% remotas e home office',       keywords: ['remoto', 'home office', 'trabalho remoto'] },
  hibrido:       { label: 'Híbrido',           industry: null,                  modality: 'hibrido',  description: 'vagas no modelo híbrido',                keywords: ['híbrido', 'home office parcial'] },
};

// ─── Supabase (server-side, no cookies needed for public RPC) ─────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ─── Static params (pre-render all known categories) ─────────────────────────

export function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map(category => ({ category }));
}

export const revalidate = 3600; // ISR: revalida a cada 1h

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORY_MAP[category];
  if (!cat) return { title: 'Vagas | TalentForge' };

  const supabase = getSupabase();
  const { data } = await supabase.rpc('get_all_public_jobs');
  const count = (data || []).filter((j: any) =>
    cat.modality ? j.work_modality === cat.modality : j.org_industry === cat.industry
  ).length;

  return {
    title: `${count} Vagas de ${cat.label} | TalentForge — Empregos em todo o Brasil`,
    description: `Encontre as melhores ${cat.description} em todo o Brasil. ${count} oportunidades abertas — CLT, PJ, estágio e home office nas principais empresas.`,
    keywords: [...cat.keywords, 'emprego brasil', 'vagas de emprego', 'TalentForge'],
    openGraph: {
      title: `Vagas de ${cat.label} | TalentForge`,
      description: `${count} ${cat.description} abertas no Brasil. Candidate-se agora.`,
      type: 'website',
      url: `https://talentforge.com.br/vagas/${category}`,
      siteName: 'TalentForge',
    },
    twitter: {
      card: 'summary',
      title: `${count} Vagas de ${cat.label} | TalentForge`,
      description: `As melhores ${cat.description} do Brasil em um só lugar.`,
    },
    alternates: { canonical: `https://talentforge.com.br/vagas/${category}` },
    robots: { index: true, follow: true },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = { full_time: 'CLT', part_time: 'Meio período', contract: 'PJ', internship: 'Estágio' };
const TYPE_COLOR: Record<string, string> = {
  full_time: 'bg-violet-50 text-violet-700 border-violet-200',
  part_time: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contract:  'bg-orange-50 text-orange-700 border-orange-200',
  internship:'bg-rose-50 text-rose-700 border-rose-200',
};
const MODALITY_LABEL: Record<string, string> = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };
const MODALITY_COLOR: Record<string, string> = {
  presencial: 'bg-blue-50 text-blue-700 border-blue-200',
  hibrido:    'bg-amber-50 text-amber-700 border-amber-200',
  remoto:     'bg-teal-50 text-teal-700 border-teal-200',
};

function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  if (d < 7) return `${d}d atrás`;
  return `${Math.floor(d / 7)} sem`;
}

function OrgAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white border border-gray-100 flex items-center justify-center shadow-sm">
        <img src={logoUrl} alt={name} className="w-full h-full object-contain p-1" loading="lazy" />
      </div>
    );
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const palette = ['bg-[#141042]', 'bg-[#1F4ED8]', 'bg-[#10B981]', 'bg-[#F97316]', 'bg-violet-600'];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div className={`w-12 h-12 ${color} text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const cat = CATEGORY_MAP[category];
  if (!cat) notFound();

  const supabase = getSupabase();
  const { data: allJobs } = await supabase.rpc('get_all_public_jobs');

  const jobs: any[] = (allJobs || []).filter((j: any) =>
    cat.modality ? j.work_modality === cat.modality : j.org_industry === cat.industry
  );

  // JSON-LD: ItemList of top jobs
  const jobListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Vagas de ${cat.label} no Brasil — TalentForge`,
    numberOfItems: jobs.length,
    itemListElement: jobs.slice(0, 20).map((j: any, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'JobPosting',
        title: j.title,
        description: j.description || j.title,
        datePosted: j.created_at,
        validThrough: j.application_deadline || undefined,
        hiringOrganization: { '@type': 'Organization', name: j.org_name },
        jobLocation: j.work_modality === 'remoto' ? undefined : (j.location ? {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: j.location, addressCountry: 'BR' },
        } : undefined),
        applicantLocationRequirements: j.work_modality === 'remoto'
          ? { '@type': 'Country', name: 'Brasil' } : undefined,
        jobLocationType: j.work_modality === 'remoto' ? 'TELECOMMUTE' : undefined,
        employmentType: j.employment_type === 'full_time' ? 'FULL_TIME'
          : j.employment_type === 'part_time' ? 'PART_TIME'
          : j.employment_type === 'internship' ? 'INTERN' : 'CONTRACTOR',
        url: `https://talentforge.com.br/jobs/${j.org_slug}/${j.id}`,
      },
    })),
  };

  const filterParam = cat.modality
    ? `modality=${cat.modality}`
    : `industry=${encodeURIComponent(cat.industry || '')}`;

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobListSchema) }}
      />

      {/* Header */}
      <header className="bg-[#141042] sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-md">
              <Zap className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="hidden sm:flex items-baseline gap-0.5">
              <span className="text-white font-semibold text-lg tracking-tight">TALENT</span>
              <span className="text-[#F97316] font-bold text-lg tracking-wider">FORGE</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block px-3 py-2 rounded-lg hover:bg-white/10">Entrar</Link>
            <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-5 py-2 rounded-lg transition-all shadow-md">
              Cadastrar-se
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#141042] via-[#1a1565] to-[#0d0b2e] pt-10 pb-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <Link href="/vagas" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm mb-5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Todas as vagas
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Vagas de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#3B82F6]">
              {cat.label}
            </span>
          </h1>
          <p className="text-white/60 text-base max-w-lg mx-auto">
            <span className="font-bold text-white">{jobs.length}</span>{' '}
            {jobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'} — atualizadas diariamente
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-gray-700 transition-colors">TalentForge</Link>
            <span>›</span>
            <Link href="/vagas" className="hover:text-gray-700 transition-colors">Vagas</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">{cat.label}</span>
          </nav>
          <Link
            href={`/vagas?${filterParam}`}
            className="text-sm text-[#141042] font-medium flex items-center gap-1 hover:underline"
          >
            Filtrar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Job list */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">Nenhuma vaga disponível no momento</p>
            <p className="text-sm text-gray-400">Novas vagas são adicionadas diariamente.</p>
            <Link href="/vagas" className="mt-5 inline-block text-sm text-[#141042] font-semibold hover:underline">
              Ver todas as vagas →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => (
              <Link
                key={job.id}
                href={`/jobs/${job.org_slug}/${job.id}`}
                className="group block bg-white rounded-2xl border border-gray-100 hover:border-[#141042]/25 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <OrgAvatar name={job.org_name ?? 'Empresa'} logoUrl={job.org_logo_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">{job.org_name}</p>
                      <h2 className="font-bold text-[#141042] text-base group-hover:text-[#1F4ED8] transition-colors line-clamp-2 mb-2">
                        {job.title}
                      </h2>
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="text-xs font-semibold text-[#10B981]">{job.salary_range}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {job.employment_type && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TYPE_COLOR[job.employment_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {TYPE_LABEL[job.employment_type] || job.employment_type}
                            </span>
                          )}
                          {job.work_modality && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${MODALITY_COLOR[job.work_modality] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {MODALITY_LABEL[job.work_modality] || job.work_modality}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" /> {daysAgo(job.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-[#141042] transition-colors flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
                <div className="h-[3px] bg-gradient-to-r from-[#141042] via-[#3B82F6] to-[#10B981] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>
        )}

        {/* Other categories */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Outras áreas</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_MAP)
              .filter(([slug]) => slug !== category)
              .slice(0, 10)
              .map(([slug, c]) => (
                <Link
                  key={slug}
                  href={`/vagas/${slug}`}
                  className="px-4 py-2 bg-white border border-gray-200 hover:border-[#141042]/50 hover:bg-[#141042]/5 text-sm text-gray-600 hover:text-[#141042] rounded-full transition-all font-medium"
                >
                  {c.label}
                </Link>
              ))}
            <Link href="/vagas" className="px-4 py-2 bg-[#141042] text-white text-sm rounded-full font-medium hover:bg-[#1a1565] transition-colors">
              Ver todas →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#141042] mt-10 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-baseline gap-0.5">
            <span className="text-white font-semibold tracking-tight">TALENT</span>
            <span className="text-[#F97316] font-bold tracking-wider">FORGE</span>
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} TalentForge · Conectando talentos às melhores oportunidades
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/vagas" className="text-white/50 hover:text-white/80 transition-colors">Vagas</Link>
            <Link href="/register" className="text-[#10B981] hover:text-[#34D399] font-medium transition-colors">Para empresas</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
