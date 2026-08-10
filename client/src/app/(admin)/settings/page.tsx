'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  // We assume the backend has an endpoint to get all settings or specific ones.
  // We'll fetch them individually for this mock-up.
  const { data: maxLoans, isLoading: loadingLoans } = useQuery({
    queryKey: ['settings', 'max_loans'],
    queryFn: async () => (await api.get('/settings/max_loans')).data
  });

  const { data: fineRate, isLoading: loadingRate } = useQuery({
    queryKey: ['settings', 'fine_rate'],
    queryFn: async () => (await api.get('/settings/fine_rate')).data
  });

  const [formState, setFormState] = useState({
    max_loans: '',
    fine_rate: ''
  });

  // Sync state once data loads
  if (maxLoans && formState.max_loans === '') setFormState(s => ({ ...s, max_loans: maxLoans.value }));
  if (fineRate && formState.fine_rate === '') setFormState(s => ({ ...s, fine_rate: fineRate.value }));

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      await api.put(`/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.max_loans !== maxLoans?.value) {
      updateSetting.mutate({ key: 'max_loans', value: formState.max_loans });
    }
    if (formState.fine_rate !== fineRate?.value) {
      updateSetting.mutate({ key: 'fine_rate', value: formState.fine_rate });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-bold">System Settings</h1>
        <p className="text-white/60 mt-1">Configure global library policies and rules.</p>
      </div>

      {successMsg && (
        <div className="bg-green-500/20 text-green-400 border border-green-500/50 p-4 rounded-lg flex items-center gap-3 font-semibold animate-in fade-in">
          <CheckCircle2 /> {successMsg}
        </div>
      )}

      {(loadingLoans || loadingRate) ? (
        <div className="glass p-8 animate-pulse bg-white/5 rounded-xl h-64"></div>
      ) : (
        <form onSubmit={handleSave} className="glass p-8 rounded-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-(--color-brand-indigo) rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold mb-1">Borrowing Limits</h3>
              <p className="text-sm text-white/50 mb-4">Determine the maximum number of books a member can hold at once.</p>
              
              <label className="block text-sm uppercase tracking-wider font-semibold text-white/70 mb-2">Max Active Loans</label>
              <div className="relative w-1/2">
                <input 
                  type="number" 
                  min="1"
                  max="20"
                  value={formState.max_loans}
                  onChange={(e) => setFormState({ ...formState, max_loans: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg px-4 py-3 text-white outline-none transition-all font-mono"
                />
              </div>
            </div>

            <hr className="border-white/10" />

            <div>
              <h3 className="text-xl font-bold mb-1">Financial Policies</h3>
              <p className="text-sm text-white/50 mb-4">Set the daily fine rate for overdue books.</p>
              
              <label className="block text-sm uppercase tracking-wider font-semibold text-white/70 mb-2">Daily Fine Rate (USD)</label>
              <div className="relative w-1/2 flex items-center">
                <span className="absolute left-4 text-white/50">$</span>
                <input 
                  type="number" 
                  step="0.10"
                  min="0.00"
                  value={formState.fine_rate}
                  onChange={(e) => setFormState({ ...formState, fine_rate: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg pl-8 pr-4 py-3 text-white outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end relative z-10">
            <button 
              type="submit"
              disabled={updateSetting.isPending}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-(--color-brand-teal) to-(--color-brand-indigo) text-white font-bold rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Save size={18} /> {updateSetting.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
