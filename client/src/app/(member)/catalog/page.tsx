'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, BookOpen, Clock, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star size={14} className="text-amber-400" /> New Arrivals
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {newArrivals.map((book) => {
              const hasReservation = reservationMap.has(book.id);
              return (
                <button
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="text-left group"
                >
                  <div className="relative rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-slate-700 mb-2 hover:shadow-md transition-shadow">
                    <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-full h-32" />
                    {hasReservation && (
                      <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        Reserved
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold truncate text-gray-900 dark:text-slate-100">{book.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{book.author}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main catalog: filters + grid */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-52 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Filter size={12} /> Genre
            </h3>
            <div className="space-y-0.5">
              {['all', ...(genres ?? [])].map((g) => (
                <button
                  key={g}
                  onClick={() => { setGenreFilter(g); setPage(1); }}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    genreFilter === g
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {g === 'all' ? 'All Genres' : g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3">Availability</h3>
            <div className="space-y-0.5">
              {(['all', 'available'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setAvailabilityFilter(opt); setPage(1); }}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    availabilityFilter === opt
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt === 'all' ? 'All Books' : 'Available Now'}
                </button>
              ))}
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
                return (
                  <Card key={book.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
                    <button onClick={() => setSelectedBook(book)} className="text-left flex flex-col flex-1">
                      <div className="relative">
                        <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-full h-44" />
                        {myRes && (
                          <div className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            myRes.status === 'ready_for_pickup' ? 'bg-green-600' :
                            myRes.status === 'approved' ? 'bg-blue-600' : 'bg-indigo-600'
                          }`}>
                            {myRes.status === 'ready_for_pickup' ? '✓ Ready!' :
                             myRes.status === 'approved' ? 'Approved' :
                             myRes.queue_position ? `Queue #${myRes.queue_position}` : 'Reserved'}
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wide">{book.genre}</p>
                        <h3 className="font-bold leading-tight mb-1 line-clamp-2 text-gray-900 dark:text-slate-100">{book.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{book.author}</p>
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <StatusBadge status={status} />
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {book.available_copies}/{book.total_copies} avail.
                          </span>
                        </div>
                      </div>
                    </button>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Page {page} of {totalPages} &mdash; {totalCount} books
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
