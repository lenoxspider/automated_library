'use client';

import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
}

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  
  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await api.get('/books');
      return res.data;
    }
  });

  const filteredBooks = books?.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Library Catalog</h1>
          <p className="text-white/60 mt-1">Browse our collection and place holds.</p>
        </div>
        
        <input 
          type="text" 
          placeholder="Filter by title or author..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass px-4 py-2 w-full md:w-64 outline-none focus:border-(--color-brand-teal) transition-colors"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass h-64 animate-pulse rounded-xl bg-white/5"></div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass bg-(--color-brand-coral)/10 border-(--color-brand-coral)/30 p-6 flex items-center gap-4 text-(--color-brand-coral)">
          <AlertCircle />
          <p>Failed to load catalog. Please try again later.</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div key={book.id} className="glass p-5 flex flex-col group hover:-translate-y-1 transition-all duration-300">
              <div className="w-full h-40 bg-gradient-to-br from-black/40 to-black/10 rounded-lg mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-white/20 group-hover:text-(--color-brand-teal)/50 transition-colors" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-tight mb-1 truncate" title={book.title}>{book.title}</h3>
                <p className="text-sm text-(--color-brand-teal) mb-3">{book.author}</p>
                <div className="flex items-center justify-between text-xs text-white/50 mb-4">
                  <span>{book.category}</span>
                  <span>{book.publishedYear}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <span className={`text-sm font-semibold ${book.availableCopies > 0 ? 'text-green-400' : 'text-(--color-brand-amber)'}`}>
                  {book.availableCopies} available
                </span>
                <button 
                  disabled={book.availableCopies === 0}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-(--color-brand-teal) hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Place Hold
                </button>
              </div>
            </div>
          ))}

          {filteredBooks.length === 0 && (
            <div className="col-span-full text-center py-20 text-white/50">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>No books found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
