'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Clock } from 'lucide-react';

import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

export default function SearchHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['search-history'],
    queryFn: async () => (await api.get('/search-history')).data
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-bold tracking-tight text-gray-900 dark:text-slate-100">Search History</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Review your recent catalog queries.</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-light)' }} />
          ))}
        </div>
      ) : history?.length === 0 ? (
        <Card surface="light" className="p-10 text-center">
          <Search size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold mb-1">No search history</p>
          <p className="opacity-60 text-sm">You haven&apos;t searched for anything yet.</p>
        </Card>
      ) : (
        <Card surface="light" className="overflow-hidden">
          <ul className="divide-y" style={{ borderColor: 'var(--color-signal-border-light)' }}>
            {history?.map((item: { id: number; query: string; timestamp: string }) => (
              <li key={item.id} className="p-4 flex items-center justify-between hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-3">
                  <Search className="text-indigo-600 opacity-60 shrink-0" size={18} />
                  <span className="font-semibold">{item.query}</span>
                </div>
                <span className="text-xs opacity-50 font-mono flex items-center gap-1 shrink-0">
                  <Clock size={12} /> {new Date(item.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
