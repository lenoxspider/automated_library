/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, Hash, Camera, Globe, Upload, Search, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import BookCover from '../ui/BookCover';
import StatusBadge, { type BookStatus } from '../ui/StatusBadge';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export interface BookDetail {
  id: number;
  public_id?: string;
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isLibrarianOrAdmin = user?.role === 'librarian' || user?.role === 'admin';

  // Cover editing states
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'upload'>('search');
  const [searchQuery, setSearchQuery] = useState(book.title);
  const [coverCandidates, setCoverCandidates] = useState<{ url: string; source: string; title?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  
  // Custom upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const fetchOnlineCovers = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/books/search-covers?q=${encodeURIComponent(searchQuery)}`);
      setCoverCandidates(res.data);
    } catch {
      toast.error('Failed to search online covers');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (isEditingCover && activeTab === 'search' && coverCandidates.length === 0) {
      fetchOnlineCovers();
    }
  }, [isEditingCover, activeTab]);

  const handleSelectCoverSave = async () => {
    const bookId = book.public_id || book.isbn;
    if (!selectedCandidate) return;
    setIsSaving(true);
    try {
      await api.post(`/books/${bookId}/select-cover`, { coverUrl: selectedCandidate });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book cover updated!');
      setIsEditingCover(false);
    } catch {
      toast.error('Failed to update book cover');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUploadSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const bookId = book.public_id || book.isbn;
    if (!uploadFile) return;

    setIsSaving(true);
    const formData = new FormData();
    formData.append('cover', uploadFile);

    try {
      await api.post(`/books/${bookId}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Custom cover uploaded!');
      setIsEditingCover(false);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errMsg = (err as any).response?.data?.error || 'Failed to upload custom cover';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
          <div className="relative group w-full sm:w-36 h-48 shrink-0 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-slate-800">
            <BookCover
              title={book.title}
              isbn={book.isbn}
              src={book.cover_path}
              className="w-full h-full object-cover"
            />
            {isLibrarianOrAdmin && (
              <button
                type="button"
                onClick={() => setIsEditingCover(true)}
                className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-2 cursor-pointer border-0"
              >
                <Camera size={20} />
                <span>Update Cover</span>
              </button>
            )}
          </div>

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

      {/* Cover Editor Modal */}
      {isEditingCover && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setIsEditingCover(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Update Cover: {book.title}</h3>
              <button onClick={() => setIsEditingCover(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'search'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                <Globe size={16} />
                Search Online
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300'
                }`}
              >
                <Upload size={16} />
                Upload File
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {activeTab === 'search' ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title or keywords..."
                      className="flex-1 rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={fetchOnlineCovers}
                      disabled={isSearching}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                    >
                      <Search size={16} /> Search
                    </button>
                  </div>

                  {isSearching ? (
                    <div className="text-center py-10 font-mono text-sm text-gray-500 flex justify-center items-center gap-2">
                      <Clock size={16} className="animate-spin" /> Fetching candidate covers...
                    </div>
                  ) : coverCandidates.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400">
                      No covers found. Try refining your search query above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {coverCandidates.map((cand) => {
                        const isSelected = selectedCandidate === cand.url;
                        return (
                          <button
                            key={cand.url}
                            onClick={() => setSelectedCandidate(cand.url)}
                            className={`relative rounded-lg overflow-hidden border-2 h-36 ${
                              isSelected ? 'border-indigo-600 ring-2 ring-indigo-500' : 'border-gray-200 dark:border-slate-800'
                            }`}
                          >
                            <img src={cand.url} alt="Candidate" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-[9px] text-white p-1 text-center truncate">
                              {cand.source}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow">
                                <Check size={12} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFileUploadSave} className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Click to choose cover image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">JPEG, PNG up to 2MB (Min 300px width)</p>
                  </div>

                  {uploadPreview && (
                    <div className="flex items-center justify-center border border-gray-200 dark:border-slate-800 rounded-lg p-4 bg-gray-50 dark:bg-slate-950">
                      <img src={uploadPreview} alt="Upload Preview" className="h-40 object-contain rounded shadow" />
                    </div>
                  )}
                </form>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setIsEditingCover(false)}
                className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              {activeTab === 'search' ? (
                <button
                  disabled={!selectedCandidate || isSaving}
                  onClick={handleSelectCoverSave}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Set Cover'}
                </button>
              ) : (
                <button
                  disabled={!uploadFile || isSaving}
                  onClick={handleFileUploadSave}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  {isSaving ? 'Uploading...' : 'Upload Cover'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
