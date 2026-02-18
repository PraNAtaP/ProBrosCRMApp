import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Pencil, Trash2, Loader2, AlertCircle,
  Users, Building2, Mail, Phone, Briefcase, RefreshCw, FileText,
} from 'lucide-react';
import api from '../api';
import ContactModal from '../components/ContactModal';
import ActivityLoggerModal from '../components/ActivityLoggerModal';
import type { Contact } from '../types';

const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Activity Logger state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logContact, setLogContact] = useState<Contact | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await api.get<{ data: Contact[] }>('/contacts', { params });
      setContacts(response.data.data || (response.data as unknown as Contact[]));
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setError('Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete contact:', err);
      setError('Failed to delete contact.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingContact(null);
    setShowModal(true);
  };

  const handleSaved = () => {
    fetchContacts();
  };

  const handleLogActivity = (contact: Contact) => {
    setLogContact(contact);
    setShowLogModal(true);
  };

  const handleLogActivityGeneral = () => {
    setLogContact(null);
    setShowLogModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 mt-1">Manage your business contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogActivityGeneral}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm active:scale-95 transform transition-transform"
          >
            <FileText className="w-4 h-4" />
            Log Activity
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-medium transition-colors shadow-sm shadow-brand-900/10 active:scale-95 transform transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add New Contact
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchContacts} className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-sm font-medium">Loading contacts...</span>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">
              {debouncedSearch ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {debouncedSearch ? 'Try a different search term.' : 'Add your first contact to get started.'}
            </p>
            {!debouncedSearch && (
              <button onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-medium text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Contact
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {contact.name?.substring(0, 2).toUpperCase() || 'NA'}
                          </div>
                          <span className="font-semibold text-slate-800">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {contact.company?.name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {contact.position || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {contact.email || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {contact.phone || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleLogActivity(contact)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Log Activity"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(contact)}
                            className="p-2 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            disabled={deletingId === contact.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === contact.id ? (
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

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Showing {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <ContactModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingContact(null); }}
        onSaved={handleSaved}
        contact={editingContact}
      />

      <ActivityLoggerModal
        isOpen={showLogModal}
        onClose={() => { setShowLogModal(false); setLogContact(null); }}
        onSuccess={fetchContacts}
        preselectedContact={logContact}
      />
    </div>
  );
};

export default ContactsPage;
