'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// ── Types ──────────────────────────────────────────────────────────────────
interface DbBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  available_copies: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  year: number;
  available: boolean;
  cover: string;
  rating: number;
}

// Removed static GENRES array

const COVER_COLORS: Record<string, string> = {
  CS: '#4f46e5',
  CH: '#059669',
  EC: '#d97706',
  MA: '#7c3aed',
  BI: '#16a34a',
  PH: '#0284c7',
  HI: '#b45309',
  AW: '#9333ea',
  PS: '#e11d48'
};

// Default static stats for SSR or loading fallback
const DEFAULT_STATS = [
  { value: '-', label: 'Catalog Items' },
  { value: '-', label: 'Active Users' },
  { value: '-', label: 'Course Reserves' },
  { value: '-', label: 'Uptime' }
];

// ── Star rating ────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill={i <= Math.round(rating) ? '#f59e0b' : '#e2e8f0'}
        >
          <path d="M6 1l1.236 2.504L10 3.92l-2 1.948.472 2.752L6 7.25 3.528 8.62 4 5.868 2 3.92l2.764-.416z" />
        </svg>
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating}</span>
    </span>
  );
}

// ── Book card ──────────────────────────────────────────────────────────────
function BookCard({ book, dark }: { book: Book; dark: boolean }) {
  const [saved, setSaved] = useState(false);
  const bg = COVER_COLORS[book.cover] ?? '#4f46e5';

  return (
    <div
      className={`rounded-xl border transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 flex flex-col ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
    >
      {/* Cover */}
      <div
        className="rounded-t-xl h-28 flex items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${bg}ee, ${bg}99)` }}
      >
        <span className="text-white text-2xl font-bold tracking-wider opacity-80">
          {book.cover}
        </span>
        <span
          className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${book.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
        >
          {book.available ? 'Available' : 'On Loan'}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3
          className={`font-semibold text-sm leading-snug line-clamp-2 ${dark ? 'text-white' : 'text-slate-900'}`}
        >
          {book.title}
        </h3>
        <p className={`text-xs truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {book.author}
        </p>
        <Stars rating={book.rating} />
        <div className="flex items-center justify-between mt-auto pt-2">
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-medium truncate max-w-[100px] ${dark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}
          >
            {book.genre}
          </span>
          <button
            onClick={() => setSaved((s) => !s)}
            className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-indigo-500' : dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            title={saved ? 'Saved' : 'Save'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2 2h10v11l-5-3-5 3z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`px-4 pb-4 ${book.available ? '' : 'opacity-60'}`}>
        <button
          disabled={!book.available}
          className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${book.available ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          {book.available ? 'Reserve' : 'Join Waitlist'}
        </button>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dark, toggleDark } = useThemeStore();

  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('Recommended');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'rating'>('rating');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Fetch live genres
  const { data: dbGenres = [] } = useQuery({
    queryKey: ['genres-home'],
    queryFn: async () => {
      const res = await api.get('/books/genres');
      return res.data;
    }
  });

  const GENRES = useMemo(() => {
    // Shuffle and pick up to 5 random genres
    const shuffled = dbGenres;
    return ['Recommended', ...shuffled.slice(0, 5)];
  }, [dbGenres]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.push('/health');
      else if (user.role === 'librarian') router.push('/circulation');
      else router.push('/catalog');
    }
  }, [user, router]);

  // Fetch live books
  const { data: dbBooks = [], isLoading } = useQuery({
    queryKey: ['books-home'],
    queryFn: async () => {
      const res = await api.get('/books?limit=6');
      return res.data.data || [];
    }
  });

  // Fetch live stats
  const { data: statsData } = useQuery({
    queryKey: ['public-stats-home'],
    queryFn: async () => {
      const res = await api.get('/analytics/public-stats');
      return res.data;
    }
  });

  const liveStats = statsData
    ? [
        { value: statsData.totalBooks.toLocaleString(), label: 'Catalog Items' },
        { value: statsData.totalUsers.toLocaleString(), label: 'Active Users' },
        { value: statsData.totalReserves.toLocaleString(), label: 'Course Reserves' },
        { value: statsData.uptimePercent, label: 'Uptime' }
      ]
    : DEFAULT_STATS;

  const CATALOG: Book[] = useMemo(() => {
    if (!Array.isArray(dbBooks)) return [];
    return dbBooks.map((b: DbBook) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genre: b.genre,
      isbn: b.isbn,
      year: 2024, // DB doesn't have publication_year
      available: b.available_copies > 0,
      cover: b.genre ? b.genre.substring(0, 2).toUpperCase() : 'BK',
      rating: 4.5 // Mock rating as DB doesn't have it natively
    }));
  }, [dbBooks]);

  const filtered = useMemo(() => {
    return CATALOG.filter((b) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        (b.genre && b.genre.toLowerCase().includes(q));
      const matchesGenre = activeGenre === 'Recommended' || b.genre === activeGenre;
      const matchesAvail = !showAvailableOnly || b.available;
      return matchesQuery && matchesGenre && matchesAvail;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'year') return b.year - a.year;
      return b.rating - a.rating;
    });
  }, [CATALOG, query, activeGenre, sortBy, showAvailableOnly]);

  if (user) return null; // Avoid flashing UI before redirect

  const surface = dark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900';
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen transition-colors duration-200 ${surface} font-sans`}>
      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 border-b ${dark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="4" height="12" rx="1" fill="white" />
                <rect x="7" y="2" width="4" height="12" rx="1" fill="white" opacity="0.7" />
                <rect x="12" y="4" width="2" height="10" rx="1" fill="white" opacity="0.5" />
              </svg>
            </div>
            <span className="font-bold text-lg text-indigo-600">SmartLib</span>
          </div>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            {['Catalog', 'Reserves', 'Research', 'Databases', 'Help'].map((link) => (
              <a
                key={link}
                href="#"
                className={`text-sm transition-colors ${link === 'Catalog' ? 'text-indigo-600 font-medium' : `${muted} hover:text-indigo-600`}`}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className={`p-2 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Toggle dark mode"
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 12A4 4 0 1 0 8 4a4 4 0 0 0 0 8zm0 1.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM8 2a.75.75 0 0 0 .75-.75V.75a.75.75 0 0 0-1.5 0v.5A.75.75 0 0 0 8 2zm0 12a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0v-.5A.75.75 0 0 0 8 14z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                </svg>
              )}
            </button>
            <Link
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 px-4 sm:px-6 py-14 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            University Library — All systems operational
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
            Digital Academic Catalog
          </h1>
          <p className="text-indigo-200 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Access and search our university library textbooks, course reserves, and research
            resources in real-time.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books by title, author, genre, or ISBN..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path
                    d="M2 2l10 10M12 2L2 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="text-indigo-300 text-xs mt-3">
            {CATALOG.length} items in catalog — {CATALOG.filter((b) => b.available).length}{' '}
            currently available
          </p>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────── */}
      <section className={`border-b ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 ${dark ? 'divide-slate-800' : 'divide-slate-200'}`}
        >
          {liveStats.map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-0.5">{s.value}</div>
              <div className={`text-xs ${muted}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATALOG SECTION ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <h2 className={`font-semibold text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>
              {activeGenre === 'Recommended' ? 'Recommended Catalog Items' : activeGenre}
              <span className={`ml-2 text-sm font-normal ${muted}`}>
                ({filtered.length} results)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Available toggle */}
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${muted}`}>
              <div
                onClick={() => setShowAvailableOnly((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${showAvailableOnly ? 'bg-indigo-600' : dark ? 'bg-slate-700' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${showAvailableOnly ? 'translate-x-4' : ''}`}
                />
              </div>
              Available only
            </label>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-indigo-300 ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
            >
              <option value="rating">Top rated</option>
              <option value="year">Newest</option>
              <option value="title">A-Z</option>
            </select>
          </div>
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                activeGenre === g
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : dark
                    ? 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className={`rounded-xl border py-16 text-center ${card}`}>
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className={`font-medium mt-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
              Loading catalog...
            </p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} dark={dark} />
            ))}
          </div>
        ) : (
          <div className={`rounded-xl border py-16 text-center ${card}`}>
            <div className="text-4xl mb-4">ðŸ“š</div>
            <p className={`font-medium mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
              No results found
            </p>
            <p className={`text-sm ${muted}`}>Try a different search term or browse by genre</p>
            <button
              onClick={() => {
                setQuery('');
                setActiveGenre('Recommended');
              }}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* ── QUICK LINKS ────────────────────────────────────────────── */}
      <section className={`border-t ${dark ? 'border-slate-800' : 'border-slate-200'} mt-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: 'ðŸŽ“',
              title: 'Course Reserves',
              desc: 'Find required texts for your enrolled courses.',
              action: 'Browse reserves'
            },
            {
              icon: 'ðŸ”¬',
              title: 'Research Databases',
              desc: 'Access 40+ academic databases and journals.',
              action: 'Explore databases'
            },
            {
              icon: 'ðŸ“‹',
              title: 'My Loans',
              desc: 'Track your borrowed items, due dates, and history.',
              action: 'View account'
            }
          ].map((item) => (
            <div
              key={item.title}
              className={`rounded-xl border p-6 flex gap-4 hover:border-indigo-300 transition-colors group cursor-pointer ${card}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3
                  className={`font-semibold text-sm mb-1 group-hover:text-indigo-600 transition-colors ${dark ? 'text-white' : 'text-slate-900'}`}
                >
                  {item.title}
                </h3>
                <p className={`text-xs mb-3 leading-relaxed ${muted}`}>{item.desc}</p>
                <span className="text-xs text-indigo-600 font-medium">{item.action} →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className={`border-t py-6 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${muted}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="2.5" height="8" rx="0.5" fill="white" />
                <rect x="4.5" y="1" width="2.5" height="8" rx="0.5" fill="white" opacity="0.7" />
              </svg>
            </div>
            SmartLib — University Digital Library System
          </div>
          <div className="flex gap-5">
            {['Privacy', 'Accessibility', 'IT Support', 'Contact'].map((l) => (
              <a key={l} href="#" className="hover:text-indigo-600 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
