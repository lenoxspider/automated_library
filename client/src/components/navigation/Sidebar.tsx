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
} from 'lucide-react';

export default function Sidebar() {
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
  ];

  const adminLinks = [
    { name: 'Inventory', href: '/inventory', icon: Library },
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
    <aside
      className="w-64 h-screen flex flex-col justify-between border-r shrink-0"
      style={{ borderColor: `var(${borderVar})` }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
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

        <nav className="space-y-1">
          {activeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 border-l-2 transition-colors text-sm font-mono"
                style={
                  isActive
                    ? { borderColor: `var(${accentVar})`, color: `var(${accentVar})` }
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
          className="flex items-center gap-3 px-3 py-2.5 w-full border-l-2 border-transparent text-left text-sm font-mono opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-signal-overdue)' }}
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
