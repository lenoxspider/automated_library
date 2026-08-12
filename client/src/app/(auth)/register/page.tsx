'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useThemeStore } from '../../../store/themeStore';
import api from '../../../lib/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    indexNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Local dark mode state -> now global
  const { dark, toggleDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.studentId || !formData.indexNumber) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

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
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-200 ${mounted && dark ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 via-white to-slate-100'} relative`}>
      
      {/* Dark mode toggle */}
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

      <div className={`w-full max-w-md rounded-2xl border shadow-xl px-8 py-10 ${card}`}>

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

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>Account Created!</h2>
            <p className={`text-sm mb-8 ${muted}`}>
              Check your email to verify your account, then you can log in and start borrowing books.
            </p>
            <Link href="/login" className="inline-flex w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors items-center justify-center">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className={`text-2xl font-bold text-center mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>Create Account</h1>
            <p className={`text-sm text-center mb-8 ${muted}`}>Join SmartLib as a member</p>

            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 9a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.75a.75.75 0 01-1.5 0V4.75a.75.75 0 011.5 0v1.5z"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${label}`}>Full Name</label>
                <div className="relative">
                  <svg className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/>
                  </svg>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${label}`}>Email Address</label>
                <div className="relative">
                  <svg className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@library.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={6}
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
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

              {/* Flex row for IDs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Student ID */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${label}`}>Student ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="2024001234"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
                    />
                  </div>
                </div>

                {/* Index Number */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${label}`}>Index Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="indexNumber"
                      value={formData.indexNumber}
                      onChange={handleChange}
                      placeholder="00123"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loading
                  ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/><path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Creating Account...</>
                  : 'Create Account'
                }
              </button>
            </form>

            <p className={`text-sm text-center mt-6 ${muted}`}>
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">Log In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
