'use client';

import { useState } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Truck, Clock } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

export default function AcquisitionsPage() {
  const queryClient = useQueryClient();
  const [newOrder, setNewOrder] = useState({ title: '', vendor: '', quantity: 1, total_price: 0 });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['acquisitions'],
    queryFn: async () => (await api.get('/acquisitions')).data
  });

  const createOrder = useMutation({
    mutationFn: async (data: unknown) => await api.post('/acquisitions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquisitions'] });
      setNewOrder({ title: '', vendor: '', quantity: 1, total_price: 0 });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.put(`/acquisitions/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['acquisitions'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate(newOrder);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Acquisitions</h1>
        <p className="opacity-60 mt-1">Manage purchase orders and vendor relations.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card surface="light" className="p-6">
            <h2 className="font-bold mb-4 font-mono uppercase tracking-widest text-xs opacity-60">New Purchase Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 opacity-70">Book Title</label>
                <input required type="text" value={newOrder.title} onChange={e => setNewOrder({...newOrder, title: e.target.value})} className="w-full border-2 px-3 py-2 bg-transparent outline-none" style={{ borderColor: 'var(--color-signal-border-light)' }} />
              </div>
              <div>
                <label className="block text-sm mb-1 opacity-70">Vendor</label>
                <input required type="text" value={newOrder.vendor} onChange={e => setNewOrder({...newOrder, vendor: e.target.value})} className="w-full border-2 px-3 py-2 bg-transparent outline-none" style={{ borderColor: 'var(--color-signal-border-light)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 opacity-70">Quantity</label>
                  <input required type="number" min="1" value={newOrder.quantity} onChange={e => setNewOrder({...newOrder, quantity: parseInt(e.target.value)})} className="w-full border-2 px-3 py-2 bg-transparent outline-none" style={{ borderColor: 'var(--color-signal-border-light)' }} />
                </div>
                <div>
                  <label className="block text-sm mb-1 opacity-70">Total ($)</label>
                  <input required type="number" min="0" step="0.01" value={newOrder.total_price} onChange={e => setNewOrder({...newOrder, total_price: parseFloat(e.target.value)})} className="w-full border-2 px-3 py-2 bg-transparent outline-none" style={{ borderColor: 'var(--color-signal-border-light)' }} />
                </div>
              </div>
              <button disabled={createOrder.isPending} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg mt-2">
                {createOrder.isPending ? 'Submitting...' : 'Submit Order'}
              </button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card surface="light" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-slate-700 border-b" style={{ borderColor: 'var(--color-signal-border-light)' }}>
                  <tr>
                    <th className="px-6 py-4 text-xs font-mono uppercase text-gray-700 dark:text-gray-300 font-bold">Title</th>
                    <th className="px-6 py-4 text-xs font-mono uppercase text-gray-700 dark:text-gray-300 font-bold">Vendor</th>
                    <th className="px-6 py-4 text-xs font-mono uppercase text-gray-700 dark:text-gray-300 font-bold">Status</th>
                    <th className="px-6 py-4 text-xs font-mono uppercase text-gray-700 dark:text-gray-300 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-signal-border-light)' }}>
                  {isLoading ? (
                    <tr><td colSpan={4}><LoadingSpinner /></td></tr>
                  ) : orders?.map((order: { id: number; title: string; vendor: string; quantity: number; total_price: number; status: string; order_date?: string }) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{order.title}</p>
                        <p className="text-xs opacity-60">{new Date(order.order_date ?? '').toLocaleDateString()} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ {order.quantity} copies ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ ${order.total_price}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">{order.vendor}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          order.status === 'received' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {order.status === 'pending' && <Clock size={12} />}
                          {order.status === 'approved' && <Truck size={12} />}
                          {order.status === 'received' && <CheckCircle size={12} />}
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {order.status === 'pending' && (
                          <button onClick={() => updateStatus.mutate({ id: order.id, status: 'approved' })} className="text-xs text-indigo-600 font-bold hover:underline">Approve</button>
                        )}
                        {order.status === 'approved' && (
                          <button onClick={() => updateStatus.mutate({ id: order.id, status: 'received' })} className="text-xs text-green-600 font-bold hover:underline">Mark Received</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
