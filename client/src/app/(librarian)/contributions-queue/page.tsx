'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import { Check, X, User } from 'lucide-react';

export default function ContributionsQueuePage() {
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ['contributions-queue'],
    queryFn: async () => (await api.get('/contributions/queue')).data
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/contributions/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributions-queue'] })
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => await api.put(`/contributions/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributions-queue'] })
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Contributions Queue</h1>
        <p className="opacity-60 mt-1">Review community metadata submissions. Approvals automatically award +10 Points.</p>
      </div>

      <div className="space-y-4">
        {queue?.length === 0 && (
          <Card surface="light" className="p-12 text-center">
            <p className="opacity-50 text-lg">The queue is empty. Great job!</p>
          </Card>
        )}

        {queue?.map((item: { id: number; content: string; contribution_type: string; books?: { title?: string } | null; users: { name: string; library_points: number } }) => (
          <Card key={item.id} surface="light" className="p-5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center border-l-4 border-indigo-500">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="uppercase text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded tracking-wider">
                  {item.contribution_type}
                </span>
                <span className="font-semibold text-sm opacity-60">{item.books?.title}</span>
              </div>
              <p className="text-base">{item.content}</p>
              <div className="flex items-center gap-2 text-xs opacity-50 pt-2">
                <User size={14} />
                <span>{item.users.name} ({item.users.library_points} pts)</span>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => approveMutation.mutate(item.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
              >
                <Check size={16} /> Approve
              </button>
              <button 
                onClick={() => rejectMutation.mutate(item.id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
              >
                <X size={16} /> Reject
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
