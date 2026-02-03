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
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            TF
          </div>
          <span className="text-lg font-semibold">TalentForge</span>
        </Link>
      </div>

      {/* Org Selector */}
      <div className="px-4 py-3 border-b border-gray-800">
        <button
          onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm truncate">{currentOrg?.name || 'Selecionar Org'}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', orgDropdownOpen && 'rotate-180')} />
        </button>
        {orgDropdownOpen && organizations.length > 0 && (
          <div className="mt-1 py-1 bg-gray-800 rounded-lg">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setCurrentOrg(org);
                  setOrgDropdownOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-gray-700',
                  currentOrg?.id === org.id && 'bg-gray-700'
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
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recrutamento
          </h3>
          <div className="space-y-1">
            {recruitmentNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Seção Módulo PHP - Pessoas & Cultura */}
        {phpModuleActive && (
          <div className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Pessoas & Cultura
            </h3>
            <div className="space-y-1">
              {phpNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-orange-400 hover:bg-gray-800 transition-colors border border-dashed border-orange-400/50"
            >
              <HeartPulse className="h-5 w-5" />
              Ativar Módulo PHP
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 truncate">{currentOrg?.orgType === 'headhunter' ? 'Headhunter' : 'Empresa'}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
