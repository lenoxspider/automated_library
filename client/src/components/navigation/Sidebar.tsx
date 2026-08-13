'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BookMarked,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Database,
  HandHeart,
  Headset,
  HelpCircle,
  History,
  LibraryBig,
  ListChecks,
  LogOut,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  Webhook
} from 'lucide-react';

type NavIcon = typeof Activity;

type NavigationItem = {
  name: string;
  href: string;
  icon: NavIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const roleGroups: Record<string, NavigationGroup[]> = {
  member: [
    {
      label: 'Main',
      items: [
        { name: 'Catalog', href: '/catalog', icon: LibraryBig },
        { name: 'My Loans', href: '/loans', icon: BookMarked },
        { name: 'Fines', href: '/fines', icon: ReceiptText }
      ]
    },
    {
      label: 'Operations',
      items: [
        { name: 'Search History', href: '/search-history', icon: History },
        { name: 'For You', href: '/recommendations', icon: Sparkles },
        { name: 'Contributions', href: '/contributions', icon: HandHeart }
      ]
    },
    {
      label: 'Support',
      items: [
        { name: 'Profile', href: '/profile', icon: UserRound },
        { name: 'Help', href: '/help', icon: HelpCircle }
      ]
    }
  ],
  librarian: [
    {
      label: 'Main',
      items: [
        { name: 'Circulation', href: '/circulation', icon: ArrowLeftRight },
        { name: 'Reservations', href: '/reservations', icon: CalendarClock },
        { name: 'Accounts', href: '/users', icon: UserRound },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 }
      ]
    },
    {
      label: 'Operations',
      items: [
        { name: 'Manage Fines', href: '/manage-fines', icon: CircleDollarSign },
        { name: 'Inventory', href: '/inventory', icon: Boxes },
        { name: 'Acquisitions', href: '/acquisitions', icon: PackagePlus },
        { name: 'Catalog Sync', href: '/catalog-sync', icon: RefreshCw }
      ]
    },
    {
      label: 'Support',
      items: [
        { name: 'User Support', href: '/support-tickets', icon: Headset },
        { name: 'Contributions Queue', href: '/contributions-queue', icon: ListChecks }
      ]
    }
  ],
  admin: [
    {
      label: 'Main',
      items: [
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'System Health', href: '/health', icon: Activity },
        { name: 'Audit Log', href: '/audit', icon: ClipboardList }
      ]
    },
    {
      label: 'Operations',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'Backup & Restore', href: '/backup', icon: Database },
        { name: 'Integrations', href: '/integrations', icon: Webhook },
        { name: 'Compliance', href: '/compliance', icon: ShieldAlert }
      ]
    },
    {
      label: 'Support',
      items: [{ name: 'Help', href: '/help', icon: HelpCircle }]
    }
  ]
};

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { dark } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) setIsCollapsed(saved === 'true');
  }, []);

  if (!user) return null;

  const groups = roleGroups[user.role] ?? roleGroups.member;
  const theme = mounted && dark;

  const toggleCollapse = () => {
    setIsCollapsed((current) => {
      const next = !current;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const linkClasses = (isActive: boolean) =>
    `group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-150 ${
      isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
    } ${
      isActive
        ? 'bg-purple-600 text-white shadow-sm before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-white'
        : theme
          ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r transition-[width,transform,background-color,border-color] duration-200 md:relative md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16' : 'w-64'} ${
          theme ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          } ${theme ? 'border-slate-800' : 'border-gray-200'}`}
        >
          {isCollapsed ? (
            <Link
              href="/"
              title="SmartLib home"
              aria-label="SmartLib home"
              className={theme ? 'text-slate-100' : 'text-gray-900'}
              onClick={() => setIsOpen(false)}
            >
              <LibraryBig size={20} strokeWidth={1.9} aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/"
              className={`flex items-center gap-2 font-mono text-lg font-bold tracking-tight ${
                theme ? 'text-slate-100' : 'text-gray-900'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <LibraryBig size={20} strokeWidth={1.9} aria-hidden="true" />
              <span>SMARTLIB</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              theme
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          aria-label="Primary navigation"
        >
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                {!isCollapsed && (
                  <h2
                    className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] ${
                      theme ? 'text-slate-500' : 'text-gray-400'
                    }`}
                  >
                    {group.label}
                  </h2>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.name : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={linkClasses(isActive)}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          size={18}
                          strokeWidth={1.9}
                          aria-hidden="true"
                          className={isActive ? 'text-white/80' : ''}
                        />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className={`shrink-0 border-t p-3 ${theme ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out of SmartLib"
            title={isCollapsed ? 'Log out' : undefined}
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } ${theme ? 'text-red-400 hover:bg-red-950/40' : 'text-red-600 hover:bg-red-50'}`}
          >
            <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
