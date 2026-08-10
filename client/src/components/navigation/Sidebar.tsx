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
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
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
  ];

  const adminLinks = [
    { name: 'Inventory', href: '/inventory', icon: Library },
    { name: 'Copies', href: '/copies', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Blocked Users', href: '/blocked-users', icon: ShieldAlert },
    { name: 'Roster', href: '/roster', icon: Users },
  ];

  let activeLinks = memberLinks;
  if (user.role === 'librarian') activeLinks = librarianLinks;
  if (user.role === 'admin') activeLinks = adminLinks;

  return (
    <aside className="glass w-64 h-[calc(100vh-2rem)] my-4 ml-4 flex flex-col justify-between overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-(--color-brand-indigo) flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight">SmartLib</h1>
            <p className="text-xs opacity-70 uppercase tracking-wider">{user.role}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {activeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-(--color-brand-teal)/20 text-(--color-brand-teal) font-semibold shadow-inner' 
                    : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-left"
        >
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
