'use client';

import { useMemo, useState, useRef, MouseEvent } from 'react';
import {
  X,
  Building2,
  User,
  Briefcase,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Filter,
  Move,
  GitBranch,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */
interface EmployeeData {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  manager_id: string | null;
  hierarchy_depth?: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_in_team: string;
  joined_at: string;
  employee?: EmployeeData;
}

interface OrgNode {
  employee: EmployeeData;
  subordinates: OrgNode[];
  level: number;
}

interface TeamOrgChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  members: TeamMember[];
}

/* ── Position priority (same as API) ──────────────────── */
const positionPriority = (pos: string | null): number => {
  if (!pos) return 99;
  const p = pos.toLowerCase();
  if (p.includes('diretor') || p.includes('ceo') || p.includes('presidente') || p.includes('vp')) return 1;
  if (p.includes('gerente') || p.includes('superintendente')) return 2;
  if (p.includes('coordenador') || p.includes('supervisor')) return 3;
  if (p.includes('líder') || p.includes('lider') || p.includes('especialista')) return 4;
  if (p.includes('analista') || p.includes('consultor')) return 5;
  if (p.includes('assistente') || p.includes('auxiliar')) return 6;
  if (p.includes('estagiári') || p.includes('estagiario') || p.includes('aprendiz')) return 7;
  return 8;
};

const sortByPosition = (a: EmployeeData, b: EmployeeData) => {
  const pa = positionPriority(a.position);
  const pb = positionPriority(b.position);
  if (pa !== pb) return pa - pb;
  return (a.full_name || '').localeCompare(b.full_name || '');
};

const getShortName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

/* ── Main Component ────────────────────────────────────── */
export default function TeamOrgChartModal({ isOpen, onClose, teamName, members }: TeamOrgChartModalProps) {
  // View / interaction states
  const [zoom, setZoom] = useState(100);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedManagerId, setSelectedManagerId] = useState<string>('__all__');
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Build tree from flat members list ─────────────── */
  const employees = useMemo(() => {
    return members
      .filter((m) => m.employee)
      .map((m) => m.employee as EmployeeData);
  }, [members]);

  const { orgTree, managers } = useMemo(() => {
    const idSet = new Set(employees.map((e) => e.id));
    const childrenMap: Record<string, EmployeeData[]> = {};
    const roots: EmployeeData[] = [];

    for (const emp of employees) {
      if (!emp.manager_id || !idSet.has(emp.manager_id)) {
        roots.push(emp);
      } else {
        if (!childrenMap[emp.manager_id]) childrenMap[emp.manager_id] = [];
        childrenMap[emp.manager_id].push(emp);
      }
    }

    roots.sort(sortByPosition);
    Object.values(childrenMap).forEach((children) => children.sort(sortByPosition));

    const buildNode = (emp: EmployeeData, level: number): OrgNode => ({
      employee: emp,
      level,
      subordinates: (childrenMap[emp.id] || []).map((child) => buildNode(child, level + 1)),
    });

    const fullTree = roots.map((r) => buildNode(r, 0));

    // Managers = anyone who has at least one subordinate (in the tree)
    const mgrs: EmployeeData[] = [];
    const walk = (node: OrgNode) => {
      if (node.subordinates.length > 0) mgrs.push(node.employee);
      node.subordinates.forEach(walk);
    };
    fullTree.forEach(walk);
    mgrs.sort(sortByPosition);

    return { orgTree: fullTree, managers: mgrs };
  }, [employees]);

  /* ── Filtered tree (by selected manager) ─────────── */
  const visibleTree = useMemo(() => {
    if (selectedManagerId === '__all__') return orgTree;

    // Find the node matching the selected manager and return it as sole root
    const findNode = (nodes: OrgNode[]): OrgNode | null => {
      for (const node of nodes) {
        if (node.employee.id === selectedManagerId) return node;
        const found = findNode(node.subordinates);
        if (found) return found;
      }
      return null;
    };

    const target = findNode(orgTree);
    return target ? [{ ...target, level: 0, subordinates: rebaseLevel(target.subordinates, 1) }] : orgTree;
  }, [orgTree, selectedManagerId]);

  /* ── Pan / drag handlers ───────────────────────────── */
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.org-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    e.preventDefault();
  };
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);
  const resetView = () => {
    setPanPosition({ x: 0, y: 0 });
    setZoom(100);
    setCollapsedNodes(new Set());
  };

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  /* ── Render a single org-chart node (recursive) ───── */
  const renderNode = (node: OrgNode) => {
    const hasChildren = node.subordinates.length > 0;
    const isCollapsed = collapsedNodes.has(node.employee.id);
    const isRoot = node.level === 0;

    return (
      <div key={node.employee.id} className="flex flex-col items-center">
        {/* Card */}
        <div className="relative">
          <div
            className={`
              org-card w-52 h-32 rounded-lg border-2 p-3 flex flex-col
              hover:shadow-lg transition-all cursor-pointer font-montserrat
              ${isRoot
                ? 'border-[#3B82F6] bg-linear-to-br from-[#1F4ED8] to-[#3B82F6]'
                : 'bg-white border-[#E5E5DC]'}
            `}
            onClick={(e) => {
              if (hasChildren) { e.stopPropagation(); toggleCollapse(node.employee.id); }
            }}
          >
            <h3 className={`font-bold text-sm mb-1.5 truncate ${isRoot ? 'text-white drop-shadow-md' : 'text-[#141042]'}`}
              title={node.employee.full_name}
            >
              {getShortName(node.employee.full_name)}
            </h3>

            <div className="space-y-1 text-xs flex-1 overflow-hidden">
              {node.employee.position && (
                <div className={`flex items-start gap-1.5 ${isRoot ? 'text-white/95' : 'text-[#666666]'}`}>
                  <Briefcase className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-1 leading-tight text-xs">{node.employee.position}</span>
                </div>
              )}
              {node.employee.department && (
                <div className={`flex items-start gap-1.5 ${isRoot ? 'text-white/95' : 'text-[#666666]'}`}>
                  <Building2 className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-1 leading-tight text-xs">{node.employee.department}</span>
                </div>
              )}
            </div>

            {/* Footer: subordinate count + toggle */}
            <div className={`mt-auto pt-1.5 border-t flex items-center justify-between ${
              isRoot ? 'border-white/30' : 'border-[#E5E5DC]'
            }`}>
              {hasChildren ? (
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${isRoot ? 'text-white' : 'text-[#666666]'}`}>
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <User className="w-3 h-3" />
                  <span>{node.subordinates.length}</span>
                </div>
              ) : <span />}
              <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                isRoot ? 'bg-white/30 text-white' : 'bg-[#141042] text-white'
              }`}>
                {positionPriority(node.employee.position) <= 4 ? 'Gestor' : 'Equipe'}
              </div>
            </div>
          </div>

          {/* Vertical line down from card */}
          {hasChildren && !isCollapsed && (
            <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-[#E5E5DC]"
              style={{ top: 'calc(100% + 4px)', height: '36px' }} />
          )}
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex gap-6 mt-10 relative">
            {node.subordinates.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E5E5DC]" style={{ transform: 'translateY(-36px)' }} />
            )}
            {node.subordinates.map((sub) => (
              <div key={sub.employee.id} className="relative">
                {node.subordinates.length > 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-[#E5E5DC]" style={{ height: '36px', top: '-36px' }} />
                )}
                {renderNode(sub)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop translúcido (glass) */}
      <div
        className="absolute inset-0 bg-[#141042]/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[95vw] max-w-7xl h-[90vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1F4ED8]/10 rounded-lg">
              <GitBranch className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#141042] font-montserrat">
                Organograma — {teamName}
              </h2>
              <p className="text-xs text-[#666666]">{employees.length} colaborador(es)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#666666] hover:text-[#141042] hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: zoom + filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-[#E5E5DC] bg-[#FAFAF8]/60">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(Math.max(40, zoom - 10))} disabled={zoom <= 40}
              className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white disabled:opacity-50 transition-colors"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4 text-[#141042]" />
            </button>
            <span className="text-sm font-medium text-[#141042] min-w-16 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} disabled={zoom >= 150}
              className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white disabled:opacity-50 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4 text-[#141042]" />
            </button>
            <button onClick={resetView}
              className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white transition-colors"
              title="Resetar visualização"
            >
              <Maximize2 className="w-4 h-4 text-[#141042]" />
            </button>
            <div className="h-6 w-px bg-[#E5E5DC] mx-1" />
            <button onClick={() => setPanPosition({ x: 0, y: 0 })}
              className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white transition-colors"
              title="Centralizar"
            >
              <Move className="w-4 h-4 text-[#141042]" />
            </button>
            <span className="text-xs text-[#666666] hidden sm:inline">Arraste para mover</span>
          </div>

          {/* Manager filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#666666]" />
            <select
              value={selectedManagerId}
              onChange={(e) => {
                setSelectedManagerId(e.target.value);
                setPanPosition({ x: 0, y: 0 });
                setCollapsedNodes(new Set());
              }}
              className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white text-[#141042] font-medium focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
            >
              <option value="__all__">Todos (visão completa)</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.full_name}{mgr.position ? ` — ${mgr.position}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {visibleTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Building2 className="w-16 h-16 text-[#E5E5DC] mb-4" />
              <p className="text-[#666666] font-semibold">Nenhum dado hierárquico disponível.</p>
              <p className="text-sm text-[#999999] mt-1">Os colaboradores precisam ter gestores definidos.</p>
            </div>
          ) : (
            <div
              className="min-w-max p-8 transition-transform"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <div className="flex gap-12 justify-center">
                {visibleTree.map((root) => renderNode(root))}
              </div>
            </div>
          )}
        </div>

        {/* Footer legend */}
        <div className="px-6 py-3 border-t border-[#E5E5DC] bg-[#FAFAF8]/60 flex items-center gap-6 text-xs text-[#666666]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-linear-to-br from-[#1F4ED8] to-[#3B82F6]" />
            <span>Cargo mais alto (raiz)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border-2 border-[#E5E5DC]" />
            <span>Colaborador</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>Nº de subordinados diretos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper: rebase levels after filtering subtree ───── */
function rebaseLevel(nodes: OrgNode[], startLevel: number): OrgNode[] {
  return nodes.map((n) => ({
    ...n,
    level: startLevel,
    subordinates: rebaseLevel(n.subordinates, startLevel + 1),
  }));
}
