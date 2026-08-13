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
        <h1 className="text-3xl font-mono font-bold tracking-tight text-gray-900 dark:text-slate-100">Fine Processing</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Accept payments and clear outstanding fines.</p>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
            <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
              <th className="px-6 py-4 font-semibold">Fine ID</th>
              <th className="px-6 py-4 font-semibold">Borrowing ID</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : unpaid.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-500 dark:text-slate-400">
                  <CheckCircle size={24} className="mx-auto mb-2 text-green-500 dark:text-green-400" />
                  No unpaid fines.
                </td>
              </tr>
            ) : (
              unpaid.map((fine) => (
                <tr key={fine.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">#{fine.id}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-700 dark:text-slate-300">#{fine.borrowing_id}</td>
                  <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                    ${fine.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
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
