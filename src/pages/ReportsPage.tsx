import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone, Mail, Users, UserPlus, DollarSign, TrendingUp,
  Calendar, Clock, FileText, Filter, Loader2, BarChart3,
  ChevronDown, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import api from '../api';
import ActivityLoggerModal from '../components/ActivityLoggerModal';
import type { ReportData, ActivityLog, TrendDataPoint } from '../types';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const ACTIVITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  call: Phone,
  meeting: Users,
  email: Mail,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: 'bg-blue-100 text-blue-700',
  meeting: 'bg-violet-100 text-violet-700',
  email: 'bg-amber-100 text-amber-700',
};

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('monthly');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ReportData>('/reports', { params: { period } });
      const data = res.data;
      // Normalize recent_activities (may come wrapped in { data: [...] } from Laravel resource collection)
      const rawActivities = (data as unknown as Record<string, unknown>).recent_activities;
      const activities = (rawActivities && typeof rawActivities === 'object' && 'data' in (rawActivities as Record<string, unknown>))
        ? (rawActivities as { data: ActivityLog[] }).data
        : (rawActivities as ActivityLog[]) || [];
      setReportData({ ...data, recent_activities: activities });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const stats = reportData?.stats;
  const trend = reportData?.trend || [];
  const activities: ActivityLog[] = reportData?.recent_activities || [];

  const statCards = [
    { label: 'Total Calls', value: stats?.total_calls ?? 0, icon: Phone, color: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100 text-blue-600' },
    { label: 'Total Meetings', value: stats?.total_meetings ?? 0, icon: Users, color: 'from-violet-500 to-violet-600', iconBg: 'bg-violet-100 text-violet-600' },
    { label: 'Total Emails', value: stats?.total_emails ?? 0, icon: Mail, color: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-100 text-amber-600' },
    { label: 'New Active Customers', value: stats?.new_active_customers ?? 0, icon: UserPlus, color: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue ?? 0), icon: DollarSign, color: 'from-brand-600 to-brand-700', iconBg: 'bg-brand-100 text-brand-700', isCurrency: true },
    { label: 'Total Profit', value: formatCurrency(stats?.total_profit ?? 0), icon: TrendingUp, color: 'from-teal-500 to-teal-600', iconBg: 'bg-teal-100 text-teal-600', isCurrency: true },
  ];

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 capitalize">{entry.name}:</span>
            <span className="font-semibold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-500">Activity performance & sales insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === opt.id
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReports}
            className="p-2.5 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-medium text-sm transition-colors shadow-sm shadow-brand-900/10 active:scale-95 transform"
          >
            <FileText className="w-4 h-4" />
            Log Activity
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <card.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold text-slate-900 ${card.isCurrency ? 'text-lg' : ''}`}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Activity Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Activity Trends</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {period === 'daily' ? 'Last 30 days' : period === 'weekly' ? 'Last 12 weeks' : 'Last 12 months'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> Calls</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-violet-500" /> Meetings</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Emails</span>
                </div>
              </div>

              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={trend as TrendDataPoint[]} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="period_label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="calls" name="Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="meetings" name="Meetings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="emails" name="Emails" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No activity data available</p>
                  <p className="text-xs mt-1">Start logging activities to see trends here</p>
                </div>
              )}
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Recent Activities</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Latest logged sales activities</p>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {activities.length} entries
                </span>
              </div>

              {activities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Type</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Sales Rep</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Deal</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Date & Time</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Duration</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 min-w-[200px]">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activities.map((activity) => {
                        const Icon = ACTIVITY_ICONS[activity.activity_type] || FileText;
                        const colorClass = ACTIVITY_COLORS[activity.activity_type] || 'bg-slate-100 text-slate-600';
                        return (
                          <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colorClass}`}>
                                  <Icon className="w-3 h-3" />
                                  {activity.activity_type === 'meeting' && activity.meeting_type
                                    ? `Meeting (${activity.meeting_type})`
                                    : activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-slate-700">{activity.user?.name || '—'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{activity.deal?.title || '—'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">{formatDate(activity.start_time || activity.created_at)}</span>
                            </td>
                            <td className="px-6 py-4">
                              {activity.duration ? (
                                <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {activity.duration} min
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">{activity.notes || '—'}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <FileText className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No activities logged yet</p>
                  <p className="text-xs mt-1">Click "Log Activity" to start recording</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Activity Logger Modal */}
      <ActivityLoggerModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={fetchReports}
      />
    </div>
  );
};

export default ReportsPage;
