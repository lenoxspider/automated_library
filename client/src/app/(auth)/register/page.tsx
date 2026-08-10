'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Terminal } from 'lucide-react';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    indexNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        ...formData,
        username: formData.email,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="border-2 p-8" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
          <div className="mb-8">
            <div
              className="w-10 h-10 flex items-center justify-center border-2 mb-5"
              style={{ borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }}
            >
              <Terminal size={20} />
            </div>
            <h1 className="text-2xl font-mono font-bold tracking-tight">create account</h1>
            <p className="opacity-60 mt-1 text-sm">Join SmartLib as a member</p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div
                className="w-14 h-14 flex items-center justify-center mx-auto mb-4 border-2"
                style={{ borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-lg font-mono font-bold mb-2">Registration submitted</h2>
              <p className="opacity-70 text-sm mb-6">
                Check your email to verify your account, then{' '}
                <Link href="/login" className="underline" style={{ color: 'var(--color-signal-available)' }}>
                  log in
                </Link>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div
                  className="flex items-center gap-2 border px-3 py-2.5 text-sm font-mono"
                  style={{ borderColor: 'var(--color-signal-overdue)', color: 'var(--color-signal-overdue)' }}
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {[
                { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@library.com' },
                { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                { name: 'studentId', label: 'Student ID', type: 'text', placeholder: '2024001234' },
                { name: 'indexNumber', label: 'Index Number', type: 'text', placeholder: '00123' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    className="w-full bg-transparent border-2 px-3 py-2.5 outline-none font-mono text-sm transition-colors"
                    style={{ borderColor: 'var(--color-signal-border-dark)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-signal-available)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-signal-border-dark)')}
                    placeholder={field.placeholder}
                    minLength={field.name === 'password' ? 6 : undefined}
                    required
                  />
                </div>
              ))}

              <Button type="submit" isLoading={isLoading} className="w-full">
                Create Account
              </Button>
            </form>
          )}

          {!success && (
            <div className="mt-8 text-center text-sm opacity-70">
              Already have an account?{' '}
              <Link href="/login" className="font-mono underline" style={{ color: 'var(--color-signal-available)' }}>
                log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
