import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isInitialized } = useAuthStore();
  const token = localStorage.getItem('rk_jwt_token');

  // If there is a stored token and auth is still verifying on page refresh, wait for resolution
  if (!isInitialized && token && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Restoring session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'CLIENT' ? '/procurement' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};
