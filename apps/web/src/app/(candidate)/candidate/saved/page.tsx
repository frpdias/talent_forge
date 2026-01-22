'use client';

import Link from 'next/link';
import { Bookmark, ArrowRight } from 'lucide-react';

export default function CandidateSavedPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Vagas Salvas</h1>
        <p className="text-xs sm:text-sm text-[#666666]">Gerencie vagas que você deseja acompanhar.</p>
      </header>

      <div className="rounded-2xl border border-dashed border-[#E5E5DC] bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F0] text-[#141042]">
          <Bookmark className="h-6 w-6" />
        </div>
        <p className="text-sm text-[#666666]">
          O recurso de salvar vagas ainda não está habilitado na arquitetura atual.
        </p>
        <Link
          href="/candidate/jobs"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#141042] hover:underline"
        >
          Explorar vagas disponíveis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
