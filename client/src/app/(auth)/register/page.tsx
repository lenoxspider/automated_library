'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
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
      await api.post('/auth/register', formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-(--color-background-dark)">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-(--color-brand-amber) rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-(--color-brand-indigo) rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold mb-2">Create Account</h1>
            <p className="text-white/60">Join SmartLib as a Member today</p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Registration Successful!</h2>
              <p className="text-white/70">Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-(--color-brand-coral)/20 border border-(--color-brand-coral)/50 text-(--color-brand-coral) px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg px-4 py-3 text-white outline-none transition-all focus:ring-1 focus:ring-(--color-brand-teal)"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg px-4 py-3 text-white outline-none transition-all focus:ring-1 focus:ring-(--color-brand-teal)"
                  placeholder="you@library.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 focus:border-(--color-brand-teal) rounded-lg px-4 py-3 text-white outline-none transition-all focus:ring-1 focus:ring-(--color-brand-teal)"
                  placeholder="••••••••"
                  minLength={6}
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
                  'Create Account'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link href="/login" className="text-(--color-brand-teal) hover:text-white transition-colors font-medium">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
