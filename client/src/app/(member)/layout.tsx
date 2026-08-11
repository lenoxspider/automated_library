'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  // member routes are typically accessible to all authenticated users (even admins might browse the catalog)
  // but strictly speaking, we'll allow ['member', 'librarian', 'admin'] since everyone needs a catalog.
  // The Sidebar will automatically highlight the correct items.
  return (
    <ProtectedRoute allowedRoles={['member', 'librarian', 'admin']}>
      <div className="min-h-full">{children}</div>
    </ProtectedRoute>
  );
}
