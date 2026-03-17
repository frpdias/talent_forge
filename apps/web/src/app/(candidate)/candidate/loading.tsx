export default function CandidateAreaLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-[#10B981]/20 border-t-[#10B981] animate-spin"
          role="status"
          aria-label="Carregando sua área"
        />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
