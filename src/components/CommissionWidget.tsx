import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Award, Briefcase, Loader2,
  CheckCircle2, Clock, DollarSign,
} from 'lucide-react';
import api from '../api';
import type { DashboardStats } from '../types';

interface CommissionWidgetProps {
  refreshTrigger?: number;
}

const CommissionWidget: React.FC<CommissionWidgetProps> = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<DashboardStats>('/dashboard-stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-28">
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mb-3" />
            <div className="h-7 w-28 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">Commission Overview</h2>
          <p className="text-xs text-slate-500">
            {stats ? `Periode ${stats.month}/${stats.year}` : ''}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Paid Commission */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-100 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Komisi Dibayar</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700 font-mono">
            $ {(stats?.total_paid_commission ?? 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Sudah dicairkan</p>
        </div>

        {/* Pending Commission */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group hover:border-amber-200 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-100 rounded-md">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Komisi Pending</p>
          </div>
          <p className="text-2xl font-bold text-amber-600 font-mono">
            $ {(stats?.total_pending_commission ?? 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Menunggu approval</p>
        </div>

        {/* Active Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group hover:border-brand-200 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-brand-100 rounded-md">
              <Briefcase className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deals</p>
          </div>
          <p className="text-2xl font-bold text-brand-700 font-mono">
            {stats?.total_active_deals ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Dalam pipeline</p>
        </div>

        {/* Total Sales Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 rounded-md">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</p>
          </div>
          <p className="text-xl font-bold text-emerald-600 font-mono">
            $ {(stats?.total_sales_revenue ?? 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Trial + Active + Retained</p>
        </div>
      </div>
    </div>
  );
};

export default CommissionWidget;
