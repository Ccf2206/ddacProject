import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';
import { getFirstPermittedRoute } from './utils/routeUtils';
import { hasModuleAccess } from './utils/permissions';

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

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard';
import NotificationsPage from './pages/tenant/NotificationsPage';
import AnnouncementsPage from './pages/tenant/AnnouncementsPage';
import TenantMaintenance from './pages/tenant/TenantMaintenance';
import TenantPayments from './pages/tenant/TenantPayments';
import TenantLease from './pages/tenant/TenantLease';
import TenantProfile from './pages/tenant/TenantProfile';

// Technician Pages
import TechnicianDashboard from './pages/technician/TechnicianDashboard';

// Admin Pages
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import LeaseTemplatesPage from './pages/admin/LeaseTemplatesPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermission = null, requireModule = null }) => {
    const { isAuthenticated, user, permissions } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check permissions first (more flexible)
    if (requiredPermission) {
        if (permissions?.includes('*')) {
            return children;
        }
        if (!permissions?.includes(requiredPermission)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // Check module access
    if (requireModule) {
        if (permissions?.includes('*')) {
            return children;
        }
        if (!hasModuleAccess(permissions, requireModule)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // Fallback to role-based check
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.roleName)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// Component to handle S3 redirects
function RedirectHandler() {
    const navigate = useNavigate();

    useEffect(() => {
        const redirectPath = sessionStorage.getItem('redirectPath');
        if (redirectPath && redirectPath !== '/') {
            sessionStorage.removeItem('redirectPath');
            navigate(redirectPath, { replace: true });
        }
    }, [navigate]);

    return null;
}

function AppContent() {
    const { checkAuth, isAuthenticated, user, permissions } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            checkAuth();
        }
    }, [isAuthenticated, checkAuth]);

    const getDefaultRoute = () => {
        if (!isAuthenticated || !user) return '/login';
        return getFirstPermittedRoute(permissions, user);
    };

    return (
        <>
            <RedirectHandler />
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Redirect root to appropriate dashboard */}
                <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Staff Routes */}
                <Route
                    path="/staff/properties"
                    element={
                        <ProtectedRoute requireModule="properties">
                            <PropertiesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/units"
                    element={
                        <ProtectedRoute requireModule="units">
                            <UnitsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/leases"
                    element={
                        <ProtectedRoute requireModule="leases">
                            <LeasesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/maintenance"
                    element={
                        <ProtectedRoute requireModule="maintenance">
                            <MaintenancePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/tenants"
                    element={
                        <ProtectedRoute requireModule="tenants">
                            <TenantsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/invoices"
                    element={
                        <ProtectedRoute requireModule="invoices">
                            <InvoicesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/payments"
                    element={
                        <ProtectedRoute requireModule="payments">
                            <PaymentsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/expenses"
                    element={
                        <ProtectedRoute requireModule="expenses">
                            <ExpensesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/reports"
                    element={
                        <ProtectedRoute requireModule="reports">
                            <ReportsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/messages"
                    element={
                        <ProtectedRoute>
                            <MessagesPage />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute requireModule="users">
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/roles"
                    element={
                        <ProtectedRoute requireModule="roles">
                            <RolesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/audit-logs"
                    element={
                        <ProtectedRoute requireModule="audit">
                            <AuditLogsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/lease-templates"
                    element={
                        <ProtectedRoute requireModule="lease_templates">
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
                    path="/tenant/announcements"
                    element={
                        <ProtectedRoute allowedRoles={['Tenant']}>
                            <AnnouncementsPage />
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
                <Route
                    path="/unauthorized"
                    element={
                        <div className="min-h-screen flex items-center justify-center">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold text-gray-800 mb-4">403</h1>
                                <p className="text-gray-600">You do not have permission to access this page.</p>
                            </div>
                        </div>
                    }
                />

                {/* 404 */}
                <Route
                    path="*"
                    element={
                        <div className="min-h-screen flex items-center justify-center">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                                <p className="text-gray-600">Page not found</p>
                            </div>
                        </div>
                    }
                />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;