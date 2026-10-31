import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  Building2,
  CreditCard,
  Clock,
  Layers,
  UserCheck,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore, type UserRole, ROLE_EMAILS } from '../store/useAuthStore';
import { loginFormSchema, formatZodErrors } from '../lib/validations';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
} from '../components/ui';

const DEMO_ROLES: { role: UserRole; title: string; email: string; subtitle: string; icon: typeof Layers }[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
    email: 'admin@royalknot.com',
    subtitle: 'Agency governance, platform control, configuration & access audits',
    icon: ShieldCheck,
  },
  {
    role: 'FOUNDER',
    title: 'Founder & Managing Director',
    email: 'founder@royalknot.com',
    subtitle: 'Consolidated P&L, 35%+ margins, high-stakes seasonal auditing',
    icon: Briefcase,
  },
  {
    role: 'LEAD_PLANNER',
    title: 'Lead Wedding Planner',
    email: 'planner@royalknot.com',
    subtitle: 'Client proposals, catering RFQ evaluations, master task checklists',
    icon: UserCheck,
  },
  {
    role: 'COORDINATOR',
    title: 'Day-of Operations Coordinator',
    email: 'coordinator@royalknot.com',
    subtitle: 'Minute-by-minute run sheet, vendor arrival telemetry & incident triage',
    icon: Clock,
  },
  {
    role: 'FINANCE_MANAGER',
    title: 'Finance & Accounts Manager',
    email: 'finance@royalknot.com',
    subtitle: 'Milestone billing, duplicate payment protection & extra plates audit',
    icon: CreditCard,
  },
  {
    role: 'CLIENT',
    title: 'Client Portal View',
    email: 'client@royalknot.com',
    subtitle: 'Couple approval portal (Singhania & Mehra Wedding)',
    icon: Building2,
  },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, quickLogin, loading, error, clearError } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [email, setEmail] = useState('admin@royalknot.com');
  const [password, setPassword] = useState('password123');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSelectRole = (r: UserRole) => {
    setSelectedRole(r);
    clearError();
    setFieldErrors({});
    setEmail(ROLE_EMAILS[r] || '');
    setPassword('password123');
  };

  const validateForm = (): boolean => {
    if (isDemoMode) return true;

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    let success = false;
    if (isDemoMode) {
      success = await quickLogin(selectedRole);
    } else {
      success = await login(email, password);
    }

    if (success) {
      const loggedInRole = isDemoMode ? selectedRole : useAuthStore.getState().user?.role;
      if (loggedInRole === 'CLIENT') {
        navigate('/procurement');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const selectedRoleObj = DEMO_ROLES.find((r) => r.role === selectedRole);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded bg-[#714B67] text-white shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            The Royal Knot
          </h1>
          <p className="text-xs text-slate-500">
            Destination Wedding Operations Platform
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 rounded flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Card */}
        <Card className="border border-slate-200 shadow-sm rounded bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your work credentials or toggle quick demo access below
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-3">
              {/* Standard Login Inputs */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Work Email <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="planner@royalknot.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    required={!isDemoMode}
                    disabled={isDemoMode}
                    className={`text-xs h-9 disabled:opacity-50 disabled:bg-slate-50 transition-colors ${fieldErrors.email
                      ? 'border-rose-400 bg-rose-50/20 focus-visible:ring-rose-400'
                      : 'border-slate-300'
                      }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    required={!isDemoMode}
                    disabled={isDemoMode}
                    className={`text-xs h-9 disabled:opacity-50 disabled:bg-slate-50 transition-colors ${fieldErrors.password
                      ? 'border-rose-400 bg-rose-50/20 focus-visible:ring-rose-400'
                      : 'border-slate-300'
                      }`}
                  />
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Demo Mode Toggle Switch */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <Label htmlFor="demo-toggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Quick Demo Access
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Instant role preview without credentials
                  </p>
                </div>
                <button
                  type="button"
                  id="demo-toggle"
                  role="switch"
                  aria-checked={isDemoMode}
                  onClick={() => {
                    setIsDemoMode((prev) => !prev);
                    clearError();
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${isDemoMode ? 'bg-[#714B67]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isDemoMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* Role Cards Revealed when Demo Mode is Enabled */}
              {isDemoMode && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-slate-600">
                    Select Demo Persona
                  </Label>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                    {DEMO_ROLES.map((r) => {
                      const Icon = r.icon;
                      const isSelected = selectedRole === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => handleSelectRole(r.role)}
                          className={`p-2.5 rounded border text-left cursor-pointer transition flex items-start gap-2.5 ${isSelected
                            ? 'bg-purple-50/70 border-[#714B67] ring-1 ring-[#714B67]'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <div className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-700 shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {r.title}
                              </span>
                              {isSelected && (
                                <Badge variant="odoo" className="text-[9px] px-1 py-0">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {r.subtitle}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {r.email}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                • password123
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="w-full text-xs font-semibold h-9 mt-2"
              >
                {loading
                  ? 'Authenticating...'
                  : isDemoMode
                    ? `Sign In as ${selectedRoleObj?.title.split('&')[0].trim()}`
                    : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Public Website / Consultation Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/enquire')}
            className="text-xs text-slate-500 hover:text-[#714B67] hover:underline transition-colors cursor-pointer"
          >
            ← Looking for luxury destination wedding planning? Explore Public Consultation
          </button>
        </div>
      </div>
    </div>
  );
};
