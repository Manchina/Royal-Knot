import { useState, useRef, useCallback, useEffect } from 'react';
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
  ChevronsUpDown,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Pin
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui';

const SIDEBAR_STORAGE_KEY = 'rk_sidebar_open';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { weddings, selectedWeddingId, setSelectedWeddingId, fetchWeddings } = useWeddingStore();

  useEffect(() => {
    fetchWeddings();
  }, [fetchWeddings]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Apexon / PeopleHub pattern: persisted pinned preference
  const [pinned, setPinned] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored !== null ? stored === 'true' : false;
    } catch {
      return false;
    }
  });

  const [open, setOpen] = useState<boolean>(pinned);
  const hoverExpandedRef = useRef<boolean>(false);

  // Hover-to-expand: expands on hover when persisted preference is collapsed
  const handleMouseEnter = useCallback(() => {
    if (!pinned) {
      hoverExpandedRef.current = true;
      setOpen(true);
    }
  }, [pinned]);

  const handleMouseLeave = useCallback(() => {
    if (hoverExpandedRef.current) {
      hoverExpandedRef.current = false;
      setOpen(false);
    }
  }, []);

  // Toggle button click: explicitly sets & persists pin state
  const handleToggle = useCallback(() => {
    const nextPinned = !pinned;
    hoverExpandedRef.current = false;
    setPinned(nextPinned);
    setOpen(nextPinned);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextPinned));
    } catch {
      // ignore
    }
  }, [pinned]);

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
  const isPinned = pinned;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-slate-800 antialiased">
      {/* Desktop spacer rail: dynamically expands and contracts with sidebar open state (w-16 to w-60), smoothly reducing main card size like Apexon */}
      <div 
        className={`hidden md:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? 'w-60' : 'w-16'
        }`} 
      />

      {/* Apexon-Style Left Sidebar: w-16 icon rail by default, expands to w-60 on hover */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed inset-y-0 left-0 z-40 bg-[#714B67] text-white flex flex-col shrink-0 select-none transition-[width,transform,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          mobileMenuOpen 
            ? 'w-60 translate-x-0 shadow-2xl' 
            : '-translate-x-full md:translate-x-0'
        } ${
          !mobileMenuOpen && (open ? 'w-60 shadow-2xl md:shadow-xl' : 'w-16 shadow-xs border-r border-white/10')
        }`}
      >
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {/* Sidebar Header: Logo, Brand & Pin Toggle */}
          <div className="h-12 px-3 border-b border-white/15 flex items-center justify-between shrink-0">
            <NavLink to="/dashboard" className="flex items-center gap-2.5 min-w-0" title="The Royal Knot">
              <div className="w-8 h-8 rounded bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div className={`min-w-0 overflow-hidden transition-all duration-300 ${open ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0'}`}>
                <div className="font-bold text-xs tracking-tight uppercase leading-none truncate">
                  The Royal Knot
                </div>
                <div className="text-[10px] text-white/60 leading-none mt-0.5 truncate">
                  Wedding Operations
                </div>
              </div>
            </NavLink>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 rounded hover:bg-white/10 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Desktop Pin Toggle (visible when expanded) */}
            {open && (
              <button
                onClick={handleToggle}
                title={isPinned ? "Unpin sidebar (auto-collapse on mouse leave)" : "Pin sidebar open"}
                className="hidden md:flex p-1 rounded hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <Pin className={`w-3.5 h-3.5 transition-transform ${isPinned ? 'text-amber-300' : 'rotate-45 text-white/60'}`} />
              </button>
            )}
          </div>

          {/* Navigation Modules */}
          <TooltipProvider delayDuration={100}>
            <nav className="p-2 space-y-1 overflow-y-auto overflow-x-hidden flex-1">
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
                {open ? 'Modules' : ''}
              </div>

              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                const navLinkElement = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center ${
                      open ? 'justify-between px-2.5 py-2' : 'justify-center h-10 w-10 mx-auto'
                    } rounded text-xs transition-all relative ${
                      isActive
                        ? 'bg-black/35 text-white font-bold border-l-2 border-white pl-2'
                        : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                      <span className={`truncate transition-all duration-300 ${open ? 'opacity-100 max-w-[130px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                        {item.name}
                      </span>
                    </div>

                    {open && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2 animate-in fade-in duration-200">
                        {item.badge && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/90 text-white shadow-2xs">
                            {item.badge}
                          </span>
                        )}
                        {item.count && (
                          <span className="text-[10px] font-mono text-white/60 font-semibold">
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dot indicator when collapsed */}
                    {!open && (item.badge || item.count) && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 ring-2 ring-[#714B67]" />
                    )}
                  </NavLink>
                );

                if (!open) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        {navLinkElement}
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12} className="bg-slate-900 text-white font-medium text-xs px-2.5 py-1 rounded shadow-lg border border-slate-700">
                        {item.name}
                        {item.badge && <span className="ml-1.5 text-[10px] text-rose-300">({item.badge})</span>}
                        {item.count && <span className="ml-1.5 text-[10px] text-slate-300">({item.count})</span>}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return navLinkElement;
              })}
            </nav>
          </TooltipProvider>

        </div>
      </aside>

      {/* Main App Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Utility Bar */}
        <header className="h-10 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Desktop sidebar toggle button like Apexon SidebarTrigger */}
            <button
              onClick={handleToggle}
              title={isPinned ? "Unpin sidebar (auto-collapse)" : "Pin sidebar open"}
              className="hidden md:flex p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {open ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <span className="font-bold text-xs text-slate-800 tracking-tight shrink-0">
              {currentModule}
            </span>

            <div className="h-3.5 w-px bg-slate-200 shrink-0 hidden sm:block" />

            {/* Global Wedding Context Filter (Replaced by PeopleFirst Tab Navigation on /billing) */}
            {location.pathname !== '/billing' && location.pathname !== '/tasks' ? (
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
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 text-[#714B67] text-[10px] font-bold border border-purple-200/60">
                <span>Ongoing & Finalised Tabs</span>
              </div>
            )}
          </div>

          {/* Top Right: Season Tracker & User Profile with Sign Out */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Season 2026: 25 Projects Active</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Unified User Profile & Sign Out Dropdown (Apexon Standard) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-8 px-2 py-1 flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#714B67] group"
                  title="Account details & Sign Out"
                >
                  <Avatar className="h-6 w-6 rounded-full ring-1 ring-slate-200/80 shrink-0">
                    <AvatarFallback className="bg-[#714B67] text-white text-[10px] font-bold">
                      {roleInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start text-left leading-tight">
                    <span className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[125px]">
                      {user?.full_name || 'Staff User'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                      {roleLabels[activeRole]}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-0.5 w-3 h-3 text-slate-400 group-hover:text-slate-600 transition" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-72 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl z-50 animate-in fade-in-80 zoom-in-95"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2.5 p-2 text-left bg-slate-50/80 rounded-lg border border-slate-100">
                    <Avatar className="h-9 w-9 rounded-lg shrink-0 shadow-2xs">
                      <AvatarFallback className="rounded-lg bg-[#714B67] text-white font-bold text-xs">
                        {roleInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight min-w-0">
                      <span className="truncate font-bold text-xs text-slate-900">
                        {user?.full_name || 'Staff User'}
                      </span>
                      <span className="truncate text-[11px] text-slate-500 font-mono mt-0.5">
                        {user?.email || 'admin@royalknot.com'}
                      </span>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-50 text-[#FF385C] border border-rose-200/60">
                          {roleLabels[activeRole]}
                        </span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 font-medium rounded-md hover:bg-slate-100 cursor-pointer focus:bg-slate-100 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile & Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 font-semibold rounded-md hover:bg-rose-50 hover:text-rose-700 cursor-pointer focus:bg-rose-50 focus:text-rose-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
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
