// Permission constants matching backend
export const PERMISSIONS = {
    // Properties
    PROPERTIES_VIEW: 'properties.view',
    PROPERTIES_CREATE: 'properties.create',
    PROPERTIES_EDIT: 'properties.edit',
    PROPERTIES_DELETE: 'properties.delete',

    // Units
    UNITS_VIEW: 'units.view',
    UNITS_CREATE: 'units.create',
    UNITS_EDIT: 'units.edit',
    UNITS_DELETE: 'units.delete',

    // Tenants
    TENANTS_VIEW: 'tenants.view',
    TENANTS_CREATE: 'tenants.create',
    TENANTS_EDIT: 'tenants.edit',
    TENANTS_DELETE: 'tenants.delete',

    // Leases
    LEASES_VIEW: 'leases.view',
    LEASES_CREATE: 'leases.create',
    LEASES_EDIT: 'leases.edit',
    LEASES_TERMINATE: 'leases.terminate',

    // Finance
    INVOICES_VIEW: 'invoices.view',
    INVOICES_CREATE: 'invoices.create',
    PAYMENTS_VIEW: 'payments.view',
    PAYMENTS_CREATE: 'payments.create',
    EXPENSES_VIEW: 'expenses.view',
    EXPENSES_CREATE: 'expenses.create',

    // Maintenance
    MAINTENANCE_VIEW_ALL: 'maintenance.view.all',
    MAINTENANCE_VIEW_ASSIGNED: 'maintenance.view.assigned',
    MAINTENANCE_ASSIGN: 'maintenance.assign',
    MAINTENANCE_UPDATE: 'maintenance.update',
    MAINTENANCE_CREATE: 'maintenance.create',
    MAINTENANCE_ESCALATE: 'maintenance.escalate',
    MAINTENANCE_SIGNOFF: 'maintenance.signoff',

    // Reports
    REPORTS_FINANCIAL_VIEW: 'reports.financial.view',
    REPORTS_OCCUPANCY_VIEW: 'reports.occupancy.view',
    REPORTS_MAINTENANCE_VIEW: 'reports.maintenance.view',

    // Approvals
    APPROVALS_REVIEW: 'approvals.review',
    APPROVALS_SUBMIT: 'approvals.submit',

    // Admin
    USERS_MANAGE: 'users.manage',
    ROLES_MANAGE: 'roles.manage',
    AUDIT_VIEW: 'audit.view',
    LEASE_TEMPLATES_MANAGE: 'lease.templates.manage',
};

/**
 * Check if user has a specific permission
 * @param {Array<string>} userPermissions - Array of user's permissions
 * @param {string} requiredPermission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }

    // Check for wildcard permission (admin has all permissions)
    if (userPermissions.includes('*')) {
        return true;
    }

    // Check for exact permission match
    if (userPermissions.includes(requiredPermission)) {
        return true;
    }

    // Check for module wildcard (e.g., "properties.*" grants all property permissions)
    const parts = requiredPermission.split('.');
    if (parts.length >= 2) {
        const moduleWildcard = `${parts[0]}.*`;
        if (userPermissions.includes(moduleWildcard)) {
            return true;
        }

        // Special case: if checking for delete, also check for terminate
        // terminate permission should work like delete permission
        const action = parts[parts.length - 1];
        if (action === 'delete') {
            const terminatePermission = [...parts.slice(0, -1), 'terminate'].join('.');
            if (userPermissions.includes(terminatePermission)) {
                return true;
            }
        } else if (action === 'terminate') {
            const deletePermission = [...parts.slice(0, -1), 'delete'].join('.');
            if (userPermissions.includes(deletePermission)) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Check if user has ANY of the specified permissions
 * @param {Array<string>} userPermissions - Array of user's permissions
 * @param {Array<string>} requiredPermissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    return requiredPermissions.some(permission => 
        hasPermission(userPermissions, permission)
    );
};

/**
 * Check if user has ALL of the specified permissions
 * @param {Array<string>} userPermissions - Array of user's permissions
 * @param {Array<string>} requiredPermissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }

    return requiredPermissions.every(permission => 
        hasPermission(userPermissions, permission)
    );
};

/**
 * Check if user has ANY permission for a specific module
 * This is used to determine if user can access a page/module
 * Having any permission (view, create, edit, delete, terminate, or wildcard) grants access
 * @param {Array<string>} userPermissions - Array of user's permissions
 * @param {string} module - The module name (e.g., 'properties', 'units')
 * @returns {boolean}
 */
export const hasModuleAccess = (userPermissions, module) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }

    // Check for wildcard permission (admin has all permissions)
    if (userPermissions.includes('*')) {
        return true;
    }

    // Check for module wildcard (e.g., "properties.*")
    if (userPermissions.includes(`${module}.*`)) {
        return true;
    }

    // Check if user has ANY permission for this module
    // Common permission patterns: view, create, edit, delete, terminate, or any custom action
    const hasAnyModulePermission = userPermissions.some(perm => 
        perm.startsWith(`${module}.`)
    );

    return hasAnyModulePermission;
};
