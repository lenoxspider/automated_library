'use client';

import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  const isDark = user.role === 'librarian' || user.role === 'admin';
  const borderVar = isDark ? '--color-signal-border-dark' : '--color-signal-border-light';

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 border-b shrink-0 gap-4"
      style={{ borderColor: `var(${borderVar})` }}
    >
      <div className="flex items-center gap-4 flex-1">
        <button 
          className="md:hidden opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-signal-available)]" 
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

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
