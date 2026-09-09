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
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center px-3 pb-2">
      <div className="w-full max-w-lg bg-white border border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-2xl pointer-events-auto flex justify-around items-center py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-w-[68px] transition-all duration-200",
              isActive 
                ? "text-primary font-bold bg-primary/10 scale-105" 
                : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/60"
            )}
          >
            <item.icon size={22} className="mb-0.5" />
            <span className="text-[11px] font-semibold tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
