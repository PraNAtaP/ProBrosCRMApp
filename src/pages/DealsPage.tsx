import React, { useState, useEffect } from 'react';
import {
  Search, Pencil, Trash2, Loader2, AlertCircle,
  Briefcase, Building2, TrendingUp, RefreshCw, Filter,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import EditDealModal from '../components/EditDealModal';
import type { Deal, DealStatus } from '../types';

const STATUS_LABELS: Record<DealStatus, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quotes_sent: 'Quotes Sent',
  trial_order: 'Trial Order',
  active_customer: 'Active Customer',
  retained_growing: 'Retained / Growing',
  lost_customer: 'Lost Customer',
};

const STATUS_BADGE_COLORS: Record<DealStatus, string> = {
  lead: 'bg-blue-100 text-blue-800',
  contacted: 'bg-violet-100 text-violet-800',
  qualified: 'bg-indigo-100 text-indigo-800',
  quotes_sent: 'bg-yellow-100 text-yellow-800',
  trial_order: 'bg-orange-100 text-orange-800',
  active_customer: 'bg-emerald-100 text-emerald-800',
  retained_growing: 'bg-green-100 text-green-800',
  lost_customer: 'bg-red-100 text-red-800',
};

const ALL_STATUSES: DealStatus[] = [
  'lead', 'contacted', 'qualified', 'quotes_sent',
  'trial_order', 'active_customer', 'retained_growing', 'lost_customer',
];

const fetchDealsApi = async (statusFilter: string): Promise<Deal[]> => {
  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;
  const response = await api.get<{ data: Deal[] }>('/deals', { params });
  return response.data.data || (response.data as unknown as Deal[]);
};

const DealsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DealStatus | ''>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: deals = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['deals', statusFilter],
    queryFn: () => fetchDealsApi(statusFilter),
    staleTime: 30 * 1000,
  });

  const error = queryError ? 'Failed to load deals.' : deleteError;

  // Client-side search filter
  const filteredDeals = debouncedSearch
    ? deals.filter((d: Deal) =>
        d.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (d.company || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (d.owner || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : deals;

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this deal? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/deals/${id}`);
      queryClient.setQueryData<Deal[]>(['deals', statusFilter], (old = []) =>
        old.filter((d: Deal) => d.id !== id)
      );
    } catch (err) {
      console.error('Failed to delete deal:', err);
      setDeleteError('Failed to delete deal.');
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowEditModal(true);
  };

  const handleSaved = () => {
    refetch();
  };

  const formatCurrency = (value: number): string =>
    `$ ${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500 mt-1">Manage all your deals in one place</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        {/* Search + Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by deal name, company, or sales..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DealStatus | '')}
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm appearance-none min-w-[180px]"
            >
              <option value="">All Stages</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => refetch()} className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-sm font-medium">Loading deals...</span>
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">
              {debouncedSearch || statusFilter ? 'No deals found' : 'No deals yet'}
            </h3>
            <p className="text-slate-400 text-sm">
              {debouncedSearch || statusFilter
                ? 'Try a different search or filter.'
                : 'Create your first deal on the Dashboard.'}
            </p>
          </div>
        ) : (
          /* Deals Table */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Title</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company / Contact</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Sales</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeals.map((deal: Deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Deal Title */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{deal.title}</p>
                        {deal.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{deal.description}</p>
                        )}
                      </td>

                      {/* Company / Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{deal.company || '—'}</span>
                        </div>
                        {deal.contact && (
                          <p className="text-xs text-slate-500 mt-0.5 ml-5">{deal.contact.name}</p>
                        )}
                      </td>

                      {/* Value */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-sm">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(deal.value)}
                          </span>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE_COLORS[deal.status] || 'bg-slate-100 text-slate-800'}`}
                        >
                          {STATUS_LABELS[deal.status] || deal.status}
                        </span>
                      </td>

                      {/* Assigned Sales */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {deal.owner?.substring(0, 2).toUpperCase() || 'NA'}
                          </div>
                          <span className="text-sm text-slate-700">{deal.owner || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{formatDate(deal.created_at)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(deal)}
                            className="p-2 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            disabled={deletingId === deal.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === deal.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>
                Showing {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
                {statusFilter && ` in ${STATUS_LABELS[statusFilter]}`}
              </span>
              <span>Total: {deals.length} deals</span>
            </div>
          </div>
        )}
      </div>

      <EditDealModal
        deal={editingDeal}
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingDeal(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default DealsPage;
