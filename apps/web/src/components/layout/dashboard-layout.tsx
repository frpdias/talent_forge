'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#FAFAF8] via-[#F5F4FB] to-[#FAFAF8]">
      <Sidebar />
      <main className="pl-64">
        {children}
      </main>
    </div>
  );
}
