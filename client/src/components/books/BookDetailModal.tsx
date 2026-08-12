'use client';

import { X, Clock, CheckCircle2, Hash } from 'lucide-react';
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

export interface MyReservation {
  id: number;
  book_id: number;
  status: string;
  queue_position: number | null;
  reservation_date: string;
}

function statusFor(book: BookDetail): BookStatus {
  return book.available_copies > 0 ? 'available' : 'checked_out';
}

export default function BookDetailModal({
  book,
  onClose,
  onReserve,
  onCancel,
  isReserving,
  myReservation,
}: {
  book: BookDetail;
  onClose: () => void;
  onReserve: () => void;
  onCancel?: (reservationId: number) => void;
  isReserving: boolean;
  myReservation?: MyReservation | null;
}) {
  const status = statusFor(book);

  const reservationBadge = () => {
    if (!myReservation) return null;
    switch (myReservation.status) {
      case 'ready_for_pickup':
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 mb-4">
            <CheckCircle2 size={16} />
            <span className="font-semibold">Ready for Pickup!</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400 mb-4">
            <CheckCircle2 size={16} />
            <span className="font-semibold">Reservation Approved</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 mb-4">
            <Clock size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">You have a pending reservation</p>
              {myReservation.queue_position && (
                <p className="opacity-80 flex items-center gap-1">
                  <Hash size={12} /> Position <strong>#{myReservation.queue_position}</strong> in queue
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-6">
          <BookCover
            title={book.title}
            isbn={book.isbn}
            src={book.cover_path}
            className="w-full sm:w-36 h-48 shrink-0 rounded-lg overflow-hidden shadow-md"
          />

          <div className="flex-1 min-w-0">
            <StatusBadge status={status} />
            <h2 className="text-xl font-bold mt-3 leading-tight break-words text-gray-900 dark:text-slate-100">{book.title}</h2>
            <p className="text-gray-500 dark:text-slate-400 mt-1">{book.author}</p>

            <dl className="mt-5 space-y-2 text-sm font-mono bg-gray-50 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-slate-400">Genre</dt>
                <dd className="text-gray-900 dark:text-slate-200">{book.genre || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-slate-400">ISBN</dt>
                <dd className="text-right break-all text-gray-900 dark:text-slate-200">{book.isbn}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-slate-400">Copies</dt>
                <dd className="text-gray-900 dark:text-slate-200">
                  <span className={book.available_copies > 0 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-500 font-bold'}>
                    {book.available_copies}
                  </span>
                  {' '}/ {book.total_copies} available
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              {reservationBadge()}
              {myReservation ? (
                <div className="flex gap-2">
                  {onCancel && (
                    <button
                      onClick={() => onCancel(myReservation.id)}
                      className="flex-1 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-colors"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={onReserve}
                  isLoading={isReserving}
                  disabled={false}
                  className="w-full"
                >
                  {status === 'available' ? 'Reserve Now' : 'Join Waitlist'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
