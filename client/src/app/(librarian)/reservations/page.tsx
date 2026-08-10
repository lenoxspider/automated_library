'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await api.get('/reservations'); // Assume this endpoint returns all pending reservations for librarians
      return res.data;
    }
  });

  const processReservation = useMutation({
    mutationFn: async ({ id, action }: { id: number, action: 'approve' | 'cancel' }) => {
      // In a real system, approving might mean assigning a copy or changing status
      // We'll simulate it by calling a theoretical endpoint
      if (action === 'cancel') {
        await api.delete(`/reservations/${id}`);
      } else {
        await api.post(`/reservations/${id}/approve`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  });

  // For UI mockup purposes, we'll just filter out ones we process
  const pendingReservations = reservations?.filter((r: any) => r.status === 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Reservations Queue</h1>
          <p className="text-white/60 mt-1">Manage pending book holds placed by members.</p>
        </div>
        <div className="glass px-4 py-2 rounded-lg flex items-center gap-3">
          <Clock className="text-(--color-brand-amber)" size={20} />
          <span className="font-bold">{pendingReservations.length} Pending</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass h-24 animate-pulse rounded-xl bg-white/5"></div>
          ))}
        </div>
      ) : pendingReservations.length === 0 ? (
        <div className="glass p-12 text-center text-white/50">
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50 text-green-400" />
          <h3 className="text-xl font-bold mb-2">Queue is Empty</h3>
          <p>There are no pending reservations to process.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingReservations.map((res: any) => (
            <div key={res.id} className="glass p-5 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white/5 transition-colors">
              <div>
                <p className="text-xs text-(--color-brand-teal) font-bold uppercase tracking-wider mb-1">Hold Placed</p>
                <h3 className="font-bold text-lg">{res.book?.title || 'Unknown Book'}</h3>
                <p className="text-sm text-white/60">Requested by Member #{res.userId} • {new Date(res.reservationDate).toLocaleString()}</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => processReservation.mutate({ id: res.id, action: 'approve' })}
                  disabled={processReservation.isPending}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all font-semibold"
                >
                  <CheckCircle2 size={18} /> Approve
                </button>
                <button 
                  onClick={() => processReservation.mutate({ id: res.id, action: 'cancel' })}
                  disabled={processReservation.isPending}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-(--color-brand-coral)/20 text-(--color-brand-coral) hover:bg-(--color-brand-coral) hover:text-white rounded-lg transition-all font-semibold"
                >
                  <XCircle size={18} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
