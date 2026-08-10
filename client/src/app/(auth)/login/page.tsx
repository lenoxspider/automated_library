'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      // We need to decode JWT to get role since backend only returns tokens
      const tokenPayload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
      login(response.data.accessToken, { id: tokenPayload.sub, email: email, role: tokenPayload.role });
      
      const role = tokenPayload.role;
      if (role === 'admin') router.push('/inventory');
      else if (role === 'librarian') router.push('/circulation');
      else router.push('/catalog');
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-(--color-background-dark)">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-(--color-brand-indigo) rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-(--color-brand-teal) rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-(--color-brand-teal) to-(--color-brand-indigo) rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl font-bold text-white">S</span>
            </div>
            <h1 className="text-3xl font-heading font-bold mb-2">Welcome Back</h1>
            <p className="text-white/60">Log in to your SmartLib account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-(--color-brand-coral)/20 border border-(--color-brand-coral)/50 text-(--color-brand-coral) px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg px-4 py-3 text-white outline-none transition-all focus:ring-1 focus:ring-(--color-brand-teal)"
                placeholder="you@library.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg px-4 py-3 text-white outline-none transition-all focus:ring-1 focus:ring-(--color-brand-teal)"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-(--color-brand-indigo) to-(--color-brand-teal) hover:from-(--color-brand-teal) hover:to-(--color-brand-indigo) text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-white/60">
            Don't have an account?{' '}
            <Link href="/register" className="text-(--color-brand-teal) hover:text-white transition-colors font-medium">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
