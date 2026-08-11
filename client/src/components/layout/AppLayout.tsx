'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../navigation/Sidebar';
import TopBar from '../navigation/TopBar';
import { useAuthStore } from '../../store/authStore';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  
  const isDark = user?.role === 'librarian' || user?.role === 'admin';
  const surfaceClass = isDark ? 'signal-surface-dark' : 'signal-surface-light';

  if (isAuthPage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${surfaceClass}`}>
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}
