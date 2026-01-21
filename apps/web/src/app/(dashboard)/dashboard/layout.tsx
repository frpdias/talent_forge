'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UserCheck,
  FileBarChart,
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
];

const moreItems = [
  { href: '/dashboard/team', label: 'Equipe', icon: Building2 },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        <div className="h-16 px-5 flex items-center border-b border-[var(--border)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--tf-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[var(--tf-primary)] font-semibold text-sm tracking-tight">TALENT</span>
              <span className="text-[var(--tf-accent)] font-bold text-sm tracking-wide">FORGE</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="mb-2">
            <span className="px-3 text-[10px] font-semibold text-[var(--tf-gray-400)] uppercase tracking-wider">
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
                    ? 'bg-[var(--tf-accent-subtle)] text-[var(--tf-accent)] border border-[var(--tf-accent)]/10' 
                    : 'text-[var(--tf-gray-600)] hover:bg-[var(--tf-gray-50)] hover:text-[var(--tf-gray-900)]'
                  }
                `}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-[var(--tf-accent)]' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[var(--divider)]">
            <span className="px-3 text-[10px] font-semibold text-[var(--tf-gray-400)] uppercase tracking-wider">
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
                    ? 'bg-[var(--tf-accent-subtle)] text-[var(--tf-accent)] border border-[var(--tf-accent)]/10' 
                    : 'text-[var(--tf-gray-600)] hover:bg-[var(--tf-gray-50)] hover:text-[var(--tf-gray-900)]'
                  }
                `}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-[var(--tf-accent)]' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Action Button */}
        <div className="px-3 py-3 border-t border-[var(--divider)]">
          <Link 
            href="/dashboard/jobs/new"
            className="
              flex items-center justify-center gap-2 w-full px-4 py-2.5
              bg-[var(--tf-primary)] hover:bg-[var(--tf-primary-hover)]
              text-white text-sm font-medium rounded-lg
              transition-all duration-200 shadow-sm hover:shadow-md
            "
          >
            <Plus className="w-4 h-4" />
            <span>Nova Vaga</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--tf-gray-50)]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[var(--tf-gray-200)] flex items-center justify-center text-[var(--tf-gray-600)] font-semibold text-sm">
              R
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">Recrutador</p>
              <p className="text-xs text-[var(--foreground-muted)] truncate">TechCorp</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-[var(--tf-gray-400)] hover:text-[var(--tf-gray-600)] hover:bg-[var(--tf-gray-100)] rounded-md transition-colors"
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
        <header className="sticky top-0 z-30 bg-white border-b border-[var(--border)] shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between h-16 pl-0 pr-6">
            {/* Search Bar */}
            <div className="flex items-center pl-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tf-gray-400)]" />
                <input
                  type="text"
                  placeholder="Buscar candidatos, vagas..."
                  className="
                    w-72 pl-9 pr-4 py-2 text-sm
                    bg-[var(--tf-gray-50)] border border-transparent rounded-lg
                    placeholder:text-[var(--tf-gray-400)]
                    focus:outline-none focus:bg-white focus:border-[var(--border)] focus:ring-2 focus:ring-[var(--tf-accent)]/10
                    transition-all duration-200
                  "
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-[var(--border)] bg-white px-1.5 text-[10px] font-medium text-[var(--tf-gray-400)]">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-[var(--tf-gray-500)] hover:text-[var(--tf-gray-700)] hover:bg-[var(--tf-gray-100)] rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <NotificationCenter />
              
              <div className="h-6 w-px bg-[var(--border)] mx-2" />
              
              <button className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-[var(--tf-gray-50)] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[var(--tf-gray-200)] flex items-center justify-center text-[var(--tf-gray-600)] font-semibold text-sm">
                  R
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--foreground)]">Recrutador</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[var(--tf-gray-400)]" />
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
