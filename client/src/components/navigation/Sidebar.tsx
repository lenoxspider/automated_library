'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import {
  Book,
  Settings,
  ShieldAlert,
  
  LogOut,
  X,
  Activity,
  ClipboardList,
  Database,
  Webhook,
  ChevronLeft,
  ChevronRight,
  LibraryBig,
  History,
  Sparkles,
  BookMarked,
  ReceiptText,
  HandHeart,
  UserRound,
  ArrowLeftRight,
  CalendarClock,
  CircleDollarSign,
  Boxes,
  PackagePlus,
  RefreshCw,
  Headset,
  ListChecks,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { dark } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!isCollapsed));
  };

  if (!user) return null;

  const memberLinks = [
    { name: 'Catalog', href: '/catalog', icon: LibraryBig },
    { name: 'Search History', href: '/search-history', icon: History },
    { name: 'For You', href: '/recommendations', icon: Sparkles },
    { name: 'My Loans', href: '/loans', icon: BookMarked },
    { name: 'Fines', href: '/fines', icon: ReceiptText },
    { name: 'Contributions', href: '/contributions', icon: HandHeart },
    { name: 'Profile', href: '/profile', icon: UserRound },
  ];

  const librarianLinks = [
    { name: 'Circulation', href: '/circulation', icon: ArrowLeftRight },
    { name: 'Reservations', href: '/reservations', icon: CalendarClock },
    { name: 'Manage Fines', href: '/manage-fines', icon: CircleDollarSign },
    { name: 'Inventory', href: '/inventory', icon: Boxes },
    { name: 'Acquisitions', href: '/acquisitions', icon: PackagePlus },
    { name: 'Catalog Sync', href: '/catalog-sync', icon: RefreshCw },
    { name: 'User Support', href: '/support-tickets', icon: Headset },
    { name: 'Contributions Queue', href: '/contributions-queue', icon: ListChecks },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const adminLinks = [
    { name: 'System Health', href: '/health', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Audit Log', href: '/audit', icon: ClipboardList },
    { name: 'Backup & Restore', href: '/backup', icon: Database },
    { name: 'Integrations', href: '/integrations', icon: Webhook },
    { name: 'Compliance', href: '/compliance', icon: ShieldAlert },
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
        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} flex flex-col justify-between transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${mounted && dark ? 'bg-slate-900/80 backdrop-blur-md border-r border-slate-700' : 'bg-white border-r border-gray-200'}`}
      >
        <div className="p-6">
          <div className={`flex items-center gap-3 mb-10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 relative">
              <div className="text-indigo-600 shrink-0">
                <Book size={28} />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h1 className={`font-bold text-lg tracking-tight whitespace-nowrap ${mounted && dark ? 'text-white' : 'text-gray-900'}`}>SmartLib</h1>
                  <p className={`text-xs uppercase font-semibold tracking-wider whitespace-nowrap ${mounted && dark ? 'text-slate-400' : 'text-gray-500'}`}>{user.role}</p>
                </div>
              )}
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

          <button 
            onClick={toggleCollapse} 
            className={`hidden md:flex absolute -right-3 top-8 border rounded-full p-1.5 z-50 shadow-sm transition-transform hover:scale-110 ${mounted && dark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-900'}`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

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
                title={isCollapsed ? link.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isCollapsed ? 'justify-center' : ''} ${
                  isActive 
                    ? (mounted && dark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700')
                    : (mounted && dark ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }`}
              >
                <Icon size={isCollapsed ? 22 : 18} className={`shrink-0 transition-transform ${isActive ? (mounted && dark ? 'text-indigo-400' : 'text-indigo-600') : (mounted && dark ? 'text-slate-500' : 'text-gray-400')}`} />
                {!isCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        <button
          onClick={logout}
          aria-label="Log out of SmartLib"
          title={isCollapsed ? "Log out" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${isCollapsed ? 'justify-center' : 'text-left'} ${mounted && dark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
        >
          <LogOut size={isCollapsed ? 22 : 18} aria-hidden="true" className={`shrink-0 ${mounted && dark ? 'text-red-400' : 'text-red-500'}`} />
          {!isCollapsed && <span className="whitespace-nowrap">Log out</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
