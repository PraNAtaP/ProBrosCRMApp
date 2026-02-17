import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, UserPlus, Save } from 'lucide-react';
import api from '../api';
import type { Contact, Company } from '../types';

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  position: string;
  company_id: string;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  contact?: Contact | null;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSaved, contact = null }) => {
  const isEditing = !!contact;

  const [form, setForm] = useState<ContactFormState>({
    name: '',
    email: '',
    phone: '',
    position: '',
    company_id: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen && contact) {
      setForm({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        company_id: String(contact.company_id || contact.company?.id || ''),
      });
    } else if (isOpen) {
      setForm({ name: '', email: '', phone: '', position: '', company_id: '' });
    }
  }, [isOpen, contact]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await api.get<{ data: Company[] }>('/companies');
        setCompanies(response.data.data || (response.data as unknown as Company[]));
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        company_id: parseInt(form.company_id, 10),
      };

      if (isEditing && contact) {
        await api.put(`/contacts/${contact.id}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      onSaved?.();
      handleClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      if (axiosErr.response?.status === 422) {
        setFieldErrors(axiosErr.response.data?.errors || {});
      } else {
        setError(axiosErr.response?.data?.message || 'Failed to save contact.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', email: '', phone: '', position: '', company_id: '' });
    setError(null);
    setFieldErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              {isEditing ? <Save className="w-5 h-5 text-brand-700" /> : <UserPlus className="w-5 h-5 text-brand-700" />}
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {isEditing ? 'Edit Contact' : 'Add New Contact'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
            {loadingCompanies ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading companies...
              </div>
            ) : (
              <select
                name="company_id" value={form.company_id} onChange={handleChange} required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Select a company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {fieldErrors.company_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.company_id[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
            <input
              type="text" name="position" value={form.position} onChange={handleChange}
              placeholder="e.g. Purchasing Manager"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="e.g. john@company.com"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="text" name="phone" value={form.phone} onChange={handleChange}
              placeholder="e.g. +61 400 000 000"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
              ) : isEditing ? (
                <><Save className="w-4 h-4" /> Update Contact</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Add Contact</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
