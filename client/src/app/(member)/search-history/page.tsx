'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Clock } from 'lucide-react';

import api from '../../../lib/api';

export default function SearchHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['search-history'],
    queryFn: async () => (await api.get('/search-history')).data
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-bold tracking-tight">Search History</h1>
        <p className="opacity-60 mt-1">Review your recent catalog queries.</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--color-signal-border-light)' }}>
          {history?.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-mono text-sm">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>You haven&apos;t searched for anything yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {history?.map((item: { id: number; query: string; timestamp: string }) => (
                <li key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="text-indigo-600 opacity-60" size={18} />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{item.query}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <Clock size={12} /> {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
