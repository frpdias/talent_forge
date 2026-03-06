import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-6xl font-bold text-[#141042] mb-2">404</p>
        <h1 className="text-xl font-semibold text-[#141042] mb-2">Página não encontrada</h1>
        <p className="text-[#666666] text-sm mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
