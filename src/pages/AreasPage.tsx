import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  Pencil, 
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import AreaModal from '../components/AreaModal';

interface Area {
  id: number;
  name: string;
  description: string | null;
  companies_count?: number;
}

const fetchAreasApi = async (): Promise<Area[]> => {
  const response = await api.get<{ data: Area[] }>('/areas');
  return response.data.data;
};

const AreasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: areas = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['areas'],
    queryFn: fetchAreasApi,
    staleTime: 60 * 1000,
  });

  const error = queryError ? 'Failed to load areas.' : deleteError;

  const handleDelete = async (area: Area) => {
    if (area.companies_count && area.companies_count > 0) {
      alert(`Cannot delete "${area.name}" because it is still used by ${area.companies_count} compan${area.companies_count !== 1 ? 'ies' : 'y'}. Please reassign those companies first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${area.name}"?`)) return;
    setDeletingId(area.id);
    try {
      await api.delete(`/areas/${area.id}`);
      queryClient.setQueryData<Area[]>(['areas'], (old = []) =>
        old.filter((a: Area) => a.id !== area.id)
      );
    } catch (err: any) {
      console.error('Error deleting area:', err);
      const message = err.response?.data?.message || 'Failed to delete area.';
      setDeleteError(message);
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingArea(null);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    refetch();
  };

  const filteredAreas = areas.filter((area: Area) => {
    const searchLower = searchQuery.toLowerCase();
    return area.name.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Areas</h1>
          <p className="text-slate-500 mt-1">Manage distribution areas for sales and delivery teams</p>
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={() => refetch()}
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
            Add Area
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search areas by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => refetch()} className="ml-auto flex items-center gap-1 text-red-600 hover:text-red-800 font-medium">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              <span className="text-sm font-medium">Loading areas...</span>
            </div>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">
              {searchQuery ? 'No areas found' : 'No areas yet'}
            </h3>
            <p className="text-slate-400 text-sm">
              {searchQuery
                ? 'Try a different search term.'
                : 'Add a new area to get started.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">No</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Area Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-32">Companies</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAreas.map((area: Area, index: number) => (
                    <tr key={area.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 font-medium">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 border border-brand-100">
                            {area.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="font-semibold text-slate-800 text-sm">{area.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {area.companies_count !== undefined && area.companies_count > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {area.companies_count} compan{area.companies_count !== 1 ? 'ies' : 'y'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No companies</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(area)}
                            className="p-2 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(area)}
                            disabled={deletingId === area.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === area.id ? (
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
                Showing {filteredAreas.length} area{filteredAreas.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
              <span>Total: {areas.length} areas</span>
            </div>
          </div>
        )}
      </div>

      <AreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaved}
        initialData={editingArea}
      />
    </div>
  );
};

export default AreasPage;
