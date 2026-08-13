'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Truck, Clock, Plus, X, BookMarked, MapPin, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

type Order = {
  id: number;
  title: string;
  vendor: string;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
};

export default function AcquisitionsPage() {
  const queryClient = useQueryClient();
  const setNewOrderWrapper = (val: typeof newOrder) => setNewOrder(val);
  const [newOrder, setNewOrder] = useState({ title: '', vendor: '', quantity: 1, total_price: 0 });
  
  // Receive Modal State
  const [receivingOrder, setReceivingOrder] = useState<Order | null>(null);
  const [receiveForm, setReceiveForm] = useState({
    author: '',
    genre: '',
    isbn: '',
    branch: '',
    section: '',
    shelf: '',
    coverUrl: ''
  });

  const [coverCandidates, setCoverCandidates] = useState<{ url: string; source: string; title?: string }[]>([]);
  const [isSearchingCovers, setIsSearchingCovers] = useState(false);

  const fetchCovers = async (title: string) => {
    setIsSearchingCovers(true);
    try {
      const res = await api.get(`/books/search-covers?q=${encodeURIComponent(title)}`);
      setCoverCandidates(res.data);
    } catch {
      toast.error('Failed to search online covers');
    } finally {
      setIsSearchingCovers(false);
    }
  };

  useEffect(() => {
    if (receivingOrder) {
      fetchCovers(receivingOrder.title);
    } else {
      setCoverCandidates([]);
      setReceiveForm({ author: '', genre: '', isbn: '', branch: '', section: '', shelf: '', coverUrl: '' });
    }
  }, [receivingOrder]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['acquisitions'],
    queryFn: async () => (await api.get('/acquisitions')).data
  });

  const createOrder = useMutation({
    mutationFn: async (data: unknown) => await api.post('/acquisitions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquisitions'] });
      setNewOrderWrapper({ title: '', vendor: '', quantity: 1, total_price: 0 });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.put(`/acquisitions/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['acquisitions'] })
  });

  const receiveOrder = useMutation({
    mutationFn: async (data: { id: number; payload: Record<string, unknown> }) => {
      await api.post(`/acquisitions/${data.id}/receive`, data.payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquisitions'] });
      setReceivingOrder(null);
      setReceiveForm({ author: '', genre: '', isbn: '', branch: '', section: '', shelf: '', coverUrl: '' });
      toast.success('Order received and books added to catalog/inventory');
    }
  });

  const lookupIsbn = useMutation({
    mutationFn: async (isbn: string) => (await api.get(`/books/lookup/${isbn}`)).data,
    onSuccess: (data) => {
      setReceiveForm(prev => ({
        ...prev,
        author: data.author || prev.author,
        genre: data.genre || prev.genre
      }));
      toast.success('Metadata found and auto-filled!');
    },
    onError: () => {
      toast.error('Could not find metadata for this ISBN.');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate(newOrder);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receivingOrder) {
      receiveOrder.mutate({ id: receivingOrder.id, payload: receiveForm });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 size={12} /> RECEIVED
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            <Truck size={12} /> APPROVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            <Clock size={12} /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-gray-900 dark:text-slate-100">Acquisitions</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Manage purchase orders and receive inventory.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Plus size={20} />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-slate-100">New Purchase Order</h2>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Book Title</label>
                <input 
                  required 
                  type="text" 
                  value={newOrder.title} 
                  onChange={e => setNewOrder({...newOrder, title: e.target.value})} 
                  className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                  placeholder="e.g. The Great Gatsby"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Vendor</label>
                <input 
                  required 
                  type="text" 
                  value={newOrder.vendor} 
                  onChange={e => setNewOrder({...newOrder, vendor: e.target.value})} 
                  className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                  placeholder="e.g. Penguin Books"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Quantity</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={newOrder.quantity} 
                    onChange={e => setNewOrder({...newOrder, quantity: parseInt(e.target.value)})} 
                    className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Total ($)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={newOrder.total_price} 
                    onChange={e => setNewOrder({...newOrder, total_price: parseFloat(e.target.value)})} 
                    className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                  />
                </div>
              </div>
              <button 
                disabled={createOrder.isPending} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {createOrder.isPending ? <LoadingSpinner /> : 'Submit Order'}
              </button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-3 relative min-h-[400px]">
          <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 h-full flex flex-col shadow-sm">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order ID</th>
                    <th className="px-6 py-4 font-semibold">Title & Vendor</th>
                    <th className="px-6 py-4 font-semibold">Details</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="h-64">
                        <div className="flex justify-center items-center h-full">
                          <LoadingSpinner />
                        </div>
                      </td>
                    </tr>
                  ) : orders?.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-slate-100">{order.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{order.vendor}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 dark:text-slate-300">{order.quantity} copies</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">${order.total_price.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'approved' })} 
                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {order.status === 'approved' && (
                          <button 
                            onClick={() => {
                              setReceiveForm(prev => ({ ...prev, author: '', genre: '', isbn: '', branch: '', section: '', shelf: '' }));
                              setReceivingOrder(order);
                            }} 
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 px-3 py-1.5 rounded transition-colors"
                          >
                            Receive into Inventory
                          </button>
                        )}
                        {order.status === 'received' && (
                          <span className="text-gray-400 dark:text-slate-600 text-sm font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-500 dark:text-slate-400">
                        No purchase orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Receive Order Modal */}
      {receivingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Receive Order #{receivingOrder.id}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Provide book details to generate inventory records.</p>
              </div>
              <button 
                onClick={() => setReceivingOrder(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReceiveSubmit}>
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900/30">
                  <BookMarked className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      You are receiving <strong>{receivingOrder.quantity} copies</strong> of <strong>{receivingOrder.title}</strong>. 
                      This will automatically create a book record and {receivingOrder.quantity} individual copy barcodes.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-slate-800 pb-2">Catalog Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Author</label>
                      <input 
                        required 
                        type="text" 
                        value={receiveForm.author} 
                        onChange={e => setReceiveForm({...receiveForm, author: e.target.value})} 
                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                        placeholder="Required"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Genre</label>
                      <input 
                        required 
                        type="text" 
                        value={receiveForm.genre} 
                        onChange={e => setReceiveForm({...receiveForm, genre: e.target.value})} 
                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                        placeholder="Required"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">ISBN</label>
                      <div className="flex gap-2">
                        <input 
                          required 
                          type="text" 
                          value={receiveForm.isbn} 
                          onChange={e => setReceiveForm({...receiveForm, isbn: e.target.value})} 
                          className="flex-1 rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm font-mono"
                          placeholder="e.g. 978-3-16-148410-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!receiveForm.isbn) {
                              toast.error('Please enter an ISBN first');
                              return;
                            }
                            lookupIsbn.mutate(receiveForm.isbn);
                          }}
                          disabled={lookupIsbn.isPending}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {lookupIsbn.isPending ? <LoadingSpinner /> : <Search size={16} />}
                          Lookup
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">Type an ISBN and click Lookup to auto-fill metadata for brand new books.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-slate-800 pb-2">Select Book Cover</h3>
                  {isSearchingCovers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3 font-mono">
                      <LoadingSpinner /> Searching online covers...
                    </div>
                  ) : coverCandidates.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 py-2">No online covers found. Auto-fetch will resolve a cover on submit if available.</p>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                      {coverCandidates.map((cand) => {
                        const isSelected = receiveForm.coverUrl === cand.url;
                        return (
                          <button
                            key={cand.url}
                            type="button"
                            onClick={() => setReceiveForm(prev => ({ ...prev, coverUrl: isSelected ? '' : cand.url }))}
                            className={`relative flex-shrink-0 w-24 border-2 rounded-lg overflow-hidden transition-all ${
                              isSelected ? 'border-indigo-600 ring-2 ring-indigo-500 scale-95 shadow-md' : 'border-gray-200 dark:border-slate-800 hover:border-indigo-400'
                            }`}
                          >
                            <img src={cand.url} alt={cand.title || 'Cover candidate'} className="w-full h-32 object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white p-1 text-center truncate">
                              {cand.source}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                <Check size={10} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                    <MapPin size={16} /> Initial Location
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Branch</label>
                      <input 
                        type="text" 
                        value={receiveForm.branch} 
                        onChange={e => setReceiveForm({...receiveForm, branch: e.target.value})} 
                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Section</label>
                      <input 
                        type="text" 
                        value={receiveForm.section} 
                        onChange={e => setReceiveForm({...receiveForm, section: e.target.value})} 
                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Shelf</label>
                      <input 
                        type="text" 
                        value={receiveForm.shelf} 
                        onChange={e => setReceiveForm({...receiveForm, shelf: e.target.value})} 
                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-xl">
                <button 
                  type="button"
                  onClick={() => setReceivingOrder(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={receiveOrder.isPending}
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {receiveOrder.isPending ? <LoadingSpinner /> : 'Confirm & Receive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
