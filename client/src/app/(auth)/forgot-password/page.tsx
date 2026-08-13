'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun
} from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';
import api from '../../../lib/api';

type Step = 'email' | 'code' | 'password' | 'success';

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { dark, toggleDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => setMounted(true), []);

  const isDark = mounted && dark;
  const card = isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white';
  const heading = isDark ? 'text-slate-100' : 'text-gray-900';
  const muted = isDark ? 'text-slate-400' : 'text-gray-500';
  const input = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500'
    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400';

  const extractError = (unknownError: unknown) => {
    const apiError = unknownError as ApiError;
    return apiError.response?.data?.error || 'Something went wrong. Please try again.';
  };

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter the email address connected to your SmartLib account.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setNotice(response.data.message);
      setStep('code');
    } catch (unknownError) {
      setError(extractError(unknownError));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit verification code from your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-reset-code', { email: email.trim(), code });
      setResetToken(response.data.resetToken);
      setStep('password');
    } catch (unknownError) {
      setError(extractError(unknownError));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 6) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, password });
      setStep('success');
    } catch (unknownError) {
      setError(extractError(unknownError));
    } finally {
      setLoading(false);
    }
  };

  const stepNumber = step === 'email' ? 1 : step === 'code' ? 2 : step === 'password' ? 3 : 3;

  return (
    <main
      className={`min-h-screen px-4 py-6 transition-colors duration-200 sm:px-6 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className={`flex items-center gap-1 text-sm font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
            className={`rounded-full border p-2 transition-colors ${isDark ? 'border-slate-700 bg-slate-900 text-amber-300' : 'border-gray-200 bg-white text-indigo-600'}`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        <div className={`rounded-2xl border p-6 shadow-xl sm:p-8 ${card}`}>
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              {step === 'email' && <Mail size={23} />}
              {step === 'code' && <ShieldCheck size={23} />}
              {step === 'password' && <LockKeyhole size={23} />}
              {step === 'success' && <CheckCircle2 size={23} />}
            </div>
            <h1 className={`text-2xl font-bold ${heading}`}>
              {step === 'email' && 'Forgot your password?'}
              {step === 'code' && 'Check your email'}
              {step === 'password' && 'Create a new password'}
              {step === 'success' && 'Password updated'}
            </h1>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              {step === 'email' &&
                'Enter your account email and we will send you a verification code.'}
              {step === 'code' && (
                <>
                  We sent a six-digit code to <strong className={heading}>{email}</strong>. The code
                  expires in 10 minutes.
                </>
              )}
              {step === 'password' &&
                'Your code is verified. Choose a strong password for your account.'}
              {step === 'success' &&
                'Your SmartLib password has been reset successfully. You can now sign in.'}
            </p>
          </div>

          <div
            className="mb-7 flex items-center gap-2"
            aria-label={`Password reset step ${stepNumber} of 3`}
          >
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className={`h-1.5 flex-1 rounded-full ${number <= stepNumber ? 'bg-indigo-600' : isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {notice && (
            <div
              className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${isDark ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
            >
              {notice}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${isDark ? 'border-red-800 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}
            >
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <label className={`block text-sm font-medium ${heading}`}>
                Email address
                <div className="relative mt-1.5">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 ${input}`}
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <label className={`block text-sm font-medium ${heading}`}>
                Verification code
                <div className="relative mt-1.5">
                  <KeyRound
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
                    size={17}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className={`w-full rounded-xl border py-3 pl-10 pr-3 text-center text-lg tracking-[0.35em] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 ${input}`}
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setNotice('');
                }}
                className={`w-full text-sm font-medium ${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'}`}
              >
                Use a different email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <label className={`block text-sm font-medium ${heading}`}>
                New password
                <div className="relative mt-1.5">
                  <LockKeyhole
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
                    size={17}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 ${input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted}`}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className={`block text-sm font-medium ${heading}`}>
                Confirm new password
                <div className="relative mt-1.5">
                  <LockKeyhole
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
                    size={17}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 ${input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password confirmation'
                        : 'Show password confirmation'
                    }
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted}`}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={loading || !resetToken}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Updating password…' : 'Reset password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Continue to login
            </button>
          )}
        </div>

        <p className={`mt-6 text-center text-xs ${muted}`}>
          SmartLib password recovery · Codes expire after 10 minutes
        </p>
      </div>
    </main>
  );
}
