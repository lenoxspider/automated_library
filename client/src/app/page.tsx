'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // If the user isn't logged in, redirect them to the login page
    if (!user) {
      router.push('/login');
      return;
    }

    // Otherwise, redirect them to their specific dashboard based on their role
    switch (user.role) {
      case 'admin':
        router.push('/inventory');
        break;
      case 'librarian':
        router.push('/circulation');
        break;
      case 'member':
      default:
        router.push('/catalog');
        break;
    }
  }, [user, router]);

  return (
    <div className="signal-surface-dark flex h-screen w-full items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-(--color-signal-available) animate-spin"></div>
    </div>
  );
}
