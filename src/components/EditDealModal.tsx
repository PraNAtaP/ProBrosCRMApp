import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Save } from 'lucide-react';
import api from '../api';
import type { Deal, DealStatus, Contact } from '../types';

const STATUSES: { id: DealStatus; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'quotes_sent', label: 'Quotes / Pricing Sent' },
  { id: 'trial_order', label: 'Trial Order' },
  { id: 'active_customer', label: 'Active Customer' },
  { id: 'retained_growing', label: 'Retained / Growing' },
  { id: 'lost_customer', label: 'Lost Customer' },
];

interface EditDealForm {
  title: string;
  value: string;
  status: DealStatus;
  contact_id: string;
  description: string;
}

interface EditDealModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const EditDealModal: React.FC<EditDealModalProps> = ({ deal, isOpen, onClose, onSaved }) => {
  const [form, setForm] = useState<EditDealForm>({
    title: '',
    value: '',
    status: 'lead',
    contact_id: '',
    description: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen && deal) {
      setForm({
        title: deal.title || '',
        value: String(deal.value || ''),
        status: deal.status || 'lead',
        contact_id: String((deal as unknown as { contact_id?: number }).contact_id || deal.contact?.id || ''),
        description: deal.description || '',
      });
    }
  }, [isOpen, deal]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const response = await api.get<{ data: Contact[] }>('/contacts');
        setContacts(response.data.data || (response.data as unknown as Contact[]));
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchContacts();
  }, [isOpen]);

  const contactsByCompany = contacts.reduce<Record<string, Contact[]>>((acc, contact) => {
    const companyName = contact.company?.name || 'No Company';
    if (!acc[companyName]) acc[companyName] = [];
    acc[companyName].push(contact);
    return acc;
  }, {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        value: parseFloat(form.value) || 0,
        status: form.status,
        contact_id: parseInt(form.contact_id, 10),
        description: form.description,
      };
      await api.put(`/deals/${deal.id}`, payload);
      onSaved?.();
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      if (axiosErr.response?.status === 422) {
        setFieldErrors(axiosErr.response.data?.errors || {});
      } else {
        setError(axiosErr.response?.data?.message || 'Failed to update deal.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFieldErrors({});
    onClose();
  };

  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Save className="w-5 h-5 text-brand-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Edit Deal</h2>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title *</label>
            <input
              type="text" name="title" value={form.title} onChange={handleChange} required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Value ($) *</label>
            <input
              type="number" name="value" value={form.value} onChange={handleChange} required min="0" step="0.01"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            {fieldErrors.value && <p className="text-red-500 text-xs mt-1">{fieldErrors.value[0]}</p>}
            <p className="text-xs text-slate-400 mt-1">Komisi 0.5% akan dihitung ulang otomatis jika deal dalam status revenue.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact / Company *</label>
            {loadingContacts ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts...
              </div>
            ) : (
              <select
                name="contact_id" value={form.contact_id} onChange={handleChange} required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              >
                <option value="">Select a contact...</option>
                {Object.entries(contactsByCompany)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([company, companyContacts]) => (
                    <optgroup key={company} label={company}>
                      {companyContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.position ? ` — ${c.position}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            )}
            {fieldErrors.contact_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.contact_id[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status" value={form.status} onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="Optional notes..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-600 disabled:bg-brand-800 rounded-lg shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Update Deal</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDealModal;
