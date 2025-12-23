import { useMemo } from 'react';
import useAuthStore from '../stores/authStore';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';

/**
 * Hook for checking user permissions
 * @returns {Object} Permission checking utilities
 */
export function usePermissions() {
    const { permissions, user } = useAuthStore();

    return useMemo(() => {
        // Users with wildcard permission bypass all checks
        const hasWildcard = permissions?.includes('*');
        
        return {
            permissions,
            hasPermission: (permission) => hasWildcard || hasPermission(permissions, permission),
            hasAnyPermission: (perms) => hasWildcard || hasAnyPermission(permissions, perms),
            hasAllPermissions: (perms) => hasWildcard || hasAllPermissions(permissions, perms),
            canView: (module) => hasWildcard || hasPermission(permissions, `${module}.view`),
            canCreate: (module) => hasWildcard || hasPermission(permissions, `${module}.create`),
            canEdit: (module) => hasWildcard || hasPermission(permissions, `${module}.edit`),
            canDelete: (module) => hasWildcard || hasPermission(permissions, `${module}.delete`),
        };
    }, [permissions, user]);
}
