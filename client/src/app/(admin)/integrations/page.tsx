'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Webhook } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [serviceName, setServiceName] = useState('');
  const [token, setToken] = useState('');

  const { data: keys, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => (await api.get('/integrations')).data
  });

  const createKey = useMutation({
    mutationFn: async (data: unknown) => await api.post('/integrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setServiceName('');
      setToken('');
    }
  });

  const revokeKey = useMutation({
    mutationFn: async (id: number) => await api.delete(`/integrations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] })
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">API & Integrations</h1>
        <p className="opacity-60 mt-1">Manage external service tokens and webhooks.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card surface="light" className="p-6">
            <h2 className="font-bold mb-4 font-mono uppercase tracking-widest text-xs opacity-60">Add New Key</h2>
            <form onSubmit={e => { e.preventDefault(); createKey.mutate({ service_name: serviceName, token }); }} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 opacity-70">Service Name (e.g. SendGrid, Stripe)</label>
                <input required type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} className="w-full border-2 px-3 py-2 bg-transparent outline-none" style={{ borderColor: 'var(--color-signal-border-light)' }} />
              </div>
              <div>
                <label className="block text-sm mb-1 opacity-70">Secure Token / Secret</label>
                <input required type="password" value={token} onChange={e => setToken(e.target.value)} className="w-full border-2 px-3 py-2 bg-transparent outline-none font-mono" style={{ borderColor: 'var(--color-signal-border-light)' }} />
              </div>
              <button disabled={createKey.isPending} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg mt-2">
                Save Integration
              </button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card surface="light" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-neutral-900 border-b" style={{ borderColor: 'var(--color-signal-border-light)' }}>
                  <tr>
                    <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Service</th>
                    <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Status</th>
                    <th className="px-6 py-4 text-xs font-mono uppercase opacity-60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-signal-border-light)' }}>
                  {isLoading ? (
                    <tr><td colSpan={3} className="text-center py-8 opacity-50">Loading keys...</td></tr>
                  ) : keys?.map((k: { id: number; service_name: string; status: string; created_at: string }) => (
                    <tr key={k.id} className={`hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${k.status === 'revoked' ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Webhook size={16} className="text-indigo-500" />
                          <div>
                            <p className="font-bold">{k.service_name}</p>
                            <p className="text-xs font-mono">Added: {new Date(k.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${k.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {k.status === 'active' && (
                          <button onClick={() => revokeKey.mutate(k.id)} className="text-red-500 hover:text-red-700 p-2">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
