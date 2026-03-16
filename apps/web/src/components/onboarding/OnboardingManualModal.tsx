'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, Circle, BookOpen, ChevronDown } from 'lucide-react';
import manualData from '@/data/manual_onboarding_data.json';

type Section = (typeof manualData.sections)[number];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'tf_manual_read_sections';

function loadReadSections(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadSections(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function OnboardingManualModal({ isOpen, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [readSections, setReadSections] = useState<Set<string>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sections: Section[] = manualData.sections;
  const current = sections[currentIdx];
  const progress = Math.round((readSections.size / sections.length) * 100);

  useEffect(() => {
    if (isOpen) setReadSections(loadReadSections());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !current) return;
    const updated = new Set(readSections).add(current.id);
    setReadSections(updated);
    saveReadSections(updated);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setExpandedIdx(currentIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const goTo = (idx: number) => setCurrentIdx(Math.max(0, Math.min(idx, sections.length - 1)));
  const isLast = currentIdx === sections.length - 1;

  // Injeta IDs nas sub-seções para ancoragem
  const htmlWithAnchors = current?.html?.replace(
    /<div class="ss">/g,
    (_, offset, str) => {
      const before = str.slice(0, offset);
      const subIdx = (before.match(/<div class="ss">/g) || []).length;
      return `<div class="ss" id="sub-${subIdx}">`;
    }
  ) ?? '';

  const scrollToSub = (idx: number) => {
    const el = contentRef.current?.querySelector(`#sub-${idx}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <style>{`
        .manual-content * { box-sizing: border-box; }
        .manual-content { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; line-height: 1.7; color: #374151; }
        .manual-content h2 { font-size: 1.45rem; font-weight: 700; color: #141042; margin-bottom: .75rem; }
        .manual-content h3 { font-size: 1.05rem; font-weight: 600; color: #141042; margin-bottom: .45rem; margin-top: 1.4rem; }
        .manual-content h4 { font-size: .92rem; font-weight: 600; color: #3B82F6; margin-bottom: .3rem; margin-top: .9rem; }
        .manual-content p { margin-bottom: .85rem; color: #374151; }
        .manual-content ul, .manual-content ol { margin: .4rem 0 .9rem 1.4rem; }
        .manual-content li { margin-bottom: .3rem; color: #374151; }
        .manual-content a { color: #3B82F6; text-decoration: none; }
        .manual-content .card { background: #fff; border: 1px solid #E5E5DC; border-radius: 14px; padding: 1.4rem; box-shadow: 0 1px 4px rgba(0,0,0,.06); margin-bottom: 1.2rem; }
        .manual-content .ch { display: flex; align-items: center; gap: .75rem; margin-bottom: .85rem; }
        .manual-content .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
        .manual-content .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .manual-content .g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: .85rem; margin-bottom: 1.5rem; }
        .manual-content .callout { border-radius: 4px; padding: .85rem 1.1rem; margin: 1.25rem 0; border-left: 4px solid transparent; }
        .manual-content .tip { background: #F0FDF4; border-left-color: #16A34A; }
        .manual-content .warn { background: #FFFBEB; border-left-color: #D97706; }
        .manual-content .info { background: #EFF6FF; border-left-color: #3B82F6; }
        .manual-content .cb strong { display: block; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .2rem; }
        .manual-content .tip .cb strong { color: #15803D; }
        .manual-content .warn .cb strong { color: #B45309; }
        .manual-content .info .cb strong { color: #1D4ED8; }
        .manual-content .cb p { margin: 0; font-size: .87rem; color: #374151; }
        .manual-content .steps { list-style: none; margin: .75rem 0; padding: 0; }
        .manual-content .steps li { display: flex; gap: .85rem; align-items: flex-start; margin-bottom: .85rem; }
        .manual-content .sn { width: 26px; height: 26px; border-radius: 50%; background: #141042; color: #fff; display: flex; align-items: center; justify-content: center; font-size: .74rem; font-weight: 700; flex-shrink: 0; margin-top: .1rem; }
        .manual-content .sbody strong { display: block; font-size: .9rem; color: #141042; }
        .manual-content .sbody span { font-size: .83rem; color: #6B7280; }
        .manual-content .badge { display: inline-block; padding: .18rem .6rem; border-radius: 999px; font-size: .73rem; font-weight: 600; }
        .manual-content .bg { background: #D1FAE5; color: #065F46; }
        .manual-content .bb { background: #DBEAFE; color: #1E40AF; }
        .manual-content .bo { background: #FED7AA; color: #92400E; }
        .manual-content .br { background: #FEE2E2; color: #991B1B; }
        .manual-content .bgr { background: #F3F4F6; color: #374151; }
        .manual-content .bp { background: #EDE9FE; color: #5B21B6; }
        .manual-content .srow { display: flex; flex-wrap: wrap; gap: .5rem; margin: .6rem 0; }
        .manual-content table { width: 100%; border-collapse: collapse; margin: 1rem 0 1.5rem; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
        .manual-content th { background: #141042; color: #fff; padding: .7rem 1rem; text-align: left; font-size: .8rem; font-weight: 600; letter-spacing: .03em; }
        .manual-content td { padding: .65rem 1rem; border-bottom: 1px solid #E5E5DC; font-size: .84rem; }
        .manual-content tr:last-child td { border-bottom: none; }
        .manual-content tr:hover td { background: #F9FAFB; }
        .manual-content .dw { background: #fff; border: 1px solid #E5E5DC; border-radius: 14px; padding: 1.75rem; margin: 1.5rem 0; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow-x: auto; }
        .manual-content .dc { font-size: .78rem; color: #6B7280; margin-top: .75rem; font-style: italic; }
        .manual-content .ss { margin: 2rem 0; padding-top: 1.5rem; border-top: 2px solid #E5E5DC; scroll-margin-top: 16px; }
        .manual-content .ss-t { font-size: 1rem; font-weight: 700; color: #141042; margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
        .manual-content .sdot { width: 10px; height: 10px; border-radius: 50%; background: #10B981; flex-shrink: 0; }
        .manual-content .metric { background: #fff; border: 1px solid #E5E5DC; border-radius: 12px; padding: 1.25rem; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
        .manual-content .mv { font-size: 1.8rem; font-weight: 800; margin-bottom: .2rem; }
        .manual-content .ml { font-size: .78rem; color: #6B7280; font-weight: 500; }
        .manual-content code { background: #F3F4F6; padding: 1px 5px; border-radius: 4px; font-size: .82rem; font-family: monospace; }
        .manual-content .sb-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 800; color: #fff; flex-shrink: 0; }
        .manual-content .sh { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; }
        .manual-content .st h2 { margin-bottom: .2rem; }
        .manual-content .st p { margin: 0; color: #6B7280; font-size: .88rem; }
        .manual-content svg { max-width: 100%; height: auto; }
        @media (max-width: 640px) {
          .manual-content .g2, .manual-content .g3, .manual-content .g4 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal */}
        <div className="relative flex w-full max-w-6xl h-[90vh] bg-[#FAFAF8] rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Sidebar esquerda ── */}
          <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-[#141042] overflow-y-auto">
            {/* Header sidebar */}
            <div className="px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">Manual TalentForge</p>
                  <p className="text-white/40 text-xs">{manualData.version}</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-white/50 mb-1.5">
                  <span>{readSections.size}/{sections.length} seções</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de seções com sub-itens expansíveis */}
            <nav className="flex-1 py-3 px-2">
              {sections.map((sec, idx) => {
                const isActive = idx === currentIdx;
                const isRead = readSections.has(sec.id);
                const isExpanded = expandedIdx === idx;
                const hasSubs = sec.subsections.length > 0;

                return (
                  <div key={sec.id} className="mb-0.5">
                    <button
                      onClick={() => {
                        goTo(idx);
                        setExpandedIdx(isExpanded && isActive ? null : idx);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isActive ? 'bg-white/15 shadow-sm' : 'hover:bg-white/8'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: isActive ? sec.color : `${sec.color}80` }}
                      >
                        {sec.number}
                      </div>
                      <span className={`flex-1 text-xs leading-tight truncate ${isActive ? 'text-white font-semibold' : 'text-white/60'}`}>
                        {sec.title}
                      </span>
                      {isRead
                        ? <CheckCircle className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                        : hasSubs
                          ? <ChevronDown className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          : <Circle className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                      }
                    </button>

                    {/* Sub-seções */}
                    {isExpanded && isActive && hasSubs && (
                      <div className="ml-4 mt-0.5 border-l border-white/10 pl-3 pb-1">
                        {sec.subsections.map((sub, subIdx) => (
                          <button
                            key={subIdx}
                            onClick={() => scrollToSub(subIdx)}
                            className="w-full text-left py-1.5 px-2 text-xs text-white/45 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors leading-tight"
                          >
                            {sub.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* ── Conteúdo principal ── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5DC] bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: current?.color }}
                >
                  {current?.number}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141042] truncate">{current?.title}</p>
                  <p className="text-xs text-[#6B7280] truncate hidden sm:block">{current?.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="lg:hidden text-xs text-[#6B7280] mr-2">
                  {currentIdx + 1}/{sections.length}
                </span>
                <button
                  onClick={onClose}
                  className="p-2 text-[#94A3B8] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
                  aria-label="Fechar manual"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Barra de progresso mobile */}
            <div className="lg:hidden h-1 bg-[#E5E5DC]">
              <div
                className="h-full bg-[#10B981] transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / sections.length) * 100}%` }}
              />
            </div>

            {/* Mini-índice de sub-seções (quando há mais de 1) */}
            {current?.subsections && current.subsections.length > 1 && (
              <div className="shrink-0 px-6 py-3 border-b border-[#E5E5DC] bg-white/60 overflow-x-auto">
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <span className="text-xs text-[#94A3B8] whitespace-nowrap mr-1">Ir para:</span>
                  {current.subsections.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToSub(idx)}
                      className="whitespace-nowrap text-xs px-2.5 py-1 rounded-full border border-[#E5E5DC] text-[#6B7280] hover:border-current hover:text-[#141042] transition-colors"
                      style={{ '--hover-color': current.color } as React.CSSProperties}
                    >
                      {sub.title.replace(/^\d+\.\d+\s/, '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Corpo — HTML completo da seção com sub-seções */}
            <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6">
              <div
                className="manual-content max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: htmlWithAnchors }}
              />
            </div>

            {/* Footer — navegação */}
            <div className="shrink-0 px-6 py-4 border-t border-[#E5E5DC] bg-white flex items-center justify-between gap-3">
              <button
                onClick={() => goTo(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#141042] border border-[#E5E5DC] rounded-xl hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex gap-1.5 lg:hidden">
                {sections.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentIdx ? 'w-5 bg-[#141042]' : 'bg-[#E5E5DC]'}`}
                    aria-label={`Ir para seção ${idx + 1}`}
                  />
                ))}
              </div>

              <p className="hidden lg:block text-xs text-[#94A3B8]">
                Seção {currentIdx + 1} de {sections.length} &bull; {readSections.size} lidas
              </p>

              {isLast ? (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all"
                  style={{ background: '#10B981' }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Concluir
                </button>
              ) : (
                <button
                  onClick={() => goTo(currentIdx + 1)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all"
                  style={{ background: current?.color }}
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
