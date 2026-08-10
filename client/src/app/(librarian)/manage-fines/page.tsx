'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, CheckCircle } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface Fine {
  id: number;
  borrowing_id: number;
  amount: number;
  status: string;
}

// Rebuilt against the real Fine shape returned by GET /fines
// ({ id, borrowing_id, amount, status, payment_date }) - the previous
// version referenced fine.userId and fine.reason, neither of which exist
// on the model, so it never actually rendered real data correctly.
export default function ManageFinesPage() {
  const queryClient = useQueryClient();

  const { data: fines, isLoading } = useQuery<Fine[]>({
    queryKey: ['admin-fines'],
    queryFn: async () => (await api.get('/fines')).data,
  });

  const payFine = useMutation({
    mutationFn: async (fineId: number) => {
      await api.post(`/fines/${fineId}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
    },
  });

  const unpaid = (fines ?? []).filter((f) => f.status === 'unpaid');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Fine Processing</h1>
        <p className="opacity-60 mt-1">Accept payments and clear outstanding fines.</p>
      </div>

      <Card surface="dark" className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wider opacity-60 border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
              <th className="p-4 font-mono font-normal">Fine ID</th>
              <th className="p-4 font-mono font-normal">Borrowing ID</th>
              <th className="p-4 font-mono font-normal">Amount</th>
              <th className="p-4 font-mono font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center opacity-60">
                  Loading...
                </td>
              </tr>
            ) : unpaid.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center opacity-60">
                  <CheckCircle size={24} className="mx-auto mb-2" style={{ color: 'var(--color-signal-available)' }} />
                  No unpaid fines.
                </td>
              </tr>
            ) : (
              unpaid.map((fine) => (
                <tr key={fine.id} className="border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
                  <td className="p-4 font-mono text-sm">#{fine.id}</td>
                  <td className="p-4 font-mono text-sm opacity-70">#{fine.borrowing_id}</td>
                  <td className="p-4 font-mono font-bold" style={{ color: 'var(--color-signal-pending)' }}>
                    ${fine.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="secondary"
                      onClick={() => payFine.mutate(fine.id)}
                      isLoading={payFine.isPending}
                      className="ml-auto"
                    >
                      <CreditCard size={14} /> Mark Paid
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
