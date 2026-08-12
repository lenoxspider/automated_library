import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  surface?: 'dark' | 'light'; // Kept for prop compatibility but unused
}

export default function Card({ children, surface = 'light', className = '', ...rest }: CardProps) {
  void surface;
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
