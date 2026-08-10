'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['librarian', 'admin']}>
      <div className="signal-surface-dark min-h-full">{children}</div>
    </ProtectedRoute>
  );
}
