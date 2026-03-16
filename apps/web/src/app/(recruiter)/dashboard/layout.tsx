'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore, Organization } from '@/lib/store';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  FileBarChart,
  UserPlus,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Search,
  HelpCircle,
  Activity,
  ClipboardCheck,
  BarChart3,
  CalendarDays,
  Menu,
  X,
  Globe,
  Lock,
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { OnboardingManualModal } from '@/components/onboarding/OnboardingManualModal';
import { AgendaModal } from '@/components/calendar/AgendaModal';

// Itens de Recrutamento
const recruitmentItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Vagas', icon: Briefcase },
  { href: '/dashboard/candidates', label: 'Candidatos', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: UserCheck },
  { href: '/dashboard/reports', label: 'Relatórios', icon: FileBarChart },
];

// Itens de Avaliação (Módulo PHP/TFCI)
const assessmentItems = [
  { href: '/php/tfci/cycles', label: 'Ciclos de Avaliação', icon: Activity },
  { href: '/php/tfci/assessments', label: 'Assessments', icon: ClipboardCheck },
  { href: '/php/tfci/results', label: 'Resultados', icon: BarChart3 },
];

// Itens de Configurações
const settingsItems = [
  { href: '/dashboard/companies', label: 'Minhas Empresas', icon: Building2 },
  { href: '/dashboard/invite', label: 'Convidar Usuário', icon: UserPlus },
  { href: '/dashboard/team', label: 'Equipe', icon: Users },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentOrg, organizations, setCurrentOrg, setOrganizations } = useOrgStore();
  const [userName, setUserName] = useState<string>('Recrutador');
  const [orgName, setOrgName] = useState<string>('Organizacao');

  // Separa org própria (recrutador) das orgs cliente
  const ownOrg = useMemo(() => organizations.find(o => !o.parentOrgId) || null, [organizations]);
  const clientOrgs = useMemo(() => organizations.filter(o => !!o.parentOrgId), [organizations]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [recruitmentActive, setRecruitmentActive] = useState<boolean | null>(null);

  // Fecha drawer ao navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let ignore = false;

    async function loadUserInfo() {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('[RecruiterLayout] Erro auth.getUser:', authError);
          return;
        }
        
        const userId = userData?.user?.id;
        if (!userId) {
          console.warn('[RecruiterLayout] Nenhum userId encontrado');
          return;
        }
        

        // Carregar perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('[RecruiterLayout] Erro ao carregar profile:', profileError);
        }

        if (profile?.full_name && !ignore) {
          setUserName(profile.full_name);
        }

        // Carregar memberships do usuário
        const { data: memberships, error: membershipsError } = await supabase
          .from('org_members')
          .select('org_id, role, organizations(id, name, org_type, slug, parent_org_id)')
          .eq('user_id', userId);

        if (membershipsError) {
          console.error('[RecruiterLayout] Erro ao carregar memberships:', membershipsError);
          return;
        }


        const orgs: Organization[] = (memberships || [])
          .flatMap((member) => {
            const org = Array.isArray(member.organizations)
              ? member.organizations[0]
              : member.organizations;

            if (!org) {
              console.warn('[RecruiterLayout] Membership sem org:', member);
              return [];
            }

            return [{
              id: org.id as string,
              name: org.name as string,
              orgType: org.org_type as string,
              slug: org.slug as string,
              role: member.role as string,
              parentOrgId: (org.parent_org_id as string | null) ?? null,
            }];
          });


        if (!ignore && orgs.length > 0) {
          setOrganizations(orgs);

          // Definir primeira org como nome padrão
          if (orgs[0]) {
            setOrgName(orgs[0].name);
          }

          // Sempre sincroniza currentOrg com dados frescos do banco
          // (garante que parentOrgId esteja populado mesmo após migração)
          const own = orgs.find(o => !o.parentOrgId) ?? orgs[0];
          if (!ignore) {
            if (!currentOrg || currentOrg.parentOrgId === undefined) {
              // Primeira carga ou dados antigos sem parentOrgId → default para org própria
              setCurrentOrg(own);
            } else {
              // Atualiza currentOrg com dados frescos (mantém seleção do usuário)
              const refreshed = orgs.find(o => o.id === currentOrg.id);
              if (refreshed) setCurrentOrg(refreshed);
              else setCurrentOrg(own);
            }
          }
        } else if (orgs.length === 0) {
          console.warn('[RecruiterLayout] Nenhuma organização encontrada para o usuário');
        }
      } catch (error) {
        console.error('[RecruiterLayout] Erro geral em loadUserInfo:', error);
      }
    }

    loadUserInfo();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  // Verificar ativação do módulo de Recrutamento — sempre pela org própria (FARTECH)
  // Não usa currentOrg porque ele pode ser uma empresa cliente sem registro de ativação
  useEffect(() => {
    const orgIdToCheck = ownOrg?.id;
    if (!orgIdToCheck) return;

    async function checkRecruitmentModule() {
      const { data } = await supabase
        .from('recruitment_module_activations')
        .select('is_active')
        .eq('org_id', orgIdToCheck)
        .maybeSingle();

      // Se não houver registro, considera inativo
      setRecruitmentActive(data?.is_active ?? false);
    }

    checkRecruitmentModule();
  }, [ownOrg?.id, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Corpo da sidebar (reutilizado desktop + drawer mobile)
  const sidebarBody = (
    <>
      {/* Org Selector — mostra empresas cliente; org própria é o contexto base */}
      <div className="px-3 py-3 border-b border-white/10 shrink-0">
        <p className="px-1 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Filtrar empresa cliente</p>
        <button
          onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-white/40 shrink-0" />
            <span className="truncate text-white/75">
              {currentOrg && currentOrg.id !== ownOrg?.id
                ? currentOrg.name
                : 'Todas as empresas'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-white/40 shrink-0 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {orgDropdownOpen && (
          <div className="mt-2 rounded-lg border border-white/10 bg-white/10 max-h-48 overflow-y-auto">
            {organizations.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/50">Carregando empresas...</div>
            ) : (
              <>
                {/* Opção base: volta para a org própria (sem filtro de cliente) */}
                {ownOrg && (
                  <button
                    onClick={() => { setCurrentOrg(ownOrg); setOrgDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors ${(!currentOrg || currentOrg.id === ownOrg.id) ? 'bg-white/15 text-white font-medium' : ''}`}
                  >
                    Todas as empresas
                  </button>
                )}
                {/* Empresas cliente */}
                {clientOrgs.map((org: Organization) => (
                  <button
                    key={org.id}
                    onClick={() => { setCurrentOrg(org); setOrgDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors ${currentOrg?.id === org.id ? 'bg-white/15 text-white font-medium' : ''}`}
                  >
                    {org.name}
                  </button>
                ))}
                {clientOrgs.length === 0 && (
                  <div className="px-3 py-2 text-xs text-white/40">Nenhuma empresa cliente vinculada</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Agenda */}
        <button
          onClick={() => setAgendaOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200 mb-3"
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span>Agenda</span>
        </button>

        {/* Seção: Recrutamento */}
        <div className="mb-2">
          <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">Recrutamento</span>
        </div>
        {recruitmentItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Minha Página de Carreiras */}
        {currentOrg?.slug ? (
          <a
            href={`/jobs/${currentOrg.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Minha Página</span>
          </a>
        ) : (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-white/35 hover:bg-white/10 hover:text-white/60"
            title="Configure sua página em Configurações"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Minha Página</span>
          </Link>
        )}

        {/* Seção: Avaliação */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">Avaliação de Pessoas</span>
        </div>
        {assessmentItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#8B5CF6]/25 text-purple-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Seção: Configurações */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">Configurações</span>
        </div>
        {settingsItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Manual da Plataforma */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Manual da Plataforma</span>
          </button>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-center pb-3">
          <img
            src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
            alt="Fartech"
            className="h-14 w-auto opacity-50"
            loading="lazy"
          />
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{userName}</p>
            <p className="text-xs text-white/40 truncate">{currentOrg?.name || orgName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-[#FAFAF8] via-[#F5F4FB] to-[#FAFAF8]">

      {/* ── Barra de topo mobile ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#141042] flex items-center gap-3 px-4 shadow-lg">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-white/70 hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs">TF</span>
          </div>
          <div className="flex flex-col -space-y-0.5">
            <span className="text-white font-semibold text-xs tracking-tight">TALENT</span>
            <span className="text-[#F97316] font-bold text-xs tracking-wide">FORGE</span>
          </div>
        </Link>
        {(currentOrg?.name || orgName) && (
          <span className="ml-auto text-xs text-white/50 truncate max-w-36">
            {currentOrg?.name || orgName}
          </span>
        )}
      </div>

      {/* ── Drawer sidebar mobile ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 bg-[#141042] flex flex-col shadow-2xl overflow-y-auto">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-white font-semibold text-sm tracking-tight">TALENT</span>
                  <span className="text-[#F97316] font-bold text-sm tracking-wide">FORGE</span>
                </div>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* ── Layout desktop ── */}
      <div className="md:grid md:grid-cols-[256px_minmax(0,1fr)] min-h-screen">

        {/* Sidebar desktop */}
        <aside className="hidden md:flex sticky top-0 h-screen bg-[#141042] flex-col shadow-[4px_0_24px_rgba(20,16,66,0.15)] overflow-y-auto">
          <div className="h-16 px-5 flex items-center border-b border-white/10 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TF</span>
              </div>
              <div className="flex flex-col -space-y-0.5">
                <span className="text-white font-semibold text-sm tracking-tight">TALENT</span>
                <span className="text-[#F97316] font-bold text-sm tracking-wide">FORGE</span>
              </div>
            </Link>
          </div>
          {sidebarBody}
        </aside>

        {/* Conteúdo principal */}
        <div className="flex min-h-screen flex-col">
          {/* Header desktop */}
          <header className="hidden md:flex sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#E5E5DC]">
            <div className="flex items-center justify-between h-16 w-full pl-0 pr-6">
              <div className="flex items-center pl-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Buscar candidatos, vagas..."
                    className="w-72 pl-9 pr-4 py-2 text-sm bg-[#FAFAF8] border border-transparent rounded-lg placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#E5E5DC] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all duration-200"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-[#E5E5DC] bg-white px-1.5 text-[10px] font-medium text-[#94A3B8]">
                    ⌘K
                  </kbd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setManualOpen(true)}
                  title="Manual da Plataforma"
                  className="p-2 text-[#94A3B8] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <NotificationCenter />
                <div className="h-6 w-px bg-[#E5E5DC] mx-2" />
                <button className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-[#FAFAF8] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#141042]/10 flex items-center justify-center text-[#141042] font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-[#141042]">{userName}</p>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pt-18 md:pt-6 md:px-5 md:py-6">
            {recruitmentActive === false ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-[#141042]/8 flex items-center justify-center mb-5">
                  <Lock className="w-8 h-8 text-[#141042]/40" />
                </div>
                <h2 className="text-xl font-semibold text-[#141042] mb-2">Módulo de Recrutamento inativo</h2>
                <p className="text-sm text-[#64748B] max-w-sm">
                  O módulo de Recrutamento não está ativo para esta organização. Entre em contato com a Fartech para ativar.
                </p>
              </div>
            ) : (
              children
            )}
          </main>
        </div>

      </div>

      {agendaOpen && <AgendaModal onClose={() => setAgendaOpen(false)} />}
      <OnboardingManualModal isOpen={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}
