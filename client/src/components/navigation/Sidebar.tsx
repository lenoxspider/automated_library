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
  Book,
  X,
  Activity
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

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
    { name: 'System Health', href: '/health', icon: Activity },
    { name: 'Accounts', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Circulation', href: '/circulation', icon: ShieldAlert },
  ];

  let activeLinks = memberLinks;
  if (user.role === 'librarian') activeLinks = librarianLinks;
  if (user.role === 'admin') activeLinks = adminLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between gap-3 mb-10">
            <div className="flex items-center gap-3">
              <div className="text-indigo-600">
                <Book size={28} />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-gray-900">SmartLib</h1>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{user.role}</p>
              </div>
            </div>
            <button
              className="md:hidden text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
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
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-left text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <LogOut size={18} aria-hidden="true" className="text-red-500" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
