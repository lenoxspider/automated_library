import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'member' | 'librarian' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

// Access/refresh tokens live in httpOnly cookies set by the server and are not
// readable from JS. The store only tracks the non-sensitive user profile for
// UI purposes; actual session validity is enforced by the API (401 -> refresh
// -> redirect to /login on failure, handled in lib/api.ts).
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    if (typeof window === 'undefined') {
      set({ user: null, isAuthenticated: false });
      return;
    }
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try {
        set({ user: JSON.parse(storedUser), isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
