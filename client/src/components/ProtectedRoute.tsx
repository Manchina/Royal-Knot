import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-[#FF385C] rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
          !
        </div>
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-neutral-500 mb-4">
          This module requires higher role authorization. Your current role is <strong>{user.role}</strong>.
        </p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return <Outlet />;
};
