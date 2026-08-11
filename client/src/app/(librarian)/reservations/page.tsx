'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, XCircle, BookMarked } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface Reservation {
  id: number;
  book_id: number;
  member_id: number;
  reservation_date: string;
  status: string;
  books: { title: string; author: string };
  users: { name: string; email: string };
}

// Now backed by real endpoints: GET /reservations (list, staff-only) and
// POST /reservations/:id/approve, both added alongside this page - neither
// existed before, so this queue previously couldn't be built at all.
export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Reservation[] }>({
    queryKey: ['reservations', 'pending'],
    queryFn: async () => (await api.get('/reservations?status=pending')).data,
  });

  const approve = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/reservations/${id}/approve`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const decline = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reservations/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const pending = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Reservations Queue</h1>
          <p className="opacity-60 mt-1">Approve or decline pending book holds.</p>
        </div>
        <div className="border-2 px-4 py-2 flex items-center gap-3" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
          <Clock size={18} style={{ color: 'var(--color-signal-pending)' }} />
          <span className="font-mono font-bold">{pending.length} Pending</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-dark)' }} />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card surface="dark" className="p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3" style={{ color: 'var(--color-signal-available)' }} />
          <h3 className="font-bold mb-1">Queue is empty</h3>
          <p className="opacity-60 text-sm">No pending reservations to process.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((res) => (
            <Card key={res.id} surface="dark" className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                <BookMarked size={18} className="opacity-60 mt-0.5" />
                <div>
                  <p className="font-bold">{res.books.title}</p>
                  <p className="text-sm opacity-60">by {res.books.author}</p>
                  <p className="text-xs opacity-50 font-mono mt-1">
                    {res.users.name} ({res.users.email}) - {new Date(res.reservation_date).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button
                  onClick={() => approve.mutate(res.id)}
                  isLoading={approve.isPending}
                  className="flex-1 md:flex-none"
                >
                  <CheckCircle2 size={16} /> Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => decline.mutate(res.id)}
                  isLoading={decline.isPending}
                  className="flex-1 md:flex-none"
                >
                  <XCircle size={16} /> Decline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
