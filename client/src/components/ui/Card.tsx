/* eslint-disable react-hooks/set-state-in-effect */
import { HTMLAttributes, ReactNode, useState, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  surface?: 'dark' | 'light'; // Kept for prop compatibility but unused
}

export default function Card({ children, surface = 'light', className = '', ...rest }: CardProps) {
  void surface;
  const { dark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={`rounded-xl shadow-sm transition-colors duration-200 ${mounted && dark ? 'bg-slate-800 border border-slate-700 text-slate-200' : 'bg-white border border-gray-200 text-gray-900'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
