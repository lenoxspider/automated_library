'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { BarChart3, AlertTriangle, Users, BookOpen, Download } from 'lucide-react';

export default function ReportsPage() {
  const { data: circulation, isLoading: loadingCirc } = useQuery({
    queryKey: ['reports', 'circulation'],
    queryFn: async () => (await api.get('/reports/circulation')).data
  });

  const { data: blockedUsers, isLoading: loadingBlocked } = useQuery({
    queryKey: ['reports', 'blocked'],
    queryFn: async () => (await api.get('/reports/blocked')).data
  });

  const isLoading = loadingCirc || loadingBlocked;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Reporting Suite</h1>
          <p className="text-white/60 mt-1">Analytics and actionable system audits.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 transition-colors font-semibold rounded-lg">
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--color-brand-teal) rounded-full filter blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="w-12 h-12 rounded-xl bg-(--color-brand-teal)/20 text-(--color-brand-teal) flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-1">Total Circulation</p>
            <h2 className="text-3xl font-heading font-bold">{circulation?.length || 0} <span className="text-sm font-normal text-white/40">loans</span></h2>
          </div>
        </div>

        <div className="glass p-6 rounded-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--color-brand-coral) rounded-full filter blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
          <div className="w-12 h-12 rounded-xl bg-(--color-brand-coral)/20 text-(--color-brand-coral) flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-1">Blocked Accounts</p>
            <h2 className="text-3xl font-heading font-bold">{blockedUsers?.length || 0} <span className="text-sm font-normal text-white/40">users</span></h2>
          </div>
        </div>

        <div className="glass p-6 rounded-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--color-brand-indigo) rounded-full filter blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="w-12 h-12 rounded-xl bg-(--color-brand-indigo)/20 text-(--color-brand-indigo) flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-1">Active Roster</p>
            <h2 className="text-3xl font-heading font-bold">142 <span className="text-sm font-normal text-white/40">users</span></h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 size={18} className="text-(--color-brand-teal)" /> Recent Circulation</h3>
          </div>
          <div className="p-0 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-white/40 uppercase">
                <tr>
                  <th className="p-4 font-semibold">Book</th>
                  <th className="p-4 font-semibold">Member</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                ) : circulation?.slice(0, 5).map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 truncate max-w-[200px]">{log.copy.book.title}</td>
                    <td className="p-4">#{log.userId}</td>
                    <td className="p-4">
                      {log.returnDate ? (
                        <span className="text-green-400">Returned</span>
                      ) : (
                        <span className="text-(--color-brand-amber)">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden flex flex-col border border-(--color-brand-coral)/20">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-(--color-brand-coral)/5">
            <h3 className="font-bold text-lg flex items-center gap-2 text-(--color-brand-coral)"><AlertTriangle size={18} /> High-Risk Blocked Users</h3>
          </div>
          <div className="p-0 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-white/40 uppercase">
                <tr>
                  <th className="p-4 font-semibold">Member ID</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                ) : blockedUsers?.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-white/50">No blocked users detected.</td></tr>
                ) : blockedUsers?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-(--color-brand-coral)">#{user.id}</td>
                    <td className="p-4 font-bold">{user.name}</td>
                    <td className="p-4 text-right">
                      <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
