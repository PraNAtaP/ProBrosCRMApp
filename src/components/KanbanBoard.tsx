import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import DealDetailModal from './DealDetailModal';
import api from '../api';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import type { Deal, DealStatus, KanbanColumnDef } from '../types';

const COLUMNS: KanbanColumnDef[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'quotes_sent', label: 'Quotes / Pricing Sent' },
  { id: 'trial_order', label: 'Trial Order' },
  { id: 'active_customer', label: 'Active Customer' },
  { id: 'retained_growing', label: 'Retained / Growing' },
  { id: 'lost_customer', label: 'Lost Customer' },
];

const STATUS_COLORS: Record<DealStatus, string> = {
  lead: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#6366f1',
  quotes_sent: '#eab308',
  trial_order: '#f97316',
  active_customer: '#10b981',
  retained_growing: '#22c55e',
  lost_customer: '#ef4444',
};

interface KanbanBoardProps {
  onDealsCountChange?: (count: number) => void;
  refreshTrigger?: number;
  onStatsRefresh?: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ onDealsCountChange, refreshTrigger, onStatsRefresh }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<{ data: Deal[] }>('/deals');
      const dealsData = response.data.data || (response.data as unknown as Deal[]);
      setDeals(dealsData);

      onDealsCountChange?.(dealsData.length);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onDealsCountChange]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals, refreshTrigger]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const dealId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as DealStatus;
    const oldStatus = source.droppableId as DealStatus;
    const dealIndex = deals.findIndex((d) => d.id === dealId);
    if (dealIndex === -1) return;

    const originalDeal = deals[dealIndex];

    // Optimistic update
    const updatedDeals = [...deals];
    updatedDeals[dealIndex] = {
      ...originalDeal,
      status: newStatus,
      color: STATUS_COLORS[newStatus] || originalDeal.color,
    };
    setDeals(updatedDeals);
    setUpdating(dealId);

    try {
      await api.patch(`/deals/${dealId}`, { status: newStatus });
      // Trigger stats refresh after successful status change
      onStatsRefresh?.();
    } catch (err) {
      console.error('Failed to update deal status:', err);
      // Rollback
      const rolledBackDeals = [...deals];
      rolledBackDeals[dealIndex] = originalDeal;
      setDeals(rolledBackDeals);
      setError(`Failed to move deal. Reverted to ${oldStatus}.`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const handleCardClick = (dealId: number) => {
    setSelectedDealId(dealId);
  };

  const dealsByStatus = COLUMNS.reduce<Record<string, Deal[]>>((acc, col) => {
    acc[col.id] = deals.filter((deal) => deal.status === col.id);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="text-sm font-medium">Loading deals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchDeals} className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full overflow-x-auto pb-4 gap-4 min-w-full">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              deals={dealsByStatus[col.id] || []}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DragDropContext>

      {updating && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-lg shadow-lg text-sm z-40">
          <Loader2 className="w-4 h-4 animate-spin" />
          Updating deal...
        </div>
      )}

      <DealDetailModal
        dealId={selectedDealId}
        isOpen={!!selectedDealId}
        onClose={() => setSelectedDealId(null)}
      />
    </div>
  );
};

export default KanbanBoard;
