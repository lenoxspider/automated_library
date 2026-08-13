'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScanLine, ArrowRightLeft, BookUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';

interface Borrowing {
  id: number;
  copy_id: number;
  member_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
}

// Fixed to match the real API contract: POST /borrowings takes
// { copy_id, member_id } (not copyId/userId), and returning a book is
// POST /borrowings/return/:id with the borrowing id in the URL - not a
// copyId in the body, as the previous version of this page assumed.
export default function CirculationDesk() {
  const [barcode, setBarcode] = useState('');
  const [memberId, setMemberId] = useState('');
  const [mode, setMode] = useState<'checkout' | 'return'>('checkout');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: borrowingsRes } = useQuery<{ data: Borrowing[] }>({
    queryKey: ['borrowings'],
    queryFn: async () => (await api.get('/borrowings')).data,
  });

  const overdue = (borrowingsRes?.data ?? []).filter(
    (b) => !b.return_date && new Date(b.due_date) < new Date()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'checkout') {
        if (!memberId) {
          setMessage({ type: 'error', text: 'Member ID is required for checkout.' });
          setLoading(false);
          return;
        }
        await api.post('/borrowings', {
          copy_barcode: barcode,
          member_identifier: memberId,
        });
        setMessage({ type: 'success', text: `Checked out copy #${barcode} to member #${memberId}` });
      } else {
        await api.post(`/borrowings/return/${barcode}`);
        setMessage({ type: 'success', text: `Processed return for borrowing #${barcode}` });
      }
      setBarcode('');
      if (mode === 'checkout') setMemberId('');
    } catch (err: unknown) {
      const text =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to process transaction. Check inputs.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-mono font-bold tracking-tight mb-2">Circulation Desk</h1>
        <p className="opacity-60">Process checkouts and returns.</p>
      </div>

      <div className="flex justify-center gap-3">
        {(['checkout', 'return'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setMessage(null);
            }}
            className="flex items-center gap-2 px-6 py-3 border-2 font-mono text-sm font-bold uppercase tracking-wider transition-colors"
            style={
              mode === m
                ? { borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }
                : { borderColor: 'var(--color-signal-border-dark)', opacity: 0.6 }
            }
          >
            {m === 'checkout' ? <ArrowRightLeft size={18} /> : <BookUp size={18} />}
            {m === 'checkout' ? 'Checkout' : 'Return'}
          </button>
        ))}
      </div>

      <Card surface="dark" className="p-8">
        {message && (
          <div
            className="mb-6 p-4 flex items-center gap-3 border-2 font-mono text-sm"
            style={
              message.type === 'success'
                ? { borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }
                : { borderColor: 'var(--color-signal-overdue)', color: 'var(--color-signal-overdue)' }
            }
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-3">
              Scan Book Barcode
            </label>
            <div className="relative flex items-center">
              <ScanLine className="absolute left-4 opacity-40" size={22} />
              <input
                type="text"
                autoFocus
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan book barcode..."
                className="w-full bg-transparent border-2 py-4 pl-14 pr-4 text-xl font-mono outline-none"
                style={{ borderColor: 'var(--color-signal-border-dark)' }}
                required
              />
            </div>
          </div>

          {mode === 'checkout' && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-3">
                Student ID / Username
              </label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter member ID..."
                className="w-full bg-transparent border-2 py-3 px-4 text-lg font-mono outline-none"
                style={{ borderColor: 'var(--color-signal-border-dark)' }}
                required
              />
            </div>
          )}

          <Button type="submit" isLoading={loading} disabled={!barcode} className="w-full py-4 text-base">
            Process {mode === 'checkout' ? 'Checkout' : 'Return'}
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-widest opacity-60 flex items-center gap-2">
          <Clock size={14} /> Overdue ({overdue.length})
        </h2>
        {overdue.length === 0 ? (
          <p className="opacity-50 text-sm">No overdue loans.</p>
        ) : (
          <div className="space-y-2">
            {overdue.map((b) => (
              <Card key={b.id} surface="dark" className="p-4 flex items-center justify-between">
                <span className="font-mono text-sm">
                  Borrowing #{b.id} - Copy #{b.copy_id} - Member #{b.member_id}
                </span>
                <StatusBadge status="overdue" />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
