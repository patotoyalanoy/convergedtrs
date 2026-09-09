import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Employee, Admin } from '@/types';

interface AuthState {
  user: Employee | Admin | null;
  role: 'employee' | 'admin' | null;
  isAuthenticated: boolean;
  login: (user: Employee | Admin, role: 'employee' | 'admin') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      login: (user, role) => set({ user, role, isAuthenticated: true }),
      logout: () => set({ user: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'converge-dtrs-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
