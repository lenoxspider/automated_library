'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const { data: books, isLoading } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      const res = await api.get('/books');
      return res.data;
    }
  });

  const deleteBook = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    }
  });

  const filteredBooks = books?.filter((b: any) => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.isbn.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Inventory Management</h1>
          <p className="text-white/60 mt-1">Add, update, or remove books from the global catalog.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Search by Title or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass py-2 pl-10 pr-4 outline-none focus:border-(--color-brand-teal)"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-(--color-brand-indigo) to-(--color-brand-teal) text-white font-bold rounded-lg hover:scale-105 transition-transform shadow-lg">
            <Plus size={18} /> Add Book
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 text-white/50 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">ISBN</th>
              <th className="p-4 font-semibold">Title & Author</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold text-center">Copies (Avail/Total)</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/50">Loading inventory...</td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/50">No books found matching criteria.</td>
              </tr>
            ) : (
              filteredBooks.map((book: any) => (
                <tr key={book.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-sm opacity-80">{book.isbn}</td>
                  <td className="p-4">
                    <p className="font-bold">{book.title}</p>
                    <p className="text-sm text-(--color-brand-teal)">{book.author}</p>
                  </td>
                  <td className="p-4 text-sm"><span className="px-2 py-1 bg-white/10 rounded-full">{book.category}</span></td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${book.availableCopies === 0 ? 'text-(--color-brand-coral)' : 'text-green-400'}`}>
                      {book.availableCopies}
                    </span>
                    <span className="opacity-50 mx-1">/</span>
                    <span className="opacity-80">{book.totalCopies}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                            deleteBook.mutate(book.id);
                          }
                        }}
                        className="p-2 hover:bg-(--color-brand-coral)/20 rounded-lg text-(--color-brand-coral) transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
