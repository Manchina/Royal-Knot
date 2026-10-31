import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuthStore, type UserRole } from '../store/useAuthStore';

const DEMO_CREDENTIALS: Record<UserRole, { email: string; label: string; name: string }> = {
  FOUNDER: { email: 'founder@royalknot.com', label: 'Founder & CEO (Executive Margins & P&L)', name: 'Vikramaditya Rathore' },
  SUPER_ADMIN: { email: 'admin@royalknot.com', label: 'Executive Director (Agency Management)', name: 'Aditya Singhal' },
  LEAD_PLANNER: { email: 'planner@royalknot.com', label: 'Lead Wedding Planner (Proposals & RFQs)', name: 'Devika Sharma' },
  COORDINATOR: { email: 'coordinator@royalknot.com', label: 'Day-of Coordinator (Live Run Sheet & Alerts)', name: 'Karan Verma' },
  FINANCE_MANAGER: { email: 'finance@royalknot.com', label: 'Finance & Accounts (Invoices & Extras)', name: 'Anil Agarwal' },
  CLIENT: { email: 'client@royalknot.com', label: 'Couple / Client Portal (Quote Approval)', name: 'Aanya Singhania' },
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, quickLogin, loading, error, clearError } = useAuthStore();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('FOUNDER');
  const [isDemoOptIn, setIsDemoOptIn] = useState<boolean>(true);
  const [email, setEmail] = useState(DEMO_CREDENTIALS.FOUNDER.email);
  const [password, setPassword] = useState('password123');

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    clearError();
    if (isDemoOptIn) {
      setEmail(DEMO_CREDENTIALS[newRole].email);
      setPassword('password123');
    }
  };

  const handleDemoToggle = (optIn: boolean) => {
    setIsDemoOptIn(optIn);
    if (optIn) {
      setEmail(DEMO_CREDENTIALS[selectedRole].email);
      setPassword('password123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    let success = false;
    if (isDemoOptIn) {
      success = await quickLogin(selectedRole);
    } else {
      success = await login(email, password);
    }

    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#222222]">
      <div className="max-w-sm mx-auto w-full space-y-6">
        {/* Clean Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#222222] tracking-tight">The Royal Knot</h1>
          <p className="text-xs text-neutral-500">Sign in to access your wedding workspace</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FF385C]" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#FF385C] cursor-pointer"
              >
                {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {DEMO_CREDENTIALS[r].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Demo Mode Toggle */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-800">Demo Account</div>
                <div className="text-[11px] text-neutral-500">
                  {DEMO_CREDENTIALS[selectedRole].name}
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemoOptIn}
                  onChange={(e) => handleDemoToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF385C]"></div>
              </label>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsDemoOptIn(false);
                }}
                required
                placeholder="name@royalknot.com"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsDemoOptIn(false);
                }}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#FF385C]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#FF385C] text-white font-semibold text-xs rounded-xl hover:bg-[#E00B41] transition shadow-sm mt-3"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
