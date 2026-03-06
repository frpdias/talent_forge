'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import type { KanbanColumnData } from './kanban-board';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnData;
  children: ReactNode;
}

export function KanbanColumn({ column, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'shrink-0 w-72 bg-gray-100 rounded-lg flex flex-col max-h-full',
        isOver && 'ring-2 ring-blue-400 ring-inset'
      )}
    >
      {/* Column Header */}
      <div className="p-3 flex items-center gap-2 border-b border-gray-200">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="font-medium text-gray-900 flex-1">{column.title}</h3>
        <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
          {column.items.length}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-50">
        {children}
        {column.items.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            Nenhum candidato nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
