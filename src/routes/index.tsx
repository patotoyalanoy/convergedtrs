import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Team App Pages
import Home from '@/pages/team/Home';
import Login from '@/pages/auth/Login';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminAttendance from '@/pages/admin/Attendance';
import Teams from '@/pages/admin/Teams';
import Employees from '@/pages/admin/Employees';
import Sites from '@/pages/admin/Sites';
import Reports from '@/pages/admin/Reports';
import SyncMonitor from '@/pages/admin/SyncMonitor';
import Settings from '@/pages/admin/Settings';

// Team App placeholder pages
const Attendance = () => <div className="p-6 text-neutral-500">Attendance History coming soon.</div>;
const Team = () => <div className="p-6 text-neutral-500">Team info coming soon.</div>;
const Profile = () => <div className="p-6 text-neutral-500">Profile coming soon.</div>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'team', element: <Team /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'attendance', element: <AdminAttendance /> },
      { path: 'teams', element: <Teams /> },
      { path: 'employees', element: <Employees /> },
      { path: 'sites', element: <Sites /> },
      { path: 'reports', element: <Reports /> },
      { path: 'sync', element: <SyncMonitor /> },
      { path: 'settings', element: <Settings /> },
    ]
  }
]);
