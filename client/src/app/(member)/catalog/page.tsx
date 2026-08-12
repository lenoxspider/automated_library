'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, BookOpen, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import BookCover from '../../../components/ui/BookCover';
import StatusBadge, { type BookStatus } from '../../../components/ui/StatusBadge';
import Card from '../../../components/ui/Card';
import BookDetailModal, { type BookDetail, type MyReservation } from '../../../components/books/BookDetailModal';

interface BooksResponse {
  data: BookDetail[];
  totalCount: number;
  page: number;
  totalPages: number;
}

function statusFor(book: BookDetail): BookStatus {
  return book.available_copies > 0 ? 'available' : 'checked_out';
}

const LIMIT = 18;

// This page doubles as the member landing (search + "My Loans" quick access
// + a highlighted new-arrivals row) and the full filterable catalog/browse
// view, rather than building a separate unused /home route - members land
// here directly after login (see login/page.tsx redirect), and it already
// covers the landing spec's requirements. Documented as a judgment call.
export default function CatalogPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<BookDetail | null>(null);

  // Debounce search: only update query after 500ms pause
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(id);
  }, [search]);

  // Reset to page 1 whenever filters change — done inline in the setter calls
  // to avoid the setState-in-effect anti-pattern.

  // Log search queries (debounced) — use useCallback to keep ref stable
  const logSearchFn = useCallback(async (q: string) => {
    if (q.length > 2) {
      try { await api.post('/search-history', { query: q }); } catch { /* ignore */ }
    }
  }, []);
  useEffect(() => {
    logSearchFn(debouncedSearch);
  }, [debouncedSearch, logSearchFn]);

  // Server-side book query
  const { data, isLoading } = useQuery<BooksResponse>({
    queryKey: ['books', debouncedSearch, genreFilter, availabilityFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (genreFilter !== 'all') params.set('genre', genreFilter);
      if (availabilityFilter !== 'all') params.set('availability', availabilityFilter);
      return (await api.get(`/books?${params}`)).data;
    },
    placeholderData: (prev) => prev
  });

  // Genres from API
  const { data: genres } = useQuery<string[]>({
    queryKey: ['genres'],
    queryFn: async () => (await api.get('/books/genres')).data,
    staleTime: Infinity
  });

  // Member's active reservations (for indicators on cards)
  const { data: myReservations } = useQuery<MyReservation[]>({
    queryKey: ['my-reservations'],
    queryFn: async () => (await api.get('/reservations/my')).data,
    enabled: !!user
  });

  // Map book_id -> reservation for quick lookup
  const reservationMap = useMemo(() => {
    const map = new Map<number, MyReservation>();
    myReservations?.forEach((r) => map.set(r.book_id, r));
    return map;
  }, [myReservations]);

  const books = useMemo(() => data?.data ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  // New arrivals: only shown on the first unfiltered page
  const newArrivals = useMemo(() => {
    return !debouncedSearch && genreFilter === 'all' && availabilityFilter === 'all' && page === 1
      ? books.slice(0, 4)
      : [];
  }, [books, debouncedSearch, genreFilter, availabilityFilter, page]);

  const reserve = useMutation({
    mutationFn: async (bookId: number) => {
      await api.post('/reservations', { book_id: bookId, member_id: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setSelectedBook(null);
    },
  });

  const cancelReservation = useMutation({
    mutationFn: async (reservationId: number) => {
      await api.delete(`/reservations/${reservationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setSelectedBook(null);
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight text-gray-900 dark:text-slate-100">Catalog</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Search {totalCount > 0 ? `${totalCount.toLocaleString()} books` : 'the collection'} and place holds.
          </p>
        </div>
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-slate-300"
        >
          <Clock size={16} />
          My Loans
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> New Arrivals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newArrivals.map((book) => {
              return (
                <button
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="text-left group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-3 flex gap-4 hover:shadow-md transition-shadow items-center"
                >
                  <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-16 h-24 shrink-0 rounded shadow-sm border border-gray-100 dark:border-slate-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-gray-900 dark:text-slate-100 mb-1">{book.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{book.author}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main catalog: filters + grid */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-56 shrink-0 space-y-8 md:sticky md:top-8 self-start">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Genre Filters</h3>
            <div className="flex flex-wrap gap-2">
              {['all', ...(genres ?? [])].map((g) => {
                const isActive = genreFilter === g;
                return (
                  <button
                    key={g}
                    onClick={() => { setGenreFilter(g); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {g === 'all' ? 'All' : g}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Availability</h3>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setAvailabilityFilter('all'); setPage(1); }}
                className="flex items-center gap-3 cursor-pointer w-full text-left"
              >
                <div className={`w-11 h-6 rounded-full relative transition-colors ${availabilityFilter === 'all' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${availabilityFilter === 'all' ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">All Books</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setAvailabilityFilter('available'); setPage(1); }}
                className="flex items-center gap-3 cursor-pointer w-full text-left"
              >
                <div className={`w-11 h-6 rounded-full relative transition-colors ${availabilityFilter === 'available' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${availabilityFilter === 'available' ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Available Now</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Book grid */}
        <div className="flex-1 min-w-0 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
              <BookOpen size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No books found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {books.map((book) => {
                const status = statusFor(book);
                const myRes = reservationMap.get(book.id);
                
                let bannerBg = '';
                let bannerText = '';
                let bannerDot = '';
                let bannerMsg = '';
                
                if (myRes) {
                  if (myRes.status === 'ready_for_pickup') {
                    bannerBg = 'bg-green-50 dark:bg-green-900/20';
                    bannerText = 'text-green-700 dark:text-green-400';
                    bannerDot = 'bg-green-600 dark:bg-green-400';
                    bannerMsg = 'Ready! — ready for pickup';
                  } else if (myRes.status === 'approved') {
                    bannerBg = 'bg-blue-50 dark:bg-blue-900/20';
                    bannerText = 'text-blue-700 dark:text-blue-400';
                    bannerDot = 'bg-blue-600 dark:bg-blue-400';
                    bannerMsg = 'Approved — reservation approved';
                  } else {
                    bannerBg = 'bg-indigo-50 dark:bg-indigo-900/20';
                    bannerText = 'text-indigo-700 dark:text-indigo-400';
                    bannerDot = 'bg-indigo-600 dark:bg-indigo-400';
                    bannerMsg = `Queue #${myRes.queue_position} — pending reservation with position`;
                  }
                }

                return (
                  <Card key={book.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl relative">
                    <button onClick={() => setSelectedBook(book)} className="text-left flex flex-col flex-1">
                      <div className="p-4 flex flex-row gap-4 flex-1">
                        <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-[72px] h-[108px] shrink-0 rounded shadow-sm border border-gray-100 dark:border-slate-700" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-0.5">{book.genre}</p>
                          <h3 className="font-bold text-gray-900 dark:text-slate-100 leading-tight mb-1 line-clamp-2">{book.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 truncate">{book.author}</p>
                          <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                            <StatusBadge status={status} />
                            <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                              {book.available_copies}/{book.total_copies} available
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {myRes && (
                        <div className={`w-full px-4 py-2.5 text-xs flex items-center gap-2 ${bannerBg} ${bannerText} border-t border-gray-100 dark:border-slate-800`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${bannerDot}`}></div>
                          <span className="font-medium truncate">{bannerMsg}</span>
                        </div>
                      )}
                    </button>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center relative pt-8 pb-4">
              <div className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                Page {page} of {totalPages} &mdash; {totalCount} books
              </div>
              <div className="ml-auto flex gap-2 relative z-10 bg-white dark:bg-slate-950 px-2 rounded-lg">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book detail modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onReserve={() => reserve.mutate(selectedBook.id)}
          onCancel={(id) => cancelReservation.mutate(id)}
          isReserving={reserve.isPending}
          myReservation={reservationMap.get(selectedBook.id) ?? null}
        />
      )}
    </div>
  );
}
