'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E5E5DC] bg-white/85 backdrop-blur-xl flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-[#141042]">{title}</h1>
        {subtitle && <p className="text-sm text-[#666666]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-9 w-64"
          />
        </div>

        {/* Actions */}
        {actions}

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-[#FAFAF8] transition-colors relative">
          <Bell className="h-5 w-5 text-[#94A3B8]" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
