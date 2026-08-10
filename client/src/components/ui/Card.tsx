import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  surface?: 'dark' | 'light';
}

// Sharp corners, flat fill, 1px border - no blur/glassmorphism per Signal.
// `surface` must match the surrounding route group's surface (explicit prop,
// not Tailwind's dark: variant, since this app no longer toggles a global
// `dark` class - light and dark surfaces coexist on different routes).
export default function Card({ children, surface = 'dark', className = '', style, ...rest }: CardProps) {
  const borderVar = surface === 'dark' ? '--color-signal-border-dark' : '--color-signal-border-light';
  const fillVar = surface === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  return (
    <div
      className={`border ${className}`}
      style={{ borderColor: `var(${borderVar})`, backgroundColor: fillVar, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
