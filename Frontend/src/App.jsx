import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PropertiesPage from './pages/staff/PropertiesPage';
import UnitsPage from './pages/staff/UnitsPage';
import LeasesPage from './pages/staff/LeasesPage';
import MaintenancePage from './pages/staff/MaintenancePage';
import TenantsPage from './pages/staff/TenantsPage';
import InvoicesPage from './pages/staff/InvoicesPage';
import PaymentsPage from './pages/staff/PaymentsPage';
import ExpensesPage from './pages/staff/ExpensesPage';
import ReportsPage from './pages/staff/ReportsPage';
import MessagesPage from './pages/staff/MessagesPage';
import TenantDashboard from './pages/tenant/TenantDashboard';
import NotificationsPage from './pages/tenant/NotificationsPage';
import TenantMaintenance from './pages/tenant/TenantMaintenance';
import TenantPayments from './pages/tenant/TenantPayments';
import TenantLease from './pages/tenant/TenantLease';
import TenantProfile from './pages/tenant/TenantProfile';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
// Admin pages
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import LeaseTemplatesPage from './pages/admin/LeaseTemplatesPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.roleName)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  const { checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect to appropriate dashboard based on role
  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/login';

    switch (user.roleName) {
      case 'Admin':
        return '/dashboard';
      case 'Staff':
        return '/staff/properties';
      case 'Technician':
        return '/technician/dashboard';
      case 'Tenant':
        return '/tenant/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Redirect root to appropriate dashboard */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Admin & Staff Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff/properties"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <PropertiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/units"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <UnitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/leases"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <LeasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/maintenance"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <MaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/tenants"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <TenantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/invoices"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/payments"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/expenses"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/reports"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/messages"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lease-templates"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <LeaseTemplatesPage />
            </ProtectedRoute>
          }
        />

        {/* Technician Routes */}
        <Route
          path="/technician/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Technician']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />

        {/* Tenant Routes */}
        <Route
          path="/tenant/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/notifications"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/maintenance"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantMaintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/payments"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/lease"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantLease />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/profile"
          element={
            <ProtectedRoute allowedRoles={['Tenant']}>
              <TenantProfile />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-gray-800 mb-4">403</h1><p className="text-gray-600">You do not have permission to access this page.</p></div></div>} />

        {/* 404 */}
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1><p className="text-gray-600">Page not found</p></div></div>} />
      </Routes>
    </Router>
  );
}

export default App;
