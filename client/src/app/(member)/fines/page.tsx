'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import Card from '../../../components/ui/Card';

interface Fine {
  id: number;
  borrowing_id: number;
  amount: number;
  status: string;
  payment_date: string | null;
}

// KNOWN BACKEND LIMITATION: GET /fines is staff-only (authorize(['admin',
// 'librarian'])) and POST /fines/:id/pay is librarian-only - a member
// cannot view or pay their own fines through the current API. See
// (member)/loans/page.tsx for the same note. Showing the real 403 rather
// than a fabricated "pay now" flow that has no working endpoint behind it.
export default function FinesPage() {
  const { user } = useAuthStore();

  const { data: fines, isLoading, isError, error } = useQuery<Fine[]>({
    queryKey: ['fines', user?.id],
    queryFn: async () => (await api.get('/fines')).data,
    retry: false,
  });

  const isForbidden = (err: unknown) =>
    (err as { response?: { status?: number } })?.response?.status === 403;

  const unpaid = (fines ?? []).filter((f) => f.status === 'unpaid');
  const totalOwed = unpaid.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Fines</h1>
          <p className="opacity-60 mt-1">Outstanding balance on your account.</p>
        </div>
        {totalOwed > 0 && (
          <div className="border-2 px-5 py-3 flex items-center gap-3" style={{ borderColor: 'var(--color-signal-overdue)' }}>
            <span className="text-xs uppercase tracking-widest opacity-70 font-mono">Total Due</span>
            <span className="text-xl font-mono font-bold" style={{ color: 'var(--color-signal-overdue)' }}>
              ${totalOwed.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-light)' }} />
          ))}
        </div>
      )}

      {isError && isForbidden(error) && (
        <Card surface="light" className="p-6 flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" style={{ color: 'var(--color-signal-pending)' }} />
          <div>
            <p className="font-bold text-sm">Fines aren&apos;t available to member accounts yet</p>
            <p className="text-sm opacity-70 mt-1">
              This endpoint is currently staff-only - a backend change would be needed to expose it
              to members.
            </p>
          </div>
        </Card>
      )}

      {isError && !isForbidden(error) && (
        <Card surface="light" className="p-6" style={{ color: 'var(--color-signal-overdue)' }}>
          Failed to load fines. Please contact a librarian.
        </Card>
      )}

      {!isLoading && !isError && (fines ?? []).length === 0 && (
        <Card surface="light" className="p-10 text-center">
          <CheckCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--color-signal-available)' }} />
          <h3 className="font-bold mb-1">You are debt-free</h3>
          <p className="opacity-60 text-sm">No outstanding fines on your account.</p>
        </Card>
      )}

      <div className="space-y-3">
        {(fines ?? []).map((fine) => (
          <Card key={fine.id} surface="light" className={`p-5 flex items-center justify-between ${fine.status === 'paid' ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="opacity-60" />
              <div>
                <p className="font-bold text-sm">Fine #{fine.id}</p>
                <p className="text-xs opacity-60 font-mono">Borrowing #{fine.borrowing_id}</p>
              </div>
            </div>
            <span className="font-mono font-bold" style={{ color: fine.status === 'unpaid' ? 'var(--color-signal-overdue)' : undefined }}>
              ${fine.amount.toFixed(2)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
