import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useState, useEffect } from 'react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuthStore();
  const { dark, toggleDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!user) return null;

  return (
    <header className={`h-16 flex items-center justify-between px-4 md:px-6 border-b shrink-0 gap-4 shadow-sm z-10 transition-colors duration-200 ${mounted && dark ? 'bg-slate-900/80 border-slate-700 backdrop-blur-md text-slate-100' : 'bg-white/80 border-gray-200 backdrop-blur-md text-gray-900'}`}>
      <div className="flex items-center gap-4 flex-1">
        <button 
          className={`md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1 ${mounted && dark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`} 
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu size={24} aria-hidden="true" />
        </button>
      </div>

      <div className={`flex items-center gap-4 pl-6 border-l ${mounted && dark ? 'border-slate-700' : 'border-gray-200'}`}>
        {/* Toggle dark mode button */}
        <button onClick={toggleDark} className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${mounted && dark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-500'}`}>
          {mounted && dark ? (
             <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12A4 4 0 1 0 8 4a4 4 0 0 0 0 8zm0 1.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM8 2a.75.75 0 0 0 .75-.75V.75a.75.75 0 0 0-1.5 0v.5A.75.75 0 0 0 8 2zm0 12a.75.75 0 0 0-.75.75v.5a.75.75 0 0 0 1.5 0v-.5A.75.75 0 0 0 8 14z"/></svg>
          ) : (
             <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg>
          )}
        </button>
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold leading-tight">{user.email}</p>
          <p className={`text-xs uppercase font-medium tracking-wider ${mounted && dark ? 'text-slate-400' : 'text-gray-500'}`}>{user.role}</p>
        </div>
        <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm border ${mounted && dark ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
          {user.email[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
