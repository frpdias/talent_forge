'use client';

import { useMemo, useState, useRef, MouseEvent } from 'react';
import { Building2, User, Mail, Briefcase, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronRight, Filter, Move } from 'lucide-react';
import { HIERARCHY_LEVELS } from '@/lib/hierarchy-constants';

interface Employee {
  id: string;
  full_name: string;
  position?: string;
  department?: string;
  email?: string;
  manager_id?: string;
  hierarchy_level?: string;
  status: string;
}

interface OrgChartProps {
  employees: Employee[];
}

interface OrgNode {
  employee: Employee;
  subordinates: OrgNode[];
  level: number;
}

export default function OrgChart({ employees }: OrgChartProps) {
  // Estados para controle
  const [zoom, setZoom] = useState(100);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para pan/drag
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Obter níveis disponíveis nos dados
  const availableLevels = useMemo(() => {
    const levels = [...new Set(employees.map(e => e.hierarchy_level).filter(Boolean))];
    return HIERARCHY_LEVELS.filter(level => levels.includes(level.code));
  }, [employees]);

  // Filtrar empregados por níveis selecionados
  const filteredEmployees = useMemo(() => {
    if (selectedLevels.size === 0) return employees;
    return employees.filter(emp => 
      emp.hierarchy_level && selectedLevels.has(emp.hierarchy_level)
    );
  }, [employees, selectedLevels]);

  // Toggle nível hierárquico no filtro
  const toggleLevel = (code: string) => {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Toggle collapse de um nó
  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Handlers para pan/drag
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // Ignorar se clicar em um card de funcionário
    const target = e.target as HTMLElement;
    if (target.closest('.org-card')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const resetPan = () => {
    setPanPosition({ x: 0, y: 0 });
  };

  // Construir árvore hierárquica
  const orgTree = useMemo(() => {
    const activeEmployees = filteredEmployees.filter(e => e.status === 'active');
    
    // Criar mapa de employees por ID
    const employeeMap = new Map<string, Employee>();
    activeEmployees.forEach(emp => employeeMap.set(emp.id, emp));

    // Função recursiva para construir árvore
    const buildTree = (managerId: string | null | undefined, level: number): OrgNode[] => {
      const subordinates = activeEmployees.filter(emp => emp.manager_id === managerId);
      
      // Ordenar subordinados por hierarchy_level (menor order = mais alto na hierarquia)
      const sortedSubordinates = subordinates.sort((a, b) => {
        const levelA = HIERARCHY_LEVELS.find(l => l.code === a.hierarchy_level);
        const levelB = HIERARCHY_LEVELS.find(l => l.code === b.hierarchy_level);
        return (levelA?.order || 999) - (levelB?.order || 999);
      });
      
      return sortedSubordinates.map(emp => ({
        employee: emp,
        level,
        subordinates: buildTree(emp.id, level + 1),
      }));
    };

    // Encontrar C-Level (sem manager_id) ou níveis mais altos
    const roots = activeEmployees.filter(emp => !emp.manager_id);
    
    if (roots.length === 0) {
      return [];
    }

    // Ordenar roots por hierarchy_order (menor = mais alto)
    const sortedRoots = roots.sort((a, b) => {
      const levelA = HIERARCHY_LEVELS.find(l => l.code === a.hierarchy_level);
      const levelB = HIERARCHY_LEVELS.find(l => l.code === b.hierarchy_level);
      return (levelA?.order || 999) - (levelB?.order || 999);
    });

    return sortedRoots.map(root => ({
      employee: root,
      level: 0,
      subordinates: buildTree(root.id, 1),
    }));
  }, [filteredEmployees]);

  const getHierarchyInfo = (code?: string) => {
    if (!code) return null;
    return HIERARCHY_LEVELS.find(l => l.code === code);
  };

  const getShortName = (fullName: string): string => {
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0];
    return `${nameParts[0]} ${nameParts[1]}`;
  };

  const renderNode = (node: OrgNode, isLast: boolean = false) => {
    const hierarchyInfo = getHierarchyInfo(node.employee.hierarchy_level);
    const hasSubordinates = node.subordinates.length > 0;
    const isCollapsed = collapsedNodes.has(node.employee.id);
    
    // Verificar se é Conselho de Administração (N1)
    const isBoard = hierarchyInfo?.code === 'N1';

    return (
      <div key={node.employee.id} className="flex flex-col items-center">
        {/* Card do Funcionário */}
        <div className="relative">
          <div className={`
            org-card w-52 h-32 rounded-lg border-2 p-3 flex flex-col
            hover:shadow-lg transition-all cursor-pointer font-montserrat
            ${isBoard
              ? 'border-[#4B5563] bg-gradient-to-br from-[#374151] to-[#4B5563]' 
              : node.level === 0 
                ? 'border-[#3B82F6] bg-gradient-to-br from-[#1F4ED8] to-[#3B82F6]'
                : 'bg-white border-[#E5E5DC]'}
          `}
          onClick={(e) => {
            if (hasSubordinates) {
              e.stopPropagation();
              toggleCollapse(node.employee.id);
            }
          }}
        >
            {/* Nome */}
            <h3 className={`font-bold text-sm mb-1.5 truncate ${
              node.level === 0 ? 'text-white drop-shadow-md' : 'text-[#141042]'
            }`} title={node.employee.full_name}>
              {getShortName(node.employee.full_name)}
            </h3>

            {/* Cargo e Departamento - espaço flexível */}
            <div className="space-y-1 text-xs flex-1 overflow-hidden">
              {node.employee.position && (
                <div className={`flex items-start gap-1.5 ${
                  node.level === 0 ? 'text-white/95' : 'text-[#666666]'
                }`}>
                  <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1 leading-tight text-xs" title={node.employee.position}>
                    {node.employee.position}
                  </span>
                </div>
              )}
              {node.employee.department && (
                <div className={`flex items-start gap-1.5 ${
                  node.level === 0 ? 'text-white/95' : 'text-[#666666]'
                }`}>
                  <Building2 className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1 leading-tight text-xs" title={node.employee.department}>
                    {node.employee.department}
                  </span>
                </div>
              )}
              {node.employee.email && (
                <div className={`flex items-start gap-1.5 ${
                  node.level === 0 ? 'text-white/95' : 'text-[#666666]'
                }`}>
                  <Mail className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span className="truncate text-xs" title={node.employee.email}>
                    {node.employee.email}
                  </span>
                </div>
              )}
            </div>

            {/* Badge de subordinados + nível hierárquico - sempre no final */}
            <div className={`mt-auto pt-1.5 border-t flex items-center justify-between ${
              isBoard ? 'border-white/30' : node.level === 0 ? 'border-white/30' : 'border-[#E5E5DC]'
            }`}>
              {hasSubordinates && (
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                  node.level === 0 ? 'text-white' : 'text-[#666666]'
                }`}>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <User className="w-3 h-3" />
                  <span>{node.subordinates.length}</span>
                </div>
              )}
              {hierarchyInfo && (
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isBoard
                    ? 'bg-white/30 text-white'
                    : node.level === 0 
                      ? 'bg-white/30 text-white' 
                      : 'bg-[#141042] text-white'
                }`}>
                  {hierarchyInfo.code}
                </div>
              )}
            </div>
          </div>

          {/* Linha vertical para subordinados - com gap visível do card */}
          {hasSubordinates && !isCollapsed && (
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-[#E5E5DC]" style={{ top: 'calc(100% + 4px)', height: '36px' }} />
          )}
        </div>

        {/* Subordinados */}
        {hasSubordinates && !isCollapsed && (
          <div className="flex gap-6 mt-10 relative">
            {/* Linha horizontal conectando subordinados - só se tiver mais de 1 */}
            {node.subordinates.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E5E5DC]" style={{ transform: 'translateY(-36px)' }} />
            )}
            
            {node.subordinates.map((sub, idx) => (
              <div key={sub.employee.id} className="relative">
                {/* Linha vertical individual - só se tiver múltiplos subordinados */}
                {node.subordinates.length > 1 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-[#E5E5DC]" style={{ height: '36px', top: '-36px' }} />
                )}
                {renderNode(sub, idx === node.subordinates.length - 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E5E5DC] p-12 text-center font-montserrat">
        <Building2 className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
        <p className="text-[#666666] font-semibold">Nenhum funcionário cadastrado ainda.</p>
        <p className="text-sm text-[#999999] mt-2">Cadastre funcionários para visualizar o organograma.</p>
      </div>
    );
  }

  if (orgTree.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E5E5DC] p-12 text-center font-montserrat">
        <Building2 className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
        <p className="text-[#666666] font-semibold">Organograma não disponível.</p>
        <p className="text-sm text-[#999999] mt-2">
          Defina os níveis hierárquicos e gestores dos funcionários para visualizar o organograma.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E5E5DC]">
      {/* Barra de controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
            className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4 text-[#141042]" />
          </button>
          <span className="text-sm font-medium text-[#141042] min-w-[4rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            disabled={zoom >= 150}
            className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4 text-[#141042]" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white transition-colors"
            title="Resetar zoom"
          >
            <Maximize2 className="w-4 h-4 text-[#141042]" />
          </button>
          <div className="h-6 w-px bg-[#E5E5DC] mx-1" />
          <button
            onClick={resetPan}
            className="p-2 rounded-lg border border-[#E5E5DC] hover:bg-white transition-colors"
            title="Centralizar visualização"
          >
            <Move className="w-4 h-4 text-[#141042]" />
          </button>
          <span className="text-xs text-[#666666]">
            Arraste para mover
          </span>
        </div>

        {/* Filtros de nível */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-[#141042] text-white border-[#141042]'
                : 'bg-white text-[#141042] border-[#E5E5DC] hover:bg-[#FAFAF8]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">
              Filtrar Níveis {selectedLevels.size > 0 && `(${selectedLevels.size})`}
            </span>
          </button>
          {selectedLevels.size > 0 && (
            <button
              onClick={() => setSelectedLevels(new Set())}
              className="text-sm text-[#666666] hover:text-[#141042] underline"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Filtros expansíveis */}
      {showFilters && availableLevels.length > 0 && (
        <div className="p-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
          <p className="text-sm font-medium text-[#141042] mb-3">
            Selecione os níveis hierárquicos para visualizar:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableLevels.map(level => (
              <button
                key={level.code}
                onClick={() => toggleLevel(level.code)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  selectedLevels.has(level.code)
                    ? 'bg-[#141042] text-white border-[#141042]'
                    : 'bg-white text-[#666666] border-[#E5E5DC] hover:border-[#141042]'
                }`}
              >
                {level.code} - {level.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Organograma */}
      <div 
        ref={containerRef}
        className="p-8 overflow-hidden relative"
        style={{ height: '600px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="min-w-max pb-8 transition-transform"
          style={{ 
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom / 100})`,
            transformOrigin: 'top left'
          }}
        >
          <div className="flex gap-12 justify-center">
            {orgTree.map((root, idx) => renderNode(root, idx === orgTree.length - 1))}
          </div>
        </div>
      </div>

      {/* Legendas */}
      <div className="mt-8 pt-6 border-t border-[#E5E5DC] space-y-4 px-8 pb-8">
        {/* Legenda Níveis Hierárquicos */}
        <div>
          <h4 className="text-sm font-bold text-[#141042] mb-3 font-montserrat">Níveis Hierárquicos</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {HIERARCHY_LEVELS.slice(0, 6).map(level => (
              <div key={level.code} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#141042]" />
                <span className="text-xs text-[#666666] font-montserrat">{level.code} - {level.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legenda Subordinados */}
        <div>
          <h4 className="text-sm font-bold text-[#141042] mb-3 font-montserrat">Símbolos</h4>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#666666]" />
            <span className="text-xs text-[#666666] font-montserrat">Número de subordinados diretos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
