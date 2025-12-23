import { hasPermission, hasAnyPermission } from '../utils/permissions';
import useAuthStore from '../stores/authStore';

/**
 * Component that only renders children if user has required permission(s)
 * @param {Object} props
 * @param {string|Array<string>} props.permission - Single permission or array of permissions
 * @param {boolean} props.requireAll - If true, requires ALL permissions. If false (default), requires ANY permission
 * @param {React.ReactNode} props.children - Content to render if permission check passes
 * @param {React.ReactNode} props.fallback - Optional content to render if permission check fails
 */
function PermissionGuard({ permission, requireAll = false, children, fallback = null }) {
    const { permissions, user } = useAuthStore();

    // Users with wildcard permission bypass all permission checks
    if (permissions?.includes('*')) {
        return children;
    }

    // Handle single permission
    if (typeof permission === 'string') {
        const hasAccess = hasPermission(permissions, permission);
        return hasAccess ? children : fallback;
    }

    // Handle array of permissions
    if (Array.isArray(permission)) {
        const hasAccess = requireAll 
            ? permission.every(p => hasPermission(permissions, p))
            : hasAnyPermission(permissions, permission);
        return hasAccess ? children : fallback;
    }

    // No permission specified, allow by default
    return children;
}

export default PermissionGuard;
