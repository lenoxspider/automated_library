'use client';

import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function TopBar() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <header className="h-20 flex items-center justify-between px-8 mb-6 glass">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={18} />
          <input 
            type="text" 
            placeholder="Search books, authors, or ISBN..." 
            className="w-full bg-black/10 dark:bg-white/5 border border-transparent focus:border-(--color-brand-teal) rounded-lg py-2.5 pl-10 pr-4 outline-none transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-(--color-brand-amber) rounded-full border-2 border-[var(--background)]"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-black/10 dark:border-white/10 pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold">{user.email}</p>
            <p className="text-xs opacity-70 capitalize">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-(--color-brand-teal) to-(--color-brand-indigo) shadow-md"></div>
        </div>
      </div>
    </header>
  );
}
