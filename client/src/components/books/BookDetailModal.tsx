'use client';

import { X } from 'lucide-react';
import BookCover from '../ui/BookCover';
import StatusBadge, { type BookStatus } from '../ui/StatusBadge';
import Button from '../ui/Button';

export interface BookDetail {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  cover_path?: string | null;
}

function statusFor(book: BookDetail): BookStatus {
  return book.available_copies > 0 ? 'available' : 'checked_out';
}

// The real books API (GET /books, GET /books/:id) has no shelf-location or
// per-copy due-date fields on the `books` model - those pieces of the spec
// can't be shown without a backend change, which is out of scope here (only
// the Part 3 cover addition is). Showing what the API actually has instead
// of fabricating fields that don't exist.
export default function BookDetailModal({
  book,
  onClose,
  onReserve,
  isReserving,
}: {
  book: BookDetail;
  onClose: () => void;
  onReserve: () => void;
  isReserving: boolean;
}) {
  const status = statusFor(book);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="signal-surface-light w-full max-w-lg border-2 max-h-[90vh] overflow-y-auto"
        style={{ borderColor: 'var(--color-signal-border-light)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-3">
          <button onClick={onClose} aria-label="Close" className="opacity-60 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-6">
          <BookCover
            title={book.title}
            isbn={book.isbn}
            src={book.cover_path}
            className="w-full sm:w-36 h-48 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <StatusBadge status={status} />
            <h2 className="text-xl font-bold mt-3 leading-tight break-words">{book.title}</h2>
            <p className="opacity-70 mt-1">{book.author}</p>

            <dl className="mt-5 space-y-2 text-sm font-mono">
              <div className="flex justify-between gap-4">
                <dt className="opacity-60">ISBN</dt>
                <dd className="text-right break-all">{book.isbn}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="opacity-60">Genre</dt>
                <dd>{book.genre}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="opacity-60">Copies</dt>
                <dd>
                  {book.available_copies} / {book.total_copies} available
                </dd>
              </div>
            </dl>

            <Button
              onClick={onReserve}
              isLoading={isReserving}
              disabled={status !== 'available'}
              className="w-full mt-6"
            >
              {status === 'available' ? 'Reserve' : 'Currently Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
