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
          {/* Executive & Internal Team Dashboards */}
          <Route element={<ProtectedRoute allowedRoles={['FOUNDER', 'SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR', 'FINANCE_MANAGER']} />}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          {/* Weddings Registry */}
          <Route element={<ProtectedRoute allowedRoles={['FOUNDER', 'SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR']} />}>
            <Route path="weddings" element={<Weddings />} />
            <Route path="weddings/:id" element={<WeddingDetail />} />
          </Route>

          {/* Enquiries Pipeline */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'LEAD_PLANNER']} />}>
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="enquiries/:id" element={<EnquiryDetail />} />
          </Route>

          {/* Procurement & Vendor Sourcing (Clients access their own wedding vendors only) */}
          <Route path="procurement" element={<Procurement />} />

          {/* Internal Vendor CRM Details */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'LEAD_PLANNER']} />}>
            <Route path="procurement/vendors/:id" element={<VendorDetail />} />
            <Route path="vendors/:id" element={<VendorDetail />} />
          </Route>

          {/* Checklists & Operational Blueprint */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR']} />}>
            <Route path="tasks" element={<Tasks />} />
          </Route>

          {/* Day-Of Command Center */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COORDINATOR', 'LEAD_PLANNER']} />}>
            <Route path="day-of" element={<DayOf />} />
          </Route>

          {/* Billing & Settlement Dossier */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'FINANCE_MANAGER', 'FOUNDER']} />}>
            <Route path="billing" element={<Billing />} />
            <Route path="billing/:projectId" element={<BillingProjectDetail />} />
          </Route>

          <Route path="settings" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
