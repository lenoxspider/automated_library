'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface Setting {
  key: string;
  value: string;
}

// Fixed to match the real API: GET /settings returns the full settings list
// in one call - there's no GET /settings/:key single-item route, which the
// previous version of this page called twice (and would have 404'd both
// times).
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [maxLoans, setMaxLoans] = useState('');
  const [fineRate, setFineRate] = useState('');

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  useEffect(() => {
    if (!settings) return;
    const ml = settings.find((s) => s.key === 'max_loans');
    const fr = settings.find((s) => s.key === 'fine_rate');
    if (ml) setMaxLoans(ml.value);
    if (fr) setFineRate(fr.value);
  }, [settings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await api.put(`/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMsg('Settings updated.');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSetting.mutate({ key: 'max_loans', value: maxLoans });
    updateSetting.mutate({ key: 'fine_rate', value: fineRate });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">System Settings</h1>
        <p className="opacity-60 mt-1">Configure global library policies.</p>
      </div>

      {successMsg && (
        <div
          className="flex items-center gap-2 border-2 px-4 py-3 font-mono text-sm"
          style={{ borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }}
        >
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {isLoading ? (
        <div className="h-64 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-dark)' }} />
      ) : (
        <Card surface="dark" className="p-8">
          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <h3 className="font-bold mb-1">Borrowing Limits</h3>
              <p className="text-sm opacity-60 mb-4">Max books a member can hold at once.</p>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
                Max Active Loans
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxLoans}
                onChange={(e) => setMaxLoans(e.target.value)}
                className="w-full sm:w-48 bg-transparent border-2 px-4 py-3 outline-none font-mono"
                style={{ borderColor: 'var(--color-signal-border-dark)' }}
              />
            </div>

            <hr style={{ borderColor: 'var(--color-signal-border-dark)' }} />

            <div>
              <h3 className="font-bold mb-1">Financial Policies</h3>
              <p className="text-sm opacity-60 mb-4">Daily fine rate for overdue books.</p>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
                Daily Fine Rate (USD)
              </label>
              <input
                type="number"
                step="0.10"
                min="0"
                value={fineRate}
                onChange={(e) => setFineRate(e.target.value)}
                className="w-full sm:w-48 bg-transparent border-2 px-4 py-3 outline-none font-mono"
                style={{ borderColor: 'var(--color-signal-border-dark)' }}
              />
            </div>

            <Button type="submit" isLoading={updateSetting.isPending}>
              <Save size={16} /> Save Settings
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
