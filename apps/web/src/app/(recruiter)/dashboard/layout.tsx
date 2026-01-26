'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useOrgStore } from '@/lib/store';
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
  HelpCircle
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Vagas', icon: Briefcase },
  { href: '/dashboard/candidates', label: 'Candidatos', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: UserCheck },
  { href: '/dashboard/reports', label: 'Relatórios', icon: FileBarChart },
  { href: '/dashboard/invite', label: 'Convidar', icon: UserPlus },
];

const moreItems = [
  { href: '/dashboard/team', label: 'Equipe', icon: Building2 },
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
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.full_name && !ignore) {
        setUserName(profile.full_name);
      }

      const { data: membership } = await supabase
        .from('org_members')
        .select('organizations(name)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      const org = Array.isArray(membership?.organizations)
        ? membership.organizations[0]?.name
        : (membership as any)?.organizations?.name;

      if (org && !ignore) {
        setOrgName(org);
      }

      const { data: memberships } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(id, name, org_type, slug)')
        .eq('user_id', userId);

      const orgs = (memberships || [])
        .map((member: any) => {
          const org = Array.isArray(member.organizations)
            ? member.organizations[0]
            : member.organizations;

          if (!org) return null;

          return {
            id: org.id,
            name: org.name,
            orgType: org.org_type,
            slug: org.slug,
            role: member.role,
          };
        })
        .filter(Boolean);

      if (!ignore && orgs.length > 0) {
        setOrganizations(orgs as any);
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
    <div className="grid min-h-screen bg-white grid-cols-[256px_minmax(0,1fr)]">
      {/* Sidebar - Sempre visível */}
      <aside className="sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col">
        {/* Logo & Brand */}
        <div className="h-16 px-5 flex items-center border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-tf-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="text-tf-primary font-semibold text-sm tracking-tight">TALENT</span>
              <span className="text-tf-accent font-bold text-sm tracking-wide">FORGE</span>
            </div>
          </Link>
        </div>

        {/* Org Selector */}
        <div className="px-3 py-3 border-b border-border">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="truncate text-gray-700">
                {currentOrg?.name || orgName}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {orgDropdownOpen && organizations.length > 0 && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-sm">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setCurrentOrg(org);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${currentOrg?.id === org.id ? 'bg-gray-50' : ''}`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Menu Principal
            </span>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-tf-accent-subtle text-tf-accent border border-(--tf-accent)/10' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-tf-accent' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-(--divider)">
            <span className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Configurações
            </span>
          </div>
          {moreItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-tf-accent-subtle text-tf-accent border border-(--tf-accent)/10' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-tf-accent' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Action Button */}
        <div className="px-3 py-3 border-t border-(--divider)">
          <Link 
            href="/dashboard/jobs/new"
            className="
              flex items-center justify-center gap-2 w-full px-4 py-2.5
              bg-tf-primary hover:bg-tf-primary-hover
              text-white text-sm font-medium rounded-lg
              transition-all duration-200 shadow-sm hover:shadow-md
            "
          >
            <Plus className="w-4 h-4" />
            <span>Nova Vaga</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-border bg-gray-50">
          <div className="flex items-center justify-center pb-3">
            <img
              src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
              alt="Fartech"
              className="h-16 w-auto opacity-80"
              loading="lazy"
            />
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-foreground-muted truncate">{currentOrg?.name || orgName}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
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
        <header className="sticky top-0 z-30 bg-white border-b border-border shadow-(--shadow-xs)">
          <div className="flex items-center justify-between h-16 pl-0 pr-6">
            {/* Search Bar */}
            <div className="flex items-center pl-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar candidatos, vagas..."
                  className="
                    w-72 pl-9 pr-4 py-2 text-sm
                    bg-gray-50 border border-transparent rounded-lg
                    placeholder:text-gray-400
                    focus:outline-none focus:bg-white focus:border-border focus:ring-2 focus:ring-(--tf-accent)/10
                    transition-all duration-200
                  "
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-white px-1.5 text-[10px] font-medium text-gray-400">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <NotificationCenter />
              
              <div className="h-6 w-px bg-border mx-2" />
              
              <button className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
