import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Landing } from '../pages/Landing';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Weddings } from '../pages/Weddings';
import { WeddingDetail } from '../pages/WeddingDetail';
import { Enquiries } from '../pages/Enquiries';
import { EnquiryDetail } from '../pages/EnquiryDetail';
import { Procurement } from '../pages/Procurement';
import { VendorDetail } from '../pages/VendorDetail';
import { Tasks } from '../pages/Tasks';
import { DayOf } from '../pages/DayOf';
import { Billing } from '../pages/Billing';
import { BillingProjectDetail } from '../pages/BillingProjectDetail';
import { SettingsPage } from '../pages/Settings';
import { SignAgreement } from '../pages/SignAgreement';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing & Consultation Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/enquire" element={<Landing defaultScrollToForm={true} />} />
      <Route path="/sign/:id" element={<SignAgreement />} />

      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="weddings" element={<Weddings />} />
          <Route path="weddings/:id" element={<WeddingDetail />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="enquiries/:id" element={<EnquiryDetail />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="procurement/vendors/:id" element={<VendorDetail />} />
          <Route path="vendors/:id" element={<VendorDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="day-of" element={<DayOf />} />
          <Route path="billing" element={<Billing />} />
          <Route path="billing/:projectId" element={<BillingProjectDetail />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
