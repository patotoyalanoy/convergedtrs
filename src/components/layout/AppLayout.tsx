import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { WifiOff, RefreshCw } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout() {
  const { isAuthenticated, role } = useAuthStore();
  const { isOnline, isSyncing } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admins trying to access team app → redirect to admin
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 items-center justify-center font-sans antialiased">
      {/* Network Status Bar */}
      {(!isOnline || isSyncing) && (
        <div className={`w-full max-w-lg px-4 py-2 text-xs font-semibold text-white flex items-center justify-center gap-2 z-50 ${!isOnline ? 'bg-red-500' : 'bg-secondary'}`}>
          {!isOnline ? (
            <><WifiOff size={14} /> Offline Mode — Logs saved locally</>
          ) : (
            <><RefreshCw size={14} className="animate-spin" /> Syncing records with Supabase...</>
          )}
        </div>
      )}

      {/* Main Responsive Mobile Viewport Shell */}
      <main className="w-full max-w-lg mx-auto bg-white shadow-xl min-h-screen md:min-h-[92vh] md:my-4 md:rounded-3xl md:border md:border-neutral-200/80 overflow-y-auto pb-32 relative flex flex-col">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
