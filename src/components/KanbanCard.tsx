import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, DollarSign, GripVertical } from 'lucide-react';
import type { Deal } from '../types';

interface KanbanCardProps {
  deal: Deal;
  index: number;
  onCardClick?: (dealId: number) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ deal, index, onCardClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return;
    onCardClick?.(deal.id);
  };

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={handleClick}
          className={`relative bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all mb-3 group border-l-4 cursor-pointer ${
            snapshot.isDragging ? 'shadow-xl rotate-2 scale-105' : ''
          }`}
          style={{
            borderLeftColor: deal.color || '#cbd5e1',
            ...provided.draggableProps.style,
          }}
        >
          <div
            {...provided.dragHandleProps}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>

          <h4 className="font-semibold text-slate-800 mb-2 truncate pr-6" title={deal.title}>
            {deal.title}
          </h4>

          <div className="flex items-center text-slate-500 text-xs mb-3 font-medium uppercase tracking-wide">
            {deal.company || 'No Company'}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
            <div className="flex items-center text-slate-600 font-semibold text-sm">
              <DollarSign className="w-3 h-3 mr-0.5" />
              {typeof deal.value === 'number' ? deal.value.toLocaleString('id-ID') : deal.value}
            </div>

            <div className="flex items-center text-xs text-slate-400 bg-slate-50 py-1 px-2 rounded-full">
              <User className="w-3 h-3 mr-1" />
              {deal.owner || 'Unassigned'}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
