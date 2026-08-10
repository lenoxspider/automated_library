'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="signal-surface-dark min-h-full">{children}</div>
    </ProtectedRoute>
  );
}
