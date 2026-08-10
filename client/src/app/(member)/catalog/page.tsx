'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, AlertCircle, Clock, BookOpen } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import BookCover from '../../../components/ui/BookCover';
import StatusBadge, { type BookStatus } from '../../../components/ui/StatusBadge';
import Card from '../../../components/ui/Card';
import BookDetailModal, { type BookDetail } from '../../../components/books/BookDetailModal';

interface BooksResponse {
  data: BookDetail[];
  totalCount: number;
}

function statusFor(book: BookDetail): BookStatus {
  return book.available_copies > 0 ? 'available' : 'checked_out';
}

// This page doubles as the member landing (search + "My Loans" quick access
// + a highlighted new-arrivals row) and the full filterable catalog/browse
// view, rather than building a separate unused /home route - members land
// here directly after login (see login/page.tsx redirect), and it already
// covers the landing spec's requirements. Documented as a judgment call.
export default function CatalogPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [selectedBook, setSelectedBook] = useState<BookDetail | null>(null);

  const { data, isLoading, error } = useQuery<BooksResponse>({
    queryKey: ['books'],
    queryFn: async () => (await api.get('/books')).data,
  });

  const books = data?.data ?? [];

  const genres = useMemo(() => {
    const unique = new Set(books.map((b) => b.genre).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [books]);

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genreFilter === 'all' || b.genre === genreFilter;
    const matchesAvailability = availabilityFilter === 'all' || b.available_copies > 0;
    return matchesSearch && matchesGenre && matchesAvailability;
  });

  const newArrivals = [...books].slice(-4).reverse();

  const reserve = useMutation({
    mutationFn: async (bookId: number) => {
      await api.post('/reservations', { book_id: bookId, member_id: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBook(null);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Catalog</h1>
          <p className="opacity-60 mt-1">Search the collection and place holds.</p>
        </div>
        <Link
          href="/loans"
          className="inline-flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-wider"
          style={{ borderColor: 'var(--color-signal-border-light)' }}
        >
          <Clock size={16} />
          My Loans
        </Link>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
        <input
          type="text"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border-2 pl-10 pr-4 py-3 outline-none font-mono text-sm bg-transparent"
          style={{ borderColor: 'var(--color-signal-border-light)' }}
        />
      </div>

      {!isLoading && !error && newArrivals.length > 0 && !search && genreFilter === 'all' && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-3">New Arrivals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {newArrivals.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="text-left"
              >
                <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-full h-32 mb-2" />
                <p className="text-sm font-bold truncate">{book.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-3">Genre</h3>
            <div className="space-y-1">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenreFilter(g)}
                  className="block w-full text-left text-sm font-mono px-2 py-1.5 border-l-2"
                  style={
                    genreFilter === g
                      ? { borderColor: 'var(--color-signal-available)' }
                      : { borderColor: 'transparent', opacity: 0.6 }
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-3">Availability</h3>
            <div className="space-y-1">
              {(['all', 'available'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAvailabilityFilter(opt)}
                  className="block w-full text-left text-sm font-mono px-2 py-1.5 border-l-2"
                  style={
                    availabilityFilter === opt
                      ? { borderColor: 'var(--color-signal-available)' }
                      : { borderColor: 'transparent', opacity: 0.6 }
                  }
                >
                  {opt === 'all' ? 'All Books' : 'Available Now'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse border" style={{ borderColor: 'var(--color-signal-border-light)' }} />
              ))}
            </div>
          )}

          {!!error && (
            <Card surface="light" className="p-6 flex items-center gap-3" style={{ color: 'var(--color-signal-overdue)' }}>
              <AlertCircle />
              <p>Failed to load the catalog. Please try again later.</p>
            </Card>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBooks.map((book) => {
                const status = statusFor(book);
                return (
                  <Card key={book.id} surface="light" className="flex flex-col overflow-hidden">
                    <button onClick={() => setSelectedBook(book)} className="text-left flex flex-col flex-1">
                      <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-full h-40" />
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold leading-tight mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-sm opacity-70 mb-3">{book.author}</p>
                        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    </button>
                  </Card>
                );
              })}

              {filteredBooks.length === 0 && (
                <div className="col-span-full text-center py-16 opacity-50">
                  <BookOpen size={40} className="mx-auto mb-3" />
                  <p>No books match your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onReserve={() => reserve.mutate(selectedBook.id)}
          isReserving={reserve.isPending}
        />
      )}
    </div>
  );
}
