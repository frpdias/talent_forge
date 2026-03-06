'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  Activity,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  HeartPulse,
  ArrowLeft,
  Bot,
  ShieldAlert,
  ListChecks,
  UserCog,
} from 'lucide-react';
import ModuleStatusBadge from './_components/ModuleStatusBadge';

const phpNavItems = [
  { href: '/php/dashboard', label: 'Dashboard PHP', icon: LayoutDashboard },
  { href: '/php/tfci/cycles', label: 'Ciclos TFCI', icon: Activity },
  { href: '/php/nr1', label: 'NR-1 Psicossocial', icon: ShieldAlert },
  { href: '/php/copc', label: 'COPC Performance', icon: BarChart3 },
  { href: '/php/teams', label: 'Times', icon: Users },
  { href: '/php/employees', label: 'Funcionários', icon: UserCog },
  { href: '/php/action-plans', label: 'Planos de Ação', icon: ListChecks },
  { href: '/php/ai-chat', label: 'AI Assistant', icon: Bot },
];

const phpSettingsItems = [
  { href: '/php/settings', label: 'Configurações', icon: Settings },
];

export default function PhpLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentOrg, organizations, setCurrentOrg, phpContextOrgId, phpContextOrgName, setPhpContextOrg } = useOrgStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || '');

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.full_name) setUserName(profile.full_name);
        setIsAdmin(profile?.email === 'contato.fartech@app.br');
      }
    }

    checkUser();
  }, []);

  // Sincroniza phpContextOrg se currentOrg existe mas phpContextOrgId está null
  useEffect(() => {
    if (!phpContextOrgId && currentOrg?.id) {
      setPhpContextOrg(currentOrg.id, currentOrg.name);
    }
  }, [phpContextOrgId, currentOrg, setPhpContextOrg]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="grid min-h-screen bg-linear-to-br from-[#FAFAF8] via-[#F5F4FB] to-[#FAFAF8] grid-cols-[256px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen bg-[#141042] flex flex-col shadow-[4px_0_24px_rgba(20,16,66,0.15)] overflow-y-auto">
        {/* Logo */}
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

        {/* Module Header */}
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <HeartPulse className="w-4 h-4 text-[#F97316]" />
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">PHP Module</span>
            <ModuleStatusBadge />
          </div>
        </div>

        {/* Company Context — sempre permite trocar via dropdown */}
        <div className="px-3 py-3 border-b border-white/10 shrink-0">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              phpContextOrgId
                ? 'bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/15'
                : 'border border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className={`h-4 w-4 shrink-0 ${phpContextOrgId ? 'text-[#F97316]' : 'text-white/40'}`} />
              <div className="flex-1 min-w-0 text-left">
                {phpContextOrgId && (
                  <p className="text-[10px] text-[#F97316]/70 uppercase tracking-wider font-semibold">Empresa</p>
                )}
                <p className={`truncate font-medium ${phpContextOrgId ? 'text-sm text-white/90' : 'text-sm text-white/75'}`}>
                  {phpContextOrgName || currentOrg?.name || 'Selecionar empresa'}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${phpContextOrgId ? 'text-[#F97316]/50' : 'text-white/40'} ${orgDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {orgDropdownOpen && (
            <div className="mt-2 rounded-lg border border-white/10 bg-white/10 max-h-40 overflow-y-auto">
              {organizations.length === 0 && (
                <p className="px-3 py-2 text-xs text-white/40">Nenhuma empresa disponível. Volte ao Dashboard para carregar.</p>
              )}
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setCurrentOrg(org);
                    setPhpContextOrg(org.id, org.name);
                    setOrgDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors ${phpContextOrgId === org.id ? 'bg-white/15 text-white font-medium' : ''}`}
                >
                  {org.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {/* Back to recruiter */}
          <Link
            href={phpContextOrgId ? `/dashboard/companies/${phpContextOrgId}` : '/dashboard'}
            onClick={() => setPhpContextOrg(null)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/40 hover:bg-white/10 hover:text-white/70 transition-all duration-200 mb-3"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{phpContextOrgId ? 'Voltar à Empresa' : 'Voltar ao Dashboard'}</span>
          </Link>

          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold text-[#F97316]/60 uppercase tracking-wider">
              People & Health
            </span>
          </div>

          {phpNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/php/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F97316]/20 text-[#F97316] shadow-[inset_0_1px_0_rgba(249,115,22,0.15)]'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/10">
            <span className="px-3 text-[10px] font-semibold text-white/35 uppercase tracking-wider">
              Configurações
            </span>
          </div>

          {isAdmin && (
            <Link
              href="/php/activation"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname.startsWith('/php/activation')
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Ativação</span>
            </Link>
          )}

          {phpSettingsItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {(userName || userEmail).charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{userName || userEmail}</p>
              <p className="text-xs text-white/40 truncate">{phpContextOrgName || currentOrg?.name || 'PHP Module'}</p>
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
      <main className="flex-1 min-h-screen px-6 py-6">
        {children}
      </main>
    </div>
  );
}
