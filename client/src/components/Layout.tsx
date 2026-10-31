import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  CalendarDays, 
  MessageSquareHeart, 
  Utensils, 
  CheckSquare, 
  Clock, 
  CreditCard, 
  Settings, 
  Menu,
  X,
  LogOut,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuthStore, type UserRole } from '../store/useAuthStore';
import { useWeddingStore } from '../store/useWeddingStore';
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { weddings, selectedWeddingId, setSelectedWeddingId } = useWeddingStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeRole: UserRole = user?.role || 'FOUNDER';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar Navigation Modules
  const allNavItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: BarChart3, 
      roles: ['FOUNDER', 'SUPER_ADMIN', 'FINANCE_MANAGER'] 
    },
    { 
      name: 'Weddings', 
      path: '/weddings', 
      icon: CalendarDays, 
      roles: ['FOUNDER', 'SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR'],
      count: '25'
    },
    { 
      name: 'Enquiries', 
      path: '/enquiries', 
      icon: MessageSquareHeart, 
      roles: ['SUPER_ADMIN', 'LEAD_PLANNER'],
      count: '3'
    },
    { 
      name: 'Vendor RFQs', 
      path: '/procurement', 
      icon: Utensils, 
      roles: ['SUPER_ADMIN', 'LEAD_PLANNER', 'CLIENT'] 
    },
    { 
      name: 'Checklists', 
      path: '/tasks', 
      icon: CheckSquare, 
      roles: ['SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR'] 
    },
    { 
      name: 'Day-Of Ops', 
      path: '/day-of', 
      icon: Clock, 
      roles: ['SUPER_ADMIN', 'COORDINATOR', 'LEAD_PLANNER'],
      badge: 'Live'
    },
    { 
      name: 'Billing & Extras', 
      path: '/billing', 
      icon: CreditCard, 
      roles: ['SUPER_ADMIN', 'FINANCE_MANAGER', 'FOUNDER'] 
    },
    { 
      name: 'Configuration', 
      path: '/settings', 
      icon: Settings, 
      roles: ['SUPER_ADMIN'] 
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(activeRole));

  const roleLabels: Record<UserRole, string> = {
    FOUNDER: 'Founder & CEO',
    SUPER_ADMIN: 'Super Admin',
    LEAD_PLANNER: 'Lead Planner',
    COORDINATOR: 'Coordinator',
    FINANCE_MANAGER: 'Finance Manager',
    CLIENT: 'Client Portal',
  };

  const roleInitials = (user?.full_name || 'RK')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const currentModule = allNavItems.find((item) => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-slate-800 antialiased">
      {/* Odoo Style Left Sidebar (Fixed 240px) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-60 bg-[#714B67] text-white flex flex-col shrink-0 select-none shadow-sm transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Sidebar Header: Brand & Platform Title */}
          <div className="h-12 px-4 border-b border-white/15 flex items-center justify-between shrink-0">
            <NavLink to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-white/20 text-white flex items-center justify-center font-bold text-xs">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs tracking-tight uppercase leading-none">The Royal Knot</div>
                <div className="text-[10px] text-white/60 leading-none mt-0.5">Wedding Operations</div>
              </div>
            </NavLink>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded hover:bg-white/10 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Modules */}
          <nav className="p-2 space-y-0.5 overflow-y-auto flex-1">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
              Modules
            </div>

            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-black/30 text-white font-bold border-l-2 border-white pl-2'
                      : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/80 text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] font-mono text-white/60 font-semibold">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main App Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Utility Bar */}
        <header className="h-10 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1 rounded hover:bg-slate-100 text-slate-600"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs text-slate-800 tracking-tight shrink-0">
              {currentModule}
            </span>

            <div className="h-3.5 w-px bg-slate-200 shrink-0 hidden sm:block" />

            {/* Global Wedding Context Filter */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0 hidden lg:inline">
                Project:
              </span>
              <select
                value={selectedWeddingId}
                onChange={(e) => setSelectedWeddingId(e.target.value)}
                className="h-6 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded px-2 text-slate-700 hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67] cursor-pointer max-w-[190px] sm:max-w-[260px] truncate"
                title="Active Wedding Filter"
              >
                <option value="ALL">All Weddings (Agency View)</option>
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} • {w.couple}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Right: Season Tracker & User Profile with Sign Out */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Season 2026: 25 Projects Active</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Unified User Profile & Sign Out Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-100 transition cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#714B67] group"
                  title="Account details & Sign Out"
                >
                  <Avatar className="h-6.5 w-6.5 rounded shadow-2xs">
                    <AvatarFallback className="bg-[#714B67] text-white text-[10px] font-bold">
                      {roleInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left leading-tight">
                    <div className="font-bold text-xs text-slate-800 leading-none flex items-center gap-1">
                      <span>{user?.full_name || 'Staff User'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                      {roleLabels[activeRole]}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 shadow-lg p-1.5 rounded-lg z-50">
                <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 leading-none">{user?.full_name || 'Staff User'}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono truncate">{user?.email || 'Logged in'}</p>
                  <div className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-[#FF385C]">
                    {roleLabels[activeRole]}
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 font-semibold rounded hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
