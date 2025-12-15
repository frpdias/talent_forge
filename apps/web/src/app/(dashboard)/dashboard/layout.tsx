'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UserCheck,
  FileBarChart,
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Plus,
  ChevronDown,
  Building2
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Vagas', icon: Briefcase },
  { href: '/dashboard/candidates', label: 'Candidatos', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: UserCheck },
  { href: '/dashboard/reports', label: 'Relatórios', icon: FileBarChart },
];

const moreItems = [
  { href: '/dashboard/team', label: 'Equipe', icon: Building2 },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

// For bottom nav, show only 5 most important items
const bottomNavItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Vagas', icon: Briefcase },
  { href: '/dashboard/jobs/new', label: 'Nova', icon: Plus, isAction: true },
  { href: '/dashboard/candidates', label: 'Candidatos', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: UserCheck },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-[#E5E5DC] z-50 transition-transform duration-300 w-70 sm:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 sm:p-6 border-b border-[#E5E5DC]">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#141042] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">FO</span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-semibold text-[#141042]">TalentForge</span>
                <span className="block text-[10px] sm:text-xs text-[#666666]">Recrutador</span>
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
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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

        {/* Quick Action */}
        <div className="absolute bottom-20 left-3 right-3 sm:left-4 sm:right-4">
          <Link 
            href="/dashboard/jobs/new"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center space-x-2 w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#141042] hover:bg-[#1e1860] text-white rounded-xl transition-colors font-medium text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Nova Vaga</span>
          </Link>
        </div>

        <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-4">
          <button className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[#666666] hover:bg-[#F5F5F0] hover:text-[#141042] transition-all w-full">
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
              <div>
                <span className="text-[10px] sm:text-xs text-[#666666]">Organização</span>
                <h1 className="text-sm sm:text-lg font-semibold text-[#141042] truncate max-w-37.5 sm:max-w-none">TechCorp Recrutamento</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="relative p-2 text-[#666666] hover:text-[#141042] hover:bg-[#F5F5F0] rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#141042] rounded-full" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-[#E5E5DC]">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#D9D9C6] rounded-xl flex items-center justify-center text-[#453931] font-medium text-sm">
                  R
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#141042]">Recrutador</p>
                  <p className="text-xs text-[#666666]">Tech Lead</p>
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
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/dashboard/jobs/new' && pathname.startsWith(item.href));
            const isAction = 'isAction' in item && item.isAction;
            
            if (isAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center py-1"
                >
                  <div className="w-11 h-11 bg-[#141042] rounded-full flex items-center justify-center -mt-5 shadow-lg">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium text-[#141042]">{item.label}</span>
                </Link>
              );
            }
            
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
    </div>
  );
}
