'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle2, CreditCard, BookMarked, AlertTriangle } from 'lucide-react';
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

// GET /borrowings and GET /fines are now member-scoped: authorize() allows
// 'member', and the controller filters to the caller's own data
// (borrowingRepo.findByMemberId / circulationService.getFinesForMember)
// rather than the caller having to filter a full staff-wide list
// client-side. Previously these were staff-only and a member got 403 -
// see git history for the earlier "not available yet" version of this page.
export default function LoansPage() {
  const { user } = useAuthStore();

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
        <Card surface="light" className="p-6 flex items-start gap-3">
          <BookMarked className="shrink-0 mt-0.5 opacity-60" />
          <div>
            <p className="font-bold text-sm">Personal reservation list isn&apos;t available yet</p>
            <p className="text-sm opacity-70 mt-1">
              GET /reservations lists everyone&apos;s holds for staff, but it isn&apos;t scoped to a
              single member yet - unlike loans/fines above, this gap hasn&apos;t been closed.
            </p>
          </div>
        </Card>
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
