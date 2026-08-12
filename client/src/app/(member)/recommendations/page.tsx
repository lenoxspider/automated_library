'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp } from 'lucide-react';
import api from '../../../lib/api';
import BookCover from '../../../components/ui/BookCover';
import Card from '../../../components/ui/Card';

export default function RecommendationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => (await api.get('/recommendations')).data
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">For You</h1>
        <p className="opacity-60 mt-1">Discover your next great read.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            {data?.strategy === 'personalized' ? (
              <>
                <Sparkles size={20} />
                <p className="font-medium text-sm">
                  Because you enjoy <strong>{data.topGenres.join(' and ')}</strong>, we think you&apos;ll love these:
                </p>
              </>
            ) : (
              <>
                <TrendingUp size={20} />
                <p className="font-medium text-sm">
                  Here are some of the most popular and recently added books in our collection:
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {data?.books.map((book: { id: number; title: string; author: string; isbn?: string; cover_path?: string | null }) => (
              <Card key={book.id} surface="light" className="flex flex-col overflow-hidden hover:ring-2 ring-indigo-500 transition-all cursor-pointer">
                <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-full h-48" />
                <div className="p-3">
                  <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2" title={book.title}>{book.title}</h3>
                  <p className="text-xs opacity-70 truncate">{book.author}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
