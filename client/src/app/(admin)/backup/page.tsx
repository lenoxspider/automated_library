'use client';

import { useState } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

interface BackupEntry {
  filename: string;
  created_at: string;
  size: number;
}

export default function BackupPage() {
  const queryClient = useQueryClient();
  const [restoring, setRestoring] = useState(false);

  const { data: backups, isLoading } = useQuery<BackupEntry[]>({
    queryKey: ['backups'],
    queryFn: async () => (await api.get('/backup')).data
  });

  const createBackup = useMutation({
    mutationFn: async () => await api.post('/backup/create'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backups'] })
  });

  const restoreBackup = useMutation({
    mutationFn: async (filename: string) => await api.post('/backup/restore', { filename }),
    onSuccess: () => {
      setRestoring(false);
      alert('Database restored successfully! The application will now reload to flush local state.');
      window.location.reload();
    },
    onError: () => {
      setRestoring(false);
      alert('Restore failed. Check server logs.');
    }
  });

  const handleRestore = (filename: string) => {
    if (confirm(`CRITICAL WARNING: Restoring ${filename} will OVERWRITE the current live database. All changes made after this backup will be permanently lost. The system will briefly enter Maintenance Mode. Proceed?`)) {
      setRestoring(true);
      restoreBackup.mutate(filename);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Database Backup & Restore</h1>
        <p className="opacity-60 mt-1">Manage physical snapshots of the SQLite database.</p>
      </div>

      <Card surface="light" className="p-8 text-center border-dashed border-2">
        <Database size={48} className="mx-auto mb-4 text-indigo-500 opacity-80" />
        <h2 className="font-bold text-lg mb-2">Create New Snapshot</h2>
        <p className="text-sm opacity-60 mb-6">Instantly duplicate the live library.db file into the secure backups directory.</p>
        
        <button 
          onClick={() => createBackup.mutate()}
          disabled={createBackup.isPending || restoring}
          className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg disabled:opacity-50 transition-colors"
        >
          {createBackup.isPending ? 'Generating...' : 'Trigger Backup Now'}
        </button>
      </Card>

      <Card surface="light" className="overflow-hidden">
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 flex items-start gap-3 border-b border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Restoring a database will instantly drop all active API connections, swap the underlying file, and restart Prisma. Use with extreme caution.</p>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-neutral-900 border-b" style={{ borderColor: 'var(--color-signal-border-light)' }}>
            <tr>
              <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Backup File</th>
              <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Date Created</th>
              <th className="px-6 py-4 text-xs font-mono uppercase opacity-60">Size</th>
              <th className="px-6 py-4 text-xs font-mono uppercase opacity-60 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-signal-border-light)' }}>
            {isLoading ? (
              <tr><td colSpan={4}><LoadingSpinner /></td></tr>
            ) : backups?.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 opacity-50">No backups found on disk.</td></tr>
            ) : backups?.map((bk: { filename: string; created_at: string; size: number }) => (
              <tr key={bk.filename} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-bold">{bk.filename}</td>
                <td className="px-6 py-4 text-sm opacity-70">{new Date(bk.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm opacity-70">{(bk.size / 1024).toFixed(2)} KB</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    disabled={restoring}
                    onClick={() => handleRestore(bk.filename)}
                    className="flex items-center justify-end w-full gap-2 text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw size={14} /> Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      
      {restoring && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-2xl flex flex-col items-center">
            <RefreshCw size={40} className="animate-spin text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold font-mono">MAINTENANCE MODE ACTIVE</h3>
            <p className="opacity-70 mt-2">Restoring database snapshot. Please do not close this window...</p>
          </div>
        </div>
      )}
    </div>
  );
}
