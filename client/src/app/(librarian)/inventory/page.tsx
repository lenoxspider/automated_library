'use client';

import { useState, useMemo } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, MapPin, Archive, CheckSquare, Edit2, AlertTriangle, 
  ChevronRight, ChevronDown, Download, Activity, Package, Check, X
} from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useThemeStore } from '../../../store/themeStore';

interface InventoryItem {
  id: number;
  barcode: string;
  status: string;
  branch: string | null;
  section: string | null;
  shelf: string | null;
  books: { title: string; author: string; isbn: string; cover_path: string | null };
}

interface LocationSummary {
  branch: string | null;
  section: string | null;
  shelf: string | null;
  _count: { _all: number };
}

interface InventoryResponse {
  data: InventoryItem[];
  count: number;
  locationsRaw: LocationSummary[];
}

export default function InventoryPage() {
  const { dark } = useThemeStore();
  const queryClient = useQueryClient();

  const [branch, setBranch] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [shelf, setShelf] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [focusedItem, setFocusedItem] = useState<InventoryItem | null>(null);

  const { data, isLoading } = useQuery<InventoryResponse>({
    queryKey: ['inventory', { branch, section, shelf, statusFilter, search, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (branch) params.append('branch', branch);
      if (section) params.append('section', section);
      if (shelf) params.append('shelf', shelf);
      if (statusFilter.length > 0) params.append('status', statusFilter.join(','));
      if (search) params.append('search', search);
      
      const res = await api.get(`/inventory?${params.toString()}`);
      return res.data;
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[], updates: Record<string, string> }) => {
      await api.patch('/inventory/bulk', { ids, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedIds(new Set());
    }
  });

  // Tree view logic
  const locationTree = useMemo(() => {
    if (!data?.locationsRaw) return {};
    const tree: Record<string, Record<string, Record<string, number>>> = {};
    data.locationsRaw.forEach(loc => {
      const b = loc.branch || 'Unassigned';
      const sec = loc.section || 'Unassigned';
      const sh = loc.shelf || 'Unassigned';
      if (!tree[b]) tree[b] = {};
      if (!tree[b][sec]) tree[b][sec] = {};
      tree[b][sec][sh] = (tree[b][sec][sh] || 0) + loc._count._all;
    });
    return tree;
  }, [data]);

  // Heat map logic (Top 10 shelves by count)
  const heatmapData = useMemo(() => {
    if (!data?.locationsRaw) return [];
    const flattened = data.locationsRaw.map(loc => ({
      name: `${loc.branch?.[0] || 'U'}-${loc.shelf || 'U'}`,
      full: `${loc.branch || 'Unassigned'} > ${loc.shelf || 'Unassigned'}`,
      count: loc._count._all
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    return flattened;
  }, [data]);

  const toggleStatus = (st: string) => {
    setStatusFilter(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
    setPage(1);
  };

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkStatus = (newStatus: string) => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), updates: { status: newStatus } });
  };

  const totalItems = data?.count || 0;
  const itemsNeedingAttention = data?.data.filter(d => d.status.toLowerCase().includes('repair') || d.status.toLowerCase().includes('lost')).length || 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* LEFT PANEL: Locations */}
      <div className="w-64 border-r border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-y-auto p-4 hidden md:block shrink-0 transition-colors">
        <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4 uppercase tracking-wider">
          <MapPin size={16} className="text-indigo-500" /> Locations
        </h3>
        <button 
          onClick={() => { setBranch(''); setSection(''); setShelf(''); setPage(1); }}
          className={`text-sm w-full text-left px-2 py-1.5 rounded mb-2 ${!branch ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
        >
          All Locations
        </button>
        <div className="space-y-1">
          {Object.entries(locationTree).map(([b, sections]: [string, Record<string, Record<string, number>>]) => (
            <div key={b}>
              <div 
                className={`text-sm font-semibold cursor-pointer px-2 py-1.5 rounded flex items-center justify-between ${branch === b && !section ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-800 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                onClick={() => { setBranch(b); setSection(''); setShelf(''); setPage(1); }}
              >
                {b}
              </div>
              {branch === b && (
                <div className="ml-3 pl-2 border-l border-gray-200 dark:border-slate-700 space-y-1 mt-1">
                  {Object.entries(sections).map(([sec, shelves]: [string, Record<string, number>]) => (
                    <div key={sec}>
                      <div 
                        className={`text-xs cursor-pointer px-2 py-1 rounded ${section === sec && !shelf ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                        onClick={() => { setSection(sec); setShelf(''); setPage(1); }}
                      >
                        {sec}
                      </div>
                      {section === sec && (
                        <div className="ml-3 space-y-0.5 mt-0.5">
                          {Object.entries(shelves).map(([sh, count]: [string, number]) => (
                            <div 
                              key={sh}
                              className={`text-[11px] flex justify-between cursor-pointer px-2 py-0.5 rounded ${shelf === sh ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-200 font-semibold' : 'text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300'}`}
                              onClick={() => { setShelf(sh); setPage(1); }}
                            >
                              <span>{sh}</span>
                              <span className="opacity-50">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 overflow-y-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">Inventory</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">Manage collection logistics and physical locations.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* SUMMARY WIDGETS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Total in View</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalItems}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Package className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
            </Card>
            <Card className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{itemsNeedingAttention}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-center h-24">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Shelf Density</p>
                <Activity size={14} className="text-gray-400" />
              </div>
              <div className="h-10 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip cursor={{ fill: dark ? '#1e293b' : '#f3f4f6' }} contentStyle={{ backgroundColor: dark ? '#0f172a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {heatmapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={dark ? '#6366f1' : '#4f46e5'} opacity={0.6 + (index * 0.04)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* FILTERS */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 flex flex-wrap items-center gap-3 mb-4 shadow-sm transition-colors">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search barcode, title, ISBN..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-md outline-none transition-colors text-gray-900 dark:text-slate-100"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {['Available', 'Checked-out', 'In repair', 'Lost'].map(st => (
                <button
                  key={st}
                  onClick={() => toggleStatus(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter.includes(st) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* BULK ACTIONS TOOLBAR */}
          {selectedIds.size > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between mb-4 shadow-sm animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <CheckSquare size={16} /> {selectedIds.size} items selected
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBulkStatus('Available')}
                  className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
                >
                  Mark Available
                </button>
                <button 
                  onClick={() => handleBulkStatus('In repair')}
                  className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
                >
                  Send to Repair
                </button>
                <button 
                  onClick={() => handleBulkStatus('Lost')}
                  className="px-3 py-1 text-xs font-medium bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 shadow-sm"
                >
                  Mark Lost
                </button>
              </div>
            </div>
          )}

          {/* TABLE */}
          <Card className="overflow-hidden border border-gray-200 dark:border-slate-700">
            {isLoading ? (
              <LoadingSpinner />
            ) : data?.data.length === 0 ? (
              <div className="p-12 text-center">
                <Archive className="mx-auto text-gray-300 dark:text-slate-600 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-200">No items found</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.size === data?.data.length}
                          onChange={(e) => setSelectedIds(e.target.checked ? new Set(data?.data.map(d => d.id)) : new Set())}
                          className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700"
                        />
                      </th>
                      <th className="p-4">Barcode</th>
                      <th className="p-4">Book Title</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800 transition-colors">
                    {data?.data.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${selectedIds.has(item.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                        onClick={() => setFocusedItem(item)}
                      >
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                            className="rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700"
                          />
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-600 dark:text-slate-300">
                          {item.barcode}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate max-w-xs">{item.books.title}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-xs">{item.books.author}</p>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded inline-flex">
                            <MapPin size={12} className="text-gray-400 dark:text-slate-400" />
                            {item.branch ? `${item.branch} > ${item.section || '?'} > ${item.shelf || '?'}` : 'Unassigned'}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            item.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                            item.status === 'Checked-out' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                            item.status === 'Lost' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-gray-400 dark:text-slate-500">
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* PAGINATION */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between text-sm transition-colors">
              <span className="text-gray-500 dark:text-slate-400">
                Showing {data?.data.length || 0} of {totalItems} entries
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 disabled:opacity-50"
                >
                  Prev
                </button>
                <button 
                  disabled={!data || data.data.length < 50}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* RIGHT PANEL: Details Drawer */}
      {focusedItem && (
        <div className="w-80 border-l border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto shadow-xl z-20 flex flex-col transition-colors slide-in-from-right-full animate-in duration-300">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-gray-900 dark:text-slate-100">Item Details</h3>
            <button onClick={() => setFocusedItem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-5 flex-1 space-y-6">
            <div className="text-center">
              {focusedItem.books.cover_path ? (
                <img src={focusedItem.books.cover_path} alt="Cover" className="w-32 h-44 object-cover rounded shadow-md mx-auto mb-4" />
              ) : (
                <div className="w-32 h-44 bg-gray-100 dark:bg-slate-700 rounded shadow-inner mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-400 dark:text-slate-500 font-medium text-xs text-center px-4">No Cover</span>
                </div>
              )}
              <h4 className="font-bold text-lg text-gray-900 dark:text-slate-100 leading-tight">{focusedItem.books.title}</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{focusedItem.books.author}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Barcode</span>
                <span className="font-mono text-gray-900 dark:text-slate-200">{focusedItem.barcode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">ISBN</span>
                <span className="font-mono text-gray-900 dark:text-slate-200">{focusedItem.books.isbn}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Status</span>
                <span className="font-semibold text-gray-900 dark:text-slate-200">{focusedItem.status}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <h5 className="font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-indigo-500" /> Physical Location
              </h5>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Branch</label>
                  <input type="text" defaultValue={focusedItem.branch || ''} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Section</label>
                  <input type="text" defaultValue={focusedItem.section || ''} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Shelf</label>
                  <input type="text" defaultValue={focusedItem.shelf || ''} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-100" />
                </div>
              </div>
              
              <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors text-sm shadow-sm flex justify-center items-center gap-2">
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
