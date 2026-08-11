'use client';

import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <header className="h-16 bg-white flex items-center justify-between px-4 md:px-6 border-b border-gray-200 shrink-0 gap-4 shadow-sm z-10">
      <div className="flex items-center gap-4 flex-1">
        <button 
          className="md:hidden text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1" 
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu size={24} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{user.email}</p>
          <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">{user.role}</p>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm border border-indigo-200">
          {user.email[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
