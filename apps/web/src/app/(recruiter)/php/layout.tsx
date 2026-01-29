'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft } from 'lucide-react';
import ModuleStatusBadge from './_components/ModuleStatusBadge';

export default function PhpLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.email === 'contato.fartech@app.br');
      }
      
      setLoading(false);
    }

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#1F4ED8] hover:bg-gray-50 rounded-lg transition-colors"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h2 className="text-xl font-bold text-[#1F4ED8]">PHP Module</h2>
              <ModuleStatusBadge />
            </div>
            <nav className="flex items-center gap-6">{isAdmin && (
                <a href="/php/activation" className="text-sm font-semibold text-gray-700 hover:text-[#1F4ED8] transition-colors">
                  Ativação
                </a>
              )}
              <a href="/php/tfci/cycles" className="text-sm font-semibold text-gray-700 hover:text-[#1F4ED8] transition-colors">
                TFCI
              </a>
              <a href="/php/nr1" className="text-sm font-semibold text-gray-700 hover:text-[#1F4ED8] transition-colors">
                NR-1
              </a>
              <a href="/php/copc" className="text-sm font-semibold text-gray-700 hover:text-[#1F4ED8] transition-colors">
                COPC
              </a>
              <a href="/php/ai" className="text-sm font-semibold text-gray-700 hover:text-[#1F4ED8] transition-colors">
                AI Insights
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center relative">
              <img 
                src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/MODULO%20PHP2.png" 
                alt="PHP Module Logo" 
                className="h-24 w-auto object-contain opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer scale-150 origin-left"
                title="PHP Module - People, Health & Performance"
              />
            </div>
            <div className="text-sm text-gray-500">
              People, Health & Performance
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

