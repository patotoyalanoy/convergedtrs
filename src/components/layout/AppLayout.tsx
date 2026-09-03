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
    <div className="flex flex-col min-h-screen bg-neutral-100">
      {/* Network Status Bar */}
      {(!isOnline || isSyncing) && (
        <div className={`px-4 py-1.5 text-xs font-medium text-white flex items-center justify-center gap-2 ${!isOnline ? 'bg-red-500' : 'bg-secondary'}`}>
          {!isOnline ? (
            <><WifiOff size={14} /> Offline Mode — Records saved locally</>
          ) : (
            <><RefreshCw size={14} className="animate-spin" /> Syncing records...</>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto bg-white shadow-sm overflow-y-auto pb-20 relative min-h-screen">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
