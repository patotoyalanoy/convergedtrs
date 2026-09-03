import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, MapPin, CalendarClock, Settings, LogOut, BarChart3, RefreshCw, ScrollText } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { clsx } from 'clsx';

export default function AdminLayout() {
  const { user, logout, isAuthenticated, role } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;

  const handleLogout = () => {
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
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-100">
          <h1 className="text-xl font-bold text-secondary">CONVERGE-DTRS</h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-semibold text-sm text-neutral-800 line-clamp-1">{user?.name}</p>
              <p className="text-xs text-neutral-500">System Administrator</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-secondary/10 text-secondary" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-16 border-b border-neutral-200 flex items-center px-8 shadow-sm">
          <div className="ml-auto flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              System Online
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
