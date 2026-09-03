import { create } from 'zustand';
import { Employee, Admin } from '@/types';

interface AuthState {
  user: Employee | Admin | null;
  role: 'employee' | 'admin' | null;
  isAuthenticated: boolean;
  login: (user: Employee | Admin, role: 'employee' | 'admin') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  login: (user, role) => set({ user, role, isAuthenticated: true }),
  logout: () => set({ user: null, role: null, isAuthenticated: false }),
}));
