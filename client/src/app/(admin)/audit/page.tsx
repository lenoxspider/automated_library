'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, ShieldAlert } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

interface AuditLog {
  id: number;
  admin_id: number;
  action: string;
  details?: string | null;
  timestamp: string;
}

export default function AuditLogPage() {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit'],
    queryFn: async () => (await api.get('/audit')).data
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Audit Log</h1>
        <p className="opacity-60 mt-1">Immutable record of privileged system actions.</p>
      </div>

      <Card surface="light" className="overflow-hidden border border-red-500/20">
        <div className="bg-red-50 dark:bg-red-900/10 p-4 flex items-center gap-3 border-b border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400">
          <ShieldAlert size={20} />
          <p className="font-mono text-sm font-bold">STRICT COMPLIANCE MODE: READ-ONLY LOGS</p>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-neutral-900 border-b sticky top-0" style={{ borderColor: 'var(--color-signal-border-light)' }}>
              <tr>
                <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Timestamp</th>
                <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Admin ID</th>
                <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Action</th>
                <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-signal-border-light)' }}>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 opacity-50">Loading logs...</td></tr>
              ) : logs?.map((log: { id: number; admin_id: number; action: string; details?: string | null; timestamp: string }) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-mono text-sm">
                  <td className="px-6 py-4 flex items-center gap-2 opacity-70">
                    <Clock size={14} /> {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{log.admin_id}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{log.action}</td>
                  <td className="px-6 py-4 opacity-80">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
