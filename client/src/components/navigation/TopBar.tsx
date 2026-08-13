'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronLeft,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  UserRound
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface TopBarProps {
  onMenuClick?: () => void;
}

const routeLabels: Record<string, string> = {
  '/analytics': 'Analytics',
  '/acquisitions': 'Acquisitions',
  '/audit': 'Audit Log',
  '/backup': 'Backup & Restore',
  '/catalog': 'Catalog',
  '/catalog-sync': 'Catalog Sync',
  '/circulation': 'Circulation',
  '/compliance': 'Compliance',
  '/contributions': 'Contributions',
  '/contributions-queue': 'Contributions Queue',
  '/fines': 'Fines',
  '/health': 'System Health',
  '/help': 'Help',
  '/integrations': 'Integrations',
  '/inventory': 'Inventory',
  '/loans': 'My Loans',
  '/manage-fines': 'Manage Fines',
  '/profile': 'Profile',
  '/recommendations': 'For You',
  '/reports': 'Reports',
  '/reservations': 'Reservations',
  '/search-history': 'Search History',
  '/settings': 'Settings',
  '/support-tickets': 'User Support',
  '/users': 'Accounts'
};

function getRouteLabel(pathname: string) {
  const exact = routeLabels[pathname];
  if (exact) return exact;
  const match = Object.keys(routeLabels).find((route) => pathname.startsWith(`${route}/`));
  return match ? routeLabels[match] : 'SmartLib';
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { dark, toggleDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const routeLabel = getRouteLabel(pathname);
  const settingsHref = user?.role === 'admin' ? '/settings' : '/profile';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  if (!user) return null;

  const isDark = mounted && dark;
  const initial = user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header
      className={`sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b px-4 shadow-sm transition-colors duration-200 md:px-6 ${
        isDark
          ? 'border-slate-800 bg-slate-900 text-slate-100'
          : 'border-gray-200 bg-white text-gray-900'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className={`rounded-lg p-2 md:hidden ${
            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Menu size={20} />
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          <Link
            href="/"
            aria-label="SmartLib home"
            className={`flex items-center gap-1.5 font-medium ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Home size={15} />
            <span>Home</span>
          </Link>
          {pathname !== '/' && (
            <>
              <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>/</span>
              <span
                className={`truncate font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}
              >
                {routeLabel}
              </span>
            </>
          )}
        </div>

        {pathname !== '/' && (
          <Link
            href="/"
            aria-label="Back to SmartLib home"
            className={`flex items-center gap-1 text-sm font-medium md:hidden ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </Link>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="toggle dark mode"
          title="Toggle dark mode"
          onClick={toggleDark}
          className={`flex items-center gap-1 rounded-full border p-1 transition-colors ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <span
            className={`rounded-full p-1.5 ${!isDark ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500'}`}
          >
            <Sun size={15} />
          </span>
          <span
            className={`rounded-full p-1.5 ${isDark ? 'bg-slate-700 text-indigo-300 shadow-sm' : 'text-gray-400'}`}
          >
            <Moon size={15} />
          </span>
        </button>

        <div ref={accountRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            onClick={() => setAccountOpen((open) => !open)}
            className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors ${
              isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
            }`}
          >
            <span className="hidden max-w-[300px] truncate text-sm font-medium text-gray-600 dark:text-slate-300 md:inline">
              {user.email}{' '}
              <span className="text-gray-400 dark:text-slate-500">— {user.role.toUpperCase()}</span>
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-100'
                  : 'border-gray-200 bg-gray-100 text-gray-700'
              }`}
            >
              {initial}
            </span>
            <ChevronDown size={16} className="hidden text-gray-400 dark:text-slate-500 md:block" />
          </button>

          {accountOpen && (
            <div
              role="menu"
              className={`absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border p-1 shadow-lg ${
                isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
              }`}
            >
              <div
                className={`border-b px-3 py-2 md:hidden ${isDark ? 'border-slate-700' : 'border-gray-100'}`}
              >
                <p
                  className={`truncate text-sm font-medium ${isDark ? 'text-slate-100' : 'text-gray-900'}`}
                >
                  {user.email}
                </p>
                <p
                  className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  {user.role}
                </p>
              </div>
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setAccountOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserRound size={16} />
                Profile
              </Link>
              <Link
                href={settingsHref}
                role="menuitem"
                onClick={() => setAccountOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings size={16} />
                Account settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
