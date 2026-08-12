import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-signal-bg-dark)]">
      <div 
        className="w-full max-w-md signal-surface-dark border-2 p-8 text-center flex flex-col items-center"
        style={{ borderColor: 'var(--color-signal-border-dark)' }}
      >
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-signal-overdue)' }}
        >
          <AlertTriangle size={32} />
        </div>
        
        <h1 className="text-4xl font-mono font-bold tracking-tighter mb-2">404</h1>
        <h2 className="text-xl font-mono font-bold tracking-tight mb-4 opacity-90">Page Not Found</h2>
        
        <p className="text-sm opacity-60 font-mono mb-8 max-w-[250px]">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 border-2 font-mono text-sm font-bold tracking-wider hover:bg-white hover:text-black transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          style={{ borderColor: 'white' }}
        >
          <Home size={16} />
          <span>RETURN HOME</span>
        </Link>
      </div>
    </div>
  );
}
