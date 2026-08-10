'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export default function LoansPage() {
  const { user } = useAuthStore();
  
  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: async () => {
      const res = await api.get('/borrowings');
      // Ideally backend filters by user, but let's assume it returns user's loans based on JWT
      return res.data;
    },
    enabled: !!user,
  });

  const getDaysRemaining = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">My Loans</h1>
        <p className="text-white/60 mt-1">Track your borrowed books and return deadlines.</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass h-24 animate-pulse rounded-xl bg-white/5"></div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass bg-(--color-brand-coral)/10 border-(--color-brand-coral)/30 p-6 flex items-center gap-4 text-(--color-brand-coral)">
          <AlertCircle />
          <p>Failed to load your loans.</p>
        </div>
      )}

      {!isLoading && !error && loans?.length === 0 && (
        <div className="glass p-12 text-center text-white/50">
          <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50 text-green-400" />
          <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
          <p>You don't have any active book loans at the moment.</p>
        </div>
      )}

      {!isLoading && !error && loans?.map((loan: any) => {
        const daysRemaining = getDaysRemaining(loan.dueDate);
        const isOverdue = daysRemaining < 0;

        return (
          <div key={loan.id} className={`glass p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${isOverdue ? 'border-(--color-brand-coral)/50 bg-(--color-brand-coral)/5' : ''}`}>
            <div className="flex items-center gap-6 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOverdue ? 'bg-(--color-brand-coral)/20 text-(--color-brand-coral)' : 'bg-(--color-brand-teal)/20 text-(--color-brand-teal)'}`}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{loan.copy.book.title}</h3>
                <p className="text-sm text-white/60">Borrowed: {new Date(loan.borrowDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className={`text-right ${isOverdue ? 'text-(--color-brand-coral)' : 'text-white'}`}>
              <p className="text-sm uppercase tracking-wider font-semibold opacity-80 mb-1">Status</p>
              <div className="text-2xl font-bold font-heading">
                {isOverdue ? `${Math.abs(daysRemaining)} Days Overdue` : `${daysRemaining} Days Left`}
              </div>
              <p className="text-sm opacity-60">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
