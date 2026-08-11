'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'librarian']}>
      <div className="min-h-full">{children}</div>
    </ProtectedRoute>
  );
}
