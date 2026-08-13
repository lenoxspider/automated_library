'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Clock, CheckCircle2, CreditCard, BookMarked, AlertTriangle, X } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';
import DueDateProgress from '../../../components/ui/DueDateProgress';

interface Borrowing {
  id: number;
  copy_id: number;
  member_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
}

interface Fine {
  id: number;
  borrowing_id: number;
  amount: number;
  status: string;
}

interface MyReservation {
  id: number;
  book_id: number;
  status: string;
  queue_position: number | null;
  reservation_date: string;
  books: { id: number; title: string };
}

// GET /borrowings and GET /fines are now member-scoped: authorize() allows
// 'member', and the controller filters to the caller's own data
// (borrowingRepo.findByMemberId / circulationService.getFinesForMember)
// rather than the caller having to filter a full staff-wide list
// client-side. Previously these were staff-only and a member got 403 -
// see git history for the earlier "not available yet" version of this page.
export default function LoansPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loansQuery = useQuery<{ data: Borrowing[] }>({
    queryKey: ['loans', user?.id],
    queryFn: async () => (await api.get('/borrowings')).data,
    enabled: !!user,
  });

  const finesQuery = useQuery<Fine[]>({
    queryKey: ['fines', user?.id],
    queryFn: async () => (await api.get('/fines')).data,
    enabled: !!user,
  });

  const reservationsQuery = useQuery<MyReservation[]>({
    queryKey: ['my-reservations', user?.id],
    queryFn: async () => (await api.get('/reservations/my')).data,
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      setCancellingId(id);
      await api.delete(`/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations', user?.id] });
    },
    onSettled: () => setCancellingId(null),
  });

  const reservations = reservationsQuery.data ?? [];

  const loans = loansQuery.data?.data ?? [];
  const activeLoans = loans.filter((l) => !l.return_date);
  const history = loans.filter((l) => l.return_date);

  const fines = (finesQuery.data ?? []).filter((f) => f.status === 'unpaid');
  const totalOwed = fines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">My Dashboard</h1>
        <p className="opacity-60 mt-1">Loans, fines, and reservation status.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">Active Loans</h2>

        {loansQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-light)' }} />
            ))}
          </div>
        )}

        {loansQuery.isError && (
          <Card surface="light" className="p-6 flex items-center gap-3" style={{ color: 'var(--color-signal-overdue)' }}>
            <AlertTriangle size={18} />
            Failed to load your loans.
          </Card>
        )}

        {loansQuery.isSuccess && activeLoans.length === 0 && (
          <Card surface="light" className="p-8 text-center">
            <CheckCircle2 className="mx-auto mb-2" style={{ color: 'var(--color-signal-available)' }} />
            <p className="font-bold">You&apos;re all caught up</p>
            <p className="opacity-60 text-sm">No active loans right now.</p>
          </Card>
        )}

        {activeLoans.map((loan) => {
          const isOverdue = new Date(loan.due_date) < new Date();
          return (
            <Card key={loan.id} surface="light" className="p-5">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="opacity-60" />
                  <div>
                    <p className="font-bold text-sm">Copy #{loan.copy_id}</p>
                    <p className="text-xs opacity-60 font-mono">
                      Due {new Date(loan.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={isOverdue ? 'overdue' : 'checked_out'} />
              </div>
              <DueDateProgress borrowDate={loan.borrow_date} dueDate={loan.due_date} />
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">Fines</h2>

        {finesQuery.isLoading && (
          <div className="h-16 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-light)' }} />
        )}

        {finesQuery.isError && (
          <Card surface="light" className="p-6 flex items-center gap-3" style={{ color: 'var(--color-signal-overdue)' }}>
            <AlertTriangle size={18} />
            Failed to load your fines.
          </Card>
        )}

        {finesQuery.isSuccess && (
          <Card surface="light" className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="opacity-60" />
              <span className="text-sm font-bold">
                {fines.length === 0 ? 'No unpaid fines' : `${fines.length} unpaid fine(s)`}
              </span>
            </div>
            {totalOwed > 0 && (
              <span className="font-mono font-bold" style={{ color: 'var(--color-signal-overdue)' }}>
                ${totalOwed.toFixed(2)}
              </span>
            )}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">Reservation Queue</h2>

        {reservationsQuery.isLoading && (
          <div className="h-20 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-light)' }} />
        )}

        {reservationsQuery.isError && (
          <Card surface="light" className="p-6 flex items-center gap-3" style={{ color: 'var(--color-signal-overdue)' }}>
            <AlertTriangle size={18} />
            Failed to load your reservations.
          </Card>
        )}

        {reservationsQuery.isSuccess && reservations.length === 0 && (
          <Card surface="light" className="p-8 text-center">
            <BookMarked className="mx-auto mb-2 opacity-60" />
            <p className="font-bold">No active reservations</p>
            <p className="opacity-60 text-sm">Books you reserve will show up here with your queue position.</p>
          </Card>
        )}

        {reservations.map((r) => (
          <Card key={r.id} surface="light" className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookMarked size={18} className="opacity-60 shrink-0" />
              <div>
                <p className="font-bold text-sm">{r.books.title}</p>
                <p className="text-xs opacity-60 font-mono mt-0.5">
                  {r.status === 'pending' && r.queue_position
                    ? `Queue position #${r.queue_position} — estimated wait ~${r.queue_position * 7} days`
                    : r.status === 'ready_for_pickup'
                    ? 'Ready for pickup at the library'
                    : r.status === 'approved'
                    ? 'Approved — awaiting pickup notice'
                    : r.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  r.status === 'ready_for_pickup'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : r.status === 'approved'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                {r.status.replace(/_/g, ' ')}
              </span>
              <button
                onClick={() => cancelMutation.mutate(r.id)}
                disabled={cancellingId === r.id}
                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-40"
                title="Cancel reservation"
              >
                <X size={16} />
              </button>
            </div>
          </Card>
        ))}
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest opacity-60">Borrowing History</h2>
          <div className="space-y-2">
            {history.map((loan) => (
              <Card key={loan.id} surface="light" className="p-4 flex items-center justify-between text-sm">
                <span className="font-mono opacity-70">Copy #{loan.copy_id}</span>
                <span className="opacity-60">
                  Returned {loan.return_date && new Date(loan.return_date).toLocaleDateString()}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
