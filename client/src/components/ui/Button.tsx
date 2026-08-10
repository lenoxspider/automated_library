import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-(--color-signal-available) text-(--color-signal-bg-dark) border-(--color-signal-available) hover:opacity-90',
  secondary:
    'bg-transparent border-current hover:bg-black/5',
  danger:
    'bg-(--color-signal-overdue) text-white border-(--color-signal-overdue) hover:opacity-90',
  ghost: 'bg-transparent border-transparent hover:bg-black/5',
};

// Sharp corners (no rounded-*), solid fills only - no gradients, per the
// Signal terminal aesthetic.
export default function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 border-2 px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}
