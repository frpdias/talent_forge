'use client';

import { usePhpModule } from '@/lib/hooks/usePhpModule';

export default function ModuleStatusBadge() {
  const { isActive, loading } = usePhpModule();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        isActive ? 'bg-green-600' : 'bg-gray-400'
      }`}></span>
      {isActive ? 'PHP Ativo' : 'PHP Inativo'}
    </span>
  );
}
