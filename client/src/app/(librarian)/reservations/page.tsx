'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Calendar, BookMarked, User, Clock, 
  CheckCircle2, XCircle, RefreshCw, Download, 
  Plus, ChevronLeft, ChevronRight, X, AlertCircle
} from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface Reservation {
  id: number;
  book_id: number;
  member_id: number;
  reservation_date: string;
  status: string;
  queue_position?: number;
  expiration_date?: string;
  books: { id: number; title: string; author: string; isbn: string; cover_path: string | null };
  users: { id: number; name: string; email: string; student_id: string | null };
}

interface ReservationsResponse {
  data: Reservation[];
  count: number;
}

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['pending', 'approved', 'ready_for_pickup']);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [focusedReservation, setFocusedReservation] = useState<Reservation | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const { data, isLoading, refetch, isFetching } = useQuery<ReservationsResponse>({
    queryKey: ['reservations', { search: debouncedSearch, status: statusFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter.length > 0) params.append('status', statusFilter.join(','));
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      const res = await api.get(`/reservations?${params.toString()}`);
      return res.data;
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[], action: string }) => {
      await api.patch('/reservations/bulk', { ids, action });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setSelectedIds(new Set());
      if (focusedReservation && variables.ids.includes(focusedReservation.id)) {
        setFocusedReservation(null);
      }
      setToastMessage(`Successfully applied action to ${variables.ids.length} reservations`);
    }
  });

  const reservations = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === reservations.length && reservations.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reservations.map(r => r.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedIds.size === 0) return;
    bulkMutation.mutate({ ids: Array.from(selectedIds), action });
  };

  const toggleStatus = (st: string) => {
    setStatusFilter(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <span className="text-xs font-mono" style={{ color: 'var(--color-signal-pending)' }}>PENDING</span>;
      case 'approved': return <span className="text-xs font-mono" style={{ color: 'var(--color-signal-available)' }}>APPROVED</span>;
      case 'ready_for_pickup': return <span className="text-xs font-mono" style={{ color: 'var(--color-signal-available)' }}>READY FOR PICKUP</span>;
      case 'cancelled': return <span className="text-xs font-mono" style={{ color: 'var(--color-signal-overdue)' }}>CANCELLED</span>;
      case 'expired': return <span className="text-xs font-mono opacity-60">EXPIRED</span>;
      default: return <span className="text-xs font-mono opacity-60">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="relative h-[calc(100vh-12rem)] flex flex-col">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-transparent text-white dark: px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 size={18} className="text-green-400 dark:text-green-600" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="px-6 py-5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight ">Reservations</h1>
          <p className="text-sm  mt-1">Manage patron requests, holds, and waitlists.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="p-2  hover:bg-transparent dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin text-indigo-500' : ''} />
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium  bg-transparent border  rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
          >
            <Plus size={16} /> New Reservation
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* SEARCH & FILTERS */}
          <div className="p-4 bg-white/50  border-b  shrink-0 space-y-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 " size={18} />
                <input
                  type="text"
                  placeholder="Search title, author, patron name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-transparent border  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm "
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold  uppercase tracking-wider mr-2">Status:</span>
              {['pending', 'approved', 'ready_for_pickup', 'cancelled', 'expired'].map(st => (
                <button
                  key={st}
                  onClick={() => toggleStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    statusFilter.includes(st) 
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800' 
                      : 'bg-white  border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  {st.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <Card surface="dark" className="flex-1 overflow-auto relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80  backdrop-blur-sm z-10">
                <LoadingSpinner />
              </div>
            ) : reservations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center  p-8">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium  mb-1">No reservations found</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 opacity-80 border-b z-10 uppercase text-xs font-mono font-bold tracking-wider" style={{ borderColor: 'var(--color-signal-border-dark)', backgroundColor: 'var(--color-signal-bg-dark)' }}>
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size > 0 && selectedIds.size === reservations.length}
                        onChange={selectAll}
                        className="rounded  text-indigo-600 focus:ring-indigo-500 bg-transparent"
                      />
                    </th>
                    <th className="p-4 w-20">ID</th>
                    <th className="p-4">Item</th>
                    <th className="p-4">Patron</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Queue Pos.</th>
                    <th className="p-4">Requested On</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(res => (
                    <tr 
                      key={res.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${focusedReservation?.id === res.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                      onClick={() => setFocusedReservation(res)}
                    >
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(res.id)}
                          onChange={() => toggleSelection(res.id)}
                          className="rounded  text-indigo-600 focus:ring-indigo-500 bg-transparent"
                        />
                      </td>
                      <td className="p-4 font-mono text-xs opacity-60">#{res.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {res.books?.cover_path ? (
                            <img src={res.books.cover_path} alt={res.books.title} className="w-8 h-12 object-cover rounded shadow-sm" />
                          ) : (
                            <div className="w-8 h-12 bg-transparent rounded flex items-center justify-center shadow-sm">
                              <BookMarked size={16} className="" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold  line-clamp-1">{res.books?.title || 'Unknown Book'}</p>
                            <p className="text-xs ">{res.books?.author || 'Unknown Author'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 shrink-0">
                            <User size={12} />
                          </div>
                          <div>
                            <p className="font-medium  line-clamp-1">{res.users?.name || 'Unknown Patron'}</p>
                            <p className="text-xs ">{res.users?.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(res.status)}
                      </td>
                      <td className="p-4">
                        {res.status === 'pending' && res.queue_position ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold ">#{res.queue_position}</span>
                          </div>
                        ) : (
                          <span className="">-</span>
                        )}
                      </td>
                      <td className="p-4  text-xs">
                        {new Date(res.reservation_date).toLocaleDateString()} <br />
                        {new Date(res.reservation_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* PAGINATION */}
          <div className="border-t  bg-transparent p-3 flex items-center justify-between shrink-0">
            <p className="text-xs ">
              Showing {reservations.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of <span className="font-bold">{totalCount}</span> reservations
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded bg-transparent  disabled:opacity-30 hover:bg-transparent dark:hover:bg-slate-700"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="p-1 rounded bg-transparent  disabled:opacity-30 hover:bg-transparent dark:hover:bg-slate-700"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* BULK ACTION TOOLBAR (Floating) */}
          {selectedIds.size > 0 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-transparent text-white dark: px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-500 text-white rounded-full text-xs font-bold">{selectedIds.size}</span>
                <span className="font-medium text-sm">selected</span>
              </div>
              <div className="h-6 w-px bg-transparent dark:bg-transparent"></div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 dark:hover:bg-black/10 rounded transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} className="text-blue-400 dark:text-blue-600" /> Approve
                </button>
                <button 
                  onClick={() => handleBulkAction('ready')}
                  className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 dark:hover:bg-black/10 rounded transition-colors flex items-center gap-1.5"
                >
                  <BookMarked size={16} className="text-green-400 dark:text-green-600" /> Ready
                </button>
                <button 
                  onClick={() => handleBulkAction('cancel')}
                  className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 dark:hover:bg-black/10 rounded transition-colors flex items-center gap-1.5 text-red-400 dark:text-red-600"
                >
                  <XCircle size={16} /> Cancel
                </button>
              </div>
              <button onClick={() => setSelectedIds(new Set())} className="ml-2  hover:text-white dark:hover:text-black">
                <X size={18} />
              </button>
            </div>
          )}

        </div>

        {/* DETAILS DRAWER */}
        {focusedReservation && (
          <div className="w-80 md:w-96 border-l  bg-transparent shrink-0 flex flex-col shadow-xl z-20 overflow-hidden transform transition-transform animate-in slide-in-from-right">
            <div className="p-4 border-b  flex justify-between items-center bg-gray-50/50 ">
              <h2 className="font-bold  flex items-center gap-2">
                Reservation Details
              </h2>
              <button 
                onClick={() => setFocusedReservation(null)}
                className=" hover: dark:hover:text-slate-100 p-1 rounded-md hover:bg-transparent dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Status Section */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold  uppercase tracking-wider mb-1">Status</p>
                  {getStatusBadge(focusedReservation.status)}
                </div>
                {focusedReservation.status === 'pending' && focusedReservation.queue_position && (
                  <div className="text-right">
                    <p className="text-xs font-semibold  uppercase tracking-wider mb-1">Queue Position</p>
                    <p className="text-xl font-mono font-bold ">#{focusedReservation.queue_position}</p>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border ">
                <p className="text-xs font-semibold  uppercase tracking-wider mb-3">Item Requested</p>
                <div className="flex gap-4">
                  {focusedReservation.books?.cover_path ? (
                    <img src={focusedReservation.books.cover_path} alt={focusedReservation.books.title} className="w-16 h-24 object-cover rounded shadow border " />
                  ) : (
                    <div className="w-16 h-24 bg-transparent rounded flex items-center justify-center shadow border ">
                      <BookMarked size={24} className="" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold  leading-tight mb-1">{focusedReservation.books?.title || 'Unknown Book'}</h3>
                    <p className="text-sm  mb-2">{focusedReservation.books?.author || 'Unknown Author'}</p>
                    <p className="text-xs font-mono ">ISBN: {focusedReservation.books?.isbn || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Patron Details */}
              <div>
                <p className="text-xs font-semibold  uppercase tracking-wider mb-2">Patron Information</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-semibold ">{focusedReservation.users?.name || 'Unknown Patron'}</p>
                    <p className="text-sm ">{focusedReservation.users?.email || 'No email'}</p>
                  </div>
                </div>
                {focusedReservation.users?.student_id && (
                  <p className="text-xs  font-mono">ID: {focusedReservation.users.student_id}</p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold  uppercase tracking-wider mb-2">Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><Calendar size={14} className="" /></div>
                    <div>
                      <p className="text-sm ">Requested</p>
                      <p className="text-xs ">{new Date(focusedReservation.reservation_date).toLocaleString()}</p>
                    </div>
                  </div>
                  {focusedReservation.expiration_date && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><Clock size={14} className="text-amber-500" /></div>
                      <div>
                        <p className="text-sm ">Expires</p>
                        <p className="text-xs ">{new Date(focusedReservation.expiration_date).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
            
            {/* Drawer Actions */}
            <div className="p-4 border-t  bg-gray-50/50  flex flex-col gap-2 shrink-0">
              {focusedReservation.status === 'pending' && (
                <>
                  <button
                    disabled={bulkMutation.isPending}
                    onClick={() => bulkMutation.mutate({ ids: [focusedReservation.id], action: 'approve' })}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors text-sm shadow-sm flex justify-center items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Approve Hold
                  </button>
                  <button
                    disabled={bulkMutation.isPending}
                    onClick={() => bulkMutation.mutate({ ids: [focusedReservation.id], action: 'ready' })}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition-colors text-sm shadow-sm flex justify-center items-center gap-2"
                  >
                    <BookMarked size={16} /> Mark Ready for Pickup
                  </button>
                </>
              )}
              {focusedReservation.status !== 'cancelled' && (
                <button
                  disabled={bulkMutation.isPending}
                  onClick={() => bulkMutation.mutate({ ids: [focusedReservation.id], action: 'cancel' })}
                  className="w-full bg-transparent border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-2 rounded-md transition-colors text-sm flex justify-center items-center gap-2 mt-2"
                >
                  <XCircle size={16} /> Cancel Reservation
                </button>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* Mock Modal for New Reservation */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl p-6 bg-transparent">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Reservation</h2>
              <button onClick={() => setIsNewModalOpen(false)} className=" hover: dark:hover:text-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search Patron</label>
                <input type="text" placeholder="Name or email..." className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Search Catalog</label>
                <input type="text" placeholder="Title, author, or ISBN..." className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="pt-4 border-t  flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
                <Button>Create Reservation</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
