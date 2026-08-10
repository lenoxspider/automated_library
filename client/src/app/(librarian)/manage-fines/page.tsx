'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { CreditCard, Search, CheckCircle } from 'lucide-react';

export default function ManageFinesPage() {
  const queryClient = useQueryClient();
  const [searchUserId, setSearchUserId] = useState('');

  // Fetch all unpaid fines across all users for the librarian to manage
  const { data: fines, isLoading } = useQuery({
    queryKey: ['admin-fines'],
    queryFn: async () => {
      // Assuming a generic fines endpoint for admins/librarians returns all fines
      const res = await api.get('/fines'); 
      return res.data;
    }
  });

  const payFine = useMutation({
    mutationFn: async (fineId: number) => {
      await api.post(`/fines/${fineId}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
    }
  });

  const displayFines = fines?.filter((f: any) => 
    f.status === 'unpaid' && (searchUserId === '' || f.userId.toString().includes(searchUserId))
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Fine Processing</h1>
          <p className="text-white/60 mt-1">Accept payments and clear member fines.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" 
            placeholder="Search by Member ID..."
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            className="w-full glass py-2 pl-10 pr-4 outline-none focus:border-(--color-brand-teal)"
          />
        </div>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 text-white/50 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Fine ID</th>
              <th className="p-4 font-semibold">Member ID</th>
              <th className="p-4 font-semibold">Reason</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">Loading...</td>
              </tr>
            ) : displayFines.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/50">No unpaid fines found.</td>
              </tr>
            ) : (
              displayFines.map((fine: any) => (
                <tr key={fine.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-sm">#{fine.id}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-white/10 rounded-md text-sm">User #{fine.userId}</span>
                  </td>
                  <td className="p-4 text-sm text-white/80">{fine.reason || 'Late Return'}</td>
                  <td className="p-4 font-bold text-(--color-brand-amber)">${fine.amount.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => payFine.mutate(fine.id)}
                      disabled={payFine.isPending}
                      className="px-4 py-2 bg-gradient-to-r from-(--color-brand-teal) to-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 ml-auto hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CreditCard size={16} /> Mark Paid
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
