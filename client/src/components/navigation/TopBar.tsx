'use client';

import { Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function TopBar() {
  const { user } = useAuthStore();

  if (!user) return null;

  const isDark = user.role === 'librarian' || user.role === 'admin';
  const borderVar = isDark ? '--color-signal-border-dark' : '--color-signal-border-light';

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b shrink-0"
      style={{ borderColor: `var(${borderVar})` }}
    >
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 opacity-50" size={16} />
          <input
            type="text"
            placeholder="search books, authors, isbn..."
            className="w-full bg-transparent border-0 border-b py-2 pl-6 pr-2 outline-none font-mono text-sm placeholder:opacity-40"
            style={{ borderColor: `var(${borderVar})` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pl-6 border-l" style={{ borderColor: `var(${borderVar})` }}>
        <div className="text-right hidden md:block">
          <p className="text-sm font-mono font-bold leading-tight">{user.email}</p>
          <p className="text-xs opacity-60 uppercase font-mono tracking-wider">{user.role}</p>
        </div>
        <div
          className="w-9 h-9 flex items-center justify-center border-2 font-mono font-bold text-sm"
          style={{ borderColor: 'var(--color-signal-available)', color: 'var(--color-signal-available)' }}
        >
          {user.email[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
