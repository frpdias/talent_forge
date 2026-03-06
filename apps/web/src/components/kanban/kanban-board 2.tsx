'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

export interface KanbanItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  appliedAt: string;
  assessmentStatus?: 'pending' | 'in_progress' | 'completed';
  fitScore?: number;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  color: string;
  items: KanbanItem[];
}

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onMoveCard: (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
}

export function KanbanBoard({ columns: initialColumns, onMoveCard }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumnData[]>(initialColumns);
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumn = useCallback((id: string) => {
    // Check if id is a column id
    const column = columns.find((c) => c.id === id);
    if (column) return column;

    // Otherwise, find the column containing this item
    return columns.find((c) => c.items.some((item) => item.id === id));
  }, [columns]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const column = findColumn(active.id as string);
    if (column) {
      const item = column.items.find((i) => i.id === active.id);
      if (item) {
        setActiveItem(item);
        setActiveColumnId(column.id);
      }
    }
  }, [findColumn]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return;
    }

    setColumns((prevColumns) => {
      const activeItems = [...activeColumn.items];
      const overItems = [...overColumn.items];

      const activeIndex = activeItems.findIndex((i) => i.id === activeId);
      const overIndex = overItems.findIndex((i) => i.id === overId);

      let newIndex: number;
      if (overId === overColumn.id) {
        // Dropping on empty column
        newIndex = overItems.length;
      } else {
        newIndex = overIndex >= 0 ? overIndex : overItems.length;
      }

      const [movedItem] = activeItems.splice(activeIndex, 1);
      overItems.splice(newIndex, 0, movedItem);

      return prevColumns.map((column) => {
        if (column.id === activeColumn.id) {
          return { ...column, items: activeItems };
        }
        if (column.id === overColumn.id) {
          return { ...column, items: overItems };
        }
        return column;
      });
    });
  }, [findColumn]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveItem(null);
      setActiveColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) {
      setActiveItem(null);
      setActiveColumnId(null);
      return;
    }

    if (activeColumn.id === overColumn.id) {
      // Reordering within same column
      const oldIndex = activeColumn.items.findIndex((i) => i.id === activeId);
      const newIndex = activeColumn.items.findIndex((i) => i.id === overId);

      if (oldIndex !== newIndex) {
        setColumns((prevColumns) =>
          prevColumns.map((column) => {
            if (column.id === activeColumn.id) {
              return {
                ...column,
                items: arrayMove(column.items, oldIndex, newIndex),
              };
            }
            return column;
          })
        );
      }
    }

    // Notify parent of card movement
    if (activeColumnId && activeColumnId !== overColumn.id) {
      const newIndex = overColumn.items.findIndex((i) => i.id === activeId);
      onMoveCard(activeId, activeColumnId, overColumn.id, newIndex);
    }

    setActiveItem(null);
    setActiveColumnId(null);
  }, [findColumn, activeColumnId, onMoveCard]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column}>
            <SortableContext
              items={column.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {column.items.map((item) => (
                <KanbanCard key={item.id} item={item} />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <DragOverlay {...({} as any)}>
        {activeItem ? <KanbanCard item={activeItem} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
