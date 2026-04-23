import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Users, ClipboardCheck,
  History, BarChart3, LogOut, GraduationCap, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { to: "/students",   icon: Users,            label: "Students" },
  { to: "/attendance", icon: ClipboardCheck,   label: "Take Attendance" },
  { to: "/history",    icon: History,          label: "History" },
  { to: "/reports",    icon: BarChart3,        label: "Reports" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-ink-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
            <GraduationCap size={17} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-ink-900 text-lg leading-none">ClassRoll</h1>
            <p className="text-ink-400 text-[10px] font-mono mt-0.5">Attendance Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-active" : ""}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-5 border-t border-ink-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-ink-900 font-display font-bold text-sm shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{user?.name}</p>
            <p className="text-xs text-ink-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item w-full text-rose-500 hover:bg-rose-50">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-ink-100 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-ink-50">
            <Menu size={20} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-amber-500" />
            <span className="font-display font-bold text-ink-900">ClassRoll</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
