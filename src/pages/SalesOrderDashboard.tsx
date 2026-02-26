import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, Star, StarOff, Truck, XCircle,
  Plus, Trash2, Loader2, CheckCircle2,
  ChevronDown, AlertCircle, Package, Clock, Filter,
} from 'lucide-react';
import api from '../api';
import type { SalesOrder, SalesOrderTab, SalesOrderStatus, Company, Contact } from '../types';

// ─── Tab definitions ─────────────────────────────
const TABS: { id: SalesOrderTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'current', label: 'Current', icon: Clock },
  { id: 'delivered', label: 'Delivered', icon: Truck },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const STATUS_OPTIONS: { value: SalesOrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'processing', label: 'Processing', color: '#3b82f6' },
  { value: 'delivered', label: 'Delivered', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

const SalesOrderDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesOrderTab>('current');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [massStatusValue, setMassStatusValue] = useState<SalesOrderStatus | ''>('');
  const [showMassActions, setShowMassActions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { tab: activeTab };
      if (search.trim()) params.search = search.trim();
      const res = await api.get<{ data: SalesOrder[] }>('/sales-orders', { params });
      setOrders(res.data.data || []);
    } catch {
      showToast('Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchOrders();
    setSelectedIds(new Set());
    setShowMassActions(false);
  }, [fetchOrders]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const handleToggleFavorite = async (order: SalesOrder) => {
    try {
      await api.patch(`/sales-orders/${order.id}/favorite`);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, is_favorite: !o.is_favorite } : o))
      );
      showToast(order.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch {
      showToast('Failed to toggle favorite', 'error');
    }
  };

  const handleMassStatus = async () => {
    if (!massStatusValue || selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      await api.patch('/sales-orders/mass/status', {
        ids: Array.from(selectedIds),
        status: massStatusValue,
      });
      showToast(`${selectedIds.size} orders updated to ${massStatusValue}`);
      setSelectedIds(new Set());
      setMassStatusValue('');
      setShowMassActions(false);
      fetchOrders();
    } catch {
      showToast('Failed to update orders', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this sales order?')) return;
    try {
      await api.delete(`/sales-orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      showToast('Order deleted');
    } catch {
      showToast('Failed to delete order', 'error');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(val);

  const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-in ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sales Orders</h1>
            <p className="text-sm text-slate-500">Manage and track all your sales orders</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-900/10"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center border-b border-slate-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-700 text-brand-700 bg-brand-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Mass Actions Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order # or company..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in">
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setShowMassActions(!showMassActions)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                Mass Update
                <ChevronDown className="w-3 h-3" />
              </button>
              {showMassActions && (
                <div className="flex items-center gap-2 animate-in">
                  <select
                    value={massStatusValue}
                    onChange={(e) => setMassStatusValue(e.target.value as SalesOrderStatus)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <option value="">Set status...</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleMassStatus}
                    disabled={!massStatusValue || actionLoading}
                    className="px-3 py-2 bg-brand-700 hover:bg-brand-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="ml-2 text-sm text-slate-500">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No orders found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different tab or search term</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      selectedIds.has(order.id) ? 'bg-brand-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-800">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {order.company?.display_name || order.company?.trading_name || order.company?.name || '—'}
                        </p>
                        {order.company?.trading_name && order.company.trading_name !== order.company.name && (
                          <p className="text-xs text-slate-400">{order.company.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-600">{order.contact?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-800">{formatCurrency(order.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${order.status_color}15`,
                          color: order.status_color,
                        }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-500">{formatDate(order.created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleFavorite(order)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            order.is_favorite
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                          title={order.is_favorite ? 'Remove favorite' : 'Add favorite'}
                        >
                          {order.is_favorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>


      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrders();
            showToast('Order created successfully');
          }}
        />
      )}
    </div>
  );
};

// ─── Create Order Modal ──────────────────────────
interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onSuccess }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get<{ data: Company[] }>('/companies', { params: { per_page: 100 } });
        setCompanies(res.data.data || []);
      } catch { /* ignore */ }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!companyId) { setContacts([]); return; }
    const fetchContacts = async () => {
      try {
        const res = await api.get<{ data: Contact[] }>('/contacts', { params: { company_id: companyId, per_page: 100 } });
        setContacts(res.data.data || []);
      } catch { setContacts([]); }
    };
    fetchContacts();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/sales-orders', {
        company_id: parseInt(companyId, 10),
        contact_id: contactId ? parseInt(contactId, 10) : null,
        total_amount: parseFloat(totalAmount),
        delivery_date: deliveryDate || null,
        additional_notes: notes || null,
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-brand-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">New Sales Order</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Company *</label>
            <select
              value={companyId}
              onChange={(e) => { setCompanyId(e.target.value); setContactId(''); }}
              required
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contact</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              disabled={!companyId}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
            >
              <option value="">{companyId ? 'Select contact' : 'Select company first'}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Total Amount (AUD) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !companyId || !totalAmount}
            className="w-full py-3 bg-brand-700 hover:bg-brand-800 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-900/10"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalesOrderDashboard;
