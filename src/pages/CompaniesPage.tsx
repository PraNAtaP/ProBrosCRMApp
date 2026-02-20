import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Pencil, 
  Trash2,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import CompanyModal from '../components/CompanyModal';

interface Area {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
  address: string | null;
  industry: string | null;
  phone: string | null;
  area_id: number;
  area?: Area;
}

const fetchCompaniesApi = async (): Promise<Company[]> => {
  const response = await api.get<{ data: Company[] }>('/companies');
  return response.data.data;
};

const fetchAreasApi = async (): Promise<Area[]> => {
  const response = await api.get<{ data: Area[] }>('/areas');
  return response.data.data;
};

const CompaniesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: companies = [], isLoading: loadingCompanies, error: companiesError, refetch: refetchCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompaniesApi,
    staleTime: 30 * 1000,
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: fetchAreasApi,
    staleTime: 60 * 1000,
  });

  const loading = loadingCompanies;
  const error = companiesError ? 'Failed to load companies.' : deleteError;

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/companies/${id}`);
      queryClient.setQueryData<Company[]>(['companies'], (old = []) =>
        old.filter((c: Company) => c.id !== id)
      );
    } catch (err) {
      console.error('Error deleting company:', err);
      setDeleteError('Failed to delete company.');
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    refetchCompanies();
  };

  const filteredCompanies = companies.filter((company: Company) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      company.name.toLowerCase().includes(searchLower) ||
      (company.industry && company.industry.toLowerCase().includes(searchLower)) ||
      (company.address && company.address.toLowerCase().includes(searchLower));
      
    const matchesArea = selectedArea ? company.area_id.toString() === selectedArea : true;
    
    return matchesSearch && matchesArea;
  });

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 mt-1">Manage your client companies and their details</p>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={() => refetchCompanies()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg font-medium transition-colors shadow-sm shadow-brand-900/10 active:scale-95 transform transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, industry, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm appearance-none min-w-[180px]"
            >
              <option value="">All Areas</option>
              {areas.map((area: Area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => refetchCompanies()} className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-sm font-medium">Loading companies...</span>
            </div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">
              {searchQuery || selectedArea ? 'No companies found' : 'No companies yet'}
            </h3>
            <p className="text-slate-400 text-sm">
              {searchQuery || selectedArea
                ? 'Try a different search or filter.'
                : 'Add a new company to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Details</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Industry & Area</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.map((company: Company) => (
                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 border border-brand-100">
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{company.name}</div>
                            {company.address && (
                              <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]" title={company.address}>
                                {company.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {company.industry ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {company.industry}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No industry</span>
                          )}
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {company.area?.name || <span className="italic text-slate-400">Unknown Area</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {company.phone ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-brand-700 transition-colors">
                            <Phone className="w-4 h-4" />
                            {company.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No phone</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(company)}
                            className="p-2 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            disabled={deletingId === company.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === company.id ? (
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
            
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>
                Showing {filteredCompanies.length} compan{filteredCompanies.length !== 1 ? 'ies' : 'y'}
                {searchQuery && ` matching "${searchQuery}"`}
                {selectedArea && ` in selected area`}
              </span>
              <span>Total: {companies.length} companies</span>
            </div>
          </div>
        )}
      </div>

      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaved}
        initialData={editingCompany}
        areas={areas}
      />
    </div>
  );
};

export default CompaniesPage;
