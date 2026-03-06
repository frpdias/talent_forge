'use client';

import React from 'react';
import { HierarchyNode } from '@/types/tfci';
import { Users, ChevronDown, ChevronRight, User } from 'lucide-react';

interface OrganogramNodeProps {
  node: HierarchyNode;
  isExpanded?: boolean;
  onToggle?: (nodeId: string) => void;
  expandedNodes?: Set<string>;
}

export function OrganogramNode({
  node,
  isExpanded = true,
  onToggle,
  expandedNodes = new Set(),
}: OrganogramNodeProps) {
  const hasSubordinates = node.subordinates && node.subordinates.length > 0;
  const isNodeExpanded = expandedNodes.has(node.id);

  return (
    <div className="relative">
      {/* Nó atual */}
      <div className="flex items-start gap-2">
        {/* Botão de expandir/colapsar */}
        {hasSubordinates && onToggle && (
          <button
            onClick={() => onToggle(node.id)}
            className="mt-1 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            {isNodeExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}

        {/* Card do funcionário */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {node.avatar_url ? (
                <img
                  src={node.avatar_url}
                  alt={node.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {node.full_name}
              </h3>
              <p className="text-sm text-gray-600 truncate">{node.position}</p>
              <p className="text-xs text-gray-500 truncate">{node.department}</p>
              {hasSubordinates && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                  <Users className="w-3 h-3" />
                  <span>{node.subordinates.length} subordinado(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subordinados */}
      {hasSubordinates && isNodeExpanded && (
        <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
          {node.subordinates.map((subordinate) => (
            <OrganogramNode
              key={subordinate.id}
              node={subordinate}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrganogramProps {
  hierarchy: HierarchyNode;
  title?: string;
}

export function Organogram({ hierarchy, title = 'Organograma' }: OrganogramProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    new Set([hierarchy.id])
  );

  const handleToggle = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (node: HierarchyNode) => {
      allIds.add(node.id);
      node.subordinates?.forEach(collectIds);
    };
    collectIds(hierarchy);
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set([hierarchy.id]));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Expandir Todos
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            Colapsar Todos
          </button>
        </div>
      </div>

      {/* Árvore hierárquica */}
      <div className="bg-gray-50 rounded-lg p-6">
        <OrganogramNode
          node={hierarchy}
          onToggle={handleToggle}
          expandedNodes={expandedNodes}
        />
      </div>
    </div>
  );
}
