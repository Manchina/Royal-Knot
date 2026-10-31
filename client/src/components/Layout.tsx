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
  LogOut
} from 'lucide-react';
import { useAuthStore, type UserRole } from '../store/useAuthStore';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeRole: UserRole = user?.role || 'FOUNDER';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation Items
  const allNavItems = [
    { name: 'Analytics & P&L', path: '/dashboard', icon: BarChart3, roles: ['FOUNDER', 'SUPER_ADMIN', 'FINANCE_MANAGER'] },
    { name: 'Weddings', path: '/weddings', icon: CalendarDays, roles: ['FOUNDER', 'SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR'] },
    { name: 'Enquiries', path: '/enquiries', icon: MessageSquareHeart, roles: ['SUPER_ADMIN', 'LEAD_PLANNER'] },
    { name: 'Vendor Quotes', path: '/procurement', icon: Utensils, roles: ['SUPER_ADMIN', 'LEAD_PLANNER', 'CLIENT'] },
    { name: 'Checklists', path: '/tasks', icon: CheckSquare, roles: ['SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR'] },
    { name: 'Day-of Schedule', path: '/day-of', icon: Clock, roles: ['SUPER_ADMIN', 'COORDINATOR', 'LEAD_PLANNER'] },
    { name: 'Billing & Extras', path: '/billing', icon: CreditCard, roles: ['SUPER_ADMIN', 'FINANCE_MANAGER', 'FOUNDER'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(activeRole));

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col text-[#222222]">
      {/* Clean Minimalist Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {/* Left: Clean Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-[#222222] tracking-tight text-lg">The Royal Knot</span>
          </NavLink>
        </div>

        {/* Right: Authenticated User & Sign Out */}
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-neutral-900">{user?.full_name || 'Staff User'}</div>
            <div className="text-[11px] text-neutral-500">{user?.title || activeRole.replace('_', ' ')}</div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl font-medium transition border border-neutral-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <aside
          className={`fixed md:sticky top-[57px] z-40 h-[calc(100vh-57px)] w-60 bg-white border-r border-neutral-200 p-3 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="flex flex-col gap-1 mt-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF385C] text-white font-semibold shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
