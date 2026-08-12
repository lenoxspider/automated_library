'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useState } from 'react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import { Star, Plus, CheckCircle, Clock, XCircle, Gift } from 'lucide-react';

export default function ContributionsPage() {
  const queryClient = useQueryClient();
  const [bookId, setBookId] = useState('');
  const [type, setType] = useState('correction');
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-contributions'],
    queryFn: async () => (await api.get('/contributions/me')).data
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: unknown) => {
      return (await api.post('/contributions', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-contributions'] });
      setBookId('');
      setContent('');
    }
  });

  if (isLoading) return <LoadingSpinner />;

  const points = data?.library_points || 0;
  const isPremium = points >= 50;
  const progress = Math.min((points / 50) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-gray-900 dark:text-slate-100">Community Contributions</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Earn Library Points by helping us improve our catalog!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card surface="light" className="p-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-transparent">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
              <Star size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Your Library Points</h2>
              <p className="text-3xl font-mono font-bold text-indigo-600">{points}</p>
            </div>
          </div>
          
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between text-sm font-medium">
              <span>Extended Loan Perk</span>
              <span>{isPremium ? 'Unlocked!' : `${50 - points} to go`}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${isPremium ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-indigo-400 to-indigo-600'}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs opacity-60">
              {isPremium ? 'You have unlocked the 28-day extended loan period!' : 'Reach 50 points to double your loan period to 28 days.'}
            </p>
          </div>
          <Gift size={120} className="absolute -bottom-6 -right-6 text-indigo-500 opacity-5" />
        </Card>

        <Card surface="light" className="p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Plus size={18} className="text-indigo-500" />
            Submit a Contribution
          </h2>
          <form 
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate({ book_id: bookId, contribution_type: type, content });
            }}
          >
            <div>
              <label className="block text-xs font-semibold uppercase opacity-50 mb-1">Book ID</label>
              <input required type="number" value={bookId} onChange={e => setBookId(e.target.value)} className="w-full bg-transparent border-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 p-2 rounded focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase opacity-50 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-transparent border-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 p-2 rounded focus:border-indigo-500 outline-none">
                <option value="correction">Metadata Correction</option>
                <option value="review">Book Review</option>
                <option value="tag">Add Tag</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase opacity-50 mb-1">Details</label>
              <textarea required value={content} onChange={e => setContent(e.target.value)} className="w-full bg-transparent border-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 p-2 rounded focus:border-indigo-500 outline-none" rows={3}></textarea>
            </div>
            <button type="submit" disabled={submitMutation.isPending} className="bg-indigo-600 text-white font-bold px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 w-full">
              {submitMutation.isPending ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </form>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-slate-700 pb-2 text-gray-900 dark:text-slate-100">History</h2>
        <div className="space-y-3">
          {data?.contributions.length === 0 && <p className="opacity-50">No contributions yet.</p>}
          {data?.contributions.map((c: { id: number; content: string; contribution_type: string; status: string; books: { title: string } }) => (
            <div key={c.id} className="p-4 rounded border border-gray-100 dark:border-slate-700 flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">Book: {c.books?.title}</p>
                <p className="text-xs opacity-60 capitalize mb-2">{c.contribution_type}</p>
                <p className="text-sm">{c.content}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                c.status === 'approved' ? 'bg-green-100 text-green-700' :
                c.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {c.status === 'approved' && <CheckCircle size={14} />}
                {c.status === 'rejected' && <XCircle size={14} />}
                {c.status === 'pending' && <Clock size={14} />}
                {c.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
