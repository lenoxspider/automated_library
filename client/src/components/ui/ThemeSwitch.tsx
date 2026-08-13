'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface ThemeSwitchProps {
  className?: string;
}

export default function ThemeSwitch({ className = '' }: ThemeSwitchProps) {
  const { dark, toggleDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && dark;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="toggle dark mode"
      title="Toggle dark mode"
      onClick={toggleDark}
      className={`flex items-center gap-1 rounded-full border p-1 transition-colors ${
        isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
      } ${className}`}
    >
      <span
        className={`rounded-full p-1.5 ${!isDark ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500'}`}
      >
        <Sun size={15} aria-hidden="true" />
      </span>
      <span
        className={`rounded-full p-1.5 ${isDark ? 'bg-slate-700 text-indigo-300 shadow-sm' : 'text-gray-400'}`}
      >
        <Moon size={15} aria-hidden="true" />
      </span>
    </button>
  );
}
