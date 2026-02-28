'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
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
  Plus,
  ChevronDown,
  Building2,
  Search,
  HelpCircle,
  Activity,
  ClipboardCheck,
  BarChart3
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

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
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

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
        
        console.log('[RecruiterLayout] userId:', userId);

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
          .select('org_id, role, organizations(id, name, org_type, slug)')
          .eq('user_id', userId);

        if (membershipsError) {
          console.error('[RecruiterLayout] Erro ao carregar memberships:', membershipsError);
          return;
        }

        console.log('[RecruiterLayout] memberships raw:', memberships);

        const orgs = (memberships || [])
          .map((member: any) => {
            const org = Array.isArray(member.organizations)
              ? member.organizations[0]
              : member.organizations;

            if (!org) {
              console.warn('[RecruiterLayout] Membership sem org:', member);
              return null;
            }

            return {
              id: org.id,
              name: org.name,
              orgType: org.org_type,
              slug: org.slug,
              role: member.role,
            };
          })
          .filter(Boolean);

        console.log('[RecruiterLayout] orgs processadas:', orgs);

        if (!ignore && orgs.length > 0) {
          setOrganizations(orgs as any);
          
          // Definir primeira org como nome padrão
          if (orgs[0]) {
            setOrgName((orgs[0] as any).name);
          }
          
          if (!currentOrg) {
            let preferredOrg = orgs[0] as any;

            try {
              const counts = await Promise.all(
                (orgs as any[]).map(async (org) => {
                  const { count } = await supabase
                    .from('jobs')
                    .select('id', { count: 'exact', head: true })
                    .eq('org_id', org.id);

                  return { org, count: count ?? 0 };
                })
              );

              const best = counts.reduce((acc, item) =>
                item.count > acc.count ? item : acc
              );

              preferredOrg = best.org;
            } catch (error) {
              console.warn('[RecruiterLayout] Falha ao escolher org padrão:', error);
            }

            if (!ignore) {
              setCurrentOrg(preferredOrg);
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="grid min-h-screen bg-linear-to-br from-[#FAFAF8] via-[#F5F4FB] to-[#FAFAF8] grid-cols-[256px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen bg-[#141042] flex flex-col shadow-[4px_0_24px_rgba(20,16,66,0.15)]">
        {/* Logo & Brand */}
        <div className="h-16 px-5 flex items-center border-b border-white/10">
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

        {/* Org Selector */}
        <div className="px-3 py-3 border-b border-white/10">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-white/40" />
              <span className="truncate text-white/75">
                {currentOrg?.name || orgName || 'Selecionar empresa'}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {orgDropdownOpen && (
            <div className="mt-2 rounded-lg border border-white/10 bg-white/10 max-h-48 overflow-y-auto">
              {organizations.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/50">
                  Carregando empresas...
                </div>
              ) : (
                organizations.map((org: Organization) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrg(org);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors ${currentOrg?.id === org.id ? 'bg-white/15 text-white font-medium' : ''}`}
                  >
                    {org.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Seção: Recrutamento */}
          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">
              Recrutamento
            </span>
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

          {/* Seção: Avaliação */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">
              Avaliação de Pessoas
            </span>
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
            <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">
              Configurações
            </span>
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
        </nav>

        {/* Quick Action Button */}
        <div className="px-3 py-3 border-t border-white/10">
          <Link
            href="/dashboard/jobs/new"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white/15 hover:bg-white/20 border border-white/20 text-white text-sm font-medium rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Vaga</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-center pb-3">
            <img
              src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
              alt="Fartech"
              className="h-14 w-auto opacity-50"
              loading="lazy"
            />
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white font-semibold text-sm">
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
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#E5E5DC]">
          <div className="flex items-center justify-between h-16 pl-0 pr-6">
            {/* Search Bar */}
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

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-[#94A3B8] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <NotificationCenter />

              <div className="h-6 w-px bg-[#E5E5DC] mx-2" />

              <button className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-[#FAFAF8] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#141042]/10 flex items-center justify-center text-[#141042] font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#141042]">{userName}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 px-5 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
