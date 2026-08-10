'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('member' | 'librarian' | 'admin')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
    setIsChecking(false);
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized'); // or fallback to a default dashboard
      }
    }
  }, [isAuthenticated, isChecking, router, allowedRoles, user]);

  if (isChecking || !isAuthenticated) {
    return (
      <div className="signal-surface-dark flex h-screen w-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin border-2 border-(--color-signal-available) border-t-transparent"></div>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // The useEffect will redirect them
  }

  return <>{children}</>;
}
