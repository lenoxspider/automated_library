'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';

interface CirculationLog {
  id: number;
  member: string;
  book: string;
  barcode: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
}

interface BlockedMember {
  id: number;
  name: string;
  email: string;
  reason: string;
  unpaid_fines: number;
}

// Fixed to match the real report envelope ({ data, count }, not a bare
// array) and the real flattened field names (log.book / log.member /
// log.return_date, not log.copy.book.title / log.userId / log.returnDate).
export default function ReportsPage() {
  const { data: circulation, isLoading: loadingCirc } = useQuery<{ data: CirculationLog[]; count: number }>({
    queryKey: ['reports', 'circulation'],
    queryFn: async () => (await api.get('/reports/circulation')).data,
  });

  const { data: blocked, isLoading: loadingBlocked } = useQuery<{ data: BlockedMember[]; count: number }>({
    queryKey: ['reports', 'blocked'],
    queryFn: async () => (await api.get('/reports/blocked')).data,
  });

  const logs = circulation?.data ?? [];
  const blockedUsers = blocked?.data ?? [];
  const isLoading = loadingCirc || loadingBlocked;

  const activeCount = logs.filter((l) => !l.return_date).length;
  const overdueCount = logs.filter((l) => !l.return_date && new Date(l.due_date) < new Date()).length;
  const overdueRate = logs.length > 0 ? Math.round((overdueCount / logs.length) * 100) : 0;

  // Most-borrowed titles, computed client-side from the circulation log -
  // no charting library, plain divs sized by relative count.
  const byTitle = new Map<string, number>();
  logs.forEach((l) => byTitle.set(l.book, (byTitle.get(l.book) ?? 0) + 1));
  const topTitles = Array.from(byTitle.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = topTitles[0]?.[1] ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Reports</h1>
        <p className="opacity-60 mt-1">Circulation analytics and system alerts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card surface="dark" className="p-5 flex items-center gap-4">
          <BookOpen size={22} style={{ color: 'var(--color-signal-available)' }} />
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60 font-mono mb-1">Active Loans</p>
            <p className="text-2xl font-mono font-bold">{activeCount}</p>
          </div>
        </Card>
        <Card surface="dark" className="p-5 flex items-center gap-4">
          <AlertTriangle size={22} style={{ color: 'var(--color-signal-overdue)' }} />
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60 font-mono mb-1">Overdue Rate</p>
            <p className="text-2xl font-mono font-bold">{overdueRate}%</p>
          </div>
        </Card>
        <Card surface="dark" className="p-5 flex items-center gap-4">
          <AlertTriangle size={22} style={{ color: 'var(--color-signal-pending)' }} />
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60 font-mono mb-1">Flagged Accounts</p>
            <p className="text-2xl font-mono font-bold">{blockedUsers.length}</p>
          </div>
        </Card>
      </div>

      <Card surface="dark" className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={16} style={{ color: 'var(--color-signal-available)' }} /> Most Borrowed
        </h3>
        {isLoading ? (
          <p className="opacity-60 text-sm">Loading...</p>
        ) : topTitles.length === 0 ? (
          <p className="opacity-60 text-sm">No circulation data yet.</p>
        ) : (
          <div className="space-y-3">
            {topTitles.map(([title, count]) => (
              <div key={title}>
                <div className="flex justify-between text-sm font-mono mb-1">
                  <span className="truncate pr-4">{title}</span>
                  <span className="opacity-60">{count}</span>
                </div>
                <div className="h-2 bg-white/5 w-full">
                  <div
                    className="h-full"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      backgroundColor: 'var(--color-signal-available)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card surface="dark" className="overflow-hidden" style={{ borderColor: 'var(--color-signal-overdue)' }}>
        <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-signal-overdue)' }} />
          <h3 className="font-bold">System Alerts - Flagged Accounts</h3>
        </div>
        {blockedUsers.length === 0 ? (
          <p className="p-8 text-center opacity-60 text-sm">No flagged accounts.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <tbody>
              {blockedUsers.map((u) => (
                <tr key={u.id} className="border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
                  <td className="p-4 font-mono opacity-70">#{u.id}</td>
                  <td className="p-4 font-bold">{u.name}</td>
                  <td className="p-4 opacity-70">{u.reason}</td>
                  <td className="p-4 text-right font-mono" style={{ color: 'var(--color-signal-overdue)' }}>
                    {u.unpaid_fines > 0 ? `$${u.unpaid_fines.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
