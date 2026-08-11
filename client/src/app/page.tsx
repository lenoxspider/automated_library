'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import Link from 'next/link';
import { Book, Moon, Search, AlertTriangle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin':
          router.push('/users');
          break;
        case 'librarian':
          router.push('/circulation');
          break;
        case 'member':
        default:
          router.push('/catalog');
          break;
      }
    }
  }, [user, router]);

  if (user) return null; // Avoid flashing UI before redirect

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Custom Top Navigation */}
      <nav className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200 gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-indigo-600">
          <Book size={28} aria-hidden="true" />
          <span className="text-2xl font-bold tracking-tight">SmartLib</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="p-2 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full transition-colors"
            aria-label="Toggle dark mode"
          >
            <Moon size={20} />
          </button>
          <Link 
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Banner */}
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center shadow-xl">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Digital Academic Catalog
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Access and search our university library textbooks, course reserves, and research resources in real-time.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mt-8 relative">
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden flex items-center focus-within:ring-2 focus-within:ring-indigo-500 border border-gray-100">
            <div className="pl-6 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search books by title, author, genre, or ISBN..."
              aria-label="Search catalog"
              className="w-full px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent font-medium"
            />
          </div>

          {/* Error State */}
          {hasError && (
            <div className="mt-8 text-center flex flex-col items-center">
              <AlertTriangle size={36} className="text-red-500 mb-2" />
              <p className="text-sm text-red-600">
                Failed to retrieve catalog data. Check server connectivity.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
