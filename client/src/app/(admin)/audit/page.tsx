'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Clock, ShieldAlert, Search, Filter } from 'lucide-react';
import api from '../../../lib/api';

interface AuditLog {
  id: number;
  admin_id: number;
  action: string;
  details?: string | null;
  timestamp: string;
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit'],
    queryFn: async () => (await api.get('/audit')).data
  });

  const uniqueActions = useMemo(() => {
    if (!logs) return [];
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
      const detailsMatch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const adminMatch = log.admin_id.toString().includes(searchTerm);
      const matchesSearch = searchTerm === '' || detailsMatch || adminMatch;
      return matchesAction && matchesSearch;
    });
  }, [logs, searchTerm, selectedAction]);

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) return 'bg-green-500/20 text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-blue-500/20 text-blue-500 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    return 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]';
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)]">
      {/* Decorative Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-red-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
            Audit Log
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Immutable record of privileged system actions.</p>
        </div>

        {/* Main Glassmorphic Container */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden relative">
          
          {/* Strict Compliance Banner */}
          <div className="relative bg-red-50/80 dark:bg-red-950/40 p-4 border-b border-red-200/50 dark:border-red-900/50 flex items-center gap-4 overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
            <ShieldAlert className="text-red-600 dark:text-red-500 ml-2" size={24} />
            <p className="font-mono text-sm font-bold tracking-wider text-red-800 dark:text-red-400">
              STRICT COMPLIANCE MODE: READ-ONLY LOGS
            </p>
          </div>

          {/* Controls Bar */}
          <div className="p-4 md:p-6 border-b border-gray-200/50 dark:border-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40 dark:bg-slate-900/40">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search details or Admin ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all backdrop-blur-sm"
              />
            </div>

            {/* Filter */}
            <div className="relative w-full md:w-64 flex items-center gap-2">
              <Filter size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white appearance-none transition-all cursor-pointer backdrop-blur-sm font-medium"
              >
                <option value="ALL">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-md z-10 border-b border-gray-200/50 dark:border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Admin ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-1/2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="group hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg relative"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 font-mono">
                          <Clock size={14} className="opacity-50 group-hover:opacity-100 transition-opacity text-indigo-500" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-gray-200 dark:border-slate-700">
                          #{log.admin_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 font-medium">
                        {log.details || <span className="opacity-40 italic">No additional details</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
