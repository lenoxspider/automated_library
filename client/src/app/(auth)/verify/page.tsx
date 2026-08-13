'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, Suspense, useRef } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  
  // Custom username choosing state
  const [username, setUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const hasFired = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in the URL.');
      return;
    }

    if (hasFired.current) return;
    hasFired.current = true;

    api.get(`/auth/verify/${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully! Welcome to SmartLib.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The token may be invalid or expired.');
      });
  }, [token]);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setSaveError('Username must be at least 3 characters.');
      return;
    }
    setSaveError('');
    setSavingUsername(true);

    try {
      await api.post('/auth/set-username', { username: username.trim() });
      setSaveSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update username. It might be taken.';
      setSaveError(msg);
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card surface="dark" className="w-full max-w-md p-8 text-center space-y-6 border-2" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Account Verification</h1>
        
        <div className="py-4">
          {status === 'loading' && (
            <p className="font-mono text-sm opacity-70 animate-pulse">{message}</p>
          )}
          
          {status === 'success' && (
            <div className="space-y-6">
              <p className="font-mono text-sm" style={{ color: 'var(--color-signal-available)' }}>
                {message}
              </p>

              {!saveSuccess ? (
                <form onSubmit={handleSaveUsername} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="block font-mono text-xs opacity-80">Choose a Username (Optional)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setSaveError(''); }}
                      placeholder="e.g. jdoe21"
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    {saveError && (
                      <p className="text-xs text-red-500 font-mono">{saveError}</p>
                    )}
                    <p className="text-[11px] text-slate-500 font-mono">
                      If skipped, you can still log in using your email address.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/catalog')}
                      className="flex-1"
                    >
                      Skip
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingUsername || !username}
                      className="flex-1"
                    >
                      {savingUsername ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="font-mono text-xs text-green-400">
                    Username updated! Your profile is now complete.
                  </p>
                  <Button onClick={() => router.push('/catalog')} className="w-full">
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="font-mono text-sm" style={{ color: 'var(--color-signal-overdue)' }}>
                {message}
              </p>
              <Link href="/login" className="block mt-6">
                <Button className="w-full" variant="secondary">Back to Login</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VerifyContent />
    </Suspense>
  );
}
