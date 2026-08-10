'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function FinesPage() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const { data: fines, isLoading, error } = useQuery({
    queryKey: ['fines'],
    queryFn: async () => {
      const res = await api.get('/fines'); // Assuming the API returns the user's fines based on JWT
      return res.data;
    }
  });

  const payFine = useMutation({
    mutationFn: async (fineId: number) => {
      await api.post(`/fines/${fineId}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  const handlePayment = (id: number) => {
    setProcessingId(id);
    // Simulate payment gateway delay
    setTimeout(() => {
      payFine.mutate(id);
    }, 1500);
  };

  const totalOwed = fines?.reduce((sum: number, fine: any) => 
    fine.status === 'unpaid' ? sum + fine.amount : sum, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Outstanding Fines</h1>
          <p className="text-white/60 mt-1">Manage and pay your library fines here.</p>
        </div>
        <div className="glass px-6 py-3 rounded-xl flex items-center gap-4 bg-(--color-brand-indigo)/20">
          <span className="text-sm uppercase tracking-widest opacity-80">Total Due</span>
          <span className="text-2xl font-bold text-(--color-brand-amber)">${totalOwed.toFixed(2)}</span>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass h-24 animate-pulse rounded-xl bg-white/5"></div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass bg-(--color-brand-coral)/10 border-(--color-brand-coral)/30 p-6 flex items-center gap-4 text-(--color-brand-coral)">
          <AlertCircle />
          <p>Failed to load your fines. Please contact a librarian.</p>
        </div>
      )}

      {!isLoading && !error && fines?.length === 0 && (
        <div className="glass p-12 text-center text-white/50">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50 text-green-400" />
          <h3 className="text-xl font-bold mb-2">You are debt-free!</h3>
          <p>You have no outstanding fines on your account.</p>
        </div>
      )}

      <div className="grid gap-4">
        {!isLoading && !error && fines?.map((fine: any) => (
          <div key={fine.id} className={`glass p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${fine.status === 'paid' ? 'opacity-50 grayscale' : ''}`}>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">
                Issued on {new Date(fine.issuedAt).toLocaleDateString()}
              </p>
              <h3 className="font-bold text-lg">Overdue Fine for "{fine.borrowing?.copy?.book?.title || 'Unknown Book'}"</h3>
              <p className="text-sm text-white/60">{fine.reason || 'Late return'}</p>
            </div>
            
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="text-2xl font-bold text-(--color-brand-amber)">
                ${fine.amount.toFixed(2)}
              </div>
              
              {fine.status === 'unpaid' ? (
                <button
                  onClick={() => handlePayment(fine.id)}
                  disabled={processingId === fine.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-(--color-brand-amber) to-orange-500 hover:from-orange-500 hover:to-(--color-brand-amber) text-white font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === fine.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay Now
                    </>
                  )}
                </button>
              ) : (
                <div className="px-6 py-3 bg-green-500/10 text-green-400 font-bold rounded-lg border border-green-500/20 flex items-center gap-2">
                  <CheckCircle size={18} />
                  Paid
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
