import React, { useState, useEffect } from 'react';
import {
  X, Loader2, DollarSign, Building2, User, Calendar, FileText,
  Phone, Mail, Users, MessageSquare, ArrowRightLeft, StickyNote,
  Send, AlertCircle,
} from 'lucide-react';
import api from '../api';
import type { Deal, DealStatus, ActivityLog, ActivityType } from '../types';

const STATUS_LABELS: Record<DealStatus, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quotes_sent: 'Quotes / Pricing Sent',
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

interface ActivityTypeOption {
  id: ActivityType;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { id: 'call', label: 'Call', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'meeting', label: 'Meeting', icon: Users },
  { id: 'note', label: 'Note', icon: StickyNote },
];

const ACTIVITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  status_change: ArrowRightLeft,
  note: StickyNote,
};

interface DealDetailModalProps {
  dealId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityFormState {
  activity_type: ActivityType;
  notes: string;
}

const DealDetailModal: React.FC<DealDetailModalProps> = ({ dealId, isOpen, onClose }) => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityForm, setActivityForm] = useState<ActivityFormState>({ activity_type: 'note', notes: '' });
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !dealId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [dealRes, activitiesRes] = await Promise.all([
          api.get<{ data: Deal }>(`/deals/${dealId}`),
          api.get<{ data: ActivityLog[] }>(`/deals/${dealId}/activities`),
        ]);
        setDeal(dealRes.data.data || (dealRes.data as unknown as Deal));
        setActivities(activitiesRes.data.data || (activitiesRes.data as unknown as ActivityLog[]));
      } catch (err) {
        console.error('Failed to fetch deal:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dealId, isOpen]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.notes.trim()) return;

    setSubmittingActivity(true);
    setActivityError(null);
    try {
      const response = await api.post<{ data: ActivityLog }>(`/deals/${dealId}/activities`, activityForm);
      const newActivity = response.data.data;
      setActivities((prev) => [newActivity, ...prev]);
      setActivityForm({ activity_type: 'note', notes: '' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActivityError(axiosErr.response?.data?.message || 'Failed to add activity.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleClose = () => {
    setDeal(null);
    setActivities([]);
    setActivityForm({ activity_type: 'note', notes: '' });
    setActivityError(null);
    onClose();
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Deal Details</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          ) : deal ? (
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{deal.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>{deal.company || 'No Company'}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_BADGE_COLORS[deal.status] || 'bg-slate-100 text-slate-800'}`}>
                  {STATUS_LABELS[deal.status] || deal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <DollarSign className="w-3 h-3" /> Value
                  </div>
                  <p className="font-bold text-slate-800 font-mono">
                    $ {typeof deal.value === 'number' ? deal.value.toLocaleString('id-ID') : deal.value}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <User className="w-3 h-3" /> Owner
                  </div>
                  <p className="font-bold text-slate-800">{deal.owner || 'Unassigned'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <Calendar className="w-3 h-3" /> Created
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{formatDate(deal.created_at)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <FileText className="w-3 h-3" /> Contact
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{deal.contact?.name || '—'}</p>
                </div>
              </div>

              {deal.description && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Description</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{deal.description}</p>
                </div>
              )}

              {deal.commission && (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-brand-800 mb-1">Commission</h4>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-brand-700 font-mono">$ {deal.commission.amount?.toLocaleString('id-ID')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${deal.commission.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {deal.commission.status}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-4">Activity Log</h4>

                <form onSubmit={handleAddActivity} className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex gap-2 mb-3">
                    {ACTIVITY_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setActivityForm((prev) => ({ ...prev, activity_type: type.id }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activityForm.activity_type === type.id
                            ? 'bg-brand-700 text-white shadow-sm'
                            : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
                        }`}
                      >
                        <type.icon className="w-3 h-3" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activityForm.notes}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add a note about this activity..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={submittingActivity || !activityForm.notes.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      {submittingActivity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  {activityError && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" /> {activityError}
                    </div>
                  )}
                </form>

                {activities.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-6 italic">No activities yet.</p>
                ) : (
                  <div className="space-y-1">
                    {activities.map((activity) => {
                      const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
                      return (
                        <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                          <div className="shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                              <Icon className="w-4 h-4 text-slate-500 group-hover:text-brand-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-slate-700">{activity.user?.name || 'System'}</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-500 capitalize">
                                {activity.activity_type?.replace('_', ' ')}
                              </span>
                            </div>
                            {activity.notes && (
                              <p className="text-sm text-slate-600">{activity.notes}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">{formatDate(activity.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">Failed to load deal details.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealDetailModal;
