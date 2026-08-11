'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, CheckCircle, Mail } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

export default function SupportTicketsPage() {
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support'],
    queryFn: async () => (await api.get('/support')).data
  });

  const resolveTicket = useMutation({
    mutationFn: async (id: number) => await api.put(`/support/${id}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support'] })
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">User Support</h1>
        <p className="opacity-60 mt-1">Review and resolve issues submitted by library patrons.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center opacity-50 py-10">Loading tickets...</div>
        ) : tickets?.length === 0 ? (
          <div className="text-center opacity-50 py-16">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
            <p>Inbox zero! No pending support tickets.</p>
          </div>
        ) : tickets?.map((ticket: any) => (
          <Card key={ticket.id} surface="light" className={`p-6 border-l-4 ${ticket.status === 'open' ? 'border-amber-500' : 'border-gray-300'}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${ticket.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                    {ticket.status}
                  </span>
                  <span className="text-xs font-mono opacity-50">{new Date(ticket.created_at).toLocaleString()}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{ticket.subject}</h3>
                <p className="text-sm opacity-80 whitespace-pre-wrap">{ticket.message}</p>
                
                <div className="flex items-center gap-2 mt-4 text-xs font-mono opacity-60">
                  <Mail size={14} />
                  <span>Submitted by: {ticket.users.name} ({ticket.users.email})</span>
                </div>
              </div>
              
              {ticket.status === 'open' && (
                <button 
                  onClick={() => resolveTicket.mutate(ticket.id)}
                  disabled={resolveTicket.isPending}
                  className="shrink-0 bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
