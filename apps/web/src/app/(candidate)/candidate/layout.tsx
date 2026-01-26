'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  FileText, 
  Bookmark, 
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Calendar,
  PlusCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/UserAvatar';

type NavItem = { href: string; label: string; icon: typeof Home };

const navItems: NavItem[] = [
  { href: '/candidate', label: 'Início', icon: Home },
  { href: '/candidate/jobs', label: 'Buscar Vagas', icon: Briefcase },
  { href: '/candidate/applications', label: 'Candidaturas', icon: FileText },
  { href: '/candidate/saved', label: 'Salvas', icon: Bookmark },
  { href: '/candidate/profile', label: 'Perfil', icon: User },
];

const moreItems: NavItem[] = [];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeExplode, setResumeExplode] = useState(false);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [showAllEducation, setShowAllEducation] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    const loadResume = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const userEmail = user.email || '';

      const selectColumns = 'id, user_id, full_name, cpf, email, phone, birth_date, city, state, current_title, area_of_expertise, seniority_level, salary_expectation, employment_type, resume_url, resume_filename, updated_at, created_at';
      const orFilters = userEmail
        ? `user_id.eq.${user.id},email.eq.${userEmail}`
        : `user_id.eq.${user.id}`;

      const { data: profiles, error: profilesError } = await supabase
        .from('candidate_profiles')
        .select(selectColumns)
        .or(orFilters)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (profilesError) {
        setResumeError(profilesError.message);
        return;
      }

      const profileList = (profiles as any[]) || [];
      const profileIds = profileList.map((item) => item.id).filter(Boolean);

      const hasValue = (value: any) => value !== null && value !== undefined && value !== '';
      const mergeProfile = (items: any[]) => {
        const merged: Record<string, any> = {};
        items.forEach((item) => {
          Object.entries(item || {}).forEach(([key, value]) => {
            if (!hasValue(merged[key]) && hasValue(value)) {
              merged[key] = value;
            }
          });
        });
        return Object.keys(merged).length > 0 ? merged : null;
      };

      const orderedProfiles = [
        ...profileList.filter((item) => item.user_id === user.id),
        ...profileList.filter((item) => item.user_id !== user.id),
      ];

      const profileData = mergeProfile(orderedProfiles);

      setProfile(profileData || null);
      setResumeUrl(profileData?.resume_url || null);
      setResumeName(profileData?.resume_filename || null);

      if (profileIds.length === 0) {
        return;
      }

      const [{ data: experienceData }, { data: educationData }] = await Promise.all([
        supabase
          .from('candidate_experience')
          .select('company_name, job_title, start_date, end_date, is_current, description')
          .in('candidate_profile_id', profileIds)
          .order('start_date', { ascending: false }),
        supabase
          .from('candidate_education')
          .select('degree_level, course_name, institution, start_year, end_year, is_current')
          .in('candidate_profile_id', profileIds)
          .order('start_year', { ascending: false }),
      ]);

      setExperiences((experienceData as any[]) || []);
      setEducation((educationData as any[]) || []);
    };

    loadResume();
  }, [supabase]);

  const handleResumeOpen = () => {
    setResumeError(null);
    setResumeExplode(true);
    window.setTimeout(() => setResumeExplode(false), 600);
    setShowAllExperience(false);
    setShowAllEducation(false);
    setResumePreviewOpen(true);
  };

  const handleResumeDownload = () => {
    if (!resumeUrl) {
      setResumeError('Currículo não encontrado.');
      return;
    }

    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleResumePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const degreeLabel: Record<string, string> = {
    ensino_fundamental: 'Ensino Fundamental',
    ensino_medio: 'Ensino Médio',
    tecnico: 'Técnico',
    graduacao: 'Graduação',
    pos_graduacao: 'Pós-graduação',
    mestrado: 'Mestrado',
    doutorado: 'Doutorado',
    mba: 'MBA',
  };

  const sortedExperiences = [...experiences].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateB - dateA;
  });

  const sortedEducation = [...education].sort((a, b) => {
    const yearA = Number(a.start_year) || 0;
    const yearB = Number(b.start_year) || 0;
    return yearB - yearA;
  });

  const formatSalary = (value?: number | null) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSearchOpen(false)} />
          <div className="absolute top-0 left-0 right-0 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
              <input 
                type="text"
                placeholder="Buscar vagas, empresas..."
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-[#F5F5F0] border border-[#E5E5DC] rounded-xl text-[#141042] placeholder-[#999] focus:outline-none focus:border-[#141042]"
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-[#E5E5DC] z-50 transition-transform duration-300 w-70 sm:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 sm:p-6 flex items-center">
          <div className="flex items-center justify-between w-full">
            <Link href="/candidate" className="flex items-center space-x-3">
              <UserAvatar size="md" />
              <div className="flex flex-col">
                <span className="text-[#1F4ED8] font-semibold text-base tracking-tight">TALENT</span>
                <span className="text-[#F97316] font-bold text-base tracking-wider">FORGE</span>
              </div>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-[#666666] hover:text-[#141042]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="p-3 sm:p-4 space-y-1">
          {[...navItems, ...moreItems].map((item) => {
            const isActive = pathname === item.href || (item.href !== '/candidate' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#141042] text-white' 
                    : 'text-[#666666] hover:bg-[#F5F5F0] hover:text-[#141042]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 sm:px-4 mt-2 space-y-2">
          <Link
            href="/candidate/jobs"
            className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[#666666] hover:bg-[#F5F5F0] hover:text-[#141042] transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium text-sm sm:text-base">Nova candidatura</span>
          </Link>
          <button
            onClick={handleResumeOpen}
            type="button"
            className="relative w-full rounded-2xl border border-[#E5E5DC] bg-white px-4 py-3 text-left text-sm font-medium text-[#141042] hover:border-[#141042]"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F5F0] text-[#141042]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p>Ver currículo</p>
                <p className="text-[11px] text-[#999]">
                  {resumeName || 'Abrir arquivo enviado'}
                </p>
              </div>
            </div>
            {resumeExplode && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="sidebar-explode-dot" />
                <span className="sidebar-explode-dot" />
                <span className="sidebar-explode-dot" />
                <span className="sidebar-explode-dot" />
                <span className="sidebar-explode-dot" />
                <span className="sidebar-explode-dot" />
              </span>
            )}
          </button>
          {resumeError && (
            <p className="mt-2 text-[11px] text-red-600">{resumeError}</p>
          )}
        </div>

        <div className="px-3 sm:px-4 mt-4">
          <div className="rounded-2xl border border-[#E5E5DC] bg-[#FAFAF8] p-4">
            <div className="flex items-center gap-2 text-[#141042]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Agenda do recrutador</p>
                <p className="text-[11px] text-[#999]">Em breve</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#666666]">
              Suas entrevistas aparecerão aqui quando o recrutador agendar.
            </p>
            <div className="mt-3 rounded-xl bg-white px-3 py-2">
              <p className="text-[11px] font-semibold text-[#141042]">Últimas entrevistas</p>
              <p className="text-[11px] text-[#999]">Sem entrevistas recentes.</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-4">
          <div className="mb-3 flex justify-center">
            <img
              src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
              alt="Talent Forge"
              className="h-16 w-auto opacity-50"
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[#666666] hover:bg-[#F5F5F0] hover:text-[#141042] transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm sm:text-base">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-[#E5E5DC]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 -ml-2 text-[#666666] hover:text-[#141042] hover:bg-[#F5F5F0] rounded-lg"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {/* Desktop Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                <input 
                  type="text"
                  placeholder="Buscar vagas..."
                  className="pl-10 pr-4 py-2 sm:py-2.5 bg-[#F5F5F0] border border-[#E5E5DC] rounded-xl text-sm text-[#141042] placeholder-[#999] focus:outline-none focus:border-[#141042] w-48 md:w-72"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Search Button */}
              <button 
                onClick={() => setSearchOpen(true)}
                className="sm:hidden p-2 text-[#666666] hover:text-[#141042] hover:bg-[#F5F5F0] rounded-lg"
              >
                <Search className="w-5 h-5" />
              </button>
              <button className="relative p-2 text-[#666666] hover:text-[#141042] hover:bg-[#F5F5F0] rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-[#E5E5DC]">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#D9D9C6] rounded-xl flex items-center justify-center text-[#453931] font-medium text-sm">
                  C
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#141042]">Candidato</p>
                  <p className="text-xs text-[#666666]">Desenvolvedor</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#666666] hidden sm:block" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5DC] z-40 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/candidate' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive ? 'text-[#141042]' : 'text-[#666666]'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#141042]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {resumePreviewOpen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setResumePreviewOpen(false)}
        >
          <div
            className="resume-print-area relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setResumePreviewOpen(false)}
              type="button"
              className="resume-print-hide absolute right-4 top-4 text-xs font-medium text-[#666666]"
            >
              Fechar
            </button>
            <div className="max-h-[80vh] overflow-y-auto pr-2 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#141042]">Currículo completo</h3>
                  <p className="text-xs text-[#999]">Visão consolidada pelo headhunter.</p>
                </div>
                <span className="rounded-full bg-[#F5F5F0] px-3 py-1 text-[11px] font-semibold text-[#141042]">
                  Atualizado automaticamente
                </span>
              </div>

              <div className="rounded-3xl border border-[#E5E5DC] bg-[#FAFAF8] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#141042]">{profile?.full_name || 'Candidato'}</p>
                    <p className="text-xs text-[#666666]">
                      {profile?.current_title || 'Cargo não informado'} · {profile?.area_of_expertise || 'Área não informada'}
                    </p>
                    <p className="mt-2 text-xs text-[#666666]">
                      {profile?.city || 'Cidade não informada'}{profile?.state ? `, ${profile.state}` : ''} · {profile?.seniority_level || 'Senioridade não informada'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-[11px] text-[#999]">Pretensão</p>
                    <p className="text-sm font-semibold text-[#141042]">{formatSalary(profile?.salary_expectation)}</p>
                    <p className="text-[11px] text-[#999]">Regime: {profile?.employment_type?.join(', ') || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
                  <h4 className="text-sm font-semibold text-[#141042]">Contato</h4>
                  <div className="mt-3 space-y-2 text-xs text-[#666666]">
                    <p>Email: {profile?.email || 'Não informado'}</p>
                    <p>Telefone: {profile?.phone || 'Não informado'}</p>
                    <p>Local: {profile?.city || 'Cidade não informada'}{profile?.state ? `, ${profile.state}` : ''}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
                  <h4 className="text-sm font-semibold text-[#141042]">Resumo profissional</h4>
                  <p className="mt-3 text-xs text-[#666666]">
                    Profissional com foco em {profile?.area_of_expertise || 'sua área principal'} e experiência em
                    {profile?.current_title ? ` ${profile.current_title}` : ' posições relevantes'}. Perfil
                    {profile?.seniority_level ? ` ${profile.seniority_level}` : ' alinhado'} para projetos que exigem
                    execução consistente e melhoria contínua.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
                  <h4 className="text-sm font-semibold text-[#141042]">Diferenciais</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile?.area_of_expertise ? [profile.area_of_expertise] : ['Foco em resultados']).map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded-full bg-[#F5F5F0] px-3 py-1 text-[11px] font-semibold text-[#141042]"
                      >
                        {item}
                      </span>
                    ))}
                    {profile?.seniority_level && (
                      <span className="rounded-full bg-[#F5F5F0] px-3 py-1 text-[11px] font-semibold text-[#141042]">
                        Senioridade {profile.seniority_level}
                      </span>
                    )}
                    {profile?.current_title && (
                      <span className="rounded-full bg-[#F5F5F0] px-3 py-1 text-[11px] font-semibold text-[#141042]">
                        {profile.current_title}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
                  <h4 className="text-sm font-semibold text-[#141042]">Competências sugeridas</h4>
                  <p className="mt-3 text-xs text-[#666666]">
                    Forte aderência a projetos que exigem {profile?.area_of_expertise || 'especialização técnica'},
                    visão analítica e execução consistente. Perfil indicado para times que valorizam colaboração,
                    evolução contínua e entrega previsível.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#141042]">Experiências recentes</h4>
                  {experiences.length === 0 && (
                    <p className="text-xs text-[#999]">Nenhuma experiência cadastrada.</p>
                  )}
                  {experiences.length > 0 && (
                    <p className="text-[11px] text-[#999]">
                      Mostrando {showAllExperience ? sortedExperiences.length : Math.min(3, sortedExperiences.length)} de {sortedExperiences.length}
                    </p>
                  )}
                  <div className="mt-2 space-y-3">
                    {(showAllExperience ? sortedExperiences : sortedExperiences.slice(0, 3)).map((item, index) => (
                      <div key={`${item.company_name}-${index}`} className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-[#141042]">{item.job_title}</p>
                          <span className="rounded-full bg-[#F5F5F0] px-2 py-1 text-[10px] font-semibold text-[#141042]">
                            {formatDate(item.start_date)} — {item.is_current ? 'Atual' : formatDate(item.end_date)}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666]">{item.company_name}</p>
                        {item.description && (
                          <p className="mt-2 text-xs text-[#666666]">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {experiences.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllExperience((prev) => !prev)}
                      className="mt-3 text-xs font-semibold text-[#141042] hover:underline"
                    >
                      {showAllExperience ? 'Mostrar menos experiências' : 'Ver todas as experiências'}
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#141042]">Formação</h4>
                  {education.length === 0 && (
                    <p className="text-xs text-[#999]">Nenhuma formação cadastrada.</p>
                  )}
                  {education.length > 0 && (
                    <p className="text-[11px] text-[#999]">
                      Mostrando {showAllEducation ? sortedEducation.length : Math.min(3, sortedEducation.length)} de {sortedEducation.length}
                    </p>
                  )}
                  <div className="mt-2 space-y-3">
                    {(showAllEducation ? sortedEducation : sortedEducation.slice(0, 3)).map((item, index) => (
                      <div key={`${item.course_name}-${index}`} className="rounded-2xl border border-[#E5E5DC] bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-[#141042]">{item.course_name}</p>
                          <span className="rounded-full bg-[#F5F5F0] px-2 py-1 text-[10px] font-semibold text-[#141042]">
                            {item.start_year || '—'} — {item.is_current ? 'Atual' : item.end_year || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666]">{item.institution}</p>
                        <p className="text-[11px] text-[#999]">{degreeLabel[item.degree_level] || item.degree_level}</p>
                      </div>
                    ))}
                  </div>
                  {education.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllEducation((prev) => !prev)}
                      className="mt-3 text-xs font-semibold text-[#141042] hover:underline"
                    >
                      {showAllEducation ? 'Mostrar menos formações' : 'Ver toda a formação acadêmica'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleResumeDownload}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#141042] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f1a66]"
                >
                  Abrir arquivo enviado
                </button>
                <button
                  onClick={handleResumePrint}
                  type="button"
                  className="resume-print-hide inline-flex items-center gap-2 rounded-xl border border-[#E5E5DC] bg-white px-4 py-2 text-sm font-medium text-[#141042] hover:border-[#141042] hover:bg-[#F5F5F0]"
                >
                  Exportar PDF
                </button>
                <button
                  onClick={() => setResumePreviewOpen(false)}
                  type="button"
                  className="resume-print-hide inline-flex items-center gap-2 rounded-xl border border-[#E5E5DC] px-4 py-2 text-sm font-medium text-[#666666]"
                >
                  Fechar resumo
                </button>
              </div>
            </div>
            <div className="absolute bottom-4 right-4">
              <img
                src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
                alt="Talent Forge"
                className="h-16 w-auto opacity-70"
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .resume-print-area,
          .resume-print-area * {
            visibility: visible !important;
          }

          .resume-print-area {
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }

          .resume-print-hide {
            display: none !important;
          }

          .resume-print-area .rounded-2xl,
          .resume-print-area .rounded-3xl,
          .resume-print-area .grid,
          .resume-print-area .flex {
            page-break-inside: avoid;
          }
        }

        .sidebar-explode-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #f97316;
          animation: sidebar-explode-1 0.6s ease-out forwards;
        }

        .sidebar-explode-dot:nth-child(2) { background: #1f4ed8; animation-name: sidebar-explode-2; }
        .sidebar-explode-dot:nth-child(3) { background: #141042; animation-name: sidebar-explode-3; }
        .sidebar-explode-dot:nth-child(4) { background: #f97316; animation-name: sidebar-explode-4; }
        .sidebar-explode-dot:nth-child(5) { background: #1f4ed8; animation-name: sidebar-explode-5; }
        .sidebar-explode-dot:nth-child(6) { background: #141042; animation-name: sidebar-explode-6; }

        @keyframes sidebar-explode-1 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(16px, -12px) scale(0.2); }
        }

        @keyframes sidebar-explode-2 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-16px, -10px) scale(0.2); }
        }

        @keyframes sidebar-explode-3 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(14px, 12px) scale(0.2); }
        }

        @keyframes sidebar-explode-4 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(-14px, 12px) scale(0.2); }
        }

        @keyframes sidebar-explode-5 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(0, -18px) scale(0.2); }
        }

        @keyframes sidebar-explode-6 {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(0, 18px) scale(0.2); }
        }
      `}</style>
    </div>
  );
}
