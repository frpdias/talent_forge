'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import {
  LayoutDashboard,
  Users,
  Activity,
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
  Menu,
  X,
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
  const ownOrg = useMemo(() => organizations.find(o => !o.parentOrgId) || null, [organizations]);
  const clientOrgs = useMemo(() => organizations.filter(o => !!o.parentOrgId), [organizations]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha drawer ao navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);

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

  // Inicializa phpContextOrg com a org própria (FARTECH) ao entrar no módulo
  useEffect(() => {
    if (!phpContextOrgId && ownOrg?.id) {
      setPhpContextOrg(ownOrg.id, ownOrg.name);
    }
  }, [phpContextOrgId, ownOrg, setPhpContextOrg]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Corpo da sidebar (reutilizado no desktop e no drawer mobile)
  const sidebarBody = (
    <>
      {/* Module Header */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 px-1">
          <HeartPulse className="w-4 h-4 text-[#F97316]" />
          <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">PHP Module</span>
          <ModuleStatusBadge />
        </div>
      </div>

      {/* Company Context — filtra apenas empresas cliente */}
      <div className="px-3 py-3 border-b border-white/10 shrink-0">
        <p className="px-1 mb-1.5 text-[10px] font-semibold text-[#F97316]/50 uppercase tracking-wider">Empresa cliente</p>
        <button
          onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            phpContextOrgId && phpContextOrgId !== ownOrg?.id
              ? 'bg-[#F97316]/10 border border-[#F97316]/20 hover:bg-[#F97316]/15'
              : 'border border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className={`h-4 w-4 shrink-0 ${phpContextOrgId && phpContextOrgId !== ownOrg?.id ? 'text-[#F97316]' : 'text-white/40'}`} />
            <p className="truncate text-sm font-medium text-white/75">
              {phpContextOrgId && phpContextOrgId !== ownOrg?.id
                ? phpContextOrgName
                : 'Todas as empresas'}
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform text-white/40 ${orgDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {orgDropdownOpen && (
          <div className="mt-2 rounded-lg border border-white/10 bg-white/10 max-h-40 overflow-y-auto">
            {/* Opção base: volta para org própria */}
            {ownOrg && (
              <button
                onClick={() => {
                  setCurrentOrg(ownOrg);
                  setPhpContextOrg(ownOrg.id, ownOrg.name);
                  setOrgDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors ${(!phpContextOrgId || phpContextOrgId === ownOrg.id) ? 'bg-white/15 text-white font-medium' : ''}`}
              >
                Todas as empresas
              </button>
            )}
            {/* Empresas cliente */}
            {clientOrgs.map((org) => (
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
            {clientOrgs.length === 0 && (
              <p className="px-3 py-2 text-xs text-white/40">Nenhuma empresa cliente vinculada.</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-[#F97316]" />
          <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">PHP Module</span>
        </div>
        {(phpContextOrgName || currentOrg?.name) && (
          <span className="ml-auto text-xs text-white/50 truncate max-w-35">
            {phpContextOrgName || currentOrg?.name}
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
            {/* Logo + fechar */}
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
        <main className="min-h-screen px-4 py-4 pt-18 md:pt-6 md:px-6 md:py-6">
          {children}
        </main>

      </div>
    </div>
  );
}
