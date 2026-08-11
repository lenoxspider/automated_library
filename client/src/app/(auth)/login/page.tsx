'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, Moon, User, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';

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
      if (role === 'admin') router.push('/users');
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-teal-50 font-sans relative">
      {/* Dark mode toggle */}
      <button className="absolute top-6 right-6 p-2 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full transition-colors">
        <Moon size={24} />
      </button>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-indigo-600 mb-6">
            <Book size={32} />
            <span className="text-3xl font-bold tracking-tight">SmartLib</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Digital Library Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-600">Username</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-gray-400">
                <User size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-600">Password</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-3 mt-4 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm font-medium text-indigo-600">
          <Link href="/" className="hover:text-indigo-800 transition-colors flex items-center gap-1">
            <span>&larr;</span> Home
          </Link>
          <Link href="/forgot-password" className="hover:text-indigo-800 transition-colors">
            Forgot Password?
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
          New Student?{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
