'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, Suspense } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in the URL.');
      return;
    }

    api.get(`/auth/verify/${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully! You may now log in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The token may be invalid or expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card surface="dark" className="w-full max-w-md p-8 text-center space-y-6 border-2" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
        <h1 className="text-2xl font-mono font-bold tracking-tight">Account Verification</h1>
        
        <div className="py-8">
          {status === 'loading' && (
            <p className="font-mono text-sm opacity-70 animate-pulse">{message}</p>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <p className="font-mono text-sm" style={{ color: 'var(--color-signal-available)' }}>
                {message}
              </p>
              <Link href="/login" className="block mt-6">
                <Button className="w-full">Go to Login</Button>
              </Link>
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
