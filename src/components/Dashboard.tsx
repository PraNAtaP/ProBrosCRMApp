import React, { useState } from 'react';
import CommissionWidget from './CommissionWidget';
import KanbanBoard from './KanbanBoard';
import CreateDealModal from './CreateDealModal';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Deal } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dealsCount, setDealsCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  const refreshAll = () => {
    setRefreshTrigger((prev) => prev + 1);
    setStatsRefreshTrigger((prev) => prev + 1);
  };

  const handleDealCreated = (_deal?: Deal) => {
    // Refresh both Kanban and stats after deal creation
    refreshAll();
  };

  const handleStatsRefresh = () => {
    // Called by KanbanBoard after successful drag-and-drop
    setStatsRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back,{' '}
            <span className="font-semibold text-brand-700">
              {user?.name || 'User'}
            </span>{' '}
            👋
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-medium transition-colors shadow-sm shadow-brand-900/10 active:scale-95 transform transition-transform"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 gap-6 min-h-0 overflow-hidden">
        <div className="shrink-0">
          <CommissionWidget refreshTrigger={statsRefreshTrigger} />
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 -mx-6 px-6 pt-4 border-t border-slate-200/50">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-lg font-bold text-slate-800">Sales Pipeline</h3>
            <div className="px-3 py-1 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-md shadow-sm">
              {dealsCount} Active Deals
            </div>
          </div>

          <div className="flex-1 min-h-0 -mx-6 px-6 overflow-x-auto overflow-y-hidden">
            <KanbanBoard
              onDealsCountChange={setDealsCount}
              refreshTrigger={refreshTrigger}
              onStatsRefresh={handleStatsRefresh}
            />
          </div>
        </div>
      </div>

      <CreateDealModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDealCreated={handleDealCreated}
      />
    </div>
  );
};

export default Dashboard;
