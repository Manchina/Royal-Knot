import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Weddings } from '../pages/Weddings';
import { Enquiries } from '../pages/Enquiries';
import { Procurement } from '../pages/Procurement';
import { Tasks } from '../pages/Tasks';
import { DayOf } from '../pages/DayOf';
import { Billing } from '../pages/Billing';
import { SettingsPage } from '../pages/Settings';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="weddings" element={<Weddings />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="day-of" element={<DayOf />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
