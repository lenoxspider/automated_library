'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import api from '../../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Local dark mode state -> now global
  const { dark, toggleDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
      login(response.data.accessToken, response.data.refreshToken, { id: tokenPayload.sub, email: username, role: tokenPayload.role });

      const role = tokenPayload.role;
      if (role === 'admin') router.push('/health');
      else if (role === 'librarian') router.push('/circulation');
      else router.push('/catalog');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const input = dark
    ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-indigo-400'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400';
  const label = dark ? 'text-slate-300' : 'text-slate-700';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-200 ${mounted && dark ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-white to-slate-100'} relative`}>
      
      {/* Dark mode toggle - hidden in top right corner similar to old design */}
      <button 
        onClick={toggleDark}
        className="absolute top-6 right-6 p-2 text-slate-500 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full transition-colors"
      >
        {dark ? (
           <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12A4 4 0 1 0 8 4a4 4 0 0 0 0 8zm0 1.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM8 2a.75.75 0 0 0 .75-.75V.75a.75.75 0 0 0-1.5 0v.5A.75.75 0 0 0 8 2zm0 12a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0v-.5A.75.75 0 0 0 8 14z"/></svg>
        ) : (
           <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg>
        )}
      </button>

      <div className={`w-full max-w-sm rounded-2xl border shadow-xl px-8 py-10 ${card}`}>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="4" height="12" rx="1" fill="white"/>
              <rect x="7" y="2" width="4" height="12" rx="1" fill="white" opacity="0.7"/>
              <rect x="12" y="4" width="2" height="10" rx="1" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span className="font-bold text-xl text-indigo-600">SmartLib</span>
        </div>

        <h1 className={`text-2xl font-bold text-center mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>Welcome Back</h1>
        <p className={`text-sm text-center mb-8 ${muted}`}>Digital Library Management System</p>

        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 9a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.75a.75.75 0 01-1.5 0V4.75a.75.75 0 011.5 0v1.5z"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${label}`}>Username</label>
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/>
              </svg>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter username"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${label}`}>Password</label>
            <div className="relative">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="7" width="10" height="8" rx="1.5"/>
                <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${muted} hover:text-indigo-500`}>
                {showPassword
                  ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12" strokeLinecap="round"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div onClick={() => setRemember(r => !r)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${remember ? 'bg-indigo-600 border-indigo-600' : dark ? 'border-slate-500' : 'border-slate-300'}`}>
              {remember && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className={`text-sm ${muted}`}>Remember me</span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/><path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Signing in...</>
              : 'Sign In'
            }
          </button>
        </form>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-5">
          <Link href="/" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
            Home
          </Link>
          <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot Password?</Link>
        </div>

        <p className={`text-sm text-center mt-6 ${muted}`}>
          New Student?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
