import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserSquare2, MapPin, CalendarClock, Settings, 
  LogOut, BarChart3, RefreshCw, Menu, X, Smartphone, AlertTriangle 
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { clsx } from 'clsx';

export default function AdminLayout() {
  const { user, logout, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { canInstall, installPwa } = usePwaInstall();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/teams', icon: Users, label: 'Teams' },
    { to: '/admin/employees', icon: UserSquare2, label: 'Employees' },
    { to: '/admin/sites', icon: MapPin, label: 'Sites' },
    { to: '/admin/attendance', icon: CalendarClock, label: 'Attendance' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/sync', icon: RefreshCw, label: 'Sync Monitor' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F0F4F9] overflow-hidden font-sans">

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={clsx(
        "fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0B192C] text-slate-100 border-r border-[#162A45] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Sidebar Header with Login Logo */}
        <div className="p-5 border-b border-[#1A2E48] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="bg-white/95 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center">
              <img 
                src="/CSiLogo.png" 
                alt="Converge ICT" 
                className="h-8 w-auto object-contain"
              />
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-[#1A2E48]">
            <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-primary/20">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="font-extrabold text-xs text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">Converge Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/30 border border-primary-light/40" 
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* PWA Install & Logout Footer */}
        <div className="p-3.5 border-t border-[#1A2E48] space-y-1.5 bg-[#081323]">
          {canInstall && (
            <button
              onClick={installPwa}
              className="flex items-center gap-2.5 px-3.5 py-2.5 w-full rounded-xl text-xs font-bold bg-primary/15 text-orange-300 hover:bg-primary/25 border border-primary/30 transition-colors shadow-xs cursor-pointer"
            >
              <Smartphone size={16} />
              <span>Install Mobile App</span>
            </button>
          )}

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-xs font-bold text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white h-14 border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 shadow-xs z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button 
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-navy-800 hover:bg-slate-100 active:scale-95 transition-transform"
              title="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2 md:hidden">
              <img src="/CSiLogo.png" alt="Logo" className="h-7 object-contain" />
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-extrabold text-navy-900 tracking-wide uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              Converge Field Management Console
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canInstall && (
              <button
                onClick={installPwa}
                className="hidden sm:flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/20 transition-colors cursor-pointer"
              >
                <Smartphone size={15} />
                Install App
              </button>
            )}

            <span className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">System Online</span>
              <span className="sm:hidden">Online</span>
            </span>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Admin Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4 border border-red-100 shadow-2xs">
              <LogOut size={22} />
            </div>
            <h3 className="text-base font-black text-navy-900 mb-1">Confirm Admin Logout</h3>
            <p className="text-xs text-slate-500 font-semibold mb-6">
              Are you sure you want to end your administrator session?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
