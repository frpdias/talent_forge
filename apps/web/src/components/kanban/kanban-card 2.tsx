'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Brain, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { KanbanItem } from './kanban-board';
import { cn, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui';

interface KanbanCardProps {
  item: KanbanItem;
  isDragging?: boolean;
}

export function KanbanCard({ item, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getAssessmentIcon = () => {
    switch (item.assessmentStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getAssessmentLabel = () => {
    switch (item.assessmentStatus) {
      case 'completed':
        return 'Avaliação concluída';
      case 'in_progress':
        return 'Avaliação em andamento';
      case 'pending':
        return 'Avaliação pendente';
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-grab active:cursor-grabbing',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-blue-400'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -ml-1 rounded hover:bg-gray-100"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.candidateName}</p>
              <p className="text-xs text-gray-500 truncate">{item.candidateEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-gray-400">
          Aplicou em {formatDate(item.appliedAt)}
        </span>
        {item.fitScore !== undefined && (
          <Badge variant={item.fitScore >= 70 ? 'success' : item.fitScore >= 50 ? 'warning' : 'danger'}>
            {item.fitScore}% fit
          </Badge>
        )}
      </div>

      {/* Assessment Status */}
      {item.assessmentStatus && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          {getAssessmentIcon()}
          <span>{getAssessmentLabel()}</span>
        </div>
      )}
    </div>
  );
}
