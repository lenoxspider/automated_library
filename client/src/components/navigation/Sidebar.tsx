'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import {
  BookOpen,
  Library,
  Clock,
  CreditCard,
  Settings,
  Users,
  ShieldAlert,
  BarChart,
  LogOut,
  Terminal,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const isDark = user.role === 'librarian' || user.role === 'admin';

  const memberLinks = [
    { name: 'Catalog', href: '/catalog', icon: BookOpen },
    { name: 'My Loans', href: '/loans', icon: Clock },
    { name: 'Fines', href: '/fines', icon: CreditCard },
  ];

  const librarianLinks = [
    { name: 'Circulation', href: '/circulation', icon: Library },
    { name: 'Reservations', href: '/reservations', icon: Clock },
    { name: 'Manage Fines', href: '/manage-fines', icon: CreditCard },
    { name: 'Inventory', href: '/inventory', icon: Library },
    { name: 'Reports', href: '/reports', icon: BarChart },
  ];

  const adminLinks = [
    { name: 'Accounts', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Circulation', href: '/circulation', icon: ShieldAlert },
  ];

  let activeLinks = memberLinks;
  if (user.role === 'librarian') activeLinks = librarianLinks;
  if (user.role === 'admin') activeLinks = adminLinks;

  const borderVar = isDark ? '--color-signal-border-dark' : '--color-signal-border-light';
  const accentVar = '--color-signal-available';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderColor: `var(${borderVar})`, backgroundColor: 'var(--color-signal-surface-dark)' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between gap-3 mb-10">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 flex items-center justify-center border-2"
                style={{ borderColor: `var(${accentVar})`, color: `var(${accentVar})` }}
              >
                <Terminal size={18} />
              </div>
              <div>
                <h1 className="font-mono font-bold text-base leading-tight tracking-tight">SMARTLIB</h1>
                <p className="text-xs opacity-60 uppercase tracking-widest font-mono">{user.role}</p>
              </div>
            </div>
            <button
              className="md:hidden opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-signal-available)] rounded"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              title="Close menu"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav className="space-y-1">
          {activeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-3 px-3 py-2.5 border-l-2 transition-all duration-200 text-sm font-mono hover:bg-black/10 focus:outline-none focus:bg-black/10"
                style={
                  isActive
                    ? { borderColor: `var(${accentVar})`, color: `var(${accentVar})`, backgroundColor: 'rgba(0,0,0,0.2)' }
                    : { borderColor: 'transparent', opacity: 0.7 }
                }
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        <button
          onClick={logout}
          aria-label="Log out of SmartLib"
          className="flex items-center gap-3 px-3 py-2.5 w-full border-l-2 border-transparent text-left text-sm font-mono opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:bg-black/10 transition-all duration-200"
          style={{ color: 'var(--color-signal-overdue)' }}
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
