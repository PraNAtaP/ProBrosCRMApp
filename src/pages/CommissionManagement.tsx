import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Clock, CheckCircle2, Loader2, AlertCircle,
  RefreshCw, Wallet, TrendingUp,
} from 'lucide-react';
import api from '../api';
import type { Commission, CommissionSummary } from '../types';

const CommissionManagement: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [commissionsRes, summaryRes] = await Promise.all([
        api.get<{ data: Commission[] }>('/commissions'),
        api.get<CommissionSummary>('/commissions/summary'),
      ]);
      setCommissions(commissionsRes.data.data || (commissionsRes.data as unknown as Commission[]));
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch commissions:', err);
      setError('Failed to load commissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    try {
      await api.patch(`/commissions/${id}/pay`);
      // Optimistic: update local state immediately
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'paid' as const } : c))
      );
      // Refresh summary totals
      const summaryRes = await api.get<CommissionSummary>('/commissions/summary');
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to approve commission:', err);
      setError('Failed to approve commission. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setApprovingId(null);
    }
  };

  const formatCurrency = (value: number): string => {
    return `$ ${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commission Management</h1>
          <p className="text-slate-500 mt-1">Review and approve sales commissions (0.5% of revenue)</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pending Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Pending Commission</p>
                {loading ? (
                  <div className="h-8 w-32 bg-slate-100 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-amber-700 font-mono mt-0.5">
                    {formatCurrency(summary?.pending_total ?? 0)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Paid Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Paid Commission</p>
                {loading ? (
                  <div className="h-8 w-32 bg-slate-100 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-emerald-700 font-mono mt-0.5">
                    {formatCurrency(summary?.paid_total ?? 0)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : commissions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">No commissions yet</h3>
            <p className="text-slate-400 text-sm">
              Commissions will appear here when deals reach "Active Customer" status.
            </p>
          </div>
        ) : (
          /* Commission Table */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal / Customer</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Value</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commission (0.5%)</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Sales Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {commission.user?.name?.substring(0, 2).toUpperCase() || 'NA'}
                          </div>
                          <span className="font-medium text-slate-800 text-sm">
                            {commission.user?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Deal / Customer */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800 text-sm">{commission.deal?.title || '—'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{commission.deal?.company || '—'}</p>
                      </td>

                      {/* Deal Value */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-sm text-slate-700">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-medium">
                            {formatCurrency(commission.deal?.value ?? 0)}
                          </span>
                        </div>
                      </td>

                      {/* Commission Amount */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-brand-700 text-sm">
                          {formatCurrency(commission.amount)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(commission.calculation_date)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {commission.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {commission.status === 'pending' ? (
                          <button
                            onClick={() => handleApprove(commission.id)}
                            disabled={approvingId === commission.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-600 disabled:bg-brand-800 rounded-lg shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed"
                          >
                            {approvingId === commission.id ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Approving...</>
                            ) : (
                              <><DollarSign className="w-3 h-3" /> Approve & Pay</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Showing {commissions.length} commission{commissions.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionManagement;
