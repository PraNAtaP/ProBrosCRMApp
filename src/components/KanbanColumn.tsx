import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';
import type { Deal, KanbanColumnDef } from '../types';

const COLUMN_STYLES: Record<string, { bg: string; border: string; header: string }> = {
  lead: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100 text-blue-800' },
  contacted: { bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-100 text-violet-800' },
  qualified: { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-100 text-indigo-800' },
  quotes_sent: { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'bg-yellow-100 text-yellow-800' },
  trial_order: { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100 text-orange-800' },
  active_customer: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100 text-emerald-800' },
  retained_growing: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100 text-green-800' },
  lost_customer: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100 text-red-800' },
};

interface KanbanColumnProps {
  column: KanbanColumnDef;
  deals: Deal[];
  onCardClick?: (dealId: number) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, deals, onCardClick }) => {
  const styles = COLUMN_STYLES[column.id] || { bg: 'bg-slate-50', border: 'border-slate-200', header: 'bg-slate-100 text-slate-800' };

  return (
    <div className="flex-shrink-0 w-72 flex flex-col h-full max-h-full">
      <div className={`flex items-center justify-between p-3 rounded-t-lg border-b-2 ${styles.header} ${styles.border}`}>
        <span className="font-semibold text-sm uppercase tracking-wider truncate" title={column.label}>
          {column.label}
        </span>
        <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-bold ml-2 shrink-0">
          {deals.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 flex-1 overflow-y-auto rounded-b-lg border-x border-b transition-colors ${styles.bg} ${styles.border} ${
              snapshot.isDraggingOver ? 'ring-2 ring-brand-500 ring-opacity-50' : ''
            }`}
          >
            {deals.map((deal, index) => (
              <KanbanCard key={deal.id} deal={deal} index={index} onCardClick={onCardClick} />
            ))}
            {provided.placeholder}
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No deals
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
