'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit2, Trash2, X, Wand2 } from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import BookCover from '../../../components/ui/BookCover';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  cover_path?: string | null;
}

type BookForm = { title: string; author: string; genre: string; isbn: string; total_copies: string };

const emptyForm: BookForm = { title: '', author: '', genre: '', isbn: '', total_copies: '1' };

// Rebuilt to match the real API: GET /books returns { data, totalCount }
// (not a bare array), POST/PUT use total_copies (snake_case), and the Add
// Book / Edit buttons previously did nothing at all - this adds a real
// working form wired to POST /books and PUT /books/:id.
export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [lookupError, setLookupError] = useState('');

  const { data, isLoading } = useQuery<{ data: Book[]; totalCount: number }>({
    queryKey: ['admin-books'],
    queryFn: async () => (await api.get('/books')).data,
  });

  const books = data?.data ?? [];

  const deleteBook = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-books'] }),
  });

  const saveBook = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        author: form.author,
        genre: form.genre,
        isbn: form.isbn,
        total_copies: parseInt(form.total_copies, 10),
      };
      if (editing) {
        await api.put(`/books/${editing.id}`, payload);
      } else {
        await api.post('/books', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      closeForm();
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save book.'
      );
    },
  });

  const lookupIsbn = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/books/lookup/${form.isbn}`);
      return res.data as { title: string; author: string; genre: string | null };
    },
    onSuccess: (result) => {
      setLookupError('');
      setForm((f) => ({
        ...f,
        title: result.title,
        author: result.author,
        genre: result.genre || f.genre,
      }));
    },
    onError: () => {
      setLookupError('No book found for that ISBN - fill in the details manually.');
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setLookupError('');
    setShowForm(true);
  };

  const openEdit = (book: Book) => {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      isbn: book.isbn,
      total_copies: String(book.total_copies),
    });
    setFormError('');
    setLookupError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError('');
    setLookupError('');
  };

  const filteredBooks = books.filter(
    (b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.isbn.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">Inventory</h1>
          <p className="opacity-60 mt-1">Add, update, or remove books from the catalog.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
            <input
              type="text"
              placeholder="Search title or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 py-2.5 pl-9 pr-3 outline-none font-mono text-sm bg-transparent"
              style={{ borderColor: 'var(--color-signal-border-dark)' }}
            />
          </div>
          <Button onClick={openAdd}>
            <Plus size={16} /> Add Book
          </Button>
        </div>
      </div>

      <Card surface="dark" className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="text-xs uppercase tracking-wider opacity-60 border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
              <th className="p-4 font-mono font-normal">Book</th>
              <th className="p-4 font-mono font-normal">ISBN</th>
              <th className="p-4 font-mono font-normal">Genre</th>
              <th className="p-4 font-mono font-normal text-center">Copies</th>
              <th className="p-4 font-mono font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-60">Loading inventory...</td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-60">No books found.</td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr key={book.id} className="border-b" style={{ borderColor: 'var(--color-signal-border-dark)' }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BookCover title={book.title} isbn={book.isbn} src={book.cover_path} className="w-9 h-12 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{book.title}</p>
                        <p className="text-sm opacity-60 truncate">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm opacity-70">{book.isbn}</td>
                  <td className="p-4 text-sm opacity-70">{book.genre}</td>
                  <td className="p-4 text-center font-mono">
                    <span style={{ color: book.available_copies === 0 ? 'var(--color-signal-overdue)' : 'var(--color-signal-available)' }}>
                      {book.available_copies}
                    </span>
                    <span className="opacity-40"> / {book.total_copies}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(book)} className="p-2 opacity-70 hover:opacity-100" aria-label="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${book.title}"?`)) deleteBook.mutate(book.id);
                        }}
                        className="p-2 opacity-70 hover:opacity-100"
                        style={{ color: 'var(--color-signal-overdue)' }}
                        aria-label="Delete"
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
      </Card>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeForm}
        >
          <div
            className="signal-surface-dark w-full max-w-md border-2 p-6"
            style={{ borderColor: 'var(--color-signal-border-dark)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-mono font-bold text-lg">{editing ? 'Edit Book' : 'Add Book'}</h2>
              <button onClick={closeForm} aria-label="Close" className="opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormError('');
                saveBook.mutate();
              }}
              className="space-y-4"
            >
              {formError && (
                <div className="text-sm font-mono px-3 py-2 border" style={{ borderColor: 'var(--color-signal-overdue)', color: 'var(--color-signal-overdue)' }}>
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                  ISBN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.isbn}
                    onChange={(e) => {
                      setForm({ ...form, isbn: e.target.value });
                      setLookupError('');
                    }}
                    className="flex-1 min-w-0 bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                    style={{ borderColor: 'var(--color-signal-border-dark)' }}
                    placeholder="9780135957059"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => lookupIsbn.mutate()}
                    disabled={!form.isbn || lookupIsbn.isPending}
                    className="flex items-center gap-1.5 px-3 border-2 font-mono text-xs uppercase tracking-wider disabled:opacity-40"
                    style={{ borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }}
                    title="Look up title/author from OpenLibrary"
                  >
                    <Wand2 size={14} />
                    {lookupIsbn.isPending ? '...' : 'Lookup'}
                  </button>
                </div>
                {lookupError && (
                  <p className="text-xs mt-1.5 font-mono" style={{ color: 'var(--color-signal-pending)' }}>
                    {lookupError}
                  </p>
                )}
              </div>

              {[
                { key: 'title', label: 'Title' },
                { key: 'author', label: 'Author' },
                { key: 'genre', label: 'Genre' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={form[f.key as keyof BookForm]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                    style={{ borderColor: 'var(--color-signal-border-dark)' }}
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest opacity-60 mb-1.5">
                  Total Copies
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.total_copies}
                  onChange={(e) => setForm({ ...form, total_copies: e.target.value })}
                  className="w-full bg-transparent border-2 px-3 py-2 outline-none font-mono text-sm"
                  style={{ borderColor: 'var(--color-signal-border-dark)' }}
                  required
                />
              </div>

              <Button type="submit" isLoading={saveBook.isPending} className="w-full">
                {editing ? 'Save Changes' : 'Add Book'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
