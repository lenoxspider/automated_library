'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserX, DownloadCloud, ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

export default function CompliancePage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: async () => (await api.get('/compliance')).data
  });

  const processRequest = useMutation({
    mutationFn: async (id: number) => await api.put(`/compliance/${id}/process`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['compliance'] })
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Compliance & GDPR</h1>
        <p className="opacity-60 mt-1">Handle data subject privacy requests and retention policies.</p>
      </div>

      <Card surface="light" className="overflow-hidden">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 flex items-center gap-3 border-b border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-400">
          <ShieldAlert size={20} />
          <p className="text-sm font-medium">Processing an ACCOUNT_DELETION request will permanently destroy the user record and cascade through borrowings, fines, and logs.</p>
        </div>
        
        <div className="p-6">
          <h2 className="font-bold text-lg mb-4">Pending Requests</h2>
          <div className="grid gap-4">
            {isLoading ? (
              <p className="text-center opacity-50 py-4">Loading requests...</p>
            ) : requests?.length === 0 ? (
              <p className="text-center opacity-50 py-4">No active compliance requests.</p>
            ) : requests?.map((req: any) => (
              <div key={req.id} className={`border rounded-lg p-4 flex items-center justify-between ${req.status === 'completed' ? 'opacity-50' : 'bg-white dark:bg-neutral-900'}`} style={{ borderColor: 'var(--color-signal-border-light)' }}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${req.request_type === 'ACCOUNT_DELETION' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {req.request_type === 'ACCOUNT_DELETION' ? <UserX size={24} /> : <DownloadCloud size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold font-mono text-sm">{req.request_type}</span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded ${req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm opacity-70">Member ID: {req.member_id} • Submitted: {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {req.status === 'pending' && (
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to process this ${req.request_type} request? This cannot be undone.`)) {
                        processRequest.mutate(req.id);
                      }
                    }}
                    disabled={processRequest.isPending}
                    className="shrink-0 bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    Fulfill Request
                  </button>
                )}
                {req.status === 'completed' && <CheckCircle className="text-green-500" />}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
