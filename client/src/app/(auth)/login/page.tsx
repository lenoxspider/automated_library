'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username: email, password });
      const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
      login(response.data.accessToken, { id: tokenPayload.sub, email, role: tokenPayload.role });

      const role = tokenPayload.role;
      if (role === 'admin') router.push('/inventory');
      else if (role === 'librarian') router.push('/circulation');
      else router.push('/catalog');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className="border-2 p-8"
          style={{ borderColor: 'var(--color-signal-border-dark)' }}
        >
          <div className="mb-8">
            <div
              className="w-10 h-10 flex items-center justify-center border-2 mb-5"
              style={{ borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }}
            >
              <Terminal size={20} />
            </div>
            <h1 className="text-2xl font-mono font-bold tracking-tight">smartlib login</h1>
            <p className="opacity-60 mt-1 text-sm">Sign in to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div
                className="flex items-center gap-2 border px-3 py-2.5 text-sm font-mono"
                style={{ borderColor: 'var(--color-signal-overdue)', color: 'var(--color-signal-overdue)' }}
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-2 px-3 py-2.5 outline-none font-mono text-sm transition-colors"
                style={{ borderColor: 'var(--color-signal-border-dark)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-signal-available)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-signal-border-dark)')}
                placeholder="you@library.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-2 px-3 py-2.5 outline-none font-mono text-sm transition-colors"
                style={{ borderColor: 'var(--color-signal-border-dark)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-signal-available)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-signal-border-dark)')}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm opacity-70">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-mono underline" style={{ color: 'var(--color-signal-available)' }}>
              create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
