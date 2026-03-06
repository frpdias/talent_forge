'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useOrgStore } from '@/lib/store';
import { usePhpModule } from '@/lib/hooks/usePhpModule';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  HeartPulse,
  Building,
  UserCog,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

// Menu principal de Recrutamento
const recruitmentNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vagas', href: '/jobs', icon: Briefcase },
  { name: 'Candidatos', href: '/candidates', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: ClipboardList },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

// Menu do Módulo PHP (Pessoas & Cultura)
const phpNavigation = [
  { name: 'Ciclos TF-CI', href: '/php/tfci/cycles', icon: Activity },
  { name: 'NR-1', href: '/php/nr1', icon: ClipboardList },
  { name: 'CO-PC', href: '/php/copc', icon: Users },
  { name: 'Dashboard PHP', href: '/php/dashboard', icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const { currentOrg, organizations, setCurrentOrg } = useOrgStore();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const { isActive: phpModuleActive, loading: phpLoading } = usePhpModule();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-[#141042] text-white flex flex-col shadow-[4px_0_24px_rgba(20,16,66,0.15)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center font-bold text-sm border border-white/20">
            TF
          </div>
          <span className="text-lg font-semibold tracking-tight">TalentForge</span>
        </Link>
      </div>

      {/* Org Selector */}
      <div className="px-4 py-3 border-b border-white/10">
        <button
          onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-white/50" />
            <span className="text-sm truncate text-white/80">{currentOrg?.name || 'Selecionar Org'}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-white/50 transition-transform', orgDropdownOpen && 'rotate-180')} />
        </button>
        {orgDropdownOpen && organizations.length > 0 && (
          <div className="mt-1 py-1 bg-white/10 rounded-lg border border-white/10">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setCurrentOrg(org);
                  setOrgDropdownOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-white/10 text-white/80',
                  currentOrg?.id === org.id && 'bg-white/15 text-white'
                )}
              >
                {org.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Seção Recrutamento */}
        <div className="mb-6">
          <h3 className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
            Recrutamento
          </h3>
          <div className="space-y-0.5">
            {recruitmentNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'text-white/65 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Seção Módulo PHP - Pessoas & Cultura */}
        {phpModuleActive && (
          <div className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-orange-300/80 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Pessoas & Cultura
            </h3>
            <div className="space-y-0.5">
              {phpNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-orange-500/30 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]'
                        : 'text-white/65 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Link para ativar módulo PHP se não estiver ativo */}
        {!phpModuleActive && !phpLoading && (
          <div className="mb-6">
            <Link
              href="/php/activation"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-orange-300/80 hover:bg-white/10 transition-colors border border-dashed border-orange-400/30"
            >
              <HeartPulse className="h-5 w-5" />
              Ativar Módulo PHP
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-medium border border-white/20">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white/90">{user?.email}</p>
            <p className="text-xs text-white/40 truncate">{currentOrg?.orgType === 'headhunter' ? 'Headhunter' : 'Empresa'}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
