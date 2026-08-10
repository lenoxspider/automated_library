'use client';

import { useState } from 'react';
import { ScanLine, ArrowRightLeft, BookUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/api';

export default function CirculationDesk() {
  const [barcode, setBarcode] = useState('');
  const [userId, setUserId] = useState('');
  const [mode, setMode] = useState<'checkout' | 'return'>('checkout');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'checkout') {
        if (!userId) {
          setMessage({ type: 'error', text: 'User ID is required for checkout.' });
          setLoading(false);
          return;
        }
        await api.post('/borrowings/checkout', {
          copyId: parseInt(barcode),
          userId: parseInt(userId)
        });
        setMessage({ type: 'success', text: `Successfully checked out copy #${barcode} to user #${userId}` });
      } else {
        await api.post('/borrowings/return', {
          copyId: parseInt(barcode)
        });
        setMessage({ type: 'success', text: `Successfully processed return for copy #${barcode}` });
      }
      setBarcode('');
      if (mode === 'checkout') setUserId('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process transaction. Check inputs.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-heading font-bold mb-3">Circulation Desk</h1>
        <p className="text-white/60 text-lg">Process book checkouts and returns seamlessly.</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => { setMode('checkout'); setMessage(null); }}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
            mode === 'checkout' 
              ? 'bg-(--color-brand-teal) text-white shadow-lg scale-105' 
              : 'glass text-white/50 hover:bg-white/10'
          }`}
        >
          <ArrowRightLeft size={24} />
          Checkout Book
        </button>
        <button
          onClick={() => { setMode('return'); setMessage(null); }}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
            mode === 'return' 
              ? 'bg-(--color-brand-indigo) text-white shadow-lg scale-105' 
              : 'glass text-white/50 hover:bg-white/10'
          }`}
        >
          <BookUp size={24} />
          Return Book
        </button>
      </div>

      <div className="glass p-8 md:p-12 relative overflow-hidden">
        {/* Scanner laser animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 animate-[scan_2s_ease-in-out_infinite]"></div>
        
        {message && (
          <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
              : 'bg-(--color-brand-coral)/20 text-(--color-brand-coral) border border-(--color-brand-coral)/50'
          }`}>
            {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
            <span className="font-semibold">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm uppercase tracking-widest text-white/50 font-bold mb-3">
              Scan Book Barcode / Copy ID
            </label>
            <div className="relative flex items-center">
              <ScanLine className="absolute left-4 text-white/30" size={28} />
              <input
                type="text"
                autoFocus
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter ID..."
                className="w-full bg-black/40 border-2 border-white/10 focus:border-(--color-brand-teal) rounded-xl py-4 pl-14 pr-4 text-2xl font-mono text-white outline-none transition-all shadow-inner placeholder:text-white/20"
                required
              />
            </div>
          </div>

          {mode === 'checkout' && (
            <div className="relative animate-in slide-in-from-top-4 fade-in duration-300">
              <label className="block text-sm uppercase tracking-widest text-white/50 font-bold mb-3">
                Member ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter member ID..."
                className="w-full bg-black/20 border-2 border-white/10 focus:border-(--color-brand-teal) rounded-xl py-4 px-4 text-xl font-mono text-white outline-none transition-all shadow-inner placeholder:text-white/20"
                required={mode === 'checkout'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !barcode}
            className={`w-full mt-8 py-5 rounded-xl font-bold text-xl uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'checkout' 
                ? 'bg-gradient-to-r from-(--color-brand-teal) to-emerald-600 text-white' 
                : 'bg-gradient-to-r from-(--color-brand-indigo) to-blue-600 text-white'
            }`}
          >
            {loading ? 'Processing...' : `Process ${mode === 'checkout' ? 'Checkout' : 'Return'}`}
          </button>
        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translateY(400px); opacity: 0.8; }
          90% { opacity: 0; }
        }
      `}} />
    </div>
  );
}
