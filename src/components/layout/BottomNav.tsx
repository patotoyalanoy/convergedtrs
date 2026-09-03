import { NavLink } from 'react-router-dom';
import { Home, CalendarClock, Users, UserCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function BottomNav() {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/attendance", icon: CalendarClock, label: "Attendance" },
    { to: "/team", icon: Users, label: "Team" },
    { to: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex flex-col items-center py-3 px-4 min-w-[72px]",
              isActive ? "text-primary" : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            <item.icon size={24} className="mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
