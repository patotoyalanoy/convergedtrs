import { create } from 'zustand';

interface AppState {
  isOnline: boolean;
  isSyncing: boolean;
  setOnlineStatus: (status: boolean) => void;
  setSyncingStatus: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: navigator.onLine,
  isSyncing: false,
  setOnlineStatus: (status) => set({ isOnline: status }),
  setSyncingStatus: (status) => set({ isSyncing: status }),
}));
