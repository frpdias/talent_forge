'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  Shield, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Key,
  FileText,
  AlertTriangle,
  Lock,
  Loader2,
  UserPlus,
  Building
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/create-user', label: 'Criar Usuário', icon: UserPlus },
  { href: '/admin/companies', label: 'Empresas', icon: Building },
  { href: '/admin/security', label: 'Segurança', icon: Shield },
  { href: '/admin/roles', label: 'Roles & Permissões', icon: Lock },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { href: '/admin/security-events', label: 'Eventos de Segurança', icon: AlertTriangle },
  { href: '/admin/api-keys', label: 'API Keys', icon: Key },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; full_name: string } | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type, full_name, email')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.user_type !== 'admin') {
        // Não é admin - redirecionar para dashboard ou login
        console.log('⛔ Acesso negado: usuário não é admin');
        router.push('/dashboard');
        return;
      }

      setUser({ email: profile.email, full_name: profile.full_name });
      setLoading(false);
    }

    checkAdminAccess();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#141042] animate-spin" />
          <p className="text-[#666666]">Verificando permissões...</p>
        </div>
      </div>
    );
  }

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
        <div className="p-4 sm:p-6 flex items-center">
          <div className="flex items-center justify-between w-full">
            <Link href="/admin" className="flex items-center space-x-3">
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
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
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

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 space-y-3">
          {/* Logo no rodapé */}
          <div className="flex items-center justify-center px-3 sm:px-4 py-3 border-t border-[#E5E5DC]">
            <Image 
              src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
              alt="TalentForge"
              width={160}
              height={64}
              className="h-16 w-auto opacity-60 hover:opacity-100 transition-opacity"
              priority
            />
          </div>

          {/* Botão de sair */}
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
              <h1 className="text-base sm:text-xl font-semibold text-[#141042]">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="relative p-2 text-[#666666] hover:text-[#141042] hover:bg-[#F5F5F0] rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-[#E5E5DC]">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#141042] rounded-xl flex items-center justify-center text-white font-medium text-sm">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#141042]">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-[#666666]">{user?.email || 'Administrador'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#666666] hidden sm:block" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5DC] z-40 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive ? 'text-[#141042]' : 'text-[#666666]'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#141042]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
