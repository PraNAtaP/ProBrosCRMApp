import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Loader2, Phone, Mail, Users, Clock, Calendar, FileText,
  ChevronDown, CheckCircle2, AlertCircle, Building2, MapPin,
  ExternalLink, Search,
} from 'lucide-react';
import api from '../api';
import type { Contact, ActivityType, MeetingType } from '../types';

interface ActivityLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedContact?: Contact | null;
  preselectedDealId?: number | null;
}

interface DealOption {
  id: number;
  title: string;
}

const ACTIVITY_OPTIONS: { id: ActivityType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'call', label: 'Call', icon: Phone },
  { id: 'meeting', label: 'Meeting', icon: Users },
  { id: 'email', label: 'Email', icon: Mail },
];

const ActivityLoggerModal: React.FC<ActivityLoggerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedContact,
  preselectedDealId,
}) => {
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [meetingType, setMeetingType] = useState<MeetingType>('Online');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [dealId, setDealId] = useState<string>('');
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Contact selection state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const hasPreselected = !!preselectedContact;

  useEffect(() => {
    if (!isOpen) return;

    // Reset form
    setActivityType('call');
    setMeetingType('Online');
    setStartTime(new Date().toISOString().slice(0, 16));
    setDuration('30');
    setNotes('');
    setDealId(preselectedDealId ? String(preselectedDealId) : '');
    setError(null);
    setShowSuccess(false);
    setContactSearch('');
    setShowContactDropdown(false);

    // Set preselected contact
    if (preselectedContact) {
      setSelectedContact(preselectedContact);
    } else {
      setSelectedContact(null);
    }

    // Fetch deals
    const fetchDeals = async () => {
      setLoadingDeals(true);
      try {
        const res = await api.get<{ data: DealOption[] }>('/deals');
        const data = res.data.data || (res.data as unknown as DealOption[]);
        setDeals(
          (Array.isArray(data) ? data : []).map((d: { id: number; title: string }) => ({
            id: d.id,
            title: d.title,
          }))
        );
      } catch {
        setDeals([]);
      } finally {
        setLoadingDeals(false);
      }
    };
    fetchDeals();

    // Fetch contacts if no preselected contact
    if (!preselectedContact) {
      const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
          const res = await api.get<{ data: Contact[] }>('/contacts');
          const data = res.data.data || (res.data as unknown as Contact[]);
          setContacts(Array.isArray(data) ? data : []);
        } catch {
          setContacts([]);
        } finally {
          setLoadingContacts(false);
        }
      };
      fetchContacts();
    }
  }, [isOpen, preselectedContact, preselectedDealId]);

  // Filtered contacts for dropdown
  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.name?.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  // Derived company info
  const companyName = selectedContact?.company?.name || '';
  const companyAddress = (selectedContact?.company as { name: string; address?: string })?.address || '';
  const contactPhone = selectedContact?.phone || '';
  const contactEmail = selectedContact?.email || '';

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactSearch('');
    setShowContactDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/activity-logs', {
        activity_type: activityType,
        meeting_type: activityType === 'meeting' ? meetingType : null,
        start_time: startTime,
        duration: parseInt(duration, 10),
        notes,
        deal_id: dealId ? parseInt(dealId, 10) : null,
        contact_id: selectedContact?.id || null,
        company_id: selectedContact?.company?.id || null,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to log activity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 mx-4 max-h-[90vh] flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Log Activity</h2>
              <p className="text-xs text-slate-400">
                {selectedContact ? `For ${selectedContact.name}` : 'Record a sales activity'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-emerald-700">Activity Logged!</p>
            <p className="text-sm text-slate-500">Your activity has been recorded successfully</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact Selector (only if no preselected contact) */}
          {!hasPreselected && (
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Users className="w-3.5 h-3.5 inline mr-1.5" />
                Select Contact
              </label>

              {selectedContact ? (
                <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {selectedContact.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedContact.name}</p>
                      <p className="text-xs text-slate-500">{selectedContact.company?.name || 'No company'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedContact(null)}
                    className="text-xs text-brand-700 hover:text-brand-800 font-medium px-2 py-1 rounded hover:bg-brand-100 transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value);
                        setShowContactDropdown(true);
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                      placeholder={loadingContacts ? 'Loading contacts...' : 'Search contacts by name or email...'}
                      disabled={loadingContacts}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                    />
                  </div>

                  {showContactDropdown && filteredContacts.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredContacts.slice(0, 10).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectContact(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-50 transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                            {c.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {c.company?.name || 'No company'} {c.email ? `• ${c.email}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Company Display (auto-filled, read-only) */}
          {selectedContact && companyName && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500">Company</p>
                <p className="text-sm font-semibold text-slate-700">{companyName}</p>
              </div>
            </div>
          )}

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Activity Type</label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActivityType(opt.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                    activityType === opt.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Info Card — Call: show phone */}
          {activityType === 'call' && selectedContact && (
            <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl animate-in">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600">Contact Phone</p>
                <p className="text-sm font-bold text-blue-800">
                  {contactPhone || 'No phone number available'}
                </p>
              </div>
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="ml-auto shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Call now"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Dynamic Info Card — Email: show email + mailto */}
          {activityType === 'email' && selectedContact && (
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl animate-in">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-amber-600">Contact Email</p>
                <p className="text-sm font-bold text-amber-800 truncate">
                  {contactEmail || 'No email available'}
                </p>
              </div>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  title="Opens your default email client"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Send Email Now
                </a>
              )}
            </div>
          )}

          {/* Meeting Type (conditional) */}
          {activityType === 'meeting' && (
            <div className="animate-in">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Meeting Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Online', 'Offline'] as MeetingType[]).map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setMeetingType(mt)}
                    className={`py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      meetingType === mt
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {mt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Info Card — Meeting: show address or online label */}
          {activityType === 'meeting' && selectedContact && (
            <div className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-200 rounded-xl animate-in">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-violet-600">
                  {meetingType === 'Offline' ? 'Company Address' : 'Meeting Location'}
                </p>
                <p className="text-sm font-bold text-violet-800">
                  {meetingType === 'Offline'
                    ? companyAddress || 'No address available'
                    : 'Online Meeting'}
                </p>
              </div>
            </div>
          )}

          {/* Date & Duration row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={1}
                required
                placeholder="30"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Deal (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Related Deal <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                disabled={loadingDeals}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none pr-10 transition-shadow"
              >
                <option value="">No deal selected</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes / Description
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              rows={4}
              placeholder="What was discussed in this activity..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-shadow"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !notes.trim() || !startTime || !duration}
            className="w-full py-3 bg-brand-700 hover:bg-brand-800 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-900/10 disabled:shadow-none active:scale-[0.98] transform"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Log Activity'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivityLoggerModal;
