import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: number;
  email: string;
  role: 'member' | 'librarian' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: (token, user) => {
    Cookies.set('accessToken', token, { expires: 15 / (24 * 60) }); // 15 mins roughly, or handle via refresh
    // For now we store user details in localStorage so it persists across reloads without making an API call every time
    // In a real app we might decode the JWT or fetch /api/auth/me
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },
  
  logout: () => {
    Cookies.remove('accessToken');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const token = Cookies.get('accessToken');
    if (token && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isAuthenticated: true });
      } else {
        // If we have a token but no user object, log out (or we could fetch the user)
        Cookies.remove('accessToken');
        set({ user: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
