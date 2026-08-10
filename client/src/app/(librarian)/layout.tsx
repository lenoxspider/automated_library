'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['librarian', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}
