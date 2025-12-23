import { hasModuleAccess } from './permissions';

/**
 * Get the first permitted route for a user based on their permissions
 * @param {Array<string>} permissions - User's permissions array
 * @param {Object} user - User object with roleName
 * @returns {string} - The first route the user has access to
 */
export const getFirstPermittedRoute = (permissions, user = null) => {
    // Handle Tenant role - always go to tenant dashboard
    if (user?.roleName === 'Tenant') {
        return '/tenant/dashboard';
    }

    // Handle Technician role - always go to technician dashboard
    if (user?.roleName === 'Technician') {
        return '/technician/dashboard';
    }

    // If user has wildcard permission (Admin), go to dashboard
    if (permissions?.includes('*')) {
        return '/dashboard';
    }

    // If user has properties permission (Staff), go to dashboard
    if (hasModuleAccess(permissions, 'properties')) {
        return '/dashboard';
    }

    // Define route priority for other modules (order matters - first match wins)
    const routeChecks = [
        { path: '/staff/invoices', module: 'invoices' },
        { path: '/staff/payments', module: 'payments' },
        { path: '/staff/expenses', module: 'expenses' },
        { path: '/staff/buildings', module: 'buildings' },
        { path: '/staff/units', module: 'units' },
        { path: '/staff/tenants', module: 'tenants' },
        { path: '/staff/leases', module: 'leases' },
        { path: '/staff/maintenance', module: 'maintenance' },
        { path: '/staff/messages', module: 'messages' },
        { path: '/staff/reports', module: 'reports' },
        { path: '/admin/lease-templates', module: 'lease_templates' },
        { path: '/admin/users', module: 'users' },
        { path: '/admin/roles', module: 'roles' },
        { path: '/admin/audit-logs', module: 'audit' },
    ];

    // Find first route user has permission for
    for (const route of routeChecks) {
        if (hasModuleAccess(permissions, route.module)) {
            return route.path;
        }
    }

    // Fallback to dashboard if no specific permission found
    return '/dashboard';
};
